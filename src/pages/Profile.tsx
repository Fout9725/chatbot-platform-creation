import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useBotStats } from '@/contexts/BotStatsContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUserAvatar } = useAuth();
  const { toast } = useToast();
  const { activeBots } = useActiveBots();
  const { getBotStats } = useBotStats();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  
  const avatarSeeds = [
    'happy1', 'happy2', 'happy3', 'happy4', 'happy5', 'happy6',
    'smile1', 'smile2', 'smile3', 'joy1', 'joy2', 'joy3',
    'sunny1', 'sunny2', 'sunny3', 'fun1', 'fun2', 'fun3'
  ];
  
  const totalUsers = activeBots.reduce((sum, bot) => {
    const stats = getBotStats(bot.botId);
    return sum + stats.users;
  }, 0);
  
  const totalMessages = activeBots.reduce((sum, bot) => {
    const stats = getBotStats(bot.botId);
    return sum + stats.messages;
  }, 0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSave = () => {
    toast({
      title: 'Профиль обновлен',
      description: 'Ваши данные успешно сохранены',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: 'Вы вышли из системы',
      description: 'До встречи!',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Bot" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ИнтеллектПро
                </h1>
                <p className="text-xs text-muted-foreground">Интеллект в действии</p>
              </div>
            </Link>
            <Link to="/dashboard">
              <Button type="button" disabled={false} variant="ghost" size="sm">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Назад
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Профиль</h2>
          <p className="text-muted-foreground">Управление настройками аккаунта</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} />
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
                <Button 
                  type="button" 
                  disabled={false} 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsAvatarDialogOpen(true)}
                >
                  <Icon name="Upload" size={16} className="mr-2" />
                  Изменить фото
                </Button>
                <Button 
                  type="button" 
                  disabled={false}
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Выйти
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Настройки аккаунта</CardTitle>
              <CardDescription>Обновите информацию профиля</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">
                    <Icon name="User" size={16} className="mr-2" />
                    Общее
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Icon name="Lock" size={16} className="mr-2" />
                    Безопасность
                  </TabsTrigger>
                  <TabsTrigger value="tariff">
                    <Icon name="CreditCard" size={16} className="mr-2" />
                    Тариф
                  </TabsTrigger>
                  <TabsTrigger value="orders">
                    <Icon name="ShoppingBag" size={16} className="mr-2" />
                    Заказы
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Компания</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <Button type="button" disabled={false} onClick={handleSave} className="w-full">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить изменения
                  </Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Текущий пароль</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button type="button" disabled={false} className="w-full">
                    <Icon name="Shield" size={16} className="mr-2" />
                    Изменить пароль
                  </Button>
                </TabsContent>

                <TabsContent value="tariff" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Текущий тариф</p>
                        <p className="text-2xl font-bold text-primary">{user?.plan === 'free' ? 'Бесплатный' : user?.plan === 'optimal' ? 'Оптимальный' : user?.plan === 'premium' ? 'Премиум' : 'Партнёрский'}</p>
                      </div>
                      <Badge variant={user?.plan === 'free' ? 'secondary' : 'default'} className="text-sm">
                        {user?.plan === 'free' ? '1 бот' : user?.plan === 'optimal' ? '5 ботов' : user?.plan === 'premium' ? '20 ботов' : '∞ ботов'}
                      </Badge>
                    </div>

                    <div className="grid gap-4">
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Оптимальный</CardTitle>
                            <Badge>Популярный</Badge>
                          </div>
                          <CardDescription>Для малого бизнеса</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold mb-4">990₽<span className="text-sm font-normal text-muted-foreground">/мес</span></p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              До 5 ИИ-агентов
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              Безлимитные сообщения
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              Приоритетная поддержка
                            </li>
                          </ul>
                          <Button className="w-full" disabled={user?.plan === 'optimal'} onClick={() => navigate('/pricing')}>
                            {user?.plan === 'optimal' ? 'Текущий тариф' : 'Выбрать тариф'}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow border-primary">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Премиум</CardTitle>
                            <Badge variant="default">Лучшее предложение</Badge>
                          </div>
                          <CardDescription>Для среднего бизнеса</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold mb-4">2990₽<span className="text-sm font-normal text-muted-foreground">/мес</span></p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              До 20 ИИ-агентов
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              Безлимитные сообщения
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              VIP поддержка 24/7
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              Аналитика и отчёты
                            </li>
                          </ul>
                          <Button className="w-full" disabled={user?.plan === 'premium'} onClick={() => navigate('/pricing')}>
                            {user?.plan === 'premium' ? 'Текущий тариф' : 'Выбрать тариф'}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-blue-50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Партнёрский</CardTitle>
                            <Badge variant="secondary">Для партнёров</Badge>
                          </div>
                          <CardDescription>Зарабатывайте с нами</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold mb-4">Бесплатно</p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              Безлимитные ИИ-агенты
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              20% комиссия от рефералов
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <Icon name="Check" size={16} className="text-green-500" />
                              70% от продаж ботов
                            </li>
                          </ul>
                          <Button className="w-full" variant="outline" onClick={() => navigate('/partner')}>
                            Стать партнёром
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">История заказов</CardTitle>
                        <CardDescription>Ваши покупки и подписки</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {activeBots.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon name="ShoppingBag" size={48} className="mx-auto mb-4 opacity-50" />
                            <p>У вас пока нет заказов</p>
                            <Button className="mt-4" onClick={() => navigate('/')}>
                              Перейти в маркетплейс
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activeBots.map((bot) => {
                              const stats = getBotStats(bot.botId);
                              return (
                                <div key={`order-${bot.botId}`} className="flex items-center justify-between p-4 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                      <Icon name="Bot" size={20} className="text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-semibold">{bot.botName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Активирован {new Date(bot.activatedAt).toLocaleDateString('ru-RU')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                                      {bot.status === 'active' ? 'Активен' : 'Истёк'}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {stats.messages} сообщений
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Платёжная информация</CardTitle>
                        <CardDescription>Управление способами оплаты</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon name="CreditCard" size={24} className="text-muted-foreground" />
                              <div>
                                <p className="font-semibold">Карта не привязана</p>
                                <p className="text-sm text-muted-foreground">Добавьте карту для быстрой оплаты</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Добавить карту
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <Icon name="Bot" className="text-primary mb-2" size={24} />
              <CardTitle className="text-lg">Мои ИИ-агенты</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeBots.length}</p>
              <p className="text-sm text-muted-foreground">Активных ИИ-агентов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Icon name="MessageSquare" className="text-secondary mb-2" size={24} />
              <CardTitle className="text-lg">Сообщения</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalMessages.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">За этот месяц</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Icon name="Users" className="text-primary mb-2" size={24} />
              <CardTitle className="text-lg">Пользователи</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Уникальных пользователей</p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Выберите аватар</DialogTitle>
            <DialogDescription>
              Выберите понравившийся аватар из галереи
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {avatarSeeds.map((seed) => {
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
              return (
                <button
                  key={seed}
                  onClick={() => {
                    updateUserAvatar(avatarUrl);
                    setIsAvatarDialogOpen(false);
                    toast({
                      title: 'Аватар обновлен',
                      description: 'Ваш новый аватар сохранен',
                    });
                  }}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{seed.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;