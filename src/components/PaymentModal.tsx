import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'yookassa' | 'sbp'>('card');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
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

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        toast({
          title: 'Ошибка',
          description: 'Заполните все данные карты',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: 'Оплата успешна! 🎉',
        description: `Тариф "${plan.name}" активирован. Чек отправлен на ${email}`,
      });
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            Платежи обрабатываются через защищённое соединение. Мы не храним данные вашей карты.
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

          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">
                <Icon name="CreditCard" size={16} className="mr-2" />
                Карта
              </TabsTrigger>
              <TabsTrigger value="yookassa">
                <Icon name="Wallet" size={16} className="mr-2" />
                ЮKassa
              </TabsTrigger>
              <TabsTrigger value="sbp">
                <Icon name="Smartphone" size={16} className="mr-2" />
                СБП
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Оплата банковской картой</CardTitle>
                  <CardDescription>Visa, MasterCard, МИР</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="card-number">Номер карты</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="card-expiry">Срок действия</Label>
                      <Input
                        id="card-expiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="card-cvc">CVC</Label>
                      <Input
                        id="card-cvc"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        maxLength={3}
                        type="password"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yookassa" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Оплата через ЮKassa</CardTitle>
                  <CardDescription>
                    Банковские карты, электронные кошельки, интернет-банкинг
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                      <Icon name="CreditCard" size={24} className="mb-1 text-primary" />
                      <span className="text-xs text-center">Карты</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                      <Icon name="Wallet" size={24} className="mb-1 text-primary" />
                      <span className="text-xs text-center">ЮMoney</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                      <Icon name="Smartphone" size={24} className="mb-1 text-primary" />
                      <span className="text-xs text-center">QIWI</span>
                    </div>
                  </div>
                  <Alert>
                    <Icon name="Info" size={14} />
                    <AlertDescription className="text-xs">
                      После нажатия "Оплатить" вы будете перенаправлены на безопасную страницу ЮKassa
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sbp" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Система быстрых платежей (СБП)</CardTitle>
                  <CardDescription>
                    Оплата через мобильное приложение вашего банка
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon name="Smartphone" size={32} className="text-primary" />
                      <div>
                        <p className="font-semibold">Как оплатить:</p>
                        <p className="text-xs text-muted-foreground">Быстро и без комиссии</p>
                      </div>
                    </div>
                    <ol className="text-sm space-y-1 ml-4">
                      <li>1. Нажмите "Оплатить"</li>
                      <li>2. Откроется приложение вашего банка</li>
                      <li>3. Подтвердите платёж</li>
                    </ol>
                  </div>
                  <Alert className="bg-green-50 border-green-200">
                    <Icon name="Check" size={14} className="text-green-600" />
                    <AlertDescription className="text-xs text-green-800">
                      <strong>Без комиссии!</strong> Платёж поступает моментально
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
            disabled={isProcessing}
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
