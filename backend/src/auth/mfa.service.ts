import { randomUUID } from 'node:crypto';
import { Secret } from 'otpauth';
import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { verifyPassword } from './password.util';
import { generateTotpSecret, buildTotp, currentTotpStep, encryptTotpSecret, decryptTotpSecret } from './totp.util';
import { generateSecureToken, hashToken } from './secure-token.util';
import { signMfaChallengeToken, verifyMfaChallengeToken } from './token.util';
import {
  findMfaCredential,
  upsertMfaCredential,
  enableMfaCredential,
  disableMfaCredential,
  recordMfaStep,
  createRecoveryCodes,
  findUnusedRecoveryCode,
  markRecoveryCodeUsed,
  deleteAllRecoveryCodes,
  findUserById,
  findCredential,
  updateUser,
} from './auth.repository';
import { issueSession, type IssuedTokenPair, type SessionContext } from './session.service';
import { AUTH_ERROR_CODES } from './auth-error-codes';

const RECOVERY_CODE_COUNT = 10;

/**
 * TOTP-based MFA lifecycle (003 FR-050–FR-054; Phase 4 brief §9). Only
 * the authenticator-app method is implemented — see totp.util.ts's
 * header comment for why this is a scoping decision, not an unresolved
 * gate.
 */

export function issueMfaChallenge(userId: string): string {
  return signMfaChallengeToken(userId);
}

// --- Enrollment -----------------------------------------------------------

export interface MfaEnrollmentResult {
  /** Provisioning URI for a QR code (otpauth://...) — the secret is embedded here ONLY during enrollment, never again afterward (Phase 4 brief §9: "never return stored secrets after enrolment completes"). */
  provisioningUri: string;
  secretBase32: string;
}

/**
 * Step 1 of 2FA setup (003 FR-052): requires password re-entry first,
 * then issues a QR/secret pending verification. The secret is stored
 * encrypted immediately (so a crash between steps doesn't lose it) but
 * `enabled` stays false until `confirmMfaEnrollment` succeeds.
 */
export async function startMfaEnrollment(userId: string, currentPassword: string): Promise<MfaEnrollmentResult> {
  const user = await findUserById(userId);
  if (!user) throw AppError.notFound('User not found');

  const credential = await findCredential(userId, 'PASSWORD');
  const validPassword = credential?.passwordHash
    ? await verifyPassword(credential.passwordHash, currentPassword)
    : false;
  if (!validPassword) throw AppError.unauthorized('Current password is incorrect');

  const existing = await findMfaCredential(userId);
  if (existing?.enabled) {
    throw new AppError('Two-factor authentication is already enabled', 409, AUTH_ERROR_CODES.MFA_ALREADY_ENABLED);
  }

  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret.base32);
  await upsertMfaCredential(userId, encrypted);

  const totp = buildTotp(secret, user.email);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'auth.mfa.enrollment_started',
    resourceType: 'user',
    resourceId: userId,
  });

  return { provisioningUri: totp.toString(), secretBase32: secret.base32 };
}

/**
 * Step 2 of 2FA setup: verification code + recovery-code generation +
 * confirmation notification + audit event (003 FR-052).
 */
export async function confirmMfaEnrollment(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
  const mfaCredential = await findMfaCredential(userId);
  if (!mfaCredential) throw new AppError('No pending MFA enrollment found', 400, AUTH_ERROR_CODES.MFA_NOT_ENABLED);

  const secretBase32 = decryptTotpSecret(mfaCredential.encryptedSecret);
  const totp = buildTotp(Secret.fromBase32(secretBase32), userId);

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    throw new AppError('Invalid verification code', 400, AUTH_ERROR_CODES.MFA_INVALID_CODE);
  }

  const recoveryCodes = await withTransaction(async (tx) => {
    await enableMfaCredential(userId, tx);
    await updateUser(userId, { mfaEnabled: true }, tx);

    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generateSecureToken().slice(0, 12));
    const batchId = randomUUID();
    await createRecoveryCodes(userId, batchId, codes.map(hashToken), tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: 'auth.mfa.enabled',
        resourceType: 'user',
        resourceId: userId,
      },
      tx,
    );

    return codes;
  });

  return { recoveryCodes };
}

/**
 * 003 FR-054: disabling requires password + current 2FA or recovery-code
 * verification, plus a security notification (delivered via the email
 * port — see email.port.ts) and an audit record.
 */
export async function disableMfa(userId: string, password: string, code: string): Promise<void> {
  const credential = await findCredential(userId, 'PASSWORD');
  const validPassword = credential?.passwordHash ? await verifyPassword(credential.passwordHash, password) : false;
  if (!validPassword) throw AppError.unauthorized('Current password is incorrect');

  const mfaCredential = await findMfaCredential(userId);
  if (!mfaCredential?.enabled) {
    throw new AppError('Two-factor authentication is not enabled', 400, AUTH_ERROR_CODES.MFA_NOT_ENABLED);
  }

  const verified = await verifyTotpOrRecoveryCode(userId, mfaCredential.encryptedSecret, code);
  if (!verified) throw new AppError('Invalid verification code', 400, AUTH_ERROR_CODES.MFA_INVALID_CODE);

  await withTransaction(async (tx) => {
    await disableMfaCredential(userId, tx);
    await deleteAllRecoveryCodes(userId, tx);
    await updateUser(userId, { mfaEnabled: false }, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: 'auth.mfa.disabled',
        resourceType: 'user',
        resourceId: userId,
      },
      tx,
    );
  });
}

/**
 * Completes login after a successful MFA challenge (003 §9 "MFA login
 * challenge"). Accepts either a current TOTP code or an unused recovery
 * code — both paths are replay-protected (TOTP via `lastUsedStep`,
 * recovery codes via one-time `usedAt`).
 */
export async function completeMfaLogin(
  mfaChallengeToken: string,
  code: string,
  context: SessionContext,
): Promise<IssuedTokenPair> {
  const claims = verifyMfaChallengeToken(mfaChallengeToken);

  const mfaCredential = await findMfaCredential(claims.sub);
  if (!mfaCredential?.enabled) {
    throw new AppError('Two-factor authentication is not enabled for this account', 400, AUTH_ERROR_CODES.MFA_NOT_ENABLED);
  }

  const verified = await verifyTotpOrRecoveryCode(claims.sub, mfaCredential.encryptedSecret, code);
  if (!verified) {
    await recordAuditEvent({
      actorType: 'USER',
      actorId: claims.sub,
      action: 'auth.mfa.challenge_failed',
      resourceType: 'user',
      resourceId: claims.sub,
    });
    throw new AppError('Invalid verification code', 400, AUTH_ERROR_CODES.MFA_INVALID_CODE);
  }

  const tokens = await issueSession(claims.sub, context);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: claims.sub,
    action: 'auth.mfa.challenge_succeeded',
    resourceType: 'user',
    resourceId: claims.sub,
  });

  return tokens;
}

/**
 * Verifies a 6-digit TOTP code (with replay protection) OR a recovery
 * code (one-time use). Tries TOTP first (the common case), then falls
 * back to recovery-code lookup only if the code doesn't parse as a
 * plausible TOTP attempt — both paths are rate-limited upstream by the
 * route-level rate limiter (Phase 4 brief §9: "add rate limiting").
 */
async function verifyTotpOrRecoveryCode(
  userId: string,
  encryptedSecret: string,
  code: string,
): Promise<boolean> {
  if (/^\d{6}$/.test(code)) {
    const secretBase32 = decryptTotpSecret(encryptedSecret);
    const totp = buildTotp(Secret.fromBase32(secretBase32), userId);
    const delta = totp.validate({ token: code, window: 1 });

    if (delta !== null) {
      const step = currentTotpStep() + BigInt(delta);
      const mfaCredential = await findMfaCredential(userId);

      // Replay protection: reject if this exact step was already consumed.
      if (mfaCredential?.lastUsedStep !== null && mfaCredential?.lastUsedStep === step) {
        return false;
      }

      await recordMfaStep(userId, step);
      return true;
    }
  }

  // Fall back to recovery code (Phase 4 brief §9: recovery codes; FR-051).
  const codeHash = hashToken(code);
  const recoveryCode = await findUnusedRecoveryCode(userId, codeHash);
  if (recoveryCode) {
    await markRecoveryCodeUsed(recoveryCode.id);
    return true;
  }

  return false;
}

/** FR-053: regenerating invalidates all previously issued codes. */
export async function regenerateRecoveryCodes(userId: string): Promise<string[]> {
  const mfaCredential = await findMfaCredential(userId);
  if (!mfaCredential?.enabled) {
    throw new AppError('Two-factor authentication is not enabled', 400, AUTH_ERROR_CODES.MFA_NOT_ENABLED);
  }

  return withTransaction(async (tx) => {
    await deleteAllRecoveryCodes(userId, tx);
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generateSecureToken().slice(0, 12));
    const batchId = randomUUID();
    await createRecoveryCodes(userId, batchId, codes.map(hashToken), tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: 'auth.mfa.recovery_codes_regenerated',
        resourceType: 'user',
        resourceId: userId,
      },
      tx,
    );

    return codes;
  });
}
