# LMS API Contracts — Conventions

**Status**: Written retrospectively from the implemented code (`backend/src/routes/v1/lms.routes.ts`, mounted at `/api/v1/lms` via `backend/src/routes/v1/index.ts`). Covers every one of the 193 route registrations that exist today. Nothing here describes a planned or future endpoint.

This directory splits the LMS API surface into domain files. Every file follows the same table shape: **Method | Path | Auth / RBAC | Request | Response | Notes**. Paths are relative to `/api/v1/lms`.

## Files in this directory

| File | Domain |
|---|---|
| [catalog-and-content.md](./catalog-and-content.md) | Categories, courses, versions, instructors, translations, clone, modules, lessons, activities, resources, cohorts |
| [enrollment-and-access.md](./enrollment-and-access.md) | Enrollment lifecycle (admin/instructor/self), organization-admin assignment, bulk import |
| [progress-and-completion.md](./progress-and-completion.md) | Lesson/activity progress, video playback telemetry, streak, curriculum/continue-learning, notes, bookmarks |
| [assessments.md](./assessments.md) | Quizzes, questions, question bank, quiz attempts |
| [assignments-and-projects.md](./assignments-and-projects.md) | Assignments, rubric criteria, projects, submissions, feedback messages, peer review |
| [certificates.md](./certificates.md) | Certificate templates, issuance, public verification |
| [reviews-and-announcements.md](./reviews-and-announcements.md) | Course reviews/moderation, course announcements, waitlist, wishlist |
| [analytics-and-governance.md](./analytics-and-governance.md) | Course/enrollment/lesson analytics, academic integrity, `LmsSettings` |

## Response envelope

Every endpoint (success or error) returns the shared envelope from `shared/src/types/api-response.type.ts` — there is no endpoint-specific response shape outside of the `data` payload.

```ts
// Success
{ success: true; data: T; meta?: { page, pageSize, total, totalPages } }  // meta present only on paginated list endpoints

// Error
{ success: false; error: { code: string; message: string; details?: unknown } }
```

Pagination query params (list endpoints only): `page` (default 1), `pageSize` (default 20, max 100) — from `shared/src/constants/api.constants.ts`. No cursor-based pagination exists anywhere in the LMS API.

## Authentication

Every route below `/api/v1/lms` requires `authenticate` (a valid session/JWT) **except**:
- `GET /categories`, `GET /courses`, `GET /courses/:slug`, `GET /courses/:slug/modules`, `GET /certificates/verify/:credentialId`, `GET /courses/:courseId/reviews` — fully public, no auth.
- `GET /courses/:slug` additionally runs `authenticateOptional` — if a valid session is present, the response includes learner-specific fields (e.g. enrollment status); if not, it returns the public-only shape. This is the only endpoint with this dual behavior.

All public GET endpoints carry `cacheControl` middleware (HTTP caching headers) — not a data-shape concern, but relevant to clients expecting `Cache-Control`/`ETag` semantics.

## RBAC model

Full vocabulary and role list: see [research.md](../research.md#rbac) and `backend/src/auth/rbac.constants.ts`. Each route-table file below lists the **exact middleware name** used in the route registration; here is what each resolves to:

| Route-table alias | Resolves to | Meaning |
|---|---|---|
| `requirePermission('course.view')` | `course.view` | Read access to admin/instructor course data |
| `requirePermission('course.create')` | `course.create` | Create new courses |
| `requirePermission('course.update')` | `course.update` | Edit course fields, status transitions (non-archive) |
| `requirePermission('course.archive')` | `course.archive` | Archive/restore a course |
| `manageModules` | `course.module.manage` | Create/edit modules, lessons, activities, resources, quizzes/questions, question bank, assignments/criteria, projects, announcements, certificate templates |
| `manageInstructors` | `course.manageInstructors` | Assign/remove instructors, most enrollment lifecycle admin actions, peer-review moderation, review moderation, certificate revocation |
| `meBaseline` | `course.view` (baseline authenticated-user check only) | **Not** the real access gate — every `/me/*` endpoint additionally runs a per-resource `access-evaluator` check inside the controller (entitlement + enrollment status + course visibility). `meBaseline` only proves the caller is an authenticated platform user; a learner with no enrollment still gets a 403 from the evaluator, not from this middleware. |
| `analyticsView` | `course.view` | Analytics dashboards (enrollment/course/lesson) |
| `adminCategoryPermission` | `course.category.manage` | Category CRUD |
| `adminSettingsPermission` | `course.settings.manage` | `LmsSettings` read/write |
| `adminIntegrityPermission` | `course.academicIntegrity.manage` | Academic-integrity case/appeal resolution |
| `adminCohortPermission` | `course.cohort.manage` | Cohort CRUD, membership, schedule |
| `orgManageOwn` | `organization.manage_own` | Organization-admin course assignment endpoints — additionally self-scoped to the caller's own `organizationId` at the service layer (never trust the permission bit alone; every org endpoint re-checks `actor.organizationId === target.organizationId`) |
| `requirePermission('course.module.manage')` (used directly on `/instructor/*` routes) | `course.module.manage` | Same permission as `manageModules`, granted to the `course_instructor` role for their own assigned courses only — ownership is re-checked at the service layer (an instructor permission alone does not scope to "my courses") |

Unauthenticated or under-permissioned requests receive a generic `403 FORBIDDEN` envelope (`error.code = "FORBIDDEN"`); business-rule and per-resource access denials (e.g. "not enrolled," "course not published") are also `403`s but carry a specific machine-readable `details.reason` — see the error taxonomy below.

## Error taxonomy

**Generic codes** (`shared/src/constants/api.constants.ts`, `ERROR_CODES`) — the only values `error.code` ever takes:
`VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR | RATE_LIMITED`

**LMS business-rule codes** (`backend/src/lms/lms-error-codes.ts`, `LMS_BUSINESS_RULE_CODES`) — surfaced only inside `error.details` on a `403 FORBIDDEN` or `409 CONFLICT` response, never as the top-level `error.code`:
| Code | Meaning |
|---|---|
| `COURSE_FULL` | `Course.enrollmentLimit` reached at self-enroll time |
| `QUIZ_ATTEMPT_LIMIT_REACHED` | `Quiz.maxAttempts` exhausted |
| `ASSIGNMENT_ATTEMPT_LIMIT_REACHED` | `Assignment.maxAttempts` exhausted |
| `CERTIFICATE_NOT_ELIGIBLE` | One or more `eligibilitySnapshot` conditions failed at issuance attempt |

**Access-denial reasons** (`backend/src/lms/access.types.ts`, `AccessDenialReason`) — surfaced in `details.reason` on every `403` returned by the access-evaluator layer (the real gate behind every `meBaseline` route). A verified, disjoint set from the business-rule codes above (unit-tested to never collide). Exact 16 values and shapes are documented per-endpoint in the domain files where they apply; the common ones seen across most `/me/*` reads are `NOT_ENROLLED`, `ENROLLMENT_NOT_ACTIVE`, `COURSE_NOT_VISIBLE`, `LESSON_LOCKED`, `MODULE_LOCKED`.

## Validation

Every mutating endpoint (and most reads with params) runs a Zod schema via the shared `validate(schema)` middleware (`backend/src/lms/*.validation.ts`), validating `params`/`query`/`body` together and returning `400 VALIDATION_ERROR` with `error.details` = the Zod issue list on failure. Domain files below name the concrete validation constraints that matter for integration (length limits, enum membership, cross-field rules) — not a full schema dump, since the `.validation.ts` files themselves are the authoritative source.

## Idempotency

Selected learner-mutation endpoints (self-enroll, submission creation, quiz-attempt start) accept an optional `Idempotency-Key` request header, scoped per-actor via `scopedIdempotencyKey()` (`backend/src/lms/lms-idempotency.util.ts`) so two different learners supplying the same literal key never collide, and a replayed request from the same actor+key returns the original result rather than creating a duplicate. Not present on every mutating endpoint — only ones with a plausible double-submit risk.
