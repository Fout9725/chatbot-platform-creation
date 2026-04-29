import funcUrls from '../../../backend/func2url.json';

const URLS = funcUrls as Record<string, string>;
export const GEO_AUTH_URL = URLS['geo-auth'];
export const GEO_BRANDS_URL = URLS['geo-brands'];
export const GEO_QUERIES_URL = URLS['geo-queries'];
export const GEO_POLL_URL = URLS['geo-poll'];
export const GEO_ANALYTICS_URL = URLS['geo-analytics'];
export const GEO_CONTENT_URL = URLS['geo-content'];

const TOKEN_KEY = 'geo_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers['X-Auth-Token'] = token;

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
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

export type GeoQuery = {
  id: string;
  text: string;
  language: string;
  is_active: boolean;
  created_at: string;
  last_polled: string | null;
  responses_count: number;
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
    list: () => request<{ queries: GeoQuery[] }>(GEO_QUERIES_URL, { method: 'GET' }),
    create: (data: { text: string; language?: string; is_active?: boolean }) =>
      request<{ query: GeoQuery }>(GEO_QUERIES_URL, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ text: string; language: string; is_active: boolean }>) =>
      request<{ ok: true }>(`${GEO_QUERIES_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_QUERIES_URL}?id=${id}`, { method: 'DELETE' }),
  },

  poll: (queryId?: string) =>
    request<{ polled: number; responses: number; mentions: number; note?: string }>(GEO_POLL_URL, {
      method: 'POST',
      body: JSON.stringify(queryId ? { query_id: queryId } : {}),
    }),

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
    update: (id: string, data: Partial<{ title: string; content_md: string; status: string; target_keywords: string[] }>) =>
      request<{ ok: true }>(`${GEO_CONTENT_URL}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<{ ok: true }>(`${GEO_CONTENT_URL}?id=${id}`, { method: 'DELETE' }),
  },
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