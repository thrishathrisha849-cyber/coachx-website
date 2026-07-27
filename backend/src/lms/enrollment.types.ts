/** Phase 6 Part 2B — Enrollment DTOs. */

/** A learner's own enrollment — returned only from `/me/*` routes, never another user's. */
export interface MyEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  source: string;
  status: string;
  enrolledAt: Date;
  activatedAt: Date | null;
  accessStartAt: Date | null;
  accessEndAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
}

/** Admin/instructor-facing enrollment shape — the full record. */
export interface AdminEnrollment extends MyEnrollment {
  userId: string;
  userDisplayName: string;
  entitlementReference: string | null;
  suspendedAt: Date | null;
  cancelledAt: Date | null;
  revokedAt: Date | null;
  expiredAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
