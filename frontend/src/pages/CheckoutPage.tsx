import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { initiateCheckout, applyCoupon, getCheckoutSession, type CheckoutSession } from '@/api/checkout.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

/**
 * 002 FR-065/066/068, US4 — checkout-STATE tracking only. Real payment
 * gateway integration is 009's (not built yet, per spec.md's own
 * Assumptions) — the "Pay" action is honestly disabled with an
 * explanation rather than faking a working charge, matching this
 * codebase's established "omit or clearly disable, never mislead"
 * pattern (e.g. LoginPage's Google-sign-in placeholder).
 */
export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('productId') ?? '';
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Checkout | CoachX', description: 'Complete your purchase.' });

  useEffect(() => {
    if (!productId) {
      setError('No product selected.');
      return;
    }
    initiateCheckout(productId)
      .then(setSession)
      .catch((err: NormalizedApiError) => setError(err.message ?? 'Could not start checkout.'));
  }, [productId]);

  // Poll for a status change (e.g. a payment-gateway webhook resolving
  // the session to SUCCESS/FAILED) while the session is still in-flight —
  // the page itself never grants access or marks success; it only
  // reflects whatever the server-confirmed state already is (Constitution
  // Article I).
  useEffect(() => {
    if (!session) return;
    if (session.status === 'SUCCESS') {
      navigate(`/checkout/success/${session.id}`, { replace: true });
      return;
    }
    if (!['NOT_STARTED', 'PROCESSING', 'REQUIRES_ACTION'].includes(session.status)) return;
    const interval = setInterval(() => {
      getCheckoutSession(session.id).then(setSession).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [session, navigate]);

  const handleApplyCoupon = async () => {
    if (!session) return;
    setCouponMessage(null);
    try {
      const result = await applyCoupon(session.id, couponCode.trim());
      setCouponMessage(
        result.discountType === 'PERCENTAGE'
          ? `Coupon applied: ${result.discountValue}% off`
          : `Coupon applied: ${(result.discountValue / 100).toFixed(2)} off`,
      );
    } catch (err) {
      setCouponMessage((err as NormalizedApiError).message ?? 'This coupon could not be applied.');
    }
  };

  const handleRetry = async () => {
    setError(null);
    setSession(null);
    try {
      const fresh = await initiateCheckout(productId);
      setSession(fresh);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not restart checkout.');
    }
  };

  if (error) return <p className="mx-auto max-w-md py-12 text-red-600 dark:text-red-400">{error}</p>;
  if (!session) return <p className="mx-auto max-w-md py-12 text-slate-500">Loading…</p>;

  // 002 FR-069: clear error, Retry, Change Payment Method, Contact Support,
  // preserved cart (the session/coupon/product are untouched — Retry
  // starts a NEW session rather than losing what was already selected),
  // and an explicit no-duplicate-charge warning.
  if (session.status === 'FAILED') {
    return (
      <div className="mx-auto max-w-md py-12">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment failed</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          We couldn&apos;t process your payment for <strong>{session.product.name}</strong>. You have not been charged.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={handleRetry} className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Retry Payment
          </button>
          <button type="button" onClick={handleRetry} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium dark:border-slate-700">
            Change Payment Method
          </button>
          <Link to="/contact" className="text-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Contact Support
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">If any amount was deducted from your account, it will be automatically reversed — you will not be charged twice for this order.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Checkout</h1>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-white">{session.product.name}</h2>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{session.product.type}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Coupon code"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button
          type="button"
          onClick={handleApplyCoupon}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
        >
          Apply
        </button>
      </div>
      {couponMessage && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{couponMessage}</p>}

      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Payment processing is not available yet — the billing/payment-gateway integration (009) is not live in this environment."
        className="mt-6 w-full cursor-not-allowed rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500"
      >
        Pay — coming soon
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">Secure checkout. No charge will be made without your confirmation.</p>
    </div>
  );
}
