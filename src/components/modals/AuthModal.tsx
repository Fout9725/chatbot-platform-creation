import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleAuth = (method: string) => {
    toast({
      title: `Авторизация через ${method}`,
      description: 'Функция в разработке',
    });
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    try {
      await login(email, password);
      const savedUser = localStorage.getItem('user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      toast({ title: 'Добро пожаловать!', description: 'Вы успешно вошли в систему' });
      onClose();
      if (userData && userData.role === 'admin') navigate('/admin');
      else if (userData && userData.plan && userData.plan !== 'free') navigate('/dashboard');
      else navigate('/plan-selection');
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: error instanceof Error ? error.message : 'Неверный email или пароль',
        variant: 'destructive',
      });
    }
  };

  const handlePhoneAuth = () => {
    if (!phone) {
      toast({ title: 'Ошибка', description: 'Введите номер телефона', variant: 'destructive' });
      return;
    }
    toast({ title: 'SMS отправлено', description: `Код подтверждения отправлен на ${phone}` });
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен содержать минимум 8 символов',
        variant: 'destructive',
      });
      return;
    }
    try {
      await register(name, email, password);
      toast({ title: 'Регистрация успешна!', description: 'Выберите тарифный план для продолжения' });
      onClose();
      navigate('/plan-selection');
    } catch (error) {
      toast({
        title: 'Ошибка регистрации',
        description: error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
        variant: 'destructive',
      });
    }
  };

  const dialogStyle = {
    background:
      'linear-gradient(180deg, rgba(99,102,241,0.14) 0%, rgba(10,14,39,0.96) 100%)',
    border: '1px solid rgba(99,102,241,0.4)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    boxShadow:
      '0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
    color: '#e5e7eb',
  };

  const inputCls = 'glass-input';
  const labelCls = 'text-gray-200';
  const dividerInner = (text: string) => (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
        <span
          className="px-3 text-glass-muted"
          style={{ background: 'rgba(10,14,39,0.95)' }}
        >
          {text}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl" style={dialogStyle}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-2xl">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
                boxShadow: '0 0 24px rgba(139,92,246,0.4)',
              }}
            >
              <Icon name="User" size={20} className="text-white" />
            </div>
            <span className="text-glass-title font-extrabold">Вход в аккаунт</span>
          </DialogTitle>
          <DialogDescription className="text-glass-muted">
            Войдите или зарегистрируйтесь для продолжения
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-panel-subtle border border-white/10 bg-transparent p-1">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              Вход
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              Регистрация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 ${
                    authMethod === 'email' ? 'btn-glass-primary' : 'btn-glass-secondary'
                  }`}
                >
                  <Icon name="Mail" size={16} className="mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 ${
                    authMethod === 'phone' ? 'btn-glass-primary' : 'btn-glass-secondary'
                  }`}
                >
                  <Icon name="Smartphone" size={16} className="mr-2" />
                  Телефон
                </Button>
              </div>

              {authMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className={labelCls}>Логин или Email</Label>
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className={labelCls}>Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-phone" className={labelCls}>Номер телефона</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <p className="text-xs text-glass-muted">
                    Мы отправим SMS с кодом подтверждения
                  </p>
                </>
              )}

              <Button
                type="button"
                onClick={authMethod === 'email' ? handleEmailAuth : handlePhoneAuth}
                className="w-full btn-glass-primary"
              >
                <Icon name="LogIn" size={16} className="mr-2" />
                Войти
              </Button>

              {dividerInner('Или войти через')}

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => handleAuth('Google')} className="w-full btn-glass-secondary">
                  <Icon name="Chrome" size={20} />
                </Button>
                <Button onClick={() => handleAuth('Яндекс')} className="w-full btn-glass-secondary">
                  <span className="font-bold text-lg">Я</span>
                </Button>
                <Button onClick={() => handleAuth('VK')} className="w-full btn-glass-secondary">
                  <Icon name="MessageCircle" size={20} />
                </Button>
              </div>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-indigo-300 hover:text-indigo-200"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Забыли пароль?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className={labelCls}>Имя</Label>
                <Input
                  id="reg-name"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 ${
                    authMethod === 'email' ? 'btn-glass-primary' : 'btn-glass-secondary'
                  }`}
                >
                  <Icon name="Mail" size={16} className="mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 ${
                    authMethod === 'phone' ? 'btn-glass-primary' : 'btn-glass-secondary'
                  }`}
                >
                  <Icon name="Smartphone" size={16} className="mr-2" />
                  Телефон
                </Button>
              </div>

              {authMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className={labelCls}>Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className={labelCls}>Пароль</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Минимум 8 символов"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reg-phone" className={labelCls}>Номер телефона</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={handleRegister}
                className="w-full btn-glass-primary"
              >
                <Icon name="UserPlus" size={16} className="mr-2" />
                Зарегистрироваться
              </Button>

              {dividerInner('Или через соцсети')}

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => handleAuth('Google')} className="w-full btn-glass-secondary">
                  <Icon name="Chrome" size={20} />
                </Button>
                <Button onClick={() => handleAuth('Яндекс')} className="w-full btn-glass-secondary">
                  <span className="font-bold text-lg">Я</span>
                </Button>
                <Button onClick={() => handleAuth('VK')} className="w-full btn-glass-secondary">
                  <Icon name="MessageCircle" size={20} />
                </Button>
              </div>

              <p className="text-xs text-glass-muted text-center">
                Регистрируясь, вы соглашаетесь с{' '}
                <a href="/terms" className="underline text-indigo-300 hover:text-indigo-200">
                  условиями использования
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </Dialog>
  );
}
