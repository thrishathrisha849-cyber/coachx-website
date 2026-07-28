import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerAccount } from '@/api/auth.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { env } from '@/config/env';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

const initialState: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

/**
 * Minimal registration page for the "Join Now" CTA (header, mobile nav,
 * and CMS-seeded homepage/pricing CTAs all link to `/join`, which had no
 * route registered — this page fixes that 404). Calls the existing,
 * already-working `POST /auth/register` endpoint — no backend changes.
 * Mirrors `ContactForm.tsx`'s validate/submit/error-state pattern, the
 * existing form-field styling convention, and FR-020's non-preselected
 * consent checkbox (the backend requires `acceptedTerms: true` literally).
 */
export function JoinPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  useDocumentHead({
    title: 'Join Now | CoachX',
    description: 'Create your free CoachX account to start learning and connecting with the community.',
  });

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    if (!form.acceptedTerms) errors.acceptedTerms = 'Please accept the terms to create an account.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    if (!validate()) return;

    setStatus('submitting');
    setServerError(null);

    try {
      await registerAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptedTerms: true,
      });
      setStatus('success');
      setForm(initialState);
    } catch (err) {
      setStatus('error');
      setServerError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <img src="/images/coachx-logo.jpeg" alt={env.appName} className="mb-6 h-10 w-auto" />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Join CoachX</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Create your free account to start learning and connecting with the community.
      </p>

      {status === 'success' ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Account created — check your email to verify your address before signing in.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="join-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              id="join-name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={validate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'join-name-error' : undefined}
            />
            {fieldErrors.name && <p id="join-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="join-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="join-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={validate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'join-email-error' : undefined}
            />
            {fieldErrors.email && <p id="join-email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="join-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password <span aria-hidden="true">*</span>
            </label>
            <input
              id="join-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onBlur={validate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'join-password-error' : undefined}
            />
            {fieldErrors.password && <p id="join-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="join-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Confirm password <span aria-hidden="true">*</span>
            </label>
            <input
              id="join-confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              onBlur={validate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'join-confirm-password-error' : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p id="join-confirm-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5 accent-brand-600"
              checked={form.acceptedTerms}
              onChange={(e) => setForm((f) => ({ ...f, acceptedTerms: e.target.checked }))}
            />
            I agree to the Terms of Service and Privacy Policy.
          </label>
          {fieldErrors.acceptedTerms && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.acceptedTerms}</p>}

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
