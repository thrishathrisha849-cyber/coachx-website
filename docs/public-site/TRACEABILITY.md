# Phase 5 Requirements Traceability

Maps 002-public-website-marketing-funnel's functional requirements to
Pages / API / Components / Tests / Documentation. Status legend:
**Implemented** · **Deferred** (explicitly out of scope, reason given) ·
**Partial**. Updated for Phase 5 Part 2 — rows changed since Part 1 are
marked "(Part 2)".

## Scope of Part 3

Part 3 is a stabilization/review pass, not new feature work: final
architecture-duplication review (found and fixed one genuine
duplication — `Header`/`Footer` each independently reimplemented
navigation-fetch state/effect logic, extracted to a shared
`useNavigation()` hook, `frontend/src/hooks/useNavigation.ts`), a
security-audit finding and fix (CMS preview tokens were stored raw
instead of hashed — inconsistent with every other bearer token in the
system; fixed, see `CMS_MODEL.md` and `SECURITY.md`), a stale-doc fix
(`SEO.md` still listed the Redirect-check endpoint as unimplemented
after Part 2 had already built it), the two previously-missing required
docs (`CONTENT_LIFECYCLE.md`, `API_REFERENCE.md`), and the full
validation suite (typecheck/lint/test/build across all workspaces,
Prisma format/validate/generate, fresh-checkout simulation, secret
scan). No new pages, blocks, or FRs were implemented in Part 3 — see
the Phase 5 Part 3 final report for the complete audit findings.

## Scope of Part 2

Part 2 completed the frontend polish, generic page renderer (2 new
block types: GALLERY, DOWNLOAD), Blog (category/tag filter, pagination,
reading time, publish date, related posts), Search (slug/summary
search, pagination, safe ranking, highlighting), Contact (honeypot spam
protection), Newsletter (safe token-based unsubscribe), SEO (duplicate
title/canonical/invalid-slug validation, Organization/WebSite schema),
accessibility (focus trap, reduced motion), a real XSS-sanitization
fix (DOMPurify, closing Part 1's documented gap), and the frontend test
suite (zero tests existed before Part 2). See
`docs/public-site/DECISION_GATES.md` for what remains deferred to a
future Part 3.

## Scope of Part 1 (unchanged)

Per the Phase 5 (Part 1) instructions — "Core Platform, Public Website,
Marketing Website, Landing Website, Navigation Foundation, SEO
Foundation, CMS Driven Public Pages," explicitly excluding LMS,
Community, Marketplace, CRM, AI, Admin Dashboard, Mobile UI — this part
implements:

- The CMS backend foundation (Page/PageBlock/PageVersion/Navigation/
  Announcement/Redirect/FAQ models and their read + minimal write APIs).
- The reusable layout/navigation/SEO frontend system.
- A generic, CMS-driven page renderer serving every static/marketing
  page in the brief's page list that does NOT require LMS/Community/
  Marketplace/Mentor/Event data (which don't exist yet).
- Working Contact and Newsletter capture (minimal, CRM-independent).

**Explicitly deferred to a later part** (not mentioned in this
message's scope, and each requires a feature not yet built): the seven
funnel journeys (FR-055–059), checkout/payment-state UI (FR-065–071),
A/B testing (FR-093–094), personalization (FR-072–074), campaign
attribution reporting (FR-097–098), email automation sequences beyond
the two minimal transactional sends this part needs (FR-099–100), and
every page requiring Program/Course/Community/Mentor/Event data
(004/005/007/010 — none implemented yet).

## Architecture conflict — reported per established Phase 4 precedent

Identical pattern to `docs/auth/TRACEABILITY.md` §1: `002/plan.md`
assumes Next.js (SSR/ISR, for "SEO-critical" server-rendered metadata)
and a NestJS backend module tree. The real, approved frontend (Phases
1–4) is a **Vite + React Router client-rendered SPA** (`frontend/src/`,
`react-router-dom`), and the backend is Express (`backend/src/`, no
`modules/` tree). This has a genuine, material consequence for FR-092
("System MUST server-render metadata") — a pure CSR SPA cannot
server-render `<head>` tags for crawlers that don't execute
JavaScript. Not silently worked around: `<title>`/meta tags are set
client-side (via a small `useDocumentHead` hook, no new heavy
dependency) which correctly serves JS-executing crawlers (Googlebot,
social-card fetchers that render JS) but not simple non-JS crawlers.
`sitemap.xml`/`robots.txt`, by contrast, ARE genuinely served
server-side by Express directly (`backend/src/routes/v1/seo.routes.ts`)
and are unaffected by this gap. Recorded in
`docs/public-site/DECISION_GATES.md` as an open item — true SSR would
require introducing a server-rendering framework, a decision beyond
this phase's scope to make unilaterally.

## Navigation & Global Components (FR-001–FR-010)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-001/002 | Desktop nav + dropdown sub-nav | Partial — nav is fully CMS-driven/data-modeled (not hardcoded) with mega-menu support; seeded top-level items are the ones this part can link to real routes (Home, About, Pricing, Blog, Contact, FAQ, Help). Programs/Courses/Community/Mentors/Events sub-menus are modeled and seedable but point at not-yet-built routes — deferred with 004/005/007/010. | `NavigationItem` model, `Header.tsx` |
| FR-003 | Mobile hamburger menu, scroll lock | Implemented | `MobileNav.tsx` |
| FR-004 | Sticky header, shrink-on-scroll | Implemented | `Header.tsx` |
| FR-005/006 | Announcement Bar, date-range, dismissal, priority | Implemented | `Announcement` model, `AnnouncementBar.tsx` |
| FR-007 | Logged-in header state (avatar, Dashboard) | **Deferred** — no frontend auth/session client exists yet (Phase 4 built backend auth only, no frontend login UI/token storage). Nav is structurally permission-aware (`NavigationItem.requiredPermission`) but always evaluates as a guest today. | `docs/public-site/DECISION_GATES.md` |
| FR-008 | Footer sections | Implemented (CMS-driven via `NavigationItem` location=FOOTER) | `Footer.tsx` |
| FR-009 | Global search | Partial (Part 2: pagination, safe ranking, highlighting, slug+summary search, no-draft-leakage all now implemented) — still searches Pages + FAQs only (Courses/Mentors/Events not built) | `search.service.ts`, `SearchPage.tsx` |
| FR-010 | Cookie consent banner, 4 categories, persisted | Implemented | `CookieConsentBanner.tsx`, `ConsentRecord` model |

## CMS & Page-Builder (FR-084–FR-089)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-084 | Content editable without code deploy | Partial — backend write API exists (`PATCH /api/v1/admin/cms/pages/:id`), gated by the new `content.manage` RBAC permission; no admin UI (explicitly out of scope: "Do not implement admin CMS editor") | `page.controller.ts` |
| FR-085 | Block types | Partial — Hero/Text/Image/**Gallery (Part 2)**/CTA/Features/Stats/Testimonials/FAQ/Timeline/Team/LogoStrip/Form/**Download (Part 2)**/Spacer/Divider implemented; Video implemented as a data shape (player itself is a thin wrapper, no analytics/full-screen polish); Pricing renders static admin-entered plan data (no live entitlement — 001/009 not built); Programs/Courses/Events/Mentors/CustomHTML render an explicit "coming soon" placeholder (data owned by unbuilt features; Custom HTML remains deliberately restrictive pending a sanitization decision — see decision gates; TEXT block IS now sanitized via DOMPurify as of Part 2) | `PageBlockType` enum, `blocks.tsx` |
| FR-086 | Page settings (slug, SEO, audience, dates, etc.) | Implemented | `Page` model |
| FR-087 | Draft→Review→Approved→Scheduled→Published→Archived | Implemented | `PageStatus` enum |
| FR-088 | Version retention, restore, comparison, editor identity | Partial — every update snapshots a `PageVersion` (editor, timestamp, diff-able JSON); a restore endpoint exists; a UI comparison view does not (no admin UI, per scope) | `PageVersion` model, `page-version.service.ts` |
| FR-089 | Preview (viewport/audience contexts) | Partial — a `?preview=<token>` mode lets a non-published page render via a short-lived, expiring preview token (FR-105); viewport/audience simulation is a frontend-UI concern with no admin editor to drive it from, deferred | `preview.service.ts` |

## SEO (FR-090–FR-092)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-090 | Per-page title/description/canonical/OG/Twitter/structured-data/breadcrumb/sitemap/robots/alt-text | Implemented (client-side metadata — see architecture-conflict note above) | `useDocumentHead.ts`, `Page` model's SEO fields |
| FR-091 | Structured data (Organization/Website/Breadcrumb/FAQ/Article/Person) | Partial — Organization/WebSite **(Part 2, global, `OrganizationSchema.tsx`)**/Breadcrumb/FAQPage/Article implemented (the ones this part's page types need); Course/Event/PodcastEpisode/Product/Review/Person schemas deferred with their owning features | `useStructuredData`, `OrganizationSchema.tsx` |
| FR-092 | Server-rendered metadata, clean URLs, redirects, sitemap, image sitemap, lazy-load, Core Web Vitals monitoring, no duplicate-query-param indexing, **duplicate-title/canonical/invalid-slug validation (Part 2)** | Partial — see architecture-conflict note; redirects/sitemap/robots ARE server-side (Express); duplicate-title/duplicate-canonical/invalid-slug validation implemented as an operational script (Part 2); Core Web Vitals monitoring deferred (needs an RUM provider, none configured) | `seo.controller.ts`, `seo-validation.service.ts`, `scripts/validate-seo.ts` |

## Content Hub — the subset this part builds (FR-048–054)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-049/050 | Blog listing + detail, full SEO, **category/tag filter, pagination, reading time, publish date, related posts (Part 2)** | Implemented (Blog posts modeled as `Page` with `template = BLOG_POST`; tags via `Page.tags` scalar array; related posts = shared-tag lookup; reading time estimated from TEXT-block word count) | `BlogListPage.tsx`, `BlogDetailPage.tsx`, `readingTime.ts` |
| FR-053 | Contact page, form, ticket-like record, confirmation email, spam protection **(honeypot foundation, Part 2)** | Implemented (minimal — creates a `ContactSubmission`, not a full CRM ticket with SLA/ownership, since 013 CRM isn't built; confirmation via Phase 4's `email.port.ts`; rate-limited; honeypot field silently no-ops a bot submission) | `contact.controller.ts`, `ContactSubmission` model, `HoneypotField.tsx` |
| FR-054 | Help Center | **Deferred** — needs a real article/voting/ticketing system beyond generic CMS pages; a placeholder route exists, content deferred | `docs/public-site/DECISION_GATES.md` |
| FR-048 | Success Stories | **Deferred** — depends on verified-member-outcome data this part has no source for | — |
| FR-051/052 | Podcast, Resource Library | **Deferred** — no audio-hosting/gating infrastructure built yet | — |

## Responsive / Error / Form / CTA (FR-078–083, FR-108, FR-115, FR-116)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-078/079 | Responsive breakpoints, mobile/desktop layout rules | Implemented (Tailwind, existing Phase 1 config) | `blocks/*.tsx`, `Header.tsx` |
| FR-080 | Loading/Empty/Error/Offline/Maintenance/404/500 states | Partial — Loading (skeleton), **Empty (Part 2, generic `EmptyState.tsx`, applied to Blog/Search)**, Error, 404 (upgraded Part 1 with search/suggestions), 500, Maintenance implemented; Offline-specific banner deferred (no service-worker/offline-cache infrastructure exists) | `Skeleton.tsx`, `EmptyState.tsx`, `ErrorPage.tsx`, `NotFound.tsx`, `ServerError.tsx`, `Maintenance.tsx` |
| FR-081/082 | Form validation, inline errors, duplicate-submit prevention | Implemented (Contact + Newsletter forms; the generic Form block reuses the same validation pattern) | `ContactForm.tsx`, `NewsletterForm.tsx` |
| FR-083 | One primary CTA per section, action-based labels | Implemented as a content convention enforced by the block schema (single `primaryCta` field per block, not multiple) | `PageBlock` data shapes |
| FR-108 | Accessibility (labels, keyboard nav, focus, alt text, reduced motion) | Implemented — **focus trap + focus restoration in MobileNav dialog and reduced-motion global CSS added in Part 2**; verified via `jest-axe` automated checks across every major component (Part 2 test suite) | `useFocusTrap.ts`, `MobileNav.tsx`, `styles/index.css`, `test/a11y.ts` |
| FR-115 | No stack traces on error surfaces | Implemented | `ErrorPage.tsx`, backend error handler (Phase 2, unchanged) |
| FR-116 | Standard error codes | Partial — the subset relevant to this part's forms (`INVALID_FORM`, `RATE_LIMITED`, `SERVER_ERROR`); funnel-specific codes (`EVENT_FULL`, `COUPON_EXPIRED`, etc.) deferred with their owning features | `public-error-codes.ts` |

## Consent & Security (FR-101–105)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-101/102 | Per-channel, versioned consent, never combined | Implemented (`ConsentRecord`, reused by Contact + Newsletter + cookie banner) | `ConsentRecord` model |
| FR-103 | HTTPS/headers/CSRF/rate-limit/bot/spam/sanitization | Implemented — reuses Phase 2's Helmet/CORS and Phase 4's rate-limit middleware pattern; input sanitization via Zod; **HTML sanitization via DOMPurify (Part 2, closes Part 1's documented gap)**; **honeypot bot-protection foundation (Part 2)**; CSRF n/a (no cookie-based auth, per Phase 4's documented token-transport decision) | `sanitizeHtml.ts`, `HoneypotField.tsx` |
| FR-104 | Tokenized payment, webhook signature verification | **N/A to this part** — no payment integration in Phase 5 | — |
| FR-105 | Admin preview links expire | Implemented | `page.service.ts` (`generatePreviewLink`) |

## Anti-dark-pattern (FR-111–114, Constitution Article III)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-111 | No fabricated trust metrics | Implemented as a schema constraint — the Stats block requires a `sourceNote` field; nothing renders without one | `StatsBlock.tsx` |
| FR-112 | No false countdowns | **N/A to this part** (no funnel/offer pages yet) | — |
| FR-113 | Verified-status + disclaimer on outcome claims | **N/A to this part** (Success Stories/Testimonials with outcome claims deferred; Testimonials block implemented here carries no income/result claims) | — |
| FR-114 | No "buy" CTA for already-owned product | **N/A to this part** (no entitlement data — 001/009 not built) | — |

## Newsletter (page list's "Newsletter" item; FR-008's footer signup)

| Requirement | Status | Where |
| --- | --- | --- |
| Duplicate-safe subscription | Implemented (upsert by normalized email) | `newsletter.service.ts` |
| Email normalization | Implemented (`.trim().toLowerCase()`) | `newsletter.service.ts` |
| Consent timestamp + source tracking | Implemented (`ConsentRecord`, source=`newsletter_signup`) | `cms.repository.ts` |
| Safe unsubscribe strategy (Part 2) | Implemented — token-based (hashed, per-subscriber), not email-based; idempotent | `NewsletterSubscriber.unsubscribeTokenHash`, `unsubscribeFromNewsletter()` |
| Validation, rate limiting | Implemented (Zod + `newsletterRateLimiter`) | `cms.validation.ts`, `cms-rate-limit.middleware.ts` |
| Production email provider | **Explicitly not connected** — uses Phase 4's dev/test `EmailPort` adapters only, per this brief's own instruction | `email.port.ts` |

## Key Entities implemented across Phase 5

`Page`, `PageVersion`, `PageBlock`, `NavigationItem`, `Announcement`,
`Redirect`, `FaqEntry`, `ConsentRecord`, `ContactSubmission`,
`NewsletterSubscriber` (Part 2: added `unsubscribeTokenHash`). See
`docs/public-site/CMS_MODEL.md` for the full schema rationale and
`docs/public-site/DECISION_GATES.md` for every explicitly deferred
entity (Lead, Campaign, Checkout Session, Experiment, Testimonial with
verification, Success Story, Podcast Episode, Resource, Redirect's
richer analytics).
