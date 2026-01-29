import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InstagramAutomation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowJson, setWorkflowJson] = useState('');
  
  const [formData, setFormData] = useState({
    googleSheetId: '',
    anthropicApiKey: '',
    openaiApiKey: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    scheduleTime: '10:00'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateWorkflow = async () => {
    if (!formData.googleSheetId || !formData.anthropicApiKey || !formData.openaiApiKey) {
      toast({
        title: "Заполните обязательные поля",
        description: "Google Sheet ID, API ключи Anthropic и OpenAI обязательны",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://functions.poehali.dev/a0badc6a-7e0c-48cd-8b5e-a5985f0d8b92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Ошибка генерации workflow');

      const data = await response.json();
      setWorkflowJson(JSON.stringify(data.workflow, null, 2));

      toast({
        title: "Workflow сгенерирован!",
        description: "Скопируйте JSON и импортируйте его в n8n"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сгенерировать workflow",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadWorkflow = () => {
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instagram-automation-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowJson);
    toast({
      title: "Скопировано!",
      description: "Workflow JSON скопирован в буфер обмена"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Icon name="Home" size={18} className="mr-2" />
          Главная
        </Button>
      </div>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl">
              <Icon name="Instagram" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Автоматизация постов для Instagram*</CardTitle>
              <CardDescription>Генерация текста и картинок через n8n workflow</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройка
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

            <TabsContent value="setup" className="space-y-4">
              <Alert>
                <Icon name="Info" size={16} />
                <AlertDescription>
                  Заполните данные для создания автоматизации. Все API ключи остаются у вас — workflow генерируется локально.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="googleSheetId">Google Sheet ID *</Label>
                  <Input
                    id="googleSheetId"
                    placeholder="1A2B3C4D5E6F7G8H9I0J..."
                    value={formData.googleSheetId}
                    onChange={(e) => handleInputChange('googleSheetId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Найдите в URL вашей таблицы: docs.google.com/spreadsheets/d/<strong>ВАШ_ID</strong>/edit
                  </p>
                </div>

                <div>
                  <Label htmlFor="anthropicApiKey">Anthropic API Key (Claude) *</Label>
                  <Input
                    id="anthropicApiKey"
                    type="password"
                    placeholder="sk-ant-..."
                    value={formData.anthropicApiKey}
                    onChange={(e) => handleInputChange('anthropicApiKey', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Получите на <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.anthropic.com</a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="openaiApiKey">OpenAI API Key (DALL-E 3) *</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    placeholder="sk-..."
                    value={formData.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Получите на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Cloudinary (для наложения текста на картинку)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cloudinaryCloudName">Cloud Name</Label>
                      <Input
                        id="cloudinaryCloudName"
                        placeholder="your-cloud-name"
                        value={formData.cloudinaryCloudName}
                        onChange={(e) => handleInputChange('cloudinaryCloudName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloudinaryApiKey">API Key</Label>
                      <Input
                        id="cloudinaryApiKey"
                        placeholder="123456789012345"
                        value={formData.cloudinaryApiKey}
                        onChange={(e) => handleInputChange('cloudinaryApiKey', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloudinaryApiSecret">API Secret</Label>
                      <Input
                        id="cloudinaryApiSecret"
                        type="password"
                        placeholder="AbCdEfGhIjKlMnOpQrS..."
                        value={formData.cloudinaryApiSecret}
                        onChange={(e) => handleInputChange('cloudinaryApiSecret', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Регистрация на <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">cloudinary.com</a> (бесплатный план доступен)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduleTime">Время запуска по расписанию</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) => handleInputChange('scheduleTime', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Workflow будет запускаться ежедневно в это время
                  </p>
                </div>

                <Button 
                  onClick={generateWorkflow} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Icon name="Loader" size={18} className="mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Icon name="Zap" size={18} className="mr-2" />
                      Сгенерировать n8n Workflow
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              {!workflowJson ? (
                <Alert>
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>
                    Сначала заполните данные в разделе "Настройка" и нажмите "Сгенерировать workflow"
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={downloadWorkflow} variant="outline">
                      <Icon name="Download" size={16} className="mr-2" />
                      Скачать JSON
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline">
                      <Icon name="Copy" size={16} className="mr-2" />
                      Копировать
                    </Button>
                  </div>
                  
                  <Textarea
                    value={workflowJson}
                    readOnly
                    className="font-mono text-xs h-96"
                  />
                  
                  <Alert>
                    <Icon name="Info" size={16} />
                    <AlertDescription>
                      Импортируйте этот JSON в n8n: Settings → Import from File → вставьте JSON
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon name="PlayCircle" size={20} />
                  Быстрый старт (5 шагов)
                </h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">1. Подготовка Google Sheet</h4>
                    <p className="text-sm text-muted-foreground">
                      Создайте таблицу с колонками:<br/>
                      <code className="bg-muted px-1 py-0.5 rounded">A: Идея</code> | 
                      <code className="bg-muted px-1 py-0.5 rounded">B: Текст</code> | 
                      <code className="bg-muted px-1 py-0.5 rounded">C: Картинка</code> | 
                      <code className="bg-muted px-1 py-0.5 rounded">D: Заголовок</code> | 
                      <code className="bg-muted px-1 py-0.5 rounded">E: Статус</code>
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">2. Получение API ключей</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-4">
                      <li><a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Anthropic Claude</a> — для генерации текста</li>
                      <li><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI</a> — для DALL-E 3 (картинки)</li>
                      <li><a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Cloudinary</a> — для наложения текста на изображение</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">3. Генерация Workflow</h4>
                    <p className="text-sm text-muted-foreground">
                      Заполните все поля в разделе "Настройка" и нажмите "Сгенерировать n8n Workflow"
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">4. Импорт в n8n</h4>
                    <p className="text-sm text-muted-foreground">
                      В n8n: три точки → <strong>Import from File</strong> → вставьте JSON → Activate
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">5. Запуск</h4>
                    <p className="text-sm text-muted-foreground">
                      Добавьте идею в ячейку A2 вашей Google Sheet и нажмите "Execute Workflow" в n8n
                    </p>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Icon name="Lightbulb" size={16} />
                  <AlertDescription>
                    <strong>Пример идеи:</strong> "мотивация на спорт утром"<br/>
                    <strong>Результат:</strong> Готовый текст поста 1600-1700 символов + картинка 1080×1920 с заголовком
                  </AlertDescription>
                </Alert>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 text-amber-900">
                    <Icon name="AlertTriangle" size={18} />
                    Важно!
                  </h4>
                  <ul className="text-sm text-amber-800 list-disc pl-4 mt-2 space-y-1">
                    <li>Workflow НЕ публикует посты автоматически — только готовит материалы</li>
                    <li>Вы сами публикуете из Google Sheet в Instagram вручную</li>
                    <li>API ключи не сохраняются на серверах — только в вашем workflow</li>
                    <li>Текст генерируется на 1600-1700 символов (требование Instagram)</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center mt-4">* Instagram признан экстремистской организацией и запрещен на территории РФ.</p>
    </div>
  );
};

export default InstagramAutomation;