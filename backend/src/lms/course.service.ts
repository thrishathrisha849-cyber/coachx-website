import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { parsePaginationParams, buildPaginationMeta } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import {
  assertValidCourseTransition,
  assertPublishReady,
  assertHasPublishableModule,
  isCourseVisibleByDirectLink,
} from './course-lifecycle.policy';
import {
  findCourseBySlug,
  findCourseById,
  findPublicCourses,
  findCoursesAdmin,
  findCoursesForInstructor,
  isUserAssignedToCourse,
  createCourse,
  updateCourse,
  countModulesForCourse,
  type PublicCourseFilter,
  type AdminCourseFilter,
} from './course.repository';
import { findVisibleModulesByCourse } from './module.repository';
import { toAdminCourse, toPublicCourse, toPublicCourseWithModules } from './lms.serializers';
import type { AdminCourse, PublicCourse, PublicCourseWithModules } from './lms.types';
import { snapshotCourseIfPublished } from './course-version.service';

export interface CourseInput {
  title: string;
  slug: string;
  subtitle?: string;
  shortDescription?: string;
  description?: string;
  learningOutcomes?: string[];
  tags?: string[];
  targetAudience?: string;
  toolsRequired?: string[];
  thumbnailUrl?: string;
  coverImageUrl?: string;
  trailerUrl?: string;
  language?: string;
  level?: string;
  categoryId?: string;
  durationMinutes?: number;
  estimatedCompletionMinutes?: number;
  weeklyCommitmentMinutes?: number;
  certificateAvailable?: boolean;
  priceType?: string;
  priceAmountMinor?: number;
  currency?: string;
  isFeatured?: boolean;
  enrollmentLimit?: number;
  enrollmentStartAt?: string;
  enrollmentEndAt?: string;
  publishAt?: string;
  expireAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  metadata?: unknown;
}

export type CourseUpdateInput = Partial<CourseInput> & {
  categoryId?: string | null;
  enrollmentLimit?: number | null;
  enrollmentStartAt?: string | null;
  enrollmentEndAt?: string | null;
  publishAt?: string | null;
  expireAt?: string | null;
};

function toDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export async function createNewCourse(input: CourseInput, actorId: string): Promise<AdminCourse> {
  const existing = await findCourseBySlug(input.slug);
  if (existing) throw AppError.conflict('A course with this slug already exists');

  return withTransaction(async (tx) => {
    const course = await createCourse(
      {
        title: input.title,
        slug: input.slug,
        subtitle: input.subtitle,
        shortDescription: input.shortDescription,
        description: input.description,
        learningOutcomes: input.learningOutcomes ?? [],
        tags: input.tags ?? [],
        targetAudience: input.targetAudience,
        toolsRequired: input.toolsRequired ?? [],
        thumbnailUrl: input.thumbnailUrl,
        coverImageUrl: input.coverImageUrl,
        trailerUrl: input.trailerUrl,
        language: (input.language ?? 'EN') as never,
        level: (input.level ?? 'ALL_LEVELS') as never,
        ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
        durationMinutes: input.durationMinutes,
        estimatedCompletionMinutes: input.estimatedCompletionMinutes,
        weeklyCommitmentMinutes: input.weeklyCommitmentMinutes,
        certificateAvailable: input.certificateAvailable ?? false,
        priceType: (input.priceType ?? 'FREE') as never,
        priceAmountMinor: input.priceAmountMinor ?? 0,
        currency: input.currency ?? 'INR',
        isFeatured: input.isFeatured ?? false,
        enrollmentLimit: input.enrollmentLimit,
        enrollmentStartAt: toDate(input.enrollmentStartAt) ?? undefined,
        enrollmentEndAt: toDate(input.enrollmentEndAt) ?? undefined,
        publishAt: toDate(input.publishAt) ?? undefined,
        expireAt: toDate(input.expireAt) ?? undefined,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        canonicalUrl: input.canonicalUrl,
        metadata: input.metadata as never,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.course.created', resourceType: 'course', resourceId: course.id },
      tx,
    );

    return toAdminCourse(course);
  });
}

export async function updateExistingCourse(
  id: string,
  input: CourseUpdateInput,
  actorId: string,
): Promise<AdminCourse> {
  return withTransaction(async (tx) => {
    const existing = await findCourseById(id, tx);
    if (!existing) throw AppError.notFound('Course not found');
    if (existing.status === 'ARCHIVED' || existing.status === 'RETIRED') {
      throw AppError.badRequest(`Cannot modify a course with status ${existing.status} — restore it first`);
    }

    // 001 FR-099 — snapshot the PRIOR state before overwriting, but only
    // when it was actually published (nothing to preserve for a draft).
    await snapshotCourseIfPublished(existing, actorId, tx);

    const updated = await updateCourse(
      id,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.learningOutcomes !== undefined ? { learningOutcomes: input.learningOutcomes } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
        ...(input.toolsRequired !== undefined ? { toolsRequired: input.toolsRequired } : {}),
        ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
        ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
        ...(input.trailerUrl !== undefined ? { trailerUrl: input.trailerUrl } : {}),
        ...(input.language !== undefined ? { language: input.language as never } : {}),
        ...(input.level !== undefined ? { level: input.level as never } : {}),
        ...(input.categoryId !== undefined
          ? input.categoryId === null
            ? { category: { disconnect: true } }
            : { category: { connect: { id: input.categoryId } } }
          : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.estimatedCompletionMinutes !== undefined
          ? { estimatedCompletionMinutes: input.estimatedCompletionMinutes }
          : {}),
        ...(input.weeklyCommitmentMinutes !== undefined
          ? { weeklyCommitmentMinutes: input.weeklyCommitmentMinutes }
          : {}),
        ...(input.certificateAvailable !== undefined ? { certificateAvailable: input.certificateAvailable } : {}),
        ...(input.priceType !== undefined ? { priceType: input.priceType as never } : {}),
        ...(input.priceAmountMinor !== undefined ? { priceAmountMinor: input.priceAmountMinor } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
        ...(input.enrollmentLimit !== undefined ? { enrollmentLimit: input.enrollmentLimit } : {}),
        ...(input.enrollmentStartAt !== undefined ? { enrollmentStartAt: toDate(input.enrollmentStartAt) } : {}),
        ...(input.enrollmentEndAt !== undefined ? { enrollmentEndAt: toDate(input.enrollmentEndAt) } : {}),
        ...(input.publishAt !== undefined ? { publishAt: toDate(input.publishAt) } : {}),
        ...(input.expireAt !== undefined ? { expireAt: toDate(input.expireAt) } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.canonicalUrl !== undefined ? { canonicalUrl: input.canonicalUrl } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
        version: { increment: 1 },
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.course.updated',
        resourceType: 'course',
        resourceId: id,
        beforeState: { title: existing.title, status: existing.status },
        afterState: { title: updated.title, status: updated.status },
      },
      tx,
    );

    return toAdminCourse(updated);
  });
}

/**
 * `reviewNote` is required when transitioning to `CHANGES_REQUESTED` (the
 * reviewer's explanation of what must change — 004 FR-100's role-attributed
 * workflow implies a reviewer always leaves feedback when rejecting), and
 * optional/ignored for every other transition. Cleared automatically on
 * every DRAFT/SUBMITTED_FOR_REVIEW re-entry so it never shows stale
 * feedback against a resubmitted course.
 */
export async function changeCourseStatus(
  id: string,
  newStatus: string,
  actorId: string,
  reviewNote?: string,
): Promise<AdminCourse> {
  return withTransaction(async (tx) => {
    const existing = await findCourseById(id, tx);
    if (!existing) throw AppError.notFound('Course not found');

    assertValidCourseTransition(existing.status, newStatus);

    if (newStatus === 'CHANGES_REQUESTED' && !reviewNote?.trim()) {
      throw AppError.badRequest('A review note is required when requesting changes');
    }

    // 004 FR-100: Approved is the point the workflow defines as "ready to
    // go live" — readiness/module-count gates run HERE, not at
    // publish/schedule time (see course-lifecycle.policy.ts doc comment).
    if (newStatus === 'APPROVED') {
      assertPublishReady({
        title: existing.title,
        slug: existing.slug,
        shortDescription: existing.shortDescription,
        description: existing.description,
        categoryId: existing.categoryId,
        thumbnailUrl: existing.thumbnailUrl,
        publishAt: existing.publishAt,
        expireAt: existing.expireAt,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
      });
      const moduleCount = await countModulesForCourse(id, tx);
      assertHasPublishableModule(moduleCount);
    }

    const isFirstPublish = newStatus === 'PUBLISHED' && !existing.publishedAt;
    const clearsReviewNotes = newStatus === 'DRAFT' || newStatus === 'SUBMITTED_FOR_REVIEW';

    const updated = await updateCourse(
      id,
      {
        status: newStatus as never,
        updatedBy: actorId,
        ...(newStatus === 'CHANGES_REQUESTED' ? { reviewNotes: reviewNote, reviewedBy: actorId } : {}),
        ...(clearsReviewNotes ? { reviewNotes: null } : {}),
        ...(newStatus === 'APPROVED' ? { reviewedBy: actorId } : {}),
        ...(newStatus === 'PUBLISHED' ? { publishedBy: actorId } : {}),
        ...(isFirstPublish ? { publishedAt: new Date() } : {}),
        ...(newStatus === 'ARCHIVED' ? { archivedAt: new Date() } : {}),
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.course.status_changed',
        resourceType: 'course',
        resourceId: id,
        beforeState: { status: existing.status },
        afterState: { status: newStatus, reviewNote: newStatus === 'CHANGES_REQUESTED' ? reviewNote : undefined },
      },
      tx,
    );

    return toAdminCourse(updated);
  });
}

export async function archiveCourse(id: string, actorId: string): Promise<AdminCourse> {
  return changeCourseStatus(id, 'ARCHIVED', actorId);
}

export async function restoreCourse(id: string, actorId: string): Promise<AdminCourse> {
  return changeCourseStatus(id, 'DRAFT', actorId);
}

// --- Public reads ---------------------------------------------------------

export async function getPublicCourseBySlug(slug: string): Promise<PublicCourseWithModules> {
  const course = await findCourseBySlug(slug);
  // Deliberately the SAME "not found" for a missing slug and a slug that
  // exists but isn't publicly visible (draft/changes-requested/archived/
  // expired/etc.) — never distinguish the two to a public caller (no
  // draft-existence leak). `isCourseVisibleByDirectLink` additionally
  // allows UNLISTED here (FR-015) — a status the LISTING query
  // deliberately never returns (see course.repository.ts).
  if (!course || !isCourseVisibleByDirectLink(course)) throw AppError.notFound('Course not found');

  const modules = await findVisibleModulesByCourse(course.id);
  return toPublicCourseWithModules(course, modules);
}

export async function listPublicCoursesForDiscovery(
  filter: PublicCourseFilter,
  pagination: { page?: string; pageSize?: string },
  sort: string,
): Promise<{ data: PublicCourse[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findPublicCourses(filter, { skip, take }, sort);
  return { data: rows.map(toPublicCourse), meta: buildPaginationMeta(page, pageSize, total) };
}

export async function getPublicCourseModulesBySlug(slug: string) {
  const course = await getPublicCourseBySlug(slug);
  return course.modules;
}

// --- Admin reads -----------------------------------------------------------

export async function getCourseAdmin(id: string): Promise<AdminCourse> {
  const row = await findCourseById(id);
  if (!row) throw AppError.notFound('Course not found');
  return toAdminCourse(row);
}

export async function listCoursesAdmin(
  filter: AdminCourseFilter,
  pagination: { page?: string; pageSize?: string },
  sort: string,
): Promise<{ data: AdminCourse[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findCoursesAdmin(filter, { skip, take }, sort);
  return { data: rows.map(toAdminCourse), meta: buildPaginationMeta(page, pageSize, total) };
}

// --- Instructor-scoped reads/ownership --------------------------------------

/**
 * Broken-object-level-authorization guard (brief's explicit "Instructor can
 * access only assigned courses" / "Instructor accessing another
 * instructor's course" security requirement). Admins bypass this check at
 * the controller layer (they hold `course.update` directly); this function
 * is ONLY called on the instructor-scoped route surface.
 */
export async function assertInstructorOwnsCourse(courseId: string, userId: string): Promise<void> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const assigned = await isUserAssignedToCourse(courseId, userId);
  if (!assigned) {
    // Deliberately AppError.forbidden, not notFound — the course exists,
    // the caller just isn't allowed to touch it. (A public/discovery-layer
    // 404 is used elsewhere to avoid confirming draft existence; this is a
    // different, authenticated-actor context where a 403 is correct and
    // does not leak anything a logged-in instructor couldn't already infer.)
    throw AppError.forbidden('You are not assigned to this course');
  }
}

export async function listCoursesForInstructorUser(
  userId: string,
  pagination: { page?: string; pageSize?: string },
): Promise<{ data: AdminCourse[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findCoursesForInstructor(userId, { skip, take });
  return { data: rows.map(toAdminCourse), meta: buildPaginationMeta(page, pageSize, total) };
}
