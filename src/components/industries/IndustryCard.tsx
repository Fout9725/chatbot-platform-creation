import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export interface Industry {
  slug: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  category: string;
  count: number;
}

interface IndustryCardProps {
  industry: Industry;
  index: number;
}

const IndustryCard = ({ industry, index }: IndustryCardProps) => {
  const navigate = useNavigate();
  const accent = industry.accent;

  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        angle: (i * 360) / 8,
        distance: 70 + Math.random() * 30,
        delay: Math.random() * 1.5,
      })),
    [],
  );

  const goToCatalog = () => {
    navigate(`/catalog?category=${encodeURIComponent(industry.category)}`);
  };

  return (
    <motion.button
      type="button"
      onClick={goToCatalog}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        type: 'spring',
        stiffness: 90,
        damping: 14,
      }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative text-left rounded-3xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: `0 20px 50px -20px ${accent}55, 0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
        perspective: '1000px',
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
          background: `linear-gradient(90deg, transparent 0%, ${accent}AA 50%, transparent 100%)`,
        }}
      />

      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-125"
        style={{
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      <div className="relative p-6 md:p-7 flex flex-col h-full min-h-[280px]">
        <div
          className="relative w-24 h-24 mb-5"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${accent}66 0%, transparent 70%)`,
              filter: 'blur(4px)',
            }}
          />

          {particles.map((p, i) => {
            const x = Math.cos((p.angle * Math.PI) / 180) * p.distance;
            const y = Math.sin((p.angle * Math.PI) / 180) * p.distance;
            return (
              <span
                key={i}
                aria-hidden
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                  transform: `translate(-50%, -50%)`,
                  animation: `industrySpark 1.6s ease-out ${p.delay}s infinite`,
                  ['--px' as string]: `${x}px`,
                  ['--py' as string]: `${y}px`,
                }}
              />
            );
          })}

          <motion.div
            whileHover={{ rotateY: 360 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${accent}66 0%, transparent 70%)`,
                filter: 'blur(16px)',
              }}
            />

            <div
              className="relative w-full h-full rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}55 0%, ${accent}11 100%)`,
                border: `1px solid ${accent}AA`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: `
                  0 20px 40px -10px ${accent}88,
                  0 0 40px ${accent}55,
                  inset 0 2px 0 rgba(255,255,255,0.2),
                  inset 0 -3px 12px ${accent}66
                `,
              }}
            >
              <div
                aria-hidden
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  filter: 'blur(2px)',
                }}
              />
              <Icon
                name={industry.icon}
                size={42}
                style={{
                  color: '#fff',
                  filter: `drop-shadow(0 4px 14px ${accent})`,
                }}
              />
            </div>
          </motion.div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          {industry.title}
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-4">
          {industry.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/8">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: accent }}
          >
            {industry.count} ботов
          </span>
          <span
            className="inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1"
            style={{ color: accent }}
          >
            Смотреть
            <Icon name="ArrowRight" size={14} />
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default IndustryCard;
