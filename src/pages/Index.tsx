import { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
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
              <Link to="/docs">
                <Button type="button" disabled={false} variant="ghost" size="sm" className="hidden md:flex">
                  <Icon name="BookOpen" size={18} className="mr-2" />
                  <span className="hidden lg:inline">Документация</span>
                </Button>
              </Link>
              <Link to="/notifications">
                <Button type="button" disabled={false} variant="ghost" size="sm" className="hidden md:flex">
                  <Icon name="Bell" size={18} className="mr-2" />
                  <span className="hidden lg:inline">Уведомления</span>
                </Button>
              </Link>
              <Button type="button" disabled={false} variant={isAuthenticated ? 'default' : 'outline'} size="sm" onClick={handleProfileClick}>
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

        {/* Общая статистика платформы */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 animate-fade-in">
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Активных ИИ-агентов</CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary">12,458</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="TrendingUp" size={12} className="text-green-500" />
                +23% за месяц
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Пользователей</CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-bold text-blue-600">45,892</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="TrendingUp" size={12} className="text-green-500" />
                +18% за месяц
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Сообщений/день</CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-bold text-green-600">2.4М</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="TrendingUp" size={12} className="text-green-500" />
                +31% за месяц
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Партнёров</CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-bold text-orange-600">1,234</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="TrendingUp" size={12} className="text-green-500" />
                +45% за месяц
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Раздел партнерской программы */}
        <Card className="mb-8 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 border-purple-300 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl mb-2 flex items-center gap-2">
                  <Icon name="Handshake" size={28} className="text-primary" />
                  Партнёрская программа
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Зарабатывайте до 100,000₽/мес, рекомендуя нашу платформу
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-lg">
                <div className="bg-green-500 text-white p-2 rounded-lg">
                  <Icon name="Percent" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base">20% комиссия</p>
                  <p className="text-xs text-muted-foreground">От платежей рефералов (пожизненно)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-lg">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                  <Icon name="ShoppingCart" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base">70% от продаж</p>
                  <p className="text-xs text-muted-foreground">За каждого проданного ИИ-агента</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/70 p-3 rounded-lg">
                <div className="bg-purple-500 text-white p-2 rounded-lg">
                  <Icon name="Wallet" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base">Быстрые выплаты</p>
                  <p className="text-xs text-muted-foreground">Еженедельно на карту</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/partner" className="flex-1">
                <Button type="button" disabled={false} className="w-full" size="lg">
                  <Icon name="Rocket" size={18} className="mr-2" />
                  Стать партнёром
                </Button>
              </Link>
              <Button type="button" disabled={false} variant="outline" size="lg" className="flex-1" onClick={() => setIsCalculatorOpen(true)}>
                <Icon name="Calculator" size={18} className="mr-2" />
                Калькулятор дохода
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-r from-gray-50 to-white border-gray-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icon name="Scale" size={24} className="text-gray-700" />
              Юридическая информация
            </CardTitle>
            <CardDescription>
              Правовые аспекты использования платформы ИнтеллектПро
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/docs/terms" 
                className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
              >
                <Icon name="FileText" size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Пользовательское соглашение</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Условия использования сервиса
                  </p>
                </div>
              </a>

              <a 
                href="/docs/privacy" 
                className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
              >
                <Icon name="Shield" size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Политика конфиденциальности</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Защита персональных данных
                  </p>
                </div>
              </a>

              <a 
                href="/docs/oferta" 
                className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
              >
                <Icon name="FileCheck" size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Публичная оферта</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Договор на оказание услуг
                  </p>
                </div>
              </a>
            </div>

            <div className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/legal')}
              >
                <Icon name="Building" size={18} className="mr-2" />
                Подробная юридическая информация и реквизиты
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  type="button"
                  disabled={false}
                  variant={activeTab === 'constructor' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsModeModalOpen(true);
                  }}
                >
                  <Icon name="Boxes" size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Конструктор</span>
                  <span className="sm:hidden">Создать</span>
                </Button>

                <Button
                  type="button"
                  disabled={false}
                  variant={activeTab === 'my-bots' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('/my-bots', '_blank');
                  }}
                >
                  <Icon name="Folder" size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Мои боты</span>
                  <span className="sm:hidden">Мои</span>
                </Button>
              </div>

              <TabsContent value="marketplace" className="animate-fade-in">
                <BotMarketplace />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-muted-foreground">
            <p className="text-center md:text-left">© 2024 BotPlatform. Все права защищены.</p>
            <div className="flex gap-3 md:gap-4">
              <a href="#" className="hover:text-primary transition-colors">Помощь</a>
              <a href="#" className="hover:text-primary transition-colors">Документация</a>
              <a href="#" className="hover:text-primary transition-colors">Контакты</a>
            </div>
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
    </div>
  );
};

export default Index;