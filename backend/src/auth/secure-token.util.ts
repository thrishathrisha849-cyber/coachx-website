import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/**
 * Cryptographically secure random tokens for email verification, password
 * reset, and refresh tokens (Phase 4 brief §2/§7/§8: "cryptographically
 * secure token generation... store only the token hash"). The RAW token
 * is only ever handed to the caller once (to embed in a link/response);
 * only its SHA-256 hash is ever persisted, mirroring the exact pattern
 * Phase 3 already established for `IdempotencyKey` — no new hashing
 * convention was invented for this phase.
 */

const RAW_TOKEN_BYTES = 32; // 256 bits

export function generateSecureToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString('base64url');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Constant-time equality check for the rare cases where a raw token must
 * be compared directly (not via hash lookup) — e.g. defense-in-depth on a
 * TOTP-adjacent code. Not used for the hash-lookup token flows above,
 * which rely on Postgres's own indexed equality (which is not
 * timing-attack-relevant here, since the hash is only found or not found
 * — there is no partial-match branch to time).
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
