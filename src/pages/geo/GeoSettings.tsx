import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const POLL_PRESETS = [
  { h: 6, label: 'Каждые 6 часов' },
  { h: 12, label: 'Каждые 12 часов' },
  { h: 24, label: 'Раз в сутки' },
  { h: 48, label: 'Раз в 2 дня' },
  { h: 168, label: 'Раз в неделю' },
];

const PUB_PRESETS = [
  { h: 24, label: 'Ежедневно' },
  { h: 72, label: 'Раз в 3 дня' },
  { h: 168, label: 'Раз в неделю' },
  { h: 336, label: 'Раз в 2 недели' },
  { h: 720, label: 'Раз в месяц' },
];

const KIND_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  poll: { label: 'Опрос LLM', icon: 'Zap', color: 'text-indigo-600' },
  pub_check: { label: 'Проверка публикаций', icon: 'ScanSearch', color: 'text-purple-600' },
};

const STATUS_BADGE: Record<string, string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  running: 'bg-amber-100 text-amber-700',
  error: 'bg-rose-100 text-rose-700',
};

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function duration(start: string, end: string | null) {
  if (!end) return '…';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return '<1 сек';
  if (ms < 60000) return `${Math.round(ms / 1000)} сек`;
  return `${Math.round(ms / 60000)} мин`;
}

function nextRunIn(last: string | null, intervalH: number, enabled: boolean) {
  if (!enabled) return 'Отключено';
  if (!last) return 'При следующем запуске CRON';
  const next = new Date(last).getTime() + intervalH * 3600_000;
  const diff = next - Date.now();
  if (diff <= 0) return 'Сейчас будет запущено';
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  if (h > 24) return `Через ${Math.floor(h / 24)} дн ${h % 24} ч`;
  if (h > 0) return `Через ${h} ч ${m} мин`;
  return `Через ${m} мин`;
}

export default function GeoSettings() {
  const qc = useQueryClient();
  const settingsQ = useQuery({ queryKey: ['geo-settings'], queryFn: () => geoApi.settings.get() });
  const runsQ = useQuery({ queryKey: ['geo-runs'], queryFn: () => geoApi.settings.runs(20) });

  const [pollEnabled, setPollEnabled] = useState(true);
  const [pollH, setPollH] = useState(24);
  const [pubEnabled, setPubEnabled] = useState(true);
  const [pubH, setPubH] = useState(168);
  const [company, setCompany] = useState('');

  useEffect(() => {
    const s = settingsQ.data?.settings;
    if (!s) return;
    setPollEnabled(s.poll_enabled);
    setPollH(s.poll_interval_hours);
    setPubEnabled(s.pub_check_enabled);
    setPubH(s.pub_check_interval_hours);
    setCompany(s.company);
  }, [settingsQ.data]);

  const saveMut = useMutation({
    mutationFn: geoApi.settings.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-settings'] });
      toast({ title: 'Настройки сохранены' });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const s = settingsQ.data?.settings;
  const runs = runsQ.data?.runs || [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-slate-500 mt-1">Расписание автоматических опросов и проверок</p>
      </div>

      {settingsQ.isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : (
        <div className="space-y-6">
          <section className="bg-white border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Компания</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="company">Название</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="text-sm text-slate-500 pb-2">
                Тариф: <span className="font-medium">{s?.plan || '—'}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => saveMut.mutate({ company })}
              disabled={saveMut.isPending || company === s?.company}
            >
              <Icon name="Save" size={14} className="mr-1" />
              Сохранить название
            </Button>
          </section>

          <section className="bg-white border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon name="Zap" size={18} className="text-indigo-600" />
                  Авто-опрос LLM
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Запросы будут опрашиваться автоматически и попадать в дашборд
                </p>
              </div>
              <Switch checked={pollEnabled} onCheckedChange={setPollEnabled} />
            </div>
            <div className={pollEnabled ? '' : 'opacity-50 pointer-events-none'}>
              <Label className="mb-2 block">Частота</Label>
              <div className="flex flex-wrap gap-2">
                {POLL_PRESETS.map((p) => (
                  <button
                    key={p.h}
                    onClick={() => setPollH(p.h)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      pollH === p.h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-3 flex items-center gap-4 flex-wrap">
                <span>Последний запуск: {formatDate(s?.last_auto_poll_at || null)}</span>
                <span className="text-slate-400">·</span>
                <span>Следующий: {nextRunIn(s?.last_auto_poll_at || null, pollH, pollEnabled)}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon name="ScanSearch" size={18} className="text-purple-600" />
                  Авто-проверка публикаций
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Опубликованные материалы будут проверяться на попадание в LLM-ответы
                </p>
              </div>
              <Switch checked={pubEnabled} onCheckedChange={setPubEnabled} />
            </div>
            <div className={pubEnabled ? '' : 'opacity-50 pointer-events-none'}>
              <Label className="mb-2 block">Частота</Label>
              <div className="flex flex-wrap gap-2">
                {PUB_PRESETS.map((p) => (
                  <button
                    key={p.h}
                    onClick={() => setPubH(p.h)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      pubH === p.h ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-3 flex items-center gap-4 flex-wrap">
                <span>Последний запуск: {formatDate(s?.last_auto_pub_check_at || null)}</span>
                <span className="text-slate-400">·</span>
                <span>Следующий: {nextRunIn(s?.last_auto_pub_check_at || null, pubH, pubEnabled)}</span>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                saveMut.mutate({
                  poll_enabled: pollEnabled,
                  poll_interval_hours: pollH,
                  pub_check_enabled: pubEnabled,
                  pub_check_interval_hours: pubH,
                })
              }
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? (
                <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Сохранение…</>
              ) : (
                <><Icon name="Save" size={16} className="mr-2" />Сохранить расписание</>
              )}
            </Button>
          </div>

          <section className="bg-white border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Icon name="History" size={18} />
                История запусков
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => qc.invalidateQueries({ queryKey: ['geo-runs'] })}
              >
                <Icon name="RefreshCw" size={14} />
              </Button>
            </div>
            {runsQ.isLoading ? (
              <div className="text-slate-400 text-sm">Загрузка…</div>
            ) : !runs.length ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Запусков ещё не было. CRON стартует автоматически по расписанию.
              </div>
            ) : (
              <div className="divide-y -mx-2">
                {runs.map((r) => {
                  const k = KIND_LABEL[r.kind] || { label: r.kind, icon: 'Activity', color: 'text-slate-500' };
                  const stats = r.kind === 'poll'
                    ? `${r.polled} зап. · ${r.responses} отв. · ${r.mentions} упом.`
                    : `${r.checked} проверено · ${r.found} в LLM`;
                  return (
                    <div key={r.id} className="py-3 px-2 flex items-center gap-3 text-sm">
                      <Icon name={k.icon} size={16} className={k.color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{k.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status] || 'bg-slate-100'}`}>
                            {r.status === 'ok' ? 'Успех' : r.status === 'error' ? 'Ошибка' : 'Выполняется'}
                          </span>
                          <span className="text-xs text-slate-500">{stats}</span>
                        </div>
                        {r.error && <div className="text-xs text-rose-500 mt-0.5 truncate">{r.error}</div>}
                      </div>
                      <div className="text-xs text-slate-400 text-right">
                        <div>{formatDate(r.started_at)}</div>
                        <div>{duration(r.started_at, r.finished_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
