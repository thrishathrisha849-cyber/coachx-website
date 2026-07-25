import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { TOTP, Secret } from 'otpauth';
import { config } from '../config';

/**
 * TOTP-based MFA (Phase 4 brief §9). Authenticator-app TOTP is the only
 * MFA method implemented in Phase 4 — it is the one 003 FR-051 lists
 * ("authenticator app (preferred)") that requires no external SMS/email
 * provider, consistent with the brief's own guidance ("if the
 * specification does not choose a concrete MFA method, stop and report
 * the decision gate rather than inventing one" — 003 FR-051 DOES name a
 * concrete, provider-free method, so this is not a gate, just a scoping
 * decision — see docs/auth/TRACEABILITY.md).
 */

const TOTP_ISSUER = 'TBT One';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export function generateTotpSecret(): Secret {
  return new Secret({ size: 20 });
}

export function buildTotp(secret: Secret, accountLabel: string): TOTP {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label: accountLabel,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret,
  });
}

/**
 * Returns the current time-step index — used for replay protection
 * (§9 "replay protection"): a step already recorded as consumed
 * (`MfaCredential.lastUsedStep`) must never be accepted again, closing
 * the classic "the same 30-second code is replayed within its own
 * window" TOTP vulnerability.
 */
export function currentTotpStep(): bigint {
  return BigInt(Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS));
}

// --- Encryption at rest for the TOTP secret (Phase 4 brief §9: "Encrypt
// or securely protect MFA secrets") ---------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function derivedKey(): Buffer {
  // MFA_ENCRYPTION_KEY may be any length/format the operator configures;
  // SHA-256 it down to exactly 32 bytes for AES-256, rather than
  // requiring the operator to hand-craft a raw 32-byte value.
  return createHash('sha256').update(config.auth.mfaEncryptionKey).digest();
}

export function encryptTotpSecret(secretBase32: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secretBase32, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // iv.authTag.ciphertext, all base64 — self-contained, no separate
  // column needed for the tag/iv.
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptTotpSecret(encryptedValue: string): string {
  const [ivB64, authTagB64, cipherTextB64] = encryptedValue.split('.');
  if (!ivB64 || !authTagB64 || !cipherTextB64) {
    throw new Error('Malformed encrypted TOTP secret');
  }

  const decipher = createDecipheriv(ALGORITHM, derivedKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherTextB64, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
