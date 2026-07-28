import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

const versionsWithEntitlements = {
  versions: {
    include: { entitlements: { orderBy: { displayOrder: 'asc' as const } } },
    orderBy: { versionNumber: 'desc' as const },
  },
} satisfies Prisma.MembershipPlanInclude;

export function findPlanByCode(code: string, tx?: TransactionClient) {
  return db(tx).membershipPlan.findUnique({ where: { code }, include: versionsWithEntitlements });
}

export function findPlanByProductId(productId: string, tx?: TransactionClient) {
  return db(tx).membershipPlan.findUnique({ where: { productId }, include: versionsWithEntitlements });
}

export function findPlanById(id: string, tx?: TransactionClient) {
  return db(tx).membershipPlan.findUnique({ where: { id }, include: versionsWithEntitlements });
}

export interface AdminPlanFilter {
  status?: string;
}

export function findPlansAdmin(
  filter: AdminPlanFilter,
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  const where: Prisma.MembershipPlanWhereInput = {
    ...(filter.status ? { status: filter.status as never } : {}),
  };

  return Promise.all([
    db(tx).membershipPlan.findMany({
      where,
      include: versionsWithEntitlements,
      orderBy: { displayOrder: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).membershipPlan.count({ where }),
  ]);
}

/**
 * Public plan-comparison list (FR-013): only ACTIVE plans whose product is
 * also ACTIVE and that have a PUBLISHED version. The published-version
 * filter happens at the `some` relation level so a plan with only DRAFT/
 * ARCHIVED versions never appears — never rely on the caller to filter
 * this out downstream.
 */
export function findActivePlans(tx?: TransactionClient) {
  return db(tx).membershipPlan.findMany({
    where: {
      status: 'ACTIVE',
      product: { status: 'ACTIVE' },
      versions: { some: { status: 'PUBLISHED' } },
    },
    include: versionsWithEntitlements,
    orderBy: { displayOrder: 'asc' },
  });
}

export function createMembershipPlan(data: Prisma.MembershipPlanCreateInput, tx?: TransactionClient) {
  return db(tx).membershipPlan.create({ data, include: versionsWithEntitlements });
}

export function updateMembershipPlan(id: string, data: Prisma.MembershipPlanUpdateInput, tx?: TransactionClient) {
  return db(tx).membershipPlan.update({ where: { id }, data, include: versionsWithEntitlements });
}

// --- Plan Versions -----------------------------------------------------------

export function findVersionById(id: string, tx?: TransactionClient) {
  return db(tx).planVersion.findUnique({
    where: { id },
    include: { entitlements: { orderBy: { displayOrder: 'asc' } } },
  });
}

export function findPublishedVersionForPlan(planId: string, tx?: TransactionClient) {
  return db(tx).planVersion.findFirst({
    where: { planId, status: 'PUBLISHED' },
    include: { entitlements: { orderBy: { displayOrder: 'asc' } } },
  });
}

export function findLatestVersionNumberForPlan(planId: string, tx?: TransactionClient) {
  return db(tx).planVersion.findFirst({
    where: { planId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });
}

export function createPlanVersion(data: Prisma.PlanVersionCreateInput, tx?: TransactionClient) {
  return db(tx).planVersion.create({ data, include: { entitlements: true } });
}

export function updatePlanVersion(id: string, data: Prisma.PlanVersionUpdateInput, tx?: TransactionClient) {
  return db(tx).planVersion.update({
    where: { id },
    data,
    include: { entitlements: { orderBy: { displayOrder: 'asc' } } },
  });
}

// --- Plan Entitlements --------------------------------------------------------

export function createPlanEntitlement(data: Prisma.PlanEntitlementCreateInput, tx?: TransactionClient) {
  return db(tx).planEntitlement.create({ data });
}

export function updatePlanEntitlement(id: string, data: Prisma.PlanEntitlementUpdateInput, tx?: TransactionClient) {
  return db(tx).planEntitlement.update({ where: { id }, data });
}

export function deletePlanEntitlement(id: string, tx?: TransactionClient) {
  return db(tx).planEntitlement.delete({ where: { id } });
}

export function findEntitlementById(id: string, tx?: TransactionClient) {
  return db(tx).planEntitlement.findUnique({ where: { id } });
}
