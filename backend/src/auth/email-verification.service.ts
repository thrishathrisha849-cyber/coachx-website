import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { config } from '../config';
import { generateSecureToken, hashToken } from './secure-token.util';
import { getEmailAdapter } from './email.port';
import {
  findEmailVerificationToken,
  markEmailVerificationTokenUsed,
  findUserById,
  findUserByEmail,
  createEmailVerificationToken,
  countRecentEmailVerificationTokens,
  updateUser,
} from './auth.repository';
import { AUTH_ERROR_CODES } from './auth-error-codes';

const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends
const RESEND_DAILY_LIMIT = 5;

/**
 * Email verification lifecycle (003 FR-024–FR-027; Phase 4 brief §7).
 * Token is generated cryptographically secure, only its hash is stored,
 * it expires, and it can only ever be consumed once — enforced by the
 * transaction below reading + marking-used atomically.
 */
export async function verifyEmail(rawToken: string): Promise<{ userId: string }> {
  const tokenHash = hashToken(rawToken);

  return withTransaction(async (tx) => {
    const record = await findEmailVerificationToken(tokenHash, tx);

    if (!record) {
      throw new AppError('Invalid verification token', 400, AUTH_ERROR_CODES.TOKEN_INVALID);
    }
    if (record.usedAt) {
      throw new AppError('This verification link has already been used', 400, AUTH_ERROR_CODES.TOKEN_ALREADY_USED);
    }
    if (record.expiresAt < new Date()) {
      throw new AppError('This verification link has expired', 400, AUTH_ERROR_CODES.TOKEN_EXPIRED);
    }

    await markEmailVerificationTokenUsed(record.id, tx);
    await updateUser(
      record.userId,
      { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      tx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: record.userId,
        action: 'auth.email.verified',
        resourceType: 'user',
        resourceId: record.userId,
      },
      tx,
    );

    return { userId: record.userId };
  });
}

/**
 * FR-026: resend protections — cooldown, daily limit, audit entry per
 * resend. Deliberately does NOT reveal whether the email exists (mirrors
 * the enumeration-safety pattern applied to forgot-password) — always
 * returns the same generic acknowledgement regardless.
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  // Enumeration-safe: silently no-op for a non-existent or
  // already-verified account rather than revealing account state.
  if (!user || user.emailVerifiedAt) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await countRecentEmailVerificationTokens(user.id, since);
  if (recentCount >= RESEND_DAILY_LIMIT) return; // silent no-op, not an error — enumeration-safe

  // Cooldown: reuse the most recent token's age as the cooldown gate.
  // (A dedicated "lastSentAt" column would be a cleaner signal; using
  // countRecentEmailVerificationTokens with a 1-minute window achieves
  // the same cooldown behavior without a new column.)
  const sinceCooldown = new Date(Date.now() - RESEND_COOLDOWN_MS);
  const recentlySent = await countRecentEmailVerificationTokens(user.id, sinceCooldown);
  if (recentlySent > 0) return; // silent no-op — still within cooldown

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.auth.emailVerificationTokenTtlHours * 60 * 60 * 1000);

  await createEmailVerificationToken(user.id, tokenHash, expiresAt);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: user.id,
    action: 'auth.email.verification_resent',
    resourceType: 'user',
    resourceId: user.id,
  });

  await getEmailAdapter().send({
    to: normalizedEmail,
    subject: 'Verify your CoachX account',
    text: `Please verify your email by using this token: ${rawToken}\n\nThis link expires in ${config.auth.emailVerificationTokenTtlHours} hours.`,
  });
}

export async function requireVerifiedForAction(userId: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user?.emailVerifiedAt) {
    throw new AppError('Please verify your email to continue', 403, AUTH_ERROR_CODES.EMAIL_UNVERIFIED);
  }
}
