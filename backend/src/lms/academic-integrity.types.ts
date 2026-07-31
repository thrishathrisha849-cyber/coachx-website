/** FR-116's exact 6 named academic-integrity case types. */
export const ACADEMIC_INTEGRITY_CASE_TYPES = [
  'PLAGIARISM',
  'UNAUTHORIZED_COLLABORATION',
  'IDENTITY_FRAUD',
  'QUIZ_CHEATING',
  'FABRICATED_SUBMISSION',
  'CERTIFICATE_FRAUD',
] as const;

export type AcademicIntegrityCaseType = (typeof ACADEMIC_INTEGRITY_CASE_TYPES)[number];

/** The concrete piece of learner work (or the learner's identity itself) a flag can target. */
export const ACADEMIC_INTEGRITY_TARGET_TYPES = ['SUBMISSION', 'QUIZ_ATTEMPT', 'CERTIFICATE', 'USER'] as const;

export type AcademicIntegrityTargetType = (typeof ACADEMIC_INTEGRITY_TARGET_TYPES)[number];

export type AcademicIntegrityInvestigationOutcome = 'CONFIRMED' | 'CLEARED';

export interface AdminAcademicIntegrityCase {
  id: string;
  type: AcademicIntegrityCaseType;
  targetType: AcademicIntegrityTargetType;
  targetId: string | null;
  reportedUserId: string | null;
  reporterId: string | null;
  reason: string;
  evidence: unknown;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
  actionReason: string | null;
  actionedBy: string | null;
  actionedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
