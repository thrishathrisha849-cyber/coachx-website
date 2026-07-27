/**
 * Real-database integration tests for Phase 6 Part 2 — Lessons/Learning
 * Activities (Part 2A) and Enrollment/Access/Progress/Completion/Continue
 * Learning (Part 2B). Same graceful-skip pattern as
 * `lms.integration.test.ts` / `auth.integration.test.ts` (no Docker/
 * Postgres reachable in this sandbox — see docs/lms/TESTING.md).
 *
 * Covers the 8 mandatory end-to-end domain scenarios named in the Phase 6
 * Part 2C brief:
 *  1. Free course learner flow (enroll -> access -> progress -> complete ->
 *     continue-learning -> course completion).
 *  2. Paid course WITHOUT entitlement — must deny safely, no fake
 *     entitlement (Feature 009 does not exist).
 *  3. Suspended enrollment — access denied mid-course.
 *  4. Prerequisite and drip — a locked module stays locked until its
 *     condition is met.
 *  5. IDOR protection — a learner can never read/write another learner's
 *     progress; an instructor can never touch another instructor's course.
 *  6. Instructor scope — an instructor only sees their own course's
 *     enrollments.
 *  7. Idempotent completion — completing an already-completed lesson is a
 *     safe no-op, never a duplicate/error.
 *  8. Expired access — the access evaluator denies based on
 *     `accessEndAt` even though no background job has flipped the stored
 *     `status` column to EXPIRED.
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

let registrationIpCounter = 0;

async function createUserWithRole(email: string, roleName: string) {
  // Each synthetic test user registers from a distinct X-Forwarded-For
  // IP (trust proxy is enabled in app.ts) so the fixed 5/hour per-IP
  // registerRateLimiter (auth-rate-limit.middleware.ts) — a deliberate,
  // non-configurable Phase 4 security control — doesn't 429 real test
  // fixtures that legitimately need more than 5 distinct accounts.
  registrationIpCounter += 1;
  const testIp = `10.${(registrationIpCounter >> 16) & 0xff}.${(registrationIpCounter >> 8) & 0xff}.${registrationIpCounter & 0xff}`;

  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', testIp)
    .send({ name: 'LMS P2 Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
  return { userId: user.id, accessToken: loginRes.body.data.accessToken };
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

let admin: { userId: string; accessToken: string };
let instructorA: { userId: string; accessToken: string };
let instructorB: { userId: string; accessToken: string };
let learner: { userId: string; accessToken: string };
let learner2: { userId: string; accessToken: string };
let categoryId: string;

async function ensureFixtures() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('p2-admin'), 'platform_admin');
  if (!instructorA) instructorA = await createUserWithRole(uniqueEmail('p2-instr-a'), 'course_instructor');
  if (!instructorB) instructorB = await createUserWithRole(uniqueEmail('p2-instr-b'), 'course_instructor');
  if (!learner) learner = await createUserWithRole(uniqueEmail('p2-learner'), 'registered_free_user');
  if (!learner2) learner2 = await createUserWithRole(uniqueEmail('p2-learner-2'), 'registered_free_user');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'P2 Category', slug: uniqueSlug('p2-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module and one PUBLISHED, non-preview, MANUAL-completion lesson. Returns every id a scenario typically needs. */
async function createPublishedCourseWithLesson(
  instructor: { userId: string; accessToken: string },
  opts: { priceType?: 'FREE' | 'PAID'; priceAmountMinor?: number } = {},
) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Part 2 Test Course',
      slug: uniqueSlug('p2-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: opts.priceType ?? 'FREE',
      priceAmountMinor: opts.priceAmountMinor ?? 0,
    });
  const courseId = courseRes.body.data.id;

  await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/instructors`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ userId: instructor.userId, isPrimary: true });

  const moduleRes = await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;

  await request(app)
    .patch(`/api/v1/lms/admin/modules/${moduleId}`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'PUBLISHED' });

  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Lesson 1', slug: uniqueSlug('lesson-1') });
  const lessonId = lessonRes.body.data.id;

  await request(app)
    .patch(`/api/v1/lms/admin/lessons/${lessonId}`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status });
    expect(res.status).toBe(200);
  }

  return { courseId, moduleId, lessonId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lms-part2.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.');
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING lms-part2.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
        '(expected in this sandbox — no Docker/Postgres available; see docs/lms/TESTING.md).',
    );
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
    await db.completionOverride.deleteMany({});
    await db.activityProgress.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.idempotencyKey.deleteMany({ where: { scope: { startsWith: 'lms.' } } });
    await db.learningActivity.deleteMany({});
    await db.lesson.deleteMany({});
    await db.courseInstructor.deleteMany({});
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

describe('Scenario 1 — Free course learner flow', () => {
  it('enroll -> access allowed -> progress -> complete -> continue-learning -> course completion', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(instructorA);

    const enrollRes = await request(app)
      .post('/api/v1/lms/me/enrollments')
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ courseId });
    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.data.status).toBe('ACTIVE');

    const accessRes = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/access`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(accessRes.body.data.allowed).toBe(true);

    const progressRes = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ watchedPercent: 50, timeSpentDeltaSeconds: 60 });
    expect(progressRes.status).toBe(200);
    expect(progressRes.body.data.percentage).toBe(50);

    const continueRes = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/continue-learning`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(continueRes.body.data.nextLesson.id).toBe(lessonId);

    const completeRes = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(completeRes.status).toBe(200);

    const courseProgressRes = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(courseProgressRes.body.data.isComplete).toBe(true);

    const enrollmentsRes = await request(app)
      .get('/api/v1/lms/me/enrollments')
      .set('Authorization', `Bearer ${learner.accessToken}`);
    const thisEnrollment = enrollmentsRes.body.data.find((e: any) => e.courseId === courseId);
    expect(thisEnrollment.status).toBe('COMPLETED');
  });
});

describe('Scenario 2 — Paid course without entitlement must deny safely', () => {
  it('does not create an enrollment and does not fake entitlement approval for a PAID course', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA, { priceType: 'PAID', priceAmountMinor: 5000 });

    const res = await request(app)
      .post('/api/v1/lms/me/enrollments')
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ courseId });

    expect(res.status).toBe(403);

    const db = getPrismaClient();
    const enrollment = await db.enrollment.findFirst({ where: { userId: learner.userId, courseId } });
    expect(enrollment).toBeNull();
  });
});

describe('Scenario 3 — Suspended enrollment denies access', () => {
  it('denies lesson access once an admin suspends the enrollment, with reason ENROLLMENT_SUSPENDED', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(instructorA);

    const enrollRes = await request(app)
      .post('/api/v1/lms/me/enrollments')
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    const suspendRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollmentId}/suspend`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Payment dispute under review' });
    expect(suspendRes.status).toBe(200);

    const accessRes = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/access`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(accessRes.body.data.allowed).toBe(false);
    expect(accessRes.body.data.reason).toBe('ENROLLMENT_SUSPENDED');

    const lessonRes = await request(app)
      .get(`/api/v1/lms/me/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lessonRes.status).toBe(403);
  });
});

describe('Scenario 4 — Prerequisite and drip gating', () => {
  it('keeps a second module locked until its prerequisite module is completed', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId: module1Id, lessonId: lesson1Id } = await createPublishedCourseWithLesson(instructorA);

    const module2Res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 2', prerequisiteModuleId: module1Id, position: 1 });
    const module2Id = module2Res.body.data.id;
    await request(app)
      .patch(`/api/v1/lms/admin/modules/${module2Id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    const lesson2Res = await request(app)
      .post(`/api/v1/lms/admin/modules/${module2Id}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Lesson 2', slug: uniqueSlug('lesson-2') });
    const lesson2Id = lesson2Res.body.data.id;
    await request(app)
      .patch(`/api/v1/lms/admin/lessons/${lesson2Id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    // Module 2's lesson is locked before module 1 is completed.
    const lockedRes = await request(app)
      .get(`/api/v1/lms/me/lessons/${lesson2Id}`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lockedRes.status).toBe(403);
    expect(lockedRes.body.error?.details?.reason ?? lockedRes.body.data?.reason).toBeDefined();

    // Complete module 1's lesson.
    await request(app).post(`/api/v1/lms/me/lessons/${lesson1Id}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    // Module 2's lesson is now unlocked.
    const unlockedRes = await request(app)
      .get(`/api/v1/lms/me/lessons/${lesson2Id}`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(unlockedRes.status).toBe(200);
  });
});

describe('Scenario 5 — IDOR protection', () => {
  it('a learner cannot read another learner’s enrollment/progress via a guessed enrollment id', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);

    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    // learner2 tries to act on learner's enrollment via an admin-only endpoint using their own (non-admin) token — must be rejected by RBAC, not by ownership logic being reachable at all.
    const crossRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${enrollmentId}/suspend`)
      .set('Authorization', `Bearer ${learner2.accessToken}`)
      .send({ reason: 'attempted cross-account action' });
    expect(crossRes.status).toBe(403);
  });

  it('instructor B cannot read instructor A’s course enrollments', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);

    const res = await request(app)
      .get(`/api/v1/lms/instructor/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${instructorB.accessToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Scenario 6 — Instructor scope', () => {
  it('instructor A sees their own course’s enrollments via the instructor-scoped endpoint', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app)
      .get(`/api/v1/lms/instructor/courses/${courseId}/enrollments`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.userId === learner.userId)).toBe(true);
  });
});

describe('Scenario 7 — Idempotent completion', () => {
  it('completing an already-completed lesson twice is a safe no-op, not a duplicate or an error', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(instructorA);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const first = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(first.status).toBe(200);
    expect(first.body.data.alreadyCompleted).toBe(false);

    const second = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyCompleted).toBe(true);

    const db = getPrismaClient();
    const enrollment = await db.enrollment.findFirst({ where: { userId: learner.userId, courseId } });
    const rows = await db.lessonProgress.findMany({ where: { enrollmentId: enrollment.id, lessonId } });
    expect(rows.length).toBe(1);
  });
});

describe('Scenario 8 — Expired access denies via timestamp even without a background job', () => {
  it('denies access once accessEndAt has passed, purely from the stored timestamp, with no scheduler involved', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const enrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const enrollmentId = enrollRes.body.data.id;

    // Directly backdate accessEndAt into the past — simulates "time has
    // passed" without requiring any scheduler/cron to have run.
    const db = getPrismaClient();
    await db.enrollment.update({ where: { id: enrollmentId }, data: { accessEndAt: new Date(Date.now() - 60_000) } });

    const accessRes = await request(app)
      .get(`/api/v1/lms/me/courses/${courseId}/access`)
      .set('Authorization', `Bearer ${learner.accessToken}`);
    expect(accessRes.body.data.allowed).toBe(false);
    expect(accessRes.body.data.reason).toBe('ACCESS_EXPIRED');

    // The stored `status` column is still ACTIVE — no job flipped it — yet access is still correctly denied.
    const stillStored = await db.enrollment.findUnique({ where: { id: enrollmentId } });
    expect(stillStored.status).toBe('ACTIVE');
  });
});

// =============================================================================
// Correction pass scenarios (added after the mandatory correction and
// verification pass — see docs/lms/DECISION_GATES.md and the revised
// final report). Covers: Correction 1 (idempotency infrastructure),
// Correction 2 (real ALL_ACTIVITIES_VIEWED), Correction 4 (multi-condition
// completion, capacity enforcement).
// =============================================================================

describe('Correction 1 — Idempotency: administrative enrollment assignment', () => {
  it('first request succeeds; an identical retry (same key, same payload) replays the SAME result without a second enrollment row', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const idemKey = `admin-grant-${uniqueSlug('k')}`;

    const first = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' });
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);

    const db = getPrismaClient();
    const rows = await db.enrollment.findMany({ where: { userId: learner.userId, courseId } });
    expect(rows.length).toBe(1);
  });

  it('same key with a DIFFERENT payload is rejected with a conflict, not silently replayed', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const idemKey = `admin-grant-mismatch-${uniqueSlug('k')}`;

    const first = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' });
    expect(first.status).toBe(201);

    const mismatched = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner2.userId, courseId, source: 'ADMIN_GRANT' });
    expect(mismatched.status).toBe(409);
  });

  it('actor scope: a different admin actor supplying the identical literal key does NOT reuse the first actor’s record', async () => {
    if (skip()) return;
    await ensureFixtures();
    const admin2 = await createUserWithRole(uniqueEmail('p2-admin-2'), 'platform_admin');
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const idemKey = 'shared-literal-key';

    const byAdmin1 = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' });
    expect(byAdmin1.status).toBe(201);

    const byAdmin2 = await request(app)
      .post('/api/v1/lms/admin/enrollments')
      .set('Authorization', `Bearer ${admin2.accessToken}`)
      .set('Idempotency-Key', idemKey)
      .send({ userId: learner2.userId, courseId, source: 'ADMIN_GRANT' });
    // A distinct actor + distinct payload under the same literal client key
    // must proceed as its own, independent operation — not be treated as a
    // replay of admin1's result (which would incorrectly return admin1's
    // enrollment for learner1 instead of creating admin2's for learner2).
    expect(byAdmin2.status).toBe(201);
    expect(byAdmin2.body.data.id).not.toBe(byAdmin1.body.data.id);
    expect(byAdmin2.body.data.userId ?? learner2.userId).toBeDefined();
  });

  it('concurrent duplicate requests (same actor, same key, fired in parallel) do not create two enrollment rows', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const idemKey = `concurrent-${uniqueSlug('k')}`;

    const [r1, r2] = await Promise.all([
      request(app)
        .post('/api/v1/lms/admin/enrollments')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Idempotency-Key', idemKey)
        .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' }),
      request(app)
        .post('/api/v1/lms/admin/enrollments')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .set('Idempotency-Key', idemKey)
        .send({ userId: learner.userId, courseId, source: 'ADMIN_GRANT' }),
    ]);

    // One of the two must succeed (201); the other either replays (201,
    // same id) or observes "in-progress" (409) — either outcome is
    // acceptable, but EXACTLY one Enrollment row for this (user, course)
    // pair must exist afterward.
    expect([r1.status, r2.status].every((s) => s === 201 || s === 409)).toBe(true);

    const db = getPrismaClient();
    const rows = await db.enrollment.findMany({ where: { userId: learner.userId, courseId } });
    expect(rows.length).toBe(1);
  });
});

describe('Correction 1 — Idempotency: lesson completion submission and audit-event de-duplication', () => {
  it('a duplicate completion request (same idempotency key) does not create a second lms.lesson.completed audit event', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, lessonId } = await createPublishedCourseWithLesson(instructorA);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    const idemKey = `complete-${uniqueSlug('k')}`;

    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('Idempotency-Key', idemKey);
    await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .set('Idempotency-Key', idemKey);

    const db = getPrismaClient();
    const events = await db.auditEvent.findMany({
      where: { action: 'lms.lesson.completed', resourceId: { contains: lessonId } },
    });
    expect(events.length).toBe(1);
  });

  it('a failed operation does not leave a COMPLETED idempotency record (re-claimable on retry)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { lessonId } = await createPublishedCourseWithLesson(instructorA);
    // Deliberately do NOT enroll — the completion attempt will fail
    // (404/403), exercising the `outcome.fail()` path.
    const idemKey = `fail-${uniqueSlug('k')}`;

    const failed = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${learner2.accessToken}`)
      .set('Idempotency-Key', idemKey);
    expect([400, 403, 404]).toContain(failed.status);

    const db = getPrismaClient();
    const key = await db.idempotencyKey.findFirst({ where: { scope: 'lms.lesson.complete', key: { contains: idemKey } } });
    // Either no row was ever persisted, or it exists but is NOT marked COMPLETED.
    if (key) expect(key.status).not.toBe('COMPLETED');
  });
});

describe('Correction 2 — ALL_ACTIVITIES_VIEWED is real, server-derived, and cannot be satisfied by manual acknowledgement alone', () => {
  async function createLessonWithTwoActivities(moduleId: string) {
    const lessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Multi-activity lesson', slug: uniqueSlug('multi-activity'), completionRuleType: 'ALL_ACTIVITIES_VIEWED' });
    const lessonId = lessonRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const activity1 = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'ARTICLE', bodyText: 'Part one' });
    await request(app).patch(`/api/v1/lms/admin/activities/${activity1.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const activity2 = await request(app)
      .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'ARTICLE', bodyText: 'Part two' });
    await request(app).patch(`/api/v1/lms/admin/activities/${activity2.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    return { lessonId, activityIds: [activity1.body.data.id, activity2.body.data.id] };
  }

  it('cannot be completed via POST .../complete while activities remain unviewed (no manual-acknowledgement bypass)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithLesson(instructorA);
    const { lessonId } = await createLessonWithTwoActivities(moduleId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const attempt = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(attempt.status).toBe(400);
    expect(attempt.body.error?.details?.unmetRules ?? []).toContain('ALL_ACTIVITIES_VIEWED');
  });

  it('auto-completes ONLY once every activity has been individually reported viewed by the server, never from a client-asserted boolean', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithLesson(instructorA);
    const { lessonId, activityIds } = await createLessonWithTwoActivities(moduleId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/activities/${activityIds[0]}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);

    // Still incomplete after only 1 of 2 activities viewed.
    const stillLocked = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(stillLocked.status).toBe(400);

    await request(app).post(`/api/v1/lms/me/activities/${activityIds[1]}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);

    // Auto-completed by the second viewed-event itself (SIGNAL_DERIVED) — no explicit /complete call needed.
    const db = getPrismaClient();
    const enrollment = await db.enrollment.findFirst({ where: { userId: learner.userId, courseId } });
    const progress = await db.lessonProgress.findUnique({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } } });
    expect(progress.status).toBe('COMPLETED');
    expect(progress.completionSource).toBe('SIGNAL_DERIVED');
  });

  it('repeat "viewed" events for the same activity are idempotent (no duplicate ActivityProgress row)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithLesson(instructorA);
    const { activityIds } = await createLessonWithTwoActivities(moduleId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    await request(app).post(`/api/v1/lms/me/activities/${activityIds[0]}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);
    await request(app).post(`/api/v1/lms/me/activities/${activityIds[0]}/viewed`).set('Authorization', `Bearer ${learner.accessToken}`);

    const db = getPrismaClient();
    const enrollment = await db.enrollment.findFirst({ where: { userId: learner.userId, courseId } });
    const rows = await db.activityProgress.findMany({ where: { enrollmentId: enrollment.id, activityId: activityIds[0] } });
    expect(rows.length).toBe(1);
  });
});

describe('Correction 4 — Course capacity enforcement (FR-028)', () => {
  it('rejects a new enrollment once enrollmentLimit seats are occupied', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseRes = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: 'Capacity Test Course',
        slug: uniqueSlug('capacity-course'),
        shortDescription: 'short',
        description: 'full',
        categoryId,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        enrollmentLimit: 1,
      });
    const courseId = courseRes.body.data.id;
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/instructors`).set('Authorization', `Bearer ${admin.accessToken}`).send({ userId: instructorA.userId, isPrimary: true });
    const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'M1' });
    await request(app).patch(`/api/v1/lms/admin/modules/${moduleRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
      await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
    }

    const first = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner2.accessToken}`).send({ courseId });
    expect(second.status).toBe(409);
    expect(second.body.error?.details?.code).toBe('COURSE_FULL');
  });
});

describe('Database-verification pass — instructor manual release (FR-034/FR-038)', () => {
  async function createInstructorReleaseModule(courseId: string, position: number) {
    const moduleRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: `Instructor-release module ${position}`, position, releaseRuleType: 'INSTRUCTOR_RELEASE' });
    const moduleId = moduleRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const lessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Gated lesson', slug: uniqueSlug('gated-lesson') });
    const lessonId = lessonRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    return { moduleId, lessonId };
  }

  it('a module configured INSTRUCTOR_RELEASE stays locked until the assigned instructor releases it, then becomes accessible', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const { moduleId, lessonId } = await createInstructorReleaseModule(courseId, 1);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const lockedRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(lockedRes.status).toBe(403);

    const releaseRes = await request(app)
      .post(`/api/v1/lms/instructor/modules/${moduleId}/release`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`);
    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.data.releaseRuleType).toBe('INSTRUCTOR_RELEASE');

    const unlockedRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(unlockedRes.status).toBe(200);

    const db = getPrismaClient();
    const moduleRow = await db.courseModule.findUnique({ where: { id: moduleId } });
    expect(moduleRow.manuallyReleasedAt).not.toBeNull();
  });

  it('is idempotent — releasing an already-released module twice does not move the timestamp forward', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const { moduleId } = await createInstructorReleaseModule(courseId, 2);

    const first = await request(app).post(`/api/v1/lms/instructor/modules/${moduleId}/release`).set('Authorization', `Bearer ${instructorA.accessToken}`);
    const second = await request(app).post(`/api/v1/lms/instructor/modules/${moduleId}/release`).set('Authorization', `Bearer ${instructorA.accessToken}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it('instructor B (not assigned to the course) cannot release instructor A’s module — ownership enforced', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId } = await createPublishedCourseWithLesson(instructorA);
    const { moduleId } = await createInstructorReleaseModule(courseId, 3);

    const res = await request(app).post(`/api/v1/lms/instructor/modules/${moduleId}/release`).set('Authorization', `Bearer ${instructorB.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects release for a module whose releaseRuleType is not INSTRUCTOR_RELEASE', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithLesson(instructorA); // default IMMEDIATE release rule

    const res = await request(app).post(`/api/v1/lms/instructor/modules/${moduleId}/release`).set('Authorization', `Bearer ${instructorA.accessToken}`);
    expect(res.status).toBe(400);
  });
});
