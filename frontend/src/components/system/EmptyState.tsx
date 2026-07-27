import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * 002 FR-080: a reusable Empty state — explanation, optional next
 * action. Used by Blog listing (no posts), Search (no results), and
 * any future CMS-driven listing that can legitimately have zero items.
 */
export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="status">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {description && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
