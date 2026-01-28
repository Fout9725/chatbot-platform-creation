import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBots } from './marketplace/mockBots';
import { categories } from './marketplace/types';
import BotCard from './marketplace/BotCard';
import CategoryFilter from './marketplace/CategoryFilter';
import SearchBar from './marketplace/SearchBar';
import PriceFilter from './marketplace/PriceFilter';
import RatingFilter from './marketplace/RatingFilter';
import PaymentModal from './modals/PaymentModal';
import BotDetailsModal from './modals/BotDetailsModal';
import AuthModal from './modals/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useAuth } from '@/contexts/AuthContext';

const BotMarketplace = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Все');
  
  const handleCategoryChange = (category: string) => {
    console.log('🔵 BotMarketplace: Category change requested:', category);
    setSelectedCategory(category);
    console.log('🟢 BotMarketplace: State updated to:', category);
  };
  const [searchQuery, setSearchQuery] = useState('');
  
  const maxPrice = useMemo(() => Math.max(...mockBots.map(bot => bot.price)), []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [minRating, setMinRating] = useState(0);
  
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; botId: number; mode: 'buy' | 'rent' }>({ 
    isOpen: false, 
    botId: 0, 
    mode: 'buy' 
  });
  
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; botId: number }>({ 
    isOpen: false, 
    botId: 0 
  });
  
  const { toast } = useToast();
  const { activateBot } = useActiveBots();
  const { user, isAuthenticated, setUserActivatedBot } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const filteredBots = mockBots.filter((bot) => {
    const matchesCategory = selectedCategory === 'Все' || bot.category === selectedCategory;
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = bot.price >= priceRange[0] && bot.price <= priceRange[1];
    const matchesRating = bot.rating >= minRating;
    return matchesCategory && matchesSearch && matchesPrice && matchesRating;
  });

  const handleBuy = (id: number) => {
    setPaymentModal({ isOpen: true, botId: id, mode: 'buy' });
  };

  const handleRent = (id: number) => {
    setPaymentModal({ isOpen: true, botId: id, mode: 'rent' });
  };
  
  const handleDetails = (id: number) => {
    setDetailsModal({ isOpen: true, botId: id });
  };
  
  const handleTest = (id: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Зарегистрируйтесь, чтобы активировать бота",
        variant: 'destructive',
      });
      setIsAuthModalOpen(true);
      return;
    }
    
    const PLAN_LIMITS: Record<string, number> = {
      free: 1,
      optimal: 5,
      premium: 20,
      partner: Infinity
    };
    
    const userPlan = user?.plan || 'free';
    const maxBots = PLAN_LIMITS[userPlan];
    const currentBots = JSON.parse(localStorage.getItem('activeBots') || '[]');
    
    if (currentBots.length >= maxBots) {
      toast({
        title: "Достигнут лимит тарифа",
        description: `На тарифе "${userPlan}" доступно максимум ${maxBots} ${maxBots === 1 ? 'бот' : 'ботов'}. Улучшите тариф для добавления новых ботов.`,
        variant: 'destructive',
      });
      return;
    }
    
    const bot = mockBots.find(b => b.id === id);
    if (bot) {
      const existingBot = currentBots.find((b: any) => b.botId === id);
      
      if (existingBot) {
        toast({
          title: "Бот уже активирован",
          description: `Бот "${bot.name}" уже есть в разделе "Мои боты"`,
          variant: 'default',
        });
        navigate('/my-bots');
        return;
      }
      
      activateBot(id, bot.name);
      if (!user?.hasActivatedBot) {
        setUserActivatedBot();
      }
      toast({
        title: "Тестовый период активирован! 🎉",
        description: `Бот "${bot.name}" доступен для тестирования 3 дня. Статус: Активен`,
      });
      setTimeout(() => {
        navigate('/my-bots');
      }, 1500);
    }
  };
  
  const selectedBot = mockBots.find(bot => bot.id === paymentModal.botId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Маркетплейс готовых решений</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Выберите готового ИИ-агента или создайте своего с нуля
        </p>
      </div>

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CategoryFilter 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange} 
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Найдено ботов: {filteredBots.length}
          </p>
          {(searchQuery || selectedCategory !== 'Все' || priceRange[0] !== 0 || priceRange[1] !== maxPrice || minRating !== 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Все');
                setPriceRange([0, maxPrice]);
                setMinRating(0);
              }}
              className="text-sm text-primary hover:underline cursor-pointer"
              type="button"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PriceFilter 
            maxPrice={maxPrice}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
          />
          <RatingFilter 
            minRating={minRating}
            onRatingChange={setMinRating}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredBots.map((bot) => (
          <BotCard 
            key={bot.id} 
            bot={bot} 
            onBuy={handleBuy} 
            onRent={handleRent}
            onDetails={handleDetails}
            onTest={handleTest}
          />
        ))}
      </div>

      {filteredBots.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-sm md:text-base">
            Ботов не найдено по запросу "{searchQuery || 'выбранным фильтрам'}"
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Все');
              setPriceRange([0, maxPrice]);
              setMinRating(0);
            }}
            className="text-primary hover:underline text-sm"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}
      
      {selectedBot && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
          botName={selectedBot.name}
          botId={selectedBot.id}
          mode={paymentModal.mode}
          price={paymentModal.mode === 'buy' ? selectedBot.price : Math.floor(selectedBot.price / 10)}
        />
      )}
      
      <BotDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ ...detailsModal, isOpen: false })}
        bot={mockBots.find(b => b.id === detailsModal.botId)}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default BotMarketplace;