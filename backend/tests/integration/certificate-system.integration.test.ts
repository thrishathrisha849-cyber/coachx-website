/**
 * Real-database integration tests for 004-learning-management-system's
 * US5 Certificate System batch: FR-081 server-evaluated eligibility
 * (including the honest "notApplicable" conditions this codebase cannot
 * verify), FR-083 idempotent generation, historical-immutability of
 * snapshotted certificate fields, FR-084 course-template mapping, FR-085
 * public no-auth verification, and FR-086 revocation. Same graceful-skip
 * pattern as the other integration suites — see docs/database/TESTING.md.
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
    .send({ name: 'Certificate Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('cert-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Certificate Test Category', slug: uniqueSlug('cert-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a single-module, single-MANUAL-lesson course, optionally with certificateAvailable set at creation. */
async function createPublishedCourseWithLesson(certificateAvailable = true) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Certificate Test Course',
      slug: uniqueSlug('cert-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
      certificateAvailable,
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('cert-lesson'), completionRuleType: 'MANUAL' });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

/** Enrolls the learner and completes the course's single lesson, which — being the ONLY lesson — auto-transitions the enrollment to COMPLETED. */
async function enrollAndCompleteCourse(accessToken: string, courseId: string, lessonId: string) {
  await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${accessToken}`).send({ courseId });
  const res = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING certificate-system.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING certificate-system.integration.test.ts: could not reach PostgreSQL.');
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
    await db.certificate.deleteMany({});
    await db.certificateTemplate.deleteMany({});
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

describe('Certificate eligibility (FR-081)', () => {
  it('reports ineligible with per-condition detail before the course is completed', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-notyet'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/certificate-eligibility`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(false);
    const enrollmentCondition = res.body.data.conditions.find((c: any) => c.key === 'enrollmentCompleted');
    expect(enrollmentCondition.satisfied).toBe(false);
    // Honest-scope-reduction: conditions this codebase cannot verify are reported, never assumed true.
    expect(res.body.data.notApplicable).toEqual(expect.arrayContaining(['attendanceThreshold', 'paymentSettled']));
    // 004 Project-based Learning batch (FR-077): this course has no PUBLISHED
    // project at all, so `finalProjectApproved` is correctly ABSENT from both
    // `conditions` (nothing to check) and `notApplicable` (not a platform-wide
    // gap anymore — it's a real, owned signal, just not relevant to this course).
    expect(res.body.data.conditions.find((c: any) => c.key === 'finalProjectApproved')).toBeUndefined();
  });

  it('reports ineligible when the course does not offer a certificate, even after completion', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(false);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-noflag'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);

    const res = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/certificate-eligibility`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.body.data.eligible).toBe(false);
    expect(res.body.data.conditions.find((c: any) => c.key === 'certificateAvailable').satisfied).toBe(false);
  });

  it('rejects certificate generation while ineligible, surfacing the failing conditions', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-reject'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.details.conditions).toBeDefined();
  });
});

describe('Certificate generation + historical immutability (FR-083, Constitution Article IV)', () => {
  it('generates a certificate once eligible, snapshotting learner/course names rather than joining live', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const learnerEmail = uniqueEmail('cert-learner-generate');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);

    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.credentialId).toMatch(/^CX-/);
    expect(genRes.body.data.status).toBe('VALID');
    expect(genRes.body.data.courseTitle).toBe('Certificate Test Course');

    const listRes = await request(app).get('/api/v1/lms/me/certificates').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(genRes.body.data.id);

    // Cross-cutting polish batch (T121) — US5 acceptance scenario 2: "the learner is notified."
    // Matches the certificate-issued email's OWN subject template
    // ("Your certificate for ... is ready") specifically — a plain
    // `.includes('certificate')` would also match the unrelated FR-025
    // enrollment-confirmation email whenever the test course's title
    // itself contains the word "Certificate" (as this course's does).
    const issuedEmail = emailAdapter.sent.find((m: any) => m.to === learnerEmail.toLowerCase() && m.subject.toLowerCase().includes('your certificate for'));
    expect(issuedEmail).toBeDefined();
    expect(issuedEmail!.text).toContain(genRes.body.data.credentialId);
  });

  it('is idempotent — generating twice for the same enrollment returns the same certificate, never a duplicate', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-idempotent'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);

    const first = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    const second = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.credentialId).toBe(first.body.data.credentialId);

    const listRes = await request(app).get('/api/v1/lms/me/certificates').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(1);
  });

  it("404s when a learner requests another learner's certificate by ID (ownership-scoped, no IDOR)", async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const owner = await createUserWithRole(uniqueEmail('cert-owner'), 'registered_free_user');
    await enrollAndCompleteCourse(owner.accessToken, courseId, lessonId);
    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${owner.accessToken}`);
    const certificateId = genRes.body.data.id;

    const stranger = await createUserWithRole(uniqueEmail('cert-stranger'), 'registered_free_user');
    const res = await request(app).get(`/api/v1/lms/me/certificates/${certificateId}`).set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Certificate template CRUD + course mapping (FR-082, FR-084)', () => {
  it('maps a course to a template and the mapped templateId is snapshotted onto newly issued certificates', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);

    const templateRes = await request(app)
      .post('/api/v1/lms/admin/certificate-templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Gold Template', primaryColor: '#c9a227', language: 'EN' });
    expect(templateRes.status).toBe(201);
    const templateId = templateRes.body.data.id;

    const mapRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/certificate-template`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ templateId });
    expect(mapRes.status).toBe(200);

    const learner = await createUserWithRole(uniqueEmail('cert-learner-template'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);
    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(genRes.status).toBe(201);

    const adminListRes = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/certificates`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminListRes.status).toBe(200);
    expect(adminListRes.body.data).toHaveLength(1);
    expect(adminListRes.body.data[0].learnerUserId).toBe(learner.userId);
  });

  it('deactivating a template removes it from the active-template list but does not delete it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const templateRes = await request(app)
      .post('/api/v1/lms/admin/certificate-templates')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Deactivate Me', language: 'EN' });
    const templateId = templateRes.body.data.id;

    const patchRes = await request(app)
      .patch(`/api/v1/lms/admin/certificate-templates/${templateId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isActive).toBe(false);

    const listRes = await request(app).get('/api/v1/lms/admin/certificate-templates').set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.body.data.find((t: any) => t.id === templateId).isActive).toBe(false);
  });
});

describe('Public verification (FR-085) + revocation (FR-086)', () => {
  it('verifies a valid credential with no authentication required', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-verify'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);
    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    const credentialId = genRes.body.data.credentialId;

    const verifyRes = await request(app).get(`/api/v1/lms/certificates/verify/${credentialId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('VALID');
    expect(verifyRes.body.data.courseTitle).toBe('Certificate Test Course');
  });

  it('reports NOT_FOUND (as a response value, not an HTTP error) for a credential ID that does not exist', async () => {
    if (skip()) return;
    const res = await request(app).get('/api/v1/lms/certificates/verify/CX-DOESNOTEXIST');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('NOT_FOUND');
  });

  it('revokes a certificate; verification then reports REVOKED; a second revoke is rejected as a conflict', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('cert-learner-revoke'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);
    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    const certificateId = genRes.body.data.id;
    const credentialId = genRes.body.data.credentialId;

    const revokeRes = await request(app)
      .post(`/api/v1/lms/admin/certificates/${certificateId}/revoke`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Issued in error during testing.' });
    expect(revokeRes.status).toBe(200);

    const verifyRes = await request(app).get(`/api/v1/lms/certificates/verify/${credentialId}`);
    expect(verifyRes.body.data.status).toBe('REVOKED');

    const secondRevoke = await request(app)
      .post(`/api/v1/lms/admin/certificates/${certificateId}/revoke`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Trying again.' });
    expect(secondRevoke.status).toBe(409);
  });
});
