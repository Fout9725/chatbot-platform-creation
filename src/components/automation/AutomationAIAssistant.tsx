import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ASSISTANT_API_URL = 'https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f';

interface AutomationAIAssistantProps {
  platform: string;
  workflowJson?: string;
  formData?: Record<string, string>;
  onApplySuggestion?: (updatedJson: string) => void;
}

interface Message {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  suggestions?: Suggestion[];
  timestamp: Date;
}

interface Suggestion {
  label: string;
  description: string;
  updatedJson?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-orange-500 to-pink-600',
  telegram: 'from-blue-400 to-blue-600',
  youtube: 'from-red-500 to-red-700',
  vk: 'from-blue-500 to-indigo-600',
  tiktok: 'from-pink-400 to-rose-600',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  youtube: 'YouTube',
  vk: 'VK',
  tiktok: 'TikTok',
};

const FALLBACK_TIPS: Record<string, Message[]> = {
  instagram: [
    {
      id: 'fb-ig-1',
      role: 'assistant',
      content: 'Оптимальное время для публикаций в Instagram: 9:00-11:00 и 18:00-21:00 по местному времени аудитории. В выходные активность выше на 15-20%.',
      timestamp: new Date(),
    },
    {
      id: 'fb-ig-2',
      role: 'assistant',
      content: 'Рекомендуемые размеры: пост 1080x1080px (квадрат) или 1080x1350px (4:5 портрет). Stories/Reels: 1080x1920px. Используйте до 30 хэштегов, оптимально 8-15 релевантных.',
      timestamp: new Date(),
    },
    {
      id: 'fb-ig-3',
      role: 'assistant',
      content: 'Совет: разделите хэштеги на 3 группы -- высокочастотные (500K+ постов), среднечастотные (50K-500K) и низкочастотные (до 50K). Это повысит охват.',
      timestamp: new Date(),
    },
  ],
  telegram: [
    {
      id: 'fb-tg-1',
      role: 'assistant',
      content: 'Используйте Markdown-форматирование: *жирный*, _курсив_, `код`, [ссылка](url). Telegram поддерживает HTML-разметку через parse_mode: "HTML".',
      timestamp: new Date(),
    },
    {
      id: 'fb-tg-2',
      role: 'assistant',
      content: 'Оптимальная частота постинга: 1-3 поста в день. Лучшее время: 8:00-10:00, 12:00-14:00, 19:00-21:00. Медиа-группы (до 10 фото/видео) повышают вовлечение.',
      timestamp: new Date(),
    },
    {
      id: 'fb-tg-3',
      role: 'assistant',
      content: 'Совет: используйте отложенные сообщения и Silent Messages (disable_notification: true) для ночных публикаций, чтобы не беспокоить подписчиков.',
      timestamp: new Date(),
    },
  ],
  youtube: [
    {
      id: 'fb-yt-1',
      role: 'assistant',
      content: 'SEO-оптимизация: заголовок до 60 символов с ключевым словом в начале. Описание: первые 150 символов критичны -- они видны в поиске. Добавьте таймкоды.',
      timestamp: new Date(),
    },
    {
      id: 'fb-yt-2',
      role: 'assistant',
      content: 'Оптимальная длина описания: 200-500 слов. Используйте 5-15 тегов, включая длинные ключевые фразы. Первый тег должен быть точным ключевым словом.',
      timestamp: new Date(),
    },
    {
      id: 'fb-yt-3',
      role: 'assistant',
      content: 'Совет: добавляйте карточки (cards) в первые 20% видео и конечные заставки (end screens) в последние 20 секунд для удержания аудитории на канале.',
      timestamp: new Date(),
    },
  ],
  vk: [
    {
      id: 'fb-vk-1',
      role: 'assistant',
      content: 'Кросспостинг: настройте автоматическую публикацию в несколько сообществ ВК одновременно. Используйте таймер для разведения постов по времени (интервал 5-10 минут).',
      timestamp: new Date(),
    },
    {
      id: 'fb-vk-2',
      role: 'assistant',
      content: 'Лучшее время для публикации в ВК: будни 12:00-14:00 и 18:00-22:00, выходные 11:00-15:00. Посты с фото получают на 40% больше вовлечения.',
      timestamp: new Date(),
    },
    {
      id: 'fb-vk-3',
      role: 'assistant',
      content: 'Совет: используйте API метод wall.post с параметром publish_date для отложенных публикаций. Добавляйте опросы и кнопки для повышения вовлечения.',
      timestamp: new Date(),
    },
  ],
  tiktok: [
    {
      id: 'fb-tt-1',
      role: 'assistant',
      content: 'Трендовые хэштеги: используйте 3-5 нишевых + 2-3 общих (#fyp, #viral, #рек). Следите за Discover-страницей для актуальных трендов.',
      timestamp: new Date(),
    },
    {
      id: 'fb-tt-2',
      role: 'assistant',
      content: 'Оптимальная длительность: 15-60 секунд для максимального досмотра. Первые 3 секунды решают, останется ли зритель. Вертикальный формат 9:16 обязателен.',
      timestamp: new Date(),
    },
    {
      id: 'fb-tt-3',
      role: 'assistant',
      content: 'Совет: используйте трендовые звуки из библиотеки TikTok -- это увеличивает охват в 2-3 раза. Добавляйте текстовые оверлеи для удержания внимания.',
      timestamp: new Date(),
    },
  ],
};

export default function AutomationAIAssistant({
  platform,
  workflowJson,
  formData,
  onApplySuggestion,
}: AutomationAIAssistantProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const gradientClass = PLATFORM_COLORS[platform] || 'from-gray-500 to-gray-700';
  const platformLabel = PLATFORM_LABELS[platform] || platform;

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  const sendToAPI = useCallback(
    async (userMessage: string): Promise<Message | null> => {
      setIsLoading(true);
      try {
        const response = await fetch(ASSISTANT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: {
              platform,
              workflowJson: workflowJson || null,
              formData: formData || null,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const assistantContent = data.response || data.message || data.text || '';

        if (!assistantContent) {
          throw new Error('Empty response');
        }

        let suggestions: Suggestion[] | undefined;
        if (data.suggestions && Array.isArray(data.suggestions)) {
          suggestions = data.suggestions.map((s: Record<string, string>) => ({
            label: s.label || 'Применить',
            description: s.description || '',
            updatedJson: s.updatedJson,
          }));
        }

        const msg = addMessage({
          role: 'assistant',
          content: assistantContent,
          suggestions,
        });

        return msg;
      } catch {
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [platform, workflowJson, formData, addMessage]
  );

  const loadFallbackTips = useCallback(() => {
    const tips = FALLBACK_TIPS[platform] || FALLBACK_TIPS['instagram'];
    tips.forEach((tip) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === tip.id)) return prev;
        return [...prev, { ...tip, timestamp: new Date() }];
      });
    });
  }, [platform]);

  const handleAction = useCallback(
    async (action: string) => {
      let userMessage = '';

      switch (action) {
        case 'check':
          userMessage = `Проверь автоматизацию для ${platformLabel}. ${workflowJson ? `Вот текущий workflow JSON: ${workflowJson}` : 'Workflow ещё не создан.'}${formData ? ` Данные формы: ${JSON.stringify(formData)}` : ''}. Найди потенциальные проблемы и дай рекомендации на русском языке.`;
          break;
        case 'optimize':
          userMessage = `Оптимизируй автоматизацию для ${platformLabel}. ${workflowJson ? `Текущий workflow: ${workflowJson}` : 'Workflow отсутствует.'}. Предложи конкретные улучшения на русском языке.`;
          break;
        case 'best-practices':
          userMessage = `Покажи лучшие практики автоматизации для платформы ${platformLabel}. Дай 3-5 конкретных рекомендаций на русском языке.`;
          break;
        default:
          return;
      }

      addMessage({ role: 'user', content: userMessage.slice(0, 100) + '...' });

      const result = await sendToAPI(userMessage);

      if (!result) {
        loadFallbackTips();
        addMessage({
          role: 'system',
          content: 'Не удалось подключиться к ИИ-ассистенту. Показаны локальные рекомендации.',
        });
      }
    },
    [platformLabel, workflowJson, formData, addMessage, sendToAPI, loadFallbackTips]
  );

  const handleApplySuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (suggestion.updatedJson && onApplySuggestion) {
        onApplySuggestion(suggestion.updatedJson);
        toast({
          title: 'Изменения применены',
          description: suggestion.label,
        });
      } else {
        toast({
          title: 'Совет принят к сведению',
          description: suggestion.description || suggestion.label,
        });
      }
    },
    [onApplySuggestion, toast]
  );

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full w-14 h-14 shadow-lg bg-gradient-to-br ${gradientClass} hover:opacity-90 transition-all hover:scale-105`}
          size="icon"
        >
          <Icon name="Sparkles" size={24} className="text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] flex flex-col">
      <Card className="flex flex-col h-full shadow-xl border-2 overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${gradientClass} text-white py-3 px-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Bot" size={20} />
              <CardTitle className="text-sm font-semibold text-white">
                ИИ-ассистент -- {platformLabel}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </CardHeader>

        <div className="flex gap-1.5 px-3 py-2 border-b bg-muted/30 flex-shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            disabled={isLoading}
            onClick={() => handleAction('check')}
          >
            <Icon name="ShieldCheck" size={12} className="mr-1" />
            Проверить
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            disabled={isLoading}
            onClick={() => handleAction('optimize')}
          >
            <Icon name="Zap" size={12} className="mr-1" />
            Оптимизировать
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            disabled={isLoading}
            onClick={() => handleAction('best-practices')}
          >
            <Icon name="Lightbulb" size={12} className="mr-1" />
            Практики
          </Button>
        </div>

        <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
          <ScrollArea className="h-[380px]">
            <div className="p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="MessageSquare" size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Нажмите кнопку выше, чтобы получить рекомендации по автоматизации</p>
                  <p className="text-xs mt-1 opacity-70">
                    Ассистент проанализирует вашу настройку для {platformLabel}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary/10 ml-8 text-right'
                      : msg.role === 'system'
                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                        : 'bg-muted/50 mr-4'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="Bot" size={12} className="text-primary" />
                      <span className="text-xs font-medium text-primary">Ассистент</span>
                    </div>
                  )}
                  {msg.role === 'system' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="AlertTriangle" size={12} />
                      <span className="text-xs font-medium">Система</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 bg-background rounded p-2 border"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{suggestion.label}</p>
                            {suggestion.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2 flex-shrink-0"
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            <Icon name="Check" size={10} className="mr-1" />
                            Применить
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg mr-4">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  <span>Анализирую...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t px-3 py-2 flex items-center justify-between bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5">
              {platformLabel}
            </Badge>
            {workflowJson && (
              <Badge variant="secondary" className="text-[10px] h-5">
                Workflow
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2 text-muted-foreground"
            onClick={() => setMessages([])}
          >
            <Icon name="Trash2" size={10} className="mr-1" />
            Очистить
          </Button>
        </div>
      </Card>
    </div>
  );
}