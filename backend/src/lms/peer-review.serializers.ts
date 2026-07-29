import type { CriterionScoreResult } from './assignment.types';
import type { PeerReviewForInstructor, PeerReviewForSubmitter, PeerReviewQueueItem, PeerReviewResult } from './peer-review.types';

type CriterionScoreRow = { criterionId: string; pointsAwarded: number; comment: string | null };

function toCriterionScoreResults(
  scores: CriterionScoreRow[],
  criteriaById: Map<string, { title: string; maxPoints: number }>,
): CriterionScoreResult[] {
  return scores.map((s) => ({
    criterionId: s.criterionId,
    criterionTitle: criteriaById.get(s.criterionId)?.title ?? 'Removed criterion',
    maxPoints: criteriaById.get(s.criterionId)?.maxPoints ?? 0,
    pointsAwarded: s.pointsAwarded,
    comment: s.comment,
  }));
}

interface PeerReviewRow {
  id: string;
  submissionId: string;
  status: string;
  comment: string | null;
  totalScore: number | null;
  claimedAt: Date;
  submittedAt: Date | null;
  criterionScores: CriterionScoreRow[];
}

export function toPeerReviewResult(row: PeerReviewRow, criteriaById: Map<string, { title: string; maxPoints: number }>): PeerReviewResult {
  return {
    id: row.id,
    submissionId: row.submissionId,
    status: row.status,
    comment: row.comment,
    totalScore: row.totalScore,
    claimedAt: row.claimedAt,
    submittedAt: row.submittedAt,
    criterionScores: toCriterionScoreResults(row.criterionScores, criteriaById),
  };
}

export function toPeerReviewForSubmitter(
  row: PeerReviewRow,
  reviewerDisplayName: string | null,
  criteriaById: Map<string, { title: string; maxPoints: number }>,
): PeerReviewForSubmitter {
  return {
    id: row.id,
    reviewerDisplayName,
    comment: row.comment,
    totalScore: row.totalScore,
    submittedAt: row.submittedAt,
    criterionScores: toCriterionScoreResults(row.criterionScores, criteriaById),
  };
}

export function toPeerReviewForInstructor(
  row: PeerReviewRow & { reviewerEnrollmentId: string; moderationStatus: string; moderationReason: string | null },
  reviewerUserId: string,
  reviewerDisplayName: string | null,
  criteriaById: Map<string, { title: string; maxPoints: number }>,
): PeerReviewForInstructor {
  return {
    id: row.id,
    reviewerEnrollmentId: row.reviewerEnrollmentId,
    reviewerUserId,
    reviewerDisplayName,
    status: row.status,
    comment: row.comment,
    totalScore: row.totalScore,
    submittedAt: row.submittedAt,
    moderationStatus: row.moderationStatus,
    moderationReason: row.moderationReason,
    criterionScores: toCriterionScoreResults(row.criterionScores, criteriaById),
  };
}

interface CandidateSubmissionRow {
  id: string;
  assignmentId: string;
  submittedAt: Date | null;
  textBody: string | null;
  linkUrl: string | null;
  assignment: {
    title: string;
    rubricCriteria: { id: string; title: string; description: string | null; maxPoints: number }[];
    lesson: { id: string; module: { course: { id: string; title: string } } };
  };
}

export function toPeerReviewQueueItem(row: CandidateSubmissionRow, slotsRemaining: number): PeerReviewQueueItem {
  return {
    submissionId: row.id,
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignment.title,
    courseId: row.assignment.lesson.module.course.id,
    courseTitle: row.assignment.lesson.module.course.title,
    lessonId: row.assignment.lesson.id,
    submittedAt: row.submittedAt,
    textBody: row.textBody,
    linkUrl: row.linkUrl,
    criteria: row.assignment.rubricCriteria.map((c) => ({ id: c.id, title: c.title, description: c.description, maxPoints: c.maxPoints })),
    slotsRemaining,
  };
}
