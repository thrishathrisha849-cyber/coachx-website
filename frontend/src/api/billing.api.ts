import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';
import type { MembershipPlan } from '@/types/billing.types';

/** Phase 7 Part 1 — public plan comparison (FR-013). No purchasing endpoints here (Part 2+). */
export async function fetchPublicPlans(): Promise<MembershipPlan[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MembershipPlan[]>>('/billing/plans');
  return data.data;
}
