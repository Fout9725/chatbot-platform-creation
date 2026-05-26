import Icon from '@/components/ui/icon';

type ColorKey = 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose';

const COLORS: Record<ColorKey, { iconBg: string; bar: string; ring: string; accent: string }> = {
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30',
    bar: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
    ring: 'group-hover:ring-indigo-200',
    accent: 'text-indigo-600',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    ring: 'group-hover:ring-emerald-200',
    accent: 'text-emerald-600',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    ring: 'group-hover:ring-amber-200',
    accent: 'text-amber-600',
  },
  purple: {
    iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/30',
    bar: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
    ring: 'group-hover:ring-purple-200',
    accent: 'text-purple-600',
  },
  rose: {
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30',
    bar: 'bg-gradient-to-r from-rose-400 to-pink-500',
    ring: 'group-hover:ring-rose-200',
    accent: 'text-rose-600',
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  color?: ColorKey;
  /** Доля (0..1 или 0..100). Если задана — снизу нарисуется прогресс-бар */
  progress?: number;
  /** Подпись внизу под прогресс-баром (например "5 из 12") */
  progressLabel?: string;
  /** Изменение в % за период (>0 рост, <0 падение). Покажет цветной чип */
  delta?: number;
  /** Подпись для delta (например "vs прошлая неделя") */
  deltaLabel?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  icon,
  color = 'indigo',
  progress,
  progressLabel,
  delta,
  deltaLabel,
}: StatCardProps) {
  const c = COLORS[color];
  const pct = progress != null ? Math.max(0, Math.min(100, progress > 1 ? progress : progress * 100)) : null;

  return (
    <div
      className={`group bg-white rounded-2xl border p-5 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-transparent ${c.ring}`}
    >
      {/* Декоративный круг на фоне */}
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.07] ${c.iconBg.split(' ')[0]} ${c.iconBg.split(' ')[1]}`}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.iconBg}`}
        >
          <Icon name={icon} size={20} />
        </div>
        {delta != null && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              delta > 0
                ? 'bg-emerald-50 text-emerald-700'
                : delta < 0
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
            title={deltaLabel}
          >
            <Icon
              name={delta > 0 ? 'TrendingUp' : delta < 0 ? 'TrendingDown' : 'Minus'}
              size={11}
            />
            {delta > 0 ? '+' : ''}
            {delta}%
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-0.5">
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      </div>
      <div className="text-sm text-slate-600 font-medium">{label}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}

      {pct != null && (
        <div className="mt-3">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {progressLabel && (
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>{progressLabel}</span>
              <span className={`font-semibold ${c.accent}`}>{Math.round(pct)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
