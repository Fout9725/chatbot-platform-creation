import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative mb-6 z-10">
      <Icon
        name="Search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        size={18}
      />
      <Input
        type="text"
        placeholder="Поиск по названию и описанию..."
        className="pl-10 pr-10 h-11 md:h-12 text-sm md:text-base"
        value={searchQuery}
        onChange={(e) => {
          console.log('Search input changed:', e.target.value);
          onSearchChange(e.target.value);
        }}
      />
      {searchQuery && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clear search clicked');
            onSearchChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
          aria-label="Очистить поиск"
          type="button"
        >
          <Icon name="X" size={18} />
        </button>
      )}
    </div>
  );
}