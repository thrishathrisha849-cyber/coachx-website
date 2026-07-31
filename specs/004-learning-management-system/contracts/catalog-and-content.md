# Contracts: Catalog & Content

See [README.md](./README.md) for envelope, auth, RBAC alias, and error-taxonomy conventions. Paths relative to `/api/v1/lms`.

## Public catalog

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/categories` | Public | `publicCategoryQuerySchema` — only `ACTIVE` categories, no soft-deleted/archived rows. |
| GET | `/courses` | Public | `publicCourseQuerySchema` — search/filter (category, level, price type, tag) + pagination; only publicly-visible courses (`isCoursePubliclyVisible`: status `PUBLISHED`/`UNLISTED`-by-direct-link window and within `publishAt`/`expireAt`). |
| GET | `/courses/:slug` | Public + `authenticateOptional` | `courseSlugParamSchema`. If a session is present, response includes the caller's enrollment/access summary; otherwise public-only fields. `UNLISTED` courses 404 unless accessed by exact slug (`isCourseVisibleByDirectLink`). |
| GET | `/courses/:slug/modules` | Public | `publicCourseModulesParamSchema` — module/lesson outline only; `isPreview=false` lesson bodies are not included, only titles/durations. |
| GET | `/certificates/verify/:credentialId` | Public | `credentialIdParamSchema` — see [certificates.md](./certificates.md). |
| GET | `/courses/:courseId/reviews` | Public | `reviewCourseIdParamSchema` — only `VISIBLE` reviews. |

## Admin: Categories (`adminCategoryPermission` = `course.category.manage`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/categories` | `createCategorySchema`: `name` (required, 2–100 chars), `slug` (unique, kebab-case), `parentId?`, `description?`, `sortOrder?` | |
| GET | `/admin/categories` | `adminCategoryQuerySchema` — includes archived, paginated | |
| GET | `/admin/categories/:id` | | 404 `NOT_FOUND` if missing |
| PATCH | `/admin/categories/:id` | `updateCategorySchema` — all fields optional, partial update | |
| POST | `/admin/categories/reorder` | `reorderCategoriesSchema`: `{ ids: string[] }` — full sibling order, applied transactionally | |
| POST | `/admin/categories/:id/archive` | | Sets `status = ARCHIVED`; blocked (`409 CONFLICT`) if any non-archived `Course` still references it |
| POST | `/admin/categories/:id/restore` | | |

## Admin: LMS Settings (`adminSettingsPermission` = `course.settings.manage`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/settings` | Returns the singleton `LmsSettings` row (`id = "global"`), auto-created with defaults on first read |
| PATCH | `/admin/settings` | `updateLmsSettingsSchema` — partial update; percentage fields bounded 0–100, `defaultQuizMaxAttempts`/`defaultAssignmentMaxAttempts` nullable (null = unlimited) |

## Admin: Courses (`course.create` / `course.view` / `course.update` / `course.archive`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/courses` | `createCourseSchema`: `title` (required), `slug` (unique), `categoryId`, `priceType`, `priceAmountMinor` (required if `priceType=PAID`, integer minor units), `level`, `language` | Creates `status=DRAFT` |
| GET | `/admin/courses` | `adminCourseQuerySchema` | Includes all statuses, paginated |
| GET | `/admin/courses/:id` | | |
| GET | `/admin/courses/:id/versions` | | Lists `CourseVersion` snapshots, newest first |
| PATCH | `/admin/courses/:id` | `updateCourseSchema` | If `Course.status = PUBLISHED`, triggers `CourseVersion` auto-snapshot before applying the update (Historical Immutability) |
| POST | `/admin/courses/:id/status` | `changeCourseStatusSchema`: `{ status, reviewNotes? }` | Validated against `COURSE_VALID_TRANSITIONS` (see [research.md](../research.md#course-lifecycle)); `SUBMITTED_FOR_REVIEW → APPROVED` additionally runs `assertPublishReady` (≥1 published module, etc.) — failure returns `409 CONFLICT` with the specific unmet condition in `error.details` |
| POST | `/admin/courses/:id/archive` | | `course.archive` permission, not `course.update` |
| POST | `/admin/courses/:id/restore` | | `ARCHIVED → DRAFT` only |
| POST | `/admin/courses/:id/clone` | `cloneCourseSchema`: `{ newTitle, newSlug }` | Deep-clones category/modules/lessons/activities/resources/quiz+questions/assignment+criteria structure into a new `DRAFT` course; does **not** clone enrollments, reviews, or analytics |
| POST | `/admin/courses/:id/translation-status` | `changeTranslationStatusSchema` | Governs `Course.translationStatus`; does not machine-translate content |
| GET | `/admin/courses/:id/translations` | | Lists courses where `translationOfCourseId = :id` |

## Admin: Instructors (`manageInstructors` = `course.manageInstructors`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/courses/:id/instructors` | `assignInstructorSchema`: `{ userId, role, isPrimary? }` | `role`: `INSTRUCTOR`\|`TEACHING_ASSISTANT` |
| GET | `/admin/courses/:id/instructors` | | `course.view` only |
| DELETE | `/admin/courses/:id/instructors/:userId` | | Blocked if it would remove the last/only primary instructor |
| POST | `/admin/courses/:id/instructors/:userId/primary` | | Reassigns the single `isPrimary=true` flag (only one primary instructor per course, enforced by partial unique index) |

## Admin: Modules

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/courses/:courseId/modules` | `createModuleSchema`: `title`, `position?` (auto-appended if omitted) | `manageModules` |
| GET | `/admin/courses/:courseId/modules` | | `course.view` |
| GET | `/admin/modules/:moduleId` | | |
| PATCH | `/admin/modules/:moduleId` | `updateModuleSchema` — includes `prerequisiteModuleId` (same-course only, cycle-checked service-side), `releaseRuleType`/`releaseRuleValue` | |
| POST | `/admin/courses/:courseId/modules/reorder` | `reorderModulesSchema`: `{ ids: string[] }` | Full sibling reorder |
| POST | `/admin/modules/:moduleId/archive` | | |
| POST | `/admin/modules/:moduleId/restore` | | |
| POST | `/admin/modules/:moduleId/release` | | Only meaningful when `releaseRuleType = MANUAL` — sets `manuallyReleasedAt = now()` |

## Admin: Lessons

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/modules/:moduleId/lessons` | `createLessonSchema`: `title`, `slug` (unique per module) | |
| GET | `/admin/modules/:moduleId/lessons` | | |
| GET | `/admin/lessons/:lessonId` | | |
| PATCH | `/admin/lessons/:lessonId` | `updateLessonSchema` — includes `completionRuleType`/`completionRuleValue`/`completionRuleTypes[]` | |
| POST | `/admin/modules/:moduleId/lessons/reorder` | `reorderLessonsSchema` | |
| POST | `/admin/lessons/:lessonId/archive` | | Soft delete (`deletedAt`) |
| POST | `/admin/lessons/:lessonId/restore` | | |

## Admin: Learning Activities

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/lessons/:lessonId/activities` | `createActivitySchema` | Body shape depends on `type` — e.g. `VIDEO` requires `mediaUrl` (validated `https://` or internal-path scheme only), `EMBED` requires `embedProvider` ∈ `{youtube, vimeo, google_drive, loom}` + `embedResourceId`, `EXTERNAL_LINK` requires `externalUrl` |
| GET | `/admin/lessons/:lessonId/activities` | | |
| PATCH | `/admin/activities/:activityId` | `updateActivitySchema` — includes `captionsUrlEn`/`captionsUrlTa`/`transcriptSegments` | |
| POST | `/admin/lessons/:lessonId/activities/reorder` | `reorderActivitiesSchema` | |
| POST | `/admin/activities/:activityId/archive` | | |

## Admin: Lesson Resources

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/lessons/:lessonId/resources` | `createResourceSchema` | `fileUrl` (scheme-validated), `type`, `downloadPermission`, `accessRule` |
| GET | `/admin/lessons/:lessonId/resources` | | |
| PATCH | `/admin/resources/:resourceId` | `updateResourceSchema` | |
| POST | `/admin/lessons/:lessonId/resources/reorder` | `reorderResourcesSchema` | |
| POST | `/admin/resources/:resourceId/archive` | | |

## Admin: Cohorts (`adminCohortPermission` = `course.cohort.manage`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/courses/:courseId/cohorts` | `createCohortSchema` | `name`, `startDate`, `endDate?`, `capacity?` |
| GET | `/admin/courses/:courseId/cohorts` | | `course.view` |
| GET | `/admin/cohorts/:cohortId` | | `course.view` |
| PATCH | `/admin/cohorts/:cohortId` | `updateCohortSchema` | |
| POST | `/admin/cohorts/:cohortId/members` | `addCohortMemberSchema`: `{ userId }` | Requires an existing `Enrollment`; fails `409 CONFLICT` if the user is already on another cohort for the same enrollment, or if `capacity` reached |
| GET | `/admin/cohorts/:cohortId/members` | | `course.view` |
| DELETE | `/admin/cohorts/:cohortId/members/:memberId` | | |
| PUT | `/admin/cohorts/:cohortId/schedule/:moduleId` | `setCohortModuleScheduleSchema`: `{ unlockAt }` | Upsert |
| DELETE | `/admin/cohorts/:cohortId/schedule/:moduleId` | | |
| GET | `/admin/cohorts/:cohortId/schedule` | | `course.view` |

## Instructor self-service (`course.update` / `course.module.manage`, scoped to own assigned courses)

Mirrors the admin course/module/lesson/activity CRUD surface above, but restricted to courses where the caller has a `CourseInstructor` row — ownership re-checked at the service layer, not just the permission bit.

| Method | Path | Notes |
|---|---|---|
| GET | `/instructor/courses` | List courses the caller instructs |
| GET | `/instructor/courses/:id` | 403 if not an instructor on this course |
| PATCH | `/instructor/courses/:id` | `updateCourseSchema` |
| POST | `/instructor/courses/:id/modules` | `createModuleSchema` |
| GET | `/instructor/courses/:id/modules` | |
| PATCH | `/instructor/modules/:moduleId` | `updateModuleSchema` |
| POST | `/instructor/courses/:id/modules/reorder` | `reorderModulesSchema` |
| POST | `/instructor/modules/:moduleId/release` | |
| POST | `/instructor/modules/:moduleId/lessons` | `createLessonSchema` |
| GET | `/instructor/modules/:moduleId/lessons` | |
| GET | `/instructor/lessons/:lessonId` | |
| PATCH | `/instructor/lessons/:lessonId` | `updateLessonSchema` |
| POST | `/instructor/modules/:moduleId/lessons/reorder` | `reorderLessonsSchema` |
| POST | `/instructor/lessons/:lessonId/activities` | `createActivitySchema` |
| GET | `/instructor/lessons/:lessonId/activities` | |
| PATCH | `/instructor/activities/:activityId` | `updateActivitySchema` |
| GET | `/instructor/courses/:id/enrollments` | Roster for own course |
| POST | `/instructor/courses/:id/enrollments/complete` | `instructorOverrideCompleteSchema` — writes a `CompletionOverride` row, `actorId` = instructor |

Instructors have **no** archive/publish/status-transition endpoints, no clone, no translation management, no cohort management, and no instructor-assignment management — those remain `manageInstructors`/`course.archive`/admin-only.

## Learner: curriculum & lesson content

| Method | Path | Notes |
|---|---|---|
| GET | `/me/courses/:courseId/curriculum` | Full module/lesson outline gated by the caller's own `ActivityProgress`/`LessonProgress`/module-unlock state — access-evaluator checked |
| GET | `/me/lessons/:lessonId` | Full lesson content (activities, resources) — 403 `LESSON_LOCKED`/`MODULE_LOCKED` if prerequisites/release rules unmet |
