import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import OnboardingMascot from './OnboardingMascot';

const STORAGE_KEY = 'intellectpro-onboarding-done';

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingStep {
  title: string;
  text: string;
  details: string[];
  mascotMood: 'waving' | 'happy' | 'thinking' | 'excited';
  icon: string;
  color: string;
  selector: string | null;
  tooltipPosition: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

const steps: OnboardingStep[] = [
  {
    title: 'Добро пожаловать в ИнтеллектПро!',
    text: 'Я — ваш персональный помощник. Сейчас проведу быструю экскурсию по платформе. Буду подсвечивать важные элементы прямо на экране.',
    details: [
      'Платформа для создания ИИ-ботов и агентов',
      'Автоматизация соцсетей без программирования',
      'Готовые решения + конструктор',
      'Экскурсия займёт меньше минуты',
    ],
    mascotMood: 'waving',
    icon: 'Rocket',
    color: 'from-violet-500 to-purple-600',
    selector: null,
    tooltipPosition: 'center',
  },
  {
    title: 'Шапка сайта — навигация',
    text: 'Вверху — главное меню. Отсюда вы попадёте в любой раздел: автоматизация, документация, юридическая информация, уведомления и ваш профиль.',
    details: [
      '«Автоматизация» — workflow для соцсетей',
      '«Документация» — справка по платформе',
      '«Войти» — регистрация и авторизация',
      '«Уведомления» — события и обновления',
    ],
    mascotMood: 'happy',
    icon: 'Navigation',
    color: 'from-blue-500 to-cyan-500',
    selector: 'header',
    tooltipPosition: 'bottom',
  },
  {
    title: 'Маркетплейс ботов',
    text: 'Это каталог готовых ИИ-ботов. Здесь можно выбрать бота под задачу — для продаж, поддержки клиентов, генерации контента. Активируйте бота в один клик.',
    details: [
      'Фильтры по категориям и задачам',
      'Рейтинги и описание каждого бота',
      'Кнопка «Активировать» запускает бота',
      'Бот сразу появится в «Мои боты»',
    ],
    mascotMood: 'happy',
    icon: 'Store',
    color: 'from-emerald-500 to-teal-500',
    selector: '[data-onboarding="marketplace"]',
    tooltipPosition: 'bottom',
  },
  {
    title: 'Конструктор — создайте своего бота',
    text: 'Кнопка «Конструктор» открывает редактор, где вы собираете бота из блоков. Есть визуальный режим (drag & drop) и режим с кодом для продвинутых.',
    details: [
      'Визуальный режим — перетаскивайте блоки',
      'Режим с кодом — полный контроль логики',
      'Шаблоны для быстрого старта',
      'Нужна подписка — бесплатные пользователи увидят тарифы',
    ],
    mascotMood: 'thinking',
    icon: 'Boxes',
    color: 'from-orange-500 to-amber-500',
    selector: '[data-onboarding="constructor"]',
    tooltipPosition: 'bottom',
  },
  {
    title: 'Мои боты — ваша коллекция',
    text: 'Все активированные и созданные боты хранятся здесь. Вы можете управлять ими, смотреть статистику и редактировать настройки.',
    details: [
      'Список всех ваших ботов',
      'Статус: активен / остановлен',
      'Статистика сообщений и взаимодействий',
      'Настройка и редактирование каждого бота',
    ],
    mascotMood: 'happy',
    icon: 'Folder',
    color: 'from-pink-500 to-rose-500',
    selector: '[data-onboarding="my-bots"]',
    tooltipPosition: 'bottom',
  },
  {
    title: 'Вы готовы к старту!',
    text: 'Отлично, теперь вы знаете где что находится! Начните с маркетплейса — выберите готового бота. Или сразу создайте своего в конструкторе. Удачного полёта!',
    details: [
      'Маркетплейс — самый быстрый старт',
      'Конструктор — для уникальных ботов',
      'Автоматизация — для соцсетей',
      'Вопросы? Напишите в поддержку',
    ],
    mascotMood: 'excited',
    icon: 'PartyPopper',
    color: 'from-violet-500 to-blue-500',
    selector: null,
    tooltipPosition: 'center',
  },
];

interface Props {
  onComplete: () => void;
}

const OnboardingOverlay = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [expanded, setExpanded] = useState(false);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateHighlight = useCallback(() => {
    const sel = steps[currentStep].selector;
    if (!sel) {
      setHighlight(null);
      return;
    }
    const el = document.querySelector(sel);
    if (!el) {
      setHighlight(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = 8;
    setHighlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
  }, [currentStep]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    setExpanded(false);
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, updateHighlight]);

  const handleNext = () => {
    if (isLast) return handleComplete();
    setCurrentStep((p) => p + 1);
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleComplete = () => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(() => onComplete(), 400);
  };

  const tooltipStyle = (): React.CSSProperties => {
    if (!highlight || step.tooltipPosition === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const gap = 16;
    const base: React.CSSProperties = { position: 'fixed' };

    if (step.tooltipPosition === 'bottom') {
      base.top = highlight.top + highlight.height + gap;
      base.left = Math.max(16, Math.min(highlight.left, window.innerWidth - 420));
    } else if (step.tooltipPosition === 'top') {
      base.bottom = window.innerHeight - highlight.top + gap;
      base.left = Math.max(16, Math.min(highlight.left, window.innerWidth - 420));
    } else if (step.tooltipPosition === 'right') {
      base.top = highlight.top;
      base.left = highlight.left + highlight.width + gap;
    } else {
      base.top = highlight.top;
      base.right = window.innerWidth - highlight.left + gap;
    }

    return base;
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-500 ${
        isVisible && !isExiting ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {highlight && (
              <rect
                x={highlight.left}
                y={highlight.top}
                width={highlight.width}
                height={highlight.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {highlight && (
        <div
          className="absolute rounded-xl border-2 border-white/40 pointer-events-none"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 4px rgba(139,92,246,0.3), 0 0 30px rgba(139,92,246,0.2)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse-ring"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}

      <button
        onClick={handleComplete}
        className="fixed top-4 right-4 z-[10000] text-white/50 hover:text-white transition-colors flex items-center gap-1.5 text-sm bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm"
      >
        Пропустить
        <Icon name="X" size={16} />
      </button>

      <div className="fixed top-0 left-0 right-0 h-1 z-[10000] bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="z-[10000] w-[400px] max-w-[calc(100vw-32px)]"
        style={{
          ...tooltipStyle(),
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex items-end gap-2 mb-2">
          <OnboardingMascot mood={step.mascotMood} size={80} />
          {step.tooltipPosition !== 'center' && highlight && (
            <div className="text-xs text-white/50 mb-2">
              ↑ Обратите внимание на подсвеченную область
            </div>
          )}
        </div>

        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                <Icon name={step.icon} size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                  Шаг {currentStep + 1} из {steps.length}
                </p>
                <h2 className="text-base font-bold text-white font-[Montserrat] leading-tight">
                  {step.title}
                </h2>
              </div>
            </div>

            <p className="text-white/75 text-sm leading-relaxed">
              {step.text}
            </p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
              {expanded ? 'Свернуть' : 'Подробнее'}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                expanded ? 'max-h-60 opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1.5 pb-1">
                {step.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gradient-to-r ${step.color}`} />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-3">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-6 bg-white'
                      : i < currentStep
                        ? 'w-2.5 bg-white/40'
                        : 'w-2.5 bg-white/15'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="text-white/60 hover:text-white hover:bg-white/10 h-9"
                >
                  <Icon name="ChevronLeft" size={16} />
                  Назад
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className={`flex-1 bg-gradient-to-r ${step.color} hover:opacity-90 text-white border-0 h-9`}
              >
                {isLast ? (
                  <>
                    Начать работу
                    <Icon name="ArrowRight" size={16} className="ml-1" />
                  </>
                ) : (
                  <>
                    Далее
                    <Icon name="ChevronRight" size={16} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { STORAGE_KEY };
export default OnboardingOverlay;