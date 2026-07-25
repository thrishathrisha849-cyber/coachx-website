# Implementation Plan: Learning Management System: Courses, Assessments & Certification

**Branch**: `004-learning-management-system` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-learning-management-system/spec.md`

## Summary

This feature builds the full learning content hierarchy (Learning Path → Program → Course → Module → Lesson), server-verified entitlement and enrollment, multi-condition lesson completion, quizzes/question banks, rubric-graded assignments with optional peer review, certificate issuance and public verification, drip/prerequisite gating, the instructor course-builder and content-review workflow, course cloning/versioning, learning analytics and at-risk detection, and AI-assisted learning within explicit integrity bounds.

It is the platform's primary implementation of **Constitution Article IX (Action Before Consumption)** — the constitution's own text cites this volume by name ("Vol 04 rejects 'video-watched' as success metric"), and FR-053 restates the article almost verbatim. It reuses **001**'s `EntitlementGuard`/`RbacGuard` for entitlement verification and instructor permission granularity, **008**'s AI Assistant platform for every AI-in-learning capability (lesson summary, quiz explanation, recommendation fallback), **007**'s mentor identity for "mentor approval" prerequisites and mentor checkpoints, **005**'s community infrastructure for lesson discussions (LMS-scoped only), **006**'s gamification for anything beyond LMS-local streak tracking, and **009** as the system of record for the financial side of every entitlement source it consumes (membership, purchase, coupon, scholarship). It does **not** build a course-content Draft→Published workflow by literally reusing `001`'s generic Content Item lifecycle service — Course review states (Draft → Submitted for review → Changes requested → Approved → Scheduled → Published, FR-100) are a superset with different semantics (author/reviewer/compliance-reviewer/publisher role separation) than `001`'s simpler five-state Content Item lifecycle, so this feature defines its own workflow state machine, explicitly *not* claiming reuse of a pattern that doesn't actually match — a direct application of the lesson from the 001/002 traceability-review correction.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–003.

**Primary Dependencies**: NestJS (backend), Next.js (web), Flutter (mobile — offline-sync-critical for this feature per FR-091–093), an adaptive video-streaming/CDN service with signed-URL generation (NEEDS CLARIFICATION: no vendor named in source, consistent with Volume 01's provider-abstraction principle), a live-class provider client for Google Meet/Zoom OAuth+webhook integration, a similarity-detection/plagiarism-check integration (NEEDS CLARIFICATION: vendor not named in source), a PDF in-app viewer library, virus/malware scanning for uploads (shared with `002`'s upload-security pattern where applicable).

**Storage**: PostgreSQL (all ~30 entities listed in spec.md's Key Entities — content hierarchy, entitlement, progress, assessment, assignment, certification, live-session, discovery), Redis (progress-sync offline-queue staging, in-progress quiz-attempt timers, rate limits), object storage with signed/expiring URLs for video/PDF/submission-file delivery (FR-045, FR-048, FR-073).

**Testing**: Jest (backend — especially completion-rule and entitlement contract tests), Playwright (web e2e), Flutter test + `integration_test` (mobile — offline download/queue/sync scenarios are the highest-risk area of this feature).

**Target Platform**: Web + mobile, consistent with prior features; video delivery additionally needs CDN edge distribution.

**Performance Goals**: Paginated course catalog, lazy-loaded curriculum, adaptive video streaming, player starts without unnecessary delay, near-real-time (not necessarily instant) cross-device progress sync, cached dashboard analytics, isolated partial-service failure (FR-124).

**Constraints**: Every entitlement and completion decision MUST be server-verified (FR-022, FR-053, Constitution Article I); a lesson MUST NEVER be marked complete solely because its video was opened (FR-053, Constitution Article VIII/IX — this is the constitution's own cited example); circular prerequisite dependencies MUST be rejected at configuration time, not discovered at learner-access time (FR-037, SC-005); every AI-in-learning feature MUST have a deterministic non-AI fallback (FR-088, FR-118, Constitution Article II); final quiz submission, certificate issuance, payment, and live sessions are explicitly disallowed while offline (FR-092).

**Scale/Scope**: ~30 data entities, 125 functional requirements, 9 user stories, an LMS-specific analytics-event taxonomy (FR-109) and error-code taxonomy (FR-125).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Entitlement checked server-side on every content request, not just at enrollment; completion evaluated server-side | **PASS** | FR-022, FR-053, FR-056; SC-001, SC-003 |
| II. AI Is Assistive, Never Autonomous | AI-in-learning is advisory-only with mandatory deterministic fallback; AI must not facilitate cheating | **PASS** | FR-088, FR-117–FR-119, SC-010 |
| III. No Dark Patterns | N/A — no monetization surface owned here; refund/certificate-policy interactions touch monetization edges only | **PASS (N/A)** | FR-030 defers to `009`'s policy |
| IV. Historical Immutability | Course versions snapshot at publish; issued certificates are immutable except through an audited revocation workflow | **PASS** | FR-099, FR-086 |
| V. Ledger-Based Internal Economies | Learning streaks are LMS-local engagement tracking, not a spendable/redeemable balance — Article V does not strictly apply here; anything that IS a redeemable balance (points) is explicitly deferred to `006` | **PASS (N/A / deferred)** | FR-057, spec.md Assumptions |
| VI. Consent Is First-Class | Course-related communications respect preferences set in `003`; this feature does not define its own consent model | **PASS (deferred)** | FR-121 |
| VII. Layered, Explicit RBAC | Granular instructor permissions with publish held as a separate grant from content-editing | **PASS (extends 001)** | FR-095, reuses `001`'s RBAC module |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Completion is never grantable by a passive view event alone | **PASS** | FR-053, SC-001 — direct implementation |
| IX. Action Before Consumption | **This feature is the constitution's own cited source for this article.** Multi-condition completion rules, action-based (not passive) lesson design | **PASS — primary implementer** | FR-052–FR-054; Constitution Article IX cites "Vol 04" by name |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/004-learning-management-system/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: video/CDN provider, live-class provider client library, similarity-detection vendor, default video-completion watch percentage (FR-041), default certificate attendance threshold (FR-081), default course-version existing-learner policy (FR-099), offline-assignment-submission approval mechanism (FR-092)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`/`002`/`003`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── lms-catalog/            # Learning Path, Learning Path Course, Program, Cohort, Course, Course Version, Course Instructor, Module, Lesson, Lesson Content, Lesson Resource (FR-001–020, FR-096)
│   │   ├── lms-entitlement/        # Enrollment, Waitlist; entitlement verification wired to 001's EntitlementGuard (FR-021–033)
│   │   ├── lms-drip/               # Drip release + prerequisite evaluator + circular-dependency detector (FR-034–038)
│   │   ├── lms-progress/           # Lesson/Course/Path/Video Progress; cross-device sync service (FR-039–060)
│   │   ├── lms-assessment/         # Quiz, Question, Question Option, Quiz Attempt, Quiz Answer (FR-061–068)
│   │   ├── lms-assignment/         # Assignment, Submission, Submission File, Rubric, Rubric Criterion, Review, peer review (FR-069–079)
│   │   ├── lms-certificate/        # Certificate Template, Certificate, public verification endpoint (FR-080–086)
│   │   ├── lms-live-session/       # Live Session, Attendance; Google Meet/Zoom integration (FR-050–051, FR-079)
│   │   ├── lms-discovery/          # Course Review, Recommendation Engine, learning search, catalog views (FR-087–090)
│   │   ├── lms-course-builder/     # Block-based authoring editor, course builder wizard, review workflow, cloning, versioning, translation status (FR-094–104)
│   │   ├── lms-analytics/          # Learning analytics, at-risk detection, LMS event taxonomy (FR-105–109)
│   │   ├── lms-integrity/          # Content ownership, plagiarism/originality workflow, academic integrity (FR-115–116)
│   │   └── lms-ai/                 # Thin AI-in-learning wrapper consuming 008's platform, never a separate AI stack (FR-117–119)
│   └── common/                     # reused from 001/002/003: RbacGuard, EntitlementGuard, audit-log interceptor, error-code pattern
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        ├── learn/{page.tsx, [courseId]/{page.tsx, [lessonId]/page.tsx}}   # course catalog, course overview, lesson player
        ├── learn/[courseId]/quiz/[quizId]/page.tsx
        ├── learn/[courseId]/assignment/[assignmentId]/page.tsx
        └── certificates/[credentialId]/page.tsx
    └── (public)/
        └── verify-certificate/[credentialId]/page.tsx   # public, unauthenticated certificate verification
    └── (admin)/
        └── lms/{learning-dashboard,paths,programs,courses,modules,lessons,assessments,question-bank,assignments,certificates,instructors,cohorts,enrollments,reviews,reports,settings}/

mobile/
└── lib/features/
    └── learn/                       # lesson player, quiz/assignment flows, offline download/sync (FR-091–093 — highest offline-complexity area of the app)
```

**Structure Decision**: 13 new backend modules under `lms-*`, kept separate from `001`'s generic `content-governance/` module since Course's review-workflow states and role separation are a distinct, richer state machine (see Summary). Web adds member-facing learning routes plus a public unauthenticated certificate-verification route (mirroring `002`'s public-page pattern) and a large admin LMS operations section. Mobile gets a dedicated offline-first `learn/` feature module given the volume of offline requirements.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |

*Structural note: this feature defines its own Course review-workflow state machine rather than reusing `001`'s Content Item lifecycle (see Summary) — this is a deliberate correction of the exact mistake found in the 001/002 traceability review (claiming pattern-reuse that doesn't hold up under inspection). If a future architect wants a single shared "publishable content" abstraction across `001`'s Content Item, `002`'s Page, and this feature's Course, that would be a refactor to propose explicitly, not something to retrofit silently here.*
