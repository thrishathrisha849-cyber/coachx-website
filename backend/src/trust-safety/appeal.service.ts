import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { updateUser } from '../auth/auth.repository';
import { createAppeal, findCaseById, findAppealForCase, findAppealById, resolveAppeal } from './case.repository';

/**
 * 001 FR-092: an appeal is a distinct case linked to the originating
 * moderation action (US7 acceptance scenario 3) — only filable against a
 * case that has actually had an action taken (a dismissed or still-open
 * report has nothing to appeal).
 */
export async function submitAppeal(caseId: string, submittedBy: string, statement: string) {
  const trustSafetyCase = await findCaseById(caseId);
  if (!trustSafetyCase) throw AppError.notFound('Case not found');
  if (trustSafetyCase.status !== 'ACTION_TAKEN') {
    throw AppError.badRequest('Only an actioned case can be appealed');
  }
  if (trustSafetyCase.reportedUserId !== submittedBy) {
    throw AppError.forbidden('permission denied');
  }

  const existing = await findAppealForCase(caseId);
  if (existing && existing.status === 'PENDING') {
    throw AppError.conflict('An appeal for this case is already pending review');
  }

  const appeal = await createAppeal({
    case: { connect: { id: caseId } },
    submittedBy,
    statement,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: submittedBy,
    action: 'trust_safety.appeal_submitted',
    resourceType: 'appeal',
    resourceId: appeal.id,
  });

  return appeal;
}

export async function resolveAppealDecision(
  appealId: string,
  resolverId: string,
  decision: 'UPHELD' | 'OVERTURNED',
  resolutionNote: string | undefined,
) {
  const appeal = await findAppealById(appealId);
  if (!appeal) throw AppError.notFound('Appeal not found');
  if (appeal.status !== 'PENDING') throw AppError.badRequest('This appeal has already been resolved');

  const updated = await resolveAppeal(appealId, decision, resolverId, resolutionNote);

  // OVERTURNED reverses the moderation action's account-status effect —
  // an appeal that succeeds must actually restore access, not just
  // change a label nobody enforces.
  if (decision === 'OVERTURNED' && appeal.case.reportedUserId) {
    await updateUser(appeal.case.reportedUserId, { status: 'ACTIVE', lockedUntil: null });
  }

  await recordAuditEvent({
    actorType: 'USER',
    actorId: resolverId,
    action: 'trust_safety.appeal_resolved',
    resourceType: 'appeal',
    resourceId: appealId,
    afterState: { decision },
  });

  return updated;
}
