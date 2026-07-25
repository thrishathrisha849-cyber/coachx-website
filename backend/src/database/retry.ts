import { Prisma } from '@prisma/client';

/**
 * Classifies whether a database error is safe to retry.
 *
 * Retryable: transient conditions where the operation itself was valid
 * and simply didn't complete — connection drops, timeouts, and
 * Postgres's own serialization/deadlock errors under concurrent
 * transactions (wrapped by Prisma as P2034).
 *
 * NOT retryable: anything that reflects the request itself being wrong
 * (unique/foreign-key/validation errors) — retrying an invalid request
 * unchanged will only ever fail the same way again.
 */
export function isRetryableDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: transaction failed due to a write conflict or deadlock —
    // Prisma's own documented "safe to retry" code.
    // P2024: timed out fetching a connection from the pool.
    return error.code === 'P2034' || error.code === 'P2024';
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    // Could not reach the database at all — worth a bounded retry.
    return true;
  }

  return false;
}

export interface WithRetryOptions {
  /** Maximum number of attempts, including the first — default 3. */
  maxAttempts?: number;
  /** Base delay in ms between attempts, doubled each retry — default 50ms. */
  baseDelayMs?: number;
}

/**
 * Runs `operation`, retrying with exponential backoff only when
 * `isRetryableDatabaseError` classifies the failure as safe to retry.
 * Any non-retryable error is rethrown immediately on the first attempt.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: WithRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 50;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isRetryableDatabaseError(error)) {
        throw error;
      }

      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delayMs);
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps
  // TypeScript satisfied that every path returns/throws explicitly.
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
