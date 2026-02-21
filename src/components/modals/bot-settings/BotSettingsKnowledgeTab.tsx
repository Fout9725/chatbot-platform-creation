import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface KnowledgeSource {
  id: number;
  bot_id: number;
  source_type: string;
  title: string;
  url?: string;
  file_url?: string;
  file_type?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

interface BotSettingsKnowledgeTabProps {
  fileInputRef: RefObject<HTMLInputElement>;
  loading: string | null;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  textInput: string;
  setTextInput: (v: string) => void;
  sources: KnowledgeSource[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddUrl: () => void;
  handleAddText: () => void;
  handleDeleteSource: (id: number) => void;
}

export default function BotSettingsKnowledgeTab({
  fileInputRef,
  loading,
  websiteUrl,
  setWebsiteUrl,
  textInput,
  setTextInput,
  sources,
  handleFileUpload,
  handleAddUrl,
  handleAddText,
  handleDeleteSource,
}: BotSettingsKnowledgeTabProps) {
  return (
    <TabsContent value="knowledge" className="space-y-4 mt-4">
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Icon name="Upload" size={18} />
          Загрузить файл
        </h4>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
        >
          {loading === 'file' ? (
            <>
              <Icon name="Loader2" size={32} className="mx-auto mb-2 text-primary animate-spin" />
              <p className="text-sm font-medium">Обработка файла...</p>
            </>
          ) : (
            <>
              <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Нажмите для загрузки</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV (макс. 10 МБ)</p>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Icon name="Globe" size={18} />
          Добавить сайт
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <Button size="sm" onClick={handleAddUrl} disabled={loading === 'url'}>
            {loading === 'url' ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Link" size={16} className="mr-1" />}
            {loading === 'url' ? '' : 'Добавить'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Бот извлечёт текст со страницы и добавит в базу знаний</p>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Icon name="FileText" size={18} />
          Добавить текст
        </h4>
        <Textarea
          placeholder="Вставьте текст, FAQ, инструкции..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={4}
        />
        <Button size="sm" onClick={handleAddText} disabled={loading === 'text'}>
          {loading === 'text' ? <Icon name="Loader2" size={16} className="animate-spin mr-1" /> : <Icon name="Plus" size={16} className="mr-1" />}
          Добавить в базу
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="font-semibold mb-3">Загруженные источники ({sources.length})</h4>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Источники знаний пока не добавлены</p>
        ) : (
          <div className="space-y-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    name={s.source_type === 'url' ? 'Globe' : s.source_type === 'file' ? 'File' : 'FileText'}
                    size={16}
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.source_type === 'url' ? s.url : s.file_type?.toUpperCase() || 'Текст'}
                      {' '}&middot;{' '}
                      <Badge variant={s.status === 'ready' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {s.status === 'ready' ? 'Готово' : 'Ошибка'}
                      </Badge>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDeleteSource(s.id)}>
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
