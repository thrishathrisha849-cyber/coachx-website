/**
 * Real-database integration tests for 004-learning-management-system's PiP
 * + Video Playback Telemetry batch (FR-039/FR-040): the
 * `/me/activities/:id/playback/{started,progress}` write endpoints and the
 * `/me/activities/:id/playback` read endpoint backing FR-039's "resume
 * playback," plus FR-040's watched-duration/furthest-position/rewatch/
 * device tracking on `ActivityProgress`, and the real `deviceDistribution`
 * now exposed by `GET /admin/courses/:id/analytics`. Same graceful-skip
 * pattern as the other integration suites — see docs/database/TESTING.md.
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
    .send({ name: 'Playback Telemetry Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('playback-admin'), 'platform_admin');
  if (!learner) learner = await createUserWithRole(uniqueEmail('playback-learner'), 'registered_free_user');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Playback Test Category', slug: uniqueSlug('playback-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course + module + lesson, ready to receive a VIDEO activity. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Playback Test Course', slug: uniqueSlug('playback-course'), shortDescription: 'short', description: 'full description', categoryId, thumbnailUrl: 'https://example.com/thumb.jpg' });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('playback-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, lessonId };
}

async function createPublishedVideoActivity(lessonId: string, durationSeconds = 100) {
  const createRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'VIDEO', title: 'Playback Test Video', mediaUrl: 'https://example.com/video.mp4', durationSeconds });
  const activityId = createRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
  return activityId;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING video-playback-telemetry.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING video-playback-telemetry.integration.test.ts: could not reach PostgreSQL.');
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

describe('PiP + Video Playback Telemetry (FR-039/FR-040)', () => {
  it('records a playback-started event (isRewatch: false on the first ever start)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/started`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestDesktopUA');
    expect(res.status).toBe(200);
    expect(res.body.data.isRewatch).toBe(false);
    expect(res.body.data.playbackStartCount).toBe(1);
  });

  it('accumulates watchedSeconds, advances furthestPositionSeconds monotonically, and lets lastPositionSeconds move backward on rewind', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId, 200);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/activities/${activityId}/playback/started`).set('Authorization', `Bearer ${learner.accessToken}`);

    const tick1 = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ positionSeconds: 30, watchedDeltaSeconds: 30, playbackSpeed: 1.5 });
    expect(tick1.status).toBe(200);
    expect(tick1.body.data.watchedSeconds).toBe(30);
    expect(tick1.body.data.furthestPositionSeconds).toBe(30);
    expect(tick1.body.data.lastPositionSeconds).toBe(30);
    expect(tick1.body.data.lastPlaybackSpeed).toBe(1.5);

    // Learner rewinds to position 10 — lastPositionSeconds moves backward,
    // but furthestPositionSeconds (the anti-rollback field) must not.
    const tick2 = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ positionSeconds: 10, watchedDeltaSeconds: 5 });
    expect(tick2.body.data.watchedSeconds).toBe(35);
    expect(tick2.body.data.furthestPositionSeconds).toBe(30);
    expect(tick2.body.data.lastPositionSeconds).toBe(10);

    const getRes = await request(app).get(`/api/v1/lms/me/activities/${activityId}/playback`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(getRes.body.data.furthestPositionSeconds).toBe(30);
    expect(getRes.body.data.lastPositionSeconds).toBe(10);
  });

  it('marks completedPlaybackAt once furthestPositionSeconds crosses the default watch threshold, and counts a later start as a rewatch', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId, 100); // default threshold 80% => 80s

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/me/activities/${activityId}/playback/started`).set('Authorization', `Bearer ${learner.accessToken}`);

    const belowThreshold = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ positionSeconds: 50 });
    expect(belowThreshold.body.data.completedPlaybackAt).toBeNull();

    const aboveThreshold = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ positionSeconds: 85 });
    expect(aboveThreshold.body.data.completedPlaybackAt).not.toBeNull();

    const rewatchStart = await request(app).post(`/api/v1/lms/me/activities/${activityId}/playback/started`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(rewatchStart.body.data.isRewatch).toBe(true);
    expect(rewatchStart.body.data.rewatchCount).toBe(1);
    expect(rewatchStart.body.data.playbackStartCount).toBe(2);
  });

  it('returns null from GET playback for an activity that was never played', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).get(`/api/v1/lms/me/activities/${activityId}/playback`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('rejects playback telemetry for a non-VIDEO activity', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'ARTICLE', bodyText: 'Body text' });
    const activityId = createRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).post(`/api/v1/lms/me/activities/${activityId}/playback/started`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(400);
  });

  it('rejects a watchedDeltaSeconds value above the bounded per-tick cap', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ positionSeconds: 10, watchedDeltaSeconds: 999 });
    expect(res.status).toBe(400);
  });

  it('denies a non-enrolled, non-preview learner from posting playback telemetry', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId);
    const outsider = await createUserWithRole(uniqueEmail('playback-outsider'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/activities/${activityId}/playback/started`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('exposes a real deviceDistribution in the admin course analytics, bucketed from captured User-Agent data', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const activityId = await createPublishedVideoActivity(lessonId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app)
      .post(`/api/v1/lms/me/activities/${activityId}/playback/started`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MobileTestUA');

    const analyticsRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/analytics`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.deviceDistribution).toEqual({ mobile: 1 });
    expect(analyticsRes.body.data.notApplicable).not.toContain('deviceDistribution');
  });
});
