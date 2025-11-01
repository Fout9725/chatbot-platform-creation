import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface ConstructorModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConstructorModeModal = ({ isOpen, onClose }: ConstructorModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<'professional' | 'visual' | null>(null);

  const handleModeSelect = (mode: 'professional' | 'visual') => {
    setSelectedMode(mode);
  };

  const handleStartWork = () => {
    if (selectedMode === 'professional') {
      window.location.href = '/constructor?mode=professional';
    } else if (selectedMode === 'visual') {
      window.location.href = '/constructor?mode=visual';
    }
    onClose();
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Icon name="Boxes" size={28} className="text-primary" />
            {selectedMode ? 'Инструкция по созданию бота' : 'Выберите режим конструктора'}
          </DialogTitle>
          <DialogDescription>
            {selectedMode 
              ? 'Ознакомьтесь с инструкцией для выбранного режима'
              : 'Выберите удобный для вас способ создания чат-бота'
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
              onClick={() => handleModeSelect('professional')}
            >
              <CardHeader>
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-4 rounded-xl w-fit mb-3">
                  <Icon name="Code2" size={32} className="text-white" />
                </div>
                <CardTitle className="text-xl">Профессиональный режим</CardTitle>
                <CardDescription className="text-sm">
                  Для разработчиков с опытом программирования
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>API-интеграции и кастомные скрипты</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Полный контроль над логикой бота</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Webhook и внешние сервисы</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Кастомизация интерфейса</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
              onClick={() => handleModeSelect('visual')}
            >
              <CardHeader>
                <div className="bg-gradient-to-br from-green-500 to-teal-500 p-4 rounded-xl w-fit mb-3">
                  <Icon name="Workflow" size={32} className="text-white" />
                </div>
                <CardTitle className="text-xl">Визуальный конструктор</CardTitle>
                <CardDescription className="text-sm">
                  Простой способ создания ботов без кода
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Drag & Drop интерфейс</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Готовые блоки и шаблоны</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Визуальное проектирование диалогов</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                    <span>Не требует знаний программирования</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : selectedMode === 'professional' ? (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="Lightbulb" size={20} className="text-purple-600" />
                Профессиональный режим: Руководство
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Настройка API и интеграций
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Используйте встроенный редактор кода для настройки API-вызовов. Поддерживаются REST API, GraphQL, WebSocket. 
                    Добавляйте заголовки аутентификации, параметры запросов и обработчики ответов.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Создание сложной логики бота
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Пишите JavaScript/TypeScript код для обработки сообщений пользователей. Используйте условные операторы, 
                    циклы, асинхронные функции. Интегрируйте AI-модели (GPT, Claude) для генерации ответов.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Подключение webhook и внешних сервисов
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Настройте webhook для получения событий от мессенджеров (Telegram, WhatsApp, VK). Интегрируйте CRM-системы, 
                    платежные шлюзы, базы данных. Используйте OAuth 2.0 для безопасной авторизации.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                    Кастомизация интерфейса
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Создавайте кастомные inline-клавиатуры, reply-кнопки, карусели с товарами. Настраивайте форматирование 
                    сообщений (Markdown, HTML). Добавляйте медиа-контент (изображения, видео, документы).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
                    Тестирование и деплой
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Используйте встроенный отладчик для тестирования сценариев. Просматривайте логи запросов и ответов. 
                    Настройте автоматическое развертывание на production после прохождения тестов.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-yellow-900 mb-1">Требования</h5>
                    <p className="text-sm text-yellow-800">
                      Для работы в профессиональном режиме требуется знание JavaScript/TypeScript, понимание REST API, 
                      опыт работы с асинхронным кодом и основы веб-разработки.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <Icon name="ChevronLeft" size={18} className="mr-2" />
                Назад
              </Button>
              <Button onClick={handleStartWork} className="flex-1">
                Начать работу
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="Lightbulb" size={20} className="text-green-600" />
                Визуальный конструктор: Руководство
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Начало работы с блок-схемами
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Перетащите блоки из панели инструментов на рабочий холст. Доступны блоки: «Приветствие», «Вопрос», 
                    «Условие», «Действие», «Конец диалога». Соединяйте блоки стрелками для создания логики разговора.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Создание диалогов
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Кликните на блок для редактирования текста сообщения и добавления вариантов ответов. Используйте блок 
                    «Условие» для создания ветвлений диалога в зависимости от ответа пользователя.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Готовые шаблоны
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Выберите готовый шаблон из библиотеки: «Магазин», «Служба поддержки», «Запись на услуги», «Опрос». 
                    Настройте шаблон под свои потребности — измените тексты, добавьте свои блоки.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                    Настройка действий
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Добавляйте действия к блокам: отправка email, запись в таблицу Google Sheets, создание заявки в CRM. 
                    Все настраивается через визуальный интерфейс без программирования.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
                    Тестирование и публикация
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Нажмите «Тест» для запуска эмулятора бота прямо в конструкторе. Проверьте все сценарии диалога. 
                    После успешного тестирования нажмите «Опубликовать» для запуска бота в выбранных мессенджерах.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-blue-900 mb-1">Преимущества</h5>
                    <p className="text-sm text-blue-800">
                      Визуальный конструктор не требует знаний программирования. Создавайте ботов за 10-15 минут 
                      с помощью простого drag & drop интерфейса. Идеально для начинающих и бизнес-пользователей.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <Icon name="ChevronLeft" size={18} className="mr-2" />
                Назад
              </Button>
              <Button onClick={handleStartWork} className="flex-1">
                Начать работу
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConstructorModeModal;
