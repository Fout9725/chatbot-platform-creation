import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Automation {
  id: string;
  name: string;
  description: string;
  platform: string;
  icon: string;
  color: string;
  status: 'ready' | 'soon';
  path: string;
  features: string[];
}

const automations: Automation[] = [
  {
    id: 'instagram',
    name: 'Instagram* Автопостинг',
    description: 'Генерация текста и изображений для постов через ИИ с публикацией по расписанию',
    platform: 'Instagram',
    icon: 'Instagram',
    color: 'from-pink-500 to-purple-600',
    status: 'ready',
    path: '/instagram-automation',
    features: ['Генерация текста через Claude', 'Изображения DALL-E 3', 'Google Sheets', 'n8n workflow']
  },
  {
    id: 'telegram',
    name: 'Telegram Каналы',
    description: 'Автоматическая публикация постов в Telegram-каналы с форматированием и медиа',
    platform: 'Telegram',
    icon: 'Send',
    color: 'from-blue-400 to-blue-600',
    status: 'ready',
    path: '/telegram-automation',
    features: ['Telegram Bot API', 'Markdown форматирование', 'Медиа-группы', 'Отложенная публикация']
  },
  {
    id: 'youtube',
    name: 'YouTube Контент',
    description: 'Генерация идей для видео, названий, описаний и тегов через ИИ-анализ трендов',
    platform: 'YouTube',
    icon: 'Youtube',
    color: 'from-red-500 to-red-700',
    status: 'ready',
    path: '/youtube-automation',
    features: ['Идеи для видео', 'SEO-оптимизация', 'Анализ трендов', 'Теги и описания']
  },
  {
    id: 'vk',
    name: 'ВКонтакте Кросспостинг',
    description: 'Автоматическая публикация контента из других соцсетей в ВК с адаптацией',
    platform: 'ВКонтакте',
    icon: 'Share2',
    color: 'from-blue-500 to-indigo-600',
    status: 'ready',
    path: '/vk-automation',
    features: ['VK API', 'Кросспостинг', 'Адаптация контента', 'Отложенные записи']
  },
  {
    id: 'tiktok',
    name: 'TikTok / Reels / Shorts',
    description: 'Генерация идей для коротких вертикальных видео и трендовых сценариев',
    platform: 'TikTok',
    icon: 'Video',
    color: 'from-pink-400 to-rose-600',
    status: 'ready',
    path: '/tiktok-automation',
    features: ['Идеи для видео', 'Трендовые звуки', 'Хэштеги', 'Сценарии']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Посты',
    description: 'Профессиональный контент для LinkedIn: статьи, карьерные посты, B2B-контент',
    platform: 'LinkedIn',
    icon: 'Briefcase',
    color: 'from-blue-600 to-blue-800',
    status: 'soon',
    path: '#',
    features: ['Бизнес-контент', 'Статьи', 'Нетворкинг', 'B2B тематика']
  },
  {
    id: 'twitter',
    name: 'Twitter/X Треды',
    description: 'Генерация вирусных тредов и постов для Twitter/X с анализом аудитории',
    platform: 'Twitter/X',
    icon: 'MessageSquare',
    color: 'from-gray-700 to-black',
    status: 'soon',
    path: '#',
    features: ['Треды', 'Вирусный контент', 'Аналитика', 'Хэштеги']
  },
  {
    id: 'multichannel',
    name: 'Мультиканальный постинг',
    description: 'Одновременная публикация адаптированного контента во все соцсети',
    platform: 'Все платформы',
    icon: 'Workflow',
    color: 'from-purple-500 to-indigo-600',
    status: 'soon',
    path: '#',
    features: ['Все соцсети', 'Адаптация контента', 'Единое управление', 'Аналитика']
  }
];

export default function AutomationHub() {
  const navigate = useNavigate();

  const handleCardClick = (automation: Automation) => {
    if (automation.status === 'ready') {
      navigate(automation.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Главная
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Zap" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Автоматизации</h1>
                <p className="text-xs text-muted-foreground">SMM и контент-маркетинг</p>
              </div>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Выберите платформу для автоматизации
          </h2>
          <p className="text-lg text-muted-foreground">
            Готовые n8n workflow для автоматизации SMM и контент-маркетинга
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((automation) => (
            <Card
              key={automation.id}
              className={`border-2 transition-all duration-300 ${
                automation.status === 'ready'
                  ? 'hover:shadow-xl hover:scale-105 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleCardClick(automation)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`bg-gradient-to-br ${automation.color} p-3 rounded-xl mb-3`}>
                    <Icon name={automation.icon as any} className="text-white" size={32} />
                  </div>
                  <Badge variant={automation.status === 'ready' ? 'default' : 'secondary'}>
                    {automation.status === 'ready' ? 'Готово' : 'Скоро'}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{automation.name}</CardTitle>
                <CardDescription className="text-sm">{automation.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Sparkles" size={16} />
                    <span>{automation.platform}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {automation.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                {automation.status === 'ready' && (
                  <Button className="w-full mt-4" variant="default">
                    <Icon name="ArrowRight" size={16} className="mr-2" />
                    Настроить
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Info" size={20} />
              Как это работает?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-lg h-fit">
                  <Icon name="Settings" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">1. Настройка</h4>
                  <p className="text-sm text-muted-foreground">
                    Укажите API ключи и параметры автоматизации
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-lg h-fit">
                  <Icon name="Download" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">2. Скачивание</h4>
                  <p className="text-sm text-muted-foreground">
                    Получите готовый n8n workflow в формате JSON
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-lg h-fit">
                  <Icon name="Play" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">3. Запуск</h4>
                  <p className="text-sm text-muted-foreground">
                    Импортируйте в n8n и запустите автоматизацию
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
