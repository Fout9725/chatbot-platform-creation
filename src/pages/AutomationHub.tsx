import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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

const ASSISTANT_API_URL = 'https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  platform?: string;
}

export default function AutomationHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleCardClick = (automation: Automation) => {
    if (automation.status === 'ready') {
      navigate(automation.path);
    }
  };

  const handleAiSend = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;

    const userMsg: AiMessage = { role: 'user', content: text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const response = await fetch(ASSISTANT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            platform: 'general',
            workflowJson: null,
            formData: null,
            mode: 'automation_generator'
          }
        })
      });

      if (!response.ok) throw new Error('Ошибка API');

      const data = await response.json();
      const reply = data.reply || data.message || data.content || 'Готово! Выберите платформу и я помогу настроить автоматизацию.';

      const detected = automations.find(a =>
        a.status === 'ready' && (
          text.toLowerCase().includes(a.platform.toLowerCase()) ||
          text.toLowerCase().includes(a.id)
        )
      );

      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        platform: detected?.id
      }]);
    } catch {
      const detected = automations.find(a =>
        a.status === 'ready' && (
          text.toLowerCase().includes(a.platform.toLowerCase()) ||
          text.toLowerCase().includes(a.id)
        )
      );

      let suggestion = '';
      if (detected) {
        suggestion = `Отличная идея! Для ${detected.platform} у нас есть готовая автоматизация «${detected.name}». Нажмите кнопку ниже, чтобы перейти к настройке.`;
      } else if (text.toLowerCase().includes('пост') || text.toLowerCase().includes('контент')) {
        suggestion = 'Для автоматизации постинга рекомендую начать с Instagram или Telegram — у нас готовые workflow с ИИ-генерацией текстов и картинок. Выберите платформу из списка выше.';
      } else if (text.toLowerCase().includes('видео') || text.toLowerCase().includes('ролик')) {
        suggestion = 'Для видео-контента подойдут YouTube (идеи и SEO) или TikTok (короткие ролики). Выберите платформу и я помогу с настройкой.';
      } else {
        suggestion = 'Опишите подробнее, что вы хотите автоматизировать. Например: «Хочу автопостинг в Instagram с генерацией текстов через ИИ» или «Нужна публикация по расписанию в Telegram-канал».';
      }

      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: suggestion,
        platform: detected?.id
      }]);
    } finally {
      setAiLoading(false);
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

        <div data-tour="automation-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <Icon name={automation.icon} className="text-white" size={32} />
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

        <Card className="mt-8 border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50">
          <CardHeader className="cursor-pointer" onClick={() => setAiOpen(!aiOpen)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2.5 rounded-xl">
                  <Icon name="Sparkles" className="text-white" size={22} />
                </div>
                <div>
                  <CardTitle className="text-xl">ИИ-помощник по автоматизациям</CardTitle>
                  <CardDescription>Опишите задачу — я подберу подходящую автоматизацию</CardDescription>
                </div>
              </div>
              <Icon name={aiOpen ? 'ChevronUp' : 'ChevronDown'} size={20} className="text-muted-foreground" />
            </div>
          </CardHeader>

          {aiOpen && (
            <CardContent className="pt-0">
              <div className="bg-white rounded-xl border p-4 mb-4 max-h-80 overflow-y-auto space-y-3">
                {aiMessages.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Icon name="Bot" size={36} className="mx-auto mb-2 text-violet-300" />
                    <p className="text-sm">Расскажите, что хотите автоматизировать, и я помогу выбрать решение</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {['Автопостинг в Instagram', 'Постинг в Telegram-канал', 'Контент для YouTube'].map(q => (
                        <button
                          key={q}
                          onClick={() => { setAiInput(q); }}
                          className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full border border-violet-200 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.platform && msg.role === 'assistant' && (
                        <Button
                          size="sm"
                          className="mt-2 bg-violet-600 hover:bg-violet-700 text-white"
                          onClick={() => {
                            const found = automations.find(a => a.id === msg.platform);
                            if (found) navigate(found.path);
                          }}
                        >
                          <Icon name="ArrowRight" size={14} className="mr-1.5" />
                          Перейти к настройке
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      Думаю...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Например: Хочу автопостинг в Instagram с генерацией текстов..."
                  className="resize-none min-h-[44px] max-h-24"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSend();
                    }
                  }}
                />
                <Button
                  onClick={handleAiSend}
                  disabled={!aiInput.trim() || aiLoading}
                  className="bg-violet-600 hover:bg-violet-700 px-4 shrink-0"
                >
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card data-tour="how-it-works" className="mt-8 border-2 border-primary/20">
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