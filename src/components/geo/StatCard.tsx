import Icon from '@/components/ui/icon';

const COLOR_BG: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  rose: 'bg-rose-100 text-rose-600',
};

export default function StatCard({
  label, value, hint, icon, color = 'indigo',
}: { label: string; value: string | number; hint?: string; icon: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${COLOR_BG[color] || COLOR_BG.indigo}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
