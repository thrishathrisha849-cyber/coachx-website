import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchSearch } from '@/api/cms.api';
import type { SearchResult } from '@/types/cms.types';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';

/**
 * 002 FR-009: global search page. Part 1 scope: Pages + FAQs only —
 * see docs/public-site/TRACEABILITY.md for what's deferred.
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useDocumentHead({ title: query ? `Search: ${query} | CoachX` : 'Search | CoachX', noIndex: true });

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setResults(null);
    fetchSearch(query)
      .then(setResults)
      .catch(() => setResults([]));
  }, [query]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Search</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearchParams(input.trim().length >= 2 ? { q: input.trim() } : {});
        }}
        className="mb-8 flex gap-2"
      >
        <label htmlFor="search-input" className="sr-only">Search</label>
        <input
          id="search-input"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search…"
          minLength={2}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Enter at least 2 characters to search.</p>
      )}

      {results === null && query.trim().length >= 2 && <PageSkeleton />}

      {results !== null && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No results for “{query}.”</p>
      )}

      {results !== null && results.length > 0 && (
        <ul className="flex flex-col gap-4">
          {results.map((result) => (
            <li key={`${result.type}-${result.id}`} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <Link to={result.url} className="font-semibold text-brand-600 dark:text-brand-400">
                {result.title}
              </Link>
              {result.excerpt && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
