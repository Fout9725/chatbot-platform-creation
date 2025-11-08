import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

const Legal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          На главную
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Юридическая информация
            </h1>
            <p className="text-lg text-muted-foreground">
              Сведения об организации и правовые документы
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Building" className="text-primary" />
                Информация о компании
              </CardTitle>
              <CardDescription>
                Реквизиты индивидуального предпринимателя
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Наименование</h3>
                <p className="text-muted-foreground">
                  Индивидуальный предприниматель Дмитриева Ольга Анатольевна
                </p>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">ИНН</h3>
                  <p className="text-muted-foreground">263504091920</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ОГРН</h3>
                  <p className="text-muted-foreground">318565800079487</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ОКВЭД</h3>
                  <p className="text-muted-foreground">47.43</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ОКТМО</h3>
                  <p className="text-muted-foreground">07701000</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Адрес офиса</h3>
                <p className="text-muted-foreground">
                  355040, г. Ставрополь, ул. Пирогова д.5/1
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Landmark" className="text-primary" />
                Банковские реквизиты
              </CardTitle>
              <CardDescription>
                Реквизиты для безналичных расчетов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Клиент</h3>
                <p className="text-muted-foreground">
                  Индивидуальный предприниматель Дмитриева Ольга Анатольевна
                </p>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Расчетный счет</h3>
                  <p className="text-muted-foreground font-mono">40802810500004281467</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">БИК</h3>
                  <p className="text-muted-foreground font-mono">044525974</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Банк</h3>
                <p className="text-muted-foreground">АО «Тинькофф Банк»</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Корреспондентский счет</h3>
                <p className="text-muted-foreground font-mono">
                  30101810145250000974
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  в АО «Тинькофф Банк» Москва, 127287, ул. Хуторская 2-я, д. 38А, стр. 26
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="FileText" className="text-primary" />
                Правовые документы
              </CardTitle>
              <CardDescription>
                Документы, регулирующие использование платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a href="/docs/terms" className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon name="FileText" className="text-primary" />
                    <div>
                      <p className="font-semibold">Пользовательское соглашение</p>
                      <p className="text-sm text-muted-foreground">Условия использования сервиса</p>
                    </div>
                  </div>
                  <Icon name="ExternalLink" size={18} className="text-muted-foreground" />
                </a>

                <a href="/docs/privacy" className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon name="Shield" className="text-primary" />
                    <div>
                      <p className="font-semibold">Политика конфиденциальности</p>
                      <p className="text-sm text-muted-foreground">Обработка персональных данных</p>
                    </div>
                  </div>
                  <Icon name="ExternalLink" size={18} className="text-muted-foreground" />
                </a>

                <a href="/docs/oferta" className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon name="ScrollText" className="text-primary" />
                    <div>
                      <p className="font-semibold">Публичная оферта</p>
                      <p className="text-sm text-muted-foreground">Договор оказания услуг</p>
                    </div>
                  </div>
                  <Icon name="ExternalLink" size={18} className="text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="CreditCard" className="text-blue-600" />
                Оплата и безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold">Безопасные платежи</p>
                  <p className="text-sm text-muted-foreground">
                    Все платежи проходят через ЮKassa — надёжную российскую платёжную систему
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold">Способы оплаты</p>
                  <p className="text-sm text-muted-foreground">
                    Банковские карты, СБП, Apple Pay, Google Pay
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold">3D-Secure</p>
                  <p className="text-sm text-muted-foreground">
                    Дополнительная защита при совершении платежей
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold">Фискальный чек</p>
                  <p className="text-sm text-muted-foreground">
                    Выдаётся автоматически в соответствии с 54-ФЗ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="HelpCircle" className="text-primary" />
                Поддержка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  По всем вопросам, связанным с юридическими аспектами использования платформы, 
                  вы можете обратиться в нашу службу поддержки:
                </p>

                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Icon name="MessageCircle" className="text-primary" size={24} />
                  <div>
                    <p className="font-semibold">Telegram-сообщество</p>
                    <a 
                      href="https://t.me/+QgiLIa1gFRY4Y2Iy" 
                      className="text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Присоединиться к чату поддержки
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Icon name="Bot" className="text-primary" size={24} />
                  <div>
                    <p className="font-semibold">ИИ-помощник</p>
                    <p className="text-sm text-muted-foreground">
                      Доступен 24/7 прямо на платформе
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Legal;