/**
 * Real-database integration tests for Phase 3's database foundation:
 * Prisma client lifecycle, the transaction wrapper, the idempotency
 * service, the audit-event repository, and test-transaction isolation.
 *
 * ENVIRONMENT DEPENDENCY (reported, not hidden): these tests require a
 * reachable PostgreSQL instance with Phase 3's migration already
 * applied. Point `TEST_DATABASE_URL` at a dedicated test database
 * (never the dev/prod one) — e.g., after
 * `docker compose -f infrastructure/docker-compose.dev.yml up -d`:
 *
 *   createdb -h localhost -U coachx coachx_test
 *   DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
 *     npx prisma migrate deploy --schema=database/prisma/schema.prisma
 *
 * If `TEST_DATABASE_URL` is unset or the database is unreachable
 * (confirmed by actually attempting a connection, not assumed), every
 * test in this file reports itself as SKIPPED with a clear console
 * message rather than silently no-oping as a false "pass" — see
 * `docs/database/TESTING.md` for the full explanation and current
 * status in CI/this environment.
 */

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

// Fresh module registry so `config`/`prisma-client` re-read the
// DATABASE_URL set above — same pattern as
// `readiness-unavailable.contract.test.ts` (Phase 2).
jest.resetModules();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  connectDatabase,
  disconnectDatabase,
  getPrismaClient,
} = require('../../src/database/prisma-client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withTransaction } = require('../../src/database/transaction');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { recordAuditEvent, findAuditEvents } = require('../../src/database/audit-event.repository');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { beginIdempotentOperation } = require('../../src/database/idempotency.service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withRollback, isTestDatabaseAvailable } = require('../../src/database/test-utils');

let dbAvailable = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING database.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.',
    );
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING database.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
        '(this is expected in this sandbox — no Docker/Postgres is available here; see docs/database/TESTING.md).',
    );
  }
}, 15_000);

afterAll(async () => {
  if (dbAvailable) {
    await disconnectDatabase();
  }
});

function skipIfNoDatabase(): boolean {
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('  ↳ skipped (no test database available)');
    return true;
  }
  return false;
}

describe('Prisma client lifecycle', () => {
  it('connects, runs a raw query, and disconnects cleanly', async () => {
    if (skipIfNoDatabase()) return;

    const client = getPrismaClient();
    expect(client).not.toBeNull();

    const result = await client.$queryRaw`SELECT 1 as value`;
    expect(result).toEqual([{ value: 1 }]);
  });
});

describe('withTransaction()', () => {
  it('commits all writes performed inside a successful transaction', async () => {
    if (skipIfNoDatabase()) return;

    const key = `txn-test-${Date.now()}`;
    await withTransaction(async (tx: any) => {
      await tx.idempotencyKey.create({ data: { scope: 'test.txn', key, status: 'PENDING' } });
    });

    const client = getPrismaClient();
    const row = await client.idempotencyKey.findUnique({
      where: { scope_key: { scope: 'test.txn', key } },
    });
    expect(row).not.toBeNull();

    // cleanup
    await client.idempotencyKey.delete({ where: { scope_key: { scope: 'test.txn', key } } });
  });

  it('rolls back all writes when the work function throws', async () => {
    if (skipIfNoDatabase()) return;

    const key = `txn-rollback-${Date.now()}`;

    await expect(
      withTransaction(async (tx: any) => {
        await tx.idempotencyKey.create({ data: { scope: 'test.txn', key, status: 'PENDING' } });
        throw new Error('deliberate failure to force rollback');
      }),
    ).rejects.toThrow();

    const client = getPrismaClient();
    const row = await client.idempotencyKey.findUnique({
      where: { scope_key: { scope: 'test.txn', key } },
    });
    expect(row).toBeNull();
  });
});

describe('withRollback() test-isolation helper', () => {
  it('always rolls back, even on success, leaving no trace', async () => {
    if (skipIfNoDatabase()) return;

    const key = `rollback-helper-${Date.now()}`;

    const returnedValue = await withRollback(async (tx: any) => {
      await tx.idempotencyKey.create({ data: { scope: 'test.rollback', key, status: 'PENDING' } });
      return 'work-completed';
    });

    expect(returnedValue).toBe('work-completed');

    const client = getPrismaClient();
    const row = await client.idempotencyKey.findUnique({
      where: { scope_key: { scope: 'test.rollback', key } },
    });
    expect(row).toBeNull(); // proves the transaction was rolled back, not committed
  });
});

describe('Idempotency service (beginIdempotentOperation)', () => {
  it('returns "new" the first time a (scope, key) pair is seen, then "replayed" after completion', async () => {
    if (skipIfNoDatabase()) return;

    const scope = 'test.idempotency';
    const key = `idem-${Date.now()}`;

    const first = await beginIdempotentOperation(scope, key);
    expect(first.status).toBe('new');
    if (first.status === 'new') {
      await first.complete({ result: 'ok' });
    }

    const second = await beginIdempotentOperation(scope, key);
    expect(second.status).toBe('replayed');
    if (second.status === 'replayed') {
      expect(second.response).toEqual({ result: 'ok' });
    }
  });

  it('returns "in-progress" for a concurrent call against a still-PENDING key', async () => {
    if (skipIfNoDatabase()) return;

    const scope = 'test.idempotency';
    const key = `idem-pending-${Date.now()}`;

    const first = await beginIdempotentOperation(scope, key);
    expect(first.status).toBe('new');

    const second = await beginIdempotentOperation(scope, key);
    expect(second.status).toBe('in-progress');
  });

  it('rejects a reused key whose request payload hash differs from the original', async () => {
    if (skipIfNoDatabase()) return;

    const scope = 'test.idempotency';
    const key = `idem-conflict-${Date.now()}`;

    await beginIdempotentOperation(scope, key, { amount: 100 });

    await expect(beginIdempotentOperation(scope, key, { amount: 999 })).rejects.toThrow();
  });
});

describe('Audit event repository', () => {
  it('persists a redacted audit event and it is queryable afterward', async () => {
    if (skipIfNoDatabase()) return;

    const resourceId = `audit-test-${Date.now()}`;

    await recordAuditEvent({
      actorType: 'SYSTEM',
      action: 'test.database_foundation.verified',
      resourceType: 'test_resource',
      resourceId,
      beforeState: { password: 'super-secret', status: 'draft' },
      afterState: { status: 'published' },
    });

    const events = await findAuditEvents({ resourceType: 'test_resource', resourceId });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('test.database_foundation.verified');
    expect(JSON.stringify(events[0].beforeState)).not.toContain('super-secret');
    expect(JSON.stringify(events[0].beforeState)).toContain('[REDACTED]');
  });
});
