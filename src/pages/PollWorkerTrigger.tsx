import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const PollWorkerTrigger = () => {
  const [lastRun, setLastRun] = useState<string>('Не запускался');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const runWorker = async () => {
    setStatus('running');
    try {
      const response = await fetch('https://functions.poehali.dev/6937f818-f5ef-4075-afb4-48594cb1a442', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      setResult(data);
      setStatus('success');
      setLastRun(new Date().toLocaleTimeString('ru-RU'));
    } catch (error) {
      console.error('Worker error:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    runWorker();
    const interval = setInterval(runWorker, 60000); // Каждую минуту
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Timer" size={24} className="text-primary" />
            Автоматическая отправка опросов
          </CardTitle>
          <CardDescription>
            Воркер запускается каждую минуту пока эта страница открыта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Статус</p>
              <p className="text-xs text-muted-foreground">Последний запуск: {lastRun}</p>
            </div>
            <div>
              {status === 'running' && <Icon name="Loader2" className="animate-spin text-blue-500" size={32} />}
              {status === 'success' && <Icon name="CheckCircle" className="text-green-500" size={32} />}
              {status === 'error' && <Icon name="XCircle" className="text-red-500" size={32} />}
              {status === 'idle' && <Icon name="Clock" className="text-gray-400" size={32} />}
            </div>
          </div>

          {result && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Результат последнего запуска:</p>
              <div className="text-xs space-y-1">
                <p>✅ Обработано: {result.processed || 0}</p>
                <p>📤 Отправлено: {result.sent || 0}</p>
                <p>❌ Ошибок: {result.failed || 0}</p>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-xs text-red-600 mt-2">
                  <p className="font-medium">Ошибки:</p>
                  {result.errors.map((err: string, i: number) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-2">
            <p>💡 <strong>Как это работает:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Воркер проверяет базу данных на наличие запланированных опросов</li>
              <li>Если время опроса наступило — отправляет в группу</li>
              <li>Эта страница должна быть открыта в браузере</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollWorkerTrigger;
