import { Badge } from '@/components/ui/badge';
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
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className={`cursor-pointer transition-all text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 select-none active:scale-95 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md'
                : 'hover:bg-accent hover:border-primary/50'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onCategoryChange(category);
            }}
          >
            {category} <span className="ml-1.5 opacity-70">({count})</span>
          </Badge>
        );
      })}
    </div>
  );
}