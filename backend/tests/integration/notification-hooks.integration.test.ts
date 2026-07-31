/**
 * Real-database integration tests for 004-learning-management-system's
 * Remaining Notification Hooks batch: FR-025 (enrollment confirmation
 * email), FR-120 (course-completed notification), and FR-113 (mandatory
 * admin/instructor override notification, both mark-complete and reset).
 * These were the three named-but-unwired hook points identified by the
 * Cross-cutting Polish batch (`enrollment.service.ts`'s
 * `createEnrollmentInternal`; `completion.service.ts`'s
 * `recomputeEnrollmentCompletion`/`overrideMarkComplete`/`overrideReset`).
 * Same graceful-skip pattern as the other integration suites — see
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
    .send({ name: 'Notify Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  return { userId: user.id, email, accessToken: loginRes.body.data.accessToken };
}

let admin: { userId: string; email: string; accessToken: string };
let categoryId: string;

async function ensureAdminAndCategory() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('notify-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Notify Test Category', slug: uniqueSlug('notify-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course, one published mandatory module, one published mandatory lesson — the minimal shape where completing that single lesson completes the whole course. */
async function createSingleLessonCourse() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Notify Course',
      slug: uniqueSlug('notify-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('notify-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, courseTitle: courseRes.body.data.title, moduleId, lessonId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING notification-hooks.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING notification-hooks.integration.test.ts: could not reach PostgreSQL.');
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
    await db.completionOverride.deleteMany({});
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

describe('Remaining Notification Hooks (FR-025, FR-113, FR-120)', () => {
  it('FR-025: sends an enrollment-confirmation email on a genuinely new self-enrollment, and does NOT resend it for an already-open enrollment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, courseTitle } = await createSingleLessonCourse();
    const learner = await createUserWithRole(uniqueEmail('notify-learner-a'), 'registered_free_user');

    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    expect(enrollRes.status).toBe(201);

    const confirmationEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.subject.includes(courseTitle));
    expect(confirmationEmails).toHaveLength(1);
    expect(confirmationEmails[0].text).toContain(courseTitle);

    // Re-requesting enrollment while one is already open returns the SAME
    // row (established idempotent-in-effect behavior) and must NOT fire a
    // second confirmation email.
    const secondEnrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    expect(secondEnrollRes.status).toBe(201);
    expect(secondEnrollRes.body.data.id).toBe(enrollRes.body.data.id);

    const confirmationEmailsAfter = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.subject.includes(courseTitle));
    expect(confirmationEmailsAfter).toHaveLength(1);
  });

  it('FR-025: admin-granted enrollment also sends the confirmation email to the learner (not the granting admin)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, courseTitle } = await createSingleLessonCourse();
    const learner = await createUserWithRole(uniqueEmail('notify-learner-b'), 'registered_free_user');

    const grantRes = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' });
    expect(grantRes.status).toBe(201);

    const learnerEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.subject.includes(courseTitle));
    expect(learnerEmails).toHaveLength(1);
    const adminEmails = emailAdapter.sent.filter((m: any) => m.to === admin.email && m.subject.includes(courseTitle));
    expect(adminEmails).toHaveLength(0);
  });

  it('FR-113 + FR-120: an instructor/admin mark-complete override on the sole mandatory lesson sends BOTH the override notification (with the reason) AND the course-completed notification', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, courseTitle, lessonId } = await createSingleLessonCourse();
    const learner = await createUserWithRole(uniqueEmail('notify-learner-c'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    const overrideRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollmentId}/complete`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ scope: 'LESSON', targetId: lessonId, reason: 'Verified completion offline via live class attendance' });
    expect(overrideRes.status).toBe(200);

    const overrideEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.text.includes('manually marked complete'));
    expect(overrideEmails).toHaveLength(1);
    expect(overrideEmails[0].text).toContain('Verified completion offline via live class attendance');

    const completedEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.subject.includes(`You completed "${courseTitle}"`));
    expect(completedEmails).toHaveLength(1);

    const db = getPrismaClient();
    const enrollment = await db.enrollment.findUnique({ where: { id: enrollmentId } });
    expect(enrollment.status).toBe('COMPLETED');
  });

  it('FR-113: a reset override sends the learner a notification containing the reason, and does not fire a second course-completed email', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, courseTitle, lessonId } = await createSingleLessonCourse();
    const learner = await createUserWithRole(uniqueEmail('notify-learner-d'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollmentId}/complete`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ scope: 'LESSON', targetId: lessonId, reason: 'Initial completion' });

    const resetRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollmentId}/reset-progress`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ scope: 'LESSON', targetId: lessonId, reason: 'Learner requested a redo after a technical issue' });
    expect(resetRes.status).toBe(200);

    const resetEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.text.includes('was reset by an instructor/admin'));
    expect(resetEmails).toHaveLength(1);
    expect(resetEmails[0].text).toContain('Learner requested a redo after a technical issue');

    // The reset must not re-trigger a SECOND course-completed email —
    // `overrideReset` never calls `recomputeEnrollmentCompletion`.
    const completedEmails = emailAdapter.sent.filter((m: any) => m.to === learner.email && m.subject.includes(`You completed "${courseTitle}"`));
    expect(completedEmails).toHaveLength(1); // exactly the one from the earlier mark-complete override
  });
});
