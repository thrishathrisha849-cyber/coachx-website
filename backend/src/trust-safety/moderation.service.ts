import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { updateUser } from '../auth/auth.repository';
import { listQueuedCases, findCaseById, updateCase } from './case.repository';

export async function listModerationQueue(page: number, pageSize: number) {
  const [rows, total] = await listQueuedCases({ skip: (page - 1) * pageSize, take: pageSize });
  return { rows, total, page, pageSize };
}

export interface ActionCaseInput {
  caseId: string;
  actionType: 'WARNING' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_BAN';
  actionReason: string;
  suspensionDurationMin?: number;
  moderatorId: string;
}

/**
 * 001 FR-091/FR-092: escalates a queued case to a warning, temporary
 * suspension, or permanent ban, with evidence and history retained.
 * Suspension/ban are not just labels — they immediately update the
 * reported User's `status` (the SAME field `login.service.ts` already
 * checks), so the action takes real, server-authoritative effect rather
 * than being a moderation-log entry with no actual enforcement.
 */
export async function actionCase(input: ActionCaseInput) {
  const trustSafetyCase = await findCaseById(input.caseId);
  if (!trustSafetyCase) throw AppError.notFound('Case not found');
  if (trustSafetyCase.status === 'ACTION_TAKEN' || trustSafetyCase.status === 'DISMISSED') {
    throw AppError.badRequest('This case has already been resolved');
  }

  const updated = await updateCase(input.caseId, {
    status: 'ACTION_TAKEN',
    actionType: input.actionType,
    actionReason: input.actionReason,
    actionedBy: input.moderatorId,
    actionedAt: new Date(),
  });

  if (trustSafetyCase.reportedUserId && input.actionType !== 'WARNING') {
    if (input.actionType === 'TEMPORARY_SUSPENSION') {
      await updateUser(trustSafetyCase.reportedUserId, {
        status: 'SUSPENDED',
        lockedUntil: input.suspensionDurationMin
          ? new Date(Date.now() + input.suspensionDurationMin * 60 * 1000)
          : null,
      });
    } else {
      // PERMANENT_BAN — closest existing AccountStatus (no separate
      // "BANNED" state exists on User; DEACTIVATED is the permanent,
      // login-blocking terminal state login.service.ts already enforces).
      await updateUser(trustSafetyCase.reportedUserId, { status: 'DEACTIVATED' });
    }
  }

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.moderatorId,
    action: 'trust_safety.case_actioned',
    resourceType: 'trust_safety_case',
    resourceId: input.caseId,
    beforeState: { status: trustSafetyCase.status },
    afterState: { status: 'ACTION_TAKEN', actionType: input.actionType },
  });

  return updated;
}

export async function dismissCase(caseId: string, moderatorId: string, reason: string) {
  const trustSafetyCase = await findCaseById(caseId);
  if (!trustSafetyCase) throw AppError.notFound('Case not found');
  if (trustSafetyCase.status === 'ACTION_TAKEN' || trustSafetyCase.status === 'DISMISSED') {
    throw AppError.badRequest('This case has already been resolved');
  }

  // FR-092 edge case: a dismissed report's evidence/history is retained,
  // never deleted — `updateCase` sets status only, the row itself persists.
  const updated = await updateCase(caseId, {
    status: 'DISMISSED',
    actionReason: reason,
    actionedBy: moderatorId,
    actionedAt: new Date(),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: moderatorId,
    action: 'trust_safety.case_dismissed',
    resourceType: 'trust_safety_case',
    resourceId: caseId,
  });

  return updated;
}
