import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findStreakByUserId(userId: string, tx?: TransactionClient) {
  return db(tx).learningStreak.findUnique({ where: { userId } });
}

export async function findOrCreateStreak(userId: string, tx?: TransactionClient) {
  const client = db(tx);
  const existing = await client.learningStreak.findUnique({ where: { userId } });
  if (existing) return existing;
  return client.learningStreak.create({ data: { userId } });
}

export function updateStreak(userId: string, data: Prisma.LearningStreakUpdateInput, tx?: TransactionClient) {
  return db(tx).learningStreak.update({ where: { userId }, data });
}
