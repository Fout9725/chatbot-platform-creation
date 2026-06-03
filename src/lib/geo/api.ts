import funcUrls from '../../../backend/func2url.json';

const URLS = funcUrls as Record<string, string>;
export const GEO_AUTH_URL = URLS['geo-auth'];
export const GEO_BRANDS_URL = URLS['geo-brands'];
export const GEO_QUERIES_URL = URLS['geo-queries'];
export const GEO_POLL_URL = URLS['geo-poll'];
export const GEO_ANALYTICS_URL = URLS['geo-analytics'];
export const GEO_CONTENT_URL = URLS['geo-content'];
export const GEO_PUBS_URL = URLS['geo-publications'];
export const GEO_SETTINGS_URL = URLS['geo-settings'];
export const GEO_PROJECTS_URL = URLS['geo-projects'];

const TOKEN_KEY = 'geo_token';
const PROJECT_KEY = 'geo_project_id';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const projectStore = {
  get: () => localStorage.getItem(PROJECT_KEY),
  set: (id: string) => localStorage.setItem(PROJECT_KEY, id),
  clear: () => localStorage.removeItem(PROJECT_KEY),
};

// Функции, к запросам которых НЕ нужно добавлять project_id (глобальные/межпроектные)
const PROJECT_AGNOSTIC = [GEO_AUTH_URL, GEO_PROJECTS_URL, GEO_SETTINGS_URL];

/** Добавляет project_id в URL (query) и в JSON-body, если он ещё не задан явно. */
function withProject(url: string, init: RequestInit): { url: string; init: RequestInit } {
  const projectId = projectStore.get();
  if (!projectId) return { url, init };
  if (PROJECT_AGNOSTIC.some((u) => u && url.startsWith(u))) return { url, init };

  let nextUrl = url;
  if (!/[?&]project_id=/.test(url)) {
    nextUrl += (url.includes('?') ? '&' : '?') + `project_id=${encodeURIComponent(projectId)}`;
  }

  let nextInit = init;
  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET' && typeof init.body === 'string') {
    try {
      const parsed = JSON.parse(init.body);
      if (parsed && typeof parsed === 'object' && parsed.project_id == null) {
        parsed.project_id = projectId;
        nextInit = { ...init, body: JSON.stringify(parsed) };
      }
    } catch {
      /* тело не JSON — оставляем как есть */
    }
  }
  return { url: nextUrl, init: nextInit };
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers['X-Auth-Token'] = token;

  const withProj = withProject(url, init);
  url = withProj.url;
  init = withProj.init;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (netErr) {
    throw new Error(
      'Не удалось связаться с сервером. Проверьте интернет-соединение и попробуйте ещё раз.',
    );
  }
  const text = await res.text();
  let data: { error?: string; message?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 200) };
    }
  }
  if (!res.ok) {
    // Сервер передаёт message — приоритет ему (понятный пользователю текст)
    const msg = data.message || data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export type GeoUser = {
  id: string;
  email: string;
  tenant_id: string;
  company: string;
  plan?: string;
  is_owner: boolean;
};

export type GeoBrand = {
  id: string;
  name: string;
  aliases: string[];
  is_own: boolean;
  created_at: string;
};

export type GeoQueryCategory = 'commercial' | 'comparison' | 'informational' | 'branded' | 'navigational' | 'local' | 'other';
export type GeoQueryIntent = 'buy' | 'compare' | 'choose' | 'learn' | 'find' | 'review' | 'other';

export type GeoQueryMetrics = {
  own_mentions: number;
  competitor_mentions: number;
  total_mentions: number;
  sov: number;
  trend: '+' | '-' | '=';
  sov_delta: number;
  top_competitor: { name: string; count: number } | null;
  window_days: number;
};

export type GeoQuery = {
  id: string;
  text: string;
  language: string;
  is_active: boolean;
  category: GeoQueryCategory | null;
  intent: GeoQueryIntent | null;
  notes: string | null;
  source: string;
  created_at: string;
  last_polled: string | null;
  responses_count: number;
  metrics?: GeoQueryMetrics | null;
};

export type GeoQuerySuggestion = {
  text: string;
  category: GeoQueryCategory;
  intent: GeoQueryIntent;
  reason: string;
  mentions_own: boolean;
};

export type GeoCompetitorGap = {
  id: string;
  text: string;
  category: GeoQueryCategory | null;
  intent: GeoQueryIntent | null;
  responses: number;
  own_mentions: number;
  competitor_mentions: number;
  top_competitors: Array<{ name: string; count: number }>;
};

export const geoApi = {
  register: (email: string, password: string, company: string) =>
    request<{ token: string; user: GeoUser }>(
      `${GEO_AUTH_URL}?action=register`,
      { method: 'POST', body: JSON.stringify({ email, password, company }) },
    ),

  login: (email: string, password: string) =>
    request<{ token: string; user: GeoUser }>(`${GEO_AUTH_URL}?action=login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: GeoUser }>(`${GEO_AUTH_URL}?action=me`, { method: 'GET' }),

  brands: {
    list: () => request<{ brands: GeoBrand[] }>(GEO_BRANDS_URL, { method: 'GET' }),
    create: (data: { name: string; aliases?: string[]; is_own?: boolean }) =>
      request<{ brand: GeoBrand }>(GEO_BRANDS_URL, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; aliases: string[]; is_own: boolean }>) =>
      request<{ ok: true }>(`${GEO_BRANDS_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_BRANDS_URL}?id=${id}`, { method: 'DELETE' }),
  },

  queries: {
    list: (days = 14) =>
      request<{ queries: GeoQuery[] }>(`${GEO_QUERIES_URL}?days=${days}`, { method: 'GET' }),
    create: (data: {
      text: string;
      language?: string;
      is_active?: boolean;
      category?: GeoQueryCategory | null;
      intent?: GeoQueryIntent | null;
      notes?: string | null;
      source?: string;
    }) =>
      request<{ query: GeoQuery }>(GEO_QUERIES_URL, { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{
        text: string;
        language: string;
        is_active: boolean;
        category: GeoQueryCategory | null;
        intent: GeoQueryIntent | null;
        notes: string | null;
      }>,
    ) =>
      request<{ ok: true }>(`${GEO_QUERIES_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_QUERIES_URL}?id=${id}`, { method: 'DELETE' }),
    suggest: (data: {
      industry?: string;
      region?: string;
      count?: number;
      focus?: 'all' | 'commercial' | 'comparison' | 'informational' | 'branded';
      extra_context?: string;
    } = {}) =>
      request<{
        suggestions: GeoQuerySuggestion[];
        context: { own_brand: string | null; competitors_count: number; industry: string | null; region: string };
      }>(`${GEO_QUERIES_URL}?action=suggest`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    bulkCreate: (
      items: Array<string | {
        text: string;
        language?: string;
        category?: GeoQueryCategory | null;
        intent?: GeoQueryIntent | null;
        notes?: string | null;
        source?: string;
      }>,
    ) =>
      request<{ created: number; skipped: number; total: number }>(
        `${GEO_QUERIES_URL}?action=bulk_create`,
        { method: 'POST', body: JSON.stringify({ items }) },
      ),
    competitorGaps: (days = 14) =>
      request<{ gaps: GeoCompetitorGap[]; weak_spots: GeoCompetitorGap[]; window_days: number }>(
        `${GEO_QUERIES_URL}?action=competitor_gaps&days=${days}`,
        { method: 'GET' },
      ),
  },

  poll: (queryId?: string) =>
    request<GeoPollResponse>(GEO_POLL_URL, {
      method: 'POST',
      body: JSON.stringify(queryId ? { query_id: queryId } : {}),
    }),

  pollBatch: (params: { offset?: number; batch_size?: number; query_id?: string } = {}) =>
    request<GeoPollResponse>(GEO_POLL_URL, {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  /** Опросить все запросы пачками с автоматическим продолжением до конца. */
  pollAll: async (
    onProgress?: (info: { processed: number; total: number; responses: number; mentions: number }) => void,
  ): Promise<GeoPollResponse> => {
    let offset = 0;
    const totals = { polled: 0, responses: 0, mentions: 0, total: 0 };
    const allErrors: Array<{ query_id: string; provider: string; error: string }> = [];
    let lastNote: string | null | undefined = null;
    // Защита от бесконечного цикла. По 1 запросу за вызов (3 нейросети на запрос).
    for (let i = 0; i < 300; i++) {
      const r = await request<GeoPollResponse>(GEO_POLL_URL, {
        method: 'POST',
        body: JSON.stringify({ offset, batch_size: 1 }),
      });
      totals.polled += r.polled;
      totals.responses += r.responses;
      totals.mentions += r.mentions;
      totals.total = r.total ?? totals.total;
      if (r.errors) allErrors.push(...r.errors);
      if (r.note) lastNote = r.note;
      onProgress?.({
        processed: Math.min(offset + (r.processed_in_batch ?? 0), totals.total || 0),
        total: totals.total,
        responses: totals.responses,
        mentions: totals.mentions,
      });
      // Если у поставщика реально закончились деньги — не дёргаем дальше
      if (r.note === 'billing_blocked') break;
      if (r.next_offset == null) break;
      offset = r.next_offset;
    }
    return {
      polled: totals.polled,
      responses: totals.responses,
      mentions: totals.mentions,
      total: totals.total,
      next_offset: null,
      note: lastNote ?? undefined,
      errors: allErrors.slice(0, 20),
    };
  },

  analytics: {
    overview: (days = 7) =>
      request<GeoOverview>(`${GEO_ANALYTICS_URL}?action=overview&days=${days}`, { method: 'GET' }),
    sovTrend: (days = 7) =>
      request<{ trend: Array<Record<string, number | string>>; brands: Array<{ id: string; name: string; is_own: boolean }> }>(
        `${GEO_ANALYTICS_URL}?action=sov_trend&days=${days}`,
        { method: 'GET' },
      ),
    mentions: (days = 7, limit = 20) =>
      request<{ mentions: GeoMention[] }>(
        `${GEO_ANALYTICS_URL}?action=mentions&days=${days}&limit=${limit}`,
        { method: 'GET' },
      ),
    coverage: (days = 7) =>
      request<{ coverage: GeoCoverageRow[] }>(`${GEO_ANALYTICS_URL}?action=coverage&days=${days}`, { method: 'GET' }),
  },

  content: {
    list: () => request<{ drafts: GeoDraftListItem[] }>(GEO_CONTENT_URL, { method: 'GET' }),
    get: (id: string) =>
      request<{ draft: GeoDraft }>(`${GEO_CONTENT_URL}?id=${id}`, { method: 'GET' }),
    generate: (data: { query_id?: string; topic?: string; tone?: string; length?: string; model?: string }) =>
      request<{ draft: GeoDraft }>(`${GEO_CONTENT_URL}?action=generate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    create: (data: { title: string; content_md: string; query_id?: string | null; target_keywords?: string[]; status?: string; published_url?: string | null }) =>
      request<{ draft: GeoDraft & { publication_id?: string | null } }>(GEO_CONTENT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ title: string; content_md: string; status: string; target_keywords: string[]; published_url: string | null }>) =>
      request<{ ok: true; publication_id?: string | null; status?: string }>(
        `${GEO_CONTENT_URL}?id=${id}`,
        { method: 'PUT', body: JSON.stringify(data) },
      ),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_CONTENT_URL}?id=${id}`, { method: 'DELETE' }),
  },

  publications: {
    list: () => request<{ publications: GeoPublication[] }>(GEO_PUBS_URL, { method: 'GET' }),
    create: (data: {
      title: string; url?: string; urls?: string[]; platform?: string; draft_id?: string;
      query_id?: string; published_at?: string; notes?: string; status?: string;
    }) => request<{ publication: GeoPublication }>(GEO_PUBS_URL, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ title: string; url: string; urls: string[]; platform: string; status: string; notes: string }>) =>
      request<{ ok: true }>(`${GEO_PUBS_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_PUBS_URL}?id=${id}`, { method: 'DELETE' }),
    check: (id: string) =>
      request<{
        found: boolean;
        summary?: string;
        results: Array<{
          provider: string;
          found: boolean;
          snippet?: string;
          citations?: string[];
          matches?: string[];
          error?: string;
        }>;
      }>(`${GEO_PUBS_URL}?id=${id}&action=check`, { method: 'POST', body: '{}' }),
    history: (id: string) =>
      request<{ checks: Array<{ id: string; provider: string; found: boolean; snippet: string | null; checked_at: string }> }>(
        `${GEO_PUBS_URL}?id=${id}&action=checks`,
        { method: 'GET' },
      ),
  },

  settings: {
    get: () => request<{ settings: GeoSettings }>(GEO_SETTINGS_URL, { method: 'GET' }),
    update: (data: Partial<{
      poll_enabled: boolean; poll_interval_hours: number;
      pub_check_enabled: boolean; pub_check_interval_hours: number;
      company: string;
    }>) =>
      request<{ settings: GeoSettings }>(GEO_SETTINGS_URL, { method: 'PUT', body: JSON.stringify(data) }),
    runs: (limit = 20) =>
      request<{ runs: GeoScheduleRun[] }>(`${GEO_SETTINGS_URL}?action=runs&limit=${limit}`, { method: 'GET' }),
    runNow: (kind: 'poll' | 'pub_check' | 'all' = 'all') =>
      request<{ ok: true; kind: string; cron_triggered: boolean; message: string }>(
        `${GEO_SETTINGS_URL}?action=run_now`,
        { method: 'POST', body: JSON.stringify({ kind }) },
      ),
  },

  projects: {
    list: () => request<{ projects: GeoProject[] }>(GEO_PROJECTS_URL, { method: 'GET' }),
    create: (data: { name: string; description?: string }) =>
      request<{ project: GeoProject }>(GEO_PROJECTS_URL, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; description: string }>) =>
      request<{ ok: true }>(`${GEO_PROJECTS_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_PROJECTS_URL}?id=${id}`, { method: 'DELETE' }),
  },
};

export type GeoProject = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  own_brand: string | null;
  brands_count: number;
  queries_count: number;
  created_at: string;
};

export type GeoPollResponse = {
  polled: number;
  responses: number;
  mentions: number;
  total?: number;
  processed_in_batch?: number;
  next_offset: number | null;
  note?: string;
  errors?: Array<{ query_id: string; provider: string; error: string }>;
};

export type GeoSettings = {
  company: string;
  plan: string;
  poll_enabled: boolean;
  poll_interval_hours: number;
  pub_check_enabled: boolean;
  pub_check_interval_hours: number;
  last_auto_poll_at: string | null;
  last_auto_pub_check_at: string | null;
};

export type GeoScheduleRun = {
  id: string;
  kind: 'poll' | 'pub_check';
  status: 'ok' | 'error' | 'running';
  polled: number;
  responses: number;
  mentions: number;
  checked: number;
  found: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

export type GeoProviderResult = {
  found: boolean;
  checked_at: string | null;
};

export type GeoPublication = {
  id: string;
  title: string;
  url: string;
  urls: string[];
  extra_urls: string[];
  platform: string | null;
  status: string;
  notes: string | null;
  draft_id: string | null;
  query_id: string | null;
  query_text: string | null;
  published_at: string | null;
  last_check_at: string | null;
  last_check_found: boolean | null;
  created_at: string;
  updated_at: string;
  providers?: Record<string, GeoProviderResult>;
};

export type GeoDraftListItem = {
  id: string;
  title: string;
  status: string;
  word_count: number;
  target_keywords: string[];
  model: string | null;
  query_id: string | null;
  query_text: string | null;
  published_url: string | null;
  published_at: string | null;
  publication_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GeoDraft = GeoDraftListItem & {
  content_md: string;
};

export type GeoOverview = {
  period_days: number;
  queries: { active: number; total: number };
  brands: { own: number; total: number };
  responses: number;
  mentions: number;
  own_sov: number;
  covered_queries: number;
  sov: Array<{
    brand_id: string;
    name: string;
    is_own: boolean;
    mentions: number;
    sov: number;
    avg_sentiment: number;
  }>;
};

export type GeoMention = {
  id: string;
  brand_name: string;
  is_own: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  snippet: string;
  position: number;
  provider: string;
  model: string;
  query_text: string;
  query_id: string;
  created_at: string;
};

export type GeoCoverageRow = {
  query_id: string;
  text: string;
  language: string;
  responses: number;
  own_mentions: number;
  competitor_mentions: number;
  last_polled: string | null;
};