import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const API_URL = 'https://functions.poehali.dev/a0badc6a-7e0c-48cd-8b5e-a5985f0d8b92';

export interface TemplateInfo {
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

interface TemplatesGalleryProps {
  onWorkflowGenerated: (json: string) => void;
}

const TemplatesGallery = ({ onWorkflowGenerated }: TemplatesGalleryProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(templates.map(t => t.category))];
  const filteredTemplates = activeCategory
    ? templates.filter(t => t.category === activeCategory)
    : templates;

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
      const json = JSON.stringify(data.workflow, null, 2);
      setShowTemplateDialog(false);
      onWorkflowGenerated(json);
      toast({ title: "Workflow готов!", description: "Скачайте JSON и импортируйте в n8n" });
    } catch {
      toast({ title: "Ошибка генерации", variant: "destructive" });
    } finally {
      setApplyingTemplate(false);
    }
  };

  return (
    <>
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
        <>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={activeCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              Все
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {filteredTemplates.map((tpl) => (
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
        </>
      )}

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
    </>
  );
};

export default TemplatesGallery;