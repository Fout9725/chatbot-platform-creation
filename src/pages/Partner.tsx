import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Partner = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id.slice(0, 10).toUpperCase() || 'ABC123XYZ';
  const referralLink = `https://intellectpro.ru/ref/${referralCode}`;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (user?.plan !== 'partner') {
      toast({
        title: 'Доступ ограничен',
        description: 'Партнёрский кабинет доступен только на тарифе "Партнёрский"',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: 'Скопировано!',
      description: 'Реферальная ссылка скопирована в буфер обмена',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const [stats] = useState({
    totalReferrals: 24,
    activeReferrals: 18,
    totalEarnings: 14580,
    currentBalance: 5240,
    monthlyEarnings: 8950,
    conversionRate: 32,
  });

  const [recentReferrals] = useState([
    { id: 1, name: 'Иван И.', plan: 'Оптимальный', date: '2024-11-05', earning: 198 },
    { id: 2, name: 'Мария С.', plan: 'Премиум', date: '2024-11-04', earning: 598 },
    { id: 3, name: 'Петр К.', plan: 'Партнёрский', date: '2024-11-03', earning: 1998 },
    { id: 4, name: 'Анна В.', plan: 'Оптимальный', date: '2024-11-02', earning: 198 },
  ]);

  const planColors: Record<string, string> = {
    'Оптимальный': 'bg-blue-100 text-blue-800',
    'Премиум': 'bg-purple-100 text-purple-800',
    'Партнёрский': 'bg-green-100 text-green-800',
  };

  if (!isAuthenticated || user?.plan !== 'partner') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 rounded-xl">
                <Icon name="Users" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Партнёрский кабинет
                </h1>
                <p className="text-xs text-muted-foreground">Зарабатывайте вместе с ИнтеллектПро</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button type="button" variant="outline" size="sm" disabled={false}>
                  <Icon name="LayoutDashboard" size={18} className="mr-2" />
                  Личный кабинет
                </Button>
              </Link>
              <Link to="/">
                <Button type="button" variant="ghost" size="sm" disabled={false}>
                  <Icon name="Home" size={18} className="mr-2" />
                  Главная
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Всего рефералов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Icon name="Users" className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-green-600">+{stats.activeReferrals}</span> активных
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Заработано всего</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{stats.totalEarnings}₽</div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <Icon name="TrendingUp" className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">За всё время</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">К выплате</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">{stats.currentBalance}₽</div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Icon name="Wallet" className="text-purple-600" size={20} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Доступно сейчас</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Доход за месяц</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{stats.monthlyEarnings}₽</div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Icon name="Calendar" className="text-orange-600" size={20} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ноябрь 2024</p>
            </CardContent>
          </Card>
        </div>

        <Alert className="mb-6 bg-green-50 border-green-200">
          <Icon name="Gift" size={16} className="text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Ваша комиссия: 20%</strong> от каждого платежа рефералов, пожизненно! 
            Чем больше ваши рефералы зарабатывают, тем больше зарабатываете вы.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referrals">
              <Icon name="Users" size={16} className="mr-2" />
              Рефералы
            </TabsTrigger>
            <TabsTrigger value="link">
              <Icon name="Link" size={16} className="mr-2" />
              Реф. ссылка
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Последние рефералы</CardTitle>
                <CardDescription>Пользователи, зарегистрировавшиеся по вашей ссылке</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReferrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Icon name="User" size={20} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{ref.name}</p>
                          <p className="text-xs text-muted-foreground">{ref.date}</p>
                        </div>
                        <Badge className={planColors[ref.plan] || 'bg-gray-100'}>
                          {ref.plan}
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">+{ref.earning}₽</p>
                          <p className="text-xs text-muted-foreground">ваш доход</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-white border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Link" className="text-green-600" />
                  Ваша реферальная ссылка
                </CardTitle>
                <CardDescription>
                  Делитесь этой ссылкой, чтобы приглашать новых пользователей и получать комиссию
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    type="button"
                    disabled={false}
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    <Icon name={copied ? 'Check' : 'Copy'} size={18} className="mr-2" />
                    {copied ? 'Скопировано' : 'Копировать'}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                    <Icon name="Share2" size={20} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Делитесь везде</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Telegram, VK, соцсети, email рассылки
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                    <Icon name="Percent" size={20} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">20% комиссия</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        От всех платежей, пожизненно
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                    <Icon name="TrendingUp" size={20} className="text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Пассивный доход</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Получайте доход от рефералов каждый месяц
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                    <Icon name="Wallet" size={20} className="text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Быстрые выплаты</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Еженедельно на любую карту
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Icon name="Lightbulb" size={16} className="text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    <strong>Совет:</strong> Создайте обзор платформы, напишите кейс или гайд. 
                    Качественный контент привлекает больше рефералов!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Конверсия рефералов</CardTitle>
                  <CardDescription>Процент оплативших пользователей</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-primary">{stats.conversionRate}%</div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${stats.conversionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {stats.activeReferrals} из {stats.totalReferrals} рефералов активны
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Средний доход с реферала</CardTitle>
                  <CardDescription>Примерная сумма за месяц</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {Math.round(stats.monthlyEarnings / stats.activeReferrals)}₽
                  </div>
                  <p className="text-sm text-muted-foreground">
                    При {stats.activeReferrals} активных рефералах
                  </p>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-800">
                      💡 Рекомендуйте тарифы Премиум и Партнёрский для увеличения дохода
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Распределение по тарифам</CardTitle>
                <CardDescription>Какие тарифы выбирают ваши рефералы</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Оптимальный (990₽)</span>
                      <Badge variant="secondary">8 чел.</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Премиум (2990₽)</span>
                      <Badge variant="secondary">6 чел.</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: '35%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Партнёрский (4990₽)</span>
                      <Badge variant="secondary">4 чел.</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Partner;