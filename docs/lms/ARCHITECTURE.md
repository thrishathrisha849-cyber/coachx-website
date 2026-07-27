# LMS Architecture (Phase 6 Part 1)

Status: **Implemented** for the course-engine foundation described below.
Owner: 004-learning-management-system (Volume 04). Scope: course
categories, courses, course modules, instructor assignment, and the
course publish lifecycle — see `docs/lms/TRACEABILITY_PART1.md` for what
is explicitly NOT in Part 1 (Lesson, Enrollment, Progress, Quiz,
Assignment, Certificate, Review — Parts 2/3).

## Architecture conflict — reported, not silently resolved

`004/plan.md` assumes **NestJS** (backend), **Next.js** (web), and
**Flutter** (mobile), plus several vendor integrations marked
`NEEDS CLARIFICATION` in the spec itself (video CDN, live-class OAuth
provider, plagiarism-check service). None of this matches the real,
approved stack already built and shipped in Phases 1–5: **Express +
TypeScript** (Clean Architecture: routes → controllers → services →
repositories, flat domain folders) and a **Vite + React Router
client-rendered SPA**. Per this project's established practice (same
decision made in Phases 4 and 5 — see `docs/auth/TRACEABILITY.md` §1,
`docs/public-site/ARCHITECTURE.md`), this mismatch is reported here and
NOT silently resolved by editing `004/spec.md`/`plan.md` — implementation
proceeds against the real, approved stack. No second ORM, validation
framework, auth system, RBAC system, or API-response shape was
introduced; the LMS module reuses Prisma, Zod, `AppError`, the existing
deny-by-default RBAC engine, and `buildSuccessResponse`/
`buildErrorResponse` exactly as Phases 3–5 already established.

## Scope conflict — a deliberate subset, also reported

`004/spec.md`'s FR-001 describes a much deeper content hierarchy
(**Learning Path → Program → Course → Module → Lesson → Learning
Activity → Assessment → Outcome**). The implementation-driving brief
explicitly scoped Part 1 to **Category → Course → Module** only (no
Learning Path, Program, Cohort, Lesson, or Assessment) — this narrowing
is a deliberate, documented simplification, not a silent gap.

**CORRECTION (spec-alignment pass, superseding the paragraph above as
originally written):** the Course status lifecycle was ORIGINALLY built
from a generic, prompt-supplied 7-state list
(`DRAFT/REVIEW/APPROVED/SCHEDULED/PUBLISHED/UNPUBLISHED/ARCHIVED`) that
had no basis in `004/spec.md` at all — `REVIEW` and `UNPUBLISHED` do not
appear anywhere in the spec. A dedicated specification-alignment audit
caught this and it was corrected to the actual FR-015 (12 editorial
statuses with defined per-status access behavior) reconciled against
FR-100 (the 6-state Author/Reviewer/Compliance-reviewer/Publisher
review workflow) — see `docs/lms/COURSE_LIFECYCLE.md` for the full
reconciliation and `docs/lms/DECISION_GATES.md` gate #17 for the
before/after record. This is the corrected discipline going forward:
scope-narrowing (which FRs to build) is a legitimate, documented brief
decision; INVENTING field/state values a brief merely suggests without
grounding them in the actual spec text is not — every enum value and
field in this module must now trace to a specific FR.

## Layer overview

```
backend/src/lms/
├── lms.types.ts                 Public/Admin serializer-output DTOs
├── lms.validation.ts            Zod request schemas (create/update/query/reorder)
├── lms.serializers.ts           Explicit Prisma-row → DTO mappers (never leak a raw row)
├── course-lifecycle.policy.ts   THE ONE place status-transition legality + publish-readiness + visibility-window logic lives
├── category.repository.ts / category.service.ts
├── course.repository.ts / course.service.ts
├── module.repository.ts / module.service.ts
├── instructor.repository.ts / instructor.service.ts
├── lms.controller.ts            Public read handlers
├── admin-lms.controller.ts      Admin write handlers
└── instructor-lms.controller.ts Instructor-scoped handlers (ownership-checked)

backend/src/routes/v1/lms.routes.ts   Route registration + permission gates (single file, mirrors cms.routes.ts)
```

Same controller→service→repository separation Phases 3–5 already
established (`backend/src/cms/` is the direct template this module
follows). No giant single service — each of Category/Course/Module/
Instructor owns its own repository+service pair; `course.service.ts` is
the largest because it's the one file that has to coordinate the
lifecycle policy, publish-readiness check, and module-count check
together (still under 300 lines).

## Three route-audience tiers (a genuine LMS-specific addition over CMS's two)

```
/api/v1/lms/*              Public reads — no auth
/api/v1/lms/admin/*        Admin writes — authenticate + requirePermission('course.*')
/api/v1/lms/instructor/*   Instructor-scoped writes — authenticate + requirePermission(...) + assertInstructorOwnsCourse()
```

CMS only needed two tiers (public/admin) because CMS content has no
per-author-ownership concept — any `content.manage` holder can edit any
page. LMS courses DO have an ownership concept (an instructor manages
their OWN assigned courses, not everyone's) — hence the third tier. See
`docs/lms/RBAC.md` for the permission model and
`docs/lms/SECURITY.md` for the ownership/IDOR enforcement details.

## Request flow (public read)

```
Browser → frontend/src/api/lms.api.ts (axios)
        → backend/src/routes/v1/lms.routes.ts [cacheControl]
        → lms.controller.ts → course.service.ts/category.service.ts
        → course.repository.ts/category.repository.ts → Prisma
```

`cacheControl` is reused directly from `backend/src/cms/cache-control.middleware.ts`
rather than duplicating an identical file under `lms/` — it is generic,
CMS-agnostic middleware (a `Cache-Control`/`Vary` header setter with no
CMS-specific logic) that happens to live in the `cms/` folder from when
it was first introduced. Documented here as a conscious reuse decision;
a future cleanup could hoist it to a shared/common location — see
Decision Gates.

## Money-safe pricing (no payment processing)

`Course.priceAmountMinor` is an **integer** (minor units — e.g. paise
for INR), never a float, exactly matching the brief's explicit "Do not
use floating-point storage for price." `priceType: 'FREE'` is validated
(both at the Zod layer and defense-in-depth nowhere else, since the DB
column has no CHECK constraint Prisma can express) to always carry
`priceAmountMinor = 0`. No payment gateway, checkout, or entitlement
logic exists here — this is metadata only, for a future 009-membership-
payments feature to read.

## What is NOT built in Part 1 (see docs/lms/DECISION_GATES.md and TRACEABILITY_PART1.md)

Lesson content (video/PDF/rich-text/quiz/assignment lesson types),
Enrollment, Student progress, Continue Learning, Quizzes, Assignments,
Certificates, Reviews/ratings, Wishlist, Learning Path/Program/Cohort
entities, payment processing, and any admin editor UI beyond the minimal
scope described in `docs/lms/DECISION_GATES.md`'s admin-frontend gate.
