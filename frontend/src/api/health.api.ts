import type { ApiSuccessResponse, HealthCheckResult } from '@coachx/shared';
import { apiClient } from './client';

export async function fetchHealth(): Promise<HealthCheckResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<HealthCheckResult>>('/health');
  return data.data;
}
