import { useState } from 'react';
import { listCertificatesForCourse, revokeCertificate, type AdminCertificateSummary } from '@/api/certificate.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 US5 Certificate System batch — per-course issued-certificate list + revocation (FR-086). Revocation reuses `course.manageInstructors`, same tier as enrollment lifecycle admin actions. */
export function CourseCertificatesPage() {
  const [courseId, setCourseId] = useState('');
  const [certificates, setCertificates] = useState<AdminCertificateSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  async function handleLookup() {
    if (!courseId.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const rows = await listCertificatesForCourse(courseId.trim());
      setCertificates(rows);
      setStatus('ready');
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not find certificates for that course.');
      setStatus('error');
    }
  }

  async function handleRevoke(certificateId: string) {
    if (!revokeReason.trim()) return;
    try {
      await revokeCertificate(certificateId, revokeReason.trim());
      setRevokingId(null);
      setRevokeReason('');
      handleLookup();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not revoke this certificate.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Certificates</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">FR-086 — view issued certificates for a course and revoke if needed.</p>

      <div className="mt-6 flex gap-2">
        <input
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Course ID"
          className="w-96 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button onClick={handleLookup} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          Look up
        </button>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-2">
          {certificates.map((cert) => (
            <li key={cert.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{cert.learnerName}</span>
                  <span className="ml-2 text-xs text-slate-400">Credential {cert.credentialId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cert.status === 'VALID'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {cert.status}
                  </span>
                  {cert.status === 'VALID' && revokingId !== cert.id && (
                    <button onClick={() => setRevokingId(cert.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {revokingId === cert.id && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Reason for revocation (required)"
                    className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    onClick={() => handleRevoke(cert.id)}
                    disabled={!revokeReason.trim()}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Confirm revoke
                  </button>
                  <button onClick={() => setRevokingId(null)} className="text-sm text-slate-500 hover:text-slate-700">
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
          {certificates.length === 0 && <p className="text-sm text-slate-400">No certificates issued for this course yet.</p>}
        </ul>
      )}
    </div>
  );
}
