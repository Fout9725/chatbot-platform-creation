import { GeoMention } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';

const SENTIMENT_STYLE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Позитив', icon: 'TrendingUp' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Негатив', icon: 'TrendingDown' },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Нейтрально', icon: 'Minus' },
};

const PROVIDER_LABEL: Record<string, string> = {
  openai_gpt4o: 'GPT-4o mini',
  openai_gpt4: 'GPT-4o',
  openai_search: 'ChatGPT Search',
  perplexity: 'Perplexity',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

export default function MentionsFeed({ mentions }: { mentions: GeoMention[] }) {
  if (!mentions.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Пока нет упоминаний.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {mentions.map((m) => {
        const s = SENTIMENT_STYLE[m.sentiment] || SENTIMENT_STYLE.neutral;
        return (
          <div key={m.id} className="border rounded-xl p-4 bg-white">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`font-medium ${m.is_own ? 'text-indigo-700' : 'text-slate-700'}`}>
                {m.brand_name}
              </span>
              {m.is_own && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">мой</span>}
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                <Icon name={s.icon} size={12} />
                {s.label}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{PROVIDER_LABEL[m.provider] || m.provider}</span>
              <span className="text-xs text-slate-400 ml-auto">{timeAgo(m.created_at)}</span>
            </div>
            <div className="text-sm text-slate-600 mb-2 line-clamp-2 italic">«{m.snippet}»</div>
            <div className="text-xs text-slate-400 truncate">
              <Icon name="Search" size={11} className="inline mr-1" />
              {m.query_text}
            </div>
          </div>
        );
      })}
    </div>
  );
}