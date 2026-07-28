import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { listActiveMembershipPlansPublic } from './plan.service';
import { getPublicProductBySlug, listActivePricesForProductPublic } from './product.service';
import { findProductBySlug } from './product.repository';
import { AppError } from '../utils/app-error';

/**
 * Public/member pricing API (Phase 7 Part 1 brief's "Member APIs" —
 * "Public pricing APIs. Member pricing APIs. Plan comparison. Current
 * pricing retrieval. Recommended plan."). No purchasing-specific
 * "your current plan" view exists yet — that requires a Subscription,
 * which is explicitly Part 2+ scope — so this surface is identical for
 * an anonymous visitor and a logged-in member at this phase.
 */

/** FR-013: the plan comparison page's data source. */
export const getPublicPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await listActiveMembershipPlansPublic();
  res.status(200).json(buildSuccessResponse(plans));
});

export const getPublicProductDetail = asyncHandler(async (req: Request, res: Response) => {
  const product = await getPublicProductBySlug(req.params.slug);
  res.status(200).json(buildSuccessResponse(product));
});

/** Current, live prices for a product — "current pricing retrieval." */
export const getPublicProductPrices = asyncHandler(async (req: Request, res: Response) => {
  const product = await findProductBySlug(req.params.slug);
  if (!product || !['APPROVED', 'ACTIVE'].includes(product.status)) {
    throw AppError.notFound('Product not found');
  }
  const prices = await listActivePricesForProductPublic(product.id);
  res.status(200).json(buildSuccessResponse(prices));
});
