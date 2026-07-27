import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/** Standard relation-include shape every course read uses — one place to change if the shape ever needs to grow. */
const courseInclude = {
  category: true,
  instructors: { include: { user: { include: { profile: true } } } },
} satisfies Prisma.CourseInclude;

export function findCourseBySlug(slug: string, tx?: TransactionClient) {
  return db(tx).course.findUnique({ where: { slug }, include: courseInclude });
}

export function findCourseById(id: string, tx?: TransactionClient) {
  return db(tx).course.findUnique({ where: { id }, include: courseInclude });
}

export interface PublicCourseFilter {
  q?: string;
  categoryId?: string;
  level?: string;
  language?: string;
  instructorId?: string;
  featured?: boolean;
  priceType?: string;
}

// NOTE: every conditional clause below is combined via a single top-level
// `AND` array rather than spreading multiple `{ OR: [...] }` object
// fragments into one literal — object-spread would silently make the LAST
// `OR` key win (a real bug caught during review: combining the
// publish/expire-window check with the search-query OR the naive way would
// have dropped the visibility window whenever `q` was also supplied,
// exactly the kind of draft/expired-content leak this phase's Security
// Audit explicitly checks for).
function publicCourseWhere(filter: PublicCourseFilter): Prisma.CourseWhereInput {
  const now = new Date();
  const and: Prisma.CourseWhereInput[] = [
    { status: 'PUBLISHED' },
    { visibility: { in: ['PUBLIC', 'UNLISTED'] } },
    { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
    { OR: [{ expireAt: null }, { expireAt: { gt: now } }] },
  ];

  if (filter.categoryId) and.push({ categoryId: filter.categoryId });
  if (filter.level) and.push({ level: filter.level as never });
  if (filter.language) and.push({ language: filter.language as never });
  if (filter.featured !== undefined) and.push({ isFeatured: filter.featured });
  if (filter.priceType) and.push({ priceType: filter.priceType as never });
  if (filter.instructorId) and.push({ instructors: { some: { userId: filter.instructorId } } });
  if (filter.q) {
    and.push({
      OR: [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { subtitle: { contains: filter.q, mode: 'insensitive' } },
        { shortDescription: { contains: filter.q, mode: 'insensitive' } },
      ],
    });
  }

  return { AND: and };
}

const COURSE_SORT_ORDER_BY: Record<string, Prisma.CourseOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: 'desc' }, { id: 'asc' }],
  title: [{ title: 'asc' }, { id: 'asc' }],
  featured: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }],
};

export function findPublicCourses(
  filter: PublicCourseFilter,
  pagination: { skip: number; take: number },
  sort: string,
  tx?: TransactionClient,
) {
  const where = publicCourseWhere(filter);
  const orderBy = COURSE_SORT_ORDER_BY[sort] ?? COURSE_SORT_ORDER_BY.newest;

  return Promise.all([
    db(tx).course.findMany({ where, include: courseInclude, orderBy, skip: pagination.skip, take: pagination.take }),
    db(tx).course.count({ where }),
  ]);
}

export interface AdminCourseFilter {
  q?: string;
  status?: string;
  categoryId?: string;
  instructorId?: string;
}

const ADMIN_COURSE_SORT_ORDER_BY: Record<string, Prisma.CourseOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }, { id: 'asc' }],
  title: [{ title: 'asc' }, { id: 'asc' }],
  featured: [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
};

export function findCoursesAdmin(
  filter: AdminCourseFilter,
  pagination: { skip: number; take: number },
  sort: string,
  tx?: TransactionClient,
) {
  const where: Prisma.CourseWhereInput = {
    ...(filter.status ? { status: filter.status as never } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.instructorId ? { instructors: { some: { userId: filter.instructorId } } } : {}),
    ...(filter.q
      ? {
          OR: [
            { title: { contains: filter.q, mode: 'insensitive' } },
            { slug: { contains: filter.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const orderBy = ADMIN_COURSE_SORT_ORDER_BY[sort] ?? ADMIN_COURSE_SORT_ORDER_BY.newest;

  return Promise.all([
    db(tx).course.findMany({ where, include: courseInclude, orderBy, skip: pagination.skip, take: pagination.take }),
    db(tx).course.count({ where }),
  ]);
}

/** Courses an instructor is assigned to — instructor-scoped admin API's "own courses only" list. */
export function findCoursesForInstructor(
  userId: string,
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  const where: Prisma.CourseWhereInput = { instructors: { some: { userId } } };
  return Promise.all([
    db(tx)
      .course.findMany({
        where,
        include: courseInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: pagination.skip,
        take: pagination.take,
      }),
    db(tx).course.count({ where }),
  ]);
}

export function isUserAssignedToCourse(courseId: string, userId: string, tx?: TransactionClient) {
  return db(tx)
    .courseInstructor.findUnique({ where: { courseId_userId: { courseId, userId } } })
    .then((row) => row !== null);
}

export function createCourse(data: Prisma.CourseCreateInput, tx?: TransactionClient) {
  return db(tx).course.create({ data, include: courseInclude });
}

export function updateCourse(id: string, data: Prisma.CourseUpdateInput, tx?: TransactionClient) {
  return db(tx).course.update({ where: { id }, data, include: courseInclude });
}

export function countModulesForCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseModule.count({ where: { courseId, status: { not: 'ARCHIVED' } } });
}
