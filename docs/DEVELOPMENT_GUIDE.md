# CoachX — Development Guide

## Architecture principles this codebase follows

- **Clean Architecture / layering**: routes → controllers → services →
  data access. Controllers stay thin (parse request, call a service,
  shape the response); business logic does not live in route handlers.
  Phase 1 has no services yet because it has no business logic — the
  `health` controller is the only handler, and it has no dependencies to
  layer.
- **SOLID**: each module has one reason to change (the config loader only
  changes when configuration needs change; the error handler only
  changes when error-response shape needs to change). Depend on the
  `AppError` abstraction, not on Express's raw error object, when
  throwing predictable errors.
- **Domain-Driven Design, where applicable**: business domains (Auth,
  Learning, Community, Gamification, ...) each get their own module
  folder once implemented, following the boundaries already defined in
  `specs/<NNN-feature>/plan.md`'s Ownership & Dependency Analysis — do
  not scatter one domain's logic across multiple top-level folders.
- **Server-authoritative state** (Constitution Article I): the frontend
  and admin apps never compute or assert entitlement/completion/payment
  state themselves — they display what the backend returns. This is
  already reflected in `frontend/src/api/client.ts`'s interceptor
  structure, ready for the auth module to attach tokens without any
  client-side trust logic.

## Where a new feature's code goes

Each feature in `specs/<NNN-feature-slug>/` maps to:

| Spec artifact | Implementation location |
| --- | --- |
| `spec.md`'s Key Entities | `database/prisma/schema.prisma` models, following that feature's field list |
| `plan.md`'s backend module (e.g. `backend/src/modules/lms-catalog/`) | New folder under `backend/src/modules/` |
| `plan.md`'s web routes (e.g. `web/src/app/(member)/learn/`) | New folder under `frontend/src/` (or `admin/src/` for admin-only surfaces) |
| `plan.md`'s mobile routes | New folder under `mobile/lib/features/<domain>/` |
| `tasks.md` | The actual task checklist to work through, in the stated dependency order |

Do not duplicate an entity or an engine that a feature's own `plan.md`
already names another feature as canonical for — check the "Ownership &
Dependency Analysis" section of both features' `plan.md` before writing
a new model or service.

## Coding standards

- TypeScript `strict` mode is on everywhere (`backend`, `frontend`,
  `admin`, `shared`) — do not weaken it per-file.
- No `console.log` in `backend/` — use the shared `logger` from
  `src/utils/logger.ts` (ESLint's `no-console: warn` rule enforces this).
- Every thrown, predictable backend error is an `AppError` (or one of its
  static factory methods: `AppError.badRequest`, `.notFound`, etc.), not
  a raw `Error` or a hand-rolled response.
- Async Express handlers are wrapped in `asyncHandler(...)` so a
  rejected promise reaches the global error handler instead of crashing
  the process.
- New route modules are mounted in `backend/src/routes/v1/index.ts` —
  never call `app.use()` for a business route directly in `app.ts`.
- Client-side: no direct `import.meta.env` / `process.env` access outside
  `config/env.ts` (frontend/admin) or `config/env.config.ts` (backend).
- Run `npm run lint` and `npm run typecheck` before opening a PR; CI
  (`.github/workflows/ci.yml`) blocks merges on either failing.

## Git workflow

- Branch per feature: `feature/<NNN>-<short-description>`, matching the
  spec numbering in `specs/`.
- Commit messages describe *why*, not just *what*, consistent with the
  existing spec-correction history in `specs/FEATURE-MANIFEST.md`.
- CI must pass (lint, typecheck, build, Prisma validate, Flutter analyze
  + test) before merging to `main`.

## Adding a new package script

Root-level scripts in `package.json` delegate to each workspace via
`--workspace=<name>` — add the underlying script to the workspace's own
`package.json` first, then add a root-level alias if it's something
you'll run often across the whole monorepo (mirroring the existing
`dev:*` / `build:*` / `db:*` pattern).

## Testing strategy (established, expanded per feature)

- **Backend**: Jest + ts-jest + Supertest, installed and configured in
  Phase 2 (`backend/jest.config.js`). Tests live under `backend/tests/`,
  split by convention into:
  - `contract/` — exercises the real Express app end-to-end via
    Supertest (e.g. hitting `/api/v1/health`, asserting response shape).
  - `unit/` — exercises a single module in isolation (e.g. `redact()`,
    `parseEnv()`), including the logger pipeline test
    (`tests/unit/logger.unit.test.ts`) that specifically re-creates a
    *non-silent* logger instance — see the callout below on why that
    matters.
  Run with `npm run test` (root) or `npm run test --workspace=backend`;
  `npm run test:watch` / `npm run test:coverage` are also available.
  Test environment is isolated via `backend/.env.test` (loaded
  automatically when `NODE_ENV=test`; see `src/config/env.config.ts`) —
  tests never read or depend on a developer's local `.env`.
- **Frontend/Admin**: Playwright for e2e, added when the first feature
  that needs it is implemented, per that feature's `tasks.md`.
- **Mobile**: `flutter_test` (configured; see `mobile/test/`).

### A real bug the test suite initially missed, and what that implies

While building Phase 2's logger redaction, the application's `logger`
instance runs with `winston`'s `silent: true` under `NODE_ENV=test` (so
test output isn't cluttered with log lines) — but `silent: true` skips
winston's entire format pipeline, not just the final write. A bug in a
custom format function (returning a new plain object instead of
mutating the same `info` reference, which silently drops winston's
internal Symbol-keyed properties and crashes `colorize()`) passed every
contract/unit test cleanly, because none of them ever actually ran the
format pipeline — it only surfaced when the dev server was started for
real and produced its first log line.

The fix (`backend/src/utils/logger.ts`, `logFormats` export) was to add
a dedicated test that builds a *second*, non-silent logger instance
using the exact same exported format pipeline, against an in-memory
`Writable` stream, and asserts it doesn't throw and actually redacts
sensitive fields in the real written output
(`tests/unit/logger.unit.test.ts`). The general lesson this encodes:
**a "does it throw" or "is it silenced" test is not the same as "does
the real pipeline work"** — when adding infrastructure that wraps a
third-party library's extension points (custom formats, middleware
factories, etc.), test against a real, non-mocked instance of that
extension point at least once, not only through a fully-silenced
application logger.

## Observability: logging format, correlation IDs, and redaction

- **Format**: `development` uses a colorized, human-readable single-line
  format (`[timestamp] level: message {meta}`); `production`/`staging`
  use structured JSON (one object per line) — both are built from the
  same `winston.format` pipeline (`backend/src/utils/logger.ts`,
  `logFormats` export), so behavior is consistent across environments,
  only the rendering differs.
- **Correlation IDs**: every request gets an `X-Request-Id` — reused
  from the caller's own `X-Request-Id` header if supplied (for
  cross-service tracing), otherwise generated via `crypto.randomUUID()`
  (`request-id.middleware.ts`, registered before anything that logs).
  It's echoed on every response (success or error) and included as
  `requestId` in the corresponding log line — grep any request's ID
  across `request-logger.middleware.ts`'s access-log line and
  `error-handler.middleware.ts`'s error line to reconstruct one
  request's full server-side trace.
- **Redaction**: `redact()` (`backend/src/utils/redact.ts`) recursively
  scrubs any key matching a sensitive-field pattern (`password`,
  `token`, `secret`, `authorization`, `cookie`, `apikey`, `jwt`, etc. —
  case/separator-insensitive) to `"[REDACTED]"`, applied automatically
  to **every** log call's metadata (via the `redactMeta` winston format)
  and to error `details` before they reach an HTTP response
  (`error-handler.middleware.ts`). Call sites never need to remember to
  scrub sensitive fields manually. See the logger-pipeline test above
  for why this is tested against a real, non-silenced logger instance.
- **What is deliberately NOT logged yet**: request/response bodies and
  headers are not logged (only method/path/status/duration) — there is
  no PII/credential surface to redact from a payload that isn't being
  logged in the first place. This will need revisiting once the first
  feature that logs request bodies is implemented.

## CI checks (`.github/workflows/ci.yml`)

Two jobs run on every push/PR to `main`:

**`web-packages`** (frontend/backend/admin/shared):
1. `npm ci`
2. `npm run build:shared` — **must** run before typecheck/lint (see the
   "real issue found" callout below)
3. `npx prisma validate` (schema-only; no live Postgres needed)
4. `npm run lint`
5. `npm run typecheck`
6. `npm run test` (backend Jest suite)
7. `npm run build` (all four workspaces)

**`mobile`**: `flutter pub get` → `flutter analyze` → `flutter test`.

Production deployment is explicitly **not** enabled by this workflow —
it validates a commit, it does not ship it anywhere.

### A real CI ordering bug found during Phase 2 validation

The original Phase 1 workflow ran `lint`/`typecheck` before building
`shared`. On a genuinely fresh checkout (verified by actually deleting
`shared/dist/` and re-running `npm run typecheck` locally, not just
inspecting the YAML), this fails with `Cannot find module
'@coachx/shared'` — `backend`/`frontend`/`admin` resolve `@coachx/shared`
through its compiled `dist/` output (per its `package.json` "types"
field), which doesn't exist until `shared` is built at least once. This
would have failed on every real CI run despite passing locally (where a
stale `dist/` from a previous build was already present). Fixed by
adding an explicit "Build shared package" step before lint/typecheck in
CI, and by making the root `npm run typecheck` script build `shared`
first too, so the same class of failure can't happen for a local
developer either.

### A real Prisma-client generation gap found during Phase 3 validation

Once `database/prisma/schema.prisma` gained real models (Phase 3), CI's
only Prisma step was `prisma validate` (schema-only). This was found to
be insufficient by direct testing, not assumption: manually clearing the
generated `@prisma/client` output and reinstalling the bare package
(`npm rebuild @prisma/client`) left the client in a broken,
non-regenerated state — `@prisma/client`'s own `postinstall` hook did
not reliably rebuild it in this npm-workspaces monorepo layout. Every
backend module that imports `PrismaClient`/`Prisma.*` types would fail
to even resolve the module, let alone typecheck, in that state. Fixed
by adding an explicit "Generate Prisma Client" step to CI (right after
"Validate Prisma schema") and by chaining `db:generate` into the root
`typecheck`/`test`/`build` scripts — the same defensive pattern already
used for `build:shared` in the Phase 2 fix above, applied here for the
same underlying reason: never assume a generated artifact exists just
because `npm ci` ran.

## Environment parity

`development` → `test` → `staging` → `production` are the only valid
values for `NODE_ENV` (enforced by the backend's env schema). Do not
invent a fifth environment name — extend the `envSchema` enum in
`backend/src/config/env.config.ts` if a genuine new environment is
required, and update `shared/src/types/environment.type.ts`'s
`NodeEnvironment` union to match.
