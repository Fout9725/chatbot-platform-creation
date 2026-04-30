import { useEffect, useRef } from 'react';

const FloatingOrbs = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = ref.current;
    if (!wrap) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      tx = (e.clientX / w - 0.5) * 24;
      ty = (e.clientY / h - 0.5) * 24;
    };
    const loop = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      wrap.style.setProperty('--ox', `${cx}px`);
      wrap.style.setProperty('--oy', `${cy}px`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute rounded-full"
        style={{
          width: '480px',
          height: '480px',
          top: '-120px',
          left: '-120px',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)',
          filter: 'blur(40px)',
          transform:
            'translate3d(calc(var(--ox, 0px) * 1.2), calc(var(--oy, 0px) * 1.2), 0)',
          animation: 'orbFloatA 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '560px',
          height: '560px',
          bottom: '-160px',
          right: '-180px',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.30) 0%, rgba(168,85,247,0) 70%)',
          filter: 'blur(50px)',
          transform:
            'translate3d(calc(var(--ox, 0px) * -1.5), calc(var(--oy, 0px) * -1.5), 0)',
          animation: 'orbFloatB 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '380px',
          height: '380px',
          top: '40%',
          right: '15%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0) 70%)',
          filter: 'blur(45px)',
          transform:
            'translate3d(calc(var(--ox, 0px) * 0.8), calc(var(--oy, 0px) * 0.8), 0)',
          animation: 'orbFloatC 20s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes orbFloatA {
          0%, 100% { translate: 0 0; }
          50% { translate: 60px 40px; }
        }
        @keyframes orbFloatB {
          0%, 100% { translate: 0 0; }
          50% { translate: -50px -30px; }
        }
        @keyframes orbFloatC {
          0%, 100% { translate: 0 0; }
          50% { translate: 30px -50px; }
        }
      `}</style>
    </div>
  );
};

export default FloatingOrbs;
