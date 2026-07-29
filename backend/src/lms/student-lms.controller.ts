import type { Request, Response } from 'express';
import { buildSuccessResponse, HttpStatus, ERROR_CODES } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { selfEnroll, listMyEnrollments } from './enrollment.service';
import { evaluateCourseAccess, evaluateLessonAccess } from './access-evaluator.service';
import { getCourseProgressForLearner, updateLessonProgress } from './progress.service';
import { completeLessonManually, maybeAutoCompleteFromProgress, recordActivityViewed } from './completion.service';
import { getContinueLearning } from './continue-learning.service';
import { getCourseCurriculumForLearner } from './curriculum.service';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { findActivitiesByLesson } from './activity.repository';
import { findQuizByLessonId } from './quiz.repository';
import { findAssignmentByLessonId } from './assignment.repository';
import { toPublicLessonDetail } from './lesson.serializers';
import { evaluateCertificateEligibility, generateCertificateForEnrollment, listMyCertificates, getMyCertificateById } from './certificate.service';
import { getRecommendationsForLearner } from './recommendation.service';
import { getMemberCatalog } from './catalog.service';
import { recordLearningEvent } from './learning-event.service';

/**
 * Phase 6 Part 2B — learner-facing `/me/*` API (004 US1–US2, FR-020's
 * "Continue Learning" CTA). EVERY handler here reads the acting user
 * EXCLUSIVELY from `req.user!.id` (set by `authenticate` from the verified
 * access token) — never from a request body/param `userId`, closing the
 * "learner supplies another user's ID" IDOR path Part 2B/2C explicitly
 * calls out. No route under this controller accepts a caller-supplied
 * `userId` at all.
 */

export const postSelfEnroll = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await selfEnroll(req.body.courseId, req.user!.id, req.header('Idempotency-Key'));
  res.status(201).json(buildSuccessResponse(enrollment));
});

export const getMyEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await listMyEnrollments(req.user!.id);
  res.status(200).json(buildSuccessResponse(enrollments));
});

export const getMyCourseAccess = asyncHandler(async (req: Request, res: Response) => {
  const decision = await evaluateCourseAccess(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(decision));
});

export const getMyCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await getCourseProgressForLearner(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(progress));
});

export const getMyContinueLearning = asyncHandler(async (req: Request, res: Response) => {
  const result = await getContinueLearning(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(result));
});

/** GET /me/courses/:courseId/curriculum — module/lesson list with per-lesson lock+progress state, for the lesson-player sidebar (004 US2). */
export const getMyCourseCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const curriculum = await getCourseCurriculumForLearner(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(curriculum));
});

/** GET /me/lessons/:lessonId — full lesson content, gated by the SAME access evaluator every other content path uses. */
export const getMyLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await findLessonById(req.params.lessonId);
  if (!lesson || lesson.status !== 'PUBLISHED') throw AppError.notFound('Lesson not found');

  // Resolve courseId via the lesson's own module — never trust a
  // client-supplied courseId for an access decision (a mismatched
  // courseId here would just 404, never grant access to the wrong course).
  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Lesson not found');

  const access = await evaluateLessonAccess(req.user!.id, module_.courseId, lesson.id);
  if (!access.allowed) {
    throw new AppError(access.message, HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, { reason: access.reason, ...access.detail });
  }

  // FR-109 LESSON_VIEWED — only once access is confirmed allowed (a denied
  // view attempt is not a real "viewed" event).
  if (!access.viaPreview) {
    await recordLearningEvent({ eventType: 'LESSON_VIEWED', userId: req.user!.id, courseId: module_.courseId, lessonId: lesson.id });
  }

  const activities = await findActivitiesByLesson(lesson.id);
  const quiz = await findQuizByLessonId(lesson.id);
  const assignment = await findAssignmentByLessonId(lesson.id);
  res.status(200).json(
    buildSuccessResponse(
      toPublicLessonDetail(
        lesson,
        activities,
        quiz?.status === 'PUBLISHED' ? quiz : null,
        assignment?.status === 'PUBLISHED' ? assignment : null,
      ),
    ),
  );
});

export const postMyLessonProgress = asyncHandler(async (req: Request, res: Response) => {
  const updated = await updateLessonProgress(req.user!.id, req.params.lessonId, req.body, req.header('Idempotency-Key'));
  await maybeAutoCompleteFromProgress(req.user!.id, req.params.lessonId, updated.percentage);
  res.status(200).json(buildSuccessResponse(updated));
});

export const postMyLessonComplete = asyncHandler(async (req: Request, res: Response) => {
  const result = await completeLessonManually(req.user!.id, req.params.lessonId, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(result));
});

/**
 * POST /me/activities/:activityId/viewed — the discrete, server-derived
 * signal `ALL_ACTIVITIES_VIEWED` completion is built from (Correction 2 of
 * the Part 2 correction pass). The client reports ONE activity being
 * viewed; it never asserts "all activities viewed" as a boolean — the
 * server aggregates across every activity in the lesson
 * (`completion.service.ts`'s `areAllRequiredActivitiesViewed`).
 */
export const postMyActivityViewed = asyncHandler(async (req: Request, res: Response) => {
  await recordActivityViewed(req.user!.id, req.params.activityId);
  res.status(200).json(buildSuccessResponse({ viewed: true }));
});

// --- Certificates (004 US5 Certificate System batch) -----------------------

export const getMyCertificates = asyncHandler(async (req: Request, res: Response) => {
  const certificates = await listMyCertificates(req.user!.id);
  res.status(200).json(buildSuccessResponse(certificates));
});

/** GET /me/certificates/:certificateId — single-certificate view (printable "PDF" page). Ownership-scoped: a certificate belonging to another learner 404s, never leaks via ID guessing. */
export const getMyCertificateDetail = asyncHandler(async (req: Request, res: Response) => {
  const certificate = await getMyCertificateById(req.user!.id, req.params.certificateId);
  res.status(200).json(buildSuccessResponse(certificate));
});

/** GET /me/courses/:courseId/certificate-eligibility — lets the learner UI show which FR-081 conditions are still outstanding, before a certificate is ever generated. */
export const getMyCertificateEligibility = asyncHandler(async (req: Request, res: Response) => {
  const eligibility = await evaluateCertificateEligibility(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(eligibility));
});

/** POST /me/courses/:courseId/certificate — idempotent issuance; returns the existing certificate if one was already generated for this enrollment. */
export const postMyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const certificate = await generateCertificateForEnrollment(req.user!.id, req.params.courseId);
  res.status(201).json(buildSuccessResponse(certificate));
});

// --- Discovery & Recommendations (004, FR-088/FR-090) -----------------------

/** GET /me/recommendations — the deterministic recommendation engine's own direct endpoint (also feeds the dashboard's "recommendations" widget). */
export const getMyRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const result = await getRecommendationsForLearner(req.user!.id);
  res.status(200).json(buildSuccessResponse(result));
});

/** GET /me/catalog — the sectioned member catalog view (FR-090). */
export const getMyCatalog = asyncHandler(async (req: Request, res: Response) => {
  const catalog = await getMemberCatalog(req.user!.id);
  res.status(200).json(buildSuccessResponse(catalog));
});
