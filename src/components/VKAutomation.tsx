import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VKAutomation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowJson, setWorkflowJson] = useState('');
  
  const [formData, setFormData] = useState({
    vkAccessToken: '',
    groupId: '',
    scheduleTime: '10:00'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateWorkflow = async () => {
    if (!formData.vkAccessToken || !formData.groupId) {
      toast({
        title: "Заполните обязательные поля",
        description: "Access Token и ID группы обязательны",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    const workflow = {
      name: "VK Crossposting Automation",
      nodes: [
        {
          parameters: {
            rule: {
              interval: [{ field: "cronExpression", expression: `0 ${formData.scheduleTime.split(':')[1]} ${formData.scheduleTime.split(':')[0]} * * *` }]
            }
          },
          name: "Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [250, 300]
        },
        {
          parameters: {
            authentication: "accessToken",
            resource: "post",
            operation: "create",
            ownerId: `-${formData.groupId}`,
            message: "={{ $json.text }}",
            additionalFields: {}
          },
          name: "VK",
          type: "n8n-nodes-base.vk",
          position: [450, 300]
        }
      ],
      connections: {
        "Schedule": { main: [[{ node: "VK", type: "main", index: 0 }]] }
      }
    };

    setWorkflowJson(JSON.stringify(workflow, null, 2));
    setIsGenerating(false);

    toast({
      title: "Workflow сгенерирован!",
      description: "Скопируйте JSON и импортируйте в n8n"
    });
  };

  const downloadWorkflow = () => {
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vk-automation-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowJson);
    toast({ title: "Скопировано!", description: "Workflow скопирован" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/automation-hub')}>
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад
        </Button>
      </div>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
              <Icon name="Share2" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Автопостинг ВКонтакте</CardTitle>
              <CardDescription>Публикация в группу ВК через VK API</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Настройка</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="instructions">Инструкция</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <Alert>
                <Icon name="Info" size={16} />
                <AlertDescription>
                  Получите Access Token в настройках приложения ВКонтакте
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label>VK Access Token *</Label>
                  <Input
                    type="password"
                    placeholder="vk1.a..."
                    value={formData.vkAccessToken}
                    onChange={(e) => handleInputChange('vkAccessToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <a href="https://vkhost.github.io/" target="_blank" className="text-primary underline">Получить токен</a>
                  </p>
                </div>

                <div>
                  <Label>ID группы *</Label>
                  <Input
                    placeholder="123456789"
                    value={formData.groupId}
                    onChange={(e) => handleInputChange('groupId', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Время публикации</Label>
                  <Input
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) => handleInputChange('scheduleTime', e.target.value)}
                  />
                </div>

                <Button onClick={generateWorkflow} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Icon name="Zap" size={18} className="mr-2" />
                      Сгенерировать
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              {workflowJson ? (
                <>
                  <div className="flex gap-2">
                    <Button onClick={downloadWorkflow} variant="outline" className="flex-1">
                      <Icon name="Download" size={18} className="mr-2" />
                      Скачать
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                      <Icon name="Copy" size={18} className="mr-2" />
                      Копировать
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-auto font-mono text-sm">
                    <pre>{workflowJson}</pre>
                  </div>
                </>
              ) : (
                <Alert>
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>Сначала заполните настройки</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose max-w-none text-sm">
                <h3 className="font-semibold mb-2">Как использовать:</h3>
                <ol className="space-y-2">
                  <li>1. Создайте Standalone-приложение ВК</li>
                  <li>2. Получите Access Token с правами wall и offline</li>
                  <li>3. Узнайте ID вашей группы</li>
                  <li>4. Сгенерируйте и импортируйте workflow в n8n</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
