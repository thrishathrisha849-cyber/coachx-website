import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/v1/ready', () => {
  const app = createApp();

  it('returns 200 and reports the database check as "skip" when DATABASE_URL is unset', async () => {
    // backend/.env.test deliberately omits DATABASE_URL — see that
    // file's comments — so this exercises the "not configured" path.
    const response = await request(app).get('/api/v1/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ready');
    expect(response.body.data.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'database', status: 'skip' })]),
    );
  });

  it('never leaks a connection string or credential in the response body', async () => {
    const response = await request(app).get('/api/v1/ready');
    const body = JSON.stringify(response.body);

    expect(body).not.toMatch(/postgresql:\/\/[^"]*:[^"]*@/);
  });
});
