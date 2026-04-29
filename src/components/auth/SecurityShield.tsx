import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';

const SecurityShield = () => {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center pointer-events-none"
      style={{ minHeight: 360 }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute"
        style={{
          width: 340,
          height: 340,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          border: '1px dashed rgba(16,185,129,0.4)',
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          border: '1px dashed rgba(99,102,241,0.3)',
        }}
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full"
        style={{ width: 320, height: 320 }}
      >
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{
            background: '#10B981',
            boxShadow: '0 0 16px #10B981',
          }}
        />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full"
        style={{ width: 380, height: 380 }}
      >
        <span
          aria-hidden
          className="absolute top-0 -left-1 w-2 h-2 rounded-full"
          style={{
            background: '#6366F1',
            boxShadow: '0 0 12px #6366F1',
          }}
        />
      </motion.div>

      <motion.div
        animate={{
          rotate: [0, 12, -12, 0],
          y: [0, -6, 0],
        }}
        transition={{
          rotate: {
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          y: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className="relative"
        style={{ width: 200, height: 220 }}
      >
        <svg viewBox="0 0 200 220" className="w-full h-full">
          <defs>
            <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16,185,129,0.55)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.4)" />
            </linearGradient>
            <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <filter id="shieldGlow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M100 12 L180 40 L180 110 Q180 170 100 208 Q20 170 20 110 L20 40 Z"
            fill="url(#shieldFill)"
            stroke="url(#shieldStroke)"
            strokeWidth="2"
            filter="url(#shieldGlow)"
          />

          <path
            d="M100 12 L180 40 L180 110 Q180 170 100 208 Q20 170 20 110 L20 40 Z"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />

          <g
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            fill="none"
          >
            <path d="M70 100 L90 122 L132 78" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <g fill="rgba(255,255,255,0.65)">
            <circle cx="55" cy="60" r="1.5" />
            <circle cx="145" cy="60" r="1.5" />
            <circle cx="55" cy="140" r="1.5" />
            <circle cx="145" cy="140" r="1.5" />
            <circle cx="100" cy="40" r="1.5" />
            <circle cx="100" cy="180" r="1.5" />
          </g>
        </svg>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-2 flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Icon name="ShieldCheck" size={14} className="text-emerald-300" />
        <span className="text-xs font-semibold text-emerald-200">
          Защищённое соединение
        </span>
      </motion.div>
    </div>
  );
};

export default SecurityShield;
