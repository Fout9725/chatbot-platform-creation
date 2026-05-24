export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  live: { label: 'Опубликовано', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Ожидает', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'В архиве', cls: 'bg-slate-100 text-slate-600' },
  removed: { label: 'Снято', cls: 'bg-rose-100 text-rose-700' },
};

export const PROVIDER_LABEL: Record<string, string> = {
  url_alive: 'Страница жива',
  yandex_search: 'Яндекс (поиск)',
  duckduckgo: 'DuckDuckGo / Bing',
  perplexity_sonar: 'Perplexity (нейропоиск)',
  gpt4o_search: 'ChatGPT Search',
  // Старые ключи — для обратной совместимости со старыми записями
  openai_gpt4o: 'GPT-4o mini (без интернета)',
  openai_gpt4: 'GPT-4o (без интернета)',
  openai_search: 'ChatGPT Search',
  perplexity: 'Perplexity',
  yandex_gpt: 'YandexGPT (без интернета)',
};

export const PROVIDER_HINT: Record<string, string> = {
  url_alive: 'Страница отвечает кодом 200 — публикация существует в открытом интернете',
  yandex_search: 'Публикация найдена в поисковой выдаче Яндекса',
  duckduckgo: 'Найдена в DuckDuckGo (использует индекс Bing/Google)',
  perplexity_sonar: 'Нейросеть с реальным доступом в интернет процитировала источник',
  gpt4o_search: 'GPT-4o с веб-поиском процитировал источник',
};

export const FILTER_OPTIONS = [
  { id: 'all', label: 'Все', icon: 'List' },
  { id: 'search', label: 'В поиске', icon: 'Search' },
  { id: 'llm', label: 'В нейровыдаче', icon: 'Sparkles' },
  { id: 'both', label: 'Везде', icon: 'CheckCircle2' },
  { id: 'none', label: 'Не нашли', icon: 'XCircle' },
  { id: 'unchecked', label: 'Не проверено', icon: 'CircleDashed' },
] as const;

export type FilterId = typeof FILTER_OPTIONS[number]['id'];

// Поисковики (Яндекс / DuckDuckGo)
export function isInSearch(p: { providers?: Record<string, { found: boolean }> }) {
  const pr = p.providers || {};
  return !!(pr.yandex_search?.found || pr.duckduckgo?.found);
}
// Search-enabled LLM (Perplexity Sonar, GPT-4o Search) + старые ключи
export function isInLLM(p: { providers?: Record<string, { found: boolean }> }) {
  const pr = p.providers || {};
  return !!(
    pr.perplexity_sonar?.found ||
    pr.gpt4o_search?.found ||
    pr.perplexity?.found ||
    pr.openai_search?.found ||
    Object.entries(pr).some(([k, v]) => k.startsWith('openai_gpt') && v.found) ||
    pr.yandex_gpt?.found
  );
}

export function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(s: string | null) {
  if (!s) return null;
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}
