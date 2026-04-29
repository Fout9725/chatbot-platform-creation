import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PricingHeaderProps {
  isYearly: boolean;
  setIsYearly: (v: boolean) => void;
}

const PricingHeader = ({ isYearly, setIsYearly }: PricingHeaderProps) => {
  return (
    <>
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
          <div className="flex items-center gap-2">
            <Link to="/catalog">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-200 hover:text-white hover:bg-white/10"
              >
                <Icon name="Grid3x3" size={16} className="mr-1.5" />
                Каталог
              </Button>
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
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Icon name="CreditCard" size={14} className="text-emerald-300" />
              <span className="text-xs uppercase tracking-widest text-emerald-200">
                Тарифные планы
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
              Простая и понятная цена
            </h1>
            <p className="text-slate-400 text-base md:text-lg mb-8">
              Выберите подходящий план для вашего бизнеса. Начните бесплатно,
              обновляйтесь по мере роста.
            </p>

            <div className="inline-flex items-center gap-3 mb-2">
              <span
                className={`text-sm font-medium transition-colors ${
                  !isYearly ? 'text-white' : 'text-slate-400'
                }`}
              >
                Ежемесячно
              </span>

              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                aria-label="Переключатель ежемесячно/ежегодно"
                className="relative w-16 h-8 rounded-full transition-all"
                style={{
                  background: isYearly
                    ? 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)'
                    : 'rgba(255,255,255,0.08)',
                  border: isYearly
                    ? '1px solid rgba(34,197,94,0.6)'
                    : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isYearly
                    ? '0 0 24px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'inset 0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                <motion.span
                  animate={{
                    x: isYearly ? 32 : 4,
                    rotate: isYearly ? 360 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 22,
                  }}
                  className="absolute top-1 left-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    boxShadow:
                      '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}
                >
                  <Icon
                    name={isYearly ? 'Sparkles' : 'Calendar'}
                    size={11}
                    className={isYearly ? 'text-emerald-600' : 'text-slate-500'}
                  />
                </motion.span>
              </button>

              <span
                className={`text-sm font-medium transition-colors ${
                  isYearly ? 'text-white' : 'text-slate-400'
                }`}
              >
                Ежегодно
              </span>

              {isYearly && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background:
                      'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
                    color: '#fff',
                    boxShadow: '0 6px 18px -6px rgba(34,197,94,0.7)',
                  }}
                >
                  −20%
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default PricingHeader;
