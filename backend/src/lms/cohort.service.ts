import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findCourseById } from './course.repository';
import { findModuleById } from './module.repository';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import {
  createCohort as createCohortRow,
  updateCohort as updateCohortRow,
  findCohortById,
  findCohortsForCourse,
  createCohortMember,
  deleteCohortMember,
  findCohortMemberById,
  findCohortMembersForCohort,
  countCohortMembers,
  upsertCohortModuleSchedule as upsertCohortModuleScheduleRow,
  findCohortModuleSchedulesForCohort,
  deleteCohortModuleSchedule as deleteCohortModuleScheduleRow,
} from './cohort.repository';
import { toAdminCohort, toAdminCohortMember, toAdminCohortModuleSchedule } from './cohort.serializers';
import type { AdminCohort, AdminCohortMember, AdminCohortModuleSchedule } from './cohort.types';

/**
 * 004 Cohort entity batch (T085, FR-012). See `schema.prisma`'s own
 * `Cohort`/`CohortMember`/`CohortModuleSchedule` doc comments for the full
 * scope rationale (attached to a Course, not a Program; instructor team
 * reuses the course's own `CourseInstructor`s; mentor team/community
 * group/live schedule are honestly out of scope — no owning
 * infrastructure exists).
 */

export interface CohortInput {
  name: string;
  startDate: string;
  endDate?: string | null;
  timezone: string;
  capacity?: number | null;
}

export type CohortUpdateInput = Partial<CohortInput> & { status?: string };

export async function createCourseCohort(courseId: string, input: CohortInput, actorId: string): Promise<AdminCohort> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const cohort = await createCohortRow({
    course: { connect: { id: courseId } },
    name: input.name,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : null,
    timezone: input.timezone,
    capacity: input.capacity ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  }).catch((error: unknown) => {
    throw normalizeDatabaseError(error);
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.cohort.created',
    resourceType: 'cohort',
    resourceId: cohort.id,
    afterState: { courseId, name: input.name, startDate: input.startDate },
  });

  return toAdminCohort(cohort, 0);
}

export async function updateCourseCohort(cohortId: string, input: CohortUpdateInput, actorId: string): Promise<AdminCohort> {
  const existing = await findCohortById(cohortId);
  if (!existing) throw AppError.notFound('Cohort not found');

  const updated = await updateCohortRow(cohortId, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
    ...(input.endDate !== undefined ? { endDate: input.endDate ? new Date(input.endDate) : null } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
    ...(input.status !== undefined ? { status: input.status as never } : {}),
    updatedBy: actorId,
  }).catch((error: unknown) => {
    throw normalizeDatabaseError(error);
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.cohort.updated',
    resourceType: 'cohort',
    resourceId: cohortId,
    beforeState: { name: existing.name, status: existing.status },
    afterState: { name: updated.name, status: updated.status },
  });

  return toAdminCohort(updated);
}

export async function listCohortsForCourseAdmin(courseId: string): Promise<AdminCohort[]> {
  const rows = await findCohortsForCourse(courseId);
  const withCounts = await Promise.all(rows.map(async (c) => toAdminCohort(c, await countCohortMembers(c.id))));
  return withCounts;
}

export async function getCohortAdmin(cohortId: string): Promise<AdminCohort> {
  const row = await findCohortById(cohortId);
  if (!row) throw AppError.notFound('Cohort not found');
  return toAdminCohort(row, await countCohortMembers(cohortId));
}

/**
 * FR-012 "learner list." The learner must already hold a real `Enrollment`
 * for the cohort's course (a cohort assignment is never a parallel roster
 * with no underlying access grant — see `CohortMember`'s own doc
 * comment). Capacity, where set, is enforced the same "count existing
 * seat-occupants, reject over the limit" way `Course.enrollmentLimit`
 * already is.
 */
export async function addCohortMember(cohortId: string, userId: string, actorId: string): Promise<AdminCohortMember> {
  return withTransaction(async (tx) => {
    const cohort = await findCohortById(cohortId, tx);
    if (!cohort) throw AppError.notFound('Cohort not found');

    const enrollment = await findEnrollmentForUserAndCourse(userId, cohort.courseId, tx);
    if (!enrollment) throw AppError.badRequest('This learner must be enrolled in the course before joining a cohort');

    if (cohort.capacity !== null) {
      const count = await countCohortMembers(cohortId, tx);
      if (count >= cohort.capacity) throw AppError.conflict('This cohort has reached its configured capacity');
    }

    const member = await createCohortMember(
      {
        cohort: { connect: { id: cohortId } },
        user: { connect: { id: userId } },
        enrollment: { connect: { id: enrollment.id } },
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.cohort.member_added', resourceType: 'cohort', resourceId: cohortId, afterState: { userId } },
      tx,
    );

    return toAdminCohortMember(member);
  });
}

export async function removeCohortMember(cohortId: string, memberId: string, actorId: string): Promise<void> {
  const member = await findCohortMemberById(memberId);
  if (!member || member.cohortId !== cohortId) throw AppError.notFound('Cohort member not found');

  await deleteCohortMember(memberId);

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.cohort.member_removed',
    resourceType: 'cohort',
    resourceId: cohortId,
    beforeState: { userId: member.userId },
  });
}

export async function listCohortMembersAdmin(cohortId: string): Promise<AdminCohortMember[]> {
  const rows = await findCohortMembersForCohort(cohortId);
  return rows.map(toAdminCohortMember);
}

/**
 * FR-034 "cohort schedule" — the actual per-cohort, per-module unlock
 * date `access-evaluator.service.ts`'s `COHORT_SCHEDULE` branch reads.
 */
export async function setCohortModuleSchedule(cohortId: string, moduleId: string, unlockAt: string, actorId: string): Promise<AdminCohortModuleSchedule> {
  const cohort = await findCohortById(cohortId);
  if (!cohort) throw AppError.notFound('Cohort not found');

  const module_ = await findModuleById(moduleId);
  if (!module_ || module_.courseId !== cohort.courseId) throw AppError.badRequest('This module does not belong to the cohort’s course');

  const date = new Date(unlockAt);
  if (Number.isNaN(date.getTime())) throw AppError.badRequest('unlockAt must be a valid date');

  const schedule = await upsertCohortModuleScheduleRow(cohortId, moduleId, date);

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.cohort.module_schedule_set',
    resourceType: 'cohort',
    resourceId: cohortId,
    afterState: { moduleId, unlockAt: date.toISOString() },
  });

  return toAdminCohortModuleSchedule(schedule);
}

export async function removeCohortModuleSchedule(cohortId: string, moduleId: string, actorId: string): Promise<void> {
  const existing = await findCohortModuleSchedulesForCohort(cohortId);
  if (!existing.some((s) => s.moduleId === moduleId)) throw AppError.notFound('No schedule set for this module in this cohort');

  await deleteCohortModuleScheduleRow(cohortId, moduleId);

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.cohort.module_schedule_removed',
    resourceType: 'cohort',
    resourceId: cohortId,
    beforeState: { moduleId },
  });
}

export async function listCohortModuleSchedulesAdmin(cohortId: string): Promise<AdminCohortModuleSchedule[]> {
  const rows = await findCohortModuleSchedulesForCohort(cohortId);
  return rows.map(toAdminCohortModuleSchedule);
}
