import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAssignmentOverview,
  startOrResumeSubmission,
  getMySubmissions,
  saveDraft,
  submitSubmission,
  submitSelfAssessment,
  getMyPeerReviewsReceived,
  type PublicAssignmentWithRubric,
  type SubmissionResult,
  type PeerReviewForSubmitter,
} from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { SubmissionFeedbackPanel } from '@/components/lms/SubmissionFeedbackPanel';

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
  const [assignment, setAssignment] = useState<PublicAssignmentWithRubric | null>(null);
  const [current, setCurrent] = useState<SubmissionResult | null>(null);
  const [history, setHistory] = useState<SubmissionResult[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReviewForSubmitter[]>([]);
  const [textBody, setTextBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declaredOriginal, setDeclaredOriginal] = useState(false);
  // 004 Broader Assessment Types batch (FR-068) — SELF_ASSESSMENT/SKILL_RATING's own rating state.
  const [selfScores, setSelfScores] = useState<Record<string, number>>({});
  const [selfAssessing, setSelfAssessing] = useState(false);

  useDocumentHead({ title: 'Assignment | CoachX' });

  const load = useCallback(async () => {
    try {
      const assignmentOverview = await getAssignmentOverview(assignmentId);
      setAssignment(assignmentOverview);
      const submission = await startOrResumeSubmission(assignmentId);
      setCurrent(submission);
      setTextBody(submission.textBody ?? '');
      setLinkUrl(submission.linkUrl ?? '');
      const submissionHistory = await getMySubmissions(assignmentId);
      setHistory(submissionHistory);
      if (submission.status !== 'DRAFT') {
        setPeerReviews(await getMyPeerReviewsReceived(submission.id));
      }
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
    if (!current || !declaredOriginal) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveDraft(current.id, { textBody, linkUrl: linkUrl || undefined });
      await submitSubmission(current.id, true);
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

  // 004 Broader Assessment Types batch (FR-068) — SELF_ASSESSMENT/SKILL_RATING's own submit+outcome action.
  const handleSelfAssess = async () => {
    if (!current || !assignment) return;
    setSelfAssessing(true);
    setError(null);
    try {
      const scored = assignment.rubricCriteria.map((c) => ({ criterionId: c.id, pointsAwarded: selfScores[c.id] ?? 0 }));
      await submitSelfAssessment(current.id, scored);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit your self-assessment.');
    } finally {
      setSelfAssessing(false);
    }
  };

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !current) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this assignment. Please refresh the page.</p>;
  }

  const isSelfScoredType = assignment?.assessmentType === 'SELF_ASSESSMENT' || assignment?.assessmentType === 'SKILL_RATING';
  const ASSESSMENT_TYPE_LABEL: Record<string, string> = {
    SELF_ASSESSMENT: 'Self-Assessment',
    SKILL_RATING: 'Skill Rating',
    SCENARIO_TASK: 'Scenario Task',
    PORTFOLIO_REVIEW: 'Portfolio Review',
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {assignment && ASSESSMENT_TYPE_LABEL[assignment.assessmentType] ? `${ASSESSMENT_TYPE_LABEL[assignment.assessmentType]} — ` : ''}
          Attempt {current.attemptNumber}
        </h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {STATUS_LABEL[current.status] ?? current.status}
        </span>
      </div>

      {current.isLate && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          This submission was flagged as late.
        </p>
      )}

      {current.status === 'DRAFT' && isSelfScoredType && assignment && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Rate yourself against each criterion below — this is your own assessment, not an instructor review.</p>
          {assignment.rubricCriteria.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label htmlFor={`self-score-${c.id}`} className="text-sm font-medium text-slate-900 dark:text-white">
                  {c.title}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id={`self-score-${c.id}`}
                    type="number"
                    min={0}
                    max={c.maxPoints}
                    value={selfScores[c.id] ?? 0}
                    onChange={(e) => setSelfScores((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <span className="text-xs text-slate-400">/ {c.maxPoints}</span>
                </div>
              </div>
              {c.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.description}</p>}
            </div>
          ))}
          {assignment.rubricCriteria.length === 0 && <p className="text-sm text-slate-400">No rating criteria have been set up for this assessment yet.</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleSelfAssess}
            disabled={selfAssessing || assignment.rubricCriteria.length === 0}
            className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {selfAssessing ? 'Submitting…' : 'Submit self-assessment'}
          </button>
        </div>
      )}

      {current.status === 'DRAFT' && !isSelfScoredType && (
        <div className="flex flex-col gap-3">
          <textarea
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            rows={6}
            placeholder="Write your response…"
            aria-label="Assignment response"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link to your work (optional, e.g. a shared drive URL)"
            aria-label="Link to your work"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={declaredOriginal}
              onChange={(e) => setDeclaredOriginal(e.target.checked)}
              className="mt-0.5"
            />
            <span>I confirm this submission is my own original work.</span>
          </label>
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
              disabled={submitting || !declaredOriginal || (!textBody.trim() && !linkUrl.trim())}
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
            {current.outcomeLevel && ` · Level: ${current.outcomeLevel}`}
          </p>
          {current.isSelfAssessed && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This outcome is your own self-assessment.</p>}
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

      {(current.status === 'APPROVED' || current.status === 'REJECTED' || current.status === 'CHANGES_REQUESTED') && current.learnerFeedback && (
        <SubmissionFeedbackPanel submission={current} onViewed={setCurrent} />
      )}

      {peerReviews.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Peer reviews received</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {peerReviews.map((r) => (
              <li key={r.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{r.reviewerDisplayName ?? 'Anonymous peer'}</span>
                  {r.totalScore !== null && <span className="text-slate-500 dark:text-slate-400">Score: {r.totalScore}</span>}
                </div>
                {r.comment && <p className="mt-1 text-slate-600 dark:text-slate-300">{r.comment}</p>}
              </li>
            ))}
          </ul>
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
