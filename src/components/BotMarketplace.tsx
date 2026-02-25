import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBots } from './marketplace/mockBots';
import { categories } from './marketplace/types';
import BotCard from './marketplace/BotCard';
import SearchBar from './marketplace/SearchBar';
import PaymentModal from './modals/PaymentModal';
import BotDetailsModal from './modals/BotDetailsModal';
import AuthModal from './modals/AuthModal';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useAuth } from '@/contexts/AuthContext';

const PRICE_CHIPS = [
  { label: 'До 1 000 ₽', max: 1000 },
  { label: 'До 3 000 ₽', max: 3000 },
  { label: 'До 5 000 ₽', max: 5000 },
];

const RATING_OPTIONS = [0, 4.5, 4.7, 4.9];

const BotMarketplace = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; botId: number; mode: 'buy' | 'rent' }>({ 
    isOpen: false, botId: 0, mode: 'buy' 
  });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; botId: number }>({ 
    isOpen: false, botId: 0 
  });

  const { toast } = useToast();
  const { activateBot } = useActiveBots();
  const { user, isAuthenticated, setUserActivatedBot } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const filteredBots = useMemo(() => {
    return mockBots.filter((bot) => {
      const matchesCategory = selectedCategory === 'Все' || bot.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = !priceMax || bot.rentPrice <= priceMax;
      const matchesRating = bot.rating >= minRating;
      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });
  }, [selectedCategory, searchQuery, priceMax, minRating]);

  const hasFilters = searchQuery || selectedCategory !== 'Все' || priceMax || minRating > 0;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Все');
    setPriceMax(null);
    setMinRating(0);
  };

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
      free: 1, optimal: 5, premium: 20, partner: Infinity
    };

    const userPlan = user?.plan || 'free';
    const maxBots = PLAN_LIMITS[userPlan];
    const currentBots: Array<{ botId: number; name: string }> = JSON.parse(localStorage.getItem('activeBots') || '[]');

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
      const existingBot = currentBots.find(b => b.botId === id);
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
        title: "Тестовый период активирован!",
        description: `Бот "${bot.name}" доступен для тестирования 3 дня.`,
      });
      setTimeout(() => navigate('/my-bots'), 1500);
    }
  };

  const selectedBot = mockBots.find(bot => bot.id === paymentModal.botId);

  const categoryChips = categories.filter(c => c !== 'Все');
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockBots.forEach(bot => {
      counts[bot.category] = (counts[bot.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <section id="catalog" className="py-16 md:py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
          Каталог решений
        </h2>
        <p className="text-gray-500 mb-8">
          {mockBots.length} готовых ИИ-ботов для бизнеса
        </p>

        <div className="space-y-4 mb-8">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('Все')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'Все'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            {categoryChips.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
                {categoryCounts[cat] && (
                  <span className={`ml-1 ${selectedCategory === cat ? 'text-white/70' : 'text-gray-400'}`}>
                    {categoryCounts[cat]}
                  </span>
                )}
              </button>
            ))}

            <div className="hidden md:contents">
              {PRICE_CHIPS.map(chip => (
                <button
                  key={chip.max}
                  type="button"
                  onClick={() => setPriceMax(priceMax === chip.max ? null : chip.max)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    priceMax === chip.max
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1.5"
                >
                  <Icon name="SlidersHorizontal" size={14} />
                  Все фильтры
                </button>
              </SheetTrigger>
              <SheetContent className="w-80">
                <SheetHeader>
                  <SheetTitle>Фильтры</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Цена аренды/мес</h4>
                    <div className="space-y-2">
                      {PRICE_CHIPS.map(chip => (
                        <button
                          key={chip.max}
                          type="button"
                          onClick={() => setPriceMax(priceMax === chip.max ? null : chip.max)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            priceMax === chip.max
                              ? 'bg-violet-100 text-violet-700 font-medium'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Минимальный рейтинг</h4>
                    <div className="flex flex-wrap gap-2">
                      {RATING_OPTIONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setMinRating(minRating === r ? 0 : r)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                            minRating === r && r > 0
                              ? 'bg-amber-100 text-amber-700 font-medium'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {r === 0 ? 'Все' : (
                            <>
                              <Icon name="Star" size={12} className="text-amber-400 fill-amber-400" />
                              {r}+
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasFilters && (
                    <Button variant="outline" className="w-full" onClick={resetFilters}>
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {filteredBots.length === mockBots.length
              ? `${filteredBots.length} решений`
              : `Найдено: ${filteredBots.length} из ${mockBots.length}`
            }
          </p>
          {hasFilters && (
            <button onClick={resetFilters} type="button" className="text-sm text-violet-600 hover:underline">
              Сбросить
            </button>
          )}
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
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="SearchX" size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-3">Ничего не найдено</p>
            <button onClick={resetFilters} type="button" className="text-violet-600 hover:underline text-sm font-medium">
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
    </section>
  );
};

export default BotMarketplace;
