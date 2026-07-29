import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAttempt,
  saveAnswer,
  submitAttempt,
  type QuizAttemptWithQuestions,
  type QuizAttemptWithReview,
  type PublicQuestion,
} from '@/api/quiz.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';
type AnswerValue = { selectedOptionIds?: string[]; answerText?: string };

function isReview(attempt: QuizAttemptWithQuestions | QuizAttemptWithReview): attempt is QuizAttemptWithReview {
  return 'reviewVisible' in attempt;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** 004 US3 — the quiz-taking + result page. Renders question-answering UI while IN_PROGRESS, and a graded review once SUBMITTED/GRADED. Never computes a score client-side — always the server's own graded response. */
export function QuizAttemptPage() {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [attempt, setAttempt] = useState<QuizAttemptWithQuestions | QuizAttemptWithReview | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(new Set<string>());

  useDocumentHead({ title: 'Quiz | CoachX' });

  const load = useCallback(() => {
    getAttempt(attemptId)
      .then((result) => {
        setAttempt(result);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || !attempt.expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  const remainingMs = useMemo(() => {
    if (!attempt?.expiresAt) return null;
    return new Date(attempt.expiresAt).getTime() - now;
  }, [attempt, now]);

  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0 && attempt?.status === 'IN_PROGRESS') {
      load(); // the server auto-submits an expired attempt on the next read — refetch to show the graded result.
    }
  }, [remainingMs, attempt, load]);

  const handleAnswerChange = async (question: PublicQuestion, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    savingRef.current.add(question.id);
    try {
      await saveAnswer(attemptId, question.id, value);
    } catch {
      // Best-effort autosave — a dropped save is not user-facing here; the learner can re-select before submitting.
    } finally {
      savingRef.current.delete(question.id);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitAttempt(attemptId);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit this quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !attempt) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this quiz attempt. Please refresh the page.</p>;
  }

  if (isReview(attempt)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className={`rounded-lg border p-6 text-center ${attempt.passed ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'}`}>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{attempt.scorePercent}%</p>
          <p className={`mt-1 text-lg font-semibold ${attempt.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {attempt.passed ? 'Passed' : 'Not passed'}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {attempt.pointsEarned} / {attempt.pointsPossible} points · Attempt {attempt.attemptNumber}
          </p>
        </div>

        {attempt.reviewVisible && (
          <div className="mt-6 flex flex-col gap-4">
            {attempt.questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {i + 1}. {q.prompt}
                </p>
                <p className={`mt-2 text-sm ${q.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {q.isCorrect ? '✓ Correct' : '✗ Incorrect'} ({q.pointsAwarded ?? 0}/{q.points} pts)
                </p>
                {q.options.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {q.options.map((opt) => (
                      <li
                        key={opt.id}
                        className={
                          q.correctOptionIds.includes(opt.id)
                            ? 'font-medium text-green-700 dark:text-green-400'
                            : q.yourSelectedOptionIds.includes(opt.id)
                              ? 'font-medium text-red-700 dark:text-red-400'
                              : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {q.correctOptionIds.includes(opt.id) ? '✓ ' : q.yourSelectedOptionIds.includes(opt.id) ? '✗ ' : '　'}
                        {opt.text}
                      </li>
                    ))}
                  </ul>
                )}
                {q.yourAnswerText !== null && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your answer: {q.yourAnswerText}</p>}
                {q.explanation && <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">{q.explanation}</p>}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to lesson
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quiz — Attempt {attempt.attemptNumber}</h1>
        {remainingMs !== null && (
          <span className={`text-sm font-medium ${remainingMs < 60_000 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
            Time remaining: {formatRemaining(remainingMs)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {attempt.questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {i + 1}. {q.prompt} <span className="font-normal text-slate-400">({q.points} pt{q.points === 1 ? '' : 's'})</span>
            </p>

            {(q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') && (
              <div className="mt-3 flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name={q.id}
                      checked={(answers[q.id]?.selectedOptionIds ?? []).includes(opt.id)}
                      onChange={() => handleAnswerChange(q, { selectedOptionIds: [opt.id] })}
                      className="accent-brand-600"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="mt-3 flex flex-col gap-2">
                {q.options.map((opt) => {
                  const current = answers[q.id]?.selectedOptionIds ?? [];
                  const checked = current.includes(opt.id);
                  return (
                    <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          handleAnswerChange(q, { selectedOptionIds: checked ? current.filter((id) => id !== opt.id) : [...current, opt.id] })
                        }
                        className="accent-brand-600"
                      />
                      {opt.text}
                    </label>
                  );
                })}
              </div>
            )}

            {(q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') && (
              <input
                type="text"
                value={answers[q.id]?.answerText ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { answerText: e.target.value } }))}
                onBlur={(e) => handleAnswerChange(q, { answerText: e.target.value })}
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            )}

            {q.type === 'NUMERIC' && (
              <input
                type="number"
                value={answers[q.id]?.answerText ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { answerText: e.target.value } }))}
                onBlur={(e) => handleAnswerChange(q, { answerText: e.target.value })}
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit quiz'}
      </button>
    </div>
  );
}
