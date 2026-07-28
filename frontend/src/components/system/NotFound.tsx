import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 002 FR-080: 404 — search, home CTA, suggested pages, report-broken-
 * link. Upgraded from the Phase 1 placeholder (kept the same component
 * name/export so `router.tsx` didn't need restructuring).
 */
const SUGGESTED_PAGES = [
  { label: 'Home', url: '/' },
  { label: 'About', url: '/about' },
  { label: 'Pricing', url: '/pricing' },
  { label: 'Contact', url: '/contact' },
  { label: 'FAQ', url: '/faq' },
];

export function NotFound() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <h1 className="text-5xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="text-slate-500 dark:text-slate-400">We couldn't find that page.</p>

      <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
        <label htmlFor="404-search" className="sr-only">Search</label>
        <input
          id="404-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the site…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Go Home
        </Link>
        <Link to="/contact" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          Report a broken link
        </Link>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested pages</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {SUGGESTED_PAGES.map((page) => (
            <Link key={page.url} to={page.url} className="text-brand-600 underline dark:text-brand-400">
              {page.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
