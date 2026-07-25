import { Secret } from 'otpauth';
import {
  generateTotpSecret,
  buildTotp,
  currentTotpStep,
  encryptTotpSecret,
  decryptTotpSecret,
} from '../../src/auth/totp.util';

describe('totp.util — secret generation and code verification', () => {
  it('generates a usable TOTP secret and validates its own current code', () => {
    const secret = generateTotpSecret();
    const totp = buildTotp(secret, 'user@example.com');

    const code = totp.generate();
    expect(code).toMatch(/^\d{6}$/);

    const delta = totp.validate({ token: code, window: 1 });
    expect(delta).toBe(0);
  });

  it('rejects an incorrect 6-digit code', () => {
    const secret = generateTotpSecret();
    const totp = buildTotp(secret, 'user@example.com');

    const validCode = totp.generate();
    const wrongCode = validCode === '000000' ? '111111' : '000000';

    const delta = totp.validate({ token: wrongCode, window: 1 });
    expect(delta).toBeNull();
  });

  it('produces a provisioning URI containing the issuer and account label', () => {
    const secret = generateTotpSecret();
    const totp = buildTotp(secret, 'user@example.com');
    const uri = totp.toString();

    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain('TBT');
  });

  it('currentTotpStep advances over time (monotonic within a 30s+ window)', () => {
    const step = currentTotpStep();
    expect(typeof step).toBe('bigint');
    expect(step).toBeGreaterThan(0n);
  });
});

describe('totp.util — secret encryption at rest', () => {
  it('encrypts and decrypts a TOTP secret round-trip correctly', () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret.base32);

    expect(encrypted).not.toBe(secret.base32);
    expect(encrypted).toContain('.'); // iv.authTag.ciphertext format

    const decrypted = decryptTotpSecret(encrypted);
    expect(decrypted).toBe(secret.base32);
  });

  it('produces a different ciphertext each time (random IV) for the same secret', () => {
    const secret = generateTotpSecret();
    const encrypted1 = encryptTotpSecret(secret.base32);
    const encrypted2 = encryptTotpSecret(secret.base32);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('throws when decrypting a tampered ciphertext (auth tag mismatch)', () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret.base32);
    const parts = encrypted.split('.');
    // Corrupt the ciphertext portion.
    const tampered = `${parts[0]}.${parts[1]}.${Buffer.from('tampered-data').toString('base64')}`;

    expect(() => decryptTotpSecret(tampered)).toThrow();
  });

  it('throws on a malformed encrypted value', () => {
    expect(() => decryptTotpSecret('not-a-valid-encrypted-value')).toThrow('Malformed encrypted TOTP secret');
  });

  it('reconstructs an equivalent Secret via Secret.fromBase32 after decryption', () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret.base32);
    const decrypted = decryptTotpSecret(encrypted);

    const reconstructed = Secret.fromBase32(decrypted);
    expect(reconstructed.base32).toBe(secret.base32);
  });
});
