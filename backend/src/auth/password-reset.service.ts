import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { config } from '../config';
import { hashPassword, validatePasswordPolicy } from './password.util';
import { generateSecureToken, hashToken } from './secure-token.util';
import { getEmailAdapter } from './email.port';
import {
  findUserByEmail,
  findUserById,
  findPasswordResetToken,
  markPasswordResetTokenUsed,
  createPasswordResetToken,
  countRecentPasswordResetTokens,
  updateCredentialPassword,
  updateUser,
} from './auth.repository';
import { revokeAllSessions } from './session.service';
import { AUTH_ERROR_CODES } from './auth-error-codes';
import { MFA_MANDATORY_ROLES, type RoleName } from './rbac.constants';
import { getEffectiveRoles } from './rbac.service';

const REQUEST_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_RATE_LIMIT_MAX = 3;

/**
 * FR-043/SC-003: identical response regardless of whether the identifier
 * matches an account — the enumeration-safety requirement this feature's
 * own success criteria names as measurable. Every branch below that
 * would otherwise short-circuit differently (no user, rate-limited)
 * instead just returns silently, exactly like the success path.
 */
export async function requestPasswordReset(email: string, ipAddress: string | null): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) return; // enumeration-safe silent no-op

  const since = new Date(Date.now() - REQUEST_RATE_LIMIT_WINDOW_MS);
  const recentCount = await countRecentPasswordResetTokens(user.id, since);
  if (recentCount >= REQUEST_RATE_LIMIT_MAX) return; // enumeration-safe silent no-op (also serves as rate limiting)

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.auth.passwordResetTokenTtlMin * 60 * 1000);

  await createPasswordResetToken(user.id, tokenHash, expiresAt, ipAddress);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: user.id,
    action: 'auth.password_reset.requested',
    resourceType: 'user',
    resourceId: user.id,
    ipAddress: ipAddress ?? undefined,
  });

  await getEmailAdapter().send({
    to: normalizedEmail,
    subject: 'Reset your CoachX password',
    text: `Use this token to reset your password: ${rawToken}\n\nThis link expires in ${config.auth.passwordResetTokenTtlMin} minutes. If you did not request this, you can safely ignore this email — your password has not been changed.`,
  });
}

/**
 * FR-045/FR-046: validates the token (valid/unused/unexpired), enforces
 * the password policy, and revokes sessions per policy — FR-047:
 * unconditional full revocation for staff (MFA-mandatory) roles,
 * configurable-but-always-on revocation for standard users in this
 * phase (see docs/auth/TRACEABILITY.md — Phase 4 implements the
 * always-revoke behavior for every user, treating it as the safer
 * default rather than building a separate "configurable" policy toggle
 * with no admin UI to configure it through).
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<void> {
  if (newPassword !== confirmNewPassword) {
    throw AppError.badRequest('New password and confirmation do not match');
  }

  const tokenHash = hashToken(rawToken);

  await withTransaction(async (tx) => {
    const record = await findPasswordResetToken(tokenHash, tx);

    if (!record) throw new AppError('Invalid reset token', 400, AUTH_ERROR_CODES.TOKEN_INVALID);
    if (record.usedAt) throw new AppError('This reset link has already been used', 400, AUTH_ERROR_CODES.TOKEN_ALREADY_USED);
    if (record.expiresAt < new Date()) throw new AppError('This reset link has expired', 400, AUTH_ERROR_CODES.TOKEN_EXPIRED);

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      throw AppError.badRequest('Password does not meet the required policy', { errors: policy.errors });
    }

    const passwordHash = await hashPassword(newPassword);

    await markPasswordResetTokenUsed(record.id, tx);
    await updateCredentialPassword(record.userId, passwordHash, tx);
    await updateUser(record.userId, { failedLoginCount: 0, lockedUntil: null, status: 'ACTIVE' }, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: record.userId,
        action: 'auth.password_reset.completed',
        resourceType: 'user',
        resourceId: record.userId,
      },
      tx,
    );

    return record.userId;
  }).then(async (userId) => {
    // Session revocation happens after the transaction commits — revoking
    // sessions is itself a write, but doing it in the SAME transaction as
    // the password change is unnecessary (a reset that revokes sessions
    // slightly late is not a security gap; a reset that fails BECAUSE
    // session-revocation failed would be a worse, self-inflicted outage).
    const roles = await getEffectiveRoles(userId);
    const isStaff = roles.some((r) => MFA_MANDATORY_ROLES.includes(r as RoleName));

    // FR-046/FR-047: revoke sessions on every reset (staff: unconditional
    // per FR-047; standard users: Phase 4's chosen default — see comment above).
    await revokeAllSessions(userId, isStaff ? 'staff_password_reset_mandatory' : 'password_reset');

    const user = await findUserById(userId);
    if (user) {
      await getEmailAdapter().send({
        to: user.email,
        subject: 'Your CoachX password was changed',
        text: 'Your password was just changed. If this was not you, please contact support immediately.',
      });
    }
  });
}
