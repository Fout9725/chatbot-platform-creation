import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats] = useState({
    totalBots: 3,
    activeUsers: 156,
    messagesThisMonth: 2453,
    earnings: 1250
  });
  
  const userPlan = user?.plan || 'free';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const planNames: Record<string, string> = {
    free: 'Бесплатный',
    optimal: 'Оптимальный',
    premium: 'Премиум',
    partner: 'Партнёрский'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="LayoutDashboard" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Личный кабинет
                </h1>
                <p className="text-xs text-muted-foreground">
                  Тариф: {user ? planNames[user.plan] : 'Бесплатный'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/notifications">
                <Button type="button" variant="outline" size="sm" disabled={false}>
                  <Icon name="Bell" size={18} className="mr-2" />
                  Уведомления
                </Button>
              </Link>
              <Link to="/profile">
                <Button type="button" variant="outline" size="sm" disabled={false}>
                  <Icon name="User" size={18} className="mr-2" />
                  Профиль
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Всего ИИ-агентов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalBots}</div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon name="Bot" className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Активные пользователи</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.activeUsers}</div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Icon name="Users" className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Сообщений за месяц</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.messagesThisMonth}</div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Icon name="MessageCircle" className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Заработано</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.earnings}₽</div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Icon name="TrendingUp" className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="actions">Быстрые действия</TabsTrigger>
            <TabsTrigger value="bots">Мои боты</TabsTrigger>
            <TabsTrigger value="market">Маркетплейс</TabsTrigger>
            {userPlan === 'partner' && <TabsTrigger value="partner">Партнёрство</TabsTrigger>}
          </TabsList>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Icon name="Plus" className="text-white" size={24} />
                    </div>
                    <div>
                      <CardTitle>Создать бота</CardTitle>
                      <CardDescription>
                        Используйте конструктор или маркетплейс
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/constructor?mode=visual">
                    <Button type="button" className="w-full" variant="outline" disabled={false}>
                      <Icon name="Workflow" size={18} className="mr-2" />
                      Визуальный конструктор
                    </Button>
                  </Link>
                  <Link to="/constructor?mode=professional">
                    <Button type="button" className="w-full" variant="outline" disabled={false}>
                      <Icon name="Code2" size={18} className="mr-2" />
                      Профессиональный режим
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-3 rounded-lg">
                      <Icon name="Store" className="text-white" size={24} />
                    </div>
                    <div>
                      <CardTitle>Маркетплейс ботов</CardTitle>
                      <CardDescription>
                        Готовые решения для вашего бизнеса
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/">
                    <Button type="button" className="w-full" disabled={false}>
                      <Icon name="ShoppingBag" size={18} className="mr-2" />
                      Перейти в маркетплейс
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Интеграции</CardTitle>
                <CardDescription>Подключите мессенджеры к вашим ботам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button type="button" variant="outline" className="h-20 flex-col" disabled={false}>
                    <Icon name="Send" size={24} className="mb-2" />
                    <span className="text-xs">Telegram</span>
                  </Button>
                  <Button type="button" variant="outline" className="h-20 flex-col" disabled={false}>
                    <Icon name="MessageCircle" size={24} className="mb-2" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button type="button" variant="outline" className="h-20 flex-col" disabled={false}>
                    <Icon name="Facebook" size={24} className="mb-2" />
                    <span className="text-xs">VK</span>
                  </Button>
                  <Button type="button" variant="outline" className="h-20 flex-col" disabled={false}>
                    <Icon name="Instagram" size={24} className="mb-2" />
                    <span className="text-xs">Instagram</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bots">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Мои боты</CardTitle>
                    <CardDescription>Управляйте своими чат-ботами</CardDescription>
                  </div>
                  <Link to="/my-bots">
                    <Button type="button" disabled={false}>
                      <Icon name="ExternalLink" size={18} className="mr-2" />
                      Все боты
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Здесь будут отображаться ваши боты
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Маркетплейс готовых ботов</CardTitle>
                <CardDescription>Выберите готовое решение и начните использовать прямо сейчас</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/">
                  <Button type="button" size="lg" disabled={false}>
                    <Icon name="ShoppingBag" size={20} className="mr-2" />
                    Открыть маркетплейс
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {userPlan === 'partner' && (
            <TabsContent value="partner">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Gift" className="text-green-600" />
                      Ваша реферальная ссылка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-3 rounded-lg border mb-3 font-mono text-sm break-all">
                      https://chatbot-platform.com/ref/ABC123XYZ
                    </div>
                    <Button type="button" className="w-full" disabled={false}>
                      <Icon name="Copy" size={18} className="mr-2" />
                      Скопировать ссылку
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Статистика партнёра</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Рефералов:</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Заработано:</span>
                      <Badge className="bg-green-600">1,250₽</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">К выплате:</span>
                      <Badge className="bg-orange-600">450₽</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;