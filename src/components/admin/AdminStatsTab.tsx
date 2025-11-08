import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalBots: number;
  activeBots: number;
  totalRevenue: number;
  monthlyRevenue: number;
  marketplaceBots: number;
  customTemplates: number;
}

interface AdminStatsTabProps {
  platformStats: PlatformStats;
}

const AdminStatsTab = ({ platformStats }: AdminStatsTabProps) => {
  return (
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
          <CardDescription>Ботов в маркетплейсе</CardDescription>
          <CardTitle className="text-3xl">{platformStats.marketplaceBots}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Store" size={14} className="text-purple-600" />
            <span>Шаблонов: {platformStats.customTemplates}</span>
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
    </div>
  );
};

export default AdminStatsTab;
