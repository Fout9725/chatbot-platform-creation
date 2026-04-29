import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const IndustryHeader = () => {
  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,14,39,0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderBottom: '1px solid rgba(139,92,246,0.18)',
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
          <div className="flex items-center gap-2">
            <Link to="/catalog">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-200 hover:text-white hover:bg-white/10"
              >
                <Icon name="Grid3x3" size={16} className="mr-1.5" />
                Каталог
              </Button>
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
        </div>
      </header>

      <section className="relative pt-12 md:pt-16 pb-10">
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
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Icon name="Layers" size={14} className="text-fuchsia-300" />
              <span className="text-xs uppercase tracking-widest text-fuchsia-200">
                7 направлений бизнеса
              </span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-4"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #C4B5FD 50%, #93C5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Решения по отраслям
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Выберите ваше направление — мы покажем готовых ИИ-ботов,
              заточенных под задачи вашей сферы
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default IndustryHeader;
