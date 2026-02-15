import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplatesGallery from '@/components/automation/TemplatesGallery';
import InstagramSetupForm from '@/components/automation/InstagramSetupForm';
import WorkflowViewer from '@/components/automation/WorkflowViewer';
import InstructionsTab from '@/components/automation/InstructionsTab';

const InstagramAutomation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');
  const [workflowJson, setWorkflowJson] = useState('');

  const handleWorkflowGenerated = (json: string) => {
    setWorkflowJson(json);
    setActiveTab('workflow');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Icon name="Home" size={18} className="mr-2" />
          Главная
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl">
              <Icon name="Workflow" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Конструктор автоматизаций n8n</CardTitle>
              <CardDescription>Готовые шаблоны и кастомный конструктор — заполни данные, скачай JSON, импортируй в n8n</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">
                <Icon name="LayoutGrid" size={16} className="mr-2" />
                Шаблоны
              </TabsTrigger>
              <TabsTrigger value="instagram">
                <Icon name="Instagram" size={16} className="mr-2" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="workflow">
                <Icon name="Code" size={16} className="mr-2" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="instructions">
                <Icon name="BookOpen" size={16} className="mr-2" />
                Инструкция
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4 mt-4">
              <TemplatesGallery onWorkflowGenerated={handleWorkflowGenerated} />
            </TabsContent>

            <TabsContent value="instagram" className="space-y-4">
              <InstagramSetupForm onWorkflowGenerated={handleWorkflowGenerated} />
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              <WorkflowViewer workflowJson={workflowJson} />
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <InstructionsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center mt-4">* Instagram признан экстремистской организацией и запрещен на территории РФ.</p>
    </div>
  );
};

export default InstagramAutomation;
