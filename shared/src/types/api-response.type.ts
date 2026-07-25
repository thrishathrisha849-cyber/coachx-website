/**
 * Standard envelope every CoachX backend API response conforms to.
 * Kept generic and domain-agnostic — Phase 1 foundation only.
 */
export interface ApiSuccessResponse<T = unknown, TMeta = Record<string, unknown>> {
  success: true;
  data: T;
  meta?: TMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiSuccessResponse<T[], PaginationMeta> {
  meta: PaginationMeta;
}
