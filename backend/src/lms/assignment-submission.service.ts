import { AppError } from '../utils/app-error';
import type { LmsBusinessRuleCode } from './lms-error-codes';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse, findEnrollmentById } from './enrollment.repository';
import { maybeAutoCompleteFromAssignmentApproval } from './completion.service';
import { recordLearningEvent } from './learning-event.service';
import { recordAssignmentActivityForStreak } from './learning-streak.service';
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
  createFeedbackMessage,
  findFeedbackMessagesForSubmission,
} from './assignment.repository';
import { buildCriteriaLookup, deriveOutcomeLevel } from './assignment.service';
import { getPeerReviewsForInstructor } from './peer-review.service';
import {
  toSubmissionResult,
  toSubmissionWithScores,
  toAdminSubmissionSummary,
  toSubmissionFeedbackMessage,
  toPublicAssignmentWithRubric,
} from './assignment.serializers';
import type {
  AdminSubmissionSummary,
  CriterionScoreInput,
  PublicAssignmentWithRubric,
  SubmissionFeedbackMessageResult,
  SubmissionResult,
  SubmissionWithScores,
} from './assignment.types';
import type { PeerReviewForInstructor } from './peer-review.types';

/** 004 Broader Assessment Types batch (FR-068) — assignment types whose outcome is produced by the learner's OWN self-assessment, not an instructor review. */
const SELF_SCORED_ASSESSMENT_TYPES = ['SELF_ASSESSMENT', 'SKILL_RATING'];

interface ResolvedAssignmentContext {
  assignment: NonNullable<Awaited<ReturnType<typeof findAssignmentById>>>;
  enrollmentId: string;
  courseId: string;
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

  return { assignment, enrollmentId: enrollment.id, courseId: module_.courseId };
}

/**
 * GET /me/assignments/:assignmentId — 004 Broader Assessment Types batch
 * (FR-068). The learner-facing PRE-submission overview, including the
 * rubric criteria (learner-safe subset — no submission-specific scores).
 * Previously the learner only ever saw assignment metadata embedded in
 * the lesson response (no rubric) — a SELF_ASSESSMENT/SKILL_RATING
 * assignment's rubric IS the rating scale the learner is asked to score
 * themselves against, so it must be visible before they submit, not only
 * after review (unlike a STANDARD assignment's rubric, which stays
 * admin/reviewer-only until the learner's own submission is scored).
 */
export async function getAssignmentOverviewForLearner(userId: string, assignmentId: string): Promise<PublicAssignmentWithRubric> {
  const { assignment } = await resolveAssignmentContext(userId, assignmentId);
  const criteria = await findRubricCriteriaByAssignment(assignmentId);
  return toPublicAssignmentWithRubric(assignment, criteria);
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

  return { submission, assignment, courseId: module_.courseId };
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
  const { assignment, enrollmentId, courseId } = await resolveAssignmentContext(userId, assignmentId);

  const history = await findSubmissionsForEnrollmentAssignment(enrollmentId, assignmentId);
  const latest = history[0];

  if (latest) {
    if (latest.status === 'DRAFT') return toSubmissionResult(latest);
    if (latest.status !== 'CHANGES_REQUESTED') return toSubmissionResult(latest); // read-only view — already submitted/terminal

    if (assignment.maxAttempts !== null && history.length >= assignment.maxAttempts) {
      // 004 Error-code taxonomy batch (FR-125) —
      // `ASSIGNMENT_ATTEMPT_LIMIT_REACHED` is a member of the
      // business-rule-rejection family (`lms-error-codes.ts`).
      const code: LmsBusinessRuleCode = 'ASSIGNMENT_ATTEMPT_LIMIT_REACHED';
      throw new AppError(
        'You have used all of your allowed attempts for this assignment',
        409 as never,
        code,
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
  await recordLearningEvent({
    eventType: 'ASSIGNMENT_STARTED',
    userId,
    courseId,
    lessonId: assignment.lessonId,
    enrollmentId,
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
export async function submitSubmission(
  userId: string,
  submissionId: string,
  declaredOriginal: boolean,
  idempotencyKey?: string,
): Promise<SubmissionResult> {
  const { submission, assignment, courseId } = await assertOwnSubmission(userId, submissionId);

  if (SELF_SCORED_ASSESSMENT_TYPES.includes(assignment.assessmentType)) {
    throw AppError.badRequest('This assignment is self-assessed — submit it via the self-assessment endpoint instead');
  }

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
      const result = await updateSubmission(submissionId, { status: 'SUBMITTED', submittedAt: now, isLate, declaredOriginal }, tx);
      await recordAuditEvent(
        { actorType: 'USER', actorId: userId, action: 'lms.submission.submitted', resourceType: 'submission', resourceId: submissionId, afterState: { isLate } },
        tx,
      );
      await recordLearningEvent(
        {
          eventType: 'ASSIGNMENT_SUBMITTED',
          userId,
          courseId,
          lessonId: assignment.lessonId,
          enrollmentId: submission.enrollmentId,
          metadata: { submissionId, isLate },
        },
        tx,
      );

      // FR-057 Learning Streak — "assignment activity" qualifying action.
      // `submitSubmission` is always learner-initiated (no admin "submit on
      // behalf of a learner" path exists), so this is inherently genuine.
      await recordAssignmentActivityForStreak(userId, tx);

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

export interface SelfAssessmentInput {
  criterionScores: CriterionScoreInput[];
}

/**
 * POST /me/submissions/:submissionId/self-assess — 004 Broader Assessment
 * Types batch (FR-068). SELF_ASSESSMENT/SKILL_RATING's own submit+outcome
 * path — the learner scores their own rubric criteria and the result is
 * IMMEDIATELY final (status APPROVED, `reviewedAt` set, `reviewerId`
 * stays null so the learner-vs-instructor origin of the score is always
 * distinguishable from `isSelfAssessed`). Reuses the EXACT same
 * criterion-validation and score-aggregation logic `reviewSubmission`
 * uses below, just attributed to the learner instead of a reviewer.
 */
export async function submitSelfAssessment(userId: string, submissionId: string, input: SelfAssessmentInput): Promise<SubmissionWithScores> {
  const { submission, assignment, courseId } = await assertOwnSubmission(userId, submissionId);

  if (!SELF_SCORED_ASSESSMENT_TYPES.includes(assignment.assessmentType)) {
    throw AppError.badRequest('This assignment type does not support self-assessment');
  }
  if (submission.status !== 'DRAFT') {
    throw AppError.conflict('This submission has already been submitted and can no longer be edited');
  }

  for (const s of input.criterionScores) {
    const criterion = await findRubricCriterionByIdIncludingDeleted(s.criterionId);
    if (!criterion || criterion.assignmentId !== assignment.id) {
      throw AppError.badRequest('One or more scored criteria do not belong to this assignment');
    }
    if (s.pointsAwarded > criterion.maxPoints) {
      throw AppError.badRequest(`Points awarded for "${criterion.title}" cannot exceed its maximum of ${criterion.maxPoints}`);
    }
  }

  const now = new Date();
  const isLate = assignment.dueAt !== null && now > assignment.dueAt;

  const updated = await withTransaction(async (tx) => {
    for (const s of input.criterionScores) {
      await upsertCriterionScore(submissionId, s.criterionId, { pointsAwarded: s.pointsAwarded, comment: s.comment ?? null }, tx);
    }

    const allScores = await tx.submissionCriterionScore.findMany({ where: { submissionId } });
    const score = allScores.reduce((sum, s) => sum + s.pointsAwarded, 0);
    const activeCriteria = await findRubricCriteriaByAssignment(assignment.id, tx);
    const maxTotal = activeCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
    const passed = score >= assignment.passingScore;
    const outcomeLevel = deriveOutcomeLevel(score, maxTotal);

    const result = await updateSubmission(
      submissionId,
      {
        status: 'APPROVED' as never,
        submittedAt: now,
        isLate,
        declaredOriginal: true,
        score,
        passed,
        outcomeLevel,
        isSelfAssessed: true,
        reviewedAt: now,
      },
      tx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: 'lms.submission.self_assessed',
        resourceType: 'submission',
        resourceId: submissionId,
        afterState: { score, outcomeLevel },
      },
      tx,
    );
    await recordLearningEvent(
      {
        eventType: 'ASSIGNMENT_SUBMITTED',
        userId,
        courseId,
        lessonId: assignment.lessonId,
        enrollmentId: submission.enrollmentId,
        metadata: { submissionId, isLate, selfAssessed: true },
      },
      tx,
    );
    await recordLearningEvent(
      {
        eventType: 'ASSIGNMENT_REVIEWED',
        userId,
        courseId,
        lessonId: assignment.lessonId,
        enrollmentId: submission.enrollmentId,
        metadata: { submissionId, decision: 'APPROVE', score, selfAssessed: true },
      },
      tx,
    );

    // FR-057 Learning Streak — "assignment activity" qualifying action,
    // same as `submitSubmission`'s own hook.
    await recordAssignmentActivityForStreak(userId, tx);

    return result;
  });

  // Mirrors `reviewSubmission`'s own APPROVE branch — a self-assessment IS
  // an immediate approval.
  await maybeAutoCompleteFromAssignmentApproval(userId, assignment.lessonId);

  const criteriaById = await buildCriteriaLookup(assignment.id, updated.criterionScores);
  return toSubmissionWithScores(updated, updated.criterionScores, criteriaById);
}

export async function getMySubmissionHistory(userId: string, assignmentId: string): Promise<SubmissionResult[]> {
  const { enrollmentId } = await resolveAssignmentContext(userId, assignmentId);
  const history = await findSubmissionsForEnrollmentAssignment(enrollmentId, assignmentId);
  return history.map(toSubmissionResult);
}

export async function getMySubmissionWithScores(userId: string, submissionId: string): Promise<SubmissionWithScores> {
  const { submission, assignment } = await assertOwnSubmission(userId, submissionId);
  const criteriaById = await buildCriteriaLookup(assignment.id, submission.criterionScores);
  return toSubmissionWithScores(submission, submission.criterionScores, criteriaById);
}

// --- Assignment Feedback Interaction (004, FR-078, T067) — "mark feedback
// as viewed, reply, resubmit, and request clarification." Resubmit already
// exists (`startOrResumeSubmission`'s CHANGES_REQUESTED branch). All three
// functions below require the submission to have ACTUALLY been reviewed
// (`reviewedAt` set) — there is no feedback to view/reply-to/clarify on an
// unreviewed submission. --------------------------------------------------

function assertFeedbackExists(submission: { reviewedAt: Date | null }): void {
  if (!submission.reviewedAt) throw AppError.badRequest('This submission has not been reviewed yet — there is no feedback to act on');
}

/** Idempotent — marking already-viewed feedback as viewed again is a silent no-op, never overwriting the original timestamp. */
export async function markMyFeedbackViewed(userId: string, submissionId: string): Promise<SubmissionResult> {
  const { submission } = await assertOwnSubmission(userId, submissionId);
  assertFeedbackExists(submission);
  if (submission.feedbackViewedAt) return toSubmissionResult(submission);

  const updated = await updateSubmission(submissionId, { feedbackViewedAt: new Date() });
  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'lms.submission.feedback_viewed',
    resourceType: 'submission',
    resourceId: submissionId,
  });
  return toSubmissionResult(updated);
}

async function createLearnerFeedbackMessage(
  userId: string,
  submissionId: string,
  body: string,
  type: 'REPLY' | 'CLARIFICATION_REQUEST',
): Promise<SubmissionFeedbackMessageResult> {
  const { submission } = await assertOwnSubmission(userId, submissionId);
  assertFeedbackExists(submission);

  const message = await createFeedbackMessage({
    submission: { connect: { id: submissionId } },
    authorId: userId,
    authorRole: 'LEARNER',
    type: type as never,
    body,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: type === 'REPLY' ? 'lms.submission.feedback_replied' : 'lms.submission.clarification_requested',
    resourceType: 'submission',
    resourceId: submissionId,
  });

  return toSubmissionFeedbackMessage(message);
}

export function replyToMyFeedback(userId: string, submissionId: string, body: string): Promise<SubmissionFeedbackMessageResult> {
  return createLearnerFeedbackMessage(userId, submissionId, body, 'REPLY');
}

export function requestClarificationOnMyFeedback(userId: string, submissionId: string, body: string): Promise<SubmissionFeedbackMessageResult> {
  return createLearnerFeedbackMessage(userId, submissionId, body, 'CLARIFICATION_REQUEST');
}

export async function listMyFeedbackMessages(userId: string, submissionId: string): Promise<SubmissionFeedbackMessageResult[]> {
  await assertOwnSubmission(userId, submissionId);
  const rows = await findFeedbackMessagesForSubmission(submissionId);
  return rows.map(toSubmissionFeedbackMessage);
}

// --- Reviewer-side (admin, reuses `course.module.manage` — same tier as
// quiz grading configuration; this batch does not build a separate
// instructor-scoped review surface, matching Quiz's own documented scope
// limit) ----------------------------------------------------------------

export async function listSubmissionsForAssignmentAdmin(assignmentId: string, statusFilter?: string): Promise<AdminSubmissionSummary[]> {
  const rows = await findSubmissionsForAssignmentAdmin(assignmentId, statusFilter);
  return rows.map((r) => toAdminSubmissionSummary(r as never));
}

export async function getSubmissionAdmin(
  submissionId: string,
): Promise<SubmissionWithScores & { learnerUserId: string; peerReviews: PeerReviewForInstructor[] }> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');

  const assignment = await findAssignmentById(submission.assignmentId);
  if (!assignment) throw AppError.notFound('Submission not found');

  const criteriaById = await buildCriteriaLookup(assignment.id, submission.criterionScores);

  const prisma = (await import('../database/prisma-client')).getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  const enrollment = await prisma.enrollment.findUnique({ where: { id: submission.enrollmentId } });

  // FR-076 acceptance scenario 3 — "the instructor sees both peer scores/
  // comments alongside their own review screen." Peer reviews are
  // ALWAYS surfaced with reviewer identity here (never anonymized to
  // staff) regardless of `Assignment.peerReviewAnonymous`, which only
  // governs the SUBMITTER's own view (`getPeerReviewsForSubmitter`).
  const peerReviews = await getPeerReviewsForInstructor(submissionId);

  return { ...toSubmissionWithScores(submission, submission.criterionScores, criteriaById), learnerUserId: enrollment?.userId ?? '', peerReviews };
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

  // 004 Broader Assessment Types batch (FR-068) — SELF_ASSESSMENT/
  // SKILL_RATING have nothing for an instructor to review; their outcome
  // is produced entirely by `submitSelfAssessment` above.
  if (SELF_SCORED_ASSESSMENT_TYPES.includes(assignment.assessmentType)) {
    throw AppError.badRequest('This assignment is self-assessed by the learner and does not require instructor review');
  }

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
    // 004 Broader Assessment Types batch (FR-068) — only a final decision
    // (APPROVE/REJECT, i.e. `passed !== null`) gets a level; a still-open
    // REQUEST_CHANGES round has no final outcome yet.
    const activeCriteria = await findRubricCriteriaByAssignment(assignment.id, tx);
    const maxTotal = activeCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
    const outcomeLevel = passed !== null ? deriveOutcomeLevel(score, maxTotal) : null;

    const result = await updateSubmission(
      submissionId,
      {
        status: status as never,
        score,
        passed,
        outcomeLevel,
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

    // FR-109 — reviewer (actorId) is an instructor/admin, never the learner
    // this event is attributed to; the owning enrollment's own userId is
    // fetched fresh, same pattern as quiz grading's ASSIGNMENT_REVIEWED
    // sibling events.
    const owningEnrollment = await findEnrollmentById(submission.enrollmentId, tx);
    if (owningEnrollment) {
      await recordLearningEvent(
        {
          eventType: 'ASSIGNMENT_REVIEWED',
          userId: owningEnrollment.userId,
          courseId: owningEnrollment.courseId,
          lessonId: assignment.lessonId,
          enrollmentId: submission.enrollmentId,
          metadata: { submissionId, decision: input.decision, score },
        },
        tx,
      );
    }

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

// --- Assignment Feedback Interaction, instructor side (004, FR-078, T067) —
// same `course.module.manage` permission tier `reviewSubmission` already
// uses. Answering a learner's reply/clarification request is what keeps
// this a real conversation rather than a one-way mailbox. -----------------

export async function respondToFeedbackAdmin(submissionId: string, body: string, actorId: string): Promise<SubmissionFeedbackMessageResult> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');
  assertFeedbackExists(submission);

  const message = await createFeedbackMessage({
    submission: { connect: { id: submissionId } },
    authorId: actorId,
    authorRole: 'INSTRUCTOR',
    type: 'REPLY' as never,
    body,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.submission.feedback_responded',
    resourceType: 'submission',
    resourceId: submissionId,
  });

  return toSubmissionFeedbackMessage(message);
}

export async function listFeedbackMessagesAdmin(submissionId: string): Promise<SubmissionFeedbackMessageResult[]> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');
  const rows = await findFeedbackMessagesForSubmission(submissionId);
  return rows.map(toSubmissionFeedbackMessage);
}
