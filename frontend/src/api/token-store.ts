const STORAGE_KEY = 'coachx_access_token';

let inMemoryToken: string | null = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);

/** Mirrors the admin app's `token-store.ts` — a module-level store so `client.ts`'s request interceptor and `auth.context.tsx` can share the current token without a circular import. Persists to localStorage or sessionStorage depending on the "Remember me" choice made at login. */
export const tokenStore = {
  get(): string | null {
    return inMemoryToken;
  },
  set(token: string | null, persistent = true): void {
    inMemoryToken = token;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (token) (persistent ? localStorage : sessionStorage).setItem(STORAGE_KEY, token);
  },
};
