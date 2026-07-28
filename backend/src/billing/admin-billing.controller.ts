import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createProductCatalogItem,
  updateExistingProduct,
  changeProductStatus,
  archiveProduct,
  restoreProduct,
  getProductAdmin,
  listProductsAdmin,
  createPriceForProduct,
  updateOrVersionPrice,
  publishPrice,
  archivePrice,
  listPricesForProductAdmin,
} from './product.service';
import {
  createNewMembershipPlan,
  updateExistingMembershipPlan,
  archiveMembershipPlan,
  restoreMembershipPlan,
  getPlanAdmin,
  listPlansAdmin,
  createNewPlanVersion,
  updateExistingPlanVersion,
  publishPlanVersion,
  archivePlanVersion,
  getPlanVersionAdmin,
  addEntitlementToVersion,
  updateVersionEntitlement,
  removeVersionEntitlement,
} from './plan.service';

/**
 * Admin billing API (Phase 7 Part 1's "Billing Foundation, Products,
 * Plans & Pricing" brief). Every route is gated by `authenticate` +
 * `requirePermission('billing.catalog.manage')` at the route layer (see
 * routes/v1/billing.routes.ts) — controllers here trust `req.user` is
 * already populated and authorized, same discipline as
 * `admin-lms.controller.ts`.
 */

// --- Products ---------------------------------------------------------

export const postProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await createProductCatalogItem(req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(product));
});

export const getProductsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await listProductsAdmin(
    {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      q: req.query.q as string | undefined,
    },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getProductByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(product));
});

export const patchProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await updateExistingProduct(req.params.id, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(product));
});

export const postProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const product = await changeProductStatus(req.params.id, req.body.status, req.user!.id);
  res.status(200).json(buildSuccessResponse(product));
});

export const postArchiveProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await archiveProduct(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(product));
});

export const postRestoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await restoreProduct(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(product));
});

// --- Product Prices -----------------------------------------------------

export const postProductPrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await createPriceForProduct(req.params.productId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(price));
});

export const getProductPrices = asyncHandler(async (req: Request, res: Response) => {
  const prices = await listPricesForProductAdmin(req.params.productId);
  res.status(200).json(buildSuccessResponse(prices));
});

export const patchProductPrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await updateOrVersionPrice(req.params.priceId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(price));
});

export const postPublishPrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await publishPrice(req.params.priceId, req.user!.id);
  res.status(200).json(buildSuccessResponse(price));
});

export const postArchivePrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await archivePrice(req.params.priceId, req.user!.id);
  res.status(200).json(buildSuccessResponse(price));
});

// --- Membership Plans -----------------------------------------------------

export const postPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await createNewMembershipPlan(req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(plan));
});

export const getPlansAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await listPlansAdmin(
    { status: req.query.status as string | undefined },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getPlanByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const plan = await getPlanAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(plan));
});

export const patchPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await updateExistingMembershipPlan(req.params.id, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(plan));
});

export const postArchivePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await archiveMembershipPlan(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(plan));
});

export const postRestorePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await restoreMembershipPlan(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(plan));
});

// --- Plan Versions ----------------------------------------------------

export const postPlanVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await createNewPlanVersion(req.params.planId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(version));
});

export const getPlanVersionByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const version = await getPlanVersionAdmin(req.params.versionId);
  res.status(200).json(buildSuccessResponse(version));
});

export const patchPlanVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await updateExistingPlanVersion(req.params.versionId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(version));
});

export const postPublishPlanVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await publishPlanVersion(req.params.versionId, req.user!.id);
  res.status(200).json(buildSuccessResponse(version));
});

export const postArchivePlanVersion = asyncHandler(async (req: Request, res: Response) => {
  const version = await archivePlanVersion(req.params.versionId, req.user!.id);
  res.status(200).json(buildSuccessResponse(version));
});

// --- Plan Entitlements --------------------------------------------------

export const postPlanEntitlement = asyncHandler(async (req: Request, res: Response) => {
  const entitlement = await addEntitlementToVersion(req.params.versionId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(entitlement));
});

export const patchPlanEntitlement = asyncHandler(async (req: Request, res: Response) => {
  const entitlement = await updateVersionEntitlement(req.params.entitlementId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(entitlement));
});

export const deletePlanEntitlementHandler = asyncHandler(async (req: Request, res: Response) => {
  await removeVersionEntitlement(req.params.entitlementId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ deleted: true }));
});
