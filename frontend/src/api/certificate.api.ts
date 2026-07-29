import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface PublicCertificate {
  id: string;
  credentialId: string;
  certificateType: string;
  learnerName: string;
  courseTitle: string;
  instructorName: string | null;
  organizationName: string | null;
  completionDate: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
}

export interface EligibilityCondition {
  key: string;
  label: string;
  satisfied: boolean;
}

export interface CertificateEligibility {
  eligible: boolean;
  conditions: EligibilityCondition[];
  notApplicable: string[];
}

export interface CertificateVerificationResult {
  status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'REPLACED' | 'NOT_FOUND';
  credentialId: string;
  learnerName?: string;
  courseTitle?: string;
  issuedAt?: string;
  organizationName?: string | null;
}

export async function getMyCertificates(): Promise<PublicCertificate[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicCertificate[]>>('/lms/me/certificates');
  return data.data;
}

export async function getMyCertificateById(certificateId: string): Promise<PublicCertificate> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicCertificate>>(`/lms/me/certificates/${certificateId}`);
  return data.data;
}

export async function getMyCertificateEligibility(courseId: string): Promise<CertificateEligibility> {
  const { data } = await apiClient.get<ApiSuccessResponse<CertificateEligibility>>(`/lms/me/courses/${courseId}/certificate-eligibility`);
  return data.data;
}

export async function generateMyCertificate(courseId: string): Promise<PublicCertificate> {
  const { data } = await apiClient.post<ApiSuccessResponse<PublicCertificate>>(`/lms/me/courses/${courseId}/certificate`);
  return data.data;
}

export async function verifyCertificate(credentialId: string): Promise<CertificateVerificationResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<CertificateVerificationResult>>(`/lms/certificates/verify/${encodeURIComponent(credentialId)}`);
  return data.data;
}
