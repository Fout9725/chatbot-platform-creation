import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BotConstructor from '@/components/BotConstructor';
import AdvancedVisualConstructor from '@/components/AdvancedVisualConstructor';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import AIBotBuilder from '@/components/AIBotBuilder';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

const Constructor = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'professional';
  const [showTutorial, setShowTutorial] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  const [generatedBotConfig, setGeneratedBotConfig] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.plan || user?.plan === 'free') {
      navigate('/pricing');
    }
  }, [isAuthenticated, user, navigate]);

  const handleBotGenerated = (config: any) => {
    setGeneratedBotConfig(config);
    setActiveTab('builder');
  };

  return (
    <>
      {showTutorial && (
        <InteractiveTutorial 
          mode={mode as 'professional' | 'visual'} 
          onComplete={() => setShowTutorial(false)}
        />
      )}
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
                  <Button type="button" disabled={false} variant="outline" size="sm">
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

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai">
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    ИИ-Агент
                  </TabsTrigger>
                  <TabsTrigger value="builder">
                    <Icon name="Code2" size={16} className="mr-2" />
                    Код редактор
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-6">
                  <AIBotBuilder mode="professional" onBotGenerated={handleBotGenerated} />
                </TabsContent>

                <TabsContent value="builder" className="mt-6">
                  {generatedBotConfig && (
                    <Card className="mb-4 bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="CheckCircle" size={20} className="text-green-600" />
                            <span className="font-semibold text-green-900">
                              Бот создан ИИ-агентом: {generatedBotConfig.botName}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setGeneratedBotConfig(null)}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                  <BotConstructor initialConfig={generatedBotConfig} />
                </TabsContent>
              </Tabs>
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
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai">
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    ИИ-Агент
                  </TabsTrigger>
                  <TabsTrigger value="builder">
                    <Icon name="Workflow" size={16} className="mr-2" />
                    Визуальный редактор
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-6">
                  <AIBotBuilder mode="visual" onBotGenerated={handleBotGenerated} />
                </TabsContent>

                <TabsContent value="builder" className="mt-6">
                  {generatedBotConfig && (
                    <Card className="mb-4 bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="CheckCircle" size={20} className="text-green-600" />
                            <span className="font-semibold text-green-900">
                              Workflow создан ИИ-агентом: {generatedBotConfig.botName}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setGeneratedBotConfig(null)}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                  <AdvancedVisualConstructor initialConfig={generatedBotConfig} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Constructor;