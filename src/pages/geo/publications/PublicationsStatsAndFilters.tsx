import Icon from '@/components/ui/icon';
import { FILTER_OPTIONS, FilterId } from './publicationsHelpers';

interface Counts {
  all: number;
  search: number;
  llm: number;
  both: number;
  none: number;
  unchecked: number;
}

interface PublicationsStatsAndFiltersProps {
  allPubsCount: number;
  counts: Counts;
  filter: FilterId;
  setFilter: (f: FilterId) => void;
}

export default function PublicationsStatsAndFilters({
  allPubsCount,
  counts,
  filter,
  setFilter,
}: PublicationsStatsAndFiltersProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatBox label="Всего" value={allPubsCount} icon="FileText" color="bg-indigo-100 text-indigo-600" />
        <StatBox
          label="В поиске (Яндекс/Bing)"
          value={counts.search}
          icon="Search"
          color="bg-rose-100 text-rose-600"
          hint={allPubsCount ? `${Math.round((counts.search / allPubsCount) * 100)}% публикаций` : undefined}
        />
        <StatBox
          label="В нейровыдаче"
          value={counts.llm}
          icon="Sparkles"
          color="bg-purple-100 text-purple-600"
          hint={allPubsCount ? `${Math.round((counts.llm / allPubsCount) * 100)}% публикаций` : undefined}
        />
        <StatBox
          label="Везде"
          value={counts.both}
          icon="CheckCircle2"
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3 text-sm">
        <Icon name="Info" size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-blue-900">
          <div className="font-medium mb-0.5">Как работает проверка</div>
          <div className="text-blue-800/90 text-xs leading-relaxed">
            При нажатии «Проверить» платформа делает 4 реальных запроса в интернет:
            проверяет что страница жива (HTTP 200), ищет публикацию в Яндексе и Bing/DuckDuckGo,
            и спрашивает Perplexity / GPT-4o Search (нейросети с реальным веб-поиском).
            Свежим публикациям нужно <b>1–4 недели</b>, чтобы попасть в индекс поисковиков и нейровыдачу.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTER_OPTIONS.map((f) => {
          const c = counts[f.id];
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Icon name={f.icon} size={14} />
              {f.label}
              <span className={`text-xs px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100'}`}>{c}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StatBox({ label, value, icon, color, hint }: { label: string; value: number; icon: string; color: string; hint?: string }) {
  return (
    <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-slate-500 truncate">{label}</div>
        {hint && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</div>}
      </div>
    </div>
  );
}
