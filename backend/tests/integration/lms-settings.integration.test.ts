/**
 * Real-database integration tests for 004-learning-management-system's
 * LMS-wide Settings batch (T101-T103, FR-114): permission-gating on the new
 * `course.settings.manage` permission, the lazy-create-with-seeded-defaults
 * singleton behavior, partial update, and — the actual point of this batch
 * — that a newly-created Quiz/Assignment/LessonResource/Lesson genuinely
 * inherits an ADMIN-EDITED default rather than the old hardcoded constant.
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
    .send({ name: 'Settings Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('settings-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Settings Test Category', slug: uniqueSlug('settings-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates a published course with one module and one published lesson — enough to attach a quiz/assignment/resource to. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Settings Test Course',
      slug: uniqueSlug('settings-course'),
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

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('settings-lesson') });
  const lessonId = lessonRes.body.data.id;

  return { courseId, moduleId, lessonId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lms-settings.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lms-settings.integration.test.ts: could not reach PostgreSQL.');
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
    await db.lmsSettings.deleteMany({});
    await db.quiz.deleteMany({});
    await db.assignment.deleteMany({});
    await db.lessonResource.deleteMany({});
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

describe('LMS-wide Settings (T101-T103, FR-114)', () => {
  it('rejects a non-privileged role', async () => {
    if (skip()) return;
    const outsider = await createUserWithRole(uniqueEmail('settings-outsider'), 'registered_free_user');
    const res = await request(app).get('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('lazily creates the singleton row with the exact pre-existing hardcoded values on first read', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const res = await request(app).get('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      defaultVideoWatchThresholdPercent: 80,
      defaultQuizPassingScorePercent: 70,
      defaultQuizMaxAttempts: null,
      defaultAssignmentMaxAttempts: null,
      defaultResourceDownloadPermission: 'DOWNLOADABLE',
      defaultLessonCompletionRuleType: 'MANUAL',
      courseReviewMinProgressPercent: 50,
    });
  });

  it('rejects an empty patch body', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const res = await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('partially updates one field and leaves the others untouched', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const res = await request(app)
      .patch('/api/v1/lms/admin/settings')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ courseReviewMinProgressPercent: 65 });
    expect(res.status).toBe(200);
    expect(res.body.data.courseReviewMinProgressPercent).toBe(65);
    expect(res.body.data.defaultQuizPassingScorePercent).toBe(70);
  });

  it('a newly-created Quiz inherits an admin-edited defaultQuizPassingScorePercent when the field is omitted', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({ defaultQuizPassingScorePercent: 85 });
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app).post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Quiz 1' });
    expect(res.status).toBe(201);
    expect(res.body.data.passingScorePercent).toBe(85);
  });

  it('an explicit passingScorePercent on Quiz creation still wins over the global default', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({ defaultQuizPassingScorePercent: 85 });
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Quiz 1', passingScorePercent: 60 });
    expect(res.status).toBe(201);
    expect(res.body.data.passingScorePercent).toBe(60);
  });

  it('a newly-created Assignment inherits an admin-edited defaultAssignmentMaxAttempts when the field is omitted', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({ defaultAssignmentMaxAttempts: 3 });
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app).post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Assignment 1' });
    expect(res.status).toBe(201);
    expect(res.body.data.maxAttempts).toBe(3);
  });

  it('a newly-created LessonResource inherits an admin-edited defaultResourceDownloadPermission when the field is omitted', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app)
      .patch('/api/v1/lms/admin/settings')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ defaultResourceDownloadPermission: 'VIEW_ONLY' });
    const { lessonId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Handout', type: 'PDF', fileUrl: 'https://example.com/handout.pdf' });
    expect(res.status).toBe(201);
    expect(res.body.data.downloadPermission).toBe('VIEW_ONLY');
  });

  it('a newly-created Lesson inherits an admin-edited defaultLessonCompletionRuleType when the field is omitted', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app)
      .patch('/api/v1/lms/admin/settings')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ defaultLessonCompletionRuleType: 'ALL_ACTIVITIES_VIEWED' });
    const { moduleId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Lesson 2', slug: uniqueSlug('settings-lesson-2') });
    expect(res.status).toBe(201);
    expect(res.body.data.completionRuleType).toBe('ALL_ACTIVITIES_VIEWED');
  });

  it('lowering courseReviewMinProgressPercent makes a partially-progressed learner newly eligible to review', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({ courseReviewMinProgressPercent: 95 });

    const { courseId, moduleId, lessonId } = await createPublishedCourseWithLesson();
    // Both the module AND its lesson must be PUBLISHED for
    // `computeModuleProgress`/`computeCourseProgress` to count them in
    // the denominator — an all-DRAFT course/module has 0 mandatory
    // modules/lessons, which is vacuously 100% "complete" regardless of
    // the configured threshold.
    await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
      await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    }
    const learner = await createUserWithRole(uniqueEmail('settings-reviewer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    // No progress recorded yet — with a 95% threshold, a review attempt should be rejected.
    const rejectRes = await request(app)
      .post(`/api/v1/lms/me/courses/${courseId}/review`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ rating: 5, comment: 'Great course' });
    expect(rejectRes.status).toBe(400);

    // Lower the threshold to 0% — the same learner, still with zero recorded progress, should now be eligible.
    await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send({ courseReviewMinProgressPercent: 0 });
    const acceptRes = await request(app)
      .post(`/api/v1/lms/me/courses/${courseId}/review`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ rating: 5, comment: 'Great course' });
    expect(acceptRes.status).toBe(201);
  });
});
