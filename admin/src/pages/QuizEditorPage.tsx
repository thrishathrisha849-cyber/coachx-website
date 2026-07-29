import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getQuiz,
  createQuiz,
  changeQuizStatus,
  createQuestion,
  archiveQuestion,
  type AdminQuizWithQuestions,
  type AdminQuestion,
} from '@/api/quiz.api';
import type { NormalizedApiError } from '@/api/client';

const QUIZ_TYPES = ['PRACTICE', 'GRADED', 'MODULE_QUIZ', 'FINAL_ASSESSMENT', 'CERTIFICATION_EXAM', 'DIAGNOSTIC'];
const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'NUMERIC'];
const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']);

/** 004 US3 Quiz System batch — create-quiz form (when no quizId yet) and the full settings + question editor (once a quiz exists). */
export function QuizEditorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = quizId === 'new';
  const lessonId = searchParams.get('lessonId') ?? '';

  if (isNew) return <CreateQuizForm lessonId={lessonId} onCreated={(id) => navigate(`/quizzes/${id}`, { replace: true })} />;
  return <QuizManager quizId={quizId!} />;
}

function CreateQuizForm({ lessonId, onCreated }: { lessonId: string; onCreated: (quizId: string) => void }) {
  const [title, setTitle] = useState('');
  const [quizType, setQuizType] = useState('GRADED');
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState<string>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const quiz = await createQuiz(lessonId, {
        title,
        quizType,
        passingScorePercent,
        maxAttempts: maxAttempts ? Number(maxAttempts) : null,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        randomizeQuestions: false,
        randomizeAnswers: false,
        showCorrectAnswers: true,
      });
      onCreated(quiz.id);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!lessonId) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">No lessonId provided — go back to the Quizzes page and pick a lesson.</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Create quiz</h1>
      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Quiz type
          <select value={quizType} onChange={(e) => setQuizType(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {QUIZ_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Passing score (%)
          <input type="number" value={passingScorePercent} onChange={(e) => setPassingScorePercent(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Max attempts (blank = unlimited)
          <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Time limit, minutes (blank = untimed)
          <input type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting || !title} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {submitting ? 'Creating…' : 'Create quiz'}
        </button>
      </div>
    </div>
  );
}

const VALID_TRANSITIONS: Record<string, string[]> = { DRAFT: ['PUBLISHED', 'ARCHIVED'], PUBLISHED: ['ARCHIVED', 'DRAFT'], ARCHIVED: ['DRAFT'] };

function QuizManager({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<AdminQuizWithQuestions | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  function load() {
    getQuiz(quizId)
      .then((q) => {
        setQuiz(q);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, [quizId]);

  async function handleStatusChange(newStatus: string) {
    try {
      await changeQuizStatus(quizId, newStatus);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not change status.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !quiz) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this quiz.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{quiz.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{quiz.status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {quiz.quizType} · Passing {quiz.passingScorePercent}% · {quiz.maxAttempts ?? 'Unlimited'} attempts · {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Untimed'}
      </p>

      <div className="mt-3 flex gap-2">
        {(VALID_TRANSITIONS[quiz.status] ?? []).map((next) => (
          <button key={next} onClick={() => handleStatusChange(next)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
            Move to {next}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Questions ({quiz.questions.length})</h2>
      <div className="mt-3 flex flex-col gap-3">
        {quiz.questions.map((q) => (
          <QuestionRow key={q.id} question={q} onChanged={load} />
        ))}
      </div>

      <AddQuestionForm quizId={quizId} onAdded={load} />
    </div>
  );
}

function QuestionRow({ question, onChanged }: { question: AdminQuestion; onChanged: () => void }) {
  async function handleArchive() {
    await archiveQuestion(question.id);
    onChanged();
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{question.prompt}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{question.type}</span>
          <span className="text-slate-400">{question.points} pt{question.points === 1 ? '' : 's'}</span>
          {question.status !== 'ARCHIVED' && (
            <button onClick={handleArchive} className="text-red-600 hover:text-red-700 dark:text-red-400">
              Archive
            </button>
          )}
        </div>
      </div>
      {question.options.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
          {question.options.map((o) => (
            <li key={o.id}>{o.isCorrect ? '✓' : '·'} {o.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddQuestionForm({ quizId, onAdded }: { quizId: string; onAdded: () => void }) {
  const [type, setType] = useState('SINGLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
  const [acceptedAnswers, setAcceptedAnswers] = useState('');
  const [correctValue, setCorrectValue] = useState('');
  const [tolerance, setTolerance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createQuestion(quizId, {
        type,
        prompt,
        points,
        explanation: explanation || undefined,
        options: CHOICE_TYPES.has(type) ? options.filter((o) => o.text.trim()) : undefined,
        answerKey: CHOICE_TYPES.has(type)
          ? undefined
          : type === 'NUMERIC'
            ? { correctValue: Number(correctValue), tolerance: Number(tolerance) }
            : { acceptedAnswers: acceptedAnswers.split(',').map((a) => a.trim()).filter(Boolean) },
      });
      setPrompt('');
      setExplanation('');
      setOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
      setAcceptedAnswers('');
      setCorrectValue('');
      onAdded();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not add question.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add question</h3>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} placeholder="Points" className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Question prompt" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation (shown after grading, optional)" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />

        {CHOICE_TYPES.has(type) && (
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                  name="correct-option"
                  checked={opt.isCorrect}
                  onChange={() =>
                    setOptions((prev) =>
                      prev.map((o, j) => (type === 'MULTIPLE_CHOICE' ? (j === i ? { ...o, isCorrect: !o.isCorrect } : o) : { ...o, isCorrect: j === i })),
                    )
                  }
                />
                <input
                  value={opt.text}
                  onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)))}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            ))}
            <button type="button" onClick={() => setOptions((prev) => [...prev, { text: '', isCorrect: false }])} className="self-start text-xs font-medium text-brand-600 hover:text-brand-700">
              + Add option
            </button>
          </div>
        )}

        {type === 'NUMERIC' && (
          <div className="flex gap-3">
            <input value={correctValue} onChange={(e) => setCorrectValue(e.target.value)} placeholder="Correct value" type="number" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <input value={tolerance} onChange={(e) => setTolerance(e.target.value)} placeholder="Tolerance" type="number" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
        )}

        {(type === 'SHORT_ANSWER' || type === 'FILL_BLANK') && (
          <input value={acceptedAnswers} onChange={(e) => setAcceptedAnswers(e.target.value)} placeholder="Accepted answers, comma-separated" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting || !prompt} className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {submitting ? 'Adding…' : 'Add question'}
        </button>
      </div>
    </div>
  );
}
