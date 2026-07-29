import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { getPrismaClient } from '../database/prisma-client';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { assertValidEnrollmentTransition } from './enrollment.policy';
import { findEnrollmentById, findEnrollmentForUserAndCourse, updateEnrollment, completeEnrollmentIfStatus } from './enrollment.repository';
import { findLessonById, findLessonsByModule } from './lesson.repository';
import { findModuleById, findModulesByCourse } from './module.repository';
import { findActivitiesByLesson } from './activity.repository';
import { findLessonProgress, upsertLessonProgress } from './progress.repository';
import { findActivityProgressForLesson, upsertActivityViewed } from './activity-progress.repository';
import { evaluateLessonAccess, isModulePrerequisiteSatisfied } from './access-evaluator.service';
import { computeModuleProgress } from './progress.service';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import { findQuizByLessonId, hasPassedQuiz } from './quiz.repository';
import { findAssignmentByLessonId, hasApprovedSubmission } from './assignment.repository';
import { recordLearningEvent } from './learning-event.service';
import type { TransactionClient } from '../database/transaction';

/**
 * Phase 6 Part 2B — the centralized Lesson/Module/Course completion
 * engine. Every completion write in this module (learner self-complete,
 * signal-derived auto-complete, instructor approval, admin override) goes
 * through `completeLessonForEnrollment` — never a bare
 * `lessonProgress.update({ status: 'COMPLETED' })` scattered across
 * controllers.
 *
 * Idempotent by construction: completing an already-COMPLETED lesson is a
 * silent no-op (same `completedAt`, no duplicate audit event, no error) —
 * "anti-duplicate-completion" per Part 2B.
 *
 * See docs/lms/COMPLETION_ENGINE.md for the full rule-support matrix this
 * file implements (Correction 3 of the Part 2 correction pass).
 */
export async function completeLessonForEnrollment(
  enrollmentId: string,
  lessonId: string,
  source: 'MANUAL_LEARNER' | 'SIGNAL_DERIVED' | 'INSTRUCTOR_OVERRIDE' | 'ADMIN_OVERRIDE',
  actorId: string,
  tx: TransactionClient,
): Promise<{ alreadyCompleted: boolean }> {
  const existing = await findLessonProgress(enrollmentId, lessonId, tx);
  if (existing?.status === 'COMPLETED') return { alreadyCompleted: true };

  const now = new Date();
  await upsertLessonProgress(
    enrollmentId,
    lessonId,
    {
      enrollmentId,
      lessonId,
      status: 'COMPLETED' as never,
      percentage: 100,
      timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
      startedAt: existing?.startedAt ?? now,
      lastAccessedAt: now,
      completedAt: now,
      completionSource: source as never,
    },
    {
      status: 'COMPLETED' as never,
      percentage: 100,
      lastAccessedAt: now,
      completedAt: now,
      completionSource: source as never,
      version: { increment: 1 },
    },
    tx,
  );

  await recordAuditEvent(
    { actorType: 'USER', actorId, action: 'lms.lesson.completed', resourceType: 'lesson_progress', resourceId: `${enrollmentId}:${lessonId}`, metadata: { source } },
    tx,
  );

  // FR-109 LESSON_COMPLETED — attributed to the enrollment's own learner,
  // never `actorId` (which is the ADMIN/instructor for an override
  // completion, not the learner the analytics row is about).
  const owningEnrollment = await findEnrollmentById(enrollmentId, tx);
  if (owningEnrollment) {
    await recordLearningEvent(
      { eventType: 'LESSON_COMPLETED', userId: owningEnrollment.userId, courseId: owningEnrollment.courseId, lessonId, enrollmentId, metadata: { source } },
      tx,
    );
  }

  return { alreadyCompleted: false };
}

// =============================================================================
// CORRECTION — completion-rule evaluation (replaces the removed
// ALL_ACTIVITIES_VIEWED === MANUAL alias and adds real multi-condition
// support per FR-052: "MUST allow a single lesson to combine multiple
// required conditions.")
// =============================================================================

type EffectiveRule = 'MANUAL' | 'MINIMUM_WATCH_PERCENT' | 'ALL_ACTIVITIES_VIEWED' | 'INSTRUCTOR_APPROVAL' | 'QUIZ_PASS' | 'ASSIGNMENT_APPROVED';

/**
 * The authoritative set of completion conditions for a lesson. Prefers the
 * new, additive `completionRuleTypes` array (Correction 4's multi-
 * condition fix) when non-empty; falls back to the original singular
 * `completionRuleType` wrapped as a one-element array for full backward
 * compatibility with every lesson created before this correction pass.
 */
export function getEffectiveCompletionRules(lesson: { completionRuleType: string; completionRuleTypes: string[] }): EffectiveRule[] {
  const rules = lesson.completionRuleTypes.length > 0 ? lesson.completionRuleTypes : [lesson.completionRuleType];
  return rules as EffectiveRule[];
}

/**
 * CORRECTION: real, server-derived `ALL_ACTIVITIES_VIEWED` evaluation.
 * Every PUBLISHED `LearningActivity` attached to the lesson is treated as
 * required (LearningActivity has no independent optional/required flag in
 * Part 2 — see docs/lms/LEARNING_ACTIVITIES.md; "required vs optional
 * activity behavior" is therefore NOT independently configurable, a
 * documented, honest limitation, not a silent gap). A lesson with zero
 * published activities is trivially satisfied (nothing to view).
 *
 * The server NEVER trusts a client-supplied "all viewed" boolean — this
 * function always re-derives the answer from `ActivityProgress` rows.
 */
export async function areAllRequiredActivitiesViewed(enrollmentId: string, lessonId: string, tx?: TransactionClient): Promise<boolean> {
  const activities = (await findActivitiesByLesson(lessonId, tx)).filter((a) => a.status === 'PUBLISHED');
  if (activities.length === 0) return true;

  const viewedRows = await findActivityProgressForLesson(enrollmentId, lessonId, tx);
  const viewedActivityIds = new Set(viewedRows.filter((r) => r.viewedAt !== null).map((r) => r.activityId));
  return activities.every((a) => viewedActivityIds.has(a.id));
}

interface AutomaticRuleEvaluation {
  /** Every non-MANUAL rule in the effective set that IS currently satisfied. */
  met: EffectiveRule[];
  /** Every non-MANUAL rule in the effective set that is NOT yet satisfied. */
  unmet: EffectiveRule[];
  requiresInstructorApproval: boolean;
}

/**
 * Evaluates every AUTOMATIC (non-MANUAL) rule in a lesson's effective
 * rule set against real server state — never a client-asserted boolean.
 * `MANUAL` itself contributes no independently-checkable condition; it
 * only changes WHO/WHAT triggers completion once every other condition in
 * the set is met (see `completeLessonManually`/`maybeAutoCompleteFrom*`
 * below for exactly how).
 */
async function evaluateAutomaticRules(
  enrollmentId: string,
  lesson: { id: string; completionRuleType: string; completionRuleTypes: string[]; completionRuleValue: unknown },
  currentPercent: number,
  tx?: TransactionClient,
): Promise<AutomaticRuleEvaluation> {
  const rules = getEffectiveCompletionRules(lesson).filter((r) => r !== 'MANUAL');
  const met: EffectiveRule[] = [];
  const unmet: EffectiveRule[] = [];

  for (const rule of rules) {
    let satisfied: boolean;
    switch (rule) {
      case 'MINIMUM_WATCH_PERCENT': {
        const threshold = Number((lesson.completionRuleValue as { minPercent?: unknown } | null)?.minPercent ?? 80);
        satisfied = currentPercent >= threshold;
        break;
      }
      case 'ALL_ACTIVITIES_VIEWED':
        satisfied = await areAllRequiredActivitiesViewed(enrollmentId, lesson.id, tx);
        break;
      case 'INSTRUCTOR_APPROVAL':
        satisfied = await hasLiveOverride(enrollmentId, 'LESSON', lesson.id, tx);
        break;
      case 'QUIZ_PASS': {
        const quiz = await findQuizByLessonId(lesson.id, tx);
        satisfied = quiz ? await hasPassedQuiz(enrollmentId, quiz.id, tx) : false;
        break;
      }
      case 'ASSIGNMENT_APPROVED': {
        const assignment = await findAssignmentByLessonId(lesson.id, tx);
        satisfied = assignment ? await hasApprovedSubmission(enrollmentId, assignment.id, tx) : false;
        break;
      }
      default:
        satisfied = true;
    }
    (satisfied ? met : unmet).push(rule);
  }

  return { met, unmet, requiresInstructorApproval: rules.includes('INSTRUCTOR_APPROVAL') };
}

/**
 * Learner-initiated manual completion action (`POST /me/lessons/:id/complete`).
 *
 * CORRECTION (Part 2 correction pass): previously, `ALL_ACTIVITIES_VIEWED`
 * was silently treated as identical to `MANUAL` — a learner could click
 * "complete" without having viewed anything. This is now REMOVED. The
 * effective rule set is evaluated for real:
 *  - If it contains `INSTRUCTOR_APPROVAL`, this endpoint always rejects
 *    (400) — only an instructor/admin override can satisfy that
 *    condition, never a learner action.
 *  - Every other automatic condition (`MINIMUM_WATCH_PERCENT`,
 *    `ALL_ACTIVITIES_VIEWED`) is evaluated against real server state; if
 *    any is unmet, this endpoint rejects (400) and reports exactly which
 *    conditions remain unmet — never a silent downgrade to "complete
 *    anyway."
 *  - Only once every automatic condition is met does the learner's click
 *    actually mark the lesson complete.
 *
 * CORRECTION (idempotency): wrapped in the shared `IdempotencyKey`
 * infrastructure — "lesson completion submission" is one of the two
 * endpoints the correction brief names explicitly.
 */
export async function completeLessonManually(userId: string, lessonId: string, idempotencyKey?: string): Promise<{ alreadyCompleted: boolean }> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Lesson not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lessonId);
  if (!access.allowed) throw AppError.forbidden(access.message);
  if (access.viaPreview) throw AppError.badRequest('Enroll in this course to complete lessons');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  // Checked before the idempotency-key layer, deliberately: the
  // no-client-key fallback key (`scopedIdempotencyKey`) is deterministic
  // per (user, lesson) and its cached record never expires, so a plain
  // "already completed" recheck must never depend on replaying that
  // cache — it always reflects the current, authoritative
  // `LessonProgress.status`, exactly as `completeLessonForEnrollment`'s
  // own idempotent-by-construction guarantee promises (Scenario 7).
  const existingProgress = await findLessonProgress(enrollment.id, lessonId);
  if (existingProgress?.status === 'COMPLETED') {
    return { alreadyCompleted: true };
  }

  const key = scopedIdempotencyKey(userId, idempotencyKey, lessonId);
  const outcome = await beginIdempotentOperation<{ alreadyCompleted: boolean }>('lms.lesson.complete', key, { lessonId });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent completion has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('A completion request for this lesson is already in progress');
  }

  try {
    const evaluation = await evaluateAutomaticRules(enrollment.id, lesson, existingProgress?.percentage ?? 0);
    if (evaluation.requiresInstructorApproval && evaluation.unmet.includes('INSTRUCTOR_APPROVAL')) {
      throw AppError.badRequest('This lesson requires instructor approval and cannot be completed by the learner directly', {
        unmetRules: evaluation.unmet,
      });
    }
    if (evaluation.unmet.length > 0) {
      throw AppError.badRequest('This lesson has unmet completion conditions', { unmetRules: evaluation.unmet });
    }

    const result = await withTransaction(async (tx) => {
      const r = await completeLessonForEnrollment(enrollment.id, lessonId, 'MANUAL_LEARNER', userId, tx);
      await recomputeEnrollmentCompletion(enrollment.id, module_.courseId, userId, tx);
      return r;
    });

    await outcome.complete(result);
    return result;
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

/**
 * Called by `student-lms.controller.ts` AFTER a progress update — server-
 * evaluated signal-derived completion (004 FR-053/SC-001: never "video
 * opened," always a satisfied rule). Fires ONLY when every automatic
 * condition in the lesson's effective rule set is met AND `MANUAL` is
 * NOT also part of that set (if it is, the learner must still explicitly
 * confirm via `completeLessonManually` even after every automatic
 * condition is satisfied — see docs/lms/COMPLETION_ENGINE.md).
 */
export async function maybeAutoCompleteFromProgress(userId: string, lessonId: string, currentPercent: number): Promise<void> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) return;

  const rules = getEffectiveCompletionRules(lesson);
  if (rules.includes('MANUAL') || rules.includes('INSTRUCTOR_APPROVAL')) return; // requires explicit learner/instructor action, never silent auto-complete
  if (!rules.includes('MINIMUM_WATCH_PERCENT')) return; // nothing this trigger can evaluate

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) return;
  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) return;

  const evaluation = await evaluateAutomaticRules(enrollment.id, lesson, currentPercent);
  if (evaluation.unmet.length > 0) return;

  await withTransaction(async (tx) => {
    await completeLessonForEnrollment(enrollment.id, lessonId, 'SIGNAL_DERIVED', userId, tx);
    await recomputeEnrollmentCompletion(enrollment.id, module_.courseId, userId, tx);
  });
}

/**
 * 004 US3 (Quiz System batch) — the QUIZ_PASS analogue of
 * `maybeAutoCompleteFromProgress`. Called after a quiz attempt is graded.
 * A separate function rather than reusing the progress one, since that
 * function's own early-return is hard-gated on `MINIMUM_WATCH_PERCENT`
 * being part of the lesson's rule set — a QUIZ_PASS-only lesson would
 * never reach its evaluation otherwise.
 */
export async function maybeAutoCompleteFromQuizPass(userId: string, lessonId: string): Promise<void> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) return;

  const rules = getEffectiveCompletionRules(lesson);
  if (rules.includes('MANUAL') || rules.includes('INSTRUCTOR_APPROVAL')) return;
  if (!rules.includes('QUIZ_PASS')) return;

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) return;
  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) return;

  const evaluation = await evaluateAutomaticRules(enrollment.id, lesson, 0, undefined);
  if (evaluation.unmet.length > 0) return;

  await withTransaction(async (tx) => {
    await completeLessonForEnrollment(enrollment.id, lessonId, 'SIGNAL_DERIVED', userId, tx);
    await recomputeEnrollmentCompletion(enrollment.id, module_.courseId, userId, tx);
  });
}

/**
 * 004 US4 (Assignment System batch) — the ASSIGNMENT_APPROVED analogue of
 * `maybeAutoCompleteFromQuizPass`. Called after a submission is reviewed
 * with an APPROVE decision. A separate function rather than reusing the
 * progress-triggered one, for the same reason `maybeAutoCompleteFromQuizPass`
 * is separate: that function's early-return is hard-gated on
 * `MINIMUM_WATCH_PERCENT` being part of the lesson's rule set.
 */
export async function maybeAutoCompleteFromAssignmentApproval(userId: string, lessonId: string): Promise<void> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) return;

  const rules = getEffectiveCompletionRules(lesson);
  if (rules.includes('MANUAL') || rules.includes('INSTRUCTOR_APPROVAL')) return;
  if (!rules.includes('ASSIGNMENT_APPROVED')) return;

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) return;
  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) return;

  const evaluation = await evaluateAutomaticRules(enrollment.id, lesson, 0, undefined);
  if (evaluation.unmet.length > 0) return;

  await withTransaction(async (tx) => {
    await completeLessonForEnrollment(enrollment.id, lessonId, 'SIGNAL_DERIVED', userId, tx);
    await recomputeEnrollmentCompletion(enrollment.id, module_.courseId, userId, tx);
  });
}

/**
 * Records a discrete "learner viewed this activity" event (server-derived
 * `ALL_ACTIVITIES_VIEWED` input — the client reports ONE activity being
 * viewed, never an aggregate "all done" claim). Idempotent (repeat calls
 * for the same activity are a no-op). Triggers the same auto-complete
 * check `maybeAutoCompleteFromProgress` does, for the `ALL_ACTIVITIES_VIEWED`
 * rule specifically.
 */
export async function recordActivityViewed(userId: string, activityId: string): Promise<void> {
  const client = getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');

  const activity = await client.learningActivity.findFirst({ where: { id: activityId, deletedAt: null } });
  if (!activity || activity.status !== 'PUBLISHED') throw AppError.notFound('Learning activity not found');

  const lesson = await findLessonById(activity.lessonId);
  if (!lesson) throw AppError.notFound('Learning activity not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Learning activity not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) throw AppError.forbidden(access.message);
  if (access.viaPreview) throw AppError.badRequest('Enroll in this course to track activity progress');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  await upsertActivityViewed(enrollment.id, activityId, lesson.id);

  // FR-109 RESOURCE_DOWNLOADED — the closest real signal this codebase has
  // to "a resource was downloaded" (no file-download-tracking endpoint
  // exists separate from the generic activity-viewed signal — see
  // `docs/lms/LEARNING_ACTIVITIES.md`'s DOWNLOAD-type limitations).
  if (activity.type === 'DOWNLOAD') {
    await recordLearningEvent({ eventType: 'RESOURCE_DOWNLOADED', userId, courseId: module_.courseId, lessonId: lesson.id, enrollmentId: enrollment.id });
  }

  const rules = getEffectiveCompletionRules(lesson);
  if (rules.includes('MANUAL') || rules.includes('INSTRUCTOR_APPROVAL')) return;
  if (!rules.includes('ALL_ACTIVITIES_VIEWED')) return;

  const progress = await findLessonProgress(enrollment.id, lesson.id);
  if (progress?.status === 'COMPLETED') return;

  const evaluation = await evaluateAutomaticRules(enrollment.id, lesson, progress?.percentage ?? 0);
  if (evaluation.unmet.length > 0) return;

  await withTransaction(async (tx) => {
    await completeLessonForEnrollment(enrollment.id, lesson.id, 'SIGNAL_DERIVED', userId, tx);
    await recomputeEnrollmentCompletion(enrollment.id, module_.courseId, userId, tx);
  });
}

/** Does `module` count as complete for this enrollment — lesson-based progress PLUS, for `INSTRUCTOR_APPROVAL` modules, a live (non-reset) `CompletionOverride`. */
async function isModuleCompleteForEnrollment(
  enrollmentId: string,
  module_: { id: string; completionRuleType: string },
  tx?: TransactionClient,
): Promise<boolean> {
  const progress = await computeModuleProgress(enrollmentId, module_.id, tx);
  if (!progress.isComplete) return false;
  if (module_.completionRuleType !== 'INSTRUCTOR_APPROVAL') return true;

  return hasLiveOverride(enrollmentId, 'MODULE', module_.id, tx);
}

/** True if the most recent `CompletionOverride` for this (enrollment, scope, target) is a MARK_COMPLETE not superseded by a later RESET. */
async function hasLiveOverride(enrollmentId: string, scope: string, targetId: string, tx?: TransactionClient): Promise<boolean> {
  const client = tx ?? getPrismaClient();
  if (!client) return false;
  const latest = await client.completionOverride.findFirst({
    where: { enrollmentId, scope: scope as never, targetId },
    orderBy: { createdAt: 'desc' },
  });
  return latest?.action === 'MARK_COMPLETE';
}

/**
 * Recomputes whether the WHOLE course is now complete for this enrollment
 * and, if so, transitions the Enrollment to COMPLETED — idempotent,
 * server-evaluated, never client-settable.
 *
 * CORRECTION: the actual status flip now goes through
 * `completeEnrollmentIfStatus` (an `updateMany` scoped by `id` AND the
 * expected prior `status`, not a plain `update` by id) — under
 * concurrency, two near-simultaneous recompute calls both reading
 * `status === 'ACTIVE'` before either commits can no longer BOTH succeed;
 * only the transaction whose `updateMany` actually matches a row (count
 * === 1) records the `lms.enrollment.completed` audit event. This is
 * what makes "course completion event emitted only once" a real,
 * enforced guarantee rather than an assumption resting on the read-then-
 * write gap never being hit.
 */
export async function recomputeEnrollmentCompletion(enrollmentId: string, courseId: string, actorId: string, tx: TransactionClient): Promise<void> {
  const enrollment = await findEnrollmentById(enrollmentId, tx);
  if (!enrollment || enrollment.status !== 'ACTIVE') return; // only an ACTIVE enrollment can newly become COMPLETED

  const modules = (await findModulesByCourse(courseId, tx)).filter((m) => m.status === 'PUBLISHED' && m.isMandatory);
  if (modules.length === 0) return; // a course with zero mandatory modules is never auto-completed (nothing to "finish")

  const results = await Promise.all(modules.map((m) => isModuleCompleteForEnrollment(enrollmentId, m, tx)));
  if (!results.every(Boolean)) return;

  assertValidEnrollmentTransition(enrollment.status, 'COMPLETED');
  const now = new Date();
  const won = await completeEnrollmentIfStatus(enrollmentId, 'ACTIVE', now, actorId, tx);
  if (!won) return; // a concurrent recompute already completed this enrollment first

  await recordAuditEvent(
    { actorType: 'USER', actorId, action: 'lms.enrollment.completed', resourceType: 'enrollment', resourceId: enrollmentId },
    tx,
  );

  // FR-109 COURSE_COMPLETED — attributed to the learner (`enrollment.
  // userId`), never `actorId` (an admin-override completion still
  // represents the LEARNER completing the course, analytically).
  await recordLearningEvent({ eventType: 'COURSE_COMPLETED', userId: enrollment.userId, courseId, enrollmentId }, tx);
}

// --- Admin/instructor overrides (FR-113) ------------------------------------

/**
 * FR-113 "Authorized admin/instructor roles MUST be able to override
 * progress... each requiring a stated reason, sufficient permission, an
 * audit entry." `source` distinguishes an instructor's course-scoped
 * approval from a platform admin's broader override in the audit trail.
 *
 * CORRECTION (idempotency): "privileged completion override" is one of
 * the endpoints the correction brief names explicitly — wrapped in the
 * shared `IdempotencyKey` infrastructure so a retried override request
 * (e.g. a dashboard double-click) replays the original result rather than
 * creating a second `CompletionOverride` audit row.
 */
export async function overrideMarkComplete(
  enrollmentId: string,
  scope: 'LESSON' | 'MODULE' | 'COURSE',
  targetId: string,
  reason: string,
  actorId: string,
  source: 'INSTRUCTOR_OVERRIDE' | 'ADMIN_OVERRIDE',
  idempotencyKey?: string,
): Promise<void> {
  const key = scopedIdempotencyKey(actorId, idempotencyKey, `${enrollmentId}:${scope}:${targetId}:complete`);
  const outcome = await beginIdempotentOperation<{ overridden: true }>('lms.completion.override', key, { enrollmentId, scope, targetId, action: 'MARK_COMPLETE' });

  if (outcome.status === 'replayed') return;
  if (outcome.status === 'in-progress') throw AppError.conflict('An override request for this target is already in progress');

  try {
    await withTransaction(async (tx) => {
      const enrollment = await findEnrollmentById(enrollmentId, tx);
      if (!enrollment) throw AppError.notFound('Enrollment not found');

      await tx.completionOverride.create({
        data: { enrollmentId, scope: scope as never, targetId, action: 'MARK_COMPLETE', reason, actorId },
      });

      if (scope === 'LESSON') {
        await completeLessonForEnrollment(enrollmentId, targetId, source, actorId, tx);
      }

      await recordAuditEvent(
        { actorType: 'USER', actorId, action: 'lms.completion.override', resourceType: scope.toLowerCase(), resourceId: targetId, reason, metadata: { enrollmentId, action: 'MARK_COMPLETE' } },
        tx,
      );

      await recomputeEnrollmentCompletion(enrollmentId, enrollment.courseId, actorId, tx);
    });
    await outcome.complete({ overridden: true });
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

/**
 * RESET override — clears completion state for the target scope. A
 * COURSE-scope reset reopens a COMPLETED enrollment back to ACTIVE
 * (FR-113 "reset progress"). Reset RETAINS history: the `CompletionOverride`
 * audit row for the reset is never deleted, and prior `LessonProgress`
 * rows are updated (not deleted) — the `timeSpentSeconds` accumulated
 * before the reset survives, and the full override history remains
 * queryable per `(enrollmentId, scope, targetId)`.
 *
 * CORRECTION (idempotency): "progress reset" is the other endpoint the
 * correction brief names explicitly.
 */
export async function overrideReset(
  enrollmentId: string,
  scope: 'LESSON' | 'MODULE' | 'COURSE',
  targetId: string,
  reason: string,
  actorId: string,
  idempotencyKey?: string,
): Promise<void> {
  const key = scopedIdempotencyKey(actorId, idempotencyKey, `${enrollmentId}:${scope}:${targetId}:reset`);
  const outcome = await beginIdempotentOperation<{ reset: true }>('lms.progress.reset', key, { enrollmentId, scope, targetId, action: 'RESET' });

  if (outcome.status === 'replayed') return;
  if (outcome.status === 'in-progress') throw AppError.conflict('A reset request for this target is already in progress');

  try {
    await withTransaction(async (tx) => {
      const enrollment = await findEnrollmentById(enrollmentId, tx);
      if (!enrollment) throw AppError.notFound('Enrollment not found');

      await tx.completionOverride.create({
        data: { enrollmentId, scope: scope as never, targetId, action: 'RESET', reason, actorId },
      });

      const resetLessonIds: string[] = [];
      if (scope === 'LESSON') {
        resetLessonIds.push(targetId);
      } else if (scope === 'MODULE') {
        const lessons = await findLessonsByModule(targetId, tx);
        resetLessonIds.push(...lessons.map((l) => l.id));
      } else {
        const modules = await findModulesByCourse(targetId, tx);
        for (const m of modules) {
          const lessons = await findLessonsByModule(m.id, tx);
          resetLessonIds.push(...lessons.map((l) => l.id));
        }
      }

      for (const lessonId of resetLessonIds) {
        const existing = await findLessonProgress(enrollmentId, lessonId, tx);
        if (!existing) continue;
        await upsertLessonProgress(
          enrollmentId,
          lessonId,
          { enrollmentId, lessonId, status: 'NOT_STARTED' as never, percentage: 0, timeSpentSeconds: existing.timeSpentSeconds },
          { status: 'NOT_STARTED' as never, percentage: 0, completedAt: null, completionSource: null, version: { increment: 1 } },
          tx,
        );
      }

      if (scope === 'COURSE' && enrollment.status === 'COMPLETED') {
        assertValidEnrollmentTransition('COMPLETED', 'ACTIVE');
        await updateEnrollment(enrollmentId, { status: 'ACTIVE', completedAt: null, updatedBy: actorId }, tx);
      }

      await recordAuditEvent(
        { actorType: 'USER', actorId, action: 'lms.completion.override', resourceType: scope.toLowerCase(), resourceId: targetId, reason, metadata: { enrollmentId, action: 'RESET' } },
        tx,
      );
    });
    await outcome.complete({ reset: true });
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

/** Re-exported for `continue-learning.service.ts` — a module isn't a valid "next" target while its own prerequisite is unmet. */
export { isModulePrerequisiteSatisfied };
