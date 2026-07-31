/**
 * Real-database integration tests for 004-learning-management-system's
 * Learning Analytics & At-Risk Detection batch: FR-109's LMS analytics
 * event taxonomy (emitted at every real action point), FR-105 single-
 * learner analytics, FR-106 course-level analytics, FR-107 per-lesson
 * analytics, and FR-108 at-risk detection. Same graceful-skip pattern as
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
    .send({ name: 'Analytics Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('analytics-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Analytics Test Category', slug: uniqueSlug('analytics-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED lesson, optionally attaching a quiz. */
async function createPublishedCourseWithLesson(opts: { completionRuleType?: string; withQuiz?: boolean; maxAttempts?: number } = {}) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Analytics Test Course',
      slug: uniqueSlug('analytics-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('analytics-lesson'), completionRuleType: opts.completionRuleType ?? 'MANUAL' });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  let quizId: string | undefined;
  let questionId: string | undefined;
  if (opts.withQuiz) {
    const quizRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Analytics Quiz', passingScorePercent: 70, maxAttempts: opts.maxAttempts ?? 3 });
    quizId = quizRes.body.data.id;
    const questionRes = await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'TRUE_FALSE', prompt: 'Is this correct?', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] });
    questionId = questionRes.body.data.id;
    await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
  }

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId, quizId, questionId };
}

async function addPublishedActivity(lessonId: string, type: 'VIDEO' | 'DOWNLOAD') {
  const res = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type, mediaUrl: 'https://example.com/media.mp4' });
  const activityId = res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/activities/${activityId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
  return activityId as string;
}

async function passQuiz(accessToken: string, quizId: string, questionId: string) {
  const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${accessToken}`);
  const attemptId = startRes.body.data.id;
  const question = startRes.body.data.questions.find((q: any) => q.id === questionId);
  const correctOptionId = question.options.find((o: any) => o.text === 'True').id;
  await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`).set('Authorization', `Bearer ${accessToken}`).send({ selectedOptionIds: [correctOptionId] });
  const submitRes = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${accessToken}`);
  return submitRes.body.data;
}

async function failQuiz(accessToken: string, quizId: string, questionId: string) {
  const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${accessToken}`);
  const attemptId = startRes.body.data.id;
  await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`).set('Authorization', `Bearer ${accessToken}`).send({ selectedOptionIds: [] });
  const submitRes = await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${accessToken}`);
  return submitRes.body.data;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learning-analytics.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learning-analytics.integration.test.ts: could not reach PostgreSQL.');
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
    await db.certificate.deleteMany({});
    await db.submissionCriterionScore.deleteMany({});
    await db.submission.deleteMany({});
    await db.rubricCriterion.deleteMany({});
    await db.assignment.deleteMany({});
    await db.quizAnswer.deleteMany({});
    await db.quizAttempt.deleteMany({});
    await db.questionOption.deleteMany({});
    await db.question.deleteMany({});
    await db.quiz.deleteMany({});
    await db.activityProgress.deleteMany({});
    await db.learningActivity.deleteMany({});
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

describe('FR-109 LMS analytics event taxonomy', () => {
  it('emits COURSE_VIEWED, COURSE_ENROLLED, LESSON_VIEWED, COURSE_STARTED, VIDEO_STARTED, VIDEO_PROGRESSED, RESOURCE_DOWNLOADED, LESSON_COMPLETED, and COURSE_COMPLETED at their real action points', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const downloadActivityId = await addPublishedActivity(lessonId, 'DOWNLOAD');
    await addPublishedActivity(lessonId, 'VIDEO');
    const learner = await createUserWithRole(uniqueEmail('analytics-events-learner'), 'registered_free_user');

    const courseAdminRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    const courseSlug = courseAdminRes.body.data.slug;
    await request(app).get(`/api/v1/lms/courses/${courseSlug}`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ watchedPercent: 20, lastPosition: { kind: 'video', positionSeconds: 5 } });
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ watchedPercent: 80, lastPosition: { kind: 'video', positionSeconds: 50 } });
    await request(app).post(`/api/v1/lms/me/activities/${downloadActivityId}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const db = getPrismaClient();
    const events = await db.learningEvent.findMany({ where: { userId: learner.userId, courseId } });
    const eventTypes = new Set(events.map((e: any) => e.eventType));

    for (const expected of [
      'COURSE_VIEWED',
      'COURSE_ENROLLED',
      'LESSON_VIEWED',
      'COURSE_STARTED',
      'VIDEO_STARTED',
      'VIDEO_PROGRESSED',
      'RESOURCE_DOWNLOADED',
      'LESSON_COMPLETED',
      'COURSE_COMPLETED',
    ]) {
      expect(eventTypes.has(expected)).toBe(true);
    }
  });

  it('emits QUIZ_STARTED/QUIZ_SUBMITTED/QUIZ_FAILED on a failed attempt and QUIZ_STARTED/QUIZ_SUBMITTED/QUIZ_PASSED on a passed attempt', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId, questionId } = await createPublishedCourseWithLesson({ withQuiz: true, maxAttempts: 3 });
    const learner = await createUserWithRole(uniqueEmail('analytics-quiz-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await failQuiz(learner.accessToken, quizId!, questionId!);
    await passQuiz(learner.accessToken, quizId!, questionId!);

    const db = getPrismaClient();
    const events = await db.learningEvent.findMany({ where: { userId: learner.userId, courseId } });
    const eventTypes = events.map((e: any) => e.eventType);

    expect(eventTypes.filter((t: string) => t === 'QUIZ_STARTED')).toHaveLength(2);
    expect(eventTypes.filter((t: string) => t === 'QUIZ_SUBMITTED')).toHaveLength(2);
    expect(eventTypes).toContain('QUIZ_FAILED');
    expect(eventTypes).toContain('QUIZ_PASSED');
  });

  it('emits ASSIGNMENT_STARTED/ASSIGNMENT_SUBMITTED/ASSIGNMENT_REVIEWED and CERTIFICATE_ISSUED', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ certificateAvailable: true });

    const assignmentRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Analytics Assignment', submissionFormat: 'TEXT', maxScore: 10, passingScore: 6, latePolicy: 'ACCEPT' });
    const assignmentId = assignmentRes.body.data.id;
    const criterionRes = await request(app)
      .post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Quality', maxPoints: 10 });
    const criterionId = criterionRes.body.data.id;
    await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const learner = await createUserWithRole(uniqueEmail('analytics-assignment-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${learner.accessToken}`);
    const submissionId = startRes.body.data.id;
    await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ textBody: 'My work' });
    await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`).send({ declaredOriginal: true });
    await request(app)
      .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'APPROVE', criterionScores: [{ criterionId, pointsAwarded: 10 }] });

    await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);

    const db = getPrismaClient();
    const events = await db.learningEvent.findMany({ where: { userId: learner.userId, courseId } });
    const eventTypes = new Set(events.map((e: any) => e.eventType));
    expect(eventTypes.has('ASSIGNMENT_STARTED')).toBe(true);
    expect(eventTypes.has('ASSIGNMENT_SUBMITTED')).toBe(true);
    expect(eventTypes.has('ASSIGNMENT_REVIEWED')).toBe(true);
    expect(eventTypes.has('CERTIFICATE_ISSUED')).toBe(true);
  });
});

describe('FR-105 single-learner analytics', () => {
  it('reflects real progress, a passed quiz, and an issued certificate for one enrollment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId, quizId, questionId } = await createPublishedCourseWithLesson({ completionRuleType: 'QUIZ_PASS', withQuiz: true, maxAttempts: 2 });
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ certificateAvailable: true });

    const learner = await createUserWithRole(uniqueEmail('analytics-fr105-learner'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    await passQuiz(learner.accessToken, quizId!, questionId!);
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${learner.accessToken}`);

    const res = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/analytics`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.courseId).toBe(courseId);
    expect(res.body.data.progressPercent).toBe(100);
    expect(res.body.data.lessonsCompleted).toBe(1);
    expect(res.body.data.quizAttempts).toHaveLength(1);
    expect(res.body.data.quizAttempts[0].passed).toBe(true);
    expect(res.body.data.certificateIssued).toBe(true);
    expect(res.body.data.certificateCredentialId).not.toBeNull();
    expect(res.body.data.atRiskScore).toBe(0);
    expect(res.body.data.attendance).toBeNull();
    expect(res.body.data.notApplicable).toEqual(['attendance']);
    expect(lessonId).toBeTruthy();
  });
});

describe('FR-106 course-level analytics', () => {
  it('aggregates enrollments, completion rate, active learners, quiz pass rate, and certificate rate from real per-learner outcomes', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId, questionId } = await createPublishedCourseWithLesson({ completionRuleType: 'QUIZ_PASS', withQuiz: true, maxAttempts: 3 });
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ certificateAvailable: true });

    const passer = await createUserWithRole(uniqueEmail('analytics-fr106-passer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${passer.accessToken}`).send({ courseId });
    await passQuiz(passer.accessToken, quizId!, questionId!);
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/certificate`).set('Authorization', `Bearer ${passer.accessToken}`);

    const failer = await createUserWithRole(uniqueEmail('analytics-fr106-failer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${failer.accessToken}`).send({ courseId });
    await failQuiz(failer.accessToken, quizId!, questionId!);
    await failQuiz(failer.accessToken, quizId!, questionId!);

    const res = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/analytics`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enrollments).toBe(2);
    expect(res.body.data.activeLearners).toBe(1);
    expect(res.body.data.completionRate).toBe(50);
    expect(res.body.data.quizPassRate).toBe(33);
    expect(res.body.data.certificateRate).toBe(100);
    expect(res.body.data.assignmentApprovalRate).toBe(0);
    // 004 PiP + Video Playback Telemetry batch (FR-040): `deviceDistribution`
    // is no longer "not applicable" — it's now real (if `null` when no
    // playback telemetry exists yet, which is the case for this scenario's
    // learners, none of whom posted playback telemetry).
    expect(res.body.data.notApplicable).toEqual(['refundCorrelation', 'languageDistribution']);
    expect(res.body.data.deviceDistribution).toBeNull();
  });
});

describe('FR-107 per-lesson analytics', () => {
  it('counts views, unique learners, starts/completes, and resource downloads from real events and progress rows', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const downloadActivityId = await addPublishedActivity(lessonId, 'DOWNLOAD');

    const viewerCompleter = await createUserWithRole(uniqueEmail('analytics-fr107-completer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${viewerCompleter.accessToken}`).send({ courseId });
    await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${viewerCompleter.accessToken}`);
    await request(app).post(`/api/v1/lms/me/activities/${downloadActivityId}/viewed`).set('Authorization', `Bearer ${viewerCompleter.accessToken}`);
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${viewerCompleter.accessToken}`);

    const viewerOnly = await createUserWithRole(uniqueEmail('analytics-fr107-viewer'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${viewerOnly.accessToken}`).send({ courseId });
    await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${viewerOnly.accessToken}`);

    const res = await request(app).get(`/api/v1/lms/admin/lessons/${lessonId}/analytics`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.views).toBe(2);
    expect(res.body.data.uniqueLearners).toBe(2);
    expect(res.body.data.starts).toBe(1);
    expect(res.body.data.completes).toBe(1);
    expect(res.body.data.resourceDownloads).toBe(1);
    expect(res.body.data.notApplicable).toEqual(['dropOffTimestamp', 'replays', 'notesCreated', 'discussionActivity', 'errorRate']);
  });
});

describe('FR-108 at-risk detection', () => {
  it('flags REPEATED_QUIZ_FAILURE with a recommended revision, for both the single-enrollment and course-list endpoints', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId, quizId, questionId } = await createPublishedCourseWithLesson({ withQuiz: true, maxAttempts: 3 });
    const learner = await createUserWithRole(uniqueEmail('analytics-fr108-repeated-fail'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    await failQuiz(learner.accessToken, quizId!, questionId!);
    await failQuiz(learner.accessToken, quizId!, questionId!);

    const singleRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(singleRes.status).toBe(200);
    expect(singleRes.body.data.atRiskScore).toBeGreaterThanOrEqual(20);
    expect(singleRes.body.data.signals.some((s: any) => s.type === 'REPEATED_QUIZ_FAILURE')).toBe(true);
    expect(singleRes.body.data.recommendedRevision.lessonId).toBe(lessonId);
    expect(singleRes.body.data.instructorAlertRaised).toBe(true);
    expect(singleRes.body.data.notApplicableActions).toEqual(expect.arrayContaining(['reminder', 'mentorSuggestion', 'supportOutreach', 'simplifiedRestartPlan']));

    const listRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/at-risk-learners`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((a: any) => a.enrollmentId === enrollmentId)).toBe(true);
  });

  it('does not flag a freshly-enrolled learner (grace period), detects NO_ACTIVITY/LONG_INACTIVITY/ACCESS_NEARING_EXPIRY via real elapsed time, and reports null for a COMPLETED enrollment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('analytics-fr108-timing'), 'registered_free_user');
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    const freshRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(freshRes.body.data.atRiskScore).toBe(0);
    expect(freshRes.body.data.signals).toEqual([]);

    const db = getPrismaClient();
    await db.enrollment.update({ where: { id: enrollmentId }, data: { enrolledAt: new Date(Date.now() - 10 * 86_400_000) } });
    const noActivityRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(noActivityRes.body.data.signals.some((s: any) => s.type === 'NO_ACTIVITY_SINCE_ENROLLMENT')).toBe(true);

    await db.enrollment.update({ where: { id: enrollmentId }, data: { lastAccessedAt: new Date(Date.now() - 20 * 86_400_000) } });
    const longInactivityRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(longInactivityRes.body.data.signals.some((s: any) => s.type === 'LONG_INACTIVITY')).toBe(true);
    expect(longInactivityRes.body.data.signals.some((s: any) => s.type === 'NO_ACTIVITY_SINCE_ENROLLMENT')).toBe(false);

    await db.enrollment.update({ where: { id: enrollmentId }, data: { accessEndAt: new Date(Date.now() + 3 * 86_400_000) } });
    const nearingExpiryRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(nearingExpiryRes.body.data.signals.some((s: any) => s.type === 'ACCESS_NEARING_EXPIRY')).toBe(true);

    await db.enrollment.update({ where: { id: enrollmentId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    const completedRes = await request(app).get(`/api/v1/lms/admin/enrollments/${enrollmentId}/at-risk`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(completedRes.body.data).toBeNull();
  });
});
