import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface MarketplaceBot {
  id: number;
  name: string;
  author: string;
  downloads: number;
  rating: number;
  status: string;
}

interface AdminMarketplaceTabProps {
  marketplaceBots: MarketplaceBot[];
}

const AdminMarketplaceTab = ({ marketplaceBots }: AdminMarketplaceTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление маркетплейсом</CardTitle>
        <CardDescription>
          Модерация и управление ботами в маркетплейсе
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {marketplaceBots.map((bot) => (
            <div key={bot.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon name="Bot" className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{bot.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Автор: {bot.author} • {bot.downloads} загрузок • ⭐ {bot.rating}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                  {bot.status === 'active' ? 'Активен' : 'На модерации'}
                </Badge>
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

        <Separator />

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1">
            <Icon name="Filter" size={16} className="mr-2" />
            Фильтры
          </Button>
          <Button type="button" variant="outline" className="flex-1">
            <Icon name="SortAsc" size={16} className="mr-2" />
            Сортировка
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMarketplaceTab;
