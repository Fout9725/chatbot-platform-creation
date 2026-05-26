import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { geoApi } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface QueryBulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const TEMPLATES: Array<{ id: string; label: string; emoji: string; items: string[] }> = [
  {
    id: 'b2b_saas',
    label: 'B2B SaaS',
    emoji: '💼',
    items: [
      'лучший CRM для малого бизнеса в России',
      'какую систему учёта клиентов выбрать в 2025',
      'облачная CRM с интеграцией WhatsApp',
      'аналоги Битрикс24 для небольшой компании',
      'CRM или ERP — что выбрать стартапу',
      'недорогая CRM с интеграцией 1С',
      'российские CRM-системы с открытым API',
      'как автоматизировать отдел продаж в B2B',
      'облачная система управления проектами для команды до 20 человек',
      'обзор CRM для агентств недвижимости',
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    emoji: '🛒',
    items: [
      'где купить кабель оптом в Москве',
      'надёжные интернет-магазины электротоваров с доставкой по России',
      'обзор лучших магазинов электроники для бизнеса',
      'кабельный завод с поставкой по СНГ',
      'как выбрать поставщика розеток и выключателей',
      'оптовые поставщики электротехники с прайс-листом',
      'рейтинг интернет-магазинов строительных материалов',
      'где заказать промышленное освещение для склада',
      'магазины автоматов защиты и УЗО с доставкой',
      'кто поставляет провода для электромонтажа в крупных объёмах',
    ],
  },
  {
    id: 'services',
    label: 'Услуги',
    emoji: '🛠️',
    items: [
      'юридическая компания для регистрации ООО в Москве',
      'кто помогает с патентами в России',
      'бухгалтерия на аутсорсе для ИП',
      'консалтинг по выходу на маркетплейсы',
      'агентство контекстной рекламы с гарантией результата',
      'обзор клининговых компаний для офиса',
      'логистические компании для интернет-магазина',
      'консультанты по сертификации продукции',
      'юристы по корпоративному праву в РФ',
      'кто помогает с госконтрактами 44-ФЗ',
    ],
  },
  {
    id: 'edu',
    label: 'Образование',
    emoji: '🎓',
    items: [
      'онлайн-курсы по программированию с трудоустройством',
      'где научиться 3D-моделированию для архитектора',
      'обзор школ маркетинга в России 2025',
      'лучшие курсы по продакт-менеджменту',
      'как стать аналитиком данных с нуля',
      'онлайн-школа английского для взрослых',
      'курсы повышения квалификации для бухгалтеров',
      'где пройти MBA онлайн в России',
      'школы для подготовки к ЕГЭ по математике',
      'обучение нейросетям и ChatGPT для бизнеса',
    ],
  },
  {
    id: 'health',
    label: 'Медицина / Wellness',
    emoji: '🏥',
    items: [
      'хорошая частная клиника в Москве для ежегодного обследования',
      'где сдать анализы недорого с быстрым результатом',
      'клиники с программами check-up для топ-менеджеров',
      'фитнес-клуб премиум-класса с бассейном в центре',
      'обзор онлайн-сервисов записи к врачу',
      'центры эстетической медицины с лицензией',
      'клиники МРТ с открытым томографом',
      'стоматология с рассрочкой',
      'клиники репродуктивного здоровья в Москве',
      'где пройти комплексное обследование за один день',
    ],
  },
];

export default function QueryBulkImportDialog({ open, onClose, onImported }: QueryBulkImportDialogProps) {
  const [text, setText] = useState('');

  const mut = useMutation({
    mutationFn: () => {
      const items = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      return geoApi.queries.bulkCreate(items);
    },
    onSuccess: (r) => {
      toast({
        title: 'Импорт завершён',
        description: `Создано: ${r.created}${r.skipped ? `, пропущено дублей: ${r.skipped}` : ''}`,
      });
      onImported();
      setText('');
      onClose();
    },
    onError: (e: Error) => toast({ title: 'Ошибка импорта', description: e.message, variant: 'destructive' }),
  });

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setText(t.items.join('\n'));
    toast({ title: `Шаблон загружен: ${t.label}`, description: `${t.items.length} запросов в поле ниже — можете отредактировать и импортировать.` });
  };

  const lineCount = text.split(/\r?\n/).filter((l) => l.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Upload" size={18} className="text-indigo-600" />
            Массовый импорт запросов
          </DialogTitle>
          <DialogDescription>
            Вставьте список запросов — каждый с новой строки. Дубли пропускаются автоматически.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Готовые шаблоны</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="text-xs p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 text-center transition"
                  title={`${t.items.length} запросов`}
                >
                  <div className="text-lg leading-none mb-0.5">{t.emoji}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="bulk-text" className="flex items-center justify-between">
              <span>Запросы (каждый с новой строки)</span>
              {lineCount > 0 && (
                <span className="text-xs text-indigo-600 font-medium">{lineCount} запросов</span>
              )}
            </Label>
            <Textarea
              id="bulk-text"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'лучший CRM для малого бизнеса\nгде купить кабель оптом в Москве\nкак выбрать поставщика розеток\n…'}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">Максимум 200 запросов за раз.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => mut.mutate()} disabled={!lineCount || mut.isPending}>
            {mut.isPending ? (
              <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Импортируем…</>
            ) : (
              <><Icon name="Upload" size={14} className="mr-2" />Импортировать {lineCount > 0 ? `(${lineCount})` : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
