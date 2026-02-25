import { useNavigate } from 'react-router-dom';
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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl p-8 md:p-12 border border-violet-100">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-5">
            <Icon name="Boxes" size={28} className="text-violet-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Не нашли подходящего?
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Создайте своего ИИ-бота в визуальном конструкторе — без программирования, за несколько минут
          </p>
          <Button
            onClick={handleConstructor}
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base"
          >
            <Icon name="Sparkles" size={18} className="mr-2" />
            Открыть конструктор
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaBlock;
