import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const steps = [
  {
    title: 'Выберите способ создания',
    subtitle: 'Шаблон или кастомная настройка',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-violet-50 border-2 border-violet-200">
            <div className="text-2xl mb-2">📦</div>
            <h5 className="font-semibold text-sm">Шаблоны</h5>
            <p className="text-xs text-muted-foreground mt-1">
              Готовые автоматизации — выберите и заполните пару полей
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
            <div className="text-2xl mb-2">⚙️</div>
            <h5 className="font-semibold text-sm">Кастомная настройка</h5>
            <p className="text-xs text-muted-foreground mt-1">
              Полный контроль — укажите все API-ключи и параметры вручную
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Перейдите на соответствующую вкладку вверху страницы
        </p>
      </div>
    ),
  },
  {
    title: 'Заполните данные',
    subtitle: 'API-ключи и настройки',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-sm font-medium">Anthropic API Key</span>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">обязательно</span>
          </div>
          <div className="h-8 rounded bg-muted border border-dashed border-muted-foreground/30 flex items-center px-3">
            <span className="text-xs text-muted-foreground">sk-ant-api03-...</span>
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-medium">OpenAI API Key</span>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">обязательно</span>
          </div>
          <div className="h-8 rounded bg-muted border border-dashed border-muted-foreground/30 flex items-center px-3">
            <span className="text-xs text-muted-foreground">sk-proj-...</span>
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-sm font-medium">Google Sheet ID</span>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">обязательно</span>
          </div>
          <div className="h-8 rounded bg-muted border border-dashed border-muted-foreground/30 flex items-center px-3">
            <span className="text-xs text-muted-foreground">1A2B3C4D5E6F...</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>💡</span> Нажмите «Проверить» рядом с каждым ключом для валидации
        </p>
      </div>
    ),
  },
  {
    title: 'Сгенерируйте и скачайте',
    subtitle: 'Готовый JSON-файл',
    content: (
      <div className="space-y-4">
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-20 h-24 rounded-lg bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/30 flex flex-col items-center justify-center">
              <span className="text-2xl">📄</span>
              <span className="text-[10px] font-mono text-muted-foreground mt-1">.json</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
          <p className="text-sm font-medium mt-4">n8n-workflow.json</p>
          <p className="text-xs text-muted-foreground">Все ваши данные уже внутри</p>
        </div>
        <div className="flex gap-2 justify-center">
          <div className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
            📥 Скачать JSON
          </div>
          <div className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1">
            📋 Копировать
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Импортируйте в n8n',
    subtitle: 'Загрузите файл в платформу',
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            { num: '1', text: 'Откройте n8n (локально или облако)' },
            { num: '2', text: 'Нажмите ⋮ в правом верхнем углу' },
            { num: '3', text: 'Выберите «Import from File»' },
            { num: '4', text: 'Загрузите скачанный JSON' },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                {item.num}
              </div>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 flex items-start gap-1">
            <span className="flex-shrink-0">⚠️</span>
            <span>Для Google Sheets и Telegram настройте Credentials отдельно в n8n</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Активируйте!',
    subtitle: 'Запустите автоматизацию',
    content: (
      <div className="flex flex-col items-center py-6">
        <div className="relative mb-4">
          <div className="w-16 h-9 rounded-full bg-green-500 flex items-center justify-end pr-1">
            <div className="w-7 h-7 rounded-full bg-white shadow-sm" />
          </div>
        </div>
        <p className="text-sm font-medium">Переключатель «Active»</p>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Находится в правом верхнем углу n8n.<br />
          После включения workflow работает по расписанию.
        </p>
        <div className="mt-4 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          🎉 Готово — автоматизация запущена!
        </div>
      </div>
    ),
  },
];

const InteractiveStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const goPrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : index < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < currentStep ? (
              <Icon name="Check" size={12} />
            ) : (
              <span>{index + 1}</span>
            )}
            <span className="hidden sm:inline">{step.title.split(' ').slice(0, 2).join(' ')}</span>
          </button>
        ))}
      </div>

      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <Card className="border-2">
        <CardContent className="p-5">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground font-medium">
              Шаг {currentStep + 1} из {steps.length}
            </p>
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].subtitle}</p>
          </div>

          <div className="min-h-[200px]">
            {steps[currentStep].content}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          <Icon name="ChevronLeft" size={16} />
          Назад
        </Button>
        <Button
          size="sm"
          onClick={goNext}
          disabled={currentStep === steps.length - 1}
        >
          {currentStep === steps.length - 2 ? 'Финиш' : 'Далее'}
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>
    </div>
  );
};

export default InteractiveStepper;
