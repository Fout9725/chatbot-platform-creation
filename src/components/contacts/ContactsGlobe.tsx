import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';

const channels = [
  { name: 'Telegram', icon: 'Send', color: '#3B82F6', radius: 120, speed: 16, angle: 0 },
  { name: 'WhatsApp', icon: 'Phone', color: '#22C55E', radius: 150, speed: 22, angle: 120 },
  { name: 'ВКонтакте', icon: 'Users', color: '#6366F1', radius: 180, speed: 28, angle: 240 },
];

const ContactsGlobe = () => {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      wrap.style.setProperty('--rx', `${-cy * 14}deg`);
      wrap.style.setProperty('--ry', `${cx * 18}deg`);
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
        height: 'clamp(420px, 50vw, 540px)',
        perspective: '1600px',
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.30) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 100%, rgba(34,197,94,0.18) 0%, transparent 50%),
          linear-gradient(180deg, rgba(10,14,39,0.4) 0%, rgba(10,14,39,0.85) 100%)
        `,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 80px -20px rgba(99,102,241,0.5)',
      }}
    >
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
          style={{
            transformStyle: 'preserve-3d',
            width: '380px',
            height: '380px',
          }}
        >
          {channels.map((c, i) => (
            <motion.div
              key={c.name}
              animate={{ rotate: 360 }}
              transition={{
                duration: c.speed,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                transform: `translate(-50%, -50%) rotate(${c.angle}deg)`,
              }}
            >
              <div
                aria-hidden
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${c.radius * 2}px`,
                  height: `${c.radius * 2}px`,
                  left: `${-c.radius}px`,
                  top: `${-c.radius}px`,
                  border: `1px dashed ${c.color}55`,
                }}
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 2.5 + i * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-2xl flex items-center justify-center"
                style={{
                  width: '46px',
                  height: '46px',
                  left: `${c.radius - 23}px`,
                  top: '-23px',
                  background: `linear-gradient(135deg, ${c.color}66 0%, ${c.color}22 100%)`,
                  border: `1px solid ${c.color}AA`,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: `0 0 28px ${c.color}AA, 0 12px 24px -8px ${c.color}99`,
                }}
              >
                <Icon name={c.icon} size={20} style={{ color: '#fff' }} />
              </motion.div>
            </motion.div>
          ))}

          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              aria-hidden
              className="absolute -inset-12 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)',
                filter: 'blur(28px)',
              }}
            />
            <svg
              viewBox="-50 -50 100 100"
              className="relative"
              style={{ width: 200, height: 200 }}
            >
              <defs>
                <radialGradient id="globeGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#6366F1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#312E81" stopOpacity="0.4" />
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="42" fill="url(#globeGrad)" />
              <g fill="none" stroke="#C7D2FE" strokeWidth="0.5" opacity="0.7">
                <circle cx="0" cy="0" r="42" />
                <ellipse cx="0" cy="0" rx="42" ry="14" />
                <ellipse cx="0" cy="0" rx="42" ry="28" />
                <ellipse cx="0" cy="0" rx="14" ry="42" />
                <ellipse cx="0" cy="0" rx="28" ry="42" />
                <line x1="-42" y1="0" x2="42" y2="0" />
                <line x1="0" y1="-42" x2="0" y2="42" />
              </g>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const r = 32 + Math.random() * 8;
                return (
                  <circle
                    key={i}
                    cx={Math.cos(angle) * r}
                    cy={Math.sin(angle) * r}
                    r="1.4"
                    fill="#34D399"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.3;1;0.3"
                      dur={`${2 + (i % 4)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </svg>
          </motion.div>
        </div>
      </div>

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
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Сеть на связи
      </div>
    </div>
  );
};

export default ContactsGlobe;
