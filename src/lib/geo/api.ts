import funcUrls from '../../../backend/func2url.json';

const URLS = funcUrls as Record<string, string>;
export const GEO_AUTH_URL = URLS['geo-auth'];
export const GEO_BRANDS_URL = URLS['geo-brands'];
export const GEO_QUERIES_URL = URLS['geo-queries'];
export const GEO_POLL_URL = URLS['geo-poll'];

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
};
