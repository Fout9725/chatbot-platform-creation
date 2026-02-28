import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/3d3dea39-efc8-43ac-a7fa-26bb2c1f94dd';
const OWNER_ID = 'default-user';

interface Tender {
  id: number;
  owner_id: string;
  title: string;
  description: string;
  status: string;
  budget_max: number | null;
  response_deadline: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: 'Черновик', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: 'FileEdit' },
  active: { label: 'Активный', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: 'Radio' },
  evaluating: { label: 'Анализ', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: 'BarChart3' },
  awarded: { label: 'Завершён', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: 'CheckCircle2' },
  cancelled: { label: 'Отменён', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: 'XCircle' },
  completed: { label: 'Выполнен', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'Trophy' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'draft', label: 'Черновики' },
  { key: 'active', label: 'Активные' },
  { key: 'evaluating', label: 'Анализ' },
  { key: 'awarded', label: 'Завершённые' },
];

const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=get_tenders&owner_id=${OWNER_ID}`);
      const data = await response.json();
      setTenders(data.tenders || []);
    } catch (e) {
      console.error('Failed to load tenders:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? tenders
    : tenders.filter(t => t.status === filter);

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
      <Badge className={`${cfg.color} border font-medium`}>
        <Icon name={cfg.icon} size={12} className="mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'Не указан';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(budget);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Icon name="ShoppingCart" className="text-white" size={26} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  Менеджер по закупкам
                </h1>
                <p className="text-[11px] text-white/40 tracking-wider uppercase">AI Procurement Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="Home" size={16} className="mr-1.5" />
                  Главная
                </Button>
              </Link>
              <Button
                onClick={() => navigate('/procurement/create')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25"
              >
                <Icon name="Plus" size={16} className="mr-1.5" />
                Создать тендер
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-6xl">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-60">
                  {tenders.filter(t => t.status === tab.key).length}
                </span>
              )}
              {tab.key === 'all' && (
                <span className="ml-1.5 text-xs opacity-60">{tenders.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Icon name="Loader2" size={40} className="text-blue-400 animate-spin mb-4" />
            <p className="text-white/50">Загрузка тендеров...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white/5 p-6 rounded-2xl mb-6">
              <Icon name="Package" size={48} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/70 mb-2">
              {filter === 'all' ? 'Создайте свой первый тендер' : 'Нет тендеров в этой категории'}
            </h3>
            <p className="text-white/40 text-sm mb-6 text-center max-w-md">
              AI-агент поможет найти поставщиков, разослать запросы, собрать предложения и выбрать лучшего
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/procurement/create')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              >
                <Icon name="Plus" size={16} className="mr-1.5" />
                Создать тендер
              </Button>
            )}
          </div>
        )}

        {/* Tender grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tender => (
              <Card
                key={tender.id}
                className="bg-white/[0.03] border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all cursor-pointer group"
                onClick={() => navigate(`/procurement/${tender.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2">
                      {tender.title}
                    </CardTitle>
                    {getStatusBadge(tender.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {tender.description && (
                    <p className="text-sm text-white/40 mb-4 line-clamp-2">{tender.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <div className="flex items-center gap-1">
                      <Icon name="Wallet" size={12} />
                      <span>{formatBudget(tender.budget_max)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      <span>{formatDate(tender.created_at)}</span>
                    </div>
                  </div>
                  {tender.response_deadline && (
                    <div className="flex items-center gap-1 text-xs text-white/30 mt-2">
                      <Icon name="Clock" size={12} />
                      <span>Дедлайн: {formatDate(tender.response_deadline)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProcurementDashboard;
