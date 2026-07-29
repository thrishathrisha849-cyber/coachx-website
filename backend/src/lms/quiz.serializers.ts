import type {
  AdminQuestion,
  AdminQuestionOption,
  AdminQuiz,
  AdminQuizWithQuestions,
  PublicQuestion,
  PublicQuestionOption,
  PublicQuiz,
} from './quiz.types';

type QuizRow = {
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
};

type OptionRow = { id: string; text: string; isCorrect: boolean; position: number };
type QuestionRow = {
  id: string;
  quizId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  position: number;
  answerKey: unknown;
  status: string;
  options: OptionRow[];
};

export function toAdminQuiz(row: QuizRow): AdminQuiz {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    instructions: row.instructions,
    quizType: row.quizType,
    passingScorePercent: row.passingScorePercent,
    maxAttempts: row.maxAttempts,
    timeLimitMinutes: row.timeLimitMinutes,
    randomizeQuestions: row.randomizeQuestions,
    randomizeAnswers: row.randomizeAnswers,
    showCorrectAnswers: row.showCorrectAnswers,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminQuestionOption(row: OptionRow): AdminQuestionOption {
  return { id: row.id, text: row.text, isCorrect: row.isCorrect, position: row.position };
}

export function toAdminQuestion(row: QuestionRow): AdminQuestion {
  return {
    id: row.id,
    quizId: row.quizId,
    type: row.type,
    prompt: row.prompt,
    explanation: row.explanation,
    points: row.points,
    position: row.position,
    answerKey: row.answerKey,
    status: row.status,
    options: row.options.map(toAdminQuestionOption),
  };
}

export function toAdminQuizWithQuestions(quiz: QuizRow, questions: QuestionRow[]): AdminQuizWithQuestions {
  return { ...toAdminQuiz(quiz), questions: questions.map(toAdminQuestion) };
}

export function toPublicQuiz(row: QuizRow, questionCount: number): PublicQuiz {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    instructions: row.instructions,
    quizType: row.quizType,
    passingScorePercent: row.passingScorePercent,
    maxAttempts: row.maxAttempts,
    timeLimitMinutes: row.timeLimitMinutes,
    questionCount,
  };
}

/** Learner-facing question shape while an attempt is IN_PROGRESS — never leaks `isCorrect`/`answerKey`. */
export function toPublicQuestion(row: QuestionRow): PublicQuestion {
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    points: row.points,
    position: row.position,
    options: row.options.map((o): PublicQuestionOption => ({ id: o.id, text: o.text, position: o.position })),
  };
}
