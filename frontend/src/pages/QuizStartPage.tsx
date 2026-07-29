import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startOrResumeAttempt } from '@/api/quiz.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 US3 — starts a new attempt or resumes the existing IN_PROGRESS one, then redirects to the attempt page. Never renders questions itself (no client-side attempt state to guess at). */
export function QuizStartPage() {
  const { quizId = '' } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startOrResumeAttempt(quizId)
      .then((attempt) => navigate(`/quiz-attempts/${attempt.id}`, { replace: true }))
      .catch((err: NormalizedApiError) => {
        setError(err.message ?? 'Could not start this quiz.');
      });
  }, [quizId, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
      </div>
    );
  }

  return <p className="p-6 text-sm text-slate-500">Starting quiz…</p>;
}
