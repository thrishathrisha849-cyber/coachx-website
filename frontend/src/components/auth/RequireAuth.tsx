import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';

/** 003 US2/US4: onboarding and dashboard routes require an authenticated session — never gated only by hiding a nav link (same rule the admin app's `RequireAuth.tsx` documents). */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return <Outlet />;
}
