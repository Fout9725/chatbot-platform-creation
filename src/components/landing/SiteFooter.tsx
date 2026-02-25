import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const SiteFooter = () => {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Платформа</h4>
            <ul className="space-y-2.5">
              <li><Link to="/pricing" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Тарифы</Link></li>
              <li><Link to="/docs" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Документация</Link></li>
              <li><Link to="/prompt-engineer" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Промт-Инженер</Link></li>
              <li><Link to="/automation-hub" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Автоматизация</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Инструменты</h4>
            <ul className="space-y-2.5">
              <li><Link to="/my-bots" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Мои боты</Link></li>
              <li><Link to="/img2img" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Редактор изображений</Link></li>
              <li><Link to="/partner-program" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Партнёрская программа</Link></li>
              <li><Link to="/notifications" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Уведомления</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Юридическое</h4>
            <ul className="space-y-2.5">
              <li><Link to="/legal" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Юридическая информация</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Пользовательское соглашение</Link></li>
              <li><Link to="/privacy" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Политика конфиденциальности</Link></li>
              <li><Link to="/oferta" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Публичная оферта</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Контакты</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://t.me/+QgiLIa1gFRY4Y2Iy" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1.5">
                  <Icon name="MessageCircle" size={14} />
                  Telegram-сообщество
                </a>
              </li>
              <li>
                <a href="https://t.me/Fou9725" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1.5">
                  <Icon name="User" size={14} />
                  Администратор
                </a>
              </li>
              <li>
                <a href="mailto:support@intellectpro.ru" className="text-sm text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1.5">
                  <Icon name="Mail" size={14} />
                  support@intellectpro.ru
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-1.5 rounded-lg">
              <Icon name="Bot" className="text-white" size={16} />
            </div>
            <span className="font-semibold text-sm text-gray-900">ИнтеллектПро</span>
          </div>
          <p className="text-xs text-gray-400">&copy; 2024 ИнтеллектПро. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
