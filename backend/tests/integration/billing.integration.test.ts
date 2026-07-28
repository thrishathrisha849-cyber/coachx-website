/**
 * Real-database integration tests for Phase 7 Part 1 — Billing Foundation
 * (Products, Product Pricing, Membership Plans, Plan Versions, Plan
 * Entitlements). Same graceful-skip pattern as `lms.integration.test.ts` /
 * `auth.integration.test.ts` — see docs/database/TESTING.md.
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
function nextTestIp(): string {
  registrationIpCounter += 1;
  return `10.${(registrationIpCounter >> 16) & 0xff}.${(registrationIpCounter >> 8) & 0xff}.${registrationIpCounter & 0xff}`;
}

async function createUserWithRole(email: string, roleName: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', nextTestIp())
    .send({ name: 'Billing Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

let financeAdmin: { userId: string; accessToken: string };
let regularUser: { userId: string; accessToken: string };

async function ensureFixtures() {
  if (!financeAdmin) financeAdmin = await createUserWithRole(uniqueEmail('billing-finance-admin'), 'finance_admin');
  if (!regularUser) regularUser = await createUserWithRole(uniqueEmail('billing-regular-user'), 'registered_free_user');
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING billing.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.');
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING billing.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
        '(expected in this sandbox — no Docker/Postgres available; see docs/database/TESTING.md).',
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
    await db.planEntitlement.deleteMany({});
    await db.planVersion.deleteMany({});
    await db.membershipPlan.deleteMany({});
    await db.productPrice.deleteMany({});
    await db.product.deleteMany({});
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

async function createProduct(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/v1/billing/admin/products')
    .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
    .send({
      code: uniqueSlug('prod'),
      name: 'Premium Membership',
      slug: uniqueSlug('premium-membership'),
      type: 'MEMBERSHIP_INDIVIDUAL',
      pricingModel: 'RECURRING_FIXED',
      ...overrides,
    });
  return res;
}

describe('Products (Phase 7 Part 1)', () => {
  it('creates a product and rejects a duplicate slug', async () => {
    if (skip()) return;
    await ensureFixtures();

    const slug = uniqueSlug('dup-product');
    const first = await createProduct({ code: uniqueSlug('code1'), slug });
    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe('DRAFT');

    const duplicate = await createProduct({ code: uniqueSlug('code2'), slug });
    expect(duplicate.status).toBe(409);
  });

  it('rejects a duplicate code', async () => {
    if (skip()) return;
    await ensureFixtures();

    const code = uniqueSlug('dup-code');
    const first = await createProduct({ code, slug: uniqueSlug('slug1') });
    expect(first.status).toBe(201);

    const duplicate = await createProduct({ code, slug: uniqueSlug('slug2') });
    expect(duplicate.status).toBe(409);
  });

  it('denies product creation to a user without billing.catalog.manage permission', async () => {
    if (skip()) return;
    await ensureFixtures();

    const res = await request(app)
      .post('/api/v1/billing/admin/products')
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .send({
        code: uniqueSlug('denied'),
        name: 'Denied Product',
        slug: uniqueSlug('denied'),
        type: 'MEMBERSHIP_INDIVIDUAL',
        pricingModel: 'RECURRING_FIXED',
      });
    expect(res.status).toBe(403);
  });

  it('walks a product through its status lifecycle and rejects an invalid transition', async () => {
    if (skip()) return;
    await ensureFixtures();

    const created = await createProduct();
    const productId = created.body.data.id;

    const toReview = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ status: 'REVIEW_PENDING' });
    expect(toReview.status).toBe(200);

    const toApproved = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ status: 'APPROVED' });
    expect(toApproved.status).toBe(200);

    // DRAFT is not reachable directly from APPROVED (must go through ARCHIVED first).
    const invalidJump = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ status: 'DRAFT' });
    expect(invalidJump.status).toBe(400);

    const toActive = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ status: 'ACTIVE' });
    expect(toActive.status).toBe(200);
    expect(toActive.body.data.status).toBe('ACTIVE');
  });

  it('never exposes a DRAFT product via the public detail endpoint', async () => {
    if (skip()) return;
    await ensureFixtures();

    const created = await createProduct();
    const slug = created.body.data.slug;

    const publicRes = await request(app).get(`/api/v1/billing/products/${slug}`);
    expect(publicRes.status).toBe(404);
  });

  it('exposes an ACTIVE product publicly with no internal-field leakage', async () => {
    if (skip()) return;
    await ensureFixtures();

    const created = await createProduct();
    const productId = created.body.data.id;
    const slug = created.body.data.slug;

    for (const status of ['REVIEW_PENDING', 'APPROVED', 'ACTIVE']) {
      await request(app)
        .post(`/api/v1/billing/admin/products/${productId}/status`)
        .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
        .send({ status });
    }

    const publicRes = await request(app).get(`/api/v1/billing/products/${slug}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.slug).toBe(slug);
    expect(publicRes.body.data).not.toHaveProperty('createdBy');
    expect(publicRes.body.data).not.toHaveProperty('version');
  });
});

describe('Product Prices (FR-005/FR-006/FR-007)', () => {
  it('creates a DRAFT price, publishes it, and edits it in place while still DRAFT', async () => {
    if (skip()) return;
    await ensureFixtures();

    const product = await createProduct();
    const productId = product.body.data.id;

    const priceRes = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/prices`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ unitAmountMinor: 99900, billingInterval: 'MONTHLY' });
    expect(priceRes.status).toBe(201);
    expect(priceRes.body.data.status).toBe('DRAFT');
    const priceId = priceRes.body.data.id;

    const editRes = await request(app)
      .patch(`/api/v1/billing/admin/prices/${priceId}`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ unitAmountMinor: 89900 });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.id).toBe(priceId);
    expect(editRes.body.data.unitAmountMinor).toBe(89900);

    const publishRes = await request(app)
      .post(`/api/v1/billing/admin/prices/${priceId}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('ACTIVE');
  });

  it('never edits a published (ACTIVE) price in place — creates a new version instead', async () => {
    if (skip()) return;
    await ensureFixtures();

    const product = await createProduct();
    const productId = product.body.data.id;

    const priceRes = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/prices`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ unitAmountMinor: 99900, billingInterval: 'MONTHLY' });
    const priceId = priceRes.body.data.id;

    await request(app)
      .post(`/api/v1/billing/admin/prices/${priceId}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);

    const editRes = await request(app)
      .patch(`/api/v1/billing/admin/prices/${priceId}`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ unitAmountMinor: 79900 });
    expect(editRes.status).toBe(200);
    // A NEW row — never the same id as the ACTIVE one.
    expect(editRes.body.data.id).not.toBe(priceId);
    expect(editRes.body.data.unitAmountMinor).toBe(79900);
    expect(editRes.body.data.status).toBe('DRAFT');
    expect(editRes.body.data.priceLineageId).toBe(priceRes.body.data.priceLineageId);
    expect(editRes.body.data.version).toBe(2);

    // The original ACTIVE row must be completely untouched.
    const db = getPrismaClient();
    const original = await db.productPrice.findUnique({ where: { id: priceId } });
    expect(original.unitAmountMinor).toBe(99900);
    expect(original.status).toBe('ACTIVE');
  });
});

describe('Membership Plans, Versions & Entitlements (FR-008–FR-013)', () => {
  it('rejects linking a plan to a non-membership product', async () => {
    if (skip()) return;
    await ensureFixtures();

    const course = await createProduct({ type: 'COURSE', code: uniqueSlug('course-code'), slug: uniqueSlug('course-slug') });
    const productId = course.body.data.id;

    const planRes = await request(app)
      .post('/api/v1/billing/admin/plans')
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ code: uniqueSlug('plan-invalid'), productId });
    expect(planRes.status).toBe(400);
  });

  it('publishing a version atomically archives the previously published version, and only one PUBLISHED version ever exists', async () => {
    if (skip()) return;
    await ensureFixtures();

    const product = await createProduct();
    const productId = product.body.data.id;

    const planRes = await request(app)
      .post('/api/v1/billing/admin/plans')
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ code: uniqueSlug('plan'), productId });
    expect(planRes.status).toBe(201);
    const planId = planRes.body.data.id;

    const v1Res = await request(app)
      .post(`/api/v1/billing/admin/plans/${planId}/versions`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ name: 'Premium v1', recommendedReason: 'BEST_VALUE' });
    expect(v1Res.status).toBe(201);
    const v1Id = v1Res.body.data.id;

    // Cannot publish a version with no entitlements.
    const publishNoEntitlements = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${v1Id}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);
    expect(publishNoEntitlements.status).toBe(400);

    const entitlementRes = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${v1Id}/entitlements`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ key: 'community.access', type: 'BOOLEAN_ACCESS', value: true });
    expect(entitlementRes.status).toBe(201);

    const publishV1 = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${v1Id}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);
    expect(publishV1.status).toBe(200);
    expect(publishV1.body.data.status).toBe('PUBLISHED');

    // Cannot edit a PUBLISHED version directly.
    const editPublished = await request(app)
      .patch(`/api/v1/billing/admin/plan-versions/${v1Id}`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ name: 'Renamed' });
    expect(editPublished.status).toBe(400);

    const v2Res = await request(app)
      .post(`/api/v1/billing/admin/plans/${planId}/versions`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ name: 'Premium v2' });
    const v2Id = v2Res.body.data.id;
    await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${v2Id}/entitlements`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ key: 'community.access', type: 'BOOLEAN_ACCESS', value: true });

    const publishV2 = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${v2Id}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);
    expect(publishV2.status).toBe(200);

    const db = getPrismaClient();
    const versions = await db.planVersion.findMany({ where: { planId } });
    const published = versions.filter((v: any) => v.status === 'PUBLISHED');
    expect(published).toHaveLength(1);
    expect(published[0].id).toBe(v2Id);

    const archivedV1 = versions.find((v: any) => v.id === v1Id);
    expect(archivedV1.status).toBe('ARCHIVED');
  });

  it('exposes an active plan on the public comparison endpoint with its published version and active prices', async () => {
    if (skip()) return;
    await ensureFixtures();

    const product = await createProduct();
    const productId = product.body.data.id;

    const priceRes = await request(app)
      .post(`/api/v1/billing/admin/products/${productId}/prices`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ unitAmountMinor: 49900, billingInterval: 'MONTHLY' });
    await request(app)
      .post(`/api/v1/billing/admin/prices/${priceRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);

    const planRes = await request(app)
      .post('/api/v1/billing/admin/plans')
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ code: uniqueSlug('public-plan'), productId });
    const planId = planRes.body.data.id;

    const versionRes = await request(app)
      .post(`/api/v1/billing/admin/plans/${planId}/versions`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ name: 'Public Plan v1', badgeText: 'Popular' });
    const versionId = versionRes.body.data.id;

    await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${versionId}/entitlements`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ key: 'community.access', type: 'BOOLEAN_ACCESS', value: true });

    await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${versionId}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);

    // Not on the public list yet — the PRODUCT and PLAN are still DRAFT.
    const beforeActive = await request(app).get('/api/v1/billing/plans');
    expect(beforeActive.body.data.some((p: any) => p.id === planId)).toBe(false);

    for (const status of ['REVIEW_PENDING', 'APPROVED', 'ACTIVE']) {
      await request(app)
        .post(`/api/v1/billing/admin/products/${productId}/status`)
        .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
        .send({ status });
    }
    await request(app)
      .patch(`/api/v1/billing/admin/plans/${planId}`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ status: 'ACTIVE' });

    const afterActive = await request(app).get('/api/v1/billing/plans');
    expect(afterActive.status).toBe(200);
    const found = afterActive.body.data.find((p: any) => p.id === planId);
    expect(found).toBeDefined();
    expect(found.currentVersion.name).toBe('Public Plan v1');
    expect(found.currentVersion.badgeText).toBe('Popular');
    expect(found.currentVersion.entitlements).toHaveLength(1);
    expect(found.prices).toHaveLength(1);
    expect(found.prices[0].unitAmountMinor).toBe(49900);
  });

  it('rejects modifying entitlements on a non-DRAFT plan version', async () => {
    if (skip()) return;
    await ensureFixtures();

    const product = await createProduct();
    const planRes = await request(app)
      .post('/api/v1/billing/admin/plans')
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ code: uniqueSlug('locked-plan'), productId: product.body.data.id });
    const planId = planRes.body.data.id;

    const versionRes = await request(app)
      .post(`/api/v1/billing/admin/plans/${planId}/versions`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ name: 'Locked v1' });
    const versionId = versionRes.body.data.id;

    const entitlementRes = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${versionId}/entitlements`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ key: 'community.access', type: 'BOOLEAN_ACCESS', value: true });

    await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${versionId}/publish`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);

    const addAfterPublish = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${versionId}/entitlements`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`)
      .send({ key: 'ai.quota', type: 'NUMERIC_QUOTA', value: 100 });
    expect(addAfterPublish.status).toBe(400);

    const deleteAfterPublish = await request(app)
      .delete(`/api/v1/billing/admin/entitlements/${entitlementRes.body.data.id}`)
      .set('Authorization', `Bearer ${financeAdmin.accessToken}`);
    expect(deleteAfterPublish.status).toBe(400);
  });
});
