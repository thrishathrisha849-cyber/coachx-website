import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findInstructorAssignment(courseId: string, userId: string, tx?: TransactionClient) {
  return db(tx).courseInstructor.findUnique({ where: { courseId_userId: { courseId, userId } } });
}

export function findInstructorsByCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseInstructor.findMany({
    where: { courseId },
    include: { user: { include: { profile: true } } },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
}

export function findPrimaryInstructor(courseId: string, tx?: TransactionClient) {
  return db(tx).courseInstructor.findFirst({ where: { courseId, isPrimary: true } });
}

export function createInstructorAssignment(data: Prisma.CourseInstructorCreateInput, tx?: TransactionClient) {
  return db(tx).courseInstructor.create({ data });
}

export function clearPrimaryForCourse(courseId: string, tx: TransactionClient) {
  return tx.courseInstructor.updateMany({ where: { courseId, isPrimary: true }, data: { isPrimary: false } });
}

export function setInstructorPrimary(courseId: string, userId: string, isPrimary: boolean, tx: TransactionClient) {
  return tx.courseInstructor.update({
    where: { courseId_userId: { courseId, userId } },
    data: { isPrimary },
  });
}

export function removeInstructorAssignment(courseId: string, userId: string, tx?: TransactionClient) {
  return db(tx).courseInstructor.delete({ where: { courseId_userId: { courseId, userId } } });
}

export function findUserById(userId: string, tx?: TransactionClient) {
  return db(tx).user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
}
