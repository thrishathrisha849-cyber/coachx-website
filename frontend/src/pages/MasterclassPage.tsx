import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { getMasterclassStatus, registerForMasterclass, type MasterclassStatus } from '@/api/funnel.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { buildGoogleCalendarUrl, buildWhatsAppShareUrl } from '@/utils/calendar';
import { SAFE_EXTERNAL_REL } from '@/utils/url';

/** 002 FR-057/058/112, US3 — Funnel B (Webinar/Masterclass). The countdown/seat count shown is ALWAYS backend-sourced (`getMasterclassStatus`) — never a client-fabricated value. */
export function MasterclassPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [masterclassStatus, setMasterclassStatus] = useState<MasterclassStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Masterclass | CoachX', description: 'Register for our free live masterclass.' });

  useEffect(() => {
    getMasterclassStatus(slug)
      .then(setMasterclassStatus)
      .catch((err: NormalizedApiError) => setLoadError(err.message ?? 'Could not load masterclass details.'));
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);

    try {
      await registerForMasterclass({ slug, name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim() || undefined });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  if (loadError) return <p className="mx-auto max-w-md py-12 text-red-600 dark:text-red-400">{loadError}</p>;

  const closed = masterclassStatus?.isClosed || masterclassStatus?.isFull;

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Join our live masterclass</h1>
      {masterclassStatus && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <p>{new Date(masterclassStatus.scheduledAt).toLocaleString()}</p>
          {masterclassStatus.speakerName && <p>With {masterclassStatus.speakerName}</p>}
          {masterclassStatus.seatsRemaining !== null && (
            <p className="mt-1 font-medium">{masterclassStatus.seatsRemaining} seats remaining</p>
          )}
          {masterclassStatus.registrationClosesAt && (
            <p className="mt-1 text-xs text-slate-400">Registration closes {new Date(masterclassStatus.registrationClosesAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {status === 'success' ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <p>You&apos;re registered! Check your email for confirmation.</p>
          {masterclassStatus && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={buildGoogleCalendarUrl('CoachX Masterclass', 'Your live masterclass registration.', new Date(masterclassStatus.scheduledAt))}
                target="_blank"
                rel={SAFE_EXTERNAL_REL}
                className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-slate-900 dark:text-green-300"
              >
                📅 Add to Calendar
              </a>
              <a
                href={buildWhatsAppShareUrl(`I just registered for a free masterclass on CoachX! Join me: ${window.location.href}`)}
                target="_blank"
                rel={SAFE_EXTERNAL_REL}
                className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-slate-900 dark:text-green-300"
              >
                💬 Share on WhatsApp
              </a>
            </div>
          )}
        </div>
      ) : closed ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {masterclassStatus?.isFull ? 'This masterclass is fully booked.' : 'Registration for this masterclass has closed.'}
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="mc-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Name <span aria-hidden="true">*</span></label>
            <input
              id="mc-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label htmlFor="mc-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email <span aria-hidden="true">*</span></label>
            <input
              id="mc-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label htmlFor="mc-mobile" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Mobile</label>
            <input
              id="mc-mobile"
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Registering…' : 'Register for Free'}
          </button>
        </form>
      )}
    </div>
  );
}
