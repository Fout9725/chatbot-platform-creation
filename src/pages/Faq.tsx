import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import FaqHeader from '@/components/faq/FaqHeader';
import FaqHologram from '@/components/faq/FaqHologram';
import { FAQ_CATEGORIES } from '@/components/faq/FaqData';

const Faq = () => {
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id);
  const [openKey, setOpenKey] = useState<string | null>(
    `${FAQ_CATEGORIES[0].id}-0`,
  );
  const [search, setSearch] = useState('');

  const category = useMemo(
    () =>
      FAQ_CATEGORIES.find((c) => c.id === activeCategory) ||
      FAQ_CATEGORIES[0],
    [activeCategory],
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return category.items;
    const q = search.toLowerCase();
    return category.items.filter(
      (it) =>
        it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
    );
  }, [category, search]);

  return (
    <div className="min-h-screen relative">
      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          left: '50%',
          top: '60%',
          transform: 'translate(-50%, -50%)',
          width: '60vmin',
          height: '60vmin',
          opacity: 0.07,
        }}
      >
        <svg viewBox="-50 -50 100 100" className="w-full h-full">
          <g fill="none" stroke="#A855F7" strokeWidth="0.4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx="40"
                ry="14"
                transform={`rotate(${i * 30})`}
              />
            ))}
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="100s"
              repeatCount="indefinite"
            />
          </g>
        </svg>
      </div>

      <FaqHeader />

      <section className="relative pb-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl mx-auto rounded-2xl flex items-center gap-3 px-4 h-12"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Icon name="Search" size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-white"
                aria-label="Очистить"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      <section className="relative pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {FAQ_CATEGORIES.map((c) => {
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(c.id);
                    setOpenKey(`${c.id}-0`);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${c.accent} 0%, ${c.accent}99 100%)`
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? `1px solid ${c.accent}`
                      : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#fff' : '#cbd5e1',
                    boxShadow: active
                      ? `0 8px 24px -6px ${c.accent}99`
                      : 'none',
                  }}
                >
                  <Icon name={c.icon} size={14} />
                  {c.title}
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{
                      background: active
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {c.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative pb-20 md:pb-28">
        <div
          className="container mx-auto px-4 max-w-3xl"
          style={{ perspective: '1400px' }}
        >
          {filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => {
                const key = `${category.id}-${idx}`;
                return (
                  <FaqHologram
                    key={key}
                    q={item.q}
                    a={item.a}
                    accent={category.accent}
                    index={idx}
                    isOpen={openKey === key}
                    onToggle={() =>
                      setOpenKey(openKey === key ? null : key)
                    }
                  />
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
                  border: '1px solid rgba(139,92,246,0.4)',
                }}
              >
                <Icon name="SearchX" size={24} className="text-violet-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Ничего не нашли
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Попробуйте другую формулировку или выберите другую категорию
              </p>
              <Button
                onClick={() => setSearch('')}
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Icon name="RotateCcw" size={14} className="mr-1.5" />
                Сбросить поиск
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mt-12 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.10) 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 30px 80px -20px rgba(99,102,241,0.5)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                  boxShadow: '0 10px 30px -10px rgba(99,102,241,0.7)',
                }}
              >
                <Icon name="MessageCircle" size={26} className="text-white" />
              </div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Не нашли ответ?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-6">
                Напишите нам — поддержка отвечает в среднем за 5 минут в
                рабочее время
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link to="/contacts" className="flex-1">
                  <Button
                    className="w-full h-12 text-white border-0"
                    style={{
                      background:
                        'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                      boxShadow: '0 10px 30px -10px rgba(99,102,241,0.7)',
                    }}
                  >
                    <Icon name="Mail" size={18} className="mr-2" />
                    Связаться с нами
                  </Button>
                </Link>
                <a
                  href="https://t.me/+QgiLIa1gFRY4Y2Iy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="ghost"
                    className="w-full h-12 text-white"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    Telegram-чат
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Faq;
