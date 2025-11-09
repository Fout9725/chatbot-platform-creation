import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { mockBots } from '../marketplace/mockBots';

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
  const { toast } = useToast();
  const [filterActive, setFilterActive] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'downloads' | 'rating'>('name');
  
  const allBots = mockBots.map(bot => ({
    id: bot.id,
    name: bot.name,
    author: 'Шаблон',
    downloads: bot.users,
    rating: bot.rating,
    status: 'active'
  }));
  
  const displayBots = marketplaceBots.length > 0 ? marketplaceBots : allBots;

  const handleEditBot = (botId: number, botName: string) => {
    toast({
      title: 'Редактирование бота',
      description: `Открыто редактирование "${botName}"`,
    });
  };

  const handleDeleteBot = (botId: number, botName: string) => {
    if (confirm(`Вы уверены, что хотите удалить бота "${botName}"?`)) {
      toast({
        title: 'Бот удалён',
        description: `"${botName}" был удалён из маркетплейса`,
        variant: 'destructive',
      });
    }
  };

  const handleToggleFilter = () => {
    setFilterActive(!filterActive);
    toast({
      title: filterActive ? 'Фильтры отключены' : 'Фильтры включены',
      description: filterActive ? 'Показываются все боты' : 'Показываются только активные боты',
    });
  };

  const handleToggleSort = () => {
    const nextSort = sortBy === 'name' ? 'downloads' : sortBy === 'downloads' ? 'rating' : 'name';
    setSortBy(nextSort);
    const sortNames = { name: 'по имени', downloads: 'по загрузкам', rating: 'по рейтингу' };
    toast({
      title: 'Сортировка изменена',
      description: `Сортировка ${sortNames[nextSort]}`,
    });
  };
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
          {displayBots.map((bot) => (
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
                <Button type="button" variant="ghost" size="sm" onClick={() => handleEditBot(bot.id, bot.name)}>
                  <Icon name="Edit" size={16} />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteBot(bot.id, bot.name)}>
                  <Icon name="Trash2" size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {displayBots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Store" size={48} className="mx-auto mb-3 opacity-20" />
            <p>Ботов в маркетплейсе пока нет</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant={filterActive ? 'default' : 'outline'} 
            className="flex-1"
            onClick={handleToggleFilter}
            disabled={displayBots.length === 0}
          >
            <Icon name="Filter" size={16} className="mr-2" />
            Фильтры
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={handleToggleSort}
            disabled={displayBots.length === 0}
          >
            <Icon name="SortAsc" size={16} className="mr-2" />
            Сортировка
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMarketplaceTab;