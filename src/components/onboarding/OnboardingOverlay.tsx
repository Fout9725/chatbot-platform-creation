import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import OnboardingMascot from './OnboardingMascot';

const STORAGE_KEY = 'intellectpro-onboarding-done';

interface OnboardingStep {
  title: string;
  text: string;
  mascotMood: 'waving' | 'happy' | 'thinking' | 'excited';
  icon: string;
  color: string;
  features?: string[];
}

const steps: OnboardingStep[] = [
  {
    title: 'Добро пожаловать в ИнтеллектПро!',
    text: 'Я — ваш помощник. Покажу, как здесь всё устроено. Пройдёмся по основным возможностям платформы — это займёт меньше минуты.',
    mascotMood: 'waving',
    icon: 'Rocket',
    color: 'from-violet-500 to-purple-600',
    features: [
      'Создание ИИ-ботов и агентов',
      'Автоматизация соцсетей',
      'Конструктор без кода',
    ],
  },
  {
    title: 'Маркетплейс ботов',
    text: 'На главной странице — каталог готовых ИИ-ботов. Можно выбрать бота, посмотреть его возможности и активировать в один клик.',
    mascotMood: 'happy',
    icon: 'Store',
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Готовые боты для разных задач',
      'Рейтинги и отзывы',
      'Активация в один клик',
    ],
  },
  {
    title: 'Конструктор ботов',
    text: 'Хотите своего бота? В конструкторе можно собрать его из блоков — без программирования. Или использовать режим с кодом для продвинутых настроек.',
    mascotMood: 'thinking',
    icon: 'Boxes',
    color: 'from-emerald-500 to-teal-500',
    features: [
      'Визуальный редактор (drag & drop)',
      'Режим с кодом для продвинутых',
      'Шаблоны для быстрого старта',
    ],
  },
  {
    title: 'Автоматизация соцсетей',
    text: 'Раздел «Автоматизация» — готовые workflow для Instagram, Telegram, YouTube, VK и TikTok. Генерируйте контент и публикуйте по расписанию.',
    mascotMood: 'excited',
    icon: 'Zap',
    color: 'from-orange-500 to-amber-500',
    features: [
      'Instagram — автопостинг с ИИ',
      'Telegram — боты и каналы',
      'YouTube, VK, TikTok — идеи и контент',
    ],
  },
  {
    title: 'Панель управления',
    text: 'В личном кабинете — статистика ваших ботов, управление подпиской и настройки профиля. Всё в одном месте.',
    mascotMood: 'happy',
    icon: 'LayoutDashboard',
    color: 'from-pink-500 to-rose-500',
    features: [
      'Статистика и аналитика',
      'Управление подпиской',
      'Уведомления о событиях',
    ],
  },
  {
    title: 'Вы готовы!',
    text: 'Отлично! Теперь вы знаете основы. Начните с маркетплейса или создайте своего первого бота в конструкторе. Удачи!',
    mascotMood: 'excited',
    icon: 'PartyPopper',
    color: 'from-violet-500 to-blue-500',
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const OnboardingOverlay = ({ onComplete }: OnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(() => onComplete(), 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm" />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={handleComplete}
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10 flex items-center gap-1.5 text-sm"
      >
        Пропустить
        <Icon name="X" size={18} />
      </button>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`relative w-full max-w-lg mx-4 transition-all duration-500 ${
          isVisible && !isExiting ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-white/5 animate-pulse-ring" />
            </div>
            <OnboardingMascot mood={step.mascotMood} size={130} />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
              <Icon name={step.icon} size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">
                Шаг {currentStep + 1} из {steps.length}
              </p>
              <h2 className="text-xl font-bold text-white font-[Montserrat]">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {step.text}
          </p>

          {step.features && (
            <div className="space-y-2 mb-4">
              {step.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-white/70"
                  style={{ animation: `fade-in 0.3s ease-out ${i * 0.1}s both` }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
                  {feature}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-8 bg-white'
                    : i < currentStep
                      ? 'w-3 bg-white/40'
                      : 'w-3 bg-white/15'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handlePrev}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Icon name="ChevronLeft" size={18} />
                Назад
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 bg-gradient-to-r ${step.color} hover:opacity-90 text-white border-0`}
            >
              {isLast ? (
                <>
                  Начать работу
                  <Icon name="ArrowRight" size={18} className="ml-2" />
                </>
              ) : (
                <>
                  Далее
                  <Icon name="ChevronRight" size={18} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { STORAGE_KEY };
export default OnboardingOverlay;
