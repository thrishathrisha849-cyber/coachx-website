# Progress Engine (Phase 6 Part 2B)

## Why Course/Module progress are derived, not stored

Part 2B explicitly asked the reviewer to decide whether separate Enrollment/Course/Module/Lesson/Activity progress models were needed. The resolved decision: only ONE stored progress table exists — `LessonProgress` (per `enrollmentId` + `lessonId`). Module and Course progress are always **computed at read time** from `LessonProgress` rows (`progress.service.ts`'s `computeModuleProgress`/`computeCourseProgress`), never persisted.

Rationale: a stored `ModuleProgress`/`CourseProgress` table would be a second source of truth that must be kept in perfect lockstep with every `LessonProgress` write, forever, across every code path that ever touches completion (learner self-complete, signal-derived auto-complete, instructor override, admin override, a future reset). A derivation function has no drift risk by construction — it is recomputed from the one authoritative table every time. The computation is cheap (bounded by a course's module/lesson count, not by learner count) and is not on any hot per-request path that would need caching in this phase.

## `LessonProgress` fields

| Field | Rule |
|---|---|
| `status` | `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` — deliberately only these 3 states (Part 2B: "not started/in progress/completed only, unless spec requires more"; FR-072's richer Assignment-status list is a different, Part-3-owned entity). |
| `percentage` | 0–100, **server-derived**. `progress.service.ts`'s `updateLessonProgress` always takes `Math.max(stored, observed)` — a client can never regress it. |
| `timeSpentSeconds` | Accumulated server-side. Each request's `timeSpentDeltaSeconds` is bounded to ≤ 3600 (1 hour) by both the Zod schema and a second server-side clamp — "bounded increments" (Part 2B). |
| `lastPosition` | A typed, discriminated-by-kind JSON shape (`video`/`audio`: `positionSeconds`; `article`: `scrollPercent`; `pdf`: `pageNumber`), each individually bounded. Not a free-form blob — the discriminated union in `progress.validation.ts` is the closest Zod equivalent to a typed sum type. |
| `completedAt`/`completionSource` | **Only ever set by `completion.service.ts`** — never by `progress.service.ts`'s routine update path. A lesson already `COMPLETED` never regresses to `IN_PROGRESS` from a playback ping (anti-rollback on status, not just percentage). |
| `version` | Optimistic-concurrency counter, incremented on every write. |

## Anti-cross-course / anti-IDOR

`progress.service.ts`'s `resolveLessonContext` runs the target lesson through `evaluateLessonAccess` (the SAME evaluator every read path uses) before any write — a learner can never post progress for a lesson their own enrollment doesn't cover, and can never reach another user's `LessonProgress` row at all (every route resolves the enrollment from `req.user!.id`, never from a client-supplied id).

## CORRECTION (Part 2 correction pass) — cross-activity/cross-lesson signal rejection

`assertLastPositionMatchesLessonActivities` (called before every progress write) rejects a `lastPosition.kind` that does not correspond to any `PUBLISHED` activity type actually present in the target lesson — e.g. a `{ kind: 'video', ... }` payload posted against a lesson whose only activity is a PDF is now rejected with `400`, rather than silently stored. This closes the "reject cross-activity and cross-lesson signals" gap: a forged or buggy client can no longer plant a position signal that doesn't belong to the lesson it claims to describe.

## CORRECTION (Part 2 correction pass) — idempotency strategy for progress updates

`updateLessonProgress` now accepts an OPTIONAL `Idempotency-Key` header:

- **Supplied** (a discrete, meaningful event — e.g. "the learner finished this video"): routed through the shared `IdempotencyKey` infrastructure (`lms.progress.discrete_event` scope) — the same `(actor, lesson, key, payload)` tuple replays its original result rather than double-applying the update.
- **Not supplied** (the common case — a high-frequency playback heartbeat, e.g. once every few seconds): NOT forced through the `IdempotencyKey` table at all. Creating one ledger row per heartbeat would be exactly the "unsafe or wasteful" pattern the correction brief warns against. Instead, safety comes from the ALREADY-BUILT monotonic/anti-rollback strategy above (`Math.max` on percentage, additive-but-bounded time-spent, `completedAt` never reset by a routine ping) — a duplicate or out-of-order heartbeat is naturally safe without a ledger row, because re-applying the same or an older observation can never move stored state backward or double-count time beyond the per-request bound.

This is a deliberate two-tier design, not an inconsistency: discrete, retryable, "did-this-happen-exactly-once" events get real idempotency-key protection; continuous, best-effort telemetry gets the monotonic-strategy protection the correction brief explicitly names as an acceptable alternative.

## What is explicitly NOT built

- Per-video telemetry beyond the single `lastPosition` field (FR-040's full "playback started/rewatch/device" event stream) — out of scope; the position is stored, the raw event stream is not.
- Cross-device conflict-resolution beyond "server state always wins, client always sends its own observed delta" — there is no separate offline-queue/device-tagging mechanism (mobile app does not exist in this codebase).
- A cached/materialized `CourseProgress` table for dashboard performance — not needed at this phase's scale; documented as a candidate optimization if course/module counts ever grow large enough to matter.
