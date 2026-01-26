import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

const Pricing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Бесплатный',
      description: 'Идеально для тестирования',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: '1 ИИ-агент', included: true },
        { text: 'До 100 сообщений/месяц', included: true },
        { text: 'Базовая аналитика', included: true },
        { text: 'Telegram интеграция', included: true },
        { text: 'Конструктор: базовые блоки', included: true },
        { text: '3 шаблона из библиотеки', included: true },
        { text: 'Поддержка сообщества', included: true },
        { text: 'Приоритетная поддержка', included: false },
        { text: 'API интеграции', included: false },
      ],
      popular: false,
    },
    {
      name: 'Оптимальный',
      description: 'Для растущего бизнеса',
      monthlyPrice: 990,
      yearlyPrice: 10692,
      features: [
        { text: 'До 5 ИИ-агентов', included: true },
        { text: 'До 10,000 сообщений/месяц', included: true },
        { text: 'Расширенная аналитика', included: true },
        { text: 'Все интеграции (Telegram, WhatsApp)', included: true },
        { text: 'Конструктор Pro: все блоки', included: true },
        { text: 'N8N шаблоны (20 штук)', included: true },
        { text: 'Создание бота по тексту (5/мес)', included: true },
        { text: 'Приоритетная поддержка', included: true },
        { text: 'API доступ', included: false },
      ],
      popular: true,
    },
    {
      name: 'Премиум',
      description: 'Для профессионалов',
      monthlyPrice: 2990,
      yearlyPrice: 30498,
      features: [
        { text: 'Неограниченное количество ИИ-агентов', included: true },
        { text: 'До 100,000 сообщений/месяц', included: true },
        { text: 'AI-обучение ИИ-агентов', included: true },
        { text: 'Все интеграции + API', included: true },
        { text: 'Конструктор Premium: все блоки + AI', included: true },
        { text: 'Все N8N шаблоны (безлимит)', included: true },
        { text: 'Создание бота по тексту (безлимит)', included: true },
        { text: 'Персональный менеджер', included: true },
        { text: 'Белая метка (White Label)', included: true },
      ],
      popular: false,
    },
    {
      name: 'Партнёрский',
      description: 'Зарабатывайте вместе с нами',
      monthlyPrice: 9990,
      yearlyPrice: 95904,
      features: [
        { text: 'Всё из тарифа Премиум', included: true },
        { text: 'Конструктор Partner: приоритет', included: true },
        { text: 'Заработок на рефералах (20% комиссия)', included: true },
        { text: 'Публикация ИИ-агентов в маркетплейсе', included: true },
        { text: 'Продажа готовых решений', included: true },
        { text: 'Публикация своих N8N шаблонов', included: true },
        { text: 'Персональная партнёрская ссылка', included: true },
        { text: 'Аналитика по рефералам', included: true },
        { text: 'Маркетинговые материалы', included: true },
      ],
      popular: false,
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 'Бесплатно';
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    return `${price.toLocaleString()}₽`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (!isYearly || plan.monthlyPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return `Экономия ${percentage}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button type="button" disabled={false} variant="ghost" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              На главную
            </Button>
            <Button type="button" disabled={false} variant="outline" size="sm">
              <Icon name="User" size={18} className="mr-2" />
              <span className="hidden sm:inline">Войти</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Тарифные планы
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8">
            Выберите подходящий план для вашего бизнеса. Начните бесплатно, обновляйтесь по мере роста.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : ''}>
              Ежемесячно
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : ''}>
              Ежегодно
            </Label>
            {isYearly && (
              <Badge className="bg-green-500 animate-scale-in">Экономия до 20%</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative hover:shadow-xl transition-all duration-300 animate-scale-in ${
                plan.popular ? 'border-2 border-primary shadow-lg md:scale-105' : 'hover:scale-105'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                    Популярный
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{plan.description}</CardDescription>
                <div className="mt-4 md:mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-bold">{getPrice(plan)}</span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-sm text-muted-foreground">/{isYearly ? 'год' : 'мес'}</span>
                    )}
                  </div>
                  {getSavings(plan) && (
                    <Badge variant="outline" className="mt-2 text-xs text-green-600">
                      {getSavings(plan)}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                      <Icon
                        name={feature.included ? 'Check' : 'X'}
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          feature.included ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span className={!feature.included ? 'text-muted-foreground' : ''}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  disabled={false}
                  className={`w-full mt-4 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.monthlyPrice === 0 ? 'Начать бесплатно' : 'Выбрать план'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Icon name="Shield" size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Безопасность данных</CardTitle>
              <CardDescription className="text-sm">
                Шифрование данных и соответствие стандартам безопасности
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-3">
                <Icon name="Headphones" size={24} className="text-secondary" />
              </div>
              <CardTitle className="text-lg">Поддержка 24/7</CardTitle>
              <CardDescription className="text-sm">
                Круглосуточная техническая поддержка для всех клиентов
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3">
                <Icon name="Zap" size={24} className="text-accent" />
              </div>
              <CardTitle className="text-lg">Быстрое развёртывание</CardTitle>
              <CardDescription className="text-sm">
                Запустите бота за 5 минут без технических знаний
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-primary to-secondary text-white border-0 animate-scale-in">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Нужен индивидуальный план?</h3>
                <p className="text-sm md:text-base text-white/90">
                  Свяжитесь с нами для обсуждения корпоративных решений
                </p>
              </div>
              <Button size="lg" variant="secondary" className="whitespace-nowrap">
                <Icon name="Mail" size={18} className="mr-2" />
                Связаться с нами
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Pricing;