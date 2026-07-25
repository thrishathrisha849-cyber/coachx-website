import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api-response.type';

/**
 * Builds a standard success envelope. Used by backend controllers and
 * safe to import on the client for typing consistency.
 */
export function buildSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

/**
 * Builds a standard error envelope.
 */
export function buildErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  };
}
