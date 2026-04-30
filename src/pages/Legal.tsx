import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const Legal = () => {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Юридическая информация"
      description="Реквизиты, договоры и юридические документы ИнтеллектПро"
      keywords="юридическая информация, реквизиты, ИП, договоры, ИнтеллектПро"
    >
      <div className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="cube" size={180} />
        </div>

        <Button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 btn-glass-secondary"
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          На главную
        </Button>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-glass-title">
              Юридическая информация
            </h1>
            <p className="text-lg text-glass-muted">
              Сведения об организации и правовые документы
            </p>
          </div>

          <GlassCard className="p-6 md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white mb-1">
                <Icon name="Building" className="text-primary" />
                Информация о компании
              </div>
              <p className="text-sm text-glass-muted">
                Реквизиты индивидуального предпринимателя
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-white">Наименование</h3>
                <p className="text-gray-200">
                  Индивидуальный предприниматель Дмитриева Ольга Анатольевна
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1 text-white">ИНН</h3>
                  <p className="text-gray-200">263504091920</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">ОГРН</h3>
                  <p className="text-gray-200">318565800079487</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">ОКВЭД</h3>
                  <p className="text-gray-200">47.43</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">ОКТМО</h3>
                  <p className="text-gray-200">07701000</p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h3 className="font-semibold mb-2 text-white">Адрес офиса</h3>
                <p className="text-gray-200">
                  355040, г. Ставрополь, ул. Пирогова д.5/1
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white mb-1">
                <Icon name="Landmark" className="text-primary" />
                Банковские реквизиты
              </div>
              <p className="text-sm text-glass-muted">
                Реквизиты для безналичных расчетов
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1 text-white">Клиент</h3>
                <p className="text-gray-200">
                  Индивидуальный предприниматель Дмитриева Ольга Анатольевна
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1 text-white">Расчетный счет</h3>
                  <p className="text-gray-200 font-mono">40802810500004281467</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">БИК</h3>
                  <p className="text-gray-200 font-mono">044525974</p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h3 className="font-semibold mb-2 text-white">Банк</h3>
                <p className="text-gray-200">АО «Тинькофф Банк»</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-white">Корреспондентский счет</h3>
                <p className="text-gray-200 font-mono">
                  30101810145250000974
                </p>
                <p className="text-sm text-glass-muted mt-1">
                  в АО «Тинькофф Банк» Москва, 127287, ул. Хуторская 2-я, д. 38А, стр. 26
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-white mb-1">
                <Icon name="FileText" className="text-primary" />
                Правовые документы
              </div>
              <p className="text-sm text-glass-muted">
                Документы, регулирующие использование платформы
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/terms')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon name="FileText" className="text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-white">Пользовательское соглашение</p>
                    <p className="text-sm text-glass-muted">Условия использования сервиса</p>
                  </div>
                </div>
                <Icon name="ChevronRight" size={18} className="text-glass-muted" />
              </button>

              <button
                onClick={() => navigate('/privacy')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon name="Shield" className="text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-white">Политика конфиденциальности</p>
                    <p className="text-sm text-glass-muted">Обработка персональных данных</p>
                  </div>
                </div>
                <Icon name="ChevronRight" size={18} className="text-glass-muted" />
              </button>

              <button
                onClick={() => navigate('/oferta')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon name="ScrollText" className="text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-white">Публичная оферта</p>
                    <p className="text-sm text-glass-muted">Договор оказания услуг</p>
                  </div>
                </div>
                <Icon name="ChevronRight" size={18} className="text-glass-muted" />
              </button>
            </div>
          </GlassCard>

          <GlassCard variant="accent" className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <Icon name="CreditCard" className="text-blue-300" />
              Оплата и безопасность
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-white">Безопасные платежи</p>
                  <p className="text-sm text-glass-muted">
                    Все платежи проходят через ЮKassa — надёжную российскую платёжную систему
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-white">Способы оплаты</p>
                  <p className="text-sm text-glass-muted">
                    Банковские карты, СБП, Apple Pay, Google Pay
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-white">3D-Secure</p>
                  <p className="text-sm text-glass-muted">
                    Дополнительная защита при совершении платежей
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="Check" className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-white">Фискальный чек</p>
                  <p className="text-sm text-glass-muted">
                    Выдаётся автоматически в соответствии с 54-ФЗ
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <Icon name="HelpCircle" className="text-primary" />
              Поддержка
            </div>
            <div className="space-y-4">
              <p className="text-gray-200">
                По всем вопросам, связанным с юридическими аспектами использования платформы,
                вы можете обратиться в нашу службу поддержки:
              </p>

              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                <Icon name="MessageCircle" className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-white">Telegram-сообщество</p>
                  <a
                    href="https://t.me/+QgiLIa1gFRY4Y2Iy"
                    className="text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Присоединиться к чату поддержки
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                <Icon name="Bot" className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-white">ИИ-помощник</p>
                  <p className="text-sm text-glass-muted">
                    Доступен 24/7 прямо на платформе
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default Legal;
