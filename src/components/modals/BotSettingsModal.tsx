import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getFreeModels, getPaidModels } from '@/config/aiModels';
import funcUrls from '../../../backend/func2url.json';
import BotSettingsConfigTabs from './bot-settings/BotSettingsConfigTabs';
import BotSettingsKnowledgeTab from './bot-settings/BotSettingsKnowledgeTab';
import BotSettingsIntegrationsTab from './bot-settings/BotSettingsIntegrationsTab';

const KB_API = funcUrls['knowledge-base'] || '';
const TG_API = funcUrls['telegram-webhook'] || '';

interface KnowledgeSource {
  id: number;
  bot_id: number;
  source_type: string;
  title: string;
  url?: string;
  file_url?: string;
  file_type?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  botName: string;
  botId?: number;
}

export default function BotSettingsModal({ isOpen, onClose, botName, botId }: BotSettingsModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [botSettings, setBotSettings] = useState({
    name: botName,
    welcomeMessage: 'Здравствуйте! Я бот-помощник. Чем могу помочь?',
    language: 'ru',
    timezone: 'Europe/Moscow',
    autoReply: true,
    notifications: true,
    workingHours: true,
    startTime: '09:00',
    endTime: '18:00',
    maxMessagesPerDay: 1000,
    responseDelay: 0,
    aiModel: 'google/gemini-2.0-flash-exp:free',
  });

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [telegramBotName, setTelegramBotName] = useState('');

  const currentBotId = botId || 1;

  useEffect(() => {
    if (isOpen && KB_API) {
      loadSources();
    }
  }, [isOpen]);

  const loadSources = async () => {
    try {
      const res = await fetch(`${KB_API}?bot_id=${currentBotId}`);
      const data = await res.json();
      setSources((data.sources || []).filter((s: KnowledgeSource) => s.status !== 'error' || !s.error_message?.includes('Удалено')));
    } catch (e) {
      console.error('Ошибка загрузки источников:', e);
    }
  };

  const handleAddUrl = async () => {
    if (!websiteUrl.trim() || !websiteUrl.startsWith('http')) {
      toast({ title: 'Укажите корректный URL', description: 'URL должен начинаться с http:// или https://', variant: 'destructive' });
      return;
    }
    setLoading('url');
    try {
      const res = await fetch(KB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_url', bot_id: currentBotId, url: websiteUrl })
      });
      const data = await res.json();
      if (data.status === 'ready') {
        toast({ title: 'Сайт добавлен', description: `Извлечено ${data.text_length} символов текста` });
        setWebsiteUrl('');
        loadSources();
      } else {
        toast({ title: 'Ошибка извлечения', description: data.error || 'Не удалось прочитать сайт', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Ошибка сети', description: 'Не удалось подключиться к серверу', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleAddText = async () => {
    if (!textInput.trim()) {
      toast({ title: 'Введите текст', variant: 'destructive' });
      return;
    }
    setLoading('text');
    try {
      const res = await fetch(KB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_text', bot_id: currentBotId, title: 'Текст', text: textInput })
      });
      const data = await res.json();
      if (data.status === 'ready') {
        toast({ title: 'Текст добавлен в базу знаний' });
        setTextInput('');
        loadSources();
      }
    } catch (e) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить текст', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 10 МБ', variant: 'destructive' });
      return;
    }

    const allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'csv'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.includes(ext)) {
      toast({ title: 'Неподдерживаемый формат', description: 'Загрузите PDF, DOCX, TXT или CSV', variant: 'destructive' });
      return;
    }

    setLoading('file');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch(KB_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_file',
            bot_id: currentBotId,
            file_data: base64,
            file_name: file.name,
            file_type: ext
          })
        });
        const data = await res.json();
        if (data.status === 'ready') {
          toast({ title: 'Файл загружен', description: `${file.name} — извлечено ${data.text_length} символов` });
          loadSources();
        } else {
          toast({ title: 'Ошибка обработки файла', description: data.error, variant: 'destructive' });
        }
        setLoading(null);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      setLoading(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteSource = async (id: number) => {
    try {
      await fetch(`${KB_API}?id=${id}`, { method: 'DELETE' });
      setSources(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Источник удалён' });
    } catch (e) {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const handleConnectTelegram = async () => {
    if (!telegramToken.trim()) {
      toast({ title: 'Введите токен бота', variant: 'destructive' });
      return;
    }
    setTelegramStatus('connecting');
    try {
      const res = await fetch(TG_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', token: telegramToken, bot_id: currentBotId })
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramBotName(data.username || '');
        setTelegramStatus('connected');
        const webhookMsg = data.webhook_set ? ' Webhook установлен.' : ' Webhook не установлен — добавьте секрет WEBHOOK_SELF_URL.';
        toast({ title: 'Telegram подключён', description: `@${data.username}${webhookMsg}` });
      } else {
        setTelegramStatus('error');
        toast({ title: 'Ошибка', description: data.error || 'Не удалось подключить', variant: 'destructive' });
      }
    } catch (e) {
      setTelegramStatus('error');
      toast({ title: 'Ошибка подключения', variant: 'destructive' });
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await fetch(TG_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', token: telegramToken, bot_id: currentBotId })
      });
    } catch (e) {
      console.error('Disconnect error:', e);
    }
    setTelegramStatus('idle');
    setTelegramToken('');
    setTelegramBotName('');
    toast({ title: 'Telegram отключён' });
  };

  const handleSave = () => {
    toast({ title: 'Настройки сохранены' });
    onClose();
  };

  const freeModels = getFreeModels().filter(m => m.type === 'text');
  const paidModels = getPaidModels().filter(m => m.type === 'text');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Settings" size={24} />
            Настройки бота
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="model">Модель</TabsTrigger>
            <TabsTrigger value="knowledge">База знаний</TabsTrigger>
            <TabsTrigger value="integrations">Интеграции</TabsTrigger>
            <TabsTrigger value="behavior">Поведение</TabsTrigger>
            <TabsTrigger value="schedule">Расписание</TabsTrigger>
          </TabsList>

          <BotSettingsConfigTabs
            botSettings={botSettings}
            setBotSettings={setBotSettings}
            freeModels={freeModels}
            paidModels={paidModels}
          />

          <BotSettingsKnowledgeTab
            fileInputRef={fileInputRef}
            loading={loading}
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            textInput={textInput}
            setTextInput={setTextInput}
            sources={sources}
            handleFileUpload={handleFileUpload}
            handleAddUrl={handleAddUrl}
            handleAddText={handleAddText}
            handleDeleteSource={handleDeleteSource}
          />

          <BotSettingsIntegrationsTab
            telegramToken={telegramToken}
            setTelegramToken={setTelegramToken}
            telegramStatus={telegramStatus}
            telegramBotName={telegramBotName}
            handleConnectTelegram={handleConnectTelegram}
            handleDisconnectTelegram={handleDisconnectTelegram}
          />
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}