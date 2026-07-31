/**
 * Real-database integration tests for 004-learning-management-system's
 * Bulk CSV Import batch (FR-032): successful per-row enrollment creation,
 * duplicate handling (both an already-enrolled user AND two rows for the
 * same email in one file), a missing-header rejection, per-row error
 * reporting for an unknown email (never aborting the rest of the import),
 * the row-count cap, and RBAC enforcement. Same graceful-skip pattern as
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
    .send({ name: 'Bulk Import Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('bulk-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Bulk Import Test Category', slug: uniqueSlug('bulk-cat') });
    categoryId = res.body.data.id;
  }
}

async function createPublishedCourse() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Bulk Import Test Course',
      slug: uniqueSlug('bulk-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleRes.body.data.id}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING bulk-enrollment.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING bulk-enrollment.integration.test.ts: could not reach PostgreSQL.');
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

describe('Bulk CSV Import (FR-032)', () => {
  it('rejects a CSV whose header is missing the required email column', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/enrollments/bulk-import`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ csvContent: 'name,reason\nSomeone,VIP' });
    expect(res.status).toBe(400);
  });

  it('creates real enrollments for each valid row, reports an unknown email as an ERROR row without aborting the rest of the import, and passes through accessStartAt/accessEndAt', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    const learnerA = await createUserWithRole(uniqueEmail('bulk-learner-a'), 'registered_free_user');
    const learnerB = await createUserWithRole(uniqueEmail('bulk-learner-b'), 'registered_free_user');

    const accessEndAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const csvContent = `email,accessEndAt,reason\n${await getEmailOf(learnerA.userId)},${accessEndAt},Cohort A\nnonexistent-${Date.now()}@example.com,,\n${await getEmailOf(learnerB.userId)},,Cohort A`;

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/enrollments/bulk-import`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ csvContent });

    expect(res.status).toBe(200);
    expect(res.body.data.totalRows).toBe(3);
    expect(res.body.data.created).toBe(2);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.duplicates).toBe(0);

    const errorRow = res.body.data.rows.find((r: any) => r.status === 'ERROR');
    expect(errorRow.message).toBe('No user found with this email');

    const db = getPrismaClient();
    const enrollmentA = await db.enrollment.findFirst({ where: { userId: learnerA.userId, courseId } });
    expect(enrollmentA).not.toBeNull();
    expect(enrollmentA.accessEndAt.toISOString()).toBe(accessEndAt);
  });

  it('reports an already-enrolled user as DUPLICATE without creating a second enrollment record, including two rows for the same email with DIFFERENT accessEndAt values in one file', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    const learner = await createUserWithRole(uniqueEmail('bulk-dup'), 'registered_free_user');
    const email = await getEmailOf(learner.userId);
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const secondLearner = await createUserWithRole(uniqueEmail('bulk-dup-2'), 'registered_free_user');
    const secondEmail = await getEmailOf(secondLearner.userId);

    // Deliberately DIFFERENT accessEndAt per row for the same email — this
    // is the exact scenario that once made the second occurrence hit
    // `adminGrantEnrollment`'s idempotency-payload-mismatch safety check
    // (caught via a live curl walkthrough against coachx_dev) instead of
    // being reported as DUPLICATE; the service now short-circuits on an
    // already-known existing enrollment before ever calling it again.
    const csvContent = `email,accessEndAt\n${email},\n${secondEmail},2027-01-01T00:00:00.000Z\n${secondEmail},2028-01-01T00:00:00.000Z`;
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/enrollments/bulk-import`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ csvContent });

    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(1); // only the second learner's FIRST row is a genuinely new enrollment
    expect(res.body.data.duplicates).toBe(2); // the already-enrolled first learner's row, plus the second learner's SECOND row in the same file

    const db = getPrismaClient();
    const count = await db.enrollment.count({ where: { userId: secondLearner.userId, courseId } });
    expect(count).toBe(1);
  });

  it('rejects a CSV exceeding the maximum row count', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();

    const rows = Array.from({ length: 1001 }, (_, i) => `user${i}@example.com`);
    const csvContent = `email\n${rows.join('\n')}`;

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/enrollments/bulk-import`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ csvContent });
    expect(res.status).toBe(400);
  });

  it('rejects a non-privileged user from running a bulk import', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId } = await createPublishedCourse();
    const learner = await createUserWithRole(uniqueEmail('bulk-unauthorized'), 'registered_free_user');

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/enrollments/bulk-import`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ csvContent: 'email\nsomeone@example.com' });
    expect(res.status).toBe(403);
  });
});

async function getEmailOf(userId: string): Promise<string> {
  const db = getPrismaClient();
  const user = await db.user.findUnique({ where: { id: userId } });
  return user.email;
}
