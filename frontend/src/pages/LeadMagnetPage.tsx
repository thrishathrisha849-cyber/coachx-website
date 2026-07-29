import { useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { captureLead } from '@/api/funnel.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';

/**
 * 002 FR-055/056, US2 — Funnel A (Free Resource). One generic template
 * for every lead magnet, keyed by the `:slug` route param (the resource
 * identifier the admin configures downloads/emails against). Marketing
 * copy for a specific lead magnet is intentionally NOT hardcoded per-slug
 * here — that's CMS Page-Builder territory (US5, deferred this pass);
 * this page owns the real, working capture mechanism.
 */
export function LeadMagnetPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', consent: false });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Free Resource | CoachX', description: 'Get your free resource delivered by email.' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);

    try {
      await captureLead({
        leadMagnetSlug: slug,
        email: form.email.trim(),
        name: form.name.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        consentMarketingEmail: form.consent,
        utmSource: searchParams.get('utm_source') ?? undefined,
        utmMedium: searchParams.get('utm_medium') ?? undefined,
        utmCampaign: searchParams.get('utm_campaign') ?? undefined,
        utmTerm: searchParams.get('utm_term') ?? undefined,
        utmContent: searchParams.get('utm_content') ?? undefined,
        referralCode: searchParams.get('ref') ?? undefined,
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Get your free resource</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Enter your details and we&apos;ll send it straight to your inbox.</p>

      {status === 'success' ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Check your email — your resource is on its way, along with a download link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="lead-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
            <input
              id="lead-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label htmlFor="lead-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email <span aria-hidden="true">*</span></label>
            <input
              id="lead-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label htmlFor="lead-mobile" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Mobile</label>
            <input
              id="lead-mobile"
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          {/* Honeypot — hidden from real users, a filled value silently no-ops the submission server-side. */}
          <input type="text" tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" value="" onChange={() => {}} name="website" />

          <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5 accent-brand-600"
              checked={form.consent}
              onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            />
            Send me occasional emails with tips and recommendations (optional).
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Sending…' : 'Get the Resource'}
          </button>
        </form>
      )}
    </div>
  );
}
