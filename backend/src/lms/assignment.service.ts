import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findLessonById } from './lesson.repository';
import {
  findAssignmentById,
  findAssignmentByLessonId,
  createAssignment as createAssignmentRow,
  updateAssignment as updateAssignmentRow,
  findRubricCriteriaByAssignment,
  findRubricCriterionById,
  findRubricCriterionByIdIncludingDeleted,
  createRubricCriterion as createRubricCriterionRow,
  updateRubricCriterion as updateRubricCriterionRow,
  countRubricCriteria,
} from './assignment.repository';
import { toAdminAssignment, toAdminAssignmentWithRubric, toAdminRubricCriterion } from './assignment.serializers';
import type { AdminAssignment, AdminAssignmentWithRubric, AdminRubricCriterion } from './assignment.types';

// --- Assignment CRUD (admin, reuses `course.module.manage` at the route
// layer — same tier as lesson/activity/quiz authoring; no per-instructor
// ownership check at the /admin/* surface, matching those endpoints) -------

export interface CreateAssignmentInput {
  title: string;
  instructions?: string;
  learningOutcome?: string;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt?: string | null;
  maxScore: number;
  passingScore: number;
  latePolicy: string;
  maxAttempts?: number | null;
  /** FR-076 Peer Review config (004 US9 batch). */
  peerReviewEnabled?: boolean;
  peerReviewsRequired?: number;
  peerReviewAnonymous?: boolean;
  peerReviewDeadlineDays?: number | null;
  peerReviewIncludeInGrade?: boolean;
}

export async function createAssignmentForLesson(lessonId: string, input: CreateAssignmentInput, actorId: string): Promise<AdminAssignment> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');

  const existing = await findAssignmentByLessonId(lessonId);
  if (existing) throw AppError.conflict('This lesson already has an assignment attached');

  const assignment = await createAssignmentRow({
    lesson: { connect: { id: lessonId } },
    title: input.title,
    instructions: input.instructions ?? null,
    learningOutcome: input.learningOutcome ?? null,
    submissionFormat: input.submissionFormat as never,
    allowedFileTypes: input.allowedFileTypes,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    maxScore: input.maxScore,
    passingScore: input.passingScore,
    latePolicy: input.latePolicy as never,
    maxAttempts: input.maxAttempts ?? null,
    peerReviewEnabled: input.peerReviewEnabled ?? false,
    peerReviewsRequired: input.peerReviewsRequired ?? 0,
    peerReviewAnonymous: input.peerReviewAnonymous ?? true,
    peerReviewDeadlineDays: input.peerReviewDeadlineDays ?? null,
    peerReviewIncludeInGrade: input.peerReviewIncludeInGrade ?? false,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.assignment.created',
    resourceType: 'assignment',
    resourceId: assignment.id,
    afterState: { lessonId, title: input.title },
  });

  return toAdminAssignment(assignment);
}

export async function getAssignmentAdmin(id: string): Promise<AdminAssignmentWithRubric> {
  const assignment = await findAssignmentById(id);
  if (!assignment) throw AppError.notFound('Assignment not found');
  const criteria = await findRubricCriteriaByAssignment(id);
  return toAdminAssignmentWithRubric(assignment, criteria);
}

export async function getAssignmentByLessonIdAdmin(lessonId: string): Promise<AdminAssignment> {
  const assignment = await findAssignmentByLessonId(lessonId);
  if (!assignment) throw AppError.notFound('This lesson has no assignment attached yet');
  return toAdminAssignment(assignment);
}

export async function updateExistingAssignment(id: string, input: Partial<CreateAssignmentInput>, actorId: string): Promise<AdminAssignment> {
  const existing = await findAssignmentById(id);
  if (!existing) throw AppError.notFound('Assignment not found');

  const updated = await updateAssignmentRow(id, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    ...(input.learningOutcome !== undefined ? { learningOutcome: input.learningOutcome } : {}),
    ...(input.submissionFormat !== undefined ? { submissionFormat: input.submissionFormat as never } : {}),
    ...(input.allowedFileTypes !== undefined ? { allowedFileTypes: input.allowedFileTypes } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
    ...(input.maxScore !== undefined ? { maxScore: input.maxScore } : {}),
    ...(input.passingScore !== undefined ? { passingScore: input.passingScore } : {}),
    ...(input.latePolicy !== undefined ? { latePolicy: input.latePolicy as never } : {}),
    ...(input.maxAttempts !== undefined ? { maxAttempts: input.maxAttempts } : {}),
    ...(input.peerReviewEnabled !== undefined ? { peerReviewEnabled: input.peerReviewEnabled } : {}),
    ...(input.peerReviewsRequired !== undefined ? { peerReviewsRequired: input.peerReviewsRequired } : {}),
    ...(input.peerReviewAnonymous !== undefined ? { peerReviewAnonymous: input.peerReviewAnonymous } : {}),
    ...(input.peerReviewDeadlineDays !== undefined ? { peerReviewDeadlineDays: input.peerReviewDeadlineDays } : {}),
    ...(input.peerReviewIncludeInGrade !== undefined ? { peerReviewIncludeInGrade: input.peerReviewIncludeInGrade } : {}),
    version: { increment: 1 },
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.assignment.updated',
    resourceType: 'assignment',
    resourceId: id,
    afterState: input,
  });

  return toAdminAssignment(updated);
}

const VALID_ASSIGNMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export async function changeAssignmentStatus(id: string, status: string, actorId: string): Promise<AdminAssignment> {
  const existing = await findAssignmentById(id);
  if (!existing) throw AppError.notFound('Assignment not found');

  if (!VALID_ASSIGNMENT_STATUS_TRANSITIONS[existing.status]?.includes(status)) {
    throw AppError.badRequest(`Cannot transition assignment from ${existing.status} to ${status}`);
  }

  const updated = await updateAssignmentRow(id, { status: status as never, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.assignment.status_changed',
    resourceType: 'assignment',
    resourceId: id,
    beforeState: { status: existing.status },
    afterState: { status },
  });

  return toAdminAssignment(updated);
}

// --- Rubric criteria ---------------------------------------------------

export interface CreateCriterionInput {
  title: string;
  description?: string;
  maxPoints: number;
}

export async function addRubricCriterion(assignmentId: string, input: CreateCriterionInput, actorId: string): Promise<AdminRubricCriterion> {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw AppError.notFound('Assignment not found');

  const position = await countRubricCriteria(assignmentId);

  const criterion = await createRubricCriterionRow({
    assignment: { connect: { id: assignmentId } },
    title: input.title,
    description: input.description ?? null,
    maxPoints: input.maxPoints,
    position,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.rubric_criterion.created',
    resourceType: 'rubric_criterion',
    resourceId: criterion.id,
    afterState: { assignmentId, title: input.title },
  });

  return toAdminRubricCriterion(criterion);
}

export interface UpdateCriterionInput {
  title?: string;
  description?: string | null;
  maxPoints?: number;
}

export async function updateExistingCriterion(id: string, input: UpdateCriterionInput, actorId: string): Promise<AdminRubricCriterion> {
  const existing = await findRubricCriterionById(id);
  if (!existing) throw AppError.notFound('Rubric criterion not found');

  const updated = await updateRubricCriterionRow(id, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.maxPoints !== undefined ? { maxPoints: input.maxPoints } : {}),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.rubric_criterion.updated',
    resourceType: 'rubric_criterion',
    resourceId: id,
    afterState: input,
  });

  return toAdminRubricCriterion(updated);
}

/**
 * Builds the criterion lookup map for review-display purposes. NOT just
 * `findRubricCriteriaByAssignment` — that excludes soft-deleted (archived)
 * criteria unconditionally, so a criterion archived after already being
 * scored would otherwise resolve as "Removed criterion" (this exact bug
 * was caught by the Assignment System batch's own integration test).
 * Every criterion actually referenced by one of the recorded scores is
 * resolved via `findRubricCriterionByIdIncludingDeleted` instead, the
 * same union-based fix `quiz-attempt.service.ts`'s grading uses for
 * archived Questions. Lives here (not in `assignment-submission.service.ts`
 * or `peer-review.service.ts`) so both can share it without either
 * importing the other — `peer-review.service.ts` needs it too, and it
 * needs `assignment-submission.service.ts`'s `getSubmissionAdmin` to
 * surface peer reviews, which would otherwise be a circular import.
 */
export async function buildCriteriaLookup(
  assignmentId: string,
  scores: { criterionId: string }[],
): Promise<Map<string, { title: string; maxPoints: number }>> {
  const activeCriteria = await findRubricCriteriaByAssignment(assignmentId);
  const criteriaById = new Map(activeCriteria.map((c) => [c.id, { title: c.title, maxPoints: c.maxPoints }]));

  for (const { criterionId } of scores) {
    if (!criteriaById.has(criterionId)) {
      const criterion = await findRubricCriterionByIdIncludingDeleted(criterionId);
      if (criterion) criteriaById.set(criterionId, { title: criterion.title, maxPoints: criterion.maxPoints });
    }
  }

  return criteriaById;
}

/** Soft-delete only — preserves historical `SubmissionCriterionScore` interpretability. */
export async function archiveRubricCriterion(id: string, actorId: string): Promise<void> {
  const existing = await findRubricCriterionById(id);
  if (!existing) throw AppError.notFound('Rubric criterion not found');

  await updateRubricCriterionRow(id, { deletedAt: new Date() });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.rubric_criterion.archived',
    resourceType: 'rubric_criterion',
    resourceId: id,
  });
}
