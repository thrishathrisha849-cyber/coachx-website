import { env } from '@/config/env';

/**
 * Admin shell navigation rail. Empty of business links by design —
 * module entries (Users, Courses, Community, Payments, ...) are added
 * here as each domain module is implemented in a later phase.
 */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
      <div className="flex h-14 items-center border-b border-slate-200 px-4 font-semibold text-brand-600 dark:border-slate-800 dark:text-brand-400">
        {env.appName}
      </div>
      <nav className="p-4 text-sm text-slate-400">
        <p>No modules registered yet.</p>
      </nav>
    </aside>
  );
}
