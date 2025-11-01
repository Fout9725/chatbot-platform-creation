import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import BotMarketplace from '@/components/BotMarketplace';
import { Link } from 'react-router-dom';
import BotConstructorModal from '@/components/modals/BotConstructorModal';
import AuthModal from '@/components/modals/AuthModal';
import ConstructorModeModal from '@/components/modals/ConstructorModeModal';
const Index = () => {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
                  BotPlatform
                </h1>
                <p className="text-xs text-muted-foreground">Платформа для создания ИИ-агентов</p>
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
              <Button type="button" disabled={false} variant="outline" size="sm" onClick={() => setIsAuthOpen(true)}>
                <Icon name="User" size={18} className="md:mr-2" />
                <span className="hidden md:inline">Профиль</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Создавайте умных ботов за минуты
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Платформа для разработки чат-ботов, ИИ-агентов и ИИ-сотрудников для социальных сетей и бизнеса
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
    </div>
  );
};

export default Index;