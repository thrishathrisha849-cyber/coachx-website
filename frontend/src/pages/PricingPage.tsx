import { useEffect, useMemo, useState } from 'react';
import { fetchPublicPlans } from '@/api/billing.api';
import type { MembershipPlan } from '@/types/billing.types';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { EmptyState } from '@/components/system/EmptyState';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { formatMinorAmount, formatBillingInterval } from '@/utils/money';

const RECOMMENDED_LABELS: Record<string, string> = {
  BEST_VALUE: 'Best Value',
  MOST_POPULAR: 'Most Popular',
  EDITOR_CHOICE: "Editor's Choice",
};

/** Picks the price to headline on a card: prefer MONTHLY, else the lowest-amount price. */
function primaryPrice(plan: MembershipPlan) {
  if (plan.prices.length === 0) return null;
  return (
    plan.prices.find((p) => p.billingInterval === 'MONTHLY') ??
    [...plan.prices].sort((a, b) => a.unitAmountMinor - b.unitAmountMinor)[0]
  );
}

/**
 * Phase 7 Part 1 — public plan comparison page (004/009 FR-013: plan name,
 * target user, billing amount/frequency, feature comparison, trial info,
 * a truthful server-evaluated "recommended" label, and a call to action).
 * No checkout exists yet (Part 2+) — the CTA is deliberately a disabled,
 * clearly-labeled "Coming soon" rather than a misleading working button
 * (same "omit or clearly disable, never mislead" rule the LMS course
 * listing page already established for its own not-yet-built Enroll CTA).
 */
export function PricingPage() {
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    fetchPublicPlans()
      .then((data) => {
        setPlans(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useDocumentHead({
    title: 'Pricing | CoachX',
    description: 'Compare CoachX membership plans and find the right fit for your goals.',
  });

  const allEntitlementKeys = useMemo(() => {
    if (!plans) return [];
    const keys = new Map<string, string>();
    for (const plan of plans) {
      for (const e of plan.currentVersion.entitlements) {
        if (!keys.has(e.key)) keys.set(e.key, e.description ?? e.key);
      }
    }
    return Array.from(keys.entries());
  }, [plans]);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Pricing', url: '/pricing' }]} />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Plans built for every stage</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Simple, transparent pricing. Upgrade, downgrade, or cancel anytime once billing goes live.
        </p>
      </div>

      {status === 'loading' && <PageSkeleton />}

      {status === 'error' && (
        <EmptyState icon="⚠️" title="Couldn't load pricing" description="Please try again in a moment." />
      )}

      {status === 'ready' && plans !== null && plans.length === 0 && (
        <EmptyState icon="💳" title="No plans available yet" description="Check back soon." />
      )}

      {status === 'ready' && plans !== null && plans.length > 0 && (
        <>
          {/* Plan cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = primaryPrice(plan);
              const recommended = plan.currentVersion.recommendedReason;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-6 shadow-sm transition ${
                    recommended
                      ? 'border-gold-500 ring-1 ring-gold-500 dark:border-gold-400'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
                      {RECOMMENDED_LABELS[recommended] ?? recommended}
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.currentVersion.name}</h2>
                    {plan.currentVersion.badgeText && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {plan.currentVersion.badgeText}
                      </span>
                    )}
                  </div>

                  {plan.currentVersion.targetCustomer && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.currentVersion.targetCustomer}</p>
                  )}

                  <div className="mt-4">
                    {price ? (
                      <>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                          {formatMinorAmount(price.unitAmountMinor, price.currency)}
                        </span>
                        <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
                          {formatBillingInterval(price.billingInterval)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Pricing coming soon</span>
                    )}
                    {plan.currentVersion.trialEligible && plan.currentVersion.trialDays && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {plan.currentVersion.trialDays}-day free trial
                      </p>
                    )}
                  </div>

                  {plan.currentVersion.publicDescription && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.currentVersion.publicDescription}</p>
                  )}

                  {plan.currentVersion.features.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {plan.currentVersion.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-brand-600 dark:text-brand-400">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6">
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Taxes calculated at checkout.</p>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="Checkout is not available yet"
                      className="w-full cursor-not-allowed rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500"
                    >
                      Coming soon
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          {allEntitlementKeys.length > 0 && (
            <div className="mt-14 overflow-x-auto">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Compare plans</h2>
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {plan.currentVersion.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allEntitlementKeys.map(([key, label]) => (
                    <tr key={key} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{label}</td>
                      {plans.map((plan) => {
                        const entitlement = plan.currentVersion.entitlements.find((e) => e.key === key);
                        return (
                          <td key={plan.id} className="py-3 px-4 text-slate-700 dark:text-slate-200">
                            {renderEntitlementCell(entitlement)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function renderEntitlementCell(entitlement: MembershipPlan['currentVersion']['entitlements'][number] | undefined) {
  if (!entitlement) return <span className="text-slate-300 dark:text-slate-700">—</span>;
  if (entitlement.type === 'BOOLEAN_ACCESS') {
    return entitlement.value ? (
      <span aria-label="Included" className="text-brand-600 dark:text-brand-400">
        ✓
      </span>
    ) : (
      <span className="text-slate-300 dark:text-slate-700">—</span>
    );
  }
  return <span>{String(entitlement.value)}</span>;
}
