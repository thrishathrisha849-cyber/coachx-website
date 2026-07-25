import { hashPassword, verifyPassword, validatePasswordPolicy } from '../../src/auth/password.util';

describe('password.util', () => {
  describe('hashPassword() / verifyPassword()', () => {
    it('hashes a password and verifies the correct plaintext against it', async () => {
      const hash = await hashPassword('CorrectHorseBattery1');
      expect(hash).not.toBe('CorrectHorseBattery1');
      expect(hash.startsWith('$argon2id$')).toBe(true);

      const valid = await verifyPassword(hash, 'CorrectHorseBattery1');
      expect(valid).toBe(true);
    });

    it('rejects an incorrect plaintext', async () => {
      const hash = await hashPassword('CorrectHorseBattery1');
      const valid = await verifyPassword(hash, 'WrongPassword1');
      expect(valid).toBe(false);
    });

    it('returns false (not a throw) for a malformed stored hash', async () => {
      const valid = await verifyPassword('not-a-real-hash', 'anything');
      expect(valid).toBe(false);
    });

    it('produces a different hash for the same password on each call (unique salt)', async () => {
      const hash1 = await hashPassword('SamePassword1');
      const hash2 = await hashPassword('SamePassword1');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validatePasswordPolicy()', () => {
    it('accepts a policy-compliant password', () => {
      const result = validatePasswordPolicy('GoodPassword1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = validatePasswordPolicy('Ab1');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('8 characters'))).toBe(true);
    });

    it('rejects a password with no number', () => {
      const result = validatePasswordPolicy('NoNumberHere');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('number'))).toBe(true);
    });

    it('rejects a password with no letter', () => {
      const result = validatePasswordPolicy('12345678');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('letter'))).toBe(true);
    });

    it('rejects a common compromised password', () => {
      const result = validatePasswordPolicy('password123');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('too common'))).toBe(true);
    });

    it("rejects a password matching the user's email", () => {
      const result = validatePasswordPolicy('user@example.com', { email: 'user@example.com' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('email'))).toBe(true);
    });

    it('enforces the stricter 12-char/mixed-case/special-char staff policy when strict=true', () => {
      const result = validatePasswordPolicy('Weak1abc', { strict: true });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('12 characters'))).toBe(true);
    });

    it('accepts a policy-compliant strict password', () => {
      const result = validatePasswordPolicy('Str0ng!Passw0rd', { strict: true });
      expect(result.valid).toBe(true);
    });
  });
});
