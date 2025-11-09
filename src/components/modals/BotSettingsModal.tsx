import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  botName: string;
}

export default function BotSettingsModal({ isOpen, onClose, botName }: BotSettingsModalProps) {
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
  });

  const handleSave = () => {
    alert('Настройки сохранены!');
    onClose();
  };

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="behavior">Поведение</TabsTrigger>
            <TabsTrigger value="integrations">Интеграции</TabsTrigger>
            <TabsTrigger value="schedule">Расписание</TabsTrigger>
            <TabsTrigger value="advanced">Продвинутые</TabsTrigger>
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
              <Label htmlFor="language">Язык</Label>
              <Select value={botSettings.language} onValueChange={(value) => setBotSettings({ ...botSettings, language: value })}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Часовой пояс</Label>
              <Select value={botSettings.timezone} onValueChange={(value) => setBotSettings({ ...botSettings, timezone: value })}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                  <SelectItem value="Europe/London">Лондон (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Токио (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоответы</Label>
                <p className="text-sm text-muted-foreground">Автоматически отвечать на сообщения</p>
              </div>
              <Switch
                checked={botSettings.autoReply}
                onCheckedChange={(checked) => setBotSettings({ ...botSettings, autoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления</Label>
                <p className="text-sm text-muted-foreground">Отправлять уведомления о новых сообщениях</p>
              </div>
              <Switch
                checked={botSettings.notifications}
                onCheckedChange={(checked) => setBotSettings({ ...botSettings, notifications: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="response-delay">Задержка ответа (секунды)</Label>
              <Input
                id="response-delay"
                type="number"
                min="0"
                max="60"
                value={botSettings.responseDelay}
                onChange={(e) => setBotSettings({ ...botSettings, responseDelay: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Имитация печати для естественности</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-messages">Максимум сообщений в день</Label>
              <Input
                id="max-messages"
                type="number"
                min="100"
                max="10000"
                value={botSettings.maxMessagesPerDay}
                onChange={(e) => setBotSettings({ ...botSettings, maxMessagesPerDay: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Icon name="Send" size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Telegram</h4>
                    <p className="text-sm text-muted-foreground">Подключите бота к Telegram</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Bot Token</Label>
                  <Input
                    id="telegram-token"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                  <p className="text-xs text-muted-foreground">Получите токен у @BotFather в Telegram</p>
                </div>
                <Button className="w-full">
                  <Icon name="Link" size={16} className="mr-2" />
                  Подключить Telegram
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Icon name="MessageCircle" size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Подключите бота к WhatsApp Business</p>
                  </div>
                </div>
                <Input placeholder="API токен" disabled />
                <Button disabled className="w-full">Скоро доступно</Button>
              </div>

              <div className="border rounded-lg p-4 space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Icon name="Facebook" size={24} className="text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">VKontakte</h4>
                    <p className="text-sm text-muted-foreground">Подключите бота к сообществу ВК</p>
                  </div>
                </div>
                <Input placeholder="API токен" disabled />
                <Button disabled className="w-full">Скоро доступно</Button>
              </div>

              <div className="border rounded-lg p-4 space-y-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <Icon name="Instagram" size={24} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Instagram</h4>
                    <p className="text-sm text-muted-foreground">Подключите бота к Instagram Direct</p>
                  </div>
                </div>
                <Input placeholder="API токен" disabled />
                <Button disabled className="w-full">Скоро доступно</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Рабочие часы</Label>
                <p className="text-sm text-muted-foreground">Работать только в указанное время</p>
              </div>
              <Switch
                checked={botSettings.workingHours}
                onCheckedChange={(checked) => setBotSettings({ ...botSettings, workingHours: checked })}
              />
            </div>

            {botSettings.workingHours && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Начало работы</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={botSettings.startTime}
                    onChange={(e) => setBotSettings({ ...botSettings, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">Конец работы</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={botSettings.endTime}
                    onChange={(e) => setBotSettings({ ...botSettings, endTime: e.target.value })}
                  />
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

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Интеграции</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <Icon name="Mail" size={16} className="mr-2" />
                  Email
                </Button>
                <Button variant="outline" className="justify-start">
                  <Icon name="MessageCircle" size={16} className="mr-2" />
                  Telegram
                </Button>
                <Button variant="outline" className="justify-start">
                  <Icon name="Phone" size={16} className="mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="justify-start">
                  <Icon name="MessageSquare" size={16} className="mr-2" />
                  Slack
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API ключ</Label>
              <div className="flex gap-2">
                <Input value="sk_live_xxxxxxxxxxxxxx" readOnly />
                <Button variant="outline" size="icon">
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Используйте для подключения к внешним системам</p>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input placeholder="https://your-domain.com/webhook" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}