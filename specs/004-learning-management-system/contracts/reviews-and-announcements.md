# Contracts: Reviews & Announcements

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`.

## Course reviews

One review per learner per course — a resubmission updates the existing row (`@@unique([courseId, userId])`), it never creates a second one.

| Method | Path | Auth | Request | Notes |
|---|---|---|---|---|
| GET | `/courses/:courseId/reviews` | Public | `reviewCourseIdParamSchema` | Only `status = VISIBLE` reviews; `isAnonymous=true` reviews omit the learner's name in this public serialization only (moderation always sees the real author) |
| GET | `/me/courses/:courseId/review-eligibility` | `meBaseline` | | True once the caller's progress ≥ `LmsSettings.courseReviewMinProgressPercent` |
| GET | `/me/courses/:courseId/review` | `meBaseline` | | Caller's own review, if any |
| POST | `/me/courses/:courseId/review` | `meBaseline` | `submitReviewSchema`: `{ rating (1–5), title?, comment?, outcome?, wouldRecommend?, isAnonymous? }` | `403` if not yet eligible; upserts on the unique constraint |
| GET | `/admin/courses/:courseId/reviews` | `course.view` | `reviewCourseIdParamSchema` | All reviews regardless of status |
| POST | `/admin/reviews/:reviewId/moderate` | `manageInstructors` | `moderateReviewSchema`: `{ action: HIDE\|RESTORE, reason }` | Never a hard delete |

## Course announcements

Course-wide by default; `moduleId` optionally narrows scope without requiring the reader to have that module unlocked.

| Method | Path | Auth | Request | Notes |
|---|---|---|---|---|
| POST | `/admin/courses/:courseId/announcements` | `manageModules` | `createAnnouncementSchema`: `title`, `message`, `priority?`, `channels[]?`, `moduleId?`, `publishAt?`, `expireAt?` | Created `DRAFT` |
| GET | `/admin/courses/:courseId/announcements` | `course.view` | `courseAnnouncementsParamSchema` | All statuses |
| GET | `/admin/announcements/:announcementId` | `course.view` | | |
| PATCH | `/admin/announcements/:announcementId` | `manageModules` | `updateAnnouncementSchema` | |
| POST | `/admin/announcements/:announcementId/publish` | `manageModules` | | `status → PUBLISHED`; triggers a best-effort email via the shared `EmailPort` if `EMAIL` ∈ `channels`, recorded once in `emailSentAt` so a later re-publish never double-sends |
| POST | `/admin/announcements/:announcementId/archive` | `manageModules` | | |
| GET | `/me/courses/:courseId/announcements` | `meBaseline` | | Learner view — see [progress-and-completion.md](./progress-and-completion.md) |

`publishAt`/`expireAt` visibility windows are evaluated at **read time only** — there is no scheduler that proactively flips status or sends the email at `publishAt`; publishing is always an explicit admin action, and the window fields only gate *display* once already `PUBLISHED`.
