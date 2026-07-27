import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/theme.context';
import { env } from '@/config/env';
import { useNavigation } from '@/hooks/useNavigation';
import { SAFE_EXTERNAL_REL } from '@/utils/url';
import { MobileNav } from './MobileNav';

/**
 * 002 FR-001–FR-004, FR-007: sticky header, shrink-on-scroll, dropdown
 * mega-menu, mobile hamburger, logged-in-vs-guest state. Nav items are
 * always CMS-driven (`fetchNavigation`) — never hardcoded (per the
 * Phase 5 brief's explicit "Do not hardcode menu items").
 *
 * FR-007 (logged-in header state — avatar, Dashboard CTA) is
 * structurally deferred: no frontend auth/session client exists yet
 * (see docs/public-site/TRACEABILITY.md) — the header always renders
 * the guest state today.
 */
export function Header() {
  const { theme, toggleTheme } = useTheme();
  const navItems = useNavigation('header');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur transition-all dark:border-slate-800 dark:bg-slate-950/90 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all ${
          scrolled ? 'h-12' : 'h-16'
        }`}
      >
        <Link to="/" className={`font-semibold text-brand-600 transition-all dark:text-brand-400 ${scrolled ? 'text-base' : 'text-lg'}`}>
          {env.appName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setOpenDropdownId(item.id)}
              onMouseLeave={() => setOpenDropdownId((current) => (current === item.id ? null : current))}
            >
              {item.isExternal ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel={SAFE_EXTERNAL_REL}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.url}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              )}

              {item.children.length > 0 && openDropdownId === item.id && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 grid min-w-[520px] grid-flow-col gap-x-6 gap-y-1 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  style={{ gridTemplateRows: `repeat(${Math.ceil(item.children.length / 2)}, auto)` }}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      to={child.url}
                      className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
            aria-label="Toggle color theme"
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>

          {/* Guest-state CTAs (FR-007's logged-in state is deferred — see file header note) */}
          <Link
            to="/login"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
          >
            Login
          </Link>
          <Link
            to="/join"
            className="hidden rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
          >
            Join Now
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      <MobileNav items={navItems} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
