import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface AdminBotsTabProps {
  botName: string;
  setBotName: (value: string) => void;
  botDescription: string;
  setBotDescription: (value: string) => void;
  selectedFile: File | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateBot: () => void;
}

const AdminBotsTab = ({
  botName,
  setBotName,
  botDescription,
  setBotDescription,
  selectedFile,
  handleFileUpload,
  handleCreateBot
}: AdminBotsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Создание бота для маркетплейса</CardTitle>
        <CardDescription>
          Добавьте готового бота в маркетплейс платформы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Название бота</label>
          <Input
            type="text"
            placeholder="Продажный помощник"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Описание</label>
          <Textarea
            placeholder="Опишите функции и возможности бота..."
            value={botDescription}
            onChange={(e) => setBotDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Категория</label>
            <Input type="text" placeholder="Продажи" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Цена (₽)</label>
            <Input type="number" placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Платформа</label>
            <Input type="text" placeholder="Telegram" />
          </div>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium mb-2 block">Загрузить конфигурацию бота</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
              id="bot-upload"
            />
            <label htmlFor="bot-upload" className="cursor-pointer">
              <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {selectedFile ? selectedFile.name : 'Нажмите для загрузки'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JSON, YAML (макс. 10MB)
              </p>
            </label>
          </div>
        </div>

        <Button type="button" className="w-full" onClick={handleCreateBot}>
          <Icon name="Plus" size={18} className="mr-2" />
          Создать и опубликовать бота
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminBotsTab;
