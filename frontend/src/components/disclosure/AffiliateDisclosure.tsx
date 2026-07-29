interface AffiliateDisclosureProps {
  disclosure?: string | null;
}

/**
 * 001 FR-063, Constitution Article III — a transparent, mandatory
 * disclosure notice for any third-party affiliate product recommendation,
 * rendered before the recommendation's purchase path.
 */
export function AffiliateDisclosure({ disclosure }: AffiliateDisclosureProps) {
  return (
    <p className="text-xs italic text-slate-500 dark:text-slate-400">
      {disclosure?.trim() || 'This is an affiliate recommendation — CoachX may earn a commission if you purchase through this link.'}
    </p>
  );
}
