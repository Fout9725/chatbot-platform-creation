import { useState, useMemo, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoQuery, GeoQueryCategory, GeoQueryIntent } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import QuerySuggestDialog from './queries/QuerySuggestDialog';
import QueryBulkImportDialog from './queries/QueryBulkImportDialog';
import CompetitorGapsDialog from './queries/CompetitorGapsDialog';
import QueryRow from './queries/QueryRow';
import { CATEGORY_META } from './queries/queriesHelpers';

type SortKey = 'newest' | 'sov_low' | 'sov_high' | 'losing';

export default function GeoQueries() {
  const qc = useQueryClient();
  const [days] = useState(14);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeoQuery | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [gapsOpen, setGapsOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<GeoQueryCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  const { data, isLoading } = useQuery({
    queryKey: ['geo-queries', days],
    queryFn: () => geoApi.queries.list(days),
  });

  const createMut = useMutation({
    mutationFn: geoApi.queries.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geo-queries'] }); setOpen(false); toast({ title: 'Запрос добавлен' }); },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{ text: string; language: string; is_active: boolean; category: GeoQueryCategory | null; intent: GeoQueryIntent | null; notes: string | null }>) =>
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
      toast({ title: 'Опрос завершён', description: `Ответов: ${r.responses}, упоминаний: ${r.mentions}` });
    },
    onError: (e: Error) => toast({ title: 'Ошибка опроса', description: e.message, variant: 'destructive' }),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get('text') || '').trim();
    const language = String(fd.get('language') || 'ru');
    const category = (String(fd.get('category') || '') || null) as GeoQueryCategory | null;
    if (!text) return;
    if (editing) updateMut.mutate({ id: editing.id, text, language, category });
    else createMut.mutate({ text, language, category });
  };

  const queries = data?.queries || [];

  // Сводка-метрики сверху
  const summary = useMemo(() => {
    const total = queries.length;
    const active = queries.filter((q) => q.is_active).length;
    const polled = queries.filter((q) => q.last_polled).length;
    const withMentions = queries.filter((q) => (q.metrics?.own_mentions ?? 0) > 0).length;
    const avgSov = polled
      ? Math.round(queries.reduce((s, q) => s + (q.metrics?.sov ?? 0), 0) / Math.max(1, polled))
      : 0;
    return { total, active, polled, withMentions, avgSov };
  }, [queries]);

  // Фильтрация + сортировка
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const arr = queries.filter((q) => {
      if (filterCat !== 'all' && q.category !== filterCat) return false;
      if (s && !q.text.toLowerCase().includes(s)) return false;
      return true;
    });
    const sorted = [...arr];
    if (sort === 'sov_high') sorted.sort((a, b) => (b.metrics?.sov ?? 0) - (a.metrics?.sov ?? 0));
    else if (sort === 'sov_low') sorted.sort((a, b) => (a.metrics?.sov ?? 0) - (b.metrics?.sov ?? 0));
    else if (sort === 'losing') {
      sorted.sort((a, b) => {
        const aCompMinusOwn = (a.metrics?.competitor_mentions ?? 0) - (a.metrics?.own_mentions ?? 0);
        const bCompMinusOwn = (b.metrics?.competitor_mentions ?? 0) - (b.metrics?.own_mentions ?? 0);
        return bCompMinusOwn - aCompMinusOwn;
      });
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [queries, search, filterCat, sort]);

  // Группировка категорий — для фильтра-чипов
  const catCounts = useMemo(() => {
    const map: Record<string, number> = { all: queries.length };
    queries.forEach((q) => {
      const k = q.category || 'other';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [queries]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Запросы</h1>
          <p className="text-slate-500 mt-1">Что ваши клиенты спрашивают у нейросетей</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setSuggestOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
          >
            <Icon name="Sparkles" size={16} className="mr-2" />
            ИИ-помощник
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Icon name="Upload" size={16} className="mr-2" />
            Импорт
          </Button>
          <Button variant="outline" onClick={() => setGapsOpen(true)}>
            <Icon name="Swords" size={16} className="mr-2" />
            Анализ конкурентов
          </Button>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Icon name="Plus" size={16} className="mr-2" />
            Вручную
          </Button>
        </div>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatMini label="Всего запросов" value={summary.total} icon="List" color="bg-slate-100 text-slate-700" />
        <StatMini label="Активные" value={summary.active} icon="Power" color="bg-indigo-100 text-indigo-700" />
        <StatMini label="Опрошены" value={summary.polled} icon="Zap" color="bg-amber-100 text-amber-700" />
        <StatMini
          label="С упоминаниями"
          value={summary.withMentions}
          icon="CheckCircle2"
          color="bg-emerald-100 text-emerald-700"
          hint={summary.polled ? `${Math.round((summary.withMentions / summary.polled) * 100)}% от опрошенных` : undefined}
        />
        <StatMini
          label="Средний SOV"
          value={`${summary.avgSov}%`}
          icon="PieChart"
          color="bg-purple-100 text-purple-700"
          hint={`за ${days} дн`}
        />
      </div>

      {/* Поиск + фильтры + сортировка */}
      {queries.length > 0 && (
        <div className="bg-white border rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по запросам…"
              className="pl-8 pr-3 py-1.5 text-sm border rounded-lg w-full outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFilterCat('all')}
              className={`text-xs px-2 py-1 rounded-full border ${filterCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Все <span className="opacity-70">{catCounts.all || 0}</span>
            </button>
            {Object.entries(CATEGORY_META).filter(([k]) => k !== 'other' && k !== 'navigational' && catCounts[k]).map(([k, meta]) => (
              <button
                key={k}
                onClick={() => setFilterCat(k as GeoQueryCategory)}
                className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border transition ${
                  filterCat === k
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : `${meta.cls} border-transparent hover:border-slate-300`
                }`}
              >
                <Icon name={meta.icon} size={10} />
                {meta.label} <span className="opacity-70">{catCounts[k]}</span>
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs px-2 py-1.5 border rounded-lg bg-white"
            title="Сортировка"
          >
            <option value="newest">Сначала новые</option>
            <option value="sov_high">SOV: больше</option>
            <option value="sov_low">SOV: меньше</option>
            <option value="losing">Где проигрываем сильнее</option>
          </select>
        </div>
      )}

      {/* Создание/редактирование */}
      <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="language">Язык</Label>
                <select id="language" name="language" defaultValue={editing?.language || 'ru'}
                        className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label htmlFor="category">Категория</Label>
                <select id="category" name="category" defaultValue={editing?.category || ''}
                        className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="">— не выбрано —</option>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : queries.length === 0 ? (
        <EmptyState onAI={() => setSuggestOpen(true)} onBulk={() => setBulkOpen(true)} onManual={() => setOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <Icon name="FilterX" size={32} className="text-slate-300 mx-auto mb-2" />
          <div className="text-sm text-slate-500">Под этот фильтр ничего нет.</div>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl divide-y">
          {filtered.map((q) => (
            <QueryRow
              key={q.id}
              q={q}
              pollingId={pollingId}
              onToggleActive={(id, v) => updateMut.mutate({ id, is_active: v })}
              onPoll={(id) => pollMut.mutate(id)}
              onEdit={(qq) => setEditing(qq)}
              onDelete={(id) => deleteMut.mutate(id)}
              onChangeCategory={(id, cat) => updateMut.mutate({ id, category: cat })}
              onChangeIntent={(id, intent) => updateMut.mutate({ id, intent })}
            />
          ))}
        </div>
      )}

      {/* Диалоги */}
      <QuerySuggestDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onAdded={() => qc.invalidateQueries({ queryKey: ['geo-queries'] })}
      />
      <QueryBulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => qc.invalidateQueries({ queryKey: ['geo-queries'] })}
      />
      <CompetitorGapsDialog
        open={gapsOpen}
        onClose={() => setGapsOpen(false)}
        onAskAI={(ctx) => {
          setGapsOpen(false);
          // Сохраняем контекст в URL hash для предзаполнения (простой способ передать)
          setTimeout(() => {
            setSuggestOpen(true);
            // Контекст можно было бы прокинуть через state менеджер; для простоты — пользователь видит подсказку
            toast({ title: 'Подсказка для ИИ', description: ctx, duration: 8000 });
          }, 200);
        }}
      />
    </div>
  );
}

function StatMini({ label, value, icon, color, hint }: { label: string; value: number | string; icon: string; color: string; hint?: string }) {
  return (
    <div className="bg-white border rounded-xl p-3 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon name={icon} size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-[11px] text-slate-500 truncate">{label}</div>
        {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}

function EmptyState({ onAI, onBulk, onManual }: { onAI: () => void; onBulk: () => void; onManual: () => void }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-2xl p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
        <Icon name="Sparkles" size={28} />
      </div>
      <h2 className="text-xl font-bold mb-2">Начнём с генератора запросов</h2>
      <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto">
        ИИ-помощник проанализирует ваш бренд и нишу, и за минуту предложит 15–25 запросов,
        которые реальные клиенты задают нейросетям при выборе.
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          onClick={onAI}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          size="lg"
        >
          <Icon name="Sparkles" size={16} className="mr-2" />
          Сгенерировать через ИИ
        </Button>
        <Button variant="outline" size="lg" onClick={onBulk}>
          <Icon name="Upload" size={16} className="mr-2" />
          Импортировать список
        </Button>
        <Button variant="ghost" size="lg" onClick={onManual}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить вручную
        </Button>
      </div>
    </div>
  );
}
