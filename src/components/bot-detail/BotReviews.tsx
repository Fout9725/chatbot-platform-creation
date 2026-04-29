import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';

interface BotReviewsProps {
  accent: string;
  rating: number;
  totalUsers: number;
}

const REVIEWS = [
  {
    name: 'Анна К.',
    company: 'Магазин косметики',
    avatar: 'AK',
    rating: 5,
    text: 'Запустили за один вечер. Конверсия в первую неделю выросла на 32%, менеджеры разгрузились — бот сам отвечает 80% типовых вопросов.',
  },
  {
    name: 'Дмитрий М.',
    company: 'Сеть фитнес-клубов',
    avatar: 'ДМ',
    rating: 5,
    text: 'Нравится, что есть тестовый период — мы спокойно настроили под себя за 3 дня. Поддержка отвечает быстро, бот работает 24/7 без сбоев.',
  },
  {
    name: 'Ирина С.',
    company: 'B2B сервис',
    avatar: 'ИС',
    rating: 4,
    text: 'Ожидала, что будет сложнее настроить. По факту разобралась без программиста. Особенно понравилась интеграция с amoCRM — заявки сразу в воронке.',
  },
];

const BotReviews = ({ accent, rating, totalUsers }: BotReviewsProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
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
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Отзывы пользователей
          </h2>
          <p className="text-sm text-slate-400">
            Что говорят клиенты, которые уже подключили бота
          </p>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.25)',
          }}
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="Star"
                size={14}
                className={
                  i < Math.round(rating)
                    ? 'text-amber-300 fill-amber-300'
                    : 'text-slate-600'
                }
              />
            ))}
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-none">
              {rating.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              из {totalUsers.toLocaleString()} оценок
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REVIEWS.map((r, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="rounded-2xl p-5 h-full flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
                  boxShadow: `0 4px 14px -4px ${accent}99`,
                }}
              >
                {r.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {r.name}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {r.company}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  size={12}
                  className={
                    i < r.rating
                      ? 'text-amber-300 fill-amber-300'
                      : 'text-slate-600'
                  }
                />
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed flex-1">
              {r.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default BotReviews;
