import { Link } from 'react-router-dom';

interface ErrorPageProps {
  code: string;
  heading: string;
  message: string;
  errorReference?: string;
  showRetry?: boolean;
}

/**
 * 002 FR-080, FR-115: human-readable message, retry, support reference,
 * error reference code — never a technical stack trace. Shared by the
 * 500 page and any other generic error surface.
 */
export function ErrorPage({ code, heading, message, errorReference, showRetry = true }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">{code}</span>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{heading}</h1>
      <p className="max-w-md text-slate-600 dark:text-slate-300">{message}</p>
      {errorReference && (
        <p className="text-xs text-slate-400">Reference: <code>{errorReference}</code></p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {showRetry && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Retry
          </button>
        )}
        <Link to="/" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          Go Home
        </Link>
        <Link to="/contact" className="rounded-md px-5 py-2.5 text-sm font-semibold text-slate-600 underline dark:text-slate-300">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
