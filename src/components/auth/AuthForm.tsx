import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AuthFormProps {
  mode: 'login' | 'register';
  switchMode: (next: 'login' | 'register') => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  agree: boolean;
  setAgree: (v: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
  onForgotPassword: () => void;
}

const AuthForm = ({
  mode,
  switchMode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  agree,
  setAgree,
  isLoading,
  onSubmit,
  onForgotPassword,
}: AuthFormProps) => {
  return (
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
                  color: mode === m ? '#fff' : 'rgba(203,213,225,0.7)',
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

          <form onSubmit={onSubmit} className="space-y-4">
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
                    onClick={onForgotPassword}
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
                    mode === 'login' ? 'current-password' : 'new-password'
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
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
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
                  {mode === 'login' ? 'Входим...' : 'Создаём аккаунт...'}
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
  );
};

export default AuthForm;
