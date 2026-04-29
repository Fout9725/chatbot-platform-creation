import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tours } from './tourConfig';
import PageTourOverlay from './PageTourOverlay';
import OnboardingMascot from './OnboardingMascot';
import Icon from '@/components/ui/icon';

const FIRST_VISIT_KEY = 'intellectpro-onboarding-done';

const getTourKey = (path: string) => `tour-seen-${path}`;

const findTourPath = (pathname: string): string | null => {
  if (tours[pathname]) return pathname;
  const base = '/' + pathname.split('/').filter(Boolean)[0];
  if (tours[base]) return base;
  return null;
};

const TourManager = () => {
  const location = useLocation();
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tourPath = findTourPath(location.pathname);

  useEffect(() => {
    if (!tourPath) return;

    const isFirstEver = !localStorage.getItem(FIRST_VISIT_KEY);
    const isFirstPageVisit = !localStorage.getItem(getTourKey(tourPath));

    if (isFirstEver && tourPath === '/') {
      setActiveTour(tourPath);
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      localStorage.setItem(getTourKey(tourPath), 'true');
    } else if (isFirstPageVisit && tourPath !== '/') {
      const timer = setTimeout(() => {
        setActiveTour(tourPath);
        localStorage.setItem(getTourKey(tourPath), 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tourPath]);

  const startTour = () => {
    if (tourPath) {
      setActiveTour(tourPath);
    }
  };

  const completeTour = () => {
    setActiveTour(null);
  };

  if (activeTour && tours[activeTour]) {
    return (
      <PageTourOverlay
        key={activeTour}
        steps={tours[activeTour].steps}
        onComplete={completeTour}
      />
    );
  }

  if (!tourPath) return null;

  if (isCollapsed) {
    return (
      <>
        <style>{`
          @keyframes tourPing {
            0%   { transform: scale(0.85); opacity: 0.7; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes tourBob {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-2px); }
          }
        `}</style>
        <button
          onClick={() => setIsCollapsed(false)}
          aria-label="Показать экскурсовода"
          className="fixed bottom-6 left-6 z-[999] w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#cbd5e1',
          }}
        >
          <Icon name="HelpCircle" size={16} />
        </button>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes tourPing {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes tourBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        @keyframes tourOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div className="fixed bottom-6 left-6 z-[999] flex items-end gap-2">
        <button
          onClick={startTour}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Запустить экскурсию"
          className="relative flex items-center gap-2.5 pl-2 pr-3 h-12 rounded-full transition-all duration-300"
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.4) 100%)'
              : 'rgba(255,255,255,0.06)',
            border: isHovered
              ? '1px solid rgba(139,92,246,0.6)'
              : '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: isHovered
              ? '0 16px 40px -12px rgba(139,92,246,0.6)'
              : '0 8px 20px -8px rgba(0,0,0,0.5)',
          }}
        >
          <span
            aria-hidden
            className="absolute -inset-1 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
              animation: 'tourPing 2.6s ease-out infinite',
              opacity: isHovered ? 0.5 : 0.3,
            }}
          />

          <span
            className="relative flex items-center justify-center w-8 h-8 rounded-full"
            style={{
              animation: 'tourBob 3s ease-in-out infinite',
            }}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)',
                filter: 'blur(6px)',
              }}
            />
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full pointer-events-none"
              style={{
                border: '1px dashed rgba(139,92,246,0.6)',
                animation: 'tourOrbit 8s linear infinite',
              }}
            />
            <span
              className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                boxShadow:
                  '0 6px 14px -4px rgba(59,130,246,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <OnboardingMascot mood="happy" size={20} />
            </span>
          </span>

          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 text-white"
            style={{
              maxWidth: isHovered ? '160px' : '100px',
              opacity: 1,
            }}
          >
            {isHovered ? 'Запустить экскурсию' : 'Экскурсовод'}
          </span>

          <span
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 8px rgba(34,197,94,0.7)',
            }}
            aria-hidden
          >
            ?
          </span>
        </button>

        <button
          onClick={() => setIsCollapsed(true)}
          aria-label="Свернуть экскурсовода"
          className="w-7 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <Icon name="ChevronLeft" size={14} />
        </button>
      </div>
    </>
  );
};

export { FIRST_VISIT_KEY };
export default TourManager;
