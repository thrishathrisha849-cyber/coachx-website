import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import {
  findMilestone,
  claimMilestone,
  findMilestoneById,
  listMilestonesForReview,
  verifyMilestone,
  rejectMilestone,
} from './lifecycle.repository';
import { evaluateAndAdvanceStage } from './stage-transition.service';

export const MILESTONE_TYPES = [
  'FIRST_CLIENT',
  'FIRST_1000',
  'FIRST_10000',
  'FIRST_1_LAKH',
  'FIRST_COURSE_LAUNCH',
  'FIRST_100_COMMUNITY_MEMBERS',
] as const;

/**
 * 001 FR-045, Constitution Article VIII: a user CLAIMS a milestone; it is
 * never auto-marked Achiever from the claim alone — `milestone.verify`
 * (platform_admin/super_admin) must explicitly verify it (edge case in
 * spec.md: "an unverified claim of 'first client' ... not marked
 * verified until a defined verification step occurs").
 */
export async function claimBusinessMilestone(userId: string, type: string, evidence: unknown) {
  const existing = await findMilestone(userId, type);
  if (existing) throw AppError.conflict('This milestone has already been claimed');

  const milestone = await claimMilestone(userId, type, evidence as never);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'lifecycle.milestone_claimed',
    resourceType: 'business_milestone',
    resourceId: milestone.id,
    afterState: { type },
  });

  return milestone;
}

export async function listClaimedMilestonesForReview(page: number, pageSize: number) {
  const [rows, total] = await listMilestonesForReview({ skip: (page - 1) * pageSize, take: pageSize });
  return { rows, total, page, pageSize };
}

export async function verifyBusinessMilestone(milestoneId: string, verifierId: string) {
  const milestone = await findMilestoneById(milestoneId);
  if (!milestone) throw AppError.notFound('Milestone not found');
  if (milestone.status !== 'CLAIMED') throw AppError.badRequest('Milestone is not pending review');

  const updated = await verifyMilestone(milestoneId, verifierId);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: verifierId,
    action: 'lifecycle.milestone_verified',
    resourceType: 'business_milestone',
    resourceId: milestoneId,
    afterState: { type: milestone.type, userId: milestone.userId },
  });

  // FR-045/US6 acceptance scenario 3-adjacent: a verified milestone can
  // move the user into the Achiever stage — re-evaluate immediately.
  await evaluateAndAdvanceStage(milestone.userId);

  return updated;
}

export async function rejectBusinessMilestone(milestoneId: string, verifierId: string, reason: string) {
  const milestone = await findMilestoneById(milestoneId);
  if (!milestone) throw AppError.notFound('Milestone not found');
  if (milestone.status !== 'CLAIMED') throw AppError.badRequest('Milestone is not pending review');

  const updated = await rejectMilestone(milestoneId, verifierId, reason);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: verifierId,
    action: 'lifecycle.milestone_rejected',
    resourceType: 'business_milestone',
    resourceId: milestoneId,
    afterState: { type: milestone.type, userId: milestone.userId, reason },
  });

  return updated;
}
