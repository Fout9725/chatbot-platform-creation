import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoPublication } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  live: { label: 'Опубликовано', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Ожидает', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'В архиве', cls: 'bg-slate-100 text-slate-600' },
  removed: { label: 'Снято', cls: 'bg-rose-100 text-rose-700' },
};

const PROVIDER_LABEL: Record<string, string> = {
  openai_search: 'ChatGPT Search',
  perplexity: 'Perplexity',
};

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(s: string | null) {
  if (!s) return null;
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

export default function GeoPublications() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeoPublication | null>(null);
  const [historyFor, setHistoryFor] = useState<GeoPublication | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const pubsQ = useQuery({ queryKey: ['geo-publications'], queryFn: () => geoApi.publications.list() });
  const draftsQ = useQuery({ queryKey: ['geo-drafts'], queryFn: () => geoApi.content.list() });
  const queriesQ = useQuery({ queryKey: ['geo-queries'], queryFn: () => geoApi.queries.list() });

  const historyQ = useQuery({
    queryKey: ['geo-pub-history', historyFor?.id],
    queryFn: () => geoApi.publications.history(historyFor!.id),
    enabled: !!historyFor,
  });

  const createMut = useMutation({
    mutationFn: geoApi.publications.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setOpen(false);
      toast({ title: 'Публикация добавлена' });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; url?: string; status?: string; notes?: string }) =>
      geoApi.publications.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      setEditing(null);
      toast({ title: 'Сохранено' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.publications.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      toast({ title: 'Удалено' });
    },
  });

  const checkMut = useMutation({
    mutationFn: (id: string) => geoApi.publications.check(id),
    onMutate: (id) => setCheckingId(id),
    onSettled: () => setCheckingId(null),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      qc.invalidateQueries({ queryKey: ['geo-pub-history'] });
      toast({
        title: r.found ? 'Публикация в LLM' : 'Пока не нашли',
        description: r.found
          ? 'Один из движков сослался на ваш материал'
          : 'Подождите 1-3 недели и проверьте снова',
      });
    },
    onError: (e: Error) => toast({ title: 'Ошибка проверки', description: e.message, variant: 'destructive' }),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    const url = String(fd.get('url') || '').trim();
    const draft_id = String(fd.get('draft_id') || '') || undefined;
    const query_id = String(fd.get('query_id') || '') || undefined;
    const platform = String(fd.get('platform') || '').trim() || undefined;
    const notes = String(fd.get('notes') || '').trim() || undefined;
    if (!title || !url) {
      toast({ title: 'Заполните название и URL', variant: 'destructive' });
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, title, url, platform, notes });
    } else {
      createMut.mutate({ title, url, draft_id, query_id, platform, notes });
    }
  };

  const pubs = pubsQ.data?.publications || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Публикации</h1>
          <p className="text-slate-500 mt-1">Опубликованные материалы и проверка попадания в LLM-ответы</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить публикацию
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Всего" value={pubs.length} icon="FileText" color="bg-indigo-100 text-indigo-600" />
        <StatBox
          label="Опубликовано"
          value={pubs.filter((p) => p.status === 'live').length}
          icon="CheckCircle"
          color="bg-emerald-100 text-emerald-600"
        />
        <StatBox
          label="В LLM"
          value={pubs.filter((p) => p.last_check_found).length}
          icon="Sparkles"
          color="bg-purple-100 text-purple-600"
        />
        <StatBox
          label="Не проверено"
          value={pubs.filter((p) => !p.last_check_at).length}
          icon="CircleDashed"
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {pubsQ.isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : pubs.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Icon name="Send" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Пока нет публикаций. Добавьте опубликованные материалы — отследим попадание в LLM.</p>
          <Button onClick={() => setOpen(true)}>
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl divide-y">
          {pubs.map((p) => {
            const s = STATUS_LABEL[p.status] || STATUS_LABEL.live;
            return (
              <div key={p.id} className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon name="Link" size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                       className="font-medium text-slate-900 hover:text-indigo-600 truncate">
                      {p.title}
                    </a>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    {p.last_check_found === true && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Icon name="Sparkles" size={11} />
                        В LLM
                      </span>
                    )}
                    {p.last_check_found === false && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Не нашли
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{p.url}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {p.platform && <span><Icon name="Globe" size={11} className="inline mr-1" />{p.platform}</span>}
                    {p.query_text && <span className="truncate"><Icon name="Search" size={11} className="inline mr-1" />{p.query_text}</span>}
                    {p.last_check_at && <span>Проверено: {timeAgo(p.last_check_at)}</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={checkingId === p.id}
                  onClick={() => checkMut.mutate(p.id)}
                >
                  {checkingId === p.id ? (
                    <><Icon name="Loader2" size={14} className="mr-1 animate-spin" />Проверка…</>
                  ) : (
                    <><Icon name="ScanSearch" size={14} className="mr-1" />Проверить</>
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setHistoryFor(p)}>
                  <Icon name="History" size={16} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                  <Icon name="Pencil" size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { if (confirm('Удалить публикацию?')) deleteMut.mutate(p.id); }}
                >
                  <Icon name="Trash2" size={16} className="text-rose-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать' : 'Новая публикация'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" required defaultValue={editing?.title || ''} placeholder="Заголовок статьи" />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" required type="url" defaultValue={editing?.url || ''} placeholder="https://example.com/article" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="platform">Платформа</Label>
                <Input id="platform" name="platform" defaultValue={editing?.platform || ''} placeholder="VC.ru, Habr…" />
              </div>
              {!editing && (
                <div>
                  <Label htmlFor="query_id">Под запрос</Label>
                  <select id="query_id" name="query_id" className="w-full border rounded-lg h-10 px-3 text-sm">
                    <option value="">— без запроса —</option>
                    {(queriesQ.data?.queries || []).map((q) => (
                      <option key={q.id} value={q.id}>{q.text.slice(0, 60)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {!editing && (
              <div>
                <Label htmlFor="draft_id">Из черновика</Label>
                <select id="draft_id" name="draft_id" className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="">— не выбрано —</option>
                  {(draftsQ.data?.drafts || []).map((d) => (
                    <option key={d.id} value={d.id}>{d.title.slice(0, 60)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Заметки</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes || ''} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(v) => { if (!v) setHistoryFor(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История проверок</DialogTitle>
          </DialogHeader>
          {historyFor && (
            <div className="text-sm text-slate-500 mb-2 truncate">{historyFor.title}</div>
          )}
          {historyQ.isLoading ? (
            <div className="text-slate-400 text-sm">Загрузка…</div>
          ) : !historyQ.data?.checks?.length ? (
            <div className="text-slate-400 text-sm py-4 text-center">Проверок ещё не было.</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyQ.data.checks.map((c) => (
                <div key={c.id} className={`border rounded-lg p-3 ${c.found ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={c.found ? 'CheckCircle2' : 'XCircle'}
                        size={14}
                        className={c.found ? 'text-emerald-600' : 'text-slate-400'}
                      />
                      <span className="font-medium">{PROVIDER_LABEL[c.provider] || c.provider}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(c.checked_at)}</span>
                  </div>
                  {c.snippet && <div className="text-xs text-slate-600 italic line-clamp-3">«{c.snippet}»</div>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
