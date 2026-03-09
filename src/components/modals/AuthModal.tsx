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
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleAuth = (method: string) => {
    toast({
      title: `Авторизация через ${method}`,
      description: 'Функция в разработке',
    });
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    
    await login(email, password);
    
    const savedUser = localStorage.getItem('user');
    const userData = savedUser ? JSON.parse(savedUser) : null;
    
    toast({
      title: 'Добро пожаловать! 👋',
      description: `Вы успешно вошли в систему`,
    });
    onClose();
    
    if (userData && userData.plan && userData.plan !== 'free') {
      navigate('/dashboard');
    } else {
      navigate('/plan-selection');
    }
  };

  const handlePhoneAuth = () => {
    if (!phone) {
      toast({
        title: 'Ошибка',
        description: 'Введите номер телефона',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'SMS отправлено',
      description: `Код подтверждения отправлен на ${phone}`,
    });
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
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
    
    await register(name, email, password);
    toast({
      title: 'Регистрация успешна! 🎉',
      description: 'Выберите тарифный план для продолжения',
    });
    onClose();
    navigate('/plan-selection');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="User" size={24} />
            Вход в аккаунт
          </DialogTitle>
          <DialogDescription>
            Войдите или зарегистрируйтесь для продолжения
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setAuthMethod('email')}
                  className="flex-1"
                >
                  <Icon name="Mail" size={16} className="mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => setAuthMethod('phone')}
                  className="flex-1"
                >
                  <Icon name="Smartphone" size={16} className="mr-2" />
                  Телефон
                </Button>
              </div>
              
              <Button
                type="button"
                variant={isAdminMode ? 'default' : 'outline'}
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="w-full"
                size="sm"
              >
                <Icon name="ShieldCheck" size={16} className="mr-2" />
                {isAdminMode ? 'Режим администратора активен' : 'Войти как администратор'}
              </Button>

              {authMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{isAdminMode ? 'Логин администратора' : 'Email'}</Label>
                    <Input
                      id="login-email"
                      type={isAdminMode ? 'text' : 'email'}
                      placeholder={isAdminMode ? 'A/V admin' : 'your@email.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {isAdminMode && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Icon name="ShieldAlert" size={16} className="text-amber-600" />
                      <p className="text-xs text-amber-700">Вход с правами администратора</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Номер телефона</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Мы отправим SMS с кодом подтверждения
                  </p>
                </>
              )}

              <Button 
                type="button"
                onClick={authMethod === 'email' ? handleEmailAuth : handlePhoneAuth}
                className="w-full"
              >
                <Icon name="LogIn" size={16} className="mr-2" />
                Войти
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Или войти через
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAuth('Google')}
                  className="w-full"
                >
                  <Icon name="Chrome" size={20} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAuth('Яндекс')}
                  className="w-full"
                >
                  <span className="font-bold text-lg">Я</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAuth('VK')}
                  className="w-full"
                >
                  <Icon name="MessageCircle" size={20} />
                </Button>
              </div>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Забыли пароль?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Имя</Label>
                <Input
                  id="reg-name"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setAuthMethod('email')}
                  className="flex-1"
                >
                  <Icon name="Mail" size={16} className="mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => setAuthMethod('phone')}
                  className="flex-1"
                >
                  <Icon name="Smartphone" size={16} className="mr-2" />
                  Телефон
                </Button>
              </div>

              {authMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Минимум 8 символов"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Номер телефона</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <Button 
                type="button"
                onClick={handleRegister}
                className="w-full"
              >
                <Icon name="UserPlus" size={16} className="mr-2" />
                Зарегистрироваться
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Или через соцсети
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAuth('Google')}
                  className="w-full"
                >
                  <Icon name="Chrome" size={20} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAuth('Яндекс')}
                  className="w-full"
                >
                  <span className="font-bold text-lg">Я</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAuth('VK')}
                  className="w-full"
                >
                  <Icon name="MessageCircle" size={20} />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Регистрируясь, вы соглашаетесь с{' '}
                <a href="#" className="underline">условиями использования</a>
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