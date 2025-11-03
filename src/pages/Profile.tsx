import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSave = () => {
    toast({
      title: 'Профиль обновлен',
      description: 'Ваши данные успешно сохранены',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: 'Вы вышли из системы',
      description: 'До встречи!',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Bot" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  BotPlatform
                </h1>
                <p className="text-xs text-muted-foreground">Платформа для создания ИИ-агентов</p>
              </div>
            </Link>
            <Link to="/dashboard">
              <Button type="button" disabled={false} variant="ghost" size="sm">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Назад
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Профиль</h2>
          <p className="text-muted-foreground">Управление настройками аккаунта</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan" />
                  <AvatarFallback>ИП</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
                <Button type="button" disabled={false} variant="outline" className="w-full">
                  <Icon name="Upload" size={16} className="mr-2" />
                  Изменить фото
                </Button>
                <Button 
                  type="button" 
                  disabled={false}
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Выйти
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Настройки аккаунта</CardTitle>
              <CardDescription>Обновите информацию профиля</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">
                    <Icon name="User" size={16} className="mr-2" />
                    Общее
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Icon name="Lock" size={16} className="mr-2" />
                    Безопасность
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Компания</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <Button type="button" disabled={false} onClick={handleSave} className="w-full">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить изменения
                  </Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Текущий пароль</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button type="button" disabled={false} className="w-full">
                    <Icon name="Shield" size={16} className="mr-2" />
                    Изменить пароль
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <Icon name="Bot" className="text-primary mb-2" size={24} />
              <CardTitle className="text-lg">Мои боты</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Активных ботов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Icon name="MessageSquare" className="text-secondary mb-2" size={24} />
              <CardTitle className="text-lg">Сообщения</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3,542</p>
              <p className="text-sm text-muted-foreground">За этот месяц</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Icon name="Users" className="text-primary mb-2" size={24} />
              <CardTitle className="text-lg">Пользователи</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">847</p>
              <p className="text-sm text-muted-foreground">Всего клиентов</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;