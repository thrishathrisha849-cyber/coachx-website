# API Reference — Phase 6 Part 2 (corrected)

Same `/api/v1/lms/...` convention Part 1 established (see `API_REFERENCE_PART1.md` for the endpoint-naming note vs. the generic prompt's own suggested paths). All responses use the shared `buildSuccessResponse`/`buildErrorResponse` envelope; no handler returns a raw Prisma row.

## CORRECTION — `Idempotency-Key` header support

The following endpoints now read an optional `Idempotency-Key` request header (see `docs/lms/ENROLLMENT_LIFECYCLE.md`/`COMPLETION_ENGINE.md`/`PROGRESS_ENGINE.md` for the full mechanics): `POST /admin/enrollments`, `POST /me/enrollments`, `POST /me/lessons/:id/complete`, `POST /admin/enrollments/:id/complete`, `POST /admin/enrollments/:id/reset-progress`, `POST /instructor/courses/:id/enrollments/complete`, and (optionally, for a discrete event rather than a heartbeat) `POST /me/lessons/:id/progress`. When supplied, the SAME `(actor, endpoint, key, payload)` tuple replays the original result instead of repeating the mutation; the SAME key with a DIFFERENT payload is rejected `409`.

## Admin — Lessons (`course.module.manage` permission, reused from Part 1)

| Method | Path |
|---|---|
| POST | `/admin/modules/:moduleId/lessons` |
| GET | `/admin/modules/:moduleId/lessons` |
| GET | `/admin/lessons/:lessonId` |
| PATCH | `/admin/lessons/:lessonId` |
| POST | `/admin/modules/:moduleId/lessons/reorder` |
| POST | `/admin/lessons/:lessonId/archive` |
| POST | `/admin/lessons/:lessonId/restore` |

## Admin — Learning Activities (`course.module.manage`)

| Method | Path |
|---|---|
| POST | `/admin/lessons/:lessonId/activities` |
| GET | `/admin/lessons/:lessonId/activities` |
| PATCH | `/admin/activities/:activityId` |
| POST | `/admin/lessons/:lessonId/activities/reorder` |
| POST | `/admin/activities/:activityId/archive` |

## Admin — Enrollments (`course.manageInstructors` permission, reused from Part 1)

| Method | Path |
|---|---|
| POST | `/admin/enrollments` — body `{ userId, courseId, source?, accessStartAt?, accessEndAt?, reason? }` |
| GET | `/admin/enrollments?courseId=&userId=&status=&page=&pageSize=` |
| GET | `/admin/enrollments/:id` |
| POST | `/admin/enrollments/:id/suspend` — body `{ reason }` |
| POST | `/admin/enrollments/:id/reactivate` — body `{ reason? }` |
| POST | `/admin/enrollments/:id/revoke` — body `{ reason }` |
| POST | `/admin/enrollments/:id/extend-access` — body `{ accessEndAt }` |
| POST | `/admin/enrollments/:id/complete` — body `{ scope, targetId, reason }` (FR-113 override) |
| POST | `/admin/enrollments/:id/reset-progress` — body `{ scope, targetId, reason }` |

## Instructor-scoped (ownership-checked via `assertInstructorOwnsCourse`/`assertInstructorOwnsModule`/`assertInstructorOwnsLesson`)

| Method | Path |
|---|---|
| POST/GET | `/instructor/modules/:moduleId/lessons` |
| GET/PATCH | `/instructor/lessons/:lessonId` |
| POST | `/instructor/modules/:moduleId/lessons/reorder` |
| POST/GET | `/instructor/lessons/:lessonId/activities` |
| PATCH | `/instructor/activities/:activityId` |
| GET | `/instructor/courses/:id/enrollments` — read-only, course-scoped |
| POST | `/instructor/courses/:id/enrollments/complete` — body `{ enrollmentId, scope: 'LESSON'|'MODULE', targetId, reason }` (COURSE scope deliberately excluded — admin-only) |

## Student — `/me/*` (every handler reads the acting user from `req.user!.id` only)

| Method | Path | Notes |
|---|---|---|
| POST | `/me/enrollments` | body `{ courseId }` only — source is always resolved to `FREE` server-side |
| GET | `/me/enrollments` | learner's own enrollments |
| GET | `/me/courses/:courseId/access` | returns an `AccessDecision` |
| GET | `/me/courses/:courseId/progress` | derived module/course progress |
| GET | `/me/courses/:courseId/continue-learning` | see `CONTINUE_LEARNING.md` |
| GET | `/me/lessons/:lessonId` | full content, access-evaluator-gated |
| POST | `/me/lessons/:lessonId/progress` | body `{ timeSpentDeltaSeconds?, watchedPercent?, lastPosition? }`; optional `Idempotency-Key` header |
| POST | `/me/lessons/:lessonId/complete` | manual completion — CORRECTED: only satisfiable when every automatic condition in the lesson's effective rule set (`MINIMUM_WATCH_PERCENT`/`ALL_ACTIVITIES_VIEWED`) is actually met server-side; rejects `400` with `{ unmetRules: [...] }` otherwise; always rejects `INSTRUCTOR_APPROVAL` lessons outright |
| POST | `/me/activities/:activityId/viewed` | NEW this correction pass — reports one activity viewed (idempotent); the discrete signal `ALL_ACTIVITIES_VIEWED` completion is derived from, see `COMPLETION_ENGINE.md` |

## HTTP status conventions (unchanged from Part 1)

`400` validation, `401` unauthenticated, `403` forbidden/access-denied (body includes `{ reason, ...detail }` from the `AccessDecision` for content-access denials), `404` not-found-or-not-visible (used deliberately for both "doesn't exist" and "you may not know it exists" cases, same anti-enumeration discipline as Part 1), `409` conflict (duplicate enrollment race, invalid state transition).

## Deferred (not implemented in Part 2, re-confirmed after the correction pass)

- No public (unauthenticated) lesson-listing endpoint under `/courses/:slug/lessons` — Part 1's `/courses/:slug/modules` remains the public "syllabus" surface; a public per-module lesson-summary listing was judged out of the mandatory Part 2 scope and was not added to avoid unreviewed scope creep.
- No `POST /instructor/modules/:id/release` endpoint for `INSTRUCTOR_RELEASE`-type modules — the release-rule READ path is fully implemented and enforced (`access-evaluator.service.ts`), but the write action an instructor would use to flip `manuallyReleasedAt` was not built. See `DECISION_GATES.md` gate #23.
- No Waitlist API surface (FR-029) — genuinely deferred, see `DECISION_GATES.md` gates #20/#41.

## CORRECTED (were previously listed as deferred; now implemented)

- `Idempotency-Key` header support — see the correction section above.
- `POST /me/activities/:activityId/viewed` — new endpoint, see above.
