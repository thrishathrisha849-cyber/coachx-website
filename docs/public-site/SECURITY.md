# Public Site Security Review

Status: a focused review against the Phase 5 Part 2 §"SECURITY"
checklist, following the same "state the mitigation and its actual
implementation, or name the gap honestly" discipline as
`docs/auth/THREAT_MODEL.md`.

## No XSS / No HTML injection / Safe rich text

**Mitigated.** The only place CMS-authored content is rendered as HTML
(rather than as React text/props) is the `TEXT` block, and it is
sanitized through DOMPurify with a narrow allowlist
(`utils/sanitizeHtml.ts`): structural/text-formatting tags only (`p`,
`strong`, `em`, headings, lists, `a`, `blockquote`, `code`, `pre`,
`hr`, `span`); no `<script>`, no inline event handlers, no `<iframe>`/
`<object>`/`<embed>`, no `style` attribute, no `javascript:`/`data:`
URLs. Verified directly by 8 unit tests
(`utils/__tests__/sanitizeHtml.test.ts`) asserting each of these is
actually stripped, plus a `BlockRenderer` test confirming a `<script>`
tag injected via a TEXT block's `body` never reaches the live DOM.
`CUSTOM_HTML` remains a placeholder (renders "coming soon", never the
admin-supplied HTML) specifically because it has no equivalent
sanitization decision made yet — see Decision Gates.

## Safe markdown rendering

**N/A as currently scoped.** No markdown parser is used anywhere in
this phase — the `TEXT` block accepts (sanitized) HTML directly, not
markdown. If a markdown authoring path is added later, it MUST render
through the same `sanitizeRichText()` after markdown-to-HTML
conversion, not bypass it.

## Safe external links

**Mitigated.** Every external link (CTA blocks, header mega-menu,
footer, mobile nav, sanitized rich-text anchors) gets
`target="_blank" rel="noopener noreferrer"` — `noopener` prevents
reverse-tabnabbing (the linked page gaining a `window.opener` reference
back to the original tab), `noreferrer` additionally suppresses the
`Referer` header. Classification uses a single shared helper
(`utils/url.ts`'s `isExternalUrl`), not a naive `^https?://` check —
see the next section for why that distinction matters.

## Open redirect prevention

**Mitigated.** `isExternalUrl()` treats anything that is NOT an
unambiguous root-relative path (`/foo`) as external — including
**protocol-relative URLs** (`//evil.com`), which a naive `^https?://`
check would miss and which `<Link to="//evil.com">` would otherwise
render as a same-origin-looking link that actually navigates off-site.
Verified directly by a dedicated unit test
(`utils/__tests__/url.test.ts`, "treats a protocol-relative URL... as
external — the classic open-redirect gap"). The same guard applies to
the Part 2 redirect-check feature: the backend's
`checkRedirectSchema` rejects any non-root-relative `path` query value
at the API boundary (`^\/[^\s]*$`), and the frontend routes an external
redirect target through `window.location`, never client-side `navigate()`.

## No draft exposure

**Mitigated.** `getPublicPage()` (`page.service.ts`) only ever returns
a page when `status === 'PUBLISHED'` AND within its publish/expire
window — enforced in code, not just by convention. Search
(`search.service.ts`) filters `status: 'PUBLISHED'` at the query level.
Both verified directly by integration tests: "serves a DRAFT page via a
valid, unexpired preview token but not without one" and "never leaks a
DRAFT page in results, even when its title matches exactly." The one
sanctioned bypass — the preview-token mechanism (FR-089/FR-105) — is
itself expiring, single-page-scoped, and only reachable by someone
holding a `content.manage`-gated, explicitly-generated token.

## Preview leakage (Part 3 audit finding — fixed)

**Found and mitigated during this audit.** `Page.previewToken` was
originally stored **raw** (not hashed) — an inconsistency with the
hashed-token pattern used for every other bearer-style token in the
system (password reset, email verification, newsletter unsubscribe).
A database read (backup leak, misconfigured replica, etc.) would have
exposed working preview links directly. Fixed by renaming the column
to `previewTokenHash` and hashing before both storage and lookup
(`hashToken()`, same helper the other three flows already use) — see
`docs/public-site/CMS_MODEL.md`. The actual exposure this token grants
is narrow (read access to one non-published page until expiry, not
account access), but the fix costs nothing and removes the
inconsistency.

## No secret leakage

**Mitigated.** No CMS response includes a password hash, JWT secret,
API key, or raw refresh/reset token — verified by the existing Phase 4
"no secret leakage" test suite, unaffected by this phase's additions.
The Newsletter unsubscribe token is hashed at rest
(`NewsletterSubscriber.unsubscribeTokenHash`), following the same
generate-raw/store-hash pattern as Phase 4's password-reset tokens —
the raw token exists only in the one email it's sent in, never
persisted or logged.

## No internal API exposure

**Mitigated.** Admin write routes (`/cms/admin/*`) require both
`authenticate` and `requirePermission('content.manage')` — verified by
an integration test ("denies page creation to a user without
content.manage permission"). `robots.txt` explicitly disallows `/admin/`
and `/api/` from crawling (a defense-in-depth signal to well-behaved
crawlers, not an access control — the real access control is the RBAC
gate above).

## CSP compatibility

**Partially compatible, documented honestly.** The JSON-LD structured-
data injection (`useStructuredData`) creates `<script
type="application/ld+json">` tags via `document.createElement` +
`textContent` (never `innerHTML`, so no script-execution risk from the
schema data itself) — but a **strict** Content-Security-Policy without
`'unsafe-inline'` or a nonce for `script-src` would still block even
this non-executing inline script tag, since CSP's `script-src`
directive governs `<script>` presence, not just execution risk. No CSP
header is currently set by this phase (Phase 2's Helmet defaults apply
platform-wide, unchanged here) — recorded as a decision gate: if/when a
strict CSP is adopted, either move structured-data injection to a
nonce'd script tag or accept `'unsafe-inline'` for `script-src`
specifically scoped to JSON-LD's low actual risk (the content is
build-time-controlled data, not arbitrary script logic).

## Spam protection (Contact + Newsletter)

**Foundation implemented, explicitly scoped as a foundation, not a
complete anti-spam system.** Honeypot field (`HoneypotField.tsx` +
server-side silent no-op) catches naive auto-filling bots; rate
limiting (`cms-rate-limit.middleware.ts`) bounds submission volume per
IP. Not implemented: CAPTCHA, IP reputation, content-based spam
scoring — each would need a third-party service this phase does not
introduce (consistent with "do not connect a production email
provider" — the same "don't wire up an external vendor speculatively"
discipline applied to spam protection).

## Rate limiting

**Mitigated.** Contact (5/15min), Newsletter subscribe/unsubscribe
(5/15min), Search (30/min) — all per-IP, via `express-rate-limit`,
matching the pattern already established for auth endpoints in Phase 4.

## Dependency audit (Phase 5 Part 2 additions)

`dompurify@3.4.12` — no known vulnerabilities at install time (checked
via `npm audit`, targeted). `vitest@2.1.9` (a **dev-only** dependency,
never shipped in the production bundle) has one known critical advisory
affecting its optional UI/API server mode (`--ui` flag) — this project
never runs Vitest with `--ui` or exposes its API server (only `vitest
run`, a headless one-shot test runner), so the advisory's actual attack
vector does not apply to this project's usage. Documented transparently
rather than silently ignored, consistent with how Phase 2 handled
similar dev-tooling `npm audit` findings.
