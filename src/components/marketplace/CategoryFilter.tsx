import { Button } from '@/components/ui/button';
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
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => {
        const count = getCategoryCount(category);
        return (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            className={`transition-all text-xs md:text-sm active:scale-95 cursor-pointer ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md'
                : 'hover:bg-accent hover:border-primary/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Category clicked:', category);
              onCategoryChange(category);
            }}
            type="button"
          >
            {category} <span className="ml-1.5 opacity-70">({count})</span>
          </Button>
        );
      })}
    </div>
  );
}