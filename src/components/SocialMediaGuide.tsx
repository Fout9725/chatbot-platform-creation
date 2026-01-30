import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const SocialMediaGuide = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
            <Icon name="BookOpen" size={24} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl">Инструкции по подключению</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Пошаговые гайды для всех популярных платформ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="telegram">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon name="Send" size={20} className="text-blue-500" />
                <span className="font-semibold">Telegram</span>
                <Badge variant="outline" className="ml-2">Рекомендуем</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">📱 Создание бота в Telegram</p>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Откройте Telegram и найдите <code className="bg-blue-100 px-2 py-0.5 rounded">@BotFather</code></li>
                    <li>Отправьте команду <code className="bg-blue-100 px-2 py-0.5 rounded">/newbot</code></li>
                    <li>Введите имя для вашего бота (например: "Мой помощник")</li>
                    <li>Введите уникальный username (должен заканчиваться на "bot", например: "my_helper_bot")</li>
                    <li>Скопируйте полученный токен (формат: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">🔗 Подключение к платформе</p>
                  <ol className="list-decimal list-inside space-y-2 text-green-800">
                    <li>Добавьте токен в секреты проекта (виджет выше)</li>
                    <li>Выберите платформу "Telegram" в конструкторе</li>
                    <li>Нажмите "Проверить подключение" во вкладке "Интеграции"</li>
                    <li>Узнайте свой Chat ID у бота <code className="bg-green-100 px-2 py-0.5 rounded">@userinfobot</code></li>
                    <li>Отправьте тестовое сообщение себе</li>
                  </ol>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-semibold text-purple-900 mb-2">⚙️ Настройка команд бота</p>
                  <p className="text-purple-800 mb-2">Вернитесь к @BotFather и настройте:</p>
                  <ul className="list-disc list-inside space-y-1 text-purple-800 ml-2">
                    <li><code className="bg-purple-100 px-2 py-0.5 rounded">/setdescription</code> - описание бота</li>
                    <li><code className="bg-purple-100 px-2 py-0.5 rounded">/setabouttext</code> - текст "О боте"</li>
                    <li><code className="bg-purple-100 px-2 py-0.5 rounded">/setuserpic</code> - аватар бота</li>
                    <li><code className="bg-purple-100 px-2 py-0.5 rounded">/setcommands</code> - список команд</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatsapp">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon name="MessageCircle" size={20} className="text-green-500" />
                <span className="font-semibold">WhatsApp Business</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3 text-sm">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">🏢 Регистрация бизнес-аккаунта</p>
                  <ol className="list-decimal list-inside space-y-2 text-green-800">
                    <li>Перейдите на <a href="https://business.whatsapp.com" target="_blank" className="underline font-medium">business.whatsapp.com</a></li>
                    <li>Создайте Business Account с рабочим email</li>
                    <li>Подтвердите email и номер телефона</li>
                    <li>Заполните информацию о компании</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">🔑 Получение API ключей</p>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Откройте <a href="https://developers.facebook.com" target="_blank" className="underline font-medium">developers.facebook.com</a></li>
                    <li>Создайте новое приложение типа "Business"</li>
                    <li>Добавьте продукт "WhatsApp Business Platform"</li>
                    <li>Получите Phone Number ID и Access Token</li>
                    <li>Настройте webhook для получения сообщений</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-yellow-900 mb-2">⚠️ Важно знать</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800 ml-2">
                    <li>Требуется верификация бизнес-аккаунта</li>
                    <li>Бесплатно до 1000 сообщений в месяц</li>
                    <li>Ответ на сообщение пользователя бесплатен в течение 24 часов</li>
                    <li>Шаблоны сообщений требуют предварительного одобрения</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instagram">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon name="Instagram" size={20} className="text-pink-500" />
                <span className="font-semibold">Instagram*</span>
                <Badge variant="outline" className="text-xs ml-2">Запрещен в РФ</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3 text-sm">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="font-semibold text-pink-900 mb-2">📸 Настройка бизнес-профиля</p>
                  <ol className="list-decimal list-inside space-y-2 text-pink-800">
                    <li>Переключите аккаунт на "Профессиональный аккаунт"</li>
                    <li>Выберите категорию "Бизнес"</li>
                    <li>Привяжите Facebook страницу к Instagram</li>
                    <li>Убедитесь, что директ открыт для всех</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">🔗 Подключение Instagram Graph API</p>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Создайте приложение на <a href="https://developers.facebook.com" target="_blank" className="underline font-medium">developers.facebook.com</a></li>
                    <li>Добавьте продукт "Instagram Graph API"</li>
                    <li>Получите Instagram Business Account ID</li>
                    <li>Настройте права доступа (instagram_basic, instagram_manage_messages)</li>
                    <li>Получите долгосрочный токен доступа</li>
                  </ol>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-semibold text-purple-900 mb-2">💬 Возможности бота</p>
                  <ul className="list-disc list-inside space-y-1 text-purple-800 ml-2">
                    <li>Автоответы в Direct Messages</li>
                    <li>Обработка упоминаний и комментариев</li>
                    <li>Быстрые ответы на часто задаваемые вопросы</li>
                    <li>Сбор контактов и лидов</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vk">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon name="Share2" size={20} className="text-blue-600" />
                <span className="font-semibold">ВКонтакте</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">👥 Создание сообщества</p>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Создайте публичную страницу или группу ВКонтакте</li>
                    <li>Перейдите в "Управление сообществом"</li>
                    <li>Включите "Сообщения сообщества"</li>
                    <li>Настройте приветственное сообщение</li>
                  </ol>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-semibold text-purple-900 mb-2">🔧 Настройка Callback API</p>
                  <ol className="list-decimal list-inside space-y-2 text-purple-800">
                    <li>Откройте "Настройки" → "Работа с API"</li>
                    <li>Создайте ключ доступа с правами на управление сообществом</li>
                    <li>Перейдите в "Callback API"</li>
                    <li>Укажите адрес сервера (webhook URL)</li>
                    <li>Подтвердите сервер кодом подтверждения</li>
                    <li>Включите типы событий: "Входящие сообщения"</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">✨ Дополнительные функции</p>
                  <ul className="list-disc list-inside space-y-1 text-green-800 ml-2">
                    <li>Клавиатуры с кнопками быстрых ответов</li>
                    <li>Карусели товаров и услуг</li>
                    <li>Интеграция с VK Pay для приёма платежей</li>
                    <li>Рассылки по подписчикам сообщества</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="web">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Icon name="Globe" size={20} className="text-gray-600" />
                <span className="font-semibold">Веб-сайт (Web Widget)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">🌐 Создание веб-виджета</p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-800">
                    <li>Создайте бота в конструкторе BotPlatform</li>
                    <li>Выберите платформу "Веб-сайт"</li>
                    <li>Настройте дизайн виджета (цвета, положение, размер)</li>
                    <li>Скопируйте код для встраивания</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">📝 Установка на сайт</p>
                  <div className="space-y-2 text-blue-800">
                    <p>Вставьте код перед закрывающим тегом <code className="bg-blue-100 px-2 py-0.5 rounded">&lt;/body&gt;</code>:</p>
                    <pre className="bg-blue-900 text-blue-100 p-3 rounded overflow-x-auto text-xs">
{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.botplatform.dev/widget.js';
    script.setAttribute('data-bot-id', 'YOUR_BOT_ID');
    document.body.appendChild(script);
  })();
</script>`}
                    </pre>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">⚙️ Настройки виджета</p>
                  <ul className="list-disc list-inside space-y-1 text-green-800 ml-2">
                    <li>Позиция: правый нижний угол (по умолчанию)</li>
                    <li>Автоматическое открытие при загрузке страницы</li>
                    <li>Кастомизация цветов под дизайн сайта</li>
                    <li>Уведомления о новых сообщениях</li>
                    <li>Интеграция с Google Analytics</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
          <div className="flex gap-3">
            <Icon name="Lightbulb" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">💡 Совет</p>
              <p className="text-muted-foreground">
                Начните с Telegram - это самая простая платформа для старта. 
                После успешного запуска можно добавить другие каналы.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <div className="border-t pt-4 px-6 pb-6">
        <p className="text-xs text-muted-foreground text-center">
          * Instagram признан экстремистской организацией и запрещен на территории РФ
        </p>
      </div>
    </Card>
  );
};

export default SocialMediaGuide;