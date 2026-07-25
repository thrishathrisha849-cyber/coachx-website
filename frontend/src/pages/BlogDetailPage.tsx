import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPageBySlug } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';

/**
 * 002 FR-050: blog detail — breadcrumb, title, hero content, share.
 * Partial: author/published-vs-updated-date/reading-time are NOT
 * modeled on `Page` in this part (no Author/Instructor entity exists
 * yet) — see docs/public-site/TRACEABILITY.md and DECISION_GATES.md.
 * Article/Breadcrumb structured data (FR-050) use the fields that ARE
 * available.
 */
export function BlogDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    fetchPageBySlug(slug)
      .then((result) => {
        setPage(result);
        setStatus('ready');
      })
      .catch((err: NormalizedApiError) => setStatus(err.status === 404 ? 'not-found' : 'not-found'));
  }, [slug]);

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
          dateModified: page.updatedAt,
          image: page.seo.ogImageUrl ?? undefined,
        }
      : null,
    'article',
  );

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'not-found' || !page) return <NotFound />;

  return (
    <article>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Blog', url: '/blog' }, { label: page.title, url: `/blog/${page.slug}` }]} />
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{page.title}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Updated {new Date(page.updatedAt).toLocaleDateString()}
      </p>
      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </article>
  );
}
