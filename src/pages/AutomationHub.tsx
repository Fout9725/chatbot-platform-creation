import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

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
    <PageLayout
      title="Хаб автоматизации"
      description="Автоматизация Instagram, Telegram, VK, YouTube, TikTok"
      keywords="автоматизация, Instagram, Telegram, VK, YouTube, TikTok, SMM, n8n"
    >
      <header className="border-b glass-divider glass-panel-subtle sticky top-0 z-10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Главная
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Zap" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-glass-title">Автоматизации</h1>
                <p className="text-xs text-glass-muted">SMM и контент-маркетинг</p>
              </div>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="rings" size={240} />
        </div>
        <div className="mb-8 relative z-10">
          <h2 className="text-3xl font-bold mb-3 text-glass-title">
            Выберите платформу для автоматизации
          </h2>
          <p className="text-lg text-glass-muted">
            Готовые n8n workflow для автоматизации SMM и контент-маркетинга
          </p>
        </div>

        <div data-tour="automation-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {automations.map((automation) => (
            <GlassCard
              key={automation.id}
              variant="subtle"
              className={`p-6 transition-all duration-300 ${
                automation.status === 'ready'
                  ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleCardClick(automation)}
            >
              <div className="flex items-start justify-between">
                <div className={`bg-gradient-to-br ${automation.color} p-3 rounded-xl mb-3`}>
                  <Icon name={automation.icon} className="text-white" size={32} />
                </div>
                <Badge
                  className={
                    automation.status === 'ready'
                      ? 'bg-primary/30 text-white border border-primary/50'
                      : 'bg-white/10 text-gray-300 border border-white/15'
                  }
                >
                  {automation.status === 'ready' ? 'Готово' : 'Скоро'}
                </Badge>
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">{automation.name}</h3>
              <p className="text-sm text-glass-muted mb-3">{automation.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-glass-muted">
                  <Icon name="Sparkles" size={16} />
                  <span>{automation.platform}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {automation.features.map((feature, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs border-white/15 text-gray-200 bg-white/5"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              {automation.status === 'ready' && (
                <Button className="w-full mt-4 btn-glass-primary">
                  <Icon name="ArrowRight" size={16} className="mr-2" />
                  Настроить
                </Button>
              )}
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="accent" className="mt-8 relative z-10">
          <div
            className="cursor-pointer p-6"
            onClick={() => setAiOpen(!aiOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2.5 rounded-xl">
                  <Icon name="Sparkles" className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-glass-title">ИИ-помощник по автоматизациям</h3>
                  <p className="text-sm text-glass-muted">Опишите задачу — я подберу подходящую автоматизацию</p>
                </div>
              </div>
              <Icon name={aiOpen ? 'ChevronUp' : 'ChevronDown'} size={20} className="text-glass-muted" />
            </div>
          </div>

          {aiOpen && (
            <div className="px-6 pb-6">
              <div className="glass-panel-subtle rounded-xl border border-white/10 p-4 mb-4 max-h-80 overflow-y-auto space-y-3">
                {aiMessages.length === 0 && (
                  <div className="text-center py-6 text-glass-muted">
                    <Icon name="Bot" size={36} className="mx-auto mb-2 text-violet-300" />
                    <p className="text-sm">Расскажите, что хотите автоматизировать, и я помогу выбрать решение</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {['Автопостинг в Instagram', 'Постинг в Telegram-канал', 'Контент для YouTube'].map(q => (
                        <button
                          key={q}
                          onClick={() => { setAiInput(q); }}
                          className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 px-3 py-1.5 rounded-full border border-violet-400/30 transition-colors"
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
                        : 'bg-white/10 text-gray-100 border border-white/10'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.platform && msg.role === 'assistant' && (
                        <Button
                          size="sm"
                          className="mt-2 btn-glass-primary"
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
                    <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-300 flex items-center gap-2">
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
                  className="resize-none min-h-[44px] max-h-24 glass-input"
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
                  className="btn-glass-primary px-4 shrink-0"
                >
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard variant="subtle" data-tour="how-it-works" className="mt-8 p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Info" size={20} className="text-primary" />
            <h3 className="text-xl font-semibold text-glass-title">Как это работает?</h3>
          </div>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="bg-primary/20 p-2 rounded-lg h-fit">
                  <Icon name="Settings" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">1. Настройка</h4>
                  <p className="text-sm text-glass-muted">
                    Укажите API ключи и параметры автоматизации
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/20 p-2 rounded-lg h-fit">
                  <Icon name="Download" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">2. Скачивание</h4>
                  <p className="text-sm text-glass-muted">
                    Получите готовый n8n workflow в формате JSON
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/20 p-2 rounded-lg h-fit">
                  <Icon name="Play" size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">3. Запуск</h4>
                  <p className="text-sm text-glass-muted">
                    Импортируйте в n8n и запустите автоматизацию
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </main>
    </PageLayout>
  );
}