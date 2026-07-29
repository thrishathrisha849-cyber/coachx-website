/**
 * Real-database integration tests for 004-learning-management-system's
 * this-pass additions: FR-033 organization-admin course assignment, and
 * the new `GET /me/courses/:courseId/curriculum` endpoint backing the
 * lesson-player frontend (US2). Same graceful-skip pattern as the other
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
    .send({ name: 'LMS Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('lms2-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'LMS2 Test Category', slug: uniqueSlug('lms2-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED, MANUAL-completion lesson (no activities needed for a manual-rule lesson). */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Org Assignment Test Course',
      slug: uniqueSlug('org-course'),
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
    .send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('org-lesson-1') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

async function createOrganization(name: string) {
  const db = getPrismaClient();
  return db.organization.create({ data: { name, slug: uniqueSlug('org') } });
}

async function setUserOrganization(userId: string, organizationId: string) {
  const db = getPrismaClient();
  await db.user.update({ where: { id: userId }, data: { organizationId } });
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING org-assignment-lesson-player.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING org-assignment-lesson-player.integration.test.ts: could not reach PostgreSQL.');
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
    await db.organization.deleteMany({});
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

describe('Organization-admin course assignment (004 FR-033)', () => {
  it('assigns a course to a same-organization member, tracks it, sets a deadline, and can revoke it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();

    const org = await createOrganization('Acme Corp');
    const orgAdmin = await createUserWithRole(uniqueEmail('org-admin'), 'organization_admin');
    const member = await createUserWithRole(uniqueEmail('org-member'), 'registered_free_user');
    await setUserOrganization(orgAdmin.userId, org.id);
    await setUserOrganization(member.userId, org.id);

    const assignRes = await request(app)
      .post(`/api/v1/lms/organization/courses/${courseId}/assign`)
      .set('Authorization', `Bearer ${orgAdmin.accessToken}`)
      .send({ userIds: [member.userId] });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data).toEqual([expect.objectContaining({ userId: member.userId, status: 'assigned' })]);

    const listRes = await request(app)
      .get(`/api/v1/lms/organization/enrollments?courseId=${courseId}`)
      .set('Authorization', `Bearer ${orgAdmin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    const enrollmentId = listRes.body.data[0].enrollmentId;

    const deadline = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const deadlineRes = await request(app)
      .post(`/api/v1/lms/organization/enrollments/${enrollmentId}/deadline`)
      .set('Authorization', `Bearer ${orgAdmin.accessToken}`)
      .send({ accessEndAt: deadline });
    expect(deadlineRes.status).toBe(200);
    expect(new Date(deadlineRes.body.data.accessEndAt).toISOString()).toBe(deadline);

    const revokeRes = await request(app)
      .post(`/api/v1/lms/organization/enrollments/${enrollmentId}/revoke`)
      .set('Authorization', `Bearer ${orgAdmin.accessToken}`)
      .send({ reason: 'No longer part of the training cohort' });
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.status).toBe('REVOKED');
  });

  it('never assigns to, lists, or revokes access for a user outside the actor\'s own organization', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();

    const orgA = await createOrganization('Org A');
    const orgB = await createOrganization('Org B');
    const orgAAdmin = await createUserWithRole(uniqueEmail('org-a-admin'), 'organization_admin');
    const orgBMember = await createUserWithRole(uniqueEmail('org-b-member'), 'registered_free_user');
    await setUserOrganization(orgAAdmin.userId, orgA.id);
    await setUserOrganization(orgBMember.userId, orgB.id);

    const assignRes = await request(app)
      .post(`/api/v1/lms/organization/courses/${courseId}/assign`)
      .set('Authorization', `Bearer ${orgAAdmin.accessToken}`)
      .send({ userIds: [orgBMember.userId] });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data).toEqual([expect.objectContaining({ userId: orgBMember.userId, status: 'failed' })]);

    const db = getPrismaClient();
    const leaked = await db.enrollment.findFirst({ where: { userId: orgBMember.userId, courseId } });
    expect(leaked).toBeNull();

    // Directly grant orgB's member access (simulating a legitimate orgB-side assignment), then confirm orgA's admin cannot see or revoke it.
    const grantRes = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: orgBMember.userId, courseId, source: 'ADMIN_GRANT' });
    const otherOrgEnrollmentId = grantRes.body.data.id;

    const listRes = await request(app)
      .get(`/api/v1/lms/organization/enrollments?courseId=${courseId}`)
      .set('Authorization', `Bearer ${orgAAdmin.accessToken}`);
    expect(listRes.body.data.find((e: any) => e.enrollmentId === otherOrgEnrollmentId)).toBeUndefined();

    const revokeRes = await request(app)
      .post(`/api/v1/lms/organization/enrollments/${otherOrgEnrollmentId}/revoke`)
      .set('Authorization', `Bearer ${orgAAdmin.accessToken}`)
      .send({ reason: 'attempting cross-org revoke' });
    expect(revokeRes.status).toBe(404);
  });
});

describe('Course curriculum for the lesson player (004 US2)', () => {
  it('reflects lock state and lesson completion status as the learner progresses', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('curriculum-learner'), 'registered_free_user');

    const beforeEnroll = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(beforeEnroll.status).toBe(403); // ENROLLMENT_REQUIRED — the same access evaluator every other content path uses.

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const afterEnroll = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterEnroll.status).toBe(200);
    expect(afterEnroll.body.data[0].locked).toBe(false);
    expect(afterEnroll.body.data[0].lessons[0]).toEqual(expect.objectContaining({ id: lessonId, locked: false, status: 'NOT_STARTED' }));

    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const afterComplete = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterComplete.body.data[0].lessons[0].status).toBe('COMPLETED');
  });
});
