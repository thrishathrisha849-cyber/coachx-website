import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { unsubscribeFromNewsletter } from '@/api/cms.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';

/** Safe unsubscribe confirmation page (Phase 5 Part 2 §"NEWSLETTER"). */
export function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useDocumentHead({ title: 'Unsubscribe | CoachX', noIndex: true });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    unsubscribeFromNewsletter(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') return <PageSkeleton />;

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unsubscribe link invalid</h1>
        <p className="text-slate-500 dark:text-slate-400">This link may have expired or already been used.</p>
        <Link to="/" className="text-sm font-medium text-brand-600 underline dark:text-brand-400">Go home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">You're unsubscribed</h1>
      <p className="text-slate-500 dark:text-slate-400">You won't receive further newsletter emails from us.</p>
      <Link to="/" className="text-sm font-medium text-brand-600 underline dark:text-brand-400">Go home</Link>
    </div>
  );
}
