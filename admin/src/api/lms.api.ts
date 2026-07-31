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
  /** 004 Course Translation Management batch (FR-101) — null on every ordinary, non-variant course. */
  translationOfCourseId: string | null;
  translationStatus: string | null;
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

// ============================================================================
// Course Translation Management (004 batch, FR-101)
// ============================================================================

export const COURSE_TRANSLATION_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED'] as const;
export type CourseTranslationStatus = (typeof COURSE_TRANSLATION_STATUSES)[number] | 'OUTDATED';

export async function setTranslationStatusAdmin(id: string, status: (typeof COURSE_TRANSLATION_STATUSES)[number]): Promise<AdminCourseFull> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseFull>>(`/lms/admin/courses/${id}/translation-status`, { status });
  return data.data;
}

export async function getTranslationVariantsAdmin(id: string): Promise<AdminCourseFull[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseFull[]>>(`/lms/admin/courses/${id}/translations`);
  return data.data;
}

// --- Course Versioning Policy (004, FR-099) ---------------------------------

export const COURSE_VERSION_EXISTING_LEARNER_POLICIES = ['CONTINUE_CURRENT_VERSION', 'OPTIONAL_MIGRATION', 'MANDATORY_MIGRATION'] as const;
export type CourseVersionExistingLearnerPolicy = (typeof COURSE_VERSION_EXISTING_LEARNER_POLICIES)[number];

export interface AdminCourseVersion {
  id: string;
  courseId: string;
  versionNumber: number;
  changeSummary: string | null;
  effectiveDate: string | null;
  existingLearnerPolicy: CourseVersionExistingLearnerPolicy;
  createdBy: string | null;
  createdAt: string;
}

export async function getCourseVersionsAdmin(courseId: string): Promise<AdminCourseVersion[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseVersion[]>>(`/lms/admin/courses/${courseId}/versions`);
  return data.data;
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

/** 004 Captions + Transcript Support batch (FR-044/FR-046) — one ordered segment of a VIDEO/AUDIO activity's transcript. */
export interface TranscriptSegment {
  startSeconds: number;
  text: string;
}

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
  captionsUrlEn: string | null;
  captionsUrlTa: string | null;
  transcriptSegments: TranscriptSegment[] | null;
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
  captionsUrlEn?: string;
  captionsUrlTa?: string;
  transcriptSegments?: TranscriptSegment[];
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
// Downloadable Resources (004 Downloadable Resource Catalog batch, FR-049)
// ============================================================================

export type ResourceType = 'PDF' | 'WORKSHEET' | 'SPREADSHEET' | 'TEMPLATE' | 'IMAGE' | 'AUDIO' | 'ZIP' | 'PRESENTATION' | 'PROMPT_PACK';

export interface AdminLessonResource {
  id: string;
  lessonId: string;
  title: string;
  type: ResourceType;
  description: string | null;
  language: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  version: number;
  downloadPermission: 'VIEW_ONLY' | 'DOWNLOADABLE';
  accessRule: 'PREVIEW' | 'ENROLLED_ONLY';
  position: number;
  status: string;
}

export interface ResourceInput {
  title: string;
  type: ResourceType;
  description?: string;
  language?: string;
  fileUrl: string;
  fileSizeBytes?: number;
  downloadPermission?: 'VIEW_ONLY' | 'DOWNLOADABLE';
  accessRule?: 'PREVIEW' | 'ENROLLED_ONLY';
}

export async function listResourcesForLesson(lessonId: string): Promise<AdminLessonResource[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLessonResource[]>>(`/lms/admin/lessons/${lessonId}/resources`);
  return data.data;
}

export async function createResource(lessonId: string, input: ResourceInput): Promise<AdminLessonResource> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminLessonResource>>(`/lms/admin/lessons/${lessonId}/resources`, input);
  return data.data;
}

export async function reorderResources(lessonId: string, orderedIds: string[]): Promise<void> {
  await apiClient.post(`/lms/admin/lessons/${lessonId}/resources/reorder`, { orderedIds });
}

export async function archiveResource(resourceId: string): Promise<void> {
  await apiClient.post(`/lms/admin/resources/${resourceId}/archive`);
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

// ============================================================================
// Bulk CSV Import (004 Bulk CSV Import batch, FR-032)
// ============================================================================

export interface BulkImportRowResult {
  row: number;
  email: string;
  status: 'CREATED' | 'DUPLICATE' | 'ERROR';
  message?: string;
  enrollmentId?: string;
}

export interface BulkImportResult {
  totalRows: number;
  created: number;
  duplicates: number;
  failed: number;
  rows: BulkImportRowResult[];
}

export async function bulkImportEnrollmentsAdmin(courseId: string, csvContent: string): Promise<BulkImportResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<BulkImportResult>>(`/lms/admin/courses/${courseId}/enrollments/bulk-import`, { csvContent });
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
  /** 004 PiP + Video Playback Telemetry batch (FR-040) — real device-bucket counts (e.g. `{ desktop: 5, mobile: 2 }`), `null` when no VIDEO playback telemetry exists yet for this course. */
  deviceDistribution: Record<string, number> | null;
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

// ============================================================================
// Course Announcements (004 Course Announcements batch, FR-102)
// ============================================================================

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface AdminAnnouncement {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  channels: AnnouncementChannel[];
  attachmentUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishAt: string | null;
  expireAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  moduleId?: string | null;
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  channels?: AnnouncementChannel[];
  attachmentUrl?: string | null;
  publishAt?: string | null;
  expireAt?: string | null;
}

export async function createAnnouncementAdmin(courseId: string, input: CreateAnnouncementInput): Promise<AdminAnnouncement> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAnnouncement>>(`/lms/admin/courses/${courseId}/announcements`, input);
  return data.data;
}

export async function listAnnouncementsAdmin(courseId: string): Promise<AdminAnnouncement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminAnnouncement[]>>(`/lms/admin/courses/${courseId}/announcements`);
  return data.data;
}

export async function publishAnnouncementAdmin(announcementId: string): Promise<AdminAnnouncement> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAnnouncement>>(`/lms/admin/announcements/${announcementId}/publish`);
  return data.data;
}

export async function archiveAnnouncementAdmin(announcementId: string): Promise<AdminAnnouncement> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAnnouncement>>(`/lms/admin/announcements/${announcementId}/archive`);
  return data.data;
}

// ============================================================================
// Waitlist (004 Waitlist batch, FR-028/029)
// ============================================================================

export interface AdminWaitlistEntry {
  id: string;
  courseId: string;
  status: 'WAITING' | 'OFFERED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  priority: number;
  joinedAt: string;
  offeredAt: string | null;
  offerExpiresAt: string | null;
  claimedAt: string | null;
  userId: string;
  userDisplayName: string | null;
  referralSource: string | null;
  offerEmailSentAt: string | null;
}

export async function listWaitlistAdmin(courseId: string): Promise<AdminWaitlistEntry[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminWaitlistEntry[]>>(`/lms/admin/courses/${courseId}/waitlist`);
  return data.data;
}

// ============================================================================
// LMS-wide Settings (004 LMS-wide Settings batch, FR-114)
// ============================================================================

export interface AdminLmsSettings {
  defaultVideoWatchThresholdPercent: number;
  defaultQuizPassingScorePercent: number;
  defaultQuizMaxAttempts: number | null;
  defaultAssignmentMaxAttempts: number | null;
  defaultResourceDownloadPermission: 'VIEW_ONLY' | 'DOWNLOADABLE';
  defaultLessonCompletionRuleType: string;
  courseReviewMinProgressPercent: number;
  streakQualifyLessonComplete: boolean;
  streakQualifyQuizComplete: boolean;
  streakQualifyAssignmentActivity: boolean;
  streakQualifyMinLearningTime: boolean;
  streakMinLearningTimeMinutes: number;
  streakTimezone: string;
  streakGraceDays: number;
  updatedBy: string | null;
  updatedAt: string;
}

export type LmsSettingsUpdate = Partial<
  Omit<AdminLmsSettings, 'updatedBy' | 'updatedAt'>
>;

export async function getLmsSettingsAdmin(): Promise<AdminLmsSettings> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLmsSettings>>('/lms/admin/settings');
  return data.data;
}

export async function updateLmsSettingsAdmin(patch: LmsSettingsUpdate): Promise<AdminLmsSettings> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminLmsSettings>>('/lms/admin/settings', patch);
  return data.data;
}

// ============================================================================
// Course Calendar (T092-T095, FR-103's real-data subset)
// ============================================================================

export interface CourseCalendarEvent {
  type: 'ASSIGNMENT_DUE' | 'MODULE_UNLOCK' | 'ANNOUNCEMENT';
  date: string;
  title: string;
  sourceId: string;
}

export async function getCourseCalendarAdmin(courseId: string): Promise<CourseCalendarEvent[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseCalendarEvent[]>>(`/lms/admin/courses/${courseId}/calendar`);
  return data.data;
}

// ============================================================================
// Cohorts (T085, FR-012/FR-034)
// ============================================================================

export interface AdminCohort {
  id: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  timezone: string;
  capacity: number | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CohortInput {
  name: string;
  startDate: string;
  endDate?: string | null;
  timezone: string;
  capacity?: number | null;
}

export interface AdminCohortMember {
  id: string;
  cohortId: string;
  userId: string;
  enrollmentId: string;
  joinedAt: string;
}

export interface AdminCohortModuleSchedule {
  cohortId: string;
  moduleId: string;
  unlockAt: string;
}

export async function createCohort(courseId: string, input: CohortInput): Promise<AdminCohort> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCohort>>(`/lms/admin/courses/${courseId}/cohorts`, input);
  return data.data;
}

export async function listCohortsForCourse(courseId: string): Promise<AdminCohort[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCohort[]>>(`/lms/admin/courses/${courseId}/cohorts`);
  return data.data;
}

export async function getCohortAdmin(cohortId: string): Promise<AdminCohort> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCohort>>(`/lms/admin/cohorts/${cohortId}`);
  return data.data;
}

export async function updateCohort(cohortId: string, patch: Partial<CohortInput> & { status?: AdminCohort['status'] }): Promise<AdminCohort> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminCohort>>(`/lms/admin/cohorts/${cohortId}`, patch);
  return data.data;
}

export async function addCohortMember(cohortId: string, userId: string): Promise<AdminCohortMember> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCohortMember>>(`/lms/admin/cohorts/${cohortId}/members`, { userId });
  return data.data;
}

export async function listCohortMembers(cohortId: string): Promise<AdminCohortMember[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCohortMember[]>>(`/lms/admin/cohorts/${cohortId}/members`);
  return data.data;
}

export async function removeCohortMember(cohortId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/lms/admin/cohorts/${cohortId}/members/${memberId}`);
}

export async function setCohortModuleSchedule(cohortId: string, moduleId: string, unlockAt: string): Promise<AdminCohortModuleSchedule> {
  const { data } = await apiClient.put<ApiSuccessResponse<AdminCohortModuleSchedule>>(`/lms/admin/cohorts/${cohortId}/schedule/${moduleId}`, { unlockAt });
  return data.data;
}

export async function listCohortModuleSchedules(cohortId: string): Promise<AdminCohortModuleSchedule[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCohortModuleSchedule[]>>(`/lms/admin/cohorts/${cohortId}/schedule`);
  return data.data;
}

// --- Question Bank (004 Question Bank batch, T107/FR-064) ---

export const QUESTION_BANK_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type QuestionBankDifficulty = (typeof QUESTION_BANK_DIFFICULTIES)[number];

export const QUESTION_BANK_REVIEW_STATUSES = ['DRAFT', 'APPROVED', 'ARCHIVED'] as const;
export type QuestionBankReviewStatus = (typeof QUESTION_BANK_REVIEW_STATUSES)[number];

export const QUESTION_BANK_ITEM_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type QuestionBankItemStatus = (typeof QUESTION_BANK_ITEM_STATUSES)[number];

export interface AdminQuestionBankItemOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface AdminQuestionBankItem {
  id: string;
  courseId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  category: string | null;
  difficulty: QuestionBankDifficulty;
  learningObjective: string | null;
  tags: string[];
  language: string;
  version: number;
  reviewStatus: QuestionBankReviewStatus;
  usageCount: number;
  status: QuestionBankItemStatus;
  options: AdminQuestionBankItemOption[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankItemInput {
  type: string;
  prompt: string;
  explanation?: string;
  points?: number;
  category?: string;
  difficulty?: QuestionBankDifficulty;
  learningObjective?: string;
  tags?: string[];
  language?: string;
  reviewStatus?: QuestionBankReviewStatus;
  status?: QuestionBankItemStatus;
  options?: { text: string; isCorrect: boolean }[];
}

export async function listQuestionBankItems(
  courseId: string,
  filter: { category?: string; difficulty?: QuestionBankDifficulty; reviewStatus?: QuestionBankReviewStatus; status?: QuestionBankItemStatus } = {},
): Promise<AdminQuestionBankItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminQuestionBankItem[]>>(`/lms/admin/courses/${courseId}/question-bank`, { params: filter });
  return data.data;
}

export async function createQuestionBankItem(courseId: string, input: QuestionBankItemInput): Promise<AdminQuestionBankItem> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuestionBankItem>>(`/lms/admin/courses/${courseId}/question-bank`, input);
  return data.data;
}

export async function updateQuestionBankItem(itemId: string, input: Partial<QuestionBankItemInput>): Promise<AdminQuestionBankItem> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminQuestionBankItem>>(`/lms/admin/question-bank/${itemId}`, input);
  return data.data;
}

export async function archiveQuestionBankItem(itemId: string): Promise<AdminQuestionBankItem> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuestionBankItem>>(`/lms/admin/question-bank/${itemId}/archive`);
  return data.data;
}

export interface GenerateQuestionsFromBankInput {
  count?: number;
  difficultyDistribution?: Partial<Record<QuestionBankDifficulty, number>>;
  category?: string;
  excludeIds?: string[];
}

export interface GenerateQuestionsFromBankResult {
  createdQuestionIds: string[];
  requested: number;
  drawn: number;
}

export async function generateQuestionsFromBank(quizId: string, input: GenerateQuestionsFromBankInput): Promise<GenerateQuestionsFromBankResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<GenerateQuestionsFromBankResult>>(`/lms/admin/quizzes/${quizId}/generate-from-bank`, input);
  return data.data;
}
