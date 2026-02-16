export interface TourStep {
  title: string;
  text: string;
  details: string[];
  mascotMood: 'waving' | 'happy' | 'thinking' | 'excited';
  icon: string;
  color: string;
  selector: string | null;
  position: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

export interface PageTour {
  pageTitle: string;
  pageIcon: string;
  steps: TourStep[];
}

export const tours: Record<string, PageTour> = {
  '/': {
    pageTitle: 'Главная страница',
    pageIcon: 'Home',
    steps: [
      {
        title: 'Добро пожаловать в ИнтеллектПро!',
        text: 'Я — ваш помощник. Проведу экскурсию по платформе. Буду подсвечивать важные элементы прямо на экране.',
        details: [
          'Платформа для создания ИИ-ботов и агентов',
          'Автоматизация соцсетей без программирования',
          'Готовые решения + конструктор',
          'Экскурсия займёт меньше минуты',
        ],
        mascotMood: 'waving',
        icon: 'Rocket',
        color: 'from-violet-500 to-purple-600',
        selector: null,
        position: 'center',
      },
      {
        title: 'Навигация',
        text: 'Верхнее меню — доступ ко всем разделам: автоматизация, документация, уведомления и профиль.',
        details: [
          '«Экскурсия» — запустить тур заново',
          '«Автоматизация» — workflow для соцсетей',
          '«Документация» — справка по платформе',
          '«Войти» — регистрация и авторизация',
        ],
        mascotMood: 'happy',
        icon: 'Navigation',
        color: 'from-blue-500 to-cyan-500',
        selector: 'header',
        position: 'bottom',
      },
      {
        title: 'Маркетплейс ботов',
        text: 'Каталог готовых ИИ-ботов. Выберите бота под задачу и активируйте в один клик.',
        details: [
          'Боты для продаж, поддержки, контента',
          'Рейтинги и описания',
          'Активация в один клик',
          'Бот появится в «Мои боты»',
        ],
        mascotMood: 'happy',
        icon: 'Store',
        color: 'from-emerald-500 to-teal-500',
        selector: '[data-tour="marketplace"]',
        position: 'bottom',
      },
      {
        title: 'Конструктор',
        text: 'Создайте своего бота из блоков — визуально или с кодом. Есть шаблоны для быстрого старта.',
        details: [
          'Визуальный режим — drag & drop',
          'Режим с кодом — полный контроль',
          'Шаблоны для типовых задач',
          'Требуется подписка',
        ],
        mascotMood: 'thinking',
        icon: 'Boxes',
        color: 'from-orange-500 to-amber-500',
        selector: '[data-tour="constructor"]',
        position: 'bottom',
      },
      {
        title: 'Мои боты',
        text: 'Все ваши боты в одном месте — статистика, управление и настройки.',
        details: [
          'Список активных и остановленных ботов',
          'Статистика сообщений',
          'Редактирование настроек',
          'Управление интеграциями',
        ],
        mascotMood: 'happy',
        icon: 'Folder',
        color: 'from-pink-500 to-rose-500',
        selector: '[data-tour="my-bots"]',
        position: 'bottom',
      },
      {
        title: 'Готово!',
        text: 'Теперь вы знаете основы! Начните с маркетплейса или создайте бота в конструкторе. Удачного полёта!',
        details: [
          'Кнопка экскурсовода — внизу справа',
          'Доступна на каждой странице',
          'Покажет подсказки для текущего раздела',
        ],
        mascotMood: 'excited',
        icon: 'PartyPopper',
        color: 'from-violet-500 to-blue-500',
        selector: null,
        position: 'center',
      },
    ],
  },

  '/automation-hub': {
    pageTitle: 'Центр автоматизаций',
    pageIcon: 'Zap',
    steps: [
      {
        title: 'Центр автоматизаций',
        text: 'Здесь собраны готовые workflow для автоматизации соцсетей. Выбирайте платформу и настраивайте под себя.',
        details: [
          'Готовые автоматизации для 5+ платформ',
          'Генерация контента с помощью ИИ',
          'Публикация по расписанию',
          'Экспорт в n8n',
        ],
        mascotMood: 'waving',
        icon: 'Zap',
        color: 'from-orange-500 to-amber-500',
        selector: null,
        position: 'center',
      },
      {
        title: 'Карточки платформ',
        text: 'Каждая карточка — отдельная платформа. Зелёный бейдж «Готово» означает, что автоматизация готова к использованию.',
        details: [
          'Instagram — автопостинг с ИИ-текстами и картинками',
          'Telegram — боты и каналы',
          'YouTube — генерация идей для видео',
          'VK, TikTok — в разработке',
        ],
        mascotMood: 'happy',
        icon: 'LayoutGrid',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="automation-cards"]',
        position: 'bottom',
      },
      {
        title: 'Как это работает',
        text: 'Внизу страницы — схема из 3 шагов: настройка → скачивание JSON → импорт в n8n.',
        details: [
          'Заполняете API-ключи и настройки',
          'Скачиваете готовый JSON-файл',
          'Импортируете в n8n и активируете',
        ],
        mascotMood: 'thinking',
        icon: 'HelpCircle',
        color: 'from-emerald-500 to-teal-500',
        selector: '[data-tour="how-it-works"]',
        position: 'top',
      },
    ],
  },

  '/instagram-automation': {
    pageTitle: 'Instagram автоматизация',
    pageIcon: 'Instagram',
    steps: [
      {
        title: 'Instagram автоматизация',
        text: 'Настройте автоматическую генерацию и публикацию контента в Instagram с помощью ИИ.',
        details: [
          'Claude генерирует тексты постов',
          'DALL-E 3 создаёт изображения',
          'Публикация по расписанию через n8n',
          'Данные берутся из Google Sheets',
        ],
        mascotMood: 'waving',
        icon: 'Instagram',
        color: 'from-pink-500 to-purple-500',
        selector: null,
        position: 'center',
      },
      {
        title: 'Вкладка «Шаблоны»',
        text: 'Готовые шаблоны автоматизаций — выберите подходящий и заполните пару полей.',
        details: [
          'Шаблоны разной сложности',
          'Фильтр по категориям',
          'Заполняете параметры и генерируете JSON',
        ],
        mascotMood: 'happy',
        icon: 'LayoutGrid',
        color: 'from-violet-500 to-purple-600',
        selector: '[data-tour="tab-templates"]',
        position: 'bottom',
      },
      {
        title: 'Вкладка «Instagram»',
        text: 'Кастомная настройка — укажите все API-ключи, Google Sheet ID и расписание вручную.',
        details: [
          'Anthropic API Key — для текстов',
          'OpenAI API Key — для картинок',
          'Google Sheet ID — источник данных',
          'Кнопка проверки валидирует ключи',
        ],
        mascotMood: 'thinking',
        icon: 'Settings',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="tab-instagram"]',
        position: 'bottom',
      },
      {
        title: 'Вкладка «Workflow»',
        text: 'Здесь появится сгенерированный JSON — скачайте его или скопируйте для импорта в n8n.',
        details: [
          'Скачать как файл n8n-workflow.json',
          'Скопировать в буфер обмена',
          'Все ваши данные уже встроены',
        ],
        mascotMood: 'happy',
        icon: 'Code',
        color: 'from-emerald-500 to-teal-500',
        selector: '[data-tour="tab-workflow"]',
        position: 'bottom',
      },
      {
        title: 'Вкладка «Инструкция»',
        text: 'Подробный гайд по импорту в n8n — визуальный или пошаговый формат на выбор.',
        details: [
          'Два формата инструкции',
          'Как установить n8n',
          'Как импортировать JSON',
          'Как активировать workflow',
        ],
        mascotMood: 'excited',
        icon: 'BookOpen',
        color: 'from-orange-500 to-amber-500',
        selector: '[data-tour="tab-instructions"]',
        position: 'bottom',
      },
    ],
  },

  '/telegram-automation': {
    pageTitle: 'Telegram автоматизация',
    pageIcon: 'Send',
    steps: [
      {
        title: 'Telegram автоматизация',
        text: 'Создайте автоматический постинг в Telegram-каналы с помощью ботов и ИИ.',
        details: [
          'Автопостинг в каналы по расписанию',
          'Интеграция с Google Sheets',
          'Генерация контента через ИИ',
        ],
        mascotMood: 'waving',
        icon: 'Send',
        color: 'from-blue-500 to-cyan-500',
        selector: null,
        position: 'center',
      },
      {
        title: 'Настройка бота',
        text: 'Укажите токен бота от @BotFather, ID канала и расписание публикаций.',
        details: [
          'Bot Token — от @BotFather в Telegram',
          'ID канала — @username или числовой ID',
          'Google Sheet ID — опционально',
          'Время публикации — ежедневно',
        ],
        mascotMood: 'thinking',
        icon: 'Settings',
        color: 'from-violet-500 to-purple-600',
        selector: '[data-tour="tg-setup"]',
        position: 'bottom',
      },
    ],
  },

  '/dashboard': {
    pageTitle: 'Личный кабинет',
    pageIcon: 'LayoutDashboard',
    steps: [
      {
        title: 'Личный кабинет',
        text: 'Ваш центр управления — статистика, боты и быстрые действия в одном месте.',
        details: [
          'Обзор всех ваших ботов',
          'Статистика сообщений и пользователей',
          'Управление подпиской',
          'Быстрый доступ к действиям',
        ],
        mascotMood: 'waving',
        icon: 'LayoutDashboard',
        color: 'from-violet-500 to-purple-600',
        selector: null,
        position: 'center',
      },
      {
        title: 'Статистика',
        text: 'Четыре карточки с ключевыми метриками: боты, пользователи, сообщения и доход.',
        details: [
          'Всего ботов / лимит по тарифу',
          'Активные пользователи',
          'Сообщений за месяц',
          'Заработок (если подключён)',
        ],
        mascotMood: 'happy',
        icon: 'BarChart3',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="dashboard-stats"]',
        position: 'bottom',
      },
      {
        title: 'Быстрые действия',
        text: 'Вкладки внизу — быстрый доступ к ботам, маркетплейсу и партнёрской программе.',
        details: [
          '«Быстрые действия» — создать бота, шаблоны',
          '«Мои боты» — управление',
          '«Маркетплейс» — каталог',
          '«Партнёрство» — реферальная программа',
        ],
        mascotMood: 'thinking',
        icon: 'Zap',
        color: 'from-emerald-500 to-teal-500',
        selector: '[data-tour="dashboard-tabs"]',
        position: 'top',
      },
    ],
  },

  '/pricing': {
    pageTitle: 'Тарифы',
    pageIcon: 'CreditCard',
    steps: [
      {
        title: 'Тарифные планы',
        text: 'Выберите план под ваши задачи — от бесплатного до корпоративного.',
        details: [
          '4 тарифных плана',
          'Оплата помесячно или за год',
          'Годовая подписка — скидка до 20%',
          'Бесплатный план для старта',
        ],
        mascotMood: 'waving',
        icon: 'CreditCard',
        color: 'from-violet-500 to-purple-600',
        selector: null,
        position: 'center',
      },
      {
        title: 'Переключатель периода',
        text: 'Переключайтесь между месячной и годовой оплатой. При годовой — экономия до 20%.',
        details: [
          'Месячная — без обязательств',
          'Годовая — выгоднее',
          'Бейдж показывает размер скидки',
        ],
        mascotMood: 'thinking',
        icon: 'ToggleLeft',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="pricing-toggle"]',
        position: 'bottom',
      },
      {
        title: 'Карточки тарифов',
        text: 'Сравните возможности: количество ботов, лимиты сообщений, доступ к ИИ и поддержку.',
        details: [
          'Бесплатный — 1 бот, базовые функции',
          'Стартап — больше ботов и ИИ',
          'Бизнес — популярный, полный доступ',
          'Корпоративный — без ограничений',
        ],
        mascotMood: 'excited',
        icon: 'Layers',
        color: 'from-emerald-500 to-teal-500',
        selector: '[data-tour="pricing-cards"]',
        position: 'top',
      },
    ],
  },

  '/my-bots': {
    pageTitle: 'Мои боты',
    pageIcon: 'Bot',
    steps: [
      {
        title: 'Мои боты',
        text: 'Здесь хранятся все ваши боты — активированные из маркетплейса и созданные в конструкторе.',
        details: [
          'Список всех ботов',
          'Статус: активен / остановлен',
          'Переход к настройкам бота',
        ],
        mascotMood: 'waving',
        icon: 'Bot',
        color: 'from-violet-500 to-purple-600',
        selector: null,
        position: 'center',
      },
      {
        title: 'Вкладки',
        text: '«Мои боты» — список ваших ботов. «Интеграции» — подключение мессенджеров.',
        details: [
          'Мои боты — управление ботами',
          'Интеграции — Telegram, VK, WhatsApp',
          'Подключение каналов общения',
        ],
        mascotMood: 'happy',
        icon: 'Tabs',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="mybots-tabs"]',
        position: 'bottom',
      },
    ],
  },

  '/profile': {
    pageTitle: 'Профиль',
    pageIcon: 'User',
    steps: [
      {
        title: 'Ваш профиль',
        text: 'Управляйте аккаунтом — имя, аватар, подписка и платёжная история.',
        details: [
          'Смена имени и email',
          'Выбор аватара',
          'Информация о тарифе',
          'История платежей',
        ],
        mascotMood: 'waving',
        icon: 'User',
        color: 'from-pink-500 to-rose-500',
        selector: null,
        position: 'center',
      },
      {
        title: 'Боковая панель',
        text: 'Слева — аватар и основная информация. Можно сменить фото профиля.',
        details: [
          'Нажмите на аватар для смены',
          '18 вариантов на выбор',
          'Кнопка выхода из аккаунта',
        ],
        mascotMood: 'happy',
        icon: 'UserCircle',
        color: 'from-violet-500 to-purple-600',
        selector: '[data-tour="profile-sidebar"]',
        position: 'right',
      },
      {
        title: 'Настройки',
        text: 'В центре — вкладки с настройками аккаунта, тарифа и платежей.',
        details: [
          'Аккаунт — личные данные',
          'Тариф — текущий план',
          'Платежи — история транзакций',
          'Настройки — уведомления, тема',
        ],
        mascotMood: 'thinking',
        icon: 'Settings',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="profile-tabs"]',
        position: 'left',
      },
    ],
  },

  '/bot-builder': {
    pageTitle: 'Конструктор ИИ-агентов',
    pageIcon: 'Cpu',
    steps: [
      {
        title: 'Конструктор ИИ-агентов',
        text: 'Создайте бота тремя способами: опишите задачу текстом, выберите шаблон или соберите визуально.',
        details: [
          'Текст → бот: опишите, что нужно',
          'Шаблоны: готовые заготовки',
          'Визуальный: drag & drop блоки',
        ],
        mascotMood: 'waving',
        icon: 'Cpu',
        color: 'from-violet-500 to-purple-600',
        selector: null,
        position: 'center',
      },
      {
        title: 'Режимы создания',
        text: 'Переключайтесь между вкладками — каждый способ подходит для разных задач.',
        details: [
          '«Текст → Бот» — самый быстрый способ',
          '«Шаблоны» — проверенные решения',
          '«Визуальный» — гибкая настройка',
        ],
        mascotMood: 'thinking',
        icon: 'Layers',
        color: 'from-blue-500 to-cyan-500',
        selector: '[data-tour="builder-tabs"]',
        position: 'bottom',
      },
    ],
  },

  '/constructor': {
    pageTitle: 'Конструктор ботов',
    pageIcon: 'Wrench',
    steps: [
      {
        title: 'Конструктор ботов',
        text: 'Профессиональный или визуальный режим — выбирайте как удобнее.',
        details: [
          'Профессиональный — ИИ-агент + код',
          'Визуальный — ИИ-агент + блоки',
          'Оба режима поддерживают ИИ-генерацию',
        ],
        mascotMood: 'waving',
        icon: 'Wrench',
        color: 'from-emerald-500 to-teal-500',
        selector: null,
        position: 'center',
      },
      {
        title: 'Вкладки редактора',
        text: 'ИИ-Агент — опишите бота и он сгенерируется. Второй таб — ручное редактирование.',
        details: [
          'ИИ-Агент: описание → генерация',
          'Код / Визуальный: ручная настройка',
        ],
        mascotMood: 'thinking',
        icon: 'Code',
        color: 'from-violet-500 to-purple-600',
        selector: '[data-tour="constructor-tabs"]',
        position: 'bottom',
      },
    ],
  },
};
