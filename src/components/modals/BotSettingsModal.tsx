import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { AI_MODELS, getFreeModels, getPaidModels } from '@/config/aiModels';
import funcUrls from '../../backend/func2url.json';

const KB_API = funcUrls['knowledge-base'] || '';

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
      const res = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setTelegramBotName(data.result.username);
        setTelegramStatus('connected');
        toast({ title: 'Telegram подключён', description: `@${data.result.username}` });
      } else {
        setTelegramStatus('error');
        toast({ title: 'Неверный токен', description: 'Проверьте токен и попробуйте снова', variant: 'destructive' });
      }
    } catch (e) {
      setTelegramStatus('error');
      toast({ title: 'Ошибка подключения', variant: 'destructive' });
    }
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

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Название бота</Label>
              <Input
                id="bot-name"
                value={botSettings.name}
                onChange={(e) => setBotSettings({ ...botSettings, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome">Приветственное сообщение</Label>
              <Textarea
                id="welcome"
                value={botSettings.welcomeMessage}
                onChange={(e) => setBotSettings({ ...botSettings, welcomeMessage: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Язык</Label>
              <Select value={botSettings.language} onValueChange={(value) => setBotSettings({ ...botSettings, language: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Часовой пояс</Label>
              <Select value={botSettings.timezone} onValueChange={(value) => setBotSettings({ ...botSettings, timezone: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                  <SelectItem value="Europe/London">Лондон (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Токио (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Модель нейросети</Label>
              <p className="text-sm text-muted-foreground">Выберите AI-модель, которая будет отвечать на сообщения</p>
              <Select value={botSettings.aiModel} onValueChange={(value) => setBotSettings({ ...botSettings, aiModel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Бесплатные модели</div>
                  {freeModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">Free</Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">Премиум модели</div>
                  {paidModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <Badge variant="default" className="text-[10px] px-1 py-0">Pro</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const selected = AI_MODELS.find(m => m.id === botSettings.aiModel);
              if (!selected) return null;
              return (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon name="Cpu" size={18} />
                    <span className="font-medium">{selected.name}</span>
                    <Badge variant={selected.free ? 'secondary' : 'default'}>{selected.free ? 'Бесплатная' : 'Премиум'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                  <p className="text-xs text-muted-foreground">Провайдер: {selected.provider} | Тип: {selected.type}</p>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="Upload" size={18} />
                Загрузить файл
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              >
                {loading === 'file' ? (
                  <>
                    <Icon name="Loader2" size={32} className="mx-auto mb-2 text-primary animate-spin" />
                    <p className="text-sm font-medium">Обработка файла...</p>
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Нажмите для загрузки</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV (макс. 10 МБ)</p>
                  </>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="Globe" size={18} />
                Добавить сайт
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <Button size="sm" onClick={handleAddUrl} disabled={loading === 'url'}>
                  {loading === 'url' ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Link" size={16} className="mr-1" />}
                  {loading === 'url' ? '' : 'Добавить'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Бот извлечёт текст со страницы и добавит в базу знаний</p>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="FileText" size={18} />
                Добавить текст
              </h4>
              <Textarea
                placeholder="Вставьте текст, FAQ, инструкции..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={4}
              />
              <Button size="sm" onClick={handleAddText} disabled={loading === 'text'}>
                {loading === 'text' ? <Icon name="Loader2" size={16} className="animate-spin mr-1" /> : <Icon name="Plus" size={16} className="mr-1" />}
                Добавить в базу
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-3">Загруженные источники ({sources.length})</h4>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Источники знаний пока не добавлены</p>
              ) : (
                <div className="space-y-2">
                  {sources.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          name={s.source_type === 'url' ? 'Globe' : s.source_type === 'file' ? 'File' : 'FileText'}
                          size={16}
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.source_type === 'url' ? s.url : s.file_type?.toUpperCase() || 'Текст'}
                            {' '}&middot;{' '}
                            <Badge variant={s.status === 'ready' ? 'secondary' : 'destructive'} className="text-[10px]">
                              {s.status === 'ready' ? 'Готово' : 'Ошибка'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDeleteSource(s.id)}>
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Icon name="Send" size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Telegram</h4>
                  <p className="text-sm text-muted-foreground">
                    {telegramStatus === 'connected' ? `Подключён: @${telegramBotName}` : 'Подключите бота к Telegram'}
                  </p>
                </div>
                {telegramStatus === 'connected' && (
                  <Badge className="bg-green-100 text-green-700">Подключён</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <Input
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  disabled={telegramStatus === 'connected'}
                />
                <p className="text-xs text-muted-foreground">Получите токен у @BotFather в Telegram</p>
              </div>
              {telegramStatus === 'connected' ? (
                <Button variant="outline" className="w-full" onClick={() => { setTelegramStatus('idle'); setTelegramToken(''); setTelegramBotName(''); }}>
                  <Icon name="Unplug" size={16} className="mr-2" />
                  Отключить
                </Button>
              ) : (
                <Button className="w-full" onClick={handleConnectTelegram} disabled={telegramStatus === 'connecting'}>
                  {telegramStatus === 'connecting' ? (
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Icon name="Link" size={16} className="mr-2" />
                  )}
                  {telegramStatus === 'connecting' ? 'Подключение...' : 'Подключить Telegram'}
                </Button>
              )}
              {telegramStatus === 'error' && (
                <p className="text-xs text-destructive">Не удалось подключить. Проверьте токен.</p>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Icon name="MessageCircle" size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">Скоро</p>
                </div>
                <Badge variant="outline">Скоро</Badge>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Icon name="Users" size={24} className="text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">VKontakte</h4>
                  <p className="text-sm text-muted-foreground">Скоро</p>
                </div>
                <Badge variant="outline">Скоро</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоответы</Label>
                <p className="text-sm text-muted-foreground">Автоматически отвечать на сообщения</p>
              </div>
              <Switch checked={botSettings.autoReply} onCheckedChange={(checked) => setBotSettings({ ...botSettings, autoReply: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления</Label>
                <p className="text-sm text-muted-foreground">Отправлять уведомления о новых сообщениях</p>
              </div>
              <Switch checked={botSettings.notifications} onCheckedChange={(checked) => setBotSettings({ ...botSettings, notifications: checked })} />
            </div>
            <div className="space-y-2">
              <Label>Задержка ответа (секунды)</Label>
              <Input type="number" min="0" max="60" value={botSettings.responseDelay} onChange={(e) => setBotSettings({ ...botSettings, responseDelay: parseInt(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Имитация печати для естественности</p>
            </div>
            <div className="space-y-2">
              <Label>Максимум сообщений в день</Label>
              <Input type="number" min="100" max="10000" value={botSettings.maxMessagesPerDay} onChange={(e) => setBotSettings({ ...botSettings, maxMessagesPerDay: parseInt(e.target.value) })} />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Рабочие часы</Label>
                <p className="text-sm text-muted-foreground">Работать только в указанное время</p>
              </div>
              <Switch checked={botSettings.workingHours} onCheckedChange={(checked) => setBotSettings({ ...botSettings, workingHours: checked })} />
            </div>
            {botSettings.workingHours && (
              <>
                <div className="space-y-2">
                  <Label>Начало работы</Label>
                  <Input type="time" value={botSettings.startTime} onChange={(e) => setBotSettings({ ...botSettings, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Конец работы</Label>
                  <Input type="time" value={botSettings.endTime} onChange={(e) => setBotSettings({ ...botSettings, endTime: e.target.value })} />
                </div>
              </>
            )}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <Icon name="Info" size={16} className="inline mr-2" />
                Вне рабочих часов бот будет отправлять автосообщение о времени работы
              </p>
            </div>
          </TabsContent>
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
