import type { AdminEnrollment, MyEnrollment } from './enrollment.types';

type EnrollmentRow = {
  id: string;
  userId: string;
  courseId: string;
  course: { title: string; slug: string };
  user: { profile: { displayName: string } | null };
  source: string;
  status: string;
  entitlementReference: string | null;
  enrolledAt: Date;
  activatedAt: Date | null;
  accessStartAt: Date | null;
  accessEndAt: Date | null;
  suspendedAt: Date | null;
  cancelledAt: Date | null;
  revokedAt: Date | null;
  completedAt: Date | null;
  expiredAt: Date | null;
  lastAccessedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toMyEnrollment(row: EnrollmentRow): MyEnrollment {
  return {
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    source: row.source,
    status: row.status,
    enrolledAt: row.enrolledAt,
    activatedAt: row.activatedAt,
    accessStartAt: row.accessStartAt,
    accessEndAt: row.accessEndAt,
    completedAt: row.completedAt,
    lastAccessedAt: row.lastAccessedAt,
  };
}

export function toAdminEnrollment(row: EnrollmentRow): AdminEnrollment {
  return {
    ...toMyEnrollment(row),
    userId: row.userId,
    userDisplayName: row.user.profile?.displayName ?? 'Learner',
    entitlementReference: row.entitlementReference,
    suspendedAt: row.suspendedAt,
    cancelledAt: row.cancelledAt,
    revokedAt: row.revokedAt,
    expiredAt: row.expiredAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
