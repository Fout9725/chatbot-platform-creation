import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { geoApi } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function fmtRelative(iso: string | null): string {
  if (!iso) return 'никогда';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

function fmtCountdown(target: number): string {
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
  if (diff <= 0) return 'скоро';
  if (diff < 3600) return `через ${Math.floor(diff / 60)} мин`;
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return m > 0 ? `через ${h} ч ${m} мин` : `через ${h} ч`;
  }
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  return h > 0 ? `через ${d} дн ${h} ч` : `через ${d} дн`;
}

interface RowProps {
  label: string;
  icon: string;
  enabled: boolean;
  intervalHours: number;
  lastAt: string | null;
}

function Row({ label, icon, enabled, intervalHours, lastAt }: RowProps) {
  const nextTs =
    enabled && lastAt
      ? new Date(lastAt).getTime() + intervalHours * 3600 * 1000
      : null;
  const overdue = nextTs !== null && nextTs < Date.now() - 5 * 60 * 1000;

  // Цвет точки: серый — выключено, зелёный — всё живо, янтарный — просрочено или ни разу не было
  const dotClass = !enabled
    ? 'bg-slate-300'
    : overdue || !lastAt
      ? 'bg-amber-400 animate-pulse'
      : 'bg-emerald-500';

  const stateText = !enabled
    ? 'выключено'
    : !lastAt
      ? 'ждёт первого запуска'
      : overdue
        ? 'просрочено'
        : 'работает';

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <Icon name={icon} size={13} className="text-slate-500" />
        <span className="font-medium text-slate-700">{label}</span>
      </span>
      <span className="text-slate-400 hidden sm:inline">·</span>
      <span className="text-slate-500 hidden sm:inline">
        каждые {intervalHours} ч
      </span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-600">
        {lastAt ? fmtRelative(lastAt) : <span className="text-amber-600">не запускался</span>}
      </span>
      {enabled && nextTs !== null && (
        <>
          <span className="text-slate-400 hidden md:inline">→</span>
          <span className="text-slate-500 hidden md:inline">
            {fmtCountdown(nextTs)}
          </span>
        </>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ml-1 cursor-help">
            <Icon name="Info" size={12} className="text-slate-400 hover:text-slate-600" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          {label}: {stateText}.<br />
          Интервал: каждые {intervalHours} ч.<br />
          {lastAt && <>Последний раз: {new Date(lastAt).toLocaleString('ru-RU')}.<br /></>}
          {!enabled && 'Включите в разделе «Настройки».'}
          {enabled && overdue && 'Похоже, последний прогон давно — проверьте баланс VseGPT.'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default function AutoPollStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['geo-settings-status'],
    queryFn: () => geoApi.settings.get(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="bg-white border rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
        <Icon name="Loader2" size={13} className="animate-spin" />
        Статус автоопроса…
      </div>
    );
  }

  if (isError || !data?.settings) {
    return (
      <div className="bg-white border rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
        <Icon name="WifiOff" size={13} />
        Статус недоступен
      </div>
    );
  }

  const s = data.settings;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="bg-white border rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <Row
          label="Автоопрос"
          icon="Zap"
          enabled={s.poll_enabled}
          intervalHours={s.poll_interval_hours}
          lastAt={s.last_auto_poll_at}
        />
        <span className="hidden sm:block w-px h-4 bg-slate-200" />
        <Row
          label="Проверка публикаций"
          icon="ShieldCheck"
          enabled={s.pub_check_enabled}
          intervalHours={s.pub_check_interval_hours}
          lastAt={s.last_auto_pub_check_at}
        />
        <Link
          to="/geo/settings"
          className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium hidden sm:inline-flex"
        >
          <Icon name="Settings" size={12} />
          Настроить
        </Link>
      </div>
    </TooltipProvider>
  );
}
