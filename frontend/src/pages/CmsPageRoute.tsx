import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPageBySlug, checkRedirect } from '@/api/cms.api';
import type { CmsPage } from '@/types/cms.types';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { ErrorPage } from '@/components/system/ErrorPage';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';
import { isExternalUrl } from '@/utils/url';

/**
 * The single generic route that serves every CMS-driven marketing page
 * (Home, About, Pricing, Contact chrome, FAQ, Privacy, Terms, Cookies,
 * Careers, Press, Status, Roadmap, Release Notes — see
 * docs/public-site/TRACEABILITY.md). Fetches a `Page` by slug and
 * renders its blocks via `BlockRenderer` — no per-page React component
 * is needed for content that is fully CMS-driven.
 *
 * Phase 5 Part 2: on a 404 page lookup, checks for a configured
 * `Redirect` before falling back to the 404 page (002 FR-092 "manage
 * redirects, including 301 support" — see docs/public-site/SEO.md for
 * why this is an explicit extra check rather than a transparent HTTP
 * redirect in this SPA architecture). An external redirect target uses
 * a real browser navigation (`window.location`), never
 * `navigate()` — `isExternalUrl` classification prevents an
 * admin-misconfigured or compromised `Redirect` row from silently
 * becoming an open-redirect vector through client-side routing.
 */
export function CmsPageRoute({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      .catch(async (err: NormalizedApiError) => {
        if (cancelled) return;

        if (err.status === 404) {
          const redirect = await checkRedirect(`/${slug}`);
          if (cancelled) return;

          if (redirect) {
            if (isExternalUrl(redirect.toPath)) {
              window.location.href = redirect.toPath;
            } else {
              navigate(redirect.toPath, { replace: true });
            }
            return;
          }
        }

        setStatus(err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
