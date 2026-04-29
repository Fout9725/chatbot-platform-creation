import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MatrixBackground from '@/components/auth/MatrixBackground';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthInfoPanel from '@/components/auth/AuthInfoPanel';
import AuthForm from '@/components/auth/AuthForm';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage = ({ mode: initialMode }: AuthPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, location.pathname]);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    navigate(next === 'login' ? '/login' : '/register', { replace: true });
  };

  const handleForgotPassword = () => {
    toast({
      title: 'Восстановление пароля',
      description:
        'Напишите в Telegram @Fou9725 — поможем вернуть доступ',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) {
      toast({
        title: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    if (mode === 'register' && !agree) {
      toast({
        title: 'Нужно согласие',
        description: 'Подтвердите согласие с условиями',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast({ title: 'Добро пожаловать!', description: 'Вход выполнен' });
      } else {
        await register(name, email, password);
        toast({
          title: 'Аккаунт создан!',
          description: 'Добро пожаловать в ИнтеллектПро',
        });
      }
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить операцию',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MatrixBackground />
      <AuthHeader />

      <section className="relative z-10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
            <AuthInfoPanel />
            <AuthForm
              mode={mode}
              switchMode={switchMode}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              agree={agree}
              setAgree={setAgree}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onForgotPassword={handleForgotPassword}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;
