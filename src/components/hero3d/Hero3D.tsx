import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Node = { x: number; y: number; r: number; delay: number };

function generateNodes(count: number): Node[] {
  const arr: Node[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 4,
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
          x1: nodes[i].x, y1: nodes[i].y,
          x2: nodes[j].x, y2: nodes[j].y,
          key: `${i}-${j}`,
        });
      }
    }
  }
  return edges;
}

function generateParticles(count: number) {
  return Array.from({ length: count }).map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: 0.3 + Math.random() * 0.6,
  }));
}

export default function Hero3D() {
  const nodes = useMemo(() => generateNodes(40), []);
  const edges = useMemo(() => generateEdges(nodes, 22), [nodes]);
  const particles = useMemo(() => generateParticles(80), []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '92vh',
        background: 'transparent',
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {edges.map((e) => (
          <line
            key={e.key}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#8B5CF6"
            strokeWidth={0.08}
            opacity={0.35}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r * 1.6} fill="url(#nodeGlow)" opacity={0.5}>
              <animate
                attributeName="opacity"
                values="0.2;0.7;0.2"
                dur={`${3 + (i % 5)}s`}
                begin={`${n.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={n.x} cy={n.y} r={n.r * 0.4} fill="#93C5FD">
              <animate
                attributeName="r"
                values={`${n.r * 0.3};${n.r * 0.5};${n.r * 0.3}`}
                dur={`${3 + (i % 4)}s`}
                begin={`${n.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: i % 6 === 0 ? '#3B82F6' : '#ffffff',
              opacity: p.opacity,
              boxShadow: i % 6 === 0 ? '0 0 6px #3B82F6' : '0 0 4px rgba(255,255,255,0.6)',
              animation: `heroFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes heroFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-120vh) translateX(20px); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center px-4 pt-16">
        <div className="max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(139,92,246,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span className="text-xs uppercase tracking-widest text-indigo-200">
              ИИ-боты для бизнеса
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #93C5FD 50%, #C4B5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Платформа<br />
            умных чат-ботов
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base md:text-lg text-slate-300/90 max-w-2xl mx-auto mb-10"
          >
            Аренда и создание ИИ-ботов для Telegram, WhatsApp и VK. Автоматизируйте продажи,
            поддержку и маркетинг — без программистов.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/bot-builder">
              <Button
                size="lg"
                className="text-white border-0 px-8 h-12 shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-shadow"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                }}
              >
                <Icon name="Sparkles" size={18} className="mr-2" />
                Создать своего бота
              </Button>
            </Link>
            <Link to="/catalog">
              <Button
                size="lg"
                variant="ghost"
                className="text-white h-12 px-8"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                Каталог ботов
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-14 flex items-center justify-center gap-6 text-slate-400 text-xs flex-wrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Zap" size={14} className="text-indigo-400" />
              Запуск за 5 минут
            </span>
            <span className="w-px h-3 bg-slate-700" />
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Shield" size={14} className="text-purple-400" />
              Без программистов
            </span>
            <span className="w-px h-3 bg-slate-700 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Icon name="MessageCircle" size={14} className="text-indigo-400" />
              Telegram · WhatsApp · VK
            </span>
          </motion.div>
        </div>
      </div>

    </section>
  );
}