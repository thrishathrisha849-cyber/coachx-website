/**
 * Real-database integration tests for 004-learning-management-system's
 * US6 polish batch (T087): a dedicated, consolidated file for drip/
 * prerequisite enforcement — sequencing-mode-derived module defaults
 * (FR-034), prerequisite validation (same-course-only, earlier-position-
 * only, explicit-override-always-wins), and the learner-facing access
 * denial a locked module produces. Drip/prerequisite enforcement itself
 * was already covered by scattered pre-existing suites
 * (`lms.integration.test.ts`, `org-assignment-lesson-player.integration.
 * test.ts`) — this file consolidates fresh coverage for this batch's new
 * sequencing-mode behavior specifically, rather than duplicating what
 * those files already verify. Same graceful-skip pattern as the other
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
    .send({ name: 'Drip Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('drip-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Drip Test Category', slug: uniqueSlug('drip-cat') });
    categoryId = res.body.data.id;
  }
}

async function createCourseWithSequencingMode(sequencingMode: string) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Drip Test Course',
      slug: uniqueSlug('drip-course'),
      shortDescription: 'short',
      description: 'full',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      sequencingMode,
    });
  expect(courseRes.body.data.sequencingMode).toBe(sequencingMode);
  return courseRes.body.data.id as string;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING drip-prerequisite.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING drip-prerequisite.integration.test.ts: could not reach PostgreSQL.');
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

describe('Sequencing-mode-derived module defaults (FR-034, 004 US6 polish batch)', () => {
  it('SEQUENTIAL auto-chains each new module after the previous one', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('SEQUENTIAL');

    const m1 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    expect(m1.body.data.releaseRuleType).toBe('IMMEDIATE');
    expect(m1.body.data.prerequisiteModuleId).toBeNull();

    const m2 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 2' });
    expect(m2.body.data.releaseRuleType).toBe('AFTER_PREVIOUS_MODULE');
    expect(m2.body.data.prerequisiteModuleId).toBe(m1.body.data.id);

    const m3 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 3' });
    expect(m3.body.data.releaseRuleType).toBe('AFTER_PREVIOUS_MODULE');
    expect(m3.body.data.prerequisiteModuleId).toBe(m2.body.data.id);
  });

  it('FLEXIBLE (the schema default) applies no default — existing IMMEDIATE/no-prerequisite behavior is unchanged', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('FLEXIBLE');

    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    const m2 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 2' });

    expect(m2.body.data.releaseRuleType).toBe('IMMEDIATE');
    expect(m2.body.data.prerequisiteModuleId).toBeNull();
  });

  it('INSTRUCTOR_CONTROLLED defaults every new module to manual release', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('INSTRUCTOR_CONTROLLED');

    const m1 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    expect(m1.body.data.releaseRuleType).toBe('INSTRUCTOR_RELEASE');
    expect(m1.body.data.prerequisiteModuleId).toBeNull();
  });

  it('an explicit releaseRuleType/prerequisiteModuleId in the request always overrides the sequencing-mode default', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('SEQUENTIAL');

    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    // Even under SEQUENTIAL, an explicit IMMEDIATE + no prerequisite must be honored, not silently replaced.
    const m2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 2', releaseRuleType: 'IMMEDIATE' });
    expect(m2.body.data.releaseRuleType).toBe('IMMEDIATE');
    expect(m2.body.data.prerequisiteModuleId).toBeNull();
  });

  it("HYBRID is identical to FLEXIBLE at the data level — a distinct honest label, not a third enforcement behavior", async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('HYBRID');

    const m1 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    expect(m1.body.data.releaseRuleType).toBe('IMMEDIATE');
    expect(m1.body.data.prerequisiteModuleId).toBeNull();
  });
});

describe('Prerequisite validation (FR-016 Correction 3)', () => {
  it('rejects a prerequisite that is not earlier in the course sequence', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('FLEXIBLE');

    const m1 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    const m2 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 2' });

    // m1 (position 0) cannot depend on m2 (position 1) — a prerequisite must come earlier.
    const invalid = await request(app)
      .patch(`/api/v1/lms/admin/modules/${m1.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prerequisiteModuleId: m2.body.data.id });
    expect(invalid.status).toBe(400);
  });

  it('rejects a prerequisite belonging to a different course', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId1 = await createCourseWithSequencingMode('FLEXIBLE');
    const courseId2 = await createCourseWithSequencingMode('FLEXIBLE');

    const otherCourseModule = await request(app).post(`/api/v1/lms/admin/courses/${courseId1}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Other Course Module' });
    await request(app).post(`/api/v1/lms/admin/courses/${courseId2}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    const m2 = await request(app).post(`/api/v1/lms/admin/courses/${courseId2}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 2' });

    const invalid = await request(app)
      .patch(`/api/v1/lms/admin/modules/${m2.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prerequisiteModuleId: otherCourseModule.body.data.id });
    expect(invalid.status).toBe(400);
  });

  it('rejects a module being set as its own prerequisite', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('FLEXIBLE');
    const m1 = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });

    const invalid = await request(app)
      .patch(`/api/v1/lms/admin/modules/${m1.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prerequisiteModuleId: m1.body.data.id });
    expect(invalid.status).toBe(400);
  });
});

describe('Learner-facing drip/prerequisite denial (T082/T083)', () => {
  it("denies access to a module gated on an unmet prerequisite, and the curriculum endpoint reports the lock reason", async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const courseId = await createCourseWithSequencingMode('SEQUENTIAL');

    const m1Res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
    const m1Id = m1Res.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/modules/${m1Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    const l1Res = await request(app).post(`/api/v1/lms/admin/modules/${m1Id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('drip-l1') });
    await request(app).patch(`/api/v1/lms/admin/lessons/${l1Res.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    // Module 2 is auto-chained after Module 1 (SEQUENTIAL) — its prerequisite is Module 1's completion.
    const m2Res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 2' });
    const m2Id = m2Res.body.data.id;
    expect(m2Res.body.data.prerequisiteModuleId).toBe(m1Id);
    await request(app).patch(`/api/v1/lms/admin/modules/${m2Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    const l2Res = await request(app).post(`/api/v1/lms/admin/modules/${m2Id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 2', slug: uniqueSlug('drip-l2') });
    await request(app).patch(`/api/v1/lms/admin/lessons/${l2Res.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
      await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    }

    const learner = await createUserWithRole(uniqueEmail('drip-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    // Direct access to lesson 2 must be denied — module 2's prerequisite (module 1 completion) is unmet.
    const lessonAccessRes = await request(app).get(`/api/v1/lms/me/lessons/${l2Res.body.data.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lessonAccessRes.status).toBe(403);

    const curriculumRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    const module2Curriculum = curriculumRes.body.data.find((m: any) => m.id === m2Id);
    expect(module2Curriculum.locked).toBe(true);
    expect(module2Curriculum.lockReason).toBe('PREREQUISITE_NOT_MET');

    // Completing module 1's lesson satisfies the prerequisite; module 2 unlocks.
    await request(app).post(`/api/v1/lms/me/lessons/${l1Res.body.data.id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    const curriculumAfter = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    const module2After = curriculumAfter.body.data.find((m: any) => m.id === m2Id);
    expect(module2After.locked).toBe(false);

    const lessonAccessAfter = await request(app).get(`/api/v1/lms/me/lessons/${l2Res.body.data.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lessonAccessAfter.status).toBe(200);
  });
});
