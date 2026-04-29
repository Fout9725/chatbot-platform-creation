import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/modals/AuthModal';
import ConstructorModeModal from '@/components/modals/ConstructorModeModal';
import { useAuth } from '@/contexts/AuthContext';
import HowItWorks from '@/components/landing/HowItWorks';
import Hero3D from '@/components/hero3d/Hero3D';
import CtaBlock from '@/components/landing/CtaBlock';
import SiteFooter from '@/components/landing/SiteFooter';
import PricingPreview from '@/components/landing/PricingPreview';
import FaqAccordion from '@/components/landing/FaqAccordion';
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
    navigate('/catalog');
  };

  return (
    <div className="min-h-screen relative">
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,14,39,0.55)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderBottom: '1px solid transparent',
        }}
      >
        <div className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.5)',
                }}
              >
                <Icon name="Bot" className="text-white" size={22} />
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
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10" onClick={() => navigate('/pricing')}>
                Тарифы
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10" onClick={scrollToCatalog}>
                Каталог
              </Button>
              <Button data-tour="my-bots" variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10" onClick={() => navigate('/my-bots')}>
                Мои боты
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10" onClick={() => navigate('/admin')}>
                  Админ
                </Button>
              )}

              <div className="flex items-center gap-0.5 ml-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/automation-hub')}
                      className="relative group w-9 h-9 flex items-center justify-center rounded-xl border border-amber-300/30 hover:border-amber-300/60 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(251,191,36,0.12)', backdropFilter: 'blur(10px)' }}
                    >
                      <Icon name="Zap" size={17} className="text-amber-300 group-hover:text-amber-200 transition-colors" />
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
                      className="relative group w-9 h-9 flex items-center justify-center rounded-xl border border-violet-300/30 hover:border-violet-300/60 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(139,92,246,0.15)', backdropFilter: 'blur(10px)' }}
                    >
                      <Icon name="Sparkles" size={17} className="text-violet-300 group-hover:text-violet-200 transition-colors" />
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
                size="sm"
                onClick={handleProfileClick}
                className="ml-2 text-white border"
                style={{
                  background: isAuthenticated
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                    : 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon name="User" size={16} className="mr-1.5" />
                {isAuthenticated ? user?.name : 'Войти'}
              </Button>
            </nav>

            <div className="md:hidden flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleProfileClick}
                className="text-white border"
                style={{
                  background: isAuthenticated
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                    : 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <Icon name="User" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-200 hover:text-white hover:bg-white/10"
              >
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div
              className="md:hidden mt-3 pt-3 pb-1 space-y-1"
              style={{ borderTop: '1px solid transparent' }}
            >
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}>
                <Icon name="CreditCard" size={16} className="mr-2" /> Тарифы
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { scrollToCatalog(); setMobileMenuOpen(false); }}>
                <Icon name="Store" size={16} className="mr-2" /> Каталог
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/my-bots'); setMobileMenuOpen(false); }}>
                <Icon name="Folder" size={16} className="mr-2" /> Мои боты
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/prompt-engineer'); setMobileMenuOpen(false); }}>
                <Icon name="Sparkles" size={16} className="mr-2" /> Промт-Инженер
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/docs'); setMobileMenuOpen(false); }}>
                <Icon name="BookOpen" size={16} className="mr-2" /> Документация
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/automation-hub'); setMobileMenuOpen(false); }}>
                <Icon name="Zap" size={16} className="mr-2" /> Автоматизация
              </Button>
              <Button
                className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
                onClick={() => { navigate('/geo'); setMobileMenuOpen(false); }}
              >
                <Icon name="Radar" size={16} className="mr-2" /> GEO Factory
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-white/10" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                  <Icon name="Shield" size={16} className="mr-2" /> Админ-панель
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <Hero3D />

      <section
        className="relative py-12 md:py-16 overflow-hidden"
        style={{ background: 'transparent' }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-5xl mx-auto">
            {[
              { icon: 'Users', label: 'пользователей', value: totalUsers > 0 ? `${totalUsers.toLocaleString()}+` : '5 000+', accent: '#3B82F6', show: true },
              { icon: 'Bot', label: 'готовых ботов', value: '85', accent: '#8B5CF6', show: true },
              { icon: 'Clock', label: 'бесплатно', value: '3 дня', accent: '#A855F7', show: true },
              { icon: 'Zap', label: 'до запуска', value: '5 мин', accent: '#6366F1', show: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow:
                    '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${item.accent}22 0%, transparent 60%)`,
                  }}
                />
                <div className="flex items-center gap-3 relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${item.accent}33 0%, ${item.accent}11 100%)`,
                      border: `1px solid ${item.accent}55`,
                      boxShadow: `0 0 18px ${item.accent}33`,
                    }}
                  >
                    <Icon name={item.icon} size={20} style={{ color: item.accent }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl font-bold text-white leading-none">
                      {item.value}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {item.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="relative py-12 md:py-16" data-tour="catalog-cta">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 md:p-12 max-w-4xl mx-auto"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow:
                '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                boxShadow: '0 10px 30px -10px rgba(139,92,246,0.7)',
              }}
            >
              <Icon name="Grid3x3" size={26} className="text-white" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Откройте полный каталог решений
            </h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">
              85+ готовых ИИ-ботов для продаж, поддержки, HR, маркетинга и
              других задач бизнеса
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/catalog')}
              className="text-white border-0 px-8 h-12"
              style={{
                background:
                  'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                boxShadow: '0 10px 30px -10px rgba(139,92,246,0.7)',
              }}
            >
              <Icon name="Sparkles" size={18} className="mr-2" />
              Перейти в каталог
            </Button>
          </motion.div>
        </div>
      </section>

      <section
        className="relative py-20 md:py-24 overflow-hidden"
        style={{ background: 'transparent' }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Icon name="Plug" size={14} className="text-indigo-300" />
            <span className="text-xs uppercase tracking-widest text-indigo-200">
              Интеграции
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold mb-10"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #93C5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Работает в популярных мессенджерах
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto">
            {[
              { name: 'Telegram', icon: 'Send', accent: '#3B82F6' },
              { name: 'WhatsApp', icon: 'Phone', accent: '#22C55E' },
              { name: 'ВКонтакте', icon: 'Users', accent: '#6366F1' },
              { name: 'Веб-сайт', icon: 'Globe', accent: '#A855F7' },
            ].map((item) => (
              <div
                key={item.name}
                className="relative rounded-2xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow:
                    '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${item.accent}22 0%, transparent 70%)`,
                  }}
                />
                <div className="flex flex-col items-center gap-3 relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${item.accent}33 0%, ${item.accent}11 100%)`,
                      border: `1px solid ${item.accent}55`,
                      boxShadow: `0 0 24px ${item.accent}33`,
                    }}
                  >
                    <Icon name={item.icon} size={26} style={{ color: item.accent }} />
                  </div>
                  <span className="text-sm md:text-base font-medium text-white">
                    {item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingPreview />

      <FaqAccordion />

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