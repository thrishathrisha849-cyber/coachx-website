# Prerequisites and Release (Phase 6 Part 2B — runtime enforcement)

Part 1 stored `CourseModule.prerequisiteModuleId`, `releaseRuleType`, `releaseRuleValue` as authoring-time CONFIGURATION and explicitly documented (`COURSE_LIFECYCLE.md`'s "Configuration vs. enforcement" section, `DECISION_GATES.md` gate #18) that Part 2 would supply the runtime ENFORCEMENT. This document is that enforcement's reference — the actual logic lives in `access-evaluator.service.ts` (see `ACCESS_DECISION_ENGINE.md` for the full module-access algorithm); this file focuses on the two mechanisms specifically.

## Prerequisite (structural gate)

`isModulePrerequisiteSatisfied(enrollmentId, module)`:
- No `prerequisiteModuleId` → satisfied.
- Otherwise: every mandatory, published lesson of the prerequisite module must have a `COMPLETED` `LessonProgress` row for this enrollment. A prerequisite with zero mandatory lessons is trivially satisfied (nothing to wait for).

This is a **structural** gate — it exists independent of `releaseRuleType` and is always checked.

## Release rule (temporal/administrative gate)

`isModuleReleased(enrollment, module, enrollmentId)`, keyed on Part 1's `releaseRuleType`:

| Type | Evaluation | `releaseRuleValue` shape |
|---|---|---|
| `IMMEDIATE` | Always released | — |
| `DAYS_AFTER_ENROLLMENT` | `enrollment.enrolledAt + days` ≤ now | `{ "days": number }` |
| `FIXED_DATE` | `date` ≤ now | `{ "date": ISO-8601 string }` |
| `AFTER_PREVIOUS_MODULE` | Reuses the prerequisite check above | — (uses `prerequisiteModuleId`, not `releaseRuleValue`) |
| `INSTRUCTOR_RELEASE` | `manuallyReleasedAt` is set and ≤ now | — (see below) |

A module is accessible only when BOTH the prerequisite gate AND the release-rule gate pass.

## `manuallyReleasedAt` — a new, additive Part 2 field

`INSTRUCTOR_RELEASE` cannot be evaluated from anything Part 1 stored — there was no "has an instructor flipped the release switch yet" flag. `CourseModule.manuallyReleasedAt DateTime?` was added via the Part 2 additive migration (`20260727140000_add_lms_lessons_activities_enrollment_progress`) specifically to make this release type evaluable at all. It is course-wide (releases the module for every enrolled learner simultaneously), not per-learner — FR-034 describes "instructor release" as the instructor unlocking content for the class, not granting one learner early access (a per-learner early-access grant is what the admin `overrideMarkComplete`/enrollment `accessStartAt` mechanisms already cover).

**RESOLVED during the database-verification pass.** Re-reading FR-038's exact text — "Instructor-Controlled (instructor **manually releases** content)" — settled the question the prior report left open: a release rule type nobody can ever trigger does not satisfy "the system MUST support instructor release" (FR-034) in any real sense, and this is not blocked by any Part 3 entity or unresolved product decision (all required infrastructure — ownership checks, RBAC, idempotency, audit — already existed). A write endpoint is therefore mandatory in Part 2, and was implemented:

- `module.service.ts`'s `releaseModuleNow(moduleId, actorId, idempotencyKey?)` — idempotent (a repeat release is a no-op, never bumps the timestamp forward), transactional, audited (`lms.module.released`), and rejects (400) a module whose `releaseRuleType` is not `INSTRUCTOR_RELEASE` (calling "release" on an `IMMEDIATE`/`FIXED_DATE`/etc. module is a caller error, not a valid action).
- `POST /admin/modules/:id/release` (`course.module.manage` permission) and `POST /instructor/modules/:id/release` (same permission PLUS `assertInstructorOwnsModule` ownership enforcement — an instructor cannot release a module on a course they are not assigned to).
- No `reason` is required — FR-038 does not describe release as a correction needing justification, unlike FR-113's overrides which explicitly do.
- 4 new integration tests: locked-then-unlocked-by-release, idempotent-repeat-release, ownership-enforced (instructor B rejected), and rejected-for-a-non-INSTRUCTOR_RELEASE module.

Before this fix, an `INSTRUCTOR_RELEASE` module stayed locked indefinitely for every learner — a correct fail-closed DEFAULT, but an incomplete feature surface (the instructor had no way to ever change that default). This is now closed.

## Circular-dependency prevention

Unchanged from Part 1: `module.service.ts`'s `assertValidPrerequisite` rejects a self-reference, a cross-course reference, and (via the strictly-earlier-position requirement) makes a true cycle mathematically impossible, with a redundant chain-walk as defense in depth. Part 2 adds no new prerequisite-configuration surface, so no new cycle-prevention logic was needed.
