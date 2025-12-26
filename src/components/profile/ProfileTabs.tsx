import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useBotStats } from '@/contexts/BotStatsContext';

interface User {
  plan: 'free' | 'optimal' | 'premium' | 'partner';
}

interface ProfileTabsProps {
  user: User | null;
  name: string;
  email: string;
  company: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onSave: () => void;
  paymentHistory: Array<{
    id: string;
    description: string;
    date: Date;
    amount: number;
    status: 'success' | 'failed';
  }>;
}

export function ProfileTabs({
  user,
  name,
  email,
  company,
  onNameChange,
  onEmailChange,
  onCompanyChange,
  onSave,
  paymentHistory
}: ProfileTabsProps) {
  const navigate = useNavigate();
  const { activeBots } = useActiveBots();
  const { getBotStats } = useBotStats();

  return (
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
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Компания</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => onCompanyChange(e.target.value)}
              />
            </div>
            <Button type="button" disabled={false} onClick={onSave} className="w-full">
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
                  <CardTitle className="text-base">Активные боты</CardTitle>
                  <CardDescription>Ваши текущие ИИ-агенты</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="ShoppingBag" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>У вас пока нет активных ботов</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>
                        Перейти в маркетплейс
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBots.map((bot) => {
                        const stats = getBotStats(bot.botId);
                        return (
                          <div key={`order-${bot.botId}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
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
                  <CardTitle className="text-base">История платежей</CardTitle>
                  <CardDescription>Все транзакции по вашему аккаунту</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Receipt" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>История платежей пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${payment.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                              <Icon 
                                name={payment.status === 'success' ? 'CheckCircle' : 'XCircle'} 
                                size={20} 
                                className={payment.status === 'success' ? 'text-green-600' : 'text-red-600'}
                              />
                            </div>
                            <div>
                              <p className="font-semibold">{payment.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.date.toLocaleDateString('ru-RU', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{payment.amount}₽</p>
                            <Badge variant={payment.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                              {payment.status === 'success' ? 'Успешно' : 'Отклонено'}
                            </Badge>
                          </div>
                        </div>
                      ))}
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
  );
}
