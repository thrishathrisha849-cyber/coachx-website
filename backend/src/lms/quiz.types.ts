/** 004 US3 Quiz System — DTO shapes. Mirrors lesson.types.ts's public/admin split. */

export interface PublicQuestionOption {
  id: string;
  text: string;
  position: number;
}

/** Learner-facing question — never includes `isCorrect`/`answerKey` before an attempt is graded. */
export interface PublicQuestion {
  id: string;
  type: string;
  prompt: string;
  points: number;
  position: number;
  options: PublicQuestionOption[];
}

/** Shown only once the attempt is graded and `quiz.showCorrectAnswers` is true. */
export interface GradedQuestionReview extends PublicQuestion {
  explanation: string | null;
  correctOptionIds: string[];
  yourSelectedOptionIds: string[];
  yourAnswerText: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface PublicQuiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  questionCount: number;
}

export interface AdminQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface AdminQuestion {
  id: string;
  quizId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  position: number;
  answerKey: unknown;
  status: string;
  options: AdminQuestionOption[];
}

export interface AdminQuiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminQuizWithQuestions extends AdminQuiz {
  questions: AdminQuestion[];
}

export interface QuizAttemptResult {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: string;
  startedAt: Date;
  expiresAt: Date | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  pointsPossible: number | null;
  pointsEarned: number | null;
  scorePercent: number | null;
  passed: boolean | null;
}

export interface QuizAttemptWithQuestions extends QuizAttemptResult {
  questions: PublicQuestion[];
}

export interface QuizAttemptWithReview extends QuizAttemptResult {
  reviewVisible: boolean;
  questions: GradedQuestionReview[];
}
