import { parseEnv } from '../../src/config/env.config';

describe('parseEnv()', () => {
  it('accepts a minimal valid environment and fills in documented defaults', () => {
    const result = parseEnv({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(4000);
      expect(result.data.LOG_LEVEL).toBe('info');
    }
  });

  it('rejects an invalid NODE_ENV value', () => {
    const result = parseEnv({ NODE_ENV: 'production-ish' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric PORT', () => {
    const result = parseEnv({ PORT: 'not-a-number' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative or zero PORT', () => {
    expect(parseEnv({ PORT: '0' }).success).toBe(false);
    expect(parseEnv({ PORT: '-1' }).success).toBe(false);
  });

  it('accepts a valid, fully-specified environment', () => {
    const result = parseEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      HOST: '0.0.0.0',
      API_PREFIX: '/api',
      CORS_ORIGINS: 'https://app.coachx.com,https://admin.coachx.com',
      LOG_LEVEL: 'warn',
      DATABASE_URL: 'postgresql://user:pass@host:5432/db',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX_REQUESTS: '100',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGINS).toEqual([
        'https://app.coachx.com',
        'https://admin.coachx.com',
      ]);
      expect(result.data.PORT).toBe(8080);
    }
  });

  it('splits and trims a comma-separated CORS_ORIGINS value', () => {
    const result = parseEnv({ CORS_ORIGINS: ' https://a.com , https://b.com ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
    }
  });

  it('rejects an invalid LOG_LEVEL', () => {
    const result = parseEnv({ LOG_LEVEL: 'verbose-ish' });
    expect(result.success).toBe(false);
  });

  it('leaves DATABASE_URL optional', () => {
    const result = parseEnv({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATABASE_URL).toBeUndefined();
    }
  });
});
