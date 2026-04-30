import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import MyBots from '@/components/MyBots';
import MessengerIntegration from '@/components/MessengerIntegration';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

const MyBotsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('bots');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <PageLayout
      title="Мои боты"
      description="Управление вашими AI-ботами"
      keywords="мои боты, AI-боты, управление ботами, ИнтеллектПро"
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
                  Мои боты
                </h1>
                <p className="text-xs text-glass-muted">Управление вашими ботами</p>
              </div>
            </div>
            <Link to="/">
              <Button type="button" size="sm" className="btn-glass-secondary">
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 glass-fade-in">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="cube" size={200} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative z-10">
          <TabsList
            data-tour="mybots-tabs"
            className="grid w-full grid-cols-2 max-w-md glass-panel-subtle border border-white/10 bg-transparent"
          >
            <TabsTrigger
              value="bots"
              className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Bot" size={16} />
              Мои боты
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
            >
              <Icon name="Link" size={16} />
              Интеграции
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bots">
            <MyBots />
          </TabsContent>

          <TabsContent value="integrations">
            <MessengerIntegration />
          </TabsContent>
        </Tabs>
      </main>
    </PageLayout>
  );
};

export default MyBotsPage;
