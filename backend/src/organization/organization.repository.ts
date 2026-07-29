import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findOrganizationById(id: string, tx?: TransactionClient) {
  return db(tx).organization.findUnique({ where: { id } });
}

export function findOrganizationBySlug(slug: string, tx?: TransactionClient) {
  return db(tx).organization.findUnique({ where: { slug } });
}

export function listOrganizations(
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  return Promise.all([
    db(tx).organization.findMany({ orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    db(tx).organization.count(),
  ]);
}

export function createOrganization(data: Prisma.OrganizationCreateInput, tx?: TransactionClient) {
  return db(tx).organization.create({ data });
}

export function updateOrganization(id: string, data: Prisma.OrganizationUpdateInput, tx?: TransactionClient) {
  return db(tx).organization.update({ where: { id }, data });
}

/** 001 FR-086: an Organization Admin's own-org member list — never platform-wide. */
export function findOrganizationMembers(
  organizationId: string,
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  return Promise.all([
    db(tx).user.findMany({
      where: { organizationId },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).user.count({ where: { organizationId } }),
  ]);
}

export function assignUserToOrganization(userId: string, organizationId: string | null, tx?: TransactionClient) {
  return db(tx).user.update({ where: { id: userId }, data: { organizationId } });
}
