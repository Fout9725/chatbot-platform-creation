import { ChangeEvent, RefObject } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ACCEPTED } from './importArticleParsers';

interface ImportArticleContentTabProps {
  tab: 'paste' | 'file';
  setTab: (v: 'paste' | 'file') => void;
  content: string;
  setContent: (v: string) => void;
  wc: number;
  fileInputRef: RefObject<HTMLInputElement>;
  pickedFileName: string;
  parsing: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function ImportArticleContentTab({
  tab,
  setTab,
  content,
  setContent,
  wc,
  fileInputRef,
  pickedFileName,
  parsing,
  onFileChange,
}: ImportArticleContentTabProps) {
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'paste' | 'file')} className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="paste">
          <Icon name="ClipboardPaste" size={14} className="mr-1.5" />
          Вставить текст
        </TabsTrigger>
        <TabsTrigger value="file">
          <Icon name="FileUp" size={14} className="mr-1.5" />
          Загрузить файл
        </TabsTrigger>
      </TabsList>

      <TabsContent value="paste" className="space-y-3 mt-4">
        <div>
          <Label htmlFor="imp-content">Текст статьи (Markdown или обычный текст)</Label>
          <Textarea
            id="imp-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Заголовок&#10;&#10;Текст статьи..."
            className="min-h-[260px] font-mono text-sm"
          />
          <div className="text-xs text-slate-400 mt-1">{wc} слов</div>
        </div>
      </TabsContent>

      <TabsContent value="file" className="space-y-3 mt-4">
        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="FileUp" size={36} className="text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-medium">
            {pickedFileName ? pickedFileName : 'Нажмите, чтобы выбрать файл'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            TXT · Markdown · HTML · DOCX · PDF (до 10 МБ)
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            onChange={onFileChange}
            className="hidden"
          />
        </div>
        {parsing && (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Icon name="Loader2" size={12} className="animate-spin" />
            Разбираю файл…
          </div>
        )}
        {content && pickedFileName && (
          <div className="text-xs text-slate-500">
            Извлечено: <b>{wc}</b> слов · {content.length.toLocaleString('ru-RU')} символов
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
