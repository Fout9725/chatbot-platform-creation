import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGeoAuth } from '@/contexts/GeoAuthContext';
import GeoLayout from './GeoLayout';

export default function GeoProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useGeoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Загрузка…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/geo/login" replace />;
  return <GeoLayout>{children}</GeoLayout>;
}
