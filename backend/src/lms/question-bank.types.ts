export interface AdminQuestionBankItemOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface AdminQuestionBankItem {
  id: string;
  courseId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  category: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  learningObjective: string | null;
  tags: string[];
  language: string;
  version: number;
  reviewStatus: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  usageCount: number;
  answerKey: unknown;
  status: string;
  options: AdminQuestionBankItemOption[];
  createdAt: Date;
  updatedAt: Date;
}

/** FR-064 "generate randomized quiz sets by question count, difficulty distribution, category distribution, and exclusion rules." */
export interface GenerateQuestionsFromBankInput {
  /** Total questions to draw when no `difficultyDistribution` is given. Ignored if `difficultyDistribution` is provided (its values sum to the total instead). */
  count?: number;
  /** e.g. `{ EASY: 3, MEDIUM: 5, HARD: 2 }` — exactly that many of each difficulty, or as many as are available (never fabricated). */
  difficultyDistribution?: Partial<Record<'EASY' | 'MEDIUM' | 'HARD', number>>;
  /** Restrict the candidate pool to one category. */
  category?: string;
  /** Bank item ids to never draw (e.g. already used in this quiz). */
  excludeIds?: string[];
}

export interface GenerateQuestionsFromBankResult {
  createdQuestionIds: string[];
  requested: number;
  drawn: number;
}
