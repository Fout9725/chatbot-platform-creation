import { Integration } from './types';

export const telegramIntegration: Integration = {
  id: 'telegram-base',
  name: 'Telegram Bot API',
  type: 'telegram',
  status: 'active',
  config: {
    description: 'Интеграция с Telegram через Bot API',
    features: [
      'Отправка и получение сообщений',
      'Inline-кнопки и клавиатуры',
      'Отправка медиа (фото, видео, документы)',
      'Webhook или Long Polling',
      'Группы и каналы'
    ],
    requirements: {
      botToken: 'Токен от @BotFather',
      webhook: 'URL для webhook (опционально)'
    },
    setupSteps: [
      '1. Создайте бота через @BotFather в Telegram',
      '2. Получите токен бота',
      '3. Вставьте токен в настройки интеграции',
      '4. Настройте webhook или используйте polling',
      '5. Активируйте интеграцию'
    ]
  }
};

export const whatsappIntegration: Integration = {
  id: 'whatsapp-business',
  name: 'WhatsApp Business API',
  type: 'whatsapp',
  status: 'active',
  config: {
    description: 'Интеграция с WhatsApp Business API',
    features: [
      'Отправка текстовых сообщений',
      'Шаблонные сообщения',
      'Медиа-файлы',
      'Статусы доставки',
      'Кнопки быстрого ответа'
    ],
    requirements: {
      phoneNumberId: 'ID номера телефона',
      accessToken: 'Токен доступа Facebook',
      businessAccountId: 'ID бизнес-аккаунта'
    },
    setupSteps: [
      '1. Создайте приложение в Facebook Developers',
      '2. Настройте WhatsApp Business API',
      '3. Получите Phone Number ID и токен',
      '4. Вставьте данные в настройки',
      '5. Подтвердите номер телефона'
    ]
  }
};

export const instagramIntegration: Integration = {
  id: 'instagram-messaging',
  name: 'Instagram* Messaging API',
  type: 'instagram',
  status: 'active',
  config: {
    description: 'Интеграция с Instagram* Direct через Facebook API',
    features: [
      'Ответы в Direct',
      'Автоматические приветствия',
      'Комментарии к постам',
      'Story mentions',
      'Быстрые ответы'
    ],
    requirements: {
      pageId: 'ID страницы Instagram*',
      accessToken: 'Токен доступа',
      appId: 'ID приложения Facebook'
    },
    setupSteps: [
      '1. Подключите Instagram* к странице Facebook',
      '2. Создайте приложение в Facebook Developers',
      '3. Получите права instagram_manage_messages',
      '4. Добавьте токен доступа',
      '5. Активируйте интеграцию'
    ]
  }
};

export const vkIntegration: Integration = {
  id: 'vk-community',
  name: 'VK Community Bot',
  type: 'vk',
  status: 'active',
  config: {
    description: 'Интеграция с сообществом ВКонтакте',
    features: [
      'Ответы в личных сообщениях',
      'Клавиатуры и карусели',
      'Отправка фото и видео',
      'Callback API',
      'Комментарии к постам'
    ],
    requirements: {
      groupId: 'ID сообщества',
      accessToken: 'Токен доступа сообщества',
      secretKey: 'Секретный ключ (для Callback API)'
    },
    setupSteps: [
      '1. Создайте сообщество ВКонтакте',
      '2. Включите сообщения сообщества',
      '3. Получите токен доступа в настройках',
      '4. Настройте Callback API',
      '5. Вставьте данные и активируйте'
    ]
  }
};

export const websiteIntegration: Integration = {
  id: 'website-widget',
  name: 'Website Chat Widget',
  type: 'website',
  status: 'active',
  config: {
    description: 'Виджет чата для сайта',
    features: [
      'Всплывающий чат на сайте',
      'Кастомизация цветов и стилей',
      'Приветственные сообщения',
      'Файлы и изображения',
      'Уведомления'
    ],
    requirements: {
      domain: 'Домен сайта',
      embedCode: 'Код для вставки (генерируется автоматически)'
    },
    setupSteps: [
      '1. Скопируйте код виджета',
      '2. Вставьте код перед закрывающим тегом </body>',
      '3. Настройте внешний вид в панели',
      '4. Протестируйте на сайте',
      '5. Опубликуйте изменения'
    ]
  }
};

export const apiIntegration: Integration = {
  id: 'rest-api',
  name: 'REST API',
  type: 'api',
  status: 'active',
  config: {
    description: 'Интеграция через REST API для кастомных приложений',
    features: [
      'Отправка и получение сообщений',
      'Webhook для событий',
      'Управление диалогами',
      'Аналитика',
      'Полная документация'
    ],
    requirements: {
      apiKey: 'API ключ (генерируется в панели)',
      webhookUrl: 'URL для получения событий'
    },
    setupSteps: [
      '1. Сгенерируйте API ключ в настройках',
      '2. Изучите документацию API',
      '3. Настройте webhook для событий',
      '4. Выполните тестовые запросы',
      '5. Интегрируйте в ваше приложение'
    ]
  }
};

export const allIntegrations: Integration[] = [
  telegramIntegration,
  whatsappIntegration,
  instagramIntegration,
  vkIntegration,
  websiteIntegration,
  apiIntegration
];

export function getIntegrationsByType(type: 'telegram' | 'whatsapp' | 'instagram' | 'vk' | 'website' | 'api'): Integration[] {
  return allIntegrations.filter(integration => integration.type === type);
}

export function getIntegrationById(id: string): Integration | undefined {
  return allIntegrations.find(integration => integration.id === id);
}