/** 004 US5 Certificate System — DTO shapes. */

export interface EligibilityCondition {
  key: string;
  label: string;
  satisfied: boolean;
}

export interface CertificateEligibility {
  eligible: boolean;
  conditions: EligibilityCondition[];
  /** Conditions FR-081 names that this codebase cannot yet evaluate (no owning system exists) — always reported honestly, never silently assumed true. */
  notApplicable: string[];
}

export interface PublicCertificate {
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
}

/** FR-085 public verification response — minimal exposed data, no login required. */
export interface CertificateVerificationResult {
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'REPLACED' | 'NOT_FOUND';
  credentialId: string;
  learnerName?: string;
  courseTitle?: string;
  issuedAt?: Date;
  organizationName?: string | null;
}

export interface AdminCertificateTemplate {
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
}

export interface AdminCertificateSummary extends PublicCertificate {
  courseId: string;
  enrollmentId: string;
  learnerUserId: string;
}
