# Migration Guide

Status: **implemented-now** for the workflow and the one existing
migration; the "apply against a real database" steps are
**environment-blocked** in the sandbox this phase was built in (no
Docker, no local Postgres — confirmed by direct testing, not assumed)
and are written for the next contributor/CI run that does have one.

## 1. Current state

```
database/prisma/migrations/
├── migration_lock.toml                              (provider = "postgresql")
└── 20260725084057_init_audit_and_idempotency/
    └── migration.sql
```

This is the **first real migration** in the repository — it creates
`audit_events`, `idempotency_keys`, and their two enum types
(`actor_type`, `idempotency_status`), plus five indexes and one unique
constraint (`idempotency_keys(scope, key)`). It was generated with
Prisma's own engine, not hand-written:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

This specific command was used **because it works fully offline** — it
diffs against an empty starting state and needs no live database
connection, unlike `prisma migrate dev` (confirmed by direct testing:
`prisma migrate dev --create-only` fails with `P1001: Can't reach
database server` even in create-only mode, since it still needs to read
the target database's current migration state). The output is genuine,
Prisma-engine-produced SQL — not fabricated by hand — which is the
standard this repository holds every migration to.

## 2. Day-to-day workflow (once Postgres is reachable)

```bash
# 1. Edit database/prisma/schema.prisma
# 2. Generate a new migration + apply it to your local dev database:
npm run db:migrate            # prisma migrate dev

# 3. Regenerate the Prisma client (usually automatic after migrate dev,
#    but explicit after a manual schema edit without a new migration):
npm run db:generate
```

`prisma migrate dev` will prompt for a migration name interactively if
one isn't supplied; prefer running it directly with `npx prisma migrate
dev --name <descriptive_name>` from `database/` for a scriptable,
reviewable migration folder name.

## 3. Applying migrations in a deployed/CI environment

**Never use `prisma migrate dev` outside a developer's local machine** —
it is an interactive, dev-only command that can reset the database in
some failure-recovery paths. The explicit, non-interactive,
production-safe command is:

```bash
DATABASE_URL=<real-connection-string> npx prisma migrate deploy
```

(`npm run db:migrate` in the root `package.json` intentionally maps to
`migrate:dev`, not `migrate:deploy` — there is no root shortcut for the
deploy command, on purpose, so a production deploy is always an explicit,
deliberate command a deployer types themselves, never something a
generic `npm run db:*` script could be misfired into.)

`prisma migrate deploy`:

- Never prompts interactively.
- Never generates a new migration (it only applies existing, committed
  ones) — if the target schema and the migrations folder have diverged,
  it fails loudly rather than guessing.
- Is safe to run repeatedly (already-applied migrations are skipped).

## 4. Checking migration status

```bash
npm run db --workspace=database  # (see database/package.json for the full script list)
npx prisma migrate status        # from database/, against a configured DATABASE_URL
```

## 5. What is NOT yet true (environment-blocked, reported honestly)

- The migration above has **not been applied against a live database**
  in this environment — there is no reachable Postgres (Docker and
  local `psql`/`pg_isready` were both confirmed absent). The SQL is
  genuine and was validated via `prisma validate`/`format`/`generate`
  (all of which succeeded), but "the migration file is syntactically
  and semantically correct" and "the migration has been run against a
  real database and confirmed to produce the expected schema" are two
  different claims — only the first is verified here. Verifying the
  second is the very next step once Postgres is available (see
  `docs/database/TESTING.md` for the exact commands).
- CI does not yet apply this migration against a Postgres service
  container — see `docs/database/DECISION_GATES.md`.

## 6. Rollback policy

Prisma has no built-in automatic "down" migration. The house policy
(consistent with Constitution Article IV, Historical Immutability, which
already governs this codebase's approach to historical data): prefer a
new **forward** migration that corrects a mistake over editing or
deleting an already-applied migration file. Editing a migration that has
already been applied anywhere (even just a teammate's machine) breaks
Prisma's migration-history checksum and is the single most common cause
of "database schema is not in sync with your migrations" errors.
