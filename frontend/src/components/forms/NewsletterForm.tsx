import { useState, type FormEvent } from 'react';
import { subscribeToNewsletter } from '@/api/cms.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 002 FR-081/FR-082: labels, inline validation, submit-loading state,
 * duplicate-submission prevention (disabled while submitting).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return; // duplicate-submit guard

    if (!consent) {
      setError('Please accept to receive newsletter emails.');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      await subscribeToNewsletter(email);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return <p className="text-sm text-green-700 dark:text-green-400">You're subscribed. Thank you!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor="newsletter-email" className="text-xs font-medium text-slate-600 dark:text-slate-400">
        Get updates in your inbox
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="whitespace-nowrap rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to receive newsletter emails.
      </label>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
