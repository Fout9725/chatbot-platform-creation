import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateText, setTemplateText] = useState('');
  const [n8nJson, setN8nJson] = useState('');
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');

  const [planPrices, setPlanPrices] = useState({
    optimal: 990,
    premium: 2990,
    partner: 4990
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Icon name="ShieldAlert" />
              Доступ запрещён
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Эта страница доступна только администраторам.
            </p>
            <Button onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: 'Файл выбран',
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
      });
    }
  };

  const handleCreateBot = () => {
    if (!botName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите название бота',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Бот создан!',
      description: `${botName} добавлен в маркетплейс`
    });
    setBotName('');
    setBotDescription('');
  };

  const handleUploadTemplate = (type: 'text' | 'n8n' | 'file') => {
    if (type === 'text' && !templateText.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите описание шаблона',
        variant: 'destructive'
      });
      return;
    }

    if (type === 'n8n' && !n8nJson.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте JSON конфигурацию N8N',
        variant: 'destructive'
      });
      return;
    }

    if (type === 'file' && !selectedFile) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл для загрузки',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Шаблон добавлен!',
      description: `Новый шаблон доступен в конструкторе`
    });

    setTemplateText('');
    setN8nJson('');
    setSelectedFile(null);
  };

  const platformStats = {
    totalUsers: 45892,
    activeUsers: 32451,
    totalBots: 12458,
    activeBots: 8932,
    totalRevenue: 2847350,
    monthlyRevenue: 456780,
    marketplaceBots: 47,
    customTemplates: 23
  };

  const marketplaceBots = [
    { id: 1, name: 'CRM Помощник', author: 'admin', downloads: 342, rating: 4.8, status: 'active' },
    { id: 2, name: 'Email Автоответчик', author: 'moderator', downloads: 156, rating: 4.5, status: 'active' },
    { id: 3, name: 'Продажный бот', author: 'partner_123', downloads: 89, rating: 4.2, status: 'pending' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Вернуться в панель
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Административная панель
              </h1>
              <p className="text-muted-foreground">
                Управление платформой, ботами, шаблонами и контентом
              </p>
            </div>
            <Badge variant="destructive" className="flex items-center gap-2">
              <Icon name="Shield" size={16} />
              Администратор
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="bots">
              <Icon name="Bot" size={16} className="mr-2" />
              Боты
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <Icon name="Store" size={16} className="mr-2" />
              Маркетплейс
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Icon name="Library" size={16} className="mr-2" />
              Шаблоны
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Icon name="DollarSign" size={16} className="mr-2" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger value="docs">
              <Icon name="FileText" size={16} className="mr-2" />
              Документы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="bots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Создание бота для маркетплейса</CardTitle>
                <CardDescription>
                  Добавьте готового бота в маркетплейс платформы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название бота</label>
                  <Input
                    type="text"
                    placeholder="Продажный помощник"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Описание</label>
                  <Textarea
                    placeholder="Опишите функции и возможности бота..."
                    value={botDescription}
                    onChange={(e) => setBotDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Категория</label>
                    <Input type="text" placeholder="Продажи" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Цена (₽)</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Платформа</label>
                    <Input type="text" placeholder="Telegram" />
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Загрузить конфигурацию бота</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="bot-upload"
                    />
                    <label htmlFor="bot-upload" className="cursor-pointer">
                      <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : 'Нажмите для загрузки'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JSON, YAML (макс. 10MB)
                      </p>
                    </label>
                  </div>
                </div>

                <Button type="button" className="w-full" onClick={handleCreateBot}>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Создать и опубликовать бота
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="FileText" size={18} />
                    Из текста
                  </CardTitle>
                  <CardDescription>Создать шаблон из описания</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Опишите логику работы бота..."
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    rows={5}
                  />
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={() => handleUploadTemplate('text')}
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="Code" size={18} />
                    N8N JSON
                  </CardTitle>
                  <CardDescription>Импорт из N8N</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder='{"nodes": [...], "connections": {...}}'
                    value={n8nJson}
                    onChange={(e) => setN8nJson(e.target.value)}
                    rows={5}
                    className="font-mono text-xs"
                  />
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={() => handleUploadTemplate('n8n')}
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    Импортировать
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="Upload" size={18} />
                    Из файла
                  </CardTitle>
                  <CardDescription>Загрузить документ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".json,.txt,.yaml,.yml,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="template-upload"
                    />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      <Icon name="FileUp" size={24} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs font-medium">
                        {selectedFile ? selectedFile.name : 'Выберите файл'}
                      </p>
                    </label>
                  </div>
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={() => handleUploadTemplate('file')}
                    disabled={!selectedFile}
                  >
                    <Icon name="Upload" size={16} className="mr-2" />
                    Загрузить
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Существующие шаблоны</CardTitle>
                <CardDescription>Библиотека шаблонов платформы</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['CRM Интеграция', 'Email автоответчик', 'Аналитика данных', 'Соц. сети'].map((template, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="FileCode" className="text-primary" />
                        <div>
                          <p className="font-semibold text-sm">{template}</p>
                          <p className="text-xs text-muted-foreground">
                            Использований: {Math.floor(Math.random() * 500) + 50}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление тарифами</CardTitle>
                <CardDescription>Изменение стоимости подписок</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Оптимальный (₽/мес)</label>
                    <Input
                      type="number"
                      value={planPrices.optimal}
                      onChange={(e) => setPlanPrices({...planPrices, optimal: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Премиум (₽/мес)</label>
                    <Input
                      type="number"
                      value={planPrices.premium}
                      onChange={(e) => setPlanPrices({...planPrices, premium: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Партнёрский (₽/мес)</label>
                    <Input
                      type="number"
                      value={planPrices.partner}
                      onChange={(e) => setPlanPrices({...planPrices, partner: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <Button type="button" className="w-full">
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить изменения
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление документами</CardTitle>
                <CardDescription>Редактирование юридических документов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Пользовательское соглашение</label>
                  <Textarea rows={4} placeholder="Текст соглашения..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Политика конфиденциальности</label>
                  <Textarea rows={4} placeholder="Текст политики..." />
                </div>
                <Button type="button" className="w-full">
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить документы
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNew;
