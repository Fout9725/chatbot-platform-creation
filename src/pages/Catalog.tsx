import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBots } from '@/components/marketplace/mockBots';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useToast } from '@/hooks/use-toast';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';

const Catalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, setUserActivatedBot } = useAuth();
  const { activateBot } = useActiveBots();

  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [flippedId, setFlippedId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const filteredBots = useMemo(() => {
    return mockBots.filter((bot) => {
      const matchesCategory =
        selectedCategory === 'Все' || bot.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = !priceMax || bot.rentPrice <= priceMax;
      const matchesRating = bot.rating >= minRating;
      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });
  }, [selectedCategory, searchQuery, priceMax, minRating]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Все: mockBots.length };
    mockBots.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleTest = (id: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Зарегистрируйтесь, чтобы активировать бота',
        variant: 'destructive',
      });
      return;
    }
    const bot = mockBots.find((b) => b.id === id);
    if (!bot) return;
    activateBot(id, bot.name);
    if (!user?.hasActivatedBot) setUserActivatedBot();
    toast({
      title: 'Тестовый период активирован!',
      description: `Бот "${bot.name}" доступен для тестирования 3 дня.`,
    });
    setTimeout(() => navigate('/my-bots'), 1200);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Все');
    setPriceMax(null);
    setMinRating(0);
  };

  const hasFilters = Boolean(
    searchQuery || selectedCategory !== 'Все' || priceMax || minRating > 0,
  );

  return (
    <div className="min-h-screen relative">
      <CatalogHeader />
      <CatalogFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        minRating={minRating}
        setMinRating={setMinRating}
        hasFilters={hasFilters}
        resetFilters={resetFilters}
        categoryCounts={categoryCounts}
      />
      <CatalogGrid
        filteredBots={filteredBots}
        flippedId={flippedId}
        setFlippedId={setFlippedId}
        handleTest={handleTest}
        resetFilters={resetFilters}
        isMobile={isMobile}
      />
    </div>
  );
};

export default Catalog;
