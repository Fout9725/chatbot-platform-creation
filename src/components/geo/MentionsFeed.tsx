import { useMemo } from 'react';
import { GeoMention } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';

const SENTIMENT_STYLE: Record<
  string,
  { bg: string; text: string; label: string; icon: string; bar: string; emoji: string }
> = {
  positive: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Позитив',
    icon: 'TrendingUp',
    bar: 'bg-emerald-400',
    emoji: '👍',
  },
  negative: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    label: 'Негатив',
    icon: 'TrendingDown',
    bar: 'bg-rose-400',
    emoji: '👎',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Нейтрально',
    icon: 'Minus',
    bar: 'bg-slate-300',
    emoji: '➖',
  },
};

const PROVIDER_LABEL: Record<string, string> = {
  openai_gpt4o: 'GPT-4o mini',
  openai_gpt4: 'GPT-4o',
  openai_search: 'ChatGPT Search',
  perplexity: 'Perplexity',
  perplexity_sonar: 'Perplexity Sonar',
  gpt4o_search: 'ChatGPT Search',
  yandex_gpt: 'YandexGPT',
};

const PROVIDER_ICON: Record<string, { icon: string; cls: string }> = {
  openai_gpt4o: { icon: 'Sparkles', cls: 'bg-emerald-100 text-emerald-700' },
  openai_gpt4: { icon: 'Sparkles', cls: 'bg-emerald-100 text-emerald-700' },
  openai_search: { icon: 'Search', cls: 'bg-blue-100 text-blue-700' },
  perplexity: { icon: 'Globe', cls: 'bg-violet-100 text-violet-700' },
  perplexity_sonar: { icon: 'Globe', cls: 'bg-violet-100 text-violet-700' },
  gpt4o_search: { icon: 'Search', cls: 'bg-blue-100 text-blue-700' },
  yandex_gpt: { icon: 'Search', cls: 'bg-rose-100 text-rose-700' },
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

function brandColor(name: string): string {
  const palette = [
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-blue-500',
    'from-violet-500 to-fuchsia-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function MentionsFeed({ mentions }: { mentions: GeoMention[] }) {
  const stats = useMemo(() => {
    const total = mentions.length;
    let pos = 0, neg = 0, neu = 0, own = 0;
    for (const m of mentions) {
      if (m.sentiment === 'positive') pos += 1;
      else if (m.sentiment === 'negative') neg += 1;
      else neu += 1;
      if (m.is_own) own += 1;
    }
    return { total, pos, neg, neu, own };
  }, [mentions]);

  if (!mentions.length) {
    return (
      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <Icon name="MessageSquareDashed" size={36} className="text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-medium text-slate-600">Пока нет упоминаний</div>
        <div className="text-xs text-slate-400 mt-1">
          Запустите опрос — здесь появятся ответы LLM с упоминаниями брендов
        </div>
      </div>
    );
  }

  const posPct = stats.total ? Math.round((stats.pos / stats.total) * 100) : 0;
  const negPct = stats.total ? Math.round((stats.neg / stats.total) * 100) : 0;

  return (
    <div>
      {/* Мини-сводка сверху */}
      <div className="mb-4 flex items-center gap-2 flex-wrap text-xs">
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
          <Icon name="Sparkles" size={11} />
          {stats.own} ваших из {stats.total}
        </span>
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
          <Icon name="TrendingUp" size={11} />
          Позитив {posPct}%
        </span>
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded-full">
          <Icon name="TrendingDown" size={11} />
          Негатив {negPct}%
        </span>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {mentions.map((m) => {
          const s = SENTIMENT_STYLE[m.sentiment] || SENTIMENT_STYLE.neutral;
          const prov = PROVIDER_ICON[m.provider] || {
            icon: 'Cpu',
            cls: 'bg-slate-100 text-slate-600',
          };
          // Шкала «силы» сентимента 0..1 — берём sentiment_score
          const score = Math.max(0, Math.min(1, Math.abs(m.sentiment_score || 0)));
          return (
            <div
              key={m.id}
              className={`relative bg-white border rounded-xl p-3.5 pl-4 transition hover:shadow-md hover:border-slate-300 group ${
                m.is_own ? 'ring-1 ring-indigo-100' : ''
              }`}
            >
              {/* Цветная полоска слева — сентимент */}
              <div
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${s.bar}`}
              />

              <div className="flex items-start gap-3">
                {/* Аватарка бренда с инициалами */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${brandColor(m.brand_name)} shadow-sm`}
                  title={m.brand_name}
                >
                  {initials(m.brand_name) || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`font-semibold text-sm ${m.is_own ? 'text-indigo-700' : 'text-slate-800'}`}
                    >
                      {m.brand_name}
                    </span>
                    {m.is_own && (
                      <span className="text-[10px] uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                        Вы
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${s.bg} ${s.text} font-medium`}
                      title={`Sentiment score: ${m.sentiment_score?.toFixed(2) ?? '—'}`}
                    >
                      <Icon name={s.icon} size={10} />
                      {s.label}
                    </span>
                    {m.position > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium"
                        title="Позиция в ответе LLM"
                      >
                        <Icon name="Hash" size={10} />
                        {m.position}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                      {timeAgo(m.created_at)}
                    </span>
                  </div>

                  <div className="text-sm text-slate-700 mb-2 line-clamp-2 leading-snug">
                    «{m.snippet}»
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${prov.cls}`}
                    >
                      <Icon name={prov.icon} size={10} />
                      {PROVIDER_LABEL[m.provider] || m.provider}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[60%]">
                      <Icon name="Search" size={10} className="flex-shrink-0" />
                      <span className="truncate">{m.query_text}</span>
                    </span>
                    {/* Шкала силы сентимента */}
                    {score > 0 && (
                      <div
                        className="ml-auto flex items-center gap-1"
                        title={`Сила сентимента: ${Math.round(score * 100)}%`}
                      >
                        <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${s.bar}`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
