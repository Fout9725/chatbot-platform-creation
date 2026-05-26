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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { geoApi, GeoQuery } from '@/lib/geo/api';

interface ImportArticleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  queries: GeoQuery[];
  onCreated?: (draftId: string) => void;
}

const ACCEPTED = '.txt,.md,.markdown,.html,.htm,.doc,.docx,.pdf,text/plain,text/markdown,text/html,application/pdf';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

async function extractPdfText(file: File): Promise<string> {
  // Динамический импорт чтобы не утяжелять основной бандл
  const pdfjs = await import('pdfjs-dist');
  // Локально подключаем worker как ESM-модуль (CDN не требуется)
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = (pdfjsWorker as { default: string }).default;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: unknown) => (it as { str?: string }).str || '')
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (pageText) parts.push(pageText);
  }
  // Пытаемся восстановить абзацы: если в строке есть точка/перевод — отделяем
  return parts
    .join('\n\n')
    .replace(/([.!?])\s+(?=[А-ЯA-Z])/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToMarkdown(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('script,style,nav,header,footer,noscript').forEach((n) => n.remove());

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\s+/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join('');
    switch (tag) {
      case 'h1': return `\n\n# ${inner.trim()}\n\n`;
      case 'h2': return `\n\n## ${inner.trim()}\n\n`;
      case 'h3': return `\n\n### ${inner.trim()}\n\n`;
      case 'h4': return `\n\n#### ${inner.trim()}\n\n`;
      case 'h5':
      case 'h6': return `\n\n##### ${inner.trim()}\n\n`;
      case 'p':
      case 'div':
      case 'section':
      case 'article': return `\n\n${inner.trim()}\n\n`;
      case 'br': return '\n';
      case 'strong':
      case 'b': return `**${inner}**`;
      case 'em':
      case 'i': return `*${inner}*`;
      case 'code': return `\`${inner}\``;
      case 'pre': return `\n\n\`\`\`\n${inner}\n\`\`\`\n\n`;
      case 'a': {
        const href = el.getAttribute('href') || '';
        return href ? `[${inner}](${href})` : inner;
      }
      case 'li': return `- ${inner.trim()}\n`;
      case 'ul':
      case 'ol': return `\n${inner}\n`;
      case 'blockquote': return `\n> ${inner.trim()}\n`;
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return src ? `![${alt}](${src})` : '';
      }
      default: return inner;
    }
  };

  return walk(tmp).replace(/\n{3,}/g, '\n\n').trim();
}

async function readFileAsMarkdown(file: File): Promise<{ title: string; content: string }> {
  const name = file.name;
  const baseTitle = name.replace(/\.(txt|md|markdown|html?|docx?|pdf)$/i, '').replace(/[-_]+/g, ' ').trim();
  const ext = (name.split('.').pop() || '').toLowerCase();

  if (ext === 'md' || ext === 'markdown' || ext === 'txt' || file.type === 'text/markdown' || file.type === 'text/plain') {
    const txt = await file.text();
    const firstHeading = txt.match(/^#\s+(.+)$/m);
    return { title: firstHeading ? firstHeading[1].trim() : baseTitle, content: txt };
  }

  if (ext === 'html' || ext === 'htm' || file.type === 'text/html') {
    const txt = await file.text();
    const titleMatch = txt.match(/<title[^>]*>([^<]*)<\/title>/i);
    return { title: (titleMatch?.[1] || baseTitle).trim(), content: htmlToMarkdown(txt) };
  }

  if (ext === 'pdf' || file.type === 'application/pdf') {
    try {
      const text = await extractPdfText(file);
      if (!text || text.length < 30) {
        throw new Error('PDF не содержит распознаваемого текста (возможно, это отсканированный документ — нужен OCR).');
      }
      return { title: baseTitle, content: text };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Не удалось извлечь текст из PDF. ${msg}`);
    }
  }

  if (ext === 'docx') {
    try {
      const buf = await file.arrayBuffer();
      const text = await extractDocxText(buf);
      return { title: baseTitle, content: text };
    } catch (e) {
      throw new Error('Не удалось распарсить .docx. Попробуйте сохранить как .txt или .md');
    }
  }

  if (ext === 'doc') {
    const txt = await file.text().catch(() => '');
    const cleaned = txt.replace(/[^\x20-\x7Eа-яёА-ЯЁ\n\r\t.,!?:;()«»\-—–"'/]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (cleaned.length < 50) {
      throw new Error('Старый .doc плохо парсится в браузере. Сохраните файл как .docx, .md или .txt');
    }
    return { title: baseTitle, content: cleaned };
  }

  // fallback
  const txt = await file.text();
  return { title: baseTitle, content: txt };
}

async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  // .docx — это ZIP. Достанем word/document.xml без внешних зависимостей
  const bytes = new Uint8Array(buf);
  const decoder = new TextDecoder('utf-8');
  const view = new DataView(buf);

  // Поиск central directory: проще пробежаться по локальным заголовкам PK\x03\x04
  const SIG = [0x50, 0x4b, 0x03, 0x04];
  let xmlText = '';
  for (let i = 0; i < bytes.length - 30; i++) {
    if (bytes[i] === SIG[0] && bytes[i + 1] === SIG[1] && bytes[i + 2] === SIG[2] && bytes[i + 3] === SIG[3]) {
      const compressionMethod = view.getUint16(i + 8, true);
      const compressedSize = view.getUint32(i + 18, true);
      const fileNameLen = view.getUint16(i + 26, true);
      const extraLen = view.getUint16(i + 28, true);
      const nameStart = i + 30;
      const name = decoder.decode(bytes.subarray(nameStart, nameStart + fileNameLen));
      const dataStart = nameStart + fileNameLen + extraLen;
      if (name === 'word/document.xml') {
        const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
        if (compressionMethod === 0) {
          xmlText = decoder.decode(compressed);
        } else if (compressionMethod === 8) {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([compressed]).stream().pipeThrough(ds);
          const arr = await new Response(stream).arrayBuffer();
          xmlText = decoder.decode(arr);
        }
        break;
      }
    }
  }

  if (!xmlText) throw new Error('document.xml not found in docx');

  // Преобразуем XML в markdown
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const paras = Array.from(xml.getElementsByTagName('w:p'));
  const lines: string[] = [];
  for (const p of paras) {
    const styleEl = p.getElementsByTagName('w:pStyle')[0];
    const style = styleEl?.getAttribute('w:val') || '';
    const runs = Array.from(p.getElementsByTagName('w:t'));
    const text = runs.map((r) => r.textContent || '').join('').trim();
    if (!text) {
      lines.push('');
      continue;
    }
    if (/^Heading1$/i.test(style)) lines.push(`# ${text}`);
    else if (/^Heading2$/i.test(style)) lines.push(`## ${text}`);
    else if (/^Heading3$/i.test(style)) lines.push(`### ${text}`);
    else if (/^Heading[4-6]$/i.test(style)) lines.push(`#### ${text}`);
    else if (/ListParagraph/i.test(style)) lines.push(`- ${text}`);
    else lines.push(text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'paste' | 'file')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="paste">
                <Icon name="ClipboardPaste" size={14} className="mr-1.5" />
                Вставить текст
              </TabsTrigger>
              <TabsTrigger value="file">
                <Icon name="FileUp" size={14} className="mr-1.5" />
                Загрузить файл
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 mt-4">
              <div>
                <Label htmlFor="imp-content">Текст статьи (Markdown или обычный текст)</Label>
                <Textarea
                  id="imp-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Заголовок&#10;&#10;Текст статьи..."
                  className="min-h-[260px] font-mono text-sm"
                />
                <div className="text-xs text-slate-400 mt-1">{wc} слов</div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-3 mt-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="FileUp" size={36} className="text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-medium">
                  {pickedFileName ? pickedFileName : 'Нажмите, чтобы выбрать файл'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  TXT · Markdown · HTML · DOCX · PDF (до 10 МБ)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
              {parsing && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Icon name="Loader2" size={12} className="animate-spin" />
                  Разбираю файл…
                </div>
              )}
              {content && pickedFileName && (
                <div className="text-xs text-slate-500">
                  Извлечено: <b>{wc}</b> слов · {content.length.toLocaleString('ru-RU')} символов
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div>
            <Label htmlFor="imp-title">Заголовок</Label>
            <Input
              id="imp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Как мы внедрили CRM за 2 недели"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="imp-query">Связать с GEO-запросом (необязательно)</Label>
              <select
                id="imp-query"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                className="w-full border rounded-lg h-10 px-3 text-sm bg-white"
              >
                <option value="">— не связывать —</option>
                {queries.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.text.slice(0, 80)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="imp-status">Статус</Label>
              <select
                id="imp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'ready' | 'published')}
                className="w-full border rounded-lg h-10 px-3 text-sm bg-white"
              >
                <option value="draft">📝 Черновик</option>
                <option value="ready">✅ Готов к публикации</option>
                <option value="published">🚀 Опубликован</option>
              </select>
            </div>
          </div>

          {(status === 'published' || status === 'ready') && (
            <div className={`p-3 rounded-lg border ${
              status === 'published'
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <Label htmlFor="imp-url" className="flex items-center gap-2 mb-1.5">
                <Icon name="Link2" size={14} className={status === 'published' ? 'text-indigo-600' : 'text-emerald-600'} />
                <span className="font-medium">
                  {status === 'published'
                    ? 'URL опубликованной статьи (обязательно)'
                    : 'URL опубликованной статьи (если уже есть)'}
                </span>
              </Label>
              <Input
                id="imp-url"
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
                placeholder="https://example.com/blog/article-name"
                className="bg-white"
              />
              {status === 'published' && (
                <p className="text-[11px] text-slate-600 mt-1.5">
                  💡 После сохранения статья появится в разделе «Публикации» и нейросети (GPT-4o, Perplexity Sonar, YandexGPT) автоматически проверят, что она действительно опубликована.
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="imp-keywords">Ключевые слова (через запятую)</Label>
            <Input
              id="imp-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="crm, автоматизация, интеграция"
            />
          </div>

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