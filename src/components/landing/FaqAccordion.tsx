import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/icon';

const faqs = [
  {
    q: 'Сколько стоит запустить ИИ-бота?',
    a: 'Тариф «Старт» — 990 ₽/мес. Первые 3 дня бесплатно. Можно отказаться в любой момент без штрафов.',
  },
  {
    q: 'Нужно ли уметь программировать?',
    a: 'Нет. Все боты настраиваются в визуальном конструкторе. Если хочется глубокой кастомизации — есть API и вебхуки на тарифе «Корпоратив».',
  },
  {
    q: 'В каких мессенджерах работают боты?',
    a: 'Telegram, WhatsApp Business, ВКонтакте и виджет на сайте. Один бот может работать сразу во всех каналах с единой базой клиентов.',
  },
  {
    q: 'Как быстро бот начнёт отвечать клиентам?',
    a: 'Среднее время запуска — 5 минут от регистрации до первого ответа клиенту. Готовые шаблоны не требуют сложной настройки.',
  },
  {
    q: 'Что с безопасностью и данными клиентов?',
    a: 'Данные хранятся в России на защищённых серверах, шифрование в покое и при передаче. Соответствие 152-ФЗ. Ваши диалоги недоступны третьим лицам.',
  },
  {
    q: 'Можно ли перейти на другой тариф позже?',
    a: 'Да, вы можете повысить или понизить тариф в личном кабинете в любой момент. Перерасчёт происходит автоматически.',
  },
];

const FaqAccordion = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: '60vmin', height: '60vmin', opacity: 0.08 }}
      >
        <svg viewBox="-50 -50 100 100" className="w-full h-full">
          <g fill="none" stroke="#A855F7" strokeWidth="0.4">
            {Array.from({ length: 10 }).map((_, i) => (
              <circle
                key={i}
                cx="0"
                cy="0"
                r={4 + i * 4.5}
                strokeDasharray="2 3"
              />
            ))}
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="60s"
              repeatCount="indefinite"
            />
          </g>
        </svg>
      </div>

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
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Icon name="HelpCircle" size={14} className="text-indigo-300" />
            <span className="text-xs uppercase tracking-widest text-indigo-200">
              Вопросы и ответы
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold leading-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #93C5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Часто спрашивают
          </h2>
          <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl mx-auto">
            Быстрые ответы на главные вопросы о платформе
          </p>
        </motion.div>

        <div
          className="max-w-3xl mx-auto space-y-3"
          style={{ perspective: '1200px' }}
        >
          {faqs.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <motion.div
                  animate={{
                    rotateX: isOpen ? 0 : -2,
                    z: isOpen ? 40 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative rounded-2xl"
                  style={{
                    background: isOpen
                      ? 'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.06) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    border: isOpen
                      ? '1px solid rgba(168,85,247,0.4)'
                      : '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: isOpen
                      ? '0 20px 60px -20px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
                      : '0 8px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base md:text-lg font-medium text-white pr-2">
                      {item.q}
                    </span>
                    <span
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{
                        background: isOpen
                          ? 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: isOpen
                          ? '1px solid rgba(168,85,247,0.6)'
                          : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: isOpen
                          ? '0 0 20px rgba(168,85,247,0.5)'
                          : 'none',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      <Icon
                        name="Plus"
                        size={16}
                        className={isOpen ? 'text-white' : 'text-slate-300'}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-5 md:px-7 pb-6">
                          <div
                            className="h-px mb-4 w-full"
                            style={{
                              background:
                                'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.5) 50%, transparent 100%)',
                            }}
                          />
                          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqAccordion;
