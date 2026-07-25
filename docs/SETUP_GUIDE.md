# CoachX — Project Setup Guide

This guide gets a fresh clone of the CoachX Enterprise Platform running
locally. It covers **Phase 1 (Project Foundation)** and **Phase 2 (Core
Infrastructure)** — there are no business features to configure yet,
only the infrastructure (config, logging, error handling, health/
readiness, database connectivity foundation, security middleware) that
later features build on.

## 1. Prerequisites

| Tool       | Minimum version | Check with           |
| ---------- | ---------------- | --------------------- |
| Node.js    | 20.x              | `node --version`      |
| npm        | 10.x              | `npm --version`       |
| Docker     | 24.x (optional but recommended) | `docker --version` |
| Flutter SDK| 3.22.x            | `flutter --version`   |
| Git        | any recent        | `git --version`       |

## 2. One-command setup

```bash
./scripts/setup.sh
```

This installs all Node workspace dependencies (`frontend`, `backend`,
`admin`, `shared`, `database`), copies every `.env.example` to `.env`
where one doesn't already exist, generates the Prisma client, and runs
`flutter pub get` for the mobile app if Flutter is installed.

If you prefer to do it by hand, see the manual steps below.

## 3. Manual setup

### 3.1 Install Node dependencies

From the repository root (this is an npm workspaces monorepo — always
install from the root, never inside an individual package):

```bash
npm install
```

### 3.2 Configure environment variables

Copy each package's example file and adjust values as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
cp database/.env.example database/.env
```

None of the example files contain real secrets — the JWT secrets and
Supabase keys are development-only placeholders. Never commit a real
`.env` file (the root `.gitignore` already excludes them). The one
exception is `backend/.env.test` — it **is** committed, deliberately: it
contains no real secrets, is never used outside the test runner, and
keeping it in version control is what gives every contributor (and CI)
an identical, isolated test environment without extra setup steps.

#### Backend environment variable reference

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | One of `development`, `test`, `staging`, `production`. Controls log format (dev = colorized text, prod = JSON) and which `.env*` file loads. |
| `PORT` | No | `4000` | Must be a positive integer. |
| `HOST` | No | `0.0.0.0` | Bind address. |
| `API_PREFIX` | No | `/api` | All versioned routes mount under `<API_PREFIX>/v1/...`. |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowlist — origins not in this list are rejected by the CORS middleware. |
| `LOG_LEVEL` | No | `info` | One of `error`, `warn`, `info`, `http`, `debug`. |
| `DATABASE_URL` | No (yet) | *(unset)* | Optional in Phase 1/2 because there are no models to query yet — see §3.4. When set, `/api/v1/ready` reports real connection status. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | No | dev-only placeholders | **Not used by any code yet** — reserved for the Authentication phase. The placeholder values are intentionally obviously-fake so nobody mistakes them for real secrets. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | No | *(unset)* | Reserved for the Storage feature — not consumed by any code yet. |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | No | `60000` / `120` | Applies to the whole `<API_PREFIX>` surface. |

**Never exposed to the frontend/admin apps**: nothing in this table is
prefixed `VITE_`, so none of it is ever bundled into client-side
JavaScript — Vite only exposes `VITE_*`-prefixed variables to the
browser (see `frontend/.env.example` / `admin/.env.example`, which only
ever contain a public API base URL and app name).

**Missing/invalid variables fail fast**: `backend/src/config/env.config.ts`
validates `process.env` against a Zod schema at startup. An invalid or
missing *required* field prints exactly which field(s) failed and exits
immediately (`process.exit(1)`) — the server never starts in a
partially-configured state. Every field above currently has a safe
default, so an empty `.env` is enough to boot in development; this will
change as later phases add genuinely required secrets (e.g. JWT signing
keys with no safe default in production).

### 3.3 Start Postgres

Using Docker (recommended):

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

Or point `DATABASE_URL` in `backend/.env` and `database/.env` at any
Postgres 16 instance you already have running.

### 3.4 Prisma — expected no-model state (still true in Phase 2)

`database/prisma/schema.prisma` currently defines only the
datasource/generator — no models — because neither Phase 1 nor Phase 2
create feature-specific tables. This has direct, expected consequences,
confirmed by actually running each command against the current schema
(not assumed):

- `npx prisma validate` and `npx prisma format` **work today** (no DB
  connection needed) and confirm the schema file itself is well-formed.
- `npm run db:generate` (`prisma generate`) **fails** with
  `"You don't have any models defined in your schema.prisma, so nothing
  will be generated"` until the first model is added — Prisma requires
  at least one model to generate a client. This is not a bug in the
  scaffold; it is the correct, honest state of a schema with zero tables.
  `scripts/setup.sh` treats this as a non-fatal, expected step and
  continues rather than aborting.
- Because `prisma generate` cannot succeed yet, `@prisma/client`'s
  installed package is an unusable stub — its `PrismaClient` constructor
  throws `"@prisma/client did not initialize yet"` **immediately when
  instantiated** (confirmed by direct testing; the throw happens in the
  constructor, not at import time). Phase 2's database connectivity
  layer (`backend/src/database/prisma-client.ts`) is written specifically
  around this fact: it never constructs `PrismaClient` at module load
  time, only lazily inside `connectDatabase()`, and treats the failure
  as a handled, logged, non-fatal condition — the backend still starts
  and serves `/api/v1/health` normally; only `/api/v1/ready` reflects
  the database as unavailable (see §4a below).
- `database/seeds/index.ts` will throw the same error if run before
  `generate` has succeeded at least once. Do not attempt to "fix" this
  by seeding fake data into a placeholder table — it resolves naturally
  the moment the first feature (per its own `spec.md`) adds its models.
- `prisma migrate dev` requires both a reachable Postgres instance and
  at least one model — also not applicable yet.

This is a deliberate, reported limitation, not an oversight — see the
Known Limitations section (§7) for the full status.

### 3.5 Run the apps

```bash
npm run dev              # backend + frontend + admin, concurrently
# — or individually —
npm run dev:backend      # http://localhost:4000
npm run dev:frontend     # http://localhost:5173
npm run dev:admin        # http://localhost:5174
```

### 3.6 Run the mobile app

```bash
cd mobile
cp env/dev.json.example env/dev.json
flutter pub get
flutter run --dart-define-from-file=env/dev.json
```

## 4. Verifying the setup

- `curl http://localhost:4000/api/v1/health` should return
  `{"success":true,"data":{"status":"ok", ...}}`.
- Opening `http://localhost:5173` should show the "CoachX Frontend
  Foundation" status screen, which itself calls the health endpoint and
  displays the result.
- `http://localhost:5174` shows the equivalent admin foundation screen.

### 4a. Health vs. readiness — what each endpoint actually means

| | `GET /api/v1/health` | `GET /api/v1/ready` |
| --- | --- | --- |
| Answers | "Is the process alive?" (liveness) | "Can this instance safely receive traffic right now?" (readiness) |
| Checks dependencies | No — never touches the database | Yes — currently: database, when `DATABASE_URL` is configured |
| Status codes | Always `200` if the process is running | `200` if every *configured* dependency is healthy; `503` if any configured dependency has failed |
| Typical use | Container/process liveness probe | Load balancer / Kubernetes readiness probe — routes traffic away from an instance that returns 503 |
| Example (DB not configured) | `{"success":true,"data":{"status":"ok",...}}` | `{"success":true,"data":{"status":"ready","checks":[{"name":"database","status":"skip","message":"DATABASE_URL not configured"}]}}` |
| Example (DB configured but unreachable) | Unaffected — still `200` | `503` — `{"success":false,"error":{"code":"NOT_READY",...,"details":{"checks":[{"name":"database","status":"fail","message":"..."}]}}}}` |

A `skip` status is **not** a failure — it means that dependency isn't
configured in this environment, which is expected and correct for
Phase 1/2 (no `DATABASE_URL` needed yet since there are no models to
query). Neither endpoint ever includes a connection string, credential,
or stack trace in its response body — verified by dedicated tests (see
`backend/tests/contract/{health,readiness}.contract.test.ts`).

## 5. Running the full Docker stack

To build and run every service (Postgres + backend + frontend + admin)
in containers instead of on the host:

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Startup order is enforced by health checks, not just container start
order: `frontend`/`admin` wait for `backend`'s `depends_on: condition:
service_healthy` (backed by the same `/api/v1/health` endpoint via the
Dockerfile's `HEALTHCHECK` instruction), and `backend` waits for
`postgres`'s own `pg_isready` health check.

## 6. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `npm install` fails resolving `@coachx/shared` | Run `npm install` from the **repository root**, not from inside `backend/`/`frontend/`/`admin/`. |
| `npm run typecheck` fails with "Cannot find module '@coachx/shared'" | `shared/dist/` doesn't exist yet — run `npm run build:shared` first (the root `typecheck` script now does this automatically; only relevant if you're calling `tsc --noEmit` directly inside a package). |
| Backend fails to start with an env validation error | A required variable is missing/malformed in `backend/.env` — the startup log lists exactly which field. |
| Frontend shows "Backend unreachable" | Confirm the backend is running and `VITE_API_BASE_URL` in `frontend/.env` points at it. |
| `prisma validate` fails with "environment variable not found" | Copy `database/.env.example` to `database/.env` first. |
| `/api/v1/ready` returns 503 in local dev | Expected if `DATABASE_URL` is set in `backend/.env` but no Postgres is running — either start Postgres (§3.3) or remove `DATABASE_URL` from `.env` to get a `skip` instead of a `fail`. |
| `flutter run` can't reach the backend from an Android emulator | Use `10.0.2.2` instead of `localhost` in `API_BASE_URL` — the emulator's alias for the host machine (already the default in `env/dev.json.example`). |

## 7. Known limitations (accurate as of Phase 2)

- **No database models exist yet** (§3.4) — `prisma generate`,
  `prisma migrate dev`, and `database/seeds/index.ts` are all
  non-functional until the first feature adds models. This is an
  intentional, documented scope boundary, not a defect.
- **JWT/Supabase/RBAC config fields are unused placeholders.** They
  validate correctly and have safe dev defaults, but no code reads them
  yet — Authentication is a later phase.
- **No business API routes exist.** Only `/api/v1/health` and
  `/api/v1/ready` are mounted.
- **`npm audit` reports vulnerabilities in transitive dev-tooling
  dependencies**, not runtime/production code:
  - `brace-expansion`/`minimatch` (via ESLint 8's and Jest's own
    dependency chains) — a ReDoS advisory in a lint/test-only path.
  - `esbuild` (via Vite 5's dev server) — a dev-server-only request
    advisory; does not affect the production build output.
  - `react-router-dom` — an open-redirect advisory; the fix requires a
    major version bump (React Router 7), which is a breaking API change
    out of scope for this phase and not applied without a deliberate
    upgrade decision.

  None of these have a non-breaking fix currently available via
  `npm audit fix` (verified by running it) — resolving them requires
  major version upgrades (ESLint 9 flat config, Vite 6, React Router 7)
  that should be planned as their own deliberate task, not bundled
  silently into infrastructure work. Run `npm audit` at any time to see
  the current, authoritative list — this section will go stale if not
  re-verified against a fresh audit before relying on it.
- **CI does not yet run against a real Postgres service container.**
  `prisma validate` (schema-only, no live connection needed) runs in CI;
  a real Postgres-backed integration test is meaningful once the first
  model exists.
