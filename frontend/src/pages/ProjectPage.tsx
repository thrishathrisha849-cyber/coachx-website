import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMyProjectStatus, type ProjectStatusForLearner } from '@/api/project.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Not submitted yet',
  SUBMITTED: 'Submitted — awaiting review',
  UNDER_REVIEW: 'Under review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXCUSED: 'Excused',
};

/**
 * 004 Project-based Learning batch (FR-077) — the learner's aggregate view
 * across every required artifact of a multi-artifact project. Each
 * artifact IS a full `Assignment` with its own existing submission/review
 * flow — this page is purely a status rollup + navigation hub into
 * `AssignmentPage.tsx` for each one, never a duplicate submission UI.
 */
export function ProjectPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProjectStatusForLearner | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: status ? `${status.title} | CoachX` : 'Project | CoachX' });

  useEffect(() => {
    setLoadState('loading');
    getMyProjectStatus(projectId)
      .then((s) => {
        setStatus(s);
        setLoadState('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? "Couldn't load this project.");
        setLoadState('error');
      });
  }, [projectId]);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !status) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error ?? "Couldn't load this project."}</p>;
  }

  const approvedCount = status.artifacts.filter((a) => a.approved).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{status.title}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status.allArtifactsApproved
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {status.allArtifactsApproved ? 'Project complete' : `${approvedCount}/${status.artifacts.length} artifacts approved`}
        </span>
      </div>
      {status.description && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{status.description}</p>}

      <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Required artifacts</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {status.artifacts.map((artifact, index) => (
          <li key={artifact.assignmentId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  artifact.approved ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {artifact.approved ? '✓' : index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{artifact.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{SUBMISSION_STATUS_LABEL[artifact.submissionStatus ?? ''] ?? 'Not submitted yet'}</p>
              </div>
            </div>
            <Link to={`/assignments/${artifact.assignmentId}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {artifact.submissionStatus ? 'Open' : 'Start'}
            </Link>
          </li>
        ))}
        {status.artifacts.length === 0 && <p className="text-sm text-slate-400">No required artifacts have been published for this project yet.</p>}
      </ul>

      <button type="button" onClick={() => navigate(-1)} className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to lesson
      </button>
    </div>
  );
}
