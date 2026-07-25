import request from 'supertest';
import { createApp } from '../../src/app';

/**
 * The global error handler is exercised end-to-end via the 404 flow
 * (notFoundMiddleware -> next(AppError) -> errorHandlerMiddleware) so
 * these assertions cover its response *shape* and security properties
 * without needing a synthetic "throw an error" business route.
 */
describe('Global error handler', () => {
  const app = createApp();

  it('never includes a stack trace in the JSON response body', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(JSON.stringify(response.body)).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/);
    expect(response.body).not.toHaveProperty('stack');
  });

  it('always returns the standard { success: false, error: { code, message } } shape', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.body.success).toBe(false);
    expect(typeof response.body.error.code).toBe('string');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('sets an X-Request-Id header on error responses too', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(response.headers['x-request-id'].length).toBeGreaterThan(0);
  });
});
