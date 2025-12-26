import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { mockBots } from '@/components/marketplace/mockBots';
import AdminStatsTab from '@/components/admin/AdminStatsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminPricingTab from '@/components/admin/AdminPricingTab';
import AdminTemplatesTab from '@/components/admin/AdminTemplatesTab';
import AdminDocsTab from '@/components/admin/AdminDocsTab';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activeBots, setActiveBots] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const [planPrices, setPlanPrices] = useState({
    optimal: 990,
    premium: 2990,
    partner: 4990
  });

  const [templatePrice, setTemplatePrice] = useState(0);
  const [constructorPrice, setConstructorPrice] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec');
        const data = await response.json();
        if (data.users) {
          setUsers(data.users.map((u: any) => ({
            id: u.id,
            name: u.name || 'Пользователь',
            email: u.email,
            plan: u.plan || 'free',
            role: u.role || 'user',
            registeredAt: u.created_at || new Date().toISOString(),
            activeBots: 0,
            status: 'active'
          })));
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();

    const loadActiveBots = () => {
      const saved = localStorage.getItem('activeBots');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setActiveBots(parsed || []);
        } catch (error) {
          console.error('Ошибка загрузки ботов:', error);
          setActiveBots([]);
        }
      } else {
        setActiveBots([]);
      }
    };
    loadActiveBots();

    const loadPaymentHistory = () => {
      const saved = localStorage.getItem('paymentHistory');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPaymentHistory(parsed || []);
        } catch (error) {
          console.error('Ошибка загрузки платежей:', error);
          setPaymentHistory([]);
        }
      } else {
        setPaymentHistory([]);
      }
    };
    loadPaymentHistory();
  }, []);

  const handleUpdatePrices = () => {
    toast({
      title: 'Цены обновлены',
      description: 'Новые тарифы вступят в силу для новых подписок'
    });
  };

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

  const totalRevenue = paymentHistory
    .filter((p: any) => p.status === 'success')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyRevenue = paymentHistory
    .filter((p: any) => {
      if (p.status !== 'success') return false;
      const paymentDate = new Date(p.date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const platformStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.plan !== 'free').length,
    totalBots: activeBots.length,
    activeBots: activeBots.filter((b: any) => b.status === 'active').length,
    totalRevenue: totalRevenue,
    monthlyRevenue: monthlyRevenue,
    marketplaceBots: mockBots.length,
    customTemplates: mockBots.filter(b => b.price === 0).length
  };

  console.log('🔍 Admin platformStats:', {
    activeBots: activeBots,
    activeBots_length: activeBots.length,
    paymentHistory_length: paymentHistory.length,
    monthlyRevenue: monthlyRevenue,
    mockBots_length: mockBots.length,
    platformStats: platformStats
  });

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
                Управление платформой, статистика и настройки
              </p>
            </div>
            <Badge variant="destructive" className="flex items-center gap-2">
              <Icon name="Shield" size={16} />
              Администратор
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Icon name="DollarSign" size={16} className="mr-2" />
              Тарифы
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Icon name="Library" size={16} className="mr-2" />
              Шаблоны
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

          <TabsContent value="pricing" className="space-y-4">
            <AdminPricingTab planPrices={planPrices} setPlanPrices={setPlanPrices} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <AdminTemplatesTab />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <AdminDocsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;