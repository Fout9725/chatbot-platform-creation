import { CSSProperties, useEffect, useRef } from 'react';

interface Scene3DProps {
  variant?: 'cube' | 'sphere' | 'pyramid' | 'rings';
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const Scene3D = ({
  variant = 'cube',
  size = 220,
  className = '',
  style,
}: Scene3DProps) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let raf = 0;
    let mx = 0,
      my = 0,
      cx = 0,
      cy = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left - r.width / 2) / r.width) * 30;
      my = ((e.clientY - r.top - r.height / 2) / r.height) * -30;
    };
    const loop = () => {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      el.style.setProperty('--rx', `${cy}deg`);
      el.style.setProperty('--ry', `${cx}deg`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const halfSize = size / 2;

  if (variant === 'cube') {
    const faces = [
      { tf: `translateZ(${halfSize}px)`, bg: 'rgba(99,102,241,0.30)' },
      {
        tf: `rotateY(180deg) translateZ(${halfSize}px)`,
        bg: 'rgba(168,85,247,0.30)',
      },
      {
        tf: `rotateY(90deg) translateZ(${halfSize}px)`,
        bg: 'rgba(59,130,246,0.30)',
      },
      {
        tf: `rotateY(-90deg) translateZ(${halfSize}px)`,
        bg: 'rgba(139,92,246,0.30)',
      },
      {
        tf: `rotateX(90deg) translateZ(${halfSize}px)`,
        bg: 'rgba(96,165,250,0.30)',
      },
      {
        tf: `rotateX(-90deg) translateZ(${halfSize}px)`,
        bg: 'rgba(167,139,250,0.30)',
      },
    ];
    return (
      <div
        ref={wrapRef}
        className={`relative ${className}`}
        style={{
          width: size,
          height: size,
          perspective: '1200px',
          ...style,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform:
              'rotateX(var(--rx, -20deg)) rotateY(var(--ry, 30deg))',
            animation: 'cubeSpin 22s linear infinite',
          }}
        >
          {faces.map((f, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-xl"
              style={{
                transform: f.tf,
                background: f.bg,
                border: '1px solid rgba(99,102,241,0.55)',
                backdropFilter: 'blur(10px)',
                boxShadow:
                  '0 0 40px rgba(99,102,241,0.35), inset 0 0 30px rgba(255,255,255,0.05)',
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes cubeSpin {
            from { transform: rotateX(-20deg) rotateY(0deg); }
            to { transform: rotateX(-20deg) rotateY(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (variant === 'rings') {
    return (
      <div
        ref={wrapRef}
        className={`relative ${className}`}
        style={{ width: size, height: size, perspective: '1000px', ...style }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform:
              'rotateX(var(--rx, 60deg)) rotateY(var(--ry, 0deg))',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: `${i * 10}%`,
                border: `2px solid rgba(${
                  i === 0 ? '99,102,241' : i === 1 ? '168,85,247' : '59,130,246'
                },0.7)`,
                transform: `rotateX(${i * 60}deg) rotateY(${i * 30}deg)`,
                animation: `ringSpin${i} ${10 + i * 4}s linear infinite`,
                boxShadow: `0 0 30px rgba(${
                  i === 0 ? '99,102,241' : i === 1 ? '168,85,247' : '59,130,246'
                },0.6)`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes ringSpin0 { from { transform: rotateX(0deg) rotateY(0deg); } to { transform: rotateX(360deg) rotateY(180deg); } }
          @keyframes ringSpin1 { from { transform: rotateX(60deg) rotateY(0deg); } to { transform: rotateX(60deg) rotateY(360deg); } }
          @keyframes ringSpin2 { from { transform: rotateX(120deg) rotateY(0deg); } to { transform: rotateX(120deg) rotateY(-360deg); } }
        `}</style>
      </div>
    );
  }

  // sphere / pyramid fallback
  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.9) 0%, rgba(99,102,241,0.5) 40%, rgba(10,14,39,0.2) 80%)',
          boxShadow:
            '0 0 80px rgba(99,102,241,0.6), inset -30px -30px 60px rgba(0,0,0,0.4)',
          animation: 'spherePulse 6s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes spherePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
};

export default Scene3D;
