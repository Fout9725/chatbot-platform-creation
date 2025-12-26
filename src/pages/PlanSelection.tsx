import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';

const plans = [
  {
    id: 'free',
    name: 'Бесплатный',
    price: 0,
    period: 'навсегда',
    icon: 'Rocket',
    color: 'from-gray-500 to-gray-600',
    features: [
      '1 ИИ-агент',
      'До 100 сообщений/месяц',
      'Базовая аналитика',
      'Telegram интеграция',
      'Конструктор: базовые блоки',
      '3 шаблона из библиотеки',
      'Поддержка сообщества'
    ],
    limits: 'Идеально для тестирования'
  },
  {
    id: 'optimal',
    name: 'Оптимальный',
    price: 990,
    period: 'в месяц',
    icon: 'Zap',
    color: 'from-blue-500 to-cyan-500',
    popular: true,
    features: [
      'До 5 ИИ-агентов',
      'До 10,000 сообщений/месяц',
      'Расширенная аналитика',
      'Все интеграции (Telegram, WhatsApp)',
      'Конструктор Pro: все блоки',
      'N8N шаблоны (20 штук)',
      'Создание бота по тексту (5/мес)',
      'Приоритетная поддержка'
    ],
    limits: 'Для растущего бизнеса'
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: 2990,
    period: 'в месяц',
    icon: 'Crown',
    color: 'from-purple-500 to-pink-500',
    features: [
      'Неограниченное количество ИИ-агентов',
      'До 100,000 сообщений/месяц',
      'AI-обучение ИИ-агентов',
      'Все интеграции + API',
      'Конструктор Premium: все блоки + AI',
      'Все N8N шаблоны (безлимит)',
      'Создание бота по тексту (безлимит)',
      'Персональный менеджер',
      'Кастомизация без ограничений',
      'Белая метка (White Label)',
      'Экспорт данных'
    ],
    limits: 'Для профессионалов'
  },
  {
    id: 'partner',
    name: 'Партнёрский',
    price: 9990,
    period: 'в месяц',
    icon: 'Users',
    color: 'from-green-500 to-emerald-500',
    exclusive: true,
    features: [
      'Всё из тарифа Премиум',
      'Конструктор Partner: все + приоритет',
      '💰 Заработок на рефералах (20% комиссия)',
      '💰 Публикация ИИ-агентов в маркетплейсе',
      '💰 Продажа готовых решений',
      '💰 Публикация своих N8N шаблонов',
      'Персональная партнёрская ссылка',
      'Аналитика по рефералам',
      'Ежемесячные выплаты',
      'Маркетинговые материалы',
      'Обучение партнёров'
    ],
    limits: 'Зарабатывайте вместе с нами',
    earning: 'Потенциал дохода до 100,000₽/мес'
  }
];

const PlanSelection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUserPlan } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>('optimal');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите или зарегистрируйтесь, чтобы выбрать тариф',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    const selectedPlanData = plans.find(p => p.id === planId);
    if (!selectedPlanData) return;

    setSelectedPlan(planId);

    if (planId === 'free') {
      setUserPlan('free');
      toast({
        title: `Тариф ${selectedPlanData.name} выбран! 🎉`,
        description: 'Теперь вы можете использовать бесплатный функционал',
      });
      navigate('/dashboard');
    } else {
      setPaymentPlan(selectedPlanData);
      setIsPaymentOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <Icon name="Home" size={18} className="mr-2" />
            Главная
          </Button>
        </div>

        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Info" className="text-blue-600" size={24} />
              <div>
                <p className="font-semibold">Требуется авторизация</p>
                <p className="text-sm text-muted-foreground">Войдите или зарегистрируйтесь, чтобы выбрать тариф</p>
              </div>
            </div>
            <Button onClick={() => navigate('/')}>
              Войти
            </Button>
          </div>
        )}
        
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            {isAuthenticated ? 'Шаг 2 из 2' : 'Тарифы'}
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Выберите тарифный план
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Начните с бесплатного тарифа и масштабируйте по мере роста вашего бизнеса
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-primary shadow-xl scale-105'
                  : 'hover:shadow-lg'
              } ${plan.popular ? 'border-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Icon name="Star" size={12} className="mr-1" />
                    Популярный
                  </Badge>
                </div>
              )}
              
              {plan.exclusive && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600">
                    <Icon name="Sparkles" size={12} className="mr-1" />
                    Эксклюзив
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon name={plan.icon as any} className="text-white" size={24} />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.limits}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}₽</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.earning && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      {plan.earning}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Icon
                        name="Check"
                        size={16}
                        className="text-green-600 flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  className="w-full"
                  variant={selectedPlan === plan.id ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={false}
                >
                  {plan.price === 0 ? (
                    'Начать бесплатно'
                  ) : selectedPlan === plan.id ? (
                    <>
                      <Icon name="CheckCircle" size={18} className="mr-2" />
                      Оплатить
                    </>
                  ) : (
                    'Выбрать план'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {isAuthenticated && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Вы можете изменить тариф в любое время в настройках
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              disabled={false}
            >
              Пропустить (использовать Бесплатный)
            </Button>
          </div>
        )}

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" className="text-green-600" />
                Партнёрская программа: Зарабатывайте вместе с нами
              </CardTitle>
              <CardDescription>
                Превратите вашу аудиторию в стабильный доход
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <Icon name="Gift" className="mx-auto text-green-600 mb-2" size={32} />
                    <h3 className="font-semibold">20% комиссия</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    С каждой оплаты рефералов
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <Icon name="Repeat" className="mx-auto text-green-600 mb-2" size={32} />
                    <h3 className="font-semibold">Пожизненные выплаты</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Получайте пока платит реферал
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <Icon name="Store" className="mx-auto text-green-600 mb-2" size={32} />
                    <h3 className="font-semibold">Продажа ботов</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Публикуйте в маркетплейсе
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {paymentPlan && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          plan={paymentPlan}
        />
      )}
    </div>
  );
};

export default PlanSelection;