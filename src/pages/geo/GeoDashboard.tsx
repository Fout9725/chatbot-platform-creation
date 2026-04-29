import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeoAuth } from '@/contexts/GeoAuthContext';
import { geoApi } from '@/lib/geo/api';
import StatCard from '@/components/geo/StatCard';
import SovChart from '@/components/geo/SovChart';
import SovBars from '@/components/geo/SovBars';
import MentionsFeed from '@/components/geo/MentionsFeed';
import CoverageTable from '@/components/geo/CoverageTable';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const PERIODS = [
  { d: 1, label: '24ч' },
  { d: 7, label: '7д' },
  { d: 30, label: '30д' },
];

export default function GeoDashboard() {
  const { user } = useGeoAuth();
  const qc = useQueryClient();
  const [days, setDays] = useState(7);

  const overviewQ = useQuery({
    queryKey: ['geo-overview', days],
    queryFn: () => geoApi.analytics.overview(days),
  });

  const trendQ = useQuery({
    queryKey: ['geo-trend', days],
    queryFn: () => geoApi.analytics.sovTrend(days),
  });

  const mentionsQ = useQuery({
    queryKey: ['geo-mentions', days],
    queryFn: () => geoApi.analytics.mentions(days, 15),
  });

  const coverageQ = useQuery({
    queryKey: ['geo-coverage', days],
    queryFn: () => geoApi.analytics.coverage(days),
  });

  const pollAll = useMutation({
    mutationFn: () => geoApi.poll(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-overview'] });
      qc.invalidateQueries({ queryKey: ['geo-trend'] });
      qc.invalidateQueries({ queryKey: ['geo-mentions'] });
      qc.invalidateQueries({ queryKey: ['geo-coverage'] });
      qc.invalidateQueries({ queryKey: ['geo-queries'] });
      toast({
        title: r.note === 'no_active_queries' ? 'Нет активных запросов' : 'Опрос завершён',
        description: `Опрошено: ${r.polled}, ответов: ${r.responses}, упоминаний: ${r.mentions}`,
      });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const o = overviewQ.data;
  const isEmpty = o && o.queries.total === 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <p className="text-slate-500 mt-1">Привет, {user?.company}! Вот срез по упоминаниям бренда.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border rounded-lg p-1 flex">
            {PERIODS.map((p) => (
              <button
                key={p.d}
                onClick={() => setDays(p.d)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  days === p.d ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button onClick={() => pollAll.mutate()} disabled={pollAll.isPending}>
            {pollAll.isPending ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Опрос…
              </>
            ) : (
              <>
                <Icon name="Zap" size={16} className="mr-2" />
                Опросить все
              </>
            )}
          </Button>
        </div>
      </header>

      {isEmpty && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6 flex items-start gap-4">
          <Icon name="Rocket" size={28} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Начните за 3 шага</h3>
            <p className="text-sm text-slate-600 mb-3">
              Добавьте бренды, заведите запросы и запустите первый опрос — данные появятся сразу.
            </p>
            <div className="flex gap-2">
              <a href="/geo/brands" className="text-sm bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50">
                → Добавить бренды
              </a>
              <a href="/geo/queries" className="text-sm bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50">
                → Добавить запросы
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Доля голоса (SOV)"
          value={o ? `${o.own_sov}%` : '—'}
          hint="Доля упоминаний моего бренда"
          icon="PieChart"
          color="indigo"
        />
        <StatCard
          label="Упоминаний"
          value={o ? o.mentions : '—'}
          hint={`за ${days} дн`}
          icon="Quote"
          color="emerald"
        />
        <StatCard
          label="Покрыто запросов"
          value={o ? `${o.covered_queries} / ${o.queries.active}` : '—'}
          hint="Где упомянули мой бренд"
          icon="Target"
          color="amber"
        />
        <StatCard
          label="Ответов LLM"
          value={o ? o.responses : '—'}
          hint={`за ${days} дн`}
          icon="MessageSquare"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Динамика SOV по дням</h2>
          {trendQ.isLoading ? (
            <div className="h-72 flex items-center justify-center text-slate-400">Загрузка…</div>
          ) : (
            <SovChart trend={trendQ.data?.trend || []} brands={trendQ.data?.brands || []} />
          )}
        </div>
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">SOV по брендам</h2>
          {overviewQ.isLoading ? (
            <div className="text-slate-400 text-sm">Загрузка…</div>
          ) : (
            <SovBars sov={o?.sov || []} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Последние упоминания</h2>
          {mentionsQ.isLoading ? (
            <div className="text-slate-400 text-sm">Загрузка…</div>
          ) : (
            <MentionsFeed mentions={mentionsQ.data?.mentions || []} />
          )}
        </div>
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Покрытие запросов</h2>
          {coverageQ.isLoading ? (
            <div className="text-slate-400 text-sm">Загрузка…</div>
          ) : (
            <CoverageTable rows={coverageQ.data?.coverage || []} />
          )}
        </div>
      </div>
    </div>
  );
}
