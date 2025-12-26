import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useBotStats } from '@/contexts/BotStatsContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockBots } from './marketplace/mockBots';
import BotSettingsModal from './modals/BotSettingsModal';

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

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  optimal: 5,
  premium: 20,
  partner: Infinity
};

const MyBots = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeBots, deactivateBot } = useActiveBots();
  const { getBotStats, addMessage } = useBotStats();
  const [bots, setBots] = useState<MyBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsModal, setSettingsModal] = useState<{ isOpen: boolean; botId: number; botName: string }>({ 
    isOpen: false, 
    botId: 0, 
    botName: '' 
  });
  
  const maxBots = PLAN_LIMITS[user?.plan || 'free'];

  useEffect(() => {
    console.log('🔄 MyBots: Перезагрузка, активных ботов:', activeBots.length);
    loadBots();
  }, [activeBots]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && bots.length > 0) {
        console.log('🔄 MyBots: Автообновление статистики');
        loadBots();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, bots.length]);

  const loadBots = async () => {
    setLoading(true);
    
    const activatedBots: MyBot[] = activeBots.map(activeBot => {
      const templateBot = mockBots.find(b => b.id === activeBot.botId);
      const daysLeft = Math.ceil((activeBot.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const stats = getBotStats(activeBot.botId);
      
      const performance = stats.messages > 0 ? Math.min(100, 50 + stats.messages) : 0;
      
      return {
        id: activeBot.botId,
        name: activeBot.botName,
        type: templateBot?.category || 'ИИ-агент',
        platform: 'Telegram',
        status: activeBot.status === 'active' ? 'active' : 'paused',
        users: stats.users,
        messages: stats.messages,
        lastActive: activeBot.status === 'active' ? stats.lastActive : 'Тестовый период истек',
        performance,
        testMode: true,
        daysLeft
      };
    });
    
    setBots(activatedBots);
    setLoading(false);
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

  const handleTestMessage = (botId: number, botName: string) => {
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    addMessage(botId, userId);
    
    toast({
      title: "Тестовое сообщение отправлено",
      description: `Статистика бота "${botName}" обновлена`,
    });
    
    setTimeout(() => {
      loadBots();
    }, 500);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {bots.length >= maxBots && maxBots !== Infinity && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Icon name="AlertCircle" size={24} className="text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">Достигнут лимит тарифа</h4>
                <p className="text-sm text-orange-700">
                  На вашем тарифе доступно максимум {maxBots} {maxBots === 1 ? 'бот' : 'ботов'}. 
                  Улучшите тариф, чтобы добавить больше ботов.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl md:text-2xl font-bold">Мои ИИ-агенты</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Управляйте своими ИИ-агентами и ИИ-сотрудниками • {bots.length} из {maxBots === Infinity ? '∞' : maxBots} ботов
          </p>
        </div>
        <Button 
          size="default" 
          className="w-full sm:w-auto" 
          onClick={() => window.location.href = '/bot-builder'}
          disabled={bots.length >= maxBots}
        >
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
          <Button size="lg" onClick={() => window.location.href = '/'}>
            <Icon name="Plus" size={18} className="mr-2" />
            Перейти в маркетплейс
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {bots.map((bot, index) => (
          <Card 
            key={`bot-${bot.id}`}
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
                  {bot.testMode && bot.users === 0 && bot.messages === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                      <p className="text-blue-900 font-medium mb-1">💡 Протестируйте бота</p>
                      <p className="text-blue-700">
                        Нажмите кнопку "Тест" чтобы отправить пробное сообщение и увидеть статистику в действии
                      </p>
                    </div>
                  )}
                  
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
                  >
                    <Icon name={bot.status === 'active' ? 'Pause' : 'Play'} size={16} className="mr-2" />
                    {bot.status === 'active' ? 'Стоп' : 'Старт'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestMessage(bot.id, bot.name)}
                    disabled={bot.status !== 'active'}
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    Тест
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSettingsModal({ isOpen: true, botId: bot.id, botName: bot.name })}
                  >
                    <Icon name="Settings" size={16} />
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
        </div>
      )}

      <BotSettingsModal
        isOpen={settingsModal.isOpen}
        onClose={() => setSettingsModal({ isOpen: false, botId: 0, botName: '' })}
        botName={settingsModal.botName}
      />
    </div>
  );
};

export default MyBots;