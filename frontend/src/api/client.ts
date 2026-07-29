import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStore } from './token-store';

/**
 * Single, shared Axios instance for every API call in the app.
 *
 * 003 US2/US4: attaches the logged-in member's access token (mirrors the
 * admin app's `client.ts`). Refresh-token rotation is still not wired up —
 * same documented gap as before, a 401 simply requires a fresh login.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) requestConfig.headers.set('Authorization', `Bearer ${token}`);
  return requestConfig;
});

export interface NormalizedApiError {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
}

function normalizeError(error: AxiosError): NormalizedApiError {
  const responseData = error.response?.data as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | undefined;

  return {
    status: error.response?.status ?? null,
    code: responseData?.error?.code ?? 'NETWORK_ERROR',
    message: responseData?.error?.message ?? error.message ?? 'An unexpected error occurred',
    details: responseData?.error?.details,
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeError(error)),
);
