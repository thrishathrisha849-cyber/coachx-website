# Course Lifecycle (Phase 6 Part 1)

Status: **Implemented**. Source of truth:
`backend/src/lms/course-lifecycle.policy.ts`.

## Status state machine

```
DRAFT ──────► REVIEW ──────► APPROVED ──────► SCHEDULED ──────► PUBLISHED ──────► ARCHIVED
  ▲               │               │                │                 │
  └───────────────┘               │                │                 │
                    └───ARCHIVED──┘                │                 │
  ▲                                └────DRAFT───────┘                 │
  │                                └───────ARCHIVED────────────────────┘
  │                                                                    │
  │                        PUBLISHED ◄──────► UNPUBLISHED              │
  │                            │                    │                  │
  │                            └────────ARCHIVED────┴──────────────────┘
  │                                                  │
  └──────────────────────────DRAFT◄─────────────────┘
  (ARCHIVED can always return to DRAFT for revival)
```

`COURSE_VALID_TRANSITIONS` (`course-lifecycle.policy.ts`) is the single
source of truth:

| From | Allowed → |
| --- | --- |
| `DRAFT` | `REVIEW`, `ARCHIVED` |
| `REVIEW` | `DRAFT`, `APPROVED`, `ARCHIVED` |
| `APPROVED` | `SCHEDULED`, `PUBLISHED`, `DRAFT`, `ARCHIVED` |
| `SCHEDULED` | `PUBLISHED`, `APPROVED`, `ARCHIVED` |
| `PUBLISHED` | `UNPUBLISHED`, `ARCHIVED` |
| `UNPUBLISHED` | `PUBLISHED`, `DRAFT`, `ARCHIVED` |
| `ARCHIVED` | `DRAFT` |

`UNPUBLISHED` is the one state name that differs from the CMS `Page`
model's own lifecycle (`docs/public-site/CONTENT_LIFECYCLE.md`) — the
Phase 6 brief explicitly names it as a distinct state from `DRAFT`
("PUBLISHED → UNPUBLISHED", "UNPUBLISHED → PUBLISHED"), representing "a
published course pulled back" while preserving the fact that it WAS
live before (as opposed to `DRAFT`, which could mean "never published").

## Publish-readiness validation

Runs on any transition INTO `PUBLISHED` or `SCHEDULED` (scheduling means
"will become published," so it must clear the same bar):
`assertPublishReady()` requires: `title`, `slug`, `shortDescription`,
`description`, `categoryId`, `thumbnailUrl`, and (if both set)
`publishAt` strictly before `expireAt`. `seoTitle`/`seoDescription` are
**NOT** required — `title`/`shortDescription` are an accepted generated
fallback, the same "fallback, not hard failure" approach
`docs/public-site/SEO.md` documents for CMS pages.

## At-least-one-module publish gate

`assertHasPublishableModule(moduleCount)` — a course with zero
(non-archived) modules cannot publish. Lessons are explicitly **NOT**
required (Part 2 owns `Lesson`) — an empty-but-present module satisfies
this gate. Verified by an integration test asserting the exact rejection
message and the subsequent success once one module exists.

## Scheduled publishing — read-time window, no background worker

Same pattern `Page`/`Announcement` already use (`docs/public-site/CONTENT_LIFECYCLE.md`):
`isCoursePubliclyVisible()` checks `status === 'PUBLISHED' AND (publishAt
is null OR in the past) AND (expireAt is null OR in the future)` at READ
time, not via a cron job flipping status at the exact minute. The brief
explicitly permits this ("Do not build a scheduled background worker
unless existing infrastructure already supports it. A read-time
publish-window strategy may be used and documented.") — no scheduling
infrastructure exists in this codebase, so this is the correct choice,
not a shortcut.

## Draft/archived isolation

`getPublicCourseBySlug()` returns the SAME 404 for a nonexistent slug
and a slug that exists but isn't `PUBLISHED`/within its window — no
draft-existence leak. `findPublicCourses()`'s `WHERE` clause filters
`status = 'PUBLISHED' AND visibility IN ('PUBLIC','UNLISTED') AND
(publish/expire window)` at the database query level (not filtered
after the fact in application code) — verified by an integration test
asserting a DRAFT course never appears in the public listing or detail
endpoint. See `docs/lms/SECURITY.md` for the exact query-construction
bug this was checked against (a real object-spread `OR`-key-collision
bug caught and fixed during implementation — see that file).

## Archive behavior

`ARCHIVED` is a status like any other — an archived course is simply
never returned by any public read (same `PUBLISHED`-only filter).
Archiving does NOT delete the course, its modules, or its instructor
assignments. No route performs a hard delete of a `Course` at all.

## Audit events

Every lifecycle-affecting action records an `AuditEvent` in the SAME
transaction as the state change (never as a separate, potentially-
inconsistent write): `lms.course.created`, `lms.course.updated`,
`lms.course.status_changed` (with `beforeState`/`afterState`), plus the
category/module/instructor equivalents listed in
`docs/lms/API_REFERENCE_PART1.md`.

## Known limitations (Part 1)

- No "restore to a previous version" action — `Course.version` is
  incremented but not yet consulted for optimistic-concurrency conflict
  detection (no concurrent-edit UI exists yet to generate that
  conflict). See Decision Gates.
- No dual-approval / multi-step review-chain enforcement for the
  `REVIEW → APPROVED` transition — a single `course.publish`-holding
  actor can approve. The brief did not ask for an approval-chain
  requirement here (unlike RBAC's existing `super_admin`-grant
  dual-approval marker, built for a different, narrower concern).
