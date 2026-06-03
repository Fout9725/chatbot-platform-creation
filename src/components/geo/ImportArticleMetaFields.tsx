import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { GeoQuery } from '@/lib/geo/api';

interface ImportArticleMetaFieldsProps {
  title: string;
  setTitle: (v: string) => void;
  queries: GeoQuery[];
  queryId: string;
  setQueryId: (v: string) => void;
  status: 'draft' | 'ready' | 'published';
  setStatus: (v: 'draft' | 'ready' | 'published') => void;
  publishedUrl: string;
  setPublishedUrl: (v: string) => void;
  keywords: string;
  setKeywords: (v: string) => void;
}

export default function ImportArticleMetaFields({
  title,
  setTitle,
  queries,
  queryId,
  setQueryId,
  status,
  setStatus,
  publishedUrl,
  setPublishedUrl,
  keywords,
  setKeywords,
}: ImportArticleMetaFieldsProps) {
  return (
    <>
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
    </>
  );
}
