import { AppError } from '../utils/app-error';
import { withTransaction, type TransactionClient } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import {
  findCertificateByCredentialId,
  findCertificateById,
  updateCertificate,
  findCertificatesForCourseAdmin,
} from './certificate.repository';
import { toAdminCertificateSummary } from './certificate.serializers';
import type { AdminCertificateSummary, CertificateVerificationResult } from './certificate.types';

/**
 * FR-085 public verification — no auth required, minimal data exposed.
 * `NOT_FOUND` is a response VALUE, never a stored `CertificateStatus` (a
 * forged/mistyped credential ID must produce a normal 200 "not found"
 * result, not a 404 that leaks whether the lookup layer itself failed).
 */
export async function verifyCertificateByCredentialId(credentialId: string): Promise<CertificateVerificationResult> {
  const certificate = await findCertificateByCredentialId(credentialId);
  if (!certificate) {
    return { status: 'NOT_FOUND', credentialId };
  }

  const isExpired = certificate.expiresAt !== null && certificate.expiresAt.getTime() < Date.now();
  const status = certificate.status === 'VALID' && isExpired ? 'EXPIRED' : certificate.status;

  return {
    status,
    credentialId: certificate.credentialId,
    learnerName: certificate.learnerName,
    courseTitle: certificate.courseTitle,
    issuedAt: certificate.issuedAt,
    organizationName: certificate.organizationName,
  };
}

/**
 * FR-086 revocation. A revoked certificate row is never deleted — it stays
 * queryable (both by admins and via public verification, which will report
 * `REVOKED`) forever, per Historical Immutability.
 *
 * Accepts an optional `tx` (004 Academic-integrity investigation batch) so
 * `academic-integrity.service.ts`'s `flagForInvestigation` can compose this
 * revocation into its own single transaction alongside the case-creation
 * write — `withTransaction` always opens a brand-new transaction on the
 * global client, so calling this WITHOUT threading `tx` through from
 * inside another `withTransaction` callback would silently run as a
 * second, independent transaction, breaking atomicity between "case
 * created" and "certificate revoked."
 */
export async function revokeCertificate(certificateId: string, reason: string, actorId: string, tx?: TransactionClient): Promise<void> {
  const certificate = await findCertificateById(certificateId, tx);
  if (!certificate) throw AppError.notFound('Certificate not found');
  if (certificate.status === 'REVOKED') {
    throw AppError.conflict('This certificate has already been revoked');
  }

  const run = async (activeTx: TransactionClient) => {
    await updateCertificate(
      certificateId,
      {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: actorId,
        revokedReason: reason,
      },
      activeTx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.certificate.revoked',
        resourceType: 'certificate',
        resourceId: certificateId,
        reason,
        beforeState: { status: certificate.status },
        afterState: { status: 'REVOKED' },
      },
      activeTx,
    );
  };

  if (tx) {
    await run(tx);
  } else {
    await withTransaction(run);
  }
}

export async function listCertificatesForCourseAdmin(courseId: string): Promise<AdminCertificateSummary[]> {
  const rows = await findCertificatesForCourseAdmin(courseId);
  return rows.map(toAdminCertificateSummary);
}
