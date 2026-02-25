import { Card, CardContent } from '@/components/ui/card';
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

export default function BotCard({ bot, onDetails, onTest }: BotCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-violet-300 overflow-hidden flex flex-col h-full bg-white">
      <CardContent className="p-5 md:p-6 flex flex-col h-full gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-violet-50 p-2.5 rounded-xl flex-shrink-0 group-hover:bg-violet-100 transition-colors">
            <Icon name={bot.icon as string} fallback="Bot" className="text-violet-600" size={22} />
          </div>
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{bot.name}</h3>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-violet-600 font-medium">{bot.category}</span>
          <span className="text-gray-300">&bull;</span>
          <div className="flex items-center gap-0.5">
            <Icon name="Star" size={13} className="text-amber-400 fill-amber-400" />
            <span className="font-medium text-gray-700">{bot.rating}</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
          {bot.description}
        </p>

        <p className="text-lg font-bold text-gray-900">
          от {bot.rentPrice.toLocaleString()} ₽<span className="text-sm font-normal text-gray-400">/мес</span>
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white h-10 text-sm font-medium"
            onClick={() => {
              if (bot.demoUrl) {
                window.location.href = bot.demoUrl;
              } else {
                onTest(bot.id);
              }
            }}
          >
            <Icon name="PlayCircle" size={16} className="mr-1.5" />
            Попробовать бесплатно
          </Button>
          <button
            type="button"
            onClick={() => onDetails(bot.id)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center justify-center gap-1 py-1 transition-colors"
          >
            Подробнее
            <Icon name="ArrowRight" size={14} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
