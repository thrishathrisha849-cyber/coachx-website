/**
 * Real-database integration tests for 004-learning-management-system's
 * Wishlist batch (FR-027): eligibility (ENROLLMENT_PAUSED only — an open
 * or full course, or a not-publicly-reachable one, is rejected), idempotent
 * save/remove, the real "enrollment-open" email hook in
 * `course.service.ts`'s `changeCourseStatus`, the real "price-drop" email
 * hook in `updateExistingCourse`, and read-time `priceDropped`/
 * `enrollmentOpen` computation. Same graceful-skip pattern as the other
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
    .send({ name: 'Wishlist Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('wl2-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Wishlist Test Category', slug: uniqueSlug('wl2-cat') });
    categoryId = res.body.data.id;
  }
}

async function createPublishedCourse(priceAmountMinor = 0) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Wishlist Test Course',
      slug: uniqueSlug('wl2-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: priceAmountMinor > 0 ? 'PAID' : 'FREE',
      priceAmountMinor,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId };
}

async function pauseEnrollment(courseId: string) {
  await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'ENROLLMENT_PAUSED' });
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING wishlist.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING wishlist.integration.test.ts: could not reach PostgreSQL.');
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
    await db.wishlistEntry.deleteMany({});
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

describe('Wishlist eligibility (FR-027)', () => {
  it('rejects saving a course that is open for enrollment', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    const learner = await createUserWithRole(uniqueEmail('wl2-open'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(400);
  });

  it('rejects saving a course that is not publicly reachable (DRAFT)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const draftRes = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Draft Course', slug: uniqueSlug('wl2-draft'), shortDescription: 'short', description: 'full', categoryId, thumbnailUrl: 'https://example.com/t.jpg', priceType: 'FREE', priceAmountMinor: 0 });
    const learner = await createUserWithRole(uniqueEmail('wl2-draft-learner'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/courses/${draftRes.body.data.id}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(400);
  });

  it('rejects saving a course the learner is already enrolled in', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    const learner = await createUserWithRole(uniqueEmail('wl2-enrolled'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(409);
  });

  it('accepts saving an ENROLLMENT_PAUSED course, and is idempotent on a duplicate save', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    await pauseEnrollment(courseId);
    const learner = await createUserWithRole(uniqueEmail('wl2-paused'), 'registered_free_user');

    const saveRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(saveRes.status).toBe(201);
    expect(saveRes.body.data.courseStatus).toBe('ENROLLMENT_PAUSED');
    expect(saveRes.body.data.enrollmentOpen).toBe(false);

    const dupRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(dupRes.status).toBe(201);
    expect(dupRes.body.data.id).toBe(saveRes.body.data.id);

    const listRes = await request(app).get('/api/v1/lms/me/wishlist').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(1);
  });

  it('removing a wishlist entry is idempotent (a non-existent entry is a no-op success)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    await pauseEnrollment(courseId);
    const learner = await createUserWithRole(uniqueEmail('wl2-remove'), 'registered_free_user');
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);

    const removeRes = await request(app).delete(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(removeRes.status).toBe(204);

    const secondRemoveRes = await request(app).delete(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(secondRemoveRes.status).toBe(204);

    const listRes = await request(app).get('/api/v1/lms/me/wishlist').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(0);
  });
});

describe('Wishlist real notification hooks (FR-027)', () => {
  it('sends a real "enrollment open" email the moment the course leaves ENROLLMENT_PAUSED, and reflects enrollmentOpen at read time', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    await pauseEnrollment(courseId);
    const learnerEmail = uniqueEmail('wl2-notify-open');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);

    emailAdapter.clear();

    const reopenRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(reopenRes.status).toBe(200);

    const sentToLearner = emailAdapter.sent.find((m: any) => m.to === learnerEmail.toLowerCase() && m.subject.toLowerCase().includes('enrollment is now open'));
    expect(sentToLearner).toBeDefined();

    const listRes = await request(app).get('/api/v1/lms/me/wishlist').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data[0].enrollmentOpen).toBe(true);
  });

  it('does not re-send the enrollment-open email on a second identical read, but resets and re-notifies after re-pausing and re-opening', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    await pauseEnrollment(courseId);
    const learnerEmail = uniqueEmail('wl2-notify-repeat');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);

    emailAdapter.clear();
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(emailAdapter.sent.filter((m: any) => m.to === learnerEmail.toLowerCase())).toHaveLength(1);

    // Re-pause then re-open — the flag resets on re-entering
    // ENROLLMENT_PAUSED, so the learner is correctly notified again.
    emailAdapter.clear();
    await pauseEnrollment(courseId);
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(emailAdapter.sent.filter((m: any) => m.to === learnerEmail.toLowerCase())).toHaveLength(1);
  });

  it('sends a real "price drop" email the moment the price is edited below what the wishlister saved at, and reflects priceDropped at read time', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse(10000);
    await pauseEnrollment(courseId);
    const learnerEmail = uniqueEmail('wl2-notify-price');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    const saveRes = await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(saveRes.body.data.priceAtSaveAmountMinor).toBe(10000);

    emailAdapter.clear();
    const priceEditRes = await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ priceAmountMinor: 5000 });
    expect(priceEditRes.status).toBe(200);

    const sentToLearner = emailAdapter.sent.find((m: any) => m.to === learnerEmail.toLowerCase() && m.subject.toLowerCase().includes('price drop'));
    expect(sentToLearner).toBeDefined();

    const listRes = await request(app).get('/api/v1/lms/me/wishlist').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data[0].priceDropped).toBe(true);
    expect(listRes.body.data[0].currentPriceAmountMinor).toBe(5000);
  });

  it('does not send a price-drop email when the price increases', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse(5000);
    await pauseEnrollment(courseId);
    const learnerEmail = uniqueEmail('wl2-notify-price-up');
    const learner = await createUserWithRole(learnerEmail, 'registered_free_user');
    await request(app).post(`/api/v1/lms/me/courses/${courseId}/wishlist`).set('Authorization', `Bearer ${learner.accessToken}`);

    emailAdapter.clear();
    await request(app).patch(`/api/v1/lms/admin/courses/${courseId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ priceAmountMinor: 8000 });

    const sentToLearner = emailAdapter.sent.find((m: any) => m.to === learnerEmail.toLowerCase());
    expect(sentToLearner).toBeUndefined();
  });
});
