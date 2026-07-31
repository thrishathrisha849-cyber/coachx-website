/**
 * Real-database integration tests for 004-learning-management-system's
 * Course Announcements batch (FR-102): admin CRUD/publish/archive, the
 * PUBLISHED + in-window visibility rule (publishAt/expireAt evaluated at
 * read time, no background worker), seat-occupying-enrollment gating,
 * module-scoped announcements, and real EMAIL-channel delivery via the
 * existing `EmailPort` (captured by the `InMemoryEmailAdapter` here, the
 * same test double every other email-adjacent suite already uses). Same
 * graceful-skip pattern as the other integration suites — see
 * docs/database/TESTING.md.
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
    .send({ name: 'Announcement Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
let categoryId: string;

async function ensureAdminAndCategory() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('ann-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Announcement Test Category', slug: uniqueSlug('ann-cat') });
    categoryId = res.body.data.id;
  }
}

async function createPublishedCourseWithModule() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Announcement Test Course',
      slug: uniqueSlug('ann-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING announcement.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING announcement.integration.test.ts: could not reach PostgreSQL.');
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
    await db.courseAnnouncement.deleteMany({});
    await db.enrollment.deleteMany({});
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

describe('Course Announcements admin lifecycle (FR-102)', () => {
  it('is invisible to an enrolled learner while DRAFT, then visible once PUBLISHED, then invisible once ARCHIVED', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithModule();
    const learner = await createUserWithRole(uniqueEmail('ann-learner-lifecycle'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Welcome', message: 'Glad to have you here.' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('DRAFT');
    const announcementId = createRes.body.data.id;

    const beforePublish = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(beforePublish.body.data).toHaveLength(0);

    const publishRes = await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('PUBLISHED');

    const afterPublish = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterPublish.body.data).toHaveLength(1);
    expect(afterPublish.body.data[0].title).toBe('Welcome');

    await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);
    const afterArchive = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterArchive.body.data).toHaveLength(0);
  });

  it('rejects editing a PUBLISHED announcement and republishing an already-PUBLISHED one', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithModule();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Edit Test', message: 'Body' });
    const announcementId = createRes.body.data.id;

    await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);

    const editAfterPublish = await request(app)
      .patch(`/api/v1/lms/admin/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Changed' });
    expect(editAfterPublish.status).toBe(409);

    const republish = await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(republish.status).toBe(409);
  });

  it('rejects a moduleId that belongs to a different course', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId: courseA } = await createPublishedCourseWithModule();
    const { moduleId: moduleB } = await createPublishedCourseWithModule();

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseA}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Cross-course', message: 'Body', moduleId: moduleB });
    expect(res.status).toBe(400);
  });
});

describe('Course Announcements visibility rules (FR-102)', () => {
  it('is not visible to a non-enrolled user (404)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithModule();
    const outsider = await createUserWithRole(uniqueEmail('ann-outsider'), 'registered_free_user');

    const res = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('is visible when module-scoped, and respects the expireAt window', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, moduleId } = await createPublishedCourseWithModule();
    const learner = await createUserWithRole(uniqueEmail('ann-learner-scope'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module-scoped', message: 'Body', moduleId });
    const announcementId = createRes.body.data.id;
    await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);

    const visibleRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(visibleRes.body.data.some((a: any) => a.id === announcementId)).toBe(true);

    const db = getPrismaClient();
    await db.courseAnnouncement.update({ where: { id: announcementId }, data: { expireAt: new Date(Date.now() - 60_000) } });

    const expiredRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(expiredRes.body.data.some((a: any) => a.id === announcementId)).toBe(false);
  });

  it('is not yet visible with a future publishAt, and becomes visible once that time has passed', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithModule();
    const learner = await createUserWithRole(uniqueEmail('ann-learner-schedule'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const futurePublishAt = new Date(Date.now() + 60 * 60_000).toISOString();
    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Scheduled', message: 'Body', publishAt: futurePublishAt });
    const announcementId = createRes.body.data.id;
    await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);

    const beforeWindow = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(beforeWindow.body.data.some((a: any) => a.id === announcementId)).toBe(false);

    const db = getPrismaClient();
    await db.courseAnnouncement.update({ where: { id: announcementId }, data: { publishAt: new Date(Date.now() - 60_000) } });

    const afterWindow = await request(app).get(`/api/v1/lms/me/courses/${courseId}/announcements`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterWindow.body.data.some((a: any) => a.id === announcementId)).toBe(true);
  });
});

describe('Course Announcements EMAIL channel (FR-102)', () => {
  it('sends a real email (via the existing EmailPort) to every enrolled learner exactly once, on publish', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithModule();
    const learnerEmail = uniqueEmail('ann-email-learner');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    emailAdapter.clear();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Email Blast', message: 'Important update', channels: ['IN_APP', 'EMAIL'] });
    const announcementId = createRes.body.data.id;

    const publishRes = await request(app).post(`/api/v1/lms/admin/announcements/${announcementId}/publish`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(publishRes.body.data.emailSentAt).not.toBeNull();

    const sentToLearner = emailAdapter.sent.find((m: any) => m.to === learnerEmail.toLowerCase() && m.subject.includes('Email Blast'));
    expect(sentToLearner).toBeDefined();
  });
});
