/**
 * Real-database integration tests for 004-learning-management-system's
 * Learning Streak batch (T042, FR-057): the four admin-configurable
 * qualifying actions (lesson complete, quiz pass, assignment submission,
 * minimum daily learning time), timezone-aware day-boundary computation,
 * the optional grace period, and — the actual point of FR-057's "MUST NOT
 * allow artificial engagement manipulation" clause — that an admin/
 * instructor override completion NEVER advances a learner's streak. Same
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
    .send({ name: 'Streak Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('streak-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Streak Test Category', slug: uniqueSlug('streak-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course, one published mandatory module + lesson, a published TRUE_FALSE quiz on that lesson, and a published assignment on a second lesson. */
async function createCourseWithQuizAndAssignment() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Streak Course', slug: uniqueSlug('streak-course'), shortDescription: 'short', description: 'full description', categoryId, thumbnailUrl: 'https://example.com/thumb.jpg' });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lesson1Res = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 1', slug: uniqueSlug('streak-lesson-1') });
  const lesson1Id = lesson1Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lesson1Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lesson2Res = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 2', slug: uniqueSlug('streak-lesson-2') });
  const lesson2Id = lesson2Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lesson2Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lesson3Res = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Lesson 3', slug: uniqueSlug('streak-lesson-3') });
  const lesson3Id = lesson3Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lesson3Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const quizRes = await request(app).post(`/api/v1/lms/admin/lessons/${lesson2Id}/quiz`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Quiz 1', passingScorePercent: 50 });
  const quizId = quizRes.body.data.id;
  const questionRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'TRUE_FALSE', prompt: 'Is this true?', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] });
  const questionId = questionRes.body.data.id;
  const correctOptionId = questionRes.body.data.options.find((o: any) => o.isCorrect).id;
  const wrongOptionId = questionRes.body.data.options.find((o: any) => !o.isCorrect).id;
  await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lesson3Id}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Assignment 1', submissionFormat: 'TEXT', maxScore: 10, passingScore: 6, latePolicy: 'ACCEPT', dueAt: new Date(Date.now() + 86_400_000).toISOString() });
  const assignmentId = assignmentRes.body.data.id;
  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lesson1Id, lesson2Id, lesson3Id, quizId, questionId, correctOptionId, wrongOptionId, assignmentId };
}

async function patchStreakSettings(patch: Record<string, unknown>) {
  const res = await request(app).patch('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`).send(patch);
  expect(res.status).toBe(200);
  return res.body.data;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learning-streak.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learning-streak.integration.test.ts: could not reach PostgreSQL.');
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
    await db.learningStreak.deleteMany({});
    await db.submissionCriterionScore.deleteMany({});
    await db.submission.deleteMany({});
    await db.assignment.deleteMany({});
    await db.quizAnswer.deleteMany({});
    await db.quizAttempt.deleteMany({});
    await db.questionOption.deleteMany({});
    await db.question.deleteMany({});
    await db.quiz.deleteMany({});
    await db.completionOverride.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.lesson.deleteMany({});
    await db.courseModule.deleteMany({});
    await db.course.deleteMany({});
    await db.courseCategory.deleteMany({});
    // Reset the global settings row's streak fields back to defaults so later test runs aren't affected by an earlier run's edits.
    await db.lmsSettings.updateMany({
      data: {
        streakQualifyLessonComplete: true,
        streakQualifyQuizComplete: true,
        streakQualifyAssignmentActivity: false,
        streakQualifyMinLearningTime: false,
        streakMinLearningTimeMinutes: 10,
        streakTimezone: 'UTC',
        streakGraceDays: 0,
      },
    });
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

describe('Learning Streak (T042, FR-057)', () => {
  it('GET /me/streak reports zeros for a learner with no activity, without creating a row', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-zero'), 'registered_free_user');

    const res = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });

    const db = getPrismaClient();
    const row = await db.learningStreak.findUnique({ where: { userId: learner.userId } });
    expect(row).toBeNull();
  });

  it('completing a lesson as the learner starts a 1-day streak', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lesson1Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-lesson'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const completeRes = await request(app).post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(completeRes.status).toBe(200);

    const streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1);
    expect(streakRes.body.data.longestStreakDays).toBe(1);
    expect(streakRes.body.data.lastQualifyingDate).toBeTruthy();
  });

  it('an admin override mark-complete does NOT advance the learner streak (anti-manipulation, FR-057)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lesson1Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-override'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const overrideRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollRes.body.data.id}/complete`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ scope: 'LESSON', targetId: lesson1Id, reason: 'Verified via live class attendance' });
    expect(overrideRes.status).toBe(200);

    const streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(0);
  });

  it('completing the same lesson twice in one day does not inflate the streak beyond 1', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lesson1Id, lesson2Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-dup'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    // Completing an already-completed lesson is a no-op; complete a SECOND lesson on the SAME day to prove the streak still only moved once.
    await request(app).post(`/api/v1/lms/me/lessons/${lesson2Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1);
  });

  it('a gap larger than the grace period resets the streak to 1 rather than continuing', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await patchStreakSettings({ streakQualifyLessonComplete: true, streakQualifyQuizComplete: true, streakQualifyAssignmentActivity: false, streakQualifyMinLearningTime: false, streakGraceDays: 0 });
    const { courseId, lesson1Id, lesson2Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-gap'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    // Simulate 3 real days having passed by backdating lastQualifyingDate directly (no grace configured — default 0).
    const db = getPrismaClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    await db.learningStreak.update({ where: { userId: learner.userId }, data: { lastQualifyingDate: new Date(`${threeDaysAgo}T00:00:00.000Z`), currentStreakDays: 5, longestStreakDays: 5 } });

    await request(app).post(`/api/v1/lms/me/lessons/${lesson2Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1);
    expect(streakRes.body.data.longestStreakDays).toBe(5); // longest is never lowered
  });

  it('a gap within the configured grace period continues the streak instead of resetting it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    // Explicit full block (not a bare partial patch) so this test's outcome
    // never depends on what an earlier test in this file left configured.
    await patchStreakSettings({ streakQualifyLessonComplete: true, streakQualifyQuizComplete: true, streakQualifyAssignmentActivity: false, streakQualifyMinLearningTime: false, streakGraceDays: 2 });
    const { courseId, lesson1Id, lesson2Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-grace'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    // 2 missed days, grace budget is 2 — should NOT reset.
    const db = getPrismaClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    await db.learningStreak.update({ where: { userId: learner.userId }, data: { lastQualifyingDate: new Date(`${threeDaysAgo}T00:00:00.000Z`), currentStreakDays: 4, longestStreakDays: 4 } });

    await request(app).post(`/api/v1/lms/me/lessons/${lesson2Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(5);
  });

  it('passing a quiz counts as a qualifying action; failing it does not', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await patchStreakSettings({ streakQualifyLessonComplete: true, streakQualifyQuizComplete: true, streakQualifyAssignmentActivity: false, streakQualifyMinLearningTime: false, streakGraceDays: 0 });
    const { courseId, quizId, questionId, correctOptionId, wrongOptionId } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-quiz-fail'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const attemptRes = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = attemptRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [wrongOptionId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    let streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(0); // failed — no streak

    const attempt2Res = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attempt2Id = attempt2Res.body.data.id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attempt2Id}/answers/${questionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctOptionId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attempt2Id}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1); // passed — now qualifies
  });

  it('submitting an assignment counts as a qualifying action only when the admin has enabled it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await patchStreakSettings({ streakQualifyLessonComplete: true, streakQualifyQuizComplete: true, streakQualifyAssignmentActivity: false, streakQualifyMinLearningTime: false, streakGraceDays: 0 });
    const { courseId, assignmentId } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-assignment'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My submission text.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    let streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(0); // disabled by default

    await patchStreakSettings({ streakQualifyAssignmentActivity: true });

    // A fresh assignment/submission is needed since the first was already submitted; reuse createCourseWithQuizAndAssignment's assignment via a second course to keep this isolated.
    const { courseId: courseId2, assignmentId: assignmentId2 } = await createCourseWithQuizAndAssignment();
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId: courseId2 });
    const startRes2 = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId2}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId2 = startRes2.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId2}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My second submission text.' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId2}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });

    streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1);
  });

  it('crossing the admin-configured minimum daily learning time qualifies the streak', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await patchStreakSettings({ streakQualifyMinLearningTime: true, streakMinLearningTimeMinutes: 1, streakQualifyLessonComplete: false, streakQualifyQuizComplete: false, streakQualifyAssignmentActivity: false, streakGraceDays: 0 });
    const { courseId, lesson1Id } = await createCourseWithQuizAndAssignment();
    const learner = await createUserWithRole(uniqueEmail('streak-learner-time'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const firstPing = await request(app)
      .post(`/api/v1/lms/me/lessons/${lesson1Id}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ timeSpentDeltaSeconds: 30, watchedPercent: 10 });
    expect(firstPing.status).toBe(200);

    let streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(0); // only 30s of a 60s threshold so far

    const secondPing = await request(app)
      .post(`/api/v1/lms/me/lessons/${lesson1Id}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ timeSpentDeltaSeconds: 30, watchedPercent: 20 });
    expect(secondPing.status).toBe(200);

    streakRes = await request(app).get('/api/v1/lms/me/streak').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(streakRes.body.data.currentStreakDays).toBe(1); // 30 + 30 = 60s, crosses the 1-minute threshold
  });

  it('admin can update and read back the Learning Streak settings via /admin/settings (FR-057)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const updated = await patchStreakSettings({ streakTimezone: 'Asia/Kolkata', streakGraceDays: 3, streakMinLearningTimeMinutes: 15 });
    expect(updated.streakTimezone).toBe('Asia/Kolkata');
    expect(updated.streakGraceDays).toBe(3);
    expect(updated.streakMinLearningTimeMinutes).toBe(15);

    const getRes = await request(app).get('/api/v1/lms/admin/settings').set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getRes.body.data.streakTimezone).toBe('Asia/Kolkata');
  });
});
