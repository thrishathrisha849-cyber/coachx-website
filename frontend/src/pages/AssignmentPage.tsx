import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  startOrResumeSubmission,
  getMySubmissions,
  saveDraft,
  submitSubmission,
  type SubmissionResult,
} from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted — awaiting review',
  UNDER_REVIEW: 'Under review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXCUSED: 'Excused',
};

/** 004 US4 — the assignment submission page. Renders a draft editor while DRAFT, a read-only "awaiting review" view once submitted, reviewer feedback once reviewed, and the full attempt history (resubmissions stay visible, never overwritten). */
export function AssignmentPage() {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [current, setCurrent] = useState<SubmissionResult | null>(null);
  const [history, setHistory] = useState<SubmissionResult[]>([]);
  const [textBody, setTextBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Assignment | CoachX' });

  const load = useCallback(async () => {
    try {
      const submission = await startOrResumeSubmission(assignmentId);
      setCurrent(submission);
      setTextBody(submission.textBody ?? '');
      setLinkUrl(submission.linkUrl ?? '');
      const submissionHistory = await getMySubmissions(assignmentId);
      setHistory(submissionHistory);
      setLoadState('ready');
    } catch (err) {
      const apiError = err as NormalizedApiError;
      if (apiError.status === 409) {
        setError(apiError.message ?? 'Could not start a new attempt.');
        setLoadState('ready');
      } else {
        setLoadState('error');
      }
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveDraft = async () => {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await saveDraft(current.id, { textBody, linkUrl: linkUrl || undefined });
      setCurrent(updated);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveDraft(current.id, { textBody, linkUrl: linkUrl || undefined });
      await submitSubmission(current.id);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAttempt = async () => {
    setError(null);
    try {
      await startOrResumeSubmission(assignmentId);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not start a new attempt.');
    }
  };

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !current) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this assignment. Please refresh the page.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Assignment — Attempt {current.attemptNumber}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {STATUS_LABEL[current.status] ?? current.status}
        </span>
      </div>

      {current.isLate && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          This submission was flagged as late.
        </p>
      )}

      {current.status === 'DRAFT' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            rows={6}
            placeholder="Write your response…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link to your work (optional, e.g. a shared drive URL)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (!textBody.trim() && !linkUrl.trim())}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {current.status !== 'DRAFT' && (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          {current.textBody && <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{current.textBody}</p>}
          {current.linkUrl && (
            <a href={current.linkUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-sm text-brand-600 hover:text-brand-700">
              {current.linkUrl}
            </a>
          )}
        </div>
      )}

      {(current.status === 'APPROVED' || current.status === 'REJECTED') && (
        <div className={`mt-4 rounded-lg border p-4 ${current.status === 'APPROVED' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'}`}>
          <p className="font-semibold text-slate-900 dark:text-white">
            {current.status === 'APPROVED' ? 'Approved' : 'Rejected'} — Score: {current.score ?? '—'}
          </p>
          {current.learnerFeedback && <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{current.learnerFeedback}</p>}
        </div>
      )}

      {current.status === 'CHANGES_REQUESTED' && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Changes requested</p>
          {current.learnerFeedback && <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">{current.learnerFeedback}</p>}
          <button type="button" onClick={handleNewAttempt} className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Start new attempt
          </button>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Previous attempts</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {history
              .filter((h) => h.id !== current.id)
              .map((h) => (
                <li key={h.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Attempt {h.attemptNumber}</span> —{' '}
                  <span className="text-slate-500 dark:text-slate-400">{STATUS_LABEL[h.status] ?? h.status}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={() => navigate(-1)} className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to lesson
      </button>
    </div>
  );
}
