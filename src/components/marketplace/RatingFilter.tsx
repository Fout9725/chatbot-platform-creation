import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface RatingFilterProps {
  minRating: number;
  onRatingChange: (rating: number) => void;
}

const ratings = [0, 3, 4, 4.5];

export default function RatingFilter({ minRating, onRatingChange }: RatingFilterProps) {
  return (
    <Card className="p-4 space-y-3" style={{ pointerEvents: 'auto' }}>
      <Label className="text-sm font-semibold">Минимальный рейтинг</Label>
      <div className="flex flex-wrap gap-2">
        {ratings.map((rating) => (
          <Badge
            key={rating}
            variant={minRating === rating ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              minRating === rating
                ? 'bg-gradient-to-r from-primary to-secondary'
                : 'hover:bg-accent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Rating clicked:', rating);
              onRatingChange(rating);
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <Icon name="Star" size={14} className={minRating === rating ? 'fill-white' : 'fill-yellow-500'} />
            <span className="ml-1">{rating === 0 ? 'Все' : `${rating}+`}</span>
          </Badge>
        ))}
      </div>
    </Card>
  );
}