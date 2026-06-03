import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { geoApi, projectStore, GeoProject, tokenStore } from '@/lib/geo/api';

type GeoProjectCtx = {
  projects: GeoProject[];
  currentId: string | null;
  current: GeoProject | null;
  loading: boolean;
  switchProject: (id: string) => void;
  reload: () => Promise<void>;
};

const Ctx = createContext<GeoProjectCtx | null>(null);

export function GeoProjectProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [projects, setProjects] = useState<GeoProject[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(projectStore.get());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const r = await geoApi.projects.list();
      setProjects(r.projects);
      // Если сохранённый проект не найден — берём первый
      const saved = projectStore.get();
      const valid = r.projects.find((p) => p.id === saved);
      const next = valid?.id || r.projects[0]?.id || null;
      if (next) {
        projectStore.set(next);
        setCurrentId(next);
      }
    } catch {
      /* молча — пользователь мог быть не авторизован */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const switchProject = useCallback((id: string) => {
    projectStore.set(id);
    setCurrentId(id);
    // Сбрасываем все geo-кэши, чтобы данные перезагрузились под новый проект
    qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0] || '').startsWith('geo-') });
  }, [qc]);

  const current = projects.find((p) => p.id === currentId) || null;

  return (
    <Ctx.Provider value={{ projects, currentId, current, loading, switchProject, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGeoProject() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGeoProject must be used inside GeoProjectProvider');
  return ctx;
}
