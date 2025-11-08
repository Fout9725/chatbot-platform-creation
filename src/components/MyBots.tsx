import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { mockBots } from './marketplace/mockBots';

interface MyBot {
  id: number;
  name: string;
  type: string;
  platform: string;
  status: 'active' | 'paused' | 'draft';
  users: number;
  messages: number;
  lastActive: string;
  performance: number;
  testMode?: boolean;
  daysLeft?: number;
}

const mockMyBots: MyBot[] = [
  {
    id: 1,
    name: 'Продажный помощник',
    type: 'ИИ-агент',
    platform: 'Telegram',
    status: 'active',
    users: 342,
    messages: 1250,
    lastActive: '2 минуты назад',
    performance: 87
  },
  {
    id: 2,
    name: 'Клиентский сервис',
    type: 'ИИ-сотрудник',
    platform: 'WhatsApp',
    status: 'active',
    users: 156,
    messages: 890,
    lastActive: '15 минут назад',
    performance: 92
  },
  {
    id: 3,
    name: 'HR помощник',
    type: 'ИИ-сотрудник',
    platform: 'Веб-сайт',
    status: 'paused',
    users: 45,
    messages: 203,
    lastActive: '3 часа назад',
    performance: 78
  },
  {
    id: 4,
    name: 'Новый бот',
    type: 'Чат-бот',
    platform: 'Instagram',
    status: 'draft',
    users: 0,
    messages: 0,
    lastActive: 'Никогда',
    performance: 0
  }
];

const MyBots = () => {
  const { toast } = useToast();
  const { activeBots, deactivateBot } = useActiveBots();
  const [bots, setBots] = useState<MyBot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
  }, [activeBots]);

  const loadBots = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/96b3f1ab-3e6d-476d-9886-020600efada2');
      const data = await response.json();
      
      const activatedBots: MyBot[] = activeBots.map(activeBot => {
        const templateBot = mockBots.find(b => b.id === activeBot.botId);
        const daysLeft = Math.ceil((activeBot.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: activeBot.botId,
          name: activeBot.botName,
          type: templateBot?.category || 'ИИ-агент',
          platform: 'Telegram',
          status: activeBot.status === 'active' ? 'active' : 'paused',
          users: Math.floor(Math.random() * 100),
          messages: Math.floor(Math.random() * 500),
          lastActive: activeBot.status === 'active' ? 'Только что' : 'Тестовый период истек',
          performance: activeBot.status === 'active' ? 85 : 0,
          testMode: true,
          daysLeft
        };
      });
      
      if (data.bots) {
        const mappedBots: MyBot[] = data.bots.map((bot: any) => ({
          id: bot.id,
          name: bot.name,
          type: bot.bot_type,
          platform: bot.platform,
          status: bot.status as 'active' | 'paused' | 'draft',
          users: Math.floor(Math.random() * 500),
          messages: Math.floor(Math.random() * 2000),
          lastActive: bot.status === 'draft' ? 'Никогда' : '1 час назад',
          performance: bot.status === 'draft' ? 0 : Math.floor(Math.random() * 40) + 60
        }));
        setBots([...activatedBots, ...mappedBots]);
      } else {
        setBots(activatedBots);
      }
    } catch (error) {
      const activatedBots: MyBot[] = activeBots.map(activeBot => {
        const templateBot = mockBots.find(b => b.id === activeBot.botId);
        const daysLeft = Math.ceil((activeBot.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: activeBot.botId,
          name: activeBot.botName,
          type: templateBot?.category || 'ИИ-агент',
          platform: 'Telegram',
          status: activeBot.status === 'active' ? 'active' : 'paused',
          users: Math.floor(Math.random() * 100),
          messages: Math.floor(Math.random() * 500),
          lastActive: activeBot.status === 'active' ? 'Только что' : 'Тестовый период истек',
          performance: activeBot.status === 'active' ? 85 : 0,
          testMode: true,
          daysLeft
        };
      });
      setBots(activatedBots);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активен</Badge>;
      case 'paused':
        return <Badge variant="secondary">Приостановлен</Badge>;
      case 'draft':
        return <Badge variant="outline">Черновик</Badge>;
      default:
        return null;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'telegram':
        return 'Send';
      case 'whatsapp':
        return 'MessageCircle';
      case 'instagram':
        return 'Instagram';
      case 'веб-сайт':
        return 'Globe';
      default:
        return 'Bot';
    }
  };

  const handleToggleStatus = (botId: number) => {
    setBots(bots.map(bot => {
      if (bot.id === botId) {
        const newStatus = bot.status === 'active' ? 'paused' : 'active';
        toast({
          title: newStatus === 'active' ? 'Бот запущен' : 'Бот приостановлен',
          description: `${bot.name} ${newStatus === 'active' ? 'работает' : 'остановлен'}`,
        });
        return { ...bot, status: newStatus };
      }
      return bot;
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl md:text-2xl font-bold">Мои ИИ-агенты</h3>
          <p className="text-sm md:text-base text-muted-foreground">Управляйте своими ИИ-агентами и ИИ-сотрудниками</p>
        </div>
        <Button size="default" className="w-full sm:w-auto" onClick={() => window.location.href = '/bot-builder'}>
          <Icon name="Plus" size={18} className="mr-2" />
          Создать ИИ-агента
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Icon name="Loader2" size={48} className="mx-auto text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Загрузка ИИ-агентов...</p>
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="Bot" size={64} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">У вас пока нет ботов</h3>
          <p className="text-muted-foreground mb-6">Создайте своего первого ИИ-агента</p>
          <Button size="lg" onClick={() => window.location.href = '/?tab=constructor'}>
            <Icon name="Plus" size={18} className="mr-2" />
            Создать первого бота
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {bots.map((bot, index) => (
          <Card 
            key={bot.id}
            className="hover:shadow-lg transition-all duration-300 animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-3 rounded-xl">
                    <Icon name={getPlatformIcon(bot.platform) as any} size={24} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {bot.type} • {bot.platform}
                    </CardDescription>
                    {bot.testMode && bot.daysLeft && bot.daysLeft > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Тест: {bot.daysLeft} {bot.daysLeft === 1 ? 'день' : bot.daysLeft < 5 ? 'дня' : 'дней'}
                      </Badge>
                    )}
                  </div>
                </div>
                {getStatusBadge(bot.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {bot.status !== 'draft' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Пользователи</p>
                      <p className="text-2xl font-bold">{bot.users}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Сообщений</p>
                      <p className="text-2xl font-bold">{bot.messages}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Эффективность</span>
                      <span className="font-semibold">{bot.performance}%</span>
                    </div>
                    <Progress value={bot.performance} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Clock" size={14} />
                    <span>Активность: {bot.lastActive}</span>
                  </div>
                </>
              )}

              {bot.status === 'draft' && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Бот в разработке</p>
                  <p className="text-xs mt-1">Завершите настройку для запуска</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              {bot.status === 'draft' ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Icon name="Edit" size={16} className="mr-2" />
                    Редактировать
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Icon name="Play" size={16} className="mr-2" />
                    Запустить
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(bot.id)}
                    className="flex-1"
                  >
                    <Icon name={bot.status === 'active' ? 'Pause' : 'Play'} size={16} className="mr-2" />
                    {bot.status === 'active' ? 'Остановить' : 'Запустить'}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Icon name="BarChart3" size={16} className="mr-2" />
                    Статистика
                  </Button>
                  <Button variant="outline" size="sm">
                    <Icon name="Settings" size={16} />
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default MyBots;