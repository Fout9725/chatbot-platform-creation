import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useBotStats } from '@/contexts/BotStatsContext';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { AvatarDialog } from '@/components/profile/AvatarDialog';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUserAvatar } = useAuth();
  const { toast } = useToast();
  const { activeBots } = useActiveBots();
  const { getBotStats } = useBotStats();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  
  const paymentHistory = (() => {
    const saved = localStorage.getItem('paymentHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => ({
          ...p,
          date: new Date(p.date)
        }));
      } catch {
        return [];
      }
    }
    return [];
  })();
  
  const avatarSeeds = [
    'Felix', 'Aneka', 'Jasmine', 'Chloe', 'Max', 'Lucy',
    'Charlie', 'Mia', 'Oliver', 'Lily', 'Jack', 'Emma',
    'Sophie', 'Leo', 'Zoe', 'Noah', 'Bella', 'Sam'
  ];
  
  const totalUsers = activeBots.reduce((sum, bot) => {
    const stats = getBotStats(bot.botId);
    return sum + stats.users;
  }, 0);
  
  const totalMessages = activeBots.reduce((sum, bot) => {
    const stats = getBotStats(bot.botId);
    return sum + stats.messages;
  }, 0);

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

  const handleSelectAvatar = (avatarUrl: string) => {
    updateUserAvatar(avatarUrl);
    setIsAvatarDialogOpen(false);
    toast({
      title: 'Аватар обновлен',
      description: 'Ваш новый аватар сохранен',
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
                  ИнтеллектПро
                </h1>
                <p className="text-xs text-muted-foreground">Интеллект в действии</p>
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
          <div data-tour="profile-sidebar">
            <ProfileSidebar
              name={name}
              email={email}
              avatar={user?.avatar}
              onChangeAvatar={() => setIsAvatarDialogOpen(true)}
              onLogout={handleLogout}
            />
          </div>

          <div data-tour="profile-tabs" className="md:col-span-2">
            <ProfileTabs
              user={user}
              name={name}
              email={email}
              company={company}
              onNameChange={setName}
              onEmailChange={setEmail}
              onCompanyChange={setCompany}
              onSave={handleSave}
              paymentHistory={paymentHistory}
            />
          </div>
        </div>

        <ProfileStats
          activeBots={activeBots.length}
          totalMessages={totalMessages}
          totalUsers={totalUsers}
        />
      </main>
      
      <AvatarDialog
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        avatarSeeds={avatarSeeds}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
};

export default Profile;