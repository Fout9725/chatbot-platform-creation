import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { categories } from '../marketplace/types';

const AdminBotBuilderTab = () => {
  const { toast } = useToast();
  const [botData, setBotData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    rentPrice: '',
    icon: 'Bot',
    features: '',
    fullDescription: '',
  });

  const [createdBots, setCreatedBots] = useState<any[]>([]);

  const iconOptions = [
    'Bot', 'ShoppingBag', 'Store', 'Filter', 'TrendingUp', 'Phone', 'GraduationCap',
    'Home', 'Plane', 'Car', 'Building2', 'Headphones', 'Wrench', 'MessageCircleQuestion',
    'PackageX', 'Shield', 'AlertCircle', 'Rocket', 'Package', 'Lock', 'Star', 'Users',
    'UserSearch', 'UserPlus', 'Clock', 'ClipboardCheck', 'BookOpen', 'BarChart3',
    'FileText', 'Mail', 'Calendar', 'Megaphone', 'Target', 'TrendingUp', 'DollarSign',
    'CreditCard', 'PieChart', 'LineChart', 'Activity', 'Zap', 'Cpu', 'Database',
    'Server', 'Cloud', 'Wifi', 'Globe', 'Link', 'Code', 'Terminal', 'GitBranch'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!botData.name || !botData.description || !botData.category || !botData.price) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    const newBot = {
      id: Date.now(),
      name: botData.name,
      description: botData.description,
      category: botData.category,
      price: parseFloat(botData.price),
      rentPrice: parseFloat(botData.rentPrice) || Math.floor(parseFloat(botData.price) / 10),
      rating: 4.5,
      users: 0,
      icon: botData.icon,
      features: botData.features.split(',').map(f => f.trim()).filter(f => f),
      fullDescription: botData.fullDescription,
      status: 'active'
    };

    setCreatedBots([...createdBots, newBot]);

    toast({
      title: 'Шаблон бота создан! 🎉',
      description: `Бот "${botData.name}" добавлен в маркетплейс`,
    });

    setBotData({
      name: '',
      description: '',
      category: '',
      price: '',
      rentPrice: '',
      icon: 'Bot',
      features: '',
      fullDescription: '',
    });
  };

  const handleDelete = (botId: number) => {
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      setCreatedBots(createdBots.filter(bot => bot.id !== botId));
      toast({
        title: 'Шаблон удалён',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Wrench" size={24} />
            Конструктор шаблонов ботов
          </CardTitle>
          <CardDescription>
            Создайте новый шаблон бота для маркетплейса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название бота *</Label>
                <Input
                  id="name"
                  value={botData.name}
                  onChange={(e) => setBotData({ ...botData, name: e.target.value })}
                  placeholder="Помощник продаж"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Категория *</Label>
                <Select 
                  value={botData.category} 
                  onValueChange={(value) => setBotData({ ...botData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'Все').map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Цена покупки (₽) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={botData.price}
                  onChange={(e) => setBotData({ ...botData, price: e.target.value })}
                  placeholder="45000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rentPrice">Цена аренды/мес (₽)</Label>
                <Input
                  id="rentPrice"
                  type="number"
                  value={botData.rentPrice}
                  onChange={(e) => setBotData({ ...botData, rentPrice: e.target.value })}
                  placeholder="3000"
                />
                <p className="text-xs text-muted-foreground">По умолчанию: 10% от цены покупки</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Иконка</Label>
                <Select 
                  value={botData.icon} 
                  onValueChange={(value) => setBotData({ ...botData, icon: value })}
                >
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          <Icon name={icon as any} size={16} />
                          {icon}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Краткое описание *</Label>
                <Textarea
                  id="description"
                  value={botData.description}
                  onChange={(e) => setBotData({ ...botData, description: e.target.value })}
                  placeholder="ИИ-агент для автоматизации продаж..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Возможности (через запятую)</Label>
              <Input
                id="features"
                value={botData.features}
                onChange={(e) => setBotData({ ...botData, features: e.target.value })}
                placeholder="Квалификация лидов, Автоответы 24/7, Интеграция с CRM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullDescription">Полное описание</Label>
              <Textarea
                id="fullDescription"
                value={botData.fullDescription}
                onChange={(e) => setBotData({ ...botData, fullDescription: e.target.value })}
                placeholder="Подробное описание функционала бота..."
                rows={5}
              />
            </div>

            <Button type="submit" className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать шаблон
            </Button>
          </form>
        </CardContent>
      </Card>

      {createdBots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Созданные шаблоны ({createdBots.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {createdBots.map((bot) => (
              <div key={bot.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name={bot.icon as any} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{bot.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {bot.category} • {bot.price.toLocaleString()} ₽ • {bot.features.length} возможностей
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: 'Редактирование',
                        description: 'Функция в разработке',
                      });
                    }}
                  >
                    <Icon name="Edit" size={16} />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(bot.id)}
                  >
                    <Icon name="Trash2" size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBotBuilderTab;
