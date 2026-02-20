import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Bot } from '../marketplace/types';
import { getBotDetails } from '../marketplace/botDescriptions';

interface BotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot?: Bot;
}

export default function BotDetailsModal({ isOpen, onClose, bot }: BotDetailsModalProps) {
  if (!bot) return null;

  const details = getBotDetails(bot.id);
  const fullDescription = bot.fullDescription || details.fullDescription;
  const functionality = bot.functionality || details.functionality;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] md:max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 flex-shrink-0 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-2.5 md:p-3 rounded-xl flex-shrink-0">
              <Icon name={bot.icon as string} fallback="Bot" className="text-primary" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg md:text-2xl leading-tight">{bot.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">{bot.category}</Badge>
                <div className="flex items-center gap-1">
                  <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">{bot.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Users" size={14} />
                  <span className="text-sm">{bot.users.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 space-y-5">
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
              <Icon name="FileText" size={18} className="text-primary flex-shrink-0" />
              О боте
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {bot.description} {fullDescription}
            </p>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
              <Icon name="Zap" size={18} className="text-primary flex-shrink-0" />
              Возможности
            </h3>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {bot.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs md:text-sm py-1 md:py-1.5">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
              <Icon name="ListChecks" size={18} className="text-primary flex-shrink-0" />
              Функционал
            </h3>
            <ul className="space-y-1.5 md:space-y-2">
              {functionality.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                  <Icon name="CheckCircle2" size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-shrink-0 border-t bg-background px-4 py-3 md:px-6 md:py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Покупка</p>
              <p className="text-lg md:text-xl font-bold text-primary">
                {bot.price.toLocaleString()} ₽
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Аренда/мес</p>
              <p className="text-lg md:text-xl font-bold text-secondary">
                {bot.rentPrice.toLocaleString()} ₽
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1" size="sm">
              Закрыть
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <Icon name="Clock" size={14} className="mr-1.5" />
              Аренда
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-secondary" size="sm">
              <Icon name="ShoppingCart" size={14} className="mr-1.5" />
              Купить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
