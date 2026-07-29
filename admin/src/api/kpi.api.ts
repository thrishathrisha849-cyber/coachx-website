import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface KpiReport {
  acquisition: Record<string, unknown>;
  activationEngagement: Record<string, unknown>;
  learning: Record<string, unknown>;
  revenueRetention: Record<string, unknown>;
  transformation: Record<string, unknown>;
  generatedAt: string;
}

export async function getKpiReport(): Promise<KpiReport> {
  const { data } = await apiClient.get<ApiSuccessResponse<KpiReport>>('/admin/kpi');
  return data.data;
}
