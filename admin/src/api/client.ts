import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStore } from './token-store';

/** Shared Axios instance for the admin portal — attaches the logged-in admin's access token (001 FR-023: admin surface is role-gated, every request must be authenticated). */
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
