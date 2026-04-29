import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MatrixBackground from '@/components/auth/MatrixBackground';
import SecurityShield from '@/components/auth/SecurityShield';

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

      <header
        className="relative z-10 sticky top-0"
        style={{
          background: 'rgba(10,14,39,0.55)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                boxShadow: '0 0 20px rgba(139,92,246,0.5)',
              }}
            >
              <Icon name="Bot" className="text-white" size={20} />
            </div>
            <span
              className="text-lg font-bold"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ИнтеллектПро
            </span>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={16} className="mr-1.5" />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
            <div className="hidden lg:block">
              <SecurityShield />

              <div className="mt-6 space-y-3 max-w-md mx-auto">
                {[
                  {
                    icon: 'Lock',
                    title: 'TLS 1.3 шифрование',
                    desc: 'Все данные передаются по защищённому каналу',
                  },
                  {
                    icon: 'Database',
                    title: 'Хранение в России',
                    desc: 'Соответствие 152-ФЗ, серверы в РФ',
                  },
                  {
                    icon: 'KeyRound',
                    title: 'Хеширование паролей',
                    desc: 'Пароли хранятся в виде SHA-256 хешей',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 100%)',
                        border: '1px solid rgba(16,185,129,0.5)',
                      }}
                    >
                      <Icon
                        name={item.icon}
                        size={16}
                        className="text-emerald-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="w-full max-w-md mx-auto"
              style={{ perspective: '1400px' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, rotateY: 30, scale: 0.95 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: -30, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="relative rounded-3xl p-7 md:p-8"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, rgba(10,14,39,0.85) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    boxShadow:
                      '0 30px 80px -20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.7) 50%, transparent 100%)',
                    }}
                  />

                  <div className="text-center mb-6">
                    <div
                      className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          mode === 'login'
                            ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'
                            : 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                        boxShadow:
                          mode === 'login'
                            ? '0 10px 30px -10px rgba(99,102,241,0.7)'
                            : '0 10px 30px -10px rgba(16,185,129,0.7)',
                      }}
                    >
                      <Icon
                        name={mode === 'login' ? 'LogIn' : 'UserPlus'}
                        size={22}
                        className="text-white"
                      />
                    </div>
                    <h1
                      className="text-2xl md:text-3xl font-bold mb-1"
                      style={{
                        background:
                          'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {mode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
                    </h1>
                    <p className="text-sm text-slate-400">
                      {mode === 'login'
                        ? 'Войдите в личный кабинет'
                        : 'Регистрация занимает 30 секунд'}
                    </p>
                  </div>

                  <div
                    className="grid grid-cols-2 gap-1 p-1 rounded-2xl mb-6"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {(['login', 'register'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => switchMode(m)}
                        className="relative h-10 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          color:
                            mode === m ? '#fff' : 'rgba(203,213,225,0.7)',
                        }}
                      >
                        {mode === m && (
                          <motion.span
                            layoutId="authTabBg"
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background:
                                m === 'login'
                                  ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'
                                  : 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                              boxShadow:
                                m === 'login'
                                  ? '0 6px 20px -6px rgba(99,102,241,0.7)'
                                  : '0 6px 20px -6px rgba(16,185,129,0.7)',
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 280,
                              damping: 26,
                            }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-1.5">
                          <Icon
                            name={m === 'login' ? 'LogIn' : 'UserPlus'}
                            size={13}
                          />
                          {m === 'login' ? 'Вход' : 'Регистрация'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                          Имя
                        </label>
                        <div className="relative">
                          <Icon
                            name="User"
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Иван"
                            className="w-full pl-10 pr-4 h-11 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Icon
                          name="Mail"
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="w-full pl-10 pr-4 h-11 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs uppercase tracking-widest text-slate-400">
                          Пароль
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            className="text-xs text-indigo-300 hover:text-white transition-colors"
                            onClick={() =>
                              toast({
                                title: 'Восстановление пароля',
                                description:
                                  'Напишите в Telegram @Fou9725 — поможем вернуть доступ',
                              })
                            }
                          >
                            Забыли?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Icon
                          name="Lock"
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete={
                            mode === 'login'
                              ? 'current-password'
                              : 'new-password'
                          }
                          className="w-full pl-10 pr-10 h-11 rounded-xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? 'Скрыть пароль' : 'Показать пароль'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          <Icon
                            name={showPassword ? 'EyeOff' : 'Eye'}
                            size={16}
                          />
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400 leading-relaxed">
                        <input
                          type="checkbox"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                          className="mt-0.5 accent-indigo-500"
                        />
                        <span>
                          Я согласен с{' '}
                          <Link
                            to="/terms"
                            className="text-indigo-300 hover:text-white underline-offset-4 hover:underline"
                          >
                            условиями
                          </Link>{' '}
                          и{' '}
                          <Link
                            to="/privacy"
                            className="text-indigo-300 hover:text-white underline-offset-4 hover:underline"
                          >
                            политикой конфиденциальности
                          </Link>
                        </span>
                      </label>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-white border-0 mt-2"
                      style={{
                        background:
                          mode === 'login'
                            ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'
                            : 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                        boxShadow:
                          mode === 'login'
                            ? '0 10px 30px -10px rgba(99,102,241,0.7)'
                            : '0 10px 30px -10px rgba(16,185,129,0.7)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Icon
                            name="Loader2"
                            size={16}
                            className="mr-2 animate-spin"
                          />
                          {mode === 'login'
                            ? 'Входим...'
                            : 'Создаём аккаунт...'}
                        </>
                      ) : (
                        <>
                          <Icon
                            name={mode === 'login' ? 'LogIn' : 'UserPlus'}
                            size={16}
                            className="mr-2"
                          />
                          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-5 text-center text-xs text-slate-400 border-t border-white/5">
                    {mode === 'login' ? (
                      <>
                        Нет аккаунта?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="text-indigo-300 hover:text-white font-medium transition-colors"
                        >
                          Зарегистрироваться →
                        </button>
                      </>
                    ) : (
                      <>
                        Уже есть аккаунт?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-indigo-300 hover:text-white font-medium transition-colors"
                        >
                          Войти →
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;
