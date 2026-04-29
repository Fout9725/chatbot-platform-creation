import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BotMarketplace from '@/components/BotMarketplace';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/modals/AuthModal';
import ConstructorModeModal from '@/components/modals/ConstructorModeModal';
import { useAuth } from '@/contexts/AuthContext';
import HowItWorks from '@/components/landing/HowItWorks';
import Hero3D from '@/components/hero3d/Hero3D';
import CtaBlock from '@/components/landing/CtaBlock';
import SiteFooter from '@/components/landing/SiteFooter';
import GeoPromo from '@/components/landing/GeoPromo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec');
        const data = await response.json();
        if (data.users) {
          setTotalUsers(data.users.length);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setIsAuthOpen(true);
    }
  };

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-violet-600 p-2 rounded-xl">
                <Icon name="Bot" className="text-white" size={22} />
              </div>
              <span className="text-lg font-bold text-gray-900">ИнтеллектПро</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={() => navigate('/pricing')}>
                Тарифы
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={scrollToCatalog}>
                Каталог
              </Button>
              <Button data-tour="my-bots" variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={() => navigate('/my-bots')}>
                Мои боты
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={() => navigate('/admin')}>
                  Админ
                </Button>
              )}

              <div className="flex items-center gap-0.5 ml-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/automation-hub')}
                      className="relative group w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 hover:border-amber-300 hover:from-amber-100 hover:to-orange-100 hover:shadow-md hover:shadow-amber-200/30 transition-all duration-200 hover:scale-105"
                    >
                      <Icon name="Zap" size={17} className="text-amber-600 group-hover:text-amber-700 transition-colors" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-medium">
                    Автоматизация
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/prompt-engineer')}
                      className="relative group w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200/60 hover:border-violet-300 hover:from-violet-100 hover:to-fuchsia-100 hover:shadow-md hover:shadow-violet-200/30 transition-all duration-200 hover:scale-105"
                    >
                      <Icon name="Sparkles" size={17} className="text-violet-600 group-hover:text-violet-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-medium">
                    Промт-помощник
                  </TooltipContent>
                </Tooltip>
              </div>

              <Button
                size="sm"
                onClick={() => navigate('/geo')}
                className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm shadow-indigo-500/20 border-0"
              >
                <Icon name="Radar" size={15} className="mr-1.5" />
                GEO Factory
              </Button>

              <Button
                variant={isAuthenticated ? 'default' : 'outline'}
                size="sm"
                onClick={handleProfileClick}
                className={isAuthenticated ? 'bg-violet-600 hover:bg-violet-700 ml-2' : 'ml-2'}
              >
                <Icon name="User" size={16} className="mr-1.5" />
                {isAuthenticated ? user?.name : 'Войти'}
              </Button>
            </nav>

            <div className="md:hidden flex items-center gap-2">
              <Button
                variant={isAuthenticated ? 'default' : 'outline'}
                size="sm"
                onClick={handleProfileClick}
                className={isAuthenticated ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                <Icon name="User" size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 mt-3 pt-3 pb-1 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}>
                <Icon name="CreditCard" size={16} className="mr-2" /> Тарифы
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { scrollToCatalog(); setMobileMenuOpen(false); }}>
                <Icon name="Store" size={16} className="mr-2" /> Каталог
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/my-bots'); setMobileMenuOpen(false); }}>
                <Icon name="Folder" size={16} className="mr-2" /> Мои боты
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/prompt-engineer'); setMobileMenuOpen(false); }}>
                <Icon name="Sparkles" size={16} className="mr-2" /> Промт-Инженер
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/docs'); setMobileMenuOpen(false); }}>
                <Icon name="BookOpen" size={16} className="mr-2" /> Документация
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/automation-hub'); setMobileMenuOpen(false); }}>
                <Icon name="Zap" size={16} className="mr-2" /> Автоматизация
              </Button>
              <Button
                className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
                onClick={() => { navigate('/geo'); setMobileMenuOpen(false); }}
              >
                <Icon name="Radar" size={16} className="mr-2" /> GEO Factory
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                  <Icon name="Shield" size={16} className="mr-2" /> Админ-панель
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <Hero3D />

      <section className="py-10 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 flex-wrap">
            {totalUsers > 0 && (
              <div className="flex items-center gap-1.5">
                <Icon name="Users" size={16} className="text-violet-500" />
                <span><b className="text-gray-800">{totalUsers.toLocaleString()}+</b> пользователей</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Icon name="Bot" size={16} className="text-violet-500" />
              <span><b className="text-gray-800">85</b> готовых ботов</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="Clock" size={16} className="text-violet-500" />
              <span><b className="text-gray-800">3 дня</b> бесплатно</span>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      <div data-tour="marketplace">
        <BotMarketplace />
      </div>

      <GeoPromo />

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8">Работает с популярными мессенджерами</h2>
          <div className="flex items-center justify-center gap-8 md:gap-16 opacity-60">
            <div className="flex flex-col items-center gap-2">
              <Icon name="MessageCircle" size={36} className="text-blue-500" />
              <span className="text-sm text-gray-500">Telegram</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Icon name="Phone" size={36} className="text-green-500" />
              <span className="text-sm text-gray-500">WhatsApp</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Icon name="Users" size={36} className="text-blue-600" />
              <span className="text-sm text-gray-500">ВКонтакте</span>
            </div>
            <div className="hidden md:flex flex-col items-center gap-2">
              <Icon name="Globe" size={36} className="text-gray-500" />
              <span className="text-sm text-gray-500">Веб-сайт</span>
            </div>
          </div>
        </div>
      </section>

      <div data-tour="constructor">
        <CtaBlock onAuthOpen={() => setIsAuthOpen(true)} />
      </div>

      <SiteFooter />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ConstructorModeModal isOpen={isModeModalOpen} onClose={() => setIsModeModalOpen(false)} />
    </div>
  );
};

export default Index;