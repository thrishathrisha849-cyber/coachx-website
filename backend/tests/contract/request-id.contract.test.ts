import request from 'supertest';
import { createApp } from '../../src/app';

describe('Request ID / correlation ID', () => {
  const app = createApp();

  it('generates a request ID when the caller does not supply one', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(response.headers['x-request-id'].length).toBeGreaterThan(0);
  });

  it('echoes back a caller-supplied X-Request-Id unchanged', async () => {
    const callerRequestId = 'test-correlation-id-12345';
    const response = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', callerRequestId);

    expect(response.headers['x-request-id']).toBe(callerRequestId);
  });

  it('generates a different request ID for two separate requests with no header supplied', async () => {
    const first = await request(app).get('/api/v1/health');
    const second = await request(app).get('/api/v1/health');

    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
  });
});
