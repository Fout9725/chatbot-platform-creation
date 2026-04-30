import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TelegramIntegration from '@/components/TelegramIntegration';
import BotSettingsModal from '@/components/modals/BotSettingsModal';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const BotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const analyticsData = {
    totalUsers: 1240,
    activeUsers: 892,
    totalMessages: 15420,
    avgResponseTime: '1.2s',
    successRate: 87,
    weeklyGrowth: 12,
  };

  const weeklyStats = [
    { day: 'Пн', users: 145, messages: 520 },
    { day: 'Вт', users: 168, messages: 610 },
    { day: 'Ср', users: 192, messages: 720 },
    { day: 'Чт', users: 178, messages: 650 },
    { day: 'Пт', users: 210, messages: 780 },
    { day: 'Сб', users: 156, messages: 580 },
    { day: 'Вс', users: 134, messages: 490 },
  ];

  const apiIntegrations = [
    { name: 'Telegram Bot API', status: 'connected', icon: 'Send', color: 'text-blue-500' },
    { name: 'WhatsApp Business', status: 'connected', icon: 'MessageCircle', color: 'text-green-500' },
    { name: 'Instagram* Graph API', status: 'disconnected', icon: 'Instagram', color: 'text-pink-500' },
    { name: 'VK API', status: 'disconnected', icon: 'Share2', color: 'text-blue-600' },
  ];

  const handleConnectAPI = (apiName: string) => {
    toast({
      title: 'Подключение API',
      description: `Настройка интеграции с ${apiName}...`,
    });
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleStart = () => {
    toast({
      title: 'Запуск бота',
      description: 'Бот успешно запущен и готов к работе!',
    });
  };

  return (
    <PageLayout
      title="Личный кабинет бота"
      description="Настройки и аналитика бота в ИнтеллектПро"
      keywords="личный кабинет бота, аналитика бота, настройки бота, ИнтеллектПро"
    >
      <header className="border-b glass-divider glass-panel-subtle sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSettings}
                className="btn-glass-secondary"
              >
                <Icon name="Settings" size={16} className="mr-2" />
                <span className="hidden sm:inline">Настройки</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleStart}
                className="btn-glass-primary"
              >
                <Icon name="Play" size={16} className="mr-2" />
                <span className="hidden sm:inline">Запустить</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-6 md:py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="cube" size={200} />
        </div>
        <div className="mb-6 md:mb-8 animate-fade-in relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-primary to-secondary p-3 md:p-4 rounded-xl">
                <Icon name="ShoppingBag" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-glass-title">Помощник продаж</h1>
                <p className="text-sm md:text-base text-glass-muted">ИИ-агент для автоматизации продаж</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-green-500/30 text-green-200 border border-green-400/50">Активен</Badge>
                  <Badge variant="outline" className="border-white/20 text-gray-200 bg-white/5">Продажи</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 relative z-10">
          <GlassCard variant="subtle" className="p-4 animate-scale-in">
            <p className="text-xs text-glass-muted mb-1">Всего пользователей</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{analyticsData.totalUsers}</p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-green-400">
              <Icon name="TrendingUp" size={16} />
              <span>+{analyticsData.weeklyGrowth}% за неделю</span>
            </div>
          </GlassCard>

          <GlassCard variant="subtle" className="p-4 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <p className="text-xs text-glass-muted mb-1">Активных сейчас</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{analyticsData.activeUsers}</p>
            <Progress value={(analyticsData.activeUsers / analyticsData.totalUsers) * 100} className="h-2" />
          </GlassCard>

          <GlassCard variant="subtle" className="p-4 animate-scale-in" style={{ animationDelay: '200ms' }}>
            <p className="text-xs text-glass-muted mb-1">Сообщений</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{analyticsData.totalMessages}</p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-glass-muted">
              <Icon name="MessageSquare" size={16} />
              <span>В среднем 12.4 в день</span>
            </div>
          </GlassCard>

          <GlassCard variant="subtle" className="p-4 animate-scale-in" style={{ animationDelay: '300ms' }}>
            <p className="text-xs text-glass-muted mb-1">Время ответа</p>
            <p className="text-2xl md:text-3xl font-bold text-white mb-3">{analyticsData.avgResponseTime}</p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-green-400">
              <Icon name="Zap" size={16} />
              <span>Отлично</span>
            </div>
          </GlassCard>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6 relative z-10">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-3 h-auto p-1 glass-panel-subtle border border-white/10 bg-transparent">
            <TabsTrigger
              value="analytics"
              className="py-2 text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="BarChart3" size={16} className="mr-1 md:mr-2" />
              <span>Аналитика</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="py-2 text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Plug" size={16} className="mr-1 md:mr-2" />
              <span>Интеграции</span>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="py-2 text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="CreditCard" size={16} className="mr-1 md:mr-2" />
              <span className="hidden md:inline">Тарифы</span>
              <span className="md:hidden">Цены</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-transparent border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-glass-title">Статистика за неделю</CardTitle>
                <CardDescription className="text-glass-muted">Активность пользователей и сообщений</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyStats.map((stat, index) => (
                    <div key={stat.day} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium w-12">{stat.day}</span>
                        <div className="flex-1 mx-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Progress 
                                value={(stat.users / 250) * 100} 
                                className="h-6 md:h-8 bg-blue-100" 
                              />
                            </div>
                            <div className="flex-1">
                              <Progress 
                                value={(stat.messages / 800) * 100} 
                                className="h-6 md:h-8 bg-purple-100" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 md:gap-6 text-xs md:text-sm">
                          <span className="text-blue-600 font-semibold w-10 md:w-12 text-right">{stat.users}</span>
                          <span className="text-purple-600 font-semibold w-10 md:w-12 text-right">{stat.messages}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-4 md:gap-6 pt-4 border-t text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span>Пользователи</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500"></div>
                      <span>Сообщения</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-glass-title">Эффективность бота</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>Успешно обработано запросов</span>
                    <span className="font-semibold text-white">{analyticsData.successRate}%</span>
                  </div>
                  <Progress value={analyticsData.successRate} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <TelegramIntegration />
            
            <Card className="bg-transparent border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-glass-title">Другие интеграции</CardTitle>
                <CardDescription className="text-glass-muted">Подключите дополнительные платформы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiIntegrations.map((api, index) => (
                  <div 
                    key={api.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-white/10 rounded-lg hover:border-primary/40 hover:bg-white/5 transition-all animate-fade-in gap-3"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/10 ${api.color}`}>
                        <Icon name={api.icon as any} size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-white">{api.name}</h4>
                        <p className="text-xs md:text-sm text-glass-muted">
                          {api.status === 'connected' ? 'Подключено' : 'Не подключено'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {api.status === 'connected' ? (
                        <>
                          <Badge className="bg-green-500/30 text-green-200 border border-green-400/50">Активно</Badge>
                          <Button type="button" size="sm" className="btn-glass-secondary">
                            <Icon name="Settings" size={14} className="mr-1" />
                            Настроить
                          </Button>
                        </>
                      ) : (
                        <Button type="button" size="sm" onClick={() => handleConnectAPI(api.name)} className="btn-glass-primary">
                          <Icon name="Plus" size={14} className="mr-1" />
                          Подключить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card className="bg-transparent border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-glass-title">Тарифные планы</CardTitle>
                <CardDescription className="text-glass-muted">Выберите подходящий тариф для вашего бота</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <GlassCard variant="subtle" className="p-6 hover:-translate-y-1 transition-transform">
                    <h3 className="text-lg font-semibold text-white">Базовый</h3>
                    <p className="text-glass-muted text-sm">Для начинающих</p>
                    <div className="mt-4">
                      <span className="text-3xl md:text-4xl font-bold text-white">2,000₽</span>
                      <span className="text-glass-muted">/мес</span>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>До 1000 пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>5000 сообщений/мес</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>1 платформа</span>
                      </div>
                      <Button className="w-full mt-4 btn-glass-secondary">Выбрать</Button>
                    </div>
                  </GlassCard>

                  <GlassCard variant="accent" className="p-6 md:scale-105">
                    <Badge className="w-fit mb-2 bg-primary/30 text-white border border-primary/50">Популярный</Badge>
                    <h3 className="text-lg font-semibold text-white">Профессиональный</h3>
                    <p className="text-glass-muted text-sm">Для роста бизнеса</p>
                    <div className="mt-4">
                      <span className="text-3xl md:text-4xl font-bold text-white">5,000₽</span>
                      <span className="text-glass-muted">/мес</span>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>До 10,000 пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>50,000 сообщений/мес</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>3 платформы</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>Приоритетная поддержка</span>
                      </div>
                      <Button className="w-full mt-4 btn-glass-primary">Выбрать</Button>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" className="p-6 hover:-translate-y-1 transition-transform">
                    <h3 className="text-lg font-semibold text-white">Корпоративный</h3>
                    <p className="text-glass-muted text-sm">Для крупных компаний</p>
                    <div className="mt-4">
                      <span className="text-3xl md:text-4xl font-bold text-white">15,000₽</span>
                      <span className="text-glass-muted">/мес</span>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>Неограниченно пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>Безлимит сообщений</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>Все платформы</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-200">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <span>Персональный менеджер</span>
                      </div>
                      <Button className="w-full mt-4 btn-glass-secondary">Связаться</Button>
                    </div>
                  </GlassCard>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <p className="text-xs text-glass-muted text-center mt-6 mb-4">* Instagram признан экстремистской организацией и запрещен на территории РФ.</p>
      
      <BotSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        botName="Помощник продаж"
      />
    </PageLayout>
  );
};

export default BotDetails;