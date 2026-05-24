import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { GeoPublication } from '@/lib/geo/api';
import { FilterId, STATUS_LABEL, isInLLM, isInSearch, timeAgo } from './publicationsHelpers';

interface PublicationsListProps {
  isLoading: boolean;
  allPubsCount: number;
  pubs: GeoPublication[];
  checkingId: string | null;
  onCheck: (id: string) => void;
  onOpenHistory: (p: GeoPublication) => void;
  onEdit: (p: GeoPublication) => void;
  onDelete: (id: string) => void;
  onOpenNew: () => void;
  onResetFilter: (f: FilterId) => void;
}

export default function PublicationsList({
  isLoading,
  allPubsCount,
  pubs,
  checkingId,
  onCheck,
  onOpenHistory,
  onEdit,
  onDelete,
  onOpenNew,
  onResetFilter,
}: PublicationsListProps) {
  if (isLoading) {
    return <div className="text-slate-500">Загрузка…</div>;
  }

  if (allPubsCount === 0) {
    return (
      <div className="bg-white border rounded-2xl p-12 text-center">
        <Icon name="Send" size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 mb-4">
          Пока нет публикаций. Добавьте опубликованные материалы — отследим попадание в LLM.
        </p>
        <Button onClick={onOpenNew}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить
        </Button>
      </div>
    );
  }

  if (pubs.length === 0) {
    return (
      <div className="bg-white border rounded-2xl p-12 text-center">
        <Icon name="FilterX" size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 mb-4">Под этот фильтр пока нет публикаций.</p>
        <Button variant="outline" onClick={() => onResetFilter('all')}>Сбросить фильтр</Button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl divide-y">
      {pubs.map((p) => {
        const s = STATUS_LABEL[p.status] || STATUS_LABEL.live;
        return (
          <div key={p.id} className="p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon name="Link" size={18} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                   className="font-medium text-slate-900 hover:text-indigo-600 truncate">
                  {p.title}
                </a>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                {p.providers?.url_alive?.found && (
                  <span
                    title="Страница отвечает по HTTP — публикация жива в открытом интернете"
                    className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  >
                    <Icon name="Globe" size={11} />
                    Страница жива
                  </span>
                )}
                {isInSearch(p) && (
                  <span
                    title="Найдена в поисковой выдаче Яндекса или Bing"
                    className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  >
                    <Icon name="Search" size={11} />
                    В поиске
                  </span>
                )}
                {isInLLM(p) && (
                  <span
                    title="Процитирована нейросетью с реальным веб-поиском (Perplexity / GPT-4o Search)"
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  >
                    <Icon name="Sparkles" size={11} />
                    В нейровыдаче
                  </span>
                )}
                {p.last_check_at && !isInSearch(p) && !isInLLM(p) && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Пока не нашли
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                {(p.urls || [p.url]).map((u, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <Icon name="Link" size={10} className="text-slate-400 flex-shrink-0" />
                    <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate">{u}</a>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                {(p.urls?.length || 0) > 1 && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 rounded">
                    <Icon name="Layers" size={11} />
                    {p.urls!.length} площадок
                  </span>
                )}
                {p.platform && <span><Icon name="Globe" size={11} className="inline mr-1" />{p.platform}</span>}
                {p.query_text && <span className="truncate"><Icon name="Search" size={11} className="inline mr-1" />{p.query_text}</span>}
                {p.last_check_at && <span>Проверено: {timeAgo(p.last_check_at)}</span>}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={checkingId === p.id}
              onClick={() => onCheck(p.id)}
            >
              {checkingId === p.id ? (
                <><Icon name="Loader2" size={14} className="mr-1 animate-spin" />Проверка…</>
              ) : (
                <><Icon name="ScanSearch" size={14} className="mr-1" />Проверить</>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenHistory(p)}>
              <Icon name="History" size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
              <Icon name="Pencil" size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { if (confirm('Удалить публикацию?')) onDelete(p.id); }}
            >
              <Icon name="Trash2" size={16} className="text-rose-500" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
