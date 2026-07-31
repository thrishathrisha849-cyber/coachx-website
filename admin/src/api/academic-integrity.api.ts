import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export const ACADEMIC_INTEGRITY_CASE_TYPES = [
  'PLAGIARISM',
  'UNAUTHORIZED_COLLABORATION',
  'IDENTITY_FRAUD',
  'QUIZ_CHEATING',
  'FABRICATED_SUBMISSION',
  'CERTIFICATE_FRAUD',
] as const;
export type AcademicIntegrityCaseType = (typeof ACADEMIC_INTEGRITY_CASE_TYPES)[number];

export const ACADEMIC_INTEGRITY_TARGET_TYPES = ['SUBMISSION', 'QUIZ_ATTEMPT', 'CERTIFICATE', 'USER'] as const;
export type AcademicIntegrityTargetType = (typeof ACADEMIC_INTEGRITY_TARGET_TYPES)[number];

export interface AdminAcademicIntegrityCase {
  id: string;
  type: AcademicIntegrityCaseType;
  targetType: AcademicIntegrityTargetType;
  targetId: string | null;
  reportedUserId: string | null;
  reporterId: string | null;
  reason: string;
  evidence: unknown;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
  actionReason: string | null;
  actionedBy: string | null;
  actionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function flagForInvestigation(input: {
  type: AcademicIntegrityCaseType;
  targetType: AcademicIntegrityTargetType;
  targetId: string;
  reason: string;
}): Promise<AdminAcademicIntegrityCase> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAcademicIntegrityCase>>('/lms/admin/academic-integrity/cases', input);
  return data.data;
}

export async function listAcademicIntegrityCases(status?: string): Promise<AdminAcademicIntegrityCase[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminAcademicIntegrityCase[]>>('/lms/admin/academic-integrity/cases', {
    params: status ? { status } : undefined,
  });
  return data.data;
}

export async function getAcademicIntegrityCase(caseId: string): Promise<AdminAcademicIntegrityCase> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminAcademicIntegrityCase>>(`/lms/admin/academic-integrity/cases/${caseId}`);
  return data.data;
}

export async function resolveInvestigation(caseId: string, outcome: 'CONFIRMED' | 'CLEARED', reason: string): Promise<AdminAcademicIntegrityCase> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAcademicIntegrityCase>>(`/lms/admin/academic-integrity/cases/${caseId}/resolve`, {
    outcome,
    reason,
  });
  return data.data;
}

export async function resolveIntegrityAppeal(appealId: string, decision: 'UPHELD' | 'OVERTURNED', resolutionNote?: string) {
  const { data } = await apiClient.post(`/lms/admin/academic-integrity/appeals/${appealId}/resolve`, { decision, resolutionNote });
  return data.data;
}
