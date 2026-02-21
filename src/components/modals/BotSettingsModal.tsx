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
const BOTS_API = funcUrls['bots-api'] || '';

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

export interface CrmIntegration {
  id: number;
  bot_id: number;
  crm_type: string;
  api_key?: string;
  api_key_masked?: string;
  webhook_url?: string;
  settings?: Record<string, unknown>;
  is_active: boolean;
  created_at?: string;
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
  const [saving, setSaving] = useState(false);
  const [botSettings, setBotSettings] = useState({
    name: botName,
    welcomeMessage: '',
    language: 'ru',
    timezone: 'Europe/Moscow',
    autoReply: true,
    notifications: true,
    workingHours: false,
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
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegration[]>([]);

  const currentBotId = botId || 0;

  useEffect(() => {
    if (isOpen && currentBotId) {
      loadBotSettings();
      loadSources();
      loadCrmIntegrations();
    }
  }, [isOpen, currentBotId]);

  const loadBotSettings = async () => {
    if (!BOTS_API || !currentBotId) return;
    try {
      const res = await fetch(`${BOTS_API}?id=${currentBotId}`);
      const data = await res.json();
      if (data.bot) {
        const bot = data.bot;
        const s = bot.settings || {};
        setBotSettings({
          name: bot.name || botName,
          welcomeMessage: s.welcomeMessage || '',
          language: s.language || 'ru',
          timezone: s.timezone || 'Europe/Moscow',
          autoReply: s.autoReply !== false,
          notifications: s.notifications !== false,
          workingHours: s.workingHours || false,
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '18:00',
          maxMessagesPerDay: s.maxMessagesPerDay || 1000,
          responseDelay: s.responseDelay || 0,
          aiModel: bot.ai_model || 'google/gemini-2.0-flash-exp:free',
        });
        if (bot.telegram_token) {
          setTelegramToken(bot.telegram_token);
          setTelegramStatus('connected');
          setTelegramBotName(bot.telegram_username || '');
        } else {
          setTelegramToken('');
          setTelegramStatus('idle');
          setTelegramBotName('');
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки настроек бота:', e);
    }
  };

  const loadSources = async () => {
    if (!KB_API || !currentBotId) return;
    try {
      const res = await fetch(`${KB_API}?bot_id=${currentBotId}`);
      const data = await res.json();
      setSources((data.sources || []).filter((s: KnowledgeSource) => s.status !== 'error' || !s.error_message?.includes('Удалено')));
    } catch (e) {
      console.error('Ошибка загрузки источников:', e);
    }
  };

  const loadCrmIntegrations = async () => {
    if (!BOTS_API || !currentBotId) return;
    try {
      const res = await fetch(`${BOTS_API}?action=crm_list&bot_id=${currentBotId}`);
      const data = await res.json();
      setCrmIntegrations((data.integrations || []).filter((i: CrmIntegration) => i.is_active !== false));
    } catch (e) {
      console.error('Ошибка загрузки CRM:', e);
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
          body: JSON.stringify({ action: 'add_file', bot_id: currentBotId, file_data: base64, file_name: file.name, file_type: ext })
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
        const webhookMsg = data.webhook_set ? ' Webhook установлен.' : ' Webhook не установлен.';
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

  const handleSaveCrm = async (crm: Partial<CrmIntegration>) => {
    if (!BOTS_API) return;
    try {
      const res = await fetch(BOTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'crm_save', bot_id: currentBotId, ...crm })
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Интеграция сохранена' });
        loadCrmIntegrations();
      }
    } catch (e) {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
  };

  const handleDeleteCrm = async (id: number) => {
    if (!BOTS_API) return;
    try {
      await fetch(BOTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'crm_delete', id })
      });
      setCrmIntegrations(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Интеграция удалена' });
    } catch (e) {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!BOTS_API || !currentBotId) {
      toast({ title: 'Ошибка', description: 'ID бота не определён', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(BOTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentBotId,
          name: botSettings.name,
          ai_model: botSettings.aiModel,
          ai_prompt: botSettings.welcomeMessage ? `Приветственное сообщение: ${botSettings.welcomeMessage}` : undefined,
          settings: {
            welcomeMessage: botSettings.welcomeMessage,
            language: botSettings.language,
            timezone: botSettings.timezone,
            autoReply: botSettings.autoReply,
            notifications: botSettings.notifications,
            workingHours: botSettings.workingHours,
            startTime: botSettings.startTime,
            endTime: botSettings.endTime,
            maxMessagesPerDay: botSettings.maxMessagesPerDay,
            responseDelay: botSettings.responseDelay,
          }
        })
      });
      const data = await res.json();
      if (data.bot) {
        toast({ title: 'Настройки сохранены' });
        onClose();
      } else {
        toast({ title: 'Ошибка сохранения', description: data.error || 'Попробуйте ещё раз', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const freeModels = getFreeModels().filter(m => m.type === 'text' || m.type === 'code');
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
            crmIntegrations={crmIntegrations}
            onSaveCrm={handleSaveCrm}
            onDeleteCrm={handleDeleteCrm}
          />
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
