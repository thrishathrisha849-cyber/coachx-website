import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { cacheControl } from '../../cms/cache-control.middleware';
import {
  createProductSchema,
  updateProductSchema,
  changeProductStatusSchema,
  productIdParamSchema,
  productSlugParamSchema,
  adminProductQuerySchema,
  createProductPriceSchema,
  updateProductPriceSchema,
  priceIdParamSchema,
  productIdPathParamSchema,
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  planIdParamSchema,
  adminPlanQuerySchema,
  createPlanVersionSchema,
  updatePlanVersionSchema,
  versionIdParamSchema,
  createPlanEntitlementSchema,
  updatePlanEntitlementSchema,
  entitlementIdParamSchema,
} from '../../billing/billing.validation';
import {
  postProduct,
  getProductsAdmin,
  getProductByIdAdmin,
  patchProduct,
  postProductStatus,
  postArchiveProduct,
  postRestoreProduct,
  postProductPrice,
  getProductPrices,
  patchProductPrice,
  postPublishPrice,
  postArchivePrice,
  postPlan,
  getPlansAdmin,
  getPlanByIdAdmin,
  patchPlan,
  postArchivePlan,
  postRestorePlan,
  postPlanVersion,
  getPlanVersionByIdAdmin,
  patchPlanVersion,
  postPublishPlanVersion,
  postArchivePlanVersion,
  postPlanEntitlement,
  patchPlanEntitlement,
  deletePlanEntitlementHandler,
} from '../../billing/admin-billing.controller';
import { getPublicPlans, getPublicProductDetail, getPublicProductPrices } from '../../billing/billing.controller';

/**
 * Phase 7 Part 1 — Billing Foundation routes (Products, Product Pricing,
 * Membership Plans, Plan Versions, Plan Entitlements). Mounted at
 * `/api/v1/billing` (same versioned-API convention as `/api/v1/lms`) — see
 * routes/v1/index.ts. Public reads live directly under `/billing/*`
 * (mirroring `/lms/courses`); admin writes under `/billing/admin/*`
 * (mirroring `/lms/admin/*`). No instructor-scoped or `/me` tier exists
 * for this phase — there is no per-owner authoring concept for a
 * platform-wide product catalog, and no member-specific "your current
 * plan" view exists yet (that needs a Subscription — Part 2+).
 *
 * Scope boundary (see docs/billing/DECISION_GATES.md): checkout, orders,
 * payment processing, subscriptions, wallet, coupons, GST invoicing,
 * refunds, affiliate/referral, and the financial ledger are explicitly
 * NOT part of this route surface — only the catalog/entitlement-
 * configuration foundation those later parts build on.
 */
const router = Router();

// --- Public/member reads ---------------------------------------------------
router.get('/plans', cacheControl, getPublicPlans);
router.get('/products/:slug', cacheControl, validate(productSlugParamSchema), getPublicProductDetail);
router.get('/products/:slug/prices', cacheControl, validate(productSlugParamSchema), getPublicProductPrices);

// --- Admin: products --------------------------------------------------------
const manageBilling = requirePermission('billing.catalog.manage');
router.post('/admin/products', authenticate, manageBilling, validate(createProductSchema), postProduct);
router.get('/admin/products', authenticate, manageBilling, validate(adminProductQuerySchema), getProductsAdmin);
router.get('/admin/products/:id', authenticate, manageBilling, validate(productIdParamSchema), getProductByIdAdmin);
router.patch('/admin/products/:id', authenticate, manageBilling, validate(updateProductSchema), patchProduct);
router.post('/admin/products/:id/status', authenticate, manageBilling, validate(changeProductStatusSchema), postProductStatus);
router.post('/admin/products/:id/archive', authenticate, manageBilling, validate(productIdParamSchema), postArchiveProduct);
router.post('/admin/products/:id/restore', authenticate, manageBilling, validate(productIdParamSchema), postRestoreProduct);

// --- Admin: product prices ---------------------------------------------
router.post('/admin/products/:productId/prices', authenticate, manageBilling, validate(createProductPriceSchema), postProductPrice);
router.get('/admin/products/:productId/prices', authenticate, manageBilling, validate(productIdPathParamSchema), getProductPrices);
router.patch('/admin/prices/:priceId', authenticate, manageBilling, validate(updateProductPriceSchema), patchProductPrice);
router.post('/admin/prices/:priceId/publish', authenticate, manageBilling, validate(priceIdParamSchema), postPublishPrice);
router.post('/admin/prices/:priceId/archive', authenticate, manageBilling, validate(priceIdParamSchema), postArchivePrice);

// --- Admin: membership plans -------------------------------------------
router.post('/admin/plans', authenticate, manageBilling, validate(createMembershipPlanSchema), postPlan);
router.get('/admin/plans', authenticate, manageBilling, validate(adminPlanQuerySchema), getPlansAdmin);
router.get('/admin/plans/:id', authenticate, manageBilling, validate(planIdParamSchema), getPlanByIdAdmin);
router.patch('/admin/plans/:id', authenticate, manageBilling, validate(updateMembershipPlanSchema), patchPlan);
router.post('/admin/plans/:id/archive', authenticate, manageBilling, validate(planIdParamSchema), postArchivePlan);
router.post('/admin/plans/:id/restore', authenticate, manageBilling, validate(planIdParamSchema), postRestorePlan);

// --- Admin: plan versions -----------------------------------------------
router.post('/admin/plans/:planId/versions', authenticate, manageBilling, validate(createPlanVersionSchema), postPlanVersion);
router.get('/admin/plan-versions/:versionId', authenticate, manageBilling, validate(versionIdParamSchema), getPlanVersionByIdAdmin);
router.patch('/admin/plan-versions/:versionId', authenticate, manageBilling, validate(updatePlanVersionSchema), patchPlanVersion);
router.post('/admin/plan-versions/:versionId/publish', authenticate, manageBilling, validate(versionIdParamSchema), postPublishPlanVersion);
router.post('/admin/plan-versions/:versionId/archive', authenticate, manageBilling, validate(versionIdParamSchema), postArchivePlanVersion);

// --- Admin: plan entitlements --------------------------------------------
router.post('/admin/plan-versions/:versionId/entitlements', authenticate, manageBilling, validate(createPlanEntitlementSchema), postPlanEntitlement);
router.patch('/admin/entitlements/:entitlementId', authenticate, manageBilling, validate(updatePlanEntitlementSchema), patchPlanEntitlement);
router.delete('/admin/entitlements/:entitlementId', authenticate, manageBilling, validate(entitlementIdParamSchema), deletePlanEntitlementHandler);

export const billingRouter = router;
