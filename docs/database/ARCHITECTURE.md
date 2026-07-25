# Database Architecture Guide

Status: **implemented-now** for everything under §1–§9 unless a
subsection says otherwise. This is the source-of-truth for how the
CoachX database layer is structured, named, and accessed — read this
before adding any new model or database-touching code, shared or
feature-owned.

## 1. Naming conventions

- **Prisma/TypeScript layer**: PascalCase model names (`AuditEvent`,
  `IdempotencyKey`), camelCase field names (`occurredAt`, `actorType`).
- **PostgreSQL layer**: snake_case table and column names, mapped via
  `@@map("table_name")` / `@map("column_name")`. Every model and every
  non-trivial field in `database/prisma/schema.prisma` carries an
  explicit `@@map`/`@map` — never rely on Prisma's implicit default
  casing, so the generated SQL is predictable and reviewable in
  migration diffs.
- **Enums**: PascalCase in Prisma (`ActorType`), snake_case Postgres
  type name via `@@map` (`actor_type`).
- **Indexes**: no explicit naming convention enforced yet beyond
  Prisma's defaults — revisit if/when index names start colliding
  across feature schemas (out of scope until a second schema file
  exists; see §11).

## 2. Where models live

`database/prisma/schema.prisma` is, as of Phase 3, the **only** Prisma
schema file in the repository, and is reserved for shared, platform-wide
**technical** infrastructure — never a business/domain entity. See
`docs/database/SCHEMA_OWNERSHIP.md` for the exact models present today,
their justification, and what was deliberately left out.

Every future business feature (Course, User, Payment, CRM Lead,
Marketplace Listing, etc.) owns its own models, added when that
feature's own implementation phase begins — per that feature's `spec.md`
Key Entities section, not invented ahead of time here.

## 3. Access layer — the only sanctioned way to touch the database

`backend/src/database/` is shared **infrastructure**, not a business
repository layer. Nothing in it knows about a specific feature's domain
logic; it only provides the mechanics every feature will need:

| Module                      | Purpose                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma-client.ts`          | Lazy `PrismaClient` construction, `connectDatabase()`/`disconnectDatabase()`, `checkDatabaseHealth()`, `getPrismaClient()` (the single accessor every other module reads from). |
| `transaction.ts`            | `withTransaction()` — the only sanctioned way to open a multi-statement transaction; normalizes errors and retries transient failures.                                          |
| `retry.ts`                  | `isRetryableDatabaseError()` / `withRetry()` — classifies which Prisma error codes are safe to retry (write conflicts, pool timeouts) vs. not (constraint violations).          |
| `db-error.ts`               | `normalizeDatabaseError()` — maps raw Prisma errors to the shared `AppError` shape so no raw Prisma error object ever reaches an HTTP response.                                 |
| `pagination.ts`             | `parsePaginationParams()` / `buildPaginationMeta()` / `paginate()` — built around the existing `@coachx/shared` `PaginationMeta` type (Phase 1), not a competing shape.         |
| `audit-event.repository.ts` | Read/write interface for the shared `AuditEvent` table — see `AUDITABILITY.md`.                                                                                                 |
| `idempotency.service.ts`    | Generic idempotency-key mechanism backing `IdempotencyKey` — see `TRANSACTIONS_AND_OUTBOX.md`.                                                                                  |
| `test-utils.ts`             | Test-only (`backend/tests/**` only) — `withRollback()`, `isTestDatabaseAvailable()`. Never imported by application code.                                                        |

Future feature services call `withTransaction()`, `paginate()`, etc.
directly — they do not construct their own `PrismaClient` or write raw
`prisma.$transaction()` calls, so retry/error-normalization behavior
stays consistent platform-wide.

## 4. Connectivity is optional at boot, by design

`connectDatabase()` never throws and never crashes the process — a
database that is unreachable at startup (wrong credentials, Postgres not
started yet, network blip) still lets the API boot and serve
`/api/v1/health`; only `/api/v1/ready` reflects the real dependency
state. This was established in Phase 2 and is unchanged by Phase 3 — the
new models don't change the fact that the whole platform must degrade
gracefully, never crash-loop, on a database outage.

## 5. Error normalization

Every database-touching path in shared infrastructure routes failures
through `normalizeDatabaseError()` before they can reach a controller —
callers only ever see an `AppError` (see `backend/src/utils/app-error.ts`),
never a raw `Prisma.PrismaClientKnownRequestError`. Mapping (see
`db-error.ts` and its unit tests):

| Prisma code   | Meaning                     | Mapped to                                      |
| ------------- | --------------------------- | ---------------------------------------------- |
| `P2002`       | Unique constraint violation | 409 Conflict                                   |
| `P2025`       | Record not found            | 404 Not Found                                  |
| `P2003`       | Foreign key violation       | 400 Bad Request                                |
| `P2011`       | Null constraint violation   | 400 Bad Request                                |
| anything else | Unrecognized                | 500 Internal (raw Prisma message never leaked) |

## 6. Retry policy

`withTransaction()` retries automatically (unless explicitly disabled)
on transient, retryable failures: `P2034` (write conflict/deadlock) and
`P2024` (connection pool timeout). Everything else fails immediately —
retrying a constraint violation would never succeed and would only
delay a correct error response.

## 7. Pagination

`paginate()` runs `findMany` and `count` **concurrently**, not
sequentially (verified by a dedicated unit test), and returns the
existing `PaginatedResponse<T>` shape from `@coachx/shared` (Phase 1) —
`{ data, meta: { page, pageSize, totalItems, totalPages } }`. Defaults
and clamps (`DEFAULT_PAGE=1`, `DEFAULT_PAGE_SIZE=20`, `MAX_PAGE_SIZE=100`)
come from the same `@coachx/shared` constants every other paginated
response already uses — no new pagination contract was invented for the
database layer.

## 8. Idempotency

See `docs/database/TRANSACTIONS_AND_OUTBOX.md`.

## 9. Audit fields and soft-delete standard (for FUTURE business models)

**Status: planned-later** — no business model exists yet to apply this
to, but the standard is documented now so every future feature follows
it consistently rather than each inventing its own convention:

- Every future business table SHOULD include `createdAt`/`updatedAt`
  (`DateTime @default(now())` / `@updatedAt`), following the same
  `Timestamptz(6)` pattern already used on `AuditEvent`/`IdempotencyKey`.
- Soft-delete (`deletedAt DateTime?`) is the default expectation for
  business records a user can "delete" — hard deletes are reserved for
  genuinely ephemeral technical data (e.g. `IdempotencyKey` rows past
  their `expiresAt`).
- **Exception, by design**: `AuditEvent` has neither `updatedAt` nor a
  soft-delete flag — it is immutable by construction (see
  `AUDITABILITY.md`). Do not "fix" this by adding those fields; an
  audit record that could be edited or soft-deleted would defeat its
  purpose.

## 10. Data retention

**Status: planned-later / decision gate.** `IdempotencyKey.expiresAt`
exists in the schema so a per-scope expiry/cleanup job can be added once
a real consumer exists, but no cleanup job (cron, scheduled Lambda,
etc.) is implemented yet — there is no scheduler infrastructure in the
repo to hang it on. `AuditEvent` retention (how long the immutable audit
log is kept, and any compliance-driven archival requirement) is likewise
undecided — see `docs/database/DECISION_GATES.md`.

## 11. Multiple schema files / feature-owned schemas

**Status: decision gate**, not yet needed. As of Phase 3 there is one
Prisma schema file. When the first business feature adds its own models,
whether it gets its own schema file (Prisma's `prismaSchemaFolder`
preview feature) or all models continue to live in one
`schema.prisma` is an open decision — tracked in
`docs/database/DECISION_GATES.md`, not decided unilaterally here.
