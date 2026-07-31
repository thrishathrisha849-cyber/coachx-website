/**
 * Real-database integration tests for 004-learning-management-system's
 * Peer Review batch (US9, FR-076): reviewer eligibility (must have
 * submitted own work, never self-review), a self-select claim queue
 * capped at `peerReviewsRequired` concurrent slots, rubric-based scoring,
 * anonymity enforcement (submitter view vs. instructor view), non-
 * destructive HIDE/RESTORE moderation, and the peer-review deadline
 * window. Same graceful-skip pattern as the other integration suites —
 * see docs/database/TESTING.md.
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
    .send({ name: 'Peer Review Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('peer-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Peer Review Test Category', slug: uniqueSlug('peer-cat') });
    categoryId = res.body.data.id;
  }
}

async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Peer Review Test Course',
      slug: uniqueSlug('peer-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('peer-lesson'), completionRuleType: 'MANUAL' });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId };
}

/** Creates a published assignment with peer review enabled and one 10-point rubric criterion. */
async function createPeerReviewAssignment(lessonId: string, overrides: Record<string, unknown> = {}) {
  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Peer-Reviewed Essay',
      submissionFormat: 'TEXT',
      maxScore: 10,
      passingScore: 6,
      latePolicy: 'ACCEPT',
      peerReviewEnabled: true,
      peerReviewsRequired: 1,
      peerReviewAnonymous: true,
      peerReviewIncludeInGrade: false,
      ...overrides,
    });
  const assignmentId = assignmentRes.body.data.id;

  const criterionRes = await request(app)
    .post(`/api/v1/lms/admin/assignments/${assignmentId}/criteria`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Clarity', maxPoints: 10 });

  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  return { assignmentId, criterionId: criterionRes.body.data.id };
}

async function enrollAndSubmit(accessToken: string, courseId: string, assignmentId: string, textBody = 'My submitted work') {
  await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${accessToken}`).send({ courseId });
  const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${accessToken}`);
  const submissionId = startRes.body.data.id;
  await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${accessToken}`).send({ textBody });
  await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${accessToken}`).send({ declaredOriginal: true });
  return submissionId;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING peer-review.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING peer-review.integration.test.ts: could not reach PostgreSQL.');
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
    await db.peerReviewCriterionScore.deleteMany({});
    await db.peerReview.deleteMany({});
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

describe('Peer Review reviewer eligibility (FR-076)', () => {
  it('rejects a claim from a learner who has not submitted their own work for the assignment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createPeerReviewAssignment(lessonId);

    const submitter = await createUserWithRole(uniqueEmail('peer-submitter-a'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);

    const nonSubmitter = await createUserWithRole(uniqueEmail('peer-nonsubmitter'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${nonSubmitter.accessToken}`).send({ courseId });

    const claimRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${nonSubmitter.accessToken}`);
    expect(claimRes.status).toBe(403);

    const queueRes = await request(app).get('/api/v1/lms/me/peer-review-queue').set('Authorization', `Bearer ${nonSubmitter.accessToken}`);
    expect(queueRes.body.data).toHaveLength(0);
  });

  it('rejects a learner claiming their own submission', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createPeerReviewAssignment(lessonId);

    const submitter = await createUserWithRole(uniqueEmail('peer-self'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);

    const selfClaim = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${submitter.accessToken}`);
    expect(selfClaim.status).toBe(400);
  });
});

describe('Peer Review claim + submit flow (FR-076)', () => {
  it('lets an eligible peer claim, score, and submit a review, visible to the instructor with identity, and anonymized to the submitter', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId } = await createPeerReviewAssignment(lessonId);

    const submitter = await createUserWithRole(uniqueEmail('peer-flow-submitter'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);

    const reviewer = await createUserWithRole(uniqueEmail('peer-flow-reviewer'), 'registered_free_user');
    await enrollAndSubmit(reviewer.accessToken, courseId, assignmentId, 'Reviewer own work');

    const queueRes = await request(app).get('/api/v1/lms/me/peer-review-queue').set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(queueRes.body.data.some((i: any) => i.submissionId === submissionId)).toBe(true);
    const queueItem = queueRes.body.data.find((i: any) => i.submissionId === submissionId);
    expect(queueItem.textBody).toBe('My submitted work');

    const claimRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(claimRes.status).toBe(201);
    const peerReviewId = claimRes.body.data.id;

    const submitReviewRes = await request(app)
      .post(`/api/v1/lms/me/peer-reviews/${peerReviewId}/submit`)
      .set('Authorization', `Bearer ${reviewer.accessToken}`)
      .send({ criterionScores: [{ criterionId, pointsAwarded: 8, comment: 'Good structure' }], comment: 'Solid overall' });
    expect(submitReviewRes.status).toBe(200);
    expect(submitReviewRes.body.data.totalScore).toBe(8);

    const submitterViewRes = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/peer-reviews`).set('Authorization', `Bearer ${submitter.accessToken}`);
    expect(submitterViewRes.body.data).toHaveLength(1);
    expect(submitterViewRes.body.data[0].reviewerDisplayName).toBeNull();
    expect(submitterViewRes.body.data[0].totalScore).toBe(8);

    const adminSubmissionRes = await request(app).get(`/api/v1/lms/admin/submissions/${submissionId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminSubmissionRes.body.data.peerReviews).toHaveLength(1);
    expect(adminSubmissionRes.body.data.peerReviews[0].reviewerUserId).toBe(reviewer.userId);
    expect(adminSubmissionRes.body.data.peerReviews[0].reviewerDisplayName).not.toBeNull();
  });

  it('enforces the peerReviewsRequired slot cap — a third eligible reviewer cannot claim once full', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createPeerReviewAssignment(lessonId, { peerReviewsRequired: 1 });

    const submitter = await createUserWithRole(uniqueEmail('peer-cap-submitter'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);

    const reviewer1 = await createUserWithRole(uniqueEmail('peer-cap-r1'), 'registered_free_user');
    await enrollAndSubmit(reviewer1.accessToken, courseId, assignmentId, 'r1 work');
    const reviewer2 = await createUserWithRole(uniqueEmail('peer-cap-r2'), 'registered_free_user');
    await enrollAndSubmit(reviewer2.accessToken, courseId, assignmentId, 'r2 work');

    const claim1 = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer1.accessToken}`);
    expect(claim1.status).toBe(201);

    const claim2 = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer2.accessToken}`);
    expect(claim2.status).toBe(409);

    const queueRes = await request(app).get('/api/v1/lms/me/peer-review-queue').set('Authorization', `Bearer ${reviewer2.accessToken}`);
    expect(queueRes.body.data.some((i: any) => i.submissionId === submissionId)).toBe(false);
  });

  it('rejects claiming the same submission twice by the same reviewer', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createPeerReviewAssignment(lessonId, { peerReviewsRequired: 3 });

    const submitter = await createUserWithRole(uniqueEmail('peer-dup-submitter'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);
    const reviewer = await createUserWithRole(uniqueEmail('peer-dup-reviewer'), 'registered_free_user');
    await enrollAndSubmit(reviewer.accessToken, courseId, assignmentId, 'reviewer work');

    const first = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(first.status).toBe(201);
    const second = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(second.status).toBe(409);
  });
});

describe('Peer Review moderation (FR-076)', () => {
  it('hides a peer review from the submitter view but keeps it visible (marked hidden) to the instructor, and restores it', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId, criterionId } = await createPeerReviewAssignment(lessonId);

    const submitter = await createUserWithRole(uniqueEmail('peer-mod-submitter'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);
    const reviewer = await createUserWithRole(uniqueEmail('peer-mod-reviewer'), 'registered_free_user');
    await enrollAndSubmit(reviewer.accessToken, courseId, assignmentId, 'reviewer work');

    const claimRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer.accessToken}`);
    const peerReviewId = claimRes.body.data.id;
    await request(app)
      .post(`/api/v1/lms/me/peer-reviews/${peerReviewId}/submit`)
      .set('Authorization', `Bearer ${reviewer.accessToken}`)
      .send({ criterionScores: [{ criterionId, pointsAwarded: 5 }], comment: 'Abusive-ish comment' });

    const hideRes = await request(app)
      .post(`/api/v1/lms/admin/peer-reviews/${peerReviewId}/moderate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'HIDE', reason: 'Off-topic' });
    expect(hideRes.status).toBe(200);

    const submitterViewAfterHide = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/peer-reviews`).set('Authorization', `Bearer ${submitter.accessToken}`);
    expect(submitterViewAfterHide.body.data).toHaveLength(0);

    const adminViewAfterHide = await request(app).get(`/api/v1/lms/admin/submissions/${submissionId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminViewAfterHide.body.data.peerReviews).toHaveLength(1);
    expect(adminViewAfterHide.body.data.peerReviews[0].moderationStatus).toBe('HIDDEN');

    await request(app).post(`/api/v1/lms/admin/peer-reviews/${peerReviewId}/moderate`).set('Authorization', `Bearer ${admin.accessToken}`).send({ action: 'RESTORE' });
    const submitterViewAfterRestore = await request(app).get(`/api/v1/lms/me/submissions/${submissionId}/peer-reviews`).set('Authorization', `Bearer ${submitter.accessToken}`);
    expect(submitterViewAfterRestore.body.data).toHaveLength(1);
  });
});

describe('Peer Review deadline window (FR-076)', () => {
  it('excludes a submission from the queue once its peer-review deadline has passed', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const { assignmentId } = await createPeerReviewAssignment(lessonId, { peerReviewDeadlineDays: 1 });

    const submitter = await createUserWithRole(uniqueEmail('peer-deadline-submitter'), 'registered_free_user');
    const submissionId = await enrollAndSubmit(submitter.accessToken, courseId, assignmentId);

    const db = getPrismaClient();
    await db.submission.update({ where: { id: submissionId }, data: { submittedAt: new Date(Date.now() - 5 * 86_400_000) } });

    const reviewer = await createUserWithRole(uniqueEmail('peer-deadline-reviewer'), 'registered_free_user');
    await enrollAndSubmit(reviewer.accessToken, courseId, assignmentId, 'reviewer work');

    const queueRes = await request(app).get('/api/v1/lms/me/peer-review-queue').set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(queueRes.body.data.some((i: any) => i.submissionId === submissionId)).toBe(false);

    const claimRes = await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/peer-review`).set('Authorization', `Bearer ${reviewer.accessToken}`);
    expect(claimRes.status).toBe(409);
  });
});
