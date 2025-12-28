import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Privacy = () => {
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
              Политика конфиденциальности
            </h1>
            <p className="text-muted-foreground">
              Дата вступления в силу: 1 января 2024 года
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-3">1. Общие положения</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных 
                  данных пользователей платформы ИнтеллектПро (далее — «Платформа»), принадлежащей 
                  Индивидуальному предпринимателю Дмитриевой Ольге Анатольевне (далее — «Оператор»).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Используя Платформу, Пользователь соглашается с условиями настоящей Политики и дает 
                  согласие на обработку своих персональных данных в целях, указанных в настоящей Политике.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. Собираемые данные</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  В процессе использования Платформы мы собираем следующие категории данных:
                </p>

                <h3 className="text-xl font-semibold mb-2">2.1 Персональные данные при регистрации:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Имя и фамилия</li>
                  <li>Адрес электронной почты</li>
                  <li>Номер телефона (опционально)</li>
                  <li>Название организации (при наличии)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">2.2 Технические данные:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>IP-адрес</li>
                  <li>Данные браузера и устройства</li>
                  <li>Информация о посещенных страницах</li>
                  <li>Время и продолжительность сеансов</li>
                  <li>Cookies и локальное хранилище браузера</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">2.3 Данные использования:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Информация о созданных ИИ-агентах и их настройках</li>
                  <li>История использования функционала Платформы</li>
                  <li>Сообщения в службу поддержки</li>
                  <li>Платежная информация (обрабатывается платежной системой Prodamus)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. Цели обработки данных</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Мы обрабатываем персональные данные в следующих целях:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Предоставление доступа к Платформе и её функционалу</li>
                  <li>Идентификация и аутентификация Пользователя</li>
                  <li>Обработка платежей и ведение финансового учета</li>
                  <li>Предоставление технической поддержки</li>
                  <li>Улучшение качества услуг и разработка новых функций</li>
                  <li>Отправка уведомлений о работе Платформы</li>
                  <li>Рассылка маркетинговых материалов (с согласия Пользователя)</li>
                  <li>Анализ статистики использования Платформы</li>
                  <li>Защита от мошенничества и злоупотреблений</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. Правовые основания обработки</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Обработка персональных данных осуществляется на основании:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Согласия Пользователя на обработку персональных данных</li>
                  <li>Необходимости исполнения договора с Пользователем</li>
                  <li>Выполнения возложенных законодательством РФ обязанностей</li>
                  <li>Законных интересов Оператора</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. Передача данных третьим лицам</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Мы не продаем и не передаем персональные данные Пользователей третьим лицам, за исключением:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Платежная система Prodamus</strong> — для обработки платежей</li>
                  <li><strong>Яндекс.Облако</strong> — для хранения данных и хостинга Платформы</li>
                  <li><strong>Яндекс.Метрика</strong> — для аналитики посещаемости</li>
                  <li><strong>Сервисы электронной почты</strong> — для отправки уведомлений</li>
                  <li><strong>Государственные органы</strong> — при наличии законных оснований</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Все третьи лица обязаны обеспечивать конфиденциальность и безопасность переданных данных.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Защита персональных данных</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Мы применяем организационные и технические меры для защиты данных:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Шифрование передачи данных по протоколу HTTPS/SSL</li>
                  <li>Хеширование паролей с использованием современных алгоритмов</li>
                  <li>Регулярное резервное копирование данных</li>
                  <li>Ограничение доступа к персональным данным для сотрудников</li>
                  <li>Мониторинг безопасности и защита от несанкционированного доступа</li>
                  <li>Использование проверенной облачной инфраструктуры Яндекс.Облако</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Cookies и технологии отслеживания</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Платформа использует cookies для улучшения пользовательского опыта, сохранения настроек 
                  и анализа статистики. Пользователь может отключить cookies в настройках браузера, однако 
                  это может ограничить функциональность Платформы.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Мы используем Яндекс.Метрику для анализа посещаемости. Данные собираются в обезличенной форме.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Права пользователя</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  В соответствии с законодательством РФ Пользователь имеет право:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Получать информацию о своих персональных данных</li>
                  <li>Требовать уточнения, блокирования или удаления своих данных</li>
                  <li>Отозвать согласие на обработку персональных данных</li>
                  <li>Ограничить обработку своих данных</li>
                  <li>Получать копию своих данных в машиночитаемом формате</li>
                  <li>Обжаловать действия Оператора в надзорных органах</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Для реализации своих прав обратитесь по адресу: support@intellectpro.ru
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">9. Хранение данных</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Персональные данные хранятся в течение срока, необходимого для достижения целей обработки, 
                  или до момента отзыва согласия Пользователем. После прекращения использования Платформы 
                  данные могут храниться в архивных целях в течение сроков, установленных законодательством РФ.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">10. Изменения в политике</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Оператор вправе вносить изменения в настоящую Политику конфиденциальности. Новая редакция 
                  вступает в силу с момента размещения на сайте. Пользователь обязуется самостоятельно 
                  отслеживать изменения.
                </p>
              </section>

              <section className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Контактная информация оператора</h3>
                <p className="text-muted-foreground">
                  <strong>ИП Дмитриева Ольга Анатольевна</strong><br />
                  ИНН: 263504091920<br />
                  ОГРН: 318565800079487<br />
                  Адрес: 355040, г. Ставрополь, ул. Пирогова д.5/1<br />
                  Email: support@intellectpro.ru
                </p>
                <p className="text-muted-foreground mt-3">
                  По вопросам обработки персональных данных обращайтесь по указанному адресу электронной почты.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
