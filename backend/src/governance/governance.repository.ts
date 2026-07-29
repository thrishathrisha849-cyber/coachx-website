import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findGovernanceRecordByFeature(featureName: string, tx?: TransactionClient) {
  return db(tx).governanceRecord.findFirst({ where: { featureName }, orderBy: { createdAt: 'desc' } });
}

export function findGovernanceRecordById(id: string, tx?: TransactionClient) {
  return db(tx).governanceRecord.findUnique({ where: { id } });
}

export function listGovernanceRecords(
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  return Promise.all([
    db(tx).governanceRecord.findMany({ orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    db(tx).governanceRecord.count(),
  ]);
}

export function createGovernanceRecord(data: Prisma.GovernanceRecordCreateInput, tx?: TransactionClient) {
  return db(tx).governanceRecord.create({ data });
}

export function updateGovernanceRecord(id: string, data: Prisma.GovernanceRecordUpdateInput, tx?: TransactionClient) {
  return db(tx).governanceRecord.update({ where: { id }, data });
}
