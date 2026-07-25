# Seed Guide

Status: **implemented-now** for the runner, its lifecycle, and its
production-safety guard; **planned-later** for any actual seed data
(none exists yet — there is nothing meaningful to seed for
`AuditEvent`/`IdempotencyKey`, both of which only ever hold real
runtime-generated data, never fixture data).

## 1. Running the seed script

```bash
npm run db:seed        # from the repository root
# — equivalent to —
cd database && npm run seed
```

This runs `database/seeds/index.ts` via `tsx`. As of Phase 3 it is
still a no-op: it prints a status message and exits cleanly. It is
wired up now, with its safety guard already in place, specifically so
no future contributor adding real seed data has to remember to add
production protection retroactively — see §3.

## 2. When real seed data will be added

Per-feature, once that feature's own Prisma models exist — e.g. once
Feature 003 (Authentication) is implemented, its own seed logic (a
default admin user, standard roles) would be added to a
feature-appropriate seed module. Seeding a model that doesn't exist yet
would be fake work; this repository does not do that.

## 3. Production safety guard

`database/seeds/index.ts` refuses to run destructively against what
looks like a production database:

```ts
function assertSafeToSeed(): void {
  // Refuses when NODE_ENV=production, unless SEED_ALLOW_PRODUCTION=true
  // Refuses when DATABASE_URL looks like a managed/production host
  // (rds.amazonaws.com, *.prod.*, "production", supabase.co),
  // unless SEED_ALLOW_PRODUCTION=true
}
```

This guard is deliberately **conservative** — it may occasionally
refuse a legitimate non-production database whose URL happens to match
one of the patterns (e.g. a staging Supabase project). The escape hatch
is explicit and requires deliberate operator action:

```bash
SEED_ALLOW_PRODUCTION=true npm run db:seed
```

There is no environment variable that silently disables this guard by
accident — it must be spelled out exactly, every time.

## 4. Test-database seeding

Integration tests do **not** run `database/seeds/index.ts` — they use
`backend/src/database/test-utils.ts`'s `withRollback()` to create
whatever fixture data a specific test needs, inside a transaction that
is always rolled back, so tests never depend on (or pollute) any
seeded state. See `docs/database/TESTING.md`.
