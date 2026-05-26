import { GeoQuery, GeoQueryCategory, GeoQueryIntent } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { CATEGORY_META, INTENT_META, timeAgo } from './queriesHelpers';

interface QueryRowProps {
  q: GeoQuery;
  pollingId: string | null;
  onToggleActive: (id: string, v: boolean) => void;
  onPoll: (id: string) => void;
  onEdit: (q: GeoQuery) => void;
  onDelete: (id: string) => void;
  onChangeCategory: (id: string, cat: GeoQueryCategory | null) => void;
  onChangeIntent: (id: string, intent: GeoQueryIntent | null) => void;
}

export default function QueryRow({
  q, pollingId, onToggleActive, onPoll, onEdit, onDelete, onChangeCategory, onChangeIntent,
}: QueryRowProps) {
  const m = q.metrics;
  const cat = q.category ? CATEGORY_META[q.category] : null;
  const intent = q.intent ? INTENT_META[q.intent] : null;
  const sov = m?.sov ?? 0;

  const sovColor =
    sov >= 50 ? 'text-emerald-700' :
    sov >= 20 ? 'text-amber-700' :
    sov > 0   ? 'text-rose-700' :
                'text-slate-400';

  const sovBar =
    sov >= 50 ? 'bg-emerald-500' :
    sov >= 20 ? 'bg-amber-500' :
    sov > 0   ? 'bg-rose-400' :
                'bg-slate-200';

  return (
    <div className="p-4 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start gap-3">
        <Switch
          checked={q.is_active}
          onCheckedChange={(v) => onToggleActive(q.id, v)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          {/* Текст запроса + бейджи */}
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span className="text-sm font-medium text-slate-900 break-words">{q.text}</span>
            {q.source === 'ai_suggest' && (
              <span
                className="text-[10px] inline-flex items-center gap-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full font-semibold"
                title="Сгенерировано ИИ-помощником"
              >
                <Icon name="Sparkles" size={9} />
                AI
              </span>
            )}
          </div>

          {/* Категория/интент — кликабельные пилюли */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <CategoryDropdown value={q.category} onChange={(v) => onChangeCategory(q.id, v)} />
            <IntentDropdown value={q.intent} onChange={(v) => onChangeIntent(q.id, v)} />
            <span className="text-[10px] text-slate-400 uppercase">{q.language}</span>
          </div>

          {/* Заметка ИИ */}
          {q.notes && q.notes.startsWith('[AI]') && (
            <div className="text-[11px] text-slate-500 italic mb-2 line-clamp-2">
              💡 {q.notes.replace('[AI] ', '')}
            </div>
          )}

          {/* Метрики */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-3 items-center text-xs">
            {/* SOV — главный показатель */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-500">Ваш SOV</span>
                <span className="flex items-center gap-1">
                  <span className={`font-bold ${sovColor}`}>{sov}%</span>
                  {m && m.trend !== '=' && (
                    <span
                      className={`text-[10px] font-semibold ${m.trend === '+' ? 'text-emerald-600' : 'text-rose-600'}`}
                      title={`Изменение за ${m.window_days} дн: ${m.sov_delta > 0 ? '+' : ''}${m.sov_delta}%`}
                    >
                      <Icon name={m.trend === '+' ? 'TrendingUp' : 'TrendingDown'} size={10} className="inline" />
                      {m.sov_delta > 0 ? '+' : ''}{m.sov_delta}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${sovBar} transition-all`} style={{ width: `${sov}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {m?.own_mentions ?? 0} ваших / {m?.competitor_mentions ?? 0} конкурентов
              </div>
            </div>

            {/* Топ конкурент */}
            <div className="text-slate-500 truncate">
              {m?.top_competitor ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="Target" size={11} className="text-rose-400" />
                  Выигрывает: <b className="text-slate-700">{m.top_competitor.name}</b>
                  <span className="text-slate-400">({m.top_competitor.count})</span>
                </span>
              ) : m && m.own_mentions > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Icon name="Crown" size={11} />
                  Конкурентов не упомянули
                </span>
              ) : (
                <span className="text-slate-400">Нет данных за период</span>
              )}
            </div>

            <div className="text-slate-400 text-[11px] whitespace-nowrap">
              {q.responses_count} ответов · {timeAgo(q.last_polled)}
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={pollingId === q.id}
            onClick={() => onPoll(q.id)}
          >
            {pollingId === q.id ? (
              <><Icon name="Loader2" size={14} className="mr-1 animate-spin" />Опрос…</>
            ) : (
              <><Icon name="Zap" size={14} className="mr-1" />Опросить</>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(q)} title="Редактировать">
            <Icon name="Pencil" size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (confirm('Удалить запрос?')) onDelete(q.id); }}
            title="Удалить"
          >
            <Icon name="Trash2" size={15} className="text-rose-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategoryDropdown({ value, onChange }: { value: GeoQueryCategory | null; onChange: (v: GeoQueryCategory | null) => void }) {
  const meta = value ? CATEGORY_META[value] : null;
  return (
    <div className="relative inline-block">
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target.value || null) as GeoQueryCategory | null)}
        className={`appearance-none cursor-pointer text-[10px] pl-2 pr-5 py-0.5 rounded-full border border-transparent ${
          meta ? meta.cls : 'bg-slate-100 text-slate-500'
        } hover:border-slate-300`}
      >
        <option value="">— категория —</option>
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <Icon name="ChevronDown" size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function IntentDropdown({ value, onChange }: { value: GeoQueryIntent | null; onChange: (v: GeoQueryIntent | null) => void }) {
  return (
    <div className="relative inline-block">
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target.value || null) as GeoQueryIntent | null)}
        className="appearance-none cursor-pointer text-[10px] pl-2 pr-5 py-0.5 rounded-full border border-transparent bg-slate-100 text-slate-600 hover:border-slate-300"
      >
        <option value="">— интент —</option>
        {Object.entries(INTENT_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <Icon name="ChevronDown" size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
