import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

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
    case 'success': return { icon: 'CheckCircle', color: 'text-green-400' };
    case 'warning': return { icon: 'AlertTriangle', color: 'text-yellow-400' };
    case 'error': return { icon: 'XCircle', color: 'text-red-400' };
    default: return { icon: 'Info', color: 'text-blue-400' };
  }
};

const Notifications = () => {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const renderNotificationCard = (notification: Notification, forceUnreadStyle = false) => {
    const iconConfig = getNotificationIcon(notification.type);
    const isUnread = forceUnreadStyle || !notification.read;
    return (
      <GlassCard
        key={notification.id}
        variant="subtle"
        className={`p-5 transition-all hover:-translate-y-0.5 glass-fade-in ${
          isUnread ? 'border-l-4 border-l-primary' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Icon
              name={iconConfig.icon as any}
              className={iconConfig.color}
              size={20}
            />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold mb-1 flex items-center gap-2 text-white">
                {notification.title}
                {isUnread && (
                  <Badge className="text-xs bg-primary/20 text-primary border border-primary/40">
                    Новое
                  </Badge>
                )}
              </div>
              <p className="text-sm text-glass-muted">
                {notification.message}
              </p>
            </div>
          </div>
          <span className="text-xs text-glass-muted whitespace-nowrap">
            {notification.time}
          </span>
        </div>
      </GlassCard>
    );
  };

  return (
    <PageLayout
      title="Уведомления"
      description="Центр уведомлений ИнтеллектПро"
      keywords="уведомления, центр уведомлений, ИнтеллектПро"
    >
      <header className="border-b glass-divider glass-panel-subtle sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Bot" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-glass-title">
                  ИнтеллектПро
                </h1>
                <p className="text-xs text-glass-muted">Интеллект в действии</p>
              </div>
            </Link>
            <Link to="/">
              <Button type="button" variant="ghost" size="sm" className="text-gray-200 hover:text-white hover:bg-white/10">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Назад
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-4xl glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="rings" size={180} />
        </div>

        <div className="mb-8 flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-glass-title">Уведомления</h2>
            <p className="text-glass-muted">
              {unreadCount > 0 ? `У вас ${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="btn-glass-secondary"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Отметить все как прочитанные
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full relative z-10">
          <TabsList className="grid w-full grid-cols-4 mb-6 glass-panel-subtle border border-white/10 bg-transparent">
            <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300">
              Все
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/10 text-gray-200 border-white/10">
                  {mockNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300">
              Непрочитанные
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-primary/30 text-white border border-primary/50">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="important" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300">
              Важные
            </TabsTrigger>
            <TabsTrigger value="archive" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300">
              Архив
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {mockNotifications.map((notification) => renderNotificationCard(notification))}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {mockNotifications.filter(n => !n.read).map((notification) => renderNotificationCard(notification, true))}
          </TabsContent>

          <TabsContent value="important">
            <GlassCard variant="subtle" className="p-10 text-center">
              <Icon name="Star" size={48} className="mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-glass-muted">Нет важных уведомлений</p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="archive">
            <GlassCard variant="subtle" className="p-10 text-center">
              <Icon name="Archive" size={48} className="mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-glass-muted">Архив пуст</p>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </PageLayout>
  );
};

export default Notifications;
