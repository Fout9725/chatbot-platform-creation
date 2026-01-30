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
    <div className="flex flex-wrap gap-2 mb-6 relative z-50" style={{ pointerEvents: 'auto' }}>
      {categories.map((category) => {
        const count = getCategoryCount(category);
        return (
          <button
            key={category}
            className={`min-h-[60px] px-6 text-lg font-bold rounded-md border-2 transition-all cursor-pointer ${
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
            {category} <span className="ml-1.5 opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}