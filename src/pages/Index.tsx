import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import BotMarketplace from '@/components/BotMarketplace';
import { Link, useNavigate } from 'react-router-dom';
import BotConstructorModal from '@/components/modals/BotConstructorModal';
import AuthModal from '@/components/modals/AuthModal';
import ConstructorModeModal from '@/components/modals/ConstructorModeModal';
import EarningsCalculatorModal from '@/components/modals/EarningsCalculatorModal';
import { useAuth } from '@/contexts/AuthContext';
const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeBots, setActiveBots] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec');
        const data = await response.json();
        if (data.users) {
          setTotalUsers(data.users.length);
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
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
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Bot" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ИнтеллектПро
                </h1>
                <p className="text-xs text-muted-foreground">Интеллект в действии</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/instagram-automation')}>
                <Icon name="Instagram" size={18} className="mr-2" />
                <span className="hidden lg:inline">Instagram Авто</span>
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/docs')}>
                <Icon name="BookOpen" size={18} className="mr-2" />
                <span className="hidden lg:inline">Документация</span>
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/legal')}>
                <Icon name="Scale" size={18} className="mr-2" />
                <span className="hidden lg:inline">Юридическая информация</span>
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => window.location.href = 'mailto:support@intellectpro.ru'}>
                <Icon name="Mail" size={18} className="mr-2" />
                <span className="hidden lg:inline">Контакты</span>
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/admin')}>
                  <Icon name="Shield" size={18} className="mr-2" />
                  <span className="hidden lg:inline">Админ-панель</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/notifications')}>
                <Icon name="Bell" size={18} className="mr-2" />
                <span className="hidden lg:inline">Уведомления</span>
              </Button>
              <Button variant={isAuthenticated ? 'default' : 'outline'} size="sm" onClick={handleProfileClick}>
                <Icon name="User" size={18} className="md:mr-2" />
                <span className="hidden md:inline">{isAuthenticated ? user?.name : 'Войти'}</span>
              </Button>

            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Создавайте умных ИИ-сотрудников за минуты
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Платформа для разработки ИИ-сотрудников и ИИ-агентов для социальных сетей и бизнеса
          </p>
        </div>





        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <div className="flex gap-2">
                <TabsList className="flex-1 grid grid-cols-1 h-auto p-1">
                  <TabsTrigger 
                    value="marketplace" 
                    className="flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm"
                  >
                    <Icon name="Store" size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">Маркетплейс</span>
                    <span className="sm:hidden">Магазин</span>
                  </TabsTrigger>
                </TabsList>
                
                <Button
                  variant={activeTab === 'constructor' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsAuthOpen(true);
                    } else if (!user?.plan || user?.plan === 'free') {
                      navigate('/pricing');
                    } else {
                      setIsModeModalOpen(true);
                    }
                  }}
                >
                  <Icon name="Boxes" size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Конструктор</span>
                  <span className="sm:hidden">Создать</span>
                </Button>

                <Button
                  variant={activeTab === 'my-bots' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm"
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate('/my-bots');
                    } else {
                      setIsAuthOpen(true);
                    }
                  }}
                >
                  <Icon name="Folder" size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Мои боты</span>
                  <span className="sm:hidden">Мои</span>
                </Button>
              </div>

              <TabsContent value="marketplace" className="animate-fade-in pointer-events-auto">
                <BotMarketplace />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>

    <footer className="border-t bg-white backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-xs md:text-sm text-muted-foreground">
          <p className="text-center">© 2024 ИнтеллектПро. Все права защищены.</p>
        </div>
      </div>
    </footer>

    <BotConstructorModal 
        isOpen={isConstructorOpen} 
        onClose={() => setIsConstructorOpen(false)} 
      />
      
      <ConstructorModeModal 
        isOpen={isModeModalOpen} 
        onClose={() => setIsModeModalOpen(false)} 
      />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
      
      <EarningsCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </>
  );
};

export default Index;