# Lesson Architecture (Phase 6 Part 2A)

## Scope

`Lesson` is the individual learning unit inside a `CourseModule` (004 FR-017/FR-018). It is additive to Part 1 — no Part 1 table/column was altered; `CourseModule` only gained a `lessons` back-relation and (for Part 2B's release engine) `manuallyReleasedAt`.

## Why Lesson has no `type` field

Part 2A's own field list for Lesson (title, slug, summary, description, position, duration, preview, mandatory, completion rule, publish state, audit) conspicuously omits "type." Content typing lives entirely on `LearningActivity.type` instead. This avoids a two-source-of-truth problem: if Lesson also carried a `type`, a lesson with, say, a VIDEO type but an ARTICLE activity attached would be an internally-contradictory record with no defined resolution rule. One Lesson may in principle carry multiple activities (e.g. a video plus a downloadable worksheet) — a single `type` field on Lesson could not express that even if it existed.

## Fields and their source

| Field | FR | Notes |
|---|---|---|
| `title`, `slug`, `summary`, `description` | FR-018 | `slug` unique per `(moduleId, slug)` |
| `position` | FR-018 "order" | unique per `(moduleId, position)`, reordered via the same two-pass offset pattern `module.repository.ts` established |
| `durationMinutes` | FR-018 "duration" | instructor-entered estimate |
| `isPreview` | FR-018 "preview status" | bypasses enrollment for read access — see `ACCESS_DECISION_ENGINE.md` |
| `isMandatory` | FR-018 "mandatory status" | drives module/course completion weighting (FR-054) |
| `completionRuleType`/`completionRuleValue` | FR-052 | see `COMPLETION_ENGINE.md` |
| `status` | FR-018 | reuses `CourseModuleStatus` (DRAFT/PUBLISHED/ARCHIVED) — no separate Lesson-status enum was invented since the same three states apply |
| `version` | FR-018 | incremented on every update |
| `createdBy`/`updatedBy`/`publishedAt` | FR-018 | audit fields, loose `String? @db.Uuid` references, same pattern as `Course` |
| `deletedAt` | Part 2A "soft delete" | reserved for a future hard-purge action; the `archive` endpoint sets `status = ARCHIVED`, not `deletedAt` |

## Public exposure — three-tier serialization

`lesson.serializers.ts` deliberately splits into three functions rather than one shape with optional fields:

1. `toPublicLessonSummary` — safe even for a LOCKED lesson (FR-035: locked content still shows title/duration). Never includes `description` or `activities`.
2. `toPublicLessonDetail` — only ever called by the service layer AFTER the access evaluator has confirmed the caller may see full content. Includes `activities`, filtered to `PUBLISHED` only.
3. `toAdminLesson`/`toAdminLessonWithActivities` — the full editable record, admin/instructor-only.

No public/learner-facing route ever returns a raw Prisma `Lesson` row.

## Ordering and reorder safety

`lesson.repository.ts`'s `reorderLessonPositions` copies `module.repository.ts`'s exact two-pass offset-then-final-position pattern, scoped to `moduleId` in every `updateMany` where-clause. `lesson.service.ts`'s `reorderCourseLessons` requires the caller's `orderedIds` to be precisely the module's full current lesson set (rejects unknown ids, cross-module mixing, and partial reorders) — the same validation `module.service.ts`'s `reorderCourseModules` already established for modules.

## Limitations (explicit, not silent)

- No block-based rich-text authoring editor (FR-096) — `description`/`bodyText` are plain strings, sanitized/rendered as text, not a structured block document.
- No SCORM/interactive-tool/AI-exercise lesson types — explicitly out of scope per 004 spec.md's own "future-ready" list.
- No translation-variant tracking (FR-101) for lessons.
