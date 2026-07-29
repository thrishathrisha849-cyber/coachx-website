import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authenticateOptional } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { cacheControl } from '../../cms/cache-control.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryIdParamSchema,
  publicCategoryQuerySchema,
  adminCategoryQuerySchema,
  createCourseSchema,
  updateCourseSchema,
  changeCourseStatusSchema,
  courseIdParamSchema,
  publicCourseQuerySchema,
  adminCourseQuerySchema,
  courseSlugParamSchema,
  assignInstructorSchema,
  removeInstructorSchema,
  setPrimaryInstructorSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  moduleIdParamSchema,
  courseModulesParamSchema,
  publicCourseModulesParamSchema,
} from '../../lms/lms.validation';
import {
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
  lessonIdParamSchema,
  moduleLessonsParamSchema,
  createActivitySchema,
  updateActivitySchema,
  reorderActivitiesSchema,
  activityIdParamSchema,
  lessonActivitiesParamSchema,
} from '../../lms/lesson.validation';
import {
  selfEnrollSchema,
  adminCreateEnrollmentSchema,
  enrollmentIdParamSchema,
  adminEnrollmentQuerySchema,
  extendAccessSchema,
  suspendEnrollmentSchema,
  revokeEnrollmentSchema,
  reactivateEnrollmentSchema,
  resetProgressSchema,
  overrideCompleteSchema,
  instructorOverrideCompleteSchema,
} from '../../lms/enrollment.validation';
import { updateLessonProgressSchema, completeLessonSchema, courseIdParamSchema as meCourseIdParamSchema } from '../../lms/progress.validation';
import { getPublicCategories, getPublicCourses, getPublicCourseDetail, getPublicCourseModules } from '../../lms/lms.controller';
import {
  postCategory,
  getCategoriesAdmin,
  getCategoryByIdAdmin,
  patchCategory,
  postReorderCategories,
  postArchiveCategory,
  postRestoreCategory,
  postCourse,
  getCoursesAdmin,
  getCourseByIdAdmin,
  getCourseVersionsAdmin,
  patchCourse,
  postCourseStatus,
  postArchiveCourse,
  postRestoreCourse,
  postCloneCourse,
  postInstructor,
  getCourseInstructors,
  deleteInstructor,
  postInstructorPrimary,
  postModule,
  getCourseModules,
  getModuleById,
  patchModule,
  postReorderModules,
  postArchiveModule,
  postRestoreModule,
  postReleaseModule,
  postLesson,
  getModuleLessons,
  getLessonById,
  patchLesson,
  postReorderLessons,
  postArchiveLesson,
  postRestoreLesson,
  postActivity,
  getLessonActivities,
  patchActivity,
  postReorderActivities,
  postArchiveActivity,
  postEnrollment,
  getEnrollmentsAdmin,
  getEnrollmentByIdAdmin,
  postSuspendEnrollment,
  postReactivateEnrollment,
  postRevokeEnrollment,
  postExtendEnrollmentAccess,
  postOverrideComplete,
  postResetProgress,
  getEnrollmentAnalyticsAdmin,
  getEnrollmentAtRiskAdmin,
  getCourseAnalyticsAdmin,
  getCourseAtRiskLearnersAdmin,
  getLessonAnalyticsAdmin,
  getCourseLessonAnalyticsAdmin,
} from '../../lms/admin-lms.controller';
import {
  getMyInstructorCourses,
  getMyInstructorCourseById,
  patchMyInstructorCourse,
  postMyInstructorModule,
  getMyInstructorCourseModules,
  patchMyInstructorModule,
  postMyInstructorModuleReorder,
  postMyInstructorReleaseModule,
  postMyInstructorLesson,
  getMyInstructorModuleLessons,
  getMyInstructorLesson,
  patchMyInstructorLesson,
  postMyInstructorLessonReorder,
  postMyInstructorActivity,
  getMyInstructorLessonActivities,
  patchMyInstructorActivity,
  getMyInstructorCourseEnrollments,
  postMyInstructorOverrideComplete,
} from '../../lms/instructor-lms.controller';
import {
  postSelfEnroll,
  getMyEnrollments,
  getMyCourseAccess,
  getMyCourseProgress,
  getMyCourseCurriculum,
  getMyContinueLearning,
  getMyLesson,
  postMyLessonProgress,
  postMyLessonComplete,
  postMyActivityViewed,
  getMyCertificates,
  getMyCertificateDetail,
  getMyCertificateEligibility,
  postMyCertificate,
  getMyRecommendations,
  getMyCatalog,
} from '../../lms/student-lms.controller';
import {
  assignCourseToOrgMembersSchema,
  orgEnrollmentQuerySchema,
  orgRemoveAccessSchema,
  orgSetDeadlineSchema,
} from '../../lms/org-assignment.validation';
import {
  postAssignCourseToOrgMembers,
  getOrganizationEnrollments,
  postRemoveOrgMemberAccess,
  postSetOrgMemberDeadline,
} from '../../lms/org-assignment.controller';
import {
  createQuizSchema,
  updateQuizSchema,
  changeQuizStatusSchema,
  quizIdParamSchema,
  createQuestionSchema,
  updateQuestionSchema,
  questionIdParamSchema,
  reorderQuestionsSchema,
  attemptIdParamSchema,
  submitAnswerSchema,
} from '../../lms/quiz.validation';
import {
  postQuiz,
  getQuizByLessonId,
  getQuizByIdAdmin,
  patchQuiz,
  postQuizStatus,
  postQuestion,
  patchQuestion,
  postArchiveQuestion,
  postReorderQuestions,
} from '../../lms/quiz.controller';
import {
  getMyQuizOverview,
  postStartAttempt,
  getMyAttempt,
  postSaveAnswer,
  postSubmitAttempt,
} from '../../lms/quiz-attempt.controller';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  changeAssignmentStatusSchema,
  assignmentIdParamSchema,
  createCriterionSchema,
  updateCriterionSchema,
  criterionIdParamSchema,
  submissionIdParamSchema,
  saveDraftSchema,
  reviewSubmissionSchema,
  listSubmissionsQuerySchema,
  submitPeerReviewSchema,
  moderatePeerReviewSchema,
} from '../../lms/assignment.validation';
import {
  postAssignment,
  getAssignmentByLessonId,
  getAssignmentByIdAdmin,
  patchAssignment,
  postAssignmentStatus,
  postCriterion,
  patchCriterion,
  postArchiveCriterion,
} from '../../lms/assignment.controller';
import {
  postStartSubmission,
  getMySubmissions,
  getMySubmissionDetail,
  patchMySubmission,
  postSubmitSubmission,
  getSubmissionsForReview,
  getSubmissionByIdAdmin,
  postReviewSubmission,
} from '../../lms/assignment-submission.controller';
import {
  getMyPeerReviewQueue,
  postClaimPeerReview,
  postSubmitPeerReview,
  getMyPeerReviewsReceived,
  postModeratePeerReview,
} from '../../lms/peer-review.controller';
import { createTemplateSchema, updateTemplateSchema, mapCourseTemplateSchema, revokeCertificateSchema, credentialIdParamSchema, certificateIdParamSchema, courseIdParamSchema as certificateCourseIdParamSchema } from '../../lms/certificate.validation';
import { cloneCourseSchema } from '../../lms/course-clone.validation';
import {
  courseIdParamSchema as reviewCourseIdParamSchema,
  submitReviewSchema,
  moderateReviewSchema,
} from '../../lms/course-review.validation';
import {
  getCourseReviews,
  getMyCourseReview,
  getMyReviewEligibility,
  postMyCourseReview,
  getCourseReviewsAdmin,
  postModerateReview,
} from '../../lms/course-review.controller';
import {
  getTemplatesAdmin,
  postTemplate,
  patchTemplate,
  postCourseTemplateMapping,
  getCertificatesForCourseAdmin,
  postRevokeCertificate,
  getPublicCertificateVerification,
} from '../../lms/certificate.controller';

/**
 * Phase 6 Part 1 — LMS course-engine/category/module routes. Mounted at
 * `/api/v1/lms` (same versioned-API convention as `/api/v1/cms`, `/api/v1/auth`
 * — see routes/v1/index.ts). Public reads live directly under `/lms/*`
 * (mirroring `/cms/pages/:slug`); admin writes under `/lms/admin/*`
 * (mirroring `/cms/admin/pages`); instructor-scoped routes under
 * `/lms/instructor/*` — a THIRD audience tier `/cms` doesn't need, since
 * CMS has no per-author-ownership concept the way LMS courses do.
 *
 * Endpoint-name note: the Phase 6 brief's own example paths use
 * `/api/admin/lms/...` / `/api/instructor/lms/...` / `/api/public/lms/...`
 * (no `/v1`, LMS as the outer segment). This repo's established, already-
 * approved convention (Phases 4–5) is `/api/v1/<module>/...` with the
 * module as the outer segment and the audience as an inner segment — see
 * docs/lms/API_REFERENCE_PART1.md for the explicit mapping.
 */
const router = Router();

// --- Public reads -----------------------------------------------------
router.get('/categories', cacheControl, validate(publicCategoryQuerySchema), getPublicCategories);
router.get('/courses', cacheControl, validate(publicCourseQuerySchema), getPublicCourses);
// FR-109 COURSE_VIEWED — authenticateOptional so an anonymous browse still
// 200s (this endpoint has never required auth), but the event only fires
// for a resolvable logged-in viewer; never fabricates an anonymous row.
router.get('/courses/:slug', cacheControl, authenticateOptional, validate(courseSlugParamSchema), getPublicCourseDetail);
router.get('/courses/:slug/modules', cacheControl, validate(publicCourseModulesParamSchema), getPublicCourseModules);
// FR-085 public verification — no auth, no permission check; deliberately open (that's the point of a verifiable credential).
router.get('/certificates/verify/:credentialId', cacheControl, validate(credentialIdParamSchema), getPublicCertificateVerification);
// 004 Discovery & Recommendations batch (FR-087) — public review list, no auth required (same visibility tier as the course detail page itself).
router.get('/courses/:courseId/reviews', cacheControl, validate(reviewCourseIdParamSchema), getCourseReviews);

// --- Admin: categories ---------------------------------------------------
const adminCategoryPermission = requirePermission('course.category.manage');
router.post('/admin/categories', authenticate, adminCategoryPermission, validate(createCategorySchema), postCategory);
router.get('/admin/categories', authenticate, adminCategoryPermission, validate(adminCategoryQuerySchema), getCategoriesAdmin);
router.get('/admin/categories/:id', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), getCategoryByIdAdmin);
router.patch('/admin/categories/:id', authenticate, adminCategoryPermission, validate(updateCategorySchema), patchCategory);
router.post('/admin/categories/reorder', authenticate, adminCategoryPermission, validate(reorderCategoriesSchema), postReorderCategories);
router.post('/admin/categories/:id/archive', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), postArchiveCategory);
router.post('/admin/categories/:id/restore', authenticate, adminCategoryPermission, validate(categoryIdParamSchema), postRestoreCategory);

// --- Admin: courses -------------------------------------------------------
router.post('/admin/courses', authenticate, requirePermission('course.create'), validate(createCourseSchema), postCourse);
router.get('/admin/courses', authenticate, requirePermission('course.view'), validate(adminCourseQuerySchema), getCoursesAdmin);
router.get('/admin/courses/:id', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseByIdAdmin);
router.get('/admin/courses/:id/versions', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseVersionsAdmin);
router.patch('/admin/courses/:id', authenticate, requirePermission('course.update'), validate(updateCourseSchema), patchCourse);
// course.update is the ROUTE-level baseline; postCourseStatus itself does a
// second, body-aware check requiring course.publish for PUBLISHED/SCHEDULED.
router.post('/admin/courses/:id/status', authenticate, requirePermission('course.update'), validate(changeCourseStatusSchema), postCourseStatus);
router.post('/admin/courses/:id/archive', authenticate, requirePermission('course.archive'), validate(courseIdParamSchema), postArchiveCourse);
router.post('/admin/courses/:id/restore', authenticate, requirePermission('course.archive'), validate(courseIdParamSchema), postRestoreCourse);
// 004 US8 — cloning creates a brand-new course, so it reuses `course.create` (the same permission that gates authoring a course from scratch), not `course.update`.
router.post('/admin/courses/:id/clone', authenticate, requirePermission('course.create'), validate(cloneCourseSchema), postCloneCourse);

// --- Admin: instructor assignment -----------------------------------------
const manageInstructors = requirePermission('course.manageInstructors');
router.post('/admin/courses/:id/instructors', authenticate, manageInstructors, validate(assignInstructorSchema), postInstructor);
router.get('/admin/courses/:id/instructors', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseInstructors);
router.delete('/admin/courses/:id/instructors/:userId', authenticate, manageInstructors, validate(removeInstructorSchema), deleteInstructor);
router.post('/admin/courses/:id/instructors/:userId/primary', authenticate, manageInstructors, validate(setPrimaryInstructorSchema), postInstructorPrimary);

// --- Admin: modules ---------------------------------------------------
const manageModules = requirePermission('course.module.manage');
router.post('/admin/courses/:courseId/modules', authenticate, manageModules, validate(createModuleSchema), postModule);
router.get('/admin/courses/:courseId/modules', authenticate, requirePermission('course.view'), validate(courseModulesParamSchema), getCourseModules);
router.get('/admin/modules/:moduleId', authenticate, requirePermission('course.view'), validate(moduleIdParamSchema), getModuleById);
router.patch('/admin/modules/:moduleId', authenticate, manageModules, validate(updateModuleSchema), patchModule);
router.post('/admin/courses/:courseId/modules/reorder', authenticate, manageModules, validate(reorderModulesSchema), postReorderModules);
router.post('/admin/modules/:moduleId/archive', authenticate, manageModules, validate(moduleIdParamSchema), postArchiveModule);
router.post('/admin/modules/:moduleId/restore', authenticate, manageModules, validate(moduleIdParamSchema), postRestoreModule);
// FR-034/FR-038 "instructor manually releases content" — added during the database-verification pass.
router.post('/admin/modules/:moduleId/release', authenticate, manageModules, validate(moduleIdParamSchema), postReleaseModule);

// --- Admin: lessons (Phase 6 Part 2A) --------------------------------------
// Lessons are content BELONGING to a module — reuses the SAME
// `course.module.manage` permission Part 1 already granted to
// `course_instructor`/`content_manager`/`platform_admin` rather than
// inventing a parallel `course.lesson.manage` permission (Part 2A brief:
// "reuse RBAC" — a lesson-authoring right is not a materially different
// privilege from a module-authoring right at this phase's granularity).
router.post('/admin/modules/:moduleId/lessons', authenticate, manageModules, validate(createLessonSchema), postLesson);
router.get('/admin/modules/:moduleId/lessons', authenticate, requirePermission('course.view'), validate(moduleLessonsParamSchema), getModuleLessons);
router.get('/admin/lessons/:lessonId', authenticate, requirePermission('course.view'), validate(lessonIdParamSchema), getLessonById);
router.patch('/admin/lessons/:lessonId', authenticate, manageModules, validate(updateLessonSchema), patchLesson);
router.post('/admin/modules/:moduleId/lessons/reorder', authenticate, manageModules, validate(reorderLessonsSchema), postReorderLessons);
router.post('/admin/lessons/:lessonId/archive', authenticate, manageModules, validate(lessonIdParamSchema), postArchiveLesson);
router.post('/admin/lessons/:lessonId/restore', authenticate, manageModules, validate(lessonIdParamSchema), postRestoreLesson);

// --- Admin: learning activities (Phase 6 Part 2A) --------------------------
router.post('/admin/lessons/:lessonId/activities', authenticate, manageModules, validate(createActivitySchema), postActivity);
router.get('/admin/lessons/:lessonId/activities', authenticate, requirePermission('course.view'), validate(lessonActivitiesParamSchema), getLessonActivities);
router.patch('/admin/activities/:activityId', authenticate, manageModules, validate(updateActivitySchema), patchActivity);
router.post('/admin/lessons/:lessonId/activities/reorder', authenticate, manageModules, validate(reorderActivitiesSchema), postReorderActivities);
router.post('/admin/activities/:activityId/archive', authenticate, manageModules, validate(activityIdParamSchema), postArchiveActivity);

// --- Admin: quizzes + questions (004 US3 Quiz System batch) ---------------
// Reuses `course.module.manage` — same tier lesson/activity authoring
// already uses (a quiz is content belonging to a lesson, not a materially
// different privilege). No per-instructor ownership check at this `/admin/*`
// tier, matching the existing lesson/activity admin endpoints.
router.post('/admin/lessons/:lessonId/quiz', authenticate, manageModules, validate(createQuizSchema), postQuiz);
router.get('/admin/lessons/:lessonId/quiz', authenticate, requirePermission('course.view'), validate(lessonIdParamSchema), getQuizByLessonId);
router.get('/admin/quizzes/:quizId', authenticate, requirePermission('course.view'), validate(quizIdParamSchema), getQuizByIdAdmin);
router.patch('/admin/quizzes/:quizId', authenticate, manageModules, validate(updateQuizSchema), patchQuiz);
router.post('/admin/quizzes/:quizId/status', authenticate, manageModules, validate(changeQuizStatusSchema), postQuizStatus);
router.post('/admin/quizzes/:quizId/questions', authenticate, manageModules, validate(createQuestionSchema), postQuestion);
router.patch('/admin/questions/:questionId', authenticate, manageModules, validate(updateQuestionSchema), patchQuestion);
router.post('/admin/questions/:questionId/archive', authenticate, manageModules, validate(questionIdParamSchema), postArchiveQuestion);
router.post('/admin/quizzes/:quizId/questions/reorder', authenticate, manageModules, validate(reorderQuestionsSchema), postReorderQuestions);

// --- Admin: assignments + rubric criteria (004 US4 Assignment System batch) -
// Same permission tier as quizzes above — an assignment is content
// belonging to a lesson, reviewed by the same admin/instructor tier.
router.post('/admin/lessons/:lessonId/assignment', authenticate, manageModules, validate(createAssignmentSchema), postAssignment);
router.get('/admin/lessons/:lessonId/assignment', authenticate, requirePermission('course.view'), validate(lessonIdParamSchema), getAssignmentByLessonId);
router.get('/admin/assignments/:assignmentId', authenticate, requirePermission('course.view'), validate(assignmentIdParamSchema), getAssignmentByIdAdmin);
router.patch('/admin/assignments/:assignmentId', authenticate, manageModules, validate(updateAssignmentSchema), patchAssignment);
router.post('/admin/assignments/:assignmentId/status', authenticate, manageModules, validate(changeAssignmentStatusSchema), postAssignmentStatus);
router.post('/admin/assignments/:assignmentId/criteria', authenticate, manageModules, validate(createCriterionSchema), postCriterion);
router.patch('/admin/criteria/:criterionId', authenticate, manageModules, validate(updateCriterionSchema), patchCriterion);
router.post('/admin/criteria/:criterionId/archive', authenticate, manageModules, validate(criterionIdParamSchema), postArchiveCriterion);

// --- Admin/reviewer: submissions (004 US4) ---------------------------------
router.get('/admin/assignments/:assignmentId/submissions', authenticate, manageModules, validate(listSubmissionsQuerySchema), getSubmissionsForReview);
router.get('/admin/submissions/:submissionId', authenticate, manageModules, validate(submissionIdParamSchema), getSubmissionByIdAdmin);
router.post('/admin/submissions/:submissionId/review', authenticate, manageModules, validate(reviewSubmissionSchema), postReviewSubmission);

// --- Admin: peer review moderation (004 US9 Peer Review batch, FR-076) -----
// Reuses `course.manageInstructors` — same tier as `CourseReview` moderation
// (HIDE/RESTORE, never a delete).
router.post('/admin/peer-reviews/:peerReviewId/moderate', authenticate, manageInstructors, validate(moderatePeerReviewSchema), postModeratePeerReview);

// --- Admin: certificate templates + certificates (004 US5 Certificate System batch) -
// Template CRUD reuses `course.module.manage` (same authoring tier as
// quiz/assignment content); revocation reuses `course.manageInstructors`
// (same tier as enrollment admin lifecycle actions) — no new permission invented.
router.get('/admin/certificate-templates', authenticate, requirePermission('course.view'), getTemplatesAdmin);
router.post('/admin/certificate-templates', authenticate, manageModules, validate(createTemplateSchema), postTemplate);
router.patch('/admin/certificate-templates/:templateId', authenticate, manageModules, validate(updateTemplateSchema), patchTemplate);
router.post('/admin/courses/:courseId/certificate-template', authenticate, manageModules, validate(mapCourseTemplateSchema), postCourseTemplateMapping);
router.get('/admin/courses/:courseId/certificates', authenticate, requirePermission('course.view'), validate(certificateCourseIdParamSchema), getCertificatesForCourseAdmin);
router.post('/admin/certificates/:certificateId/revoke', authenticate, manageInstructors, validate(revokeCertificateSchema), postRevokeCertificate);

// --- Admin: course review moderation (004 Discovery & Recommendations batch, FR-087) -
// Reuses `course.manageInstructors` — same tier as certificate revocation
// and enrollment lifecycle actions, never a raw delete (see course-review.service.ts).
router.get('/admin/courses/:courseId/reviews', authenticate, requirePermission('course.view'), validate(reviewCourseIdParamSchema), getCourseReviewsAdmin);
router.post('/admin/reviews/:reviewId/moderate', authenticate, manageInstructors, validate(moderateReviewSchema), postModerateReview);

// --- Admin: enrollments (Phase 6 Part 2B, FR-112) --------------------------
// Enrollment grant/lifecycle actions reuse `course.manageInstructors` —
// the existing "administers who has privileged access to a course" tier
// Part 1 already established, rather than a new `course.enrollment.manage`
// permission (same "reuse, don't multiply the permission catalog"
// discipline `rbac.constants.ts` documents).
router.post('/admin/enrollments', authenticate, manageInstructors, validate(adminCreateEnrollmentSchema), postEnrollment);
router.get('/admin/enrollments', authenticate, requirePermission('course.view'), validate(adminEnrollmentQuerySchema), getEnrollmentsAdmin);
router.get('/admin/enrollments/:id', authenticate, requirePermission('course.view'), validate(enrollmentIdParamSchema), getEnrollmentByIdAdmin);
router.post('/admin/enrollments/:id/suspend', authenticate, manageInstructors, validate(suspendEnrollmentSchema), postSuspendEnrollment);
router.post('/admin/enrollments/:id/reactivate', authenticate, manageInstructors, validate(reactivateEnrollmentSchema), postReactivateEnrollment);
router.post('/admin/enrollments/:id/revoke', authenticate, manageInstructors, validate(revokeEnrollmentSchema), postRevokeEnrollment);
router.post('/admin/enrollments/:id/extend-access', authenticate, manageInstructors, validate(extendAccessSchema), postExtendEnrollmentAccess);
router.post('/admin/enrollments/:id/complete', authenticate, manageInstructors, validate(overrideCompleteSchema), postOverrideComplete);
router.post('/admin/enrollments/:id/reset-progress', authenticate, manageInstructors, validate(resetProgressSchema), postResetProgress);

// --- Admin: Learning Analytics & At-Risk Detection (004 FR-105–FR-108) -----
// Read-only analytics reuse `course.view` — the same baseline every other
// admin analytics/read endpoint above already uses, never a new
// permission invented for a read-only aggregate.
const analyticsView = requirePermission('course.view');
router.get('/admin/enrollments/:id/analytics', authenticate, analyticsView, validate(enrollmentIdParamSchema), getEnrollmentAnalyticsAdmin);
router.get('/admin/enrollments/:id/at-risk', authenticate, analyticsView, validate(enrollmentIdParamSchema), getEnrollmentAtRiskAdmin);
router.get('/admin/courses/:id/analytics', authenticate, analyticsView, validate(courseIdParamSchema), getCourseAnalyticsAdmin);
router.get('/admin/courses/:id/at-risk-learners', authenticate, analyticsView, validate(courseIdParamSchema), getCourseAtRiskLearnersAdmin);
router.get('/admin/lessons/:lessonId/analytics', authenticate, analyticsView, validate(lessonIdParamSchema), getLessonAnalyticsAdmin);
router.get('/admin/courses/:id/lessons/analytics', authenticate, analyticsView, validate(courseIdParamSchema), getCourseLessonAnalyticsAdmin);

// --- Instructor-scoped ---------------------------------------------------
// course.update / course.module.manage are the permissions `course_instructor`
// actually holds (docs/lms/RBAC.md) — ownership (WHICH courses) is enforced
// inside the controller via assertInstructorOwnsCourse, not by RBAC alone.
router.get('/instructor/courses', authenticate, requirePermission('course.update'), getMyInstructorCourses);
router.get('/instructor/courses/:id', authenticate, requirePermission('course.update'), validate(courseIdParamSchema), getMyInstructorCourseById);
router.patch('/instructor/courses/:id', authenticate, requirePermission('course.update'), validate(updateCourseSchema), patchMyInstructorCourse);
router.post('/instructor/courses/:id/modules', authenticate, requirePermission('course.module.manage'), validate(createModuleSchema.extend({ params: courseIdParamSchema.shape.params })), postMyInstructorModule);
router.get('/instructor/courses/:id/modules', authenticate, requirePermission('course.module.manage'), validate(courseIdParamSchema), getMyInstructorCourseModules);
router.patch('/instructor/modules/:moduleId', authenticate, requirePermission('course.module.manage'), validate(updateModuleSchema), patchMyInstructorModule);
router.post('/instructor/courses/:id/modules/reorder', authenticate, requirePermission('course.module.manage'), validate(reorderModulesSchema.extend({ params: courseIdParamSchema.shape.params })), postMyInstructorModuleReorder);
router.post('/instructor/modules/:moduleId/release', authenticate, requirePermission('course.module.manage'), validate(moduleIdParamSchema), postMyInstructorReleaseModule);

// --- Instructor-scoped: lessons / activities (Phase 6 Part 2A) ------------
router.post('/instructor/modules/:moduleId/lessons', authenticate, requirePermission('course.module.manage'), validate(createLessonSchema), postMyInstructorLesson);
router.get('/instructor/modules/:moduleId/lessons', authenticate, requirePermission('course.module.manage'), validate(moduleLessonsParamSchema), getMyInstructorModuleLessons);
router.get('/instructor/lessons/:lessonId', authenticate, requirePermission('course.module.manage'), validate(lessonIdParamSchema), getMyInstructorLesson);
router.patch('/instructor/lessons/:lessonId', authenticate, requirePermission('course.module.manage'), validate(updateLessonSchema), patchMyInstructorLesson);
router.post('/instructor/modules/:moduleId/lessons/reorder', authenticate, requirePermission('course.module.manage'), validate(reorderLessonsSchema), postMyInstructorLessonReorder);
router.post('/instructor/lessons/:lessonId/activities', authenticate, requirePermission('course.module.manage'), validate(createActivitySchema), postMyInstructorActivity);
router.get('/instructor/lessons/:lessonId/activities', authenticate, requirePermission('course.module.manage'), validate(lessonActivitiesParamSchema), getMyInstructorLessonActivities);
router.patch('/instructor/activities/:activityId', authenticate, requirePermission('course.module.manage'), validate(updateActivitySchema), patchMyInstructorActivity);

// --- Instructor-scoped: enrollments / progress (Phase 6 Part 2B) ----------
router.get('/instructor/courses/:id/enrollments', authenticate, requirePermission('course.update'), validate(courseIdParamSchema), getMyInstructorCourseEnrollments);
router.post('/instructor/courses/:id/enrollments/complete', authenticate, requirePermission('course.update'), validate(instructorOverrideCompleteSchema), postMyInstructorOverrideComplete);

// --- Student-facing "/me" API (Phase 6 Part 2B, FR-020/US1/US2) -----------
// EVERY handler reads the acting user from `req.user!.id` only — no route
// below accepts a caller-supplied `userId` anywhere (params, query, or
// body). `course.view` is the correct baseline permission here (the same
// one every authenticated consumer role already holds) — access to a
// SPECIFIC course/lesson's content is then additionally gated by the
// access evaluator inside the controller, not by RBAC alone.
const meBaseline = requirePermission('course.view');
router.post('/me/enrollments', authenticate, meBaseline, validate(selfEnrollSchema), postSelfEnroll);
router.get('/me/enrollments', authenticate, meBaseline, getMyEnrollments);
router.get('/me/courses/:courseId/access', authenticate, meBaseline, validate(meCourseIdParamSchema), getMyCourseAccess);
router.get('/me/courses/:courseId/progress', authenticate, meBaseline, validate(meCourseIdParamSchema), getMyCourseProgress);
router.get('/me/courses/:courseId/curriculum', authenticate, meBaseline, validate(meCourseIdParamSchema), getMyCourseCurriculum);
router.get('/me/courses/:courseId/continue-learning', authenticate, meBaseline, validate(meCourseIdParamSchema), getMyContinueLearning);
router.get('/me/lessons/:lessonId', authenticate, meBaseline, validate(lessonIdParamSchema), getMyLesson);
router.post('/me/lessons/:lessonId/progress', authenticate, meBaseline, validate(updateLessonProgressSchema), postMyLessonProgress);
router.post('/me/lessons/:lessonId/complete', authenticate, meBaseline, validate(completeLessonSchema), postMyLessonComplete);
// CORRECTION (Part 2 correction pass) — the discrete "I viewed this
// activity" event backing real ALL_ACTIVITIES_VIEWED evaluation (see
// docs/lms/COMPLETION_ENGINE.md). Reuses the existing admin
// `activityIdParamSchema` — the params shape is identical.
router.post('/me/activities/:activityId/viewed', authenticate, meBaseline, validate(activityIdParamSchema), postMyActivityViewed);

// --- Student-facing quiz attempts (004 US3 Quiz System batch) -------------
router.get('/me/quizzes/:quizId', authenticate, meBaseline, validate(quizIdParamSchema), getMyQuizOverview);
router.post('/me/quizzes/:quizId/attempts', authenticate, meBaseline, validate(quizIdParamSchema), postStartAttempt);
router.get('/me/quiz-attempts/:attemptId', authenticate, meBaseline, validate(attemptIdParamSchema), getMyAttempt);
router.post('/me/quiz-attempts/:attemptId/answers/:questionId', authenticate, meBaseline, validate(submitAnswerSchema), postSaveAnswer);
router.post('/me/quiz-attempts/:attemptId/submit', authenticate, meBaseline, validate(attemptIdParamSchema), postSubmitAttempt);

// --- Student-facing assignment submissions (004 US4 Assignment System batch) -
router.post('/me/assignments/:assignmentId/submissions', authenticate, meBaseline, validate(assignmentIdParamSchema), postStartSubmission);
router.get('/me/assignments/:assignmentId/submissions', authenticate, meBaseline, validate(assignmentIdParamSchema), getMySubmissions);
router.get('/me/submissions/:submissionId', authenticate, meBaseline, validate(submissionIdParamSchema), getMySubmissionDetail);
router.patch('/me/submissions/:submissionId', authenticate, meBaseline, validate(saveDraftSchema), patchMySubmission);
router.post('/me/submissions/:submissionId/submit', authenticate, meBaseline, validate(submissionIdParamSchema), postSubmitSubmission);

// --- Student-facing peer review (004 US9 Peer Review batch, FR-076) --------
router.get('/me/peer-review-queue', authenticate, meBaseline, getMyPeerReviewQueue);
router.post('/me/submissions/:submissionId/peer-review', authenticate, meBaseline, validate(submissionIdParamSchema), postClaimPeerReview);
router.post('/me/peer-reviews/:peerReviewId/submit', authenticate, meBaseline, validate(submitPeerReviewSchema), postSubmitPeerReview);
router.get('/me/submissions/:submissionId/peer-reviews', authenticate, meBaseline, validate(submissionIdParamSchema), getMyPeerReviewsReceived);

// --- Student-facing certificates (004 US5 Certificate System batch) -------
router.get('/me/certificates', authenticate, meBaseline, getMyCertificates);
router.get('/me/certificates/:certificateId', authenticate, meBaseline, validate(certificateIdParamSchema), getMyCertificateDetail);
router.get('/me/courses/:courseId/certificate-eligibility', authenticate, meBaseline, validate(certificateCourseIdParamSchema), getMyCertificateEligibility);
router.post('/me/courses/:courseId/certificate', authenticate, meBaseline, validate(certificateCourseIdParamSchema), postMyCertificate);

// --- Student-facing reviews, recommendations, catalog (004 Discovery & Recommendations batch) -
router.get('/me/courses/:courseId/review', authenticate, meBaseline, validate(reviewCourseIdParamSchema), getMyCourseReview);
router.get('/me/courses/:courseId/review-eligibility', authenticate, meBaseline, validate(reviewCourseIdParamSchema), getMyReviewEligibility);
router.post('/me/courses/:courseId/review', authenticate, meBaseline, validate(submitReviewSchema), postMyCourseReview);
router.get('/me/recommendations', authenticate, meBaseline, getMyRecommendations);
router.get('/me/catalog', authenticate, meBaseline, getMyCatalog);

// --- Organization-admin course assignment (004 FR-033) --------------------
// `organization.manage_own` — the SAME own-org-scoped permission
// `organization/organization-admin.controller.ts` already uses; every
// handler additionally re-verifies the target user/enrollment belongs to
// the actor's own organization inside `org-assignment.service.ts` (RBAC
// alone is not the access boundary here, matching this repo's established
// "hiding a UI control is not a security control" / defense-in-depth rule).
const orgManageOwn = requirePermission('organization.manage_own');
router.post('/organization/courses/:courseId/assign', authenticate, orgManageOwn, validate(assignCourseToOrgMembersSchema), postAssignCourseToOrgMembers);
router.get('/organization/enrollments', authenticate, orgManageOwn, validate(orgEnrollmentQuerySchema), getOrganizationEnrollments);
router.post('/organization/enrollments/:enrollmentId/revoke', authenticate, orgManageOwn, validate(orgRemoveAccessSchema), postRemoveOrgMemberAccess);
router.post('/organization/enrollments/:enrollmentId/deadline', authenticate, orgManageOwn, validate(orgSetDeadlineSchema), postSetOrgMemberDeadline);

export const lmsRouter = router;
