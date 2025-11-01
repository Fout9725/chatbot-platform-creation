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
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

  const trackAction = async (actionType: string, actionData: any) => {
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

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      message: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    await trackAction('chat_message', { message: inputMessage });

    try {
      const apiUrl = localStorage.getItem('api-url') || '/api';
      const response = await fetch(`${apiUrl}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        sender: 'assistant',
        message: data.response || 'Извините, не могу ответить прямо сейчас.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        sender: 'assistant',
        message: 'Произошла ошибка. Попробуйте позже.'
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

  if (!isOpen && showGreeting) {
    return (
      <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5">
        <Card className="w-80 shadow-2xl border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full">
                <Icon name="Bot" className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Нужна помощь?</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Я помогу разобраться с платформой
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={false}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex gap-2">
              <Button 
                type="button"
                onClick={handleOpen} 
                className="flex-1"
                disabled={false}
              >
                <Icon name="MessageCircle" size={16} className="mr-2" />
                Открыть чат
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDismiss}
                disabled={false}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl"
        size="icon"
        disabled={false}
      >
        <Icon name="Bot" size={24} />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 h-14 rounded-full shadow-2xl px-4"
        disabled={false}
      >
        <Icon name="Bot" size={20} className="mr-2" />
        <span className="text-sm font-medium">Помощник</span>
        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
          {messages.length}
        </Badge>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full">
              <Icon name="Bot" className="text-white" size={20} />
            </div>
            <div>
              <CardTitle className="text-base">ИИ-Помощник</CardTitle>
              <p className="text-xs text-muted-foreground">
                Всегда готов помочь
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              disabled={false}
            >
              <Icon name="Minus" size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                trackAction('assistant_closed', {});
              }}
              disabled={false}
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
                <h3 className="font-semibold mb-2">Привет! Я ваш помощник</h3>
                <p className="text-sm text-muted-foreground">
                  Задайте мне вопрос о платформе
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
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
              type="button"
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
  );
};

export default AIAssistant;
