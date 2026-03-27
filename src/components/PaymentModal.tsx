import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PAYMENT_API = 'https://functions.poehali.dev/b41b8133-a3ad-4896-bda6-2b5ffa2bdeb3';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    period: string;
  };
}

export default function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: 'Ошибка',
        description: 'Укажите email для получения чека',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount: plan.price,
          description: `Тариф "${plan.name}" — ${plan.period}`,
          email,
          return_url: `${window.location.origin}/dashboard?payment=success`,
          metadata: {
            user_id: user?.id || '',
            type: 'plan',
            plan_id: plan.id
          }
        })
      });

      const data = await response.json();

      if (data.success && data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        throw new Error(data.error || 'Не удалось создать платёж');
      }
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: 'Ошибка оплаты',
        description: error instanceof Error ? error.message : 'Попробуйте позже',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Оплата тарифа "{plan.name}"
          </DialogTitle>
          <DialogDescription>
            Стоимость: <strong className="text-primary text-lg">{plan.price}₽</strong> {plan.period}
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <Icon name="Shield" size={16} className="text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Безопасная оплата через ЮKassa. Мы не храним данные вашей карты.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email для чека *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Icon name="CreditCard" size={24} className="mb-1 text-primary" />
              <span className="text-xs text-center">Карты</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Icon name="Smartphone" size={24} className="mb-1 text-primary" />
              <span className="text-xs text-center">СБП</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Icon name="Apple" size={24} className="mb-1 text-primary" />
              <span className="text-xs text-center">Apple Pay</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Icon name="Wallet" size={24} className="mb-1 text-primary" />
              <span className="text-xs text-center">Google Pay</span>
            </div>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Тариф:</span>
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Период:</span>
                <span className="font-semibold">{plan.period}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Итого к оплате:</span>
                  <span className="text-2xl font-bold text-primary">{plan.price}₽</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={isProcessing || !email}
            onClick={handlePayment}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="CreditCard" size={16} className="mr-2" />
                Оплатить {plan.price}₽
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Нажимая "Оплатить", вы соглашаетесь с{' '}
          <a href="/docs/oferta" className="underline">публичной офертой</a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
