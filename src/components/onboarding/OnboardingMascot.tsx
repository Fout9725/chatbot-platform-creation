import { useState, useEffect } from 'react';

interface OnboardingMascotProps {
  mood?: 'happy' | 'thinking' | 'excited' | 'waving';
  size?: number;
  className?: string;
}

const OnboardingMascot = ({ mood = 'happy', size = 120, className = '' }: OnboardingMascotProps) => {
  const [isWaving, setIsWaving] = useState(mood === 'waving');

  useEffect(() => {
    if (mood === 'waving') {
      setIsWaving(true);
      const timer = setTimeout(() => setIsWaving(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [mood]);

  const eyeStyle = mood === 'excited' 
    ? 'scale-110' 
    : mood === 'thinking' 
      ? 'scale-90' 
      : '';

  const mouthPath = mood === 'excited' 
    ? 'M 35 72 Q 50 88 65 72' 
    : mood === 'thinking' 
      ? 'M 40 75 Q 50 72 60 75' 
      : 'M 35 70 Q 50 82 65 70';

  return (
    <div className={`animate-float ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
            <stop offset="100%" stopColor="hsl(199, 89%, 48%)" />
          </linearGradient>
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        <circle cx="50" cy="50" r="36" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <circle cx="38" cy="38" r="14" fill="url(#shineGrad)" />

        <g className={`${eyeStyle} animate-blink`} style={{ transformOrigin: '50px 44px' }}>
          <ellipse cx="38" cy="44" rx="5" ry="5.5" fill="white" />
          <ellipse cx="62" cy="44" rx="5" ry="5.5" fill="white" />
          <circle cx="39" cy="43" r="2.5" fill="#1a1a2e" />
          <circle cx="63" cy="43" r="2.5" fill="#1a1a2e" />
          <circle cx="40" cy="42" r="1" fill="white" />
          <circle cx="64" cy="42" r="1" fill="white" />
        </g>

        {mood === 'excited' && (
          <>
            <line x1="28" y1="36" x2="24" y2="32" stroke="hsl(262, 83%, 58%)" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="36" x2="76" y2="32" stroke="hsl(199, 89%, 48%)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="55" r="4" fill="hsl(350, 80%, 75%)" opacity="0.4" />
            <circle cx="74" cy="55" r="4" fill="hsl(350, 80%, 75%)" opacity="0.4" />
          </>
        )}

        <path d={mouthPath} stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        <g className={isWaving ? 'animate-wave' : ''} style={{ transformOrigin: '78px 60px' }}>
          <circle cx="82" cy="55" r="8" fill="url(#bodyGrad)" filter="url(#shadow)" />
          <path d="M 82 48 L 82 44" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>

        <circle cx="18" cy="55" r="8" fill="url(#bodyGrad)" filter="url(#shadow)" />

        <ellipse cx="36" cy="88" rx="10" ry="5" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <ellipse cx="64" cy="88" rx="10" ry="5" fill="url(#bodyGrad)" filter="url(#shadow)" />

        <rect x="42" y="16" width="6" height="10" rx="3" fill="url(#bodyGrad)" />
        <circle cx="45" cy="14" r="3" fill="hsl(262, 83%, 68%)" />
        <rect x="54" y="18" width="5" height="8" rx="2.5" fill="url(#bodyGrad)" />
        <circle cx="56.5" cy="16" r="2.5" fill="hsl(199, 89%, 58%)" />
      </svg>
    </div>
  );
};

export default OnboardingMascot;
