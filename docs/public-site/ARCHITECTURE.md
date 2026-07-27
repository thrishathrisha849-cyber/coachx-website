# Public Site Architecture

Status: **Implemented**. Covers both Phase 5 Part 1 (CMS backend
foundation, layout shell) and Part 2 (frontend polish, block renderer
completion, search/blog/contact/newsletter completion).

## Layer overview

```
frontend/src/
├── api/cms.api.ts                 Typed fetch functions — the ONLY place components call the backend
├── types/cms.types.ts             Frontend mirror of backend response shapes
├── hooks/
│   ├── useDocumentHead.ts          SEO <head> management (client-side — see "Architecture conflict" below)
│   ├── useCookieConsent.ts         Cookie-category consent state (localStorage)
│   ├── useFocusTrap.ts             Dialog focus trapping (Part 2)
│   └── useNavigation.ts            Nav-tree fetch by location (Part 3 — extracted from duplicated Header/Footer logic)
├── components/
│   ├── layout/                     Header, Footer, MobileNav, AnnouncementBar, CookieConsentBanner, Breadcrumbs, OrganizationSchema, MainLayout
│   ├── cms-blocks/                 BlockRenderer + one render function per PageBlockType
│   ├── forms/                      ContactForm, NewsletterForm, HoneypotField
│   └── system/                     Skeleton, EmptyState, ErrorPage, ErrorBoundary, NotFound, ServerError, Maintenance, ComingSoon, Pagination
├── pages/                          CmsPageRoute (generic), BlogListPage, BlogDetailPage, SearchPage, NewsletterUnsubscribePage
├── utils/                          sanitizeHtml.ts, url.ts, readingTime.ts, cn.ts
└── routes/router.tsx               Central route table, lazy-loaded page components

backend/src/cms/
├── cms.types.ts / cms.validation.ts / block-schemas.ts
├── cms.repository.ts                Prisma data access — no business logic
├── page.service.ts                  Publish workflow, versioning, preview links
├── navigation.service.ts / announcement.service.ts / faq.service.ts
├── search.service.ts                 Ranking + highlighting (Part 2)
├── seo.service.ts / seo-validation.service.ts (Part 2) / seo.controller.ts
├── contact.service.ts / newsletter.service.ts (+ unsubscribe, Part 2)
├── cache-control.middleware.ts (Part 2) / cms-rate-limit.middleware.ts
├── cms.controller.ts / admin-cms.controller.ts / contact.controller.ts
```

## Request flow (public read)

```
Browser → api/cms.api.ts (axios) → backend/src/routes/v1/cms.routes.ts
        → [cacheControl, authenticateOptional] → cms.controller.ts
        → page.service.ts / search.service.ts / etc. → cms.repository.ts → Prisma
```

## Architecture conflict — reported, not silently resolved

`002/plan.md` assumes Next.js (SSR/ISR) and a NestJS backend module
tree. The real, approved stack (Phases 1–4, unchanged by Phase 5) is a
**Vite + React Router client-rendered SPA** and an **Express** backend
with no `modules/` tree. Consequence for FR-092 ("server-render
metadata"): `<head>` tags are set client-side
(`useDocumentHead`) — correct for JS-executing crawlers, not for
crawlers that never run JavaScript. `sitemap.xml`/`robots.txt` ARE
genuinely server-rendered (Express serves them directly, no client JS
involved) and are unaffected. See
`docs/public-site/DECISION_GATES.md` #1.

## Why a generic `CmsPageRoute` instead of one component per page

The brief's page list (Home, About, Pricing, Membership, Features,
Solutions, Partners, Contact, FAQ, Privacy, Terms, Cookies, Careers,
Press, Roadmap, Release Notes, etc.) is ~20 pages. Building 20 bespoke
React components would both violate "CMS Driven Public Pages" (content
must be admin-editable, not hardcoded in component JSX) and be a large,
low-value duplication of effort. Instead: ONE route
(`CmsPageRoute.tsx`) fetches a `Page` by slug and renders its
`PageBlock`s through `BlockRenderer` — adding a new marketing page is a
`Page` row (via seed script or the admin write API), not a code change.
Blog gets dedicated components (`BlogListPage`/`BlogDetailPage`)
because it needs list pagination/filtering and article-specific chrome
(reading time, related posts) beyond generic block rendering. System
pages (404/500/Maintenance/Coming Soon) are static components since
they must render regardless of backend/CMS/database state.

## Performance decisions (Part 2)

- **Route-level code splitting**: every page component is
  `React.lazy`-loaded (`router.tsx`) — the initial bundle only includes
  the app shell; each route's code (and `BlockRenderer`'s 48KB chunk,
  which includes DOMPurify) loads on navigation.
- **Cache-Control on public GET endpoints**: `public, max-age=60,
  stale-while-revalidate=300` with `Vary: Authorization` (see
  `cache-control.middleware.ts`) — short enough that a publish/update
  is reflected within about a minute, long enough to meaningfully
  reduce redundant fetches.
- **Concurrent DB queries**: pagination (`paginate()`, Phase 3) and
  search (`Promise.all` across Page/FAQ) run count/fetch queries
  concurrently, not sequentially.

## What is NOT built (see docs/public-site/DECISION_GATES.md)

Funnels, checkout/payment-state UI, A/B testing, personalization,
campaign attribution, Help Center, Success Stories, Podcast, Resource
Library, and every page requiring Program/Course/Community/Mentor/Event
data (004/005/007/010 — none implemented yet).
