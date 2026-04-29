import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeoAuth } from '@/contexts/GeoAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

export default function GeoLogin() {
  const { login } = useGeoAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/geo');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'login_failed';
      setError(msg === 'invalid_credentials' ? 'Неверный email или пароль' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center mb-4">
            <Icon name="Sparkles" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">GEO Factory</h1>
          <p className="text-slate-500 text-sm mt-1">Вход в личный кабинет</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Вход…' : 'Войти'}
          </Button>

          <p className="text-sm text-center text-slate-500">
            Нет аккаунта?{' '}
            <Link to="/geo/register" className="text-indigo-600 font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
