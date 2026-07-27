import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findCourseById } from './course.repository';
import {
  findInstructorAssignment,
  findInstructorsByCourse,
  createInstructorAssignment,
  clearPrimaryForCourse,
  setInstructorPrimary,
  removeInstructorAssignment,
  findUserById,
} from './instructor.repository';
import { toPublicInstructor } from './lms.serializers';
import type { PublicCourseInstructor } from './lms.types';

export interface AssignInstructorInput {
  userId: string;
  role?: string;
  isPrimary?: boolean;
}

export async function assignInstructor(
  courseId: string,
  input: AssignInstructorInput,
  actorId: string,
): Promise<PublicCourseInstructor> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');

    // "Instructor must be a valid existing user" — never trust a
    // client-supplied userId without a database check.
    const user = await findUserById(input.userId, tx);
    if (!user || user.status === 'DELETED') {
      throw AppError.badRequest('Invalid instructor: user does not exist');
    }

    const existing = await findInstructorAssignment(courseId, input.userId, tx);
    if (existing) {
      throw AppError.conflict('This user is already assigned as an instructor on this course');
    }

    let finalIsPrimary = input.isPrimary ?? false;
    if (finalIsPrimary) {
      // Enforce "at most one primary instructor" transactionally at the
      // application layer, on top of the migration's own partial-unique-
      // index defense-in-depth (docs/lms/DATA_MODEL.md).
      await clearPrimaryForCourse(courseId, tx);
    } else {
      // If this is the course's first instructor at all, make them
      // primary automatically — a course should never end up with zero
      // primary instructors after its first assignment.
      const anyInstructors = await tx.courseInstructor.count({ where: { courseId } });
      if (anyInstructors === 0) {
        finalIsPrimary = true;
      }
    }

    const assignment = await createInstructorAssignment(
      {
        course: { connect: { id: courseId } },
        user: { connect: { id: input.userId } },
        role: (input.role ?? 'INSTRUCTOR') as never,
        isPrimary: finalIsPrimary,
        createdBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.instructor.assigned',
        resourceType: 'course',
        resourceId: courseId,
        afterState: { userId: input.userId, role: assignment.role, isPrimary: assignment.isPrimary },
      },
      tx,
    );

    return toPublicInstructor({
      userId: assignment.userId,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      user: { profile: user.profile },
    });
  });
}

export async function removeInstructor(courseId: string, userId: string, actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const existing = await findInstructorAssignment(courseId, userId, tx);
    if (!existing) throw AppError.notFound('Instructor assignment not found');

    const instructorCount = await tx.courseInstructor.count({ where: { courseId } });
    if (instructorCount <= 1) {
      throw AppError.conflict('Cannot remove the only instructor assigned to a course');
    }

    await removeInstructorAssignment(courseId, userId, tx).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    // If the removed instructor was primary, promote the next-earliest
    // remaining instructor rather than leaving the course with none.
    if (existing.isPrimary) {
      const remaining = await tx.courseInstructor.findFirst({ where: { courseId }, orderBy: { createdAt: 'asc' } });
      if (remaining) {
        await setInstructorPrimary(courseId, remaining.userId, true, tx);
      }
    }

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.instructor.removed',
        resourceType: 'course',
        resourceId: courseId,
        beforeState: { userId },
      },
      tx,
    );
  });
}

export async function setPrimaryInstructor(courseId: string, userId: string, actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const existing = await findInstructorAssignment(courseId, userId, tx);
    if (!existing) throw AppError.notFound('Instructor assignment not found');
    if (existing.isPrimary) return; // Already primary — no-op, not an error.

    await clearPrimaryForCourse(courseId, tx);
    await setInstructorPrimary(courseId, userId, true, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.instructor.primary_changed',
        resourceType: 'course',
        resourceId: courseId,
        afterState: { newPrimaryUserId: userId },
      },
      tx,
    );
  });
}

export async function listInstructorsForCourse(courseId: string): Promise<PublicCourseInstructor[]> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  const rows = await findInstructorsByCourse(courseId);
  return rows.map(toPublicInstructor);
}
