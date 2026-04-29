import { useGeoAuth } from '@/contexts/GeoAuthContext';
import Icon from '@/components/ui/icon';

const STATS = [
  { label: 'Активных запросов', value: '0', icon: 'Search', color: 'indigo' },
  { label: 'Брендов отслеживается', value: '0', icon: 'Tag', color: 'emerald' },
  { label: 'Упоминаний за 7 дней', value: '0', icon: 'TrendingUp', color: 'amber' },
  { label: 'Черновиков контента', value: '0', icon: 'FileText', color: 'purple' },
];

const COLOR_BG: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
};

export default function GeoDashboard() {
  const { user } = useGeoAuth();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Привет, {user?.company}!</h1>
        <p className="text-slate-500 mt-1">
          Обзор упоминаний вашего бренда в ответах генеративных нейросетей
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${COLOR_BG[s.color]}`}>
              <Icon name={s.icon} size={20} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center mb-4">
          <Icon name="Rocket" size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Начните за 3 шага</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Добавьте свой бренд и конкурентов, заведите запросы для отслеживания —
          и платформа начнёт ежедневно опрашивать ChatGPT и Perplexity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          {[
            { n: 1, title: 'Добавьте бренды', desc: 'Свой и 3-5 конкурентов' },
            { n: 2, title: 'Заведите запросы', desc: 'Что спрашивают клиенты' },
            { n: 3, title: 'Получайте отчёты', desc: 'SOV и упоминания каждый день' },
          ].map((s) => (
            <div key={s.n} className="bg-slate-50 rounded-xl p-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mb-2">
                {s.n}
              </div>
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
