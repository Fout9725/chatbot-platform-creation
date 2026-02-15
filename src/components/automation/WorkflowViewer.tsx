import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowViewerProps {
  workflowJson: string;
}

const WorkflowViewer = ({ workflowJson }: WorkflowViewerProps) => {
  const { toast } = useToast();

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

  if (!workflowJson) {
    return (
      <Alert>
        <Icon name="AlertCircle" size={16} />
        <AlertDescription>
          Выберите шаблон из галереи или заполните данные во вкладке "Instagram" и сгенерируйте workflow
        </AlertDescription>
      </Alert>
    );
  }

  return (
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
  );
};

export default WorkflowViewer;
