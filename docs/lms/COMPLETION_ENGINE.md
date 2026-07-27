# Completion Engine (Phase 6 Part 2B, corrected)

## CORRECTION NOTICE (read this first)

The original Part 2 implementation contained a real defect: `ALL_ACTIVITIES_VIEWED` was silently evaluated as an ALIAS of `MANUAL` — a learner could click "complete" without having viewed anything, and the server never checked activity-view state at all. This has been REMOVED. See "ALL_ACTIVITIES_VIEWED — corrected behavior" below for the real, server-derived replacement, and the "Rule support matrix" for the audited status of every rule.

## Single write path

Every completion write in this module goes through `completion.service.ts`'s `completeLessonForEnrollment` — never a bare `lessonProgress.update({ status: 'COMPLETED' })` scattered across controllers. Four callers, four `LessonCompletionSource` provenance tags:

| Caller | Source | Trigger |
|---|---|---|
| `completeLessonManually` | `MANUAL_LEARNER` | Learner calls `POST /me/lessons/:id/complete` |
| `maybeAutoCompleteFromProgress` | `SIGNAL_DERIVED` | Server-evaluated: a `MINIMUM_WATCH_PERCENT` lesson crosses its configured threshold during a progress update |
| `recordActivityViewed` (via `completeLessonForEnrollment` inside its own transaction) | `SIGNAL_DERIVED` | Server-evaluated: the last required activity of an `ALL_ACTIVITIES_VIEWED` lesson is reported viewed |
| `overrideMarkComplete(..., 'INSTRUCTOR_OVERRIDE'/'ADMIN_OVERRIDE')` | `INSTRUCTOR_OVERRIDE`/`ADMIN_OVERRIDE` | Instructor/admin override (FR-113) |

## Idempotent by construction

`completeLessonForEnrollment` checks `existing.status === 'COMPLETED'` first and returns `{ alreadyCompleted: true }` as a silent no-op — no duplicate row (the `@@unique([enrollmentId, lessonId])` constraint would reject a duplicate anyway), no duplicate audit event, no error. Verified by the integration suite's Scenario 7 and the correction pass's idempotency scenarios (duplicate `/complete` requests produce exactly one `lms.lesson.completed` audit event).

## Rule support matrix (Correction 3 — audited)

| Rule | Configuration supported | Runtime evaluation supported | Status | Dependency | Fallback behavior | Tests |
|---|---|---|---|---|---|---|
| `MANUAL` | Yes | Yes — learner-triggered, no automatic condition | **FULLY_SUPPORTED** | None | N/A | `lesson-validation.unit.test.ts`; Scenario 1, Scenario 7 |
| `MINIMUM_WATCH_PERCENT` | Yes | Yes — server compares stored `LessonProgress.percentage` (itself anti-rollback, server-derived) against `completionRuleValue.minPercent` (default 80) | **FULLY_SUPPORTED** | None | If `completionRuleValue` is missing/malformed, defaults to 80% (a documented default, not silent failure) | Exercised indirectly via `progress-validation.unit.test.ts`; no dedicated integration test added this pass (would require a real DB — see "Database verification status" in the final report) |
| `ALL_ACTIVITIES_VIEWED` | Yes | **Yes — CORRECTED this pass.** Real, server-derived: every `PUBLISHED` `LearningActivity` in the lesson must have a `viewedAt`-set `ActivityProgress` row for this enrollment | **FULLY_SUPPORTED** | None (activity-level required/optional distinction is NOT independently configurable — every published activity is treated as required; see `LEARNING_ACTIVITIES.md`) | A lesson with zero published activities is trivially satisfied | `completion-rules.unit.test.ts`; integration "Correction 2" scenarios (3 tests: cannot bypass via manual click, auto-completes only once server-confirmed, repeat-view idempotent) |
| `INSTRUCTOR_APPROVAL` | Yes | Yes — requires a live (non-reset) `CompletionOverride` at `LESSON` scope; never learner-completable | **FULLY_SUPPORTED** | An instructor/admin must call the override endpoint | Permanently blocks learner self-completion (never silently bypassed) | Exercised by `overrideMarkComplete`'s code path; dedicated integration coverage not added this pass (DB-gated) |
| Multi-condition combination (FR-052: "combine multiple required conditions") | **Yes — CORRECTED this pass.** `Lesson.completionRuleTypes` (new, additive array field) | Yes — `evaluateAutomaticRules` evaluates every non-`MANUAL` rule in the effective set and ANDs the result; `MANUAL` in the set additionally requires an explicit learner click even after every automatic condition is met | **FULLY_SUPPORTED** | None | Falls back to the single `completionRuleType` when the array is empty (backward compatible) | `completion-rules.unit.test.ts` (`getEffectiveCompletionRules`); `lesson-validation.unit.test.ts` (schema-level duplicate/unknown-value rejection) |
| Quiz pass | Configuration N/A | Not implemented | **BLOCKED_PENDING_PART3** | Feature 004 Part 3 (Quiz entity does not exist) | N/A — not a selectable `LessonCompletionRuleType` value at all (never silently invented as a placeholder enum member) | N/A |
| Assignment submit / approved | Configuration N/A | Not implemented | **BLOCKED_PENDING_PART3** | Feature 004 Part 3 (Assignment entity does not exist) | N/A | N/A |
| Live attendance | Configuration N/A | Not implemented | **BLOCKED_PENDING_PART3** | Feature 004 Part 3 (Live Session/Attendance entities do not exist) | N/A | N/A |
| External activity confirmation | Configuration N/A | Not implemented | **NOT_SUPPORTED** | No named owning feature — closest existing analog is `ALL_ACTIVITIES_VIEWED`, which is NOT the same condition (external confirmation implies a third-party signal, not an in-platform view event) | N/A | N/A |
| AI exercise completion | Configuration N/A | Not implemented | **OWNED_BY_ANOTHER_FEATURE** | Feature 008 (AI Assistant Platform) | N/A | N/A |

No unsupported rule can accidentally mark a lesson/module/course complete — every rule not in this table simply cannot be selected (`LESSON_COMPLETION_RULE_TYPES` in `lesson.validation.ts` is a closed enum of exactly the FULLY_SUPPORTED rows above).

## ALL_ACTIVITIES_VIEWED — corrected behavior

**Previous (defective) behavior:** `completeLessonManually` treated `ALL_ACTIVITIES_VIEWED` identically to `MANUAL` — a learner's click alone satisfied it, regardless of whether any activity had actually been viewed.

**Corrected behavior:**
1. A new `ActivityProgress` model (additive migration `20260727150000_lms_part2_correction_pass`) records, per `(enrollment, activity)`, a server-set `viewedAt` timestamp.
2. `POST /me/activities/:activityId/viewed` is the ONLY way a `viewedAt` is ever set — the client reports ONE discrete "I viewed this activity" event; it never asserts an aggregate "all done" boolean. The endpoint is idempotent (a repeat report for the same activity is a no-op, verified by an integration test).
3. `completion.service.ts`'s `areAllRequiredActivitiesViewed(enrollmentId, lessonId)` is the single function that answers "are all of this lesson's activities viewed" — it always re-derives the answer from real `ActivityProgress` rows, never trusts a client-supplied claim.
4. `completeLessonManually` now calls `evaluateAutomaticRules`, which includes `ALL_ACTIVITIES_VIEWED` in its per-rule check; if unmet, the endpoint returns `400` with `{ unmetRules: ['ALL_ACTIVITIES_VIEWED'] }` — completion is BLOCKED, not silently granted.
5. `recordActivityViewed` also triggers the same auto-complete check every other automatic trigger uses — once the LAST required activity is viewed, the lesson completes automatically (`SIGNAL_DERIVED`), with no explicit learner "complete" click required (unless `MANUAL` is ALSO part of the lesson's effective rule set, in which case the explicit click remains required even after every activity is viewed).

## Module and course completion

Module completion (`isModuleCompleteForEnrollment`) = `computeModuleProgress(...).isComplete` (every mandatory, published lesson `COMPLETED`) AND, if the module's OWN `completionRuleType === 'INSTRUCTOR_APPROVAL'`, a live (non-reset) `CompletionOverride` at `MODULE` scope for that module. This is a coherent reuse of Part 1's `CourseModule.completionRuleType` field, reinterpreted as "how the module itself is signed off" rather than "how its lessons complete" (which `Lesson.completionRuleType`/`completionRuleTypes` now own independently, since Lesson didn't exist when that Part 1 field was designed) — see `DECISION_GATES.md` for this reconciliation.

`recomputeEnrollmentCompletion` runs after every lesson completion: if every mandatory, published module is complete, the `Enrollment` transitions `ACTIVE → COMPLETED` (via `enrollment.policy.ts`'s state machine) and `completedAt` is set — server-derived, never client-settable. A course with zero mandatory modules never auto-completes (nothing to "finish").

**CORRECTION — course completion event emitted only once under concurrency.** The status flip now goes through `enrollment.repository.ts`'s `completeEnrollmentIfStatus`, an `updateMany` scoped by BOTH `id` and the expected prior `status` (`ACTIVE`), not a plain `update` by id. Two near-simultaneous `recomputeEnrollmentCompletion` calls (e.g. two lessons in different modules completing within the same request window) can no longer both succeed in flipping the status and both record the `lms.enrollment.completed` audit event — only the transaction whose `updateMany` actually matches a row (`count === 1`) proceeds to the audit write; the other observes `count === 0` and returns without side effects.

## What Part 2 explicitly does NOT fake

Per Part 2B's "Part-3-dependency-aware" instruction: this engine never invents a passing quiz score, an approved assignment, or a passed final assessment. Quiz pass / assignment submit / assignment approved / live attendance are not modeled as selectable `LessonCompletionRuleType` values (see the support matrix above) — a course designer cannot even configure a lesson to require one, closing the possibility of a silently-unenforced configuration.

## Override and reset (FR-113)

`CompletionOverride` (scope `LESSON`/`MODULE`/`COURSE`, action `MARK_COMPLETE`/`RESET`) is a generic, reusable, always-reasoned, always-audited record — `reason` (required, min 3 chars), `actorId`, `previousValue`/`newValue` snapshot, timestamp. `overrideReset` clears the target scope's `LessonProgress` row(s) back to `NOT_STARTED` (keeping historical `timeSpentSeconds` — history is retained, not erased) and, for a `COURSE`-scope reset on a `COMPLETED` enrollment, reopens it to `ACTIVE`. The `CompletionOverride` audit row itself is never deleted by a subsequent reset — the full override history remains queryable per `(enrollmentId, scope, targetId)`.

**CORRECTION — idempotency.** `overrideMarkComplete` and `overrideReset` ("privileged completion override" and "progress reset," the two endpoints the correction brief names explicitly) are now wrapped in the shared `IdempotencyKey` infrastructure — see `docs/lms/ENROLLMENT_LIFECYCLE.md`'s "Idempotency" section for the shared mechanics.

## Database verification pass status

`concurrent recompute → exactly one completion event`, `duplicate completion request → single audit row`, `ALL_ACTIVITIES_VIEWED auto-complete only once every activity is server-confirmed viewed`, and `multi-condition AND semantics` are all implemented per the design above and covered by 20 integration test cases (`lms-part2.integration.test.ts`'s Scenario 7, Correction 1/2/4 blocks, and the new instructor-release block). **None of these have executed against a real PostgreSQL database in this session** — PostgreSQL/Docker remain unavailable (see `docs/lms/TESTING.md`). The concurrency guarantee specifically (`completeEnrollmentIfStatus`'s status-guarded `updateMany`) rests on PostgreSQL's own row-level locking semantics under `READ COMMITTED` (the Prisma/pg default), which cannot be exercised by a self-skipping test — this remains a reviewed-but-unverified claim, not a proven one, until a real database is available.
