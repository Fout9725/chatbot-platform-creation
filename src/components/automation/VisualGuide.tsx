import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const steps = [
  {
    title: 'Выберите шаблон или создайте свой',
    description: 'Перейдите во вкладку «Шаблоны» для готовых автоматизаций или «Instagram» для кастомной настройки.',
    icon: 'LayoutGrid',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    details: [
      'Шаблоны — готовые решения для Telegram, email, CRM, контента',
      'Кастомная настройка — полный контроль над параметрами',
      'Можно начать с шаблона и потом доработать в n8n',
    ],
    image: '🗂️',
  },
  {
    title: 'Заполните свои данные',
    description: 'Введите API-ключи, ID таблиц и токены. Всё встроится прямо в файл автоматизации.',
    icon: 'KeyRound',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    details: [
      'Anthropic API Key — для генерации текстов (Claude)',
      'OpenAI API Key — для создания изображений (DALL-E 3)',
      'Google Sheet ID — откуда брать/куда писать данные',
      'Кнопка «Проверить» валидирует ключи перед генерацией',
    ],
    image: '🔑',
  },
  {
    title: 'Скачайте JSON-файл',
    description: 'Нажмите «Скачать JSON» во вкладке Workflow. Файл полностью готов к импорту.',
    icon: 'Download',
    color: 'bg-green-100 text-green-700 border-green-200',
    details: [
      'JSON содержит все ваши данные — никаких плейсхолдеров',
      'Можно также скопировать в буфер обмена',
      'Файл сохранится как n8n-workflow.json',
    ],
    image: '📥',
  },
  {
    title: 'Импортируйте в n8n',
    description: 'В n8n нажмите ⋮ → Import from File → загрузите скачанный JSON.',
    icon: 'Upload',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    details: [
      'Откройте n8n (локально или облако)',
      'Нажмите три точки (⋮) в правом верхнем углу',
      'Выберите «Import from File»',
      'Загрузите скачанный JSON файл',
      'Для Google Sheets настройте Credentials в n8n',
    ],
    image: '⬆️',
  },
  {
    title: 'Активируйте автоматизацию',
    description: 'Переведите переключатель «Active» — и всё заработает по расписанию!',
    icon: 'Zap',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    details: [
      'Переключатель находится в правом верхнем углу n8n',
      'После активации workflow запускается автоматически',
      'Проверьте логи первого запуска на вкладке Executions',
    ],
    image: '⚡',
  },
];

const VisualGuide = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isExpanded = expandedStep === index;

        return (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-md ${
              isExpanded ? step.color : 'border-transparent hover:border-muted'
            }`}
            onClick={() => setExpandedStep(isExpanded ? null : index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isExpanded ? step.color : 'bg-muted'
                } transition-colors duration-300`}>
                  {step.image}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">ШАГ {index + 1}</span>
                    <Icon
                      name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                      className="text-muted-foreground"
                    />
                  </div>
                  <h4 className="font-semibold mt-0.5">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-primary flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VisualGuide;
