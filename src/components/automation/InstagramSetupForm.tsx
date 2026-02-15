import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_URL = 'https://functions.poehali.dev/a0badc6a-7e0c-48cd-8b5e-a5985f0d8b92';

interface InstagramSetupFormProps {
  onWorkflowGenerated: (json: string) => void;
}

const InstagramSetupForm = ({ onWorkflowGenerated }: InstagramSetupFormProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Ошибка генерации workflow');
      const data = await response.json();
      const json = JSON.stringify(data.workflow, null, 2);
      onWorkflowGenerated(json);
      toast({ title: "Workflow сгенерирован!", description: "Скачайте JSON и импортируйте в n8n" });
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

  return (
    <>
      <Alert>
        <Icon name="Info" size={16} />
        <AlertDescription>
          Workflow для Instagram*: генерация текста через Claude + картинка через DALL-E → всё сохраняется в Google Sheet со статусом «Готово к модерации». API-ключи вшиваются прямо в workflow.
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
            Найдите в URL таблицы: docs.google.com/spreadsheets/d/<strong>ВАШ_ID</strong>/edit
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
          <h3 className="font-semibold mb-3">Cloudinary (опционально — для наложения текста на картинку)</h3>
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
            Workflow запускается ежедневно в это время
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
    </>
  );
};

export default InstagramSetupForm;
