import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCertificates, type PublicCertificate } from '@/api/certificate.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

/** 004 US5 — "My Certificates" list, linked from the dashboard/course-complete flow. */
export function CertificatesPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [certificates, setCertificates] = useState<PublicCertificate[]>([]);

  useDocumentHead({ title: 'My Certificates | CoachX' });

  useEffect(() => {
    getMyCertificates()
      .then((c) => {
        setCertificates(c);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error') {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load your certificates. Please refresh the page.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Certificates</h1>

      {certificates.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          You haven't earned any certificates yet. Complete a course to earn one.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {certificates.map((cert) => (
            <li key={cert.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{cert.courseTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Issued {new Date(cert.issuedAt).toLocaleDateString()} · Credential {cert.credentialId}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      cert.status === 'VALID'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cert.status}
                  </span>
                  <Link to={`/certificates/${cert.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                    View →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
