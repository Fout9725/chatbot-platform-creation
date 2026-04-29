import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Bot } from '@/components/marketplace/types';
import { CATEGORY_COLORS } from './CatalogConstants';

interface CatalogCardProps {
  bot: Bot;
  flipped: boolean;
  onFlip: () => void;
  onTest: (id: number) => void;
}

const CatalogCard = ({ bot, flipped, onFlip, onTest }: CatalogCardProps) => {
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
                to={`/catalog/${bot.id}`}
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

export default CatalogCard;