# Public Site Routing

Status: **Implemented**. `frontend/src/routes/router.tsx` is the single
source of truth — read that file alongside this doc.

## Route table

| Path | Component | CMS-driven? | Notes |
| --- | --- | --- | --- |
| `/` | `CmsPageRoute slug="home"` | Yes | Home page, `template=HOME` |
| `/blog` | `BlogListPage` | Yes (lists `template=BLOG_POST` pages) | Tag filter via `?tag=`, pagination via `?page=` |
| `/blog/:slug` | `BlogDetailPage` | Yes | Reading time, related posts, share links |
| `/search` | `SearchPage` | Reads CMS data, not a CMS page itself | `?q=`, `?page=` |
| `/newsletter/unsubscribe` | `NewsletterUnsubscribePage` | No | `?token=` (Part 2) |
| `/status` | `SystemStatus` | No | Reused from Phase 1's bootstrap diagnostics screen |
| `/maintenance` | `Maintenance` | No | Static — must render without backend/DB |
| `/coming-soon` | `ComingSoon` | No | Static |
| `/:slug` | `CmsPageRoute` | Yes | Catch-all for every other marketing page (about, pricing, contact, faq, privacy, terms, cookies, careers, press, roadmap, release-notes, membership, features, solutions, partners, help) |
| `*` | `NotFound` | No | 404 — search box, home CTA, suggested pages |

Adding a new CMS-driven marketing page requires **no route change** —
only a new `Page` row at that slug (via the seed script or the
`content.manage`-gated admin API).

## Backend API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/cms/pages/:slug` | Public page read (+ `?preview=` token) |
| GET | `/api/v1/cms/blog` | Blog listing (`?tag=`, `?page=`, `?pageSize=`) |
| GET | `/api/v1/cms/navigation/:location` | `header` / `footer` / `mobile` nav tree |
| GET | `/api/v1/cms/announcements` | Active announcements |
| GET | `/api/v1/cms/faqs` | FAQ catalog, grouped by category |
| GET | `/api/v1/cms/search` | Search (`?q=`, `?page=`, `?pageSize=`) |
| POST | `/api/v1/cms/admin/pages` | Create page (auth + `content.manage`) |
| PATCH | `/api/v1/cms/admin/pages/:id` | Update page (auth + `content.manage`) |
| PATCH | `/api/v1/cms/admin/pages/:id/status` | Workflow transition (auth + `content.manage`) |
| POST | `/api/v1/cms/admin/pages/:id/preview-link` | Generate expiring preview token |
| GET | `/api/v1/cms/admin/pages/:id/versions` | Version history |
| POST | `/api/v1/contact` | Contact form submission |
| POST | `/api/v1/newsletter/subscribe` | Newsletter signup |
| POST | `/api/v1/newsletter/unsubscribe` | Safe token-based unsubscribe (Part 2) |
| GET | `/sitemap.xml` | Mounted at the app **root**, not `/api/v1` |
| GET | `/robots.txt` | Mounted at the app **root** |

## Lazy loading (Part 2)

Every route component except the always-available system pages
(404/Maintenance/Coming Soon/Status) is `React.lazy`-loaded with a
`Suspense` fallback of `PageSkeleton`. This keeps the initial JS bundle
to just the app shell (Header/Footer/MainLayout/router) — verified by
build output showing separate chunks per page
(`docs/public-site/ARCHITECTURE.md`'s Performance section).
