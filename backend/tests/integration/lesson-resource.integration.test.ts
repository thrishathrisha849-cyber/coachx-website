/**
 * Real-database integration tests for 004-learning-management-system's
 * Downloadable Resource Catalog batch (FR-049): admin CRUD/reorder/archive,
 * the access-rule distinction (PREVIEW resources visible to a preview-only
 * viewer, ENROLLED_ONLY resources requiring real enrollment), DRAFT
 * resources hidden from learners, VIEW_ONLY vs DOWNLOADABLE download
 * rejection, and the three real FR-049 tracking events
 * (RESOURCE_VIEWED/RESOURCE_DOWNLOAD_STARTED/RESOURCE_DOWNLOADED) verified
 * directly against the `LearningEvent` log. Same graceful-skip pattern as
 * the other integration suites — see docs/database/TESTING.md.
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
    .send({ name: 'Resource Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('resource-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Resource Test Category', slug: uniqueSlug('resource-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED lesson (optionally isPreview). */
async function createPublishedCourseWithLesson(isPreview = false) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Resource Test Course',
      slug: uniqueSlug('resource-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('resource-lesson'), isPreview });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, lessonId };
}

async function createAndPublishResource(lessonId: string, overrides: Record<string, unknown> = {}) {
  const createRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Handout', type: 'PDF', fileUrl: 'https://example.com/handout.pdf', ...overrides });
  const resourceId = createRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/resources/${resourceId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
  return resourceId;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lesson-resource.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lesson-resource.integration.test.ts: could not reach PostgreSQL.');
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
    await db.learningEvent.deleteMany({});
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

describe('Downloadable Resource Catalog admin lifecycle (FR-049)', () => {
  it('creates, lists, reorders, and archives resources', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Handout', type: 'PDF', fileUrl: 'https://example.com/handout.pdf' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('DRAFT');
    expect(createRes.body.data.version).toBe(1);
    const firstId = createRes.body.data.id;

    const secondRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Slides', type: 'PRESENTATION', fileUrl: 'https://example.com/slides.pdf' });
    const secondId = secondRes.body.data.id;

    const listRes = await request(app).get(`/api/v1/lms/admin/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.body.data.map((r: any) => r.id)).toEqual([firstId, secondId]);

    const reorderRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources/reorder`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ orderedIds: [secondId, firstId] });
    expect(reorderRes.status).toBe(200);

    const reorderedListRes = await request(app).get(`/api/v1/lms/admin/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(reorderedListRes.body.data.map((r: any) => r.id)).toEqual([secondId, firstId]);

    const archiveRes = await request(app).post(`/api/v1/lms/admin/resources/${firstId}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe('ARCHIVED');
  });

  it('bumps the version when bumpVersion is set on update', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const createRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Handout', type: 'PDF', fileUrl: 'https://example.com/handout.pdf' });
    const resourceId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/v1/lms/admin/resources/${resourceId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ fileUrl: 'https://example.com/handout-v2.pdf', bumpVersion: true });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.version).toBe(2);
  });
});

describe('Downloadable Resource Catalog learner access (FR-049)', () => {
  it('hides DRAFT resources and only shows PUBLISHED ones to an enrolled learner', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('resource-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/resources`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Draft Handout', type: 'PDF', fileUrl: 'https://example.com/draft.pdf' });
    await createAndPublishResource(lessonId, { title: 'Published Handout' });

    const listRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].title).toBe('Published Handout');
  });

  it('rejects listing resources for a non-enrolled learner on a non-preview lesson, with a specific denial reason (FR-125)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const outsider = await createUserWithRole(uniqueEmail('resource-outsider'), 'registered_free_user');

    const res = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(403);
    // Regression guard: `assertLessonAccessibleForResources` used to drop
    // `reason`/`detail` via a bare `AppError.forbidden(access.message)`,
    // unlike every other lesson-access denial in this codebase. Now backed
    // by the shared `assertLessonContentAccessible` (access-evaluator.service.ts).
    expect(res.body.error?.details?.reason).toBe('ENROLLMENT_REQUIRED');
  });

  it('rejects viewing a single resource for a non-enrolled learner, with a specific denial reason (FR-125)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const outsider = await createUserWithRole(uniqueEmail('resource-outsider2'), 'registered_free_user');
    const resourceId = await createAndPublishResource(lessonId);

    const res = await request(app).post(`/api/v1/lms/me/lesson-resources/${resourceId}/viewed`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error?.details?.reason).toBe('ENROLLMENT_REQUIRED');
  });

  it('shows only PREVIEW-accessRule resources to a preview-only (non-enrolled) viewer on an isPreview lesson', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    // `evaluateLessonAccess` treats EVERY isPreview lesson as viaPreview
    // for ANY viewer (a pre-existing, lesson-level — not learner-specific
    // — shortcut; see access-evaluator.service.ts), so this scenario is
    // deliberately tested with a non-enrolled viewer only.
    const { lessonId } = await createPublishedCourseWithLesson(true);
    await createAndPublishResource(lessonId, { title: 'Public Sample', accessRule: 'PREVIEW' });
    await createAndPublishResource(lessonId, { title: 'Enrolled-Only Handout', accessRule: 'ENROLLED_ONLY' });

    const previewer = await createUserWithRole(uniqueEmail('resource-previewer'), 'registered_free_user');
    const previewListRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${previewer.accessToken}`);
    expect(previewListRes.status).toBe(200);
    expect(previewListRes.body.data.map((r: any) => r.title)).toEqual(['Public Sample']);
  });

  it('shows every PUBLISHED resource (any access rule) to a genuinely enrolled learner on a non-preview lesson', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    await createAndPublishResource(lessonId, { title: 'Public Sample', accessRule: 'PREVIEW' });
    await createAndPublishResource(lessonId, { title: 'Enrolled-Only Handout', accessRule: 'ENROLLED_ONLY' });

    const enrolledLearner = await createUserWithRole(uniqueEmail('resource-enrolled'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${enrolledLearner.accessToken}`).send({ courseId });
    const enrolledListRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/resources`).set('Authorization', `Bearer ${enrolledLearner.accessToken}`);
    expect(enrolledListRes.body.data.map((r: any) => r.title).sort()).toEqual(['Enrolled-Only Handout', 'Public Sample']);
  });
});

describe('Downloadable Resource Catalog tracking events (FR-049)', () => {
  it('records a real RESOURCE_VIEWED event', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('resource-viewed'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const resourceId = await createAndPublishResource(lessonId);

    const res = await request(app).post(`/api/v1/lms/me/lesson-resources/${resourceId}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);

    const db = getPrismaClient();
    const event = await db.learningEvent.findFirst({ where: { eventType: 'RESOURCE_VIEWED', userId: learner.userId } });
    expect(event).not.toBeNull();
    expect((event.metadata as any).resourceId).toBe(resourceId);
  });

  it('records real RESOURCE_DOWNLOAD_STARTED and RESOURCE_DOWNLOADED events, and returns the real fileUrl', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('resource-download'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const resourceId = await createAndPublishResource(lessonId, { fileUrl: 'https://example.com/real-handout.pdf' });

    const res = await request(app).post(`/api/v1/lms/me/lesson-resources/${resourceId}/download`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.fileUrl).toBe('https://example.com/real-handout.pdf');

    const db = getPrismaClient();
    const startedEvent = await db.learningEvent.findFirst({ where: { eventType: 'RESOURCE_DOWNLOAD_STARTED', userId: learner.userId } });
    const completedEvent = await db.learningEvent.findFirst({ where: { eventType: 'RESOURCE_DOWNLOADED', userId: learner.userId } });
    expect(startedEvent).not.toBeNull();
    expect(completedEvent).not.toBeNull();
  });

  it('rejects downloading a VIEW_ONLY resource', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('resource-viewonly'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const resourceId = await createAndPublishResource(lessonId, { downloadPermission: 'VIEW_ONLY' });

    const res = await request(app).post(`/api/v1/lms/me/lesson-resources/${resourceId}/download`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(400);
  });
});
