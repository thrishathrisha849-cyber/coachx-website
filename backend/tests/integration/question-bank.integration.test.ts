/**
 * Real-database integration tests for 004-learning-management-system's
 * Question Bank batch (T107, FR-064): admin CRUD for reusable, course-
 * scoped question bank items (category/difficulty/tags/reviewStatus/
 * usageCount), and `generateQuestionsFromBank` — the randomized-draw
 * generator that COPIES eligible (APPROVED + PUBLISHED) bank items into
 * a quiz's real `Question` rows, honoring difficulty distribution,
 * category filtering, and exclusion rules, while leaving DRAFT items
 * ineligible. Same graceful-skip pattern as the other integration
 * suites — see docs/database/TESTING.md.
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
    .send({ name: 'Bank Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('bank-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Bank Test Category', slug: uniqueSlug('bank-cat') });
    categoryId = res.body.data.id;
  }
}

async function createCourseWithQuiz() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Bank Course', slug: uniqueSlug('bank-course'), categoryId });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('bank-lesson') });
  const lessonId = lessonRes.body.data.id;

  const quizRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/quiz`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Quiz 1', passingScorePercent: 70 });

  return { courseId, quizId: quizRes.body.data.id };
}

async function createBankItem(courseId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/question-bank`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      type: 'SINGLE_CHOICE',
      prompt: 'Default bank prompt',
      reviewStatus: 'APPROVED',
      status: 'PUBLISHED',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      ...overrides,
    });
  return res;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING question-bank.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING question-bank.integration.test.ts: could not reach PostgreSQL.');
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
    await db.questionBankItemOption.deleteMany({});
    await db.questionBankItem.deleteMany({});
    await db.quizAnswer.deleteMany({});
    await db.quizAttempt.deleteMany({});
    await db.questionOption.deleteMany({});
    await db.question.deleteMany({});
    await db.quiz.deleteMany({});
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

describe('Question Bank (T107, FR-064)', () => {
  it('creates a bank item with full tagging metadata and lists it back', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCourseWithQuiz();

    const created = await createBankItem(courseId, {
      prompt: 'What is 2+2?',
      category: 'math',
      difficulty: 'EASY',
      learningObjective: 'Basic arithmetic',
      tags: ['arithmetic', 'intro'],
      language: 'EN',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.category).toBe('math');
    expect(created.body.data.difficulty).toBe('EASY');
    expect(created.body.data.tags).toEqual(['arithmetic', 'intro']);
    expect(created.body.data.usageCount).toBe(0);
    expect(created.body.data.version).toBe(1);

    const listRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/question-bank`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((i: any) => i.id === created.body.data.id)).toBe(true);
  });

  it('filters the list by category and difficulty', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCourseWithQuiz();

    await createBankItem(courseId, { prompt: 'Easy math', category: 'math', difficulty: 'EASY' });
    await createBankItem(courseId, { prompt: 'Hard math', category: 'math', difficulty: 'HARD' });
    await createBankItem(courseId, { prompt: 'Easy history', category: 'history', difficulty: 'EASY' });

    const filtered = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/question-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ category: 'math', difficulty: 'EASY' });
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].prompt).toBe('Easy math');
  });

  it('updates a bank item, bumping its version and replacing options', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCourseWithQuiz();
    const created = await createBankItem(courseId, { prompt: 'Original prompt' });

    const updated = await request(app)
      .patch(`/api/v1/lms/admin/question-bank/${created.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prompt: 'Updated prompt', options: [{ text: 'X', isCorrect: true }, { text: 'Y', isCorrect: false }, { text: 'Z', isCorrect: false }] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.prompt).toBe('Updated prompt');
    expect(updated.body.data.version).toBe(2);
    expect(updated.body.data.options).toHaveLength(3);
  });

  it('archives a bank item and rejects archiving it twice', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createCourseWithQuiz();
    const created = await createBankItem(courseId);

    const archived = await request(app).post(`/api/v1/lms/admin/question-bank/${created.body.data.id}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(archived.status).toBe(200);
    expect(archived.body.data.status).toBe('ARCHIVED');
    expect(archived.body.data.reviewStatus).toBe('ARCHIVED');

    const secondArchive = await request(app).post(`/api/v1/lms/admin/question-bank/${created.body.data.id}/archive`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(secondArchive.status).toBe(409);
  });

  it('generates questions from the bank by count, only drawing APPROVED+PUBLISHED items, and increments usageCount', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId } = await createCourseWithQuiz();

    const approved1 = await createBankItem(courseId, { prompt: 'Approved 1' });
    const approved2 = await createBankItem(courseId, { prompt: 'Approved 2' });
    const draftItem = await createBankItem(courseId, { prompt: 'Still a draft', reviewStatus: 'DRAFT', status: 'DRAFT' });

    const genRes = await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/generate-from-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ count: 2 });
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.requested).toBe(2);
    expect(genRes.body.data.drawn).toBe(2);
    expect(genRes.body.data.createdQuestionIds).toHaveLength(2);

    const quizDetail = await request(app).get(`/api/v1/lms/admin/quizzes/${quizId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizDetail.body.data.questions).toHaveLength(2);
    const drawnPrompts = quizDetail.body.data.questions.map((q: any) => q.prompt);
    expect(drawnPrompts).not.toContain('Still a draft');

    const bankAfter = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/question-bank`).set('Authorization', `Bearer ${admin.accessToken}`);
    const drawnIds = new Set([approved1.body.data.id, approved2.body.data.id]);
    for (const item of bankAfter.body.data) {
      if (drawnIds.has(item.id)) expect(item.usageCount).toBe(1);
      if (item.id === draftItem.body.data.id) expect(item.usageCount).toBe(0);
    }
  });

  it('draws only from the requested category and honors exclusion rules', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId } = await createCourseWithQuiz();

    const mathItem = await createBankItem(courseId, { prompt: 'Math Q', category: 'math' });
    await createBankItem(courseId, { prompt: 'History Q', category: 'history' });

    const genRes = await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/generate-from-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ count: 5, category: 'math' });
    expect(genRes.body.data.drawn).toBe(1);

    const quizDetail = await request(app).get(`/api/v1/lms/admin/quizzes/${quizId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizDetail.body.data.questions).toHaveLength(1);
    expect(quizDetail.body.data.questions[0].prompt).toBe('Math Q');

    // Excluding the only eligible math item leaves nothing to draw — honestly reports drawn < requested.
    const genRes2 = await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/generate-from-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ count: 5, category: 'math', excludeIds: [mathItem.body.data.id] });
    expect(genRes2.body.data.requested).toBe(5);
    expect(genRes2.body.data.drawn).toBe(0);
  });

  it('generates by difficulty distribution, drawing the requested count per difficulty', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId } = await createCourseWithQuiz();

    await createBankItem(courseId, { prompt: 'Easy A', difficulty: 'EASY' });
    await createBankItem(courseId, { prompt: 'Easy B', difficulty: 'EASY' });
    await createBankItem(courseId, { prompt: 'Hard A', difficulty: 'HARD' });

    const genRes = await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/generate-from-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ difficultyDistribution: { EASY: 2, HARD: 1 } });
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.requested).toBe(3);
    expect(genRes.body.data.drawn).toBe(3);

    const quizDetail = await request(app).get(`/api/v1/lms/admin/quizzes/${quizId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizDetail.body.data.questions).toHaveLength(3);
  });

  it('a bank item edited after generation never retroactively changes an already-generated question (historical immutability)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, quizId } = await createCourseWithQuiz();
    const item = await createBankItem(courseId, { prompt: 'Original prompt', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] });

    await request(app)
      .post(`/api/v1/lms/admin/quizzes/${quizId}/generate-from-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ count: 1 });

    const quizBefore = await request(app).get(`/api/v1/lms/admin/quizzes/${quizId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizBefore.body.data.questions[0].prompt).toBe('Original prompt');
    const generatedQuestionId = quizBefore.body.data.questions[0].id;

    await request(app)
      .patch(`/api/v1/lms/admin/question-bank/${item.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prompt: 'Edited after generation' });

    const quizAfter = await request(app).get(`/api/v1/lms/admin/quizzes/${quizId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    const sameQuestion = quizAfter.body.data.questions.find((q: any) => q.id === generatedQuestionId);
    expect(sameQuestion.prompt).toBe('Original prompt'); // unchanged — a copy, not a live reference
  });
});
