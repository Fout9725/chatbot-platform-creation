import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Bot } from '@/components/marketplace/types';

interface BotShowcaseProps {
  bot: Bot;
  accent: string;
}

const orbitChannels = [
  { name: 'Telegram', icon: 'Send', color: '#3B82F6', angle: 0 },
  { name: 'WhatsApp', icon: 'Phone', color: '#22C55E', angle: 120 },
  { name: 'ВКонтакте', icon: 'Users', color: '#6366F1', angle: 240 },
];

const BotShowcase = ({ bot, accent }: BotShowcaseProps) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

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
      tx = x * 30;
      ty = y * 20;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      wrap.style.setProperty('--rx', `${-cy * 0.5}deg`);
      wrap.style.setProperty('--ry', `${cx * 0.5}deg`);
      wrap.style.setProperty('--mx', `${cx}px`);
      wrap.style.setProperty('--my', `${cy}px`);
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
      className="relative w-full h-[420px] md:h-[520px] rounded-3xl overflow-hidden"
      style={{
        perspective: '1600px',
        background: `radial-gradient(ellipse at 50% 30%, ${accent}22 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.18) 0%, transparent 55%)`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 30px 80px -20px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          transform: 'translate3d(var(--mx, 0), var(--my, 0), 0)',
        }}
      />

      <svg
        aria-hidden
        viewBox="-50 -50 100 100"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: '120%', height: '120%', opacity: 0.18 }}
      >
        <g fill="none" stroke={accent} strokeWidth="0.3">
          {Array.from({ length: 6 }).map((_, i) => (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={6 + i * 6}
              strokeDasharray="1.5 2"
            />
          ))}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="80s"
            repeatCount="indefinite"
          />
        </g>
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform:
            'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          className="relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '180px',
              width: '260px',
              height: '50px',
              transform: 'translateZ(-40px) rotateX(70deg)',
              background: `radial-gradient(ellipse at center, ${accent}33 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />

          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: '170px',
              width: '220px',
              height: '40px',
              transform: 'translateZ(-20px) rotateX(70deg)',
              background: `linear-gradient(180deg, ${accent}55 0%, ${accent}11 100%)`,
              border: `1px solid ${accent}66`,
              boxShadow: `0 0 40px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.15)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />

          <motion.div
            animate={{
              y: paused ? [0, -8, 0] : [0, -14, 0],
              rotateY: paused ? 0 : [0, 360],
            }}
            transition={{
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              rotateY: paused
                ? { duration: 0.6 }
                : { duration: 18, repeat: Infinity, ease: 'linear' },
            }}
            className="relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                width: '180px',
                height: '180px',
                left: '-10px',
                top: '-10px',
                background: `radial-gradient(circle, ${accent}66 0%, transparent 65%)`,
                filter: 'blur(20px)',
              }}
            />
            <div
              className="relative w-40 h-40 rounded-3xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}44 0%, ${accent}11 100%)`,
                border: `1px solid ${accent}88`,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: `0 30px 60px -10px ${accent}77, 0 0 50px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              <Icon
                name={bot.icon as string}
                fallback="Bot"
                size={72}
                style={{
                  color: '#fff',
                  filter: `drop-shadow(0 4px 20px ${accent})`,
                }}
              />
            </div>
          </motion.div>

          {orbitChannels.map((c, i) => (
            <motion.div
              key={c.name}
              animate={{ rotate: 360 }}
              transition={{
                duration: 14 + i * 4,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute pointer-events-none"
              style={{
                top: '40px',
                left: '40px',
                width: '80px',
                height: '80px',
                transformOrigin: 'center',
              }}
            >
              <div
                className="absolute"
                style={{
                  top: `${50 + 90 * Math.sin((c.angle * Math.PI) / 180)}px`,
                  left: `${50 + 90 * Math.cos((c.angle * Math.PI) / 180)}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2 + i * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${c.color}55 0%, ${c.color}22 100%)`,
                    border: `1px solid ${c.color}88`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: `0 0 20px ${c.color}88`,
                  }}
                >
                  <Icon
                    name={c.icon}
                    size={18}
                    style={{ color: '#fff' }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(10,14,39,0.6) 100%)',
        }}
      />

      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
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
