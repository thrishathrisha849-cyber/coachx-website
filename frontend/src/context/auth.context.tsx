import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginAccount, getMe, type Me } from '@/api/auth.api';
import { tokenStore } from '@/api/token-store';

interface AuthContextValue {
  user: Me | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Thrown by `login()` when the account requires an MFA code — this page doesn't support that flow yet, so callers show a distinct message rather than a generic login failure. */
export class MfaRequiredError extends Error {
  constructor() {
    super("This account requires a multi-factor authentication code, which isn't supported on this page yet.");
    this.name = 'MfaRequiredError';
  }
}

/**
 * 003 US2/US4: onboarding and the member dashboard are the first pages in
 * this app that need a real session, not just a raw stored token — this
 * mirrors the admin app's already-established `auth.context.tsx` pattern
 * (restore from stored token via `GET /me`, no refresh-token rotation yet).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      tokenStore.set(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadMe().finally(() => setIsLoading(false));
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const result = await loginAccount({ email, password });
    if (result.mfaRequired) {
      throw new MfaRequiredError();
    }
    tokenStore.set(result.accessToken, rememberMe);
    (rememberMe ? window.localStorage : window.sessionStorage).setItem('coachx_refresh_token', result.refreshToken);
    const me = await getMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), login, logout, refreshUser: loadMe }),
    [user, isLoading, login, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
