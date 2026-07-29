const STORAGE_KEY = 'coachx_admin_access_token';

let inMemoryToken: string | null = localStorage.getItem(STORAGE_KEY);

/** A tiny module-level token store so `client.ts`'s request interceptor and `auth.context.tsx` can share the current token without a circular import between them. */
export const tokenStore = {
  get(): string | null {
    return inMemoryToken;
  },
  set(token: string | null): void {
    inMemoryToken = token;
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  },
};
