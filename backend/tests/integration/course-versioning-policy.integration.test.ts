/**
 * Real-database integration tests for 004-learning-management-system's
 * Course Versioning Policy batch (FR-099): the change-summary/effective-
 * date/existing-learner-policy fields attached to the pre-existing
 * `CourseVersion` snapshot mechanism, the admin Version History read
 * endpoint, and the 3 named existing-learner policies' REAL enforcement —
 * CONTINUE_CURRENT_VERSION (no-op), OPTIONAL_MIGRATION (learner
 * self-service), and MANDATORY_MIGRATION (automatic, idempotent, applied
 * at the real course-progress read action point — no scheduler exists in
 * this codebase). Same graceful-skip pattern as the other integration
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
    .send({ name: 'Versioning Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('version-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Versioning Test Category', slug: uniqueSlug('version-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course, one published mandatory module + lesson — the minimal shape where completing that lesson gives a learner real progress to lose/keep across a migration. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Versioning Test Course', slug: uniqueSlug('version-course'), shortDescription: 'short', description: 'full description', categoryId, thumbnailUrl: 'https://example.com/thumb.jpg' });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('version-lesson') });
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
    console.warn('⚠ SKIPPING course-versioning-policy.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-versioning-policy.integration.test.ts: could not reach PostgreSQL.');
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
    await db.courseVersion.deleteMany({});
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

describe('Course Versioning Policy (FR-099)', () => {
  it('records changeSummary/effectiveDate/existingLearnerPolicy on the version snapshot when editing a Published course', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const effectiveDate = new Date(Date.now() + 86_400_000).toISOString();

    const editRes = await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Versioning Test Course (Updated)', versionChangeSummary: 'Reworded the intro.', versionEffectiveDate: effectiveDate, versionExistingLearnerPolicy: 'OPTIONAL_MIGRATION' });
    expect(editRes.status).toBe(200);

    const versionsRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/versions`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data).toHaveLength(1);
    const version = versionsRes.body.data[0];
    expect(version.changeSummary).toBe('Reworded the intro.');
    expect(version.existingLearnerPolicy).toBe('OPTIONAL_MIGRATION');
    expect(new Date(version.effectiveDate).toISOString()).toBe(effectiveDate);
  });

  it('defaults to CONTINUE_CURRENT_VERSION with a null changeSummary/effectiveDate when the admin does not supply version fields', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();

    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'No version metadata this time' });

    const versionsRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/versions`).set('Authorization', `Bearer ${admin.accessToken}`);
    const version = versionsRes.body.data[0];
    expect(version.existingLearnerPolicy).toBe('CONTINUE_CURRENT_VERSION');
    expect(version.changeSummary).toBeNull();
    expect(version.effectiveDate).toBeNull();
  });

  it('rejects an invalid existingLearnerPolicy value with a validation error', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Bad policy', versionExistingLearnerPolicy: 'NOT_A_REAL_POLICY' });
    expect(res.status).toBe(400);
  });

  it('CONTINUE_CURRENT_VERSION offers no migration action to the learner', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('version-learner-continue'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Still continue-version' });

    const statusRes = await request(app).get(`/api/v1/lms/me/enrollments/${enrollmentId}/version-status`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(statusRes.body.data.migrationAvailable).toBe(false);

    const migrateRes = await request(app).post(`/api/v1/lms/me/enrollments/${enrollmentId}/migrate-version`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(migrateRes.status).toBe(400);
  });

  it('OPTIONAL_MIGRATION lets a learner voluntarily reset progress, and a second attempt is rejected as already-current', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('version-learner-optional'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Optional migration version', versionExistingLearnerPolicy: 'OPTIONAL_MIGRATION' });

    const statusRes = await request(app).get(`/api/v1/lms/me/enrollments/${enrollmentId}/version-status`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(statusRes.body.data.migrationAvailable).toBe(true);

    const migrateRes = await request(app).post(`/api/v1/lms/me/enrollments/${enrollmentId}/migrate-version`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(migrateRes.status).toBe(200);
    expect(migrateRes.body.data.toVersionNumber).toBe(1);

    const progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(0);

    const secondAttempt = await request(app).post(`/api/v1/lms/me/enrollments/${enrollmentId}/migrate-version`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(secondAttempt.status).toBe(409);
  });

  it('MANDATORY_MIGRATION resets progress automatically and idempotently the moment the learner reads their course progress', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('version-learner-mandatory'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    let progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(1);

    // No effective date supplied — due immediately.
    await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Mandatory migration version', versionExistingLearnerPolicy: 'MANDATORY_MIGRATION' });

    progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(0);

    const statusRes = await request(app).get(`/api/v1/lms/me/enrollments/${enrollmentId}/version-status`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(statusRes.body.data.migratedToVersionNumber).toBe(1);

    // Re-complete the lesson, then re-read progress — must NOT be wiped
    // again (idempotent, already migrated to version 1). A fresh
    // Idempotency-Key is required here: the no-client-key fallback key on
    // `POST .../complete` is deterministic per (user, lesson) and never
    // expires (see `completeLessonManually`'s own doc comment), so without
    // one this second call would replay the FIRST completion's cached
    // response rather than genuinely re-running — a real, pre-existing
    // idempotency-cache characteristic unrelated to this batch, not
    // something this test should paper over.
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('Idempotency-Key', `post-migration-recomplete-${Date.now()}`);
    progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(1);
  });

  it('applies TWO SEPARATE migrations on the same enrollment (an earlier voluntary one, then a later automatic one) — regression test for an idempotency-key collision caught by live verification', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('version-learner-sequential'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    // First migration: voluntary, to version 1 (this course's first-ever edit-after-publish, so this IS version 1).
    await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Version 1', versionExistingLearnerPolicy: 'OPTIONAL_MIGRATION' });
    const firstMigrate = await request(app).post(`/api/v1/lms/me/enrollments/${enrollmentId}/migrate-version`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(firstMigrate.status).toBe(200);
    expect(firstMigrate.body.data.toVersionNumber).toBe(1);

    // Re-complete after the first migration, so there's real progress the SECOND migration must also genuinely clear.
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('Idempotency-Key', `regression-recomplete-1-${Date.now()}`);
    let progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(1);

    // Second migration: automatic, to version 2 — a DIFFERENT target version from the first. Must NOT silently no-op due to an idempotency-key collision with the first reset.
    await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Version 2', versionExistingLearnerPolicy: 'MANDATORY_MIGRATION' });
    progressRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.body.data.completedMandatoryModules).toBe(0);

    const statusRes = await request(app).get(`/api/v1/lms/me/enrollments/${enrollmentId}/version-status`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(statusRes.body.data.migratedToVersionNumber).toBe(2);
  });

  it('IDOR-safe: another learner cannot read or act on someone else\'s version-migration status', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const owner = await createUserWithRole(uniqueEmail('version-learner-owner'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${owner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    const intruder = await createUserWithRole(uniqueEmail('version-learner-intruder'), 'registered_free_user');
    const statusRes = await request(app).get(`/api/v1/lms/me/enrollments/${enrollmentId}/version-status`).set('Authorization', `Bearer ${intruder.accessToken}`);
    expect(statusRes.status).toBe(404);

    const migrateRes = await request(app).post(`/api/v1/lms/me/enrollments/${enrollmentId}/migrate-version`).set('Authorization', `Bearer ${intruder.accessToken}`);
    expect(migrateRes.status).toBe(404);
  });
});
