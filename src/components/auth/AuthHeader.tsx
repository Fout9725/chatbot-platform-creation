import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AuthHeader = () => {
  return (
    <header
      className="relative z-10 sticky top-0"
      style={{
        background: 'rgba(10,14,39,0.55)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
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
  );
};

export default AuthHeader;
