import { redact } from '../../src/utils/redact';

describe('redact()', () => {
  it('redacts a top-level password field', () => {
    const result = redact({ username: 'alice', password: 'hunter2' });
    expect(result).toEqual({ username: 'alice', password: '[REDACTED]' });
  });

  it('redacts common sensitive key variants: token, secret, apiKey, cookie, authorization', () => {
    const input = {
      accessToken: 'abc',
      refreshToken: 'def',
      secret: 'ghi',
      apiKey: 'jkl',
      cookie: 'session=xyz',
      authorization: 'Bearer abc.def.ghi',
      Authorization: 'Bearer abc.def.ghi',
    };

    const result = redact(input) as Record<string, unknown>;

    for (const key of Object.keys(input)) {
      expect(result[key]).toBe('[REDACTED]');
    }
  });

  it('redacts sensitive fields nested inside objects and arrays', () => {
    const result = redact({
      user: { name: 'bob', password: 'p@ss' },
      sessions: [{ token: 'abc' }, { token: 'def' }],
    }) as any;

    expect(result.user.password).toBe('[REDACTED]');
    expect(result.sessions[0].token).toBe('[REDACTED]');
    expect(result.sessions[1].token).toBe('[REDACTED]');
    expect(result.user.name).toBe('bob');
  });

  it('leaves non-sensitive fields untouched', () => {
    const result = redact({ id: 1, email: 'a@example.com', role: 'member' });
    expect(result).toEqual({ id: 1, email: 'a@example.com', role: 'member' });
  });

  it('passes through primitives, null, and undefined unchanged', () => {
    expect(redact('hello')).toBe('hello');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(redact(undefined)).toBe(undefined);
  });

  it('does not mutate the original object', () => {
    const original = { password: 'secret' };
    redact(original);
    expect(original.password).toBe('secret');
  });
});
