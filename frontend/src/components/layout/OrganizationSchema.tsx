import { useStructuredData } from '@/hooks/useDocumentHead';
import { env } from '@/config/env';

/**
 * 002 FR-091: Organization + Website structured data, emitted once
 * globally (not per-page) — every page on the site represents the same
 * organization. Rendered from `MainLayout` so it's present on every
 * route without each page needing to remember to include it.
 */
export function OrganizationSchema() {
  useStructuredData(
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: env.appName,
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
    'organization',
  );

  useStructuredData(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: env.appName,
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
    'website',
  );

  return null;
}
