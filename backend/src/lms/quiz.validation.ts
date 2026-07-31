import { z } from 'zod';

const uuid = () => z.string().uuid();

export const QUIZ_TYPES = ['PRACTICE', 'GRADED', 'MODULE_QUIZ', 'FINAL_ASSESSMENT', 'CERTIFICATION_EXAM', 'DIAGNOSTIC'] as const;
export const QUIZ_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'NUMERIC'] as const;
export const QUESTION_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']);

// ============================================================================
// Admin: Quiz
// ============================================================================

export const createQuizSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({
    title: z.string().trim().min(2).max(200),
    instructions: z.string().max(20000).optional(),
    quizType: z.enum(QUIZ_TYPES).default('GRADED'),
    // No `.default(70)` here — 004 LMS-wide Settings batch (FR-114):
    // `quiz.service.ts`'s `createQuiz` sources the fallback from
    // `LmsSettings.defaultQuizPassingScorePercent` (admin-configurable)
    // instead of a fixed value baked into the validator.
    passingScorePercent: z.number().int().min(0).max(100).optional(),
    maxAttempts: z.number().int().min(1).max(100).nullable().optional(),
    timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
    randomizeQuestions: z.boolean().default(false),
    randomizeAnswers: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(true),
  }),
});

export const updateQuizSchema = z.object({
  params: z.object({ quizId: uuid() }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      instructions: z.string().max(20000).nullable(),
      quizType: z.enum(QUIZ_TYPES),
      passingScorePercent: z.number().int().min(0).max(100),
      maxAttempts: z.number().int().min(1).max(100).nullable(),
      timeLimitMinutes: z.number().int().min(1).max(600).nullable(),
      randomizeQuestions: z.boolean(),
      randomizeAnswers: z.boolean(),
      showCorrectAnswers: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const changeQuizStatusSchema = z.object({
  params: z.object({ quizId: uuid() }),
  body: z.object({ status: z.enum(QUIZ_STATUSES) }),
});

export const quizIdParamSchema = z.object({ params: z.object({ quizId: uuid() }) });
export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });

// ============================================================================
// Admin: Question + Options
// ============================================================================

const optionInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isCorrect: z.boolean().default(false),
});

const createQuestionBody = z
  .object({
    type: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(1).max(5000),
    explanation: z.string().max(5000).optional(),
    points: z.number().int().min(1).max(1000).default(1),
    /** Choice types (SINGLE_CHOICE/MULTIPLE_CHOICE/TRUE_FALSE) only. */
    options: z.array(optionInputSchema).max(20).optional(),
    /** Non-choice types only: `{acceptedAnswers}` for SHORT_ANSWER/FILL_BLANK, `{correctValue, tolerance}` for NUMERIC. */
    answerKey: z.record(z.unknown()).optional(),
  })
  .superRefine((body, ctx) => {
    if (CHOICE_TYPES.has(body.type)) {
      if (!body.options || body.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Choice questions require at least 2 options' });
        return;
      }
      if (!body.options.some((o) => o.isCorrect)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'At least one option must be marked correct' });
      }
      if (body.type === 'SINGLE_CHOICE' || body.type === 'TRUE_FALSE') {
        if (body.options.filter((o) => o.isCorrect).length !== 1) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Exactly one option must be correct for this question type' });
        }
      }
    } else if (body.type === 'NUMERIC') {
      const key = body.answerKey as { correctValue?: unknown; tolerance?: unknown } | undefined;
      if (typeof key?.correctValue !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answerKey', 'correctValue'], message: 'NUMERIC questions require answerKey.correctValue' });
      }
    } else {
      const key = body.answerKey as { acceptedAnswers?: unknown } | undefined;
      if (!Array.isArray(key?.acceptedAnswers) || key.acceptedAnswers.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answerKey', 'acceptedAnswers'], message: 'This question type requires a non-empty answerKey.acceptedAnswers list' });
      }
    }
  });

export const createQuestionSchema = z.object({
  params: z.object({ quizId: uuid() }),
  body: createQuestionBody,
});

export const updateQuestionSchema = z.object({
  params: z.object({ questionId: uuid() }),
  body: z.object({
    prompt: z.string().trim().min(1).max(5000).optional(),
    explanation: z.string().max(5000).nullable().optional(),
    points: z.number().int().min(1).max(1000).optional(),
    status: z.enum(QUESTION_STATUSES).optional(),
    options: z.array(optionInputSchema).max(20).optional(),
    answerKey: z.record(z.unknown()).optional(),
  }),
});

export const questionIdParamSchema = z.object({ params: z.object({ questionId: uuid() }) });

export const reorderQuestionsSchema = z.object({
  params: z.object({ quizId: uuid() }),
  body: z.object({ orderedIds: z.array(uuid()).min(1) }),
});

// ============================================================================
// Learner-facing quiz attempts
// ============================================================================

export const attemptIdParamSchema = z.object({ params: z.object({ attemptId: uuid() }) });

export const submitAnswerSchema = z.object({
  params: z.object({ attemptId: uuid(), questionId: uuid() }),
  body: z
    .object({
      selectedOptionIds: z.array(uuid()).max(20).optional(),
      answerText: z.string().max(2000).optional(),
    })
    .refine((b) => b.selectedOptionIds !== undefined || b.answerText !== undefined, {
      message: 'Provide either selectedOptionIds or answerText',
    }),
});
