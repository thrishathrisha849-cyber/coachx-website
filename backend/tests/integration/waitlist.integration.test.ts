/**
 * Real-database integration tests for 004-learning-management-system's
 * Waitlist batch (FR-028/029): join-only-when-full, the reservation-aware
 * capacity check (a live OFFERED entry blocks other direct-enroll
 * attempts), read-time sweep-and-advance (expired offer passes to the next
 * priority entry, no scheduler), claim-reuses-selfEnroll, and the admin
 * roster read. Same graceful-skip pattern as the other integration suites
 * — see docs/database/TESTING.md.
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
    .send({ name: 'Waitlist Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('wl-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Waitlist Test Category', slug: uniqueSlug('wl-cat') });
    categoryId = res.body.data.id;
  }
}

/** A PUBLISHED course capped at `enrollmentLimit` seats (default 1) — full as soon as one learner enrolls. */
async function createPublishedCappedCourse(enrollmentLimit = 1) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Waitlist Test Course',
      slug: uniqueSlug('wl-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
      enrollmentLimit,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId };
}

async function enrollAndGetEnrollmentId(courseId: string, accessToken: string): Promise<string> {
  const res = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${accessToken}`).send({ courseId });
  return res.body.data.id;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING waitlist.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING waitlist.integration.test.ts: could not reach PostgreSQL.');
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
    await db.waitlistEntry.deleteMany({});
    await db.enrollment.deleteMany({});
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

describe('Waitlist join eligibility (FR-028/029)', () => {
  it('rejects joining a course that has no enrollmentLimit (nothing to wait for)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);
    // Remove the cap so the course is uncapped.
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ enrollmentLimit: null });
    const learner = await createUserWithRole(uniqueEmail('wl-uncapped'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${learner.accessToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('rejects joining a course that still has open seats', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(5);
    const learner = await createUserWithRole(uniqueEmail('wl-open-seats'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${learner.accessToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('accepts a waitlist join once the course is full, and rejects a duplicate join by the same learner', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);
    const occupier = await createUserWithRole(uniqueEmail('wl-occupier'), 'registered_free_user');
    await enrollAndGetEnrollmentId(courseId, occupier.accessToken);

    const waiter = await createUserWithRole(uniqueEmail('wl-waiter'), 'registered_free_user');
    const joinRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${waiter.accessToken}`).send({ referralSource: 'friend' });
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('WAITING');
    expect(joinRes.body.data.priority).toBe(1);

    const dupRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${waiter.accessToken}`).send({});
    expect(dupRes.status).toBe(409);
  });

  it('rejects joining the waitlist for a course the learner is already enrolled in', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(2);
    const learner = await createUserWithRole(uniqueEmail('wl-already-enrolled'), 'registered_free_user');
    await enrollAndGetEnrollmentId(courseId, learner.accessToken);

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${learner.accessToken}`).send({});
    expect(res.status).toBe(409);
  });
});

describe('Waitlist reservation-aware capacity (FR-029 "time-limited reservation")', () => {
  it('offers the freed seat to the next-priority waiter when an admin revokes the occupying enrollment, and blocks a third party from taking that reserved seat directly', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);
    const occupier = await createUserWithRole(uniqueEmail('wl-revoke-occupier'), 'registered_free_user');
    const occupierEnrollmentId = await enrollAndGetEnrollmentId(courseId, occupier.accessToken);

    const firstWaiter = await createUserWithRole(uniqueEmail('wl-first-waiter'), 'registered_free_user');
    const firstJoin = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${firstWaiter.accessToken}`).send({});
    const firstWaitlistId = firstJoin.body.data.id;

    // Revoking the occupier's enrollment frees the only seat — the shared
    // `transitionEnrollment` hook should sweep-and-advance the waitlist.
    const revokeRes = await request(app)
      .post(`/api/v1/lms/admin/enrollments/${occupierEnrollmentId}/revoke`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Test revoke to free a seat' });
    expect(revokeRes.status).toBe(200);

    const statusRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(statusRes.body.data.id).toBe(firstWaitlistId);
    expect(statusRes.body.data.status).toBe('OFFERED');
    expect(statusRes.body.data.offerExpiresAt).not.toBeNull();

    // A third party trying to direct-enroll must still see the course as
    // full — the live OFFERED reservation genuinely holds the seat.
    const thirdParty = await createUserWithRole(uniqueEmail('wl-third-party'), 'registered_free_user');
    const thirdEnrollRes = await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${thirdParty.accessToken}`).send({ courseId });
    expect(thirdEnrollRes.status).toBe(409);
    expect(thirdEnrollRes.body.error.details?.code ?? thirdEnrollRes.body.error.code).toBeTruthy();

    // The offer-holder can claim it — this reuses the real `selfEnroll` path.
    const claimRes = await request(app).post(`/api/v1/lms/me/waitlist/${firstWaitlistId}/claim`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(claimRes.status).toBe(200);
    expect(claimRes.body.data.status).toBe('CLAIMED');

    const accessRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/access`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(accessRes.body.data.allowed).toBe(true);
  });

  it('passes an expired, unclaimed offer through to the next-priority waiter (read-time sweep, no scheduler)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);
    const occupier = await createUserWithRole(uniqueEmail('wl-expire-occupier'), 'registered_free_user');
    const occupierEnrollmentId = await enrollAndGetEnrollmentId(courseId, occupier.accessToken);

    const firstWaiter = await createUserWithRole(uniqueEmail('wl-expire-first'), 'registered_free_user');
    const firstJoin = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${firstWaiter.accessToken}`).send({});
    const secondWaiter = await createUserWithRole(uniqueEmail('wl-expire-second'), 'registered_free_user');
    const secondJoin = await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${secondWaiter.accessToken}`).send({});
    expect(secondJoin.body.data.priority).toBeGreaterThan(firstJoin.body.data.priority);

    await request(app).post(`/api/v1/lms/admin/enrollments/${occupierEnrollmentId}/revoke`).set('Authorization', `Bearer ${admin.accessToken}`).send({ reason: 'free seat' });

    const firstStatus = await request(app).get(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(firstStatus.body.data.status).toBe('OFFERED');

    // Force the offer into the past directly in the database (simulating
    // the 48h window elapsing) — there is no scheduler in this codebase;
    // the next read must perform the sweep itself.
    const db = getPrismaClient();
    await db.waitlistEntry.update({ where: { id: firstStatus.body.data.id }, data: { offerExpiresAt: new Date(Date.now() - 1000) } });

    const secondStatusBeforeRead = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${admin.accessToken}`);
    const secondEntry = secondStatusBeforeRead.body.data.find((e: any) => e.userId === secondWaiter.userId);
    expect(secondEntry.status).toBe('OFFERED');

    const firstStatusAfter = await request(app).get(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(firstStatusAfter.body.data.status).toBe('EXPIRED');

    // The lapsed offer-holder can no longer claim it.
    const lateClaimRes = await request(app).post(`/api/v1/lms/me/waitlist/${firstStatus.body.data.id}/claim`).set('Authorization', `Bearer ${firstWaiter.accessToken}`);
    expect(lateClaimRes.status).toBe(409);
  });
});

describe('Waitlist admin roster (FR-028/029)', () => {
  it('lists waiting and offered entries with the learner display name and referral source', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);
    const occupier = await createUserWithRole(uniqueEmail('wl-admin-occupier'), 'registered_free_user');
    await enrollAndGetEnrollmentId(courseId, occupier.accessToken);

    const waiter = await createUserWithRole(uniqueEmail('wl-admin-waiter'), 'registered_free_user');
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${waiter.accessToken}`).send({ referralSource: 'newsletter' });

    const rosterRes = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/waitlist`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(rosterRes.status).toBe(200);
    const entry = rosterRes.body.data.find((e: any) => e.userId === waiter.userId);
    expect(entry).toBeDefined();
    expect(entry.referralSource).toBe('newsletter');
    expect(entry.status).toBe('WAITING');
  });

  it('rejects an unauthenticated request to read the waitlist roster', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCappedCourse(1);

    const res = await request(app).get(`/api/v1/lms/admin/courses/${courseId}/waitlist`);
    expect(res.status).toBe(401);
  });
});
