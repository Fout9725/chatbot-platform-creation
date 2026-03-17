import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TenderOverviewTab from '@/components/procurement/TenderOverviewTab';
import TenderSuppliersTab from '@/components/procurement/TenderSuppliersTab';
import TenderDetailsTabs from '@/components/procurement/TenderDetailsTabs';

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
  const { toast } = useToast();

  const [tender, setTender] = useState<TenderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [newSupplier, setNewSupplier] = useState({ company_name: '', email: '', website: '' });

  const [clarificationSupplierId, setClarificationSupplierId] = useState<number | null>(null);
  const [clarificationText, setClarificationText] = useState('');

  const [questionSupplierId, setQuestionSupplierId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');

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
    const data = await callAction('add_supplier', newSupplier, 'Добавляем поставщика...');
    if (data?.ok) {
      setNewSupplier({ company_name: '', email: '', website: '' });
      toast({ title: 'Поставщик добавлен', description: newSupplier.company_name });
    }
  };

  const handleSendClarification = async () => {
    if (!clarificationSupplierId) return;
    const data = await callAction('send_clarification', {
      supplier_id: clarificationSupplierId,
      clarification_text: clarificationText,
    }, 'AI формирует уточнение...');
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

          <TenderOverviewTab
            tender={tender}
            aiReport={aiReport}
            hasContactableSuppliers={hasContactableSuppliers}
            hasContactedSuppliers={hasContactedSuppliers}
            hasProposals={hasProposals}
            hasRespondedSuppliers={hasRespondedSuppliers}
            formatBudget={formatBudget}
            formatDate={formatDate}
            onSearchSuppliers={handleSearchSuppliers}
            onSendRfq={handleSendRfq}
            onSimulateResponses={handleSimulateResponses}
            onAnalyzeProposals={handleAnalyzeProposals}
            onApproveSupplier={handleApproveSupplier}
            onRejectAll={handleRejectAll}
          />

          <TenderSuppliersTab
            suppliers={tender.suppliers}
            newSupplier={newSupplier}
            setNewSupplier={setNewSupplier}
            clarificationSupplierId={clarificationSupplierId}
            setClarificationSupplierId={setClarificationSupplierId}
            clarificationText={clarificationText}
            setClarificationText={setClarificationText}
            questionSupplierId={questionSupplierId}
            setQuestionSupplierId={setQuestionSupplierId}
            questionText={questionText}
            setQuestionText={setQuestionText}
            onAddSupplier={handleAddSupplier}
            onSearchSuppliers={handleSearchSuppliers}
            onSendClarification={handleSendClarification}
            onSupplierQuestion={handleSupplierQuestion}
          />

          <TenderDetailsTabs
            proposals={tender.proposals}
            messages={tender.messages}
            logs={tender.logs}
            aiReport={aiReport}
            expandedLogs={expandedLogs}
            toggleLog={toggleLog}
            getSupplierName={getSupplierName}
            formatPrice={formatPrice}
            formatDate={formatDate}
            onAnalyzeProposals={handleAnalyzeProposals}
          />
        </Tabs>
      </main>
    </div>
  );
};

export default ProcurementTender;
