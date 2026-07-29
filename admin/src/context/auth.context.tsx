import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginAccount, getMe, type Me } from '@/api/auth.api';
import { tokenStore } from '@/api/token-store';

interface AuthContextValue {
  user: Me | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 001 FR-023/FR-087: the admin app is role-gated to internal staff, and
 * — same as the public frontend's own documented gap — there is no
 * refresh-token rotation wired up yet; this restores the session from
 * the stored access token on load (via `GET /me`) and otherwise requires
 * a fresh login, consistent with the "no duplicate auth systems" reuse
 * of the existing `POST /auth/login` endpoint and RBAC roles.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAccount({ email, password });
    if (result.mfaRequired) {
      throw new Error('This account requires multi-factor authentication, which the admin portal does not yet support.');
    }
    tokenStore.set(result.accessToken);
    const me = await getMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
