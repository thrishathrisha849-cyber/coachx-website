/**
 * Real-database integration tests for 004-learning-management-system's
 * Discovery & Recommendations batch (FR-087 Course Reviews, FR-088
 * deterministic Recommendation Engine, FR-089 extended learning search,
 * FR-090 member catalog view). Same graceful-skip pattern as the other
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
    .send({ name: 'Discovery Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('disco-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Discovery Test Category', slug: uniqueSlug('disco-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a single-module, single-MANUAL-lesson course. Optionally attaches a quiz to that lesson. */
async function createPublishedCourseWithLesson(opts: { withQuiz?: boolean; maxAttempts?: number | null } = {}) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Discovery Test Course',
      slug: uniqueSlug('disco-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('disco-lesson'), completionRuleType: opts.withQuiz ? 'QUIZ_PASS' : 'MANUAL' });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  let quizId: string | undefined;
  let questionId: string | undefined;
  if (opts.withQuiz) {
    const quizRes = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Discovery Quiz', passingScorePercent: 70, maxAttempts: opts.maxAttempts === undefined ? 2 : opts.maxAttempts });
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

async function enrollAndCompleteCourse(accessToken: string, courseId: string, lessonId: string) {
  await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${accessToken}`).send({ courseId });
  await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${accessToken}`);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING discovery-recommendations.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING discovery-recommendations.integration.test.ts: could not reach PostgreSQL.');
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
    await db.courseReview.deleteMany({});
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

describe('Course Reviews (FR-087)', () => {
  it('reports ineligible before enrollment, then eligible once the course is completed, and updates the course rating aggregate on submit', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('disco-reviewer'), 'registered_free_user');

    const before = await request(app).get(`/api/v1/lms/me/courses/${courseId}/review-eligibility`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(before.body.data.eligible).toBe(false);

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const stillBefore = await request(app).get(`/api/v1/lms/me/courses/${courseId}/review-eligibility`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(stillBefore.body.data.eligible).toBe(false);

    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    const after = await request(app).get(`/api/v1/lms/me/courses/${courseId}/review-eligibility`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(after.body.data.eligible).toBe(true);

    const submitRes = await request(app)
      .post(`/api/v1/lms/me/courses/${courseId}/review`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ rating: 5, comment: 'Excellent course!', wouldRecommend: true, isAnonymous: false });
    expect(submitRes.status).toBe(201);

    const courseRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(courseRes.body.data.ratingAverage).toBe(5);
    expect(courseRes.body.data.ratingCount).toBe(1);

    const publicReviews = await request(app).get(`/api/v1/lms/courses/${courseId}/reviews`);
    expect(publicReviews.body.data).toHaveLength(1);
    expect(publicReviews.body.data[0].reviewerName).not.toBeNull();
  });

  it('upserts a second submission from the same learner rather than creating a duplicate, and honors isAnonymous', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('disco-reviewer-upsert'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);

    await request(app).post(`/api/v1/lms/me/courses/${courseId}/review`).set('Authorization', `Bearer ${learner.accessToken}`).send({ rating: 3, wouldRecommend: false, isAnonymous: false });
    const second = await request(app)
      .post(`/api/v1/lms/me/courses/${courseId}/review`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ rating: 5, comment: 'Changed my mind', wouldRecommend: true, isAnonymous: true });
    expect(second.status).toBe(201);

    const publicReviews = await request(app).get(`/api/v1/lms/courses/${courseId}/reviews`);
    expect(publicReviews.body.data).toHaveLength(1);
    expect(publicReviews.body.data[0].rating).toBe(5);
    expect(publicReviews.body.data[0].reviewerName).toBeNull();

    const courseRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(courseRes.body.data.ratingCount).toBe(1);
  });

  it('admin can hide a review (removing it from the public list and the rating aggregate) and restore it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('disco-reviewer-hide'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/review`).set('Authorization', `Bearer ${learner.accessToken}`).send({ rating: 1, comment: 'Bad', wouldRecommend: false, isAnonymous: false });

    const adminList = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/reviews`).set('Authorization', `Bearer ${admin.accessToken}`);
    const reviewId = adminList.body.data[0].id;

    const hideRes = await request(app).post(`/api/v1/lms/admin/reviews/${reviewId}/moderate`).set('Authorization', `Bearer ${admin.accessToken}`).send({ action: 'HIDE', reason: 'Abusive language' });
    expect(hideRes.status).toBe(200);

    const publicAfterHide = await request(app).get(`/api/v1/lms/courses/${courseId}/reviews`);
    expect(publicAfterHide.body.data).toHaveLength(0);
    const courseAfterHide = await request(app).get(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(courseAfterHide.body.data.ratingCount).toBe(0);

    await request(app).post(`/api/v1/lms/admin/reviews/${reviewId}/moderate`).set('Authorization', `Bearer ${admin.accessToken}`).send({ action: 'RESTORE' });
    const publicAfterRestore = await request(app).get(`/api/v1/lms/courses/${courseId}/reviews`);
    expect(publicAfterRestore.body.data).toHaveLength(1);
  });
});

describe('Recommendation Engine (FR-088, deterministic fallback)', () => {
  it('recommends revising the lesson and retaking the quiz after a failed, still-retakeable attempt', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId, quizId, questionId } = await createPublishedCourseWithLesson({ withQuiz: true, maxAttempts: 2 });
    const learner = await createUserWithRole(uniqueEmail('disco-learner-fail'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ selectedOptionIds: [] }); // deliberately wrong/empty — fails the TRUE_FALSE question
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    const recRes = await request(app).get('/api/v1/lms/me/recommendations').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(recRes.status).toBe(200);
    const types = recRes.body.data.items.map((i: any) => i.type);
    expect(types).toContain('REVISION_LESSON');
    expect(types).toContain('PRACTICE_QUIZ');
    expect(recRes.body.data.notApplicable).toEqual(expect.arrayContaining(['mentorSupport', 'relatedResource', 'challenge']));

    const revisionItem = recRes.body.data.items.find((i: any) => i.type === 'REVISION_LESSON');
    expect(revisionItem.lessonId).toBe(lessonId);
  });

  it('does not recommend a practice-quiz retake once attempts are exhausted', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId, questionId } = await createPublishedCourseWithLesson({ withQuiz: true, maxAttempts: 1 });
    const learner = await createUserWithRole(uniqueEmail('disco-learner-exhausted'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const startRes = await request(app).post(`/api/v1/lms/me/quizzes/${quizId}/attempts`).set('Authorization', `Bearer ${learner.accessToken}`);
    const attemptId = startRes.body.data.id;
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ selectedOptionIds: [] });
    await request(app).post(`/api/v1/lms/me/quiz-attempts/${attemptId}/submit`).set('Authorization', `Bearer ${learner.accessToken}`);

    const recRes = await request(app).get('/api/v1/lms/me/recommendations').set('Authorization', `Bearer ${learner.accessToken}`);
    const types = recRes.body.data.items.map((i: any) => i.type);
    expect(types).toContain('REVISION_LESSON');
    expect(types).not.toContain('PRACTICE_QUIZ');
  });
});

describe('Member Catalog (FR-090)', () => {
  it('sections reflect real enrollment state, and unbuilt sections are honestly reported as unavailable', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('disco-catalog-learner'), 'registered_free_user');
    await enrollAndCompleteCourse(learner.accessToken, courseId, lessonId);

    const catalogRes = await request(app).get('/api/v1/lms/me/catalog').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.data.completed.status).toBe('ok');
    expect(catalogRes.body.data.completed.data.some((c: any) => c.courseId === courseId)).toBe(true);
    expect(catalogRes.body.data.newCourses.status).toBe('ok');

    expect(catalogRes.body.data.learningPaths.status).toBe('empty');
    expect(catalogRes.body.data.wishlist.status).toBe('empty');
    expect(catalogRes.body.data.includedInMembership.status).toBe('empty');
  });
});

describe('Extended learning search (FR-089)', () => {
  it('filters by certificateAvailable and supports the popular sort', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourseWithLesson();
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ certificateAvailable: true });

    const filtered = await request(app).get('/api/v1/lms/courses').query({ certificateAvailable: 'true', categoryId });
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.some((c: any) => c.id === courseId)).toBe(true);
    expect(filtered.body.data.every((c: any) => c.certificateAvailable === true)).toBe(true);

    const notCertified = await request(app).get('/api/v1/lms/courses').query({ certificateAvailable: 'false', categoryId });
    expect(notCertified.body.data.some((c: any) => c.id === courseId)).toBe(false);

    const popular = await request(app).get('/api/v1/lms/courses').query({ sort: 'popular', categoryId });
    expect(popular.status).toBe(200);
  });

  it('matches a lesson title within the search query', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    await createPublishedCourseWithLesson();

    const res = await request(app).get('/api/v1/lms/courses').query({ q: 'Lesson 1' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
