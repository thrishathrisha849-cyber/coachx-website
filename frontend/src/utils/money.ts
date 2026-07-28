/**
 * Money-safe display formatting for `Course.priceAmountMinor` (integer
 * minor units — e.g. paise for INR) — mirrors the backend's own money-safe
 * storage discipline (`docs/lms/DATA_MODEL.md`: "never a float"). This is
 * DISPLAY formatting only, no payment processing.
 */
export function formatCoursePrice(priceType: string, amountMinor: number, currency: string): string {
  if (priceType === 'FREE') return 'Free';

  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(major);
  } catch {
    return `${currency} ${major.toFixed(0)}`;
  }
}

/** Phase 7 Part 1 — same money-safe minor-unit formatting, for billing ProductPrice rows (never a FREE/PAID priceType field — a zero amount just formats as the currency's zero). */
export function formatMinorAmount(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(major);
  } catch {
    return `${currency} ${major.toFixed(0)}`;
  }
}

const BILLING_INTERVAL_LABELS: Record<string, string> = {
  ONE_TIME: 'one-time',
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  HALF_YEARLY: '/6 months',
  ANNUAL: '/year',
  MULTI_YEAR: '/multi-year term',
  CUSTOM_CONTRACT: 'custom contract',
};

export function formatBillingInterval(interval: string): string {
  return BILLING_INTERVAL_LABELS[interval] ?? interval.toLowerCase();
}
