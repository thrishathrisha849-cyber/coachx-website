import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Database connectivity foundation (Phase 2).
 *
 * IMPORTANT — documented, expected limitation (not a bug):
 * `database/prisma/schema.prisma` currently defines a datasource and
 * generator only, with zero models, by explicit Phase 1/Phase 2 design
 * ("do not create feature-specific models"). Prisma requires at least
 * one model to generate a real client — see `database/prisma/schema.prisma`
 * and `docs/SETUP_GUIDE.md` §3.4 for the full explanation. Until the
 * first feature adds its models, `@prisma/client`'s generated output is
 * an unusable stub whose constructor throws
 * `"@prisma/client did not initialize yet"` immediately when
 * instantiated — *importing* the module is safe (confirmed: the stub's
 * throw happens inside the `PrismaClient` constructor, not at module
 * load), which is what makes a statically-typed import here safe.
 *
 * To keep the rest of the backend fully functional in this interim
 * state, this module:
 *   - never instantiates `PrismaClient` at module load time (only
 *     lazily, inside `connectDatabase()`);
 *   - treats any failure (including the stub error) as a handled,
 *     logged, non-fatal condition — the backend starts and serves
 *     traffic normally with the database reporting "not connected" on
 *     `/api/v1/ready` until this resolves itself the moment the first
 *     model is added and `prisma generate` succeeds.
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
 * Test-only escape hatch: resets module-level state between test cases
 * that exercise different connection scenarios. Not used by application
 * code.
 */
export function __resetForTests(): void {
  client = null;
  lastConnectionError = null;
}
