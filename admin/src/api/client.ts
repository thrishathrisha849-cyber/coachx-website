import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * Shared Axios instance for the admin portal. Admin-role auth-token
 * attachment belongs to the authentication feature module and is added
 * in a later implementation phase.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => requestConfig);

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
