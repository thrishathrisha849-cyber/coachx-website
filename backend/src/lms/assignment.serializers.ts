import type {
  AdminAssignment,
  AdminAssignmentWithRubric,
  AdminRubricCriterion,
  AdminSubmissionSummary,
  CriterionScoreResult,
  PublicAssignment,
  SubmissionResult,
  SubmissionWithScores,
} from './assignment.types';

type AssignmentRow = {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  learningOutcome: string | null;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt: Date | null;
  maxScore: number;
  passingScore: number;
  latePolicy: string;
  maxAttempts: number | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

type CriterionRow = { id: string; assignmentId: string; title: string; description: string | null; maxPoints: number; position: number };

export function toAdminAssignment(row: AssignmentRow): AdminAssignment {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    instructions: row.instructions,
    learningOutcome: row.learningOutcome,
    submissionFormat: row.submissionFormat,
    allowedFileTypes: row.allowedFileTypes,
    dueAt: row.dueAt,
    maxScore: row.maxScore,
    passingScore: row.passingScore,
    latePolicy: row.latePolicy,
    maxAttempts: row.maxAttempts,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminRubricCriterion(row: CriterionRow): AdminRubricCriterion {
  return { id: row.id, assignmentId: row.assignmentId, title: row.title, description: row.description, maxPoints: row.maxPoints, position: row.position };
}

export function toAdminAssignmentWithRubric(assignment: AssignmentRow, criteria: CriterionRow[]): AdminAssignmentWithRubric {
  return { ...toAdminAssignment(assignment), rubricCriteria: criteria.map(toAdminRubricCriterion) };
}

export function toPublicAssignment(row: AssignmentRow): PublicAssignment {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    instructions: row.instructions,
    learningOutcome: row.learningOutcome,
    submissionFormat: row.submissionFormat,
    allowedFileTypes: row.allowedFileTypes,
    dueAt: row.dueAt,
    maxScore: row.maxScore,
    passingScore: row.passingScore,
    maxAttempts: row.maxAttempts,
  };
}

type SubmissionRow = {
  id: string;
  assignmentId: string;
  attemptNumber: number;
  status: string;
  textBody: string | null;
  linkUrl: string | null;
  submittedAt: Date | null;
  isLate: boolean;
  score: number | null;
  passed: boolean | null;
  learnerFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toSubmissionResult(row: SubmissionRow): SubmissionResult {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    attemptNumber: row.attemptNumber,
    status: row.status,
    textBody: row.textBody,
    linkUrl: row.linkUrl,
    submittedAt: row.submittedAt,
    isLate: row.isLate,
    score: row.score,
    passed: row.passed,
    learnerFeedback: row.learnerFeedback,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type CriterionScoreRow = { criterionId: string; pointsAwarded: number; comment: string | null };

export function toSubmissionWithScores(
  row: SubmissionRow,
  scores: CriterionScoreRow[],
  criteriaById: Map<string, { title: string; maxPoints: number }>,
): SubmissionWithScores {
  const criterionScores: CriterionScoreResult[] = scores.map((s) => ({
    criterionId: s.criterionId,
    criterionTitle: criteriaById.get(s.criterionId)?.title ?? 'Removed criterion',
    maxPoints: criteriaById.get(s.criterionId)?.maxPoints ?? 0,
    pointsAwarded: s.pointsAwarded,
    comment: s.comment,
  }));
  return { ...toSubmissionResult(row), criterionScores };
}

export function toAdminSubmissionSummary(
  row: SubmissionRow & { enrollment: { userId: string; user: { profile: { displayName: string | null } | null } } },
): AdminSubmissionSummary {
  return {
    ...toSubmissionResult(row),
    enrollmentId: (row as unknown as { enrollmentId: string }).enrollmentId,
    learnerUserId: row.enrollment.userId,
    learnerDisplayName: row.enrollment.user.profile?.displayName ?? null,
  };
}
