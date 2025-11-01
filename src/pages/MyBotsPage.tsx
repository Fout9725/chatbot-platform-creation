import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import MyBots from '@/components/MyBots';
import MessengerIntegration from '@/components/MessengerIntegration';

const MyBotsPage = () => {
  const [activeTab, setActiveTab] = useState('bots');

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
                  Мои боты
                </h1>
                <p className="text-xs text-muted-foreground">Управление вашими ботами</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bots" className="flex items-center gap-2">
              <Icon name="Bot" size={16} />
              Мои боты
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
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
    </div>
  );
};

export default MyBotsPage;