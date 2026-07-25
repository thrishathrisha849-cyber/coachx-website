/** 002 FR-080: Loading state — skeleton, preserved layout, no blank screen. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-10" role="status" aria-label="Loading page">
      <div className="mx-auto h-10 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
