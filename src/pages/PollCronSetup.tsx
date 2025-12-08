import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const PollCronSetup = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const cronUrl = 'https://functions.poehali.dev/3f3ec925-eb26-4cb8-b957-7c54490ccc71';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cronUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Icon name="Clock" size={28} className="text-primary" />
              Настройка автоматической отправки опросов
            </CardTitle>
            <CardDescription>
              Используй внешний cron-сервис для запуска воркера каждую минуту
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Icon name="Info" size={18} />
              <AlertDescription>
                Для автоматической работы нужно настроить внешний сервис, который будет вызывать триггер каждую минуту
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Link" size={20} className="text-blue-600" />
                  URL триггера
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cronUrl}
                    readOnly
                    className="flex-1 p-2 border rounded-lg bg-muted font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    <Icon name={copied ? "Check" : "Copy"} size={18} />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Settings" size={20} className="text-purple-600" />
                  Варианты настройки
                </h3>
                
                <div className="space-y-4">
                  {/* Вариант 1: cron-job.org */}
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">1️⃣ Cron-Job.org (Рекомендуется)</CardTitle>
                      <CardDescription>Бесплатный сервис с простой настройкой</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Зарегистрируйся на <a href="https://cron-job.org" target="_blank" className="text-blue-600 underline">cron-job.org</a></li>
                        <li>Создай новый cronjob</li>
                        <li>Вставь URL триггера (скопирован выше)</li>
                        <li>Установи интервал: <strong>каждую 1 минуту</strong></li>
                        <li>Метод запроса: <strong>GET</strong></li>
                        <li>Сохрани и активируй</li>
                      </ol>
                      <Button 
                        className="w-full" 
                        onClick={() => window.open('https://cron-job.org/en/members/jobs/add/', '_blank')}
                      >
                        <Icon name="ExternalLink" size={16} className="mr-2" />
                        Перейти на Cron-Job.org
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Вариант 2: UptimeRobot */}
                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">2️⃣ UptimeRobot</CardTitle>
                      <CardDescription>Мониторинг uptime + cron в одном</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Создай аккаунт на <a href="https://uptimerobot.com" target="_blank" className="text-blue-600 underline">uptimerobot.com</a></li>
                        <li>Добавь новый монитор (Add New Monitor)</li>
                        <li>Тип: <strong>HTTP(s)</strong></li>
                        <li>URL: вставь триггер URL</li>
                        <li>Интервал проверки: <strong>1 минута</strong></li>
                        <li>Сохрани</li>
                      </ol>
                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => window.open('https://uptimerobot.com/', '_blank')}
                      >
                        <Icon name="ExternalLink" size={16} className="mr-2" />
                        Перейти на UptimeRobot
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Вариант 3: EasyCron */}
                  <Card className="border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">3️⃣ EasyCron</CardTitle>
                      <CardDescription>Простой cron-сервис</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Регистрация на <a href="https://www.easycron.com" target="_blank" className="text-blue-600 underline">easycron.com</a></li>
                        <li>Создай новый cron job</li>
                        <li>URL: вставь триггер</li>
                        <li>Cron Expression: <code className="bg-muted px-1">* * * * *</code> (каждую минуту)</li>
                        <li>Активируй задачу</li>
                      </ol>
                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => window.open('https://www.easycron.com/', '_blank')}
                      >
                        <Icon name="ExternalLink" size={16} className="mr-2" />
                        Перейти на EasyCron
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <Icon name="CheckCircle" className="text-green-600" size={18} />
                <AlertDescription>
                  <strong>После настройки:</strong> Опросы будут отправляться автоматически по расписанию без необходимости держать страницу открытой!
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="HelpCircle" size={20} className="text-gray-600" />
                  Как проверить что работает?
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Создай тестовый опрос на время через 2 минуты</li>
                  <li>Дождись указанного времени</li>
                  <li>Опрос должен появиться в группе автоматически</li>
                  <li>Проверь статус в боте: "🕐 Мои запланированные"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PollCronSetup;
