import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import PricingHeader from '@/components/pricing/PricingHeader';
import PricingPlanCard, { Plan } from '@/components/pricing/PricingPlanCard';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans: Plan[] = [
    {
      name: 'Бесплатный',
      description: 'Идеально для тестирования',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: 'Rocket',
      accent: '#3B82F6',
      features: [
        { text: '1 ИИ-агент', included: true },
        { text: 'До 100 сообщений/месяц', included: true },
        { text: 'Базовая аналитика', included: true },
        { text: 'Telegram интеграция', included: true },
        { text: 'Конструктор: базовые блоки', included: true },
        { text: '3 шаблона из библиотеки', included: true },
        { text: 'Поддержка сообщества', included: true },
        { text: 'Приоритетная поддержка', included: false },
        { text: 'API интеграции', included: false },
      ],
      popular: false,
    },
    {
      name: 'Оптимальный',
      description: 'Для растущего бизнеса',
      monthlyPrice: 990,
      yearlyPrice: 10692,
      icon: 'TrendingUp',
      accent: '#A855F7',
      features: [
        { text: 'До 5 ИИ-агентов', included: true },
        { text: 'До 10,000 сообщений/месяц', included: true },
        { text: 'Расширенная аналитика', included: true },
        { text: 'Все интеграции (Telegram, WhatsApp)', included: true },
        { text: 'Конструктор Pro: все блоки', included: true },
        { text: 'N8N шаблоны (20 штук)', included: true },
        { text: 'Создание бота по тексту (5/мес)', included: true },
        { text: 'Приоритетная поддержка', included: true },
        { text: 'API доступ', included: false },
      ],
      popular: true,
      elevated: true,
    },
    {
      name: 'Премиум',
      description: 'Для профессионалов',
      monthlyPrice: 2990,
      yearlyPrice: 30498,
      icon: 'Crown',
      accent: '#EC4899',
      features: [
        { text: 'Неограниченное количество ИИ-агентов', included: true },
        { text: 'До 100,000 сообщений/месяц', included: true },
        { text: 'AI-обучение ИИ-агентов', included: true },
        { text: 'Все интеграции + API', included: true },
        { text: 'Конструктор Premium: все блоки + AI', included: true },
        { text: 'Все N8N шаблоны (безлимит)', included: true },
        { text: 'Создание бота по тексту (безлимит)', included: true },
        { text: 'Персональный менеджер', included: true },
        { text: 'Белая метка (White Label)', included: true },
      ],
      popular: false,
    },
    {
      name: 'Партнёрский',
      description: 'Зарабатывайте вместе с нами',
      monthlyPrice: 9990,
      yearlyPrice: 95904,
      icon: 'Handshake',
      accent: '#22C55E',
      features: [
        { text: 'Всё из тарифа Премиум', included: true },
        { text: 'Конструктор Partner: приоритет', included: true },
        { text: 'Заработок на рефералах (20% комиссия)', included: true },
        { text: 'Публикация ИИ-агентов в маркетплейсе', included: true },
        { text: 'Продажа готовых решений', included: true },
        { text: 'Публикация своих N8N шаблонов', included: true },
        { text: 'Персональная партнёрская ссылка', included: true },
        { text: 'Аналитика по рефералам', included: true },
        { text: 'Маркетинговые материалы', included: true },
      ],
      popular: false,
    },
  ];

  const benefits = [
    {
      icon: 'Shield',
      title: 'Безопасность данных',
      description: 'Шифрование данных и соответствие стандартам безопасности',
      accent: '#3B82F6',
    },
    {
      icon: 'Headphones',
      title: 'Поддержка 24/7',
      description: 'Круглосуточная техническая поддержка для всех клиентов',
      accent: '#A855F7',
    },
    {
      icon: 'Zap',
      title: 'Быстрое развёртывание',
      description: 'Запустите бота за 5 минут без технических знаний',
      accent: '#22C55E',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <PricingHeader isYearly={isYearly} setIsYearly={setIsYearly} />

      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto pt-6"
            style={{ perspective: '1600px' }}
          >
            {plans.map((plan, idx) => (
              <PricingPlanCard
                key={plan.name}
                plan={plan}
                index={idx}
                isYearly={isYearly}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((b, idx) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="rounded-2xl p-6 relative overflow-hidden group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow:
                    '0 14px 36px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${b.accent}22 0%, transparent 60%)`,
                  }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{
                    background: `linear-gradient(135deg, ${b.accent}33 0%, ${b.accent}11 100%)`,
                    border: `1px solid ${b.accent}55`,
                    boxShadow: `0 0 20px ${b.accent}33`,
                  }}
                >
                  <Icon name={b.icon} size={22} style={{ color: b.accent }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 relative">
                  {b.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed relative">
                  {b.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto"
            style={{
              background:
                'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.10) 100%)',
              border: '1px solid rgba(168,85,247,0.4)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 30px 80px -20px rgba(168,85,247,0.5)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.4) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                  boxShadow: '0 10px 30px -10px rgba(168,85,247,0.7)',
                }}
              >
                <Icon name="Mail" size={26} className="text-white" />
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
                Нужен индивидуальный план?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-6">
                Свяжитесь с нами для обсуждения корпоративных решений и SLA
              </p>
              <Button
                size="lg"
                className="text-white border-0 px-8 h-12"
                style={{
                  background:
                    'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                  boxShadow: '0 10px 30px -10px rgba(168,85,247,0.7)',
                }}
                onClick={() =>
                  window.open('https://t.me/+QgiLIa1gFRY4Y2Iy', '_blank')
                }
              >
                <Icon name="Send" size={18} className="mr-2" />
                Связаться с нами
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
