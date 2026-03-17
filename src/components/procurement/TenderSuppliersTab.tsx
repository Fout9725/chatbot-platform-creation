import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Supplier {
  id: number;
  tender_id: number;
  company_name: string;
  email: string;
  website: string;
  status: string;
  created_at: string;
}

const SUPPLIER_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  found: { label: 'Найден AI', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  contacted: { label: 'Запрос отправлен', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  responded: { label: 'Ответил', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  winner: { label: 'Победитель', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  rejected: { label: 'Отклонён', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

interface TenderSuppliersTabProps {
  suppliers: Supplier[];
  newSupplier: { company_name: string; email: string; website: string };
  setNewSupplier: React.Dispatch<React.SetStateAction<{ company_name: string; email: string; website: string }>>;
  clarificationSupplierId: number | null;
  setClarificationSupplierId: React.Dispatch<React.SetStateAction<number | null>>;
  clarificationText: string;
  setClarificationText: React.Dispatch<React.SetStateAction<string>>;
  questionSupplierId: number | null;
  setQuestionSupplierId: React.Dispatch<React.SetStateAction<number | null>>;
  questionText: string;
  setQuestionText: React.Dispatch<React.SetStateAction<string>>;
  onAddSupplier: () => void;
  onSearchSuppliers: () => void;
  onSendClarification: () => void;
  onSupplierQuestion: () => void;
}

const TenderSuppliersTab = ({
  suppliers,
  newSupplier,
  setNewSupplier,
  clarificationSupplierId,
  setClarificationSupplierId,
  clarificationText,
  setClarificationText,
  questionSupplierId,
  setQuestionSupplierId,
  questionText,
  setQuestionText,
  onAddSupplier,
  onSearchSuppliers,
  onSendClarification,
  onSupplierQuestion,
}: TenderSuppliersTabProps) => {
  return (
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
            <Button onClick={onAddSupplier} size="sm" className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20">
              <Icon name="Plus" size={14} className="mr-1" />
              Добавить
            </Button>
            <Button onClick={onSearchSuppliers} size="sm" className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20">
              <Icon name="Sparkles" size={14} className="mr-1" />
              AI Поиск
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers list */}
      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Building2" size={40} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/40">Поставщики ещё не добавлены</p>
          <p className="text-white/25 text-sm mt-1">Добавьте вручную или запустите AI поиск</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map(supplier => {
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
                        <Button size="sm" onClick={onSendClarification} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 h-7 text-xs">
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
                        <Button size="sm" onClick={onSupplierQuestion} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 h-7 text-xs">
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
  );
};

export default TenderSuppliersTab;
