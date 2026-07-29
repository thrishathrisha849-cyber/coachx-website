/** 004 Discovery & Recommendations batch (FR-090) — the member catalog view's sectioned response. Same "status/data/reason" shape `dashboard.types.ts`'s `DashboardWidget<T>` already established, kept as an LMS-local type rather than an import to avoid a lms->dashboard dependency (dashboard already depends on lms, not the reverse). */
export type CatalogSectionStatus = 'ok' | 'empty';

export interface CatalogSection<T> {
  status: CatalogSectionStatus;
  data: T | null;
  reason?: string;
}

export interface CatalogCourseCard {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  priceType: string;
  certificateAvailable: boolean;
  /** FR-090's card states, narrowed to what this codebase can actually determine. */
  cardState: 'START' | 'CONTINUE' | 'COMPLETED' | 'LOCKED' | 'COMING_SOON';
}
