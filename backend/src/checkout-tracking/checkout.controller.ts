import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { config } from '../config';
import {
  initiateCheckout,
  applyCoupon,
  recordCheckoutStep,
  markCheckoutFailed,
  getCheckoutSessionState,
  handlePaymentWebhook,
  markAbandonedCheckouts,
} from './checkout-state.service';

/** POST /api/v1/checkout/sessions — 002 FR-065/FR-066. */
export const postInitiateCheckout = asyncHandler(async (req: Request, res: Response) => {
  const session = await initiateCheckout({
    productId: req.body.productId,
    userId: req.user?.id,
    email: req.body.email,
    utmSource: req.body.utmSource,
    utmMedium: req.body.utmMedium,
    utmCampaign: req.body.utmCampaign,
  });
  res.status(201).json(buildSuccessResponse(session));
});

/** GET /api/v1/checkout/sessions/:sessionId — state for the success/failure page (never itself grants access). */
export const getCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await getCheckoutSessionState(req.params.sessionId);
  res.status(200).json(buildSuccessResponse(session));
});

/** POST /api/v1/checkout/sessions/:sessionId/coupon — 002 FR-066 edge case (COUPON_INVALID/COUPON_EXPIRED). */
export const postApplyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await applyCoupon(req.params.sessionId, req.body.code);
  res.status(200).json(buildSuccessResponse(result));
});

/** PATCH /api/v1/checkout/sessions/:sessionId/step — records progress for abandonment tracking (FR-071). */
export const patchCheckoutStep = asyncHandler(async (req: Request, res: Response) => {
  const session = await recordCheckoutStep(req.params.sessionId, req.body.step);
  res.status(200).json(buildSuccessResponse(session));
});

/** POST /api/v1/checkout/sessions/:sessionId/fail — 002 FR-069. */
export const postMarkFailed = asyncHandler(async (req: Request, res: Response) => {
  const session = await markCheckoutFailed(req.params.sessionId);
  res.status(200).json(buildSuccessResponse(session));
});

/** POST /api/v1/checkout/sessions/:sessionId/webhook — 002 FR-104 (signature-verified; only path that can mark SUCCESS). */
export const postPaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const rawBody = JSON.stringify(req.body);
  await handlePaymentWebhook(req.params.sessionId, rawBody, req.header('X-Webhook-Signature'), config.checkout.webhookSecret);
  res.status(200).json(buildSuccessResponse({ received: true }));
});

/** POST /api/v1/checkout/admin/mark-abandoned — batch job shape (no scheduler exists yet; `platform_admin`/`super_admin` callable). */
export const postMarkAbandoned = asyncHandler(async (req: Request, res: Response) => {
  const idleMinutes = req.body.idleMinutes ? Number(req.body.idleMinutes) : undefined;
  const count = await markAbandonedCheckouts(idleMinutes);
  res.status(200).json(buildSuccessResponse({ markedAbandoned: count }));
});
