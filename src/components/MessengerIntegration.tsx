import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Integration {
  platform: string;
  status: 'connected' | 'disconnected' | 'pending';
  botName?: string;
  webhookUrl?: string;
}

const MessengerIntegration = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    { platform: 'telegram', status: 'disconnected' },
    { platform: 'whatsapp', status: 'disconnected' },
    { platform: 'vk', status: 'disconnected' },
    { platform: 'instagram', status: 'disconnected' },
  ]);

  const [telegramToken, setTelegramToken] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');

  const connectTelegram = async () => {
    if (!telegramToken) {
      toast({
        title: 'Ошибка',
        description: 'Введите токен бота Telegram',
        variant: 'destructive'
      });
      return;
    }

    try {
      const webhookUrl = `${window.location.origin}/webhook/telegram`;
      
      setIntegrations(integrations.map(i => 
        i.platform === 'telegram' 
          ? { ...i, status: 'connected', webhookUrl, botName: 'Bot' }
          : i
      ));

      toast({
        title: 'Telegram подключен! 🎉',
        description: 'Бот успешно подключен к Telegram. Webhook URL настроен.',
      });
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        description: 'Проверьте токен и попробуйте снова',
        variant: 'destructive'
      });
    }
  };

  const connectWhatsApp = async () => {
    if (!whatsappToken || !whatsappPhoneId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      const webhookUrl = `${window.location.origin}/webhook/whatsapp`;
      
      setIntegrations(integrations.map(i => 
        i.platform === 'whatsapp' 
          ? { ...i, status: 'connected', webhookUrl, botName: 'WhatsApp Bot' }
          : i
      ));

      toast({
        title: 'WhatsApp подключен! 🎉',
        description: 'Бот успешно подключен к WhatsApp Business API.',
      });
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        description: 'Проверьте данные и попробуйте снова',
        variant: 'destructive'
      });
    }
  };

  const disconnect = (platform: string) => {
    setIntegrations(integrations.map(i => 
      i.platform === platform 
        ? { platform, status: 'disconnected' }
        : i
    ));

    toast({
      title: 'Интеграция отключена',
      description: `Бот отключен от ${platform}`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Подключено</Badge>;
      case 'pending':
        return <Badge variant="secondary">Ожидание</Badge>;
      default:
        return <Badge variant="outline">Не подключено</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'telegram': return 'Send';
      case 'whatsapp': return 'MessageCircle';
      case 'vk': return 'Users';
      case 'instagram': return 'Instagram';
      default: return 'MessageSquare';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'telegram': return 'Telegram';
      case 'whatsapp': return 'WhatsApp';
      case 'vk': return 'ВКонтакте';
      case 'instagram': return 'Instagram';
      default: return platform;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Icon name="Link" size={24} className="text-primary" />
            Интеграция с мессенджерами
          </CardTitle>
          <CardDescription>
            Подключите вашего бота к популярным мессенджерам
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.platform}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-3 rounded-xl">
                    <Icon 
                      name={getPlatformIcon(integration.platform) as any} 
                      size={24} 
                      className="text-primary" 
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{getPlatformName(integration.platform)}</CardTitle>
                    <div className="mt-1">
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {integration.status === 'connected' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Бот активен
                    </p>
                    <p className="text-xs text-green-700">
                      Webhook: {integration.webhookUrl}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => disconnect(integration.platform)}
                  >
                    <Icon name="Unlink" size={16} className="mr-2" />
                    Отключить
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const element = document.getElementById(`${integration.platform}-setup`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Подключить
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card id="telegram-setup">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Send" size={20} />
            Настройка Telegram
          </CardTitle>
          <CardDescription>
            Получите токен бота у @BotFather в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Инструкция</TabsTrigger>
              <TabsTrigger value="setup">Подключение</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions" className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <p>Откройте Telegram и найдите @BotFather</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <p>Отправьте команду /newbot и следуйте инструкциям</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <p>Скопируйте полученный токен (выглядит как: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <p>Вставьте токен в поле на вкладке "Подключение"</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <div>
                <Label htmlFor="telegram-token">Токен бота</Label>
                <Input
                  id="telegram-token"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button onClick={connectTelegram} className="w-full">
                <Icon name="Send" size={18} className="mr-2" />
                Подключить Telegram
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card id="whatsapp-setup">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            Настройка WhatsApp Business
          </CardTitle>
          <CardDescription>
            Подключите WhatsApp Business API от Meta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Инструкция</TabsTrigger>
              <TabsTrigger value="setup">Подключение</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions" className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <p>Зарегистрируйтесь в Meta for Developers</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <p>Создайте приложение WhatsApp Business</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <p>Получите токен доступа и Phone Number ID</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <p>Введите данные на вкладке "Подключение"</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <div>
                <Label htmlFor="whatsapp-token">Access Token</Label>
                <Input
                  id="whatsapp-token"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxxx"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-phone">Phone Number ID</Label>
                <Input
                  id="whatsapp-phone"
                  placeholder="123456789012345"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button onClick={connectWhatsApp} className="w-full">
                <Icon name="MessageCircle" size={18} className="mr-2" />
                Подключить WhatsApp
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerIntegration;
