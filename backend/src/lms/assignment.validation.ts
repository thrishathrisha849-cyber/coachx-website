import { z } from 'zod';

const uuid = () => z.string().uuid();

export const SUBMISSION_FORMATS = ['TEXT', 'LINK', 'FILE_URL', 'IMAGE_URL', 'AUDIO_URL', 'VIDEO_URL'] as const;
export const LATE_POLICIES = ['REJECT', 'ACCEPT'] as const;
export const ASSIGNMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
/** 004 Broader Assessment Types batch (FR-068) — see `Assignment.assessmentType`'s schema doc comment. */
export const ASSESSMENT_TYPES = ['STANDARD', 'SELF_ASSESSMENT', 'SKILL_RATING', 'SCENARIO_TASK', 'PORTFOLIO_REVIEW'] as const;

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });
export const assignmentIdParamSchema = z.object({ params: z.object({ assignmentId: uuid() }) });

// ============================================================================
// Admin: Assignment
// ============================================================================

// FR-076 Peer Review config (004 US9 batch) — shared between create/update.
const peerReviewConfigFields = {
  peerReviewEnabled: z.boolean().default(false),
  peerReviewsRequired: z.number().int().min(0).max(20).default(0),
  peerReviewAnonymous: z.boolean().default(true),
  peerReviewDeadlineDays: z.number().int().min(1).max(365).nullable().optional(),
  peerReviewIncludeInGrade: z.boolean().default(false),
};

export const createAssignmentSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({
    title: z.string().trim().min(2).max(200),
    instructions: z.string().max(20000).optional(),
    learningOutcome: z.string().max(500).optional(),
    submissionFormat: z.enum(SUBMISSION_FORMATS).default('TEXT'),
    allowedFileTypes: z.array(z.string().trim().max(20)).max(20).default([]),
    dueAt: z.string().datetime().nullable().optional(),
    maxScore: z.number().int().min(1).max(100000).default(100),
    passingScore: z.number().int().min(0).max(100000).default(70),
    latePolicy: z.enum(LATE_POLICIES).default('ACCEPT'),
    maxAttempts: z.number().int().min(1).max(100).nullable().optional(),
    assessmentType: z.enum(ASSESSMENT_TYPES).default('STANDARD'),
    ...peerReviewConfigFields,
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({ assignmentId: uuid() }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      instructions: z.string().max(20000).nullable(),
      learningOutcome: z.string().max(500).nullable(),
      submissionFormat: z.enum(SUBMISSION_FORMATS),
      allowedFileTypes: z.array(z.string().trim().max(20)).max(20),
      dueAt: z.string().datetime().nullable(),
      maxScore: z.number().int().min(1).max(100000),
      passingScore: z.number().int().min(0).max(100000),
      latePolicy: z.enum(LATE_POLICIES),
      maxAttempts: z.number().int().min(1).max(100).nullable(),
      assessmentType: z.enum(ASSESSMENT_TYPES),
      peerReviewEnabled: z.boolean(),
      peerReviewsRequired: z.number().int().min(0).max(20),
      peerReviewAnonymous: z.boolean(),
      peerReviewDeadlineDays: z.number().int().min(1).max(365).nullable(),
      peerReviewIncludeInGrade: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const changeAssignmentStatusSchema = z.object({
  params: z.object({ assignmentId: uuid() }),
  body: z.object({ status: z.enum(ASSIGNMENT_STATUSES) }),
});

// ============================================================================
// Admin: Rubric criteria
// ============================================================================

export const createCriterionSchema = z.object({
  params: z.object({ assignmentId: uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    maxPoints: z.number().int().min(1).max(1000).default(10),
  }),
});

export const criterionIdParamSchema = z.object({ params: z.object({ criterionId: uuid() }) });

export const updateCriterionSchema = z.object({
  params: z.object({ criterionId: uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    maxPoints: z.number().int().min(1).max(1000).optional(),
  }),
});

// ============================================================================
// Learner-facing submissions
// ============================================================================

export const submissionIdParamSchema = z.object({ params: z.object({ submissionId: uuid() }) });

/**
 * 004 Academic-integrity investigation batch (FR-116 "originality
 * declaration") — `z.literal(true)` makes the affirmation a REAL gate
 * (a `false`/omitted value is rejected with a normal validation error),
 * not a cosmetic checkbox the server ignores.
 */
export const submitSubmissionSchema = z.object({
  params: z.object({ submissionId: uuid() }),
  body: z.object({
    declaredOriginal: z.literal(true, { errorMap: () => ({ message: 'You must confirm this submission is your own original work before submitting' }) }),
  }),
});

/**
 * 004 Broader Assessment Types batch (FR-068) — SELF_ASSESSMENT/
 * SKILL_RATING's own submit path (distinct from `submitSubmissionSchema`
 * above, which those two types reject). `.min(1)` — unlike
 * `reviewSubmissionSchema`'s `.default([])` (which allows a bare REJECT
 * decision with no scores), a self-assessment IS the criterion scores;
 * zero of them is not a meaningful self-assessment.
 */
export const submitSelfAssessmentSchema = z.object({
  params: z.object({ submissionId: uuid() }),
  body: z.object({
    criterionScores: z
      .array(z.object({ criterionId: uuid(), pointsAwarded: z.number().int().min(0), comment: z.string().max(2000).optional() }))
      .min(1)
      .max(100),
  }),
});

export const saveDraftSchema = z.object({
  params: z.object({ submissionId: uuid() }),
  body: z
    .object({
      textBody: z.string().max(50000).optional(),
      linkUrl: z.string().url().max(500).optional(),
    })
    .refine((b) => b.textBody !== undefined || b.linkUrl !== undefined, { message: 'Provide either textBody or linkUrl' }),
});

// ============================================================================
// Assignment Feedback Interaction (004, FR-078, T067)
// ============================================================================

const feedbackMessageBody = z.object({ body: z.string().trim().min(1).max(5000) });

export const replyToFeedbackSchema = z.object({ params: z.object({ submissionId: uuid() }), body: feedbackMessageBody });
export const requestClarificationSchema = z.object({ params: z.object({ submissionId: uuid() }), body: feedbackMessageBody });
export const respondToFeedbackAdminSchema = z.object({ params: z.object({ submissionId: uuid() }), body: feedbackMessageBody });

// ============================================================================
// Reviewer decision
// ============================================================================

export const REVIEW_DECISIONS = ['APPROVE', 'REQUEST_CHANGES', 'REJECT'] as const;

export const reviewSubmissionSchema = z.object({
  params: z.object({ submissionId: uuid() }),
  body: z.object({
    decision: z.enum(REVIEW_DECISIONS),
    criterionScores: z
      .array(z.object({ criterionId: uuid(), pointsAwarded: z.number().int().min(0), comment: z.string().max(2000).optional() }))
      .max(100)
      .default([]),
    reviewerNote: z.string().max(5000).optional(),
    learnerFeedback: z.string().max(5000).optional(),
  }),
});

export const listSubmissionsQuerySchema = z.object({
  params: z.object({ assignmentId: uuid() }),
  query: z.object({
    status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'EXCUSED']).optional(),
  }),
});

// ============================================================================
// Peer Review (FR-076, 004 US9 batch)
// ============================================================================

export const peerReviewIdParamSchema = z.object({ params: z.object({ peerReviewId: uuid() }) });

export const submitPeerReviewSchema = z.object({
  params: z.object({ peerReviewId: uuid() }),
  body: z.object({
    criterionScores: z
      .array(z.object({ criterionId: uuid(), pointsAwarded: z.number().int().min(0), comment: z.string().max(2000).optional() }))
      .max(100)
      .default([]),
    comment: z.string().max(5000).optional(),
  }),
});

export const MODERATE_PEER_REVIEW_ACTIONS = ['HIDE', 'RESTORE'] as const;

export const moderatePeerReviewSchema = z.object({
  params: z.object({ peerReviewId: uuid() }),
  body: z.object({
    action: z.enum(MODERATE_PEER_REVIEW_ACTIONS),
    reason: z.string().max(2000).optional(),
  }),
});
