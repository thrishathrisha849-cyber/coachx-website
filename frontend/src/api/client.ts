import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * Single, shared Axios instance for every API call in the app.
 *
 * Auth-token attachment and refresh-token retry logic belong to the
 * authentication feature module and are intentionally NOT implemented
 * here yet — Phase 1 only wires the transport layer, interceptor hooks,
 * and a consistent error shape.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Placeholder request interceptor — the auth module will attach the
// access token here in a later phase.
apiClient.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
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
