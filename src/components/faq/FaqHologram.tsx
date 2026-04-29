import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/icon';

interface FaqHologramProps {
  q: string;
  a: string;
  accent: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqHologram = ({
  q,
  a,
  accent,
  index,
  isOpen,
  onToggle,
}: FaqHologramProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        animate={{
          rotateX: isOpen ? 0 : -1.5,
          z: isOpen ? 50 : 0,
          scale: isOpen ? 1.005 : 1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: isOpen
            ? `linear-gradient(180deg, ${accent}1F 0%, ${accent}08 100%)`
            : 'rgba(255,255,255,0.04)',
          border: isOpen
            ? `1px solid ${accent}66`
            : '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isOpen
            ? `0 30px 80px -20px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.1)`
            : '0 10px 30px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isOpen ? 1 : 0,
            background: `radial-gradient(ellipse at 50% 0%, ${accent}33 0%, transparent 60%)`,
          }}
        />

        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isOpen ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${accent}AA 50%, transparent 100%)`,
          }}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="relative w-full flex items-center justify-between gap-4 px-5 md:px-7 py-5 text-left"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 transition-all"
              style={{
                background: accent,
                boxShadow: isOpen ? `0 0 12px ${accent}` : 'none',
                opacity: isOpen ? 1 : 0.4,
              }}
            />
            <span className="text-base md:text-lg font-medium text-white">
              {q}
            </span>
          </div>
          <span
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: isOpen
                ? `linear-gradient(135deg, ${accent} 0%, ${accent}AA 100%)`
                : 'rgba(255,255,255,0.05)',
              border: isOpen
                ? `1px solid ${accent}AA`
                : '1px solid rgba(255,255,255,0.12)',
              boxShadow: isOpen ? `0 0 24px ${accent}99` : 'none',
              transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <Icon
              name="Plus"
              size={16}
              className={isOpen ? 'text-white' : 'text-slate-300'}
            />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-5 md:px-7 pb-6 pl-12 md:pl-14">
                <div
                  className="h-px mb-4 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${accent}66 0%, transparent 100%)`,
                  }}
                />
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  {a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default FaqHologram;
