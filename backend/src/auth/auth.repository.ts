import type { Prisma, PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

/**
 * Data-access layer for the auth/identity domain. Every function accepts
 * an optional transaction client (`tx?: TransactionClient`) so callers can
 * compose multi-step writes (e.g. "create user + credential + profile")
 * inside a single `withTransaction()` call from `database/transaction.ts`
 * (Phase 3) — this module never opens its own transactions.
 */

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

// --- User -------------------------------------------------------------

export function findUserByEmail(email: string, tx?: TransactionClient) {
  return db(tx).user.findUnique({ where: { email: email.toLowerCase() } });
}

export function findUserById(id: string, tx?: TransactionClient) {
  return db(tx).user.findUnique({ where: { id } });
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
}

export async function createUserWithPassword(
  input: CreateUserInput,
  tx?: TransactionClient,
): Promise<User> {
  const client = db(tx);

  return client.user.create({
    data: {
      email: input.email.toLowerCase(),
      profile: { create: { displayName: input.displayName } },
      credentials: { create: { type: 'PASSWORD', passwordHash: input.passwordHash } },
    },
  });
}

export function updateUser(id: string, data: Prisma.UserUpdateInput, tx?: TransactionClient) {
  return db(tx).user.update({ where: { id }, data });
}

export function findCredential(userId: string, type: 'PASSWORD', tx?: TransactionClient) {
  return db(tx).credential.findUnique({ where: { userId_type: { userId, type } } });
}

export function updateCredentialPassword(
  userId: string,
  passwordHash: string,
  tx?: TransactionClient,
) {
  return db(tx).credential.update({
    where: { userId_type: { userId, type: 'PASSWORD' } },
    data: { passwordHash },
  });
}

// --- Roles --------------------------------------------------------------

export async function assignDefaultRole(userId: string, roleName: string, tx?: TransactionClient) {
  const client = db(tx);
  const role = await client.role.findUnique({ where: { name: roleName } });
  if (!role) throw AppError.internal(`Role "${roleName}" is not seeded`);

  return client.userRole.create({ data: { userId, roleId: role.id } });
}

export async function getUserRoleNames(userId: string, tx?: TransactionClient): Promise<string[]> {
  const rows = await db(tx).userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role.name);
}

// --- Sessions -------------------------------------------------------------

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  tokenFamily: string;
  expiresAt: Date;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export function createSession(input: CreateSessionInput, tx?: TransactionClient) {
  return db(tx).session.create({ data: input });
}

export function findSessionByRefreshTokenHash(hash: string, tx?: TransactionClient) {
  return db(tx).session.findUnique({ where: { refreshTokenHash: hash } });
}

export function findSessionById(id: string, tx?: TransactionClient) {
  return db(tx).session.findUnique({ where: { id } });
}

export function rotateSessionRefreshToken(
  sessionId: string,
  newRefreshTokenHash: string,
  tx?: TransactionClient,
) {
  return db(tx).session.update({
    where: { id: sessionId },
    data: { refreshTokenHash: newRefreshTokenHash, lastActiveAt: new Date() },
  });
}

export function revokeSession(sessionId: string, reason: string, tx?: TransactionClient) {
  return db(tx).session.update({
    where: { id: sessionId },
    data: { revoked: true, revokedAt: new Date(), revokedReason: reason },
  });
}

export function revokeSessionFamily(tokenFamily: string, reason: string, tx?: TransactionClient) {
  return db(tx).session.updateMany({
    where: { tokenFamily, revoked: false },
    data: { revoked: true, revokedAt: new Date(), revokedReason: reason },
  });
}

export function revokeAllUserSessions(userId: string, reason: string, tx?: TransactionClient) {
  return db(tx).session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true, revokedAt: new Date(), revokedReason: reason },
  });
}

export function listActiveSessions(userId: string, tx?: TransactionClient) {
  return db(tx).session.findMany({
    where: { userId, revoked: false, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export function countActiveSessions(userId: string, tx?: TransactionClient) {
  return db(tx).session.count({
    where: { userId, revoked: false, expiresAt: { gt: new Date() } },
  });
}

// --- Email verification tokens ---------------------------------------------

export function createEmailVerificationToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  tx?: TransactionClient,
) {
  return db(tx).emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
}

export function findEmailVerificationToken(tokenHash: string, tx?: TransactionClient) {
  return db(tx).emailVerificationToken.findUnique({ where: { tokenHash } });
}

export function markEmailVerificationTokenUsed(id: string, tx?: TransactionClient) {
  return db(tx).emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export function countRecentEmailVerificationTokens(
  userId: string,
  since: Date,
  tx?: TransactionClient,
) {
  return db(tx).emailVerificationToken.count({ where: { userId, createdAt: { gte: since } } });
}

// --- Password reset tokens --------------------------------------------------

export function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  ipAddress: string | null,
  tx?: TransactionClient,
) {
  return db(tx).passwordResetToken.create({ data: { userId, tokenHash, expiresAt, ipAddress } });
}

export function findPasswordResetToken(tokenHash: string, tx?: TransactionClient) {
  return db(tx).passwordResetToken.findUnique({ where: { tokenHash } });
}

export function markPasswordResetTokenUsed(id: string, tx?: TransactionClient) {
  return db(tx).passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export function countRecentPasswordResetTokens(userId: string, since: Date, tx?: TransactionClient) {
  return db(tx).passwordResetToken.count({ where: { userId, createdAt: { gte: since } } });
}

// --- MFA --------------------------------------------------------------------

export function findMfaCredential(userId: string, tx?: TransactionClient) {
  return db(tx).mfaCredential.findUnique({ where: { userId } });
}

export function upsertMfaCredential(
  userId: string,
  encryptedSecret: string,
  tx?: TransactionClient,
) {
  return db(tx).mfaCredential.upsert({
    where: { userId },
    create: { userId, encryptedSecret, enabled: false },
    update: { encryptedSecret, enabled: false, enabledAt: null, lastUsedStep: null },
  });
}

export function enableMfaCredential(userId: string, tx?: TransactionClient) {
  return db(tx).mfaCredential.update({
    where: { userId },
    data: { enabled: true, enabledAt: new Date() },
  });
}

export function disableMfaCredential(userId: string, tx?: TransactionClient) {
  return db(tx).mfaCredential.delete({ where: { userId } });
}

export function recordMfaStep(userId: string, step: bigint, tx?: TransactionClient) {
  return db(tx).mfaCredential.update({ where: { userId }, data: { lastUsedStep: step } });
}

// --- Recovery codes -----------------------------------------------------

export function createRecoveryCodes(
  userId: string,
  batchId: string,
  codeHashes: string[],
  tx?: TransactionClient,
) {
  return db(tx).recoveryCode.createMany({
    data: codeHashes.map((codeHash) => ({ userId, batchId, codeHash })),
  });
}

export function findUnusedRecoveryCode(userId: string, codeHash: string, tx?: TransactionClient) {
  return db(tx).recoveryCode.findFirst({
    where: { userId, codeHash, usedAt: null },
  });
}

export function markRecoveryCodeUsed(id: string, tx?: TransactionClient) {
  return db(tx).recoveryCode.update({ where: { id }, data: { usedAt: new Date() } });
}

export function deleteAllRecoveryCodes(userId: string, tx?: TransactionClient) {
  return db(tx).recoveryCode.deleteMany({ where: { userId } });
}

// --- Login attempts / lockout -------------------------------------------

export function recordLoginAttempt(
  input: { userId: string | null; emailAttempted: string; succeeded: boolean; ipAddress: string | null; userAgent: string | null },
  tx?: TransactionClient,
) {
  return db(tx).loginAttempt.create({ data: input });
}
