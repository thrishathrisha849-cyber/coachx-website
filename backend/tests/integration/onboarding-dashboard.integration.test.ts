/**
 * Real-database integration tests for 003-auth-identity-onboarding-dashboard
 * US2 (Onboarding sequencer + Roadmap generation) and US4 (Member
 * Dashboard aggregation). Same graceful-skip pattern as the other
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
    .send({ name: 'Onboarding Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('ob-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Onboarding Test Category', slug: uniqueSlug('ob-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and TWO published lessons (so a widget test can show partial, non-100%/non-0% progress). */
async function createPublishedCourseWithTwoLessons() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Onboarding Dashboard Test Course',
      slug: uniqueSlug('ob-course'),
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
  await request(app)
    .patch(`/api/v1/lms/admin/modules/${moduleId}`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'PUBLISHED' });

  const lesson1Res = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('ob-lesson-1') });
  const lesson1Id = lesson1Res.body.data.id;
  await request(app)
    .patch(`/api/v1/lms/admin/lessons/${lesson1Id}`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'PUBLISHED' });

  const lesson2Res = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 2', slug: uniqueSlug('ob-lesson-2') });
  const lesson2Id = lesson2Res.body.data.id;
  await request(app)
    .patch(`/api/v1/lms/admin/lessons/${lesson2Id}`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, lesson1Id, lesson2Id };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING onboarding-dashboard.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING onboarding-dashboard.integration.test.ts: could not reach PostgreSQL.');
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
    await db.roadmap.deleteMany({});
    await db.onboardingStepResponse.deleteMany({});
    await db.userLifecycleState.deleteMany({});
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

const STEP_ANSWERS: Record<number, unknown> = {
  1: true,
  2: 'en',
  3: 'start_business',
  4: 'entrepreneur',
  5: 'beginner',
  6: 'idea_stage',
  7: ['marketing', 'ai_tools'],
  8: '1_3hrs',
  9: 'video',
  10: 'Finding my first customer',
  11: 'somewhat_confident',
};

async function submitStep(accessToken: string, stepNumber: number) {
  return request(app)
    .post(`/api/v1/onboarding/steps/${stepNumber}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ answer: { value: STEP_ANSWERS[stepNumber] } });
}

describe('Onboarding sequencer (US2)', () => {
  it('resumes from the exact next incomplete step and never re-presents a completed one', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('ob-learner-resume'), 'registered_free_user');

    const initial = await request(app)
      .get('/api/v1/onboarding/progress')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(initial.body.data).toEqual({ currentStep: 1, totalSteps: 11, completedStepNumbers: [], isComplete: false });

    for (let step = 1; step <= 5; step += 1) {
      const res = await submitStep(learner.accessToken, step);
      expect(res.status).toBe(200);
    }

    const midway = await request(app)
      .get('/api/v1/onboarding/progress')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(midway.body.data.currentStep).toBe(6);
    expect(midway.body.data.completedStepNumbers).toEqual([1, 2, 3, 4, 5]);
    expect(midway.body.data.isComplete).toBe(false);

    // Re-submitting an earlier step (e.g. going back to edit) overwrites, never duplicates.
    const editRes = await submitStep(learner.accessToken, 3);
    expect(editRes.status).toBe(200);
    const afterEdit = await request(app)
      .get('/api/v1/onboarding/progress')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(afterEdit.body.data.completedStepNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('syncs selected answers into the 001 UserLifecycleState without prematurely marking onboarding complete', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('ob-learner-sync'), 'registered_free_user');

    await submitStep(learner.accessToken, 2); // language
    await submitStep(learner.accessToken, 3); // goal
    await submitStep(learner.accessToken, 5); // experience
    await submitStep(learner.accessToken, 6); // business_stage
    await submitStep(learner.accessToken, 7); // interests
    await submitStep(learner.accessToken, 8); // time_availability

    const db = getPrismaClient();
    const state = await db.userLifecycleState.findUnique({ where: { userId: learner.userId } });
    expect(state.languageSelected).toBe('en');
    expect(state.goalSelected).toBe('start_business');
    expect(state.experienceLevel).toBe('beginner');
    expect(state.businessStage).toBe('idea_stage');
    expect(state.interests).toEqual(['marketing', 'ai_tools']);
    expect(state.timeAvailability).toBe('1_3hrs');
    expect(state.onboardingCompletedAt).toBeNull();
  });

  it('rejects completion until all 11 steps are answered, then generates a deterministic-fallback Roadmap and marks lifecycle onboarding complete', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('ob-learner-complete'), 'registered_free_user');

    for (let step = 1; step <= 5; step += 1) {
      await submitStep(learner.accessToken, step);
    }

    const tooEarly = await request(app)
      .post('/api/v1/onboarding/complete')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(tooEarly.status).toBe(400);

    for (let step = 6; step <= 11; step += 1) {
      await submitStep(learner.accessToken, step);
    }

    const completeRes = await request(app)
      .post('/api/v1/onboarding/complete')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.generatedBy).toBe('DETERMINISTIC_FALLBACK');
    expect(completeRes.body.data.goalSummary).toBe('start_business');
    expect(typeof completeRes.body.data.firstMilestone).toBe('string');

    const roadmapRes = await request(app)
      .get('/api/v1/onboarding/roadmap')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(roadmapRes.status).toBe(200);
    expect(roadmapRes.body.data.id).toBe(completeRes.body.data.id);

    const db = getPrismaClient();
    const state = await db.userLifecycleState.findUnique({ where: { userId: learner.userId } });
    expect(state.onboardingCompletedAt).not.toBeNull();
  });

  it('404s the roadmap before completion, and restart clears steps but keeps the last-generated roadmap accessible', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('ob-learner-restart'), 'registered_free_user');

    const notFound = await request(app)
      .get('/api/v1/onboarding/roadmap')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(notFound.status).toBe(404);

    for (let step = 1; step <= 11; step += 1) {
      await submitStep(learner.accessToken, step);
    }
    await request(app).post('/api/v1/onboarding/complete').set('Authorization', `Bearer ${learner.accessToken}`);

    const restartRes = await request(app)
      .post('/api/v1/onboarding/restart')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(restartRes.status).toBe(200);

    const progressAfterRestart = await request(app)
      .get('/api/v1/onboarding/progress')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(progressAfterRestart.body.data).toEqual({ currentStep: 1, totalSteps: 11, completedStepNumbers: [], isComplete: false });

    const roadmapAfterRestart = await request(app)
      .get('/api/v1/onboarding/roadmap')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(roadmapAfterRestart.status).toBe(200);
  });
});

describe('Member dashboard aggregation (US4)', () => {
  it('shows the guided new-user empty state until onboarding is complete', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('dash-new-user'), 'registered_free_user');

    const res = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isNewUser).toBe(true);
  });

  it('shows a non-dismissible critical alert when an already-authenticated session\'s account is locked or suspended mid-session', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('dash-suspended-mid-session'), 'registered_free_user');
    const db = getPrismaClient();

    // `authenticate` only verifies the JWT (see authenticate.middleware.ts)
    // — it never re-checks the DB row — so a token issued before an admin
    // action can still reach this endpoint after the account is locked or
    // suspended. Simulating that directly, since no admin
    // suspend/lock-account endpoint exists in this codebase yet.
    await db.user.update({ where: { id: learner.userId }, data: { status: 'SUSPENDED' } });
    const suspendedRes = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(suspendedRes.status).toBe(200);
    expect(suspendedRes.body.data.widgets.criticalAlerts.status).toBe('ok');
    const suspendedAlert = suspendedRes.body.data.widgets.criticalAlerts.data.find((a: any) => a.code === 'ACCOUNT_SUSPENDED');
    expect(suspendedAlert).toBeDefined();
    expect(suspendedAlert.dismissible).toBe(false);

    await db.user.update({ where: { id: learner.userId }, data: { status: 'LOCKED' } });
    const lockedRes = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${learner.accessToken}`);
    const lockedAlert = lockedRes.body.data.widgets.criticalAlerts.data.find((a: any) => a.code === 'ACCOUNT_LOCKED');
    expect(lockedAlert).toBeDefined();
    expect(lockedAlert.dismissible).toBe(false);
  });

  it('renders real widgets in priority order with honest empty-states for not-yet-built features, once onboarded', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('dash-onboarded'), 'registered_free_user');

    for (let step = 1; step <= 11; step += 1) {
      await submitStep(learner.accessToken, step);
    }
    await request(app).post('/api/v1/onboarding/complete').set('Authorization', `Bearer ${learner.accessToken}`);

    const res = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    const { data } = res.body;

    expect(data.isNewUser).toBe(false);
    expect(data.widgets.criticalAlerts.status).toBe('empty'); // verified account, no active alerts
    expect(data.widgets.nextBestAction.status).toBe('ok');
    expect(typeof data.widgets.nextBestAction.data.code).toBe('string');
    expect(data.widgets.continueLearning.status).toBe('empty'); // no enrollment yet
    expect(data.widgets.progressAndMilestones.status).toBe('ok');
    expect(typeof data.widgets.progressAndMilestones.data.profileCompletionPercent).toBe('number');
    expect(data.widgets.progressAndMilestones.data.milestones).toEqual([]);

    // Widgets with no owning feature built yet must be honest, not fabricated.
    for (const key of ['upcomingLiveSession', 'currentChallenge', 'recommendations', 'communityHighlights', 'savedItems', 'membership']) {
      expect(data.widgets[key].status).toBe('empty');
      expect(typeof data.widgets[key].reason).toBe('string');
    }
  });

  it('shows real Continue Learning progress once a lesson (of two) is completed, isolated per-widget from any other failure', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const learner = await createUserWithRole(uniqueEmail('dash-continue-learning'), 'registered_free_user');
    const { courseId, lesson1Id, lesson2Id } = await createPublishedCourseWithTwoLessons();

    await request(app)
      .post('/api/v1/lms/me/enrollments')
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ courseId });

    await request(app)
      .post(`/api/v1/lms/me/lessons/${lesson1Id}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ watchedPercent: 100, timeSpentDeltaSeconds: 60 });
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`);

    const res = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(200);
    const widget = res.body.data.widgets.continueLearning;
    expect(widget.status).toBe('ok');
    expect(widget.data).toHaveLength(1);
    expect(widget.data[0].courseId).toBe(courseId);
    expect(widget.data[0].progressPercent).toBe(50);
    expect(widget.data[0].nextLessonTitle).toBe('Lesson 2');
    void lesson2Id;
  });
});
