import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { createCase, updateCase, findCaseById, resolveAppeal, findAppealById } from '../trust-safety/case.repository';
import { dismissCase } from '../trust-safety/moderation.service';
import { revokeCertificate } from './certificate-verification.service';
import { findCertificateByEnrollment } from './certificate.repository';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import {
  resolveAcademicIntegrityTarget,
  findActiveAcademicIntegrityCasesForUser,
  findAcademicIntegrityCasesForUser,
  findAcademicIntegrityCasesAdmin,
} from './academic-integrity.repository';
import { toAdminAcademicIntegrityCase } from './academic-integrity.serializers';
import { ACADEMIC_INTEGRITY_CASE_TYPES } from './academic-integrity.types';
import type {
  AcademicIntegrityCaseType,
  AcademicIntegrityTargetType,
  AcademicIntegrityInvestigationOutcome,
  AdminAcademicIntegrityCase,
} from './academic-integrity.types';

/**
 * 004 Academic-integrity investigation batch (T120, FR-116). Reuses 001's
 * generic `TrustSafetyCase`/`Appeal` case+appeal state machine (OPEN ->
 * UNDER_REVIEW -> ACTION_TAKEN/DISMISSED, PENDING -> UPHELD/OVERTURNED)
 * rather than building a parallel LMS-only entity — the states FR-116
 * needs (review flag -> investigation workflow -> appeal process) are
 * EXACTLY what that state machine already models. Only the 6 named
 * academic-integrity `TrustSafetyCaseType` values and 3 new LMS
 * `TrustSafetyTargetType` values (SUBMISSION/QUIZ_ATTEMPT/CERTIFICATE) are
 * new (schema.prisma).
 *
 * NOT built (deliberately, honestly out of scope): similarity-detection
 * VENDOR integration — `plan.md`'s own Phase 0 research still lists this
 * as an unresolved "MUST resolve" item; flagging here is a manual admin/
 * instructor action, not automated. `FR-116`'s "originality declaration"
 * is `Submission.declaredOriginal` (see that field's own doc comment).
 *
 * KNOWN GAP, documented rather than silently glossed over: if a
 * certificate was ALREADY issued at flag time, `flagForInvestigation`
 * auto-revokes it (reusing the existing, already-built `revokeCertificate`
 * — Historical Immutability means a revoked certificate row is never
 * un-revoked). If the case is later CLEARED or a confirmed case's appeal
 * is OVERTURNED, there is currently NO reissuance path: `certificate.
 * service.ts`'s `generateCertificateForEnrollment` returns the EXISTING
 * (still-revoked) row for an enrollment rather than minting a fresh one.
 * Building a real reinstatement/reissuance mechanism is a separate,
 * future effort — this batch only guarantees the HOLD/HOLD-REMOVAL
 * correctness for a certificate not yet issued, which is the acceptance
 * scenario FR-116/US9 actually names ("any pending certificate issuance
 * is held").
 */

function assertAcademicIntegrityType(type: string): asserts type is AcademicIntegrityCaseType {
  if (!(ACADEMIC_INTEGRITY_CASE_TYPES as readonly string[]).includes(type)) {
    throw AppError.badRequest(`"${type}" is not an academic-integrity case type`);
  }
}

function assertIsAcademicIntegrityCase(row: { type: string }): void {
  if (!(ACADEMIC_INTEGRITY_CASE_TYPES as readonly string[]).includes(row.type)) {
    throw AppError.notFound('Case not found');
  }
}

export interface FlagForInvestigationInput {
  type: AcademicIntegrityCaseType;
  targetType: AcademicIntegrityTargetType;
  targetId: string;
  reason: string;
  evidence?: unknown;
  reporterId: string;
}

/**
 * FR-116/US9 acceptance scenario 4: "When the flag is raised, Then the
 * submission enters an investigation workflow, any pending certificate
 * issuance is held, and the learner retains an appeal path." The
 * investigation-workflow/appeal-path halves are satisfied by creating an
 * OPEN `TrustSafetyCase` (the SAME case any future
 * `evaluateCertificateEligibility` check or appeal submission reads); the
 * "certificate hold" half is satisfied two ways depending on timing —
 * BEFORE issuance, `hasActiveAcademicIntegrityHold` below blocks a new
 * certificate from ever being generated; if a certificate already exists
 * (the edge case explicitly named in spec.md: "must be able to enter a
 * hold/investigation state even post-issuance"), it is immediately revoked.
 */
export async function flagForInvestigation(input: FlagForInvestigationInput): Promise<AdminAcademicIntegrityCase> {
  assertAcademicIntegrityType(input.type);

  return withTransaction(async (tx) => {
    const { userId, courseId } = await resolveAcademicIntegrityTarget(input.targetType, input.targetId, tx);

    const trustSafetyCase = await createCase(
      {
        type: input.type as never,
        targetType: input.targetType as never,
        targetId: input.targetId,
        reason: input.reason,
        evidence: input.evidence as never,
        reporter: { connect: { id: input.reporterId } },
        reportedUser: { connect: { id: userId } },
      },
      tx,
    );

    let revokedExistingCertificate = false;
    if (courseId) {
      const enrollment = await findEnrollmentForUserAndCourse(userId, courseId, tx);
      if (enrollment) {
        const existingCertificate = await findCertificateByEnrollment(enrollment.id, tx);
        if (existingCertificate && existingCertificate.status === 'VALID') {
          await revokeCertificate(existingCertificate.id, `Academic integrity investigation opened (case ${trustSafetyCase.id})`, input.reporterId, tx);
          revokedExistingCertificate = true;
        }
      }
    }

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: input.reporterId,
        action: 'lms.academic_integrity.flagged',
        resourceType: 'trust_safety_case',
        resourceId: trustSafetyCase.id,
        afterState: { type: input.type, targetType: input.targetType, targetId: input.targetId, reportedUserId: userId, revokedExistingCertificate },
      },
      tx,
    );

    return toAdminAcademicIntegrityCase(trustSafetyCase);
  });
}

/**
 * CONFIRMED locks the case at ACTION_TAKEN (permanently blocking future
 * certificate eligibility for this target's course, unless later
 * overturned on appeal). CLEARED reuses the existing, already-generic
 * `dismissCase` as-is — it has no community-moderation-specific side
 * effects to avoid reusing.
 */
export async function resolveInvestigation(
  caseId: string,
  outcome: AcademicIntegrityInvestigationOutcome,
  moderatorId: string,
  reason: string,
): Promise<AdminAcademicIntegrityCase> {
  const trustSafetyCase = await findCaseById(caseId);
  if (!trustSafetyCase) throw AppError.notFound('Case not found');
  assertIsAcademicIntegrityCase(trustSafetyCase);

  if (outcome === 'CLEARED') {
    const updated = await dismissCase(caseId, moderatorId, reason);
    return toAdminAcademicIntegrityCase(updated);
  }

  if (trustSafetyCase.status === 'ACTION_TAKEN' || trustSafetyCase.status === 'DISMISSED') {
    throw AppError.badRequest('This case has already been resolved');
  }

  const updated = await updateCase(caseId, {
    status: 'ACTION_TAKEN',
    actionReason: reason,
    actionedBy: moderatorId,
    actionedAt: new Date(),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: moderatorId,
    action: 'lms.academic_integrity.confirmed',
    resourceType: 'trust_safety_case',
    resourceId: caseId,
    beforeState: { status: trustSafetyCase.status },
    afterState: { status: 'ACTION_TAKEN' },
  });

  return toAdminAcademicIntegrityCase(updated);
}

/**
 * Deliberately does NOT reuse `trust-safety/appeal.service.ts`'s
 * `resolveAppealDecision` — that function's OVERTURNED path calls
 * `updateUser(..., { status: 'ACTIVE' })`, a community-moderation-specific
 * side effect that has no academic-integrity equivalent (overturning a
 * misconduct finding should never itself reactivate an unrelated account
 * restriction). This function's only effect is the Appeal row's own
 * status — `hasActiveAcademicIntegrityHold` reads that live, at
 * evaluation time, rather than needing a separate reinstatement step.
 */
export async function resolveIntegrityAppeal(
  appealId: string,
  resolverId: string,
  decision: 'UPHELD' | 'OVERTURNED',
  resolutionNote: string | undefined,
) {
  const appeal = await findAppealById(appealId);
  if (!appeal) throw AppError.notFound('Appeal not found');
  assertIsAcademicIntegrityCase(appeal.case);
  if (appeal.status !== 'PENDING') throw AppError.badRequest('This appeal has already been resolved');

  const updated = await resolveAppeal(appealId, decision, resolverId, resolutionNote);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: resolverId,
    action: 'lms.academic_integrity.appeal_resolved',
    resourceType: 'appeal',
    resourceId: appealId,
    afterState: { decision },
  });

  return updated;
}

/**
 * FR-081's "no active misconduct restriction" certificate-eligibility
 * condition. OPEN/UNDER_REVIEW always blocks (investigation in
 * progress); ACTION_TAKEN blocks UNLESS its most recent appeal was
 * OVERTURNED. A bare USER-target case (identity fraud) blocks every
 * course; a SUBMISSION/QUIZ_ATTEMPT/CERTIFICATE-target case blocks only
 * the course it actually pertains to.
 */
export async function hasActiveAcademicIntegrityHold(userId: string, courseId: string): Promise<boolean> {
  const cases = await findActiveAcademicIntegrityCasesForUser(userId);

  for (const c of cases) {
    if (c.targetType !== 'USER') {
      if (!c.targetId) continue;
      const target = await resolveAcademicIntegrityTarget(c.targetType as 'SUBMISSION' | 'QUIZ_ATTEMPT' | 'CERTIFICATE', c.targetId);
      if (target.courseId !== courseId) continue;
    }

    if (c.status === 'OPEN' || c.status === 'UNDER_REVIEW') return true;
    if (c.status === 'ACTION_TAKEN') {
      const latestAppeal = c.appeals[0];
      if (!latestAppeal || latestAppeal.status !== 'OVERTURNED') return true;
    }
  }

  return false;
}

export async function listAcademicIntegrityCasesAdmin(
  filter: { status?: string },
  pagination: { page: number; pageSize: number },
): Promise<{ data: AdminAcademicIntegrityCase[]; total: number }> {
  const [rows, total] = await findAcademicIntegrityCasesAdmin(filter, {
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
  });
  return { data: rows.map(toAdminAcademicIntegrityCase), total };
}

export async function getAcademicIntegrityCaseAdmin(caseId: string): Promise<AdminAcademicIntegrityCase> {
  const row = await findCaseById(caseId);
  if (!row) throw AppError.notFound('Case not found');
  assertIsAcademicIntegrityCase(row);
  return toAdminAcademicIntegrityCase(row);
}

/**
 * The learner's own "my cases" list — the concrete, reachable way FR-116's
 * "the learner retains an appeal path" is actually true in this codebase:
 * without this, a flagged learner would have no way to discover a case
 * exists, let alone its `caseId`, to submit an appeal via the existing
 * generic `POST /trust-safety/cases/:caseId/appeal` endpoint.
 */
export async function listMyAcademicIntegrityCases(userId: string): Promise<AdminAcademicIntegrityCase[]> {
  const rows = await findAcademicIntegrityCasesForUser(userId);
  return rows.map(toAdminAcademicIntegrityCase);
}
