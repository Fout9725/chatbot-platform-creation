import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'optimal' | 'premium' | 'partner';
  role: 'user' | 'admin';
  registeredAt: string;
  activeBots: number;
  status: 'active' | 'blocked';
}

interface AdminUsersTabProps {
  users: User[];
  setUsers: (users: User[]) => void;
}

const AdminUsersTab = ({ users, setUsers }: AdminUsersTabProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const syncUsers = async (isManual = false) => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec');
      const data = await response.json();
      
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        const dbUsers: User[] = data.users.map((u: any) => ({
          id: u.id.toString(),
          name: u.name || 'Пользователь',
          email: u.email,
          plan: (u.plan || 'free') as 'free' | 'optimal' | 'premium' | 'partner',
          role: (u.role || 'user') as 'user' | 'admin',
          registeredAt: u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU'),
          activeBots: 0,
          status: 'active'
        }));
        setUsers(dbUsers);
        
        toast({
          title: 'Синхронизация завершена',
          description: `Загружено ${dbUsers.length} пользователей из базы данных`,
        });
      }
    } catch (error) {
      console.error('Ошибка синхронизации пользователей:', error);
      toast({
        title: 'Ошибка синхронизации',
        description: 'Не удалось загрузить пользователей из базы данных',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleBlockUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const newStatus = user?.status === 'active' ? 'blocked' : 'active';
    
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: newStatus }
        : u
    ));
    toast({
      title: newStatus === 'active' ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
      description: `${user?.name} ${newStatus === 'active' ? 'снова может' : 'больше не может'} использовать платформу`,
    });
  };

  const handleChangePlan = async (userId: string, newPlan: 'free' | 'optimal' | 'premium' | 'partner') => {
    const user = users.find(u => u.id === userId);
    
    setUsers(users.map(u => 
      u.id === userId ? { ...u, plan: newPlan } : u
    ));
    toast({
      title: 'Тариф изменён',
      description: `${user?.name} переведён на тариф ${newPlan}`,
    });
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    const user = users.find(u => u.id === userId);
    
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    toast({
      title: 'Роль изменена',
      description: `${user?.name} назначена роль ${newRole === 'admin' ? 'администратора' : 'пользователя'}`,
    });
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'free': return 'secondary';
      case 'optimal': return 'default';
      case 'premium': return 'default';
      case 'partner': return 'default';
      default: return 'secondary';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Бесплатный';
      case 'optimal': return 'Оптимальный';
      case 'premium': return 'Премиум';
      case 'partner': return 'Партнёрский';
      default: return plan;
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      'ID': user.id,
      'Имя': user.name,
      'Email': user.email,
      'Тариф': getPlanName(user.plan),
      'Роль': user.role === 'admin' ? 'Администратор' : 'Пользователь',
      'Дата регистрации': user.registeredAt,
      'Активных ботов': user.activeBots,
      'Статус': user.status === 'active' ? 'Активен' : 'Заблокирован'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `users_export_${date}.xlsx`);
    
    toast({
      title: 'Экспорт завершён',
      description: `Экспортировано ${filteredUsers.length} пользователей`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>
              Всего пользователей: {users.length} • Активных: {users.filter(u => u.status === 'active').length}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => syncUsers(true)}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <Icon name={isSyncing ? "Loader2" : "RefreshCw"} size={16} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              className="flex items-center gap-2"
            >
              <Icon name="Download" size={16} />
              Экспорт в Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Тариф" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все тарифы</SelectItem>
              <SelectItem value="free">Бесплатный</SelectItem>
              <SelectItem value="optimal">Оптимальный</SelectItem>
              <SelectItem value="premium">Премиум</SelectItem>
              <SelectItem value="partner">Партнёрский</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="blocked">Заблокированные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Icon name="Loader2" size={48} className="animate-spin text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Синхронизация пользователей...</p>
              <p className="text-sm text-muted-foreground">Загружаем данные из базы</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg mt-1">
                    <Icon name="User" className="text-primary" size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.name}</p>
                      {user.role === 'admin' && (
                        <Badge variant="destructive" className="text-xs">
                          <Icon name="Shield" size={12} className="mr-1" />
                          Админ
                        </Badge>
                      )}
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>ID: {user.id}</span>
                      <span>•</span>
                      <span>Ботов: {user.activeBots}</span>
                      <span>•</span>
                      <span>Регистрация: {user.registeredAt}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={getPlanBadgeVariant(user.plan)}>
                  {getPlanName(user.plan)}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Select 
                  value={user.plan} 
                  onValueChange={(value) => handleChangePlan(user.id, value as any)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Бесплатный</SelectItem>
                    <SelectItem value="optimal">Оптимальный</SelectItem>
                    <SelectItem value="premium">Премиум</SelectItem>
                    <SelectItem value="partner">Партнёрский</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={user.role} 
                  onValueChange={(value) => handleChangeRole(user.id, value as any)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  type="button" 
                  variant={user.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleBlockUser(user.id)}
                  className="h-8 text-xs"
                >
                  <Icon name={user.status === 'active' ? 'Ban' : 'CheckCircle'} size={14} className="mr-1" />
                  {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Icon name="Mail" size={14} className="mr-1" />
                  Написать
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <Icon name="Trash2" size={14} className="mr-1" />
                  Удалить
                </Button>
              </div>
            </div>
          ))}
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Users" size={48} className="mx-auto mb-3 opacity-20" />
            <p>Пользователи не найдены</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUsersTab;