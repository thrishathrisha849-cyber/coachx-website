/**
 * Real-database integration tests for 004-learning-management-system's
 * US3 Quiz System batch: admin quiz/question CRUD, the learner attempt
 * flow (start/resume/answer/submit), server-side grading across every
 * question type, attempt-limit enforcement, timer-expiry auto-submit,
 * historical-attempt integrity after a question is archived, idempotent
 * submission, and QUIZ_PASS completion-rule integration. Same graceful-
 * skip pattern as the other integration suites — see docs/database/TESTING.md.
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
    .send({ name: 'Quiz Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('quiz-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Quiz Test Category', slug: uniqueSlug('quiz-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED lesson, optionally with a given completionRuleType. Returns ids needed by every scenario. */
async function createPublishedCourseWithLesson(completionRuleType = 'MANUAL') {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Quiz Test Course',
      slug: uniqueSlug('quiz-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('quiz-lesson'), completionRuleType });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

/** Creates a published quiz with one of each supported question type — 1 point single-choice, 1 point multi-choice, 1 point true/false, 1 point short-answer, 1 point numeric = 5 points total. */
async function createFullQuiz(lessonId: string) {
  const quizRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Full Quiz', quizType: 'GRADED', passingScorePercent: 60, maxAttempts: null, timeLimitMinutes: null });
  const quizId = quizRes.body.data.id;

  const singleRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'SINGLE_CHOICE', prompt: 'Capital of India?', points: 1, options: [{ text: 'Mumbai', isCorrect: false }, { text: 'Delhi', isCorrect: true }] });

  const multiRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      type: 'MULTIPLE_CHOICE',
      prompt: 'Pick prime numbers',
      points: 1,
      options: [{ text: '2', isCorrect: true }, { text: '3', isCorrect: true }, { text: '4', isCorrect: false }],
    });

  const tfRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'TRUE_FALSE', prompt: 'The sky is blue', points: 1, options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] });

  const shortRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'SHORT_ANSWER', prompt: 'Capital of France?', points: 1, answerKey: { acceptedAnswers: ['Paris'] } });

  const numericRes = await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'NUMERIC', prompt: '2 + 2 =', points: 1, answerKey: { correctValue: 4, tolerance: 0 } });

  await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  return {
    quizId,
    singleId: singleRes.body.data.id,
    singleOptions: singleRes.body.data.options,
    multiId: multiRes.body.data.id,
    multiOptions: multiRes.body.data.options,
    tfId: tfRes.body.data.id,
    tfOptions: tfRes.body.data.options,
    shortId: shortRes.body.data.id,
    numericId: numericRes.body.data.id,
  };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING quiz-system.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING quiz-system.integration.test.ts: could not reach PostgreSQL.');
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
    await db.quizAnswer.deleteMany({});
    await db.quizAttempt.deleteMany({});
    await db.questionOption.deleteMany({});
    await db.question.deleteMany({});
    await db.quiz.deleteMany({});
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

describe('Admin quiz + question authoring', () => {
  it('rejects publishing a quiz with zero questions, then allows it once a question exists', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();

    const quizRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Empty Quiz', quizType: 'GRADED', passingScorePercent: 70 });
    const quizId = quizRes.body.data.id;

    const tooEarly = await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(tooEarly.status).toBe(400);

    await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'SINGLE_CHOICE', prompt: 'Q1', points: 1, options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] });

    const nowOk = await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(nowOk.status).toBe(200);
  });

  it('rejects creating a lesson with a second quiz attached (1:1)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    await createFullQuiz(lessonId);

    const dup = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Second Quiz', quizType: 'GRADED', passingScorePercent: 70 });
    expect(dup.status).toBe(409);
  });
});

describe('Learner attempt flow — access, grading, pass/fail (004 US3)', () => {
  it('denies quiz access to a non-enrolled learner', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const { quizId } = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-noaccess'), 'registered_free_user');

    const res = await request(app).get(`/api/v1/lms/me/quizzes/${quizId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('never exposes correct answers before grading, then grades every question type correctly and reports the right score/pass state', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-pass'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(startRes.status).toBe(200);
    const attemptId = startRes.body.data.id;
    expect(startRes.body.data.status).toBe('IN_PROGRESS');
    // Never leaks correctness pre-grading.
    for (const question of startRes.body.data.questions) {
      expect(question).not.toHaveProperty('isCorrect');
      for (const opt of question.options ?? []) expect(opt).not.toHaveProperty('isCorrect');
    }

    const correctSingleId = q.singleOptions.find((o: any) => o.isCorrect).id;
    const correctMultiIds = q.multiOptions.filter((o: any) => o.isCorrect).map((o: any) => o.id);
    const correctTfId = q.tfOptions.find((o: any) => o.isCorrect).id;

    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.singleId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctSingleId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.multiId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: correctMultiIds });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.tfId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctTfId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.shortId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ answerText: 'paris' }); // case-insensitive match
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.numericId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ answerText: '4' });

    const submitRes = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.pointsEarned).toBe(5);
    expect(submitRes.body.data.pointsPossible).toBe(5);
    expect(submitRes.body.data.scorePercent).toBe(100);
    expect(submitRes.body.data.passed).toBe(true);

    const reviewRes = await request(app).get(`/api/v1/lms/me/quiz-attempts/${attemptId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(reviewRes.body.data.reviewVisible).toBe(true);
    expect(reviewRes.body.data.questions.every((qq: any) => qq.isCorrect === true)).toBe(true);
  });

  it('fails a learner who gets every question wrong, correctly computing a 0% score', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-fail'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;

    const wrongSingleId = q.singleOptions.find((o: any) => !o.isCorrect).id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.singleId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [wrongSingleId] });
    // Leave every other question unanswered — must count as incorrect, not skipped from scoring.

    const submitRes = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.body.data.pointsEarned).toBe(0);
    expect(submitRes.body.data.pointsPossible).toBe(5);
    expect(submitRes.body.data.scorePercent).toBe(0);
    expect(submitRes.body.data.passed).toBe(false);
  });

  it('resumes the SAME in-progress attempt rather than starting a second one', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-resume'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const first = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const second = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(second.body.data.attemptNumber).toBe(1);
  });

  it('blocks a new attempt once maxAttempts is reached, with QUIZ_ATTEMPT_LIMIT_REACHED', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    await request(app).patch(`/api/v1/lms/admin/quizzes/${q.quizId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ maxAttempts: 1 });

    const learner = await createUserWithRole(uniqueEmail('quiz-learner-limit'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const attempt1 = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attempt1.body.data.id}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    const attempt2 = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(attempt2.status).toBe(409);
    expect(attempt2.body.error.code).toBe('QUIZ_ATTEMPT_LIMIT_REACHED');
  });

  it('auto-submits and scores a timer-expired attempt rather than losing it (FR-063 acceptance scenario 1)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-timer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;

    const correctSingleId = q.singleOptions.find((o: any) => o.isCorrect).id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.singleId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctSingleId] });

    const db = getPrismaClient();
    await db.quizAttempt.update({ where: { id: attemptId }, data: { expiresAt: new Date(Date.now() - 60_000) } });

    const res = await request(app).get(`/api/v1/lms/me/quiz-attempts/${attemptId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.body.data.status).toBe('GRADED');
    expect(res.body.data.pointsEarned).toBe(1); // only the one answered (and correct) question counts
  });

  it('keeps a historical attempt interpretable after its question is archived post-attempt (FR-066 edge case)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-archived-q'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;
    const correctSingleId = q.singleOptions.find((o: any) => o.isCorrect).id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.singleId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctSingleId] });

    // Question archived AFTER the learner already answered it, BEFORE submission.
    await request(app).post(`/api/v1/lms/admin/questions/${q.singleId}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);

    const submitRes = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(submitRes.status).toBe(200);
    // The archived-but-answered question still contributes correctly; the 4 untouched PUBLISHED questions also count as possible (unanswered = incorrect).
    expect(submitRes.body.data.pointsPossible).toBe(5);
    expect(submitRes.body.data.pointsEarned).toBe(1);
  });

  it('is idempotent — resubmitting an already-graded attempt returns the same result without re-grading', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-idempotent'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;

    const first = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    const second = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.body.data).toEqual(first.body.data);
  });
});

describe('QUIZ_PASS lesson-completion integration', () => {
  it('completes a QUIZ_PASS lesson only once the learner passes the attached quiz', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson('QUIZ_PASS');
    const q = await createFullQuiz(lessonId);
    const learner = await createUserWithRole(uniqueEmail('quiz-learner-completion'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const beforeCurriculum = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(beforeCurriculum.body.data[0].lessons[0].status).toBe('NOT_STARTED');

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${q.quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;
    const correctSingleId = q.singleOptions.find((o: any) => o.isCorrect).id;
    const correctMultiIds = q.multiOptions.filter((o: any) => o.isCorrect).map((o: any) => o.id);
    const correctTfId = q.tfOptions.find((o: any) => o.isCorrect).id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.singleId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctSingleId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.multiId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: correctMultiIds });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.tfId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [correctTfId] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.shortId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ answerText: 'Paris' });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${q.numericId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ answerText: '4' });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    const afterCurriculum = await request(app).get(`/api/v1/lms/me/courses/${courseId}/curriculum`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterCurriculum.body.data[0].lessons[0].status).toBe('COMPLETED');
  });
});
