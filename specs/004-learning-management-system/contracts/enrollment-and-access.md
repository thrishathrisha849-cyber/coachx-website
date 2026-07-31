# Contracts: Enrollment & Access

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`.

## Self-service enrollment (learner)

| Method | Path | Auth | Request | Notes |
|---|---|---|---|---|
| POST | `/me/enrollments` | `meBaseline` | `selfEnrollSchema`: `{ courseId }`, optional `Idempotency-Key` header | Runs `entitlement.service.evaluateEntitlement()` — **fails closed**: only `FREE` (on a `priceType=FREE` course) and `ADMIN_GRANT` sources ever resolve `ALLOWED`; every other source (`MEMBERSHIP`, `PURCHASE`, `PROGRAM`, `ORGANIZATION`, `COUPON`, `SCHOLARSHIP`, `TRIAL`, `INVITE`) returns `UNAVAILABLE` since no owning subsystem exists yet — response is `403 FORBIDDEN`. Also enforces `COURSE_FULL` (`error.details.code`) once `enrollmentLimit` reached, and the one-active-enrollment-per-user-course constraint (`409 CONFLICT`) |
| GET | `/me/enrollments` | `meBaseline` | — | Caller's own enrollments only, paginated |
| GET | `/me/courses/:courseId/access` | `meBaseline` | `meCourseIdParamSchema` | Returns the full `AccessDecision` (`ALLOWED` or `DENIED` + `reason`) — the same evaluator every other `/me/*` endpoint runs internally, exposed directly for UI gating |
| GET | `/me/enrollments/:id/version-status` | `meBaseline` | | Compares the enrollment's `migratedToVersionNumber` against the course's latest `CourseVersion`; reports whether a pending migration exists per `CourseVersionExistingLearnerPolicy` |
| POST | `/me/enrollments/:id/migrate-version` | `meBaseline` | | Only actionable when policy = `OPTIONAL_MIGRATION` (learner-initiated) or the migration is otherwise due; `MANDATORY_MIGRATION` is enforced automatically at read time, not via this endpoint |

## Admin enrollment management (`manageInstructors` = `course.manageInstructors`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/enrollments` | `adminCreateEnrollmentSchema`: `{ userId, courseId, source }` | `source` typically `ADMIN_GRANT`; bypasses the self-enroll entitlement evaluator (admin action is inherently authoritative) but still enforces the one-active-enrollment constraint |
| GET | `/admin/enrollments` | `adminEnrollmentQuerySchema` | `course.view` |
| GET | `/admin/enrollments/:id` | | `course.view` |
| POST | `/admin/enrollments/:id/suspend` | `suspendEnrollmentSchema`: `{ reason }` | `status → SUSPENDED` |
| POST | `/admin/enrollments/:id/reactivate` | `reactivateEnrollmentSchema` | `SUSPENDED → ACTIVE` only |
| POST | `/admin/enrollments/:id/revoke` | `revokeEnrollmentSchema`: `{ reason }` | Terminal — access ends immediately, `revokedAt` set |
| POST | `/admin/enrollments/:id/extend-access` | `extendAccessSchema`: `{ newAccessEndAt }` | Must be later than current `accessEndAt` |
| POST | `/admin/enrollments/:id/complete` | `overrideCompleteSchema`: `{ reason }` | Writes a `CompletionOverride(scope=COURSE, action=MARK_COMPLETE)` row; sets `Enrollment.completedAt` |
| POST | `/admin/enrollments/:id/reset-progress` | `resetProgressSchema`: `{ reason }` | Writes a `CompletionOverride(action=RESET)`; clears `LessonProgress`/`ActivityProgress` rows for the enrollment |
| POST | `/admin/courses/:id/enrollments/bulk-import` | `bulkImportSchema`: `{ userIds: string[] }` (bounded max batch size) | Per-row result array in `data` — partial success is possible; each row reports its own outcome (`created`/`skipped`/`error`) rather than an all-or-nothing transaction |

## Instructor-scoped enrollment (own courses only)

| Method | Path | Notes |
|---|---|---|
| GET | `/instructor/courses/:id/enrollments` | `course.update`, ownership re-checked |
| POST | `/instructor/courses/:id/enrollments/complete` | `instructorOverrideCompleteSchema` — same `CompletionOverride` mechanism as the admin endpoint, `actorId` recorded as the instructor |

## Organization-admin assignment (`orgManageOwn` = `organization.manage_own`)

Reuses Spec 001's `Organization`/`User.organizationId` — **no separate `ORGANIZATION` entitlement source is implemented** (it remains in the fail-closed `UNAVAILABLE` list above). Every endpoint here double-checks both the actor's and the target user's `organizationId` server-side, not just the permission bit — an org admin cannot act on a user outside their own organization even if they somehow obtained a valid `enrollmentId`/`userId`.

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/organization/courses/:courseId/assign` | `assignCourseToOrgMembersSchema`: `{ userIds: string[] }` | Internally calls the existing `adminGrantEnrollment()` per user — same code path as an admin's `POST /admin/enrollments`, just permission-gated differently; all target `userIds` must share the actor's `organizationId` or the whole call 403s |
| GET | `/organization/enrollments` | `orgEnrollmentQuerySchema` | Scoped to enrollments belonging to users in the actor's own organization only |
| POST | `/organization/enrollments/:enrollmentId/revoke` | `orgRemoveAccessSchema`: `{ reason }` | Calls the existing `revokeEnrollment()`; 403 if the enrollment's user is outside the actor's organization |
| POST | `/organization/enrollments/:enrollmentId/deadline` | `orgSetDeadlineSchema`: `{ deadline }` | Sets `accessEndAt`; same organization-scope check |

## Waitlist (capacity-gated courses only)

| Method | Path | Auth | Request | Notes |
|---|---|---|---|---|
| POST | `/me/courses/:courseId/waitlist` | `meBaseline` | `joinWaitlistSchema`: `{ referralSource? }` | Only actionable when `Course.enrollmentLimit` is set and full; assigns `priority` as a monotonic per-course counter |
| GET | `/me/courses/:courseId/waitlist` | `meBaseline` | | Caller's own entry (or 404) |
| POST | `/me/waitlist/:id/claim` | `meBaseline` | | Only valid while `status = OFFERED` and before `offerExpiresAt`; converts to a real `Enrollment` on success |
| GET | `/admin/courses/:courseId/waitlist` | `course.view` | `waitlistCourseIdParamSchema` | Full roster, ordered by `priority` |

Waitlist offer expiry (`offerExpiresAt`) is swept at **read time** — there is no background job that proactively expires stale offers or advances the queue; the next read of the waitlist/enrollment state re-evaluates expiry.

## Wishlist (save-for-later, uncapped)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/wishlist` | `meBaseline` | Paginated, includes `priceAtSaveAmountMinor` vs. current course price for price-drop display |
| POST | `/me/courses/:courseId/wishlist` | `meBaseline` | `wishlistCourseIdParamSchema` — idempotent (repeat call is a no-op success, not a `409`) |
| DELETE | `/me/courses/:courseId/wishlist` | `meBaseline` | Idempotent |
