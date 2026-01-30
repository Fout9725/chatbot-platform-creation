import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AdminStatsTab from '@/components/admin/AdminStatsTab';
import AdminBotsTab from '@/components/admin/AdminBotsTab';
import AdminMarketplaceTab from '@/components/admin/AdminMarketplaceTab';
import AdminTemplatesTab from '@/components/admin/AdminTemplatesTab';
import AdminPricingTab from '@/components/admin/AdminPricingTab';
import AdminDocsTab from '@/components/admin/AdminDocsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminBotBuilderTab from '@/components/admin/AdminBotBuilderTab';

const ADMIN_PASSWORD = 'neuro2024';

const AdminNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: 'Доступ разрешён',
        description: 'Добро пожаловать в административную панель'
      });
    } else {
      toast({
        title: 'Неверный пароль',
        description: 'Попробуйте ещё раз',
        variant: 'destructive'
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из административной панели'
    });
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateText, setTemplateText] = useState('');
  const [n8nJson, setN8nJson] = useState('');
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');

  const [planPrices, setPlanPrices] = useState({
    optimal: 990,
    premium: 2990,
    partner: 9990
  });

  const [users, setUsers] = useState([
    { id: 'admin-001', name: 'Администратор', email: 'admin@intellectpro.ru', plan: 'partner' as const, role: 'admin' as const, registeredAt: '01.01.2024', activeBots: 0, status: 'active' as const },
  ]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Lock" />
              Вход в административную панель
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  <Icon name="ArrowLeft" size={18} />
                </Button>
              </div>
            </form>
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
    totalUsers: 1,
    activeUsers: 1,
    totalBots: 0,
    activeBots: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    marketplaceBots: 0,
    customTemplates: 0
  };

  const marketplaceBots: Array<{ id: number; name: string; author: string; downloads: number; rating: number; status: string }> = [];

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
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="flex items-center gap-2">
                <Icon name="Shield" size={16} />
                Администратор
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="bots">
              <Icon name="Bot" size={16} className="mr-2" />
              Боты
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <Icon name="Store" size={16} className="mr-2" />
              Маркетплейс
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Icon name="Wrench" size={16} className="mr-2" />
              Конструктор
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
            <AdminStatsTab platformStats={platformStats} />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <AdminUsersTab users={users} setUsers={setUsers} />
          </TabsContent>

          <TabsContent value="bots" className="space-y-4">
            <AdminBotsTab
              botName={botName}
              setBotName={setBotName}
              botDescription={botDescription}
              setBotDescription={setBotDescription}
              selectedFile={selectedFile}
              handleFileUpload={handleFileUpload}
              handleCreateBot={handleCreateBot}
            />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <AdminMarketplaceTab marketplaceBots={marketplaceBots} />
          </TabsContent>

          <TabsContent value="builder" className="space-y-4">
            <AdminBotBuilderTab />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <AdminTemplatesTab
              templateText={templateText}
              setTemplateText={setTemplateText}
              n8nJson={n8nJson}
              setN8nJson={setN8nJson}
              selectedFile={selectedFile}
              handleFileUpload={handleFileUpload}
              handleUploadTemplate={handleUploadTemplate}
            />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <AdminPricingTab planPrices={planPrices} setPlanPrices={setPlanPrices} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <AdminDocsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNew;