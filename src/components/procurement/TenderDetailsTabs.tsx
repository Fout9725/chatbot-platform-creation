import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

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

 
interface TenderDetailsTabsProps {
  proposals: Proposal[];
  messages: Message[];
  logs: LogEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiReport: any;
  expandedLogs: Set<number>;
  toggleLog: (logId: number) => void;
  getSupplierName: (supplierId: number) => string;
  formatPrice: (price: number, currency?: string) => string;
  formatDate: (dateStr: string | null) => string;
  onAnalyzeProposals: () => void;
}

const TenderDetailsTabs = ({
  proposals,
  messages,
  logs,
  aiReport,
  expandedLogs,
  toggleLog,
  getSupplierName,
  formatPrice,
  formatDate,
  onAnalyzeProposals,
}: TenderDetailsTabsProps) => {
  return (
    <>
      {/* ==================== PROPOSALS TAB ==================== */}
      <TabsContent value="proposals" className="space-y-6">
        {/* Action bar */}
        {proposals.length > 0 && !aiReport && (
          <div className="flex gap-3">
            <Button onClick={onAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
              <Icon name="BarChart3" size={16} className="mr-1.5" />
              Анализировать предложения
            </Button>
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FileText" size={40} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/40">Предложений пока нет</p>
            <p className="text-white/25 text-sm mt-1">Отправьте RFQ поставщикам и дождитесь ответов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map(proposal => (
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
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="MessageSquare" size={40} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/40">Переписка пуста</p>
            <p className="text-white/25 text-sm mt-1">Сообщения появятся после отправки RFQ</p>
          </div>
        ) : (
          messages.map(msg => {
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
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="ScrollText" size={40} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/40">Логи пусты</p>
          </div>
        ) : (
          logs.map(log => (
            <Card key={log.id} className="bg-white/[0.03] border-white/10">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="Activity" size={14} className="text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white/80 font-medium">{log.action}</p>
                      <span className="text-[10px] text-white/25 shrink-0">{formatDate(log.created_at)}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-white/40 mt-0.5">{log.details}</p>
                    )}
                    {log.ai_reasoning && (
                      <>
                        <button
                          onClick={() => toggleLog(log.id)}
                          className="text-[10px] text-purple-400/60 hover:text-purple-400 mt-1 flex items-center gap-1"
                        >
                          <Icon name={expandedLogs.has(log.id) ? 'ChevronDown' : 'ChevronRight'} size={10} />
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
    </>
  );
};

export default TenderDetailsTabs;
