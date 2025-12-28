import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Oferta = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/legal')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад к юридической информации
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Публичная оферта
            </h1>
            <p className="text-muted-foreground">
              Договор оказания услуг по предоставлению доступа к платформе ИнтеллектПро
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Дата вступления в силу: 1 января 2024 года
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-3">1. Термины и определения</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Исполнитель</strong> — Индивидуальный предприниматель Дмитриева Ольга Анатольевна, 
                  ИНН 263504091920, ОГРН 318565800079487</li>
                  <li><strong>Заказчик</strong> — физическое или юридическое лицо, принявшее условия настоящей оферты</li>
                  <li><strong>Платформа</strong> — программное обеспечение ИнтеллектПро, доступное по адресу в сети Интернет</li>
                  <li><strong>Услуги</strong> — предоставление доступа к функционалу Платформы согласно выбранному тарифу</li>
                  <li><strong>Акцепт</strong> — полное и безоговорочное принятие условий оферты путем регистрации и оплаты</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. Предмет договора</h2>
                <p className="text-muted-foreground leading-relaxed">
                  2.1. Исполнитель обязуется предоставить Заказчику доступ к Платформе ИнтеллектПро для создания, 
                  настройки и управления ИИ-агентами и ИИ-сотрудниками, а Заказчик обязуется оплатить услуги 
                  в порядке и на условиях, предусмотренных настоящим договором.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  2.2. Услуги предоставляются в соответствии с выбранным Заказчиком тарифным планом, 
                  опубликованным на сайте Платформы.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  2.3. Договор считается заключенным с момента акцепта оферты — регистрации учетной записи 
                  и оплаты выбранного тарифа.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. Стоимость услуг и порядок оплаты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  3.1. Стоимость услуг определяется действующим прайс-листом на момент оплаты и зависит от 
                  выбранного тарифного плана.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  3.2. Оплата производится путем безналичного перевода денежных средств через платежную систему 
                  Prodamus с использованием банковских карт, СБП, Apple Pay, Google Pay.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  3.3. Услуги считаются оплаченными с момента зачисления денежных средств на расчетный счет 
                  Исполнителя.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  3.4. НДС не облагается в связи с применением УСН (упрощенная система налогообложения).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  3.5. Подписка продлевается автоматически на аналогичный период, если Заказчик не отменил 
                  автопродление в личном кабинете до окончания текущего периода.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. Права и обязанности Исполнителя</h2>
                <h3 className="text-xl font-semibold mb-2">4.1. Исполнитель обязуется:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Предоставить доступ к Платформе в течение 24 часов с момента оплаты</li>
                  <li>Обеспечивать работоспособность Платформы не менее 99% времени в месяц</li>
                  <li>Обеспечивать сохранность данных Заказчика</li>
                  <li>Предоставлять техническую поддержку в соответствии с условиями тарифа</li>
                  <li>Уведомлять о плановых технических работах заблаговременно</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">4.2. Исполнитель имеет право:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Изменять функционал Платформы и условия предоставления услуг</li>
                  <li>Приостановить доступ при нарушении условий договора</li>
                  <li>Ограничить доступ при неоплате в установленный срок</li>
                  <li>Привлекать третьих лиц для исполнения обязательств</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. Права и обязанности Заказчика</h2>
                <h3 className="text-xl font-semibold mb-2">5.1. Заказчик обязуется:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Своевременно оплачивать услуги в соответствии с выбранным тарифом</li>
                  <li>Предоставлять достоверную информацию при регистрации</li>
                  <li>Не передавать данные доступа третьим лицам</li>
                  <li>Использовать Платформу в соответствии с законодательством РФ</li>
                  <li>Не создавать контент, нарушающий права третьих лиц</li>
                  <li>Соблюдать условия Пользовательского соглашения</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">5.2. Заказчик имеет право:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Использовать функционал Платформы в рамках выбранного тарифа</li>
                  <li>Получать техническую поддержку</li>
                  <li>Изменять тарифный план в любое время</li>
                  <li>Экспортировать созданные данные</li>
                  <li>Расторгнуть договор в одностороннем порядке</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Ответственность сторон</h2>
                <p className="text-muted-foreground leading-relaxed">
                  6.1. За неисполнение или ненадлежащее исполнение обязательств стороны несут ответственность 
                  в соответствии с законодательством РФ.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  6.2. Исполнитель не несет ответственности за:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Содержание контента, созданного Заказчиком</li>
                  <li>Убытки, возникшие из-за неправильного использования Платформы</li>
                  <li>Перерывы в работе, вызванные действиями третьих лиц</li>
                  <li>Несовместимость Платформы с оборудованием Заказчика</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  6.3. Общая ответственность Исполнителя ограничивается суммой, фактически уплаченной 
                  Заказчиком за последний месяц обслуживания.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Возврат денежных средств</h2>
                <p className="text-muted-foreground leading-relaxed">
                  7.1. Возврат денежных средств возможен в течение 14 дней с момента оплаты при условии, 
                  что Заказчик не использовал функционал Платформы.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  7.2. Для возврата необходимо направить заявление на адрес support@intellectpro.ru с указанием 
                  реквизитов для возврата.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  7.3. Возврат производится в течение 10 рабочих дней с момента получения заявления.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  7.4. При автоматическом продлении подписки возврат не производится, если Заказчик использовал 
                  Платформу в оплаченном периоде.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Конфиденциальность</h2>
                <p className="text-muted-foreground leading-relaxed">
                  8.1. Исполнитель обязуется обеспечивать конфиденциальность персональных данных Заказчика 
                  в соответствии с Политикой конфиденциальности.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  8.2. Заказчик соглашается на обработку персональных данных в целях исполнения договора.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">9. Форс-мажор</h2>
                <p className="text-muted-foreground leading-relaxed">
                  9.1. Стороны освобождаются от ответственности за неисполнение обязательств, вызванное 
                  форс-мажорными обстоятельствами: стихийными бедствиями, военными действиями, изменениями 
                  законодательства, действиями государственных органов.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  9.2. Сторона обязана уведомить другую сторону о наступлении форс-мажора в течение 5 дней.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">10. Срок действия и расторжение договора</h2>
                <p className="text-muted-foreground leading-relaxed">
                  10.1. Договор вступает в силу с момента акцепта оферты и действует до момента расторжения 
                  одной из сторон.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  10.2. Заказчик вправе расторгнуть договор в любое время, отменив подписку в личном кабинете.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  10.3. Исполнитель вправе расторгнуть договор при нарушении Заказчиком условий договора.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  10.4. При расторжении договора денежные средства за неиспользованный период не возвращаются.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">11. Разрешение споров</h2>
                <p className="text-muted-foreground leading-relaxed">
                  11.1. Все споры разрешаются путем переговоров между сторонами.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  11.2. При невозможности достижения согласия споры передаются в суд по месту нахождения 
                  Исполнителя в соответствии с законодательством РФ.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  11.3. Досудебный порядок урегулирования споров является обязательным.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">12. Заключительные положения</h2>
                <p className="text-muted-foreground leading-relaxed">
                  12.1. Настоящая оферта является официальным предложением Исполнителя заключить договор 
                  на указанных условиях.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  12.2. Исполнитель вправе вносить изменения в оферту в одностороннем порядке. Новая редакция 
                  вступает в силу с момента размещения на сайте.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  12.3. Договор регулируется законодательством Российской Федерации.
                </p>
              </section>

              <section className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Реквизиты Исполнителя</h3>
                <p className="text-muted-foreground">
                  <strong>Индивидуальный предприниматель Дмитриева Ольга Анатольевна</strong><br />
                  ИНН: 263504091920<br />
                  ОГРН: 318565800079487<br />
                  ОКВЭД: 47.43<br />
                  Адрес: 355040, г. Ставрополь, ул. Пирогова д.5/1
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Банковские реквизиты:</strong><br />
                  Расчетный счет: 40802810500004281467<br />
                  Банк: АО «Тинькофф Банк»<br />
                  БИК: 044525974<br />
                  Корр. счет: 30101810145250000974
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Контакты:</strong><br />
                  Email: support@intellectpro.ru<br />
                  Техническая поддержка работает ежедневно
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Oferta;
