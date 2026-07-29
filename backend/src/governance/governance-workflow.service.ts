import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import {
  findGovernanceRecordByFeature,
  findGovernanceRecordById,
  listGovernanceRecords,
  createGovernanceRecord,
  updateGovernanceRecord,
} from './governance.repository';
import { evaluatePhaseGate } from '../platform-registry/phase-gate.service';
import type { ProductPhaseCode } from '../platform-registry/platform-module.constants';

/**
 * 001 FR-083, US8: every major feature release passes through this fixed
 * 10-stage sequence, in order — no stage may be skipped.
 */
const STAGE_ORDER = [
  'REQUIREMENT_APPROVAL',
  'UX_REVIEW',
  'TECHNICAL_REVIEW',
  'SECURITY_REVIEW',
  'DEVELOPMENT',
  'QA',
  'UAT',
  'RELEASE_APPROVAL',
  'MONITORING',
  'POST_RELEASE_REVIEW',
] as const;

type Stage = (typeof STAGE_ORDER)[number];

export async function startGovernanceRecord(featureName: string, phase: ProductPhaseCode, actorId: string) {
  const existing = await findGovernanceRecordByFeature(featureName);
  if (existing) throw AppError.conflict('A governance record for this feature already exists');

  const record = await createGovernanceRecord({
    featureName,
    phase,
    createdBy: actorId,
    stageHistory: [{ stage: 'REQUIREMENT_APPROVAL', enteredAt: new Date().toISOString(), actorId }],
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'governance.record_started',
    resourceType: 'governance_record',
    resourceId: record.id,
    afterState: { featureName, phase },
  });

  return record;
}

export async function listGovernance(page: number, pageSize: number) {
  const [rows, total] = await listGovernanceRecords({ skip: (page - 1) * pageSize, take: pageSize });
  return { rows, total, page, pageSize };
}

/**
 * US8 acceptance scenario 2: "a major feature has completed development,
 * it has not yet passed security review, it cannot proceed to release
 * approval" — enforced here by only allowing the NEXT stage in
 * STAGE_ORDER, never a skip-ahead. Advancing INTO RELEASE_APPROVAL
 * additionally re-checks the Product Phase gate (US8 acceptance
 * scenario 1) — a feature cannot reach release approval while its
 * own phase's prerequisite phase is incomplete.
 */
export async function advanceGovernanceStage(recordId: string, actorId: string) {
  const record = await findGovernanceRecordById(recordId);
  if (!record) throw AppError.notFound('Governance record not found');

  const currentIndex = STAGE_ORDER.indexOf(record.currentStage as Stage);
  if (currentIndex === STAGE_ORDER.length - 1) {
    throw AppError.badRequest('This feature has already completed the governance sequence');
  }

  const nextStage = STAGE_ORDER[currentIndex + 1];

  if (nextStage === 'RELEASE_APPROVAL') {
    const gate = await evaluatePhaseGate(record.phase as ProductPhaseCode);
    if (!gate.allowed) {
      throw AppError.forbidden(
        `Release is blocked: phase ${gate.blockedByPhase} is not yet complete (001 FR-078–FR-082)`,
      );
    }
  }

  const history = Array.isArray(record.stageHistory) ? record.stageHistory : [];
  const updated = await updateGovernanceRecord(recordId, {
    currentStage: nextStage,
    stageHistory: [...history, { stage: nextStage, enteredAt: new Date().toISOString(), actorId }],
    ...(nextStage === 'MONITORING' ? { monitoringStartedAt: new Date() } : {}),
    ...(nextStage === 'POST_RELEASE_REVIEW' ? { postReleaseReviewAt: new Date() } : {}),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'governance.stage_advanced',
    resourceType: 'governance_record',
    resourceId: recordId,
    beforeState: { stage: record.currentStage },
    afterState: { stage: nextStage },
  });

  return updated;
}
