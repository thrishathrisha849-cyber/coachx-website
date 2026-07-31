import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseVersionsAdmin, type AdminCourseVersion } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const POLICY_LABEL: Record<AdminCourseVersion['existingLearnerPolicy'], string> = {
  CONTINUE_CURRENT_VERSION: 'Continue on current version',
  OPTIONAL_MIGRATION: 'Optional migration',
  MANDATORY_MIGRATION: 'Mandatory migration',
};

const POLICY_STYLE: Record<AdminCourseVersion['existingLearnerPolicy'], string> = {
  CONTINUE_CURRENT_VERSION: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  OPTIONAL_MIGRATION: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  MANDATORY_MIGRATION: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
};

/**
 * 004 Course Versioning Policy batch (FR-099) — read-only history of every
 * non-destructive snapshot taken each time a PUBLISHED course was edited,
 * plus this batch's own change-summary/effective-date/existing-learner-
 * policy fields for each one. The underlying `GET /admin/courses/:id/versions`
 * endpoint already existed (built in an earlier batch); this is the first
 * admin page that actually calls it.
 */
export function CourseVersionHistoryPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<AdminCourseVersion[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');
    getCourseVersionsAdmin(courseId)
      .then((rows) => {
        setVersions(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load version history.');
        setStatus('error');
      });
  }, [courseId]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Version history</h1>
      <p className="mt-1 text-xs text-slate-400">
        A new version is recorded automatically every time a Published course is edited. Course ID: {courseId}
      </p>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Couldn't load version history.</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">Version {v.versionNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${POLICY_STYLE[v.existingLearnerPolicy]}`}>
                  {POLICY_LABEL[v.existingLearnerPolicy]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Recorded {new Date(v.createdAt).toLocaleString()}
                {v.effectiveDate && ` · Effective ${new Date(v.effectiveDate).toLocaleString()}`}
              </p>
              {v.changeSummary && <p className="mt-2 text-slate-700 dark:text-slate-200">{v.changeSummary}</p>}
              {!v.changeSummary && <p className="mt-2 text-slate-400">No change summary recorded.</p>}
            </li>
          ))}
          {versions.length === 0 && <p className="text-sm text-slate-400">No version history yet — a version is recorded the first time this course is edited after being Published.</p>}
        </ul>
      )}
    </div>
  );
}
