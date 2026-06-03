import { useState } from 'react';
import { GeoDraftListItem } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { downloadDoc } from './geoContentUtils';

export default function DraftEditor({
  draft, onBack, onSave, onDelete, isSaving,
}: {
  draft: GeoDraftListItem & { content_md: string };
  onBack: () => void;
  onSave: (data: { title?: string; content_md?: string; status?: string; published_url?: string | null }) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content_md);
  const [status, setStatus] = useState(draft.status);
  const [publishedUrl, setPublishedUrl] = useState(draft.published_url || '');
  const wc = (content.match(/\w+/g) || []).length;

  const handleSave = () => {
    if (status === 'published' && !publishedUrl.trim()) {
      toast({
        title: 'Укажите URL публикации',
        description: 'Чтобы отметить статью как опубликованную, нужна ссылка на размещение в интернете.',
        variant: 'destructive',
      });
      return;
    }
    if (status === 'published' && publishedUrl && !/^https?:\/\//i.test(publishedUrl.trim())) {
      toast({
        title: 'Некорректный URL',
        description: 'URL должен начинаться с http:// или https://',
        variant: 'destructive',
      });
      return;
    }
    onSave({
      title,
      content_md: content,
      status,
      published_url: publishedUrl.trim() || null,
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Icon name="ArrowLeft" size={16} className="mr-1" />
          Назад
        </Button>
        <div className="flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg h-9 px-2 text-sm">
          <option value="draft">📝 Черновик</option>
          <option value="ready">✅ Готов к публикации</option>
          <option value="published">🚀 Опубликован</option>
          <option value="archived">📦 В архиве</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => downloadDoc(title, content)}>
          <Icon name="Download" size={14} className="mr-1" />
          Word (.doc)
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Icon name="Loader2" size={14} className="mr-1 animate-spin" /> : <Icon name="Save" size={14} className="mr-1" />}
          Сохранить
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Icon name="Trash2" size={16} className="text-rose-500" />
        </Button>
      </div>

      {draft.query_text && (
        <div className="text-xs text-slate-500 mb-3">
          <Icon name="Search" size={11} className="inline mr-1" />
          {draft.query_text}
        </div>
      )}

      {/* Поле URL — обязательное при статусе "опубликован" */}
      {(status === 'published' || status === 'ready') && (
        <div className={`mb-4 p-3 rounded-lg border ${
          status === 'published'
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <Label htmlFor="published_url" className="flex items-center gap-2 mb-1.5">
            <Icon name="Link2" size={14} className={status === 'published' ? 'text-indigo-600' : 'text-emerald-600'} />
            <span className="font-medium">
              {status === 'published'
                ? 'URL опубликованной статьи (обязательно)'
                : 'URL опубликованной статьи (заполните после публикации)'}
            </span>
          </Label>
          <Input
            id="published_url"
            value={publishedUrl}
            onChange={(e) => setPublishedUrl(e.target.value)}
            placeholder="https://example.com/blog/article-name"
            className="bg-white"
          />
          {status === 'published' && (
            <p className="text-[11px] text-slate-600 mt-1.5">
              💡 После сохранения статья появится в разделе «Публикации»
              и нейросети (GPT-4o, Perplexity Sonar, YandexGPT) автоматически проверят, что она действительно опубликована.
            </p>
          )}
        </div>
      )}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold border-0 px-0 h-auto py-2 mb-4 focus-visible:ring-0 shadow-none"
        placeholder="Заголовок"
      />

      <div className="text-xs text-slate-400 mb-2">{wc} слов · Markdown</div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[600px] font-mono text-sm leading-relaxed"
      />
    </div>
  );
}
