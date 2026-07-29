import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';
import type { PagedResult } from './organizations.api';

export interface GovernanceRecord {
  id: string;
  featureName: string;
  phase: string;
  currentStage: string;
  createdAt: string;
}

export async function listGovernanceRecords(): Promise<PagedResult<GovernanceRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PagedResult<GovernanceRecord>>>('/admin/governance/records');
  return data.data;
}

export async function startGovernanceRecord(featureName: string, phase: string): Promise<GovernanceRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<GovernanceRecord>>('/admin/governance/records', { featureName, phase });
  return data.data;
}

export async function advanceGovernanceStage(recordId: string): Promise<GovernanceRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<GovernanceRecord>>(`/admin/governance/records/${recordId}/advance`);
  return data.data;
}
