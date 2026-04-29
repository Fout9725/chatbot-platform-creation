import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const linkClass =
  'text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5';

const SiteFooter = () => {
  return (
    <footer
      className="relative pt-16 pb-8"
      style={{
        background:
          'linear-gradient(180deg, transparent 0%, rgba(10,14,39,0.5) 50%, rgba(10,14,39,0.85) 100%)',
      }}
    >
      <div className="container mx-auto px-4">
        <div
          className="rounded-3xl p-8 md:p-10 mb-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 20px rgba(139,92,246,0.5)',
                  }}
                >
                  <Icon name="Bot" className="text-white" size={18} />
                </div>
                <span
                  className="text-base font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #C4B5FD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ИнтеллектПро
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Платформа аренды и создания ИИ-ботов для бизнеса. 85+ готовых
                решений и визуальный конструктор.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                Платформа
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/catalog" className={linkClass}>
                    Каталог
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className={linkClass}>
                    Отрасли
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className={linkClass}>
                    Тарифы
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className={linkClass}>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                Инструменты
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/my-bots" className={linkClass}>
                    Мои боты
                  </Link>
                </li>
                <li>
                  <Link to="/bot-builder" className={linkClass}>
                    Конструктор
                  </Link>
                </li>
                <li>
                  <Link to="/automation-hub" className={linkClass}>
                    Автоматизация
                  </Link>
                </li>
                <li>
                  <Link to="/prompt-engineer" className={linkClass}>
                    Промт-инженер
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                Юридическое
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/legal" className={linkClass}>
                    Юр. информация
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={linkClass}>
                    Соглашение
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className={linkClass}>
                    Конфиденциальность
                  </Link>
                </li>
                <li>
                  <Link to="/oferta" className={linkClass}>
                    Оферта
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-4">
                Связь
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://t.me/+QgiLIa1gFRY4Y2Iy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <Icon name="MessageCircle" size={14} />
                    Сообщество
                  </a>
                </li>
                <li>
                  <a
                    href="https://t.me/Fou9725"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <Icon name="Send" size={14} />
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@intellectpro.ru"
                    className={linkClass}
                  >
                    <Icon name="Mail" size={14} />
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © 2024 ИнтеллектПро. Все права защищены.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Все системы работают
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
