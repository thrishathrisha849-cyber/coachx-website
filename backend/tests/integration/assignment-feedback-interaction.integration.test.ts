/**
 * Real-database integration tests for 004-learning-management-system's
 * Assignment Feedback Interaction batch (FR-078, T067): "learners MUST be
 * able to mark feedback as viewed, reply, resubmit, and request
 * clarification." Resubmit already existed (Assignment System batch); this
 * batch covers the other three plus the instructor-side response. Audio/
 * video/annotated-file feedback formats remain deliberately unbuilt (no
 * media/upload pipeline exists — see DECISION_GATES.md gate #31). Same
 * graceful-skip pattern as the other integration suites — see
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
    .send({ name: 'Feedback Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('feedback-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Feedback Test Category', slug: uniqueSlug('feedback-cat') });
    categoryId = res.body.data.id;
  }
}

async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Feedback Test Course', slug: uniqueSlug('feedback-course'), shortDescription: 'short', description: 'full description', categoryId, thumbnailUrl: 'https://example.com/thumb.jpg' });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lessonRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('feedback-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, lessonId };
}

async function createPublishedAssignment(lessonId: string) {
  const res = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Essay', submissionFormat: 'TEXT', maxScore: 10, passingScore: 6, latePolicy: 'ACCEPT' });
  const assignmentId = res.body.data.id;
  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
  return assignmentId;
}

/** Full happy-path setup: a learner submits, and an admin reviews it with learner-facing feedback — the state every feedback-interaction action requires. */
async function createReviewedSubmission(learnerAccessToken: string, assignmentId: string, decision: 'APPROVE' | 'REQUEST_CHANGES' = 'APPROVE') {
  const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learnerAccessToken}`);
  const submissionId = startRes.body.data.id;
  await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learnerAccessToken}`).send({ textBody: 'My essay text.' });
  await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learnerAccessToken}`).send({ declaredOriginal: true });
  await request(app)
    .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ decision, criterionScores: [], learnerFeedback: 'Please add a stronger conclusion.' });
  return submissionId;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING assignment-feedback-interaction.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING assignment-feedback-interaction.integration.test.ts: could not reach PostgreSQL.');
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
    await db.submissionFeedbackMessage.deleteMany({});
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

describe('Assignment Feedback Interaction (FR-078, T067)', () => {
  it('rejects marking feedback viewed, replying, and requesting clarification before the submission has been reviewed', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-early'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'Draft text.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    const viewedRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(viewedRes.status).toBe(400);

    const replyRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/reply`).set('Authorization', `Bearer ${learner.accessToken}`).send({ body: 'Too early' });
    expect(replyRes.status).toBe(400);

    const clarifyRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/clarify`).set('Authorization', `Bearer ${learner.accessToken}`).send({ body: 'Too early' });
    expect(clarifyRes.status).toBe(400);
  });

  it('marks feedback as viewed idempotently — a second call never overwrites the original timestamp', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-viewed'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(learner.accessToken, assignmentId);

    const first = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(first.status).toBe(200);
    expect(first.body.data.feedbackViewedAt).toBeTruthy();
    const firstTimestamp = first.body.data.feedbackViewedAt;

    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.status).toBe(200);
    expect(second.body.data.feedbackViewedAt).toBe(firstTimestamp);
  });

  it('replies to feedback and requests clarification, both retrievable via the messages endpoint in order', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-reply'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(learner.accessToken, assignmentId);

    const replyRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/reply`).set('Authorization', `Bearer ${learner.accessToken}`).send({ body: 'Thanks, will revise.' });
    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.type).toBe('REPLY');
    expect(replyRes.body.data.authorRole).toBe('LEARNER');

    const clarifyRes = await request(app)
      .post(`/api/v1/lms/me/submissions/${submissionId}/feedback/clarify`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ body: 'Which section needs the conclusion?' });
    expect(clarifyRes.status).toBe(201);
    expect(clarifyRes.body.data.type).toBe('CLARIFICATION_REQUEST');

    const listRes = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/feedback/messages`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);
    expect(listRes.body.data[0].type).toBe('REPLY');
    expect(listRes.body.data[1].type).toBe('CLARIFICATION_REQUEST');
  });

  it('lets an instructor respond, closing the loop, and both parties see the full thread', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-thread'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(learner.accessToken, assignmentId);

    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/clarify`).set('Authorization', `Bearer ${learner.accessToken}`).send({ body: 'Which section?' });

    const respondRes = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/feedback/respond`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ body: 'The final paragraph.' });
    expect(respondRes.status).toBe(201);
    expect(respondRes.body.data.authorRole).toBe('INSTRUCTOR');
    expect(respondRes.body.data.type).toBe('REPLY');

    const adminListRes = await request(app).get(`/api/v1/lms/admin/submissions/${submissionId}/feedback/messages`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminListRes.body.data).toHaveLength(2);

    const learnerListRes = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/feedback/messages`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(learnerListRes.body.data).toHaveLength(2);
    expect(learnerListRes.body.data[1].authorRole).toBe('INSTRUCTOR');
  });

  it('IDOR-safe: another learner cannot view, mark viewed, or reply to a submission that is not theirs', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const owner = await createUserWithRole(uniqueEmail('feedback-learner-owner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${owner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(owner.accessToken, assignmentId);

    const intruder = await createUserWithRole(uniqueEmail('feedback-learner-intruder'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${intruder.accessToken}`).send({ courseId: (await createPublishedCourseWithLesson()).courseId });

    const viewedRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/viewed`).set('Authorization', `Bearer ${intruder.accessToken}`);
    expect(viewedRes.status).toBe(404);

    const replyRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/reply`).set('Authorization', `Bearer ${intruder.accessToken}`).send({ body: 'Not mine' });
    expect(replyRes.status).toBe(404);

    const listRes = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/feedback/messages`).set('Authorization', `Bearer ${intruder.accessToken}`);
    expect(listRes.status).toBe(404);
  });

  it('RBAC: a learner without the manageModules permission tier cannot hit the instructor-side respond/list endpoints', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-rbac'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(learner.accessToken, assignmentId);

    const respondRes = await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/feedback/respond`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ body: 'Trying to respond as a learner' });
    expect(respondRes.status).toBe(403);

    const listRes = await request(app).get(`/api/v1/lms/admin/submissions/${submissionId}/feedback/messages`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.status).toBe(403);
  });

  it('rejects an empty-body reply/clarification/response with a validation error', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const assignmentId = await createPublishedAssignment(lessonId);
    const learner = await createUserWithRole(uniqueEmail('feedback-learner-empty'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const submissionId = await createReviewedSubmission(learner.accessToken, assignmentId);

    const replyRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/feedback/reply`).set('Authorization', `Bearer ${learner.accessToken}`).send({ body: '' });
    expect(replyRes.status).toBe(400);
  });
});
