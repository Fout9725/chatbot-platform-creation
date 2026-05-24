import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { GeoPublication, GeoDraftListItem, GeoQuery } from '@/lib/geo/api';
import { PROVIDER_HINT, PROVIDER_LABEL, formatDate } from './publicationsHelpers';

interface PublicationDialogsProps {
  // Edit/Create dialog
  open: boolean;
  editing: GeoPublication | null;
  onClose: () => void;
  urls: string[];
  setUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  drafts: GeoDraftListItem[];
  queries: GeoQuery[];

  // History dialog
  historyFor: GeoPublication | null;
  onCloseHistory: () => void;
  historyLoading: boolean;
  historyChecks?: Array<{
    id: string;
    provider: string;
    found: boolean;
    snippet: string | null;
    checked_at: string;
  }>;
}

export default function PublicationDialogs({
  open,
  editing,
  onClose,
  urls,
  setUrls,
  onSubmit,
  isPending,
  drafts,
  queries,
  historyFor,
  onCloseHistory,
  historyLoading,
  historyChecks,
}: PublicationDialogsProps) {
  return (
    <>
      <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) onClose(); }}>
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
              <Label>Ссылки на публикацию</Label>
              <p className="text-xs text-slate-500 mb-2">Добавьте все площадки, где размещена статья — каждая ссылка проверяется в LLM</p>
              <div className="space-y-2">
                {urls.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="url"
                      value={u}
                      onChange={(e) => setUrls((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                      placeholder={i === 0 ? 'https://vc.ru/...' : 'https://habr.com/...'}
                    />
                    {urls.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <Icon name="X" size={16} className="text-slate-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setUrls((prev) => [...prev, ''])}
              >
                <Icon name="Plus" size={14} className="mr-1" />
                Ещё ссылка
              </Button>
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
                    {queries.map((q) => (
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
                  {drafts.map((d) => (
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
              <Button type="submit" disabled={isPending}>
                {editing ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(v) => { if (!v) onCloseHistory(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История проверок</DialogTitle>
          </DialogHeader>
          {historyFor && (
            <div className="text-sm text-slate-500 mb-2 truncate">{historyFor.title}</div>
          )}
          {historyLoading ? (
            <div className="text-slate-400 text-sm">Загрузка…</div>
          ) : !historyChecks?.length ? (
            <div className="text-slate-400 text-sm py-4 text-center">Проверок ещё не было.</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyChecks.map((c) => (
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
                  {PROVIDER_HINT[c.provider] && (
                    <div className="text-[11px] text-slate-500 mb-1">{PROVIDER_HINT[c.provider]}</div>
                  )}
                  {c.snippet && <div className="text-xs text-slate-700">{c.snippet}</div>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
