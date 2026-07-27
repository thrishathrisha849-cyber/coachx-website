# LMS Data Model (Phase 6 Part 1)

Status: **Implemented**. See `database/prisma/schema.prisma`'s Phase 6
Part 1 section (bottom of the file) for authoritative field definitions.
Migration: `database/prisma/migrations/20260727115732_add_lms_course_foundation/`.

## Entity relationships

```
CourseCategory (self-referencing tree, optional parent)
  └── (N) Course                    categoryId is nullable (required only at publish time)

Course (1) ── (N) CourseModule       ordered "chapter" shells, no lesson content yet
Course (1) ── (N) CourseInstructor   join table to the existing Phase-4 User
User   (1) ── (N) CourseInstructor   an existing user can instruct multiple courses
```

## Enums and ownership

| Enum | Owner | Values | Why not a validated string / ISO standard instead |
| --- | --- | --- | --- |
| `CategoryStatus` | Phase 6 Part 1 | `ACTIVE`, `ARCHIVED` | A true lifecycle with enforcement rules (archived categories excluded from active listings) — not just a display label |
| `CourseStatus` | Phase 6 Part 1 | `DRAFT`, `REVIEW`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` | Centrally-enforced state machine (`course-lifecycle.policy.ts`) — a plain string would have no compile-time or DB-level exhaustiveness |
| `CourseVisibility` | Phase 6 Part 1 | `PUBLIC`, `UNLISTED` | See "Why no PRIVATE visibility yet" below |
| `CourseLevel` | Phase 6 Part 1 | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `ALL_LEVELS` | Small, closed, spec-named set |
| `CoursePriceType` | Phase 6 Part 1 | `FREE`, `PAID` | Gates the FREE-must-be-zero-price validation rule |
| `CourseModuleStatus` | Phase 6 Part 1 | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Deliberately SMALLER than Course's 7-state machine — a module is a sub-resource of a course, not its own independently-reviewed/scheduled entity |
| `InstructorCourseRole` | Phase 6 Part 1 | `INSTRUCTOR`, `TEACHING_ASSISTANT` | Small, closed set; `isPrimary` (a separate boolean) carries the "exactly one primary" concern, not this enum |
| `PageLanguage` | **Reused from Phase 5** (`Course.language`) | `EN`, `TA`, `TANGLISH` | Same three-value platform-wide language set — a second, competing `CourseLanguage` enum would be a duplicate-canonical-shape problem, exactly what this phase's own "Architecture Decision Review" instruction warns against |

## Design decisions

**No separate `SeoMetadata` join table on `Course`.** SEO fields
(`seoTitle`/`seoDescription`/`canonicalUrl`) are embedded directly on
`Course`, the same pattern `Page` already established
(`docs/public-site/CMS_MODEL.md` §2) — every course has exactly one SEO
configuration, so a join table would add a lookup with no modeling
benefit.

**`CourseCategory`/`Course`/`CourseModule` are archived, never hard-deleted.**
No `DELETE` route exists for any of the three. Archiving a category
that has courses does NOT touch those courses' `categoryId` — the
category is merely excluded from active discovery/admin-create
dropdowns. Archiving a module never touches a future Part 2 `Lesson`
row's `moduleId` FK — the brief's explicit "Module lifecycle must not
silently delete future lesson data" requirement.

**Why no `PRIVATE` course visibility yet.** `CourseVisibility` only has
`PUBLIC`/`UNLISTED` — a genuine `PRIVATE` (enrollment-gated) visibility
value would be meaningless without Part 2's `Enrollment` model to
answer "private to whom?" Adding the enum value now, unused, would be
exactly the kind of premature placeholder the brief's "Do not create
placeholder business tables for later phases" instruction warns
against. See Decision Gates.

**"At most one primary instructor per course" is enforced at TWO
layers.** (1) A transactional service-layer check-then-set
(`instructor.service.ts`'s `assignInstructor`/`setPrimaryInstructor`:
clear any existing primary before setting a new one, inside the same
`withTransaction()`), and (2) a hand-added partial unique index in the
migration SQL:

```sql
CREATE UNIQUE INDEX "course_instructors_one_primary_per_course"
  ON "course_instructors"("course_id") WHERE "is_primary" = true;
```

Prisma's schema DSL has no `@@unique(... WHERE ...)` syntax for a
partial index, so this line was added by hand directly to the
Prisma-generated migration file (not auto-generated) — the ONLY
hand-edit in this phase's migration. A plain
`@@unique([courseId, isPrimary])` would have been WRONG: it would also
block two different NON-primary instructors on the same course, which
is explicitly allowed (a course can have many co-instructors/TAs, all
with `isPrimary: false`).

**Course/category slugs are globally unique** (`@unique` on `Course.slug`
and `CourseCategory.slug`), not composite-unique-per-language like
`Page.slug` — the LMS brief did not ask for multi-language course
variants sharing one slug, and inventing that composite-uniqueness now
would be unrequested complexity.

**`Course.version`** — an `Int` incremented on every `updateExistingCourse`
call. This is an optimistic-concurrency PREPARATION field, not yet
enforced (no concurrent-edit UI exists to generate the conflict this
phase would need to detect) — see Decision Gates.

## What is deliberately NOT modeled in Part 1

`Lesson`, `LearningActivity`, `Assessment`/`Quiz`, `Assignment`,
`Certificate`, `Review`/`Rating`, `Wishlist`, `Enrollment`,
`CourseProgress`, `LearningPath`, `Program`, `Cohort` — all owned by
Part 2/Part 3 of Phase 6, or by later features entirely. None of these
have even a placeholder FK-preparation column anywhere in Part 1's
models — the brief's "Do not create placeholder business tables for
later phases unless a minimal foreign-key preparation is absolutely
required" was read literally: a future `Lesson.moduleId` FK will simply
reference the already-existing `CourseModule.id`, which needs no
preparation on this side.
