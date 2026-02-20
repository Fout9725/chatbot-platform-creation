import { mockBots } from './mockBots';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const getCategoryCount = (category: string) => {
    if (category === 'Все') return mockBots.length;
    return mockBots.filter(bot => bot.category === category).length;
  };

  return (
    <div className="flex gap-2 mb-6 relative z-50 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin" style={{ pointerEvents: 'auto' }}>
      {categories.map((category) => {
        const count = getCategoryCount(category);
        return (
          <button
            key={category}
            className={`min-h-[40px] md:min-h-[52px] px-3 md:px-5 text-sm md:text-base font-semibold rounded-md border-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md text-white border-transparent'
                : 'hover:bg-accent hover:border-primary/50 border-border bg-background'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCategoryChange(category);
            }}
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            {category} <span className="ml-1 opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
