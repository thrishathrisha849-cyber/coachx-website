import { useEffect, useState } from 'react';
import {
  markFeedbackViewed,
  replyToFeedback,
  requestClarification,
  getMyFeedbackMessages,
  type SubmissionResult,
  type SubmissionFeedbackMessage,
} from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 004 Assignment Feedback Interaction batch (FR-078, T067) — "learners
 * MUST be able to mark feedback as viewed, reply, resubmit, and request
 * clarification." Resubmit is handled elsewhere (`AssignmentPage.tsx`'s
 * "Start new attempt" button, already existing). This panel covers the
 * other three, plus renders the resulting conversation thread.
 */
export function SubmissionFeedbackPanel({
  submission,
  onViewed,
}: {
  submission: SubmissionResult;
  onViewed: (updated: SubmissionResult) => void;
}) {
  const [messages, setMessages] = useState<SubmissionFeedbackMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [marking, setMarking] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState<'reply' | 'clarify' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    getMyFeedbackMessages(submission.id)
      .then((rows) => setMessages(rows))
      .catch(() => setMessages([]))
      .finally(() => setLoaded(true));
  }

  useEffect(load, [submission.id]);

  async function handleMarkViewed() {
    setMarking(true);
    setError(null);
    try {
      const updated = await markFeedbackViewed(submission.id);
      onViewed(updated);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not mark feedback as viewed.');
    } finally {
      setMarking(false);
    }
  }

  async function handleSend(kind: 'reply' | 'clarify') {
    if (!draft.trim()) return;
    setSending(kind);
    setError(null);
    try {
      if (kind === 'reply') await replyToFeedback(submission.id, draft.trim());
      else await requestClarification(submission.id, draft.trim());
      setDraft('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not send your message.');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Feedback</h2>
        {submission.feedbackViewedAt ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Viewed</span>
        ) : (
          <button
            type="button"
            onClick={handleMarkViewed}
            disabled={marking}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {marking ? 'Marking…' : 'Mark as viewed'}
          </button>
        )}
      </div>

      {loaded && messages.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-md border p-2.5 text-sm ${
                m.authorRole === 'INSTRUCTOR'
                  ? 'border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{m.authorRole === 'INSTRUCTOR' ? 'Instructor' : 'You'}</span>
                {m.type === 'CLARIFICATION_REQUEST' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Clarification requested
                  </span>
                )}
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{m.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Reply to this feedback, or ask for clarification…"
          aria-label="Feedback reply"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSend('reply')}
            disabled={!draft.trim() || sending !== null}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {sending === 'reply' ? 'Sending…' : 'Reply'}
          </button>
          <button
            type="button"
            onClick={() => handleSend('clarify')}
            disabled={!draft.trim() || sending !== null}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {sending === 'clarify' ? 'Sending…' : 'Request clarification'}
          </button>
        </div>
      </div>
    </div>
  );
}
