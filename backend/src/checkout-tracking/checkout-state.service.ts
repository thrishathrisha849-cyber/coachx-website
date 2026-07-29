import crypto from 'node:crypto';
import { HttpStatus } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { PUBLIC_ERROR_CODES } from '../common/errors/public-error-codes';
import {
  createCheckoutSession,
  findCheckoutSessionById,
  updateCheckoutSession,
  findCouponByCode,
  findAbandonableCheckoutSessions,
} from '../funnel/funnel.repository';

export interface InitiateCheckoutInput {
  productId: string;
  userId?: string;
  email?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/** 002 FR-065: checkout initiation from any supported product source (Membership/Course/Event/Mentor/Digital Product/Bundle — all modeled as a `Product` row, per the existing 009 catalog). */
export async function initiateCheckout(input: InitiateCheckoutInput) {
  const session = await createCheckoutSession({
    product: { connect: { id: input.productId } },
    userId: input.userId,
    email: input.email,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    lastCompletedStep: 'initiated',
  });

  await recordAuditEvent({
    actorType: input.userId ? 'USER' : 'SYSTEM',
    actorId: input.userId ?? session.id,
    action: 'checkout.session_initiated',
    resourceType: 'checkout_session',
    resourceId: session.id,
    afterState: { productId: input.productId },
  });

  return session;
}

export interface ApplyCouponResult {
  valid: true;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

/**
 * 002 FR-066, edge case: an expired/invalid coupon is REJECTED outright
 * — never silently applying a partial or incorrect discount, and the
 * cart is left untouched (the caller only mutates `couponCode` after
 * this resolves successfully).
 */
export async function applyCoupon(sessionId: string, code: string): Promise<ApplyCouponResult> {
  const session = await findCheckoutSessionById(sessionId);
  if (!session) throw AppError.notFound('Checkout session not found');

  const coupon = await findCouponByCode(code);
  if (!coupon || coupon.status !== 'ACTIVE') {
    throw new AppError('This coupon code is not valid', HttpStatus.BAD_REQUEST, PUBLIC_ERROR_CODES.COUPON_INVALID);
  }

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new AppError('This coupon is not yet active', HttpStatus.BAD_REQUEST, PUBLIC_ERROR_CODES.COUPON_INVALID);
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    throw new AppError('This coupon has expired', HttpStatus.BAD_REQUEST, PUBLIC_ERROR_CODES.COUPON_EXPIRED);
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new AppError('This coupon has reached its redemption limit', HttpStatus.BAD_REQUEST, PUBLIC_ERROR_CODES.COUPON_INVALID);
  }

  await updateCheckoutSession(sessionId, { couponCode: coupon.code });

  return { valid: true, discountType: coupon.discountType, discountValue: coupon.discountValue };
}

export async function recordCheckoutStep(sessionId: string, step: string) {
  const session = await findCheckoutSessionById(sessionId);
  if (!session) throw AppError.notFound('Checkout session not found');
  return updateCheckoutSession(sessionId, { lastCompletedStep: step });
}

export async function markCheckoutFailed(sessionId: string) {
  const session = await findCheckoutSessionById(sessionId);
  if (!session) throw AppError.notFound('Checkout session not found');

  const updated = await updateCheckoutSession(sessionId, { status: 'FAILED' });
  await recordAuditEvent({
    actorType: 'SYSTEM',
    actorId: sessionId,
    action: 'checkout.payment_failed',
    resourceType: 'checkout_session',
    resourceId: sessionId,
  });
  return updated;
}

/** GET-safe state read for the success/failure page — never itself grants access; access is 009's server-side entitlement grant, this only reflects state (Constitution Article I). */
export async function getCheckoutSessionState(sessionId: string) {
  const session = await findCheckoutSessionById(sessionId);
  if (!session) throw AppError.notFound('Checkout session not found');
  return session;
}

/**
 * 002 FR-104, edge case ("client-side success but webhook not yet
 * arrived"): the ONLY path that can transition a session to SUCCESS is
 * this signature-verified webhook receiver — never the frontend calling
 * a plain "mark success" endpoint. A forged/unsigned/tampered payload is
 * rejected and logged as a security event, never silently accepted.
 *
 * This is scaffolding for 009's real payment-gateway integration (no
 * live gateway exists yet, per spec.md's own Assumptions) — the HMAC
 * mechanism demonstrated here is the shape 009's real webhook consumer
 * should follow, not a working live payment flow.
 */
export async function handlePaymentWebhook(
  sessionId: string,
  rawBody: string,
  signatureHeader: string | undefined,
  sharedSecret: string,
): Promise<void> {
  const session = await findCheckoutSessionById(sessionId);
  if (!session) throw AppError.notFound('Checkout session not found');

  const expectedSignature = crypto.createHmac('sha256', sharedSecret).update(rawBody).digest('hex');
  const providedSignature = signatureHeader ?? '';

  const validSignature =
    providedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));

  if (!validSignature) {
    await recordAuditEvent({
      actorType: 'SYSTEM',
      actorId: sessionId,
      action: 'checkout.webhook_signature_rejected',
      resourceType: 'checkout_session',
      resourceId: sessionId,
    });
    throw AppError.forbidden('Invalid webhook signature');
  }

  await updateCheckoutSession(sessionId, { status: 'SUCCESS', lastCompletedStep: 'payment_confirmed' });
  await recordAuditEvent({
    actorType: 'SYSTEM',
    actorId: sessionId,
    action: 'checkout.payment_succeeded',
    resourceType: 'checkout_session',
    resourceId: sessionId,
  });
}

/** FR-071: marks idle-past-threshold sessions as abandoned, recording user/product/cart-value/last-step/timestamp/campaign (already on the row). No cron scheduler exists in this codebase yet — exposed as an admin-callable batch operation, the same shape a future scheduled job would call. */
export async function markAbandonedCheckouts(idleMinutes = 30): Promise<number> {
  const idleSince = new Date(Date.now() - idleMinutes * 60 * 1000);
  const abandonable = await findAbandonableCheckoutSessions(idleSince);

  for (const session of abandonable) {
    await updateCheckoutSession(session.id, { abandonedAt: new Date() });
  }

  return abandonable.length;
}
