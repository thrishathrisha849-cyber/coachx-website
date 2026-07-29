import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

const candidateInclude = {
  assignment: {
    include: {
      rubricCriteria: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } },
      lesson: { include: { module: { include: { course: { select: { id: true, title: true } } } } } },
    },
  },
  peerReviews: {
    where: { status: { in: ['PENDING', 'SUBMITTED'] as never } },
    include: { reviewerEnrollment: { select: { userId: true } } },
  },
} satisfies Prisma.SubmissionInclude;

/**
 * Every SUBMITTED submission, for an assignment with peer review enabled,
 * belonging to one of this learner's OWN eligible assignments (they
 * themselves have a SUBMITTED-or-later submission for that same
 * assignment — the FR-076 "reviewer eligibility" gate) and NOT their own
 * submission. Final per-candidate filtering (slots remaining, deadline,
 * already-claimed-by-this-learner) happens in `peer-review.service.ts` —
 * this is deliberately the broad candidate set, not the final shaped list.
 */
export async function findPeerReviewCandidatesForLearner(learnerUserId: string, tx?: TransactionClient) {
  const client = db(tx);

  const ownSubmissions = await client.submission.findMany({
    where: { enrollment: { userId: learnerUserId }, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'] as never } },
    select: { assignmentId: true },
  });
  const eligibleAssignmentIds = [...new Set(ownSubmissions.map((s) => s.assignmentId))];
  if (eligibleAssignmentIds.length === 0) return [];

  const learnerEnrollments = await client.enrollment.findMany({ where: { userId: learnerUserId }, select: { id: true } });
  const ownEnrollmentIds = learnerEnrollments.map((e) => e.id);

  return client.submission.findMany({
    where: {
      assignmentId: { in: eligibleAssignmentIds },
      status: 'SUBMITTED',
      enrollmentId: { notIn: ownEnrollmentIds },
      assignment: { peerReviewEnabled: true, deletedAt: null },
    },
    include: candidateInclude,
  });
}

export function findSubmissionForPeerReview(submissionId: string, tx?: TransactionClient) {
  return db(tx).submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          rubricCriteria: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
          lesson: { include: { module: { select: { courseId: true } } } },
        },
      },
      peerReviews: { where: { status: { in: ['PENDING', 'SUBMITTED'] as never } } },
    },
  });
}

export function countActivePeerReviewClaims(submissionId: string, tx?: TransactionClient) {
  return db(tx).peerReview.count({ where: { submissionId, status: { in: ['PENDING', 'SUBMITTED'] as never } } });
}

export function createPeerReviewClaim(submissionId: string, reviewerEnrollmentId: string, tx: TransactionClient) {
  return tx.peerReview.create({ data: { submission: { connect: { id: submissionId } }, reviewerEnrollment: { connect: { id: reviewerEnrollmentId } } } });
}

export function findPeerReviewById(id: string, tx?: TransactionClient) {
  return db(tx).peerReview.findUnique({
    where: { id },
    include: { criterionScores: true, submission: { include: { assignment: true } } },
  });
}

export function upsertPeerReviewCriterionScore(
  peerReviewId: string,
  criterionId: string,
  data: { pointsAwarded: number; comment: string | null },
  tx: TransactionClient,
) {
  return tx.peerReviewCriterionScore.upsert({
    where: { peerReviewId_criterionId: { peerReviewId, criterionId } },
    create: { peerReviewId, criterionId, ...data },
    update: data,
  });
}

export function updatePeerReview(id: string, data: Prisma.PeerReviewUpdateInput, tx?: TransactionClient) {
  return db(tx).peerReview.update({ where: { id }, data, include: { criterionScores: true } });
}

const forSubmitterInclude = {
  criterionScores: true,
  // Included even when the assignment is configured anonymous — the
  // SERIALIZER (not this query) decides whether reviewerDisplayName is
  // ever populated in the response, so the anonymity decision lives in
  // exactly one place, not duplicated between query shape and serializer.
  reviewerEnrollment: { include: { user: { include: { profile: true } } } },
} satisfies Prisma.PeerReviewInclude;

/** Every SUBMITTED, non-hidden peer review for a submission — the learner-facing "reviews I received" read. */
export function findVisiblePeerReviewsForSubmission(submissionId: string, tx?: TransactionClient) {
  return db(tx).peerReview.findMany({
    where: { submissionId, status: 'SUBMITTED', moderationStatus: 'VISIBLE' },
    include: forSubmitterInclude,
    orderBy: { submittedAt: 'asc' },
  });
}

const forInstructorInclude = {
  criterionScores: true,
  reviewerEnrollment: { include: { user: { include: { profile: true } } } },
} satisfies Prisma.PeerReviewInclude;

/** Every SUBMITTED peer review for a submission, including hidden ones and reviewer identity — the admin/instructor read. */
export function findAllPeerReviewsForSubmissionAdmin(submissionId: string, tx?: TransactionClient) {
  return db(tx).peerReview.findMany({
    where: { submissionId, status: 'SUBMITTED' },
    include: forInstructorInclude,
    orderBy: { submittedAt: 'asc' },
  });
}
