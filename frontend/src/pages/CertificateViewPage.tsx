import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMyCertificateById, type PublicCertificate } from '@/api/certificate.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * 004 US5 FR-083 — the certificate "download" deliverable. This codebase
 * has no PDF-generation library or file-storage pipeline, so the
 * certificate is a server-rendered, browser-printable view instead: the
 * learner uses the browser's native print-to-PDF, which produces a real
 * PDF file without inventing a fake download endpoint.
 */
export function CertificateViewPage() {
  const { certificateId = '' } = useParams<{ certificateId: string }>();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [certificate, setCertificate] = useState<PublicCertificate | null>(null);

  useDocumentHead({ title: certificate ? `Certificate — ${certificate.courseTitle} | CoachX` : 'Certificate | CoachX' });

  useEffect(() => {
    getMyCertificateById(certificateId)
      .then((c) => {
        setCertificate(c);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [certificateId]);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !certificate) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this certificate.</p>;
  }

  const verifyUrl = `${window.location.origin}/verify/${certificate.credentialId}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/certificates" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← My certificates
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Print / Save as PDF
        </button>
      </div>

      {certificate.status === 'REVOKED' && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 print:hidden dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          This certificate has been revoked and is no longer valid.
        </p>
      )}

      <div className="rounded-xl border-4 border-brand-600 bg-white p-12 text-center dark:bg-white">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Certificate of Completion</p>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">{certificate.learnerName}</h1>
        <p className="mt-4 text-slate-600">has successfully completed</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{certificate.courseTitle}</h2>
        <p className="mt-4 text-sm text-slate-500">
          Completed on {new Date(certificate.completionDate).toLocaleDateString()}
        </p>
        {certificate.instructorName && <p className="mt-1 text-sm text-slate-500">Instructor: {certificate.instructorName}</p>}

        <div className="mt-10 flex items-center justify-between text-xs text-slate-400">
          <span>Credential ID: {certificate.credentialId}</span>
          <span>Verify at: {verifyUrl}</span>
        </div>
      </div>
    </div>
  );
}
