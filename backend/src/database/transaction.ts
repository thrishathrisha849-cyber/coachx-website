import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prisma-client';
import { normalizeDatabaseError } from './db-error';
import { withRetry } from './retry';
import { AppError } from '../utils/app-error';

export type TransactionClient = Prisma.TransactionClient;

export interface WithTransactionOptions {
  /** Forwarded to Prisma's own `$transaction` options. */
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
  /** Retry a transaction that fails with a retryable error (default: true). */
  retry?: boolean;
}

/**
 * Runs `work` inside a single database transaction, normalizing any
 * failure through `normalizeDatabaseError` (so callers always receive
 * an `AppError`, never a raw Prisma error) and — unless explicitly
 * disabled — retrying the whole transaction with backoff if it fails
 * with a transient, retryable error (write conflict, deadlock,
 * connection-pool timeout; see `retry.ts`).
 *
 * This is the ONLY sanctioned way to open a multi-statement transaction
 * in this codebase — future feature services should call
 * `withTransaction(...)` rather than `prisma.$transaction(...)`
 * directly, so retry/error-normalization behavior stays consistent
 * platform-wide.
 */
export async function withTransaction<T>(
  work: (tx: TransactionClient) => Promise<T>,
  options: WithTransactionOptions = {},
): Promise<T> {
  const client = getPrismaClient();

  if (!client) {
    throw AppError.internal('Database is not connected');
  }

  const { retry = true, ...prismaOptions } = options;
  const run = () => (client as PrismaClient).$transaction(work, prismaOptions);

  try {
    return retry ? await withRetry(run) : await run();
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}
