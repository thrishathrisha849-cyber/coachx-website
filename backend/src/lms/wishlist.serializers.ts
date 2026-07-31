import { SELF_ENROLL_ALLOWED_STATUSES } from './enrollment.service';
import type { MyWishlistEntry } from './wishlist.types';

interface EntryRow {
  id: string;
  courseId: string;
  priceAtSaveAmountMinor: number;
  priceAtSaveCurrency: string;
  savedAt: Date;
  course: { title: string; slug: string; thumbnailUrl: string | null; priceAmountMinor: number; status: string; priceType: string; certificateAvailable: boolean };
}

export function toMyWishlistEntry(row: EntryRow): MyWishlistEntry {
  return {
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    courseThumbnailUrl: row.course.thumbnailUrl,
    courseStatus: row.course.status,
    coursePriceType: row.course.priceType,
    courseCertificateAvailable: row.course.certificateAvailable,
    priceAtSaveAmountMinor: row.priceAtSaveAmountMinor,
    priceAtSaveCurrency: row.priceAtSaveCurrency,
    currentPriceAmountMinor: row.course.priceAmountMinor,
    priceDropped: row.course.priceAmountMinor < row.priceAtSaveAmountMinor,
    enrollmentOpen: SELF_ENROLL_ALLOWED_STATUSES.has(row.course.status),
    savedAt: row.savedAt,
  };
}
