import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { withTransaction } from '../database/transaction';
import { config } from '../config';
import { signAccessToken, verifyAccessToken } from './token.util';
import { generateSecureToken, hashToken } from './secure-token.util';
import {
  createSession,
  findSessionByRefreshTokenHash,
  findSessionById,
  rotateSessionRefreshToken,
  revokeSession,
  revokeSessionFamily,
  revokeAllUserSessions,
  listActiveSessions,
  countActiveSessions,
  getUserRoleNames,
} from './auth.repository';
import { AUTH_ERROR_CODES } from './auth-error-codes';

/**
 * Session/token lifecycle (Phase 4 brief §6). A `Session` row IS the
 * refresh-token rotation state (see schema.prisma's comment on the
 * `Session` model for why there is no separate `RefreshToken` table).
 *
 * Concurrent-session limit (003 FR-058): standard users may hold multiple
 * concurrent sessions; a platform-wide ceiling is enforced defensively
 * (oldest session evicted) rather than the full "admin-configurable by
 * role and organization policy" matrix FR-058 describes — no admin
 * console exists yet to configure that policy, see
 * docs/auth/TRACEABILITY.md.
 */

const MAX_CONCURRENT_SESSIONS = 10;
const REFRESH_TOKEN_TTL_MS = parseDurationToMs(config.jwt.refreshExpiresIn);

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return value * unitMs;
}

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
}

export interface SessionContext {
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

/**
 * Issues a brand-new session (signup/login) — a fresh token family, a
 * fresh session row, and a matching access token.
 */
export async function issueSession(userId: string, context: SessionContext): Promise<IssuedTokenPair> {
  const roles = await getUserRoleNames(userId);
  const refreshToken = generateSecureToken();
  const refreshTokenHash = hashToken(refreshToken);
  const tokenFamily = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  // FR-058: enforce a concurrent-session ceiling — evict the oldest
  // active session rather than silently allowing unbounded growth.
  const activeCount = await countActiveSessions(userId);
  if (activeCount >= MAX_CONCURRENT_SESSIONS) {
    const sessions = await listActiveSessions(userId);
    const oldest = sessions[sessions.length - 1];
    if (oldest) await revokeSession(oldest.id, 'concurrent_session_limit_exceeded');
  }

  const session = await createSession({
    userId,
    refreshTokenHash,
    tokenFamily,
    expiresAt,
    deviceName: context.deviceName ?? null,
    userAgent: context.userAgent ?? null,
    ipAddress: context.ipAddress ?? null,
  });

  const accessToken = signAccessToken({ sub: userId, sid: session.id, roles });

  return { accessToken, refreshToken, sessionId: session.id, expiresAt };
}

/**
 * Refresh-token rotation with reuse detection (003 FR-056; Phase 4 brief
 * §6). Every refresh call:
 *   1. Looks up the session by the presented token's hash.
 *   2. If found and not revoked/expired: rotates to a new refresh token
 *      (same family) and issues a fresh access token.
 *   3. If NOT found by hash but the caller claims a session that IS
 *      revoked (a stolen/already-rotated token being replayed): the
 *      entire token family is revoked — "a stolen or reused refresh
 *      token must not remain valid indefinitely" (Phase 4 brief §6).
 */
export async function rotateSession(rawRefreshToken: string): Promise<IssuedTokenPair> {
  const presentedHash = hashToken(rawRefreshToken);
  const session = await findSessionByRefreshTokenHash(presentedHash);

  if (!session) {
    // The presented token doesn't match any session's CURRENT hash.
    // This is exactly the reuse-of-an-already-rotated-token signature
    // if the token was ever valid at all — since we cannot know which
    // family it belonged to without a matching row, we cannot revoke a
    // specific family, so we simply reject. (A genuinely fabricated
    // token also lands here — indistinguishable from replay by design,
    // which is the correct security posture: never confirm which case
    // occurred to the caller.)
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  if (session.revoked) {
    // The token matched a row, but that row is already revoked — this IS
    // unambiguous reuse of a token from a family that has already
    // rotated past this point (rotation revokes the OLD row rather than
    // overwriting its hash in place, so reaching a revoked row by hash
    // match only happens via this path or a directly-revoked session).
    // Revoke the whole family.
    //
    // Committed in its OWN transaction, deliberately: this call and the
    // AppError thrown right after it must NOT share a transaction with
    // each other. Prisma's $transaction rolls back every write in the
    // callback when the callback throws — sharing one here would silently
    // undo the family revocation the instant the 401 below is raised,
    // leaving every other session in the family (e.g. an already-rotated,
    // still-valid refresh token) usable, exactly what this check exists
    // to prevent (FR-056).
    await withTransaction(async (tx) => {
      await revokeSessionFamily(session.tokenFamily, 'refresh_token_reuse_detected', tx);
      await recordAuditEvent(
        {
          actorType: 'USER',
          actorId: session.userId,
          action: 'auth.session.refresh_reuse_detected',
          resourceType: 'session',
          resourceId: session.id,
          reason: 'Refresh token reuse detected — entire token family revoked',
        },
        tx,
      );
    });
    throw new AppError(
      'This session has been revoked due to suspicious activity. Please log in again.',
      401,
      AUTH_ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
    );
  }

  if (session.expiresAt < new Date()) {
    throw new AppError('Refresh token has expired', 401, AUTH_ERROR_CODES.TOKEN_EXPIRED);
  }

  return withTransaction(async (tx) => {
    const roles = await getUserRoleNames(session.userId, tx);
    const newRefreshToken = generateSecureToken();
    const newHash = hashToken(newRefreshToken);

    const rotated = await rotateSessionRefreshToken(session, newHash, tx);

    const accessToken = signAccessToken({ sub: session.userId, sid: rotated.id, roles });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: rotated.id,
      expiresAt: rotated.expiresAt,
    };
  });
}

/** Sign out the current session (003 FR-059). */
export async function revokeCurrentSession(sessionId: string): Promise<void> {
  await revokeSession(sessionId, 'user_logout');
}

/** Sign out a specific session by ID, verifying ownership first. */
export async function revokeSpecificSession(userId: string, sessionId: string): Promise<void> {
  const session = await findSessionById(sessionId);
  if (!session || session.userId !== userId) {
    throw AppError.notFound('Session not found');
  }
  await revokeSession(sessionId, 'user_removed_device');
}

/** Sign out ALL sessions for a user (003 FR-059, FR-047). */
export async function revokeAllSessions(userId: string, reason: string): Promise<void> {
  await revokeAllUserSessions(userId, reason);
  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'auth.session.all_revoked',
    resourceType: 'user',
    resourceId: userId,
    reason,
  });
}

export async function getActiveSessions(userId: string) {
  return listActiveSessions(userId);
}

export { verifyAccessToken };
