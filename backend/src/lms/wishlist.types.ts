/** 004 Wishlist batch (FR-027) — DTO shapes. */

export interface MyWishlistEntry {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl: string | null;
  courseStatus: string;
  coursePriceType: string;
  courseCertificateAvailable: boolean;
  priceAtSaveAmountMinor: number;
  priceAtSaveCurrency: string;
  currentPriceAmountMinor: number;
  /** Computed at read time: current price is lower than the price saved at. */
  priceDropped: boolean;
  /** Computed at read time: the course now accepts self-enrollment (no longer "locked"). */
  enrollmentOpen: boolean;
  savedAt: Date;
}
