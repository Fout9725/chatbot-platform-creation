import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  botConfig?: any;
  timestamp: Date;
}

interface AIBotBuilderProps {
  mode: 'visual' | 'professional';
  onBotGenerated?: (config: any) => void;
}

const AIBotBuilder = ({ mode, onBotGenerated }: AIBotBuilderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateBot = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('https://functions.poehali.dev/f74c949b-7d94-4880-aedd-ac4442889227', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || 'anonymous'
        },
        body: JSON.stringify({
          prompt: input,
          mode: mode,
          history: conversationHistory
        })
      });

      const data = await response.json();

      if (data.success && data.botConfig) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.botConfig.description || 'Бот успешно создан!',
          botConfig: data.botConfig,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (onBotGenerated) {
          onBotGenerated(data.botConfig);
        }

        toast({
          title: '✨ Бот создан!',
          description: data.botConfig.botName || 'Конфигурация готова к использованию'
        });
      } else {
        throw new Error(data.error || 'Не удалось создать бота');
      }
    } catch (error) {
      console.error('Bot generation error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Извините, произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Попробуйте упростить запрос или повторите позже.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Ошибка',
        description: 'Не удалось создать бота',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateBot();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    toast({
      title: 'История очищена',
      description: 'Можно начать новый диалог'
    });
  };

  const examplePrompts = mode === 'visual' 
    ? [
        'Создай бота для службы поддержки с AI',
        'Нужен бот для приема заказов в Telegram',
        'Бот для рассылки новостей по расписанию',
        'Создай бота с базой знаний (RAG)'
      ]
    : [
        'Создай Python бота с командами /start и /help',
        'Бот для Telegram с кнопками меню',
        'Бот с AI для ответов на вопросы',
        'Создай бота с ConversationHandler'
      ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Sparkles" size={24} className="text-purple-600" />
              ИИ-Агент для создания ботов
            </CardTitle>
            <CardDescription>
              Опишите своего бота — ИИ создаст его автоматически
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={mode === 'visual' ? 'default' : 'secondary'}>
              {mode === 'visual' ? 'Визуальный' : 'Профессиональный'}
            </Badge>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
              >
                <Icon name="Trash2" size={16} className="mr-1" />
                Очистить
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Icon name="Lightbulb" size={20} className="text-purple-600" />
                Как это работает?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
                  Опишите своего бота простым языком
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
                  ИИ-агент создаст полную конфигурацию автоматически
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
                  Вы можете редактировать результат или попросить изменения
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
                  История диалога сохраняется для контекста
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                💡 Примеры запросов:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {examplePrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => setInput(prompt)}
                  >
                    <Icon name="MessageSquare" size={14} className="mr-2 flex-shrink-0" />
                    <span className="text-xs">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="Bot" size={18} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.botConfig && !msg.botConfig.isPlainText && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">
                              📦 {msg.botConfig.botName || 'Конфигурация бота'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {mode === 'visual' ? 'N8N Workflow' : 'Python Code'}
                            </Badge>
                          </div>
                          
                          {msg.botConfig.nodes && (
                            <p className="text-xs text-muted-foreground">
                              {msg.botConfig.nodes.length} нодов • {msg.botConfig.connections?.length || 0} связей
                            </p>
                          )}
                          
                          {msg.botConfig.code && (
                            <p className="text-xs text-muted-foreground">
                              {msg.botConfig.language} • {msg.botConfig.dependencies?.length || 0} зависимостей
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={18} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Icon name="Bot" size={18} className="text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ИИ-агент создает бота...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            placeholder={`Опишите своего бота... (Например: "${examplePrompts[0]}")`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] resize-none"
            disabled={isGenerating}
          />
          <Button
            type="button"
            onClick={generateBot}
            disabled={!input.trim() || isGenerating}
            className="self-end px-6"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Создаю...
              </>
            ) : (
              <>
                <Icon name="Send" size={18} className="mr-2" />
                Создать
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIBotBuilder;