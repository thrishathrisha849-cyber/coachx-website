# CMS Model

Status: **Implemented**. See `database/prisma/schema.prisma`'s Phase 5
section for authoritative field definitions.

## Entity relationships

```
Page (1) ── (N) PageBlock       ordered content-block instances
Page (1) ── (N) PageVersion     non-destructive snapshot history
NavigationItem (self-referencing tree)   HEADER / FOOTER / MOBILE
Announcement                              time-boxed, prioritized banner
Redirect                                  URL-to-URL, SEO/broken-link management
FaqEntry                                  categorized Q&A
ConsentRecord                             per-channel, versioned consent
ContactSubmission                         minimal Contact-form record
NewsletterSubscriber                      footer/blog newsletter capture
```

## Design decisions

**SEO fields live on `Page` directly, not a separate `SeoMetadata`
table.** Every page has exactly one SEO configuration — a 1:1 join
table would add a lookup with no modeling benefit (see the `Page` model
comment in `schema.prisma`).

**Tags are a Postgres native `String[]`, not a `Tag`/`PageTag` join.**
Blog category/tag taxonomy here is page-owned and lightweight; a shared
cross-entity taxonomy would only be justified once Courses/Events/
Resources also need the same tag vocabulary — none of which exist yet.

**`PageBlock.data` is a single `Json` column with one Zod schema per
block type at the application layer** (`backend/src/cms/block-schemas.ts`),
not 20 near-empty tables or one giant nullable-everything table. FR-085's
20 block types genuinely have different field shapes; this is the
standard pattern for that situation.

**`PageVersion` snapshots the full page+blocks JSON on every
publish-affecting update.** Non-destructive, mirroring Constitution
Article IV's Historical Immutability principle (already established
platform-wide) — no version is ever overwritten, only appended.

**No separate `RefreshToken`-style split for preview links.**
`Page.previewToken`/`previewExpiresAt` live directly on `Page` — a page
has at most one active preview link at a time (generating a new one
overwrites the old), which is the correct behavior for FR-105's
"admin preview links expire."

## What is deliberately NOT modeled in Part 1

See `docs/public-site/DECISION_GATES.md` for the full list and reasons:
`Lead`, `Campaign`, `Checkout Session`/`Abandoned Checkout`,
`Experiment`, `Testimonial` as its own approval-workflow entity (Part 1
embeds testimonial data directly in the TESTIMONIALS block instead —
see below), `Success Story`, `Podcast Episode`, `Resource` (gated
downloads), a shared `Tag`/`Category` taxonomy, `Instructor`/`Mentor`/
`Program`/`Course`/`Event` (owned by 004/005/007/010).

**Testimonials are block-embedded data, not a standalone approval-
workflow entity.** FR-027 describes testimonials with "approval status"
and "display date" implying an admin review queue — Part 1's
TESTIMONIALS block instead stores testimonial data directly in the
block's `data` JSON (each item requires `consentGiven: true` at the
schema level, satisfying the consent requirement) without a separate
moderation/approval-state machine, since there is no admin UI in this
phase to drive that workflow through. Promoting this to a real
`Testimonial` entity with its own approval lifecycle is a natural
follow-up once an admin editor exists.
