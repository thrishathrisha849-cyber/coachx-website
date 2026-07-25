# Transaction and Outbox Pattern

Status: **implemented-now** for transactions and idempotency;
**decision gate, deliberately not implemented** for a transactional
outbox — see §3.

## 1. Transactions — `withTransaction()`

`backend/src/database/transaction.ts` is the **only sanctioned way** to
open a multi-statement database transaction anywhere in this codebase.
Future feature services must call `withTransaction(work, options)`
rather than `prisma.$transaction(...)` directly, so retry and
error-normalization behavior stays consistent platform-wide.

```ts
await withTransaction(async (tx) => {
  await tx.someModel.create({ ... });
  await tx.otherModel.update({ ... });
});
```

Behavior, verified by both unit tests (`retry.unit.test.ts`,
`db-error.unit.test.ts`) and a real-database integration test
(`database.integration.test.ts`, "withTransaction()" suite):

- All writes inside `work` commit together, or none do.
- A thrown error inside `work` rolls back every write performed so far
  in that transaction (verified directly — the integration test creates
  a row, throws, then asserts the row does not exist afterward).
- Transient failures (`P2034` write conflict/deadlock, `P2024`
  connection pool timeout) are retried automatically with backoff unless
  `{ retry: false }` is passed.
- Every failure — retried-and-exhausted or immediate — is normalized to
  an `AppError` via `normalizeDatabaseError()` before reaching the
  caller.

## 2. Idempotency — `beginIdempotentOperation()`

`backend/src/database/idempotency.service.ts`, backed by the shared
`IdempotencyKey` table. Grounding: Constitution Article I
(Server-Authoritative State) names idempotency-key checking directly as
one of the three sanctioned ways to finalize server-authoritative state;
`specs/006-gamification-rewards/spec.md` FR-014 requires it by name for
point awards.

```ts
const outcome = await beginIdempotentOperation<MyResponseShape>(
  'gamification.point-award', // scope — namespaces the key per use-case
  requestIdempotencyKey, // caller-supplied key
  requestBody, // optional — enables payload-hash mismatch detection
);

switch (outcome.status) {
  case 'new':
    // do the real work, then:
    await outcome.complete(responseToCache);
    break;
  case 'replayed':
    // return outcome.response — the original cached result — without redoing the work
    break;
  case 'in-progress':
    // a concurrent request with the same key is still processing — respond 409, don't race it
    break;
}
```

Three states, each verified by a real-database integration test:

1. **`new`** — first time this `(scope, key)` pair has been seen; caller
   gets `complete()`/`fail()` callbacks to finalize the PENDING row.
2. **`replayed`** — the key was already `COMPLETED`; caller gets the
   originally cached `responseSnapshot` back instead of redoing the
   operation.
3. **`in-progress`** — the key exists but is still `PENDING` (a
   concurrent, in-flight request with the same key); caller should
   respond accordingly (e.g. HTTP 409) rather than racing the original.

A reused key with a **different** request payload hash throws
`AppError.conflict()` rather than silently returning a stale cached
response for a materially different request — the classic idempotency
misuse case, verified directly by an integration test.

This module has **zero knowledge** of what any given `scope` actually
does. It only guarantees the one thing a shared technical utility
should: the same `(scope, key)` pair is never processed twice. Each
owning feature chooses its own `scope` string and interprets its own
`responseSnapshot` shape.

## 3. Transactional outbox — deliberately NOT implemented

**Status: decision gate.** An `OutboxEvent` model (the standard pattern
for atomically committing a state change and an "event to publish"
together, then relaying it to a message bus/webhook dispatcher
out-of-band) was considered and rejected for Phase 3:

- No spec across 001–006 explicitly mandates a shared outbox table
  today.
- There is no current producer or consumer that needs it — nothing in
  this phase publishes cross-service events.
- Feature 064 (API gateway / integration governance) is the confirmed
  future owner of the platform's actual event/integration infrastructure
  (see `docs/database/SCHEMA_OWNERSHIP.md` §3) — building a competing
  outbox table here now would risk exactly the kind of duplicate-engine
  problem the 022/032/063/064 ownership resolution (an earlier phase of
  this project) was created to prevent.

If a future feature needs atomic "commit + publish" semantics before
064 is implemented, that is the trigger to revisit this decision — not
a reason to add an unused table speculatively now.

## 4. Retry classification reference

| Prisma error code  | Meaning                                | Retryable? |
| ------------------ | -------------------------------------- | ---------- |
| `P2034`            | Transaction write conflict or deadlock | Yes        |
| `P2024`            | Connection pool timeout                | Yes        |
| `P2002`            | Unique constraint violation            | No         |
| `P2025`            | Record not found                       | No         |
| `P2003`            | Foreign key violation                  | No         |
| Non-Prisma `Error` | Unknown                                | No         |

See `backend/src/database/retry.ts` and its unit tests for the
authoritative, tested list.
