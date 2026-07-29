import { Router } from 'express';
import { authenticate, authenticateOptional } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  initiateCheckoutSchema,
  sessionIdParamSchema,
  applyCouponSchema,
  recordStepSchema,
  markAbandonedSchema,
} from '../../checkout-tracking/checkout.validation';
import {
  postInitiateCheckout,
  getCheckoutSession,
  postApplyCoupon,
  patchCheckoutStep,
  postMarkFailed,
  postPaymentWebhook,
  postMarkAbandoned,
} from '../../checkout-tracking/checkout.controller';

/** 002 US4 — checkout-STATE tracking only (real payment processing is 009's). Guest checkout allowed (FR-065: "visitor or registered user"). */
const router = Router();
router.post('/sessions', authenticateOptional, validate(initiateCheckoutSchema), postInitiateCheckout);
router.get('/sessions/:sessionId', authenticateOptional, validate(sessionIdParamSchema), getCheckoutSession);
router.post('/sessions/:sessionId/coupon', authenticateOptional, validate(applyCouponSchema), postApplyCoupon);
router.patch('/sessions/:sessionId/step', authenticateOptional, validate(recordStepSchema), patchCheckoutStep);
router.post('/sessions/:sessionId/fail', authenticateOptional, validate(sessionIdParamSchema), postMarkFailed);
/** No `authenticate` — a payment gateway calls this, not a logged-in user; the HMAC signature IS the authentication (FR-104). */
router.post('/sessions/:sessionId/webhook', validate(sessionIdParamSchema), postPaymentWebhook);

export const checkoutRouter = router;

const adminRouter = Router();
adminRouter.post('/mark-abandoned', authenticate, requirePermission('billing.catalog.manage'), validate(markAbandonedSchema), postMarkAbandoned);

export const checkoutAdminRouter = adminRouter;
