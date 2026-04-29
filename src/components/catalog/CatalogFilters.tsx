import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { categories } from '@/components/marketplace/types';
import { CATEGORY_COLORS, PRICE_CHIPS, RATING_CHIPS } from './CatalogConstants';

interface CatalogFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  priceMax: number | null;
  setPriceMax: (v: number | null) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  hasFilters: boolean;
  resetFilters: () => void;
  categoryCounts: Record<string, number>;
}

const CatalogFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  priceMax,
  setPriceMax,
  minRating,
  setMinRating,
  hasFilters,
  resetFilters,
  categoryCounts,
}: CatalogFiltersProps) => {
  return (
    <section className="relative pb-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-3xl p-5 md:p-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow:
              '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex-1 flex items-center gap-3 px-4 h-12 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Icon name="Search" size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white"
                  aria-label="Очистить"
                >
                  <Icon name="X" size={16} />
                </button>
              )}
            </div>
            {hasFilters && (
              <Button
                onClick={resetFilters}
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/10 h-12"
              >
                <Icon name="RotateCcw" size={14} className="mr-1.5" />
                Сброс
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              const accent = CATEGORY_COLORS[cat] || '#8B5CF6';
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`
                      : 'rgba(255,255,255,0.05)',
                    border: active
                      ? `1px solid ${accent}`
                      : '1px solid rgba(255,255,255,0.1)',
                    color: active ? '#fff' : '#cbd5e1',
                    boxShadow: active ? `0 6px 20px -6px ${accent}99` : 'none',
                  }}
                >
                  {cat}
                  {categoryCounts[cat] !== undefined && (
                    <span
                      className="ml-1.5 text-xs"
                      style={{
                        opacity: active ? 0.85 : 0.6,
                      }}
                    >
                      {categoryCounts[cat]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Цена:</span>
            {PRICE_CHIPS.map((chip) => {
              const active = priceMax === chip.max;
              return (
                <button
                  key={chip.max}
                  type="button"
                  onClick={() => setPriceMax(active ? null : chip.max)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: active
                      ? 'rgba(34,197,94,0.18)'
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? '1px solid rgba(34,197,94,0.6)'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: active ? '#86EFAC' : '#cbd5e1',
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
            <span className="text-xs text-slate-400 ml-3 mr-1">Рейтинг:</span>
            {RATING_CHIPS.map((r) => {
              const active = minRating === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(active ? 0 : r)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1"
                  style={{
                    background: active
                      ? 'rgba(251,191,36,0.18)'
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? '1px solid rgba(251,191,36,0.6)'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: active ? '#FCD34D' : '#cbd5e1',
                  }}
                >
                  <Icon name="Star" size={10} />
                  {r}+
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CatalogFilters;
