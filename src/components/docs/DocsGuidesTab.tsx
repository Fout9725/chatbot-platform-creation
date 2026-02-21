import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function DocsGuidesTab() {
  return (
    <>
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

      <TabsContent value="knowledge" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BookOpen" size={24} className="text-green-500" />
              База знаний бота
            </CardTitle>
            <CardDescription>Как наполнить бота информацией для ответов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold">1</span>
                Добавление сайта (URL)
              </h3>
              <p className="text-muted-foreground ml-10">
                Откройте настройки бота &rarr; вкладка &laquo;База знаний&raquo; &rarr; блок &laquo;Добавить сайт&raquo;. 
                Вставьте URL страницы и нажмите &laquo;Добавить&raquo;. Система автоматически извлечёт текст со страницы 
                и добавит его в базу знаний бота. Бот сможет отвечать на вопросы по содержимому этой страницы.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold">2</span>
                Загрузка файлов
              </h3>
              <p className="text-muted-foreground ml-10">
                Поддерживаемые форматы: <strong>PDF, DOCX, TXT, CSV</strong> (до 10 МБ). 
                Нажмите на зону загрузки, выберите файл — текст будет извлечён автоматически. 
                Для PDF: лучше всего работает с текстовыми PDF (не сканы). 
                Для сканов рекомендуем сначала распознать текст и загрузить TXT.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold">3</span>
                Ручной ввод текста
              </h3>
              <p className="text-muted-foreground ml-10">
                Вставьте текст напрямую: FAQ, инструкции, описания товаров, правила компании. 
                Можно добавлять несколько записей — каждая будет отдельным источником знаний.
              </p>
            </div>

            <Alert>
              <Icon name="Lightbulb" size={18} />
              <AlertDescription>
                <strong>Совет:</strong> Комбинируйте источники. Загрузите документацию из файла, 
                добавьте URL с актуальным прайсом, и вручную введите ответы на нестандартные вопросы.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="models" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Cpu" size={24} className="text-purple-500" />
              Выбор модели нейросети
            </CardTitle>
            <CardDescription>Какую AI-модель выбрать для вашего бота</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Бесплатные модели</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Gemini 2.0 Flash <span className="text-xs text-green-600 ml-1">(рекомендуем)</span></p>
                  <p className="text-sm text-muted-foreground">Быстрая, хорошо понимает русский. Лучший выбор для консультаций и FAQ.</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">DeepSeek Chat V3</p>
                  <p className="text-sm text-muted-foreground">Отлично подходит для диалогов. Хорошо рассуждает и отвечает развёрнуто.</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Qwen3 235B</p>
                  <p className="text-sm text-muted-foreground">Мощная модель для сложных задач. Поддерживает много языков.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Премиум модели</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <p className="font-medium">GPT-4o</p>
                  <p className="text-sm text-muted-foreground">Топовая модель OpenAI. Максимальное качество ответов.</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Claude 3.5 Sonnet</p>
                  <p className="text-sm text-muted-foreground">Отлично следует инструкциям, безопасная. Идеальна для бизнеса.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Как выбрать?</h3>
              <p className="text-muted-foreground">
                Настройки бота &rarr; вкладка &laquo;Модель&raquo; &rarr; выберите из списка. 
                Для начала рекомендуем бесплатные модели — они покрывают 90% задач.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Plug" size={24} className="text-blue-500" />
              Подключение интеграций
            </CardTitle>
            <CardDescription>Как подключить бота к мессенджерам и сервисам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="Send" size={20} className="text-blue-500" />
                Telegram
              </h3>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Откройте @BotFather в Telegram и создайте нового бота (<code className="px-2 py-1 bg-muted rounded">/newbot</code>)</li>
                <li>Скопируйте токен бота (формат: <code className="px-2 py-1 bg-muted rounded">123456:ABC-DEF...</code>)</li>
                <li>Откройте настройки бота &rarr; вкладка &laquo;Интеграции&raquo;</li>
                <li>Вставьте токен и нажмите &laquo;Подключить Telegram&raquo;</li>
                <li>Если всё верно — появится имя бота и статус &laquo;Подключён&raquo;</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="MessageCircle" size={20} className="text-green-500" />
                WhatsApp, VK, Instagram
              </h3>
              <p className="text-muted-foreground ml-4">
                Эти интеграции находятся в разработке и скоро будут доступны. 
                Следите за обновлениями в нашем Telegram-канале.
              </p>
            </div>

            <Alert>
              <Icon name="Info" size={18} />
              <AlertDescription>
                После подключения Telegram бот сразу начнёт принимать сообщения. 
                Убедитесь, что база знаний заполнена перед запуском.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
