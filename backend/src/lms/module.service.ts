import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { findCourseById } from './course.repository';
import {
  findModuleById,
  findModulesByCourse,
  countModulesByCourse,
  createModule,
  updateModule,
  reorderModulePositions,
} from './module.repository';
import { toAdminModule } from './lms.serializers';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import type { AdminCourseModule } from './lms.types';
import type { TransactionClient } from '../database/transaction';

export interface ModuleInput {
  title: string;
  description?: string;
  outcome?: string;
  position?: number;
  estimatedDurationMinutes?: number;
  isMandatory?: boolean;
  isPreview?: boolean;
  prerequisiteModuleId?: string | null;
  releaseRuleType?: string;
  releaseRuleValue?: unknown;
  completionRuleType?: string;
  metadata?: unknown;
}

export interface ModuleUpdateInput extends Partial<ModuleInput> {
  status?: string;
}

/**
 * 004 FR-016 "prerequisite module" safety (Phase 6 Part 1 Correction 3):
 * a prerequisite MUST belong to the same course (no cross-course
 * reference), MUST NOT be the module itself, MUST NOT create a cycle
 * walking the prerequisite chain, and — per the brief's "prevent invalid
 * prerequisite ordering where the specification requires earlier-module
 * dependency" — MUST have a strictly lower `position` than the dependent
 * module (a prerequisite is only meaningful if it comes earlier in the
 * course's sequence).
 */
async function assertValidPrerequisite(
  courseId: string,
  selfModuleId: string | undefined,
  selfPosition: number,
  prerequisiteModuleId: string | null | undefined,
  tx: TransactionClient,
): Promise<void> {
  if (!prerequisiteModuleId) return;

  if (prerequisiteModuleId === selfModuleId) {
    throw AppError.badRequest('A module cannot be its own prerequisite');
  }

  const prerequisite = await findModuleById(prerequisiteModuleId, tx);
  if (!prerequisite) {
    throw AppError.badRequest('Prerequisite module does not exist');
  }
  if (prerequisite.courseId !== courseId) {
    throw AppError.badRequest('Prerequisite module must belong to the same course');
  }
  if (prerequisite.position >= selfPosition) {
    throw AppError.badRequest('Prerequisite module must come earlier in the course sequence');
  }

  // Cycle detection, defense-in-depth: the ordering check directly above
  // (`prerequisite.position < selfPosition`) already makes a TRUE cycle
  // mathematically impossible on its own — a cycle A→B→A would require
  // position(B) < position(A) AND position(A) < position(B)
  // simultaneously, which cannot both hold. This walk exists as a second,
  // independent guard in case a future change (e.g. allowing prerequisite
  // reassignment without a position check, or a raw DB write bypassing
  // this service) ever weakens that invariant — same "belt and
  // suspenders" discipline as the primary-instructor partial unique index
  // (docs/lms/DATA_MODEL.md). Not expected to ever actually trigger while
  // the ordering check remains in place.
  let cursor = prerequisite;
  const visited = new Set<string>([prerequisite.id]);
  while (cursor.prerequisiteModuleId) {
    if (cursor.prerequisiteModuleId === selfModuleId) {
      throw AppError.conflict('This prerequisite assignment would create a circular dependency');
    }
    if (visited.has(cursor.prerequisiteModuleId)) break; // defensive — should be unreachable
    visited.add(cursor.prerequisiteModuleId);
    const next = await findModuleById(cursor.prerequisiteModuleId, tx);
    if (!next) break;
    cursor = next;
  }
}

export async function createCourseModule(
  courseId: string,
  input: ModuleInput,
  actorId: string,
): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');
    if (course.status === 'ARCHIVED' || course.status === 'RETIRED') {
      throw AppError.badRequest(`Cannot add a module to a course with status ${course.status}`);
    }

    // Append at the end by default — explicit position is honored but
    // must be unique per (courseId, position); a supplied duplicate
    // position surfaces as a normalized 409 via the unique-constraint
    // catch below, rather than a confusing raw Prisma error.
    const nextPosition = input.position ?? (await countModulesByCourse(courseId, tx));

    await assertValidPrerequisite(courseId, undefined, nextPosition, input.prerequisiteModuleId, tx);

    const module_ = await createModule(
      {
        course: { connect: { id: courseId } },
        title: input.title,
        description: input.description,
        outcome: input.outcome,
        position: nextPosition,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        isMandatory: input.isMandatory ?? true,
        isPreview: input.isPreview ?? false,
        ...(input.prerequisiteModuleId ? { prerequisiteModule: { connect: { id: input.prerequisiteModuleId } } } : {}),
        releaseRuleType: (input.releaseRuleType ?? 'IMMEDIATE') as never,
        releaseRuleValue: input.releaseRuleValue as never,
        completionRuleType: (input.completionRuleType ?? 'MANUAL') as never,
        metadata: input.metadata as never,
        createdBy: actorId,
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
        action: 'lms.module.created',
        resourceType: 'course_module',
        resourceId: module_.id,
        metadata: { courseId },
      },
      tx,
    );

    return toAdminModule(module_);
  });
}

export async function updateCourseModule(
  moduleId: string,
  input: ModuleUpdateInput,
  actorId: string,
): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');

    if (input.prerequisiteModuleId !== undefined) {
      await assertValidPrerequisite(existing.courseId, moduleId, existing.position, input.prerequisiteModuleId, tx);
    }

    const updated = await updateModule(
      moduleId,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
        ...(input.estimatedDurationMinutes !== undefined
          ? { estimatedDurationMinutes: input.estimatedDurationMinutes }
          : {}),
        ...(input.isMandatory !== undefined ? { isMandatory: input.isMandatory } : {}),
        ...(input.isPreview !== undefined ? { isPreview: input.isPreview } : {}),
        ...(input.prerequisiteModuleId !== undefined
          ? input.prerequisiteModuleId === null
            ? { prerequisiteModule: { disconnect: true } }
            : { prerequisiteModule: { connect: { id: input.prerequisiteModuleId } } }
          : {}),
        ...(input.releaseRuleType !== undefined ? { releaseRuleType: input.releaseRuleType as never } : {}),
        ...(input.releaseRuleValue !== undefined ? { releaseRuleValue: input.releaseRuleValue as never } : {}),
        ...(input.completionRuleType !== undefined ? { completionRuleType: input.completionRuleType as never } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
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
        action: 'lms.module.updated',
        resourceType: 'course_module',
        resourceId: moduleId,
        beforeState: { title: existing.title, status: existing.status },
        afterState: { title: updated.title, status: updated.status },
      },
      tx,
    );

    return toAdminModule(updated);
  });
}

export async function archiveCourseModule(moduleId: string, actorId: string): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');
    if (existing.status === 'ARCHIVED') throw AppError.conflict('Module is already archived');

    // Archive only — never hard-delete (brief: "Module lifecycle must not
    // silently delete future lesson data"; a future Lesson FK to this
    // module must never be silently orphaned by a Part-1-only action).
    // Any OTHER module whose prerequisite points at this one keeps that
    // reference (archiving is not deletion — the FK is still valid); a
    // future Part 2 enforcement engine is responsible for deciding
    // whether an archived prerequisite should be treated as satisfied.
    const updated = await updateModule(moduleId, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.module.archived', resourceType: 'course_module', resourceId: moduleId },
      tx,
    );

    return toAdminModule(updated);
  });
}

/**
 * FR-038 "Instructor-Controlled (instructor manually releases content)" /
 * FR-034 "instructor release" — the WRITE half of `INSTRUCTOR_RELEASE`
 * module gating. Added during the Phase 6 Part 2 database-verification
 * pass: the prior implementation only ever READ `manuallyReleasedAt`
 * (`access-evaluator.service.ts`'s `isModuleReleased`) — there was no way
 * for anyone to actually set it, which left "instructor manually releases
 * content" permanently unsatisfiable. Not blocked by any Part 3 entity or
 * unresolved product decision, so implemented now rather than deferred.
 *
 * Idempotent (a repeat release call is a safe no-op — `manuallyReleasedAt`
 * is set once and never overwritten to a later timestamp), transactional,
 * and audited. Deliberately does NOT require a `reason` — unlike FR-113's
 * completion overrides, FR-038 does not describe release as a correction
 * needing justification, just an authoring/publishing action (the same
 * tier as `postArchiveModule`/`postRestoreModule` above, neither of which
 * require a reason either).
 */
export async function releaseModuleNow(moduleId: string, actorId: string, idempotencyKey?: string): Promise<AdminCourseModule> {
  const key = scopedIdempotencyKey(actorId, idempotencyKey, moduleId);
  const outcome = await beginIdempotentOperation<AdminCourseModule>('lms.module.release', key, { moduleId });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent module release has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('A release request for this module is already in progress');
  }

  try {
    const result = await withTransaction(async (tx) => {
      const existing = await findModuleById(moduleId, tx);
      if (!existing) throw AppError.notFound('Module not found');
      if (existing.releaseRuleType !== 'INSTRUCTOR_RELEASE') {
        throw AppError.badRequest(
          `This module's release rule is ${existing.releaseRuleType}, not INSTRUCTOR_RELEASE — manual release does not apply`,
        );
      }

      // Idempotent: already-released stays at its original timestamp —
      // never bumped forward by a repeat call.
      if (existing.manuallyReleasedAt) {
        return toAdminModule(existing);
      }

      const updated = await updateModule(moduleId, { manuallyReleasedAt: new Date(), updatedBy: actorId }, tx).catch(
        (error: unknown) => {
          throw normalizeDatabaseError(error);
        },
      );

      await recordAuditEvent(
        { actorType: 'USER', actorId, action: 'lms.module.released', resourceType: 'course_module', resourceId: moduleId },
        tx,
      );

      return toAdminModule(updated);
    });

    await outcome.complete(result);
    return result;
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

export async function restoreCourseModule(moduleId: string, actorId: string): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');
    if (existing.status !== 'ARCHIVED') throw AppError.conflict('Module is not archived');

    const updated = await updateModule(moduleId, { status: 'DRAFT', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.module.restored', resourceType: 'course_module', resourceId: moduleId },
      tx,
    );

    return toAdminModule(updated);
  });
}

/**
 * Transactional reorder — all `orderedIds` must belong to `courseId`
 * (rejects unknown IDs and cross-course mixing, the exact "Reorder
 * manipulation" / "Validate all IDs belong to the same parent scope"
 * security requirement from the brief) and must be exactly the course's
 * full current module set (no silent partial reorder).
 *
 * CORRECTION: also rejects a reorder that would place any module with a
 * `prerequisiteModuleId` at or before its prerequisite's new position —
 * reordering must not silently invalidate the "prerequisite comes earlier"
 * invariant `assertValidPrerequisite` enforces at create/update time.
 */
export async function reorderCourseModules(courseId: string, orderedIds: string[], actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');

    const existing = await findModulesByCourse(courseId, tx);
    const existingIds = new Set(existing.map((m) => m.id));

    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw AppError.badRequest('orderedIds must contain exactly this course\'s modules, no more and no fewer');
    }

    const newPositionById = new Map(orderedIds.map((id, index) => [id, index]));
    for (const module_ of existing) {
      if (!module_.prerequisiteModuleId) continue;
      const ownNewPosition = newPositionById.get(module_.id)!;
      const prereqNewPosition = newPositionById.get(module_.prerequisiteModuleId);
      if (prereqNewPosition !== undefined && prereqNewPosition >= ownNewPosition) {
        throw AppError.badRequest(
          `Invalid reorder: module "${module_.title}" would be placed at or before its prerequisite`,
        );
      }
    }

    await reorderModulePositions(courseId, orderedIds, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.module.reordered',
        resourceType: 'course',
        resourceId: courseId,
        afterState: { orderedIds },
      },
      tx,
    );
  });
}

export async function listModulesForCourseAdmin(courseId: string): Promise<AdminCourseModule[]> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  const modules = await findModulesByCourse(courseId);
  return modules.map(toAdminModule);
}

export async function getModuleAdmin(moduleId: string): Promise<AdminCourseModule> {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  return toAdminModule(module_);
}
