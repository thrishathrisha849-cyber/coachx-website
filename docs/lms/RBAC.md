# LMS RBAC (Phase 6 Part 1)

Status: **Implemented**, reusing the existing Phase 4 deny-by-default
RBAC engine unchanged — no second permission engine, no duplicated roles.

## Naming convention deviation from the brief — explained

The Phase 6 brief's own suggested permission list uses an `lms.*` prefix
(`lms.course.create`, `lms.module.reorder`, etc.). This codebase's
ALREADY-ESTABLISHED convention (`backend/src/auth/rbac.constants.ts`,
Phase 4) is a bare `resource.action` form with no feature-name prefix —
`course.view`/`course.create`/`course.publish` already existed before
this phase, cited directly from `003/spec.md` FR-068 examples. Per the
brief's own instruction ("Follow the existing permission naming
convention exactly") and `rbac.constants.ts`'s own stated philosophy
("deliberately small... NOT a full platform permission catalog — future
features add their own `resource.action` permissions as they are
built, following this same naming convention"), Part 1 EXTENDS the
existing `course.*` namespace instead of introducing a parallel `lms.*`
one:

| Permission | New in Part 1? | Description |
| --- | --- | --- |
| `course.view` | No (Phase 4) | View courses/categories/modules |
| `course.create` | No (Phase 4) | Create a course |
| `course.publish` | No (Phase 4) | Transition a course into `PUBLISHED`/`SCHEDULED` |
| `course.update` | **Yes** | Edit course metadata without necessarily publishing |
| `course.archive` | **Yes** | Archive/restore a course |
| `course.manageInstructors` | **Yes** | Assign/remove/set-primary instructors |
| `course.module.manage` | **Yes** | Create/edit/reorder/archive modules |
| `course.category.manage` | **Yes** | Create/edit/reorder/archive categories |

`course.category.manage` is nested under `course.` (not a bare
`category.*`) specifically to avoid a future name collision — an
unrelated feature (e.g. Marketplace, Jobs) could plausibly want its own
"category" concept, and a bare `category.manage` permission would
ambiguously apply to all of them.

Consolidation choice: the brief suggests 14 granular permissions (one
per module/category CRUD verb); Part 1 uses 5 new ones (plus 3 reused).
This mirrors `rbac.constants.ts`'s own explicit "do not invent dozens of
placeholder permissions" philosophy — module reorder/create/update/
archive are all gated by the SAME `course.module.manage` permission
because no product requirement in this phase distinguishes them (an
actor who can create a module can reasonably reorder one).

## Default role grants

| Role | New grants in Part 1 |
| --- | --- |
| `course_instructor` | `course.update`, `course.module.manage` (already had `course.view`, `course.create`) |
| `content_manager` | `course.update`, `course.archive`, `course.manageInstructors`, `course.module.manage`, `course.category.manage` (already had `course.view`, `course.create`, `course.publish`) |
| `platform_admin` | Same additions as `content_manager` |
| `super_admin` | Everything (auto-inherits via `BASELINE_PERMISSIONS.map(...)`, unchanged mechanism) |
| Every other role | No new grants (unchanged) |

**`course_instructor` deliberately does NOT hold `course.publish` or
`course.archive` or `course.manageInstructors`.** An instructor can
author/edit their OWN assigned course's metadata and modules
(`DRAFT`/`SUBMITTED_FOR_REVIEW`-stage work, including resubmitting after
`CHANGES_REQUESTED`), but review decisions (approve/request changes),
publishing, archiving, and instructor reassignment remain
`content_manager`/`platform_admin` actions — the spec's explicit
"Instructor cannot publish unless explicitly permitted."

## Two-layer authorization: permission + ownership

RBAC permissions alone answer "CAN this role ever do X." They do NOT
answer "can THIS instructor edit THIS SPECIFIC course" — that is a
separate, per-resource ownership check (`assertInstructorOwnsCourse()`
in `course.service.ts`), enforced on every route under
`/api/v1/lms/instructor/*`. See `docs/lms/SECURITY.md` for the IDOR
threat this closes.

## Body-aware permission check: review/publish/archive tiers

**CORRECTED (spec-alignment pass)** — the original check only gated
`PUBLISHED`/`SCHEDULED`; it now covers every status the FR-100/FR-015
workflow adds. The route-level `requirePermission(...)` middleware
cannot see the request BODY (only the route path is known when
middleware runs), so `POST /api/v1/lms/admin/courses/:id/status`'s route
only requires the baseline `course.update` (so a `course_instructor` CAN
submit `DRAFT → SUBMITTED_FOR_REVIEW`, or resubmit from
`CHANGES_REQUESTED`), and `admin-lms.controller.ts`'s `postCourseStatus`
handler does a SECOND, body-aware check:

- Target status `CHANGES_REQUESTED`, `APPROVED`, `SCHEDULED`, or
  `PUBLISHED` → requires `course.publish` (the reviewer/publisher tier —
  FR-100's Author/Reviewer/Publisher role separation is expressed at the
  permission level as "editor" vs. "reviewer-or-publisher," not as 4
  separate granular permissions, per this file's "do not invent dozens
  of placeholder permissions" philosophy).
- Target status `UNLISTED`, `ENROLLMENT_PAUSED`, `ARCHIVED`, or
  `RETIRED` → requires `course.archive` (the same permission the
  dedicated `/archive` and `/restore` endpoints already use — so the
  generic status endpoint can't be used to bypass that gate).
- Target status `SUBMITTED_FOR_REVIEW` or `DRAFT` → the baseline
  `course.update` is sufficient (an instructor's own submit/resubmit/
  pull-back actions).

Verified by an integration test asserting an instructor can submit their
own course for review but is rejected (403) attempting to approve,
publish, or archive it.

## Seed mechanism

`database/seeds/rbac.seed.ts` was updated with the same 5 new
permission keys and grant changes — the SAME documented, accepted
duplication as Phase 4 (`docs/auth/DECISION_GATES.md` #16): the seed
script can't import from `backend/` (separate npm workspace, must run
standalone via `tsx`). Both lists were updated together in this phase's
diff — verified by eye, not by an automated drift check (same
limitation as gate #16).

## Phase 6 Part 2 addendum — no new permissions added

Every new Lesson/Activity/Enrollment endpoint reuses an EXISTING Part 1 permission rather than inventing new ones:

- Lesson/Activity admin+instructor CRUD → `course.module.manage` (a lesson/activity is content belonging to a module; not a materially different privilege at this phase's granularity).
- Enrollment admin actions (grant/suspend/reactivate/revoke/extend-access/override-complete/reset-progress) → `course.manageInstructors` (the existing "administers who has privileged access to a course" tier).
- Student `/me/*` routes → `course.view` (the same baseline every authenticated consumer role already holds); the SPECIFIC course/lesson a caller may act on is then gated by the access evaluator inside the controller, not by RBAC alone — RBAC answers "is this a legitimate API consumer," the access evaluator answers "does THIS user have access to THIS content."

No `RoleName` was added or changed. `rbac.constants.ts` and `database/seeds/rbac.seed.ts` are both UNCHANGED by Part 2 — verified via `git diff` showing zero modifications to either file during this phase.

Instructor-scoped enrollment/completion routes additionally enforce course ownership (`assertInstructorOwnsCourse`/`assertInstructorOwnsModule`/`assertInstructorOwnsLesson`) exactly as Part 1's module/lesson routes already did — an instructor holding `course.module.manage` still cannot touch another instructor's course, verified by the integration suite's IDOR scenarios.
