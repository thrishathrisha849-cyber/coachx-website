import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '@/api/auth.api';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { useAuth, MfaRequiredError } from '@/context/auth.context';
import { env } from '@/config/env';

/** 003 US2: redirect to onboarding by default (the dashboard itself redirects a not-yet-onboarded member back here, so onboarding is always the safe first stop after login); a protected page the user was bounced from (`RequireAuth`'s `state.from`) takes priority when present. */
const DEFAULT_POST_LOGIN_REDIRECT = '/onboarding';
const POST_LOGIN_REDIRECT_DELAY_MS = 1200;

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

const initialState: FormState = { email: '', password: '', rememberMe: false };

/**
 * Minimal login page for the "Login" header link and JoinPage's "Log in"
 * link (both already pointed to `/login`, which had no route — this page
 * fixes that 404, same fix pattern as `JoinPage.tsx`). Calls the existing,
 * already-working `POST /auth/login` and `POST /auth/forgot-password`
 * endpoints — no backend changes. No global session/auth-context wiring
 * exists yet anywhere in this app (same pre-existing gap `client.ts`'s own
 * comment documents) — "Remember Me" persists the returned tokens to
 * localStorage (vs. sessionStorage) for a future auth layer to consume,
 * without building that layer here.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTarget = (location.state as { from?: string } | null)?.from ?? DEFAULT_POST_LOGIN_REDIRECT;

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigate(redirectTarget), POST_LOGIN_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, navigate, redirectTarget]);

  const [mode, setMode] = useState<'login' | 'forgot-password'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

  useDocumentHead({
    title: 'Log in | CoachX',
    description: 'Log in to your CoachX account.',
  });

  function validate(): boolean {
    const errors: Partial<Record<'email' | 'password', string>> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.password.length < 1) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!validate()) return;

    setStatus('submitting');
    setServerError(null);
    setMfaRequired(false);

    try {
      await login(form.email.trim(), form.password, form.rememberMe);
      setStatus('success');
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfaRequired(true);
        setStatus('idle');
        return;
      }
      setStatus('error');
      setServerError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (resetStatus === 'submitting') return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError('Enter a valid email address.');
      return;
    }

    setResetStatus('submitting');
    setResetError(null);

    try {
      await requestPasswordReset(resetEmail.trim());
      setResetStatus('success');
    } catch (err) {
      setResetStatus('error');
      setResetError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  if (mode === 'forgot-password') {
    return (
      <div className="mx-auto max-w-md">
        <img src="/images/coachx-logo.jpeg" alt={env.appName} className="mb-6 h-10 w-auto" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Enter your account email and we'll send you a reset link.
        </p>

        {resetStatus === 'success' ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            If an account matches that email, reset instructions were sent.
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {resetError && <p className="text-sm text-red-600 dark:text-red-400">{resetError}</p>}

            <button
              type="submit"
              disabled={resetStatus === 'submitting'}
              className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {resetStatus === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Back to log in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <img src="/images/coachx-logo.jpeg" alt={env.appName} className="mb-6 h-10 w-auto" />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Log in to CoachX</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Welcome back — pick up where you left off.</p>

      {status === 'success' ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Logged in successfully. Redirecting…
        </div>
      ) : (
        <>
          {/* FR-033/FR-036 (auth spec): Google/Apple OAuth is not implemented
              in the backend yet (see docs/auth/DECISION_GATES.md gate #3) —
              rendered as a clearly disabled placeholder, never a fake/dead
              working button, matching the same "omit or clearly disable,
              never mislead" rule already applied to PricingPage's checkout CTA. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Google sign-in is not available yet"
            className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">or log in with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={validate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
            {fieldErrors.email && <p id="login-email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password <span aria-hidden="true">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onBlur={validate}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-16 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p id="login-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={form.rememberMe}
                onChange={(e) => setForm((f) => ({ ...f, rememberMe: e.target.checked }))}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setMode('forgot-password')}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Forgot password?
            </button>
          </div>

          {mfaRequired && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This account requires a multi-factor authentication code, which isn't supported on this page yet. Please contact support.
            </p>
          )}
          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Logging in…' : 'Log in'}
          </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Don't have an account?{' '}
        <Link to="/join" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Join now
        </Link>
      </p>
    </div>
  );
}
