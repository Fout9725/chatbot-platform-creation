import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const API_URL = 'https://functions.poehali.dev/a0badc6a-7e0c-48cd-8b5e-a5985f0d8b92';

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  nodes_count: number;
  integrations: string[];
  difficulty: string;
}

interface ParamLabel {
  label: string;
  placeholder: string;
  type: string;
  hint: string;
}

interface TemplateDetail {
  name: string;
  description: string;
  required_params: string[];
  param_labels: Record<string, ParamLabel>;
  workflow: Record<string, unknown>;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

const difficultyLabels: Record<string, string> = {
  easy: 'Простой',
  medium: 'Средний',
  hard: 'Сложный'
};

const InstagramAutomation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowJson, setWorkflowJson] = useState('');
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const [formData, setFormData] = useState({
    googleSheetId: '',
    anthropicApiKey: '',
    openaiApiKey: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    scheduleTime: '10:00'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}?action=templates`);
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch {
      toast({ title: "Не удалось загрузить шаблоны", variant: "destructive" });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const openTemplateDetail = async (templateId: string) => {
    try {
      const response = await fetch(`${API_URL}?action=template&id=${templateId}`);
      if (!response.ok) throw new Error('Template not found');
      const data = await response.json();
      setSelectedTemplate(data.template);
      setSelectedTemplateId(templateId);
      setTemplateParams({});
      setShowTemplateDialog(true);
    } catch {
      toast({ title: "Не удалось загрузить шаблон", variant: "destructive" });
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplate) return;

    const missing = selectedTemplate.required_params.filter(p => !templateParams[p]);
    if (missing.length > 0) {
      toast({
        title: "Заполните обязательные поля",
        description: `Не заполнено: ${missing.map(p => selectedTemplate.param_labels[p]?.label || p).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setApplyingTemplate(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_template',
          templateId: selectedTemplateId,
          params: templateParams
        })
      });

      if (!response.ok) throw new Error('Failed to apply template');
      const data = await response.json();
      setWorkflowJson(JSON.stringify(data.workflow, null, 2));
      setShowTemplateDialog(false);
      setActiveTab('workflow');
      toast({ title: "Workflow готов!", description: "Скачайте JSON и импортируйте в n8n" });
    } catch {
      toast({ title: "Ошибка генерации", variant: "destructive" });
    } finally {
      setApplyingTemplate(false);
    }
  };

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
      setWorkflowJson(JSON.stringify(data.workflow, null, 2));
      setActiveTab('workflow');
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

  const downloadWorkflow = () => {
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowJson);
    toast({ title: "Скопировано!", description: "JSON скопирован в буфер обмена" });
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

            {/* === TEMPLATES TAB === */}
            <TabsContent value="templates" className="space-y-4 mt-4">
              <Alert>
                <Icon name="Sparkles" size={16} />
                <AlertDescription>
                  Выберите готовый шаблон, заполните свои данные — и получите рабочий n8n workflow за минуту. Все API-ключи вшиваются прямо в JSON.
                </AlertDescription>
              </Alert>

              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="Loader" size={24} className="animate-spin mr-2" />
                  <span className="text-muted-foreground">Загрузка шаблонов...</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((tpl) => (
                    <Card
                      key={tpl.id}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => openTemplateDetail(tpl.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-muted p-2 rounded-lg shrink-0">
                            <Icon name={tpl.icon} size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-sm">{tpl.name}</h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 ${difficultyColors[tpl.difficulty] || ''}`}>
                                {difficultyLabels[tpl.difficulty] || tpl.difficulty}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tpl.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">{tpl.category}</Badge>
                              <span className="text-[10px] text-muted-foreground">{tpl.nodes_count} узлов</span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">{tpl.integrations.join(', ')}</span>
                            </div>
                          </div>
                          <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* === INSTAGRAM TAB === */}
            <TabsContent value="instagram" className="space-y-4">
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
            </TabsContent>

            {/* === WORKFLOW TAB === */}
            <TabsContent value="workflow" className="space-y-4">
              {!workflowJson ? (
                <Alert>
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>
                    Выберите шаблон из галереи или заполните данные во вкладке "Instagram" и сгенерируйте workflow
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <Icon name="CheckCircle" size={16} className="text-green-600" />
                    <AlertDescription className="text-green-800">
                      Workflow готов! Все API-ключи уже вшиты в JSON — просто импортируйте в n8n.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button onClick={downloadWorkflow}>
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
                      В n8n: три точки → <strong>Import from File</strong> → загрузите скачанный JSON → <strong>Activate</strong>
                      <br/>
                      <span className="text-xs text-muted-foreground">Для Google Sheets и Telegram — настройте Credentials в n8n (OAuth или Token).</span>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>

            {/* === INSTRUCTIONS TAB === */}
            <TabsContent value="instructions" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon name="PlayCircle" size={20} />
                  Быстрый старт
                </h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">1. Выберите шаблон или создайте кастомный</h4>
                    <p className="text-sm text-muted-foreground">
                      Во вкладке «Шаблоны» — готовые автоматизации для Telegram, email, CRM, контента. Во вкладке «Instagram» — кастомный генератор контента.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">2. Заполните свои данные</h4>
                    <p className="text-sm text-muted-foreground">
                      API-ключи, ID таблиц, токены ботов — всё вшивается прямо в workflow JSON. Никаких плейсхолдеров после скачивания.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">3. Скачайте JSON</h4>
                    <p className="text-sm text-muted-foreground">
                      Нажмите «Скачать JSON» во вкладке Workflow. Файл готов к импорту.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">4. Импортируйте в n8n</h4>
                    <p className="text-sm text-muted-foreground">
                      В n8n: три точки (⋮) → <strong>Import from File</strong> → загрузите JSON файл. Для Google Sheets и Telegram нужно настроить Credentials в n8n.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">5. Активируйте</h4>
                    <p className="text-sm text-muted-foreground">
                      Переведите переключатель «Active» в правом верхнем углу n8n. Готово — автоматизация работает!
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 text-blue-900">
                    <Icon name="HelpCircle" size={18} />
                    Что такое n8n?
                  </h4>
                  <p className="text-sm text-blue-800 mt-1">
                    n8n — бесплатная open-source платформа для автоматизаций (аналог Zapier/Make). 
                    Можно поставить локально или использовать <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="underline">облачную версию</a>.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 text-amber-900">
                    <Icon name="AlertTriangle" size={18} />
                    Важно
                  </h4>
                  <ul className="text-sm text-amber-800 list-disc pl-4 mt-2 space-y-1">
                    <li>API-ключи встраиваются в JSON — храните файл в безопасности</li>
                    <li>Для Google Sheets нужно настроить OAuth2 в n8n (credentials)</li>
                    <li>Для Telegram-ботов — создайте бота через @BotFather и получите токен</li>
                    <li>n8n можно установить бесплатно через Docker: <code className="bg-muted px-1 rounded">docker run -it --name n8n -p 5678:5678 n8nio/n8n</code></li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center mt-4">* Instagram признан экстремистской организацией и запрещен на территории РФ.</p>

      {/* === TEMPLATE DETAIL DIALOG === */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-2">
                {selectedTemplate.required_params.map(paramKey => {
                  const paramInfo = selectedTemplate.param_labels[paramKey];
                  if (!paramInfo) return null;
                  return (
                    <div key={paramKey}>
                      <Label htmlFor={paramKey}>
                        {paramInfo.label} *
                      </Label>
                      <Input
                        id={paramKey}
                        type={paramInfo.type === 'password' ? 'password' : 'text'}
                        placeholder={paramInfo.placeholder}
                        value={templateParams[paramKey] || ''}
                        onChange={(e) => setTemplateParams(prev => ({ ...prev, [paramKey]: e.target.value }))}
                      />
                      {paramInfo.hint && (
                        <p className="text-xs text-muted-foreground mt-1">{paramInfo.hint}</p>
                      )}
                    </div>
                  );
                })}

                <Button
                  onClick={applyTemplate}
                  disabled={applyingTemplate}
                  className="w-full"
                  size="lg"
                >
                  {applyingTemplate ? (
                    <>
                      <Icon name="Loader" size={18} className="mr-2 animate-spin" />
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstagramAutomation;
