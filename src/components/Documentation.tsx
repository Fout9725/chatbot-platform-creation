import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocsGuidesTab from '@/components/docs/DocsGuidesTab';
import DocsSecurityTab from '@/components/docs/DocsSecurityTab';
import DocsFaqTab from '@/components/docs/DocsFaqTab';
import PageLayout from '@/components/global/PageLayout';
import Scene3D from '@/components/global/Scene3D';

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Документация"
      description="Документация ИнтеллектПро: гайды по созданию ботов и автоматизации"
      keywords="документация, гайды, ИнтеллектПро, создание ботов, автоматизация"
    >
      <div className="relative p-4 md:p-6 lg:p-8">
        <div className="absolute top-4 right-4 opacity-30 hidden md:block pointer-events-none">
          <Scene3D variant="rings" size={200} />
        </div>

        <div className="max-w-6xl mx-auto space-y-6 relative z-10 glass-fade-in">
          <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
            <div className="flex items-center gap-3">
              <Icon name="BookOpen" size={32} className="text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-glass-title">
                Документация
              </h1>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="btn-glass-secondary flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={18} />
              На главную
            </Button>
          </div>

          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto glass-panel-subtle border border-white/10 bg-transparent p-1">
              <TabsTrigger
                value="quickstart"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
                <Icon name="Rocket" size={16} className="mr-1" />
                Быстрый старт
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
                <Icon name="BookOpen" size={16} className="mr-1" />
                База знаний
              </TabsTrigger>
              <TabsTrigger
                value="models"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
                <Icon name="Cpu" size={16} className="mr-1" />
                Модели
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
                <Icon name="Plug" size={16} className="mr-1" />
                Интеграции
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
                <Icon name="Shield" size={16} className="mr-1" />
                Безопасность
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                className="text-xs md:text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-300"
              >
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
    </PageLayout>
  );
}
