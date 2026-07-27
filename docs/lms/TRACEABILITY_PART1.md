# Phase 6 Part 1 Requirements Traceability

Maps 004-learning-management-system's course-engine-relevant
requirements to Data Model / API / Components / Tests / Documentation.
Status legend: **Implemented** · **Deferred** (explicitly out of Part 1
scope, owner named) · **Partial**.

## Scope note — read this first

`004/spec.md`'s FR list describes the FULL LMS surface (Learning Path,
Program, Cohort, Course, Module, Lesson, Assessment, Enrollment,
Progress, Certificate — FR-001 through the 100s). The Phase 6 brief that
drove this implementation explicitly scoped Part 1 to **Course
Categories, Courses, Course Modules, Instructor Assignment, and the
Course publish lifecycle only** — this table therefore maps the SUBSET
of FRs Part 1's brief actually asked for, not the full spec. See
`docs/lms/ARCHITECTURE.md`'s "Scope conflict" section for why this is a
deliberate, reported decision rather than a silent gap.

## Traceability table

**CORRECTION (spec-alignment pass):** the rows below for FR-014/FR-015/
FR-016 were rewritten after a dedicated audit found the ORIGINAL Part 1
implementation had NOT actually traced these FRs' field/state lists —
it used a generic prompt-supplied approximation instead. Every row below
now cites the exact field/state the code implements, not a paraphrase.

| Requirement (source) | Implementation | Tests | Docs |
| --- | --- | --- | --- |
| 004 FR-014 (Course entity full field set: title/slug/subtitle/short-full description/learning outcomes/cover/trailer/category/subcategory/tags/language/difficulty/duration/weekly commitment/instructor-co-instructors/target audience/tools required/certificate availability/access type/price/status/SEO/created-reviewed-published-by/version — rating/review-count/learner-count as documented placeholders) | `Course` model (all fields present — see `DATA_MODEL.md`'s correction summary for exactly which were added in this pass), `course.service.ts`, `lms.validation.ts` | `lms-validation.unit.test.ts`, `lms.integration.test.ts` | `DATA_MODEL.md` |
| 004 FR-014 "category, subcategory" | `CourseCategory` self-referencing hierarchy, **capped at 2 levels** (`MAX_CATEGORY_DEPTH`) to match the literal category/subcategory naming — resolved decision gate #5 | `lms.integration.test.ts` (hierarchy + cycle + depth-cap tests) | `DATA_MODEL.md` |
| 004 FR-015 (Course status: 12 editorial statuses with explicit per-status access behavior) reconciled with FR-100 (6-state Author/Reviewer/Compliance-reviewer/Publisher review workflow) | `CourseStatus` enum (`DRAFT/SUBMITTED_FOR_REVIEW/CHANGES_REQUESTED/APPROVED/SCHEDULED/PUBLISHED/UNLISTED/ENROLLMENT_PAUSED/ARCHIVED/RETIRED`), `course-lifecycle.policy.ts`'s `COURSE_VALID_TRANSITIONS` | `course-lifecycle.unit.test.ts`, `lms.integration.test.ts` | `COURSE_LIFECYCLE.md` (full FR-015/FR-100 reconciliation) |
| 004 FR-015 "Draft is visible only to admins and assigned instructors"; "Unlisted is accessible only via direct link" | `getPublicCourseBySlug()` (`isCourseVisibleByDirectLink()`) / `findPublicCourses()` (`isCoursePubliclyVisible()`, excludes `UNLISTED`); instructor-scoped routes for assigned instructors | `lms.integration.test.ts` (draft-isolation, unlisted-direct-link, IDOR tests) | `SECURITY.md`, `COURSE_LIFECYCLE.md` |
| 004 FR-100 "distinct Author/Reviewer/Compliance reviewer/Publisher roles, audit entry on every state transition" | `course.service.ts`'s `changeCourseStatus()` sets `reviewedBy`/`publishedBy`; `admin-lms.controller.ts`'s tiered permission check (`course.update` for author actions, `course.publish` for reviewer/publisher actions); `recordAuditEvent()` on every transition | `lms.integration.test.ts` | `COURSE_LIFECYCLE.md`, `RBAC.md` |
| 004 FR-016 (Module fields: title/description/outcome/sequence/duration/completion rule/release rule/prerequisite module/optional-mandatory) | `CourseModule` — full field set present: `title`/`description`/`outcome`/`position`/`estimatedDurationMinutes`/`isMandatory`/`prerequisiteModuleId`/`releaseRuleType`+`releaseRuleValue`/`completionRuleType`. Release/completion rule fields are CONFIGURATION only (not enforced — see `COURSE_LIFECYCLE.md`); `lessons` themselves remain Part 2 | `lms.integration.test.ts` (ordering, reorder, prerequisite cycle/cross-course/ordering rejection) | `DATA_MODEL.md`, `COURSE_LIFECYCLE.md` |
| 004 FR-034 (drip release rules — Cohort-free subset) | `ModuleReleaseRuleType` enum (`IMMEDIATE`/`DAYS_AFTER_ENROLLMENT`/`FIXED_DATE`/`AFTER_PREVIOUS_MODULE`/`INSTRUCTOR_RELEASE`), config-only | `lms-validation.unit.test.ts` | `DATA_MODEL.md` |
| 004 FR-052 (completion rule types — Lesson-free subset) | `ModuleCompletionRuleType` enum (`MANUAL`/`INSTRUCTOR_APPROVAL`), config-only | `lms-validation.unit.test.ts` | `DATA_MODEL.md` |
| Brief's "Instructor Assignment" (no direct spec FR — an implied entity from FR-014's "instructor/co-instructors") | `CourseInstructor` join table, `instructor.service.ts` | `lms.integration.test.ts` | `DATA_MODEL.md`, `SECURITY.md` |
| Brief's "Admin API Requirements" | `admin-lms.controller.ts`, `routes/v1/lms.routes.ts` | `lms.integration.test.ts` | `API_REFERENCE_PART1.md` |
| Brief's "Instructor API Requirements" | `instructor-lms.controller.ts` + `assertInstructorOwnsCourse()` | `lms.integration.test.ts` (IDOR tests) | `API_REFERENCE_PART1.md`, `SECURITY.md` |
| Brief's "Public Course APIs" | `lms.controller.ts` | `lms.integration.test.ts` | `API_REFERENCE_PART1.md` |
| Brief's "Course Discovery" (search/filter/sort/paginate) | `findPublicCourses()`, `publicCourseQuerySchema` | `lms.integration.test.ts`, `lms-validation.unit.test.ts` | `API_REFERENCE_PART1.md` |
| Brief's "RBAC and Permissions" | `rbac.constants.ts` extensions, route-level `requirePermission(...)` | `lms.integration.test.ts` (permission-denial, escalation tests) | `RBAC.md` |
| Brief's "Audit Events" | `recordAuditEvent()` calls in every service write path | (audit events verified indirectly — no dedicated audit-query test; same pattern as CMS's own audit coverage) | `API_REFERENCE_PART1.md` |
| Brief's "Idempotency" review | Decision: NOT wired in — see `DECISION_GATES.md` | — | `API_REFERENCE_PART1.md`, `DECISION_GATES.md` |
| Brief's "Category Hierarchy Safety" | `assertParentValid()` cycle prevention | `lms.integration.test.ts` (cycle-prevention test) | `DATA_MODEL.md` |
| Brief's "Ordering and Reordering" | Transactional two-pass reorder (`module.repository.ts`, `category.service.ts`) | `lms.integration.test.ts` (reorder + cross-course-rejection tests) | `SECURITY.md` |
| Brief's "Admin Frontend Scope" | **Deferred** — see `DECISION_GATES.md` | — | `DECISION_GATES.md` |
| Brief's "Public Frontend Scope" | `CourseListPage.tsx`, `CourseDetailPage.tsx` | `CourseListPage.test.tsx` | `ARCHITECTURE.md` |
| Brief's "SEO" (course pages) | `useDocumentHead`/`useStructuredData` (reused, no duplication), `Course` schema.org JSON-LD | (manual verification — no dedicated SEO test for LMS pages; same tooling gap `docs/public-site/DECISION_GATES.md` #15 already names for CMS) | `ARCHITECTURE.md` |

## Explicitly out of Part 1 scope (Part 2/Part 3 owners)

| Concept | Owner |
| --- | --- |
| Lesson content (video/PDF/rich-text/quiz/assignment types), lesson player | Phase 6 Part 2 |
| Enrollment, entitlement checks, access states | Phase 6 Part 2 |
| Student progress, Continue Learning | Phase 6 Part 2 |
| Quizzes, Assignments | Phase 6 Part 3 |
| Certificates | Phase 6 Part 3 |
| Reviews / ratings | Phase 6 Part 3 |
| Wishlist | Phase 6 Part 3 (per brief's exclusion list) |
| Learning Path, Program, Cohort entities | Not scheduled — not named in the Phase 6 brief at all |
| Payment processing / checkout | 009-membership-payments |
| Video streaming / CDN, PDF viewer | 004/plan.md's own `NEEDS CLARIFICATION` vendor gaps — unresolved, not this phase's concern |
| Admin CMS-style course editor UI | Deferred — see `DECISION_GATES.md` |
