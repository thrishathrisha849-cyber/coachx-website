import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  backgroundUrl?: string;
  logoUrl?: string;
  signatureUrl?: string;
  sealUrl?: string;
  fontFamily?: string;
  primaryColor?: string;
  language: string;
}

export async function listTemplates(): Promise<AdminCertificateTemplate[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCertificateTemplate[]>>('/lms/admin/certificate-templates');
  return data.data;
}

export async function createTemplate(input: CreateTemplateInput): Promise<AdminCertificateTemplate> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCertificateTemplate>>('/lms/admin/certificate-templates', input);
  return data.data;
}

export async function updateTemplate(templateId: string, input: Partial<CreateTemplateInput> & { isActive?: boolean }): Promise<AdminCertificateTemplate> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminCertificateTemplate>>(`/lms/admin/certificate-templates/${templateId}`, input);
  return data.data;
}

export async function mapCourseTemplate(courseId: string, templateId: string | null): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${courseId}/certificate-template`, { templateId });
}

export interface AdminCertificateSummary {
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
  courseId: string;
  enrollmentId: string;
  learnerUserId: string;
}

export async function listCertificatesForCourse(courseId: string): Promise<AdminCertificateSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCertificateSummary[]>>(`/lms/admin/courses/${courseId}/certificates`);
  return data.data;
}

export async function revokeCertificate(certificateId: string, reason: string): Promise<void> {
  await apiClient.post(`/lms/admin/certificates/${certificateId}/revoke`, { reason });
}
