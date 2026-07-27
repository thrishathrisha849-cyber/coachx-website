# Course Lifecycle (Phase 6 Part 1)

Status: **Implemented**. Source of truth:
`backend/src/lms/course-lifecycle.policy.ts`.

**CORRECTION (spec-alignment pass, post-audit):** this document, and the
policy file it describes, were rewritten against **004/spec.md FR-015**
and **FR-100** directly. The original Part 1 implementation used a
generic, prompt-supplied state list (`DRAFT → REVIEW → APPROVED →
SCHEDULED → PUBLISHED → UNPUBLISHED → ARCHIVED`) that had no basis in the
actual Feature 004 specification — `REVIEW` and `UNPUBLISHED` do not
appear anywhere in 004/spec.md. This was found during a dedicated
specification-alignment audit and corrected below. See
`docs/lms/DECISION_GATES.md` gate #17 for the full before/after record.

## Reconciling FR-015 and FR-100 (two FRs, one field)

004/spec.md describes course status in two places that don't share an
identical vocabulary:

- **FR-015** lists 12 editorial statuses as `Course.status`'s value set:
  Draft, Content creation, Internal review, Instructor review, QA
  review, Approved, Scheduled, Published, Unlisted, Enrollment paused,
  Archived, Retired — each with an explicitly stated per-status public-
  access behavior.
- **FR-100** describes a narrower, 6-state **content review workflow**
  with explicit role attribution (Author/Reviewer/Compliance reviewer/
  Publisher) and a mandatory audit entry per transition: Draft →
  Submitted for review → Changes requested → Approved → Scheduled →
  Published.

Read together (both are the same feature describing the same field from
two angles — FR-014's own field list names exactly one "publication
status" field), the reconciliation implemented here is: **FR-100
supplies the enforced transition MACHINE** for the pre-publish editorial
states (it is the more implementation-ready of the two, with explicit
role/audit requirements FR-015 doesn't state); **FR-015 supplies the
additional terminal/operational states** or the field's own value set
(Unlisted, Enrollment paused, Archived, Retired) that FR-100's narrower
workflow view doesn't mention. FR-015's four editorial sub-review-stage
names (Content creation / Internal review / Instructor review / QA
review) are treated as **process guidance within the single
`SUBMITTED_FOR_REVIEW` state**, not 4 separate enum values — FR-100
itself doesn't name them as distinct states either, and inventing 4 new
states neither FR fully specifies at the same granularity would be
guessing, not reading the spec.

## Status state machine

```
DRAFT ──► SUBMITTED_FOR_REVIEW ──► APPROVED ──► SCHEDULED ──► PUBLISHED
  ▲              │  ▲                  │                          │
  │              ▼  │                  │              ┌───────────┼──────────┐
  │      CHANGES_REQUESTED             │              ▼           ▼          ▼
  │              │                     │          UNLISTED  ENROLLMENT_  (stays)
  └──────────────┘                     │              │       PAUSED
                                        │              └───┬───────┘
                                        ▼                  ▼
                                    ARCHIVED ◄──────────────┘
                                     │    │
                                     ▼    ▼
                                   DRAFT RETIRED (terminal — no transitions out)
```

`COURSE_VALID_TRANSITIONS` (`course-lifecycle.policy.ts`) is the single
source of truth:

| From | Allowed → | FR basis |
| --- | --- | --- |
| `DRAFT` | `SUBMITTED_FOR_REVIEW` | FR-100 |
| `SUBMITTED_FOR_REVIEW` | `CHANGES_REQUESTED`, `APPROVED` | FR-100 |
| `CHANGES_REQUESTED` | `SUBMITTED_FOR_REVIEW`, `DRAFT` | FR-100 (resubmit) + reasonable pull-back |
| `APPROVED` | `SCHEDULED`, `PUBLISHED` | FR-100 |
| `SCHEDULED` | `PUBLISHED`, `APPROVED` | FR-100 |
| `PUBLISHED` | `UNLISTED`, `ENROLLMENT_PAUSED`, `ARCHIVED` | FR-015 |
| `UNLISTED` | `PUBLISHED`, `ARCHIVED` | FR-015 |
| `ENROLLMENT_PAUSED` | `PUBLISHED`, `ARCHIVED` | FR-015 |
| `ARCHIVED` | `DRAFT`, `RETIRED` | FR-015 ("preserves progress" implies revivable) |
| `RETIRED` | *(none — terminal)* | FR-015: "permanently unavailable" |

## Review notes (FR-100's role-attributed feedback)

Transitioning to `CHANGES_REQUESTED` **requires** a `reviewNote` (both at
the Zod validation layer and re-checked at the service layer) — FR-100's
explicit Reviewer role implies feedback always accompanies a rejection.
`Course.reviewNotes` is cleared automatically on every `DRAFT`/
`SUBMITTED_FOR_REVIEW` re-entry so a resubmitted course never shows
stale feedback. `Course.reviewedBy`/`Course.publishedBy` are set on the
`APPROVED` and `PUBLISHED` transitions respectively (FR-014's own field
list: "reviewed-by, published-by").

## Publish-readiness validation — moved to the APPROVED transition

**CORRECTION:** the original implementation ran `assertPublishReady()`
and `assertHasPublishableModule()` at the `PUBLISHED`/`SCHEDULED`
transition. They now run at `SUBMITTED_FOR_REVIEW → APPROVED` —
FR-100's workflow defines `Approved` as the point content is "ready to
go live"; `APPROVED → SCHEDULED/PUBLISHED` no longer re-checks readiness
since Approved already guarantees it. `assertPublishReady()` requires:
`title`, `slug`, `shortDescription`, `description`, `categoryId`,
`thumbnailUrl`, and (if both set) `publishAt` strictly before
`expireAt`. `seoTitle`/`seoDescription` are **NOT** required —
`title`/`shortDescription` are an accepted generated fallback, the same
"fallback, not hard failure" approach `docs/public-site/SEO.md`
documents for CMS pages.

## At-least-one-module publish gate

`assertHasPublishableModule(moduleCount)` — a course with zero
(non-archived) modules cannot be Approved. Lessons are explicitly
**NOT** required (Part 2 owns `Lesson`) — an empty-but-present module
satisfies this gate. Verified by an integration test asserting the exact
rejection message and the subsequent success once one module exists.

## Scheduled publishing — read-time window, no background worker

Same pattern `Page`/`Announcement` already use
(`docs/public-site/CONTENT_LIFECYCLE.md`): `isCoursePubliclyVisible()`
treats `status IN ('PUBLISHED', 'SCHEDULED', 'ENROLLMENT_PAUSED')` AND
`(publishAt is null OR in the past)` AND `(expireAt is null OR in the
future)` as publicly visible — a `SCHEDULED` course becomes visible
automatically once its `publishAt` arrives (US7 AC4: "the course
automatically becomes visible to eligible learners without manual
intervention") WITHOUT the `status` column itself flipping to
`PUBLISHED`. The status remaining `SCHEDULED` past its `publishAt` date
is accepted, documented staleness in the admin view (no background
worker exists anywhere in this codebase) — public visibility is correct
in all cases regardless of the cosmetic status label.

## Two visibility predicates: listing vs. direct link

**CORRECTION:** the previous implementation had a separate
`CourseVisibility` enum (`PUBLIC`/`UNLISTED`) alongside `CourseStatus` —
a duplicate-canonical-shape problem once FR-015 itself defines
`Unlisted` as a `status` value, not a second dimension. `CourseVisibility`
was removed entirely; `status` now fully expresses it. Two functions
replace the old single `isCoursePubliclyVisible()`:

- **`isCoursePubliclyVisible()`** — the LISTING/SEARCH rule. Allows
  `PUBLISHED`, `SCHEDULED` (once its window opens), `ENROLLMENT_PAUSED`.
  Does **NOT** allow `UNLISTED`.
- **`isCourseVisibleByDirectLink()`** — the DETAIL-BY-SLUG rule.
  Everything the listing rule allows, **plus** `UNLISTED` (FR-015:
  "accessible only via direct link or explicit assignment"). Used
  exclusively by `getPublicCourseBySlug()` — never by any listing/search
  query, so an unlisted course can never surface in `/api/v1/lms/courses`
  or search results, only by someone who already has its exact slug.

## Draft/archived/unlisted isolation

`getPublicCourseBySlug()` returns the SAME 404 for a nonexistent slug
and a slug that exists but isn't visible by direct link — no
draft-existence leak. `findPublicCourses()`'s `WHERE` clause filters at
the database query level (not filtered after the fact in application
code) — verified by integration tests asserting a DRAFT course never
appears in the public listing or detail endpoint, and that an
`UNLISTED` course is reachable by slug but never appears in the listing.
See `docs/lms/SECURITY.md` for the exact query-construction bug this
was checked against (a real object-spread `OR`-key-collision bug caught
and fixed during the original implementation).

## Archive/Retire behavior

`ARCHIVED` and `RETIRED` are never returned by any public read (same
allow-list-based filter as above). Archiving/retiring does NOT delete
the course, its modules, or its instructor assignments. No route
performs a hard delete of a `Course` at all. `RETIRED` is a genuine
terminal state — `COURSE_VALID_TRANSITIONS.RETIRED` is an empty array,
verified by a dedicated test.

## Audit events

Every lifecycle-affecting action records an `AuditEvent` in the SAME
transaction as the state change (never as a separate, potentially-
inconsistent write): `lms.course.created`, `lms.course.updated`,
`lms.course.status_changed` (with `beforeState`/`afterState`, and the
`reviewNote` text for a `CHANGES_REQUESTED` transition), plus the
category/module/instructor equivalents listed in
`docs/lms/API_REFERENCE_PART1.md`.

## Configuration vs. enforcement (CourseModule's new FR-034/FR-052 fields)

`CourseModule.releaseRuleType`/`releaseRuleValue`
(FR-034)/`completionRuleType` (FR-052) are **configuration fields an
instructor sets while authoring** — Part 1 stores the instructor's
intent but does **NOT** evaluate or enforce it. No public API path in
Part 1 changes behavior based on these fields (a `DRAFT`-release-typed
module is exposed exactly the same as an `IMMEDIATE`-release-typed one
in Part 1's public detail response — only the module's own `status`
gates visibility). Part 2's Enrollment/Lesson/drip-release engine is
what will actually read and act on these values. This split is
deliberate, not an oversight — see `docs/lms/DECISION_GATES.md`.

## Known limitations (Part 1)

- No "restore to a previous version" action — `Course.version` is
  incremented but not yet consulted for optimistic-concurrency conflict
  detection (no concurrent-edit UI exists yet to generate that
  conflict). See Decision Gates.
- No dual-approval / multi-step review-chain enforcement for the
  `SUBMITTED_FOR_REVIEW → APPROVED` transition — a single
  `course.publish`-holding actor can approve. The spec does not name a
  dual-approval requirement here (unlike RBAC's existing
  `super_admin`-grant dual-approval marker, built for a different,
  narrower concern).
- FR-015's four editorial sub-review-stage names (Content creation/
  Internal review/Instructor review/QA review) are not separately
  tracked — see the reconciliation note above.
