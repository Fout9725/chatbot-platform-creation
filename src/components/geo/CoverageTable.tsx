import { GeoCoverageRow } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CoverageTable({ rows }: { rows: GeoCoverageRow[] }) {
  if (!rows.length) {
    return <div className="text-center py-8 text-slate-400 text-sm">Запросы пока не добавлены.</div>;
  }
  const noBrandRows = rows.filter((r) => r.responses > 0 && r.own_mentions === 0);
  return (
    <div className="overflow-x-auto">
      {noBrandRows.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Icon name="Lightbulb" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 space-y-2">
            <p>
              <b>Запросы без бренда ({noBrandRows.length}).</b> Нейросети ответили, но ваш бренд не упомянули.
              Скорее всего запросы слишком общие — попробуйте переформулировать конкретнее, чтобы LLM
              естественно упомянула именно вас.
            </p>
            <p className="text-amber-800">Примеры формулировок:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>«Магазины электротоваров в [вашем городе]»</li>
              <li>«Где купить розетки оптом в России»</li>
              <li>«Лучший интернет-магазин кабеля и проводов»</li>
              <li>«Поставщики электротехники для электриков»</li>
            </ul>
            <p className="text-xs text-amber-700">
              Совет: добавляйте в запросы город, нишу, тип клиента или формат покупки (опт/розница).
            </p>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b">
            <th className="py-2 px-3 font-medium">Запрос</th>
            <th className="py-2 px-3 font-medium text-center">Ответы</th>
            <th className="py-2 px-3 font-medium text-center">Свои</th>
            <th className="py-2 px-3 font-medium text-center">Конкуренты</th>
            <th className="py-2 px-3 font-medium">Опрошен</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => {
            const covered = r.own_mentions > 0;
            return (
              <tr key={r.query_id}>
                <td className="py-3 px-3 max-w-md">
                  <div className="flex items-center gap-2">
                    <Icon
                      name={covered ? 'CheckCircle2' : r.responses ? 'XCircle' : 'CircleDashed'}
                      size={16}
                      className={covered ? 'text-emerald-500' : r.responses ? 'text-rose-400' : 'text-slate-300'}
                    />
                    <span className="truncate" title={r.text}>{r.text}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-600">{r.responses}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`font-medium ${covered ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {r.own_mentions}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-slate-600">{r.competitor_mentions}</td>
                <td className="py-3 px-3 text-xs text-slate-500">{formatDate(r.last_polled)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}