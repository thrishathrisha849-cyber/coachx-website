import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  listEnrollmentsAdmin,
  createEnrollmentAdmin,
  suspendEnrollmentAdmin,
  reactivateEnrollmentAdmin,
  revokeEnrollmentAdmin,
  extendEnrollmentAccessAdmin,
  overrideCompleteAdmin,
  resetProgressAdmin,
  bulkImportEnrollmentsAdmin,
  type AdminEnrollmentFull,
  type BulkImportResult,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REVOKED'];

/** LMS Admin UI batch — per-course enrollment management (grant/suspend/reactivate/revoke/extend/override-complete/reset-progress), reusing the Phase 6 Part 2B admin enrollment API (T088-T103). */
export function CourseEnrollmentsPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [enrollments, setEnrollments] = useState<AdminEnrollmentFull[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [grantUserId, setGrantUserId] = useState('');
  const [granting, setGranting] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  function load() {
    setStatus('loading');
    listEnrollmentsAdmin({ courseId, status: statusFilter || undefined, pageSize: 100 })
      .then((res) => {
        setEnrollments(res.data);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load enrollments.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [courseId, statusFilter]);

  async function handleGrant() {
    if (!grantUserId.trim()) return;
    setGranting(true);
    setError(null);
    try {
      await createEnrollmentAdmin({ userId: grantUserId.trim(), courseId, source: 'ADMIN_GRANT' });
      setGrantUserId('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not grant enrollment.');
    } finally {
      setGranting(false);
    }
  }

  function reasonFor(id: string): string {
    return reasonDrafts[id] ?? '';
  }

  function setReason(id: string, value: string) {
    setReasonDrafts((prev) => ({ ...prev, [id]: value }));
  }

  async function runAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Enrollments</h1>
      <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>

      <div className="mt-4 flex items-end gap-2">
        <input value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} placeholder="User ID to enroll" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <button onClick={handleGrant} disabled={granting || !grantUserId.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {granting ? 'Granting…' : 'Grant enrollment'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button onClick={() => setStatusFilter('')} className={`rounded-md px-3 py-1 ${statusFilter === '' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1 ${statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
            {s}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <BulkImportSection courseId={courseId} onImported={load} />

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {enrollments.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{e.userDisplayName}</span>
                  <span className="ml-2 text-xs text-slate-400">{e.source}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{e.status}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={reasonFor(e.id)}
                  onChange={(ev) => setReason(e.id, ev.target.value)}
                  placeholder="Reason (required for most actions)"
                  className="w-64 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                {e.status === 'ACTIVE' && (
                  <button
                    disabled={busyId === e.id}
                    onClick={() => runAction(e.id, () => suspendEnrollmentAdmin(e.id, reasonFor(e.id)))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
                  >
                    Suspend
                  </button>
                )}
                {e.status === 'SUSPENDED' && (
                  <button
                    disabled={busyId === e.id}
                    onClick={() => runAction(e.id, () => reactivateEnrollmentAdmin(e.id, reasonFor(e.id) || undefined))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
                  >
                    Reactivate
                  </button>
                )}
                {e.status !== 'REVOKED' && (
                  <button
                    disabled={busyId === e.id}
                    onClick={() => runAction(e.id, () => revokeEnrollmentAdmin(e.id, reasonFor(e.id)))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:border-red-400 dark:border-slate-700"
                  >
                    Revoke
                  </button>
                )}
                <button
                  disabled={busyId === e.id}
                  onClick={() => runAction(e.id, () => extendEnrollmentAccessAdmin(e.id, null))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
                >
                  Clear access end date
                </button>
                <button
                  disabled={busyId === e.id}
                  onClick={() => runAction(e.id, () => overrideCompleteAdmin(e.id, 'COURSE', courseId, reasonFor(e.id)))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
                >
                  Mark course complete
                </button>
                <button
                  disabled={busyId === e.id}
                  onClick={() => runAction(e.id, () => resetProgressAdmin(e.id, 'COURSE', courseId, reasonFor(e.id)))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
                >
                  Reset progress
                </button>
              </div>
            </li>
          ))}
          {enrollments.length === 0 && <p className="text-sm text-slate-400">No enrollments found.</p>}
        </ul>
      )}
    </div>
  );
}

/**
 * 004 Bulk CSV Import batch (FR-032) — reads the chosen file locally
 * (`FileReader.readAsText()`) and posts its text content directly; no
 * file-upload/storage pipeline exists in this codebase. Required column:
 * `email`. Optional columns: `accessStartAt`, `accessEndAt` (ISO dates —
 * FR-032's "start date"/"deadline"), `reason`. Group-based selection is
 * out of scope — no Group/Cohort entity exists here.
 */
function BulkImportSection({ courseId, onImported }: { courseId: string; onImported: () => void }) {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvContent(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvContent.trim()) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await bulkImportEnrollmentsAdmin(courseId, csvContent);
      setResult(res);
      onImported();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not import the CSV file.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bulk import via CSV</h2>
      <p className="mt-1 text-xs text-slate-400">Required column: <code>email</code>. Optional: <code>accessStartAt</code>, <code>accessEndAt</code>, <code>reason</code>.</p>
      <div className="mt-3 flex items-center gap-2">
        <label className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200 cursor-pointer">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
        </label>
        {fileName && <span className="text-xs text-slate-500 dark:text-slate-400">{fileName}</span>}
        <button
          onClick={handleImport}
          disabled={importing || !csvContent.trim()}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {importing ? 'Importing…' : 'Import'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {result.totalRows} row{result.totalRows === 1 ? '' : 's'} — <span className="text-green-700 dark:text-green-400">{result.created} created</span>,{' '}
            <span className="text-amber-700 dark:text-amber-400">{result.duplicates} duplicate{result.duplicates === 1 ? '' : 's'}</span>,{' '}
            <span className="text-red-600 dark:text-red-400">{result.failed} failed</span>
          </p>
          {result.rows.filter((r) => r.status !== 'CREATED').length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {result.rows
                .filter((r) => r.status !== 'CREATED')
                .map((r) => (
                  <li key={r.row} className="text-xs text-slate-500 dark:text-slate-400">
                    Row {r.row} ({r.email || 'no email'}): <span className={r.status === 'ERROR' ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}>{r.status}</span>
                    {r.message && ` — ${r.message}`}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
