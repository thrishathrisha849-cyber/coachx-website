# Learning Activities (Phase 6 Part 2A)

## Scope

`LearningActivity` is metadata-only content attached to a `Lesson` (004 FR-017). **No runtime playback/streaming/viewer engine is built in this phase** — no video player, no PDF viewer, no adaptive bitrate logic, no signed-URL generation service. The model stores what a future delivery layer would need to render the content; it does not implement that delivery layer.

## Types modeled (and why others are excluded)

`LearningActivityType`: `VIDEO`, `AUDIO`, `ARTICLE`, `PDF`, `DOWNLOAD`, `EXTERNAL_LINK`, `EMBED`.

FR-017 lists a much larger type set (Presentation, Image, Live session, Quiz, Assessment, Assignment, Project, Survey, Reflection, SCORM, Interactive tool, AI-assisted exercise). Every excluded type either requires a runtime engine this phase does not build (Quiz/Assessment/Assignment — Part 3; Live session — a provider-integration feature; SCORM/Interactive tool/AI-exercise — explicitly "future-ready" per spec.md's own Assumptions) or is a straightforward variant already covered by an existing type (Presentation/Image can be modeled as `DOWNLOAD` or `EMBED` depending on delivery). Adding placeholder enum values for types with no backing logic was rejected as the exact "invented state with no basis" defect the Part 1 correction pass fixed once already.

## Typed fields, not a JSON blob

Per Part 2A's explicit "avoid JSON blobs when dedicated fields exist" instruction, every content type gets its own nullable typed column rather than one `data Json` field:

| Field | Used by |
|---|---|
| `mediaUrl` | VIDEO, AUDIO, DOWNLOAD, PDF |
| `externalUrl` | EXTERNAL_LINK |
| `bodyText` | ARTICLE |
| `durationSeconds` | VIDEO, AUDIO (feeds `MINIMUM_WATCH_PERCENT` completion) |
| `fileSizeBytes` | DOWNLOAD, PDF (metadata only — no upload/scan pipeline) |
| `embedProvider` + `embedResourceId` | EMBED |

## Per-content-type security rules (Part 2C)

- **VIDEO/AUDIO/DOWNLOAD/PDF `mediaUrl`** and **EXTERNAL_LINK `externalUrl`** must be `https://` or an internal `/storage/...` path — `javascript:`, `data:`, `file:`, and every other scheme are rejected by `lesson.validation.ts`'s `safeUrl` schema.
- **EMBED** never stores raw iframe HTML or an arbitrary `src`. `embedProvider` is drawn from a closed, code-reviewed allowlist (`EMBED_PROVIDERS = ['youtube', 'vimeo', 'google_drive', 'loom']`); `embedResourceId` is an opaque provider-specific ID. A future renderer is expected to build the actual embed URL/iframe from `(provider, resourceId)` server-side, never from caller-supplied markup. Adding a provider is a deliberate code change, not a runtime-configurable value.
- **ARTICLE `bodyText`** is treated as plain/sanitized text at render time (same discipline as the CMS module's rich-text blocks) — never trusted as raw HTML.
- Every per-type "required field" rule is enforced BOTH at request-validation time (`lesson.validation.ts`'s `superRefine`) and again at the service layer on update (`activity.service.ts`'s `assertActivityTypeInvariants`), so a PATCH that changes `type` without resupplying the new type's required field is still rejected — closing the "change type via partial update, leave stale/absent fields" gap a naive create-only check would miss.

## Ordering

Same two-pass offset reorder pattern as Lesson/Module, scoped to `lessonId`. `@@unique([lessonId, position])`.

## Public exposure

`toPublicActivity` returns every typed field (mediaUrl/externalUrl/bodyText/etc.) — there is no separate "locked" activity shape, because activities are only ever returned as part of `toPublicLessonDetail`, which itself is only returned after the access evaluator has already confirmed full lesson access. An activity is never independently fetchable by a learner outside its parent lesson's access check.

## Limitations

- No file upload, virus scanning, or signed-URL generation pipeline (FR-045, FR-048, FR-073) — `mediaUrl` is a pre-existing URL an admin/instructor supplies; where that content is actually hosted is out of this phase's scope.
- No transcript/caption storage.
- No per-activity view-tracking (`resourceViewed`/`downloadStarted` events, FR-049) — `ALL_ACTIVITIES_VIEWED` lesson completion is therefore treated identically to `MANUAL` in Part 2 (see `COMPLETION_ENGINE.md`).
