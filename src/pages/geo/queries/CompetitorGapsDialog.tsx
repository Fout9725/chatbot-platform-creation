import { useQuery } from '@tanstack/react-query';
import { geoApi, GeoCompetitorGap } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { CATEGORY_META } from './queriesHelpers';

interface CompetitorGapsDialogProps {
  open: boolean;
  onClose: () => void;
  onAskAI: (extraContext: string) => void;
}

export default function CompetitorGapsDialog({ open, onClose, onAskAI }: CompetitorGapsDialogProps) {
  const q = useQuery({
    queryKey: ['geo-competitor-gaps'],
    queryFn: () => geoApi.queries.competitorGaps(14),
    enabled: open,
  });

  const gaps = q.data?.gaps || [];
  const weak = q.data?.weak_spots || [];

  const handleAskAI = () => {
    const topCompetitors = new Set<string>();
    [...gaps, ...weak].forEach((g) => {
      g.top_competitors.forEach((c) => topCompetitors.add(c.name));
    });
    const list = Array.from(topCompetitors).slice(0, 5);
    const context = list.length
      ? `Наши конкуренты, которые выигрывают в ответах LLM: ${list.join(', ')}. Сгенерируй запросы, в которых клиенты ищут именно такие услуги/товары — чтобы получить шанс попасть в их ответы рядом с конкурентами.`
      : 'Сгенерируй запросы, которые активно ищут в нашей нише и где есть упоминания других брендов.';
    onAskAI(context);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Swords" size={18} className="text-rose-600" />
            Где выигрывают конкуренты
          </DialogTitle>
          <DialogDescription>
            Анализ за последние 14 дней. Запросы, где нейросети упоминают конкурентов чаще или вместо вас.
          </DialogDescription>
        </DialogHeader>

        {q.isLoading ? (
          <div className="py-10 text-center text-slate-400 text-sm">Анализирую данные…</div>
        ) : gaps.length === 0 && weak.length === 0 ? (
          <div className="py-10 text-center bg-emerald-50 border border-emerald-200 rounded-xl">
            <Icon name="Trophy" size={36} className="text-emerald-500 mx-auto mb-2" />
            <div className="font-medium text-emerald-800">Отличный результат!</div>
            <div className="text-sm text-emerald-700 mt-1">
              Сейчас нет запросов, где конкуренты явно выигрывают.
              <br />Добавьте больше запросов, чтобы получить расширенный анализ.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {gaps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Icon name="AlertTriangle" size={13} />
                  </span>
                  <h3 className="font-semibold text-sm text-rose-700">
                    Полные провалы ({gaps.length})
                  </h3>
                  <span className="text-xs text-slate-500">— нас не упомянули ни разу, конкурентов упомянули</span>
                </div>
                <div className="space-y-2">
                  {gaps.map((g) => <GapRow key={g.id} g={g} kind="gap" />)}
                </div>
              </div>
            )}

            {weak.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Icon name="TrendingDown" size={13} />
                  </span>
                  <h3 className="font-semibold text-sm text-amber-700">
                    Слабые места ({weak.length})
                  </h3>
                  <span className="text-xs text-slate-500">— нас упоминают, но конкурентов чаще</span>
                </div>
                <div className="space-y-2">
                  {weak.map((g) => <GapRow key={g.id} g={g} kind="weak" />)}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
          {(gaps.length > 0 || weak.length > 0) && (
            <Button onClick={handleAskAI}>
              <Icon name="Sparkles" size={14} className="mr-2" />
              Попросить ИИ предложить запросы под эти ниши
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GapRow({ g, kind }: { g: GeoCompetitorGap; kind: 'gap' | 'weak' }) {
  const cat = g.category ? CATEGORY_META[g.category] : null;
  const ratio = g.responses ? Math.round((g.competitor_mentions / Math.max(1, g.responses)) * 100) : 0;
  return (
    <div
      className={`border rounded-lg p-3 ${
        kind === 'gap' ? 'border-rose-200 bg-rose-50/30' : 'border-amber-200 bg-amber-50/30'
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        {cat && (
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${cat.cls} flex-shrink-0 mt-0.5`}>
            <Icon name={cat.icon} size={10} />
            {cat.label}
          </span>
        )}
        <div className="text-sm text-slate-800 leading-snug font-medium flex-1">{g.text}</div>
      </div>
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-slate-500">
          Ответов LLM: <b className="text-slate-700">{g.responses}</b>
        </span>
        <span className="text-emerald-700">
          Свои: <b>{g.own_mentions}</b>
        </span>
        <span className="text-rose-700">
          Конкуренты: <b>{g.competitor_mentions}</b>
        </span>
        {g.top_competitors.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-slate-500">
            <Icon name="Target" size={11} />
            Выигрывают:{' '}
            <b className="text-slate-700">
              {g.top_competitors.map((c) => `${c.name} (${c.count})`).join(', ')}
            </b>
          </span>
        )}
      </div>
      {kind === 'weak' && (
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400" style={{ width: `${ratio}%` }} />
        </div>
      )}
    </div>
  );
}
