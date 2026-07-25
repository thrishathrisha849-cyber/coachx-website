import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('returns 200 with the standard success envelope and liveness fields', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      status: 'ok',
      service: 'coachx-backend',
      environment: 'test',
    });
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
    expect(typeof response.body.data.timestamp).toBe('string');
  });

  it('never includes database or secret configuration in the liveness response', () => {
    // Liveness intentionally answers "is the process alive", not
    // "are dependencies reachable" — that's the readiness endpoint's job.
    return request(app)
      .get('/api/v1/health')
      .then((response) => {
        const body = JSON.stringify(response.body);
        expect(body).not.toMatch(/DATABASE_URL|postgresql:\/\//i);
        expect(body).not.toMatch(/secret/i);
      });
  });
});
