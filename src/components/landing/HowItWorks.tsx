import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';

const steps = [
  {
    number: '01',
    icon: 'Store',
    title: 'Выберите решение',
    description: 'Найдите подходящего ИИ-бота в каталоге готовых решений для вашей задачи',
    accent: '#3B82F6',
  },
  {
    number: '02',
    icon: 'PlayCircle',
    title: 'Попробуйте бесплатно',
    description: '3 дня тестирования без оплаты — убедитесь, что бот подходит вашему бизнесу',
    accent: '#8B5CF6',
  },
  {
    number: '03',
    icon: 'MessageCircle',
    title: 'Подключите к мессенджеру',
    description: 'Telegram, WhatsApp, VK — бот начнёт работать с вашими клиентами за 5 минут',
    accent: '#A855F7',
  },
];

const HowItWorks = () => {
  return (
    <section
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: 'transparent' }}
    >
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
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Icon name="Workflow" size={14} className="text-indigo-300" />
            <span className="text-xs uppercase tracking-widest text-indigo-200">
              3 простых шага
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold leading-tight"
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Как это работает
          </h2>
          <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl mx-auto">
            От идеи до работающего бота — за пару минут
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          <div
            className="hidden md:block absolute top-1/2 left-[8%] right-[8%] h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.5) 25%, rgba(139,92,246,0.6) 50%, rgba(168,85,247,0.5) 75%, rgba(168,85,247,0) 100%)',
              transform: 'translateY(-3rem)',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative group"
              >
                <div
                  className="relative rounded-2xl p-7 h-full transition-all duration-300 group-hover:-translate-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow:
                      '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${step.accent}22 0%, transparent 60%)`,
                    }}
                  />

                  <div className="flex items-start justify-between mb-6 relative">
                    <div
                      className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${step.accent}33 0%, ${step.accent}11 100%)`,
                        border: `1px solid ${step.accent}55`,
                        boxShadow: `0 0 24px ${step.accent}33`,
                      }}
                    >
                      <Icon
                        name={step.icon}
                        size={26}
                        style={{ color: step.accent }}
                      />
                    </div>
                    <span
                      className="text-4xl font-bold leading-none tracking-tight"
                      style={{
                        background: `linear-gradient(135deg, ${step.accent} 0%, ${step.accent}55 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        opacity: 0.85,
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 relative">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed relative">
                    {step.description}
                  </p>

                  {idx < steps.length - 1 && (
                    <div
                      className="hidden md:flex absolute top-1/2 -right-4 w-8 h-8 rounded-full items-center justify-center z-10"
                      style={{
                        background: 'rgba(10,14,39,0.9)',
                        border: '1px solid rgba(139,92,246,0.5)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <Icon
                        name="ChevronRight"
                        size={16}
                        className="text-indigo-300"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;