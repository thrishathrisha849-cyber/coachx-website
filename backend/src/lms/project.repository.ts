import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

/**
 * 004 Project-based Learning batch (FR-077). `Project` itself is a thin
 * grouping row; its artifacts are just `Assignment` rows with `projectId`
 * set (see `assignment.repository.ts` for the artifact-linking queries
 * below, which live there since they mutate `Assignment`, not `Project`).
 */

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findProjectById(id: string, tx?: TransactionClient) {
  return db(tx).project.findFirst({ where: { id, deletedAt: null } });
}

export function findProjectsForModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).project.findMany({ where: { moduleId, deletedAt: null }, orderBy: { createdAt: 'asc' } });
}

export function findPublishedProjectsForModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).project.findMany({ where: { moduleId, status: 'PUBLISHED', deletedAt: null } });
}

export function createProject(data: Prisma.ProjectCreateInput, tx?: TransactionClient) {
  return db(tx).project.create({ data });
}

export function updateProject(id: string, data: Prisma.ProjectUpdateInput, tx?: TransactionClient) {
  return db(tx).project.update({ where: { id }, data });
}
