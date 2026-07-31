/**
 * Real-database integration tests for the "Continue Learning" performance
 * fix (Cross-cutting Polish batch follow-up, T124): `evaluateModuleAccess`
 * now accepts an optional pre-fetched `{ course, enrollment }`, and
 * `continue-learning.service.ts`'s `getContinueLearning` fetches both ONCE
 * and passes them through its Pass-2 per-module loop instead of letting
 * `evaluateModuleAccess` re-derive the same course/enrollment lookup on
 * every iteration. The existing `lms-part2.integration.test.ts` scenario
 * only exercises a single-module/single-lesson course (the loop runs
 * once); this file specifically exercises a 3-module, prerequisite-gated
 * course so the per-module loop — and therefore the prefetch path — is
 * genuinely walked multiple times per call, at multiple different
 * progress stages, proving the query-batching change didn't change any
 * access decision. Same graceful-skip pattern as the other integration
 * suites — see docs/database/TESTING.md.
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
    .send({ name: 'Continue Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('continue-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Continue Test Category', slug: uniqueSlug('continue-cat') });
    categoryId = res.body.data.id;
  }
}

/** A 3-module, prerequisite-chained course (module N requires module N-1's mandatory lesson complete), one mandatory lesson each. */
async function createThreeModuleCourse() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Continue Learning Course',
      slug: uniqueSlug('continue-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
  const courseId = courseRes.body.data.id;

  const moduleIds: string[] = [];
  const lessonIds: string[] = [];
  let previousModuleId: string | undefined;

  for (let i = 1; i <= 3; i++) {
    const moduleRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: `Module ${i}`,
        releaseRuleType: previousModuleId ? 'AFTER_PREVIOUS_MODULE' : 'IMMEDIATE',
        prerequisiteModuleId: previousModuleId,
      });
    const moduleId = moduleRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    moduleIds.push(moduleId);

    const lessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: `Module ${i} Lesson`, slug: uniqueSlug(`continue-lesson-${i}`) });
    const lessonId = lessonRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    lessonIds.push(lessonId);

    previousModuleId = moduleId;
  }

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleIds, lessonIds };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING continue-learning.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING continue-learning.integration.test.ts: could not reach PostgreSQL.');
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
    await db.lessonProgress.deleteMany({});
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

describe('Continue Learning across a multi-module, prerequisite-gated course (T124 follow-up)', () => {
  it('walks module 1 -> 2 -> 3 -> COURSE_COMPLETE as each prerequisite is satisfied, never skipping ahead to a still-locked module', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonIds } = await createThreeModuleCourse();
    const learner = await createUserWithRole(uniqueEmail('continue-learner'), 'registered_free_user');

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    // Module 2 and 3 are locked (prerequisite not met) — must land on module 1's lesson.
    let continueRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/continue-learning`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(continueRes.body.data.reason).toBe('START_NEXT');
    expect(continueRes.body.data.nextLesson.id).toBe(lessonIds[0]);

    // Complete module 1's lesson — module 2 unlocks, module 3 still locked.
    await request(app).post(`/api/v1/lms/me/lessons/${lessonIds[0]}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    continueRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/continue-learning`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(continueRes.body.data.reason).toBe('START_NEXT');
    expect(continueRes.body.data.nextLesson.id).toBe(lessonIds[1]);

    // Complete module 2's lesson — module 3 unlocks.
    await request(app).post(`/api/v1/lms/me/lessons/${lessonIds[1]}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    continueRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/continue-learning`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(continueRes.body.data.reason).toBe('START_NEXT');
    expect(continueRes.body.data.nextLesson.id).toBe(lessonIds[2]);

    // Complete module 3's lesson — the whole course is now complete.
    await request(app).post(`/api/v1/lms/me/lessons/${lessonIds[2]}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    continueRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/continue-learning`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(continueRes.body.data.reason).toBe('COURSE_COMPLETE');
    expect(continueRes.body.data.courseComplete).toBe(true);
    expect(continueRes.body.data.nextLesson).toBeNull();
  });
});
