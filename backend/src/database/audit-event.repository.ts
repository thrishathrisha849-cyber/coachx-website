import { Prisma } from '@prisma/client';
import { getPrismaClient } from './prisma-client';
import { redact } from '../utils/redact';
import { logger } from '../utils/logger';
import type { TransactionClient } from './transaction';

/**
 * Read/write interface for the shared `AuditEvent` table (see
 * `database/prisma/schema.prisma` and
 * `docs/database/AUDITABILITY.md`). This is infrastructure, not a
 * business repository — it has no opinion on what "action" strings a
 * future feature chooses to record, only on how the record is safely
 * written (always redacted, always append-only).
 */

export interface RecordAuditEventInput {
  actorType?: 'USER' | 'SYSTEM' | 'SERVICE' | 'UNKNOWN';
  actorId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  correlationId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
  metadata?: unknown;
}

/**
 * Writes one immutable audit record. Every `*State`/`metadata` field is
 * redacted (see `utils/redact.ts`) before persistence — callers do not
 * need to scrub sensitive fields themselves, the same guarantee the
 * Phase 2 logger already provides for log lines.
 *
 * Accepts an optional transaction client so a caller can record an
 * audit event in the SAME transaction as the state change it documents
 * (the correct pattern — an audit record for a change that itself got
 * rolled back should never persist).
 *
 * Silently no-ops (with a warning log, never a thrown error) if the
 * database isn't connected — an audit-logging failure must never be
 * the reason a legitimate request fails, though every call site should
 * still monitor for these warnings in production.
 */
export async function recordAuditEvent(
  input: RecordAuditEventInput,
  tx?: TransactionClient,
): Promise<void> {
  const db = tx ?? getPrismaClient();

  if (!db) {
    logger.warn('Audit event dropped — database not connected', { action: input.action });
    return;
  }

  const data: Prisma.AuditEventCreateInput = {
    actorType: input.actorType ?? 'UNKNOWN',
    actorId: input.actorId ?? null,
    action: input.action,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    correlationId: input.correlationId ?? null,
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    beforeState: toJsonInput(redact(input.beforeState)),
    afterState: toJsonInput(redact(input.afterState)),
    reason: input.reason ?? null,
    metadata: toJsonInput(redact(input.metadata)),
  };

  await db.auditEvent.create({ data });
}

export interface FindAuditEventsFilter {
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  correlationId?: string;
}

/**
 * Read path for the audit trail — intentionally simple (no pagination
 * baked in here; compose with `pagination.ts`'s `paginate()` at the
 * call site once a real consumer exists, per this phase's "no business
 * repositories" scope).
 */
export async function findAuditEvents(filter: FindAuditEventsFilter, limit = 50) {
  const db = getPrismaClient();
  if (!db) return [];

  return db.auditEvent.findMany({
    where: {
      actorId: filter.actorId,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      correlationId: filter.correlationId,
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  });
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}
