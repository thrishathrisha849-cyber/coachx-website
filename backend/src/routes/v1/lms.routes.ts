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
  changeTranslationStatusSchema,
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
  playbackProgressSchema,
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
import { updateLmsSettingsSchema } from '../../lms/lms-settings.validation';
import {
  createBankItemSchema,
  updateBankItemSchema,
  bankItemIdParamSchema,
  listBankItemsQuerySchema,
  generateQuestionsFromBankSchema,
} from '../../lms/question-bank.validation';
import {
  postBankItem,
  getBankItemsForCourse,
  getBankItemByIdAdmin,
  patchBankItem,
  postArchiveBankItem,
  postGenerateQuestionsFromBank,
} from '../../lms/question-bank.controller';
import {
  createCohortSchema,
  updateCohortSchema,
  cohortIdParamSchema,
  courseIdParamSchema as cohortCourseIdParamSchema,
  addCohortMemberSchema,
  cohortMemberIdParamSchema,
  setCohortModuleScheduleSchema,
  cohortModuleParamSchema,
} from '../../lms/cohort.validation';
import {
  postCohort,
  getCohortsForCourse,
  getCohortByIdAdmin,
  patchCohort,
  postCohortMember,
  getCohortMembers,
  deleteCohortMemberAdmin,
  putCohortModuleSchedule,
  deleteCohortModuleScheduleAdmin,
  getCohortModuleSchedules,
} from '../../lms/cohort.controller';
import {
  flagForInvestigationSchema,
  listAcademicIntegrityCasesQuerySchema,
  academicIntegrityCaseIdParamSchema,
  resolveInvestigationSchema,
  resolveIntegrityAppealSchema,
} from '../../lms/academic-integrity.validation';
import {
  postFlagForInvestigation,
  getAcademicIntegrityCases,
  getAcademicIntegrityCaseDetail,
  postResolveInvestigation,
  postResolveIntegrityAppeal,
  getMyAcademicIntegrityCases,
} from '../../lms/academic-integrity.controller';
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
  postTranslationStatus,
  getTranslationVariants,
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
  getLmsSettingsForAdmin,
  patchLmsSettings,
  getCourseCalendarForAdmin,
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
  getMyLearningStreak,
  getMyVersionMigrationStatus,
  postMigrateMyVersion,
  getMyLesson,
  postMyLessonProgress,
  postMyLessonComplete,
  postMyActivityViewed,
  getMyActivityTranscript,
  postMyActivityPlaybackStarted,
  postMyActivityPlaybackProgress,
  getMyActivityPlayback,
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
  submitSubmissionSchema,
  submitSelfAssessmentSchema,
  saveDraftSchema,
  reviewSubmissionSchema,
  listSubmissionsQuerySchema,
  submitPeerReviewSchema,
  moderatePeerReviewSchema,
  replyToFeedbackSchema,
  requestClarificationSchema,
  respondToFeedbackAdminSchema,
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
  moduleIdParamSchema as projectModuleIdParamSchema,
  projectIdParamSchema,
  createProjectSchema,
  updateProjectSchema,
  changeProjectStatusSchema,
  linkArtifactSchema,
  unlinkArtifactSchema,
} from '../../lms/project.validation';
import {
  postProject,
  getProjectsForModuleAdmin,
  getCandidateAssignmentsForModuleAdmin,
  getProjectByIdAdmin,
  patchProject,
  postProjectStatus,
  postLinkArtifact,
  postUnlinkArtifact,
  getMyProjectStatus,
} from '../../lms/project.controller';
import {
  getMyAssignmentOverview,
  postStartSubmission,
  getMySubmissions,
  getMySubmissionDetail,
  patchMySubmission,
  postSubmitSubmission,
  postSelfAssessSubmission,
  getSubmissionsForReview,
  getSubmissionByIdAdmin,
  postReviewSubmission,
  postMarkFeedbackViewed,
  postReplyToFeedback,
  postRequestClarification,
  getMyFeedbackMessages,
  postRespondToFeedbackAdmin,
  getFeedbackMessagesAdmin,
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
import { courseAnnouncementsParamSchema, announcementIdParamSchema, createAnnouncementSchema, updateAnnouncementSchema } from '../../lms/announcement.validation';
import {
  postAnnouncement,
  getAnnouncementsForCourseAdmin,
  getAnnouncementByIdAdmin,
  patchAnnouncement,
  postPublishAnnouncement,
  postArchiveAnnouncement,
  getMyCourseAnnouncements,
} from '../../lms/announcement.controller';
import { courseIdParamSchema as waitlistCourseIdParamSchema, waitlistEntryIdParamSchema, joinWaitlistSchema } from '../../lms/waitlist.validation';
import { postJoinWaitlist, getMyWaitlistEntry, postClaimWaitlistOffer, getWaitlistForCourseAdmin } from '../../lms/waitlist.controller';
import { courseIdParamSchema as wishlistCourseIdParamSchema } from '../../lms/wishlist.validation';
import { postSaveToWishlist, deleteFromWishlist, getMyWishlist } from '../../lms/wishlist.controller';
import {
  lessonIdParamSchema as resourceLessonIdParamSchema,
  resourceIdParamSchema,
  createResourceSchema,
  updateResourceSchema,
  reorderResourcesSchema,
} from '../../lms/lesson-resource.validation';
import {
  postResource,
  getLessonResourcesAdmin,
  patchResource,
  postArchiveResource,
  postReorderResources,
  getMyLessonResources,
  postMyResourceViewed,
  postMyResourceDownload,
} from '../../lms/lesson-resource.controller';
import {
  lessonIdParamSchema as noteLessonIdParamSchema,
  courseIdParamSchema as noteCourseIdParamSchema,
  noteIdParamSchema,
  createNoteSchema,
  updateNoteSchema,
  searchNotesQuerySchema,
  exportNotesQuerySchema,
} from '../../lms/learner-note.validation';
import {
  postLessonNote,
  patchMyNote,
  deleteMyNoteHandler,
  getMyLessonNotes,
  getMyCourseNotes,
  getMyNotesSearch,
  getMyNotesExport,
} from '../../lms/learner-note.controller';
import {
  lessonIdParamSchema as bookmarkLessonIdParamSchema,
  courseIdParamSchema as bookmarkCourseIdParamSchema,
  bookmarkIdParamSchema,
  createBookmarkSchema,
} from '../../lms/bookmark.validation';
import { postLessonBookmark, deleteMyBookmark, getMyLessonBookmarks, getMyCourseBookmarks } from '../../lms/bookmark.controller';
import { bulkImportSchema } from '../../lms/bulk-enrollment.validation';
import { postBulkImportEnrollments } from '../../lms/bulk-enrollment.controller';

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

// --- Admin: LMS-wide settings (FR-114, FR-110's "Settings" nav entry) -----
const adminSettingsPermission = requirePermission('course.settings.manage');
router.get('/admin/settings', authenticate, adminSettingsPermission, getLmsSettingsForAdmin);
router.patch('/admin/settings', authenticate, adminSettingsPermission, validate(updateLmsSettingsSchema), patchLmsSettings);

// --- Admin: Academic-integrity investigation (T120, FR-116) --------------
const adminIntegrityPermission = requirePermission('course.academicIntegrity.manage');
router.post('/admin/academic-integrity/cases', authenticate, adminIntegrityPermission, validate(flagForInvestigationSchema), postFlagForInvestigation);
router.get('/admin/academic-integrity/cases', authenticate, adminIntegrityPermission, validate(listAcademicIntegrityCasesQuerySchema), getAcademicIntegrityCases);
router.get('/admin/academic-integrity/cases/:caseId', authenticate, adminIntegrityPermission, validate(academicIntegrityCaseIdParamSchema), getAcademicIntegrityCaseDetail);
router.post('/admin/academic-integrity/cases/:caseId/resolve', authenticate, adminIntegrityPermission, validate(resolveInvestigationSchema), postResolveInvestigation);
router.post('/admin/academic-integrity/appeals/:appealId/resolve', authenticate, adminIntegrityPermission, validate(resolveIntegrityAppealSchema), postResolveIntegrityAppeal);

// --- Admin: Cohorts (T085, FR-012/FR-034) ---------------------------------
const adminCohortPermission = requirePermission('course.cohort.manage');
router.post('/admin/courses/:courseId/cohorts', authenticate, adminCohortPermission, validate(createCohortSchema), postCohort);
router.get('/admin/courses/:courseId/cohorts', authenticate, requirePermission('course.view'), validate(cohortCourseIdParamSchema), getCohortsForCourse);
router.get('/admin/cohorts/:cohortId', authenticate, requirePermission('course.view'), validate(cohortIdParamSchema), getCohortByIdAdmin);
router.patch('/admin/cohorts/:cohortId', authenticate, adminCohortPermission, validate(updateCohortSchema), patchCohort);
router.post('/admin/cohorts/:cohortId/members', authenticate, adminCohortPermission, validate(addCohortMemberSchema), postCohortMember);
router.get('/admin/cohorts/:cohortId/members', authenticate, requirePermission('course.view'), validate(cohortIdParamSchema), getCohortMembers);
router.delete('/admin/cohorts/:cohortId/members/:memberId', authenticate, adminCohortPermission, validate(cohortMemberIdParamSchema), deleteCohortMemberAdmin);
router.put('/admin/cohorts/:cohortId/schedule/:moduleId', authenticate, adminCohortPermission, validate(setCohortModuleScheduleSchema), putCohortModuleSchedule);
router.delete('/admin/cohorts/:cohortId/schedule/:moduleId', authenticate, adminCohortPermission, validate(cohortModuleParamSchema), deleteCohortModuleScheduleAdmin);
router.get('/admin/cohorts/:cohortId/schedule', authenticate, requirePermission('course.view'), validate(cohortIdParamSchema), getCohortModuleSchedules);

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

// 004 Course Translation Management batch (FR-101) — reuses `course.update`,
// the same baseline every other course-metadata-editing action uses.
router.post('/admin/courses/:id/translation-status', authenticate, requirePermission('course.update'), validate(changeTranslationStatusSchema), postTranslationStatus);
router.get('/admin/courses/:id/translations', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getTranslationVariants);

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

// --- Admin: downloadable resources (004 Downloadable Resource Catalog batch, FR-049) -
// Reuses `course.module.manage` — same authoring tier as activities above (a
// resource is content belonging to a lesson, not a materially different privilege).
router.post('/admin/lessons/:lessonId/resources', authenticate, manageModules, validate(createResourceSchema), postResource);
router.get('/admin/lessons/:lessonId/resources', authenticate, requirePermission('course.view'), validate(resourceLessonIdParamSchema), getLessonResourcesAdmin);
router.patch('/admin/resources/:resourceId', authenticate, manageModules, validate(updateResourceSchema), patchResource);
router.post('/admin/lessons/:lessonId/resources/reorder', authenticate, manageModules, validate(reorderResourcesSchema), postReorderResources);
router.post('/admin/resources/:resourceId/archive', authenticate, manageModules, validate(resourceIdParamSchema), postArchiveResource);

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

// --- Admin: Question Bank (T107, FR-064) — same permission tier as quizzes above.
router.post('/admin/courses/:courseId/question-bank', authenticate, manageModules, validate(createBankItemSchema), postBankItem);
router.get('/admin/courses/:courseId/question-bank', authenticate, requirePermission('course.view'), validate(listBankItemsQuerySchema), getBankItemsForCourse);
router.get('/admin/question-bank/:itemId', authenticate, requirePermission('course.view'), validate(bankItemIdParamSchema), getBankItemByIdAdmin);
router.patch('/admin/question-bank/:itemId', authenticate, manageModules, validate(updateBankItemSchema), patchBankItem);
router.post('/admin/question-bank/:itemId/archive', authenticate, manageModules, validate(bankItemIdParamSchema), postArchiveBankItem);
router.post('/admin/quizzes/:quizId/generate-from-bank', authenticate, manageModules, validate(generateQuestionsFromBankSchema), postGenerateQuestionsFromBank);

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

// --- Admin: projects + artifact linking (004 Project-based Learning batch, FR-077) -
// Same permission tier as assignments above — a project is module-scoped
// authoring content, reviewed by the same admin/instructor tier.
router.post('/admin/modules/:moduleId/projects', authenticate, manageModules, validate(createProjectSchema), postProject);
router.get('/admin/modules/:moduleId/projects', authenticate, requirePermission('course.view'), validate(projectModuleIdParamSchema), getProjectsForModuleAdmin);
router.get('/admin/modules/:moduleId/assignments', authenticate, requirePermission('course.view'), validate(projectModuleIdParamSchema), getCandidateAssignmentsForModuleAdmin);
router.get('/admin/projects/:projectId', authenticate, requirePermission('course.view'), validate(projectIdParamSchema), getProjectByIdAdmin);
router.patch('/admin/projects/:projectId', authenticate, manageModules, validate(updateProjectSchema), patchProject);
router.post('/admin/projects/:projectId/status', authenticate, manageModules, validate(changeProjectStatusSchema), postProjectStatus);
router.post('/admin/projects/:projectId/artifacts', authenticate, manageModules, validate(linkArtifactSchema), postLinkArtifact);
router.post('/admin/projects/:projectId/artifacts/:assignmentId/unlink', authenticate, manageModules, validate(unlinkArtifactSchema), postUnlinkArtifact);

// --- Admin/reviewer: submissions (004 US4) ---------------------------------
router.get('/admin/assignments/:assignmentId/submissions', authenticate, manageModules, validate(listSubmissionsQuerySchema), getSubmissionsForReview);
router.get('/admin/submissions/:submissionId', authenticate, manageModules, validate(submissionIdParamSchema), getSubmissionByIdAdmin);
router.post('/admin/submissions/:submissionId/review', authenticate, manageModules, validate(reviewSubmissionSchema), postReviewSubmission);
router.post('/admin/submissions/:submissionId/feedback/respond', authenticate, manageModules, validate(respondToFeedbackAdminSchema), postRespondToFeedbackAdmin);
router.get('/admin/submissions/:submissionId/feedback/messages', authenticate, manageModules, validate(submissionIdParamSchema), getFeedbackMessagesAdmin);

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

// --- Admin: course announcements (004 Course Announcements batch, FR-102) -
// Reuses `course.module.manage` — an announcement is content authored for
// a course, the same tier lesson/quiz/assignment authoring already uses.
router.post('/admin/courses/:courseId/announcements', authenticate, manageModules, validate(createAnnouncementSchema), postAnnouncement);
router.get('/admin/courses/:courseId/announcements', authenticate, requirePermission('course.view'), validate(courseAnnouncementsParamSchema), getAnnouncementsForCourseAdmin);
router.get('/admin/announcements/:announcementId', authenticate, requirePermission('course.view'), validate(announcementIdParamSchema), getAnnouncementByIdAdmin);
router.patch('/admin/announcements/:announcementId', authenticate, manageModules, validate(updateAnnouncementSchema), patchAnnouncement);
router.post('/admin/announcements/:announcementId/publish', authenticate, manageModules, validate(announcementIdParamSchema), postPublishAnnouncement);
router.post('/admin/announcements/:announcementId/archive', authenticate, manageModules, validate(announcementIdParamSchema), postArchiveAnnouncement);

// --- Admin: waitlist (004 Waitlist batch, FR-028/029) ----------------------
// Read-only roster reuses `course.view` — the same baseline every other
// admin read endpoint above already uses; sweep-and-advance (offer
// expiry/next-in-line) runs as a side effect of the read itself, not a
// separate write endpoint.
router.get('/admin/courses/:courseId/waitlist', authenticate, requirePermission('course.view'), validate(waitlistCourseIdParamSchema), getWaitlistForCourseAdmin);

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

// --- Admin: bulk CSV enrollment import (004 Bulk CSV Import batch, FR-032) -
// Same `course.manageInstructors` tier as every other enrollment-granting
// action above — bulk import is many individual admin grants, not a
// materially different privilege.
router.post('/admin/courses/:id/enrollments/bulk-import', authenticate, manageInstructors, validate(bulkImportSchema), postBulkImportEnrollments);

// --- Admin: Learning Analytics & At-Risk Detection (004 FR-105–FR-108) -----
// Read-only analytics reuse `course.view` — the same baseline every other
// admin analytics/read endpoint above already uses, never a new
// permission invented for a read-only aggregate.
const analyticsView = requirePermission('course.view');
router.get('/admin/enrollments/:id/analytics', authenticate, analyticsView, validate(enrollmentIdParamSchema), getEnrollmentAnalyticsAdmin);
router.get('/admin/enrollments/:id/at-risk', authenticate, analyticsView, validate(enrollmentIdParamSchema), getEnrollmentAtRiskAdmin);
router.get('/admin/courses/:id/analytics', authenticate, analyticsView, validate(courseIdParamSchema), getCourseAnalyticsAdmin);
router.get('/admin/courses/:id/calendar', authenticate, requirePermission('course.view'), validate(courseIdParamSchema), getCourseCalendarForAdmin);
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
router.get('/me/streak', authenticate, meBaseline, getMyLearningStreak);
router.get('/me/enrollments/:id/version-status', authenticate, meBaseline, validate(enrollmentIdParamSchema), getMyVersionMigrationStatus);
router.post('/me/enrollments/:id/migrate-version', authenticate, meBaseline, validate(enrollmentIdParamSchema), postMigrateMyVersion);
router.get('/me/courses/:courseId/announcements', authenticate, meBaseline, validate(meCourseIdParamSchema), getMyCourseAnnouncements);
router.get('/me/lessons/:lessonId', authenticate, meBaseline, validate(lessonIdParamSchema), getMyLesson);
router.post('/me/lessons/:lessonId/progress', authenticate, meBaseline, validate(updateLessonProgressSchema), postMyLessonProgress);
router.post('/me/lessons/:lessonId/complete', authenticate, meBaseline, validate(completeLessonSchema), postMyLessonComplete);
// CORRECTION (Part 2 correction pass) — the discrete "I viewed this
// activity" event backing real ALL_ACTIVITIES_VIEWED evaluation (see
// docs/lms/COMPLETION_ENGINE.md). Reuses the existing admin
// `activityIdParamSchema` — the params shape is identical.
router.post('/me/activities/:activityId/viewed', authenticate, meBaseline, validate(activityIdParamSchema), postMyActivityViewed);
// 004 Captions + Transcript Support batch (FR-044/FR-046) — downloadable
// transcript, generated server-side from `transcriptSegments`.
router.get('/me/activities/:activityId/transcript', authenticate, meBaseline, validate(activityIdParamSchema), getMyActivityTranscript);
// 004 PiP + Video Playback Telemetry batch (FR-040) — VIDEO-only telemetry,
// distinct from the coarser lesson-level `/me/lessons/:lessonId/progress`.
router.post('/me/activities/:activityId/playback/started', authenticate, meBaseline, validate(activityIdParamSchema), postMyActivityPlaybackStarted);
router.post('/me/activities/:activityId/playback/progress', authenticate, meBaseline, validate(playbackProgressSchema), postMyActivityPlaybackProgress);
router.get('/me/activities/:activityId/playback', authenticate, meBaseline, validate(activityIdParamSchema), getMyActivityPlayback);

// --- Student-facing learner notes (004 Learner Notes & Bookmarks batch, FR-058) -
// STRICTLY private (FR-033) — there is deliberately no admin-facing route
// for this entity anywhere in this file. `/me/notes/search` and
// `/me/notes/export` are registered BEFORE any `/me/notes/:noteId`-shaped
// route so Express never mistakes "search"/"export" for a noteId param.
router.get('/me/notes/search', authenticate, meBaseline, validate(searchNotesQuerySchema), getMyNotesSearch);
router.get('/me/notes/export', authenticate, meBaseline, validate(exportNotesQuerySchema), getMyNotesExport);
router.post('/me/lessons/:lessonId/notes', authenticate, meBaseline, validate(createNoteSchema), postLessonNote);
router.get('/me/lessons/:lessonId/notes', authenticate, meBaseline, validate(noteLessonIdParamSchema), getMyLessonNotes);
router.get('/me/courses/:courseId/notes', authenticate, meBaseline, validate(noteCourseIdParamSchema), getMyCourseNotes);
router.patch('/me/notes/:noteId', authenticate, meBaseline, validate(updateNoteSchema), patchMyNote);
router.delete('/me/notes/:noteId', authenticate, meBaseline, validate(noteIdParamSchema), deleteMyNoteHandler);

// --- Student-facing bookmarks (004 Learner Notes & Bookmarks batch, FR-059) -
// Same strict privacy model as notes above — no admin route exists.
router.post('/me/lessons/:lessonId/bookmarks', authenticate, meBaseline, validate(createBookmarkSchema), postLessonBookmark);
router.get('/me/lessons/:lessonId/bookmarks', authenticate, meBaseline, validate(bookmarkLessonIdParamSchema), getMyLessonBookmarks);
router.get('/me/courses/:courseId/bookmarks', authenticate, meBaseline, validate(bookmarkCourseIdParamSchema), getMyCourseBookmarks);
router.delete('/me/bookmarks/:bookmarkId', authenticate, meBaseline, validate(bookmarkIdParamSchema), deleteMyBookmark);

// --- Student-facing downloadable resources (004 Downloadable Resource Catalog batch, FR-049) -
router.get('/me/lessons/:lessonId/resources', authenticate, meBaseline, validate(resourceLessonIdParamSchema), getMyLessonResources);
router.post('/me/lesson-resources/:resourceId/viewed', authenticate, meBaseline, validate(resourceIdParamSchema), postMyResourceViewed);
router.post('/me/lesson-resources/:resourceId/download', authenticate, meBaseline, validate(resourceIdParamSchema), postMyResourceDownload);

// --- Student-facing quiz attempts (004 US3 Quiz System batch) -------------
router.get('/me/quizzes/:quizId', authenticate, meBaseline, validate(quizIdParamSchema), getMyQuizOverview);
router.post('/me/quizzes/:quizId/attempts', authenticate, meBaseline, validate(quizIdParamSchema), postStartAttempt);
router.get('/me/quiz-attempts/:attemptId', authenticate, meBaseline, validate(attemptIdParamSchema), getMyAttempt);
router.post('/me/quiz-attempts/:attemptId/answers/:questionId', authenticate, meBaseline, validate(submitAnswerSchema), postSaveAnswer);
router.post('/me/quiz-attempts/:attemptId/submit', authenticate, meBaseline, validate(attemptIdParamSchema), postSubmitAttempt);

// --- Student-facing projects (004 Project-based Learning batch, FR-077) ----
router.get('/me/projects/:projectId', authenticate, meBaseline, validate(projectIdParamSchema), getMyProjectStatus);

// --- Student-facing assignment submissions (004 US4 Assignment System batch) -
// 004 Broader Assessment Types batch (FR-068) — the overview route must be
// registered before the more specific `/submissions` suffix routes below
// (both share the `:assignmentId` param, but Express matches by path shape
// first, so ordering here is only a readability convention, not a
// correctness requirement — still kept adjacent for discoverability).
router.get('/me/assignments/:assignmentId', authenticate, meBaseline, validate(assignmentIdParamSchema), getMyAssignmentOverview);
router.post('/me/assignments/:assignmentId/submissions', authenticate, meBaseline, validate(assignmentIdParamSchema), postStartSubmission);
router.get('/me/assignments/:assignmentId/submissions', authenticate, meBaseline, validate(assignmentIdParamSchema), getMySubmissions);
router.get('/me/submissions/:submissionId', authenticate, meBaseline, validate(submissionIdParamSchema), getMySubmissionDetail);
router.patch('/me/submissions/:submissionId', authenticate, meBaseline, validate(saveDraftSchema), patchMySubmission);
router.post('/me/submissions/:submissionId/submit', authenticate, meBaseline, validate(submitSubmissionSchema), postSubmitSubmission);
// 004 Broader Assessment Types batch (FR-068) — SELF_ASSESSMENT/SKILL_RATING's own submit+outcome path.
router.post('/me/submissions/:submissionId/self-assess', authenticate, meBaseline, validate(submitSelfAssessmentSchema), postSelfAssessSubmission);

// --- Assignment Feedback Interaction, learner side (004, FR-078, T067) -----
router.post('/me/submissions/:submissionId/feedback/viewed', authenticate, meBaseline, validate(submissionIdParamSchema), postMarkFeedbackViewed);
router.post('/me/submissions/:submissionId/feedback/reply', authenticate, meBaseline, validate(replyToFeedbackSchema), postReplyToFeedback);
router.post('/me/submissions/:submissionId/feedback/clarify', authenticate, meBaseline, validate(requestClarificationSchema), postRequestClarification);
router.get('/me/submissions/:submissionId/feedback/messages', authenticate, meBaseline, validate(submissionIdParamSchema), getMyFeedbackMessages);

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

// --- Student-facing academic-integrity cases (T120, FR-116) ---------------
router.get('/me/academic-integrity/cases', authenticate, meBaseline, getMyAcademicIntegrityCases);

// --- Student-facing reviews, recommendations, catalog (004 Discovery & Recommendations batch) -
router.get('/me/courses/:courseId/review', authenticate, meBaseline, validate(reviewCourseIdParamSchema), getMyCourseReview);
router.get('/me/courses/:courseId/review-eligibility', authenticate, meBaseline, validate(reviewCourseIdParamSchema), getMyReviewEligibility);
router.post('/me/courses/:courseId/review', authenticate, meBaseline, validate(submitReviewSchema), postMyCourseReview);
router.get('/me/recommendations', authenticate, meBaseline, getMyRecommendations);
router.get('/me/catalog', authenticate, meBaseline, getMyCatalog);

// --- Student-facing waitlist (004 Waitlist batch, FR-028/029) --------------
router.post('/me/courses/:courseId/waitlist', authenticate, meBaseline, validate(joinWaitlistSchema), postJoinWaitlist);
router.get('/me/courses/:courseId/waitlist', authenticate, meBaseline, validate(waitlistCourseIdParamSchema), getMyWaitlistEntry);
router.post('/me/waitlist/:id/claim', authenticate, meBaseline, validate(waitlistEntryIdParamSchema), postClaimWaitlistOffer);

// --- Student-facing wishlist (004 Wishlist batch, FR-027) ------------------
router.get('/me/wishlist', authenticate, meBaseline, getMyWishlist);
router.post('/me/courses/:courseId/wishlist', authenticate, meBaseline, validate(wishlistCourseIdParamSchema), postSaveToWishlist);
router.delete('/me/courses/:courseId/wishlist', authenticate, meBaseline, validate(wishlistCourseIdParamSchema), deleteFromWishlist);

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
