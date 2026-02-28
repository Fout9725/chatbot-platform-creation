import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/3d3dea39-efc8-43ac-a7fa-26bb2c1f94dd';
const OWNER_ID = 'default-user';

const ProcurementCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    specifications: '',
    criteria: '',
    budget_max: '',
    min_suppliers: '5',
    response_deadline_days: '3',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Ошибка', description: 'Укажите название тендера', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_tender',
          owner_id: OWNER_ID,
          title: form.title.trim(),
          description: form.description.trim(),
          specifications: form.specifications.trim(),
          criteria: form.criteria.trim(),
          budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
          min_suppliers: parseInt(form.min_suppliers) || 5,
          response_deadline_days: parseInt(form.response_deadline_days) || 3,
        }),
      });
      const data = await response.json();

      if (data.ok && data.tender_id) {
        toast({ title: 'Тендер создан', description: `Тендер "${form.title}" успешно создан` });
        navigate(`/procurement/${data.tender_id}`);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось создать тендер', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Ошибка сети', description: 'Не удалось связаться с сервером', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
                  Новый тендер
                </h1>
                <p className="text-[11px] text-white/40 tracking-wider uppercase">Создание закупки</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/procurement">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="ArrowLeft" size={16} className="mr-1.5" />
                  Назад
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-3xl">
        <Card className="bg-white/[0.03] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white/90">Параметры тендера</CardTitle>
            <CardDescription className="text-white/40">
              Заполните информацию о закупке. AI-агент поможет найти поставщиков и провести отбор.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-white/70">Название тендера</Label>
              <Input
                placeholder="Например: Закупка серверного оборудования"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-white/70">Описание закупки</Label>
              <Textarea
                placeholder="Опишите что именно требуется закупить, для каких целей..."
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 resize-none"
              />
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              <Label className="text-white/70">Спецификации / ТЗ</Label>
              <Textarea
                placeholder="Технические требования, характеристики, стандарты..."
                value={form.specifications}
                onChange={e => updateField('specifications', e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 resize-none"
              />
            </div>

            {/* Criteria */}
            <div className="space-y-2">
              <Label className="text-white/70">Критерии отбора</Label>
              <Textarea
                placeholder="По каким критериям будут оцениваться предложения: цена, сроки, гарантия..."
                value={form.criteria}
                onChange={e => updateField('criteria', e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50 resize-none"
              />
            </div>

            {/* Number fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Макс. бюджет (руб.)</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={form.budget_max}
                  onChange={e => updateField('budget_max', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Мин. поставщиков</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.min_suppliers}
                  onChange={e => updateField('min_suppliers', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Срок ответа (дни)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.response_deadline_days}
                  onChange={e => updateField('response_deadline_days', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading || !form.title.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 flex-1 sm:flex-none"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-1.5 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Icon name="Plus" size={16} className="mr-1.5" />
                    Создать тендер
                  </>
                )}
              </Button>
              <Link to="/procurement">
                <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5">
                  Отмена
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProcurementCreate;
