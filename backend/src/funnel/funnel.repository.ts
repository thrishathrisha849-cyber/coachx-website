import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

// --- Lead (Funnel A) -----------------------------------------------------

export function findLead(leadMagnetSlug: string, email: string, tx?: TransactionClient) {
  return db(tx).lead.findUnique({ where: { leadMagnetSlug_email: { leadMagnetSlug, email } } });
}

export function createLead(data: Prisma.LeadCreateInput, tx?: TransactionClient) {
  return db(tx).lead.create({ data });
}

/**
 * The latest consent record for an email+channel — a lead's consent is
 * never a mutable flag (Constitution Article VI): each grant/withdrawal
 * is its own append-only `ConsentRecord` row, so "does this email
 * currently have marketing consent" means "is the MOST RECENT row for
 * this (email, channel) a grant, not a withdrawal."
 */
export async function hasActiveConsent(email: string, channel: string, tx?: TransactionClient): Promise<boolean> {
  const latest = await db(tx).consentRecord.findFirst({
    where: { email: email.toLowerCase(), channel: channel as never },
    orderBy: { grantedAt: 'desc' },
  });
  return Boolean(latest) && !latest!.withdrawnAt;
}

export function withdrawConsent(email: string, channel: string, tx?: TransactionClient) {
  return db(tx).consentRecord.updateMany({
    where: { email: email.toLowerCase(), channel: channel as never, withdrawnAt: null },
    data: { withdrawnAt: new Date() },
  });
}

// --- Masterclass (Funnel B) -----------------------------------------------

export function findMasterclassConfigByPageId(pageId: string, tx?: TransactionClient) {
  return db(tx).masterclassConfig.findUnique({ where: { pageId }, include: { _count: { select: { registrations: true } } } });
}

export function findMasterclassConfigBySlug(slug: string, language: string, tx?: TransactionClient) {
  return db(tx).masterclassConfig.findFirst({
    where: { page: { slug, language: language as never } },
    include: { _count: { select: { registrations: true } } },
  });
}

export function createMasterclassConfig(data: Prisma.MasterclassConfigCreateInput, tx?: TransactionClient) {
  return db(tx).masterclassConfig.create({ data });
}

export function findMasterclassRegistration(configId: string, email: string, tx?: TransactionClient) {
  return db(tx).masterclassRegistration.findUnique({ where: { configId_email: { configId, email } } });
}

export function createMasterclassRegistration(data: Prisma.MasterclassRegistrationCreateInput, tx?: TransactionClient) {
  return db(tx).masterclassRegistration.create({ data });
}

// --- Checkout Session (Funnel D/E/F/G terminal step) ----------------------

export function createCheckoutSession(data: Prisma.CheckoutSessionCreateInput, tx?: TransactionClient) {
  return db(tx).checkoutSession.create({ data });
}

export function findCheckoutSessionById(id: string, tx?: TransactionClient) {
  return db(tx).checkoutSession.findUnique({ where: { id }, include: { product: true } });
}

export function updateCheckoutSession(id: string, data: Prisma.CheckoutSessionUpdateInput, tx?: TransactionClient) {
  return db(tx).checkoutSession.update({ where: { id }, data });
}

export function findAbandonableCheckoutSessions(idleSince: Date, tx?: TransactionClient) {
  return db(tx).checkoutSession.findMany({
    where: {
      status: { in: ['NOT_STARTED', 'PROCESSING', 'REQUIRES_ACTION'] },
      abandonedAt: null,
      updatedAt: { lt: idleSince },
    },
  });
}

// --- Coupon ----------------------------------------------------------------

export function findCouponByCode(code: string, tx?: TransactionClient) {
  return db(tx).coupon.findUnique({ where: { code: code.toUpperCase() } });
}
