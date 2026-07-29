import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findStepResponses(userId: string, tx?: TransactionClient) {
  return db(tx).onboardingStepResponse.findMany({ where: { userId }, orderBy: { stepNumber: 'asc' } });
}

export function upsertStepResponse(
  userId: string,
  stepNumber: number,
  stepKey: string,
  answer: Prisma.InputJsonValue,
  tx?: TransactionClient,
) {
  return db(tx).onboardingStepResponse.upsert({
    where: { userId_stepNumber: { userId, stepNumber } },
    create: { userId, stepNumber, stepKey, answer },
    update: { answer, completedAt: new Date() },
  });
}

export function findRoadmap(userId: string, tx?: TransactionClient) {
  return db(tx).roadmap.findUnique({ where: { userId } });
}

export function upsertRoadmap(userId: string, data: Omit<Prisma.RoadmapCreateInput, 'user'>, tx?: TransactionClient) {
  return db(tx).roadmap.upsert({
    where: { userId },
    create: { ...data, user: { connect: { id: userId } } },
    update: data,
  });
}
