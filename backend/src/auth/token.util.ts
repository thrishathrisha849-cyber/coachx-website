import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/app-error';
import type { AccessTokenClaims } from './auth.types';

/**
 * Access-token issuance/verification (Phase 4 brief §5). Short-lived
 * (`JWT_ACCESS_EXPIRES_IN`, default 15m per the existing Phase 1 env
 * default), signed with a dedicated secret (`JWT_ACCESS_SECRET`, distinct
 * from `JWT_REFRESH_SECRET` — a compromised access-token secret must not
 * also compromise refresh tokens), issuer/audience validated on every
 * verify (§5 "Issuer and audience validation"), and a `type: 'access'`
 * claim checked explicitly so a refresh token can never be replayed as an
 * access token even if both were somehow signed with the same secret
 * (§5 "Token type validation").
 *
 * Key rotation readiness (§5): the secret is read from config on every
 * call (never module-level-cached at import time beyond what `config`
 * itself does), so rotating `JWT_ACCESS_SECRET` and restarting the
 * process is sufficient — no code change needed to support rotation.
 */

export function signAccessToken(claims: Omit<AccessTokenClaims, 'type'>): string {
  const payload: AccessTokenClaims = { ...claims, type: 'access' };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  } as jwt.SignOptions);
}

/**
 * Verifies and decodes an access token. Throws `AppError.unauthorized()`
 * (never a raw jsonwebtoken error, which could leak library internals)
 * for every failure mode: expired, malformed, wrong signature, wrong
 * issuer/audience, or wrong token type.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    (decoded as { type?: string }).type !== 'access'
  ) {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  return decoded as AccessTokenClaims;
}

/**
 * Short-lived MFA challenge token (003 FR-050/§9's "MFA login challenge").
 * Issued once a login's password check succeeds but before the second
 * factor is verified — deliberately a DIFFERENT `type` claim than an
 * access token so it can never be used as one, and a much shorter TTL
 * than the access token itself (5 minutes — this only needs to survive
 * the brief window between password submission and code entry).
 */
const MFA_CHALLENGE_TTL = '5m';

export interface MfaChallengeClaims {
  sub: string;
  type: 'mfa_challenge';
}

export function signMfaChallengeToken(userId: string): string {
  const payload: MfaChallengeClaims = { sub: userId, type: 'mfa_challenge' };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: MFA_CHALLENGE_TTL,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  } as jwt.SignOptions);
}

export function verifyMfaChallengeToken(token: string): MfaChallengeClaims {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
  } catch {
    throw AppError.unauthorized('Invalid or expired MFA challenge');
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    (decoded as { type?: string }).type !== 'mfa_challenge'
  ) {
    throw AppError.unauthorized('Invalid or expired MFA challenge');
  }

  return decoded as MfaChallengeClaims;
}
