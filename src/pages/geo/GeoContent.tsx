import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoDraftListItem } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Черновик', cls: 'bg-slate-100 text-slate-700' },
  ready: { label: 'Готов', cls: 'bg-emerald-100 text-emerald-700' },
  published: { label: 'Опубликован', cls: 'bg-indigo-100 text-indigo-700' },
  archived: { label: 'В архиве', cls: 'bg-amber-100 text-amber-700' },
};

function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeLists(); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeLists(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return out.join('\n');
}

function downloadDoc(filename: string, mdContent: string) {
  const safeTitle = filename.replace(/[^\w\sа-яё-]/gi, '').slice(0, 60) || 'document';
  const bodyHtml = mdToHtml(mdContent);
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${safeTitle}</title>
<style>body{font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;}h1{font-size:20pt;}h2{font-size:16pt;}h3{font-size:13pt;}code{font-family:'Consolas',monospace;background:#f4f4f4;padding:1px 4px;}</style>
</head><body><h1>${safeTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1>${bodyHtml}</body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function GeoContent() {
  const qc = useQueryClient();
  const [genOpen, setGenOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const draftsQ = useQuery({
    queryKey: ['geo-drafts'],
    queryFn: () => geoApi.content.list(),
  });

  const coverageQ = useQuery({
    queryKey: ['geo-coverage', 7],
    queryFn: () => geoApi.analytics.coverage(7),
  });

  const queriesQ = useQuery({
    queryKey: ['geo-queries'],
    queryFn: () => geoApi.queries.list(),
  });

  const draftQ = useQuery({
    queryKey: ['geo-draft', editId],
    queryFn: () => geoApi.content.get(editId!),
    enabled: !!editId,
  });

  const generateMut = useMutation({
    mutationFn: geoApi.content.generate,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setGenOpen(false);
      setEditId(r.draft.id);
      toast({ title: 'Черновик готов', description: `${r.draft.word_count} слов` });
    },
    onError: (e: Error) => toast({ title: 'Ошибка генерации', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content_md?: string; status?: string }) =>
      geoApi.content.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      qc.invalidateQueries({ queryKey: ['geo-draft'] });
      toast({ title: 'Сохранено' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.content.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setEditId(null);
      toast({ title: 'Черновик удалён' });
    },
  });

  const onGenerate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const queryId = String(fd.get('query_id') || '');
    const topic = String(fd.get('topic') || '').trim();
    if (!queryId && !topic) {
      toast({ title: 'Выберите запрос или укажите тему', variant: 'destructive' });
      return;
    }
    generateMut.mutate({
      query_id: queryId || undefined,
      topic: topic || undefined,
      tone: String(fd.get('tone') || 'expert'),
      length: String(fd.get('length') || 'medium'),
    });
  };

  const drafts = draftsQ.data?.drafts || [];
  const lowCoverage = (coverageQ.data?.coverage || []).filter((c) => c.own_mentions === 0 && c.responses > 0);

  if (editId && draftQ.data) {
    return <DraftEditor
      draft={draftQ.data.draft}
      onBack={() => setEditId(null)}
      onSave={(data) => updateMut.mutate({ id: editId, ...data })}
      onDelete={() => {
        if (confirm('Удалить черновик?')) deleteMut.mutate(editId);
      }}
      isSaving={updateMut.isPending}
    />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Контент</h1>
          <p className="text-slate-500 mt-1">Черновики статей под GEO-запросы. Markdown, готов к публикации.</p>
        </div>
        <Button onClick={() => setGenOpen(true)}>
          <Icon name="Sparkles" size={16} className="mr-2" />
          Сгенерировать статью
        </Button>
      </div>

      {lowCoverage.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Icon name="Lightbulb" size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Запросы без вашего бренда</h3>
              <p className="text-sm text-amber-800">Сгенерируйте статью, чтобы войти в эти ответы LLM.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCoverage.slice(0, 6).map((c) => (
              <button
                key={c.query_id}
                onClick={() =>
                  generateMut.mutate({ query_id: c.query_id, tone: 'expert', length: 'medium' })
                }
                disabled={generateMut.isPending}
                className="text-xs bg-white border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-50 text-left max-w-md truncate"
                title={c.text}
              >
                <Icon name="Wand2" size={12} className="inline mr-1" />
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {draftsQ.isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : drafts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Icon name="FileText" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Пока нет черновиков. Сгенерируйте первую статью.</p>
          <Button onClick={() => setGenOpen(true)}>
            <Icon name="Sparkles" size={16} className="mr-2" />
            Сгенерировать
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((d) => (
            <DraftCard
              key={d.id}
              d={d}
              onOpen={() => setEditId(d.id)}
              onExport={async () => {
                const r = await geoApi.content.get(d.id);
                downloadDoc(d.title, r.draft.content_md);
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сгенерировать статью</DialogTitle>
          </DialogHeader>
          <form onSubmit={onGenerate} className="space-y-4">
            <div>
              <Label htmlFor="query_id">Из существующего запроса</Label>
              <select id="query_id" name="query_id" className="w-full border rounded-lg h-10 px-3 text-sm">
                <option value="">— не выбрано —</option>
                {(queriesQ.data?.queries || []).map((q) => (
                  <option key={q.id} value={q.id}>{q.text.slice(0, 80)}</option>
                ))}
              </select>
            </div>
            <div className="text-center text-xs text-slate-400">или</div>
            <div>
              <Label htmlFor="topic">Своя тема</Label>
              <Input id="topic" name="topic" placeholder="Например: лучшие CRM для малого бизнеса 2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tone">Тон</Label>
                <select id="tone" name="tone" defaultValue="expert" className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="expert">Экспертный</option>
                  <option value="friendly">Дружелюбный</option>
                  <option value="sales">Продающий</option>
                </select>
              </div>
              <div>
                <Label htmlFor="length">Объём</Label>
                <select id="length" name="length" defaultValue="medium" className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="short">~400 слов</option>
                  <option value="medium">~800 слов</option>
                  <option value="long">~1500 слов</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={generateMut.isPending}>
                {generateMut.isPending ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Генерация…
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Создать
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraftCard({ d, onOpen, onExport }: { d: GeoDraftListItem; onOpen: () => void; onExport: () => void }) {
  const s = STATUS_LABEL[d.status] || STATUS_LABEL.draft;
  return (
    <div className="bg-white border rounded-2xl p-5 hover:shadow-md transition flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
        <span className="text-xs text-slate-400">{d.word_count} слов</span>
      </div>
      <h3 className="font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-indigo-600" onClick={onOpen}>
        {d.title}
      </h3>
      {d.query_text && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">
          <Icon name="Search" size={11} className="inline mr-1" />
          {d.query_text}
        </p>
      )}
      <div className="text-xs text-slate-400 mb-3">{formatDate(d.updated_at)}</div>
      <div className="flex gap-2 mt-auto">
        <Button size="sm" variant="outline" className="flex-1" onClick={onOpen}>
          <Icon name="Pencil" size={14} className="mr-1" />
          Открыть
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
          <Icon name="Download" size={14} />
        </Button>
      </div>
    </div>
  );
}

function DraftEditor({
  draft, onBack, onSave, onDelete, isSaving,
}: {
  draft: { id: string; title: string; content_md: string; status: string; word_count: number; query_text: string | null };
  onBack: () => void;
  onSave: (data: { title?: string; content_md?: string; status?: string }) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content_md);
  const [status, setStatus] = useState(draft.status);
  const wc = (content.match(/\w+/g) || []).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Icon name="ArrowLeft" size={16} className="mr-1" />
          Назад
        </Button>
        <div className="flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg h-9 px-2 text-sm">
          <option value="draft">Черновик</option>
          <option value="ready">Готов</option>
          <option value="published">Опубликован</option>
          <option value="archived">В архиве</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => downloadDoc(title, content)}>
          <Icon name="Download" size={14} className="mr-1" />
          Word (.doc)
        </Button>
        <Button size="sm" onClick={() => onSave({ title, content_md: content, status })} disabled={isSaving}>
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