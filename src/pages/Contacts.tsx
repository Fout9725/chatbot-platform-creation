import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ContactsGlobe from '@/components/contacts/ContactsGlobe';

const channels = [
  {
    name: 'Telegram-сообщество',
    desc: 'Чат поддержки и новости платформы',
    icon: 'Send',
    color: '#3B82F6',
    href: 'https://t.me/+QgiLIa1gFRY4Y2Iy',
  },
  {
    name: 'Telegram-администратор',
    desc: 'Быстрый ответ от команды',
    icon: 'MessageCircle',
    color: '#22C55E',
    href: 'https://t.me/Fou9725',
  },
  {
    name: 'Email-поддержка',
    desc: 'Письменные обращения и счета',
    icon: 'Mail',
    color: '#A855F7',
    href: 'mailto:support@intellectpro.ru',
  },
];

const Contacts = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: 'Сообщение отправлено!',
        description: 'Мы ответим вам в течение 1 рабочего дня.',
      });
      setForm({ name: '', email: '', message: '' });
    }, 900);
  };

  return (
    <div className="min-h-screen relative">
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,14,39,0.55)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderBottom: '1px solid transparent',
        }}
      >
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                boxShadow: '0 0 20px rgba(139,92,246,0.5)',
              }}
            >
              <Icon name="Bot" className="text-white" size={20} />
            </div>
            <span
              className="text-lg font-bold"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ИнтеллектПро
            </span>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1.5" />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative pt-12 md:pt-16 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
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
              <Icon name="Radio" size={14} className="text-indigo-300" />
              <span className="text-xs uppercase tracking-widest text-indigo-200">
                Связь с командой
              </span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-4"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #93C5FD 50%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Контакты
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Напишите нам — отвечаем в среднем за 5 минут в рабочее время
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="lg:sticky lg:top-24"
            >
              <ContactsGlobe />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                {channels.map((c) => (
                  <a
                    key={c.name}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      c.href.startsWith('http') ? 'noopener noreferrer' : undefined
                    }
                    className="group relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: `0 14px 30px -16px ${c.color}55`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${c.color}33 0%, ${c.color}11 100%)`,
                        border: `1px solid ${c.color}55`,
                        boxShadow: `0 0 16px ${c.color}33`,
                      }}
                    >
                      <Icon name={c.icon} size={16} style={{ color: c.color }} />
                    </div>
                    <div className="text-xs font-semibold text-white leading-tight mb-0.5">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      {c.desc}
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="rounded-3xl p-6 md:p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow:
                  '0 30px 60px -20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Напишите нам напрямую
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Расскажите о задаче — подберём бота или ответим на вопросы по
                платформе
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                    Как к вам обращаться
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Иван"
                    className="w-full px-4 h-11 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                    Email или телефон
                  </label>
                  <input
                    type="text"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    className="w-full px-4 h-11 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                    Сообщение
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Кратко опишите вашу задачу..."
                    className="w-full px-4 py-3 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full h-12 text-white border-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                    boxShadow: '0 10px 30px -10px rgba(99,102,241,0.7)',
                  }}
                >
                  {isSending ? (
                    <>
                      <Icon
                        name="Loader2"
                        size={16}
                        className="mr-2 animate-spin"
                      />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить сообщение
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-slate-500 text-center">
                  Нажимая кнопку, вы соглашаетесь с{' '}
                  <Link
                    to="/privacy"
                    className="text-slate-400 hover:text-white underline-offset-4 hover:underline transition-colors"
                  >
                    политикой конфиденциальности
                  </Link>
                </p>
              </form>
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
            className="rounded-3xl p-6 md:p-8 max-w-5xl mx-auto"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow:
                '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Реквизиты
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ООО «ИнтеллектПро»
                  <br />
                  ИНН 1234567890
                  <br />
                  ОГРН 1112233445566
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Часы поддержки
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Пн–Пт: 9:00 — 21:00 (МСК)
                  <br />
                  Сб–Вс: 11:00 — 18:00 (МСК)
                  <br />
                  Бот в Telegram — 24/7
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Адрес офиса
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Москва, ул. Примерная, д. 12
                  <br />
                  БЦ «Башня», офис 305
                  <br />
                  По предварительной записи
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contacts;
