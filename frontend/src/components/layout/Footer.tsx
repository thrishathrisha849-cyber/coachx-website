import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';
import { fetchNavigation } from '@/api/cms.api';
import type { NavTreeNode } from '@/types/cms.types';
import { NewsletterForm } from '@/components/forms/NewsletterForm';

/**
 * 002 FR-008: Brand/Platform/Resources/Company/Legal sections + footer
 * bottom (copyright, legal name). Section groupings are CMS-driven
 * (`NavigationItem` location=FOOTER, grouped by `megaMenuColumn` — the
 * same field mega-menus use for header dropdown columns, reused here
 * for footer column grouping since both are "which visual group does
 * this item belong to" concerns).
 */
export function Footer() {
  const [items, setItems] = useState<NavTreeNode[]>([]);

  useEffect(() => {
    fetchNavigation('footer')
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const columns = new Map<string, NavTreeNode[]>();
  for (const item of items) {
    const column = item.megaMenuColumn ?? 'More';
    if (!columns.has(column)) columns.set(column, []);
    columns.get(column)!.push(item);
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">{env.appName}</span>
            <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-400">
              A Tamil-first business, learning, and community platform.
            </p>
            <div className="mt-4 max-w-xs">
              <NewsletterForm />
            </div>
          </div>

          {Array.from(columns.entries()).map(([column, columnItems]) => (
            <div key={column}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{column}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {columnItems.map((item) => (
                  <li key={item.id}>
                    {item.isExternal ? (
                      <a href={item.url} className="text-sm text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.url} className="text-sm text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-slate-200 pt-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:justify-between sm:text-left">
          <span>© {new Date().getFullYear()} {env.appName}. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400">Terms</Link>
            <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy</Link>
            <Link to="/cookies" className="hover:text-brand-600 dark:hover:text-brand-400">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
