import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function createCase(data: Prisma.TrustSafetyCaseCreateInput, tx?: TransactionClient) {
  return db(tx).trustSafetyCase.create({ data });
}

export function findCaseById(id: string, tx?: TransactionClient) {
  return db(tx).trustSafetyCase.findUnique({ where: { id }, include: { appeals: true } });
}

export function listQueuedCases(
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  return Promise.all([
    db(tx).trustSafetyCase.findMany({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      orderBy: { createdAt: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).trustSafetyCase.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
  ]);
}

export function updateCase(id: string, data: Prisma.TrustSafetyCaseUpdateInput, tx?: TransactionClient) {
  return db(tx).trustSafetyCase.update({ where: { id }, data });
}

// --- Appeals -------------------------------------------------------------

export function createAppeal(data: Prisma.AppealCreateInput, tx?: TransactionClient) {
  return db(tx).appeal.create({ data });
}

export function findAppealById(id: string, tx?: TransactionClient) {
  return db(tx).appeal.findUnique({ where: { id }, include: { case: true } });
}

export function findAppealForCase(caseId: string, tx?: TransactionClient) {
  return db(tx).appeal.findFirst({ where: { caseId }, orderBy: { createdAt: 'desc' } });
}

export function resolveAppeal(
  id: string,
  status: 'UPHELD' | 'OVERTURNED',
  resolvedBy: string,
  resolutionNote: string | undefined,
  tx?: TransactionClient,
) {
  return db(tx).appeal.update({
    where: { id },
    data: { status, resolvedBy, resolvedAt: new Date(), resolutionNote },
  });
}
