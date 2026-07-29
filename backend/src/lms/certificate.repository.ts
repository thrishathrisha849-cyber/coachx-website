import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findCertificateByEnrollment(enrollmentId: string, tx?: TransactionClient) {
  return db(tx).certificate.findUnique({ where: { enrollmentId } });
}

export function findCertificateById(id: string, tx?: TransactionClient) {
  return db(tx).certificate.findUnique({ where: { id } });
}

export function findCertificateByIdForUser(id: string, userId: string, tx?: TransactionClient) {
  return db(tx).certificate.findFirst({ where: { id, enrollment: { userId } } });
}

export function findCertificateByCredentialId(credentialId: string, tx?: TransactionClient) {
  return db(tx).certificate.findUnique({ where: { credentialId } });
}

export function createCertificate(data: Prisma.CertificateCreateInput, tx?: TransactionClient) {
  return db(tx).certificate.create({ data });
}

export function updateCertificate(id: string, data: Prisma.CertificateUpdateInput, tx?: TransactionClient) {
  return db(tx).certificate.update({ where: { id }, data });
}

export function findCertificatesForUser(userId: string, tx?: TransactionClient) {
  return db(tx).certificate.findMany({
    where: { enrollment: { userId } },
    orderBy: { issuedAt: 'desc' },
  });
}

export function findCertificatesForCourseAdmin(courseId: string, tx?: TransactionClient) {
  return db(tx).certificate.findMany({
    where: { courseId },
    orderBy: { issuedAt: 'desc' },
    include: { enrollment: { select: { userId: true } } },
  });
}

export async function credentialIdExists(credentialId: string, tx?: TransactionClient): Promise<boolean> {
  const count = await db(tx).certificate.count({ where: { credentialId } });
  return count > 0;
}

// --- Certificate templates ----------------------------------------------

export function findTemplateById(id: string, tx?: TransactionClient) {
  return db(tx).certificateTemplate.findFirst({ where: { id, deletedAt: null } });
}

export function findActiveTemplates(tx?: TransactionClient) {
  return db(tx).certificateTemplate.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: 'asc' } });
}

export function findAllTemplatesAdmin(tx?: TransactionClient) {
  return db(tx).certificateTemplate.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
}

export function createTemplate(data: Prisma.CertificateTemplateCreateInput, tx?: TransactionClient) {
  return db(tx).certificateTemplate.create({ data });
}

export function updateTemplate(id: string, data: Prisma.CertificateTemplateUpdateInput, tx?: TransactionClient) {
  return db(tx).certificateTemplate.update({ where: { id }, data });
}
