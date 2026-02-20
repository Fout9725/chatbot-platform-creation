import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Bot } from './types';

interface BotCardProps {
  bot: Bot;
  onBuy: (id: number) => void;
  onRent: (id: number) => void;
  onDetails: (id: number) => void;
  onTest: (id: number) => void;
}

export default function BotCard({ bot, onBuy, onRent, onDetails, onTest }: BotCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 overflow-hidden relative flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardHeader className="relative flex-shrink-0 p-3 md:p-6">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-2 md:p-3 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
              <Icon name={bot.icon as string} fallback="Bot" className="text-primary" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm md:text-lg line-clamp-1">{bot.name}</CardTitle>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] md:text-xs flex-shrink-0">{bot.category}</Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-2 md:space-y-3 flex-1 flex flex-col p-3 pt-0 md:p-6 md:pt-0">
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 leading-snug flex-shrink-0">
          {bot.description}
        </p>
        <div className="flex items-center justify-between text-xs md:text-sm flex-shrink-0">
          <div className="flex items-center gap-1">
            <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{bot.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icon name="Users" size={14} />
            <span>{bot.users.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 md:gap-1.5 min-h-[1.75rem] md:min-h-[2rem] content-start flex-shrink-0">
          {bot.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-[10px] md:text-xs h-fit py-0.5 md:py-1">
              {feature}
            </Badge>
          ))}
        </div>

        <div className="pt-2 border-t mt-auto">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Покупка</p>
              <p className="text-base md:text-xl font-bold text-primary">
                {bot.price.toLocaleString()} ₽
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] md:text-xs text-muted-foreground">Аренда/мес</p>
              <p className="text-sm md:text-lg font-semibold text-secondary">
                {bot.rentPrice.toLocaleString()} ₽
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative gap-1.5 md:gap-2 flex-col flex-shrink-0 p-3 pt-0 md:p-6 md:pt-0">
        <div className="flex gap-1.5 md:gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 group/btn text-xs md:text-sm h-8 md:h-9"
            onClick={() => onDetails(bot.id)}
          >
            <Icon name="Info" size={14} className="mr-1" />
            Подробнее
          </Button>
          {bot.demoUrl ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 group/btn text-xs md:text-sm h-8 md:h-9"
              onClick={() => window.location.href = bot.demoUrl!}
            >
              <Icon name="Rocket" size={14} className="mr-1" />
              Попробовать
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 group/btn text-xs md:text-sm h-8 md:h-9"
              onClick={() => onTest(bot.id)}
            >
              <Icon name="PlayCircle" size={14} className="mr-1" />
              Тест 3 дня
            </Button>
          )}
        </div>
        <div className="flex gap-1.5 md:gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1 group/btn text-xs md:text-sm h-8 md:h-9"
            size="sm"
            onClick={() => onRent(bot.id)}
          >
            <Icon name="Clock" size={14} className="mr-1 group-hover/btn:rotate-12 transition-transform" />
            Аренда
          </Button>
          <Button
            type="button"
            className="flex-1 group/btn bg-gradient-to-r from-primary to-secondary text-xs md:text-sm h-8 md:h-9"
            size="sm"
            onClick={() => onBuy(bot.id)}
          >
            <Icon name="ShoppingCart" size={14} className="mr-1 group-hover/btn:scale-110 transition-transform" />
            Купить
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
