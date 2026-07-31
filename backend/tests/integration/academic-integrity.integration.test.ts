/**
 * Real-database integration tests for 004-learning-management-system's
 * Academic-integrity investigation batch (T120, FR-116). Verifies: the new
 * `course.academicIntegrity.manage` permission gate, flagging a Submission
 * blocks certificate eligibility for that course (without needing the
 * enrollment otherwise-complete — `getMyCertificateEligibility` surfaces
 * the specific unmet condition directly), a CLEARED resolution unblocks
 * it, a CONFIRMED resolution keeps it blocked until a successful
 * (OVERTURNED) appeal, the learner's own "my cases" list surfaces a flag
 * so an appeal can actually be filed via the EXISTING generic
 * `POST /trust-safety/cases/:caseId/appeal` endpoint (deliberately reused,
 * not duplicated), and flagging a CERTIFICATE target auto-revokes an
 * already-issued certificate. Same graceful-skip pattern as the other
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
    .send({ name: 'Integrity Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('integrity-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Integrity Test Category', slug: uniqueSlug('integrity-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a single-module, single-MANUAL-lesson course (certificateAvailable by default). */
async function createPublishedCourseWithLesson(certificateAvailable = true) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Integrity Test Course',
      slug: uniqueSlug('integrity-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
      certificateAvailable,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('integrity-lesson'), completionRuleType: 'MANUAL' });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId };
}

async function getEligibility(accessToken: string, courseId: string) {
  const res = await request(app).get(`/api/v1/lms/me/courses/${courseId}/certificate-eligibility`).set('Authorization', `Bearer ${accessToken}`);
  return res.body.data;
}

function conditionSatisfied(eligibility: any, key: string): boolean | undefined {
  return eligibility.conditions.find((c: any) => c.key === key)?.satisfied;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING academic-integrity.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING academic-integrity.integration.test.ts: could not reach PostgreSQL.');
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
    await db.appeal.deleteMany({});
    await db.trustSafetyCase.deleteMany({});
    await db.certificate.deleteMany({});
    await db.submission.deleteMany({});
    await db.assignment.deleteMany({});
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

describe('Academic-integrity investigation (T120, FR-116)', () => {
  it('rejects a non-privileged role from filing a flag', async () => {
    if (skip()) return;
    const outsider = await createUserWithRole(uniqueEmail('integrity-outsider'), 'registered_free_user');
    const res = await request(app)
      .post('/api/v1/lms/admin/academic-integrity/cases')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ type: 'PLAGIARISM', targetType: 'SUBMISSION', targetId: '11111111-1111-1111-1111-111111111111', reason: 'test reason here' });
    expect(res.status).toBe(403);
  });

  it('requires an originality declaration to submit an assignment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Essay', submissionFormat: 'TEXT', allowedFileTypes: [], maxScore: 100, passingScore: 70, latePolicy: 'ACCEPT' });
    const assignmentId = assignmentRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/admin/assignments/${assignmentId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    const learner = await createUserWithRole(uniqueEmail('integrity-decl-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My essay.' });

    const withoutDeclaration = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({});
    expect(withoutDeclaration.status).toBe(400);

    const withFalseDeclaration = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ declaredOriginal: false });
    expect(withFalseDeclaration.status).toBe(400);

    const withTrueDeclaration = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ declaredOriginal: true });
    expect(withTrueDeclaration.status).toBe(200);
  });

  it('flagging a Submission blocks certificate eligibility for its course; CLEARED unblocks it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Essay', submissionFormat: 'TEXT', allowedFileTypes: [], maxScore: 100, passingScore: 70, latePolicy: 'ACCEPT' });
    const assignmentId = assignmentRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/admin/assignments/${assignmentId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    const learner = await createUserWithRole(uniqueEmail('integrity-flag-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My essay.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    const beforeFlag = await getEligibility(learner.accessToken, courseId);
    expect(conditionSatisfied(beforeFlag, 'noActiveMisconductInvestigation')).toBe(true);

    const flagRes = await request(app)
      .post('/api/v1/lms/admin/academic-integrity/cases')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'PLAGIARISM', targetType: 'SUBMISSION', targetId: submissionId, reason: 'Matched an external source closely.' });
    expect(flagRes.status).toBe(201);
    expect(flagRes.body.data.status).toBe('OPEN');
    const caseId = flagRes.body.data.id;

    const afterFlag = await getEligibility(learner.accessToken, courseId);
    expect(conditionSatisfied(afterFlag, 'noActiveMisconductInvestigation')).toBe(false);
    expect(afterFlag.eligible).toBe(false);

    const clearRes = await request(app)
      .post(`/api/v1/lms/admin/academic-integrity/cases/${caseId}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ outcome: 'CLEARED', reason: 'Reviewed — coincidental similarity, no violation.' });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.status).toBe('DISMISSED');

    const afterClear = await getEligibility(learner.accessToken, courseId);
    expect(conditionSatisfied(afterClear, 'noActiveMisconductInvestigation')).toBe(true);
  });

  it('a CONFIRMED case keeps eligibility blocked until a successful (OVERTURNED) appeal, discoverable via the learner\'s own case list', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Essay', submissionFormat: 'TEXT', allowedFileTypes: [], maxScore: 100, passingScore: 70, latePolicy: 'ACCEPT' });
    const assignmentId = assignmentRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/admin/assignments/${assignmentId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    const learner = await createUserWithRole(uniqueEmail('integrity-appeal-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My essay.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    const flagRes = await request(app)
      .post('/api/v1/lms/admin/academic-integrity/cases')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'PLAGIARISM', targetType: 'SUBMISSION', targetId: submissionId, reason: 'Matched an external source closely.' });
    const caseId = flagRes.body.data.id;

    const confirmRes = await request(app)
      .post(`/api/v1/lms/admin/academic-integrity/cases/${caseId}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ outcome: 'CONFIRMED', reason: 'Confirmed after review.' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('ACTION_TAKEN');

    expect(conditionSatisfied(await getEligibility(learner.accessToken, courseId), 'noActiveMisconductInvestigation')).toBe(false);

    // The learner discovers the case via their own case list (no other way to learn the caseId exists).
    const myCasesRes = await request(app).get('/api/v1/lms/me/academic-integrity/cases').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(myCasesRes.status).toBe(200);
    expect(myCasesRes.body.data.map((c: any) => c.id)).toContain(caseId);

    // Appeal submission reuses the EXISTING generic Trust & Safety endpoint — no new endpoint for this.
    const appealRes = await request(app)
      .post(`/api/v1/trust-safety/cases/${caseId}/appeal`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ statement: 'This was entirely my own original work.' });
    expect(appealRes.status).toBe(201);
    const appealId = appealRes.body.data.id;

    const resolveAppealRes = await request(app)
      .post(`/api/v1/lms/admin/academic-integrity/appeals/${appealId}/resolve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'OVERTURNED', resolutionNote: 'Re-reviewed — false positive.' });
    expect(resolveAppealRes.status).toBe(200);

    expect(conditionSatisfied(await getEligibility(learner.accessToken, courseId), 'noActiveMisconductInvestigation')).toBe(true);
  });

  it('flagging an already-issued Certificate auto-revokes it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(true);
    const learner = await createUserWithRole(uniqueEmail('integrity-cert-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const genRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.status).toBe('VALID');
    const certificateId = genRes.body.data.id;
    const credentialId = genRes.body.data.credentialId;

    const flagRes = await request(app)
      .post('/api/v1/lms/admin/academic-integrity/cases')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'CERTIFICATE_FRAUD', targetType: 'CERTIFICATE', targetId: certificateId, reason: 'Reported as fraudulently obtained.' });
    expect(flagRes.status).toBe(201);

    const verifyRes = await request(app).get(`/api/v1/lms/certificates/verify/${credentialId}`);
    expect(verifyRes.body.data.status).toBe('REVOKED');
  });
});
