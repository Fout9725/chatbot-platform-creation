import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeoAuth } from '@/contexts/GeoAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

export default function GeoRegister() {
  const { register } = useGeoAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, company);
      navigate('/geo');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'register_failed';
      const map: Record<string, string> = {
        email_taken: 'Этот email уже зарегистрирован',
        invalid_email: 'Некорректный email',
        password_too_short: 'Пароль должен быть минимум 6 символов',
      };
      setError(map[msg] || msg);
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
          <p className="text-slate-500 text-sm mt-1">Создайте аккаунт за 30 секунд</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div>
            <Label htmlFor="company">Компания</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="ООО «Ромашка»"
            />
          </div>
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
              autoComplete="new-password"
              minLength={6}
            />
            <p className="text-xs text-slate-500 mt-1">Минимум 6 символов</p>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Создаём…' : 'Зарегистрироваться'}
          </Button>

          <p className="text-sm text-center text-slate-500">
            Уже есть аккаунт?{' '}
            <Link to="/geo/login" className="text-indigo-600 font-medium hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
