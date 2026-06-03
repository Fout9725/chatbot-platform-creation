import { useRef, useState, FormEvent, ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { geoApi, GeoQuery } from '@/lib/geo/api';
import { MAX_FILE_BYTES, readFileAsMarkdown } from './importArticleParsers';
import ImportArticleContentTab from './ImportArticleContentTab';
import ImportArticleMetaFields from './ImportArticleMetaFields';

interface ImportArticleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  queries: GeoQuery[];
  onCreated?: (draftId: string) => void;
}

export default function ImportArticleDialog({
  open,
  onOpenChange,
  queries,
  onCreated,
}: ImportArticleDialogProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'paste' | 'file'>('paste');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [queryId, setQueryId] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'ready' | 'published'>('ready');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string>('');
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setKeywords('');
    setQueryId('');
    setStatus('ready');
    setPublishedUrl('');
    setPickedFileName('');
    setTab('paste');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importMut = useMutation({
    mutationFn: async () => {
      const trimmedTitle = title.trim() || 'Без названия';
      const trimmedContent = content.trim();
      if (!trimmedContent) throw new Error('Контент пуст');
      if (status === 'published' && !publishedUrl.trim()) {
        throw new Error('Для статуса «Опубликован» обязательно укажите URL публикации');
      }
      if (publishedUrl.trim() && !/^https?:\/\//i.test(publishedUrl.trim())) {
        throw new Error('URL должен начинаться с http:// или https://');
      }
      const kw = keywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await geoApi.content.create({
        title: trimmedTitle,
        content_md: trimmedContent,
        query_id: queryId || null,
        target_keywords: kw,
        status,
        published_url: publishedUrl.trim() || null,
      });
      // Если статья сразу опубликована — синхронизация в публикации произошла на бэке, запускаем проверку
      const pubId = (created.draft as { publication_id?: string | null }).publication_id;
      if (pubId) {
        geoApi.publications.check(pubId).catch(() => { /* не критично */ });
      }
      return { draftId: created.draft.id, pubId };
    },
    onSuccess: ({ draftId, pubId }) => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      toast({
        title: pubId ? 'Статья добавлена и опубликована' : 'Статья добавлена',
        description: pubId
          ? 'Запустил проверку через 3 нейросети (GPT-4o, Perplexity Sonar, YandexGPT) в разделе «Публикации».'
          : 'Импорт выполнен успешно',
      });
      onCreated?.(draftId);
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ title: 'Ошибка импорта', description: e.message, variant: 'destructive' }),
  });

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: 'Файл слишком большой', description: 'Максимум 10 МБ', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setPickedFileName(f.name);
    setParsing(true);
    try {
      const parsed = await readFileAsMarkdown(f);
      if (!title) setTitle(parsed.title);
      setContent(parsed.content);
      toast({
        title: 'Файл загружен',
        description: `${parsed.content.length.toLocaleString('ru-RU')} символов`,
      });
    } catch (err) {
      toast({
        title: 'Ошибка чтения файла',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    importMut.mutate();
  };

  const wc = (content.match(/\w+/g) || []).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Upload" size={20} />
            Прикрепить свою статью
          </DialogTitle>
          <DialogDescription>
            Загрузите готовый текст из файла или вставьте вручную. Поддерживаются форматы: TXT, Markdown, HTML, DOCX, PDF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <ImportArticleContentTab
            tab={tab}
            setTab={setTab}
            content={content}
            setContent={setContent}
            wc={wc}
            fileInputRef={fileInputRef}
            pickedFileName={pickedFileName}
            parsing={parsing}
            onFileChange={onFileChange}
          />

          <ImportArticleMetaFields
            title={title}
            setTitle={setTitle}
            queries={queries}
            queryId={queryId}
            setQueryId={setQueryId}
            status={status}
            setStatus={setStatus}
            publishedUrl={publishedUrl}
            setPublishedUrl={setPublishedUrl}
            keywords={keywords}
            setKeywords={setKeywords}
          />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={importMut.isPending || parsing || !content.trim()}>
              {importMut.isPending ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение…
                </>
              ) : (
                <>
                  <Icon name="Upload" size={16} className="mr-2" />
                  Прикрепить статью
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
