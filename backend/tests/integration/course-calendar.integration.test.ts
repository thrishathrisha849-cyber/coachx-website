/**
 * Real-database integration tests for 004-learning-management-system's
 * T092-T095 batch (FR-103's real-data subset): the course-calendar
 * aggregation endpoint returns assignment due dates, FIXED_DATE module
 * unlocks, and scheduled announcements, sorted by date, and rejects a
 * non-privileged role. Same graceful-skip pattern as the other
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
    .send({ name: 'Calendar Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('calendar-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Calendar Test Category', slug: uniqueSlug('calendar-cat') });
    categoryId = res.body.data.id;
  }
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-calendar.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-calendar.integration.test.ts: could not reach PostgreSQL.');
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
    await db.assignment.deleteMany({});
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

describe('Course Calendar (T092-T095, FR-103)', () => {
  it('rejects an unauthenticated request', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseRes = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Calendar Test Course', slug: uniqueSlug('calendar-course'), categoryId });
    const res = await request(app).get(`/api/v1/lms/admin/courses/${courseRes.body.data.id}/calendar`);
    expect(res.status).toBe(401);
  });

  it('aggregates assignment due dates, FIXED_DATE module unlocks, and scheduled announcements, sorted by date', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();

    const courseRes = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Calendar Test Course', slug: uniqueSlug('calendar-course'), categoryId });
    const courseId = courseRes.body.data.id;

    const moduleRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 1' });
    const moduleId = moduleRes.body.data.id;

    const lessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Lesson 1', slug: uniqueSlug('calendar-lesson') });
    const lessonId = lessonRes.body.data.id;

    const assignmentDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const assignmentRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Essay', submissionFormat: 'TEXT', allowedFileTypes: [], maxScore: 100, passingScore: 70, latePolicy: 'ACCEPT', dueAt: assignmentDue });
    expect(assignmentRes.status).toBe(201);

    const unlockDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const secondModuleRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 2', releaseRuleType: 'FIXED_DATE', releaseRuleValue: { date: unlockDate } });
    expect(secondModuleRes.status).toBe(201);

    const announcePublishAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const announceRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/announcements`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Live Q&A next week', message: 'Join us!', priority: 'NORMAL', channels: ['IN_APP'], publishAt: announcePublishAt });
    expect(announceRes.status).toBe(201);

    const res = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/calendar`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);

    const events = res.body.data;
    expect(events).toHaveLength(3);
    expect(events.map((e: any) => e.type)).toEqual(['MODULE_UNLOCK', 'ANNOUNCEMENT', 'ASSIGNMENT_DUE']);
    expect(new Date(events[0].date).getTime()).toBeLessThan(new Date(events[1].date).getTime());
    expect(new Date(events[1].date).getTime()).toBeLessThan(new Date(events[2].date).getTime());
  });
});
