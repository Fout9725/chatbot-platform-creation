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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button type="button" disabled={false} variant="ghost" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
            <div className="flex gap-2">
              <Button type="button" disabled={false} variant="outline" size="sm" onClick={handleSettings}>
                <Icon name="Settings" size={16} className="mr-2" />
                <span className="hidden sm:inline">Настройки</span>
              </Button>
              <Button type="button" disabled={false} size="sm" onClick={handleStart}>
                <Icon name="Play" size={16} className="mr-2" />
                <span className="hidden sm:inline">Запустить</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-primary to-secondary p-3 md:p-4 rounded-xl">
                <Icon name="ShoppingBag" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Помощник продаж</h1>
                <p className="text-sm md:text-base text-muted-foreground">ИИ-агент для автоматизации продаж</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-green-500">Активен</Badge>
                  <Badge variant="outline">Продажи</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="animate-scale-in">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Всего пользователей</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{analyticsData.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-600">
                <Icon name="TrendingUp" size={16} />
                <span>+{analyticsData.weeklyGrowth}% за неделю</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Активных сейчас</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{analyticsData.activeUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(analyticsData.activeUsers / analyticsData.totalUsers) * 100} className="h-2" />
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Сообщений</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{analyticsData.totalMessages}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Icon name="MessageSquare" size={16} />
                <span>В среднем 12.4 в день</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Время ответа</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{analyticsData.avgResponseTime}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-600">
                <Icon name="Zap" size={16} />
                <span>Отлично</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-3 h-auto p-1">
            <TabsTrigger value="analytics" className="py-2 text-xs md:text-sm">
              <Icon name="BarChart3" size={16} className="mr-1 md:mr-2" />
              <span>Аналитика</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="py-2 text-xs md:text-sm">
              <Icon name="Plug" size={16} className="mr-1 md:mr-2" />
              <span>Интеграции</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="py-2 text-xs md:text-sm">
              <Icon name="CreditCard" size={16} className="mr-1 md:mr-2" />
              <span className="hidden md:inline">Тарифы</span>
              <span className="md:hidden">Цены</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика за неделю</CardTitle>
                <CardDescription>Активность пользователей и сообщений</CardDescription>
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

            <Card>
              <CardHeader>
                <CardTitle>Эффективность бота</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Успешно обработано запросов</span>
                    <span className="font-semibold">{analyticsData.successRate}%</span>
                  </div>
                  <Progress value={analyticsData.successRate} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <TelegramIntegration />
            
            <Card>
              <CardHeader>
                <CardTitle>Другие интеграции</CardTitle>
                <CardDescription>Подключите дополнительные платформы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiIntegrations.map((api, index) => (
                  <div 
                    key={api.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-all animate-fade-in gap-3"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 ${api.color}`}>
                        <Icon name={api.icon as any} size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm md:text-base">{api.name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {api.status === 'connected' ? 'Подключено' : 'Не подключено'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {api.status === 'connected' ? (
                        <>
                          <Badge className="bg-green-500">Активно</Badge>
                          <Button type="button" disabled={false} variant="outline" size="sm">
                            <Icon name="Settings" size={14} className="mr-1" />
                            Настроить
                          </Button>
                        </>
                      ) : (
                        <Button type="button" disabled={false} size="sm" onClick={() => handleConnectAPI(api.name)}>
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
            <Card>
              <CardHeader>
                <CardTitle>Тарифные планы</CardTitle>
                <CardDescription>Выберите подходящий тариф для вашего бота</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <Card className="border-2 hover:border-primary/30 transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">Базовый</CardTitle>
                      <CardDescription>Для начинающих</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl md:text-4xl font-bold">2,000₽</span>
                        <span className="text-muted-foreground">/мес</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>До 1000 пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>5000 сообщений/мес</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>1 платформа</span>
                      </div>
                      <Button variant="outline" className="w-full mt-4">Выбрать</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary shadow-lg scale-105">
                    <CardHeader>
                      <Badge className="w-fit mb-2">Популярный</Badge>
                      <CardTitle className="text-lg">Профессиональный</CardTitle>
                      <CardDescription>Для роста бизнеса</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl md:text-4xl font-bold">5,000₽</span>
                        <span className="text-muted-foreground">/мес</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>До 10,000 пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>50,000 сообщений/мес</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>3 платформы</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>Приоритетная поддержка</span>
                      </div>
                      <Button className="w-full mt-4">Выбрать</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/30 transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">Корпоративный</CardTitle>
                      <CardDescription>Для крупных компаний</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl md:text-4xl font-bold">15,000₽</span>
                        <span className="text-muted-foreground">/мес</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>Неограниченно пользователей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>Безлимит сообщений</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>Все платформы</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={16} className="text-green-500 mt-0.5" />
                        <span>Персональный менеджер</span>
                      </div>
                      <Button variant="outline" className="w-full mt-4">Связаться</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <p className="text-xs text-muted-foreground text-center mt-6 mb-4">* Instagram признан экстремистской организацией и запрещен на территории РФ.</p>
      
      <BotSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        botName="Помощник продаж"
      />
    </div>
  );
};

export default BotDetails;