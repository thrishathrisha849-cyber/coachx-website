import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
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
 */
export async function revokeCertificate(certificateId: string, reason: string, actorId: string): Promise<void> {
  const certificate = await findCertificateById(certificateId);
  if (!certificate) throw AppError.notFound('Certificate not found');
  if (certificate.status === 'REVOKED') {
    throw AppError.conflict('This certificate has already been revoked');
  }

  await withTransaction(async (tx) => {
    await updateCertificate(
      certificateId,
      {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: actorId,
        revokedReason: reason,
      },
      tx,
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
      tx,
    );
  });
}

export async function listCertificatesForCourseAdmin(courseId: string): Promise<AdminCertificateSummary[]> {
  const rows = await findCertificatesForCourseAdmin(courseId);
  return rows.map(toAdminCertificateSummary);
}
