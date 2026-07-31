import { z } from 'zod';
import { QUESTION_TYPES } from './quiz.validation';

const uuid = () => z.string().uuid();

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export const REVIEW_STATUSES = ['DRAFT', 'APPROVED', 'ARCHIVED'] as const;
export const BANK_ITEM_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const optionSchema = z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean() });

const bankItemBodyBase = z.object({
  type: z.enum(QUESTION_TYPES),
  prompt: z.string().trim().min(1).max(5000),
  explanation: z.string().max(5000).optional(),
  points: z.number().int().min(1).max(1000).optional(),
  category: z.string().trim().max(100).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  learningObjective: z.string().trim().max(300).optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  language: z.string().trim().max(10).optional(),
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  status: z.enum(BANK_ITEM_STATUSES).optional(),
  options: z.array(optionSchema).max(20).optional(),
  answerKey: z.record(z.unknown()).optional(),
});

export const createBankItemSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: bankItemBodyBase,
});

export const updateBankItemSchema = z.object({
  params: z.object({ itemId: uuid() }),
  body: bankItemBodyBase.partial().refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const bankItemIdParamSchema = z.object({ params: z.object({ itemId: uuid() }) });
export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });

export const listBankItemsQuerySchema = z.object({
  params: z.object({ courseId: uuid() }),
  query: z.object({
    category: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    reviewStatus: z.enum(REVIEW_STATUSES).optional(),
    status: z.enum(BANK_ITEM_STATUSES).optional(),
  }),
});

export const generateQuestionsFromBankSchema = z.object({
  params: z.object({ quizId: uuid() }),
  body: z
    .object({
      count: z.number().int().min(1).max(200).optional(),
      difficultyDistribution: z
        .object({
          EASY: z.number().int().min(0).max(200).optional(),
          MEDIUM: z.number().int().min(0).max(200).optional(),
          HARD: z.number().int().min(0).max(200).optional(),
        })
        .optional(),
      category: z.string().trim().max(100).optional(),
      excludeIds: z.array(uuid()).max(500).optional(),
    })
    .refine((body) => body.count !== undefined || body.difficultyDistribution !== undefined, {
      message: 'Either count or difficultyDistribution must be provided',
    }),
});
