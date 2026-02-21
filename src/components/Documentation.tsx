import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocsGuidesTab from '@/components/docs/DocsGuidesTab';
import DocsSecurityTab from '@/components/docs/DocsSecurityTab';
import DocsFaqTab from '@/components/docs/DocsFaqTab';

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <Icon name="BookOpen" size={32} className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Документация
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Icon name="ArrowLeft" size={18} />
            На главную
          </Button>
        </div>

        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="quickstart" className="text-xs md:text-sm">
              <Icon name="Rocket" size={16} className="mr-1" />
              Быстрый старт
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-xs md:text-sm">
              <Icon name="BookOpen" size={16} className="mr-1" />
              База знаний
            </TabsTrigger>
            <TabsTrigger value="models" className="text-xs md:text-sm">
              <Icon name="Cpu" size={16} className="mr-1" />
              Модели
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs md:text-sm">
              <Icon name="Plug" size={16} className="mr-1" />
              Интеграции
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              <Icon name="Shield" size={16} className="mr-1" />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs md:text-sm">
              <Icon name="HelpCircle" size={16} className="mr-1" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <DocsGuidesTab />
          <DocsSecurityTab />
          <DocsFaqTab />
        </Tabs>
      </div>
    </div>
  );
}
