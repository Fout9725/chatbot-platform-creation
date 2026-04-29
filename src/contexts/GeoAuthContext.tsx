import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { geoApi, tokenStore, GeoUser } from '@/lib/geo/api';

type GeoAuthCtx = {
  user: GeoUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, company: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<GeoAuthCtx | null>(null);

export function GeoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GeoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    geoApi
      .me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await geoApi.login(email, password);
    tokenStore.set(r.token);
    setUser(r.user);
  };

  const register = async (email: string, password: string, company: string) => {
    const r = await geoApi.register(email, password, company);
    tokenStore.set(r.token);
    setUser(r.user);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useGeoAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGeoAuth must be used inside GeoAuthProvider');
  return ctx;
}
