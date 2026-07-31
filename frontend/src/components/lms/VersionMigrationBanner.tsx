import { useEffect, useState } from 'react';
import { getMyEnrollments, getMyVersionMigrationStatus, migrateMyVersion, type VersionMigrationStatus } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 004 Course Versioning Policy batch (FR-099) — surfaces "a new version is
 * available" only when there genuinely is one AND the version's own policy
 * actually offers a migration (CONTINUE_CURRENT_VERSION shows nothing —
 * there's nothing for the learner to do). MANDATORY_MIGRATION is already
 * applied automatically at read time (`getCourseProgressForLearner`); this
 * banner lets a learner under either policy migrate voluntarily/early.
 */
export function VersionMigrationBanner({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState<VersionMigrationStatus | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyEnrollments()
      .then((enrollments) => {
        const mine = enrollments.find((e) => e.courseId === courseId);
        if (!mine) return;
        setEnrollmentId(mine.id);
        return getMyVersionMigrationStatus(mine.id).then(setStatus);
      })
      .catch(() => undefined);
  }, [courseId]);

  async function handleMigrate() {
    if (!enrollmentId) return;
    setMigrating(true);
    setError(null);
    try {
      await migrateMyVersion(enrollmentId);
      const updated = await getMyVersionMigrationStatus(enrollmentId);
      setStatus(updated);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not migrate your progress.');
    } finally {
      setMigrating(false);
    }
  }

  if (!status?.migrationAvailable) return null;

  return (
    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
      <p className="font-medium">An updated version of this course is available.</p>
      {status.changeSummary && <p className="mt-1">{status.changeSummary}</p>}
      {error && <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleMigrate}
        disabled={migrating}
        className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {migrating ? 'Updating…' : 'Switch to the updated version (resets my progress)'}
      </button>
    </div>
  );
}
