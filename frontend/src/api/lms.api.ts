import type { ApiSuccessResponse, PaginatedResponse, PaginationMeta } from '@coachx/shared';
import { apiClient } from './client';
import type { Course, CourseCategory, CourseWithModules } from '@/types/lms.types';

export interface CourseDiscoveryFilters {
  q?: string;
  categoryId?: string;
  level?: string;
  language?: string;
  featured?: boolean;
  sort?: 'newest' | 'title' | 'featured';
}

/** Phase 6 Part 1 — public course discovery (pagination, filtering, sorting). */
export async function fetchCourses(
  filters: CourseDiscoveryFilters,
  page = 1,
  pageSize = 12,
): Promise<{ items: Course[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<PaginatedResponse<Course>>('/lms/courses', {
    params: { ...filters, page, pageSize },
  });
  return { items: data.data, meta: data.meta };
}

export async function fetchCourseBySlug(slug: string): Promise<CourseWithModules> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseWithModules>>(`/lms/courses/${slug}`);
  return data.data;
}

export async function fetchCourseCategories(parentId?: string): Promise<CourseCategory[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseCategory[]>>('/lms/categories', {
    params: parentId ? { parentId } : undefined,
  });
  return data.data;
}

// --- 004 US1/US2 — enrollment + lesson consumption (member-authenticated) ---

export type AccessDenialReason =
  | 'AUTHENTICATION_REQUIRED'
  | 'ENROLLMENT_REQUIRED'
  | 'ENTITLEMENT_REQUIRED'
  | 'ENTITLEMENT_PENDING'
  | 'ACCESS_NOT_STARTED'
  | 'ACCESS_EXPIRED'
  | 'ENROLLMENT_SUSPENDED'
  | 'ENROLLMENT_CANCELLED'
  | 'ENROLLMENT_REVOKED'
  | 'COURSE_UNAVAILABLE'
  | 'COURSE_ARCHIVED'
  | 'COURSE_RETIRED'
  | 'MODULE_LOCKED'
  | 'PREREQUISITE_NOT_MET'
  | 'LESSON_NOT_RELEASED'
  | 'PERMISSION_DENIED';

export type CourseAccessDecision =
  | { allowed: true; viaPreview?: boolean }
  | { allowed: false; reason: AccessDenialReason; message: string; detail?: Record<string, unknown> };

export async function getMyCourseAccess(courseId: string): Promise<CourseAccessDecision> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseAccessDecision>>(`/lms/me/courses/${courseId}/access`);
  return data.data;
}

export interface MyEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  source: string;
  status: string;
  enrolledAt: string;
  activatedAt: string | null;
  accessStartAt: string | null;
  accessEndAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

export async function enrollInCourse(courseId: string): Promise<MyEnrollment> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyEnrollment>>('/lms/me/enrollments', { courseId });
  return data.data;
}

export async function getMyEnrollments(): Promise<MyEnrollment[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyEnrollment[]>>('/lms/me/enrollments');
  return data.data;
}

// ============================================================================
// Course Versioning Policy (004, FR-099)
// ============================================================================

export interface VersionMigrationStatus {
  latestVersionNumber: number | null;
  changeSummary: string | null;
  effectiveDate: string | null;
  existingLearnerPolicy: 'CONTINUE_CURRENT_VERSION' | 'OPTIONAL_MIGRATION' | 'MANDATORY_MIGRATION' | null;
  migratedToVersionNumber: number | null;
  migrationAvailable: boolean;
}

export async function getMyVersionMigrationStatus(enrollmentId: string): Promise<VersionMigrationStatus> {
  const { data } = await apiClient.get<ApiSuccessResponse<VersionMigrationStatus>>(`/lms/me/enrollments/${enrollmentId}/version-status`);
  return data.data;
}

export async function migrateMyVersion(enrollmentId: string): Promise<{ toVersionNumber: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ toVersionNumber: number }>>(`/lms/me/enrollments/${enrollmentId}/migrate-version`);
  return data.data;
}

export interface ContinueLearningResult {
  courseComplete: boolean;
  nextLesson: { id: string; moduleTitle: string; title: string; slug: string } | null;
  reason: 'RESUME_IN_PROGRESS' | 'START_NEXT' | 'COURSE_COMPLETE' | 'NO_ACCESSIBLE_CONTENT';
}

export async function getContinueLearning(courseId: string): Promise<ContinueLearningResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<ContinueLearningResult>>(`/lms/me/courses/${courseId}/continue-learning`);
  return data.data;
}

/** 004 Learning Streak batch (FR-057, T042). Server-computed — never a client-settable value. */
export interface MyLearningStreak {
  currentStreakDays: number;
  longestStreakDays: number;
  lastQualifyingDate: string | null;
}

export async function getMyStreak(): Promise<MyLearningStreak> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyLearningStreak>>('/lms/me/streak');
  return data.data;
}

export interface CurriculumLessonItem {
  id: string;
  title: string;
  slug: string;
  position: number;
  durationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  locked: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

/** 004 Project-based Learning batch (FR-077) — just enough for the curriculum sidebar to link into the project page. */
export interface CurriculumProjectItem {
  id: string;
  title: string;
}

export interface CurriculumModuleItem {
  id: string;
  title: string;
  position: number;
  isMandatory: boolean;
  locked: boolean;
  lockReason?: string;
  unlockAt?: string;
  lessons: CurriculumLessonItem[];
  projects: CurriculumProjectItem[];
}

export async function getCourseCurriculum(courseId: string): Promise<CurriculumModuleItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CurriculumModuleItem[]>>(`/lms/me/courses/${courseId}/curriculum`);
  return data.data;
}

/** 004 Captions + Transcript Support batch (FR-044/FR-046) — one ordered segment of a VIDEO/AUDIO activity's transcript. */
export interface TranscriptSegment {
  startSeconds: number;
  text: string;
}

export interface PublicLearningActivity {
  id: string;
  type: string;
  title: string | null;
  position: number;
  mediaUrl: string | null;
  externalUrl: string | null;
  bodyText: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  embedProvider: string | null;
  embedResourceId: string | null;
  captionsUrlEn: string | null;
  captionsUrlTa: string | null;
  transcriptSegments: TranscriptSegment[] | null;
}

export interface LessonDetail {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string | null;
  position: number;
  durationMinutes: number | null;
  isPreview: boolean;
  isMandatory: boolean;
  description: string | null;
  completionRuleType: string;
  completionRuleTypes: string[];
  activities: PublicLearningActivity[];
  /** 004 US3 — present only when this lesson has an attached, PUBLISHED quiz. */
  quiz: { id: string; title: string; quizType: string; passingScorePercent: number; maxAttempts: number | null; timeLimitMinutes: number | null } | null;
  /** 004 US4 — present only when this lesson has an attached, PUBLISHED assignment. */
  assignment: {
    id: string;
    title: string;
    instructions: string | null;
    submissionFormat: string;
    dueAt: string | null;
    maxScore: number;
    passingScore: number;
    maxAttempts: number | null;
  } | null;
}

export async function getLesson(lessonId: string): Promise<LessonDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<LessonDetail>>(`/lms/me/lessons/${lessonId}`);
  return data.data;
}

export type LastPosition =
  | { kind: 'video'; positionSeconds: number }
  | { kind: 'audio'; positionSeconds: number }
  | { kind: 'article'; scrollPercent: number }
  | { kind: 'pdf'; pageNumber: number };

export async function updateLessonProgress(
  lessonId: string,
  body: { timeSpentDeltaSeconds?: number; watchedPercent?: number; lastPosition?: LastPosition },
): Promise<{ percentage: number; status: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ percentage: number; status: string }>>(
    `/lms/me/lessons/${lessonId}/progress`,
    body,
  );
  return data.data;
}

export async function completeLessonManually(lessonId: string): Promise<{ alreadyCompleted: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ alreadyCompleted: boolean }>>(`/lms/me/lessons/${lessonId}/complete`);
  return data.data;
}

export async function markActivityViewed(activityId: string): Promise<void> {
  await apiClient.post(`/lms/me/activities/${activityId}/viewed`);
}

/**
 * 004 Captions + Transcript Support batch (FR-044/FR-046) — the transcript
 * is generated server-side from `transcriptSegments`, so (unlike
 * `downloadResource`'s URL-redirect pattern) this fetches the actual file
 * content as a blob, carrying the caller's bearer token via `apiClient`'s
 * interceptor, then triggers a normal browser download client-side.
 */
export async function downloadActivityTranscript(activityId: string, activityTitle: string | null): Promise<void> {
  const response = await apiClient.get(`/lms/me/activities/${activityId}/transcript`, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${(activityTitle ?? 'transcript').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

// ============================================================================
// PiP + Video Playback Telemetry (004 batch, FR-039/FR-040)
// ============================================================================

export interface PlaybackTelemetrySnapshot {
  watchedSeconds: number;
  furthestPositionSeconds: number;
  lastPositionSeconds: number | null;
  playbackStartCount: number;
  rewatchCount: number;
  lastPlaybackSpeed: number | null;
  completedPlaybackAt: string | null;
}

export async function getMyActivityPlayback(activityId: string): Promise<PlaybackTelemetrySnapshot | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<PlaybackTelemetrySnapshot | null>>(`/lms/me/activities/${activityId}/playback`);
  return data.data;
}

export async function postMyActivityPlaybackStarted(activityId: string): Promise<PlaybackTelemetrySnapshot & { isRewatch: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<PlaybackTelemetrySnapshot & { isRewatch: boolean }>>(
    `/lms/me/activities/${activityId}/playback/started`,
  );
  return data.data;
}

export async function postMyActivityPlaybackProgress(
  activityId: string,
  body: { positionSeconds: number; watchedDeltaSeconds?: number; playbackSpeed?: number },
): Promise<PlaybackTelemetrySnapshot> {
  const { data } = await apiClient.post<ApiSuccessResponse<PlaybackTelemetrySnapshot>>(`/lms/me/activities/${activityId}/playback/progress`, body);
  return data.data;
}

// ============================================================================
// Course Announcements (004 Course Announcements batch, FR-102)
// ============================================================================

export interface LearnerAnnouncement {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  attachmentUrl: string | null;
  publishAt: string | null;
  createdAt: string;
}

export async function getMyCourseAnnouncements(courseId: string): Promise<LearnerAnnouncement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<LearnerAnnouncement[]>>(`/lms/me/courses/${courseId}/announcements`);
  return data.data;
}

// ============================================================================
// Waitlist (004 Waitlist batch, FR-028/029)
// ============================================================================

export interface MyWaitlistEntry {
  id: string;
  courseId: string;
  status: 'WAITING' | 'OFFERED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  priority: number;
  joinedAt: string;
  offeredAt: string | null;
  offerExpiresAt: string | null;
  claimedAt: string | null;
}

export async function joinWaitlist(courseId: string, referralSource?: string): Promise<MyWaitlistEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyWaitlistEntry>>(`/lms/me/courses/${courseId}/waitlist`, { referralSource });
  return data.data;
}

export async function getMyWaitlistEntry(courseId: string): Promise<MyWaitlistEntry | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyWaitlistEntry | null>>(`/lms/me/courses/${courseId}/waitlist`);
  return data.data;
}

export async function claimWaitlistOffer(waitlistEntryId: string): Promise<MyWaitlistEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyWaitlistEntry>>(`/lms/me/waitlist/${waitlistEntryId}/claim`, {});
  return data.data;
}

// ============================================================================
// Wishlist (004 Wishlist batch, FR-027)
// ============================================================================

export interface MyWishlistEntry {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl: string | null;
  courseStatus: string;
  priceAtSaveAmountMinor: number;
  priceAtSaveCurrency: string;
  currentPriceAmountMinor: number;
  priceDropped: boolean;
  enrollmentOpen: boolean;
  savedAt: string;
}

export async function saveToWishlist(courseId: string): Promise<MyWishlistEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyWishlistEntry>>(`/lms/me/courses/${courseId}/wishlist`, {});
  return data.data;
}

export async function removeFromWishlist(courseId: string): Promise<void> {
  await apiClient.delete(`/lms/me/courses/${courseId}/wishlist`);
}

export async function getMyWishlist(): Promise<MyWishlistEntry[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyWishlistEntry[]>>('/lms/me/wishlist');
  return data.data;
}

// ============================================================================
// Learner Notes & Bookmarks (004 Learner Notes & Bookmarks batch, FR-058/059)
// ============================================================================

export interface MyLearnerNote {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSlug?: string;
  courseId: string;
  content: string;
  videoTimestampSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function createLessonNote(lessonId: string, content: string, videoTimestampSeconds?: number): Promise<MyLearnerNote> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyLearnerNote>>(`/lms/me/lessons/${lessonId}/notes`, { content, videoTimestampSeconds });
  return data.data;
}

export async function updateLessonNote(noteId: string, content: string): Promise<MyLearnerNote> {
  const { data } = await apiClient.patch<ApiSuccessResponse<MyLearnerNote>>(`/lms/me/notes/${noteId}`, { content });
  return data.data;
}

export async function deleteLessonNote(noteId: string): Promise<void> {
  await apiClient.delete(`/lms/me/notes/${noteId}`);
}

export async function getMyLessonNotes(lessonId: string): Promise<MyLearnerNote[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyLearnerNote[]>>(`/lms/me/lessons/${lessonId}/notes`);
  return data.data;
}

export interface MyBookmark {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSlug?: string;
  courseId: string;
  type: 'LESSON' | 'VIDEO_TIMESTAMP' | 'TEXT_SECTION' | 'RESOURCE';
  videoTimestampSeconds: number | null;
  textSectionAnchor: string | null;
  activityId: string | null;
  note: string | null;
  folder: string | null;
  createdAt: string;
}

export async function createLessonBookmark(lessonId: string): Promise<MyBookmark> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyBookmark>>(`/lms/me/lessons/${lessonId}/bookmarks`, { type: 'LESSON' });
  return data.data;
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await apiClient.delete(`/lms/me/bookmarks/${bookmarkId}`);
}

export async function getMyLessonBookmarks(lessonId: string): Promise<MyBookmark[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyBookmark[]>>(`/lms/me/lessons/${lessonId}/bookmarks`);
  return data.data;
}

// ============================================================================
// Downloadable Resources (004 Downloadable Resource Catalog batch, FR-049)
// ============================================================================

export interface PublicLessonResource {
  id: string;
  lessonId: string;
  title: string;
  type: string;
  description: string | null;
  language: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  version: number;
  downloadPermission: 'VIEW_ONLY' | 'DOWNLOADABLE';
  accessRule: 'PREVIEW' | 'ENROLLED_ONLY';
  position: number;
}

export async function getMyLessonResources(lessonId: string): Promise<PublicLessonResource[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicLessonResource[]>>(`/lms/me/lessons/${lessonId}/resources`);
  return data.data;
}

export async function markResourceViewed(resourceId: string): Promise<void> {
  await apiClient.post(`/lms/me/lesson-resources/${resourceId}/viewed`);
}

export async function downloadResource(resourceId: string): Promise<{ fileUrl: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ fileUrl: string }>>(`/lms/me/lesson-resources/${resourceId}/download`);
  return data.data;
}
