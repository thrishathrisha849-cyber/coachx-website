import request from 'supertest';

/**
 * Exercises the "configured but unreachable" branch of `/api/v1/ready`
 * (the 503 path) — deliberately isolated into its own file/module
 * registry so it can override `DATABASE_URL` to a guaranteed-unreachable
 * host before `env.config.ts`'s module-level parse runs, without
 * affecting the "not configured" test cases in `readiness.contract.test.ts`.
 */
describe('GET /api/v1/ready — database configured but unreachable', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://coachx:coachx@127.0.0.1:1/coachx_unreachable';
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns 503 with a "fail" check and no leaked connection details', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createApp } = require('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/ready');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_READY');
    expect(response.body.error.details.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'database', status: 'fail' })]),
    );

    const body = JSON.stringify(response.body);
    expect(body).not.toMatch(/coachx:coachx@/);
  }, 15_000);
});
