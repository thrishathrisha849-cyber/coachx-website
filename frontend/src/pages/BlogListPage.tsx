import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogList } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

/** 002 FR-049: blog listing with categories, tags. */
export function BlogListPage() {
  const [posts, setPosts] = useState<CmsPage[] | null>(null);

  useEffect(() => {
    fetchBlogList()
      .then((result) => setPosts(result.items))
      .catch(() => setPosts([]));
  }, []);

  useDocumentHead({ title: 'Blog | CoachX', description: 'Insights on business, freelancing, marketing, and more.' });

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Blog', url: '/blog' }]} />
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Blog</h1>

      {posts === null && <PageSkeleton />}

      {posts !== null && posts.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No articles published yet — check back soon.</p>
      )}

      {posts !== null && posts.length > 0 && (
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
      )}
    </div>
  );
}
