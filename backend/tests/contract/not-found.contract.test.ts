import request from 'supertest';
import { createApp } from '../../src/app';

describe('404 handling', () => {
  const app = createApp();

  it('returns a 404 with the standard error envelope for an unmatched route', async () => {
    const response = await request(app).get('/api/v1/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.stringContaining('/api/v1/this-route-does-not-exist'),
      },
    });
  });

  it('returns 404 for an unmatched route under any HTTP method', async () => {
    const response = await request(app).post('/api/v1/another-missing-route');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
