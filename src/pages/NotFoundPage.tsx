import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <PageLayout
      title="404 — Страница не найдена"
      description="Похоже, такая страница улетела в космос. Вернитесь на главную."
    >
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        <div
          className="absolute opacity-40 pointer-events-none hidden md:block"
          style={{ top: '8%', right: '8%' }}
        >
          <Scene3D variant="rings" size={260} />
        </div>
        <div
          className="absolute opacity-30 pointer-events-none hidden md:block"
          style={{ bottom: '8%', left: '6%' }}
        >
          <Scene3D variant="cube" size={180} />
        </div>

        <GlassCard className="w-full max-w-xl p-8 md:p-12 text-center glass-fade-in z-10">
          <div className="mb-6 flex justify-center">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
                boxShadow: '0 0 60px rgba(139,92,246,0.5)',
              }}
            >
              <Icon name="Rocket" size={56} className="text-white" />
            </div>
          </div>

          <h1
            className="text-7xl md:text-8xl font-extrabold mb-4 text-glass-title"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            404
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">
            Страница улетела в космос
          </h2>
          <p className="text-glass-muted mb-8 leading-relaxed">
            Возможно, страница была перемещена, удалена или адрес введён с ошибкой.
            <br className="hidden sm:block" />
            Не переживайте — мы вернём вас в безопасную галактику.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="btn-glass-primary w-full sm:w-auto">
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="btn-glass-secondary w-full sm:w-auto"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t glass-divider text-sm text-glass-muted">
            Запрошенный путь:{' '}
            <code className="px-2 py-0.5 rounded bg-white/5 text-indigo-300">
              {location.pathname}
            </code>
          </div>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default NotFoundPage;
