import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import funcUrls from '../../backend/func2url.json';

const WEBHOOK_URL = funcUrls['neurophoto-bot'];
const BOT_TOKEN = '8257588939:AAEYZYndyra3FLca5VpIFRkk8gHH1GGd48w';

const NeurophotoSetup = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '📝';
    setLogs(prev => [...prev, `${icon} ${message}`]);
  };

  const setupBot = async () => {
    setStatus('loading');
    setLogs([]);

    try {
      addLog('Проверка бота в Telegram...', 'info');
      const telegramCheck = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
      const telegramData = await telegramCheck.json();
      
      if (telegramData.ok) {
        addLog(`Бот найден: @${telegramData.result.username}`, 'success');
      } else {
        addLog('Ошибка подключения к боту', 'error');
        setStatus('error');
        return;
      }

      addLog('Настройка webhook...', 'info');
      addLog(`URL: ${WEBHOOK_URL}`, 'info');

      const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          drop_pending_updates: false,
          allowed_updates: ['message', 'callback_query']
        })
      });

      const webhookData = await webhookResponse.json();
      if (webhookData.ok) {
        addLog('Webhook успешно настроен', 'success');
      } else {
        addLog(`Ошибка webhook: ${webhookData.description}`, 'error');
        setStatus('error');
        return;
      }

      addLog('Проверка webhook...', 'info');
      const checkResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const checkData = await checkResponse.json();
      
      if (checkData.ok) {
        addLog(`Webhook активен: ${checkData.result.url}`, 'success');
        addLog(`Ожидающих обновлений: ${checkData.result.pending_update_count}`, 'info');
      }

      setStatus('success');
      toast({ title: 'Готово!', description: 'Бот Нейрофотосессия настроен и готов к работе' });

    } catch (error) {
      addLog(`Критическая ошибка: ${error}`, 'error');
      setStatus('error');
      toast({ title: 'Ошибка', description: 'Не удалось настроить бота', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Icon name="Camera" className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Нейрофотосессия PRO</h1>
              <p className="text-muted-foreground">Настройка Telegram бота</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Что будет сделано:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-blue-600" />
                  Проверка бота в Telegram
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-blue-600" />
                  Настройка webhook на новый обработчик
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-blue-600" />
                  Активация генерации изображений (Gemini AI)
                </li>
              </ul>
            </div>
          </div>

          <Button
            onClick={setupBot}
            disabled={status === 'loading'}
            className="w-full"
            size="lg"
          >
            {status === 'loading' && <Icon name="Loader2" className="mr-2 animate-spin" size={20} />}
            {status === 'loading' ? 'Настройка...' : 'Запустить настройку'}
          </Button>

          {logs.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Настройка завершена!</h3>
              <p className="text-sm text-green-700 mb-3">
                Бот готов к работе. Найдите его в Telegram и отправьте /start
              </p>
              <div className="bg-white rounded p-3 text-sm">
                <p className="font-semibold mb-1">Как использовать:</p>
                <p className="text-purple-600">Отправьте фото + описание или просто текст</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeurophotoSetup;
