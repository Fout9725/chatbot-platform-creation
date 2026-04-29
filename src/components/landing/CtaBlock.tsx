import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface CtaBlockProps {
  onAuthOpen: () => void;
}

const CtaBlock = ({ onAuthOpen }: CtaBlockProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleConstructor = () => {
    if (!isAuthenticated) {
      onAuthOpen();
    } else if (!user?.plan || user?.plan === 'free') {
      navigate('/pricing');
    } else {
      navigate('/constructor');
    }
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
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
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 10px 30px -10px rgba(168,85,247,0.7)',
              }}
            >
              <Icon name="Boxes" size={26} className="text-white" />
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
              Не нашли подходящего бота?
            </h2>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Создайте своего ИИ-бота в визуальном конструкторе — без
              программирования, за несколько минут
            </p>
            <Button
              onClick={handleConstructor}
              size="lg"
              className="text-white border-0 px-8 h-12"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 10px 30px -10px rgba(168,85,247,0.7)',
              }}
            >
              <Icon name="Sparkles" size={18} className="mr-2" />
              Открыть конструктор
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaBlock;
