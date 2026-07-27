# SEO Implementation

Status: **Implemented** for everything below except where marked.

## Per-page metadata (client-side — see ARCHITECTURE.md's conflict note)

`useDocumentHead(options)` sets, on every route change:

- `document.title`
- `<meta name="description">`
- `<meta name="robots" content="noindex, nofollow">` (only when `noIndex: true`)
- `<meta property="og:title/description/image/type">`
- `<meta name="twitter:card/title/description/image">` (card type is
  `summary_large_image` when an OG image is present, else `summary`)
- `<link rel="canonical">`

Every `CmsPageRoute`/`BlogDetailPage`/`SearchPage` call site supplies
these from the `Page` model's own SEO fields
(`seoTitle`/`seoDescription`/`canonicalUrl`/`ogImageUrl`/`noIndex`).

## Structured data (JSON-LD)

`useStructuredData(schema, key)` injects a `<script
type="application/ld+json" id="structured-data-{key}">` tag, removed on
unmount or when the schema changes.

| Schema | Where | Scope |
| --- | --- | --- |
| `Organization` | `OrganizationSchema.tsx`, rendered once globally in `MainLayout` | Every page |
| `WebSite` | `OrganizationSchema.tsx` | Every page |
| `WebPage` | `CmsPageRoute.tsx` | Every generic CMS page |
| `Article` | `BlogDetailPage.tsx` | Blog posts — includes `datePublished` (from `Page.publishAt`) and `dateModified` |
| `BreadcrumbList` | `Breadcrumbs.tsx` | Blog listing/detail |
| `FAQPage` | `FaqAccordion.tsx` | FAQ page/block |

Deferred (owning feature not built): `Course`, `Event`,
`PodcastEpisode`, `Product`, `Review`, `Person`.

## Server-rendered SEO (genuinely, not client-side)

- `GET /sitemap.xml` — generated from every `PUBLISHED`, non-`noIndex`
  page, with per-language URL prefix (`/en/`, `/ta/`). Served at the
  domain root by Express, not `/api/v1`.
- `GET /robots.txt` — `Allow: /`, `Disallow: /admin/` and `/api/`,
  points at the sitemap.
- `Redirect` model + `GET /api/v1/cms/redirects/check?path=` — 301/302
  URL-to-URL mapping for broken-link/SEO management, consulted by the
  frontend's `CmsPageRoute` on a 404 page lookup BEFORE rendering the
  404 page. This is an explicit extra API call on the 404 path, not a
  transparent HTTP-layer redirect — the SPA architecture has no
  server-side URL-rewrite step a traditional server-rendered app would
  have. External redirect targets navigate via `window.location`, never
  `navigate()`, and are classified through the same `isExternalUrl`
  open-redirect guard used elsewhere (see `docs/public-site/SECURITY.md`).

## Validation (Phase 5 Part 2)

`backend/src/cms/seo-validation.service.ts`'s
`validateSeoAcrossPublishedPages()` scans every `PUBLISHED` page and
reports:

- **Duplicate titles** — two pages with the same effective title
  (`seoTitle ?? title`, case-insensitive).
- **Duplicate canonical URLs** — two pages with the same
  `canonicalUrl` (case-insensitive).
- **Invalid slugs** — a slug that doesn't match the enforced pattern
  (`^[a-z0-9]+(?:-[a-z0-9]+)*$`); defense-in-depth only, since the
  create/update API already rejects a malformed slug via Zod at input
  time — this catches drift from any future write path that bypasses
  that validation.

Run via `npm run validate:seo --workspace=backend` (see
`backend/scripts/validate-seo.ts`) — an operational check, not wired to
a public route (duplicate-detection requires scanning the whole
published-page set, the wrong cost to pay on every page render).

## What is deferred

- True server-side rendering of `<head>` tags (architecture conflict,
  see `docs/public-site/DECISION_GATES.md` #1).
- Core Web Vitals / Real User Monitoring (no RUM provider configured).
- Image sitemap (only the page sitemap is implemented).
- No-duplicate-query-param-indexing enforcement (no query-param-heavy
  pages exist yet to need it — funnels/checkout, which would introduce
  UTM-tagged query params, are deferred).
