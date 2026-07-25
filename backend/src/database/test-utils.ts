import { getPrismaClient } from './prisma-client';
import type { TransactionClient } from './transaction';

/**
 * Test-only database isolation helper — NOT imported by any
 * application code, only by `backend/tests/**`.
 *
 * Runs `work` inside a transaction that is ALWAYS rolled back at the
 * end, regardless of whether `work` succeeds or throws — the standard
 * "wrap each test in a transaction, then abort it" pattern for
 * database-touching tests that need real Postgres semantics
 * (constraints, defaults, generated columns) without leaving any data
 * behind or needing a manual cleanup/reset step between tests.
 *
 * Implementation note: Prisma has no public "abort this transaction"
 * API, so this deliberately throws a sentinel error to force a
 * rollback, catches only that exact sentinel afterward, and rethrows
 * anything else unchanged (so a real assertion failure inside `work`
 * still fails the test normally).
 */
class RollbackSentinel extends Error {
  constructor(public readonly result: unknown) {
    super('__coachx_test_rollback__');
  }
}

export async function withRollback<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
  const client = getPrismaClient();
  if (!client) {
    throw new Error('withRollback() requires a connected database client (see connectDatabase())');
  }

  try {
    await client.$transaction(async (tx) => {
      const result = await work(tx);
      throw new RollbackSentinel(result);
    });
    // Unreachable: the transaction above always either throws
    // RollbackSentinel (caught below) or a real error (rethrown below).
    throw new Error('withRollback(): transaction completed without rolling back');
  } catch (error) {
    if (error instanceof RollbackSentinel) {
      return error.result as T;
    }
    throw error;
  }
}

/**
 * Returns true only if a real database connection is currently
 * available — used to skip (and clearly report, never silently pass)
 * integration tests when no reachable Postgres exists in the current
 * environment.
 */
export function isTestDatabaseAvailable(): boolean {
  return getPrismaClient() !== null;
}
