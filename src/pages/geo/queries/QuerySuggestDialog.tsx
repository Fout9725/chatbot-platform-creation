import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { geoApi, GeoQuerySuggestion } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { CATEGORY_META, FOCUS_OPTIONS, INTENT_META } from './queriesHelpers';

interface QuerySuggestDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: (count: number) => void;
}

export default function QuerySuggestDialog({ open, onClose, onAdded }: QuerySuggestDialogProps) {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('Россия');
  const [count, setCount] = useState(20);
  const [focus, setFocus] = useState<typeof FOCUS_OPTIONS[number]['id']>('all');
  const [extra, setExtra] = useState('');
  const [suggestions, setSuggestions] = useState<GeoQuerySuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [ctx, setCtx] = useState<{ own_brand: string | null; competitors_count: number } | null>(null);

  const suggestMut = useMutation({
    mutationFn: () =>
      geoApi.queries.suggest({
        industry: industry.trim() || undefined,
        region: region.trim() || 'Россия',
        count,
        focus,
        extra_context: extra.trim() || undefined,
      }),
    onSuccess: (r) => {
      setSuggestions(r.suggestions);
      setSelected(new Set(r.suggestions.map((_, i) => i)));
      setCtx(r.context);
      if (r.suggestions.length === 0) {
        toast({ title: 'Ничего не сгенерировалось', description: 'Попробуйте уточнить нишу или контекст.', variant: 'destructive' });
      }
    },
    onError: (e: Error) => toast({ title: 'Ошибка генерации', description: e.message, variant: 'destructive' }),
  });

  const addMut = useMutation({
    mutationFn: () => {
      const items = Array.from(selected).map((i) => {
        const s = suggestions[i];
        return {
          text: s.text,
          category: s.category,
          intent: s.intent,
          notes: s.reason ? `[AI] ${s.reason}` : null,
          source: 'ai_suggest',
        };
      });
      return geoApi.queries.bulkCreate(items);
    },
    onSuccess: (r) => {
      toast({
        title: 'Добавлено в список',
        description: `Создано: ${r.created}${r.skipped ? `, пропущено дублей: ${r.skipped}` : ''}`,
      });
      onAdded(r.created);
      reset();
      onClose();
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const reset = () => {
    setSuggestions([]);
    setSelected(new Set());
    setCtx(null);
    setExtra('');
  };

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === suggestions.length) setSelected(new Set());
    else setSelected(new Set(suggestions.map((_, i) => i)));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
              <Icon name="Sparkles" size={16} />
            </span>
            ИИ-помощник: запросы под ваш бренд
          </DialogTitle>
          <DialogDescription>
            GPT проанализирует вашу нишу, бренд и конкурентов, и предложит реалистичные запросы,
            которые ваши клиенты задают нейросетям при выборе.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="industry">Ниша / отрасль</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Например: интернет-магазин электроники, B2B SaaS, юр. услуги"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Если бренд уже добавлен — можно оставить пустым.
                </p>
              </div>
              <div>
                <Label htmlFor="region">Регион</Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Россия / Москва / СНГ" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Тип запросов</Label>
              <div className="grid grid-cols-5 gap-2">
                {FOCUS_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFocus(f.id)}
                    className={`text-xs p-2.5 rounded-lg border transition text-center ${
                      focus === f.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                    }`}
                    title={f.hint}
                  >
                    <div className="text-lg leading-none mb-1">{f.emoji}</div>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="count" className="flex items-center justify-between">
                <span>Сколько запросов сгенерировать</span>
                <span className="text-indigo-600 font-semibold">{count}</span>
              </Label>
              <input
                id="count"
                type="range"
                min={10}
                max={30}
                step={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </div>

            <div>
              <Label htmlFor="extra">Дополнительный контекст <span className="text-slate-400 font-normal">(необязательно)</span></Label>
              <Textarea
                id="extra"
                rows={2}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Например: целимся в малый бизнес, основное преимущество — бесплатная доставка по РФ"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-xs text-blue-900">
              <Icon name="Info" size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <div>
                ИИ не упоминает ваш бренд в коммерческих/сравнительных запросах — иначе LLM не сможет
                «сама» его рекомендовать. Это правильный подход для GEO/AEO.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Отмена</Button>
              <Button onClick={() => suggestMut.mutate()} disabled={suggestMut.isPending}>
                {suggestMut.isPending ? (
                  <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Анализирую…</>
                ) : (
                  <><Icon name="Sparkles" size={14} className="mr-2" />Сгенерировать</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            {ctx && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900">
                <div className="font-medium mb-0.5">
                  Готово! Сгенерировано {suggestions.length} запросов
                </div>
                <div className="text-indigo-700">
                  {ctx.own_brand && <>Бренд: <b>{ctx.own_brand}</b> · </>}
                  Учтено конкурентов: <b>{ctx.competitors_count}</b>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={toggleAll}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selected.size === suggestions.length ? '✕ Снять выделение' : '✓ Выбрать все'}
              </button>
              <span className="text-slate-500">Выбрано: <b>{selected.size}</b> из {suggestions.length}</span>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {suggestions.map((s, i) => {
                const cat = CATEGORY_META[s.category];
                const intent = INTENT_META[s.intent];
                const isSelected = selected.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggle(i)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${
                      isSelected ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200' : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Icon name="Check" size={11} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 leading-snug font-medium mb-1.5">
                          {s.text}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${cat.cls}`}>
                            <Icon name={cat.icon} size={10} />
                            {cat.label}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                            {intent.label}
                          </span>
                          {s.mentions_own && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full" title="Запрос содержит имя бренда">
                              упоминает бренд
                            </span>
                          )}
                        </div>
                        {s.reason && (
                          <div className="text-[11px] text-slate-500 italic leading-snug">
                            💡 {s.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => reset()}>
                <Icon name="RotateCcw" size={14} className="mr-1.5" />
                Перегенерировать
              </Button>
              <Button
                onClick={() => addMut.mutate()}
                disabled={selected.size === 0 || addMut.isPending}
              >
                {addMut.isPending ? (
                  <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Добавление…</>
                ) : (
                  <><Icon name="Plus" size={14} className="mr-2" />Добавить выбранные ({selected.size})</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
