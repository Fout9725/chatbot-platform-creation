import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useActiveBots } from '@/contexts/ActiveBotsContext';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  botName: string;
  botId: number;
  mode: 'buy' | 'rent';
  price: number;
}

export default function PaymentModal({ isOpen, onClose, botName, botId, mode, price }: PaymentModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activateBot } = useActiveBots();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: 'Ошибка',
        description: 'Укажите email для получения чека',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const paymentUrl = `https://intellectpro.pay.prodamus.ru/pl/pay`;
      const params = new URLSearchParams({
        products: `${botName} (${mode === 'buy' ? 'Покупка' : 'Аренда'})`,
        order_sum: price.toString(),
        customer_email: email,
        customer_extra: JSON.stringify({
          user_id: user?.id || '',
          bot_id: botId,
          bot_name: botName,
          purchase_mode: mode
        }),
        urlReturn: `${window.location.origin}/dashboard?payment=success&bot_id=${botId}&bot_name=${encodeURIComponent(botName)}`,
        urlNotification: `https://functions.poehali.dev/1ea69390-f6ab-40d3-9797-8c2171d272b4`
      });
      
      window.location.href = `${paymentUrl}?${params.toString()}`;
    } catch (error: any) {
      setProcessing(false);
      toast({
        title: 'Ошибка оплаты',
        description: error.message || 'Попробуйте позже',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="CreditCard" size={24} />
            {mode === 'buy' ? 'Покупка бота' : 'Аренда бота'}
          </DialogTitle>
          <DialogDescription>
            {botName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Сумма к оплате</Label>
            <div className="text-3xl font-bold text-primary">
              {price.toLocaleString()} ₽
              {mode === 'rent' && <span className="text-sm text-muted-foreground ml-2">/мес</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email для чека</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Способ оплаты</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Icon name="CreditCard" size={20} />
                  Банковская карта
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="yoomoney" id="yoomoney" />
                <Label htmlFor="yoomoney" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Icon name="Wallet" size={20} />
                  ЮMoney
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="sbp" id="sbp" />
                <Label htmlFor="sbp" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Icon name="Smartphone" size={20} />
                  Система быстрых платежей
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={!email || processing}
            className="flex-1"
          >
            {processing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="Lock" size={16} className="mr-2" />
                Оплатить {price.toLocaleString()} ₽
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Защищённая оплата через ЮКасса. Ваши данные в безопасности.
        </p>
      </DialogContent>
    </Dialog>
  );
}