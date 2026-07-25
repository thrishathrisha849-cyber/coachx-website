import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Database connectivity foundation.
 *
 * UPDATE (Phase 3): `database/prisma/schema.prisma` now defines two
 * justified shared technical models (`AuditEvent`, `IdempotencyKey` —
 * see `docs/database/SCHEMA_OWNERSHIP.md`), so `@prisma/client` is a
 * real, usable generated client, not the Phase 1/2 "zero models" stub.
 * `connectDatabase()`'s lazy-construction and non-fatal-failure design
 * is kept regardless — a database that is unreachable at boot (wrong
 * credentials, Postgres not started yet, network blip) should still
 * never crash the whole API process; `/api/v1/ready` is what reports
 * the real state to callers/orchestrators.
 *
 * `docs/database/` (Phase 3) is the source of truth for how this client
 * is expected to be used going forward: `getPrismaClient()` below is
 * the single accessor every other database utility
 * (`transaction.ts`, `audit-event.repository.ts`, `idempotency.service.ts`,
 * etc.) reads from — none of them construct their own `PrismaClient`.
 */

let client: PrismaClient | null = null;
let lastConnectionError: string | null = null;

function isDatabaseConfigured(): boolean {
  return Boolean(config.database.url);
}

/**
 * Attempts to construct and connect the Prisma client. Safe to call
 * even when no models are defined yet or `DATABASE_URL` is unset —
 * failures are logged and recorded, never thrown, so this can always be
 * called unconditionally during server startup.
 */
export async function connectDatabase(): Promise<void> {
  if (!isDatabaseConfigured()) {
    lastConnectionError = 'DATABASE_URL is not configured';
    logger.warn('Database not configured — skipping connection (DATABASE_URL unset)');
    return;
  }

  try {
    client = new PrismaClient();
    await client.$connect();
    lastConnectionError = null;
    logger.info('Database connection established');
  } catch (error) {
    client = null;
    lastConnectionError =
      error instanceof Error ? error.message : 'Unknown database connection error';
    logger.warn('Database connection unavailable — continuing without it', {
      reason: lastConnectionError,
    });
  }
}

/**
 * Gracefully closes the database connection, if one is open. Safe to
 * call even if `connectDatabase()` never succeeded.
 */
export async function disconnectDatabase(): Promise<void> {
  if (!client) return;

  try {
    await client.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error while disconnecting from the database', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    client = null;
  }
}

export interface DatabaseHealth {
  configured: boolean;
  connected: boolean;
  message?: string;
}

/**
 * Non-throwing database health probe used by the `/api/v1/ready`
 * endpoint. Never surfaces a stack trace or the connection string —
 * only a safe boolean/message summary.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isDatabaseConfigured()) {
    return { configured: false, connected: false, message: 'DATABASE_URL not configured' };
  }

  if (!client) {
    return {
      configured: true,
      connected: false,
      message: lastConnectionError ?? 'Database client not initialized',
    };
  }

  try {
    await client.$queryRaw`SELECT 1`;
    return { configured: true, connected: true };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      message: error instanceof Error ? error.message : 'Database query failed',
    };
  }
}

/**
 * The single accessor for the live Prisma client. Returns `null` if the
 * database isn't configured or the connection hasn't been established —
 * every caller (transaction wrapper, repositories) MUST handle the
 * `null` case explicitly (typically via `AppError.internal()` or a
 * feature-specific fallback) rather than assuming a client always
 * exists, consistent with this module's "database is optional at
 * startup" design.
 */
export function getPrismaClient(): PrismaClient | null {
  return client;
}

/**
 * Test-only escape hatch: resets module-level state between test cases
 * that exercise different connection scenarios. Not used by application
 * code.
 */
export function __resetForTests(): void {
  client = null;
  lastConnectionError = null;
}

/**
 * Test-only escape hatch: lets a test inject a client directly (e.g. a
 * real client pointed at a disposable test schema, or a mock) without
 * going through the full `connectDatabase()` network path. Not used by
 * application code.
 */
export function __setClientForTests(testClient: PrismaClient | null): void {
  client = testClient;
}
