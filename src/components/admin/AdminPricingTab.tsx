import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PlanPrices {
  optimal: number;
  premium: number;
  partner: number;
}

interface AdminPricingTabProps {
  planPrices: PlanPrices;
  setPlanPrices: (prices: PlanPrices) => void;
}

const AdminPricingTab = ({ planPrices, setPlanPrices }: AdminPricingTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление тарифами</CardTitle>
        <CardDescription>Изменение стоимости подписок</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Оптимальный (₽/мес)</label>
            <Input
              type="number"
              value={planPrices.optimal}
              onChange={(e) => setPlanPrices({...planPrices, optimal: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Премиум (₽/мес)</label>
            <Input
              type="number"
              value={planPrices.premium}
              onChange={(e) => setPlanPrices({...planPrices, premium: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Партнёрский (₽/мес)</label>
            <Input
              type="number"
              value={planPrices.partner}
              onChange={(e) => setPlanPrices({...planPrices, partner: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <Button type="button" className="w-full">
          <Icon name="Save" size={18} className="mr-2" />
          Сохранить изменения
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminPricingTab;
