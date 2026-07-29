import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface CheckoutSession {
  id: string;
  status: string;
  couponCode: string | null;
  cartValueMinor: number | null;
  currency: string;
  lastCompletedStep: string | null;
  product: { id: string; name: string; type: string };
}

export async function initiateCheckout(productId: string, email?: string): Promise<CheckoutSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<CheckoutSession>>('/checkout/sessions', { productId, email });
  return data.data;
}

export async function getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  const { data } = await apiClient.get<ApiSuccessResponse<CheckoutSession>>(`/checkout/sessions/${sessionId}`);
  return data.data;
}

export interface ApplyCouponResult {
  valid: true;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

export async function applyCoupon(sessionId: string, code: string): Promise<ApplyCouponResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<ApplyCouponResult>>(`/checkout/sessions/${sessionId}/coupon`, { code });
  return data.data;
}

export async function recordCheckoutStep(sessionId: string, step: string): Promise<CheckoutSession> {
  const { data } = await apiClient.patch<ApiSuccessResponse<CheckoutSession>>(`/checkout/sessions/${sessionId}/step`, { step });
  return data.data;
}
