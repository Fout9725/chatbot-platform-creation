import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoQuery } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function GeoQueries() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['geo-queries'],
    queryFn: () => geoApi.queries.list(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeoQuery | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: geoApi.queries.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geo-queries'] }); setOpen(false); toast({ title: 'Запрос добавлен' }); },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; text?: string; language?: string; is_active?: boolean }) =>
      geoApi.queries.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geo-queries'] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.queries.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geo-queries'] }); toast({ title: 'Удалено' }); },
  });

  const pollMut = useMutation({
    mutationFn: (id: string) => geoApi.poll(id),
    onMutate: (id) => setPollingId(id),
    onSettled: () => setPollingId(null),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-queries'] });
      toast({
        title: 'Опрос завершён',
        description: `Ответов: ${r.responses}, упоминаний: ${r.mentions}`,
      });
    },
    onError: (e: Error) => toast({ title: 'Ошибка опроса', description: e.message, variant: 'destructive' }),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get('text') || '').trim();
    const language = String(fd.get('language') || 'ru');
    if (!text) return;
    if (editing) updateMut.mutate({ id: editing.id, text, language });
    else createMut.mutate({ text, language });
  };

  const queries = data?.queries || [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Запросы</h1>
          <p className="text-slate-500 mt-1">Что ваши клиенты спрашивают у нейросетей</p>
        </div>
        <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить запрос
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Редактировать запрос' : 'Новый запрос'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="text">Текст запроса</Label>
                <Textarea id="text" name="text" defaultValue={editing?.text || ''} required rows={3}
                  placeholder="Например: лучший CRM для малого бизнеса в России 2025" />
              </div>
              <div>
                <Label htmlFor="language">Язык</Label>
                <select id="language" name="language" defaultValue={editing?.language || 'ru'}
                        className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Сохранить' : 'Добавить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : queries.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Icon name="Search" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Пока нет запросов. Добавьте 5–10 формулировок, которые могут вводить ваши клиенты.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl divide-y">
          {queries.map((q) => (
            <div key={q.id} className="p-4 flex items-start gap-4">
              <Switch
                checked={q.is_active}
                onCheckedChange={(v) => updateMut.mutate({ id: q.id, is_active: v })}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 break-words">{q.text}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="uppercase">{q.language}</span>
                  <span>·</span>
                  <span>Ответов: {q.responses_count}</span>
                  <span>·</span>
                  <span>Опрошен: {formatDate(q.last_polled)}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pollingId === q.id}
                onClick={() => pollMut.mutate(q.id)}
              >
                {pollingId === q.id ? (
                  <>
                    <Icon name="Loader2" size={14} className="mr-2 animate-spin" />
                    Опрос…
                  </>
                ) : (
                  <>
                    <Icon name="Zap" size={14} className="mr-2" />
                    Опросить
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(q)}>
                <Icon name="Pencil" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Удалить запрос?')) deleteMut.mutate(q.id);
                }}
              >
                <Icon name="Trash2" size={16} className="text-rose-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
