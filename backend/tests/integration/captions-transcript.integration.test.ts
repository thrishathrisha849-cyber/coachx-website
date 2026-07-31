/**
 * Real-database integration tests for 004-learning-management-system's
 * Captions + Transcript Support batch (FR-044/FR-046): the
 * `captionsUrlEn`/`captionsUrlTa`/`transcriptSegments` fields on
 * `LearningActivity`, their admin authoring + validation, their exposure
 * through the learner-facing lesson read, and the server-generated
 * downloadable-transcript endpoint. Same graceful-skip pattern as the other
 * integration suites — see docs/database/TESTING.md.
 */

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
jest.resetModules();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('../../src/app');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { connectDatabase, disconnectDatabase, getPrismaClient } = require('../../src/database/prisma-client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isTestDatabaseAvailable } = require('../../src/database/test-utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ROLE_NAMES, BASELINE_PERMISSIONS, ROLE_PERMISSION_GRANTS } = require('../../src/auth/rbac.constants');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __setEmailAdapterForTests, InMemoryEmailAdapter } = require('../../src/auth/email.port');

import request from 'supertest';

let dbAvailable = false;
let app: ReturnType<typeof createApp>;
let emailAdapter: InstanceType<typeof InMemoryEmailAdapter>;

async function seedRolesAndPermissions() {
  const db = getPrismaClient();
  for (const name of ROLE_NAMES) {
    await db.role.upsert({ where: { name }, create: { name }, update: {} });
  }
  for (const p of BASELINE_PERMISSIONS) {
    await db.permission.upsert({ where: { key: p.key }, create: { key: p.key }, update: {} });
  }
  const roles = await db.role.findMany();
  const permissions = await db.permission.findMany();
  const roleIdByName = new Map(roles.map((r: any) => [r.name, r.id]));
  const permissionIdByKey = new Map(permissions.map((p: any) => [p.key, p.id]));

  for (const [roleName, grantedKeys] of Object.entries(ROLE_PERMISSION_GRANTS) as [string, string[]][]) {
    const roleId = roleIdByName.get(roleName);
    if (!roleId) continue;
    for (const key of grantedKeys) {
      const permissionId = permissionIdByKey.get(key);
      if (!permissionId) continue;
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    }
  }
}

let ipCounter = 0;
function nextTestIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 16) & 0xff}.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUserWithRole(email: string, roleName: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', nextTestIp())
    .send({ name: 'Captions Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

  const sentMessage = emailAdapter.sent.find((m: any) => m.to === email && m.subject.includes('Verify'));
  const rawToken = sentMessage?.text.match(/token: (\S+)/)?.[1];
  await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });

  const db = getPrismaClient();
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  const role = await db.role.findUnique({ where: { name: roleName } });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  const loginRes = await request(app).post('/api/v1/auth/login').set('X-Forwarded-For', nextTestIp()).send({ email, password: 'GoodPassword1' });
  return { userId: user.id, accessToken: loginRes.body.data.accessToken };
}

let admin: { userId: string; accessToken: string };
let learner: { userId: string; accessToken: string };
let categoryId: string;

async function ensureFixtures() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('captions-admin'), 'platform_admin');
  if (!learner) learner = await createUserWithRole(uniqueEmail('captions-learner'), 'registered_free_user');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Captions Test Category', slug: uniqueSlug('captions-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course with one published module + lesson, ready to receive activities. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Captions Test Course', slug: uniqueSlug('captions-course'), shortDescription: 'short', description: 'full description', categoryId, thumbnailUrl: 'https://example.com/thumb.jpg' });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('captions-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, lessonId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING captions-transcript.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING captions-transcript.integration.test.ts: could not reach PostgreSQL.');
    return;
  }
  await seedRolesAndPermissions();
  app = createApp();
}, 20_000);

beforeEach(() => {
  emailAdapter = new InMemoryEmailAdapter();
  __setEmailAdapterForTests(emailAdapter);
});

afterAll(async () => {
  if (dbAvailable) {
    const db = getPrismaClient();
    await db.activityProgress.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.learningActivity.deleteMany({});
    await db.lesson.deleteMany({});
    await db.courseModule.deleteMany({});
    await db.course.deleteMany({});
    await db.courseCategory.deleteMany({});
    await db.user.deleteMany({});
    await disconnectDatabase();
  }
});

function skip(): boolean {
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('  ↳ skipped (no test database available)');
    return true;
  }
  return false;
}

describe('Captions + Transcript Support (FR-044/FR-046)', () => {
  it('creates a VIDEO activity with captions URLs + transcript segments, and returns them via the admin read', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        type: 'VIDEO',
        title: 'Intro video',
        mediaUrl: 'https://example.com/video.mp4',
        captionsUrlEn: 'https://example.com/captions-en.vtt',
        captionsUrlTa: 'https://example.com/captions-ta.vtt',
        transcriptSegments: [
          { startSeconds: 0, text: 'Welcome to this lesson.' },
          { startSeconds: 15, text: 'Today we will cover captions and transcripts.' },
        ],
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.captionsUrlEn).toBe('https://example.com/captions-en.vtt');
    expect(createRes.body.data.captionsUrlTa).toBe('https://example.com/captions-ta.vtt');
    expect(createRes.body.data.transcriptSegments).toEqual([
      { startSeconds: 0, text: 'Welcome to this lesson.' },
      { startSeconds: 15, text: 'Today we will cover captions and transcripts.' },
    ]);

    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const listRes = await request(app).get(`/api/v1/lms/admin/lessons/${lessonId}/activities`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    const persisted = listRes.body.data.find((a: any) => a.id === activityId);
    expect(persisted.captionsUrlEn).toBe('https://example.com/captions-en.vtt');
    expect(persisted.transcriptSegments).toHaveLength(2);
  });

  it('rejects captionsUrlEn/transcriptSegments on a non-VIDEO/AUDIO activity type', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'ARTICLE', bodyText: 'Body', captionsUrlEn: 'https://example.com/captions-en.vtt' });
    expect(res.status).toBe(400);
  });

  it('rejects the service-layer invariant too when a PATCH changes type away from VIDEO/AUDIO while transcript segments remain', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        type: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        transcriptSegments: [{ startSeconds: 0, text: 'Hello.' }],
      });
    const activityId = createRes.body.data.id;

    // Zod's update schema doesn't re-check cross-field type invariants on a
    // partial PATCH (documented, pre-existing tradeoff) — the service-layer
    // merge-then-validate re-check is what actually catches this.
    const patchRes = await request(app)
      .patch(`/api/v1/lms/admin/activities/${activityId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'EXTERNAL_LINK', externalUrl: 'https://example.com/link' });
    expect(patchRes.status).toBe(400);
  });

  it('rejects a transcriptSegments array item missing required fields', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'VIDEO', mediaUrl: 'https://example.com/video.mp4', transcriptSegments: [{ startSeconds: 0 }] });
    expect(res.status).toBe(400);
  });

  it('exposes captionsUrlEn/captionsUrlTa/transcriptSegments to an enrolled learner reading the lesson', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        type: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        captionsUrlEn: 'https://example.com/captions-en.vtt',
        transcriptSegments: [{ startSeconds: 0, text: 'Hello learners.' }],
      });
    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const lessonRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lessonRes.status).toBe(200);
    const activity = lessonRes.body.data.activities.find((a: any) => a.id === activityId);
    expect(activity.captionsUrlEn).toBe('https://example.com/captions-en.vtt');
    expect(activity.transcriptSegments).toEqual([{ startSeconds: 0, text: 'Hello learners.' }]);
  });

  it('lets an enrolled learner download the generated plain-text transcript', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        type: 'VIDEO',
        title: 'Downloadable Lesson Video',
        mediaUrl: 'https://example.com/video.mp4',
        transcriptSegments: [
          { startSeconds: 0, text: 'Welcome.' },
          { startSeconds: 65, text: 'Second segment past a minute.' },
        ],
      });
    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const downloadRes = await request(app).get(`/api/v1/lms/me/activities/${activityId}/transcript`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toContain('text/plain');
    expect(downloadRes.headers['content-disposition']).toContain('attachment');
    expect(downloadRes.text).toBe('[00:00] Welcome.\n[01:05] Second segment past a minute.');
  });

  it('returns 404 when downloading the transcript of an activity that has no transcript segments', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'VIDEO', mediaUrl: 'https://example.com/video.mp4' });
    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const downloadRes = await request(app).get(`/api/v1/lms/me/activities/${activityId}/transcript`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(downloadRes.status).toBe(404);
  });

  it('denies a non-enrolled, non-preview learner from downloading the transcript', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();
    const outsider = await createUserWithRole(uniqueEmail('captions-outsider'), 'registered_free_user');

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'VIDEO', mediaUrl: 'https://example.com/video.mp4', transcriptSegments: [{ startSeconds: 0, text: 'Hello.' }] });
    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const downloadRes = await request(app).get(`/api/v1/lms/me/activities/${activityId}/transcript`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(downloadRes.status).toBe(403);
  });
});
