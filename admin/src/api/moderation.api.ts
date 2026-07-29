import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';
import type { PagedResult } from './organizations.api';

export interface TrustSafetyCase {
  id: string;
  type: 'REPORT' | 'BLOCK' | 'MUTE';
  targetType: 'POST' | 'COMMENT' | 'PROFILE' | 'USER';
  targetId: string | null;
  reporterId: string | null;
  reportedUserId: string | null;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
  createdAt: string;
}

export async function listModerationQueue(): Promise<PagedResult<TrustSafetyCase>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PagedResult<TrustSafetyCase>>>('/admin/moderation/cases');
  return data.data;
}

export async function actionCase(
  caseId: string,
  actionType: 'WARNING' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_BAN',
  actionReason: string,
): Promise<TrustSafetyCase> {
  const { data } = await apiClient.post<ApiSuccessResponse<TrustSafetyCase>>(`/admin/moderation/cases/${caseId}/action`, {
    actionType,
    actionReason,
  });
  return data.data;
}

export async function dismissCase(caseId: string, reason: string): Promise<TrustSafetyCase> {
  const { data } = await apiClient.post<ApiSuccessResponse<TrustSafetyCase>>(`/admin/moderation/cases/${caseId}/dismiss`, { reason });
  return data.data;
}
