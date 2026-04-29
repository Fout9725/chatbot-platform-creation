import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useGeoAuth } from '@/contexts/GeoAuthContext';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/geo', label: 'Дашборд', icon: 'LayoutDashboard', end: true },
  { to: '/geo/queries', label: 'Запросы', icon: 'Search' },
  { to: '/geo/brands', label: 'Бренды', icon: 'Tag' },
  { to: '/geo/content', label: 'Контент', icon: 'FileText' },
  { to: '/geo/publications', label: 'Публикации', icon: 'Send' },
  { to: '/geo/settings', label: 'Настройки', icon: 'Settings' },
];

export default function GeoLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useGeoAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/geo/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/geo" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Icon name="Sparkles" size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold leading-tight">GEO Factory</div>
              <div className="text-xs text-slate-500">Упоминания в ИИ</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium truncate">{user?.company}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition mb-1"
          >
            <Icon name="Home" size={16} />
            На главную
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onLogout}>
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}