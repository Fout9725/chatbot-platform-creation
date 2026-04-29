import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockBots } from '@/components/marketplace/mockBots';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_COLORS } from '@/components/catalog/CatalogConstants';
import BotShowcase from '@/components/bot-detail/BotShowcase';
import BotInfo from '@/components/bot-detail/BotInfo';
import BotReviews from '@/components/bot-detail/BotReviews';

const BotShowcasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, setUserActivatedBot } = useAuth();
  const { activateBot } = useActiveBots();
  const [parallax, setParallax] = useState(0);

  const bot = useMemo(
    () => mockBots.find((b) => String(b.id) === String(id)),
    [id],
  );

  useEffect(() => {
    const onScroll = () => {
      setParallax(Math.min(window.scrollY * 0.05, 30));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className="rounded-3xl p-10 text-center max-w-md"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
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
          <h1 className="text-2xl font-bold text-white mb-2">
            Бот не найден
          </h1>
          <p className="text-sm text-slate-400 mb-5">
            Возможно, страница была удалена или вы перешли по неверной ссылке
          </p>
          <Link to="/catalog">
            <Button
              className="text-white border-0"
              style={{
                background:
                  'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              }}
            >
              <Icon name="Grid3x3" size={16} className="mr-2" />К каталогу
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const accent = CATEGORY_COLORS[bot.category] || '#8B5CF6';

  const handleTest = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Зарегистрируйтесь, чтобы активировать бота',
        variant: 'destructive',
      });
      return;
    }
    activateBot(bot.id, bot.name);
    if (!user?.hasActivatedBot) setUserActivatedBot();
    toast({
      title: 'Тестовый период активирован!',
      description: `Бот "${bot.name}" доступен для тестирования 3 дня.`,
    });
    setTimeout(() => navigate('/my-bots'), 1200);
  };

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
          <Link to="/catalog">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1.5" />
              К каталогу
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative pt-6 md:pt-10 pb-4">
        <div className="container mx-auto px-4">
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-xs text-slate-400 mb-4"
          >
            <Link to="/" className="hover:text-white transition-colors">
              Главная
            </Link>
            <Icon name="ChevronRight" size={12} />
            <Link to="/catalog" className="hover:text-white transition-colors">
              Каталог
            </Link>
            <Icon name="ChevronRight" size={12} />
            <span className="text-white truncate max-w-[200px]">
              {bot.name}
            </span>
          </motion.nav>
        </div>
      </section>

      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              style={{
                transform: `translateY(${-parallax}px)`,
                position: 'sticky',
                top: '90px',
              }}
              className="lg:max-h-[80vh]"
            >
              <BotShowcase bot={bot} accent={accent} />
            </motion.div>

            <BotInfo bot={bot} accent={accent} onTest={handleTest} />
          </div>
        </div>
      </section>

      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <BotReviews
            accent={accent}
            rating={bot.rating}
            totalUsers={bot.users}
          />
        </div>
      </section>

      <section className="relative pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accent}22 0%, rgba(99,102,241,0.12) 100%)`,
              border: `1px solid ${accent}55`,
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: `0 30px 80px -20px ${accent}66`,
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${accent}33 0%, transparent 60%)`,
              }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
                  boxShadow: `0 10px 30px -10px ${accent}99`,
                }}
              >
                <Icon name="Rocket" size={26} className="text-white" />
              </div>
              <h2
                className="text-2xl md:text-4xl font-bold mb-3"
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Запустите «{bot.name}» за 5 минут
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-6">
                3 дня тестирования бесплатно — без оплаты и привязки карты.
                Откажитесь в любой момент.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Button
                  onClick={handleTest}
                  className="flex-1 h-12 text-white border-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
                    boxShadow: `0 10px 30px -10px ${accent}99`,
                  }}
                >
                  <Icon name="PlayCircle" size={18} className="mr-2" />
                  Попробовать бесплатно
                </Button>
                <Link to="/catalog" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full h-12 text-white"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    Другие боты
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BotShowcasePage;
