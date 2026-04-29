import funcUrls from '../../../backend/func2url.json';

export const GEO_AUTH_URL = (funcUrls as Record<string, string>)['geo-auth'];

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

export const geoApi = {
  register: (email: string, password: string, company: string) =>
    request<{ token: string; user: GeoUser }>(
      `${GEO_AUTH_URL}?action=register`,
      { method: 'POST', body: JSON.stringify({ email, password, company }) }
    ),

  login: (email: string, password: string) =>
    request<{ token: string; user: GeoUser }>(
      `${GEO_AUTH_URL}?action=login`,
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  me: () =>
    request<{ user: GeoUser }>(`${GEO_AUTH_URL}?action=me`, { method: 'GET' }),
};
