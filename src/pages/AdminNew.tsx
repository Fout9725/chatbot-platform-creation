import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';
const AdminNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated: isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const isAuthenticated = isLoggedIn && user?.role === 'admin';

  useEffect(() => {
    if (isLoggedIn && user?.role !== 'admin') {
      toast({ title: 'Доступ запрещён', description: 'У вас нет прав администратора', variant: 'destructive' });
      navigate('/');
    }
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
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

  if (!isAuthenticated) {
    return (
      <PageLayout
        title="Админ-панель"
        description="Управление платформой"
        keywords="админ-панель, ИнтеллектПро"
      >
        <div className="min-h-screen flex items-center justify-center px-4">
          <GlassCard variant="default" className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Icon name="Lock" />
              <h2 className="text-xl font-semibold">Доступ ограничен</h2>
            </div>
            <p className="text-sm text-glass-muted">
              Для доступа к административной панели войдите в систему с учётной записью администратора.
            </p>
            <Button onClick={() => navigate('/')} className="w-full btn-glass-primary">
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              На главную
            </Button>
          </GlassCard>
        </div>
      </PageLayout>
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
    <PageLayout
      title="Админ-панель"
      description="Управление платформой"
      keywords="админ-панель, управление, ИнтеллектПро"
    >
      <div className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="cube" size={180} />
        </div>
        <div className="mb-8 relative z-10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-gray-200 hover:text-white hover:bg-white/10"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Вернуться в панель
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-glass-title">
                Административная панель
              </h1>
              <p className="text-glass-muted">
                Управление платформой, ботами, шаблонами и контентом
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="flex items-center gap-2 bg-red-500/30 text-red-100 border border-red-400/50">
                <Icon name="Shield" size={16} />
                Администратор
              </Badge>
              <Button
                type="button"
                size="sm"
                onClick={handleLogout}
                className="btn-glass-secondary"
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative z-10">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto glass-panel-subtle border border-white/10 bg-transparent">
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger
              value="bots"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Bot" size={16} className="mr-2" />
              Боты
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Store" size={16} className="mr-2" />
              Маркетплейс
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Wrench" size={16} className="mr-2" />
              Конструктор
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Library" size={16} className="mr-2" />
              Шаблоны
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="DollarSign" size={16} className="mr-2" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
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
    </PageLayout>
  );
};

export default AdminNew;