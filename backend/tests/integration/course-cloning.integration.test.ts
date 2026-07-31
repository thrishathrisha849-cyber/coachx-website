/**
 * Real-database integration tests for 004-learning-management-system's
 * US8 Course Cloning batch: FR-098's clone modes (FULL, CURRICULUM_ONLY,
 * CONTENT_WITHOUT_ENROLLMENTS, ASSESSMENT_BANK, CERTIFICATE_SETTINGS,
 * TRANSLATION_VARIANT), SC-008's "0% carry-over of enrollments/progress/
 * financial data" guarantee, and module-prerequisite remapping onto the
 * new module ids. Same graceful-skip pattern as the other integration
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
    .send({ name: 'Clone Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('clone-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Clone Test Category', slug: uniqueSlug('clone-cat') });
    categoryId = res.body.data.id;
  }
}

/**
 * Builds a rich source course: 2 modules (module 2 prerequisite = module 1),
 * each with one lesson; lesson 1 has an activity + a published quiz with one
 * question; lesson 2 has a published assignment with one rubric criterion.
 * An instructor is assigned, and the course is priced PAID (to verify
 * pricing resets to FREE on every clone mode).
 */
async function createRichSourceCourse() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Clone Source Course',
      slug: uniqueSlug('clone-source'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'PAID',
      priceAmountMinor: 50000,
      certificateAvailable: true,
    });
  const courseId = courseRes.body.data.id;

  const instructor = await createUserWithRole(uniqueEmail('clone-instructor'), 'course_instructor');
  await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/instructors`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ userId: instructor.userId, role: 'INSTRUCTOR', isPrimary: true });

  const module1Res = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const module1Id = module1Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${module1Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const module2Res = await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Module 2', prerequisiteModuleId: module1Id });
  const module2Id = module2Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${module2Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lesson1Res = await request(app)
    .post(`/api/v1/lms/admin/modules/${module1Id}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('clone-lesson-1'), completionRuleType: 'QUIZ_PASS' });
  const lesson1Id = lesson1Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lesson1Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  await request(app)
    .post(`/api/v1/lms/admin/lessons/${lesson1Id}/activities`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'VIDEO', mediaUrl: 'https://example.com/video.mp4' });

  const quizRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lesson1Id}/quiz`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Quiz 1', passingScorePercent: 70 });
  const quizId = quizRes.body.data.id;
  await request(app)
    .post(`/api/v1/lms/admin/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'TRUE_FALSE', prompt: 'Is this a test?', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] });
  await request(app).post(`/api/v1/lms/admin/quizzes/${quizId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const lesson2Res = await request(app)
    .post(`/api/v1/lms/admin/modules/${module2Id}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 2', slug: uniqueSlug('clone-lesson-2') });
  const lesson2Id = lesson2Res.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lesson2Id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lesson2Id}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Assignment 1', submissionFormat: 'TEXT', maxScore: 10, passingScore: 6, latePolicy: 'ACCEPT', dueAt: new Date(Date.now() + 86_400_000).toISOString() });
  const assignmentId = assignmentRes.body.data.id;
  await request(app)
    .post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Clarity', maxPoints: 10 });
  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  // Give the source course a real enrollment/progress record — this must NEVER carry over into any clone.
  const learner = await createUserWithRole(uniqueEmail('clone-learner'), 'registered_free_user');
  await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

  return { courseId, module1Id, module2Id, lesson1Id, lesson2Id };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-cloning.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING course-cloning.integration.test.ts: could not reach PostgreSQL.');
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
    await db.courseInstructor.deleteMany({});
    await db.courseModule.deleteMany({});
    await db.course.updateMany({ data: { translationOfCourseId: null } });
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

describe('Course Cloning (US8, FR-098/SC-008)', () => {
  it('FULL clone copies modules/lessons/activities/quiz/assignment/instructors, resets to an independent DRAFT with zero enrollments and no financial carry-over', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'FULL', slug: uniqueSlug('clone-full') });
    expect(cloneRes.status).toBe(201);
    const cloned = cloneRes.body.data;
    expect(cloned.id).not.toBe(courseId);
    expect(cloned.status).toBe('DRAFT');
    expect(cloned.priceType).toBe('FREE');
    expect(cloned.priceAmountMinor).toBe(0);
    expect(cloned.certificateAvailable).toBe(true);
    expect(cloned.instructors).toHaveLength(1);

    const modulesRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/modules`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(modulesRes.body.data).toHaveLength(2);
    const newModule1 = modulesRes.body.data.find((m: any) => m.title === 'Module 1');
    const newModule2 = modulesRes.body.data.find((m: any) => m.title === 'Module 2');
    // The prerequisite must be remapped to the NEW module 1's id, not the source's.
    expect(newModule2.prerequisiteModuleId).toBe(newModule1.id);
    expect(newModule2.prerequisiteModuleId).not.toBe(''); // sanity: a value was actually set

    const lessons1Res = await request(app).get(`/api/v1/lms/admin/modules/${newModule1.id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(lessons1Res.body.data).toHaveLength(1);
    const newLesson1Id = lessons1Res.body.data[0].id;

    const activitiesRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLesson1Id}/activities`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(activitiesRes.body.data).toHaveLength(1);

    const quizRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLesson1Id}/quiz`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizRes.status).toBe(200);
    expect(quizRes.body.data.status).toBe('DRAFT'); // reset, not still PUBLISHED
    const newQuizDetail = await request(app).get(`/api/v1/lms/admin/quizzes/${quizRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(newQuizDetail.body.data.questions).toHaveLength(1);
    expect(newQuizDetail.body.data.questions[0].options).toHaveLength(2);

    const lessons2Res = await request(app).get(`/api/v1/lms/admin/modules/${newModule2.id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`);
    const newLesson2Id = lessons2Res.body.data[0].id;
    const assignmentRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLesson2Id}/assignment`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(assignmentRes.status).toBe(200);
    expect(assignmentRes.body.data.status).toBe('DRAFT');
    expect(assignmentRes.body.data.dueAt).toBeNull(); // stale due date deliberately not carried over
    const newAssignmentDetail = await request(app).get(`/api/v1/lms/admin/assignments/${assignmentRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(newAssignmentDetail.body.data.rubricCriteria).toHaveLength(1);

    // SC-008: zero enrollment carry-over.
    const enrollmentsRes = await request(app).get(`/api/v1/lms/admin/enrollments?courseId=${cloned.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(enrollmentsRes.body.data).toHaveLength(0);
  });

  it('CURRICULUM_ONLY copies modules/lessons but not activities, quizzes, assignments, or instructors', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'CURRICULUM_ONLY', slug: uniqueSlug('clone-curriculum') });
    expect(cloneRes.status).toBe(201);
    const cloned = cloneRes.body.data;
    expect(cloned.instructors).toHaveLength(0);
    expect(cloned.certificateAvailable).toBe(false);

    const modulesRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/modules`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(modulesRes.body.data).toHaveLength(2);
    const newModule1Id = modulesRes.body.data.find((m: any) => m.title === 'Module 1').id;

    const lessonsRes = await request(app).get(`/api/v1/lms/admin/modules/${newModule1Id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(lessonsRes.body.data).toHaveLength(1);
    const newLessonId = lessonsRes.body.data[0].id;

    const activitiesRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLessonId}/activities`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(activitiesRes.body.data).toHaveLength(0);

    const quizRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLessonId}/quiz`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizRes.status).toBe(404);
  });

  it('CONTENT_WITHOUT_ENROLLMENTS copies activities/quizzes/assignments but not instructors', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'CONTENT_WITHOUT_ENROLLMENTS', slug: uniqueSlug('clone-content') });
    expect(cloneRes.status).toBe(201);
    const cloned = cloneRes.body.data;
    expect(cloned.instructors).toHaveLength(0);
    expect(cloned.certificateAvailable).toBe(true);

    const modulesRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/modules`).set('Authorization', `Bearer ${admin.accessToken}`);
    const newModule1Id = modulesRes.body.data.find((m: any) => m.title === 'Module 1').id;
    const lessonsRes = await request(app).get(`/api/v1/lms/admin/modules/${newModule1Id}/lessons`).set('Authorization', `Bearer ${admin.accessToken}`);
    const newLessonId = lessonsRes.body.data[0].id;
    const activitiesRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLessonId}/activities`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(activitiesRes.body.data).toHaveLength(1);
    const quizRes = await request(app).get(`/api/v1/lms/admin/lessons/${newLessonId}/quiz`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(quizRes.status).toBe(200);
  });

  it('CERTIFICATE_SETTINGS produces an otherwise-empty course carrying only the certificate configuration', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'CERTIFICATE_SETTINGS', slug: uniqueSlug('clone-cert') });
    expect(cloneRes.status).toBe(201);
    const cloned = cloneRes.body.data;
    expect(cloned.certificateAvailable).toBe(true);
    expect(cloned.instructors).toHaveLength(0);
    expect(cloned.description).toBeNull();

    const modulesRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/modules`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(modulesRes.body.data).toHaveLength(0);
  });

  it('TRANSLATION_VARIANT links the new course to the source and applies the requested language', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'TRANSLATION_VARIANT', slug: uniqueSlug('clone-translation'), language: 'TA' });
    expect(cloneRes.status).toBe(201);
    expect(cloneRes.body.data.language).toBe('TA');

    const db = getPrismaClient();
    const row = await db.course.findUnique({ where: { id: cloneRes.body.data.id } });
    expect(row.translationOfCourseId).toBe(courseId);
  });

  it('ASSESSMENT_BANK copies only QuestionBankItem rows into a new course with no curriculum/lessons/certificate settings (T107, FR-098#3)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();

    const item1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/question-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        type: 'SINGLE_CHOICE',
        prompt: 'Bank question 1',
        category: 'basics',
        difficulty: 'EASY',
        reviewStatus: 'APPROVED',
        status: 'PUBLISHED',
        options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
      });
    expect(item1.status).toBe(201);
    const item2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/question-bank`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'TRUE_FALSE', prompt: 'Bank question 2', reviewStatus: 'DRAFT' });
    expect(item2.status).toBe(201);

    const cloneRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/clone`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ mode: 'ASSESSMENT_BANK', slug: uniqueSlug('clone-bank') });
    expect(cloneRes.status).toBe(201);
    const cloned = cloneRes.body.data;
    expect(cloned.id).not.toBe(courseId);
    expect(cloned.status).toBe('DRAFT');
    expect(cloned.instructors).toHaveLength(0);
    expect(cloned.certificateAvailable).toBe(false);

    const modulesRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/modules`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(modulesRes.body.data).toHaveLength(0);

    const bankRes = await request(app).get(`/api/v1/lms/admin/courses/${cloned.id}/question-bank`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(bankRes.status).toBe(200);
    expect(bankRes.body.data).toHaveLength(2);
    const copiedApproved = bankRes.body.data.find((i: any) => i.prompt === 'Bank question 1');
    expect(copiedApproved.reviewStatus).toBe('APPROVED');
    expect(copiedApproved.category).toBe('basics');
    expect(copiedApproved.difficulty).toBe('EASY');
    expect(copiedApproved.usageCount).toBe(0); // fresh lineage — usage history belongs to the original
    expect(copiedApproved.version).toBe(1);
    expect(copiedApproved.options).toHaveLength(2);

    // The source course's own bank items must be untouched by the clone.
    const sourceBankRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/question-bank`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(sourceBankRes.body.data).toHaveLength(2);
  });

  it('rejects a duplicate slug with a conflict', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createRichSourceCourse();
    const slug = uniqueSlug('clone-dup');

    const first = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/clone`).set('Authorization', `Bearer ${admin.accessToken}`).send({ mode: 'FULL', slug });
    expect(first.status).toBe(201);

    const second = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/clone`).set('Authorization', `Bearer ${admin.accessToken}`).send({ mode: 'FULL', slug });
    expect(second.status).toBe(409);
  });
});
