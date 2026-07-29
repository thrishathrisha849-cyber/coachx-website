import { randomBytes } from 'node:crypto';
import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getPrismaClient } from '../database/prisma-client';
import { findCourseById } from './course.repository';
import { findEnrollmentForUserAndCourse, findEnrollmentById } from './enrollment.repository';
import {
  findCertificateByEnrollment,
  findCertificateByIdForUser,
  createCertificate as createCertificateRow,
  credentialIdExists,
  findCertificatesForUser,
  findActiveTemplates,
  findAllTemplatesAdmin,
  findTemplateById,
  createTemplate as createTemplateRow,
  updateTemplate as updateTemplateRow,
} from './certificate.repository';
import { toPublicCertificate, toAdminCertificateTemplate } from './certificate.serializers';
import { recordLearningEvent } from './learning-event.service';
import type { AdminCertificateTemplate, CertificateEligibility, EligibilityCondition, PublicCertificate } from './certificate.types';

const CREDENTIAL_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids visual ambiguity on a printed/shared credential

function generateCredentialId(): string {
  const bytes = randomBytes(10);
  let code = '';
  for (const byte of bytes) {
    code += CREDENTIAL_CHARSET[byte % CREDENTIAL_CHARSET.length];
  }
  return `CX-${code}`;
}

async function uniqueCredentialId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCredentialId();
    if (!(await credentialIdExists(candidate))) return candidate;
  }
  throw AppError.internal('Could not generate a unique certificate credential ID');
}

/**
 * FR-081 eligibility evaluator — SC-002's "server-evaluated eligibility
 * snapshot." Evaluates every condition this codebase can ACTUALLY verify
 * against a real signal; conditions with no owning system yet (attendance
 * threshold — no Live Session system; final project approved — no
 * project-based-learning system; payment settled — no Volume 009) are
 * reported in `notApplicable`, never silently assumed satisfied.
 */
export async function evaluateCertificateEligibility(userId: string, courseId: string): Promise<CertificateEligibility> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const conditions: EligibilityCondition[] = [
    {
      key: 'certificateAvailable',
      label: 'This course offers a certificate',
      satisfied: course.certificateAvailable,
    },
    {
      key: 'enrollmentCompleted',
      label: 'All mandatory lessons, quizzes, and assignments are complete',
      satisfied: enrollment?.status === 'COMPLETED',
    },
    {
      key: 'identityVerified',
      label: 'Email address verified',
      satisfied: Boolean(user?.emailVerifiedAt),
    },
    {
      key: 'accountInGoodStanding',
      label: 'No active account restriction',
      satisfied: user?.status === 'ACTIVE',
    },
  ];

  return {
    eligible: conditions.every((c) => c.satisfied),
    conditions,
    notApplicable: ['attendanceThreshold', 'finalProjectApproved', 'paymentSettled'],
  };
}

/**
 * FR-083 generation flow. Idempotent: an already-issued certificate for
 * this enrollment is returned as-is rather than creating a duplicate (no
 * `Certificate` row is ever silently re-created or overwritten — Historical
 * Immutability, Constitution Article IV).
 */
export async function generateCertificateForEnrollment(userId: string, courseId: string): Promise<PublicCertificate> {
  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  const existing = await findCertificateByEnrollment(enrollment.id);
  if (existing) return toPublicCertificate(existing);

  const eligibility = await evaluateCertificateEligibility(userId, courseId);
  if (!eligibility.eligible) {
    throw AppError.badRequest('This course is not yet eligible for a certificate', { conditions: eligibility.conditions });
  }

  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  const [user, primaryInstructorAssignment] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.courseInstructor.findFirst({ where: { courseId, isPrimary: true }, include: { user: { include: { profile: true } } } }),
  ]);
  if (!user) throw AppError.notFound('User not found');

  const credentialId = await uniqueCredentialId();

  const certificate = await withTransaction(async (tx) => {
    const created = await createCertificateRow(
      {
        course: { connect: { id: courseId } },
        enrollment: { connect: { id: enrollment.id } },
        credentialId,
        certificateType: 'COURSE_COMPLETION',
        learnerName: user.profile?.displayName ?? 'CoachX Learner',
        courseTitle: course.title,
        instructorName: primaryInstructorAssignment?.user.profile?.displayName ?? null,
        organizationName: null, // 004 US5: no Organization-mapped-to-course concept exists yet — honestly null, not fabricated.
        completionDate: enrollment.completedAt ?? new Date(),
        template: course.certificateTemplateId ? { connect: { id: course.certificateTemplateId } } : undefined,
        eligibilitySnapshot: eligibility as never,
      },
      tx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: 'lms.certificate.issued',
        resourceType: 'certificate',
        resourceId: created.id,
        afterState: { courseId, credentialId },
      },
      tx,
    );
    await recordLearningEvent(
      { eventType: 'CERTIFICATE_ISSUED', userId, courseId, enrollmentId: enrollment.id, metadata: { credentialId } },
      tx,
    );

    return created;
  });

  return toPublicCertificate(certificate);
}

export async function listMyCertificates(userId: string): Promise<PublicCertificate[]> {
  const rows = await findCertificatesForUser(userId);
  return rows.map(toPublicCertificate);
}

export async function getMyCertificateById(userId: string, certificateId: string): Promise<PublicCertificate> {
  const certificate = await findCertificateByIdForUser(certificateId, userId);
  if (!certificate) throw AppError.notFound('Certificate not found');
  return toPublicCertificate(certificate);
}

// --- Certificate templates (admin, reuses `course.module.manage`) --------

export async function listTemplatesForLearnerSelection(): Promise<AdminCertificateTemplate[]> {
  const rows = await findActiveTemplates();
  return rows.map(toAdminCertificateTemplate);
}

export async function listTemplatesAdmin(): Promise<AdminCertificateTemplate[]> {
  const rows = await findAllTemplatesAdmin();
  return rows.map(toAdminCertificateTemplate);
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

export async function createCertificateTemplate(input: CreateTemplateInput, actorId: string): Promise<AdminCertificateTemplate> {
  const template = await createTemplateRow({
    name: input.name,
    backgroundUrl: input.backgroundUrl ?? null,
    logoUrl: input.logoUrl ?? null,
    signatureUrl: input.signatureUrl ?? null,
    sealUrl: input.sealUrl ?? null,
    fontFamily: input.fontFamily ?? null,
    primaryColor: input.primaryColor ?? null,
    language: input.language,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.certificate_template.created',
    resourceType: 'certificate_template',
    resourceId: template.id,
    afterState: { name: input.name },
  });

  return toAdminCertificateTemplate(template);
}

export async function updateExistingTemplate(id: string, input: Partial<CreateTemplateInput> & { isActive?: boolean }, actorId: string): Promise<AdminCertificateTemplate> {
  const existing = await findTemplateById(id);
  if (!existing) throw AppError.notFound('Certificate template not found');

  const updated = await updateTemplateRow(id, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.backgroundUrl !== undefined ? { backgroundUrl: input.backgroundUrl } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.signatureUrl !== undefined ? { signatureUrl: input.signatureUrl } : {}),
    ...(input.sealUrl !== undefined ? { sealUrl: input.sealUrl } : {}),
    ...(input.fontFamily !== undefined ? { fontFamily: input.fontFamily } : {}),
    ...(input.primaryColor !== undefined ? { primaryColor: input.primaryColor } : {}),
    ...(input.language !== undefined ? { language: input.language } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.certificate_template.updated',
    resourceType: 'certificate_template',
    resourceId: id,
    afterState: input,
  });

  return toAdminCertificateTemplate(updated);
}

/** FR-084 "course mapping" — sets/clears which template a course's future certificates use. Never retroactively re-templates an already-issued certificate (Historical Immutability). */
export async function mapCourseTemplate(courseId: string, templateId: string | null, actorId: string): Promise<void> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  if (templateId) {
    const template = await findTemplateById(templateId);
    if (!template) throw AppError.notFound('Certificate template not found');
  }

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  await prisma.course.update({ where: { id: courseId }, data: { certificateTemplateId: templateId } });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.course.certificate_template_mapped',
    resourceType: 'course',
    resourceId: courseId,
    afterState: { templateId },
  });
}

/** Re-exported for revocation.service.ts / verification.service.ts to reuse without a second lookup implementation. */
export { findEnrollmentById };
