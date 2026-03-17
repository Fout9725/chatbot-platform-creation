import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface TenderFull {
  id: number;
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
  suppliers: { id: number; status: string }[];
  proposals: { id: number }[];
  messages: { id: number }[];
  logs: { id: number }[];
}

interface TenderOverviewTabProps {
  tender: TenderFull;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiReport: any;
  hasContactableSuppliers: boolean;
  hasContactedSuppliers: boolean;
  hasProposals: boolean;
  hasRespondedSuppliers: boolean;
  formatBudget: (budget: number | null) => string;
  formatDate: (dateStr: string | null) => string;
  onSearchSuppliers: () => void;
  onSendRfq: () => void;
  onSimulateResponses: () => void;
  onAnalyzeProposals: () => void;
  onApproveSupplier: (supplierId: number, companyName: string) => void;
  onRejectAll: () => void;
}

const TenderOverviewTab = ({
  tender,
  aiReport,
  hasContactableSuppliers,
  hasContactedSuppliers,
  hasProposals,
  hasRespondedSuppliers,
  formatBudget,
  formatDate,
  onSearchSuppliers,
  onSendRfq,
  onSimulateResponses,
  onAnalyzeProposals,
  onApproveSupplier,
  onRejectAll,
}: TenderOverviewTabProps) => {
  return (
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
                <Button onClick={onSearchSuppliers} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">
                  <Icon name="Search" size={16} className="mr-1.5" />
                  Найти поставщиков (AI)
                </Button>
                {hasContactableSuppliers && (
                  <Button onClick={onSendRfq} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20">
                    <Icon name="Send" size={16} className="mr-1.5" />
                    Отправить запросы
                  </Button>
                )}
              </>
            )}
            {tender.status === 'active' && (
              <>
                {hasContactedSuppliers && (
                  <Button onClick={onSimulateResponses} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20">
                    <Icon name="Bot" size={16} className="mr-1.5" />
                    Симулировать ответы (MVP)
                  </Button>
                )}
                {hasProposals && (
                  <Button onClick={onAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
                    <Icon name="BarChart3" size={16} className="mr-1.5" />
                    Анализировать предложения
                  </Button>
                )}
              </>
            )}
            {(tender.status === 'draft' || tender.status === 'active') && hasRespondedSuppliers && (
              <Button onClick={onAnalyzeProposals} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/20">
                <Icon name="BarChart3" size={16} className="mr-1.5" />
                Анализировать предложения
              </Button>
            )}
            {tender.status === 'evaluating' && aiReport?.rankings && (
              <>
                {aiReport.rankings.map((r: { supplier_id: number; company_name: string; score: number }) => (
                  <Button
                    key={r.supplier_id}
                    onClick={() => onApproveSupplier(r.supplier_id, r.company_name)}
                    className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/20"
                  >
                    <Icon name="Check" size={16} className="mr-1.5" />
                    Утвердить {r.company_name} ({r.score} баллов)
                  </Button>
                ))}
                <Button onClick={onRejectAll} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
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
                          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 border">
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
  );
};

export default TenderOverviewTab;