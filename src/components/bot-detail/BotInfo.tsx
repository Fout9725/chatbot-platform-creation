import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Bot } from '@/components/marketplace/types';

interface BotInfoProps {
  bot: Bot;
  accent: string;
  onTest: () => void;
}

const BotInfo = ({ bot, accent, onTest }: BotInfoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-3xl p-6 md:p-8"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow:
          '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
          style={{
            background: `${accent}22`,
            border: `1px solid ${accent}55`,
            color: accent,
          }}
        >
          {bot.category}
        </span>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: '#FCD34D',
          }}
        >
          <Icon name="Star" size={11} className="fill-amber-300" />
          {bot.rating}
        </span>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-slate-300"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Icon name="Users" size={11} />
          {bot.users.toLocaleString()} пользователей
        </span>
      </div>

      <h1
        className="text-3xl md:text-5xl font-bold leading-tight mb-3"
        style={{
          background: `linear-gradient(135deg, #ffffff 0%, ${accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {bot.name}
      </h1>

      <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-6">
        {bot.description}
      </p>

      {bot.features && bot.features.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-widest text-slate-400 mb-3">
            Что умеет
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bot.features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: `${accent}22`,
                    border: `1px solid ${accent}55`,
                  }}
                >
                  <Icon name="Check" size={11} style={{ color: accent }} />
                </span>
                <span className="text-sm text-slate-200">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${accent}11 0%, transparent 100%)`,
          border: `1px solid ${accent}33`,
        }}
      >
        <div>
          <div className="text-xs text-slate-400 mb-0.5">Аренда</div>
          <div
            className="text-3xl md:text-4xl font-bold leading-none"
            style={{
              background: `linear-gradient(135deg, #fff 0%, ${accent} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {bot.rentPrice.toLocaleString()} ₽
          </div>
          <div className="text-xs text-slate-500 mt-0.5">в месяц</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 mb-0.5">Покупка навсегда</div>
          <div className="text-xl font-semibold text-slate-200">
            {bot.price.toLocaleString()} ₽
          </div>
          <div className="text-xs text-emerald-400 mt-0.5 inline-flex items-center gap-1">
            <Icon name="Sparkles" size={11} />
            3 дня бесплатно
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onTest}
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
            <Icon name="Grid3x3" size={16} className="mr-2" />К каталогу
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default BotInfo;
