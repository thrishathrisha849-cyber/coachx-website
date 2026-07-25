import argon2 from 'argon2';
import type { PasswordPolicyResult } from './auth.types';

/**
 * Password hashing — Argon2id (FR-138: "hash passwords using an approved
 * adaptive hashing algorithm"). Argon2id was 003/plan.md's own tentative
 * choice, flagged there as `NEEDS CLARIFICATION` ("not named in source");
 * this resolves that gate explicitly rather than silently — see
 * docs/auth/TRACEABILITY.md.
 */
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  // Deliberately conservative defaults (argon2's own recommended minimums
  // for interactive login) rather than inventing untested parameters.
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * Constant-time comparison is handled internally by argon2's own verify —
 * this never short-circuits on a byte-by-byte mismatch (Phase 4 brief
 * §13: "constant-time sensitive comparisons where applicable").
 */
export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    // A malformed/foreign hash format throws rather than returning false —
    // normalize to false so a corrupt stored hash never becomes a crash
    // that leaks information via a 500 instead of a clean auth failure.
    return false;
  }
}

// A short, well-known list of the most common compromised passwords
// (FR-013: "MUST reject common compromised passwords"). This is a
// minimal, offline, dependency-free baseline — NOT a full
// breach-corpus check (FR-019's "reject previously breached passwords
// where breach-checking is supported" explicitly conditions that on
// breach-checking being supported, which requires an external service
// e.g. HaveIBeenPwned's k-anonymity API; not configured in this phase,
// see docs/auth/TRACEABILITY.md).
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'letmein1',
  'welcome1',
  'admin123',
  'iloveyou',
  'monkey123',
  'football',
  'abc12345',
]);

/**
 * FR-013: minimum 8 characters, at least one letter and one number,
 * rejects common compromised passwords, rejects passwords matching the
 * user's email or name. FR-014: optional stronger staff policy (12+
 * chars, upper/lower/number/special).
 */
export function validatePasswordPolicy(
  password: string,
  context: { email?: string; name?: string; strict?: boolean } = {},
): PasswordPolicyResult {
  const errors: string[] = [];
  const minLength = context.strict ? 12 : 8;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (context.strict) {
    if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push('Password must contain a special character');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common — please choose a stronger one');
  }

  const lowerPassword = password.toLowerCase();
  if (context.email && lowerPassword === context.email.toLowerCase()) {
    errors.push('Password must not match your email address');
  }
  if (context.name && lowerPassword === context.name.toLowerCase()) {
    errors.push('Password must not match your name');
  }

  return { valid: errors.length === 0, errors };
}
