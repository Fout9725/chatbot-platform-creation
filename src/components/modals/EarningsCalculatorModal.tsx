import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

interface EarningsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EarningsCalculatorModal({ isOpen, onClose }: EarningsCalculatorModalProps) {
  const [referrals, setReferrals] = useState(10);
  const [conversionRate, setConversionRate] = useState(30);
  const [avgPlan, setAvgPlan] = useState(1990);

  const monthlyReferrals = referrals;
  const paidUsers = Math.floor(monthlyReferrals * (conversionRate / 100));
  const commission = 0.20;
  const monthlyRevenue = paidUsers * avgPlan * commission;
  const yearlyRevenue = monthlyRevenue * 12;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon name="Calculator" size={24} className="text-primary" />
            Калькулятор заработка
          </DialogTitle>
          <DialogDescription>
            Рассчитайте примерный доход от партнёрской программы ИнтеллектПро
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-yellow-50 border-yellow-200">
          <Icon name="AlertTriangle" size={16} className="text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            <strong>Важно:</strong> Данные расчёты являются примерными и могут отличаться от реальных показателей. 
            Платформа ИнтеллектПро не гарантирует указанный уровень дохода. Фактический заработок зависит от множества факторов.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Количество приглашённых пользователей в месяц</Label>
                <span className="text-lg font-bold text-primary">{referrals}</span>
              </div>
              <Slider
                value={[referrals]}
                onValueChange={(value) => setReferrals(value[0])}
                min={1}
                max={200}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                От 1 до 200 пользователей
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Конверсия в платные тарифы (%)</Label>
                <span className="text-lg font-bold text-primary">{conversionRate}%</span>
              </div>
              <Slider
                value={[conversionRate]}
                onValueChange={(value) => setConversionRate(value[0])}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Процент пользователей, которые оплатят тариф (средняя конверсия 20-40%)
              </p>
            </div>

            <div>
              <Label htmlFor="avg-plan">Средний чек тарифа (₽)</Label>
              <Input
                id="avg-plan"
                type="number"
                value={avgPlan}
                onChange={(e) => setAvgPlan(Number(e.target.value))}
                min={990}
                max={4990}
                step={500}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оптимальный: 990₽, Премиум: 2990₽, Партнёрский: 4990₽
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Платных подписок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">{paidUsers}</span>
                  <span className="text-sm text-muted-foreground">в месяц</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  из {monthlyReferrals} приглашённых
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Ваша комиссия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-600">20%</span>
                  <span className="text-sm text-muted-foreground">от каждой оплаты</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Пожизненная комиссия
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-white border-green-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} className="text-green-600" />
                Прогнозируемый доход
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="text-sm text-muted-foreground">Доход в месяц</p>
                  <p className="text-3xl font-bold text-green-600">
                    {monthlyRevenue.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <Icon name="Calendar" size={32} className="text-green-400" />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="text-sm text-muted-foreground">Доход в год</p>
                  <p className="text-3xl font-bold text-green-600">
                    {yearlyRevenue.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <Icon name="TrendingUp" size={32} className="text-green-400" />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>💡 Совет:</strong> Чем выше средний чек тарифа у ваших рефералов, 
                  тем больше ваш доход. Рекомендуйте тарифы Премиум и Партнёрский!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 text-sm text-muted-foreground bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-700">Факторы, влияющие на реальный доход:</p>
            <ul className="space-y-1 ml-4">
              <li>• Качество трафика и целевая аудитория</li>
              <li>• Активность приглашённых пользователей</li>
              <li>• Выбранные рефералами тарифные планы</li>
              <li>• Срок удержания подписок (retention)</li>
              <li>• Сезонность и рыночные условия</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={false}
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Закрыть
          </Button>
          <Button
            type="button"
            disabled={false}
            onClick={() => window.open('/partner', '_self')}
            className="flex-1"
          >
            <Icon name="Rocket" size={16} className="mr-2" />
            Стать партнёром
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
