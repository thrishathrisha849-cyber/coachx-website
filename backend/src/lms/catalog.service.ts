import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { listPublicCoursesForDiscovery } from './course.service';
import { getRecommendationsForLearner } from './recommendation.service';
import { listMyWishlist } from './wishlist.service';
import type { CatalogCourseCard, CatalogSection } from './catalog.types';
import type { PublicCourse } from './lms.types';
import type { RecommendationItem } from './recommendation.service';

const SECTION_SIZE = 8;

function emptySection<T>(reason: string): CatalogSection<T> {
  return { status: 'empty', data: null, reason };
}

/** FR-090's card states, narrowed to what this codebase can determine — see `catalog.types.ts`'s doc comment for the full state-to-reality mapping. */
function cardStateFor(course: PublicCourse, enrollmentStatus: string | undefined): CatalogCourseCard['cardState'] {
  if (course.publishedAt === null) return 'COMING_SOON';
  if (enrollmentStatus === 'COMPLETED') return 'COMPLETED';
  if (enrollmentStatus === 'ACTIVE' || enrollmentStatus === 'PENDING') return 'CONTINUE';
  // No payment/membership entitlement path exists yet for a PAID course a
  // learner isn't already enrolled in (Volume 09 not built) — honestly
  // reported as LOCKED rather than offering a "Start" CTA that would fail.
  if (course.priceType === 'PAID') return 'LOCKED';
  return 'START';
}

async function toCatalogCards(courses: PublicCourse[], userId: string): Promise<CatalogCourseCard[]> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, courseId: { in: courses.map((c) => c.id) } },
    select: { courseId: true, status: true },
  });
  const statusByCourseId = new Map(enrollments.map((e) => [e.courseId, e.status]));

  return courses.map((course) => ({
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    thumbnailUrl: course.thumbnailUrl,
    priceType: course.priceType,
    certificateAvailable: course.certificateAvailable,
    cardState: cardStateFor(course, statusByCourseId.get(course.id)),
  }));
}

async function buildContinueLearningSection(userId: string): Promise<CatalogSection<CatalogCourseCard[]>> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'ACTIVE', completedAt: null },
    orderBy: [{ lastAccessedAt: 'desc' }, { enrolledAt: 'desc' }],
    take: SECTION_SIZE,
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, priceType: true, certificateAvailable: true, publishedAt: true } } },
  });

  if (enrollments.length === 0) return emptySection('No course in progress yet.');

  const cards: CatalogCourseCard[] = enrollments.map((e) => ({
    courseId: e.course.id,
    courseTitle: e.course.title,
    courseSlug: e.course.slug,
    thumbnailUrl: e.course.thumbnailUrl,
    priceType: e.course.priceType,
    certificateAvailable: e.course.certificateAvailable,
    cardState: 'CONTINUE',
  }));
  return { status: 'ok', data: cards };
}

async function buildCompletedSection(userId: string): Promise<CatalogSection<CatalogCourseCard[]>> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: SECTION_SIZE,
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, priceType: true, certificateAvailable: true, publishedAt: true } } },
  });

  if (enrollments.length === 0) return emptySection("You haven't completed a course yet.");

  const cards: CatalogCourseCard[] = enrollments.map((e) => ({
    courseId: e.course.id,
    courseTitle: e.course.title,
    courseSlug: e.course.slug,
    thumbnailUrl: e.course.thumbnailUrl,
    priceType: e.course.priceType,
    certificateAvailable: e.course.certificateAvailable,
    cardState: 'COMPLETED',
  }));
  return { status: 'ok', data: cards };
}

async function buildDiscoverySection(userId: string, sort: string, priceType?: string): Promise<CatalogSection<CatalogCourseCard[]>> {
  const result = await listPublicCoursesForDiscovery({ priceType }, { pageSize: String(SECTION_SIZE) }, sort);
  if (result.data.length === 0) return emptySection('No courses available yet.');
  return { status: 'ok', data: await toCatalogCards(result.data, userId) };
}

async function buildRecommendedSection(userId: string): Promise<CatalogSection<RecommendationItem[]>> {
  const result = await getRecommendationsForLearner(userId);
  return result.items.length > 0 ? { status: 'ok', data: result.items } : emptySection('No recommendations yet — keep learning to unlock personalized suggestions.');
}

/** 004 Wishlist batch (FR-027) — closes part of FR-090's own "wishlist" section, previously honestly reported unavailable (no Wishlist entity existed yet). Card state is always LOCKED, since a wishlist entry only exists for an "eligible-but-locked" course by construction (see `wishlist.service.ts`'s own eligibility gate). */
async function buildWishlistSection(userId: string): Promise<CatalogSection<CatalogCourseCard[]>> {
  const entries = await listMyWishlist(userId);
  if (entries.length === 0) return emptySection('No courses saved to your wishlist yet.');

  const cards: CatalogCourseCard[] = entries.slice(0, SECTION_SIZE).map((e) => ({
    courseId: e.courseId,
    courseTitle: e.courseTitle,
    courseSlug: e.courseSlug,
    thumbnailUrl: e.courseThumbnailUrl,
    priceType: e.coursePriceType,
    certificateAvailable: e.courseCertificateAvailable,
    cardState: 'LOCKED',
  }));
  return { status: 'ok', data: cards };
}

export interface MemberCatalog {
  continueLearning: CatalogSection<CatalogCourseCard[]>;
  recommended: CatalogSection<RecommendationItem[]>;
  newCourses: CatalogSection<CatalogCourseCard[]>;
  popular: CatalogSection<CatalogCourseCard[]>;
  free: CatalogSection<CatalogCourseCard[]>;
  completed: CatalogSection<CatalogCourseCard[]>;
  wishlist: CatalogSection<CatalogCourseCard[]>;
  /** FR-090 names these two sections too — neither has an owning entity in this codebase yet (no LearningPath — see T004; no Membership-gated content — Volume 09). Honestly reported empty, never fabricated. */
  learningPaths: CatalogSection<never>;
  includedInMembership: CatalogSection<never>;
}

/** FR-090 — the member course catalog view, sectioned. Every section either reflects a real signal or is honestly reported unavailable via a reason string — never a fabricated placeholder list. */
export async function getMemberCatalog(userId: string): Promise<MemberCatalog> {
  const [continueLearning, recommended, newCourses, popular, free, completed, wishlist] = await Promise.all([
    buildContinueLearningSection(userId),
    buildRecommendedSection(userId),
    buildDiscoverySection(userId, 'newest'),
    buildDiscoverySection(userId, 'popular'),
    buildDiscoverySection(userId, 'newest', 'FREE'),
    buildCompletedSection(userId),
    buildWishlistSection(userId),
  ]);

  return {
    continueLearning,
    recommended,
    newCourses,
    popular,
    free,
    completed,
    wishlist,
    learningPaths: emptySection('Learning paths are not available yet.'),
    includedInMembership: emptySection('Membership-included courses are not available yet.'),
  };
}
