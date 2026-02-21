import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { AI_MODELS, type AIModel } from '@/config/aiModels';

interface BotSettings {
  name: string;
  welcomeMessage: string;
  language: string;
  timezone: string;
  autoReply: boolean;
  notifications: boolean;
  workingHours: boolean;
  startTime: string;
  endTime: string;
  maxMessagesPerDay: number;
  responseDelay: number;
  aiModel: string;
}

interface BotSettingsConfigTabsProps {
  botSettings: BotSettings;
  setBotSettings: (v: BotSettings) => void;
  freeModels: AIModel[];
  paidModels?: AIModel[];
}

export default function BotSettingsConfigTabs({
  botSettings,
  setBotSettings,
  freeModels,
}: BotSettingsConfigTabsProps) {
  return (
    <>
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
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Бесплатные модели OpenRouter</div>
              {freeModels.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Free</Badge>
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
    </>
  );
}