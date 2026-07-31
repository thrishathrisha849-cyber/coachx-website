import { HttpStatus, ERROR_CODES } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { findLessonById, findLessonsByModule } from './lesson.repository';
import { findModuleById, findModulesByCourse } from './module.repository';
import { findActivitiesByLesson } from './activity.repository';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { findLessonProgress, findLessonProgressForEnrollment, upsertLessonProgress } from './progress.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import { MAX_TIME_SPENT_DELTA_SECONDS } from './progress.validation';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import { recordLearningEvent } from './learning-event.service';
import { recordLearningTimeForStreak } from './learning-streak.service';
import { applyMandatoryMigrationIfDue } from './course-version.service';
import { isModuleProjectsComplete } from './project.service';
import type { TransactionClient } from '../database/transaction';

export interface ProgressUpdateInput {
  timeSpentDeltaSeconds?: number;
  watchedPercent?: number;
  lastPosition?: unknown;
}

/**
 * CORRECTION (Part 2 correction pass, "Progress event safety" /
 * "reject cross-activity and cross-lesson signals") — which
 * `LearningActivityType`s a given `lastPosition.kind` is a legitimate
 * report for. A `video` position reported against a lesson that only has
 * a PDF/ARTICLE activity is a signal that does not belong to this lesson
 * at all (either a client bug or a forged cross-lesson/cross-activity
 * payload) and is now rejected rather than silently stored.
 */
const POSITION_KIND_TO_ACTIVITY_TYPES: Record<string, string[]> = {
  video: ['VIDEO'],
  audio: ['AUDIO'],
  article: ['ARTICLE'],
  pdf: ['PDF'],
};

async function assertLastPositionMatchesLessonActivities(lessonId: string, lastPosition: unknown): Promise<void> {
  if (!lastPosition || typeof lastPosition !== 'object' || !('kind' in lastPosition)) return;
  const kind = (lastPosition as { kind: unknown }).kind;
  if (typeof kind !== 'string') return;

  const allowedTypes = POSITION_KIND_TO_ACTIVITY_TYPES[kind];
  if (!allowedTypes) return; // unrecognized kind — Zod already rejects this at the HTTP layer; nothing further to check here

  const activities = await findActivitiesByLesson(lessonId);
  const hasMatchingActivity = activities.some((a) => a.status === 'PUBLISHED' && allowedTypes.includes(a.type));
  if (!hasMatchingActivity) {
    throw AppError.badRequest(`This lesson has no ${kind} activity — lastPosition.kind does not match any of this lesson's content`, {
      lessonId,
      kind,
    });
  }
}

/**
 * Resolves the (course, module, enrollment) chain for a lesson update and
 * runs it through the SAME access evaluator every other read path uses —
 * a learner can never post progress for a lesson they cannot access,
 * closing the "anti-cross-course" / "learner writes progress for content
 * they don't have access to" gap explicitly named in Part 2B.
 */
async function resolveLessonContext(userId: string, lessonId: string) {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Lesson not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lessonId);
  if (!access.allowed) {
    throw new AppError(access.message, HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, { reason: access.reason, ...access.detail });
  }

  // Preview access never implies an enrollment/progress row — FR-018
  // preview status is read-only exposure, not a substitute for enrolling.
  if (access.viaPreview) {
    throw AppError.badRequest('Enroll in this course to track progress on this lesson');
  }

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  return { lesson, module: module_, enrollment };
}

/**
 * CORRECTION (Part 2 correction pass) — progress updates now support an
 * OPTIONAL `Idempotency-Key` header for a "discrete event" post (e.g. "the
 * learner finished watching this video," a single meaningful checkpoint) —
 * when supplied, the SAME (actor, lesson, key, payload) tuple replays its
 * original result rather than double-applying the update. This is
 * deliberately NOT required and NOT forced for every call: a high-
 * frequency playback heartbeat (e.g. once every few seconds) would create
 * one `IdempotencyKey` row per heartbeat if forced through this path,
 * which the correction brief itself calls out as unsafe/wasteful. The
 * safety net for the un-keyed heartbeat case is instead the ALREADY-BUILT
 * monotonic/anti-rollback strategy below (`Math.max` on percentage,
 * additive-but-bounded time-spent) — a duplicate or out-of-order heartbeat
 * is naturally safe without needing a ledger row per call. See
 * docs/lms/PROGRESS_ENGINE.md's "Idempotency strategy" section.
 */
export async function updateLessonProgress(userId: string, lessonId: string, input: ProgressUpdateInput, idempotencyKey?: string) {
  await assertLastPositionMatchesLessonActivities(lessonId, input.lastPosition);
  const { enrollment } = await resolveLessonContext(userId, lessonId);

  // FR-109 COURSE_STARTED — fired once, the first time this enrollment
  // records any progress at all (`lastAccessedAt` is only ever null before
  // the first touch — see this file's own `applyProgressUpdate` below,
  // which sets it unconditionally on every call). Best-effort: under a
  // genuine race this could fire twice, which is harmless for an
  // analytics event (unlike a financial/entitlement record).
  if (enrollment.lastAccessedAt === null) {
    await recordLearningEvent({ eventType: 'COURSE_STARTED', userId, courseId: enrollment.courseId, enrollmentId: enrollment.id });
  }

  if (idempotencyKey) {
    const key = scopedIdempotencyKey(userId, idempotencyKey, lessonId);
    const outcome = await beginIdempotentOperation<Awaited<ReturnType<typeof applyProgressUpdate>>>('lms.progress.discrete_event', key, {
      lessonId,
      input,
    });

    if (outcome.status === 'replayed') {
      if (!outcome.response) throw AppError.internal('Idempotent progress update has no cached response');
      return outcome.response;
    }
    if (outcome.status === 'in-progress') {
      throw AppError.conflict('A progress update for this lesson with this key is already in progress');
    }

    try {
      const result = await applyProgressUpdate(enrollment.id, lessonId, input, userId, enrollment.courseId);
      await outcome.complete(result);
      return result;
    } catch (error) {
      await outcome.fail();
      throw error;
    }
  }

  return applyProgressUpdate(enrollment.id, lessonId, input, userId, enrollment.courseId);
}

async function applyProgressUpdate(enrollmentId: string, lessonId: string, input: ProgressUpdateInput, userId: string, courseId: string) {
  return withTransaction(async (tx) => {
    const existing = await findLessonProgress(enrollmentId, lessonId, tx);
    const now = new Date();

    // Anti-rollback: percentage only ever moves forward (server takes the
    // max of stored vs. this request's observed value) — a client
    // re-sending a lower value (e.g. after a local cache reset) can never
    // erase already-recorded progress.
    const priorPercent = existing?.percentage ?? 0;
    const observedPercent = input.watchedPercent !== undefined ? Math.round(input.watchedPercent) : priorPercent;
    const nextPercent = Math.max(priorPercent, Math.min(100, observedPercent));

    // Bounded time-spent increment, clamped again server-side even though
    // the Zod schema already bounds a single request — defense in depth
    // for any future caller that bypasses the HTTP validation layer.
    const delta = Math.max(0, Math.min(input.timeSpentDeltaSeconds ?? 0, MAX_TIME_SPENT_DELTA_SECONDS));
    const priorTimeSpent = existing?.timeSpentSeconds ?? 0;

    // A lesson already COMPLETED never regresses to IN_PROGRESS from a
    // routine progress ping — completion is only reversed via an explicit,
    // audited admin/instructor RESET (completion.service.ts), never a
    // learner's own playback telemetry.
    const nextStatus = existing?.status === 'COMPLETED' ? 'COMPLETED' : nextPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    const updated = await upsertLessonProgress(
      enrollmentId,
      lessonId,
      {
        enrollmentId,
        lessonId,
        status: nextStatus as never,
        percentage: nextPercent,
        timeSpentSeconds: priorTimeSpent + delta,
        lastPosition: (input.lastPosition ?? existing?.lastPosition ?? undefined) as never,
        startedAt: existing?.startedAt ?? now,
        lastAccessedAt: now,
      },
      {
        status: nextStatus as never,
        percentage: nextPercent,
        timeSpentSeconds: priorTimeSpent + delta,
        ...(input.lastPosition !== undefined ? { lastPosition: input.lastPosition as never } : {}),
        lastAccessedAt: now,
        version: { increment: 1 },
      },
      tx,
    );

    await tx.enrollment.update({ where: { id: enrollmentId }, data: { lastAccessedAt: now } });

    // FR-109 VIDEO_STARTED/VIDEO_PROGRESSED — coarse-grained (one row per
    // progress-update request, not per playback heartbeat — same "do not
    // audit every heartbeat" discipline this file's own
    // `recordProgressAuditCheckpoint` doc comment already establishes).
    const positionKind = (input.lastPosition as { kind?: string } | undefined)?.kind;
    if (positionKind === 'video') {
      await recordLearningEvent(
        { eventType: existing ? 'VIDEO_PROGRESSED' : 'VIDEO_STARTED', userId, courseId, lessonId, enrollmentId, metadata: { watchedPercent: nextPercent } },
        tx,
      );
    }

    // FR-057 Learning Streak — "minimum learning time" qualifying action.
    // Reuses `delta`, the SAME server-bounded value (already clamped by
    // `MAX_TIME_SPENT_DELTA_SECONDS` above) `LessonProgress.timeSpentSeconds`
    // itself trusts — not a new gameable input.
    await recordLearningTimeForStreak(userId, delta, tx);

    return updated;
  });
}

/** Per-module derived progress — NEVER stored, always computed from `LessonProgress` (see schema.prisma's `LessonProgress` doc comment for why). */
export async function computeModuleProgress(enrollmentId: string, moduleId: string, tx?: TransactionClient) {
  const lessons = (await findLessonsByModule(moduleId, tx)).filter((l) => l.status === 'PUBLISHED');
  const mandatory = lessons.filter((l) => l.isMandatory);
  const progressRows = await findLessonProgressForEnrollment(enrollmentId, tx);
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  const completedMandatory = mandatory.filter((l) => progressByLesson.get(l.id)?.status === 'COMPLETED').length;
  const percentage = mandatory.length === 0 ? 100 : Math.round((completedMandatory / mandatory.length) * 100);
  const lessonsComplete = mandatory.length === 0 ? lessons.length === 0 : completedMandatory === mandatory.length;

  // 004 Project-based Learning batch (FR-077) — "project status MUST
  // connect to module completion." A real, enforced gate: a module whose
  // lessons are all otherwise complete still is NOT complete while a
  // PUBLISHED project's required artifacts remain un-approved. Vacuously
  // true for a module with no project (see `isModuleProjectsComplete`'s
  // own doc comment).
  const projectsComplete = await isModuleProjectsComplete(enrollmentId, moduleId, tx);

  return {
    totalLessons: lessons.length,
    totalMandatoryLessons: mandatory.length,
    completedMandatoryLessons: completedMandatory,
    percentage,
    isComplete: lessonsComplete && projectsComplete,
    projectsComplete,
    // Per-lesson status for the lesson-player curriculum sidebar (US2) —
    // additive field, existing callers (`completion.service.ts`'s
    // `isModuleCompleteForEnrollment`) only read `.isComplete` and are
    // unaffected.
    lessons: lessons
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ id: l.id, status: progressByLesson.get(l.id)?.status ?? 'NOT_STARTED' })),
  };
}

/** Per-course derived progress — aggregates every published module's `computeModuleProgress` (FR-054: mandatory-only weighting, the recommended default). */
export async function computeCourseProgress(enrollmentId: string, courseId: string, tx?: TransactionClient) {
  const modules = (await findModulesByCourse(courseId, tx)).filter((m) => m.status === 'PUBLISHED');
  const moduleProgress = await Promise.all(modules.map((m) => computeModuleProgress(enrollmentId, m.id, tx)));

  const mandatoryModules = modules.filter((m) => m.isMandatory);
  const mandatoryModuleProgress = moduleProgress.filter((_, i) => modules[i].isMandatory);
  const completedMandatoryModules = mandatoryModuleProgress.filter((p) => p.isComplete).length;
  const percentage =
    mandatoryModules.length === 0 ? 100 : Math.round((completedMandatoryModules / mandatoryModules.length) * 100);

  return {
    totalModules: modules.length,
    totalMandatoryModules: mandatoryModules.length,
    completedMandatoryModules,
    percentage,
    isComplete: mandatoryModules.length === 0 ? modules.length === 0 : completedMandatoryModules === mandatoryModules.length,
    modules: modules.map((m, i) => ({ moduleId: m.id, title: m.title, ...moduleProgress[i] })),
  };
}

export async function getCourseProgressForLearner(userId: string, courseId: string) {
  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  // FR-099 "mandatory migration" — the real read-time enforcement point
  // (no background job scheduler exists in this codebase). Idempotent —
  // a no-op once this enrollment is already migrated to the due version.
  await applyMandatoryMigrationIfDue(userId, enrollment.id, courseId);

  return computeCourseProgress(enrollment.id, courseId);
}

/** Audited, explicit acknowledgment — records a `lms.progress.session` audit event ONLY at a coarse grain (never per-heartbeat, per Part 2B's explicit "do not audit every playback heartbeat"). Reserved for future use by a session-boundary event; not currently invoked by any route (documented limitation — heartbeat-level engagement analytics are out of Part 2's scope). */
export async function recordProgressAuditCheckpoint(enrollmentId: string, lessonId: string, actorId: string) {
  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.progress.updated',
    resourceType: 'lesson_progress',
    resourceId: `${enrollmentId}:${lessonId}`,
  });
}
