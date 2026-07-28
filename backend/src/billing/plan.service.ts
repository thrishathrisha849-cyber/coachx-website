import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { parsePaginationParams, buildPaginationMeta } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import {
  findPlanByCode,
  findPlanByProductId,
  findPlanById,
  findPlansAdmin,
  findActivePlans,
  createMembershipPlan,
  updateMembershipPlan,
  findVersionById,
  findPublishedVersionForPlan,
  findLatestVersionNumberForPlan,
  createPlanVersion,
  updatePlanVersion,
  createPlanEntitlement,
  updatePlanEntitlement,
  deletePlanEntitlement,
  findEntitlementById,
  type AdminPlanFilter,
} from './plan.repository';
import { findProductById } from './product.repository';
import { findActivePricesForProduct } from './product.repository';
import {
  toAdminMembershipPlan,
  toAdminPlanVersion,
  toAdminPlanEntitlement,
  toPublicMembershipPlan,
} from './billing.serializers';
import type {
  AdminMembershipPlan,
  AdminPlanVersion,
  AdminPlanEntitlement,
  PublicMembershipPlan,
} from './billing.types';

// ============================================================================
// Membership Plans
// ============================================================================

export interface MembershipPlanInput {
  code: string;
  productId: string;
  displayOrder?: number;
}

export interface MembershipPlanUpdateInput {
  status?: string;
  displayOrder?: number;
}

export async function createNewMembershipPlan(input: MembershipPlanInput, actorId: string): Promise<AdminMembershipPlan> {
  const [existingCode, product, existingForProduct] = await Promise.all([
    findPlanByCode(input.code),
    findProductById(input.productId),
    findPlanByProductId(input.productId),
  ]);

  if (existingCode) throw AppError.conflict('A membership plan with this code already exists');
  if (!product) throw AppError.badRequest('Invalid product — no such product exists');
  if (!['MEMBERSHIP_INDIVIDUAL', 'MEMBERSHIP_TEAM', 'MEMBERSHIP_ORGANIZATION'].includes(product.type)) {
    throw AppError.badRequest('A membership plan can only be linked to a MEMBERSHIP_* product');
  }
  if (existingForProduct) throw AppError.conflict('This product is already linked to a membership plan');

  return withTransaction(async (tx) => {
    const plan = await createMembershipPlan(
      {
        code: input.code,
        product: { connect: { id: input.productId } },
        displayOrder: input.displayOrder ?? 0,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.plan.created', resourceType: 'membership_plan', resourceId: plan.id },
      tx,
    );

    return toAdminMembershipPlan(plan);
  });
}

export async function updateExistingMembershipPlan(
  id: string,
  input: MembershipPlanUpdateInput,
  actorId: string,
): Promise<AdminMembershipPlan> {
  return withTransaction(async (tx) => {
    const existing = await findPlanById(id, tx);
    if (!existing) throw AppError.notFound('Membership plan not found');

    const updated = await updateMembershipPlan(
      id,
      {
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan.updated',
        resourceType: 'membership_plan',
        resourceId: id,
        beforeState: { status: existing.status },
        afterState: { status: updated.status },
      },
      tx,
    );

    return toAdminMembershipPlan(updated);
  });
}

export async function archiveMembershipPlan(id: string, actorId: string): Promise<AdminMembershipPlan> {
  return updateExistingMembershipPlan(id, { status: 'ARCHIVED' }, actorId);
}

export async function restoreMembershipPlan(id: string, actorId: string): Promise<AdminMembershipPlan> {
  return updateExistingMembershipPlan(id, { status: 'DRAFT' }, actorId);
}

export async function getPlanAdmin(id: string): Promise<AdminMembershipPlan> {
  const row = await findPlanById(id);
  if (!row) throw AppError.notFound('Membership plan not found');
  return toAdminMembershipPlan(row);
}

export async function listPlansAdmin(
  filter: AdminPlanFilter,
  pagination: { page?: string; pageSize?: string },
): Promise<{ data: AdminMembershipPlan[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findPlansAdmin(filter, { skip, take });
  return { data: rows.map(toAdminMembershipPlan), meta: buildPaginationMeta(page, pageSize, total) };
}

/**
 * Public plan comparison (FR-013). Only ACTIVE plans (with an ACTIVE
 * product and a PUBLISHED version) are ever returned — the repository
 * query already filters this, but each plan's live ACTIVE prices are
 * fetched here since they live on the Product, not the Plan.
 */
export async function listActiveMembershipPlansPublic(): Promise<PublicMembershipPlan[]> {
  const plans = await findActivePlans();

  const withPrices = await Promise.all(
    plans.map(async (plan) => {
      const prices = await findActivePricesForProduct(plan.productId);
      return toPublicMembershipPlan(plan, prices);
    }),
  );

  return withPrices;
}

// ============================================================================
// Plan Versions
// ============================================================================

export interface PlanVersionInput {
  name: string;
  publicDescription?: string;
  internalDescription?: string;
  targetCustomer?: string;
  features?: string[];
  limits?: unknown;
  supportedBillingIntervals?: string[];
  trialEligible?: boolean;
  trialDays?: number;
  upgradePaths?: unknown;
  downgradePaths?: unknown;
  cancellationPolicy?: string;
  gracePeriodPolicy?: string;
  refundPolicy?: string;
  badgeText?: string;
  recommendedReason?: string | null;
}

export async function createNewPlanVersion(
  planId: string,
  input: PlanVersionInput,
  actorId: string,
): Promise<AdminPlanVersion> {
  return withTransaction(async (tx) => {
    const plan = await findPlanById(planId, tx);
    if (!plan) throw AppError.notFound('Membership plan not found');

    const latest = await findLatestVersionNumberForPlan(planId, tx);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await createPlanVersion(
      {
        plan: { connect: { id: planId } },
        versionNumber: nextVersionNumber,
        name: input.name,
        publicDescription: input.publicDescription,
        internalDescription: input.internalDescription,
        targetCustomer: input.targetCustomer,
        features: input.features ?? [],
        limits: input.limits as never,
        supportedBillingIntervals: (input.supportedBillingIntervals ?? []) as never,
        trialEligible: input.trialEligible ?? false,
        trialDays: input.trialDays,
        upgradePaths: input.upgradePaths as never,
        downgradePaths: input.downgradePaths as never,
        cancellationPolicy: input.cancellationPolicy,
        gracePeriodPolicy: input.gracePeriodPolicy,
        refundPolicy: input.refundPolicy,
        badgeText: input.badgeText,
        recommendedReason: (input.recommendedReason ?? undefined) as never,
        createdBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan_version.created',
        resourceType: 'plan_version',
        resourceId: version.id,
      },
      tx,
    );

    return toAdminPlanVersion(version);
  });
}

export async function updateExistingPlanVersion(
  versionId: string,
  input: Partial<PlanVersionInput>,
  actorId: string,
): Promise<AdminPlanVersion> {
  return withTransaction(async (tx) => {
    const existing = await findVersionById(versionId, tx);
    if (!existing) throw AppError.notFound('Plan version not found');
    if (existing.status !== 'DRAFT') {
      throw AppError.badRequest(`Cannot edit a plan version with status ${existing.status} — only DRAFT versions may be edited`);
    }

    const updated = await updatePlanVersion(
      versionId,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.publicDescription !== undefined ? { publicDescription: input.publicDescription } : {}),
        ...(input.internalDescription !== undefined ? { internalDescription: input.internalDescription } : {}),
        ...(input.targetCustomer !== undefined ? { targetCustomer: input.targetCustomer } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.limits !== undefined ? { limits: input.limits as never } : {}),
        ...(input.supportedBillingIntervals !== undefined
          ? { supportedBillingIntervals: input.supportedBillingIntervals as never }
          : {}),
        ...(input.trialEligible !== undefined ? { trialEligible: input.trialEligible } : {}),
        ...(input.trialDays !== undefined ? { trialDays: input.trialDays } : {}),
        ...(input.upgradePaths !== undefined ? { upgradePaths: input.upgradePaths as never } : {}),
        ...(input.downgradePaths !== undefined ? { downgradePaths: input.downgradePaths as never } : {}),
        ...(input.cancellationPolicy !== undefined ? { cancellationPolicy: input.cancellationPolicy } : {}),
        ...(input.gracePeriodPolicy !== undefined ? { gracePeriodPolicy: input.gracePeriodPolicy } : {}),
        ...(input.refundPolicy !== undefined ? { refundPolicy: input.refundPolicy } : {}),
        ...(input.badgeText !== undefined ? { badgeText: input.badgeText } : {}),
        ...(input.recommendedReason !== undefined
          ? { recommendedReason: (input.recommendedReason ?? null) as never }
          : {}),
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.plan_version.updated', resourceType: 'plan_version', resourceId: versionId },
      tx,
    );

    return toAdminPlanVersion(updated);
  });
}

/**
 * Publishing a new version atomically archives whichever version is
 * currently PUBLISHED for the same plan (if any) in the SAME transaction
 * as setting the new one to PUBLISHED. Both writes must commit or roll
 * back together — splitting this into two separate transactions would
 * risk the exact "detected the right thing, but the compensating write
 * never survived" class of bug this project's own auth session-rotation
 * fix (Phase 6 stabilization) already had to correct once. The
 * `plan_versions_one_published_per_plan` partial unique index is the
 * DB-level backstop if this invariant is ever violated by a future bug.
 */
export async function publishPlanVersion(versionId: string, actorId: string): Promise<AdminPlanVersion> {
  return withTransaction(async (tx) => {
    const existing = await findVersionById(versionId, tx);
    if (!existing) throw AppError.notFound('Plan version not found');
    if (existing.status !== 'DRAFT') {
      throw AppError.badRequest(`Cannot publish a plan version with status ${existing.status}`);
    }
    if (existing.entitlements.length === 0) {
      throw AppError.badRequest('Cannot publish a plan version with no entitlements defined');
    }

    const currentlyPublished = await findPublishedVersionForPlan(existing.planId, tx);
    if (currentlyPublished) {
      await updatePlanVersion(currentlyPublished.id, { status: 'ARCHIVED', archivedAt: new Date() }, tx).catch(
        (error: unknown) => {
          throw normalizeDatabaseError(error);
        },
      );
    }

    const published = await updatePlanVersion(versionId, { status: 'PUBLISHED', publishedAt: new Date() }, tx).catch(
      (error: unknown) => {
        throw normalizeDatabaseError(error);
      },
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan_version.published',
        resourceType: 'plan_version',
        resourceId: versionId,
        beforeState: { previouslyPublishedVersionId: currentlyPublished?.id ?? null },
        afterState: { publishedVersionId: versionId },
      },
      tx,
    );

    return toAdminPlanVersion(published);
  });
}

export async function archivePlanVersion(versionId: string, actorId: string): Promise<AdminPlanVersion> {
  return withTransaction(async (tx) => {
    const existing = await findVersionById(versionId, tx);
    if (!existing) throw AppError.notFound('Plan version not found');
    if (existing.status === 'ARCHIVED') {
      throw AppError.badRequest('This plan version is already archived');
    }

    const updated = await updatePlanVersion(versionId, { status: 'ARCHIVED', archivedAt: new Date() }, tx).catch(
      (error: unknown) => {
        throw normalizeDatabaseError(error);
      },
    );

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.plan_version.archived', resourceType: 'plan_version', resourceId: versionId },
      tx,
    );

    return toAdminPlanVersion(updated);
  });
}

export async function getPlanVersionAdmin(versionId: string): Promise<AdminPlanVersion> {
  const row = await findVersionById(versionId);
  if (!row) throw AppError.notFound('Plan version not found');
  return toAdminPlanVersion(row);
}

// ============================================================================
// Plan Entitlements
// ============================================================================

export interface PlanEntitlementInput {
  key: string;
  type: string;
  value: unknown;
  description?: string;
  displayOrder?: number;
}

async function assertVersionIsDraft(versionId: string, tx: Parameters<typeof findVersionById>[1]) {
  const version = await findVersionById(versionId, tx);
  if (!version) throw AppError.notFound('Plan version not found');
  if (version.status !== 'DRAFT') {
    throw AppError.badRequest(`Cannot change entitlements on a plan version with status ${version.status} — only DRAFT versions may be edited`);
  }
  return version;
}

export async function addEntitlementToVersion(
  versionId: string,
  input: PlanEntitlementInput,
  actorId: string,
): Promise<AdminPlanEntitlement> {
  return withTransaction(async (tx) => {
    await assertVersionIsDraft(versionId, tx);

    const entitlement = await createPlanEntitlement(
      {
        planVersion: { connect: { id: versionId } },
        key: input.key,
        type: input.type as never,
        value: input.value as never,
        description: input.description,
        displayOrder: input.displayOrder ?? 0,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan_entitlement.created',
        resourceType: 'plan_entitlement',
        resourceId: entitlement.id,
      },
      tx,
    );

    return toAdminPlanEntitlement(entitlement);
  });
}

export async function updateVersionEntitlement(
  entitlementId: string,
  input: Partial<PlanEntitlementInput>,
  actorId: string,
): Promise<AdminPlanEntitlement> {
  return withTransaction(async (tx) => {
    const existing = await findEntitlementById(entitlementId, tx);
    if (!existing) throw AppError.notFound('Plan entitlement not found');
    await assertVersionIsDraft(existing.planVersionId, tx);

    const updated = await updatePlanEntitlement(
      entitlementId,
      {
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.type !== undefined ? { type: input.type as never } : {}),
        ...(input.value !== undefined ? { value: input.value as never } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan_entitlement.updated',
        resourceType: 'plan_entitlement',
        resourceId: entitlementId,
      },
      tx,
    );

    return toAdminPlanEntitlement(updated);
  });
}

export async function removeVersionEntitlement(entitlementId: string, actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const existing = await findEntitlementById(entitlementId, tx);
    if (!existing) throw AppError.notFound('Plan entitlement not found');
    await assertVersionIsDraft(existing.planVersionId, tx);

    await deletePlanEntitlement(entitlementId, tx).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.plan_entitlement.deleted',
        resourceType: 'plan_entitlement',
        resourceId: entitlementId,
      },
      tx,
    );
  });
}
