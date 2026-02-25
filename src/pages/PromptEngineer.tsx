import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import PromptGeneratorTab from '@/components/prompt-engineer/PromptGeneratorTab';
import ModelsReferenceTab from '@/components/prompt-engineer/ModelsReferenceTab';
import PromptGuideTab from '@/components/prompt-engineer/PromptGuideTab';

const PromptEngineer = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedModel, setSelectedModel] = useState('');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-fuchsia-500/4 rounded-full blur-[150px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-2.5 rounded-xl shadow-lg shadow-violet-500/20">
                  <Icon name="Sparkles" className="text-white" size={26} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  Промт-Инженер
                </h1>
                <p className="text-[11px] text-white/40 tracking-wider uppercase">AI Meta-Prompt Engineer</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="Home" size={16} className="mr-1.5" />
                  Главная
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Icon name="LayoutDashboard" size={16} className="mr-1.5" />
                  Панель
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-4">
            <Icon name="Zap" size={14} />
            Powered by nvidia/nemotron AI
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              Создавайте идеальные промты
            </span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            AI-инженер составит структурированный промт для любой нейросети по вашему описанию на русском языке
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-8 mx-auto flex w-fit">
            <TabsTrigger value="generator" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="Sparkles" size={16} className="mr-2" />
              Генератор промтов
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="BookOpen" size={16} className="mr-2" />
              Справочник моделей
            </TabsTrigger>
            <TabsTrigger value="guide" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200 text-white/50">
              <Icon name="GraduationCap" size={16} className="mr-2" />
              Гайд по промтам
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <PromptGeneratorTab
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </TabsContent>

          <TabsContent value="models">
            <ModelsReferenceTab
              onSelectModel={setSelectedModel}
              onSwitchToGenerator={() => setActiveTab('generator')}
            />
          </TabsContent>

          <TabsContent value="guide">
            <PromptGuideTab
              onSwitchToGenerator={() => setActiveTab('generator')}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PromptEngineer;
