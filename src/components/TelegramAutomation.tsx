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

export default function TelegramAutomation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowJson, setWorkflowJson] = useState('');
  
  const [formData, setFormData] = useState({
    telegramBotToken: '',
    channelId: '',
    googleSheetId: '',
    scheduleTime: '10:00'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateWorkflow = async () => {
    if (!formData.telegramBotToken || !formData.channelId) {
      toast({
        title: "Заполните обязательные поля",
        description: "Telegram Bot Token и ID канала обязательны",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Генерируем workflow локально
    const workflow = {
      name: "Telegram Channel Autoposter",
      nodes: [
        {
          parameters: {
            rule: {
              interval: [{ field: "cronExpression", expression: `0 ${formData.scheduleTime.split(':')[1]} ${formData.scheduleTime.split(':')[0]} * * *` }]
            }
          },
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [250, 300]
        },
        {
          parameters: {
            operation: "read",
            documentId: { __rl: true, value: formData.googleSheetId, mode: "id" },
            sheetName: "Posts",
            options: {}
          },
          name: "Google Sheets",
          type: "n8n-nodes-base.googleSheets",
          position: [450, 300]
        },
        {
          parameters: {
            chatId: formData.channelId,
            text: "={{ $json.text }}",
            additionalFields: {
              parse_mode: "Markdown"
            }
          },
          name: "Telegram",
          type: "n8n-nodes-base.telegram",
          position: [650, 300],
          credentials: {
            telegramApi: {
              id: "1",
              name: "Telegram Bot"
            }
          }
        }
      ],
      connections: {
        "Schedule Trigger": { main: [[{ node: "Google Sheets", type: "main", index: 0 }]] },
        "Google Sheets": { main: [[{ node: "Telegram", type: "main", index: 0 }]] }
      }
    };

    setWorkflowJson(JSON.stringify(workflow, null, 2));
    setIsGenerating(false);

    toast({
      title: "Workflow сгенерирован!",
      description: "Скопируйте JSON и импортируйте его в n8n"
    });
  };

  const downloadWorkflow = () => {
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telegram-automation-workflow.json';
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
        <Button variant="outline" onClick={() => navigate('/automation-hub')}>
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Назад к автоматизациям
        </Button>
      </div>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
              <Icon name="Send" className="text-white" size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Автопостинг в Telegram</CardTitle>
              <CardDescription>Публикация постов в Telegram-канал через n8n</CardDescription>
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

            <TabsContent value="setup" data-tour="tg-setup" className="space-y-4">
              <Alert>
                <Icon name="Info" size={16} />
                <AlertDescription>
                  Настройте автопостинг в Telegram-канал. Посты берутся из Google Sheets.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="telegramBotToken">Telegram Bot Token *</Label>
                  <Input
                    id="telegramBotToken"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                    value={formData.telegramBotToken}
                    onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="channelId">ID Telegram-канала *</Label>
                  <Input
                    id="channelId"
                    placeholder="@your_channel или -1001234567890"
                    value={formData.channelId}
                    onChange={(e) => handleInputChange('channelId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Публичный: @username или приватный: числовой ID (начинается с -)
                  </p>
                </div>

                <div>
                  <Label htmlFor="googleSheetId">Google Sheet ID (опционально)</Label>
                  <Input
                    id="googleSheetId"
                    placeholder="1A2B3C4D5E6F7G8H9I0J..."
                    value={formData.googleSheetId}
                    onChange={(e) => handleInputChange('googleSheetId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Для хранения постов в таблице
                  </p>
                </div>

                <div>
                  <Label htmlFor="scheduleTime">Время публикации</Label>
                  <Input
                    id="scheduleTime"
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
                      Сгенерировать Workflow
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
                      Скачать JSON
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
                  <AlertDescription>
                    Сначала заполните настройки и сгенерируйте workflow
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-3">Как использовать:</h3>
                <ol className="space-y-2 text-sm">
                  <li>1. Создайте бота через <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a></li>
                  <li>2. Добавьте бота в канал как администратора</li>
                  <li>3. Заполните настройки и сгенерируйте workflow</li>
                  <li>4. Скачайте JSON и импортируйте в n8n</li>
                  <li>5. Настройте Google Sheets credentials в n8n (если используете)</li>
                  <li>6. Активируйте workflow</li>
                </ol>

                <h4 className="text-md font-semibold mt-6 mb-2">Формат таблицы Google Sheets:</h4>
                <p className="text-sm text-muted-foreground">Столбцы: <code>text</code>, <code>published</code></p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}