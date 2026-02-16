import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import VisualGuide from './VisualGuide';
import InteractiveStepper from './InteractiveStepper';

type GuideMode = 'select' | 'visual' | 'stepper';

const InstructionsTab = () => {
  const [mode, setMode] = useState<GuideMode>('select');

  if (mode === 'visual') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('select')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад к выбору формата
        </button>
        <VisualGuide />
        <InfoBlocks />
      </div>
    );
  }

  if (mode === 'stepper') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('select')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад к выбору формата
        </button>
        <InteractiveStepper />
        <InfoBlocks />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="GraduationCap" size={20} />
          Как создать workflow?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите удобный формат инструкции — содержание одинаковое, отличается только подача.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-md transition-all group"
          onClick={() => setMode('visual')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="BookOpen" size={24} className="text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold">Визуальный гайд</h4>
                <span className="text-xs text-muted-foreground">с картинками</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Все 5 шагов на одной странице. Нажимайте на любой шаг — раскроются подробности и подсказки. Удобно, если хотите видеть весь процесс целиком.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
              <Icon name="LayoutList" size={14} />
              Обзор всех шагов сразу
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-md transition-all group"
          onClick={() => setMode('stepper')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon name="Play" size={24} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">Пошаговый режим</h4>
                <span className="text-xs text-muted-foreground">интерактивный</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Проходите шаг за шагом с кнопками «Далее» и «Назад». Каждый шаг показывается отдельно с наглядными примерами. Удобно для первого раза.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
              <Icon name="Footprints" size={14} />
              Шаг за шагом с прогрессом
            </div>
          </CardContent>
        </Card>
      </div>

      <InfoBlocks />
    </div>
  );
};

const InfoBlocks = () => (
  <>
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold flex items-center gap-2 text-blue-900">
        <Icon name="HelpCircle" size={18} />
        Что такое n8n?
      </h4>
      <p className="text-sm text-blue-800 mt-1">
        n8n — бесплатная open-source платформа для автоматизаций (аналог Zapier/Make). 
        Можно поставить локально или использовать <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="underline">облачную версию</a>.
      </p>
    </div>

    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <h4 className="font-semibold flex items-center gap-2 text-amber-900">
        <Icon name="AlertTriangle" size={18} />
        Важно
      </h4>
      <ul className="text-sm text-amber-800 list-disc pl-4 mt-2 space-y-1">
        <li>API-ключи встраиваются в JSON — храните файл в безопасности</li>
        <li>Для Google Sheets нужно настроить OAuth2 в n8n (credentials)</li>
        <li>Для Telegram-ботов — создайте бота через @BotFather и получите токен</li>
        <li>n8n можно установить бесплатно через Docker: <code className="bg-muted px-1 rounded">docker run -it --name n8n -p 5678:5678 n8nio/n8n</code></li>
      </ul>
    </div>
  </>
);

export default InstructionsTab;
