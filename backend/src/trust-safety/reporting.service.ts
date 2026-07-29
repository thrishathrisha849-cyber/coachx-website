import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { createCase } from './case.repository';

export interface FileCaseInput {
  type: 'REPORT' | 'BLOCK' | 'MUTE';
  targetType: 'POST' | 'COMMENT' | 'PROFILE' | 'USER';
  targetId?: string;
  reportedUserId?: string;
  reason: string;
  evidence?: unknown;
  reporterId: string;
}

/**
 * 001 FR-090: report-post/report-comment/report-profile/block-user/
 * mute-user — available to EVERY user, no special permission required.
 * Evidence is retained verbatim (FR-092) — never discarded even if a
 * moderator later dismisses the case (edge case: "report resolution and
 * evidence MUST still be retained").
 */
export async function fileTrustSafetyCase(input: FileCaseInput) {
  if (!input.targetId && !input.reportedUserId) {
    throw AppError.badRequest('A report/block/mute must reference a target');
  }

  const trustSafetyCase = await createCase({
    type: input.type,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    evidence: input.evidence as never,
    reporter: { connect: { id: input.reporterId } },
    ...(input.reportedUserId ? { reportedUser: { connect: { id: input.reportedUserId } } } : {}),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.reporterId,
    action: `trust_safety.${input.type.toLowerCase()}_filed`,
    resourceType: 'trust_safety_case',
    resourceId: trustSafetyCase.id,
    afterState: { targetType: input.targetType, targetId: input.targetId, reportedUserId: input.reportedUserId },
  });

  return trustSafetyCase;
}
