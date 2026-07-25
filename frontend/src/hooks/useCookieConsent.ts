import { useCallback, useState } from 'react';

/**
 * 002 FR-010: cookie consent banner state — Essential (always on),
 * Analytics, Marketing, Personalization. Persisted with the accepted
 * policy version and timestamp (FR-101/FR-102's per-channel, versioned
 * consent requirement, applied here to the cookie-category banner).
 */
export const COOKIE_POLICY_VERSION = '1.0';
const STORAGE_KEY = 'coachx-cookie-consent';

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  policyVersion: string;
  timestamp: string;
}

function readStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    // A policy-version mismatch means the stored consent is stale —
    // re-prompt rather than silently honoring an outdated agreement.
    if (parsed.policyVersion !== COOKIE_POLICY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentState | null>(readStoredConsent);

  const persist = useCallback((next: Omit<CookieConsentState, 'essential' | 'policyVersion' | 'timestamp'>) => {
    const state: CookieConsentState = {
      essential: true,
      ...next,
      policyVersion: COOKIE_POLICY_VERSION,
      timestamp: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setConsent(state);
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true, marketing: true, personalization: true }), [persist]);
  const rejectNonEssential = useCallback(
    () => persist({ analytics: false, marketing: false, personalization: false }),
    [persist],
  );
  const customize = useCallback(
    (choices: { analytics: boolean; marketing: boolean; personalization: boolean }) => persist(choices),
    [persist],
  );

  return { consent, needsPrompt: consent === null, acceptAll, rejectNonEssential, customize };
}

/**
 * FR-106: marketing/analytics/personalization scripts MUST NOT load
 * before consent is given. Any future script-loading code should gate
 * on this helper rather than loading unconditionally.
 */
export function hasConsentFor(category: 'analytics' | 'marketing' | 'personalization'): boolean {
  const consent = readStoredConsent();
  return consent?.[category] === true;
}
