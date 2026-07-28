import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { NavTreeNode } from '@/types/cms.types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { SAFE_EXTERNAL_REL } from '@/utils/url';
import { env } from '@/config/env';

interface MobileNavProps {
  items: NavTreeNode[];
  open: boolean;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'mobile-nav-title';

/**
 * 002 FR-003: full-screen/side-drawer mobile menu — primary nav,
 * membership CTA, login CTA, social/contact/legal links, background
 * scroll disabled while open. FR-108: focus trapped within the dialog
 * while open, focus restored to the trigger button on close.
 */
export function MobileNav({ items, open, onClose }: MobileNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, open);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={DIALOG_TITLE_ID}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span id={DIALOG_TITLE_ID}>
          <img src="/images/coachx-logo.jpeg" alt={env.appName} className="h-7 w-auto" />
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto p-4" aria-label="Mobile">
        {items.map((item) => (
          <div key={item.id}>
            {item.isExternal ? (
              <a
                href={item.url}
                target="_blank"
                rel={SAFE_EXTERNAL_REL}
                className="block rounded-md px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {item.label}
              </a>
            ) : (
              <Link
                to={item.url}
                onClick={onClose}
                className="block rounded-md px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            )}
            {item.children.length > 0 && (
              <div className="ml-4 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-slate-800">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    to={child.url}
                    onClick={onClose}
                    className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        <Link
          to="/join"
          onClick={onClose}
          className="rounded-md bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Join Now
        </Link>
        <Link
          to="/login"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
