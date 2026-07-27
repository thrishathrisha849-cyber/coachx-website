# LMS Data Model (Phase 6 Part 1)

Status: **Implemented**. See `database/prisma/schema.prisma`'s Phase 6
Part 1 section (bottom of the file) for authoritative field definitions.
Migrations: `database/prisma/migrations/20260727115732_add_lms_course_foundation/`
(original), `database/prisma/migrations/20260727125444_align_course_lifecycle_with_fr004/`
(**CORRECTION** — spec-alignment pass, see below and `docs/lms/DECISION_GATES.md` gate #17).

## Correction summary (read this first)

A dedicated specification-alignment audit found the original Part 1
implementation was built from a generic, prompt-supplied field/state
list rather than 004/spec.md's actual FR-014/FR-015/FR-016/FR-100 text.
This correction:

- Rebuilt `Course.status`'s value set from FR-015/FR-100 (see
  `docs/lms/COURSE_LIFECYCLE.md` for the full reconciliation).
- **Removed the separate `CourseVisibility` enum entirely** — FR-015
  already models "Unlisted" as a `status` value, not a second dimension;
  keeping both was a duplicate-canonical-shape problem.
- Added the FR-014 `Course` fields that were missing: `learningOutcomes`,
  `tags`, `targetAudience`, `toolsRequired`, `weeklyCommitmentMinutes`,
  `certificateAvailable`, `reviewNotes`, `reviewedBy`, `publishedBy`,
  `ratingAverage`/`ratingCount`/`learnerCount` (placeholders — see below).
- Added the FR-016 `CourseModule` fields that were missing: `outcome`,
  `estimatedDurationMinutes`, `isMandatory`, `prerequisiteModuleId`
  (self-relation), plus FR-034/FR-052 configuration-only fields
  `releaseRuleType`/`releaseRuleValue`/`completionRuleType`.
- Capped `CourseCategory`'s hierarchy at 2 levels (category/subcategory,
  matching FR-014's literal naming) — see below.

## Entity relationships

```
CourseCategory (self-referencing tree, capped at 2 levels — see below)
  └── (N) Course                    categoryId is nullable (required only at approval time)

Course (1) ── (N) CourseModule       ordered "chapter" shells, no lesson content yet
CourseModule (1) ── (0..1) CourseModule   self-relation: optional prerequisite, same course only
Course (1) ── (N) CourseInstructor   join table to the existing Phase-4 User
User   (1) ── (N) CourseInstructor   an existing user can instruct multiple courses
```

## Enums and ownership

| Enum | Owner | Values | Why not a validated string / ISO standard instead |
| --- | --- | --- | --- |
| `CategoryStatus` | Phase 6 Part 1 | `ACTIVE`, `ARCHIVED` | A true lifecycle with enforcement rules (archived categories excluded from active listings) — not just a display label |
| `CourseStatus` | Phase 6 Part 1 (**corrected**) | `DRAFT`, `SUBMITTED_FOR_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `UNLISTED`, `ENROLLMENT_PAUSED`, `ARCHIVED`, `RETIRED` | Centrally-enforced state machine (`course-lifecycle.policy.ts`), rebuilt from 004 FR-015/FR-100 — see `docs/lms/COURSE_LIFECYCLE.md` |
| `CourseLevel` | Phase 6 Part 1 | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `ALL_LEVELS` | Small, closed, spec-named set |
| `CoursePriceType` | Phase 6 Part 1 | `FREE`, `PAID` | Gates the FREE-must-be-zero-price validation rule |
| `CourseModuleStatus` | Phase 6 Part 1 | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Deliberately SMALLER than Course's state machine — a module is a sub-resource of a course, not its own independently-reviewed/scheduled entity |
| `ModuleReleaseRuleType` | Phase 6 Part 1 (**new**) | `IMMEDIATE`, `DAYS_AFTER_ENROLLMENT`, `FIXED_DATE`, `AFTER_PREVIOUS_MODULE`, `INSTRUCTOR_RELEASE` | 004 FR-034's release-rule types, minus the ones requiring a Cohort entity (not built) — configuration only, not enforced (see `docs/lms/COURSE_LIFECYCLE.md`) |
| `ModuleCompletionRuleType` | Phase 6 Part 1 (**new**) | `MANUAL`, `INSTRUCTOR_APPROVAL` | 004 FR-052's completion-rule types, restricted to the two meaningful without a Lesson/Quiz/Assignment model (not built) — configuration only |
| `InstructorCourseRole` | Phase 6 Part 1 | `INSTRUCTOR`, `TEACHING_ASSISTANT` | Small, closed set; `isPrimary` (a separate boolean) carries the "exactly one primary" concern, not this enum |
| `PageLanguage` | **Reused from Phase 5** (`Course.language`) | `EN`, `TA`, `TANGLISH` | Same three-value platform-wide language set — a second, competing `CourseLanguage` enum would be a duplicate-canonical-shape problem |

**REMOVED in this correction: `CourseVisibility` (`PUBLIC`/`UNLISTED`).**
FR-015 already models "Unlisted" as one of `Course.status`'s own values
— a separate `visibility` dimension duplicated that concept. See
`docs/lms/COURSE_LIFECYCLE.md`'s "Two visibility predicates" section for
how listing vs. direct-link access is now distinguished without it.

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

**Category hierarchy capped at 2 levels (category/subcategory).**
004 FR-014 names exactly "category, subcategory" — a 2-level model.
`CourseCategory`'s self-referencing structure remains a valid,
documented superset (arbitrary depth is structurally possible), but
`category.service.ts`'s `assertParentValid()` now rejects: (1) assigning
a parent that itself already has a parent (would create depth 2+), and
(2) assigning a parent to a category that already has children (would
push those children to depth 2+). `MAX_CATEGORY_DEPTH = 2` is exported
from `category.service.ts` as the single source of this constant.

**Why no `PRIVATE` course visibility yet.** A genuine `PRIVATE`
(enrollment-gated) status value would be meaningless without Part 2's
`Enrollment` model to answer "private to whom?" Adding it now, unused,
would be exactly the kind of premature placeholder the brief's "Do not
create placeholder business tables for later phases" instruction warns
against. See Decision Gates.

**Course rating/learner-count fields are documented placeholders, never
fabricated.** FR-014 lists "rating, review count, learner count" as
`Course` fields — `ratingAverage`/`ratingCount`/`learnerCount` exist
(nullable/zero-defaulted) so Part 2 (learnerCount, from Enrollment) and
Part 3 (rating, from Course Review) have a column to populate rather
than needing a later migration, but NO Part 1 code path ever writes a
non-zero/non-null value to them.

**Module `releaseRuleType`/`completionRuleType` are configuration, not
enforcement.** See `docs/lms/COURSE_LIFECYCLE.md`'s "Configuration vs.
enforcement" section — these fields are stored exactly as the
instructor sets them, but no Part 1 code path reads or acts on them.

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
Prisma-generated migration file — the ONLY hand-edit across both LMS
migrations. A plain `@@unique([courseId, isPrimary])` would have been
WRONG: it would also block two different NON-primary instructors on the
same course, which is explicitly allowed.

**Module prerequisites: same-course-only, strictly-earlier-position,
cycle-defended.** `CourseModule.prerequisiteModuleId` is a self-relation
enforced by `module.service.ts`'s `assertValidPrerequisite()`: the
prerequisite must belong to the same course, must not be the module
itself, and must have a strictly lower `position` than the dependent
module. This ordering invariant alone makes a true cycle mathematically
impossible (a cycle A→B→A would need position(B) < position(A) AND
position(A) < position(B) simultaneously); a chain-walk cycle check
still runs as defense-in-depth in case that invariant is ever weakened
elsewhere. Reordering also re-validates this invariant (rejects a
reorder that would place a module at or before its own prerequisite).

**Course/category slugs are globally unique** (`@unique` on `Course.slug`
and `CourseCategory.slug`), not composite-unique-per-language like
`Page.slug` — the LMS spec did not ask for multi-language course
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
models — a future `Lesson.moduleId` FK will simply reference the
already-existing `CourseModule.id`, which needs no preparation on this
side.
