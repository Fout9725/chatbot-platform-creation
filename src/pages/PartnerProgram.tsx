import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const PartnerProgram = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2.5 rounded-xl">
                <Icon name="Users" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Партнёрская программа
                </h1>
                <p className="text-xs text-muted-foreground">
                  Зарабатывайте вместе с нами
                </p>
              </div>
            </div>
            <Link to="/">
              <Button type="button" variant="outline" size="sm" disabled={false}>
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Превратите вашу аудиторию в доход
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Получайте 20% комиссию с каждого платежа ваших рефералов + продавайте готовых ботов в маркетплейсе
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Percent" className="text-green-600" size={32} />
                </div>
                <CardTitle>20% комиссия</CardTitle>
                <CardDescription>
                  С каждого платежа рефералов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  до 100K₽
                </div>
                <p className="text-sm text-muted-foreground">
                  потенциальный доход в месяц
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Repeat" className="text-blue-600" size={32} />
                </div>
                <CardTitle>Пожизненные выплаты</CardTitle>
                <CardDescription>
                  Пока реферал платит
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ∞
                </div>
                <p className="text-sm text-muted-foreground">
                  продолжительность выплат
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Store" className="text-purple-600" size={32} />
                </div>
                <CardTitle>Маркетплейс ботов</CardTitle>
                <CardDescription>
                  Продавайте готовые решения
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  70%
                </div>
                <p className="text-sm text-muted-foreground">
                  вы получаете с продажи
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" className="text-green-600" />
                Как это работает
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                    <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">Регистрируйтесь</h3>
                    <p className="text-sm text-muted-foreground">
                      Выберите тариф "Партнёрский"
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                    <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">Получите ссылку</h3>
                    <p className="text-sm text-muted-foreground">
                      Персональная реферальная ссылка
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                    <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">Приводите людей</h3>
                    <p className="text-sm text-muted-foreground">
                      Делитесь ссылкой в соцсетях
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                    <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg">
                      4
                    </div>
                    <h3 className="font-semibold mb-2">Зарабатывайте</h3>
                    <p className="text-sm text-muted-foreground">
                      20% с каждого платежа
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Тарифы для рефералов</CardTitle>
                <CardDescription>Ваша комиссия с каждого тарифа</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Бесплатный</div>
                    <div className="text-sm text-muted-foreground">0₽/мес</div>
                  </div>
                  <Badge variant="outline">0₽</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">Оптимальный</div>
                    <div className="text-sm text-muted-foreground">990₽/мес</div>
                    <div className="text-xs text-green-600">Скидка на год: 10%</div>
                  </div>
                  <Badge className="bg-blue-600">198₽</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-medium">Премиум</div>
                    <div className="text-sm text-muted-foreground">2,990₽/мес</div>
                    <div className="text-xs text-green-600">Скидка на год: 15%</div>
                  </div>
                  <Badge className="bg-purple-600">598₽</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">Партнёрский</div>
                    <div className="text-sm text-muted-foreground">9,990₽/мес</div>
                    <div className="text-xs text-green-600">Скидка на год: 20%</div>
                  </div>
                  <Badge className="bg-green-600">1,998₽</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Калькулятор дохода</CardTitle>
                <CardDescription>Рассчитайте свой потенциальный доход</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">10 рефералов (Оптимальный)</span>
                    <Badge variant="secondary">1,980₽/мес</Badge>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">50 рефералов (Оптимальный)</span>
                    <Badge variant="secondary">9,900₽/мес</Badge>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">100 рефералов (смешанный)</span>
                    <Badge className="bg-green-600">25,000₽/мес</Badge>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>

                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg">
                  <div className="text-sm mb-1">Потенциал TOP партнёров</div>
                  <div className="text-3xl font-bold">100,000₽+</div>
                  <div className="text-xs opacity-90">в месяц</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle>Продажа ботов в маркетплейсе</CardTitle>
              <CardDescription>
                Дополнительный источник дохода для партнёров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg">
                  <Icon name="Code2" className="text-purple-600 mb-3" size={32} />
                  <h3 className="font-semibold mb-2">Создайте бота</h3>
                  <p className="text-sm text-muted-foreground">
                    Используйте наш конструктор для создания готового решения
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <Icon name="Upload" className="text-purple-600 mb-3" size={32} />
                  <h3 className="font-semibold mb-2">Опубликуйте</h3>
                  <p className="text-sm text-muted-foreground">
                    Загрузите бота в маркетплейс, установите цену
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <Icon name="DollarSign" className="text-purple-600 mb-3" size={32} />
                  <h3 className="font-semibold mb-2">Получайте 70%</h3>
                  <p className="text-sm text-muted-foreground">
                    70% от продажи идёт вам, 30% - платформе
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <Link to="/plan-selection">
              <Button type="button" size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" disabled={false}>
                <Icon name="Rocket" size={20} className="mr-2" />
                Стать партнёром
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Начните зарабатывать уже сегодня
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnerProgram;