import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { findUserById } from '../auth/auth.repository';
import { adminGrantEnrollment, revokeEnrollment, extendEnrollmentAccess } from './enrollment.service';
import type { AdminEnrollment } from './enrollment.types';

/**
 * 004 FR-033 — Organization-admin course assignment. Reuses `001`'s
 * `Organization`/`User.organizationId` (which did not exist yet when the
 * pre-existing Phase 6 Part 2 LMS work was built and documented this gap as
 * "owned by another feature") and the existing `adminGrantEnrollment()`
 * enrollment-creation path — NOT a new `ORGANIZATION` entitlement source,
 * since `entitlement.service.ts` deliberately fails closed on every source
 * except `FREE`/`ADMIN_GRANT` (Volume 09 isn't built). An org-admin
 * assignment is authoritatively an admin grant that happens to be scoped
 * to the admin's own organization, not a new entitlement type.
 *
 * Every function here re-verifies BOTH the actor's own `organizationId` AND
 * the target user's `organizationId` on every call — an Organization Admin
 * MUST NOT be able to assign courses to, view, or revoke access for a user
 * outside their own organization, and MUST NOT be able to reach any of a
 * learner's private data beyond enrollment/progress-summary fields (no
 * notes/unrelated-activity endpoint is exposed here at all).
 */

async function requireOwnOrganizationId(actorId: string): Promise<string> {
  const actor = await findUserById(actorId);
  if (!actor?.organizationId) throw AppError.forbidden('permission denied');
  return actor.organizationId;
}

async function assertUserInOrganization(userId: string, organizationId: string): Promise<void> {
  const target = await findUserById(userId);
  if (!target || target.organizationId !== organizationId) {
    throw AppError.forbidden('permission denied');
  }
}

export interface AssignCourseResult {
  userId: string;
  status: 'assigned' | 'failed';
  enrollment?: AdminEnrollment;
  error?: string;
}

/** FR-033 "assign courses" (+ optional "set deadlines" via `accessEndAt`) — bulk, reports a per-user outcome rather than failing the whole batch on one bad row. */
export async function assignCourseToOrganizationMembers(
  actorId: string,
  courseId: string,
  userIds: string[],
  options: { accessEndAt?: Date; reason?: string } = {},
): Promise<AssignCourseResult[]> {
  const organizationId = await requireOwnOrganizationId(actorId);

  const results: AssignCourseResult[] = [];
  for (const userId of userIds) {
    try {
      await assertUserInOrganization(userId, organizationId);
      const enrollment = await adminGrantEnrollment(
        { userId, courseId, source: 'ADMIN_GRANT', accessEndAt: options.accessEndAt, reason: options.reason ?? 'Organization-assigned course' },
        actorId,
      );
      results.push({ userId, status: 'assigned', enrollment });
    } catch (error) {
      results.push({ userId, status: 'failed', error: error instanceof AppError ? error.message : 'Assignment failed' });
    }
  }
  return results;
}

export interface OrgEnrollmentSummary {
  enrollmentId: string;
  userId: string;
  userDisplayName: string | null;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: Date;
  accessEndAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
}

/** FR-033 "track completion" / "download reports" — org-scoped only, and deliberately a narrow summary shape (never a learner's notes or unrelated activity). */
export async function listOrganizationCourseEnrollments(actorId: string, courseId?: string): Promise<OrgEnrollmentSummary[]> {
  const organizationId = await requireOwnOrganizationId(actorId);
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const rows = await prisma.enrollment.findMany({
    where: { user: { organizationId }, ...(courseId ? { courseId } : {}) },
    include: { user: { include: { profile: true } }, course: { select: { title: true } } },
    orderBy: { enrolledAt: 'desc' },
  });

  return rows.map((r) => ({
    enrollmentId: r.id,
    userId: r.userId,
    userDisplayName: r.user.profile?.displayName ?? null,
    courseId: r.courseId,
    courseTitle: r.course.title,
    status: r.status,
    enrolledAt: r.enrolledAt,
    accessEndAt: r.accessEndAt,
    completedAt: r.completedAt,
    lastAccessedAt: r.lastAccessedAt,
  }));
}

/** FR-033 "remove access" — verifies the enrollment belongs to a member of the actor's own organization before revoking. */
export async function removeOrganizationMemberAccess(actorId: string, enrollmentId: string, reason: string): Promise<AdminEnrollment> {
  const organizationId = await requireOwnOrganizationId(actorId);
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { user: true } });
  if (!enrollment || enrollment.user.organizationId !== organizationId) {
    throw AppError.notFound('Enrollment not found');
  }

  return revokeEnrollment(enrollmentId, actorId, reason);
}

/** FR-033 "set deadlines" on an already-assigned enrollment (as opposed to at assignment time). */
export async function setOrganizationMemberDeadline(actorId: string, enrollmentId: string, accessEndAt: Date | null): Promise<AdminEnrollment> {
  const organizationId = await requireOwnOrganizationId(actorId);
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { user: true } });
  if (!enrollment || enrollment.user.organizationId !== organizationId) {
    throw AppError.notFound('Enrollment not found');
  }

  return extendEnrollmentAccess(enrollmentId, actorId, accessEndAt);
}
