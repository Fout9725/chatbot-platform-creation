import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoPublication } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import {
  FilterId,
  PROVIDER_LABEL,
  isInLLM,
  isInSearch,
} from './publications/publicationsHelpers';
import PublicationsStatsAndFilters from './publications/PublicationsStatsAndFilters';
import PublicationsList from './publications/PublicationsList';
import PublicationDialogs from './publications/PublicationDialogs';

export default function GeoPublications() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeoPublication | null>(null);
  const [historyFor, setHistoryFor] = useState<GeoPublication | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');
  const [urls, setUrls] = useState<string[]>(['']);

  useEffect(() => {
    if (open && !editing) setUrls(['']);
    if (editing) {
      const list = editing.urls && editing.urls.length ? editing.urls : [editing.url];
      setUrls(list.length ? list : ['']);
    }
  }, [open, editing]);

  const pubsQ = useQuery({ queryKey: ['geo-publications'], queryFn: () => geoApi.publications.list() });
  const draftsQ = useQuery({ queryKey: ['geo-drafts'], queryFn: () => geoApi.content.list() });
  const queriesQ = useQuery({ queryKey: ['geo-queries'], queryFn: () => geoApi.queries.list() });

  const historyQ = useQuery({
    queryKey: ['geo-pub-history', historyFor?.id],
    queryFn: () => geoApi.publications.history(historyFor!.id),
    enabled: !!historyFor,
  });

  const createMut = useMutation({
    mutationFn: geoApi.publications.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      qc.invalidateQueries({ queryKey: ['geo-drafts'] });
      setOpen(false);
      toast({ title: 'Публикация добавлена' });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; url?: string; status?: string; notes?: string }) =>
      geoApi.publications.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      setEditing(null);
      toast({ title: 'Сохранено' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.publications.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      toast({ title: 'Удалено' });
    },
  });

  const checkMut = useMutation({
    mutationFn: (id: string) => geoApi.publications.check(id),
    onMutate: (id) => setCheckingId(id),
    onSettled: () => setCheckingId(null),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['geo-publications'] });
      qc.invalidateQueries({ queryKey: ['geo-pub-history'] });
      const okList = (r.results || [])
        .filter((x) => x.found)
        .map((x) => PROVIDER_LABEL[x.provider] || x.provider);
      toast({
        title: r.found ? 'Публикация найдена' : 'Пока не нашли',
        description:
          r.summary ||
          (r.found
            ? `Найдено в: ${okList.join(', ')}`
            : 'Подождите 1–4 недели и проверьте снова — нейросети и поисковики обновляют индекс постепенно.'),
      });
    },
    onError: (e: Error) => toast({ title: 'Ошибка проверки', description: e.message, variant: 'destructive' }),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
    const draft_id = String(fd.get('draft_id') || '') || undefined;
    const query_id = String(fd.get('query_id') || '') || undefined;
    const platform = String(fd.get('platform') || '').trim() || undefined;
    const notes = String(fd.get('notes') || '').trim() || undefined;
    if (!title || cleanUrls.length === 0) {
      toast({ title: 'Заполните название и хотя бы один URL', variant: 'destructive' });
      return;
    }
    const bad = cleanUrls.find((u) => !/^https?:\/\//i.test(u));
    if (bad) {
      toast({ title: 'Некорректный URL', description: bad, variant: 'destructive' });
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, title, urls: cleanUrls, platform, notes });
    } else {
      createMut.mutate({ title, urls: cleanUrls, draft_id, query_id, platform, notes });
    }
  };


  const allPubs = pubsQ.data?.publications || [];

  const counts = {
    all: allPubs.length,
    search: allPubs.filter(isInSearch).length,
    llm: allPubs.filter(isInLLM).length,
    both: allPubs.filter((p) => isInSearch(p) && isInLLM(p)).length,
    none: allPubs.filter((p) => p.last_check_at && !isInSearch(p) && !isInLLM(p)).length,
    unchecked: allPubs.filter((p) => !p.last_check_at).length,
  };

  const pubs = allPubs.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'search') return isInSearch(p);
    if (filter === 'llm') return isInLLM(p);
    if (filter === 'both') return isInSearch(p) && isInLLM(p);
    if (filter === 'none') return p.last_check_at && !isInSearch(p) && !isInLLM(p);
    if (filter === 'unchecked') return !p.last_check_at;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Публикации</h1>
          <p className="text-slate-500 mt-1">Опубликованные материалы и проверка попадания в LLM-ответы</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить публикацию
        </Button>
      </div>

      <PublicationsStatsAndFilters
        allPubsCount={allPubs.length}
        counts={counts}
        filter={filter}
        setFilter={setFilter}
      />

      <PublicationsList
        isLoading={pubsQ.isLoading}
        allPubsCount={allPubs.length}
        pubs={pubs}
        checkingId={checkingId}
        onCheck={(id) => checkMut.mutate(id)}
        onOpenHistory={(p) => setHistoryFor(p)}
        onEdit={(p) => setEditing(p)}
        onDelete={(id) => deleteMut.mutate(id)}
        onOpenNew={() => setOpen(true)}
        onResetFilter={setFilter}
      />

      <PublicationDialogs
        open={open}
        editing={editing}
        onClose={() => { setOpen(false); setEditing(null); }}
        urls={urls}
        setUrls={setUrls}
        onSubmit={onSubmit}
        isPending={createMut.isPending || updateMut.isPending}
        drafts={draftsQ.data?.drafts || []}
        queries={queriesQ.data?.queries || []}
        historyFor={historyFor}
        onCloseHistory={() => setHistoryFor(null)}
        historyLoading={historyQ.isLoading}
        historyChecks={historyQ.data?.checks}
      />
    </div>
  );
}
