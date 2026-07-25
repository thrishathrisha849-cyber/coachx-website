import { useEffect } from 'react';

/**
 * Client-side `<head>` metadata management (002 FR-090). No new
 * dependency (e.g. react-helmet) — this Vite/CSR-SPA architecture means
 * metadata can only ever be set client-side regardless of the tool
 * used; see docs/public-site/TRACEABILITY.md's architecture-conflict
 * note for the honest limitation this implies for non-JS crawlers.
 * `sitemap.xml`/`robots.txt`, by contrast, ARE genuinely server-rendered
 * (see backend/src/cms/seo.controller.ts).
 */
export interface DocumentHeadOptions {
  title: string;
  description?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  noIndex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string | null | undefined): void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string | null | undefined): void {
  const selector = `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);

  if (!href) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentHead(options: DocumentHeadOptions): void {
  useEffect(() => {
    document.title = options.title;

    setMetaTag('name', 'description', options.description);
    setMetaTag('name', 'robots', options.noIndex ? 'noindex, nofollow' : null);

    setMetaTag('property', 'og:title', options.title);
    setMetaTag('property', 'og:description', options.description);
    setMetaTag('property', 'og:image', options.ogImageUrl);
    setMetaTag('property', 'og:type', 'website');

    setMetaTag('name', 'twitter:card', options.ogImageUrl ? 'summary_large_image' : 'summary');
    setMetaTag('name', 'twitter:title', options.title);
    setMetaTag('name', 'twitter:description', options.description);
    setMetaTag('name', 'twitter:image', options.ogImageUrl);

    setLinkTag('canonical', options.canonicalUrl);

    // Deliberately no cleanup on unmount — the NEXT page's own
    // useDocumentHead call overwrites every tag it cares about, and a
    // brief stale tag between route transitions is harmless (no crawler
    // observes intermediate SPA states).
  }, [options.title, options.description, options.canonicalUrl, options.ogImageUrl, options.noIndex]);
}

/** FR-091: JSON-LD structured data injection. */
export function useStructuredData(schema: Record<string, unknown> | null, key = 'primary'): void {
  useEffect(() => {
    const id = `structured-data-${key}`;
    document.getElementById(id)?.remove();

    if (!schema) return;

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [schema, key]);
}
