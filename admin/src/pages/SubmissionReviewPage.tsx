import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignment } from '@/api/assignment.api';
import { getSubmission, reviewSubmission, moderatePeerReview, type AdminSubmissionDetail } from '@/api/assignment.api';
import type { AdminRubricCriterion } from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 US4 FR-074 — instructor assignment review screen: submission content, rubric scoring per criterion, a private reviewer note, learner-facing feedback, and the approve/request-changes/reject decision. */
export function SubmissionReviewPage() {
  const { submissionId = '' } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<AdminSubmissionDetail | null>(null);
  const [criteria, setCriteria] = useState<AdminRubricCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, { pointsAwarded: number; comment: string }>>({});
  const [reviewerNote, setReviewerNote] = useState('');
  const [learnerFeedback, setLearnerFeedback] = useState('');
  const [peerReviewReasons, setPeerReviewReasons] = useState<Record<string, string>>({});
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    getSubmission(submissionId)
      .then(async (s) => {
        setSubmission(s);
        const assignment = await getAssignment(s.assignmentId);
        setCriteria(assignment.rubricCriteria);
        const initialScores: Record<string, { pointsAwarded: number; comment: string }> = {};
        for (const existing of s.criterionScores) {
          initialScores[existing.criterionId] = { pointsAwarded: existing.pointsAwarded, comment: existing.comment ?? '' };
        }
        setScores(initialScores);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [submissionId]);

  async function handleModeratePeerReview(peerReviewId: string, action: 'HIDE' | 'RESTORE') {
    await moderatePeerReview(peerReviewId, action, action === 'HIDE' ? peerReviewReasons[peerReviewId] : undefined);
    load();
  }

  async function handleDecision(decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') {
    setSubmitting(true);
    setError(null);
    try {
      await reviewSubmission(submissionId, {
        decision,
        criterionScores: Object.entries(scores).map(([criterionId, v]) => ({ criterionId, pointsAwarded: v.pointsAwarded, comment: v.comment || undefined })),
        reviewerNote: reviewerNote || undefined,
        learnerFeedback: learnerFeedback || undefined,
      });
      navigate(-1);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !submission) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this submission.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
        Review — {submission.learnerDisplayName ?? submission.learnerUserId} (Attempt {submission.attemptNumber})
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Status: {submission.status} {submission.isLate && '· Late'}
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        {submission.textBody && <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{submission.textBody}</p>}
        {submission.linkUrl && (
          <a href={submission.linkUrl} target="_blank" rel="noreferrer noopener" className="text-sm text-brand-600 hover:text-brand-700">
            {submission.linkUrl}
          </a>
        )}
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rubric</h2>
      <div className="mt-3 flex flex-col gap-3">
        {criteria.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{c.title}</p>
              <input
                type="number"
                min={0}
                max={c.maxPoints}
                value={scores[c.id]?.pointsAwarded ?? 0}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [c.id]: { pointsAwarded: Number(e.target.value), comment: prev[c.id]?.comment ?? '' } }))
                }
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <span className="text-xs text-slate-400">/ {c.maxPoints}</span>
            </div>
            {c.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.description}</p>}
            <input
              value={scores[c.id]?.comment ?? ''}
              onChange={(e) => setScores((prev) => ({ ...prev, [c.id]: { pointsAwarded: prev[c.id]?.pointsAwarded ?? 0, comment: e.target.value } }))}
              placeholder="Comment (optional)"
              className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        ))}
        {criteria.length === 0 && <p className="text-sm text-slate-400">No rubric criteria defined for this assignment.</p>}
      </div>

      {submission.peerReviews.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Peer reviews ({submission.peerReviews.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {submission.peerReviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {r.reviewerDisplayName ?? r.reviewerUserId}
                    {r.moderationStatus === 'HIDDEN' && <span className="ml-2 text-xs text-red-500">(hidden)</span>}
                  </span>
                  {r.totalScore !== null && <span className="text-xs text-slate-400">Score: {r.totalScore}</span>}
                </div>
                {r.comment && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                <ul className="mt-2 flex flex-col gap-1">
                  {r.criterionScores.map((cs) => (
                    <li key={cs.criterionId} className="text-xs text-slate-500 dark:text-slate-400">
                      {cs.criterionTitle}: {cs.pointsAwarded}/{cs.maxPoints}
                      {cs.comment && ` — ${cs.comment}`}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center gap-2">
                  {r.moderationStatus === 'VISIBLE' ? (
                    <>
                      <input
                        value={peerReviewReasons[r.id] ?? ''}
                        onChange={(e) => setPeerReviewReasons((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Reason for hiding (optional)"
                        className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button onClick={() => handleModeratePeerReview(r.id, 'HIDE')} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:border-red-400 dark:border-slate-700">
                        Hide
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleModeratePeerReview(r.id, 'RESTORE')} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <label className="mt-4 block text-sm">
        Private reviewer note (never shown to the learner)
        <textarea value={reviewerNote} onChange={(e) => setReviewerNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </label>
      <label className="mt-3 block text-sm">
        Learner-facing feedback
        <textarea value={learnerFeedback} onChange={(e) => setLearnerFeedback(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </label>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={() => handleDecision('APPROVE')} disabled={submitting} className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
          Approve
        </button>
        <button onClick={() => handleDecision('REQUEST_CHANGES')} disabled={submitting} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
          Request changes
        </button>
        <button onClick={() => handleDecision('REJECT')} disabled={submitting} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          Reject
        </button>
      </div>
    </div>
  );
}
