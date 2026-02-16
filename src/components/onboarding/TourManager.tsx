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
  const [showButton, setShowButton] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const tourPath = findTourPath(location.pathname);

  useEffect(() => {
    if (!tourPath) {
      setShowButton(false);
      return;
    }

    const isFirstEver = !localStorage.getItem(FIRST_VISIT_KEY);
    const isFirstPageVisit = !localStorage.getItem(getTourKey(tourPath));

    if (isFirstEver && tourPath === '/') {
      setActiveTour(tourPath);
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      localStorage.setItem(getTourKey(tourPath), 'true');
      setShowButton(false);
    } else if (isFirstPageVisit && tourPath !== '/') {
      const timer = setTimeout(() => {
        setActiveTour(tourPath);
        localStorage.setItem(getTourKey(tourPath), 'true');
      }, 800);
      setShowButton(false);
      return () => clearTimeout(timer);
    } else {
      setShowButton(true);
    }
  }, [tourPath]);

  const startTour = () => {
    if (tourPath) {
      setActiveTour(tourPath);
      setShowButton(false);
    }
  };

  const completeTour = () => {
    setActiveTour(null);
    setShowButton(true);
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

  if (!showButton || !tourPath) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <button
        onClick={startTour}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          isHovered ? 'pl-4 pr-5 py-2' : 'p-3'
        }`}
      >
        <div className="w-8 h-8 flex items-center justify-center">
          <OnboardingMascot mood="happy" size={32} />
        </div>
        <span
          className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isHovered ? 'max-w-40 opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          Экскурсия
        </span>
      </button>

      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
        <Icon name="HelpCircle" size={10} className="text-amber-900" />
      </div>
    </div>
  );
};

export { FIRST_VISIT_KEY };
export default TourManager;
