# Contracts: Progress, Completion & Learner Tools

See [README.md](./README.md) for conventions. All endpoints below require `authenticate` + `meBaseline`, and every one runs the per-resource access-evaluator internally (403 with `AccessDenialReason` on denial) — this is not repeated per-row below. Paths relative to `/api/v1/lms`.

## Lesson progress

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/me/courses/:courseId/progress` | | Aggregate course-level progress — **derived at read time** from `LessonProgress` rows (`computeCourseProgress`), never a separately stored field |
| GET | `/me/courses/:courseId/continue-learning` | | Returns the single next-incomplete-lesson pointer for a "Continue" CTA |
| POST | `/me/lessons/:lessonId/progress` | `updateLessonProgressSchema`: `{ percentage?, timeSpentSeconds?, lastPosition? }` | `lastPosition` shape is discriminated by the lesson's activity kind (video/audio position seconds, article scroll percent, PDF page number) via `progress.validation.ts`'s `lastPositionSchema`. `percentage`/`timeSpentSeconds` are anti-rollback clamped server-side — a client cannot decrease stored progress or claim more elapsed time than physically possible since the last tick |
| POST | `/me/lessons/:lessonId/complete` | `completeLessonSchema` | Only succeeds if the lesson's `completionRuleType`(s) are actually satisfied (e.g. `ALL_ACTIVITIES_VIEWED` requires every `LearningActivity` to have an `ActivityProgress.viewedAt`); otherwise `409 CONFLICT` |

## Activity progress & video playback telemetry

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/me/activities/:activityId/viewed` | | Idempotent — sets `ActivityProgress.viewedAt` once; repeat calls are a no-op success |
| GET | `/me/activities/:activityId/transcript` | | Returns `LearningActivity.transcriptSegments`; 404 if the activity has none. Supports client-side search/seek — no server-side full-text search endpoint exists |
| POST | `/me/activities/:activityId/playback/started` | | Increments `ActivityProgress.playbackStartCount`; if called after `completedPlaybackAt` was already set, also increments `rewatchCount` |
| POST | `/me/activities/:activityId/playback/progress` | `playbackProgressSchema`: `{ positionSeconds, playbackSpeed? }` | Updates `watchedSeconds` (bounded increment), `furthestPositionSeconds` (monotonic — never decreases even on rewind), `lastPositionSeconds` (resume point — can decrease on rewind), `lastPlaybackSpeed`. First tick where `furthestPositionSeconds` crosses the watch-completion threshold (`Lesson.completionRuleValue.minPercent`, falling back to `LmsSettings.defaultVideoWatchThresholdPercent`) sets `completedPlaybackAt` |
| GET | `/me/activities/:activityId/playback` | | Returns the current `ActivityProgress` playback-telemetry snapshot, used to resume playback and to compute `deviceDistribution` in course analytics (`lastUserAgent`, server-captured from the request header, never client-asserted) |

Picture-in-Picture is a **client-only** UI toggle (browser `requestPictureInPicture()` API) — there is no backend field or endpoint for it; it does not appear in this contract because it never reaches the server.

## Learning streak

| Method | Path | Notes |
|---|---|---|
| GET | `/me/streak` | Returns the caller's single `LearningStreak` row (`currentStreakDays`, `longestStreakDays`, `todaysLearningSeconds`). No write endpoint exists — the streak is updated only as a side effect of genuine learner actions (lesson completion, passed quiz attempt, submission, or crossing `streakMinLearningTimeMinutes` via progress-tick accumulation), never directly settable by a client |

## Course announcements (learner view)

| Method | Path | Notes |
|---|---|---|
| GET | `/me/courses/:courseId/announcements` | Only `PUBLISHED` announcements within their `publishAt`/`expireAt` window (evaluated at read time), scoped to course-wide + the caller's currently-unlocked modules |

## Learner notes (strictly private — no admin read path exists anywhere)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/me/lessons/:lessonId/notes` | `createNoteSchema`: `{ content, videoTimestampSeconds? }` | |
| GET | `/me/lessons/:lessonId/notes` | | |
| GET | `/me/courses/:courseId/notes` | | All notes across the course |
| GET | `/me/notes/search` | `searchNotesQuerySchema`: `{ q, courseId? }` | Simple substring/text search over the caller's own `content` field only |
| GET | `/me/notes/export` | `exportNotesQuerySchema` | Returns the caller's notes as a flat JSON array for client-side download — no PDF/DOCX generation |
| PATCH | `/me/notes/:noteId` | `updateNoteSchema` | Ownership-checked (`userId` match), not just enrollment |
| DELETE | `/me/notes/:noteId` | | |

## Bookmarks (strictly private — same no-admin-read-path discipline as notes)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/me/lessons/:lessonId/bookmarks` | `createBookmarkSchema`: `{ type, videoTimestampSeconds?, textSectionAnchor?, activityId?, note?, folder? }` | Field requirements vary by `type` (`VIDEO_TIMESTAMP`/`TEXT_SECTION`/`RESOURCE`); `type = DISCUSSION` is **rejected** at the validation layer — a defined enum value with no owning feature (Spec 005 territory) |
| GET | `/me/lessons/:lessonId/bookmarks` | | |
| GET | `/me/courses/:courseId/bookmarks` | | |
| DELETE | `/me/bookmarks/:bookmarkId` | | Ownership-checked |

## Lesson resources (learner view)

| Method | Path | Notes |
|---|---|---|
| GET | `/me/lessons/:lessonId/resources` | Filtered by `accessRule`/`downloadPermission` against the caller's enrollment status |
| POST | `/me/lesson-resources/:resourceId/viewed` | Fires a `RESOURCE_VIEWED` `LearningEvent`; idempotent-ish (repeatable, each call logs a new event row — unlike `ActivityProgress.viewedAt` this is a log, not a single flag) |
| POST | `/me/lesson-resources/:resourceId/download` | Fires `RESOURCE_DOWNLOAD_STARTED`; returns the resource's `fileUrl` for the client to fetch directly — no signed-URL/proxy download path exists |
