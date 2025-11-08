import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');

  const handleSendCode = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Mock reset code: ${mockCode}`);
      
      setEmailSent(true);
      setStep('code');
      setIsLoading(false);
      
      toast({
        title: 'Код отправлен! 📧',
        description: `Проверьте почту ${email}. Код действителен 15 минут.`,
      });
    }, 1500);
  };

  const handleVerifyCode = () => {
    if (!resetCode || resetCode.length !== 6) {
      toast({
        title: 'Ошибка',
        description: 'Введите 6-значный код из письма',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setStep('password');
      setIsLoading(false);
      toast({
        title: 'Код подтверждён ✅',
        description: 'Теперь создайте новый пароль',
      });
    }, 1000);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен содержать минимум 8 символов',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Пароль изменён! 🎉',
        description: 'Теперь вы можете войти с новым паролем',
      });
      
      setEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('email');
      setEmailSent(false);
      onClose();
    }, 1500);
  };

  const handleResendCode = () => {
    handleSendCode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="KeyRound" size={24} />
            Восстановление пароля
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Введите email для получения кода восстановления'}
            {step === 'code' && 'Введите код из письма'}
            {step === 'password' && 'Создайте новый пароль'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {step === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    Мы отправим 6-значный код на вашу почту. Код будет действителен 15 минут.
                  </p>
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleSendCode} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Mail" size={16} className="mr-2" />
                    Отправить код
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reset-code">Код из письма</Label>
                <Input
                  id="reset-code"
                  type="text"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-900">
                    Код отправлен на {email}
                  </p>
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleVerifyCode} 
                className="w-full"
                disabled={isLoading || resetCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={16} className="mr-2" />
                    Подтвердить код
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                className="w-full text-sm"
                disabled={isLoading}
              >
                Отправить код повторно
              </Button>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon name="Shield" size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-900">
                    <p className="font-semibold mb-1">Надёжный пароль содержит:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Минимум 8 символов</li>
                      <li>Заглавные и строчные буквы</li>
                      <li>Цифры и спецсимволы</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleResetPassword} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить новый пароль
                  </>
                )}
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
