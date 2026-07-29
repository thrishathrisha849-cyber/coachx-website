import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCheckoutSession, type CheckoutSession } from '@/api/checkout.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

/**
 * 002 FR-070, edge case (Constitution Article I): this page only READS
 * and REFLECTS the checkout session's server-confirmed state — it never
 * itself grants access. If the session isn't (yet) SUCCESS — e.g. the
 * payment webhook hasn't arrived — it shows a "confirming" state rather
 * than assuming success just because the user was routed here.
 */
export function CheckoutSuccessPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Order Confirmed | CoachX', description: 'Your order confirmation.' });

  useEffect(() => {
    getCheckoutSession(sessionId)
      .then(setSession)
      .catch((err: NormalizedApiError) => setError(err.message ?? 'Could not load your order.'));
  }, [sessionId]);

  if (error) return <p className="mx-auto max-w-md py-12 text-red-600 dark:text-red-400">{error}</p>;
  if (!session) return <p className="mx-auto max-w-md py-12 text-slate-500">Loading…</p>;

  if (session.status !== 'SUCCESS') {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Confirming your payment…</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          This can take a moment. This page will update automatically once your payment is confirmed — you have not been charged twice.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        <h1 className="text-2xl font-bold">Payment successful!</h1>
        <p className="mt-2">Thank you for your purchase.</p>
      </div>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500 dark:text-slate-400">Order ID</dt>
          <dd className="font-mono text-slate-800 dark:text-slate-200">{session.id}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500 dark:text-slate-400">Product</dt>
          <dd className="text-slate-800 dark:text-slate-200">{session.product.name}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-slate-400">A confirmation and invoice have been emailed to you.</p>

      <Link to="/courses" className="mt-6 inline-block rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Go to your content
      </Link>
    </div>
  );
}
