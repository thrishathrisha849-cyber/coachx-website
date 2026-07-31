/**
 * Real-database integration tests for 004-learning-management-system's
 * Course Translation Management batch (FR-101): the six named status
 * states for a translation-variant course, the manual transition map
 * (OUTDATED excluded — only ever set automatically), rejecting the
 * endpoint entirely for a non-variant course, and the auto-outdated-flag
 * integration point (editing a SOURCE course's lesson flips every
 * mid-workflow variant to OUTDATED while a NOT_STARTED variant is left
 * alone). Same graceful-skip pattern as the other integration suites —
 * see docs/database/TESTING.md.
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
    .send({ name: 'Translation Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('trans-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Translation Test Category', slug: uniqueSlug('trans-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one lesson. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Translation Source Course',
      slug: uniqueSlug('trans-course'),
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

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('trans-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId };
}

async function cloneAsTranslationVariant(sourceCourseId: string) {
  const res = await request(app)
    .post(`/api/v1/lms/admin/courses/${sourceCourseId}/clone`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ mode: 'TRANSLATION_VARIANT', slug: uniqueSlug('trans-variant'), language: 'TA' });
  return res.body.data.id as string;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-translation.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-translation.integration.test.ts: could not reach PostgreSQL.');
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

describe('Course Translation status transitions (FR-101)', () => {
  it('starts a TRANSLATION_VARIANT clone at NOT_STARTED and walks it through the full manual workflow to PUBLISHED', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const variantId = await cloneAsTranslationVariant(courseId);

    const getRes = await request(app).get(`/api/v1/lms/admin/courses/${variantId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getRes.body.data.translationOfCourseId).toBe(courseId);
    expect(getRes.body.data.translationStatus).toBe('NOT_STARTED');

    for (const status of ['IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED']) {
      const res = await request(app)
        .post(`/api/v1/lms/admin/courses/${variantId}/translation-status`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.translationStatus).toBe(status);
    }
  });

  it('rejects an invalid skip transition (NOT_STARTED straight to REVIEW)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const variantId = await cloneAsTranslationVariant(courseId);

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${variantId}/translation-status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'REVIEW' });
    expect(res.status).toBe(400);
  });

  it('rejects manually setting OUTDATED (400 — validation layer rejects the value entirely)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const variantId = await cloneAsTranslationVariant(courseId);

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${variantId}/translation-status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'OUTDATED' });
    expect(res.status).toBe(400);
  });

  it('rejects the translation-status endpoint entirely for a course that is not a translation variant', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/translation-status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(400);
  });
});

describe('Course Translation auto-outdated flagging (FR-101)', () => {
  it('flags a mid-workflow variant OUTDATED when the source lesson is edited, leaves a NOT_STARTED variant untouched, and lets OUTDATED resume to IN_PROGRESS', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();

    const inProgressVariantId = await cloneAsTranslationVariant(courseId);
    await request(app)
      .post(`/api/v1/lms/admin/courses/${inProgressVariantId}/translation-status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'IN_PROGRESS' });

    const notStartedVariantId = await cloneAsTranslationVariant(courseId);

    await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Updated Lesson Title' });

    const inProgressAfter = await request(app).get(`/api/v1/lms/admin/courses/${inProgressVariantId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(inProgressAfter.body.data.translationStatus).toBe('OUTDATED');

    const notStartedAfter = await request(app).get(`/api/v1/lms/admin/courses/${notStartedVariantId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(notStartedAfter.body.data.translationStatus).toBe('NOT_STARTED');

    const resumeRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${inProgressVariantId}/translation-status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.translationStatus).toBe('IN_PROGRESS');
  });

  it('lists every translation variant of a source course via GET /admin/courses/:id/translations', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const variantId = await cloneAsTranslationVariant(courseId);

    const listRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/translations`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: any) => c.id === variantId)).toBe(true);
  });
});
