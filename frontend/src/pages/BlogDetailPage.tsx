import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPageBySlug, fetchBlogList } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';
import { estimateReadingMinutes } from '@/utils/readingTime';

const MAX_RELATED_POSTS = 3;

/**
 * 002 FR-050: blog detail — breadcrumb, title, publish date, reading
 * time, related posts (by shared tag), share, hero content. Partial:
 * author/byline is NOT modeled on `Page` in this part (no
 * Author/Instructor entity exists yet) — see
 * docs/public-site/TRACEABILITY.md and DECISION_GATES.md. Article/
 * Breadcrumb structured data use the fields that ARE available.
 */
export function BlogDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');
  const [relatedPosts, setRelatedPosts] = useState<CmsPage[]>([]);

  useEffect(() => {
    setStatus('loading');
    setPage(null);
    fetchPageBySlug(slug)
      .then((result) => {
        setPage(result);
        setStatus('ready');
      })
      .catch((err: NormalizedApiError) => setStatus(err.status === 404 ? 'not-found' : 'not-found'));
  }, [slug]);

  // Related posts (FR-050): pages sharing at least one tag with the
  // current post, excluding itself — only fetched once the current
  // post (and its tags) are known.
  useEffect(() => {
    if (!page || page.tags.length === 0) {
      setRelatedPosts([]);
      return;
    }

    let cancelled = false;
    fetchBlogList(1, 20)
      .then((result) => {
        if (cancelled) return;
        const related = result.items
          .filter((p) => p.slug !== page.slug && p.tags.some((tag) => page.tags.includes(tag)))
          .slice(0, MAX_RELATED_POSTS);
        setRelatedPosts(related);
      })
      .catch(() => {
        if (!cancelled) setRelatedPosts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  useDocumentHead({
    title: page?.seo.title ?? 'Blog | CoachX',
    description: page?.seo.description,
    canonicalUrl: page?.seo.canonicalUrl,
    ogImageUrl: page?.seo.ogImageUrl,
  });

  useStructuredData(
    page
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: page.title,
          description: page.seo.description ?? undefined,
          datePublished: page.publishAt ?? undefined,
          dateModified: page.updatedAt,
          image: page.seo.ogImageUrl ?? undefined,
        }
      : null,
    'article',
  );

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'not-found' || !page) return <NotFound />;

  const readingMinutes = estimateReadingMinutes(page.blocks);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Blog', url: '/blog' }, { label: page.title, url: `/blog/${page.slug}` }]} />
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{page.title}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {page.publishAt && <>Published {new Date(page.publishAt).toLocaleDateString()} · </>}
        {readingMinutes} min read
      </p>

      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Share:</span>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${page.title} ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 underline dark:text-brand-400"
        >
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 underline dark:text-brand-400"
        >
          X (Twitter)
        </a>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Related articles</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                to={`/blog/${related.slug}`}
                className="rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-900 hover:border-brand-400 dark:border-slate-800 dark:text-white"
              >
                {related.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
