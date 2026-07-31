/**
 * Real-database integration tests for 004-learning-management-system's
 * Broader Assessment Types batch (FR-068): the `Assignment.assessmentType`
 * field (STANDARD/SELF_ASSESSMENT/SKILL_RATING/SCENARIO_TASK/
 * PORTFOLIO_REVIEW), the learner-facing pre-submission overview (rubric
 * criteria exposure), the new self-assessment submit+outcome path, the
 * mutual-exclusion guards between it and the existing instructor-review
 * path, and the server-derived `outcomeLevel`. Same graceful-skip pattern
 * as the other integration suites — see docs/database/TESTING.md.
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
    .send({ name: 'Broader Assessment Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
let learner: { userId: string; accessToken: string };
let categoryId: string;

async function ensureFixtures() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('bat-admin'), 'platform_admin');
  if (!learner) learner = await createUserWithRole(uniqueEmail('bat-learner'), 'registered_free_user');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Broader Assessment Test Category', slug: uniqueSlug('bat-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED lesson, optionally with a given completionRuleType. */
async function createPublishedCourseWithLesson(completionRuleType = 'MANUAL') {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Broader Assessment Test Course',
      slug: uniqueSlug('bat-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('bat-lesson'), completionRuleType });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

/** Creates a published assignment of the given assessmentType with 2 rubric criteria (10 + 10 = 20 max points), passing score 12 (60%). */
async function createAssignmentWithRubric(lessonId: string, assessmentType: string, overrides: Record<string, unknown> = {}) {
  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Broader Assessment Item', submissionFormat: 'TEXT', maxScore: 20, passingScore: 12, latePolicy: 'ACCEPT', assessmentType, ...overrides });
  const assignmentId = assignmentRes.body.data.id;

  const c1 = await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Clarity', maxPoints: 10 });
  const c2 = await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Originality', maxPoints: 10 });

  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  return { assignmentId, criterionId1: c1.body.data.id, criterionId2: c2.body.data.id };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING broader-assessment-types.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING broader-assessment-types.integration.test.ts: could not reach PostgreSQL.');
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
    await db.submissionCriterionScore.deleteMany({});
    await db.submission.deleteMany({});
    await db.rubricCriterion.deleteMany({});
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

describe('Broader Assessment Types (FR-068)', () => {
  it('creates an assignment of each new assessmentType and persists it', async () => {
    if (skip()) return;
    await ensureFixtures();

    for (const assessmentType of ['SELF_ASSESSMENT', 'SKILL_RATING', 'SCENARIO_TASK', 'PORTFOLIO_REVIEW']) {
      const courseFixture = await createPublishedCourseWithLesson();
      const res = await request(app)
        .post(`/api/v1/lms/admin/lessons/${courseFixture.lessonId}/assignment`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ title: `${assessmentType} assignment`, submissionFormat: 'TEXT', assessmentType });
      expect(res.status).toBe(201);
      expect(res.body.data.assessmentType).toBe(assessmentType);
    }
  });

  it('defaults assessmentType to STANDARD when not supplied', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson();
    const res = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Default type assignment', submissionFormat: 'TEXT' });
    expect(res.status).toBe(201);
    expect(res.body.data.assessmentType).toBe('STANDARD');
  });

  it('exposes assessmentType and rubricCriteria via the learner-facing pre-submission overview', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createAssignmentWithRubric(lessonId, 'SKILL_RATING');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).get(`/api/v1/lms/me/assignments/${assignmentId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.assessmentType).toBe('SKILL_RATING');
    expect(res.body.data.rubricCriteria).toHaveLength(2);
    expect(res.body.data.rubricCriteria[0]).toEqual(expect.objectContaining({ title: 'Clarity', maxPoints: 10 }));
  });

  it('lets a learner self-assess a SKILL_RATING assignment: immediate APPROVED outcome with score/outcomeLevel/isSelfAssessed, no reviewer', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1, criterionId2 } = await createAssignmentWithRubric(lessonId, 'SKILL_RATING');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 9 }, { criterionId: criterionId2, pointsAwarded: 8 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.score).toBe(17);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.outcomeLevel).toBe('Advanced'); // 17/20 = 85%
    expect(res.body.data.isSelfAssessed).toBe(true);
    expect(res.body.data.criterionScores).toHaveLength(2);

    const db = getPrismaClient();
    const row = await db.submission.findUnique({ where: { id: submissionId } });
    expect(row.reviewerId).toBeNull();
    expect(row.reviewedAt).not.toBeNull();
  });

  it('computes a lower outcomeLevel for a lower self-assessed score', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1, criterionId2 } = await createAssignmentWithRubric(lessonId, 'SELF_ASSESSMENT');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 2 }, { criterionId: criterionId2, pointsAwarded: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(3);
    expect(res.body.data.passed).toBe(false); // 3 < passingScore 12
    expect(res.body.data.outcomeLevel).toBe('Beginner'); // 3/20 = 15%
  });

  it('rejects a self-assessment score exceeding a criterion max', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'SKILL_RATING');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 999 }] });
    expect(res.status).toBe(400);
  });

  it('rejects self-assessment on a STANDARD assignment', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'STANDARD');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 5 }] });
    expect(res.status).toBe(400);
  });

  it('rejects the normal submit endpoint for a SELF_ASSESSMENT assignment, pointing the learner at the self-assess endpoint', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createAssignmentWithRubric(lessonId, 'SELF_ASSESSMENT');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'irrelevant text' });

    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ declaredOriginal: true });
    expect(res.status).toBe(400);
  });

  it('rejects the instructor review endpoint for a SKILL_RATING assignment', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'SKILL_RATING');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 5 }] });

    const res = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'APPROVE', criterionScores: [] });
    expect(res.status).toBe(400);
  });

  it('SCENARIO_TASK keeps the full unchanged instructor-review flow, now also computing outcomeLevel on APPROVE', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1, criterionId2 } = await createAssignmentWithRubric(lessonId, 'SCENARIO_TASK');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My scenario response' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    const reviewRes = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'APPROVE', criterionScores: [{ criterionId: criterionId1, pointsAwarded: 6 }, { criterionId: criterionId2, pointsAwarded: 6 }] });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('APPROVED');
    expect(reviewRes.body.data.score).toBe(12);
    expect(reviewRes.body.data.outcomeLevel).toBe('Intermediate'); // 12/20 = 60%
    expect(reviewRes.body.data.isSelfAssessed).toBe(false);
  });

  it('a REQUEST_CHANGES decision leaves outcomeLevel null (no final outcome yet)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'PORTFOLIO_REVIEW');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ linkUrl: 'https://example.com/portfolio' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    const reviewRes = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'REQUEST_CHANGES', criterionScores: [{ criterionId: criterionId1, pointsAwarded: 3 }], learnerFeedback: 'Please add more detail.' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('CHANGES_REQUESTED');
    expect(reviewRes.body.data.outcomeLevel).toBeNull();
  });

  it('a self-assessment auto-completes the lesson when ASSIGNMENT_APPROVED is the completion rule', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson('ASSIGNMENT_APPROVED');
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'SELF_ASSESSMENT');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 10 }] });

    const progressRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressRes.status).toBe(200);

    const db = getPrismaClient();
    const enrollment = await db.enrollment.findFirst({ where: { userId: learner.userId, courseId } });
    const lessonProgress = await db.lessonProgress.findUnique({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } } });
    expect(lessonProgress?.status).toBe('COMPLETED');
  });

  it('denies an outsider (not the submission owner) from self-assessing another learner\'s submission — IDOR check', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId, 'SKILL_RATING');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;

    const outsider = await createUserWithRole(uniqueEmail('bat-outsider'), 'registered_free_user');
    const res = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/self-assess`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ criterionScores: [{ criterionId: criterionId1, pointsAwarded: 1 }] });
    expect(res.status).toBe(404);
  });
});
