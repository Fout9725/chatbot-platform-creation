import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Bot } from '@/components/marketplace/types';

interface BotShowcaseProps {
  bot: Bot;
  accent: string;
}

const orbitChannels = [
  { name: 'Telegram', icon: 'Send', color: '#3B82F6', radius: 150, speed: 14, delay: 0 },
  { name: 'WhatsApp', icon: 'Phone', color: '#22C55E', radius: 180, speed: 18, delay: 1.5 },
  { name: 'ВКонтакте', icon: 'Users', color: '#6366F1', radius: 210, speed: 22, delay: 3 },
];

const BotShowcase = ({ bot, accent }: BotShowcaseProps) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const sparks = useMemo(
    () =>
      Array.from({ length: 24 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.8 + Math.random() * 1.6,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 5,
      })),
    [],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tx = x;
      ty = y;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      wrap.style.setProperty('--rx', `${-cy * 12}deg`);
      wrap.style.setProperty('--ry', `${cx * 18}deg`);
      wrap.style.setProperty('--mx', `${cx * 100}px`);
      wrap.style.setProperty('--my', `${cy * 100}px`);
      raf = requestAnimationFrame(loop);
    };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-3xl overflow-hidden"
      style={{
        height: 'clamp(460px, 56vw, 580px)',
        perspective: '1800px',
        background: `
          radial-gradient(ellipse at 50% 25%, ${accent}33 0%, transparent 55%),
          radial-gradient(ellipse at 30% 80%, rgba(168,85,247,0.22) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(59,130,246,0.18) 0%, transparent 50%),
          linear-gradient(180deg, rgba(10,14,39,0.4) 0%, rgba(10,14,39,0.85) 100%)
        `,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 30px 80px -20px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.35) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.18,
          maskImage:
            'radial-gradient(ellipse at 50% 60%, #000 40%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 60%, #000 40%, transparent 80%)',
          transform: 'translate3d(calc(var(--mx, 0px) * -0.15), calc(var(--my, 0px) * -0.15), 0)',
          transition: 'transform 0.15s linear',
        }}
      />

      <svg
        aria-hidden
        viewBox="-50 -50 100 100"
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: '160%',
          height: '160%',
          transform:
            'translate(-50%, -50%) translate3d(calc(var(--mx, 0px) * -0.25), calc(var(--my, 0px) * -0.25), 0)',
          opacity: 0.28,
          transition: 'transform 0.15s linear',
        }}
      >
        <g fill="none" stroke={accent} strokeWidth="0.25">
          {Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={5 + i * 5.5}
              strokeDasharray="1.2 1.8"
            />
          ))}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="120s"
            repeatCount="indefinite"
          />
        </g>
      </svg>

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {sparks.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: i % 4 === 0 ? accent : '#ffffff',
              boxShadow: `0 0 ${s.size * 4}px ${i % 4 === 0 ? accent : '#ffffff'}`,
              opacity: 0.7,
              animation: `sparkFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sparkFloat {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(8px, -16px); opacity: 0.9; }
        }
      `}</style>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            width: '440px',
            height: '440px',
          }}
        >
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: '290px',
              width: '320px',
              height: '70px',
              background: 'rgba(0,0,0,0.55)',
              filter: 'blur(28px)',
              transform: 'translateZ(-100px)',
            }}
          />

          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: '270px',
              width: '290px',
              height: '70px',
              transform: 'translateZ(-60px) rotateX(72deg)',
              background: `radial-gradient(ellipse at center, ${accent}55 0%, ${accent}00 75%)`,
              filter: 'blur(6px)',
            }}
          />
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: '250px',
              width: '240px',
              height: '60px',
              transform: 'translateZ(-30px) rotateX(72deg)',
              background: `radial-gradient(ellipse at center, ${accent}88 0%, ${accent}00 70%)`,
            }}
          />

          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: '255px',
              width: '230px',
              height: '50px',
              transform: 'translateZ(-10px) rotateX(72deg)',
              background: `linear-gradient(180deg, ${accent}66 0%, ${accent}11 100%)`,
              border: `2px solid ${accent}99`,
              boxShadow: `0 0 60px ${accent}99, inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -4px 12px ${accent}66`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />

          {orbitChannels.map((c, i) => (
            <motion.div
              key={c.name}
              animate={{ rotate: 360 }}
              transition={{
                duration: c.speed,
                repeat: Infinity,
                ease: 'linear',
                delay: c.delay,
              }}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                transform: 'translate(-50%, -50%)',
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.5 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-2xl flex items-center justify-center"
                style={{
                  width: '52px',
                  height: '52px',
                  left: `${c.radius - 26}px`,
                  top: '-26px',
                  background: `linear-gradient(135deg, ${c.color}66 0%, ${c.color}22 100%)`,
                  border: `1px solid ${c.color}AA`,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: `0 0 30px ${c.color}AA, 0 12px 24px -8px ${c.color}99, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
              >
                <Icon name={c.icon} size={22} style={{ color: '#fff' }} />
              </motion.div>
            </motion.div>
          ))}

          <motion.div
            animate={{ y: [-10, -22, -10] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '60px',
              transformStyle: 'preserve-3d',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'linear',
              }}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '240px',
                height: '240px',
                left: '-30px',
                top: '-30px',
                border: `1px dashed ${accent}66`,
              }}
            />

            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
              }}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '300px',
                height: '300px',
                left: '-60px',
                top: '-60px',
                border: `1px dashed ${accent}33`,
              }}
            />

            <div
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '260px',
                height: '260px',
                left: '-40px',
                top: '-40px',
                background: `radial-gradient(circle, ${accent}66 0%, transparent 60%)`,
                filter: 'blur(28px)',
              }}
            />

            <motion.div
              animate={{ rotateY: 360 }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  transform: 'translateZ(-1px)',
                  background: `linear-gradient(135deg, ${accent}AA 0%, ${accent}33 100%)`,
                  filter: 'blur(2px)',
                }}
              />
              <div
                className="relative w-44 h-44 rounded-[2rem] flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent}55 0%, ${accent}11 100%)`,
                  border: `1px solid ${accent}AA`,
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  boxShadow: `
                    0 30px 60px -10px ${accent}88,
                    0 0 60px ${accent}66,
                    inset 0 2px 0 rgba(255,255,255,0.25),
                    inset 0 -4px 16px ${accent}66
                  `,
                }}
              >
                <div
                  aria-hidden
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                    filter: 'blur(2px)',
                  }}
                />
                <Icon
                  name={bot.icon as string}
                  fallback="Bot"
                  size={84}
                  style={{
                    color: '#fff',
                    filter: `drop-shadow(0 6px 24px ${accent})`,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(10,14,39,0.7) 100%)',
        }}
      />

      <div
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#cbd5e1',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}
        />
        3D-витрина
      </div>

      <div
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#cbd5e1',
        }}
      >
        <Icon name="MousePointer2" size={11} />
        Двигайте мышью
      </div>
    </div>
  );
};

export default BotShowcase;
