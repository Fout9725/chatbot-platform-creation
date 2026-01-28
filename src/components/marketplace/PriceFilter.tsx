import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PriceFilterProps {
  maxPrice: number;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

export default function PriceFilter({ maxPrice, priceRange, onPriceChange }: PriceFilterProps) {
  const handleMinChange = (value: string) => {
    const num = parseInt(value) || 0;
    onPriceChange([Math.min(num, priceRange[1]), priceRange[1]]);
  };

  const handleMaxChange = (value: string) => {
    const num = parseInt(value) || maxPrice;
    onPriceChange([priceRange[0], Math.max(num, priceRange[0])]);
  };

  return (
    <Card className="p-4 space-y-3">
      <Label className="text-sm font-semibold">Цена покупки</Label>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">От</Label>
            <Input
              type="number"
              min={0}
              max={priceRange[1]}
              value={priceRange[0]}
              onChange={(e) => {
                console.log('Min price changed:', e.target.value);
                handleMinChange(e.target.value);
              }}
              className="h-9 cursor-text"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">До</Label>
            <Input
              type="number"
              min={priceRange[0]}
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => {
                console.log('Max price changed:', e.target.value);
                handleMaxChange(e.target.value);
              }}
              className="h-9 cursor-text"
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {priceRange[0].toLocaleString()} ₽ — {priceRange[1].toLocaleString()} ₽
        </div>
      </div>
    </Card>
  );
}