import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findEnrollmentForUserAndCourse, findEnrollmentById } from './enrollment.repository';
import { findSubmissionsForEnrollmentAssignment, findSubmissionById, findRubricCriterionByIdIncludingDeleted, findAssignmentById } from './assignment.repository';
import { buildCriteriaLookup } from './assignment.service';
import {
  findPeerReviewCandidatesForLearner,
  findSubmissionForPeerReview,
  countActivePeerReviewClaims,
  createPeerReviewClaim,
  findPeerReviewById,
  upsertPeerReviewCriterionScore,
  updatePeerReview,
  findVisiblePeerReviewsForSubmission,
  findAllPeerReviewsForSubmissionAdmin,
} from './peer-review.repository';
import { toPeerReviewQueueItem, toPeerReviewResult, toPeerReviewForSubmitter, toPeerReviewForInstructor } from './peer-review.serializers';
import type { PeerReviewCriterionScoreInput, PeerReviewForInstructor, PeerReviewForSubmitter, PeerReviewQueueItem, PeerReviewResult } from './peer-review.types';

/**
 * 004 US9 — Peer Review (FR-076). Reviewer eligibility (any OTHER learner
 * enrolled in the same course who has themselves a SUBMITTED-or-later
 * submission for this same assignment), a self-select claim queue capped
 * at `Assignment.peerReviewsRequired` concurrent claims per submission,
 * rubric-based scoring reusing the SAME `RubricCriterion` set the
 * instructor uses, anonymity enforced at the serializer, and non-
 * destructive HIDE/RESTORE moderation — all real, deterministic mechanics.
 *
 * Deliberately NOT built: an automatic reviewer-MATCHING algorithm (FR-076
 * names "reviewer eligibility" as configurable, not a specific pairing
 * strategy — inventing one would be fabricating a rule the spec never
 * states) and automatic blending of the peer score into
 * `Submission.score` (the user story's own narrative: peer reviews
 * "inform — but do not automatically override — the instructor's final
 * grade"). `Assignment.peerReviewIncludeInGrade` is therefore surfaced to
 * the instructor's review screen as information only; `reviewSubmission`
 * in `assignment-submission.service.ts` remains the sole place
 * `Submission.score`/`passed` are ever set.
 */

const PEER_ELIGIBLE_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED']);

function isPastDeadline(submittedAt: Date | null, deadlineDays: number | null): boolean {
  if (deadlineDays === null || submittedAt === null) return false;
  return Date.now() > submittedAt.getTime() + deadlineDays * 86_400_000;
}

/** GET /me/peer-review-queue — every open submission this learner is eligible to claim. */
export async function getPeerReviewQueueForLearner(userId: string): Promise<PeerReviewQueueItem[]> {
  const candidates = await findPeerReviewCandidatesForLearner(userId);

  const items: PeerReviewQueueItem[] = [];
  for (const candidate of candidates) {
    const alreadyClaimedByMe = candidate.peerReviews.some((pr) => pr.reviewerEnrollment.userId === userId);
    if (alreadyClaimedByMe) continue;
    if (isPastDeadline(candidate.submittedAt, candidate.assignment.peerReviewDeadlineDays)) continue;

    const slotsRemaining = candidate.assignment.peerReviewsRequired - candidate.peerReviews.length;
    if (slotsRemaining <= 0) continue;

    items.push(toPeerReviewQueueItem(candidate, slotsRemaining));
  }
  return items;
}

/** POST /me/submissions/:submissionId/peer-review — claim an open review slot. */
export async function claimPeerReview(userId: string, submissionId: string): Promise<PeerReviewResult> {
  const submission = await findSubmissionForPeerReview(submissionId);
  if (!submission || !submission.assignment.peerReviewEnabled) throw AppError.notFound('This submission is not open for peer review');
  if (submission.status !== 'SUBMITTED') throw AppError.conflict('This submission is no longer open for peer review');

  const courseId = submission.assignment.lesson.module.courseId;
  const reviewerEnrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!reviewerEnrollment) throw AppError.forbidden('You must be enrolled in this course to peer-review this submission');
  if (reviewerEnrollment.id === submission.enrollmentId) throw AppError.badRequest('You cannot peer-review your own submission');

  const ownSubmissions = await findSubmissionsForEnrollmentAssignment(reviewerEnrollment.id, submission.assignmentId);
  if (!ownSubmissions.some((s) => PEER_ELIGIBLE_STATUSES.has(s.status))) {
    throw AppError.forbidden('Submit your own work for this assignment before peer-reviewing others');
  }

  if (isPastDeadline(submission.submittedAt, submission.assignment.peerReviewDeadlineDays)) {
    throw AppError.conflict('The peer-review window for this submission has closed');
  }

  const activeClaims = await countActivePeerReviewClaims(submissionId);
  if (activeClaims >= submission.assignment.peerReviewsRequired) {
    throw AppError.conflict('This submission already has its required number of peer reviewers');
  }

  const created = await withTransaction(async (tx) => {
    const claim = await createPeerReviewClaim(submissionId, reviewerEnrollment.id, tx).catch((error: unknown) => {
      const normalized = normalizeDatabaseError(error);
      if (normalized.statusCode === 409) throw AppError.conflict('You have already claimed this submission for review');
      throw normalized;
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.peer_review.claimed', resourceType: 'peer_review', resourceId: claim.id, metadata: { submissionId } },
      tx,
    );

    return claim;
  });

  return toPeerReviewResult({ ...created, criterionScores: [] }, new Map());
}

export interface SubmitPeerReviewInput {
  criterionScores: PeerReviewCriterionScoreInput[];
  comment?: string;
}

/** POST /me/peer-reviews/:peerReviewId/submit */
export async function submitPeerReview(userId: string, peerReviewId: string, input: SubmitPeerReviewInput): Promise<PeerReviewResult> {
  const peerReview = await findPeerReviewById(peerReviewId);
  if (!peerReview) throw AppError.notFound('Peer review not found');

  const reviewerEnrollment = await findEnrollmentById(peerReview.reviewerEnrollmentId);
  if (!reviewerEnrollment || reviewerEnrollment.userId !== userId) throw AppError.notFound('Peer review not found');
  if (peerReview.status !== 'PENDING') throw AppError.conflict('This peer review has already been submitted');

  for (const s of input.criterionScores) {
    const criterion = await findRubricCriterionByIdIncludingDeleted(s.criterionId);
    if (!criterion || criterion.assignmentId !== peerReview.submission.assignmentId) {
      throw AppError.badRequest('One or more scored criteria do not belong to this assignment');
    }
    if (s.pointsAwarded > criterion.maxPoints) {
      throw AppError.badRequest(`Points awarded for "${criterion.title}" cannot exceed its maximum of ${criterion.maxPoints}`);
    }
  }

  const updated = await withTransaction(async (tx) => {
    for (const s of input.criterionScores) {
      await upsertPeerReviewCriterionScore(peerReviewId, s.criterionId, { pointsAwarded: s.pointsAwarded, comment: s.comment ?? null }, tx);
    }

    const allScores = await tx.peerReviewCriterionScore.findMany({ where: { peerReviewId } });
    const totalScore = allScores.reduce((sum, s) => sum + s.pointsAwarded, 0);

    const result = await updatePeerReview(
      peerReviewId,
      { status: 'SUBMITTED', submittedAt: new Date(), totalScore, ...(input.comment !== undefined ? { comment: input.comment } : {}) },
      tx,
    );

    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.peer_review.submitted', resourceType: 'peer_review', resourceId: peerReviewId, afterState: { totalScore } },
      tx,
    );

    return result;
  });

  const criteriaById = await buildCriteriaLookup(peerReview.submission.assignmentId, updated.criterionScores);
  return toPeerReviewResult(updated, criteriaById);
}

/** GET /me/submissions/:submissionId/peer-reviews — the learner viewing reviews left on THEIR OWN submission, anonymized per the assignment's config. */
export async function getPeerReviewsForSubmitter(userId: string, submissionId: string): Promise<PeerReviewForSubmitter[]> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw AppError.notFound('Submission not found');
  const enrollment = await findEnrollmentById(submission.enrollmentId);
  if (!enrollment || enrollment.userId !== userId) throw AppError.notFound('Submission not found');

  const assignment = await findAssignmentById(submission.assignmentId);
  if (!assignment) throw AppError.notFound('Submission not found');

  const reviews = await findVisiblePeerReviewsForSubmission(submissionId);
  const criteriaById = await buildCriteriaLookup(submission.assignmentId, reviews.flatMap((r) => r.criterionScores));

  return reviews.map((r) =>
    toPeerReviewForSubmitter(r, assignment.peerReviewAnonymous ? null : (r.reviewerEnrollment.user.profile?.displayName ?? null), criteriaById),
  );
}

/** Used by `assignment-submission.service.ts`'s `getSubmissionAdmin` to surface peer reviews to the instructor. */
export async function getPeerReviewsForInstructor(submissionId: string): Promise<PeerReviewForInstructor[]> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) return [];

  const reviews = await findAllPeerReviewsForSubmissionAdmin(submissionId);
  const criteriaById = await buildCriteriaLookup(submission.assignmentId, reviews.flatMap((r) => r.criterionScores));

  return reviews.map((r) =>
    toPeerReviewForInstructor(r, r.reviewerEnrollment.userId, r.reviewerEnrollment.user.profile?.displayName ?? null, criteriaById),
  );
}

export interface ModeratePeerReviewInput {
  action: 'HIDE' | 'RESTORE';
  reason?: string;
}

/** POST /admin/peer-reviews/:id/moderate — same non-destructive HIDE/RESTORE pattern `course-review.service.ts` established. */
export async function moderatePeerReview(peerReviewId: string, input: ModeratePeerReviewInput, actorId: string): Promise<void> {
  const peerReview = await findPeerReviewById(peerReviewId);
  if (!peerReview) throw AppError.notFound('Peer review not found');

  await updatePeerReview(peerReviewId, {
    moderationStatus: input.action === 'HIDE' ? 'HIDDEN' : 'VISIBLE',
    moderatedBy: actorId,
    moderatedAt: new Date(),
    moderationReason: input.reason ?? null,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: input.action === 'HIDE' ? 'lms.peer_review.hidden' : 'lms.peer_review.restored',
    resourceType: 'peer_review',
    resourceId: peerReviewId,
    afterState: { reason: input.reason },
  });
}
