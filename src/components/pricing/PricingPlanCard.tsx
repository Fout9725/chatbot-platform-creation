import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { text: string; included: boolean }[];
  popular: boolean;
  accent: string;
  icon: string;
  elevated?: boolean;
}

interface PricingPlanCardProps {
  plan: Plan;
  index: number;
  isYearly: boolean;
}

const PricingPlanCard = ({ plan, index, isYearly }: PricingPlanCardProps) => {
  const navigate = useNavigate();
  const accent = plan.accent;

  const getPrice = () => {
    if (plan.monthlyPrice === 0) return 'Бесплатно';
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    return `${price.toLocaleString()} ₽`;
  };

  const getSavings = () => {
    if (!isYearly || plan.monthlyPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return `Экономия ${percentage}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 90,
        damping: 16,
      }}
      whileHover={{ y: -10 }}
      className="relative"
      style={{
        transform: plan.elevated ? 'translateY(-20px)' : undefined,
        transformStyle: 'preserve-3d',
      }}
    >
      {plan.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
            color: '#fff',
            boxShadow: `0 8px 24px -6px ${accent}99`,
          }}
        >
          ⭐ Популярный
        </div>
      )}

      <div
        className="relative rounded-3xl p-6 md:p-7 h-full flex flex-col overflow-hidden"
        style={{
          background: plan.popular
            ? `linear-gradient(180deg, ${accent}22 0%, rgba(99,102,241,0.05) 100%)`
            : 'rgba(255,255,255,0.04)',
          border: plan.popular
            ? `1px solid ${accent}66`
            : '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: `
            0 30px 60px -20px ${accent}55,
            0 10px 30px -10px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.08)
          `,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent}AA 50%, transparent 100%)`,
          }}
        />

        <div className="relative">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
              border: `1px solid ${accent}55`,
              boxShadow: `0 0 24px ${accent}33`,
            }}
          >
            <Icon name={plan.icon} size={22} style={{ color: accent }} />
          </div>

          <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
          <p className="text-sm text-slate-400 mb-5 min-h-[2.5em]">
            {plan.description}
          </p>

          <div className="mb-5">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl md:text-4xl font-bold leading-none"
                style={{
                  background: `linear-gradient(135deg, #ffffff 0%, ${accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {getPrice()}
              </span>
              {plan.monthlyPrice > 0 && (
                <span className="text-xs text-slate-500">
                  /{isYearly ? 'год' : 'мес'}
                </span>
              )}
            </div>
            {getSavings() && (
              <span
                className="inline-flex mt-2 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#86EFAC',
                }}
              >
                <Icon name="TrendingDown" size={9} />
                {getSavings()}
              </span>
            )}
          </div>

          <ul className="space-y-2.5 mb-6 flex-1">
            {plan.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs md:text-sm"
              >
                <span
                  className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: f.included ? `${accent}33` : 'rgba(255,255,255,0.04)',
                    border: f.included
                      ? `1px solid ${accent}55`
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon
                    name={f.included ? 'Check' : 'X'}
                    size={9}
                    style={{
                      color: f.included ? accent : '#475569',
                    }}
                  />
                </span>
                <span
                  className={
                    f.included ? 'text-slate-200' : 'text-slate-500 line-through'
                  }
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            onClick={() => navigate('/plan-selection')}
            className="w-full h-11 text-white border-0 mt-auto"
            style={{
              background: plan.popular
                ? `linear-gradient(135deg, ${accent} 0%, ${accent}AA 100%)`
                : 'rgba(255,255,255,0.06)',
              border: plan.popular
                ? 'none'
                : '1px solid rgba(255,255,255,0.15)',
              boxShadow: plan.popular
                ? `0 10px 30px -10px ${accent}99`
                : 'none',
            }}
          >
            {plan.monthlyPrice === 0 ? 'Начать бесплатно' : 'Выбрать план'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingPlanCard;
