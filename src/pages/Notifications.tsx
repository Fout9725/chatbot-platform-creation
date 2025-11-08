import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'success',
    title: 'ИИ-агент успешно запущен',
    message: 'Ваш ИИ-агент "Продажный помощник" начал работу',
    time: '5 минут назад',
    read: false
  },
  {
    id: 2,
    type: 'info',
    title: 'Новое обновление',
    message: 'Доступна новая версия платформы с улучшениями',
    time: '1 час назад',
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Приближается лимит',
    message: 'Использовано 80% месячного лимита сообщений',
    time: '3 часа назад',
    read: true
  },
  {
    id: 4,
    type: 'success',
    title: 'Платеж обработан',
    message: 'Подписка Pro успешно продлена',
    time: '1 день назад',
    read: true
  },
  {
    id: 5,
    type: 'info',
    title: 'Новый пользователь',
    message: 'К вашему ИИ-агенту подключился 100-й пользователь!',
    time: '2 дня назад',
    read: true
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return { icon: 'CheckCircle', color: 'text-green-500' };
    case 'warning': return { icon: 'AlertTriangle', color: 'text-yellow-500' };
    case 'error': return { icon: 'XCircle', color: 'text-red-500' };
    default: return { icon: 'Info', color: 'text-blue-500' };
  }
};

const Notifications = () => {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

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
            <Link to="/">
              <Button type="button" disabled={false} variant="ghost" size="sm">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Назад
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Уведомления</h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `У вас ${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
            </p>
          </div>
          <Button type="button" disabled={false} variant="outline" size="sm">
            <Icon name="Check" size={16} className="mr-2" />
            Отметить все как прочитанные
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              Все
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">{mockNotifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Непрочитанные
              {unreadCount > 0 && (
                <Badge className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="important">
              Важные
            </TabsTrigger>
            <TabsTrigger value="archive">
              Архив
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {mockNotifications.map((notification) => {
              const iconConfig = getNotificationIcon(notification.type);
              return (
                <Card 
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon 
                          name={iconConfig.icon as any} 
                          className={iconConfig.color} 
                          size={20} 
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1 flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">Новое</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {notification.message}
                          </CardDescription>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {mockNotifications.filter(n => !n.read).map((notification) => {
              const iconConfig = getNotificationIcon(notification.type);
              return (
                <Card 
                  key={notification.id}
                  className="border-l-4 border-l-primary bg-primary/5 transition-all hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon 
                          name={iconConfig.icon as any} 
                          className={iconConfig.color} 
                          size={20} 
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1 flex items-center gap-2">
                            {notification.title}
                            <Badge variant="secondary" className="text-xs">Новое</Badge>
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {notification.message}
                          </CardDescription>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="important">
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Icon name="Star" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Нет важных уведомлений</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Icon name="Archive" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Архив пуст</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Notifications;