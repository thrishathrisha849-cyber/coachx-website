# Public Site & CMS API Reference

Status: **Implemented**. Source of truth is
`backend/src/routes/v1/cms.routes.ts` and `backend/src/cms/*.validation.ts`
— this document is a human-readable mirror of those files, not a
separate spec; if the two ever disagree, the code wins and this file
needs updating. Every response uses the platform-wide envelope
(`@coachx/shared`'s `ApiSuccessResponse`/`ApiErrorResponse`, unchanged
since Phase 1) — no CMS-specific response shape was invented.

## Response envelope

```jsonc
// Success
{ "success": true, "data": <T>, "meta"?: { ... } }

// Paginated success (blog list, search)
{ "success": true, "data": [<T>], "meta": { "page": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Page not found", "details"?: <unknown> } }
```

All Zod validation failures are surfaced through the shared `validate()`
middleware as a `400 VALIDATION_ERROR` with per-field `details` — the
same pattern Phase 4's auth routes already established; CMS routes
introduce no separate validation-error shape.

## Public reads

### `GET /api/v1/cms/pages/:slug`

Fetch a single page for rendering.

| | |
| --- | --- |
| Auth | `authenticateOptional` — works with or without a token (structurally ready for future permission-aware content; see Deferred) |
| Query | `language` (`EN`\|`TA`\|`TANGLISH`, default `EN`), `preview` (raw preview token, optional) |
| Cache | `Cache-Control: public, max-age=60, stale-while-revalidate=300`, `Vary: Authorization` |
| 404 | Page doesn't exist, isn't `PUBLISHED`, is outside its `publishAt`/`expireAt` window, or `preview` token is invalid/expired/mismatched slug |

Response `data`: `RenderedPage` — `id`, `slug`, `language`, `template`,
`status`, `title`, `seo: { title, description, canonicalUrl,
ogImageUrl, noIndex }`, `tags`, `headerVisible`, `footerVisible`,
`blocks: [{ id, type, order, data }]` (visible blocks only, ordered),
`publishAt`, `updatedAt`.

### `GET /api/v1/cms/blog`

Blog listing.

| | |
| --- | --- |
| Auth | None |
| Query | `language` (optional), `tag` (optional, filters `Page.tags` array-contains), `page`, `pageSize` |
| Cache | Same as above |

Response: paginated `RenderedPage[]` (blocks omitted — list view only).

### `GET /api/v1/cms/navigation/:location`

Navigation tree for one location.

| | |
| --- | --- |
| Auth | `authenticateOptional` |
| Params | `location` — `header` \| `footer` \| `mobile` (case-insensitive, uppercased server-side) |
| Cache | Same as above |

Response `data`: `NavTreeNode[]` — nested tree built from the flat
`NavigationItem` table (`id`, `label`, `url`, `isExternal`,
`megaMenuColumn`, `children: NavTreeNode[]`).

### `GET /api/v1/cms/announcements`

Active (date-range-visible) announcement banners. Auth: none. No query
params — visibility is computed entirely server-side from each
announcement's start/end dates, so there is nothing for a caller to
parameterize.

### `GET /api/v1/cms/faqs`

Full FAQ catalog, grouped by category. Auth: none, no params.

### `GET /api/v1/cms/search`

| | |
| --- | --- |
| Auth | None |
| Rate limit | 30/min per IP (`searchRateLimiter`) |
| Query | `q` (2–100 chars, **required** — shorter is a 400), `page`, `pageSize` |

Response: paginated array of `{ type: 'page' | 'faq', title, slug/id,
url, snippet: HighlightSegment[], score }`. `snippet` is **structured**
segments (`{ text, highlight: boolean }[]`), never raw HTML — the
frontend never needs `dangerouslySetInnerHTML` to render a highlighted
search result. Searches `Page` (slug/title/seoDescription) and
`FaqEntry` (question/answer), `PUBLISHED`-only, combined and ranked in
application code (see `docs/public-site/SEO.md` and the Search Review
section of the Phase 5 Part 3 report for ranking details).

### `GET /api/v1/cms/redirects/check`

| | |
| --- | --- |
| Auth | None |
| Query | `path` — **must** be root-relative (`^\/[^\s]*$`), rejecting any full URL or protocol-relative path as a 400 (open-redirect guard at the API boundary) |
| 404 | No redirect configured for the given `path` (`AppError.notFound`) |
| 200 | `data`: the matched redirect record (target path/URL and status code) |

Consulted by the frontend's `CmsPageRoute` on a 404 page lookup
**before** rendering the 404 page — see `docs/public-site/SEO.md`.

## Admin writes (backend foundation only — no editor UI)

All routes below require `authenticate` (a valid access token) **and**
`requirePermission('content.manage')` (002 FR-084) — the deny-by-default
RBAC gate established in Phase 4, reused unchanged, not a
CMS-specific permission system.

### `POST /api/v1/cms/admin/pages`

Create a page (starts in `DRAFT`). Body: see `createPageSchema`
(`slug`, `language`, `template`, `title`, SEO fields, `tags`,
`audienceRoles`, `headerVisible`/`footerVisible`, `publishAt`/
`expireAt`, `blocks[]`). Each block's `data` is validated against its
type's Zod schema (`block-schemas.ts`) — an invalid block shape is a
`400` naming the offending block's type and order, not a generic
failure. Creates the first `PageVersion` (version 1) and an
`cms.page.created` audit event in the same transaction.

### `PATCH /api/v1/cms/admin/pages/:id`

Partial update (any subset of the create body's fields). If `blocks`
is supplied, it **replaces** the full block set (not a merge/patch of
individual blocks). Always appends a new `PageVersion` snapshot and a
`cms.page.updated` audit event — even for metadata-only changes, per
FR-088's "every update snapshots a new, non-destructive version."

### `PATCH /api/v1/cms/admin/pages/:id/status`

Body: `{ status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' }`.
Rejected with `400` if the transition isn't in `VALID_TRANSITIONS` —
see `docs/public-site/CONTENT_LIFECYCLE.md` for the full table. Records
a `cms.page.status_changed` audit event with `beforeState`/`afterState`.

### `POST /api/v1/cms/admin/pages/:id/preview-link`

No body. Generates a new preview token (invalidating any prior one for
this page), returns `{ token, expiresAt }` — `token` is the **raw**
value; only its hash is persisted (`Page.previewTokenHash`, see
`CMS_MODEL.md`'s Part 3 hardening note). Build the preview URL as
`/<slug>?preview=<token>`.

### `GET /api/v1/cms/admin/pages/:id/versions`

Returns the full `PageVersion` history for a page, newest first — data
only, no restore action (see `CONTENT_LIFECYCLE.md`'s Known Gaps).

## Contact & Newsletter

Mounted separately, not nested under `/cms` (see `router` exports in
`cms.routes.ts` — `contactRouter`/`newsletterRouter`).

### `POST /api/v1/contact`

| | |
| --- | --- |
| Rate limit | 5/15min per IP |
| Body | `name`, `email`, `phone?`, `department` (enum), `message`, `consent: true` (required literal), `website?` (honeypot — see below) |

A filled `website` field is a **silent no-op**: the endpoint returns
the same `200` success response as a genuine submission, but no
`ContactSubmission` row is created and no email is sent — a bot that
auto-fills every field cannot distinguish "caught by honeypot" from
"succeeded," which is the point (a distinguishable rejection would let
a bot learn to leave that field empty). A genuine submission creates a
`ContactSubmission`, records a `ConsentRecord`, and sends a
confirmation email via the `EmailPort` abstraction (Phase 4's
`DevEmailAdapter` in non-production).

### `POST /api/v1/newsletter/subscribe`

| | |
| --- | --- |
| Rate limit | 5/15min per IP |
| Body | `email`, `consent: true`, `website?` (honeypot, same silent-no-op behavior as Contact) |

Duplicate-safe (re-subscribing an already-subscribed, normalized email
is idempotent, not a second row or an error). Records a
`ConsentRecord` (channel `MARKETING_EMAIL`) with timestamp and source.

### `POST /api/v1/newsletter/unsubscribe`

| | |
| --- | --- |
| Rate limit | 5/15min per IP |
| Query | `token` (raw unsubscribe token from the confirmation email) |

**Deliberately not email-based** — there is no `?email=` variant of
this endpoint. An email-only unsubscribe would let anyone unsubscribe
anyone else whose email address they merely know; the token is hashed
at rest (`NewsletterSubscriber.unsubscribeTokenHash`) and the raw value
only ever existed in the one email it was sent in. Invalid/already-used
tokens return a `404`, not a `400` — this is a lookup failure, not a
malformed-request failure.

## Root-mounted (not under `/api/v1`)

| Route | Purpose |
| --- | --- |
| `GET /sitemap.xml` | Generated from every `PUBLISHED`, non-`noIndex` page, per-language URL prefix |
| `GET /robots.txt` | `Allow: /`, `Disallow: /admin/` and `/api/`, points at the sitemap |

Mounted at the domain root deliberately (`backend/src/app.ts`) — these
are crawler-facing conventions with fixed, well-known URLs; nesting
them under `/api/v1` would break every SEO tool and crawler's
assumption about where to find them.

## Deferred / not built

- No `DELETE` route for a `Page` — see `CONTENT_LIFECYCLE.md`'s Archive
  Behavior section (deliberately conservative, not an oversight).
- No admin routes for `NavigationItem`/`Announcement`/`Redirect`/
  `FaqEntry` CRUD — only `Page` has an admin write path in this phase;
  the other CMS entities are seed-script-managed
  (`database/seeds/cms.seed.ts`) until an admin editor exists to manage
  them through the API. **Future Feature Owner**: the (not-yet-built)
  admin CMS editor.
- No bulk/batch endpoints (e.g. bulk status transition, bulk tag
  assignment) — every admin write is single-resource; not requested by
  this phase's scope.
- `authenticateOptional` on public reads is structurally ready to
  return permission-filtered content per `req.user?.roles` (see
  `Page.audienceRoles`, `NavigationItem`'s equivalent), but no frontend
  auth/session client exists yet, so every caller today evaluates as
  guest. **Future Feature Owner**: the frontend login/session work that
  would consume Phase 4's already-built backend auth.
