import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const [planPrices, setPlanPrices] = useState({
    optimal: 990,
    premium: 2990,
    partner: 4990
  });

  const [templatePrice, setTemplatePrice] = useState(0);
  const [constructorPrice, setConstructorPrice] = useState(0);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Icon name="ShieldAlert" />
              Доступ запрещён
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Эта страница доступна только администраторам.
            </p>
            <Button onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdatePrices = () => {
    toast({
      title: 'Цены обновлены',
      description: 'Новые тарифы вступят в силу для новых подписок'
    });
  };

  const platformStats = {
    totalUsers: 45892,
    activeUsers: 32451,
    totalBots: 12458,
    activeBots: 8932,
    totalRevenue: 2847350,
    monthlyRevenue: 456780,
    avgSessionTime: '24м 35с',
    conversionRate: 12.5
  };

  const recentActivity = [
    { type: 'user_signup', user: 'user@example.com', time: '2 минуты назад', plan: 'free' },
    { type: 'payment', user: 'client@company.com', time: '15 минут назад', plan: 'premium', amount: 2990 },
    { type: 'bot_created', user: 'dev@startup.ru', time: '32 минуты назад', botName: 'Продажный помощник' },
    { type: 'user_signup', user: 'admin@business.com', time: '1 час назад', plan: 'optimal' },
    { type: 'payment', user: 'partner@agency.ru', time: '2 часа назад', plan: 'partner', amount: 4990 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Вернуться в панель
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Административная панель
              </h1>
              <p className="text-muted-foreground">
                Управление платформой, статистика и настройки
              </p>
            </div>
            <Badge variant="destructive" className="flex items-center gap-2">
              <Icon name="Shield" size={16} />
              Администратор
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Icon name="DollarSign" size={16} className="mr-2" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Icon name="Library" size={16} className="mr-2" />
              Шаблоны
            </TabsTrigger>
            <TabsTrigger value="docs">
              <Icon name="FileText" size={16} className="mr-2" />
              Документы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Всего пользователей</CardDescription>
                  <CardTitle className="text-3xl">{platformStats.totalUsers.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="TrendingUp" size={14} className="text-green-600" />
                    <span>Активных: {platformStats.activeUsers.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Всего ботов</CardDescription>
                  <CardTitle className="text-3xl">{platformStats.totalBots.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Activity" size={14} className="text-blue-600" />
                    <span>Активных: {platformStats.activeBots.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Месячная выручка</CardDescription>
                  <CardTitle className="text-3xl">{(platformStats.monthlyRevenue / 1000).toFixed(0)}K₽</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="TrendingUp" size={14} className="text-green-600" />
                    <span>+15.3% к прошлому месяцу</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Конверсия</CardDescription>
                  <CardTitle className="text-3xl">{platformStats.conversionRate}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Target" size={14} className="text-purple-600" />
                    <span>Цель: 15%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Activity" className="text-primary" />
                  Последняя активность
                </CardTitle>
                <CardDescription>
                  События на платформе в реальном времени
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'user_signup' && (
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Icon name="UserPlus" size={18} className="text-green-600" />
                          </div>
                        )}
                        {activity.type === 'payment' && (
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon name="CreditCard" size={18} className="text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'bot_created' && (
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon name="Bot" size={18} className="text-purple-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">
                            {activity.type === 'user_signup' && 'Новый пользователь'}
                            {activity.type === 'payment' && 'Оплата подписки'}
                            {activity.type === 'bot_created' && 'Создан бот'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user} • {activity.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.plan && (
                          <Badge variant="outline">{activity.plan}</Badge>
                        )}
                        {activity.amount && (
                          <p className="text-sm font-semibold text-green-600">
                            +{activity.amount}₽
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>
                  Поиск, фильтрация и модерация пользователей
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Поиск по email или ID..."
                    className="flex-1"
                  />
                  <Button type="button">
                    <Icon name="Search" size={18} />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Быстрые фильтры:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm">
                      <Icon name="Crown" size={14} className="mr-2" />
                      Премиум пользователи
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      <Icon name="Users" size={14} className="mr-2" />
                      Партнёры
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      <Icon name="Calendar" size={14} className="mr-2" />
                      Новые (7 дней)
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      <Icon name="AlertCircle" size={14} className="mr-2" />
                      Неактивные (30+ дней)
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted p-6 rounded-lg text-center">
                  <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Выберите фильтр или воспользуйтесь поиском
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление тарифами</CardTitle>
                <CardDescription>
                  Изменение стоимости подписок и функций
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Тариф "Оптимальный" (₽/месяц)
                    </label>
                    <Input
                      type="number"
                      value={planPrices.optimal}
                      onChange={(e) => setPlanPrices({...planPrices, optimal: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Тариф "Премиум" (₽/месяц)
                    </label>
                    <Input
                      type="number"
                      value={planPrices.premium}
                      onChange={(e) => setPlanPrices({...planPrices, premium: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Тариф "Партнёрский" (₽/месяц)
                    </label>
                    <Input
                      type="number"
                      value={planPrices.partner}
                      onChange={(e) => setPlanPrices({...planPrices, partner: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Лимиты конструктора</h4>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Стоимость дополнительного шаблона (₽)
                    </label>
                    <Input
                      type="number"
                      value={templatePrice}
                      onChange={(e) => setTemplatePrice(parseInt(e.target.value))}
                      placeholder="0 = бесплатно"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Стоимость генерации по тексту (₽)
                    </label>
                    <Input
                      type="number"
                      value={constructorPrice}
                      onChange={(e) => setConstructorPrice(parseInt(e.target.value))}
                      placeholder="0 = включено в тариф"
                    />
                  </div>
                </div>

                <Button type="button" className="w-full" onClick={handleUpdatePrices}>
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить изменения
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Библиотека N8N шаблонов</CardTitle>
                <CardDescription>
                  Добавление и управление шаблонами для конструктора
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="button" className="w-full">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить новый шаблон
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Существующие шаблоны (8)</h4>
                  <div className="space-y-2">
                    {['CRM Интеграция', 'Email автоответчик', 'Аналитика данных', 'Соц. сети автопостинг'].map((template, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon name="FileCode" className="text-primary" />
                          <div>
                            <p className="font-semibold text-sm">{template}</p>
                            <p className="text-xs text-muted-foreground">
                              Использований: {Math.floor(Math.random() * 500) + 50}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="sm">
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button type="button" variant="ghost" size="sm">
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление документами</CardTitle>
                <CardDescription>
                  Редактирование юридических документов и политик
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Icon name="FileText" size={16} />
                      Пользовательское соглашение
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Текст пользовательского соглашения..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Icon name="Shield" size={16} />
                      Политика конфиденциальности
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Текст политики конфиденциальности..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Icon name="ScrollText" size={16} />
                      Публичная оферта
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Текст публичной оферты..."
                    />
                  </div>
                </div>

                <Separator />

                <Button type="button" className="w-full">
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить все документы
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <Icon name="Info" size={16} className="inline mr-2" />
                    <strong>Важно:</strong> Изменения в юридических документах вступают в силу немедленно. 
                    Пользователи получат уведомление об обновлении.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
