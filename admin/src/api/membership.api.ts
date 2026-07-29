import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface MembershipPlanVersion {
  name: string;
  targetCustomer: string | null;
  publicDescription: string | null;
  features: string[];
}

export interface MembershipPlanSummary {
  id: string;
  code: string;
  displayOrder: number;
  currentVersion: MembershipPlanVersion;
}

/** Reuses the existing public pricing endpoint (009 billing foundation) — the admin view of the 001 FR-048–053 tier catalog. */
export async function listMembershipTiers(): Promise<MembershipPlanSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MembershipPlanSummary[]>>('/billing/plans');
  return data.data.sort((a, b) => a.displayOrder - b.displayOrder);
}
