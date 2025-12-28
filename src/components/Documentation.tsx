import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <Icon name="BookOpen" size={32} className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Документация
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Icon name="ArrowLeft" size={18} />
            На главную
          </Button>
        </div>

        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="quickstart" className="text-xs md:text-sm">
              <Icon name="Rocket" size={16} className="mr-2" />
              Быстрый старт
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              <Icon name="Shield" size={16} className="mr-2" />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs md:text-sm">
              <Icon name="Code" size={16} className="mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs md:text-sm">
              <Icon name="HelpCircle" size={16} className="mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Zap" size={24} className="text-yellow-500" />
                  Быстрый старт
                </CardTitle>
                <CardDescription>Создайте первого бота за 3 минуты</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    Создайте Telegram бота
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Откройте @BotFather в Telegram</li>
                    <li>Отправьте команду <code className="px-2 py-1 bg-muted rounded">/newbot</code></li>
                    <li>Придумайте имя и юзернейм для бота</li>
                    <li>Скопируйте полученный токен (формат: 123456789:ABC-DEF...)</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    Добавьте бота в конструктор
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Нажмите кнопку "Создать бота"</li>
                    <li>Введите название и описание</li>
                    <li>Вставьте токен из BotFather</li>
                    <li>Нажмите "Сохранить"</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    Обучите бота
                  </h3>
                  <p className="text-muted-foreground ml-4">
                    Перейдите на вкладку "Обучение" и добавьте примеры вопросов-ответов. 
                    Чем больше примеров, тем лучше бот понимает пользователей.
                  </p>
                </div>

                <Alert>
                  <Icon name="Lightbulb" size={18} />
                  <AlertDescription>
                    <strong>Совет:</strong> Начните с 10-15 часто задаваемых вопросов. 
                    Бот автоматически обучится на реальных диалогах.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="ShieldCheck" size={24} className="text-green-500" />
                  Безопасность платформы
                </CardTitle>
                <CardDescription>Как мы защищаем ваши данные</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="Lock" size={20} className="text-green-600" />
                    Защита данных
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li><strong>Rate Limiting:</strong> Защита от DDoS (60 запросов/мин на API)</li>
                    <li><strong>Input Validation:</strong> Проверка всех входящих данных</li>
                    <li><strong>XSS Protection:</strong> Санитизация пользовательского ввода</li>
                    <li><strong>SQL Injection:</strong> Параметризованные запросы</li>
                    <li><strong>CORS:</strong> Whitelist доверенных доменов</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="Key" size={20} className="text-blue-600" />
                    Управление секретами
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Telegram токены шифруются в БД</li>
                    <li>API ключи хранятся в защищённых переменных окружения</li>
                    <li>Никакие секреты не передаются на frontend</li>
                    <li>Автоматическая ротация токенов доступа</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="UserCheck" size={20} className="text-purple-600" />
                    Лучшие практики
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Не делитесь токенами Telegram ботов</li>
                    <li>Регулярно проверяйте активные боты</li>
                    <li>Отзывайте токены неиспользуемых ботов</li>
                    <li>Используйте разные токены для теста и продакшена</li>
                  </ul>
                </div>

                <Alert>
                  <Icon name="AlertTriangle" size={18} className="text-yellow-600" />
                  <AlertDescription>
                    <strong>Важно:</strong> Если токен бота скомпрометирован, немедленно отзовите его через @BotFather 
                    командой <code className="px-2 py-1 bg-muted rounded">/revoke</code> и создайте новый.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Code2" size={24} className="text-blue-500" />
                  API Reference
                </CardTitle>
                <CardDescription>Документация по API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bots API</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">GET</span>
                        <code className="text-sm">/bots-api</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Получить список всех ботов</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Response:
{
  "bots": [
    {
      "id": 1,
      "name": "Мой бот",
      "is_active": true
    }
  ]
}`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                        <code className="text-sm">/bots-api</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Создать нового бота</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Request:
{
  "name": "Мой бот",
  "description": "Описание",
  "telegram_token": "123:ABC..."
}

Response:
{
  "bot": { "id": 1, ... }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI Tools API</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                        <code className="text-sm">/ai-tools</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Автообучение бота</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Request:
{
  "action": "auto_learn",
  "bot_id": 1
}

Response:
{
  "success": true,
  "result": { "learned": 5 }
}`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">POST</span>
                        <code className="text-sm">/ai-tools</code>
                      </div>
                      <p className="text-sm text-muted-foreground">OCR распознавание текста</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Request:
{
  "action": "ocr",
  "image_url": "https://..."
}

Response:
{
  "success": true,
  "text": "Распознанный текст"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Icon name="Info" size={18} />
                  <AlertDescription>
                    Все API endpoints защищены rate limiting (60 req/min). 
                    При превышении лимита получите статус 429.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageCircleQuestion" size={24} className="text-purple-500" />
                  Часто задаваемые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Как бот обучается?</h3>
                    <p className="text-sm text-muted-foreground">
                      Бот использует ML-модель на основе TF-IDF. Вы добавляете примеры вопросов-ответов, 
                      и бот автоматически находит похожие вопросы пользователей. Также есть автообучение 
                      на реальных диалогах за последние 7 дней.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Сколько примеров нужно для обучения?</h3>
                    <p className="text-sm text-muted-foreground">
                      Минимум 5-10 примеров для базовой работы. Оптимально 50-100 примеров 
                      для хорошего качества. Бот постоянно обучается на новых диалогах.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Можно ли интегрировать с CRM?</h3>
                    <p className="text-sm text-muted-foreground">
                      Да! Поддерживается интеграция с AmoCRM и Bitrix24. 
                      Перейдите на вкладку "AI Tools" → "CRM интеграция" и введите API ключи.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Как работает OCR?</h3>
                    <p className="text-sm text-muted-foreground">
                      Бот может распознавать текст с изображений (чеки, документы, визитки). 
                      Поддерживаются форматы JPG, PNG, PDF. Бесплатный лимит 25,000 запросов/месяц.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Безопасны ли мои токены?</h3>
                    <p className="text-sm text-muted-foreground">
                      Да. Все токены шифруются в базе данных, передаются только по HTTPS, 
                      никогда не попадают на frontend. Платформа проходит регулярный аудит безопасности.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Что делать если бот не отвечает?</h3>
                    <p className="text-sm text-muted-foreground">
                      1. Проверьте что бот активен (is_active = true)
                      <br />2. Убедитесь что webhook настроен правильно
                      <br />3. Добавьте больше обучающих примеров
                      <br />4. Проверьте логи в разделе "Диалоги"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="LifeBuoy" size={24} className="text-blue-500" />
                  Нужна помощь?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Если не нашли ответ на свой вопрос:
                </p>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://t.me/your_support_bot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="MessageCircle" size={18} />
                    Написать в поддержку
                  </a>
                  <a 
                    href="https://github.com/your-repo/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Icon name="Github" size={18} />
                    Сообщить об ошибке
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}