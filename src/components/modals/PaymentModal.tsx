import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AI_MODELS } from '@/config/aiModels';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PAYMENT_API = 'https://functions.poehali.dev/b41b8133-a3ad-4896-bda6-2b5ffa2bdeb3';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  botName: string;
  botId: number;
  mode: 'buy' | 'rent';
  price: number;
}

export default function PaymentModal({ isOpen, onClose, botName, botId, mode, price }: PaymentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-exp:free');
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
      const response = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount: price,
          description: `${botName} (${mode === 'buy' ? 'Покупка' : 'Аренда'})`,
          email,
          return_url: `${window.location.origin}/dashboard?payment=success&bot_id=${botId}&bot_name=${encodeURIComponent(botName)}`,
          metadata: {
            user_id: user?.id || '',
            bot_id: String(botId),
            bot_name: botName,
            type: 'bot',
            purchase_mode: mode,
            ai_model: selectedModel
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
      setProcessing(false);
      toast({
        title: 'Ошибка оплаты',
        description: error instanceof Error ? error.message : 'Попробуйте позже',
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

        <Alert className="bg-blue-50 border-blue-200">
          <Icon name="Shield" size={16} className="text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Безопасная оплата через ЮKassa. Мы не храним данные вашей карты.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Сумма к оплате</Label>
            <div className="text-3xl font-bold text-primary">
              {price.toLocaleString()} ₽
              {mode === 'rent' && <span className="text-sm text-muted-foreground ml-2">/мес</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email для чека *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model">Выберите AI модель</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Бесплатные модели</div>
                {AI_MODELS.filter(m => m.free && m.type === 'text').map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Free</Badge>
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Платные модели</div>
                {AI_MODELS.filter(m => !m.free && m.type === 'text').map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Paid</Badge>
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel && (
              <p className="text-xs text-muted-foreground">
                {AI_MODELS.find(m => m.id === selectedModel)?.description}
              </p>
            )}
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
                <Icon name="CreditCard" size={16} className="mr-2" />
                Оплатить {price.toLocaleString()} ₽
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Оплата обрабатывается через ЮKassa. Ваши данные в безопасности.
        </p>
      </DialogContent>
    </Dialog>
  );
}