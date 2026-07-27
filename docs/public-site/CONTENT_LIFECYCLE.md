# Content Lifecycle

Status: **Implemented** (backend foundation only — no admin editor UI
exists in this phase, per the brief's explicit "Backend foundation
only. Do not implement admin CMS editor"). This document exists
because Phase 5 Part 3 requires it as a standalone reference,
consolidating lifecycle information that was previously scattered
across `CMS_MODEL.md` and `page.service.ts`'s own comments.

## Status state machine

```
DRAFT ──────► REVIEW ──────► APPROVED ──────► SCHEDULED ──────► PUBLISHED ──────► ARCHIVED
  ▲               │               │                │                 │               │
  └───────────────┘               │                │                 │               │
  (send back)      └───ARCHIVED───┘                │                 │               │
  ▲                                └────DRAFT───────┘                 │               │
  │                                └───────ARCHIVED────────────────────┘               │
  └──────────────────────────────────────────────────────────────────────────────────┘
  (ARCHIVED can always return to DRAFT for revival)
```

Enforced centrally by `page.service.ts`'s `VALID_TRANSITIONS` map — the
single source of truth for what transitions are legal (FR-087):

| From | Allowed → | Rationale |
| --- | --- | --- |
| `DRAFT` | `REVIEW`, `ARCHIVED` | A draft is submitted for review, or abandoned |
| `REVIEW` | `DRAFT`, `APPROVED`, `ARCHIVED` | Reviewer sends back for changes, approves, or rejects outright |
| `APPROVED` | `SCHEDULED`, `PUBLISHED`, `DRAFT`, `ARCHIVED` | Approved content can publish immediately, be scheduled, be pulled back for edits, or be shelved |
| `SCHEDULED` | `PUBLISHED`, `APPROVED`, `ARCHIVED` | A scheduled page publishes at its `publishAt` time, can be un-scheduled back to approved, or cancelled |
| `PUBLISHED` | `ARCHIVED`, `DRAFT` | A live page can be retired, or pulled back to draft for a substantial edit-and-republish cycle |
| `ARCHIVED` | `DRAFT` | Archived content can always be revived for editing — never a dead end |

Any transition not in this table is rejected with `AppError.badRequest`
at the API boundary (`PATCH /api/v1/cms/admin/pages/:id/status`) — the
check happens once, in `updatePageStatus()`, not duplicated per caller.

## Public visibility rule (independent of status)

A page is publicly readable via `GET /api/v1/cms/pages/:slug` only
when **all** of the following hold (`getPublicPage()`):

1. `status === 'PUBLISHED'`
2. `publishAt` is null OR in the past (supports scheduling: a page can
   sit in `PUBLISHED` status with a future `publishAt` and still not be
   visible yet — this is how "scheduled but not yet live" is modeled
   without a separate polling job flipping status at the exact minute)
3. `expireAt` is null OR in the future (a page can auto-retire without
   a background job — the check is evaluated at read time)

This means "published" (the *status*) and "publicly visible" (the
*read-time computation*) are deliberately different concepts — the
same pattern `Announcement`'s date-range visibility already uses
elsewhere in this schema, chosen specifically so there is no "is this
actually live right now" flag that a scheduled job could forget to
flip.

## Draft isolation

Nothing outside the `PUBLISHED`+visibility-window check above ever
returns non-public content to an unauthenticated/non-preview caller:

- `search.service.ts` filters `status: 'PUBLISHED'` at the Prisma
  query level (not filtered after the fact in application code) —
  verified by an integration test asserting a DRAFT page with an
  exact-matching title never appears in search results.
- `listPagesByTemplate()` (Blog listing) filters `status: 'PUBLISHED'`
  the same way.
- The **one** sanctioned bypass is the preview-token mechanism (next
  section) — expiring, single-page-scoped, and only reachable by
  someone holding a `content.manage`-gated, explicitly-generated
  token.

## Preview

`POST /api/v1/cms/admin/pages/:id/preview-link` (auth +
`content.manage`) generates a random token via `generateSecureToken()`,
returns the **raw** token to the caller once, and persists only its
SHA-256 hash (`Page.previewTokenHash`) — see `CMS_MODEL.md`'s "Part 3
hardening fix" note for why this changed from storing the raw token.
The link (`/<slug>?preview=<raw-token>`) works for **any** status,
including `DRAFT`, and expires after 24 hours
(`Page.previewExpiresAt`). Generating a new preview link overwrites the
old one — a page has at most one active preview link at a time, which
is the correct behavior for "admin preview links expire" (FR-105): an
old, no-longer-wanted preview link cannot be left dangling.

## Scheduling

There is no separate "Scheduled" table or cron job. Scheduling is the
combination of `status = 'PUBLISHED'` (or `SCHEDULED`, as an
admin-facing signal of intent) with a future `publishAt` — the
visibility check at read time (see above) is what actually withholds
the content until the scheduled time arrives. This avoids a
class of bugs where a scheduling job fails to run and content never
actually appears.

## Version history

Every `createCmsPage()` and `updateCmsPage()` call appends a new
`PageVersion` row — a full JSON snapshot of the page's fields **and**
its blocks at that point in time (`createPageVersion()`,
monotonically-incrementing `versionNumber`). Versions are never
overwritten or deleted, mirroring Constitution Article IV's Historical
Immutability principle already established platform-wide. `GET
/api/v1/cms/admin/pages/:id/versions` (`listVersionHistory()`) returns
the full list, newest first, for a future admin editor's "restore this
version" feature (the restore *action* itself is not built — see
Deferred, below — but the data needed to build it already exists).

## Archive behavior

`ARCHIVED` is a status like any other in the state machine — an
archived page is simply never returned by `getPublicPage()` (status
check fails) or by listing/search (same `PUBLISHED`-only filter).
Archiving does **not** delete the row, its blocks, or its version
history — nothing in this phase performs a hard delete of a `Page` at
all (no `DELETE` route exists on the admin CMS controller). This is a
deliberate, conservative choice: irreversible deletion of
CMS content is a higher-risk operation than this phase's admin API
surface is scoped to support.

## Slug uniqueness

`Page.slug` + `Page.language` form a composite unique constraint
(`@@unique([slug, language])` in `schema.prisma`) — the same slug can
exist once per language (e.g. `/about` in `en` and `/about` in `ta`),
but never twice within the same language. Enforced at the database
level (not just application validation), so a race condition between
two concurrent create requests cannot produce a duplicate. The create/
update API additionally validates the slug's shape via Zod
(`^[a-z0-9]+(?:-[a-z0-9]+)*$`) before the uniqueness constraint is even
reached; `seo-validation.service.ts` re-checks the same pattern across
all published pages as a defense-in-depth operational check (catching
drift from any future write path that might bypass the Zod schema).

## Block rendering lifecycle

`PageBlock.visible` is a separate flag from the page's own status — a
block can be authored and saved but temporarily hidden without
removing it or bumping a new version for the removal-and-later-
re-addition round trip. `toRenderedPage()` filters to `visible: true`
blocks only when building the public API response; the admin write
path (`replacePageBlocks()`) always persists the full block set
including hidden ones, so a hidden block's data is never lost.

## Known gaps (Future Feature Owner: admin CMS editor, not yet scheduled)

| Gap | Why deferred |
| --- | --- |
| No UI to drive the publish workflow, versioning, or preview-link generation | Explicitly out of scope this phase ("Backend foundation only. Do not implement admin CMS editor.") |
| No "restore to version N" action (only version *history retrieval* exists) | The restore action needs a UI decision (restore blocks only? restore metadata too? confirm-before-overwrite?) not made yet |
| No scheduled-publish background job to auto-transition `SCHEDULED` → `PUBLISHED` at `publishAt` | Not needed — the read-time visibility check already achieves the same user-facing effect without a job that could fail silently; a status-transition job remains a valid *future* convenience for admin-facing status accuracy, not a functional requirement |
| No hard-delete of a `Page` | Deliberately conservative; would need a decision on cascade behavior for blocks/versions and whether it's ever truly appropriate for auditable marketing content |
| No multi-step/dual-approval requirement for the `REVIEW → APPROVED` transition | FR-087 describes a workflow, not an approval-chain requirement; RBAC's existing dual-approval pattern (`docs/auth/DECISION_GATES.md`) was built for `super_admin` role assignment specifically, not generalized to CMS content yet |
