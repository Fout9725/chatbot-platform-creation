import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockBots } from '@/components/marketplace/mockBots';
import { categories, Bot } from '@/components/marketplace/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useToast } from '@/hooks/use-toast';

const PRICE_CHIPS = [
  { label: 'До 1 000 ₽', max: 1000 },
  { label: 'До 3 000 ₽', max: 3000 },
  { label: 'До 5 000 ₽', max: 5000 },
];

const RATING_CHIPS = [4.5, 4.7, 4.9];

const CATEGORY_COLORS: Record<string, string> = {
  Продажи: '#3B82F6',
  Поддержка: '#22C55E',
  HR: '#F59E0B',
  Маркетинг: '#A855F7',
  Финансы: '#10B981',
  Сервис: '#06B6D4',
  Креатив: '#EC4899',
  Юриспруденция: '#6366F1',
  Все: '#8B5CF6',
};

const CatalogCard = ({
  bot,
  flipped,
  onFlip,
  onTest,
}: {
  bot: Bot;
  flipped: boolean;
  onFlip: () => void;
  onTest: (id: number) => void;
}) => {
  const accent = CATEGORY_COLORS[bot.category] || '#8B5CF6';
  return (
    <div
      className="catalog-card-wrap"
      style={{ perspective: '1400px' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Бот ${bot.name}`}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}
        className="group h-[320px] cursor-pointer"
      >
        <div
          onClick={onFlip}
          className="absolute inset-0 rounded-2xl p-5 md:p-6 transition-transform duration-300 group-hover:-translate-y-1.5"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: `0 20px 50px -20px ${accent}55, 0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${accent}30 0%, transparent 60%)`,
            }}
          />
          <div className="relative h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
                  border: `1px solid ${accent}55`,
                  boxShadow: `0 0 24px ${accent}33`,
                }}
              >
                <Icon
                  name={bot.icon as string}
                  fallback="Bot"
                  size={22}
                  style={{ color: accent }}
                />
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: '#FCD34D',
                }}
              >
                <Icon name="Star" size={11} className="fill-amber-300" />
                {bot.rating}
              </div>
            </div>

            <span
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: accent }}
            >
              {bot.category}
            </span>

            <h3 className="text-lg font-semibold text-white line-clamp-1 mb-2">
              {bot.name}
            </h3>

            <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed flex-1">
              {bot.description}
            </p>

            <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/10">
              <div>
                <div
                  className="text-xl font-bold leading-none"
                  style={{
                    background: `linear-gradient(135deg, #ffffff 0%, ${accent} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {bot.rentPrice.toLocaleString()} ₽
                </div>
                <div className="text-xs text-slate-500 mt-0.5">в месяц</div>
              </div>
              <div className="text-xs text-slate-400 inline-flex items-center gap-1">
                Перевернуть
                <Icon name="RotateCw" size={12} />
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={onFlip}
          className="absolute inset-0 rounded-2xl p-5 md:p-6"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(180deg, ${accent}22 0%, rgba(10,14,39,0.6) 100%)`,
            border: `1px solid ${accent}55`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: `0 20px 50px -20px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <div className="relative h-full flex flex-col">
            <h3 className="text-base font-semibold text-white mb-3">
              {bot.name}
            </h3>
            <ul className="space-y-2 mb-4 flex-1">
              {(bot.features || []).slice(0, 4).map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-200"
                >
                  <Icon
                    name="Check"
                    size={12}
                    style={{ color: accent, marginTop: 3 }}
                  />
                  <span className="line-clamp-2">{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (bot.demoUrl) {
                    window.location.href = bot.demoUrl;
                  } else {
                    onTest(bot.id);
                  }
                }}
                className="w-full h-10 text-sm text-white border-0"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
                  boxShadow: `0 6px 20px -6px ${accent}99`,
                }}
              >
                <Icon name="PlayCircle" size={14} className="mr-1.5" />
                Попробовать
              </Button>
              <Link
                to={`/bot/${bot.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-center font-medium hover:underline"
                style={{ color: accent }}
              >
                Подробнее →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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

  const hasFilters =
    searchQuery || selectedCategory !== 'Все' || priceMax || minRating > 0;

  return (
    <div className="min-h-screen relative">
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,14,39,0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderBottom: '1px solid rgba(139,92,246,0.18)',
        }}
      >
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                boxShadow: '0 0 20px rgba(139,92,246,0.5)',
              }}
            >
              <Icon name="Bot" className="text-white" size={20} />
            </div>
            <span
              className="text-lg font-bold"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ИнтеллектПро
            </span>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1.5" />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative pt-12 md:pt-16 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Icon name="Grid3x3" size={14} className="text-indigo-300" />
              <span className="text-xs uppercase tracking-widest text-indigo-200">
                {mockBots.length}+ ИИ-ботов
              </span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-4"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #93C5FD 50%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Каталог решений
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Выберите готового ИИ-бота под вашу задачу. Кликните по карточке —
              увидите ключевые функции.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl p-5 md:p-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow:
                '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex-1 flex items-center gap-3 px-4 h-12 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Icon name="Search" size={18} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или описанию..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white"
                    aria-label="Очистить"
                  >
                    <Icon name="X" size={16} />
                  </button>
                )}
              </div>
              {hasFilters && (
                <Button
                  onClick={resetFilters}
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/10 h-12"
                >
                  <Icon name="RotateCcw" size={14} className="mr-1.5" />
                  Сброс
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                const accent = CATEGORY_COLORS[cat] || '#8B5CF6';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`
                        : 'rgba(255,255,255,0.05)',
                      border: active
                        ? `1px solid ${accent}`
                        : '1px solid rgba(255,255,255,0.1)',
                      color: active ? '#fff' : '#cbd5e1',
                      boxShadow: active ? `0 6px 20px -6px ${accent}99` : 'none',
                    }}
                  >
                    {cat}
                    {categoryCounts[cat] !== undefined && (
                      <span
                        className="ml-1.5 text-xs"
                        style={{
                          opacity: active ? 0.85 : 0.6,
                        }}
                      >
                        {categoryCounts[cat]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">Цена:</span>
              {PRICE_CHIPS.map((chip) => {
                const active = priceMax === chip.max;
                return (
                  <button
                    key={chip.max}
                    type="button"
                    onClick={() =>
                      setPriceMax(active ? null : chip.max)
                    }
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active
                        ? 'rgba(34,197,94,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      border: active
                        ? '1px solid rgba(34,197,94,0.6)'
                        : '1px solid rgba(255,255,255,0.1)',
                      color: active ? '#86EFAC' : '#cbd5e1',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
              <span className="text-xs text-slate-400 ml-3 mr-1">
                Рейтинг:
              </span>
              {RATING_CHIPS.map((r) => {
                const active = minRating === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMinRating(active ? 0 : r)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1"
                    style={{
                      background: active
                        ? 'rgba(251,191,36,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      border: active
                        ? '1px solid rgba(251,191,36,0.6)'
                        : '1px solid rgba(255,255,255,0.1)',
                      color: active ? '#FCD34D' : '#cbd5e1',
                    }}
                  >
                    <Icon name="Star" size={10} />
                    {r}+
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-400">
              Найдено{' '}
              <span className="text-white font-semibold">
                {filteredBots.length}
              </span>{' '}
              ботов
            </p>
            <span className="text-xs text-slate-500 hidden md:flex items-center gap-1.5">
              <Icon name="MousePointer2" size={12} />
              Клик по карточке — детали
            </span>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
            style={{
              transformStyle: 'preserve-3d',
              transform: isMobile
                ? 'none'
                : 'perspective(2400px) rotateX(4deg)',
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredBots.map((bot, idx) => (
                <motion.div
                  key={bot.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.02, 0.3),
                  }}
                >
                  <CatalogCard
                    bot={bot}
                    flipped={flippedId === bot.id}
                    onFlip={() =>
                      setFlippedId(flippedId === bot.id ? null : bot.id)
                    }
                    onTest={handleTest}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredBots.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
                  border: '1px solid rgba(139,92,246,0.4)',
                }}
              >
                <Icon name="SearchX" size={28} className="text-violet-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ничего не нашли
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Попробуйте изменить фильтры или сбросить их
              </p>
              <Button
                onClick={resetFilters}
                className="text-white border-0"
                style={{
                  background:
                    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                }}
              >
                Сбросить фильтры
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Catalog;
