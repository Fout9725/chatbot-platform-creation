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

const CatalogCard = ({ bot, onTest }: CatalogCardProps) => {
  const accent = CATEGORY_COLORS[bot.category] || '#8B5CF6';

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="group relative rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: `0 18px 40px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}33 0%, transparent 60%)`,
        }}
      />

      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent}88 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      <div className="relative p-5 pb-4 flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
            border: `1px solid ${accent}55`,
            boxShadow: `0 0 20px ${accent}33`,
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
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0"
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

      <div className="relative px-5 pb-2">
        <span
          className="inline-block text-[10px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: accent }}
        >
          {bot.category}
        </span>

        <h3 className="text-base md:text-lg font-semibold text-white leading-snug line-clamp-2 mb-2 min-h-[2.6em]">
          {bot.name}
        </h3>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed line-clamp-3 min-h-[3.6em]">
          {bot.description}
        </p>
      </div>

      <div className="relative px-5 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Icon name="Users" size={11} />
          <span>{bot.users.toLocaleString()} активных</span>
        </div>
      </div>

      <div className="relative mt-auto p-5 pt-4">
        <div
          className="h-px w-full mb-4"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
              Аренда
            </div>
            <div
              className="text-xl md:text-2xl font-bold leading-none"
              style={{
                background: `linear-gradient(135deg, #ffffff 0%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {bot.rentPrice.toLocaleString()} ₽
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">в месяц</div>
          </div>

          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#86EFAC',
            }}
          >
            <Icon name="Sparkles" size={9} />3 дня free
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (bot.demoUrl) {
                window.location.href = bot.demoUrl;
              } else {
                onTest(bot.id);
              }
            }}
            className="w-full h-10 text-sm text-white border-0 font-medium"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}AA 100%)`,
              boxShadow: `0 8px 20px -6px ${accent}88`,
            }}
          >
            <Icon name="PlayCircle" size={15} className="mr-1.5" />
            Попробовать
          </Button>
          <Link
            to={`/catalog/${bot.id}`}
            className="text-xs text-center font-medium py-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: accent }}
          >
            Подробнее →
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default CatalogCard;
