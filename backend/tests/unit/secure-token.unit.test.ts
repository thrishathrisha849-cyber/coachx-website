import { generateSecureToken, hashToken, constantTimeEquals } from '../../src/auth/secure-token.util';

describe('secure-token.util', () => {
  it('generates a unique, sufficiently long random token on each call', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it('hashToken is deterministic for the same input', () => {
    const token = generateSecureToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('hashToken produces different hashes for different tokens', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('hashToken never returns the raw token itself', () => {
    const token = generateSecureToken();
    expect(hashToken(token)).not.toBe(token);
  });

  it('constantTimeEquals correctly compares equal and unequal strings', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
  });
});
