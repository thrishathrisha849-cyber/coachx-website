import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCertificate, type CertificateVerificationResult } from '@/api/certificate.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

const STATUS_LABEL: Record<CertificateVerificationResult['status'], string> = {
  VALID: 'This is a valid certificate',
  EXPIRED: 'This certificate has expired',
  REVOKED: 'This certificate has been revoked',
  REPLACED: 'This certificate has been replaced by a newer version',
  NOT_FOUND: 'No certificate was found for this credential ID',
};

/** FR-085 public credential verification (`/verify/:credentialId`) — no login required, mounted OUTSIDE `RequireAuth`. */
export function CertificateVerifyPage() {
  const { credentialId = '' } = useParams<{ credentialId: string }>();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  useDocumentHead({ title: 'Verify Certificate | CoachX', noIndex: true });

  useEffect(() => {
    verifyCertificate(credentialId)
      .then((r) => {
        setResult(r);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [credentialId]);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Checking credential…</p>;
  if (loadState === 'error' || !result) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't verify this credential. Please try again.</p>;
  }

  const isValid = result.status === 'VALID';

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Certificate Verification</h1>

      <div
        className={`mt-6 rounded-lg border p-6 text-center ${
          isValid
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        <p className={`text-lg font-semibold ${isValid ? 'text-green-800 dark:text-green-300' : 'text-slate-700 dark:text-slate-300'}`}>
          {STATUS_LABEL[result.status]}
        </p>

        {result.status !== 'NOT_FOUND' && (
          <div className="mt-4 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            {result.learnerName && <p><strong>Learner:</strong> {result.learnerName}</p>}
            {result.courseTitle && <p><strong>Course:</strong> {result.courseTitle}</p>}
            {result.issuedAt && <p><strong>Issued:</strong> {new Date(result.issuedAt).toLocaleDateString()}</p>}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">Credential ID: {result.credentialId}</p>
      </div>
    </div>
  );
}
