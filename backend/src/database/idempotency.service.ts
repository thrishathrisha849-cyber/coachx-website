import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient } from './prisma-client';
import { AppError } from '../utils/app-error';
import { normalizeDatabaseError } from './db-error';
import type { TransactionClient } from './transaction';

/**
 * Generic idempotency-key mechanism backing the shared `IdempotencyKey`
 * table (see `database/prisma/schema.prisma` and
 * `docs/database/TRANSACTIONS_AND_OUTBOX.md`). Implements the pattern
 * Constitution Article I names directly ("...only finalized after
 * backend verification (signed webhook, idempotency-key check, or
 * explicit rule evaluation)") and that 006-gamification-rewards FR-014
 * requires by name for point awards.
 *
 * This module has zero knowledge of what any given `scope` actually
 * does — it only guarantees "the same (scope, key) pair is never
 * processed twice," which is exactly the boundary a shared technical
 * utility should have.
 */

export function hashRequestPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export type IdempotencyOutcome<T> =
  | { status: 'new'; complete: (response: T) => Promise<void>; fail: () => Promise<void> }
  | { status: 'replayed'; response: T | null }
  | { status: 'in-progress' };

/**
 * Begins (or resumes) an idempotent operation identified by
 * `(scope, key)`.
 *
 * - If this is the first time this key has been seen in this scope, a
 *   PENDING row is created and the caller receives `{ status: 'new' }`
 *   along with `complete()`/`fail()` callbacks to finalize it.
 * - If the key was already COMPLETED, the caller receives
 *   `{ status: 'replayed', response }` with the originally cached
 *   response — the caller should return this instead of redoing the
 *   operation.
 * - If the key exists but is still PENDING (a concurrent, in-flight
 *   request with the same key), the caller receives
 *   `{ status: 'in-progress' }` and should respond accordingly (e.g.
 *   HTTP 409) rather than racing the original request.
 *
 * If `requestPayload` is supplied and a stored `requestHash` exists
 * that does NOT match, this throws `AppError.conflict()` — the classic
 * "same idempotency key reused for a materially different request"
 * misuse case, which must never silently return the wrong cached
 * response.
 */
export async function beginIdempotentOperation<T>(
  scope: string,
  key: string,
  requestPayload?: unknown,
): Promise<IdempotencyOutcome<T>> {
  const db = getPrismaClient();
  if (!db) {
    throw AppError.internal('Database is not connected');
  }

  const requestHash = requestPayload !== undefined ? hashRequestPayload(requestPayload) : undefined;

  try {
    const existing = await db.idempotencyKey.findUnique({ where: { scope_key: { scope, key } } });

    if (existing) {
      if (requestHash && existing.requestHash && existing.requestHash !== requestHash) {
        throw AppError.conflict(
          'This idempotency key was already used for a different request',
          { scope, key },
        );
      }

      if (existing.status === 'COMPLETED') {
        return { status: 'replayed', response: (existing.responseSnapshot as T) ?? null };
      }

      // PENDING or FAILED-and-not-yet-retried: treat as in-progress so
      // the caller doesn't double-execute a concurrently-running
      // operation. A FAILED key can be re-claimed by calling this
      // function again after the caller's own retry/backoff policy —
      // this module does not decide that policy.
      return { status: 'in-progress' };
    }

    await db.idempotencyKey.create({
      data: { scope, key, requestHash, status: 'PENDING' },
    });

    return {
      status: 'new',
      complete: (response: T) => completeIdempotentOperation(scope, key, response),
      fail: () => failIdempotentOperation(scope, key),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw normalizeDatabaseError(error);
  }
}

async function completeIdempotentOperation<T>(
  scope: string,
  key: string,
  response: T,
  tx?: TransactionClient,
): Promise<void> {
  const db = tx ?? getPrismaClient();
  if (!db) throw AppError.internal('Database is not connected');

  await db.idempotencyKey.update({
    where: { scope_key: { scope, key } },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      responseSnapshot: response as Prisma.InputJsonValue,
    },
  });
}

async function failIdempotentOperation(scope: string, key: string): Promise<void> {
  const db = getPrismaClient();
  if (!db) return;

  await db.idempotencyKey.update({
    where: { scope_key: { scope, key } },
    data: { status: 'FAILED', completedAt: new Date() },
  });
}
