import { useState, useEffect, useRef } from 'react';
import AIAssistantTeaser from './ai-assistant/AIAssistantTeaser';
import AIAssistantChat from './ai-assistant/AIAssistantChat';
import { Message } from './ai-assistant/types';

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

  const trackAction = async (
    actionType: string,
    actionData: Record<string, unknown>,
  ) => {
    try {
      const apiUrl = localStorage.getItem('api-url') || '/api';
      await fetch(`${apiUrl}/assistant/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1',
        },
        body: JSON.stringify({
          action_type: actionType,
          action_data: actionData,
          page_url: window.location.pathname,
        }),
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
      const response = await fetch(
        'https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Продолжи ответ',
            context: lastMessage.message,
          }),
        },
      );

      const data = await response.json();

      const continuedMessage: Message = {
        sender: 'assistant',
        message: data.response || 'Извините, не могу продолжить.',
        canContinue: data.truncated || false,
      };

      setMessages((prev) => [...prev, continuedMessage]);
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
      message: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    await trackAction('chat_message', { message: currentMessage });

    try {
      console.log('Sending message to assistant:', currentMessage);
      const response = await fetch(
        'https://functions.poehali.dev/0c4d58dc-8846-49a9-a38c-7b6a5a8e124f',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: currentMessage }),
        },
      );

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      const assistantMessage: Message = {
        sender: 'assistant',
        message: data.response || 'Извините, не могу ответить прямо сейчас.',
        canContinue: data.truncated || false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI assistant:', error);
      const errorMessage: Message = {
        sender: 'assistant',
        message:
          'Произошла ошибка. Вы можете связаться с главным администратором:\n\n👤 Сляднев Владимир Сергеевич\n📧 s89624027661@yandex.ru\n✈️ Telegram: @Fou9725\n\nИли обратитесь в поддержку: https://t.me/+QgiLIa1gFRY4Y2Iy',
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const handleClose = () => {
    setIsOpen(false);
    trackAction('assistant_closed', {});
  };

  const handleClearHistory = () => {
    if (confirm('Очистить историю чата?')) {
      setMessages([]);
      localStorage.removeItem('ai-assistant-history');
    }
  };

  if (!isOpen && showGreeting) {
    return (
      <AIAssistantTeaser
        mode="greeting"
        messagesCount={messages.length}
        onOpen={handleOpen}
        onDismiss={handleDismiss}
        onExpand={() => setIsMinimized(false)}
      />
    );
  }

  if (!isOpen) {
    return (
      <AIAssistantTeaser
        mode="closed"
        messagesCount={messages.length}
        onOpen={handleOpen}
        onDismiss={handleDismiss}
        onExpand={() => setIsMinimized(false)}
      />
    );
  }

  if (isMinimized) {
    return (
      <AIAssistantTeaser
        mode="minimized"
        messagesCount={messages.length}
        onOpen={handleOpen}
        onDismiss={handleDismiss}
        onExpand={() => setIsMinimized(false)}
      />
    );
  }

  return (
    <AIAssistantChat
      messages={messages}
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      isLoading={isLoading}
      scrollRef={scrollRef}
      onSend={sendMessage}
      onContinue={continueMessage}
      onMinimize={() => setIsMinimized(true)}
      onClose={handleClose}
      onClearHistory={handleClearHistory}
    />
  );
};

export default AIAssistant;
