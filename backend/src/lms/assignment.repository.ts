import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findAssignmentById(id: string, tx?: TransactionClient) {
  return db(tx).assignment.findFirst({ where: { id, deletedAt: null } });
}

export function findAssignmentByLessonId(lessonId: string, tx?: TransactionClient) {
  return db(tx).assignment.findFirst({ where: { lessonId, deletedAt: null } });
}

/** 004 Project-based Learning batch (FR-077) — the admin's "link an existing assignment as a project artifact" candidate list: every assignment in this module (across all its lessons) not already linked to a project. */
export function findAssignmentsByModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).assignment.findMany({ where: { lesson: { moduleId }, deletedAt: null }, orderBy: { createdAt: 'asc' } });
}

/** 004 Project-based Learning batch (FR-077) — a project's linked artifacts, in authored order. */
export function findArtifactsForProject(projectId: string, tx?: TransactionClient) {
  return db(tx).assignment.findMany({ where: { projectId, deletedAt: null }, orderBy: { projectPosition: 'asc' } });
}

export function findPublishedArtifactsForProject(projectId: string, tx?: TransactionClient) {
  return db(tx).assignment.findMany({ where: { projectId, status: 'PUBLISHED', deletedAt: null }, orderBy: { projectPosition: 'asc' } });
}

export function countArtifactsForProject(projectId: string, tx?: TransactionClient) {
  return db(tx).assignment.count({ where: { projectId, deletedAt: null } });
}

export function createAssignment(data: Prisma.AssignmentCreateInput, tx?: TransactionClient) {
  return db(tx).assignment.create({ data });
}

export function updateAssignment(id: string, data: Prisma.AssignmentUpdateInput, tx?: TransactionClient) {
  return db(tx).assignment.update({ where: { id }, data });
}

export function findRubricCriteriaByAssignment(assignmentId: string, tx?: TransactionClient) {
  return db(tx).rubricCriterion.findMany({ where: { assignmentId, deletedAt: null }, orderBy: { position: 'asc' } });
}

export function findRubricCriterionById(id: string, tx?: TransactionClient) {
  return db(tx).rubricCriterion.findFirst({ where: { id, deletedAt: null } });
}

/** Includes soft-deleted rows — a historical `SubmissionCriterionScore` review must still resolve the criterion's title/description even after archival. */
export function findRubricCriterionByIdIncludingDeleted(id: string, tx?: TransactionClient) {
  return db(tx).rubricCriterion.findUnique({ where: { id } });
}

export function createRubricCriterion(data: Prisma.RubricCriterionCreateInput, tx?: TransactionClient) {
  return db(tx).rubricCriterion.create({ data });
}

export function updateRubricCriterion(id: string, data: Prisma.RubricCriterionUpdateInput, tx?: TransactionClient) {
  return db(tx).rubricCriterion.update({ where: { id }, data });
}

export function countRubricCriteria(assignmentId: string, tx?: TransactionClient) {
  return db(tx).rubricCriterion.count({ where: { assignmentId, deletedAt: null } });
}

// --- Submissions -------------------------------------------------------

export function findSubmissionsForEnrollmentAssignment(enrollmentId: string, assignmentId: string, tx?: TransactionClient) {
  return db(tx).submission.findMany({
    where: { enrollmentId, assignmentId },
    orderBy: { attemptNumber: 'desc' },
    include: { criterionScores: true },
  });
}

export function findSubmissionById(id: string, tx?: TransactionClient) {
  return db(tx).submission.findUnique({ where: { id }, include: { criterionScores: true } });
}

export function createSubmission(data: Prisma.SubmissionCreateInput, tx?: TransactionClient) {
  return db(tx).submission.create({ data, include: { criterionScores: true } });
}

export function updateSubmission(id: string, data: Prisma.SubmissionUpdateInput, tx?: TransactionClient) {
  return db(tx).submission.update({ where: { id }, data, include: { criterionScores: true } });
}

export function findSubmissionsForAssignmentAdmin(assignmentId: string, statusFilter: string | undefined, tx?: TransactionClient) {
  return db(tx).submission.findMany({
    where: { assignmentId, ...(statusFilter ? { status: statusFilter as never } : {}) },
    orderBy: { updatedAt: 'desc' },
    include: { criterionScores: true, enrollment: { include: { user: { include: { profile: true } } } } },
  });
}

// --- Assignment Feedback Interaction (004, FR-078, T067) --------------------

export function createFeedbackMessage(data: Prisma.SubmissionFeedbackMessageCreateInput, tx?: TransactionClient) {
  return db(tx).submissionFeedbackMessage.create({ data });
}

export function findFeedbackMessagesForSubmission(submissionId: string, tx?: TransactionClient) {
  return db(tx).submissionFeedbackMessage.findMany({ where: { submissionId }, orderBy: { createdAt: 'asc' } });
}

export function upsertCriterionScore(
  submissionId: string,
  criterionId: string,
  data: { pointsAwarded: number; comment: string | null },
  tx: TransactionClient,
) {
  return tx.submissionCriterionScore.upsert({
    where: { submissionId_criterionId: { submissionId, criterionId } },
    create: { submissionId, criterionId, ...data },
    update: data,
  });
}

/** True if this enrollment has any APPROVED submission for this assignment — the ASSIGNMENT_APPROVED completion-rule signal. */
export async function hasApprovedSubmission(enrollmentId: string, assignmentId: string, tx?: TransactionClient): Promise<boolean> {
  const count = await db(tx).submission.count({ where: { enrollmentId, assignmentId, status: 'APPROVED' } });
  return count > 0;
}
