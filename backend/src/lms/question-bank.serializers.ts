import type { AdminQuestionBankItem, AdminQuestionBankItemOption } from './question-bank.types';

type OptionRow = { id: string; text: string; isCorrect: boolean; position: number };

type BankItemRow = {
  id: string;
  courseId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  category: string | null;
  difficulty: string;
  learningObjective: string | null;
  tags: string[];
  language: string;
  version: number;
  reviewStatus: string;
  usageCount: number;
  answerKey: unknown;
  status: string;
  options: OptionRow[];
  createdAt: Date;
  updatedAt: Date;
};

function toOption(row: OptionRow): AdminQuestionBankItemOption {
  return { id: row.id, text: row.text, isCorrect: row.isCorrect, position: row.position };
}

export function toAdminQuestionBankItem(row: BankItemRow): AdminQuestionBankItem {
  return {
    id: row.id,
    courseId: row.courseId,
    type: row.type,
    prompt: row.prompt,
    explanation: row.explanation,
    points: row.points,
    category: row.category,
    difficulty: row.difficulty as AdminQuestionBankItem['difficulty'],
    learningObjective: row.learningObjective,
    tags: row.tags,
    language: row.language,
    version: row.version,
    reviewStatus: row.reviewStatus as AdminQuestionBankItem['reviewStatus'],
    usageCount: row.usageCount,
    answerKey: row.answerKey,
    status: row.status,
    options: row.options.map(toOption),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
