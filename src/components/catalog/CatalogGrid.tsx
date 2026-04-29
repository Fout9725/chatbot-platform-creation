import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Bot } from '@/components/marketplace/types';
import CatalogCard from './CatalogCard';

interface CatalogGridProps {
  filteredBots: Bot[];
  flippedId: number | null;
  setFlippedId: (id: number | null) => void;
  handleTest: (id: number) => void;
  resetFilters: () => void;
  isMobile?: boolean;
}

const CatalogGrid = ({
  filteredBots,
  flippedId,
  setFlippedId,
  handleTest,
  resetFilters,
}: CatalogGridProps) => {
  return (
    <section className="relative pb-20 md:pb-28">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-400">
            Найдено{' '}
            <span className="text-white font-semibold">
              {filteredBots.length}
            </span>{' '}
            ботов
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 items-stretch">
          <AnimatePresence mode="popLayout">
            {filteredBots.map((bot, idx) => (
              <motion.div
                key={bot.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(idx * 0.02, 0.3),
                }}
                className="h-full"
              >
                <CatalogCard
                  bot={bot}
                  flipped={flippedId === bot.id}
                  onFlip={() =>
                    setFlippedId(flippedId === bot.id ? null : bot.id)
                  }
                  onTest={handleTest}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredBots.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}
            >
              <Icon name="SearchX" size={28} className="text-violet-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Ничего не нашли
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Попробуйте изменить фильтры или сбросить их
            </p>
            <Button
              onClick={resetFilters}
              className="text-white border-0"
              style={{
                background:
                  'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              }}
            >
              Сбросить фильтры
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CatalogGrid;