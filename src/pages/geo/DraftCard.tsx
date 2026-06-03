import { GeoDraftListItem } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { STATUS_LABEL, formatDate } from './geoContentUtils';

export default function DraftCard({ d, onOpen, onExport }: { d: GeoDraftListItem; onOpen: () => void; onExport: () => void }) {
  const s = STATUS_LABEL[d.status] || STATUS_LABEL.draft;
  return (
    <div className={`bg-white border rounded-2xl p-5 hover:shadow-md transition flex flex-col ${
      d.status === 'published' ? 'ring-1 ring-indigo-200' : ''
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
        <span className="text-xs text-slate-400">{d.word_count} слов</span>
      </div>
      <h3 className="font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-indigo-600" onClick={onOpen}>
        {d.title}
      </h3>
      {d.query_text && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-1">
          <Icon name="Search" size={11} className="inline mr-1" />
          {d.query_text}
        </p>
      )}
      {d.published_url && (
        <a
          href={d.published_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-800 mb-2 truncate inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          title={d.published_url}
        >
          <Icon name="ExternalLink" size={11} />
          <span className="truncate">{d.published_url.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      <div className="text-xs text-slate-400 mb-3">{formatDate(d.updated_at)}</div>
      <div className="flex gap-2 mt-auto">
        <Button size="sm" variant="outline" className="flex-1" onClick={onOpen}>
          <Icon name="Pencil" size={14} className="mr-1" />
          Открыть
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
          <Icon name="Download" size={14} />
        </Button>
      </div>
    </div>
  );
}
