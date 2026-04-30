import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BotConstructor from '@/components/BotConstructor';
import AdvancedVisualConstructor from '@/components/AdvancedVisualConstructor';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import AIBotBuilder from '@/components/AIBotBuilder';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/global/GlassCard';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

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
      <PageLayout
        title="Конструктор"
        description="Визуальный конструктор сценариев бота"
        keywords="конструктор сценариев, визуальный редактор, бот, ИнтеллектПро"
      >
        <header className="border-b glass-divider glass-panel-subtle sticky top-0 z-50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl">
                  <Icon name="Bot" className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-glass-title">
                    Конструктор ботов
                  </h1>
                  <p className="text-xs text-glass-muted">
                    {mode === 'professional' ? 'Профессиональный режим' : 'Визуальный режим'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={mode === 'professional' ? 'default' : 'secondary'}
                  className={mode === 'professional' ? 'bg-primary/30 text-white border border-primary/50' : 'bg-white/10 text-gray-200 border-white/10'}
                >
                  <Icon name={mode === 'professional' ? 'Code2' : 'Workflow'} size={14} className="mr-1" />
                  {mode === 'professional' ? 'Pro' : 'Visual'}
                </Badge>
                <Link to="/">
                  <Button type="button" size="sm" className="btn-glass-secondary">
                    <Icon name="Home" size={18} className="mr-2" />
                    На главную
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="relative container mx-auto px-4 py-8 glass-fade-in">
          <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
            <Scene3D variant="rings" size={200} />
          </div>

          {mode === 'professional' ? (
            <div className="space-y-6 relative z-10">
              <GlassCard variant="accent" className="p-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xl font-semibold text-glass-title">
                    <Icon name="Code2" size={24} className="text-purple-300" />
                    Профессиональный режим
                  </div>
                  <p className="text-sm text-glass-muted">
                    Полный контроль над логикой бота с помощью кода
                  </p>
                </div>
              </GlassCard>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList
                  data-tour="constructor-tabs"
                  className="grid w-full grid-cols-2 glass-panel-subtle border border-white/10 bg-transparent"
                >
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
                  >
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    ИИ-Агент
                  </TabsTrigger>
                  <TabsTrigger
                    value="builder"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
                  >
                    <Icon name="Code2" size={16} className="mr-2" />
                    Код редактор
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-6">
                  <AIBotBuilder mode="professional" onBotGenerated={handleBotGenerated} />
                </TabsContent>

                <TabsContent value="builder" className="mt-6">
                  {generatedBotConfig && (
                    <GlassCard variant="subtle" className="mb-4 p-4 border-l-4 border-l-green-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle" size={20} className="text-green-400" />
                          <span className="font-semibold text-white">
                            Бот создан ИИ-агентом: {generatedBotConfig.botName}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setGeneratedBotConfig(null)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    </GlassCard>
                  )}
                  <BotConstructor initialConfig={generatedBotConfig} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <GlassCard variant="accent" className="p-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xl font-semibold text-glass-title">
                    <Icon name="Workflow" size={24} className="text-green-300" />
                    Визуальный конструктор
                  </div>
                  <p className="text-sm text-glass-muted">
                    Создайте бота без программирования с помощью drag & drop
                  </p>
                </div>
              </GlassCard>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 glass-panel-subtle border border-white/10 bg-transparent">
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
                  >
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    ИИ-Агент
                  </TabsTrigger>
                  <TabsTrigger
                    value="builder"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
                  >
                    <Icon name="Workflow" size={16} className="mr-2" />
                    Визуальный редактор
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-6">
                  <AIBotBuilder mode="visual" onBotGenerated={handleBotGenerated} />
                </TabsContent>

                <TabsContent value="builder" className="mt-6">
                  {generatedBotConfig && (
                    <GlassCard variant="subtle" className="mb-4 p-4 border-l-4 border-l-green-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle" size={20} className="text-green-400" />
                          <span className="font-semibold text-white">
                            Workflow создан ИИ-агентом: {generatedBotConfig.botName}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setGeneratedBotConfig(null)}
                          className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    </GlassCard>
                  )}
                  <AdvancedVisualConstructor initialConfig={generatedBotConfig} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </PageLayout>
    </>
  );
};

export default Constructor;
