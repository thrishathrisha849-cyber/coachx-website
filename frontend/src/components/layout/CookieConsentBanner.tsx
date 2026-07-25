import { useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * 002 FR-010: Accept All / Reject Non-Essential / Customize, 4
 * categories, Privacy Policy link. Constitution Article VI: consent is
 * per-channel, never a single combined opt-in.
 */
export function CookieConsentBanner() {
  const { needsPrompt, acceptAll, rejectNonEssential, customize } = useCookieConsent();
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState({ analytics: false, marketing: false, personalization: false });

  if (!needsPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We use cookies to run essential site functions and, with your consent, for analytics,
          marketing, and personalization.{' '}
          <a href="/privacy" className="font-medium text-brand-600 underline dark:text-brand-400">
            Privacy Policy
          </a>
        </p>

        {customizing && (
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              Essential (always on)
            </label>
            {(['analytics', 'marketing', 'personalization'] as const).map((category) => (
              <label key={category} className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={choices[category]}
                  onChange={(e) => setChoices((prev) => ({ ...prev, [category]: e.target.checked }))}
                />
                {category}
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={rejectNonEssential}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reject Non-Essential
          </button>
          {!customizing ? (
            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Customize
            </button>
          ) : (
            <button
              type="button"
              onClick={() => customize(choices)}
              className="rounded-md px-4 py-2 text-sm font-semibold text-brand-600 underline dark:text-brand-400"
            >
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
