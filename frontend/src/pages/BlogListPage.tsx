import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchBlogList } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { EmptyState } from '@/components/system/EmptyState';
import { Pagination } from '@/components/system/Pagination';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

const PAGE_SIZE = 9;

/** 002 FR-049: blog listing with tag filter and pagination. */
export function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const activeTag = searchParams.get('tag') ?? undefined;

  const [posts, setPosts] = useState<CmsPage[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    setPosts(null);
    fetchBlogList(page, PAGE_SIZE, activeTag)
      .then((result) => {
        setPosts(result.items);
        setTotalPages(result.meta.totalPages);
      })
      .catch(() => {
        setPosts([]);
        setTotalPages(1);
      });
  }, [page, activeTag]);

  // Tag list is derived from a separate, unfiltered fetch (once, on
  // mount) — deriving it from the current (possibly tag-filtered) page
  // would make previously-visible filter buttons disappear once
  // applied, which is confusing.
  useEffect(() => {
    fetchBlogList(1, 100)
      .then((result) => setAllTags(Array.from(new Set(result.items.flatMap((p) => p.tags))).sort()))
      .catch(() => setAllTags([]));
  }, []);

  useDocumentHead({
    title: activeTag ? `${activeTag} | Blog | CoachX` : 'Blog | CoachX',
    description: 'Insights on business, freelancing, marketing, and more.',
  });

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const setTag = (tag: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (tag) next.set('tag', tag);
    else next.delete('tag');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Blog', url: '/blog' }]} />
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Blog</h1>

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setTag(undefined)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!activeTag ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
            aria-pressed={!activeTag}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeTag === tag ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              aria-pressed={activeTag === tag}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {posts === null && <PageSkeleton />}

      {posts !== null && posts.length === 0 && (
        <EmptyState
          icon="📝"
          title={activeTag ? `No articles tagged “${activeTag}” yet` : 'No articles published yet'}
          description="Check back soon for new content."
          action={
            activeTag ? (
              <button type="button" onClick={() => setTag(undefined)} className="text-sm font-medium text-brand-600 underline dark:text-brand-400">
                Clear filter
              </button>
            ) : undefined
          }
        />
      )}

      {posts !== null && posts.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="rounded-lg border border-slate-200 p-5 transition hover:border-brand-400 dark:border-slate-800"
              >
                <h2 className="font-semibold text-slate-900 dark:text-white">{post.title}</h2>
                {post.seo.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.seo.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
