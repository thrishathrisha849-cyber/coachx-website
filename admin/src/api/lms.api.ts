import type { ApiSuccessResponse, PaginationMeta } from '@coachx/shared';
import { apiClient } from './client';

/**
 * 004 Quiz System batch — minimal course/module/lesson browsing so an
 * admin can navigate to the lesson they want to attach a quiz to. This is
 * NOT the full course-builder/admin-course-list surface (that's a
 * separate, larger "LMS Admin UI" effort) — just enough reads, reusing the
 * existing backend admin endpoints, to make the Quizzes page usable.
 */

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
}

export async function getCourseAdmin(courseId: string): Promise<AdminCourseSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseSummary>>(`/lms/admin/courses/${courseId}`);
  return data.data;
}

export interface AdminModuleSummary {
  id: string;
  title: string;
  position: number;
}

export async function getCourseModulesAdmin(courseId: string): Promise<AdminModuleSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminModuleSummary[]>>(`/lms/admin/courses/${courseId}/modules`);
  return data.data;
}

export interface AdminLessonSummary {
  id: string;
  title: string;
  position: number;
}

export async function getModuleLessonsAdmin(moduleId: string): Promise<AdminLessonSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLessonSummary[]>>(`/lms/admin/modules/${moduleId}/lessons`);
  return data.data;
}

/**
 * LMS Admin UI batch — the full admin course-builder/course-list/
 * enrollment-management surface. Every function below reuses an already
 * built, already-tested backend `/lms/admin/*` endpoint
 * (`admin-lms.controller.ts`) — no backend changes were needed for this
 * batch, only these client bindings and the pages that consume them.
 */

// ============================================================================
// Categories
// ============================================================================

export interface AdminCourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  isFeatured?: boolean;
}

export async function listCategoriesAdmin(params?: { status?: string; parentId?: string }): Promise<AdminCourseCategory[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseCategory[]>>('/lms/admin/categories', { params });
  return data.data;
}

export async function createCategory(input: CategoryInput): Promise<AdminCourseCategory> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseCategory>>('/lms/admin/categories', input);
  return data.data;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<AdminCourseCategory> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminCourseCategory>>(`/lms/admin/categories/${id}`, input);
  return data.data;
}

export async function archiveCategory(id: string): Promise<void> {
  await apiClient.post(`/lms/admin/categories/${id}/archive`);
}

export async function restoreCategory(id: string): Promise<void> {
  await apiClient.post(`/lms/admin/categories/${id}/restore`);
}

// ============================================================================
// Courses
// ============================================================================

export interface AdminCourseFull {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  description: string | null;
  learningOutcomes: string[];
  tags: string[];
  targetAudience: string | null;
  toolsRequired: string[];
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  trailerUrl: string | null;
  language: string;
  level: string;
  categoryId: string | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  weeklyCommitmentMinutes: number | null;
  certificateAvailable: boolean;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  status: string;
  enrollmentLimit: number | null;
  enrollmentStartAt: string | null;
  enrollmentEndAt: string | null;
  publishAt: string | null;
  expireAt: string | null;
  reviewNotes: string | null;
  version: number;
  instructors: { userId: string; displayName: string; role: string; isPrimary: boolean }[];
  ratingAverage: number | null;
  ratingCount: number;
  learnerCount: number;
  publishedAt: string | null;
  updatedAt: string;
  /** 004 US6 polish batch (FR-034) — the authoring-time default new modules inherit. */
  sequencingMode: string;
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  thumbnailUrl?: string;
  language?: string;
  level?: string;
  priceType?: string;
  priceAmountMinor?: number;
  certificateAvailable?: boolean;
  /** 004 US6 polish batch (FR-034). */
  sequencingMode?: string;
}

export interface AdminCourseListQuery {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export async function listCoursesAdmin(query: AdminCourseListQuery = {}): Promise<{ data: AdminCourseFull[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseFull[]>>('/lms/admin/courses', {
    params: { ...query, page: query.page?.toString(), pageSize: query.pageSize?.toString() },
  });
  return { data: data.data, meta: data.meta as unknown as PaginationMeta };
}

export async function getCourseAdminFull(id: string): Promise<AdminCourseFull> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseFull>>(`/lms/admin/courses/${id}`);
  return data.data;
}

export async function createCourse(input: CreateCourseInput): Promise<AdminCourseFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseFull>>('/lms/admin/courses', input);
  return data.data;
}

export async function updateCourse(id: string, input: Partial<Omit<CreateCourseInput, 'categoryId'>> & { categoryId?: string | null } & Record<string, unknown>): Promise<AdminCourseFull> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminCourseFull>>(`/lms/admin/courses/${id}`, input);
  return data.data;
}

export async function changeCourseStatus(id: string, status: string, reviewNote?: string): Promise<AdminCourseFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseFull>>(`/lms/admin/courses/${id}/status`, { status, reviewNote });
  return data.data;
}

export async function archiveCourseAdmin(id: string): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${id}/archive`);
}

export const COURSE_CLONE_MODES = ['FULL', 'CURRICULUM_ONLY', 'CONTENT_WITHOUT_ENROLLMENTS', 'ASSESSMENT_BANK', 'CERTIFICATE_SETTINGS', 'TRANSLATION_VARIANT'] as const;
export type CourseCloneMode = (typeof COURSE_CLONE_MODES)[number];

export interface CloneCourseInput {
  mode: CourseCloneMode;
  slug: string;
  title?: string;
  language?: string;
}

export async function cloneCourse(id: string, input: CloneCourseInput): Promise<AdminCourseFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseFull>>(`/lms/admin/courses/${id}/clone`, input);
  return data.data;
}

export async function restoreCourseAdmin(id: string): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${id}/restore`);
}

// --- Instructors ------------------------------------------------------------

export interface AdminCourseInstructor {
  userId: string;
  displayName: string;
  role: string;
  isPrimary: boolean;
}

export async function listCourseInstructors(courseId: string): Promise<AdminCourseInstructor[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseInstructor[]>>(`/lms/admin/courses/${courseId}/instructors`);
  return data.data;
}

export async function assignCourseInstructor(courseId: string, input: { userId: string; role?: string; isPrimary?: boolean }): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${courseId}/instructors`, input);
}

export async function removeCourseInstructor(courseId: string, userId: string): Promise<void> {
  await apiClient.delete(`/lms/admin/courses/${courseId}/instructors/${userId}`);
}

export async function setPrimaryCourseInstructor(courseId: string, userId: string): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${courseId}/instructors/${userId}/primary`);
}

// ============================================================================
// Modules
// ============================================================================

export interface AdminCourseModuleFull {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  outcome: string | null;
  position: number;
  estimatedDurationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  status: string;
  prerequisiteModuleId: string | null;
  releaseRuleType: string;
  completionRuleType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleInput {
  title: string;
  description?: string;
  outcome?: string;
  isMandatory?: boolean;
  isPreview?: boolean;
  prerequisiteModuleId?: string | null;
  releaseRuleType?: string;
  completionRuleType?: string;
}

export async function listModulesForCourse(courseId: string): Promise<AdminCourseModuleFull[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseModuleFull[]>>(`/lms/admin/courses/${courseId}/modules`);
  return data.data;
}

export async function getModuleAdminFull(moduleId: string): Promise<AdminCourseModuleFull> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseModuleFull>>(`/lms/admin/modules/${moduleId}`);
  return data.data;
}

export async function createModule(courseId: string, input: ModuleInput): Promise<AdminCourseModuleFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseModuleFull>>(`/lms/admin/courses/${courseId}/modules`, input);
  return data.data;
}

export async function updateModule(moduleId: string, input: Partial<ModuleInput> & { status?: string }): Promise<AdminCourseModuleFull> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminCourseModuleFull>>(`/lms/admin/modules/${moduleId}`, input);
  return data.data;
}

export async function reorderModules(courseId: string, orderedIds: string[]): Promise<void> {
  await apiClient.post(`/lms/admin/courses/${courseId}/modules/reorder`, { orderedIds });
}

export async function archiveModule(moduleId: string): Promise<void> {
  await apiClient.post(`/lms/admin/modules/${moduleId}/archive`);
}

export async function restoreModule(moduleId: string): Promise<void> {
  await apiClient.post(`/lms/admin/modules/${moduleId}/restore`);
}

export async function releaseModuleNow(moduleId: string): Promise<AdminCourseModuleFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseModuleFull>>(`/lms/admin/modules/${moduleId}/release`);
  return data.data;
}

// ============================================================================
// Lessons
// ============================================================================

export interface AdminLessonFull {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  position: number;
  durationMinutes: number | null;
  isPreview: boolean;
  isMandatory: boolean;
  status: string;
  completionRuleType: string;
  completionRuleTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonInput {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  isPreview?: boolean;
  isMandatory?: boolean;
  completionRuleType?: string;
  completionRuleTypes?: string[];
}

export async function listLessonsForModule(moduleId: string): Promise<AdminLessonFull[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLessonFull[]>>(`/lms/admin/modules/${moduleId}/lessons`);
  return data.data;
}

export async function getLessonAdminFull(lessonId: string): Promise<AdminLessonFull> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLessonFull>>(`/lms/admin/lessons/${lessonId}`);
  return data.data;
}

export async function createLesson(moduleId: string, input: LessonInput): Promise<AdminLessonFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminLessonFull>>(`/lms/admin/modules/${moduleId}/lessons`, input);
  return data.data;
}

export async function updateLesson(lessonId: string, input: Partial<LessonInput> & { status?: string }): Promise<AdminLessonFull> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminLessonFull>>(`/lms/admin/lessons/${lessonId}`, input);
  return data.data;
}

export async function reorderLessons(moduleId: string, orderedIds: string[]): Promise<void> {
  await apiClient.post(`/lms/admin/modules/${moduleId}/lessons/reorder`, { orderedIds });
}

export async function archiveLesson(lessonId: string): Promise<void> {
  await apiClient.post(`/lms/admin/lessons/${lessonId}/archive`);
}

export async function restoreLesson(lessonId: string): Promise<void> {
  await apiClient.post(`/lms/admin/lessons/${lessonId}/restore`);
}

// ============================================================================
// Learning Activities
// ============================================================================

export interface AdminActivity {
  id: string;
  lessonId: string;
  type: string;
  title: string | null;
  position: number;
  mediaUrl: string | null;
  externalUrl: string | null;
  bodyText: string | null;
  embedProvider: string | null;
  embedResourceId: string | null;
  status: string;
}

export interface ActivityInput {
  type: string;
  title?: string;
  mediaUrl?: string;
  externalUrl?: string;
  bodyText?: string;
  embedProvider?: string;
  embedResourceId?: string;
}

export async function listActivitiesForLesson(lessonId: string): Promise<AdminActivity[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminActivity[]>>(`/lms/admin/lessons/${lessonId}/activities`);
  return data.data;
}

export async function createActivity(lessonId: string, input: ActivityInput): Promise<AdminActivity> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminActivity>>(`/lms/admin/lessons/${lessonId}/activities`, input);
  return data.data;
}

export async function updateActivity(activityId: string, input: Partial<ActivityInput> & { status?: string }): Promise<AdminActivity> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminActivity>>(`/lms/admin/activities/${activityId}`, input);
  return data.data;
}

export async function reorderActivities(lessonId: string, orderedIds: string[]): Promise<void> {
  await apiClient.post(`/lms/admin/lessons/${lessonId}/activities/reorder`, { orderedIds });
}

export async function archiveActivity(activityId: string): Promise<void> {
  await apiClient.post(`/lms/admin/activities/${activityId}/archive`);
}

// ============================================================================
// Enrollments
// ============================================================================

export interface AdminEnrollmentFull {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userDisplayName: string;
  source: string;
  status: string;
  enrolledAt: string;
  accessStartAt: string | null;
  accessEndAt: string | null;
  completedAt: string | null;
}

export async function listEnrollmentsAdmin(params: { courseId?: string; userId?: string; status?: string; page?: number; pageSize?: number }): Promise<{
  data: AdminEnrollmentFull[];
  meta: PaginationMeta;
}> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminEnrollmentFull[]>>('/lms/admin/enrollments', {
    params: { ...params, page: params.page?.toString(), pageSize: params.pageSize?.toString() },
  });
  return { data: data.data, meta: data.meta as unknown as PaginationMeta };
}

export async function createEnrollmentAdmin(input: { userId: string; courseId: string; source?: string; reason?: string }): Promise<AdminEnrollmentFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminEnrollmentFull>>('/lms/admin/enrollments', input);
  return data.data;
}

export async function suspendEnrollmentAdmin(id: string, reason: string): Promise<AdminEnrollmentFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminEnrollmentFull>>(`/lms/admin/enrollments/${id}/suspend`, { reason });
  return data.data;
}

export async function reactivateEnrollmentAdmin(id: string, reason?: string): Promise<AdminEnrollmentFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminEnrollmentFull>>(`/lms/admin/enrollments/${id}/reactivate`, { reason });
  return data.data;
}

export async function revokeEnrollmentAdmin(id: string, reason: string): Promise<AdminEnrollmentFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminEnrollmentFull>>(`/lms/admin/enrollments/${id}/revoke`, { reason });
  return data.data;
}

export async function extendEnrollmentAccessAdmin(id: string, accessEndAt: string | null): Promise<AdminEnrollmentFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminEnrollmentFull>>(`/lms/admin/enrollments/${id}/extend-access`, { accessEndAt });
  return data.data;
}

export async function overrideCompleteAdmin(id: string, scope: 'LESSON' | 'MODULE' | 'COURSE', targetId: string, reason: string): Promise<void> {
  await apiClient.post(`/lms/admin/enrollments/${id}/complete`, { scope, targetId, reason });
}

export async function resetProgressAdmin(id: string, scope: 'LESSON' | 'MODULE' | 'COURSE', targetId: string, reason: string): Promise<void> {
  await apiClient.post(`/lms/admin/enrollments/${id}/reset-progress`, { scope, targetId, reason });
}

// ============================================================================
// Learning Analytics & At-Risk Detection (004 FR-105–FR-108)
// ============================================================================

export interface AtRiskSignal {
  type: 'NO_ACTIVITY_SINCE_ENROLLMENT' | 'LONG_INACTIVITY' | 'REPEATED_QUIZ_FAILURE' | 'MISSED_ASSIGNMENT' | 'ACCESS_NEARING_EXPIRY';
  detail: string;
}

export interface RecommendedRevision {
  lessonId: string;
  lessonTitle: string;
  quizTitle: string;
}

export interface AtRiskAssessment {
  enrollmentId: string;
  userId: string;
  courseId: string;
  atRiskScore: number;
  signals: AtRiskSignal[];
  recommendedRevision: RecommendedRevision | null;
  instructorAlertRaised: boolean;
  notApplicableSignals: string[];
  notApplicableActions: string[];
}

export interface LearnerQuizAttemptSummary {
  quizId: string;
  quizTitle: string;
  attemptNumber: number;
  status: string;
  scorePercent: number | null;
  passed: boolean | null;
}

export interface LearnerAssignmentSubmissionSummary {
  assignmentId: string;
  assignmentTitle: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  passed: boolean | null;
  isLate: boolean;
}

export interface LearnerAnalytics {
  enrollmentId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  lastActivityAt: string | null;
  progressPercent: number;
  timeSpentSeconds: number;
  lessonsCompleted: number;
  totalMandatoryLessons: number;
  quizAttempts: LearnerQuizAttemptSummary[];
  assignmentSubmissions: LearnerAssignmentSubmissionSummary[];
  certificateIssued: boolean;
  certificateCredentialId: string | null;
  dropOffLessonId: string | null;
  dropOffLessonTitle: string | null;
  atRiskScore: number;
  atRiskSignals: AtRiskSignal[];
  attendance: null;
  notApplicable: string[];
}

export interface LessonDropOffEntry {
  lessonId: string;
  lessonTitle: string;
  starts: number;
  completes: number;
  dropOff: number;
}

export interface VideoEngagementSummary {
  learnersWithVideoActivity: number;
  avgWatchedPercent: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollments: number;
  activeLearners: number;
  completionRate: number;
  avgCompletionTimeDays: number;
  lessonDropOff: LessonDropOffEntry[];
  videoEngagement: VideoEngagementSummary;
  quizPassRate: number;
  assignmentApprovalRate: number;
  ratingAverage: number | null;
  ratingCount: number;
  refundCorrelation: null;
  certificateRate: number;
  deviceDistribution: null;
  languageDistribution: null;
  notApplicable: string[];
}

export interface LessonAnalytics {
  lessonId: string;
  lessonTitle: string;
  views: number;
  uniqueLearners: number;
  starts: number;
  completes: number;
  avgTimeSpentSeconds: number;
  resourceDownloads: number;
  dropOffTimestamp: null;
  replays: null;
  notesCreated: null;
  discussionActivity: null;
  errorRate: null;
  notApplicable: string[];
}

export async function getEnrollmentAnalyticsAdmin(enrollmentId: string): Promise<LearnerAnalytics> {
  const { data } = await apiClient.get<ApiSuccessResponse<LearnerAnalytics>>(`/lms/admin/enrollments/${enrollmentId}/analytics`);
  return data.data;
}

export async function getEnrollmentAtRiskAdmin(enrollmentId: string): Promise<AtRiskAssessment | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<AtRiskAssessment | null>>(`/lms/admin/enrollments/${enrollmentId}/at-risk`);
  return data.data;
}

export async function getCourseAnalyticsAdmin(courseId: string): Promise<CourseAnalytics> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseAnalytics>>(`/lms/admin/courses/${courseId}/analytics`);
  return data.data;
}

export async function getCourseAtRiskLearnersAdmin(courseId: string): Promise<AtRiskAssessment[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AtRiskAssessment[]>>(`/lms/admin/courses/${courseId}/at-risk-learners`);
  return data.data;
}

export async function getCourseLessonAnalyticsAdmin(courseId: string): Promise<LessonAnalytics[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<LessonAnalytics[]>>(`/lms/admin/courses/${courseId}/lessons/analytics`);
  return data.data;
}
