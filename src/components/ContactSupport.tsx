import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ContactSupport = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Сообщение отправлено!",
      description: "Главный администратор свяжется с вами в ближайшее время.",
    });
    
    setName('');
    setEmail('');
    setMessage('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
        >
          <Icon name="MessageCircle" size={20} className="mr-2" />
          Связаться с нами
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Обратная связь</DialogTitle>
          <DialogDescription>
            Свяжитесь напрямую с главным администратором платформы
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Контакты администратора</CardTitle>
            <CardDescription>Главный администратор платформы</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Icon name="User" className="text-primary mt-1" size={20} />
              <div>
                <p className="font-semibold">Сляднев Владимир Сергеевич</p>
                <p className="text-sm text-muted-foreground">Главный администратор</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Icon name="Mail" className="text-primary" size={20} />
              <div>
                <p className="font-medium">Email</p>
                <a 
                  href="mailto:s89624027661@yandex.ru" 
                  className="text-sm text-primary hover:underline"
                >
                  s89624027661@yandex.ru
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Icon name="Send" className="text-primary" size={20} />
              <div>
                <p className="font-medium">Telegram</p>
                <a 
                  href="https://t.me/Fou9725" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  @Fou9725
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваше имя</label>
            <Input
              placeholder="Иван Иванов"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="ivan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Сообщение</label>
            <Textarea
              placeholder="Опишите ваш вопрос или проблему..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
            />
          </div>
          
          <Button type="submit" className="w-full">
            <Icon name="Send" size={16} className="mr-2" />
            Отправить сообщение
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSupport;
