import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  accent: string;
  glow: string;
  highlighted?: boolean;
  badge?: string;
};

const plans: Plan[] = [
  {
    name: 'Старт',
    price: '990',
    period: '₽ / мес',
    description: 'Для первого знакомства и небольших задач',
    features: ['1 бот', 'До 1 000 сообщений', 'Базовые шаблоны', 'Поддержка по email'],
    accent: '#3B82F6',
    glow: 'rgba(59,130,246,0.35)',
  },
  {
    name: 'Бизнес',
    price: '2 990',
    period: '₽ / мес',
    description: 'Полный набор для растущей компании',
    features: ['До 5 ботов', 'Без лимита сообщений', 'Все интеграции', 'Аналитика и A/B', 'Приоритетная поддержка'],
    accent: '#A855F7',
    glow: 'rgba(168,85,247,0.45)',
    highlighted: true,
    badge: 'Популярный',
  },
  {
    name: 'Корпоратив',
    price: 'Индив.',
    period: 'тариф',
    description: 'Кастомные решения и SLA для команды',
    features: ['Неограниченно ботов', 'Личный менеджер', 'White-label', 'API и вебхуки', 'SLA 99.9%'],
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.35)',
  },
];

const PricingPreview = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Icon name="Sparkles" size={14} className="text-fuchsia-300" />
            <span className="text-xs uppercase tracking-widest text-fuchsia-200">
              Тарифы
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold leading-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Простая и понятная цена
          </h2>
          <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl mx-auto">
            Платите помесячно. Откажитесь в любой момент.
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto"
          style={{ perspective: '1400px' }}
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 60, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: idx * 0.15 }}
              className="relative group"
              style={{
                transform: plan.highlighted ? 'translateY(-24px)' : undefined,
                transformStyle: 'preserve-3d',
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
                  style={{
                    background:
                      'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(168,85,247,0.5)',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div
                className="relative rounded-3xl p-7 md:p-8 h-full transition-all duration-500 group-hover:-translate-y-2"
                style={{
                  background: plan.highlighted
                    ? 'linear-gradient(180deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.08) 100%)'
                    : 'rgba(255,255,255,0.04)',
                  border: plan.highlighted
                    ? '1px solid rgba(168,85,247,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  boxShadow: `0 30px 60px -20px ${plan.glow}, 0 10px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${plan.accent}33 0%, transparent 60%)`,
                  }}
                />

                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${plan.accent}33 0%, ${plan.accent}11 100%)`,
                      border: `1px solid ${plan.accent}55`,
                      boxShadow: `0 0 24px ${plan.accent}33`,
                    }}
                  >
                    <Icon
                      name={
                        plan.name === 'Старт'
                          ? 'Rocket'
                          : plan.name === 'Бизнес'
                          ? 'Crown'
                          : 'Building2'
                      }
                      size={22}
                      style={{ color: plan.accent }}
                    />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span
                      className="text-4xl md:text-5xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, #ffffff 0%, ${plan.accent} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-400">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-slate-300"
                      >
                        <span
                          className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: `${plan.accent}33`,
                            border: `1px solid ${plan.accent}55`,
                          }}
                        >
                          <Icon
                            name="Check"
                            size={10}
                            style={{ color: plan.accent }}
                          />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/pricing" className="block">
                    <Button
                      className="w-full h-11 text-white border-0"
                      style={{
                        background: plan.highlighted
                          ? 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)'
                          : 'rgba(255,255,255,0.06)',
                        border: plan.highlighted
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.15)',
                        boxShadow: plan.highlighted
                          ? '0 10px 30px -10px rgba(168,85,247,0.6)'
                          : 'none',
                      }}
                    >
                      Выбрать тариф
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/pricing">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/5"
            >
              Сравнить все тарифы
              <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
