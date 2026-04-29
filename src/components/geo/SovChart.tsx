import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Brand = { id: string; name: string; is_own: boolean };
type Point = Record<string, number | string>;

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'];

export default function SovChart({ trend, brands }: { trend: Point[]; brands: Brand[] }) {
  if (!trend.length || !brands.length) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
        Пока нет данных. Запустите опрос на странице «Запросы».
      </div>
    );
  }
  const sorted = [...brands].sort((a, b) => Number(b.is_own) - Number(a.is_own));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }}
                 tickFormatter={(v) => new Date(v).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(v: number) => [`${v}%`, '']}
            labelFormatter={(v) => new Date(v).toLocaleDateString('ru-RU')}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {sorted.map((b, i) => (
            <Line
              key={b.id}
              type="monotone"
              dataKey={b.name}
              stroke={b.is_own ? '#6366f1' : PALETTE[(i + 1) % PALETTE.length]}
              strokeWidth={b.is_own ? 3 : 2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
