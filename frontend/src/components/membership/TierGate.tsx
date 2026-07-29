import type { ReactNode } from 'react';

interface TierGateProps {
  locked: boolean;
  requiredTierLabel: string;
  children: ReactNode;
}

/**
 * 001 FR-Membership (US2): tier-restricted features MUST be clearly
 * locked, never hidden — a Free-tier visitor should see that mentor
 * booking/marketplace-selling/etc. exist and which tier unlocks them,
 * not have the control disappear entirely. `locked` is caller-supplied
 * (there is no global membership-state context yet in the frontend — see
 * `docs/auth/TRACEABILITY.md`'s "no auth/session client exists yet" note
 * this component inherits) — wire it to the real entitlement check once
 * that context exists.
 */
export function TierGate({ locked, requiredTierLabel, children }: TierGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-40 grayscale">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70 dark:bg-slate-950/70">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          🔒 Requires {requiredTierLabel}
        </span>
      </div>
    </div>
  );
}
