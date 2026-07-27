# Continue Learning (Phase 6 Part 2B)

`continue-learning.service.ts`'s `getContinueLearning(userId, courseId)` implements FR-020's primary CTA ("Continue Learning" / "Resume Lesson"). It has **no storage of its own** — no `currentLessonId` column on `Enrollment`, no cached pointer anywhere. It is recomputed from `LessonProgress` + module/lesson structure on every call.

## Why derived, not stored

A cached "current lesson" pointer is a second source of truth that drifts the moment progress changes through any path that doesn't also update the pointer (an admin reset, an instructor override, a direct progress update). Part 2B's brief explicitly calls this out: "not a second source of truth." Recomputing on every call is cheap (bounded by course size) and can never be stale.

## Algorithm

1. **Resume an in-progress lesson.** Walk modules/lessons in `(module.position, lesson.position)` order; the first lesson whose `LessonProgress.status === 'IN_PROGRESS'` for this enrollment is returned with `reason: 'RESUME_IN_PROGRESS'`.
2. **Otherwise, find the first not-yet-completed, ACCESSIBLE lesson.** Walk modules in order; for each module, run it through `evaluateModuleAccess` (the SAME evaluator every other read path uses — this is what keeps Continue Learning from ever recommending a locked lesson as if it were actionable). The first not-completed lesson in an accessible module is returned with `reason: 'START_NEXT'`.
3. **If every lesson encountered was already completed** → `reason: 'COURSE_COMPLETE'`, `nextLesson: null`.
4. **If every remaining (not-completed) lesson lives in a module the evaluator currently denies** (e.g. every remaining module is locked behind a still-in-progress prerequisite or a future release date) → `reason: 'NO_ACCESSIBLE_CONTENT'`, `nextLesson: null` — this is reported honestly rather than returning a lesson the learner cannot actually open.

## What is deliberately not built

- No cross-course "what should I learn next" recommendation (FR-088's Learning Recommendation Engine) — this function only ever operates within a single course/enrollment the caller already holds.
- No AI involvement — the algorithm is fully deterministic, consistent with the constitution's "AI is assistive, never autonomous, always has a deterministic fallback" principle; here there is no AI path to fall back FROM.
