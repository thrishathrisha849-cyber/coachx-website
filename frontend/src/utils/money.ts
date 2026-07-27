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
