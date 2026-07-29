import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { PLATFORM_MODULES, PRODUCT_PHASE_ORDER, MVP_EXCLUDED_CAPABILITIES, type ProductPhaseCode } from './platform-module.constants';

const RELEASED_STAGES = ['RELEASE_APPROVAL', 'MONITORING', 'POST_RELEASE_REVIEW'];

/**
 * 001 FR-078–FR-082, US8: a Phase N+1 module release is blocked until
 * every Phase N module has passed release approval in its
 * GovernanceRecord (FR-083's own 10-stage sequence — reusing that same
 * record rather than a parallel "phase completion" flag). Fail-closed:
 * a phase with no GovernanceRecord for one of its modules yet is NOT
 * complete.
 */
export async function isPhaseComplete(phase: ProductPhaseCode): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const modulesInPhase = PLATFORM_MODULES.filter((m) => m.phase === phase);
  if (modulesInPhase.length === 0) return true;

  const records = await prisma.governanceRecord.findMany({
    where: { phase, featureName: { in: modulesInPhase.map((m) => m.code) } },
  });

  const releasedCodes = new Set(records.filter((r) => RELEASED_STAGES.includes(r.currentStage)).map((r) => r.featureName));
  return modulesInPhase.every((m) => releasedCodes.has(m.code));
}

export interface PhaseGateResult {
  requestedPhase: ProductPhaseCode;
  allowed: boolean;
  blockedByPhase: ProductPhaseCode | null;
}

/**
 * US8 acceptance scenario 1: "Phase 1 modules are not fully complete, a
 * team attempts to release a Phase 2 module, release is blocked pending
 * Phase 1 completion." Checks every phase strictly BEFORE the requested
 * one, in order — the first incomplete prior phase is the blocker.
 */
export async function evaluatePhaseGate(requestedPhase: ProductPhaseCode): Promise<PhaseGateResult> {
  const requestedIndex = PRODUCT_PHASE_ORDER.indexOf(requestedPhase);

  for (let i = 0; i < requestedIndex; i++) {
    const priorPhase = PRODUCT_PHASE_ORDER[i];
    const complete = await isPhaseComplete(priorPhase);
    if (!complete) {
      return { requestedPhase, allowed: false, blockedByPhase: priorPhase };
    }
  }

  return { requestedPhase, allowed: true, blockedByPhase: null };
}

/** FR-082: flags a proposed capability against the documented MVP-exclusion boundary. */
export function checkMvpScopeExclusion(capabilityCode: string): { excluded: boolean; note: string | null } {
  const excluded = MVP_EXCLUDED_CAPABILITIES.includes(capabilityCode);
  return {
    excluded,
    note: excluded
      ? 'This capability is explicitly excluded from MVP scope (001 FR-082) — treated as an unsupported/future-roadmap item, not silently built.'
      : null,
  };
}
