import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import Avatar3D, { aiKeyframes } from './Avatar3D';
import { Message } from './types';

interface AIAssistantChatProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (v: string) => void;
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement>;
  onSend: () => void;
  onContinue: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onClearHistory: () => void;
}

const AIAssistantChat = ({
  messages,
  inputMessage,
  setInputMessage,
  isLoading,
  scrollRef,
  onSend,
  onContinue,
  onMinimize,
  onClose,
  onClearHistory,
}: AIAssistantChatProps) => {
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
                  onClick={onClearHistory}
                  title="Очистить историю"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onMinimize}>
                <Icon name="Minus" size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
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
                  <h3 className="font-semibold mb-2">
                    Привет! Я ваш помощник по ИнтеллектПро
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Отвечу на любые вопросы о платформе, тарифах и
                    возможностях
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <Icon
                        name="Check"
                        size={14}
                        className="mt-0.5 text-primary"
                      />
                      Помогу выбрать подходящий тариф
                    </p>
                    <p className="flex items-start gap-2">
                      <Icon
                        name="Check"
                        size={14}
                        className="mt-0.5 text-primary"
                      />
                      Расскажу о партнёрской программе
                    </p>
                    <p className="flex items-start gap-2">
                      <Icon
                        name="Check"
                        size={14}
                        className="mt-0.5 text-primary"
                      />
                      Объясню возможности платформы
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  {msg.sender === 'assistant' &&
                    msg.canContinue &&
                    idx === messages.length - 1 &&
                    !isLoading && (
                      <div className="flex justify-start mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onContinue}
                          className="text-xs"
                        >
                          <Icon
                            name="MoreHorizontal"
                            size={14}
                            className="mr-1"
                          />
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
                    onSend();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={onSend}
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

export default AIAssistantChat;
