# Research & Design Decisions: Learning Management System

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/](./contracts/)

**Status**: Written retrospectively, after implementation. `plan.md`'s own Phase 0 section defined this file's purpose as resolving a named list of `NEEDS CLARIFICATION` items before implementation began. Implementation instead proceeded incrementally across many batches, resolving (or knowingly not resolving) each item as it was reached. This document records the **actual, final resolution status** of each — not a pre-implementation research plan.

## 1. Architecture: implemented vs. originally planned

`plan.md` (dated 2026-07-23) specified an aspirational stack that this repository does not use:

| Planned (plan.md) | Actually implemented |
|---|---|
| NestJS, modular `src/modules/lms-catalog/`, `lms-entitlement/`, `lms-drip/`, ... | Express + TypeScript, flat `backend/src/lms/*.service.ts` / `*.repository.ts` / `*.controller.ts` / `*.validation.ts` — ~140 files, one flat module, matching the rest of this monorepo's existing (non-NestJS) backend convention |
| Next.js frontend | Vite + React, split across two separate apps: `frontend/` (learner-facing) and `admin/` (admin/instructor-facing) |
| Flutter mobile app | Not built. No mobile client exists anywhere in this repository. |
| Redis (caching / job queue) | Not used. No background job scheduler exists anywhere in the LMS; every "expiry"/"due"/"unlock" check is evaluated at read time (see §5) |
| Signed-URL CDN video delivery | Plain URL strings (`LearningActivity.mediaUrl`), scheme-validated (`https://` or an internal path) but not signed, proxied, or DRM-protected |

This is a documented, pre-existing architecture correction, not a Spec-004-specific decision — the schema's own section header notes the conflict was resolved in favor of the monorepo's existing Express/Prisma convention (see `docs/lms/ARCHITECTURE.md`), the same way Specs 001–003 are also implemented in Express, not NestJS. Every other structural choice below follows from this correction: no DI-container module boundaries, no Nest-style guards/interceptors (RBAC is plain Express middleware — `authenticate`, `requirePermission(...)`, and route-specific aliases; see [contracts/README.md](./contracts/README.md#rbac-model)), no NestJS-native testing harness (tests use Jest directly against the Express app).

One structural choice `plan.md` did get right and the implementation deliberately preserved: **Course review-workflow uses its own state machine** (`course-lifecycle.policy.ts`, `COURSE_VALID_TRANSITIONS`) rather than reusing Spec 001's generic Content Item lifecycle — `plan.md` explicitly frames this as "a deliberate correction of the exact mistake found in the 001/002 traceability review," and the implementation followed through on it.

## 2. Resolution of plan.md's NEEDS CLARIFICATION items

`plan.md`'s Phase 0 section named six items research.md was expected to resolve. Their actual, final status:

| Item | Status | Resolution |
|---|---|---|
| Video/CDN provider | **Never resolved** | No vendor was integrated. `LearningActivity.mediaUrl` remains a plain, scheme-validated URL string the admin supplies directly — playback, transcoding, adaptive bitrate, and signed access are all out of scope of this implementation. |
| Live-class provider (Zoom/Google Meet/etc.) | **Never resolved — feature not built** | No `LiveSession`/`Attendance` entity exists at all. Live classes are entirely out of this implementation's scope, not merely "using a stub provider." |
| Similarity-detection / plagiarism vendor | **Never resolved — manual workflow substituted** | Academic Integrity (FR-116) was built without any vendor integration: an admin/instructor manually opens a `TrustSafetyCase` (reused from Spec 001) against a `Submission`/`QuizAttempt`/`Certificate`, and `Submission.declaredOriginal` captures a learner's own affirmation at submit time. No automated similarity score is ever computed. |
| Default video-completion watch percentage (FR-041) | **Resolved** | Instructor-configurable per lesson (`Lesson.completionRuleValue.minPercent`), falling back to `LmsSettings.defaultVideoWatchThresholdPercent` (installation default `80`). |
| Default certificate attendance threshold (FR-081) | **Not applicable** | No attendance/live-session system exists (see live-class row above), so this condition is permanently absent from `Certificate.eligibilitySnapshot` — it was never a live blocker to resolve, only a condition that can never fire. |
| Default course-version existing-learner policy (FR-099) | **Resolved** | `CourseVersion.existingLearnerPolicy` defaults to `CONTINUE_CURRENT_VERSION` (a learner already enrolled stays on the version snapshot they started with unless the policy is explicitly set to `OPTIONAL_MIGRATION` or `MANDATORY_MIGRATION` on that specific version). |

One further clarification surfaced mid-implementation and resolved the same way as the above pattern: **offline-assignment-submission approval mechanism (FR-092)** — not resolved, not applicable. No mobile app or offline-sync client exists in this repository (see §1), so there is no offline queue for an approval mechanism to govern.

## 3. Recurring cross-cutting design decisions

These patterns repeat across nearly every implementation batch and should be read as deliberate, not incidental:

**Reuse existing architecture over new parallel schemas.** Three separate features were built entirely on top of Spec 001 entities rather than new tables:
- Academic Integrity (FR-116) reuses `TrustSafetyCase`/`Appeal` (see [data-model.md §8](./data-model.md#8-cross-cutting-analytics-settings-governance)).
- Organization-admin course assignment (FR-033) reuses `Organization`/`User.organizationId` plus the pre-existing `adminGrantEnrollment()`/`revokeEnrollment()`/`extendEnrollmentAccess()` functions — there is no `ORGANIZATION` entitlement source (see §4).
- Broader Assessment Types (FR-068) and Project-based Learning (FR-077) both extend the single `Assignment`/`Submission` pair with additive fields (`assessmentType`, `projectId`) rather than introducing new artifact/grading schemas.

**Progress and completion are derived, never separately stored.** `LessonProgress` is the only genuinely stored progress table; module-, course-, and path-level progress are computed at read time by `progress.service.ts` from the underlying `LessonProgress`/`ActivityProgress` rows. This avoids a second, driftable source of truth that would need to be kept in sync on every write.

**No background job scheduler anywhere in the LMS.** Every time-based condition — waitlist offer expiry, quiz-attempt time-limit expiry, announcement `publishAt`/`expireAt` visibility, course `publishAt`/`expireAt` public-visibility windows, module release-rule dates — is evaluated at the moment of the next read or action against that record, not proactively by a scheduled job. This is a consistent, intentional simplification: no Redis/queue infrastructure exists in this deployment (see §1), so nothing depends on one.

**Historical immutability via JSON snapshots**, applied consistently wherever a later change must never retroactively alter a past record (Constitution Article IV):
- `CourseVersion.snapshot` captures the full `Course` row the moment a published course is edited.
- `Certificate.learnerName`/`courseTitle`/`instructorName`/`organizationName` and `eligibilitySnapshot` are captured at issuance, never live-joined.
- `Submission.outcomeLevel` and `SubmissionCriterionScore` rows are never recomputed after the fact even if `RubricCriterion.maxPoints` is later edited (a criterion is soft-deleted, never destructively changed in a way that would corrupt historical scoring).

**Soft-delete discipline wherever historical grading/scoring data must remain interpretable.** `Question`, `RubricCriterion`, `QuestionBankItem`, `CertificateTemplate` all use `deletedAt` rather than a hard delete, specifically so a `QuizAnswer`/`SubmissionCriterionScore` row created against them stays fully readable.

**"Accept the value but honestly don't deliver it" pattern**, used where a schema enum needed to stay accurate to a broader spec vocabulary but no owning feature exists yet: `Bookmark.type = DISCUSSION` is a valid, defined Prisma enum value that the *validation layer explicitly rejects* at the API boundary, rather than silently accepting it and doing nothing. Same treatment for `PushChannel`-style values referenced in `LmsSettings`/`CourseAnnouncement.channels` that have no working delivery path — the schema names the full intended vocabulary; the service layer is honest about which subset actually works.

**Server-authoritative state everywhere** (Constitution Article I, applied throughout): `ActivityProgress.furthestPositionSeconds` is monotonic and anti-rollback; `LessonProgress.percentage`/`timeSpentSeconds` are clamped server-side against physically-possible elapsed time; `Enrollment.completedAt` and `Certificate.eligibilitySnapshot` are only ever server-derived, never accepted from a request body; `LearningStreak` is only ever fed by genuine learner actions or an explicit, audited `CompletionOverride` — never directly settable.

## 4. Entitlement: fail-closed by design

`entitlement.service.evaluateEntitlement()` is the single gate every self-enrollment passes through. It resolves `ALLOWED` for exactly two sources: `FREE` (on a `priceType = FREE` course) and `ADMIN_GRANT`. Every other named `EntitlementSource` — `MEMBERSHIP`, `PURCHASE`, `PROGRAM`, `ORGANIZATION`, `COUPON`, `SCHOLARSHIP`, `TRIAL`, `INVITE` — resolves `UNAVAILABLE`, unconditionally, because no owning subsystem exists yet to back that source honestly:
- `MEMBERSHIP`/`PURCHASE`/`COUPON` require Spec 009 (Billing/Payments) — not built in this repository.
- `PROGRAM` requires a `LearningPath`/`Program` entity — not modeled (see [data-model.md](./data-model.md#entities-deliberately-not-modeled)).
- `ORGANIZATION` is deliberately absent even though `Organization` itself exists (Spec 001) and org-admin assignment (FR-033) is built — that feature intentionally routes through `ADMIN_GRANT`/the existing enrollment functions rather than declaring a new, independently-evaluated entitlement source.
- `SCHOLARSHIP`/`TRIAL`/`INVITE` have no owning workflow anywhere in the codebase.

This is unit-tested explicitly (`entitlement.unit.test.ts`): every non-`FREE`/`ADMIN_GRANT` source is asserted to return `UNAVAILABLE`, never `ALLOWED`, and an unrecognized/unknown source string is asserted to never fall through to `ALLOWED` either.

## 5. RBAC

Twelve canonical platform roles apply across the whole monorepo, not just the LMS: `guest, registered_free_user, paid_member, course_instructor, mentor, community_moderator, support_agent, content_manager, finance_admin, platform_admin, super_admin, organization_admin`.

LMS-specific permission keys: `course.view, course.create, course.publish, course.update, course.archive, course.manageInstructors, course.module.manage, course.category.manage, course.settings.manage, course.academicIntegrity.manage, course.cohort.manage`, plus the cross-spec `organization.manage_own` used by the organization-assignment endpoints.

Two layering patterns recur:
- **A course-instructor's `course.module.manage`/`course.update` grant is global at the permission-bit level but re-scoped to "my own assigned courses" at the service layer** — every `/instructor/*` endpoint re-checks a `CourseInstructor` row exists for the caller before acting, not just the permission bit.
- **`meBaseline` (learner routes) is a baseline authenticated-user check only** — the real per-resource access decision is a second, independent evaluation (the access-evaluator, `access.types.ts`'s `AccessDecision`) run inside the controller, checking entitlement + enrollment status + course visibility + module/lesson unlock state. A `meBaseline`-passing request can still receive a `403` from this second check.

Full endpoint-by-endpoint RBAC mapping: [contracts/README.md](./contracts/README.md#rbac-model) and the per-domain contract files.

## 6. Known cross-spec dependencies

| Spec | Relationship to Spec 004 |
|---|---|
| 001 (Auth/Identity/Trust&Safety/Organization) | Foundational — `authenticate` middleware, RBAC roles/permissions, `Organization`/`User.organizationId`, and `TrustSafetyCase`/`Appeal` (reused wholesale by Academic Integrity) all originate here. |
| 005 (Community) | Not built. `Bookmark.type = DISCUSSION` and `LmsSettings`'s reserved "discussion default" field are the only placeholders reserved for a future Discussion entity; both are inert today. |
| 006 (Gamification) | Not built as a cross-course system. `LearningStreak` is LMS-local only — it is not a points/badges/leaderboard ledger, and does not feed or read from any Spec 006 ledger (none exists yet). |
| 007 (Mentor marketplace) | Not built. `CourseInstructor` is a course-authoring role, unrelated to any mentor-booking/session/payout entity. |
| 008 (AI platform) | Not built. `/me/recommendations` is a deterministic rule-based ranking (enrollment/completion history + category overlap), explicitly not an AI/ML recommendation call — there is no AI provider dependency anywhere in the LMS. |
| 009 (Billing/Payments/Membership) | Not built. `Enrollment.entitlementReference` is a loose opaque string a future payments integration can populate; the `MEMBERSHIP`/`PURCHASE`/`COUPON` entitlement sources fail closed until then (see §4). |

## 7. External infrastructure / vendor dependencies (all unresolved by design)

None of the following have any integration in this codebase — every one is a plain data field, a manual workflow, or simply absent:
- **Video/CDN/streaming provider** — `mediaUrl` is a bare URL.
- **Live-class provider** (Zoom/Google Meet/etc.) — no entity exists.
- **Similarity-detection / plagiarism-detection vendor** — manual investigation workflow only (§2).
- **Virus/malware scanning** — no file upload pipeline exists anywhere in the LMS; every "file" reference (`LessonResource.fileUrl`, `LearningActivity.mediaUrl`, certificate template image URLs) is an admin-supplied external URL, never a server-side upload.
- **PDF generation** — certificates have no `pdfUrl`/binary rendering; `PDF`-type `LearningActivity`/`LessonResource` rows reference an externally-hosted PDF URL, viewed via browser-native rendering, not a server-side viewer library.
- **Mobile app / offline sync** — no mobile client exists in this repository at all.

## 8. Out-of-scope items (confirmed absent, not partially built)

- `LearningPath`/`Program`/`LearningPathCourse` — a named but unbuilt future effort (`docs/lms/DECISION_GATES.md` gate #27); `Course`/`CourseModule`/`Cohort` cover everything actually implemented.
- `LiveSession`/`Attendance`.
- A dedicated academic-integrity entity separate from the reused `TrustSafetyCase`.
- A reusable "Assignment Bank" (only quizzes have a question-bank equivalent, `QuestionBankItem`).
- `LmsSettings`'s named-but-unconsumed fields: offline policy, reminder frequency, discussion default, course archival policy (FR-114 names these; no owning subsystem exists to read them).
- Any `Order`/`Payment`/`Invoice`/`Refund` entity (Spec 009 territory).

## 9. Assumptions carried into implementation

- A learner has at most one `ACTIVE`/`PENDING` enrollment per course at any time (enforced by a hand-added partial unique index) — re-enrollment after cancellation/revocation/expiry is allowed and creates a new row rather than reactivating the old one.
- `LmsSettings` is a true singleton (`id = "global"`); the schema does not model per-organization or per-course-category setting overrides beyond the explicit per-course/per-lesson/per-quiz/per-assignment override fields that already exist on those entities individually.
- `LearningEvent.userId`/`courseId`/`lessonId`/`enrollmentId` are intentionally plain ids, not foreign keys, so this high-volume append-only analytics log can never block, or be blocked by, a delete of the entity it references — consistent with the platform-wide `AuditEvent` convention.
- Money is always represented as integer minor units (`priceAmountMinor`) plus a currency code — never a float — even though no payment processor is wired up yet, so the eventual Spec 009 integration has a ready-made, precision-safe field to read.
