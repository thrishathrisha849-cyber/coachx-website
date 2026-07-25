import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchPageBySlug } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { ErrorPage } from '@/components/system/ErrorPage';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';

/**
 * The single generic route that serves every CMS-driven marketing page
 * (Home, About, Pricing, Contact chrome, FAQ, Privacy, Terms, Cookies,
 * Careers, Press, Status, Roadmap, Release Notes — see
 * docs/public-site/TRACEABILITY.md). Fetches a `Page` by slug and
 * renders its blocks via `BlockRenderer` — no per-page React component
 * is needed for content that is fully CMS-driven.
 */
export function CmsPageRoute({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const slug = fixedSlug ?? params.slug ?? 'home';
  const previewToken = searchParams.get('preview') ?? undefined;

  const [page, setPage] = useState<CmsPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchPageBySlug(slug, previewToken)
      .then((result) => {
        if (cancelled) return;
        setPage(result);
        setStatus('ready');
      })
      .catch((err: NormalizedApiError) => {
        if (cancelled) return;
        setStatus(err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug, previewToken]);

  useDocumentHead({
    title: page ? `${page.seo.title}` : 'Loading… | CoachX',
    description: page?.seo.description,
    canonicalUrl: page?.seo.canonicalUrl,
    ogImageUrl: page?.seo.ogImageUrl,
    noIndex: page?.seo.noIndex ?? true,
  });

  useStructuredData(
    page
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: page.title,
          description: page.seo.description ?? undefined,
        }
      : null,
    'page',
  );

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'not-found') return <NotFound />;
  if (status === 'error') {
    return <ErrorPage code="ERROR" heading="Couldn't load this page" message="Please try again in a moment." />;
  }

  return (
    <div>
      {page!.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
