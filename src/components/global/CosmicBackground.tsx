import { useEffect, useMemo, useRef, useState } from 'react';

type Node = { x: number; y: number; r: number; delay: number };

function generateNodes(count: number): Node[] {
  const arr: Node[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 1 + Math.random() * 2.2,
      delay: Math.random() * 5,
    });
  }
  return arr;
}

function generateEdges(nodes: Node[], maxDist = 18) {
  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxDist) {
        edges.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          key: `${i}-${j}`,
        });
      }
    }
  }
  return edges;
}

type Particle = {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

const CosmicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const nodeCount = isMobile ? 24 : 50;
  const starsCount = isMobile ? 120 : 320;
  const glowCount = isMobile ? 30 : 80;

  const nodes = useMemo(() => generateNodes(nodeCount), [nodeCount]);
  const edges = useMemo(() => generateEdges(nodes, 22), [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const stars: Particle[] = Array.from({ length: starsCount }).map(() => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vy: 0.05 + Math.random() * 0.15,
      size: 0.4 + Math.random() * 0.9,
      color: '#ffffff',
      alpha: 0.3 + Math.random() * 0.6,
    }));

    const glows: Particle[] = Array.from({ length: glowCount }).map(() => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vy: 0.2 + Math.random() * 0.5,
      size: 1.2 + Math.random() * 2.2,
      color: Math.random() > 0.5 ? '#3B82F6' : '#8B5CF6',
      alpha: 0.4 + Math.random() * 0.5,
    }));

    let lastResize = 0;
    const onResize = () => {
      const now = Date.now();
      if (now - lastResize < 200) return;
      lastResize = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    };
    window.addEventListener('resize', onResize);

    const tick = () => {
      ctx.clearRect(0, 0, w(), h());

      for (const s of stars) {
        s.y -= s.vy;
        if (s.y < -2) {
          s.y = h() + 2;
          s.x = Math.random() * w();
        }
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const g of glows) {
        g.y -= g.vy;
        if (g.y < -4) {
          g.y = h() + 4;
          g.x = Math.random() * w();
        }
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size * 4);
        grad.addColorStop(0, g.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = g.alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.min(1, g.alpha + 0.2);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    if (!reduced) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.globalAlpha = 0.6;
      for (const s of stars) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [reduced, starsCount, glowCount]);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      tx = (e.clientX / w - 0.5) * 14;
      ty = (e.clientY / h - 0.5) * 14;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      wrap.style.setProperty('--cx', `${cx}px`);
      wrap.style.setProperty('--cy', `${cy}px`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="cosmic-bg"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0A0E27',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 25% 20%, rgba(59,130,246,0.22) 0%, rgba(10,14,39,0) 55%), radial-gradient(ellipse at 80% 75%, rgba(139,92,246,0.20) 0%, rgba(10,14,39,0) 60%), radial-gradient(ellipse at 50% 110%, rgba(168,85,247,0.18) 0%, rgba(10,14,39,0) 55%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.22) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          maskImage:
            'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
          transform: 'translate3d(var(--cx, 0px), var(--cy, 0px), 0)',
          transition: 'transform 0.1s linear',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.55,
          transform:
            'translate3d(calc(var(--cx, 0px) * 1.5), calc(var(--cy, 0px) * 1.5), 0)',
          transition: 'transform 0.1s linear',
        }}
      >
        <defs>
          <radialGradient id="cosmicNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {edges.map((e) => (
          <line
            key={e.key}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="#8B5CF6"
            strokeWidth={0.06}
            opacity={0.32}
          >
            {!reduced && (
              <animate
                attributeName="opacity"
                values="0.18;0.55;0.18"
                dur="6s"
                repeatCount="indefinite"
              />
            )}
          </line>
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * 1.6}
              fill="url(#cosmicNodeGlow)"
              opacity={0.45}
            >
              {!reduced && (
                <animate
                  attributeName="opacity"
                  values="0.15;0.6;0.15"
                  dur={`${3 + (i % 5)}s`}
                  begin={`${n.delay}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle cx={n.x} cy={n.y} r={n.r * 0.4} fill="#93C5FD">
              {!reduced && (
                <animate
                  attributeName="r"
                  values={`${n.r * 0.3};${n.r * 0.55};${n.r * 0.3}`}
                  dur={`${3 + (i % 4)}s`}
                  begin={`${n.delay}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        ))}
      </svg>

      <svg
        viewBox="-50 -50 100 100"
        style={{
          position: 'absolute',
          left: '-15%',
          top: '5%',
          width: '60vmin',
          height: '60vmin',
          opacity: 0.12,
          transform:
            'translate3d(calc(var(--cx, 0px) * 0.4), calc(var(--cy, 0px) * 0.4), 0)',
          transition: 'transform 0.1s linear',
        }}
      >
        <g fill="none" stroke="#8B5CF6" strokeWidth="0.4">
          <ellipse cx="0" cy="0" rx="40" ry="14" />
          <ellipse cx="0" cy="0" rx="40" ry="14" transform="rotate(60)" />
          <ellipse cx="0" cy="0" rx="40" ry="14" transform="rotate(120)" />
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="80s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </svg>

      <svg
        viewBox="-50 -50 100 100"
        style={{
          position: 'absolute',
          right: '-20%',
          bottom: '0%',
          width: '70vmin',
          height: '70vmin',
          opacity: 0.1,
          transform:
            'translate3d(calc(var(--cx, 0px) * -0.5), calc(var(--cy, 0px) * -0.5), 0)',
          transition: 'transform 0.1s linear',
        }}
      >
        <g fill="none" stroke="#3B82F6" strokeWidth="0.4">
          <ellipse cx="0" cy="0" rx="42" ry="12" />
          <ellipse cx="0" cy="0" rx="42" ry="12" transform="rotate(45)" />
          <ellipse cx="0" cy="0" rx="42" ry="12" transform="rotate(90)" />
          <ellipse cx="0" cy="0" rx="42" ry="12" transform="rotate(135)" />
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360"
              to="0"
              dur="120s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </svg>

      <svg
        viewBox="-50 -50 100 100"
        style={{
          position: 'absolute',
          left: '40%',
          top: '60%',
          width: '40vmin',
          height: '40vmin',
          opacity: 0.08,
          transform:
            'translate3d(calc(var(--cx, 0px) * 0.7), calc(var(--cy, 0px) * 0.7), 0)',
          transition: 'transform 0.1s linear',
        }}
      >
        <g fill="none" stroke="#A855F7" strokeWidth="0.5">
          <ellipse cx="0" cy="0" rx="38" ry="16" />
          <ellipse cx="0" cy="0" rx="38" ry="16" transform="rotate(72)" />
          <ellipse cx="0" cy="0" rx="38" ry="16" transform="rotate(144)" />
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="-360"
              dur="100s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </svg>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(10,14,39,0.55) 100%)',
        }}
      />
    </div>
  );
};

export default CosmicBackground;