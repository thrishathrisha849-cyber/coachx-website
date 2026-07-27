# LMS API Reference — Part 1

Status: **Implemented**. Source of truth:
`backend/src/routes/v1/lms.routes.ts`. Every response uses the
platform-wide envelope (`@coachx/shared`'s `ApiSuccessResponse`/
`ApiErrorResponse`), unchanged since Phase 1 — see
`docs/public-site/API_REFERENCE.md`'s "Response envelope" section for
the exact shape (not repeated here).

**CORRECTION (spec-alignment pass):** the `status` value set below was
rewritten from a generic prompt-supplied list to 004/spec.md's actual
FR-015/FR-100 states, and the `visibility` field/query param was removed
entirely (folded into `status` — see `docs/lms/COURSE_LIFECYCLE.md` and
`docs/lms/DATA_MODEL.md`). Course/module create/update bodies also gained
the FR-014/FR-016 fields (`learningOutcomes`, `tags`, `targetAudience`,
`toolsRequired`, `weeklyCommitmentMinutes`, `certificateAvailable` on
Course; `outcome`, `estimatedDurationMinutes`, `isMandatory`,
`prerequisiteModuleId`, `releaseRuleType`/`releaseRuleValue`,
`completionRuleType` on Module) that the original implementation omitted.

## Endpoint-naming note (brief vs. actual)

The Phase 6 brief's own example paths use `/api/admin/lms/...`,
`/api/instructor/lms/...`, `/api/public/lms/...` (no `/v1`, `lms` as the
outer path segment, audience as a separate outer prefix). This repo's
established, already-approved convention (Phases 4–5) is
`/api/v1/<module>/...` with the module as the outer segment and
audience as an INNER segment — matching `/api/v1/cms/*` vs
`/api/v1/cms/admin/*`. Per the brief's own "Adapt endpoint names only
when required by existing repository conventions" instruction, the
table below reflects the ACTUAL implemented paths.

| Brief's example | Actual implemented path |
| --- | --- |
| `POST /api/admin/lms/categories` | `POST /api/v1/lms/admin/categories` |
| `GET /api/public/lms/courses` | `GET /api/v1/lms/courses` |
| `GET /api/instructor/lms/courses` | `GET /api/v1/lms/instructor/courses` |

## Public reads (no auth)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/lms/categories` | `?parentId=` — `ACTIVE` categories only |
| GET | `/api/v1/lms/courses` | `?q=&categoryId=&level=&language=&instructorId=&featured=&priceType=&sort=newest\|title\|featured&page=&pageSize=` |
| GET | `/api/v1/lms/courses/:slug` | Full detail incl. published modules; 404 if not publicly visible |
| GET | `/api/v1/lms/courses/:slug/modules` | Convenience endpoint — same module list `courses/:slug`'s response already includes |

All public GETs carry the same `Cache-Control: public, max-age=60,
stale-while-revalidate=300` / `Vary: Authorization` headers as CMS
public reads (reused middleware — see `docs/lms/ARCHITECTURE.md`).

## Admin writes (`authenticate` + `requirePermission(...)`)

### Categories

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/api/v1/lms/admin/categories` | `course.category.manage` |
| GET | `/api/v1/lms/admin/categories` | `course.category.manage` — `?status=&parentId=&sort=sortOrder\|name&page=&pageSize=` |
| GET | `/api/v1/lms/admin/categories/:id` | `course.category.manage` |
| PATCH | `/api/v1/lms/admin/categories/:id` | `course.category.manage` |
| POST | `/api/v1/lms/admin/categories/reorder` | `course.category.manage` — body `{ parentId, orderedIds }` |
| POST | `/api/v1/lms/admin/categories/:id/archive` | `course.category.manage` |
| POST | `/api/v1/lms/admin/categories/:id/restore` | `course.category.manage` |

### Courses

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/api/v1/lms/admin/courses` | `course.create` |
| GET | `/api/v1/lms/admin/courses` | `course.view` — `?q=&status=&categoryId=&instructorId=&sort=&page=&pageSize=` |
| GET | `/api/v1/lms/admin/courses/:id` | `course.view` |
| PATCH | `/api/v1/lms/admin/courses/:id` | `course.update` |
| POST | `/api/v1/lms/admin/courses/:id/status` | `course.update` baseline; `course.publish` additionally required for `CHANGES_REQUESTED`/`APPROVED`/`SCHEDULED`/`PUBLISHED`; `course.archive` additionally required for `UNLISTED`/`ENROLLMENT_PAUSED`/`ARCHIVED`/`RETIRED` (**CORRECTED** — see `docs/lms/RBAC.md`). Body: `{ status, reviewNote? }` — `reviewNote` is REQUIRED when `status: 'CHANGES_REQUESTED'`. |
| POST | `/api/v1/lms/admin/courses/:id/archive` | `course.archive` |
| POST | `/api/v1/lms/admin/courses/:id/restore` | `course.archive` |

### Instructor assignment

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/api/v1/lms/admin/courses/:id/instructors` | `course.manageInstructors` |
| GET | `/api/v1/lms/admin/courses/:id/instructors` | `course.view` |
| DELETE | `/api/v1/lms/admin/courses/:id/instructors/:userId` | `course.manageInstructors` — 409 if this is the course's only instructor |
| POST | `/api/v1/lms/admin/courses/:id/instructors/:userId/primary` | `course.manageInstructors` |

### Modules

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/api/v1/lms/admin/courses/:courseId/modules` | `course.module.manage` |
| GET | `/api/v1/lms/admin/courses/:courseId/modules` | `course.view` |
| GET | `/api/v1/lms/admin/modules/:moduleId` | `course.view` |
| PATCH | `/api/v1/lms/admin/modules/:moduleId` | `course.module.manage` |
| POST | `/api/v1/lms/admin/courses/:courseId/modules/reorder` | `course.module.manage` — body `{ orderedIds }` |
| POST | `/api/v1/lms/admin/modules/:moduleId/archive` | `course.module.manage` |
| POST | `/api/v1/lms/admin/modules/:moduleId/restore` | `course.module.manage` |

## Instructor-scoped (`authenticate` + permission + ownership check)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/lms/instructor/courses` | Only courses the caller is assigned to |
| GET | `/api/v1/lms/instructor/courses/:id` | 403 if not assigned (see `docs/lms/SECURITY.md`) |
| PATCH | `/api/v1/lms/instructor/courses/:id` | 403 if not assigned; no status/publish route exposed here at all |
| POST | `/api/v1/lms/instructor/courses/:id/modules` | 403 if not assigned |
| GET | `/api/v1/lms/instructor/courses/:id/modules` | 403 if not assigned |
| PATCH | `/api/v1/lms/instructor/modules/:moduleId` | Ownership resolved via the module's `courseId`, not a client-supplied course id |
| POST | `/api/v1/lms/instructor/courses/:id/modules/reorder` | 403 if not assigned |

## Audit events

| Event | Recorded on |
| --- | --- |
| `lms.category.created` / `.updated` / `.reordered` / `.archived` / `.restored` | Category writes |
| `lms.course.created` / `.updated` / `.status_changed` | Course writes |
| `lms.instructor.assigned` / `.removed` / `.primary_changed` | Instructor assignment writes |
| `lms.module.created` / `.updated` / `.reordered` / `.archived` / `.restored` | Module writes |

Every event follows the platform-wide `AuditEvent` shape
(`recordAuditEvent()`, unchanged since Phase 3) — actor, action,
resource type/id, before/after state where meaningful, all redacted
before persistence.

## Idempotency — decision, not silently omitted

The existing `beginIdempotentOperation()` mechanism (Phase 3) was
**deliberately NOT wired into any Part 1 write path.** Course/category
slug uniqueness already provides safe conflict semantics for a
rapid-double-submit create (the second request 409s on the unique
constraint rather than creating a duplicate) — the exact failure mode
idempotency-key protection exists to prevent. Wiring it in everywhere
(instructor assignment, module creation, every lifecycle transition)
would be speculative over-engineering for a Part 1 admin surface with
no evidence of a double-submit problem. See Decision Gates.

## Deferred to Part 2 / Part 3

No routes exist yet for: Lesson content, Enrollment, Progress, Continue
Learning, Quiz, Assignment, Certificate, Review/Rating. See
`docs/lms/TRACEABILITY_PART1.md`.
