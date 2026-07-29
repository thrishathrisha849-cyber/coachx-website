interface SponsoredLabelProps {
  label?: string | null;
}

/**
 * 001 FR-062, Constitution Article III — a visible "Sponsored" label that
 * MUST render before any price/CTA for sponsored content. A reusable
 * primitive: drop this above any Product/event/resource card whose
 * `isSponsored` flag (now part of the public Product API shape) is true.
 */
export function SponsoredLabel({ label }: SponsoredLabelProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-800 dark:bg-gold-900/40 dark:text-gold-300">
      {label?.trim() || 'Sponsored'}
    </span>
  );
}
