import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';

/** 001 FR-023: every admin route requires an authenticated session — never gated only by hiding a nav link. */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
