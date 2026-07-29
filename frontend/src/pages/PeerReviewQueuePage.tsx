import { useEffect, useState } from 'react';
import { getPeerReviewQueue, claimPeerReview, submitPeerReview, type PeerReviewQueueItem } from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

interface ClaimedReview {
  peerReviewId: string;
  item: PeerReviewQueueItem;
  scores: Record<string, number>;
  comments: Record<string, string>;
  comment: string;
}

/**
 * 004 US9 Peer Review batch (FR-076) — a learner's self-select queue of
 * open submissions to peer-review. No automatic reviewer-matching exists
 * (see `peer-review.service.ts`'s doc comment) — a learner claims an open
 * slot themselves, then scores it against the same rubric the instructor
 * uses.
 */
export function PeerReviewQueuePage() {
  const [queue, setQueue] = useState<PeerReviewQueueItem[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [active, setActive] = useState<ClaimedReview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentHead({ title: 'Peer Review Queue | CoachX' });

  function load() {
    setStatus('loading');
    getPeerReviewQueue()
      .then((data) => {
        setQueue(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Could not load the peer-review queue.');
        setStatus('error');
      });
  }

  useEffect(load, []);

  async function handleClaim(item: PeerReviewQueueItem) {
    setClaiming(item.submissionId);
    setError(null);
    try {
      const claim = await claimPeerReview(item.submissionId);
      setActive({ peerReviewId: claim.id, item, scores: {}, comments: {}, comment: '' });
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not claim this submission for review.');
      load();
    } finally {
      setClaiming(null);
    }
  }

  async function handleSubmitReview() {
    if (!active) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPeerReview(active.peerReviewId, {
        criterionScores: active.item.criteria.map((c) => ({
          criterionId: c.id,
          pointsAwarded: active.scores[c.id] ?? 0,
          comment: active.comments[c.id] || undefined,
        })),
        comment: active.comment || undefined,
      });
      setActive(null);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit this review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reviewing: {active.item.assignmentTitle}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{active.item.courseTitle}</p>

        <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          {active.item.textBody && <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{active.item.textBody}</p>}
          {active.item.linkUrl && (
            <a href={active.item.linkUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-sm text-brand-600 hover:text-brand-700">
              {active.item.linkUrl}
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {active.item.criteria.map((c) => (
            <div key={c.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">{c.title}</span>
                <span className="text-xs text-slate-400">max {c.maxPoints}</span>
              </div>
              {c.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.description}</p>}
              <input
                type="number"
                min={0}
                max={c.maxPoints}
                value={active.scores[c.id] ?? ''}
                onChange={(e) =>
                  setActive({ ...active, scores: { ...active.scores, [c.id]: Math.min(c.maxPoints, Math.max(0, Number(e.target.value))) } })
                }
                className="mt-2 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <textarea
                value={active.comments[c.id] ?? ''}
                onChange={(e) => setActive({ ...active, comments: { ...active.comments, [c.id]: e.target.value } })}
                placeholder="Comment (optional)"
                rows={2}
                className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          ))}

          <textarea
            value={active.comment}
            onChange={(e) => setActive({ ...active, comment: e.target.value })}
            placeholder="Overall comment (optional)"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Peer Review Queue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Submissions from other learners, open for you to review. You're only shown assignments you've submitted your own work for.
      </p>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Couldn't load the peer-review queue.</p>}

      {status === 'ready' && queue.length === 0 && <p className="mt-6 text-sm text-slate-400">No open submissions to review right now.</p>}

      {status === 'ready' && queue.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {queue.map((item) => (
            <li key={item.submissionId} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{item.assignmentTitle}</span>
                  <p className="text-xs text-slate-400">{item.courseTitle}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.slotsRemaining} slot{item.slotsRemaining === 1 ? '' : 's'} open
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleClaim(item)}
                disabled={claiming === item.submissionId}
                className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {claiming === item.submissionId ? 'Claiming…' : 'Review this submission'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
