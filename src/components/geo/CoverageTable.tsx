import { useState, useMemo } from 'react';
import { GeoCoverageRow } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(s: string | null): string {
  if (!s) return 'не опрашивался';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

type StatusKey = 'covered' | 'partial' | 'missed' | 'unpolled';

function getStatus(r: GeoCoverageRow): StatusKey {
  if (!r.responses) return 'unpolled';
  if (r.own_mentions === 0) return 'missed';
  if (r.own_mentions < r.responses) return 'partial';
  return 'covered';
}

const STATUS_META: Record<
  StatusKey,
  { label: string; icon: string; dot: string; bg: string; text: string; hint: string }
> = {
  covered: {
    label: 'Вы везде',
    icon: 'CheckCircle2',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    hint: 'Ваш бренд упоминается во всех ответах нейросетей',
  },
  partial: {
    label: 'Частично',
    icon: 'CircleDot',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hint: 'Вас упоминают только в части ответов — есть куда расти',
  },
  missed: {
    label: 'Без бренда',
    icon: 'XCircle',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    hint: 'Нейросеть ответила, но ваш бренд не упомянула',
  },
  unpolled: {
    label: 'Не опрошен',
    icon: 'CircleDashed',
    dot: 'bg-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    hint: 'Этот запрос ещё не опрашивался',
  },
};

const FILTERS: Array<{ id: 'all' | StatusKey; label: string; icon: string }> = [
  { id: 'all', label: 'Все', icon: 'List' },
  { id: 'covered', label: 'Вы везде', icon: 'CheckCircle2' },
  { id: 'partial', label: 'Частично', icon: 'CircleDot' },
  { id: 'missed', label: 'Без бренда', icon: 'XCircle' },
  { id: 'unpolled', label: 'Не опрошены', icon: 'CircleDashed' },
];

export default function CoverageTable({ rows }: { rows: GeoCoverageRow[] }) {
  const [filter, setFilter] = useState<'all' | StatusKey>('all');
  const [search, setSearch] = useState('');

  const enriched = useMemo(
    () => rows.map((r) => ({ ...r, _status: getStatus(r) })),
    [rows],
  );

  const counts = useMemo(() => {
    const c = { all: enriched.length, covered: 0, partial: 0, missed: 0, unpolled: 0 };
    enriched.forEach((r) => {
      c[r._status] += 1;
    });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((r) => {
      if (filter !== 'all' && r._status !== filter) return false;
      if (q && !r.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enriched, filter, search]);

  if (!rows.length) {
    return (
      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <Icon name="ListChecks" size={36} className="text-slate-300 mx-auto mb-2" />
        <div className="text-slate-600 text-sm font-medium">Запросы пока не добавлены</div>
        <div className="text-slate-400 text-xs mt-1">
          Добавьте 5–10 запросов в разделе «Запросы» — и здесь появится таблица покрытия
        </div>
      </div>
    );
  }

  const totalPolled = counts.covered + counts.partial + counts.missed;
  const coveredPct = totalPolled
    ? Math.round(((counts.covered + counts.partial * 0.5) / totalPolled) * 100)
    : 0;

  return (
    <TooltipProvider delayDuration={150}>
      {/* Сводка сверху — пользователь сразу видит «общую температуру» */}
      <div className="mb-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-0.5">
              Покрытие запросов
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {coveredPct}%
              <span className="text-sm text-slate-500 font-normal ml-2">
                запросов с упоминанием бренда
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-emerald-500" label="Вы везде" value={counts.covered} />
            <LegendDot color="bg-amber-500" label="Частично" value={counts.partial} />
            <LegendDot color="bg-rose-500" label="Без бренда" value={counts.missed} />
            <LegendDot color="bg-slate-300" label="Не опрошен" value={counts.unpolled} />
          </div>
        </div>
        {/* Прогресс-бар */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {counts.covered > 0 && (
            <div
              className="bg-emerald-500"
              style={{ width: `${(counts.covered / counts.all) * 100}%` }}
              title={`Вы везде: ${counts.covered}`}
            />
          )}
          {counts.partial > 0 && (
            <div
              className="bg-amber-500"
              style={{ width: `${(counts.partial / counts.all) * 100}%` }}
              title={`Частично: ${counts.partial}`}
            />
          )}
          {counts.missed > 0 && (
            <div
              className="bg-rose-500"
              style={{ width: `${(counts.missed / counts.all) * 100}%` }}
              title={`Без бренда: ${counts.missed}`}
            />
          )}
          {counts.unpolled > 0 && (
            <div
              className="bg-slate-300"
              style={{ width: `${(counts.unpolled / counts.all) * 100}%` }}
              title={`Не опрошен: ${counts.unpolled}`}
            />
          )}
        </div>
      </div>

      {/* Подсказка про запросы без бренда */}
      {counts.missed > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Icon name="Lightbulb" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 space-y-2 min-w-0">
            <p>
              <b>Запросы без бренда ({counts.missed}).</b> Нейросети ответили, но ваш бренд не упомянули.
              Попробуйте переформулировать запрос конкретнее — добавить город, нишу или формат покупки.
            </p>
            <details className="text-xs text-amber-800">
              <summary className="cursor-pointer hover:text-amber-900 font-medium">
                Показать примеры формулировок
              </summary>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>«Магазины электротоваров в [вашем городе]»</li>
                <li>«Где купить розетки оптом в России»</li>
                <li>«Лучший интернет-магазин кабеля и проводов»</li>
                <li>«Поставщики электротехники для электриков»</li>
              </ul>
            </details>
          </div>
        </div>
      )}

      {/* Фильтры + поиск */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const c = counts[f.id];
            const active = filter === f.id;
            const disabled = f.id !== 'all' && c === 0;
            return (
              <button
                key={f.id}
                onClick={() => !disabled && setFilter(f.id)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : disabled
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Icon name={f.icon} size={11} />
                {f.label}
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    active ? 'bg-white/25' : disabled ? 'bg-slate-100' : 'bg-slate-100'
                  }`}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto relative">
          <Icon
            name="Search"
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по запросам…"
            className="pl-7 pr-3 py-1.5 text-xs border rounded-full w-56 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl text-sm text-slate-400">
          <Icon name="FilterX" size={24} className="mx-auto mb-2 text-slate-300" />
          Ничего не нашлось под этот фильтр
        </div>
      ) : (
        <>
          {/* Desktop — таблица. Mobile — карточки */}
          <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b">
                  <th className="py-2.5 px-3 font-medium">Статус и запрос</th>
                  <th className="py-2.5 px-3 font-medium text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Покрытие
                          <Icon name="HelpCircle" size={11} className="text-slate-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[220px]">
                        Доля ответов, где упомянули ваш бренд (свои упоминания / всего ответов)
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Свои
                          <Icon name="HelpCircle" size={11} className="text-slate-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[200px]">
                        Сколько раз LLM упомянули ваш бренд
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Конкуренты
                          <Icon name="HelpCircle" size={11} className="text-slate-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[200px]">
                        Сколько раз LLM упомянули конкурентов
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">Опрошен</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => {
                  const meta = STATUS_META[r._status];
                  const pct = r.responses
                    ? Math.round((r.own_mentions / r.responses) * 100)
                    : 0;
                  return (
                    <tr key={r.query_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${meta.bg} ${meta.text}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[240px]">
                              {meta.hint}
                            </TooltipContent>
                          </Tooltip>
                          <span
                            className="text-slate-800 leading-snug line-clamp-2"
                            title={r.text}
                          >
                            {r.text}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 w-44">
                        {r.responses ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  r._status === 'covered'
                                    ? 'bg-emerald-500'
                                    : r._status === 'partial'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium w-10 text-right ${
                                r._status === 'covered'
                                  ? 'text-emerald-700'
                                  : r._status === 'partial'
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {r.own_mentions} из {r.responses} ответов
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block min-w-[2rem] font-semibold ${
                            r.own_mentions > 0 ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        >
                          {r.own_mentions}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block min-w-[2rem] ${
                            r.competitor_mentions > 0
                              ? 'text-slate-700 font-medium'
                              : 'text-slate-300'
                          }`}
                        >
                          {r.competitor_mentions}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-slate-500 cursor-help">
                              {timeAgo(r.last_polled)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            {formatDate(r.last_polled)}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile карточки */}
          <div className="md:hidden space-y-2">
            {filtered.map((r) => {
              const meta = STATUS_META[r._status];
              const pct = r.responses
                ? Math.round((r.own_mentions / r.responses) * 100)
                : 0;
              return (
                <div
                  key={r.query_id}
                  className="bg-white border rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${meta.bg} ${meta.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-sm text-slate-800 leading-snug flex-1">
                      {r.text}
                    </span>
                  </div>
                  {r.responses > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            r._status === 'covered'
                              ? 'bg-emerald-500'
                              : r._status === 'partial'
                                ? 'bg-amber-500'
                                : 'bg-rose-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{pct}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>
                        Свои:{' '}
                        <b
                          className={
                            r.own_mentions > 0 ? 'text-emerald-600' : 'text-slate-400'
                          }
                        >
                          {r.own_mentions}
                        </b>
                      </span>
                      <span>
                        Конкуренты:{' '}
                        <b className="text-slate-700">{r.competitor_mentions}</b>
                      </span>
                    </div>
                    <span>{timeAgo(r.last_polled)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </TooltipProvider>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-600">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-slate-500">{label}:</span>
      <b className="text-slate-800">{value}</b>
    </span>
  );
}
