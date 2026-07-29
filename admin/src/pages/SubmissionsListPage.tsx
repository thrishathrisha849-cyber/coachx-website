import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listSubmissionsForReview, type AdminSubmissionSummary } from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_FILTERS = ['', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'];

/** 004 US4 — instructor-facing submission list for one assignment (FR-074's entry point). */
export function SubmissionsListPage() {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<AdminSubmissionSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadState('loading');
    listSubmissionsForReview(assignmentId, statusFilter || undefined)
      .then((rows) => {
        setSubmissions(rows);
        setLoadState('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load submissions.');
        setLoadState('error');
      });
  }, [assignmentId, statusFilter]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Submissions</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
        {STATUS_FILTERS.map((s) => (
          <option key={s} value={s}>{s || 'All statuses'}</option>
        ))}
      </select>

      {loadState === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loadState === 'ready' && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-2">Learner</th>
              <th className="pb-2">Attempt</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Score</th>
              <th className="pb-2">Late</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{s.learnerDisplayName ?? s.learnerUserId}</td>
                <td className="py-2 text-slate-500">{s.attemptNumber}</td>
                <td className="py-2">{s.status}</td>
                <td className="py-2">{s.score ?? '—'}</td>
                <td className="py-2">{s.isLate ? 'Yes' : 'No'}</td>
                <td className="py-2">
                  <button onClick={() => navigate(`/submissions/${s.id}/review`)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-slate-400">No submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
