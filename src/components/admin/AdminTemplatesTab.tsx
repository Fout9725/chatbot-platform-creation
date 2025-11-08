import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface AdminTemplatesTabProps {
  templateText: string;
  setTemplateText: (value: string) => void;
  n8nJson: string;
  setN8nJson: (value: string) => void;
  selectedFile: File | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadTemplate: (type: 'text' | 'n8n' | 'file') => void;
}

const AdminTemplatesTab = ({
  templateText,
  setTemplateText,
  n8nJson,
  setN8nJson,
  selectedFile,
  handleFileUpload,
  handleUploadTemplate
}: AdminTemplatesTabProps) => {
  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="FileText" size={18} />
              Из текста
            </CardTitle>
            <CardDescription>Создать шаблон из описания</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Опишите логику работы бота..."
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              rows={5}
            />
            <Button 
              type="button" 
              className="w-full" 
              onClick={() => handleUploadTemplate('text')}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Создать
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Code" size={18} />
              N8N JSON
            </CardTitle>
            <CardDescription>Импорт из N8N</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder='{"nodes": [...], "connections": {...}}'
              value={n8nJson}
              onChange={(e) => setN8nJson(e.target.value)}
              rows={5}
              className="font-mono text-xs"
            />
            <Button 
              type="button" 
              className="w-full"
              onClick={() => handleUploadTemplate('n8n')}
            >
              <Icon name="Download" size={16} className="mr-2" />
              Импортировать
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Upload" size={18} />
              Из файла
            </CardTitle>
            <CardDescription>Загрузить документ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json,.txt,.yaml,.yml,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="template-upload"
              />
              <label htmlFor="template-upload" className="cursor-pointer">
                <Icon name="FileUp" size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">
                  {selectedFile ? selectedFile.name : 'Выберите файл'}
                </p>
              </label>
            </div>
            <Button 
              type="button" 
              className="w-full"
              onClick={() => handleUploadTemplate('file')}
              disabled={!selectedFile}
            >
              <Icon name="Upload" size={16} className="mr-2" />
              Загрузить
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Существующие шаблоны</CardTitle>
          <CardDescription>Библиотека шаблонов платформы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['CRM Интеграция', 'Email автоответчик', 'Аналитика данных', 'Соц. сети'].map((template, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="FileCode" className="text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{template}</p>
                    <p className="text-xs text-muted-foreground">
                      Использований: {Math.floor(Math.random() * 500) + 50}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm">
                    <Icon name="Edit" size={16} />
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    <Icon name="Trash2" size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminTemplatesTab;
