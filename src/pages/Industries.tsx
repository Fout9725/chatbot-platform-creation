import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { mockBots } from '@/components/marketplace/mockBots';
import IndustryHeader from '@/components/industries/IndustryHeader';
import IndustryCard, {
  Industry,
} from '@/components/industries/IndustryCard';

const Industries = () => {
  const counts: Record<string, number> = {};
  mockBots.forEach((b) => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  const industries: Industry[] = [
    {
      slug: 'sales',
      title: 'Продажи',
      description:
        'ИИ-консультанты для интернет-магазинов и B2B: квалифицируют лидов, отвечают на вопросы о товарах, оформляют заказы и закрывают сделки 24/7',
      icon: 'TrendingUp',
      accent: '#3B82F6',
      category: 'Продажи',
      count: counts['Продажи'] || 0,
    },
    {
      slug: 'support',
      title: 'Поддержка',
      description:
        'Боты-помощники для клиентского сервиса: отвечают на типовые вопросы, оформляют возвраты, эскалируют сложные кейсы менеджерам',
      icon: 'Headphones',
      accent: '#22C55E',
      category: 'Поддержка',
      count: counts['Поддержка'] || 0,
    },
    {
      slug: 'marketing',
      title: 'Маркетинг',
      description:
        'Прогрев аудитории, рассылки, генерация контента и креативов — всё, что превращает подписчиков в покупателей',
      icon: 'Megaphone',
      accent: '#A855F7',
      category: 'Маркетинг',
      count: counts['Маркетинг'] || 0,
    },
    {
      slug: 'hr',
      title: 'HR',
      description:
        'Скрининг кандидатов, ответы на вопросы о вакансиях, онбординг новых сотрудников — экономьте время рекрутёров',
      icon: 'UserCheck',
      accent: '#F59E0B',
      category: 'HR',
      count: counts['HR'] || 0,
    },
    {
      slug: 'finance',
      title: 'Финансы',
      description:
        'Помощь с расчётами, ответы по балансу, консультации по продуктам банка и страхования — без живых менеджеров',
      icon: 'Coins',
      accent: '#10B981',
      category: 'Финансы',
      count: counts['Финансы'] || 0,
    },
    {
      slug: 'legal',
      title: 'Юриспруденция',
      description:
        'Первичные консультации, шаблоны договоров, разъяснения законов и поиск ответов в правовых базах',
      icon: 'Scale',
      accent: '#6366F1',
      category: 'Юриспруденция',
      count: counts['Юриспруденция'] || 0,
    },
    {
      slug: 'creative',
      title: 'Креатив',
      description:
        'Генерация текстов, идей, дизайн-концепций и сценариев. ИИ-помощник для маркетологов, авторов и креативных агентств',
      icon: 'Sparkles',
      accent: '#EC4899',
      category: 'Креатив',
      count: counts['Креатив'] || 0,
    },
  ];

  return (
    <div className="min-h-screen relative">
      <style>{`
        @keyframes industrySpark {
          0%   { transform: translate(-50%, -50%) translate(0, 0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--px, 0px), var(--py, 0px)); opacity: 0; }
        }
        @keyframes industryFloat1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(20px, -30px) rotate(180deg); }
        }
        @keyframes industryFloat2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(-25px, 20px) rotate(-180deg); }
        }
      `}</style>

      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          left: '5%',
          top: '20%',
          width: '120px',
          height: '120px',
          opacity: 0.15,
          animation: 'industryFloat1 18s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,75 5,75"
            fill="none"
            stroke="#A855F7"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          right: '8%',
          top: '30%',
          width: '160px',
          height: '160px',
          opacity: 0.12,
          animation: 'industryFloat2 22s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,30 95,70 50,95 5,70 5,30"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          left: '50%',
          bottom: '15%',
          width: '100px',
          height: '100px',
          opacity: 0.1,
          animation: 'industryFloat1 25s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect
            x="20"
            y="20"
            width="60"
            height="60"
            fill="none"
            stroke="#EC4899"
            strokeWidth="1"
            transform="rotate(45 50 50)"
          />
        </svg>
      </div>

      <IndustryHeader />

      <section className="relative pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {industries.map((industry, index) => (
              <IndustryCard
                key={industry.slug}
                industry={industry}
                index={index}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                delay: industries.length * 0.08,
                type: 'spring',
                stiffness: 90,
                damping: 14,
              }}
              className="rounded-3xl p-6 md:p-7 flex flex-col items-center justify-center text-center min-h-[280px]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.05) 100%)',
                border: '1px dashed rgba(139,92,246,0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.1) 100%)',
                  border: '1px solid rgba(139,92,246,0.5)',
                }}
              >
                <Icon name="Plus" size={28} className="text-violet-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Не нашли свою отрасль?
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Создадим бота специально под вашу нишу
              </p>
              <Link to="/bot-builder">
                <Button
                  className="text-white border-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                    boxShadow: '0 6px 20px -6px rgba(139,92,246,0.7)',
                  }}
                >
                  <Icon name="Wand2" size={14} className="mr-1.5" />
                  Создать своего
                </Button>
              </Link>
            </motion.div>
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
                <Icon name="Compass" size={26} className="text-white" />
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
                Не уверены, какой бот подойдёт?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-6">
                Посмотрите весь каталог из 85+ готовых решений или попробуйте
                любого бота 3 дня бесплатно
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link to="/catalog" className="flex-1">
                  <Button
                    className="w-full h-12 text-white border-0"
                    style={{
                      background:
                        'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                      boxShadow: '0 10px 30px -10px rgba(139,92,246,0.7)',
                    }}
                  >
                    <Icon name="Grid3x3" size={18} className="mr-2" />
                    Открыть каталог
                  </Button>
                </Link>
                <Link to="/bot-builder" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full h-12 text-white"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Создать своего
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

export default Industries;
