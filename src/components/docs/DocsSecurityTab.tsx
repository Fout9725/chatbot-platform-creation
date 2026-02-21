import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function DocsSecurityTab() {
  return (
    <>
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

      <TabsContent value="api" className="mt-6 space-y-6 hidden">
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
    </>
  );
}
