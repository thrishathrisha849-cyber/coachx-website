import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import {
  signAccessToken,
  verifyAccessToken,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
} from '../../src/auth/token.util';

describe('token.util — access tokens', () => {
  it('signs and verifies a valid access token, round-tripping its claims', () => {
    const token = signAccessToken({ sub: 'user-1', sid: 'session-1', roles: ['paid_member'] });
    const claims = verifyAccessToken(token);

    expect(claims.sub).toBe('user-1');
    expect(claims.sid).toBe('session-1');
    expect(claims.roles).toEqual(['paid_member']);
    expect(claims.type).toBe('access');
  });

  it('rejects a tampered token (invalid signature)', () => {
    const token = signAccessToken({ sub: 'user-1', sid: 'session-1', roles: [] });
    const tampered = token.slice(0, -3) + 'xyz';

    expect(() => verifyAccessToken(tampered)).toThrow('Invalid or expired access token');
  });

  it('rejects a completely malformed token string', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow('Invalid or expired access token');
  });

  it('rejects a token signed with a different secret (forged token)', () => {
    const forged = jwt.sign(
      { sub: 'attacker', sid: 'x', roles: ['super_admin'], type: 'access' },
      'wrong-secret',
      { expiresIn: '15m' },
    );

    expect(() => verifyAccessToken(forged)).toThrow('Invalid or expired access token');
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(
      { sub: 'user-1', sid: 'session-1', roles: [], type: 'access' },
      config.jwt.accessSecret,
      { expiresIn: -10, issuer: config.jwt.issuer, audience: config.jwt.audience },
    );

    expect(() => verifyAccessToken(expired)).toThrow('Invalid or expired access token');
  });

  it('rejects a token with the wrong issuer/audience', () => {
    const wrongAudience = jwt.sign(
      { sub: 'user-1', sid: 'session-1', roles: [], type: 'access' },
      config.jwt.accessSecret,
      { expiresIn: '15m', issuer: 'someone-else', audience: 'someone-elses-api' },
    );

    expect(() => verifyAccessToken(wrongAudience)).toThrow('Invalid or expired access token');
  });

  it('rejects an mfa-challenge token presented as an access token (token type validation)', () => {
    const mfaToken = signMfaChallengeToken('user-1');
    expect(() => verifyAccessToken(mfaToken)).toThrow('Invalid or expired access token');
  });
});

describe('token.util — MFA challenge tokens', () => {
  it('signs and verifies a valid MFA challenge token', () => {
    const token = signMfaChallengeToken('user-1');
    const claims = verifyMfaChallengeToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.type).toBe('mfa_challenge');
  });

  it('rejects an access token presented as an MFA challenge token', () => {
    const accessToken = signAccessToken({ sub: 'user-1', sid: 'session-1', roles: [] });
    expect(() => verifyMfaChallengeToken(accessToken)).toThrow('Invalid or expired MFA challenge');
  });
});
