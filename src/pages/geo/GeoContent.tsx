import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoDraftListItem } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import ImportArticleDialog from '@/components/geo/ImportArticleDialog';
import { downloadDoc } from './geoContentUtils';
import DraftCard from './DraftCard';
import DraftEditor from './DraftEditor';

export default function GeoContent() {
  const qc = useQueryClient();
  const [genOpen, setGenOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const draftsQ = useQuery({
    queryKey: ['geo-drafts'],
    queryFn: () => geoApi.content.list(),
  });

  const coverageQ = useQuery({
    queryKey: ['geo-coverage', 7],
    queryFn: () => geoApi.analytics.coverage(7),
  });

  const queriesQ = useQuery({
    queryKey: ['geo-queries'],
    queryFn: () => geoApi.queries.list(),
  });

  const draftQ = useQuery({
    queryKey: ['geo-draft', editId],
    queryFn: () => geoApi.content.get(editId!),
    enabled: !!editId,
  });

  const generateMut = useMutation({
    mutationFn: geoApi.content.generate,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setGenOpen(false);
      setEditId(r.draft.id);
      toast({ title: 'Черновик готов', description: `${r.draft.word_count} слов` });
    },
    onError: (e: Error) => toast({ title: 'Ошибка генерации', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content_md?: string; status?: string; published_url?: string | null }) =>
      geoApi.content.update(id, data),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      qc.invalidateQueries({ queryKey: ['geo-draft'] });
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      if (r.publication_id) {
        toast({
          title: 'Сохранено и добавлено в Публикации',
          description: 'Запустил проверку через 3 нейросети — следите в разделе «Публикации».',
        });
        // Автоматически запускаем проверку через все 3 LLM
        geoApi.publications.check(r.publication_id).then(() => {
          qc.invalidateQueries({ queryKey: ['geo-publications'] });
        }).catch(() => { /* ошибка проверки не критична */ });
      } else {
        toast({ title: 'Сохранено' });
      }
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.content.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setEditId(null);
      toast({ title: 'Черновик удалён' });
    },
  });

  const onGenerate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const queryId = String(fd.get('query_id') || '');
    const topic = String(fd.get('topic') || '').trim();
    if (!queryId && !topic) {
      toast({ title: 'Выберите запрос или укажите тему', variant: 'destructive' });
      return;
    }
    generateMut.mutate({
      query_id: queryId || undefined,
      topic: topic || undefined,
      tone: String(fd.get('tone') || 'expert'),
      length: String(fd.get('length') || 'medium'),
    });
  };

  const drafts = draftsQ.data?.drafts || [];
  const lowCoverage = (coverageQ.data?.coverage || []).filter((c) => c.own_mentions === 0 && c.responses > 0);

  if (editId && draftQ.data) {
    return <DraftEditor
      draft={draftQ.data.draft as GeoDraftListItem & { content_md: string }}
      onBack={() => setEditId(null)}
      onSave={(data) => updateMut.mutate({ id: editId, ...data })}
      onDelete={() => {
        if (confirm('Удалить черновик?')) deleteMut.mutate(editId);
      }}
      isSaving={updateMut.isPending}
    />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Контент</h1>
          <p className="text-slate-500 mt-1">Черновики статей под GEO-запросы. Markdown, готов к публикации.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Icon name="Upload" size={16} className="mr-2" />
            Прикрепить свою статью
          </Button>
          <Button onClick={() => setGenOpen(true)}>
            <Icon name="Sparkles" size={16} className="mr-2" />
            Сгенерировать статью
          </Button>
        </div>
      </div>

      {lowCoverage.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Icon name="Lightbulb" size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Запросы без вашего бренда</h3>
              <p className="text-sm text-amber-800">Сгенерируйте статью, чтобы войти в эти ответы LLM.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowCoverage.slice(0, 6).map((c) => (
              <button
                key={c.query_id}
                onClick={() =>
                  generateMut.mutate({ query_id: c.query_id, tone: 'expert', length: 'medium' })
                }
                disabled={generateMut.isPending}
                className="text-xs bg-white border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-50 text-left max-w-md truncate"
                title={c.text}
              >
                <Icon name="Wand2" size={12} className="inline mr-1" />
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {draftsQ.isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : drafts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Icon name="FileText" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">
            Пока нет статей. Сгенерируйте новую или прикрепите свою.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => setGenOpen(true)}>
              <Icon name="Sparkles" size={16} className="mr-2" />
              Сгенерировать
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Icon name="Upload" size={16} className="mr-2" />
              Прикрепить свою
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((d) => (
            <DraftCard
              key={d.id}
              d={d}
              onOpen={() => setEditId(d.id)}
              onExport={async () => {
                const r = await geoApi.content.get(d.id);
                downloadDoc(d.title, r.draft.content_md);
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сгенерировать статью</DialogTitle>
          </DialogHeader>
          <form onSubmit={onGenerate} className="space-y-4">
            <div>
              <Label htmlFor="query_id">Из существующего запроса</Label>
              <select id="query_id" name="query_id" className="w-full border rounded-lg h-10 px-3 text-sm">
                <option value="">— не выбрано —</option>
                {(queriesQ.data?.queries || []).map((q) => (
                  <option key={q.id} value={q.id}>{q.text.slice(0, 80)}</option>
                ))}
              </select>
            </div>
            <div className="text-center text-xs text-slate-400">или</div>
            <div>
              <Label htmlFor="topic">Своя тема</Label>
              <Input id="topic" name="topic" placeholder="Например: лучшие CRM для малого бизнеса 2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tone">Тон</Label>
                <select id="tone" name="tone" defaultValue="expert" className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="expert">Экспертный</option>
                  <option value="friendly">Дружелюбный</option>
                  <option value="sales">Продающий</option>
                </select>
              </div>
              <div>
                <Label htmlFor="length">Объём</Label>
                <select id="length" name="length" defaultValue="medium" className="w-full border rounded-lg h-10 px-3 text-sm">
                  <option value="short">~400 слов</option>
                  <option value="medium">~800 слов</option>
                  <option value="long">~1500 слов</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={generateMut.isPending}>
                {generateMut.isPending ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Генерация…
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Создать
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImportArticleDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        queries={queriesQ.data?.queries || []}
        onCreated={(id) => setEditId(id)}
      />
    </div>
  );
}
