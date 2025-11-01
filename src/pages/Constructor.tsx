import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BotConstructor from '@/components/BotConstructor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Constructor = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'professional';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                <Icon name="Bot" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Конструктор ботов
                </h1>
                <p className="text-xs text-muted-foreground">
                  {mode === 'professional' ? 'Профессиональный режим' : 'Визуальный режим'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={mode === 'professional' ? 'default' : 'secondary'}>
                <Icon name={mode === 'professional' ? 'Code2' : 'Workflow'} size={14} className="mr-1" />
                {mode === 'professional' ? 'Pro' : 'Visual'}
              </Badge>
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Icon name="Home" size={18} className="mr-2" />
                  На главную
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {mode === 'professional' ? (
          <div className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Code2" size={24} className="text-purple-600" />
                  Профессиональный режим
                </CardTitle>
                <CardDescription>
                  Полный контроль над логикой бота с помощью кода
                </CardDescription>
              </CardHeader>
            </Card>
            <BotConstructor />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Workflow" size={24} className="text-green-600" />
                  Визуальный конструктор
                </CardTitle>
                <CardDescription>
                  Создайте бота без программирования с помощью drag & drop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed">
                  <div className="text-center space-y-4">
                    <Icon name="Workflow" size={64} className="mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">Визуальный редактор</h3>
                    <p className="text-muted-foreground max-w-md">
                      Перетаскивайте блоки на холст, соединяйте их стрелками и создавайте диалоги визуально
                    </p>
                    <Button size="lg" className="mt-4">
                      <Icon name="Play" size={18} className="mr-2" />
                      Начать создание
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Constructor;