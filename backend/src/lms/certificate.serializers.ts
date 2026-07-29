import type { AdminCertificateSummary, AdminCertificateTemplate, PublicCertificate } from './certificate.types';

type CertificateRow = {
  id: string;
  credentialId: string;
  certificateType: string;
  learnerName: string;
  courseTitle: string;
  instructorName: string | null;
  organizationName: string | null;
  completionDate: Date;
  issuedAt: Date;
  expiresAt: Date | null;
  status: string;
};

export function toPublicCertificate(row: CertificateRow): PublicCertificate {
  return {
    id: row.id,
    credentialId: row.credentialId,
    certificateType: row.certificateType,
    learnerName: row.learnerName,
    courseTitle: row.courseTitle,
    instructorName: row.instructorName,
    organizationName: row.organizationName,
    completionDate: row.completionDate,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    status: row.status,
  };
}

export function toAdminCertificateSummary(
  row: CertificateRow & { courseId: string; enrollmentId: string; enrollment: { userId: string } },
): AdminCertificateSummary {
  return {
    ...toPublicCertificate(row),
    courseId: row.courseId,
    enrollmentId: row.enrollmentId,
    learnerUserId: row.enrollment.userId,
  };
}

type TemplateRow = {
  id: string;
  name: string;
  backgroundUrl: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  sealUrl: string | null;
  fontFamily: string | null;
  primaryColor: string | null;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toAdminCertificateTemplate(row: TemplateRow): AdminCertificateTemplate {
  return {
    id: row.id,
    name: row.name,
    backgroundUrl: row.backgroundUrl,
    logoUrl: row.logoUrl,
    signatureUrl: row.signatureUrl,
    sealUrl: row.sealUrl,
    fontFamily: row.fontFamily,
    primaryColor: row.primaryColor,
    language: row.language,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
