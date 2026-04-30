import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Условия использования"
      description="Условия использования платформы ИнтеллектПро"
      keywords="пользовательское соглашение, условия использования, ИнтеллектПро"
    >
      <div className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="rings" size={180} />
        </div>

        <Button
          type="button"
          onClick={() => navigate('/legal')}
          className="mb-6 btn-glass-secondary"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад к юридической информации
        </Button>

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-glass-title">
              Пользовательское соглашение
            </h1>
            <p className="text-glass-muted">
              Дата вступления в силу: 1 января 2024 года
            </p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-6 text-[15px] leading-[1.7]">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">1. Общие положения</h2>
              <p className="text-gray-200 leading-relaxed">
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между
                Индивидуальным предпринимателем Дмитриевой Ольгой Анатольевной (далее — «Администрация»)
                и пользователем платформы ИнтеллектПро (далее — «Пользователь»).
              </p>
              <p className="text-gray-200 leading-relaxed mt-3">
                Использование платформы означает полное и безоговорочное принятие Пользователем условий
                настоящего Соглашения. Если Пользователь не согласен с условиями, он должен прекратить
                использование платформы.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">2. Предмет соглашения</h2>
              <p className="text-gray-200 leading-relaxed">
                Администрация предоставляет Пользователю доступ к платформе ИнтеллектПро для создания,
                настройки и управления ИИ-агентами и ИИ-сотрудниками (далее — «Сервис»).
              </p>
              <p className="text-gray-200 leading-relaxed mt-3">
                Сервис предоставляется на условиях выбранного тарифного плана. Функциональность и
                ограничения определяются выбранным тарифом.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">3. Регистрация и учетная запись</h2>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-200">
                <li>Для полноценного использования Сервиса необходима регистрация учетной записи</li>
                <li>Пользователь обязуется предоставлять достоверную информацию при регистрации</li>
                <li>Пользователь несет ответственность за сохранность данных своей учетной записи</li>
                <li>Администрация вправе заблокировать учетную запись при нарушении условий Соглашения</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">4. Права и обязанности пользователя</h2>
              <h3 className="text-xl font-semibold mb-2 text-white">Пользователь имеет право:</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-200 mb-4">
                <li>Использовать функционал Сервиса в рамках выбранного тарифного плана</li>
                <li>Создавать и настраивать ИИ-агентов для своих бизнес-задач</li>
                <li>Получать техническую поддержку в соответствии с условиями тарифа</li>
                <li>Экспортировать созданные данные в предусмотренных форматах</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 text-white">Пользователь обязуется:</h3>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-200">
                <li>Не использовать Сервис в противоправных целях</li>
                <li>Не создавать контент, нарушающий законодательство РФ</li>
                <li>Не пытаться получить несанкционированный доступ к системе</li>
                <li>Своевременно оплачивать выбранный тарифный план</li>
                <li>Не распространять данные доступа третьим лицам</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">5. Оплата услуг</h2>
              <p className="text-gray-200 leading-relaxed">
                Стоимость услуг определяется выбранным тарифным планом. Оплата производится через
                платежную систему ЮKassa с использованием банковских карт, СБП и других доступных способов.
              </p>
              <p className="text-gray-200 leading-relaxed mt-3">
                Подписка продлевается автоматически, если Пользователь не отменил её до окончания
                текущего периода. Возврат средств осуществляется в соответствии с законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">6. Интеллектуальная собственность</h2>
              <p className="text-gray-200 leading-relaxed">
                Все права на платформу ИнтеллектПро, включая исходный код, дизайн, логотипы и товарные
                знаки, принадлежат Администрации.
              </p>
              <p className="text-gray-200 leading-relaxed mt-3">
                Контент, созданный Пользователем с помощью Сервиса, принадлежит Пользователю.
                Администрация не претендует на права использования такого контента.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">7. Ограничение ответственности</h2>
              <p className="text-gray-200 leading-relaxed mb-3">
                Администрация не несет ответственности за:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-2 text-gray-200">
                <li>Перерывы в работе Сервиса, вызванные техническими причинами</li>
                <li>Убытки, возникшие в результате использования или невозможности использования Сервиса</li>
                <li>Контент, создаваемый Пользователем с помощью ИИ-агентов</li>
                <li>Действия третьих лиц, получивших доступ к учетной записи Пользователя</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">8. Изменение условий</h2>
              <p className="text-gray-200 leading-relaxed">
                Администрация вправе вносить изменения в настоящее Соглашение в одностороннем порядке.
                Новая редакция вступает в силу с момента её размещения на сайте. Продолжение использования
                Сервиса после внесения изменений означает согласие с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">9. Заключительные положения</h2>
              <p className="text-gray-200 leading-relaxed">
                Настоящее Соглашение регулируется законодательством Российской Федерации. Все споры
                разрешаются путем переговоров, а при недостижении согласия — в судебном порядке по месту
                нахождения Администрации.
              </p>
            </section>

            <section className="bg-white/5 border border-white/10 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-white">Контактная информация</h3>
              <p className="text-gray-200">
                <strong className="text-white">ИП Дмитриева Ольга Анатольевна</strong><br />
                ИНН: 263504091920<br />
                ОГРН: 318565800079487<br />
                Адрес: 355040, г. Ставрополь, ул. Пирогова д.5/1<br />
                Email:{' '}
                <a
                  href="mailto:support@intellectpro.ru"
                  className="text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  support@intellectpro.ru
                </a>
              </p>
            </section>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default Terms;
