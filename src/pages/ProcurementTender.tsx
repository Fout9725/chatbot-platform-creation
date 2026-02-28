import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/3d3dea39-efc8-43ac-a7fa-26bb2c1f94dd';

// ---------- Types ----------

interface Supplier {
  id: number;
  tender_id: number;
  company_name: string;
  email: string;
  website: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id: number;
  tender_id: number;
  supplier_id: number;
  price: number;
  currency: string;
  delivery_days: number;
  warranty_months: number;
  proposal_text: string;
  score: number | null;
  created_at: string;
}

interface Message {
  id: number;
  tender_id: number;
  supplier_id: number;
  direction: string;
  message_type: string;
  subject: string;
  body: string;
  created_at: string;
}

interface LogEntry {
  id: number;
  tender_id: number;
  action: string;
  details: string;
  ai_reasoning: string | null;
  created_at: string;
}

interface TenderFull {
  id: number;
  owner_id: string;
  title: string;
  description: string;
  specifications: string;
  criteria: string;
  budget_max: number | null;
  min_suppliers: number;
  response_deadline: string | null;
  status: string;
  ai_report: string | null;
  created_at: string;
  updated_at: string;
  suppliers: Supplier[];
  proposals: Proposal[];
  messages: Message[];
  logs: LogEntry[];
}

// ---------- Status config ----------

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: 'Черновик', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: 'FileEdit' },
  active: { label: 'Активный', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: 'Radio' },
  evaluating: { label: 'Анализ', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: 'BarChart3' },
  awarded: { label: 'Завершён', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: 'CheckCircle2' },
  cancelled: { label: 'Отменён', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: 'XCircle' },
  completed: { label: 'Выполнен', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'Trophy' },
};

const SUPPLIER_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  found: { label: 'Найден AI', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  contacted: { label: 'Запрос отправлен', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  responded: { label: 'Ответил', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  winner: { label: 'Победитель', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  rejected: { label: 'Отклонён', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

// ---------- Helpers ----------

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatBudget = (budget: number | null) => {
  if (!budget) return 'Не указан';
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(budget);
};

const formatPrice = (price: number, currency: string = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
};

// ---------- Component ----------

const ProcurementTender = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tender, setTender] = useState<TenderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Add supplier form
  const [newSupplier, setNewSupplier] = useState({ company_name: '', email: '', website: '' });

  // Clarification form
  const [clarificationSupplierId, setClarificationSupplierId] = useState<number | null>(null);
  const [clarificationText, setClarificationText] = useState('');

  // Supplier question form
  const [questionSupplierId, setQuestionSupplierId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');

  // Expanded log items
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const loadTender = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=get_tender&tender_id=${id}`);
      const data = await response.json();
      if (data.tender) {
        setTender(data.tender);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Тендер не найден', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Ошибка сети', description: 'Не удалось загрузить тендер', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadTender();
  }, [loadTender]);

  const callAction = async (action: string, params: Record<string, unknown> = {}, loadingLabel?: string) => {
    setAiLoading(loadingLabel || action);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tender_id: parseInt(id!), ...params }),
      });
      const data = await response.json();
      if (data.error) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
        return null;
      }
      await loadTender();
      return data;
    } catch (e) {
      toast({ title: 'Ошибка сети', description: 'Не удалось выполнить действие', variant: 'destructive' });
      return null;
    } finally {
      setAiLoading(null);
    }
  };

  // ---------- Action handlers ----------

  const handleSearchSuppliers = async () => {
    const data = await callAction('search_suppliers', {}, 'AI ищет поставщиков...');
    if (data?.ok) {
      toast({ title: 'Поставщики найдены', description: `AI нашёл ${data.count} поставщиков` });
    }
  };

  const handleSendRfq = async () => {
    const data = await callAction('send_rfq', {}, 'AI генерирует запросы...');
    if (data?.ok) {
      toast({ title: 'RFQ отправлены', description: `Запросы отправлены ${data.count} поставщикам` });
    }
  };

  const handleSimulateResponses = async () => {
    const data = await callAction('simulate_responses', {}, 'AI симулирует ответы...');
    if (data?.ok) {
      toast({ title: 'Ответы получены', description: `Симулированы ответы от ${data.count} поставщиков` });
    }
  };

  const handleAnalyzeProposals = async () => {
    const data = await callAction('analyze_proposals', {}, 'AI анализирует предложения...');
    if (data?.ok) {
      toast({ title: 'Анализ завершён', description: data.summary?.slice(0, 100) || 'Отчёт готов' });
    }
  };

  const handleApproveSupplier = async (supplierId: number, companyName: string) => {
    const data = await callAction('approve_supplier', { supplier_id: supplierId }, 'AI оформляет решение...');
    if (data?.ok) {
      toast({ title: 'Победитель утверждён', description: `${companyName} — победитель тендера` });
    }
  };

  const handleRejectAll = async () => {
    const data = await callAction('reject_all', { reason: 'Тендер отменён по решению заказчика' }, 'AI рассылает уведомления...');
    if (data?.ok) {
      toast({ title: 'Все отклонены', description: `Отклонено ${data.rejected_count} поставщиков` });
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.company_name.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите название компании', variant: 'destructive' });
      return;
    }
    const data = await callAction('add_suppliers', {
      suppliers: [{ company_name: newSupplier.company_name, email: newSupplier.email, website: newSupplier.website }],
    });
    if (data?.ok) {
      setNewSupplier({ company_name: '', email: '', website: '' });
      toast({ title: 'Поставщик добавлен', description: `${newSupplier.company_name} добавлен в тендер` });
    }
  };

  const handleSendClarification = async () => {
    if (!clarificationSupplierId) return;
    const data = await callAction('send_clarification', {
      supplier_id: clarificationSupplierId,
      question: clarificationText,
    }, 'AI составляет запрос...');
    if (data?.ok) {
      setClarificationSupplierId(null);
      setClarificationText('');
      toast({ title: 'Уточнение отправлено', description: `Запрос отправлен поставщику ${data.supplier}` });
    }
  };

  const handleSupplierQuestion = async () => {
    if (!questionSupplierId || !questionText.trim()) return;
    const data = await callAction('handle_supplier_question', {
      supplier_id: questionSupplierId,
      question: questionText,
    }, 'AI формирует ответ...');
    if (data?.ok) {
      setQuestionSupplierId(null);
      setQuestionText('');
      toast({ title: 'Ответ сформирован', description: 'Дипломатичный ответ отправлен поставщику' });
    }
  };

  const toggleLog = (logId: number) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const getSupplierName = (supplierId: number) => {
    return tender?.suppliers.find(s => s.id === supplierId)?.company_name || `Поставщик #${supplierId}`;
  };

  // ---------- AI Report parsing ----------

  const parseAiReport = () => {
    if (!tender?.ai_report) return null;
    try {
      return JSON.parse(tender.ai_report);
    } catch {
      return null;
    }
  };

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={40} className="text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Загрузка тендера...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-white/70 mb-4">Тендер не найден</p>
          <Link to="/procurement">
            <Button variant="ghost" className="text-white/60">Вернуться к списку</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[tender.status] || STATUS_CONFIG.draft;
  const aiReport = parseAiReport();
  const hasContactableSuppliers = tender.suppliers.some(s => s.status === 'new' || s.status === 'found');
  const hasContactedSuppliers = tender.suppliers.some(s => s.status === 'contacted');
  const hasProposals = tender.proposals.length > 0;
  const hasRespondedSuppliers = tender.suppliers.some(s => s.status === 'responded');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* AI Loading Overlay */}
      {aiLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#12121a] border border-blue-500/20 rounded-2xl p-8 text-center shadow-2xl shadow-blue-500/10 max-w-sm mx-4">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full">
                <Icon name="Brain" size={28} className="text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-white font-medium mb-1">{aiLoading}</p>
            <p className="text-white/40 text-sm">Это может занять несколько секунд</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/procurement">
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5">
                  <Icon name="ArrowLeft" size={20} />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-white/90">{tender.title}</h1>
                  <Badge className={`${statusCfg.color} border font-medium`}>
                    <Icon name={statusCfg.icon} size={12} className="mr-1" />
                    {statusCfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/35 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Icon name="Wallet" size={11} />
                    {formatBudget(tender.budget_max)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Users" size={11} />
                    {tender.suppliers.length} поставщиков
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" size={11} />
                    {formatDate(tender.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-0.5 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-white/50 text-sm">
              <Icon name="LayoutDashboard" size={14} className="mr-1.5" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-white/50 text-sm">
              <Icon name="Building2" size={14} className="mr-1.5" />
              Поставщики
              <span className="ml-1 text-xs opacity-60">{tender.suppliers.length}</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-white/50 text-sm">
              <Icon name="FileText" size={14} className="mr-1.5" />
              Предложения
              <span className="ml-1 text-xs opacity-60">{tender.proposals.length}</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-white/50 text-sm">
              <Icon name="MessageSquare" size={14} className="mr-1.5" />
              Переписка
              <span className="ml-1 text-xs opacity-60">{tender.messages.length}</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-white/50 text-sm">
              <Icon name="ScrollText" size={14} className="mr-1.5" />
              Логи
              <span className="ml-1 text-xs opacity-60">{tender.logs.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview" className="space-y-6">
            {/* Workflow actions */}
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white/80 flex items-center gap-2">
                  <Icon name="Workflow" size={18} className="text-blue-400" />
                  Действия
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {tender.status === 'draft' && (
                    <>
                      <Button onClick={handleSearchSuppliers} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">
                        <Icon name="Search" size={16} className="mr-1.5" />
                        Найти поставщиков (AI)
                      </Button>
                      {hasContactableSuppliers && (
                        <Button onClick={handleSendRfq} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20">
                          <Icon name="Send" size={16} className="mr-1.5" />
                          Отправить запросы
                        </Button>
                      )}
                    </>
                  )}
                  {tender.status === 'active' && (
                    <>
                      {hasContactedSuppliers && (
                        <Button onClick={handleSimulateResponses} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20">
                          <Icon name="Bot" size={16} className="mr-1.5" />
                          Симулировать ответы (MVP)
                        </Button>
                      )}
                      {hasProposals && (
                        <Button onClick={handleAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
                          <Icon name="BarChart3" size={16} className="mr-1.5" />
                          Анализировать предложения
                        </Button>
                      )}
                    </>
                  )}
                  {(tender.status === 'draft' || tender.status === 'active') && hasRespondedSuppliers && (
                    <Button onClick={handleAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
                      <Icon name="BarChart3" size={16} className="mr-1.5" />
                      Анализировать предложения
                    </Button>
                  )}
                  {tender.status === 'evaluating' && aiReport?.rankings && (
                    <>
                      {aiReport.rankings.map((r: { supplier_id: number; company_name: string; score: number }) => (
                        <Button
                          key={r.supplier_id}
                          onClick={() => handleApproveSupplier(r.supplier_id, r.company_name)}
                          className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/20"
                        >
                          <Icon name="Check" size={16} className="mr-1.5" />
                          Утвердить {r.company_name} ({r.score} баллов)
                        </Button>
                      ))}
                      <Button onClick={handleRejectAll} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Icon name="XCircle" size={16} className="mr-1.5" />
                        Отклонить всех
                      </Button>
                    </>
                  )}
                  {tender.status === 'awarded' && (
                    <div className="flex items-center gap-2 text-green-400">
                      <Icon name="Trophy" size={20} />
                      <span className="font-medium">Тендер завершён. Победитель выбран.</span>
                    </div>
                  )}
                  {tender.status === 'cancelled' && (
                    <div className="flex items-center gap-2 text-red-400">
                      <Icon name="Ban" size={20} />
                      <span className="font-medium">Тендер отменён</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tender details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/[0.03] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white/80">Детали тендера</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tender.description && (
                    <div>
                      <p className="text-xs text-white/40 mb-1">Описание</p>
                      <p className="text-sm text-white/70">{tender.description}</p>
                    </div>
                  )}
                  {tender.specifications && (
                    <div>
                      <p className="text-xs text-white/40 mb-1">Спецификации</p>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{tender.specifications}</p>
                    </div>
                  )}
                  {tender.criteria && (
                    <div>
                      <p className="text-xs text-white/40 mb-1">Критерии отбора</p>
                      <p className="text-sm text-white/70">{tender.criteria}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-white/40 mb-1">Бюджет</p>
                      <p className="text-sm font-medium text-white/80">{formatBudget(tender.budget_max)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Мин. поставщиков</p>
                      <p className="text-sm font-medium text-white/80">{tender.min_suppliers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Дедлайн ответов</p>
                      <p className="text-sm font-medium text-white/80">{formatDate(tender.response_deadline)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Создан</p>
                      <p className="text-sm font-medium text-white/80">{formatDate(tender.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Report */}
              <Card className="bg-white/[0.03] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white/80 flex items-center gap-2">
                    <Icon name="Brain" size={16} className="text-purple-400" />
                    AI отчёт
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiReport ? (
                    <div className="space-y-4">
                      {aiReport.summary && (
                        <div>
                          <p className="text-xs text-white/40 mb-1">Резюме</p>
                          <p className="text-sm text-white/70">{aiReport.summary}</p>
                        </div>
                      )}
                      {aiReport.reasoning && (
                        <div>
                          <p className="text-xs text-white/40 mb-1">Обоснование</p>
                          <p className="text-sm text-white/60">{aiReport.reasoning}</p>
                        </div>
                      )}
                      {aiReport.rankings && (
                        <div>
                          <p className="text-xs text-white/40 mb-2">Рейтинг</p>
                          <div className="space-y-2">
                            {aiReport.rankings.map((r: { supplier_id: number; company_name: string; score: number; recommendation: string }, idx: number) => (
                              <div key={r.supplier_id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm text-white/80">{r.company_name}</span>
                                </div>
                                <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  {r.score} баллов
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Icon name="FileQuestion" size={32} className="text-white/15 mx-auto mb-2" />
                      <p className="text-sm text-white/30">Отчёт будет сформирован после анализа предложений</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-white/[0.03] border-white/10 p-4 text-center">
                <Icon name="Building2" size={20} className="text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white/90">{tender.suppliers.length}</p>
                <p className="text-xs text-white/40">Поставщиков</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/10 p-4 text-center">
                <Icon name="FileText" size={20} className="text-cyan-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white/90">{tender.proposals.length}</p>
                <p className="text-xs text-white/40">Предложений</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/10 p-4 text-center">
                <Icon name="MessageSquare" size={20} className="text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white/90">{tender.messages.length}</p>
                <p className="text-xs text-white/40">Сообщений</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/10 p-4 text-center">
                <Icon name="ScrollText" size={20} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white/90">{tender.logs.length}</p>
                <p className="text-xs text-white/40">Событий</p>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== SUPPLIERS TAB ==================== */}
          <TabsContent value="suppliers" className="space-y-6">
            {/* Add supplier form */}
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white/80">Добавить поставщика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <Input
                    placeholder="Название компании"
                    value={newSupplier.company_name}
                    onChange={e => setNewSupplier(p => ({ ...p, company_name: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                  />
                  <Input
                    placeholder="Email"
                    value={newSupplier.email}
                    onChange={e => setNewSupplier(p => ({ ...p, email: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                  />
                  <Input
                    placeholder="Сайт"
                    value={newSupplier.website}
                    onChange={e => setNewSupplier(p => ({ ...p, website: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddSupplier} size="sm" className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20">
                    <Icon name="Plus" size={14} className="mr-1" />
                    Добавить
                  </Button>
                  <Button onClick={handleSearchSuppliers} size="sm" className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">
                    <Icon name="Sparkles" size={14} className="mr-1" />
                    AI Поиск
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers list */}
            {tender.suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Building2" size={40} className="text-white/15 mx-auto mb-3" />
                <p className="text-white/40">Поставщики ещё не добавлены</p>
                <p className="text-white/25 text-sm mt-1">Добавьте вручную или запустите AI поиск</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tender.suppliers.map(supplier => {
                  const sCfg = SUPPLIER_STATUS[supplier.status] || SUPPLIER_STATUS.new;
                  return (
                    <Card key={supplier.id} className="bg-white/[0.03] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                              <Icon name="Building2" size={18} className="text-white/30" />
                            </div>
                            <div>
                              <p className="font-medium text-white/90">{supplier.company_name}</p>
                              <div className="flex items-center gap-3 text-xs text-white/35">
                                {supplier.email && (
                                  <span className="flex items-center gap-1">
                                    <Icon name="Mail" size={10} />
                                    {supplier.email}
                                  </span>
                                )}
                                {supplier.website && (
                                  <span className="flex items-center gap-1">
                                    <Icon name="Globe" size={10} />
                                    {supplier.website}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${sCfg.color} border text-xs`}>{sCfg.label}</Badge>
                            {(supplier.status === 'responded' || supplier.status === 'rejected') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/40 hover:text-white/70 h-8 text-xs"
                                onClick={() => {
                                  setClarificationSupplierId(supplier.id);
                                  setClarificationText('');
                                }}
                              >
                                <Icon name="HelpCircle" size={12} className="mr-1" />
                                Уточнить
                              </Button>
                            )}
                            {supplier.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/40 hover:text-white/70 h-8 text-xs"
                                onClick={() => {
                                  setQuestionSupplierId(supplier.id);
                                  setQuestionText('');
                                }}
                              >
                                <Icon name="MessageCircle" size={12} className="mr-1" />
                                Вопрос
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Clarification form inline */}
                        {clarificationSupplierId === supplier.id && (
                          <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                            <Label className="text-xs text-white/50">Запрос на уточнение</Label>
                            <Textarea
                              placeholder="Укажите что нужно уточнить (или оставьте пустым для стандартного запроса)"
                              value={clarificationText}
                              onChange={e => setClarificationText(e.target.value)}
                              rows={2}
                              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 resize-none"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSendClarification} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 h-7 text-xs">
                                Отправить
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setClarificationSupplierId(null)} className="text-white/40 h-7 text-xs">
                                Отмена
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Supplier question form inline */}
                        {questionSupplierId === supplier.id && (
                          <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                            <Label className="text-xs text-white/50">Вопрос от поставщика</Label>
                            <Textarea
                              placeholder="Введите вопрос поставщика об отклонении..."
                              value={questionText}
                              onChange={e => setQuestionText(e.target.value)}
                              rows={2}
                              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 resize-none"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSupplierQuestion} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 h-7 text-xs">
                                AI ответ
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setQuestionSupplierId(null)} className="text-white/40 h-7 text-xs">
                                Отмена
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ==================== PROPOSALS TAB ==================== */}
          <TabsContent value="proposals" className="space-y-6">
            {/* Action bar */}
            {tender.proposals.length > 0 && !aiReport && (
              <div className="flex gap-3">
                <Button onClick={handleAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
                  <Icon name="BarChart3" size={16} className="mr-1.5" />
                  Анализировать предложения
                </Button>
              </div>
            )}

            {tender.proposals.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="FileText" size={40} className="text-white/15 mx-auto mb-3" />
                <p className="text-white/40">Предложений пока нет</p>
                <p className="text-white/25 text-sm mt-1">Отправьте RFQ поставщикам и дождитесь ответов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tender.proposals.map(proposal => (
                  <Card key={proposal.id} className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Building2" size={16} className="text-white/40" />
                            <span className="font-medium text-white/90">{getSupplierName(proposal.supplier_id)}</span>
                            {proposal.score !== null && (
                              <Badge className={`border text-xs ${
                                proposal.score >= 80 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                                proposal.score >= 60 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}>
                                {proposal.score} баллов
                              </Badge>
                            )}
                          </div>
                          {proposal.proposal_text && (
                            <p className="text-sm text-white/50 max-w-2xl">{proposal.proposal_text}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-right">
                          <div>
                            <p className="text-xs text-white/40">Цена</p>
                            <p className="text-sm font-semibold text-white/90">{formatPrice(proposal.price, proposal.currency)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">Доставка</p>
                            <p className="text-sm font-medium text-white/70">{proposal.delivery_days} дн.</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">Гарантия</p>
                            <p className="text-sm font-medium text-white/70">{proposal.warranty_months} мес.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ==================== MESSAGES TAB ==================== */}
          <TabsContent value="messages" className="space-y-4">
            {tender.messages.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="MessageSquare" size={40} className="text-white/15 mx-auto mb-3" />
                <p className="text-white/40">Переписка пуста</p>
                <p className="text-white/25 text-sm mt-1">Сообщения появятся после отправки RFQ</p>
              </div>
            ) : (
              tender.messages.map(msg => {
                const isOutgoing = msg.direction === 'outgoing';
                return (
                  <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    <Card className={`max-w-[85%] lg:max-w-[70%] ${
                      isOutgoing
                        ? 'bg-blue-600/10 border-blue-500/20'
                        : 'bg-white/[0.03] border-white/10'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            name={isOutgoing ? 'ArrowUpRight' : 'ArrowDownLeft'}
                            size={14}
                            className={isOutgoing ? 'text-blue-400' : 'text-green-400'}
                          />
                          <span className="text-xs font-medium text-white/50">
                            {isOutgoing ? 'Исходящее' : 'Входящее'}
                          </span>
                          <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px]">
                            {msg.message_type}
                          </Badge>
                          <span className="text-xs text-white/25">
                            {getSupplierName(msg.supplier_id)}
                          </span>
                        </div>
                        {msg.subject && (
                          <p className="text-sm font-medium text-white/80 mb-1">{msg.subject}</p>
                        )}
                        <p className="text-sm text-white/60 whitespace-pre-wrap">{msg.body}</p>
                        <p className="text-[10px] text-white/20 mt-2">{formatDate(msg.created_at)}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ==================== LOGS TAB ==================== */}
          <TabsContent value="logs" className="space-y-3">
            {tender.logs.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="ScrollText" size={40} className="text-white/15 mx-auto mb-3" />
                <p className="text-white/40">Логи пусты</p>
              </div>
            ) : (
              tender.logs.map(log => (
                <Card key={log.id} className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-white/5 text-white/50 border-white/10 text-[10px]">
                            {log.action}
                          </Badge>
                          <span className="text-[10px] text-white/25">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-sm text-white/70">{log.details}</p>
                        {log.ai_reasoning && (
                          <>
                            <button
                              onClick={() => toggleLog(log.id)}
                              className="text-xs text-blue-400/70 hover:text-blue-400 mt-2 flex items-center gap-1"
                            >
                              <Icon name={expandedLogs.has(log.id) ? 'ChevronDown' : 'ChevronRight'} size={12} />
                              AI обоснование
                            </button>
                            {expandedLogs.has(log.id) && (
                              <div className="mt-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                <p className="text-xs text-white/50 whitespace-pre-wrap">{log.ai_reasoning}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProcurementTender;
