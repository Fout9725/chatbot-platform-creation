import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ProfileStatsProps {
  activeBots: number;
  totalMessages: number;
  totalUsers: number;
}

export function ProfileStats({ activeBots, totalMessages, totalUsers }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Card>
        <CardHeader className="pb-3">
          <Icon name="Bot" className="text-primary mb-2" size={24} />
          <CardTitle className="text-lg">Мои ИИ-агенты</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{activeBots}</p>
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
  );
}
