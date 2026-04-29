import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface Message {
  sender: 'user' | 'assistant';
  message: string;
  created_at?: string;
  canContinue?: boolean;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-assistant-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('ai-assistant-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();
    
    if (now - dismissedTime > 10 * 60 * 1000) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > 0) {
      localStorage.setItem('ai-assistant-history', JSON.stringify(messages));
    }
  }, [messages]);

  const trackAction = async (actionType: string, actionData: Record<string, unknown>) => {
    try {
      const apiUrl = localStorage.getItem('api-url') || '/api';
      await fetch(`${apiUrl}/assistant/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({
          action_type: actionType,
          action_data: actionData,
          page_url: window.location.pathname
        })
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  const continueMessage = async () => {
    setIsLoading(true);
    await trackAction('chat_continue', {});

    try {
      const lastMessage = messages[messages.length - 1];
      const response = await fetch('https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Продолжи ответ',
          context: lastMessage.message
        })
      });

      const data = await response.json();
      
      const continuedMessage: Message = {
        sender: 'assistant',
        message: data.response || 'Извините, не могу продолжить.',
        canContinue: data.truncated || false
      };

      setMessages(prev => [...prev, continuedMessage]);
    } catch (error) {
      console.error('Error continuing message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      message: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    await trackAction('chat_message', { message: currentMessage });

    try {
      console.log('Sending message to assistant:', currentMessage);
      const response = await fetch('https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: currentMessage })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      const assistantMessage: Message = {
        sender: 'assistant',
        message: data.response || 'Извините, не могу ответить прямо сейчас.',
        canContinue: data.truncated || false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI assistant:', error);
      const errorMessage: Message = {
        sender: 'assistant',
        message: 'Произошла ошибка. Вы можете связаться с главным администратором:\n\n👤 Сляднев Владимир Сергеевич\n📧 s89624027661@yandex.ru\n✈️ Telegram: @Fou9725\n\nИли обратитесь в поддержку: https://t.me/+QgiLIa1gFRY4Y2Iy'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowGreeting(false);
    setIsOpen(false);
    localStorage.setItem('ai-assistant-dismissed', Date.now().toString());
    trackAction('assistant_dismissed', {});
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowGreeting(false);
    trackAction('assistant_opened', {});
  };

  const Avatar3D = ({ size = 56 }: { size?: number }) => (
    <div
      className="relative"
      style={{ width: size, height: size, perspective: '600px' }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)',
          filter: 'blur(8px)',
          animation: 'aiGlowPulse 2.4s ease-in-out infinite',
        }}
      />
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px dashed rgba(168,85,247,0.6)',
          animation: 'aiOrbit 10s linear infinite',
        }}
      />
      <span
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{
          border: '1px dashed rgba(99,102,241,0.4)',
          animation: 'aiOrbit 14s linear infinite reverse',
        }}
      />
      <span
        className="relative z-10 flex items-center justify-center w-full h-full rounded-full"
        style={{
          background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
          boxShadow:
            '0 12px 30px -8px rgba(168,85,247,0.7), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -4px 12px rgba(99,102,241,0.5)',
          animation: 'aiBob 3.5s ease-in-out infinite',
        }}
      >
        <Icon
          name="Bot"
          className="text-white"
          size={Math.round(size * 0.5)}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(168,85,247,0.8))' }}
        />
      </span>
    </div>
  );

  const aiKeyframes = (
    <style>{`
      @keyframes aiGlowPulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50%      { transform: scale(1.25); opacity: 1; }
      }
      @keyframes aiOrbit {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes aiBob {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-3px); }
      }
      @keyframes aiPing {
        0%   { transform: scale(0.8); opacity: 0.9; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `}</style>
  );

  if (!isOpen && showGreeting) {
    return (
      <>
        {aiKeyframes}
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div
            className="w-80 rounded-2xl p-5 relative"
            style={{
              background:
                'linear-gradient(180deg, rgba(168,85,247,0.18) 0%, rgba(10,14,39,0.92) 100%)',
              border: '1px solid rgba(168,85,247,0.4)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 30px 80px -20px rgba(168,85,247,0.6)',
            }}
          >
            <button
              onClick={handleDismiss}
              aria-label="Закрыть"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon name="X" size={14} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <Avatar3D size={52} />
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-white">
                  Привет! Нужна помощь?
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Расскажу про платформу и подскажу тариф
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpen}
              className="w-full h-10 text-white border-0"
              style={{
                background:
                  'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 8px 24px -6px rgba(168,85,247,0.7)',
              }}
            >
              <Icon name="Sparkles" size={15} className="mr-2" />
              Спросить помощника
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!isOpen) {
    return (
      <>
        {aiKeyframes}
        <button
          onClick={handleOpen}
          aria-label="Открыть ИИ-помощника"
          className="fixed bottom-6 right-6 z-50"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)',
              animation: 'aiPing 2.5s ease-out infinite',
            }}
          />
          <Avatar3D size={64} />
        </button>
      </>
    );
  }

  if (isMinimized) {
    return (
      <>
        {aiKeyframes}
        <button
          onClick={() => setIsMinimized(false)}
          aria-label="Развернуть помощника"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-2 pr-4 h-14 rounded-full"
          style={{
            background:
              'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.25) 100%)',
            border: '1px solid rgba(168,85,247,0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px -16px rgba(168,85,247,0.7)',
          }}
        >
          <Avatar3D size={40} />
          <span className="text-sm font-semibold text-white">Помощник</span>
          {messages.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
              style={{
                background: '#22C55E',
                boxShadow: '0 0 12px rgba(34,197,94,0.7)',
              }}
            >
              {messages.length}
            </span>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      {aiKeyframes}
      <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar3D size={36} />
            <div>
              <CardTitle className="text-base">ИИ-Помощник</CardTitle>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Всегда готов помочь
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Очистить историю чата?')) {
                    setMessages([]);
                    localStorage.removeItem('ai-assistant-history');
                  }
                }}
                title="Очистить историю"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <Icon name="Minus" size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                trackAction('assistant_closed', {});
              }}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Sparkles" className="text-primary" size={32} />
                </div>
                <h3 className="font-semibold mb-2">Привет! Я ваш помощник по ИнтеллектПро</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Отвечу на любые вопросы о платформе, тарифах и возможностях
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="mt-0.5 text-primary" />
                    Помогу выбрать подходящий тариф
                  </p>
                  <p className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="mt-0.5 text-primary" />
                    Расскажу о партнёрской программе
                  </p>
                  <p className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="mt-0.5 text-primary" />
                    Объясню возможности платформы
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
                {msg.sender === 'assistant' && msg.canContinue && idx === messages.length - 1 && !isLoading && (
                  <div className="flex justify-start mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={continueMessage}
                      className="text-xs"
                    >
                      <Icon name="MoreHorizontal" size={14} className="mr-1" />
                      Продолжить ответ
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Напишите сообщение..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default AIAssistant;