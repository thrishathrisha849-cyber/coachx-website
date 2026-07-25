/**
 * 002 FR-080, edge case: branded maintenance page. Estimated-return
 * time is shown ONLY when a real, confirmed value is supplied — never
 * a fabricated ETA (matching FR-112's anti-fabrication principle,
 * applied here to maintenance windows).
 */
export function Maintenance({ estimatedReturnAt }: { estimatedReturnAt?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="text-4xl" aria-hidden="true">🛠️</span>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">We'll be right back</h1>
      <p className="max-w-md text-slate-600 dark:text-slate-300">
        CoachX is undergoing scheduled maintenance. Thanks for your patience.
      </p>
      {estimatedReturnAt && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Estimated return: {new Date(estimatedReturnAt).toLocaleString()}
        </p>
      )}
      <a href="/status" className="text-sm font-medium text-brand-600 underline dark:text-brand-400">
        View status page
      </a>
    </div>
  );
}
