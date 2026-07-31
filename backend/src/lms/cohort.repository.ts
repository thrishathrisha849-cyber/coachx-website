import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

// --- Cohort ---------------------------------------------------------------

export function createCohort(data: Prisma.CohortCreateInput, tx?: TransactionClient) {
  return db(tx).cohort.create({ data });
}

export function updateCohort(id: string, data: Prisma.CohortUpdateInput, tx?: TransactionClient) {
  return db(tx).cohort.update({ where: { id }, data });
}

export function findCohortById(id: string, tx?: TransactionClient) {
  return db(tx).cohort.findUnique({ where: { id } });
}

export function findCohortsForCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).cohort.findMany({ where: { courseId }, orderBy: { startDate: 'asc' } });
}

// --- CohortMember -----------------------------------------------------------

export function createCohortMember(data: Prisma.CohortMemberCreateInput, tx?: TransactionClient) {
  return db(tx).cohortMember.create({ data });
}

export function deleteCohortMember(id: string, tx?: TransactionClient) {
  return db(tx).cohortMember.delete({ where: { id } });
}

export function findCohortMemberById(id: string, tx?: TransactionClient) {
  return db(tx).cohortMember.findUnique({ where: { id } });
}

export function findCohortMembersForCohort(cohortId: string, tx?: TransactionClient) {
  return db(tx).cohortMember.findMany({ where: { cohortId }, orderBy: { joinedAt: 'asc' } });
}

export function countCohortMembers(cohortId: string, tx?: TransactionClient) {
  return db(tx).cohortMember.count({ where: { cohortId } });
}

export function findCohortMembershipForEnrollment(enrollmentId: string, tx?: TransactionClient) {
  return db(tx).cohortMember.findUnique({ where: { enrollmentId } });
}

// --- CohortModuleSchedule -----------------------------------------------

export function upsertCohortModuleSchedule(cohortId: string, moduleId: string, unlockAt: Date, tx?: TransactionClient) {
  return db(tx).cohortModuleSchedule.upsert({
    where: { cohortId_moduleId: { cohortId, moduleId } },
    create: { cohort: { connect: { id: cohortId } }, module: { connect: { id: moduleId } }, unlockAt },
    update: { unlockAt },
  });
}

export function findCohortModuleSchedule(cohortId: string, moduleId: string, tx?: TransactionClient) {
  return db(tx).cohortModuleSchedule.findUnique({ where: { cohortId_moduleId: { cohortId, moduleId } } });
}

export function findCohortModuleSchedulesForCohort(cohortId: string, tx?: TransactionClient) {
  return db(tx).cohortModuleSchedule.findMany({ where: { cohortId }, orderBy: { unlockAt: 'asc' } });
}

export function deleteCohortModuleSchedule(cohortId: string, moduleId: string, tx?: TransactionClient) {
  return db(tx).cohortModuleSchedule.delete({ where: { cohortId_moduleId: { cohortId, moduleId } } });
}

/**
 * The single lookup `access-evaluator.service.ts`'s `COHORT_SCHEDULE`
 * branch needs: given a learner's `enrollmentId` and a `moduleId`, find
 * the unlock date THEIR cohort set for that module — or `null` if they
 * have no cohort membership for this course, or their cohort hasn't set a
 * schedule for this module yet.
 */
export async function findCohortModuleScheduleForEnrollment(enrollmentId: string, moduleId: string, tx?: TransactionClient) {
  const membership = await findCohortMembershipForEnrollment(enrollmentId, tx);
  if (!membership) return null;
  return findCohortModuleSchedule(membership.cohortId, moduleId, tx);
}
