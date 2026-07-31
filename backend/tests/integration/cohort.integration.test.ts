/**
 * Real-database integration tests for 004-learning-management-system's
 * Cohort entity batch (T085, FR-012/FR-034). Verifies: cohort CRUD,
 * capacity enforcement on the roster, "must already be enrolled" gating
 * on member add, module-schedule CRUD, and — the actual acceptance
 * criterion (US7 acceptance scenario 4) — a COHORT_SCHEDULE module
 * correctly locked before its cohort's `unlockAt` and unlocked after,
 * for cohort MEMBERS specifically, while a non-member learner fails open
 * (never permanently locked out by a cohort they were never assigned
 * to). Same graceful-skip pattern as the other integration suites — see
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
    .send({ name: 'Cohort Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('cohort-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Cohort Test Category', slug: uniqueSlug('cohort-cat') });
    categoryId = res.body.data.id;
  }
}

/** A published course with one PUBLISHED, COHORT_SCHEDULE-released module + one PUBLISHED lesson. */
async function createCohortScheduledCourse() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Cohort Test Course',
      slug: uniqueSlug('cohort-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Module 1', releaseRuleType: 'COHORT_SCHEDULE' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('cohort-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId };
}

async function getModuleLockState(accessToken: string, courseId: string) {
  const res = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${accessToken}`);
  return res.body.data[0];
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING cohort.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING cohort.integration.test.ts: could not reach PostgreSQL.');
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
    await db.cohortModuleSchedule.deleteMany({});
    await db.cohortMember.deleteMany({});
    await db.cohort.deleteMany({});
    await db.enrollment.deleteMany({});
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

describe('Cohort entity (T085, FR-012/FR-034)', () => {
  it('rejects a non-privileged role from creating a cohort', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const outsider = await createUserWithRole(uniqueEmail('cohort-outsider'), 'registered_free_user');
    const { courseId } = await createCohortScheduledCourse();
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/cohorts`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ name: 'Cohort A', startDate: new Date().toISOString(), timezone: 'UTC' });
    expect(res.status).toBe(403);
  });

  it('creates, lists, and updates a cohort', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCohortScheduledCourse();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/cohorts`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Cohort A', startDate: new Date().toISOString(), timezone: 'Asia/Kolkata', capacity: 2 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('OPEN');
    const cohortId = createRes.body.data.id;

    const listRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/cohorts`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.body.data.map((c: any) => c.id)).toContain(cohortId);

    const updateRes = await request(app)
      .patch(`/api/v1/lms/admin/cohorts/${cohortId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('IN_PROGRESS');
  });

  it('requires the learner to already be enrolled before joining a cohort, and enforces capacity', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCohortScheduledCourse();

    const cohortRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/cohorts`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Cohort Cap', startDate: new Date().toISOString(), timezone: 'UTC', capacity: 1 });
    const cohortId = cohortRes.body.data.id;

    const notEnrolled = await createUserWithRole(uniqueEmail('cohort-notenrolled'), 'registered_free_user');
    const rejectRes = await request(app)
      .post(`/api/v1/lms/admin/cohorts/${cohortId}/members`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: notEnrolled.userId });
    expect(rejectRes.status).toBe(400);

    const learnerA = await createUserWithRole(uniqueEmail('cohort-learner-a'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learnerA.accessToken}`).send({ courseId });
    const addA = await request(app)
      .post(`/api/v1/lms/admin/cohorts/${cohortId}/members`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: learnerA.userId });
    expect(addA.status).toBe(201);

    const learnerB = await createUserWithRole(uniqueEmail('cohort-learner-b'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learnerB.accessToken}`).send({ courseId });
    const addB = await request(app)
      .post(`/api/v1/lms/admin/cohorts/${cohortId}/members`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: learnerB.userId });
    expect(addB.status).toBe(409);
  });

  it('a COHORT_SCHEDULE module is locked before the cohort unlockAt and unlocked after — for cohort members only; a non-member fails open', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, moduleId } = await createCohortScheduledCourse();

    const cohortRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/cohorts`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Cohort Schedule Test', startDate: new Date().toISOString(), timezone: 'UTC' });
    const cohortId = cohortRes.body.data.id;

    const member = await createUserWithRole(uniqueEmail('cohort-member'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${member.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/admin/cohorts/${cohortId}/members`).set('Authorization', `Bearer ${admin.accessToken}`).send({ userId: member.userId });

    const nonMember = await createUserWithRole(uniqueEmail('cohort-nonmember'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${nonMember.accessToken}`).send({ courseId });

    // No schedule set yet — fails open for everyone (misconfigured/unset never permanently locks content).
    expect((await getModuleLockState(member.accessToken, courseId)).locked).toBe(false);

    const futureUnlock = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const scheduleRes = await request(app)
      .put(`/api/v1/lms/admin/cohorts/${cohortId}/schedule/${moduleId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ unlockAt: futureUnlock });
    expect(scheduleRes.status).toBe(200);

    const memberLocked = await getModuleLockState(member.accessToken, courseId);
    expect(memberLocked.locked).toBe(true);
    expect(new Date(memberLocked.unlockAt).toISOString()).toBe(futureUnlock);

    // Non-member has no cohort membership at all — fails open regardless of the schedule.
    expect((await getModuleLockState(nonMember.accessToken, courseId)).locked).toBe(false);

    const pastUnlock = new Date(Date.now() - 1000).toISOString();
    await request(app)
      .put(`/api/v1/lms/admin/cohorts/${cohortId}/schedule/${moduleId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ unlockAt: pastUnlock });

    expect((await getModuleLockState(member.accessToken, courseId)).locked).toBe(false);
  });
});
