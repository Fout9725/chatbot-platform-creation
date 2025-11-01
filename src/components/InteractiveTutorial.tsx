import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: string;
  highlight?: string;
}

interface InteractiveTutorialProps {
  mode: 'professional' | 'visual';
  onComplete?: () => void;
}

const professionalSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Добро пожаловать в профессиональный режим',
    description: 'Здесь вы можете создавать сложных ботов с помощью кода. Давайте пройдем краткий тур по интерфейсу.',
    icon: 'Rocket',
  },
  {
    id: 2,
    title: 'Редактор кода',
    description: 'Используйте встроенный редактор для написания логики бота. Поддерживаются JavaScript/TypeScript, автодополнение и подсветка синтаксиса.',
    icon: 'Code2',
    highlight: 'editor'
  },
  {
    id: 3,
    title: 'API интеграции',
    description: 'Подключайте внешние API через панель интеграций. Добавляйте заголовки, параметры и обрабатывайте ответы.',
    icon: 'Link',
    highlight: 'api-panel'
  },
  {
    id: 4,
    title: 'Тестирование',
    description: 'Нажмите "Тест" для проверки бота в эмуляторе. Просматривайте логи запросов и отладочную информацию.',
    icon: 'Play',
    action: 'test'
  },
  {
    id: 5,
    title: 'Деплой',
    description: 'Готовы к запуску? Нажмите "Опубликовать" для развертывания бота на production сервер.',
    icon: 'Upload',
    action: 'deploy'
  }
];

const visualSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Добро пожаловать в визуальный конструктор',
    description: 'Создавайте ботов без программирования! Перетаскивайте блоки и соединяйте их для создания диалогов.',
    icon: 'Workflow',
  },
  {
    id: 2,
    title: 'Панель блоков',
    description: 'Слева находятся готовые блоки: Старт, Сообщение, Вопрос, Условие, Действие, Конец. Перетащите любой блок на холст.',
    icon: 'Blocks',
    highlight: 'blocks-panel'
  },
  {
    id: 3,
    title: 'Холст для создания',
    description: 'Центральная область — это ваш холст. Размещайте блоки и соединяйте их для построения логики диалога.',
    icon: 'Palette',
    highlight: 'canvas'
  },
  {
    id: 4,
    title: 'Редактирование блоков',
    description: 'Кликните на блок для редактирования текста и добавления вариантов ответов. Все настройки справа в панели свойств.',
    icon: 'Edit',
    highlight: 'properties-panel'
  },
  {
    id: 5,
    title: 'Тестирование и экспорт',
    description: 'Нажмите "Тест" для проверки диалога или "Экспорт" для сохранения конфигурации бота.',
    icon: 'CheckCircle',
    action: 'test'
  }
];

const InteractiveTutorial = ({ mode, onComplete }: InteractiveTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const steps = mode === 'professional' ? professionalSteps : visualSteps;

  useEffect(() => {
    const tutorialShown = localStorage.getItem(`tutorial-${mode}-shown`);
    if (tutorialShown) {
      setIsVisible(false);
    }
  }, [mode]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`tutorial-${mode}-shown`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleComplete = () => {
    localStorage.setItem(`tutorial-${mode}-shown`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                <Icon name={step.icon as any} size={24} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription>
                  Шаг {currentStep + 1} из {steps.length}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <Icon name="X" size={18} />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
            <p className="text-base leading-relaxed">{step.description}</p>
          </div>

          {step.highlight && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="Lightbulb" size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Подсказка</h4>
                  <p className="text-sm text-yellow-800">
                    Обратите внимание на выделенную область интерфейса
                  </p>
                </div>
              </div>
            </div>
          )}

          {step.action && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={20} className="text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Попробуйте</h4>
                  <p className="text-sm text-green-800">
                    После закрытия туториала найдите кнопку "{step.action === 'test' ? 'Тест' : 'Опубликовать'}" и попробуйте её
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <Icon name="ChevronLeft" size={18} className="mr-2" />
              Назад
            </Button>

            <Button variant="ghost" onClick={handleSkip}>
              Пропустить
            </Button>

            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  Завершить
                  <Icon name="Check" size={18} className="ml-2" />
                </>
              ) : (
                <>
                  Далее
                  <Icon name="ChevronRight" size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveTutorial;
