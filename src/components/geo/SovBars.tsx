import { GeoOverview } from '@/lib/geo/api';

export default function SovBars({ sov }: { sov: GeoOverview['sov'] }) {
  if (!sov.length || sov.every((s) => s.mentions === 0)) {
    return <div className="text-center py-6 text-slate-400 text-sm">Нет упоминаний за выбранный период</div>;
  }
  const max = Math.max(...sov.map((s) => s.sov), 1);
  return (
    <div className="space-y-3">
      {sov.map((s) => (
        <div key={s.brand_id}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className={s.is_own ? 'font-semibold text-indigo-700' : 'text-slate-700'}>
              {s.name} {s.is_own && <span className="text-xs ml-1">★</span>}
            </span>
            <span className="text-slate-500 tabular-nums">{s.sov}% · {s.mentions}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${s.is_own ? 'bg-indigo-500' : 'bg-slate-400'}`}
              style={{ width: `${(s.sov / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
