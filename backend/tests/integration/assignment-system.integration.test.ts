/**
 * Real-database integration tests for 004-learning-management-system's
 * US4 Assignment System batch: admin assignment/rubric CRUD, the learner
 * submission flow (draft/save/submit/resubmit-history), late-policy
 * enforcement, reviewer rubric scoring + decision transitions, attempt-
 * limit enforcement on resubmission, historical-criterion integrity after
 * archival, idempotent submission, and ASSIGNMENT_APPROVED completion-rule
 * integration. Same graceful-skip pattern as the other integration suites
 * — see docs/database/TESTING.md.
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
    .send({ name: 'Assignment Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('assign-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Assignment Test Category', slug: uniqueSlug('assign-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED lesson, optionally with a given completionRuleType. */
async function createPublishedCourseWithLesson(completionRuleType = 'MANUAL') {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Assignment Test Course',
      slug: uniqueSlug('assign-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('assign-lesson'), completionRuleType });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

/** Creates a published assignment with 2 rubric criteria (10 + 10 = 20 max points), passing score 12 (60%). */
async function createAssignmentWithRubric(lessonId: string, overrides: Record<string, unknown> = {}) {
  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Business Plan Draft', submissionFormat: 'TEXT', maxScore: 20, passingScore: 12, latePolicy: 'ACCEPT', ...overrides });
  const assignmentId = assignmentRes.body.data.id;

  const c1 = await request(app)
    .post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Clarity', maxPoints: 10 });
  const c2 = await request(app)
    .post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Originality', maxPoints: 10 });

  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  return { assignmentId, criterionId1: c1.body.data.id, criterionId2: c2.body.data.id };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING assignment-system.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING assignment-system.integration.test.ts: could not reach PostgreSQL.');
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

describe('Admin assignment + rubric authoring', () => {
  it('rejects creating a lesson with a second assignment attached (1:1)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    await createAssignmentWithRubric(lessonId);

    const dup = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Second Assignment', submissionFormat: 'TEXT', maxScore: 100, passingScore: 70, latePolicy: 'ACCEPT' });
    expect(dup.status).toBe(409);
  });
});

describe('Learner submission flow — access, late policy, grading (004 US4)', () => {
  it('denies assignment access to a non-enrolled learner', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createAssignmentWithRubric(lessonId);
    const learner = await createUserWithRole(uniqueEmail('assign-learner-noaccess'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('saves a draft, submits on time, and the reviewer approving it grades correctly and drives ASSIGNMENT_APPROVED completion', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson('ASSIGNMENT_APPROVED');
    const { assignmentId, criterionId1, criterionId2 } = await createAssignmentWithRubric(lessonId);
    const learner = await createUserWithRole(uniqueEmail('assign-learner-approve'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('DRAFT');
    const submissionId = startRes.body.data.id;

    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My business plan draft.' });

    const submitRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('SUBMITTED');
    expect(submitRes.body.data.isLate).toBe(false);

    const reviewRes = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        decision: 'APPROVE',
        criterionScores: [
          { criterionId: criterionId1, pointsAwarded: 8 },
          { criterionId: criterionId2, pointsAwarded: 9 },
        ],
        learnerFeedback: 'Great work!',
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.score).toBe(17);
    expect(reviewRes.body.data.passed).toBe(true);
    expect(reviewRes.body.data.status).toBe('APPROVED');

    const curriculumRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(curriculumRes.body.data[0].lessons[0].status).toBe('COMPLETED');
  });

  it('flags a past-due submission as late when the late policy is ACCEPT', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const pastDue = new Date(Date.now() - 60_000).toISOString();
    const { assignmentId } = await createAssignmentWithRubric(lessonId, { dueAt: pastDue, latePolicy: 'ACCEPT' });
    const learner = await createUserWithRole(uniqueEmail('assign-learner-late-accept'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Late but submitted.' });

    const submitRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.isLate).toBe(true);
  });

  it('blocks a past-due submission entirely when the late policy is REJECT', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const pastDue = new Date(Date.now() - 60_000).toISOString();
    const { assignmentId } = await createAssignmentWithRubric(lessonId, { dueAt: pastDue, latePolicy: 'REJECT' });
    const learner = await createUserWithRole(uniqueEmail('assign-learner-late-reject'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Too late.' });

    const submitRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.status).toBe(400);
  });

  it('preserves the previous submission when a resubmission is created after CHANGES_REQUESTED, and enforces the attempt limit', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createAssignmentWithRubric(lessonId, { maxAttempts: 2 });
    const learner = await createUserWithRole(uniqueEmail('assign-learner-resubmit'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const firstStart = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const firstId = firstStart.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${firstId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'First attempt.' });
    await request(app).post(`/api/v1/lms/me/submissions/${firstId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    await request(app).post(`/api/v1/lms/admin/submissions/${firstId}/review`).set('Authorization', `Bearer ${admin.accessToken}`).send({
      decision: 'REQUEST_CHANGES',
      criterionScores: [],
      learnerFeedback: 'Please add more detail.',
    });

    const secondStart = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(secondStart.status).toBe(200);
    expect(secondStart.body.data.id).not.toBe(firstId);
    expect(secondStart.body.data.attemptNumber).toBe(2);

    const history = await request(app).get(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data.find((s: any) => s.id === firstId).status).toBe('CHANGES_REQUESTED');

    // maxAttempts=2 already reached (2 rows exist) — a further resubmission after another CHANGES_REQUESTED must be blocked.
    await request(app).patch(`/api/v1/lms/me/submissions/${secondStart.body.data.id}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Second attempt.' });
    await request(app).post(`/api/v1/lms/me/submissions/${secondStart.body.data.id}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app).post(`/api/v1/lms/admin/submissions/${secondStart.body.data.id}/review`).set('Authorization', `Bearer ${admin.accessToken}`).send({
      decision: 'REQUEST_CHANGES',
      criterionScores: [],
    });

    const thirdStart = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(thirdStart.status).toBe(409);
    expect(thirdStart.body.error.code).toBe('ASSIGNMENT_ATTEMPT_LIMIT_REACHED');
  });

  it('keeps a historical submission review interpretable after its scored criterion is archived', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId1 } = await createAssignmentWithRubric(lessonId);
    const learner = await createUserWithRole(uniqueEmail('assign-learner-archived-criterion'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Work.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    await request(app).post(`/api/v1/lms/admin/submissions/${submissionId}/review`).set('Authorization', `Bearer ${admin.accessToken}`).send({
      decision: 'APPROVE',
      criterionScores: [{ criterionId: criterionId1, pointsAwarded: 10 }],
    });

    await request(app).post(`/api/v1/lms/admin/criteria/${criterionId1}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);

    const detailRes = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.criterionScores[0].criterionTitle).toBe('Clarity');
    expect(detailRes.body.data.criterionScores[0].pointsAwarded).toBe(10);
  });

  it('is idempotent — resubmitting an already-submitted draft returns the same result without a duplicate', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createAssignmentWithRubric(lessonId);
    const learner = await createUserWithRole(uniqueEmail('assign-learner-idempotent'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Work.' });

    const first = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    const second = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.body.data).toEqual(first.body.data);
  });

  it('rejecting a submission records a failed passed=false state without triggering completion', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson('ASSIGNMENT_APPROVED');
    const { assignmentId, criterionId1, criterionId2 } = await createAssignmentWithRubric(lessonId);
    const learner = await createUserWithRole(uniqueEmail('assign-learner-reject'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Not good enough.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    const reviewRes = await request(app).post(`/api/v1/lms/admin/submissions/${submissionId}/review`).set('Authorization', `Bearer ${admin.accessToken}`).send({
      decision: 'REJECT',
      criterionScores: [
        { criterionId: criterionId1, pointsAwarded: 2 },
        { criterionId: criterionId2, pointsAwarded: 1 },
      ],
    });
    expect(reviewRes.body.data.status).toBe('REJECTED');
    expect(reviewRes.body.data.passed).toBe(false);

    const curriculumRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(curriculumRes.body.data[0].lessons[0].status).toBe('NOT_STARTED');
  });
});
