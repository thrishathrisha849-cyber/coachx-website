import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  listQuestionBankItems,
  createQuestionBankItem,
  updateQuestionBankItem,
  archiveQuestionBankItem,
  QUESTION_BANK_DIFFICULTIES,
  QUESTION_BANK_REVIEW_STATUSES,
  type AdminQuestionBankItem,
  type QuestionBankDifficulty,
  type QuestionBankReviewStatus,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'NUMERIC'];
const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']);

const REVIEW_STATUS_STYLE: Record<QuestionBankReviewStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  ARCHIVED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
};

/**
 * 004 Question Bank batch (T107, FR-064) — reusable, course-scoped question
 * templates tagged by category/difficulty/learning objective/tags/language,
 * with a review workflow (DRAFT → APPROVED → ARCHIVED). Only APPROVED +
 * PUBLISHED items are eligible for `generateQuestionsFromBank` (see the
 * "Generate questions from bank" action on QuizEditorPage).
 */
export function QuestionBankPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [items, setItems] = useState<AdminQuestionBankItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionBankDifficulty | ''>('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<QuestionBankReviewStatus | ''>('');

  function load() {
    setStatus('loading');
    listQuestionBankItems(courseId, {
      category: categoryFilter.trim() || undefined,
      difficulty: difficultyFilter || undefined,
      reviewStatus: reviewStatusFilter || undefined,
    })
      .then((rows) => {
        setItems(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load the question bank.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [courseId, categoryFilter, difficultyFilter, reviewStatusFilter]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Question bank</h1>
          <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          + New bank item
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Category
          <input value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Any" className="mt-1 block w-36 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Difficulty
          <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as QuestionBankDifficulty | '')} className="mt-1 block w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any</option>
            {QUESTION_BANK_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Review status
          <select value={reviewStatusFilter} onChange={(e) => setReviewStatusFilter(e.target.value as QuestionBankReviewStatus | '')} className="mt-1 block w-36 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
            <option value="">Any</option>
            {QUESTION_BANK_REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {showCreate && <BankItemForm courseId={courseId} onSaved={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Couldn't load the question bank.</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <BankItemRow key={item.id} item={item} courseId={courseId} onChanged={load} />
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400">No question bank items match these filters.</p>}
        </ul>
      )}
    </div>
  );
}

function BankItemRow({ item, courseId, onChanged }: { item: AdminQuestionBankItem; courseId: string; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);

  async function handleArchive() {
    try {
      await archiveQuestionBankItem(item.id);
      onChanged();
    } catch {
      // surfaced via the list reload's own error state on next load
    }
  }

  if (editing) {
    return <BankItemForm courseId={courseId} existing={item} onSaved={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <li className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-900 dark:text-white">{item.prompt}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${REVIEW_STATUS_STYLE[item.reviewStatus]}`}>{item.reviewStatus}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {item.type} · {item.difficulty} · {item.category || 'Uncategorized'} · v{item.version} · used {item.usageCount}x · {item.status}
        {item.tags.length > 0 && ` · ${item.tags.join(', ')}`}
      </p>
      {item.options.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
          {item.options.map((o) => (
            <li key={o.id}>{o.isCorrect ? '✓' : '·'} {o.text}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-3 text-xs font-medium">
        <button onClick={() => setEditing(true)} className="text-brand-600 hover:text-brand-700">Edit</button>
        {item.status !== 'ARCHIVED' && (
          <button onClick={handleArchive} className="text-red-600 hover:text-red-700 dark:text-red-400">Archive</button>
        )}
      </div>
    </li>
  );
}

function BankItemForm({
  courseId,
  existing,
  onSaved,
  onCancel,
}: {
  courseId: string;
  existing?: AdminQuestionBankItem;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState(existing?.type ?? 'SINGLE_CHOICE');
  const [prompt, setPrompt] = useState(existing?.prompt ?? '');
  const [explanation, setExplanation] = useState(existing?.explanation ?? '');
  const [points, setPoints] = useState(existing?.points ?? 1);
  const [category, setCategory] = useState(existing?.category ?? '');
  const [difficulty, setDifficulty] = useState<QuestionBankDifficulty>(existing?.difficulty ?? 'MEDIUM');
  const [learningObjective, setLearningObjective] = useState(existing?.learningObjective ?? '');
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [reviewStatus, setReviewStatus] = useState<QuestionBankReviewStatus>(existing?.reviewStatus ?? 'DRAFT');
  const [options, setOptions] = useState(
    existing?.options.length ? existing.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        type,
        prompt: prompt.trim(),
        explanation: explanation.trim() || undefined,
        points,
        category: category.trim() || undefined,
        difficulty,
        learningObjective: learningObjective.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        reviewStatus,
        options: CHOICE_TYPES.has(type) ? options.filter((o) => o.text.trim()) : undefined,
      };
      if (existing) {
        await updateQuestionBankItem(existing.id, input);
      } else {
        await createQuestionBankItem(courseId, input);
      }
      onSaved();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save this bank item.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{existing ? 'Edit bank item' : 'New bank item'}</h3>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} placeholder="Points" className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionBankDifficulty)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {QUESTION_BANK_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as QuestionBankReviewStatus)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {QUESTION_BANK_REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Question prompt" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation (optional)" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <div className="flex flex-wrap gap-3">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={learningObjective} onChange={(e) => setLearningObjective(e.target.value)} placeholder="Learning objective" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma-separated" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>

        {CHOICE_TYPES.has(type) && (
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                  name="bank-correct-option"
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={submitting || !prompt.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {submitting ? 'Saving…' : existing ? 'Save changes' : 'Create'}
          </button>
          <button onClick={onCancel} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
