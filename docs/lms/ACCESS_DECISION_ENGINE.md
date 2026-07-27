# Access Decision Engine (Phase 6 Part 2B/2C)

## One pipeline, three layers

`backend/src/lms/access-evaluator.service.ts` exports exactly three entry points, each strictly reusing the layer below it:

```
evaluateCourseAccess(userId, courseId)
        ↑ reused by
evaluateModuleAccess(userId, courseId, moduleId)
        ↑ reused by
evaluateLessonAccess(userId, courseId, lessonId)
```

Every route that needs to know "can this user see this content" — the student `/me/*` API, the Continue Learning algorithm, the progress-update endpoint, the completion engine — calls one of these three functions. None of them re-implements a parallel check. This is what Part 2C's "access-evaluator-consistency" requirement means concretely, and it is directly exercised by the integration test file's Scenario 3/4/8 (suspension, prerequisite/drip, timestamp-based expiry) — the same evaluator that denies a suspended learner also denies a locked module and an expired window, because it is the same function.

## The denial-reason taxonomy

`access.types.ts` defines `AccessDenialReason` as a closed string-literal union — the exact 16 codes named in the Part 2B brief (`AUTHENTICATION_REQUIRED`, `ENROLLMENT_REQUIRED`, `ENTITLEMENT_REQUIRED`, `ENTITLEMENT_PENDING`, `ACCESS_NOT_STARTED`, `ACCESS_EXPIRED`, `ENROLLMENT_SUSPENDED`, `ENROLLMENT_CANCELLED`, `ENROLLMENT_REVOKED`, `COURSE_UNAVAILABLE`, `COURSE_ARCHIVED`, `COURSE_RETIRED`, `MODULE_LOCKED`, `PREREQUISITE_NOT_MET`, `LESSON_NOT_RELEASED`, `PERMISSION_DENIED`). A client UI branches on this code, never on the free-text `message`.

`PERMISSION_DENIED` is reserved for a future RBAC-adjacent denial the evaluator itself doesn't currently produce (every current denial the evaluator returns has a more specific code) — kept in the type for completeness with the brief's named list rather than removed as "unused."

## `evaluateCourseAccess`'s 12-step order

Documented verbatim in the function's own doc comment (not just here, so the code and the doc can never silently drift):

1. Caller must be authenticated.
2. Course must exist.
3. Course must not be `RETIRED` (terminal).
4. If `ARCHIVED`, access requires a pre-existing enrollment (any status) — FR-015 "preserves existing learner progress while blocking new enrollment."
5. If not otherwise publicly reachable and the caller has no enrollment, deny.
6. Look up the caller's enrollment.
7. No enrollment → `ENROLLMENT_REQUIRED`.
8. `SUSPENDED` → `ENROLLMENT_SUSPENDED`.
9. `CANCELLED` → `ENROLLMENT_CANCELLED`.
10. `REVOKED` → `ENROLLMENT_REVOKED`.
11. `PENDING` → `ENTITLEMENT_PENDING`.
12. Access window (`accessStartAt`/`accessEndAt`) checked via `isEnrollmentAccessWindowOpen` — `ACCESS_NOT_STARTED`/`ACCESS_EXPIRED` even if the stored `status` column is stale, because **no background job exists anywhere in this codebase** to have flipped it. This is the mechanism behind Part 2C's mandatory Scenario 8 (expired access denied purely from a timestamp).

Otherwise → `ALLOWED`.

## Module-level: prerequisite + release

`evaluateModuleAccess` reuses `evaluateCourseAccess`, then applies two additional, independently-evaluated gates:

- **Prerequisite** (`isModulePrerequisiteSatisfied`): if `module.prerequisiteModuleId` is set, every mandatory, published lesson of that prerequisite module must have `LessonProgress.status === 'COMPLETED'` for this enrollment. A prerequisite module with zero mandatory lessons is trivially satisfied.
- **Release** (`isModuleReleased`): reads Part 1's stored `releaseRuleType`/`releaseRuleValue` — this function IS the enforcement half Part 1's docs explicitly deferred to Part 2:
  - `IMMEDIATE` — always released.
  - `DAYS_AFTER_ENROLLMENT` — `enrollment.enrolledAt + releaseRuleValue.days` days.
  - `FIXED_DATE` — `releaseRuleValue.date`. A malformed/missing date fails open to `IMMEDIATE` rather than permanently locking the module (a misconfiguration should not be indistinguishable from "this content is retired").
  - `AFTER_PREVIOUS_MODULE` — reuses the SAME prerequisite check above (an explicit design decision: Part 1 only ever stores one `prerequisiteModuleId` per module, so "released after the previous module" and "gated behind a prerequisite module" are treated as the same relationship rather than two independently-configurable ones).
  - `INSTRUCTOR_RELEASE` — reads `CourseModule.manuallyReleasedAt` (a new, additive Part 2 column — see `PREREQUISITES_AND_RELEASE.md`).

## Lesson-level: preview vs. enrollment

`evaluateLessonAccess` first checks `lesson.isPreview && lesson.status === 'PUBLISHED'`. If true, AND the course is reachable by direct link (`isCourseVisibleByDirectLink`) AND the module is `PUBLISHED`, access is granted **without requiring any enrollment** — `{ allowed: true, viaPreview: true }`. Every caller that receives `viaPreview: true` is expected to treat it as read-only exposure, never as a substitute for enrollment: `progress.service.ts` and `completion.service.ts` both explicitly reject a progress/completion write attempt on a preview-only access (`400 Bad Request: "Enroll in this course to track progress on this lesson"`). This is Part 2C's explicit "preview access review" requirement: preview must never become an entitlement bypass.

If not eligible for preview, the full `evaluateModuleAccess` chain runs, plus a final `lesson.status === 'PUBLISHED'` check (`LESSON_NOT_RELEASED` otherwise).

## Explicit scope boundary: no per-lesson drip

FR-034 lists "after previous lesson completion" as a release-rule type. Part 2A's own Lesson field list has **no** `releaseRuleType` field (only `completionRuleType`) — there is no stored per-lesson release configuration to evaluate. Within an unlocked, released module, every `PUBLISHED` lesson is immediately accessible; only module-level sequencing is enforced in Part 2. This is a deliberate, documented scope boundary (see `DECISION_GATES.md`), not an oversight — adding it would require either overloading `prerequisiteModuleId`'s semantics onto lessons or adding a new field Part 2A's brief never listed.
