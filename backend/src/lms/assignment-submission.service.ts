import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { maybeAutoCompleteFromAssignmentApproval } from './completion.service';
import {
  findAssignmentById,
  findRubricCriteriaByAssignment,
  findRubricCriterionByIdIncludingDeleted,
  findSubmissionsForEnrollmentAssignment,
  findSubmissionById,
  createSubmission,
  updateSubmission,
  findSubmissionsForAssignmentAdmin,
  upsertCriterionScore,
} from './assignment.repository';
import { toSubmissionResult, toSubmissionWithScores, toAdminSubmissionSummary } from './assignment.serializers';
import type { AdminSubmissionSummary, CriterionScoreInput, SubmissionResult, SubmissionWithScores } from './assignment.types';

interface ResolvedAssignmentContext {
  assignment: NonNullable<Awaited<ReturnType<typeof findAssignmentById>>>;
  enrollmentId: string;
}

/** Resolves + access-checks an assignment via its lesson, exactly like every other content path (`evaluateLessonAccess`) — never a bespoke check. */
async function resolveAssignmentContext(userId: string, assignmentId: string): Promise<ResolvedAssignmentContext> {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment || assignment.status !== 'PUBLISHED') throw AppError.notFound('Assignment not found');

  const lesson = await findLessonById(assignment.lessonId);
  if (!lesson) throw AppError.notFound('Assignment not found');
  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Assignment not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) throw AppError.forbidden(access.message);
  if (access.viaPreview) throw AppError.badRequest('Enroll in this course to submit this assignment');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  return { assignment, enrollmentId: enrollment.id };
}

async function assertOwnSubmission(userId: string, submissionId: string) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');

  const assignment = await findAssignmentById(submission.assignmentId);
  if (!assignment) throw AppError.notFound('Submission not found');
  const lesson = await findLessonById(assignment.lessonId);
  if (!lesson) throw AppError.notFound('Submission not found');
  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Submission not found');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment || enrollment.id !== submission.enrollmentId) throw AppError.notFound('Submission not found');

  return { submission, assignment };
}

/**
 * FR-071 attempt flow's "open assignment" step — resumes the existing DRAFT,
 * returns an already-submitted/reviewed row read-only, or starts a NEW
 * attempt (incrementing `attemptNumber`, never overwriting) once the
 * PRIOR attempt was CHANGES_REQUESTED — the mechanism that makes "the
 * previous submission remains visible alongside the new one after
 * resubmission" (FR-072 acceptance scenario 2) true by construction.
 */
export async function startOrResumeSubmission(userId: string, assignmentId: string): Promise<SubmissionResult> {
  const { assignment, enrollmentId } = await resolveAssignmentContext(userId, assignmentId);

  const history = await findSubmissionsForEnrollmentAssignment(enrollmentId, assignmentId);
  const latest = history[0];

  if (latest) {
    if (latest.status === 'DRAFT') return toSubmissionResult(latest);
    if (latest.status !== 'CHANGES_REQUESTED') return toSubmissionResult(latest); // read-only view — already submitted/terminal

    if (assignment.maxAttempts !== null && history.length >= assignment.maxAttempts) {
      throw new AppError(
        'You have used all of your allowed attempts for this assignment',
        409 as never,
        'ASSIGNMENT_ATTEMPT_LIMIT_REACHED',
        { maxAttempts: assignment.maxAttempts, attemptsUsed: history.length },
      );
    }
  }

  const created = await createSubmission({
    assignment: { connect: { id: assignmentId } },
    enrollment: { connect: { id: enrollmentId } },
    attemptNumber: (latest?.attemptNumber ?? 0) + 1,
    status: 'DRAFT',
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'lms.submission.started',
    resourceType: 'submission',
    resourceId: created.id,
    metadata: { assignmentId, attemptNumber: created.attemptNumber },
  });

  return toSubmissionResult(created);
}

/** FR-071 "save draft" / "complete required fields." Only allowed while the submission is still DRAFT. */
export async function saveDraft(userId: string, submissionId: string, input: { textBody?: string; linkUrl?: string }): Promise<SubmissionResult> {
  const { submission } = await assertOwnSubmission(userId, submissionId);
  if (submission.status !== 'DRAFT') throw AppError.conflict('This submission has already been submitted and can no longer be edited');

  const updated = await updateSubmission(submissionId, {
    ...(input.textBody !== undefined ? { textBody: input.textBody } : {}),
    ...(input.linkUrl !== undefined ? { linkUrl: input.linkUrl } : {}),
  });

  return toSubmissionResult(updated);
}

/**
 * FR-071 "submit confirmation" step. Wrapped in the shared idempotency
 * infrastructure (same pattern as quiz submission/lesson completion) — a
 * rapid double-click replays the SAME result rather than double-submitting.
 * FR-072 acceptance scenario 3: a submission past `dueAt` is flagged
 * `isLate`, with the assignment's own `latePolicy` deciding whether a late
 * submission is accepted at all.
 */
export async function submitSubmission(userId: string, submissionId: string, idempotencyKey?: string): Promise<SubmissionResult> {
  const { submission, assignment } = await assertOwnSubmission(userId, submissionId);

  const key = scopedIdempotencyKey(userId, idempotencyKey, submissionId);
  const outcome = await beginIdempotentOperation<SubmissionResult>('lms.submission.submit', key, { submissionId });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent submission has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('A submission request for this assignment is already in progress');
  }

  try {
    if (submission.status !== 'DRAFT') {
      const result = toSubmissionResult(submission);
      await outcome.complete(result);
      return result;
    }

    const now = new Date();
    const isLate = assignment.dueAt !== null && now > assignment.dueAt;
    if (isLate && assignment.latePolicy === 'REJECT') {
      throw AppError.badRequest('This assignment is past its due date and is no longer accepting submissions', { dueAt: assignment.dueAt });
    }
    if (!submission.textBody && !submission.linkUrl) {
      throw AppError.badRequest('Complete the assignment before submitting');
    }

    const updated = await withTransaction(async (tx) => {
      const result = await updateSubmission(submissionId, { status: 'SUBMITTED', submittedAt: now, isLate }, tx);
      await recordAuditEvent(
        { actorType: 'USER', actorId: userId, action: 'lms.submission.submitted', resourceType: 'submission', resourceId: submissionId, afterState: { isLate } },
        tx,
      );
      return result;
    });

    const finalResult = toSubmissionResult(updated);
    await outcome.complete(finalResult);
    return finalResult;
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

export async function getMySubmissionHistory(userId: string, assignmentId: string): Promise<SubmissionResult[]> {
  const { enrollmentId } = await resolveAssignmentContext(userId, assignmentId);
  const history = await findSubmissionsForEnrollmentAssignment(enrollmentId, assignmentId);
  return history.map(toSubmissionResult);
}

/**
 * Builds the criterion lookup map for review-display purposes. NOT just
 * `findRubricCriteriaByAssignment` — that excludes soft-deleted (archived)
 * criteria unconditionally, so a criterion archived after already being
 * scored on a submission would otherwise resolve as "Removed criterion"
 * (this exact bug was caught by this batch's own integration test). Every
 * criterion actually referenced by one of the submission's recorded
 * scores is resolved via `findRubricCriterionByIdIncludingDeleted`
 * instead, the same union-based fix `quiz-attempt.service.ts`'s grading
 * uses for archived Questions.
 */
async function buildCriteriaLookup(
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

export async function getMySubmissionWithScores(userId: string, submissionId: string): Promise<SubmissionWithScores> {
  const { submission, assignment } = await assertOwnSubmission(userId, submissionId);
  const criteriaById = await buildCriteriaLookup(assignment.id, submission.criterionScores);
  return toSubmissionWithScores(submission, submission.criterionScores, criteriaById);
}

// --- Reviewer-side (admin, reuses `course.module.manage` — same tier as
// quiz grading configuration; this batch does not build a separate
// instructor-scoped review surface, matching Quiz's own documented scope
// limit) ----------------------------------------------------------------

export async function listSubmissionsForAssignmentAdmin(assignmentId: string, statusFilter?: string): Promise<AdminSubmissionSummary[]> {
  const rows = await findSubmissionsForAssignmentAdmin(assignmentId, statusFilter);
  return rows.map((r) => toAdminSubmissionSummary(r as never));
}

export async function getSubmissionAdmin(submissionId: string): Promise<SubmissionWithScores & { learnerUserId: string }> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');

  const assignment = await findAssignmentById(submission.assignmentId);
  if (!assignment) throw AppError.notFound('Submission not found');

  const criteriaById = await buildCriteriaLookup(assignment.id, submission.criterionScores);

  const prisma = (await import('../database/prisma-client')).getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  const enrollment = await prisma.enrollment.findUnique({ where: { id: submission.enrollmentId } });

  return { ...toSubmissionWithScores(submission, submission.criterionScores, criteriaById), learnerUserId: enrollment?.userId ?? '' };
}

export interface ReviewInput {
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  criterionScores: CriterionScoreInput[];
  reviewerNote?: string;
  learnerFeedback?: string;
}

const DECISION_TO_STATUS: Record<ReviewInput['decision'], string> = {
  APPROVE: 'APPROVED',
  REQUEST_CHANGES: 'CHANGES_REQUESTED',
  REJECT: 'REJECTED',
};

/**
 * FR-074 instructor review action. Validates every scored criterion
 * actually belongs to this assignment (via `findRubricCriterionByIdIncludingDeleted`
 * — a criterion archived after being used in an earlier review round must
 * still be re-scoreable/interpretable), persists each score, computes the
 * total from the full recorded set (not just this call's payload), and
 * only an APPROVE decision triggers the ASSIGNMENT_APPROVED completion
 * signal.
 */
export async function reviewSubmission(submissionId: string, input: ReviewInput, actorId: string): Promise<SubmissionWithScores> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');
  if (submission.status === 'DRAFT') throw AppError.badRequest('This submission has not been submitted yet');

  const assignment = await findAssignmentById(submission.assignmentId);
  if (!assignment) throw AppError.notFound('Submission not found');

  for (const s of input.criterionScores) {
    const criterion = await findRubricCriterionByIdIncludingDeleted(s.criterionId);
    if (!criterion || criterion.assignmentId !== assignment.id) {
      throw AppError.badRequest('One or more scored criteria do not belong to this assignment');
    }
    if (s.pointsAwarded > criterion.maxPoints) {
      throw AppError.badRequest(`Points awarded for "${criterion.title}" cannot exceed its maximum of ${criterion.maxPoints}`);
    }
  }

  const updated = await withTransaction(async (tx) => {
    for (const s of input.criterionScores) {
      await upsertCriterionScore(submissionId, s.criterionId, { pointsAwarded: s.pointsAwarded, comment: s.comment ?? null }, tx);
    }

    const allScores = await tx.submissionCriterionScore.findMany({ where: { submissionId } });
    const score = allScores.reduce((sum, s) => sum + s.pointsAwarded, 0);
    const status = DECISION_TO_STATUS[input.decision];
    const passed = input.decision === 'APPROVE' ? score >= assignment.passingScore : input.decision === 'REJECT' ? false : null;

    const result = await updateSubmission(
      submissionId,
      {
        status: status as never,
        score,
        passed,
        reviewerId: actorId,
        reviewedAt: new Date(),
        ...(input.reviewerNote !== undefined ? { reviewerNote: input.reviewerNote } : {}),
        ...(input.learnerFeedback !== undefined ? { learnerFeedback: input.learnerFeedback } : {}),
      },
      tx,
    );

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.submission.reviewed', resourceType: 'submission', resourceId: submissionId, afterState: { decision: input.decision, score } },
      tx,
    );

    return result;
  });

  if (input.decision === 'APPROVE') {
    const lesson = await findLessonById(assignment.lessonId);
    if (lesson) {
      const prisma = (await import('../database/prisma-client')).getPrismaClient();
      const enrollment = prisma ? await prisma.enrollment.findUnique({ where: { id: submission.enrollmentId } }) : null;
      if (enrollment) await maybeAutoCompleteFromAssignmentApproval(enrollment.userId, lesson.id);
    }
  }

  const criteriaById = await buildCriteriaLookup(assignment.id, updated.criterionScores);
  return toSubmissionWithScores(updated, updated.criterionScores, criteriaById);
}
