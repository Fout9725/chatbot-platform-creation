import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_URL = 'https://functions.poehali.dev/a0badc6a-7e0c-48cd-8b5e-a5985f0d8b92';
const STORAGE_KEY = 'instagram-setup-form';

interface InstagramSetupFormProps {
  onWorkflowGenerated: (json: string) => void;
}

type KeyStatus = 'idle' | 'checking' | 'valid' | 'error';

interface KeyValidation {
  status: KeyStatus;
  message: string;
}

const InstagramSetupForm = ({ onWorkflowGenerated }: InstagramSetupFormProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState(() => {
    const defaults = {
      googleSheetId: '',
      anthropicApiKey: '',
      openaiApiKey: '',
      cloudinaryCloudName: '',
      cloudinaryApiKey: '',
      cloudinaryApiSecret: '',
      scheduleTime: '10:00'
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const [keyStatus, setKeyStatus] = useState<{
    anthropic: KeyValidation;
    openai: KeyValidation;
  }>({
    anthropic: { status: 'idle', message: '' },
    openai: { status: 'idle', message: '' }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'anthropicApiKey') {
      setKeyStatus(prev => ({ ...prev, anthropic: { status: 'idle', message: '' } }));
    }
    if (field === 'openaiApiKey') {
      setKeyStatus(prev => ({ ...prev, openai: { status: 'idle', message: '' } }));
    }
  };

  const validateKey = async (provider: 'anthropic' | 'openai', pastedValue?: string) => {
    const keyField = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
    const keyValue = (pastedValue ?? formData[keyField]).trim();

    if (!keyValue) {
      toast({ title: "Введите ключ", description: `Поле ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} пустое`, variant: "destructive" });
      return;
    }

    setKeyStatus(prev => ({ ...prev, [provider]: { status: 'checking', message: 'Проверяю...' } }));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_keys', [keyField]: keyValue })
      });

      const data = await response.json();
      const result = data.results?.[provider];

      if (result) {
        setKeyStatus(prev => ({
          ...prev,
          [provider]: {
            status: result.valid ? 'valid' : 'error',
            message: result.message
          }
        }));
      } else {
        setKeyStatus(prev => ({ ...prev, [provider]: { status: 'error', message: 'Нет ответа от сервера' } }));
      }
    } catch {
      setKeyStatus(prev => ({ ...prev, [provider]: { status: 'error', message: 'Ошибка сети' } }));
    }
  };

  const handlePaste = (provider: 'anthropic' | 'openai') => (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.length >= 10) {
      const field = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
      setFormData(prev => ({ ...prev, [field]: pasted }));
      setTimeout(() => validateKey(provider, pasted), 100);
    }
  };

  const validateAllKeys = async () => {
    const promises: Promise<void>[] = [];
    if (formData.anthropicApiKey.trim()) promises.push(validateKey('anthropic'));
    if (formData.openaiApiKey.trim()) promises.push(validateKey('openai'));

    if (promises.length === 0) {
      toast({ title: "Введите ключи", description: "Заполните хотя бы один API-ключ для проверки", variant: "destructive" });
      return;
    }

    await Promise.all(promises);
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

  const statusIcon = (status: KeyStatus) => {
    switch (status) {
      case 'checking': return <Icon name="Loader" size={16} className="animate-spin text-muted-foreground" />;
      case 'valid': return <Icon name="CheckCircle" size={16} className="text-green-500" />;
      case 'error': return <Icon name="XCircle" size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const statusColor = (status: KeyStatus) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const allKeysValid = keyStatus.anthropic.status === 'valid' && keyStatus.openai.status === 'valid';

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
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="anthropicApiKey"
                type="password"
                placeholder="sk-ant-..."
                value={formData.anthropicApiKey}
                onChange={(e) => handleInputChange('anthropicApiKey', e.target.value)}
                onPaste={handlePaste('anthropic')}
                className={keyStatus.anthropic.status === 'valid' ? 'border-green-500 pr-8' : keyStatus.anthropic.status === 'error' ? 'border-red-500 pr-8' : ''}
              />
              {keyStatus.anthropic.status !== 'idle' && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {statusIcon(keyStatus.anthropic.status)}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => validateKey('anthropic')}
              disabled={keyStatus.anthropic.status === 'checking' || !formData.anthropicApiKey.trim()}
              className="shrink-0 h-10"
            >
              {keyStatus.anthropic.status === 'checking' ? (
                <Icon name="Loader" size={14} className="animate-spin" />
              ) : (
                <Icon name="ShieldCheck" size={14} />
              )}
              <span className="ml-1.5">Проверить</span>
            </Button>
          </div>
          {keyStatus.anthropic.message && (
            <p className={`text-xs mt-1 ${statusColor(keyStatus.anthropic.status)}`}>
              {keyStatus.anthropic.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Получите на <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.anthropic.com</a>
          </p>
        </div>

        <div>
          <Label htmlFor="openaiApiKey">OpenAI API Key (DALL-E 3) *</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="openaiApiKey"
                type="password"
                placeholder="sk-..."
                value={formData.openaiApiKey}
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                onPaste={handlePaste('openai')}
                className={keyStatus.openai.status === 'valid' ? 'border-green-500 pr-8' : keyStatus.openai.status === 'error' ? 'border-red-500 pr-8' : ''}
              />
              {keyStatus.openai.status !== 'idle' && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {statusIcon(keyStatus.openai.status)}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => validateKey('openai')}
              disabled={keyStatus.openai.status === 'checking' || !formData.openaiApiKey.trim()}
              className="shrink-0 h-10"
            >
              {keyStatus.openai.status === 'checking' ? (
                <Icon name="Loader" size={14} className="animate-spin" />
              ) : (
                <Icon name="ShieldCheck" size={14} />
              )}
              <span className="ml-1.5">Проверить</span>
            </Button>
          </div>
          {keyStatus.openai.message && (
            <p className={`text-xs mt-1 ${statusColor(keyStatus.openai.status)}`}>
              {keyStatus.openai.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Получите на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>
          </p>
        </div>

        {(formData.anthropicApiKey.trim() || formData.openaiApiKey.trim()) && (
          <Button
            variant="secondary"
            onClick={validateAllKeys}
            disabled={keyStatus.anthropic.status === 'checking' || keyStatus.openai.status === 'checking'}
            className="w-full"
          >
            <Icon name="ShieldCheck" size={16} className="mr-2" />
            Проверить все ключи
          </Button>
        )}

        {allKeysValid && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <Icon name="CheckCircle" size={16} className="text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Все API-ключи проверены и работают. Можно генерировать workflow.
            </AlertDescription>
          </Alert>
        )}

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