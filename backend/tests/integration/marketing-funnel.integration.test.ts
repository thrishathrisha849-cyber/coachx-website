/**
 * Real-database integration tests for 002-public-website-marketing-funnel
 * — Lead Magnet funnel (US2), Webinar/Masterclass funnel (US3),
 * Checkout-state tracking (US4), and Phase 6b funnel-coverage reporting.
 * Same graceful-skip pattern as the other integration suites.
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

import crypto from 'node:crypto';
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

async function createUserWithRole(email: string, roleName: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', nextTestIp())
    .send({ name: 'Funnel Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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

let platformAdmin: { userId: string; accessToken: string };

async function ensureFixtures() {
  if (!platformAdmin) platformAdmin = await createUserWithRole(uniqueEmail('funnel-platform-admin'), 'platform_admin');
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) return;
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
    await db.checkoutSession.deleteMany({});
    await db.coupon.deleteMany({});
    await db.masterclassRegistration.deleteMany({});
    await db.masterclassConfig.deleteMany({});
    await db.lead.deleteMany({});
    await db.productPrice.deleteMany({});
    await db.product.deleteMany({});
    await db.pageVersion.deleteMany({});
    await db.pageBlock.deleteMany({});
    await db.page.deleteMany({ where: { slug: { contains: 'masterclass-' } } });
    await db.consentRecord.deleteMany({});
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

describe('Lead Magnet funnel (US2, FR-055/056)', () => {
  it('captures a lead, sends the resource email, sends the marketing follow-on ONLY when consented, and stores UTM attribution', async () => {
    if (skip()) return;
    const slug = uniqueSlug('free-guide');
    const email = uniqueEmail('lead-consented');

    const res = await request(app).post('/api/v1/funnel/leads').send({
      leadMagnetSlug: slug,
      email,
      consentMarketingEmail: true,
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'summer-launch',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.alreadyCaptured).toBe(false);

    const sentSubjects = emailAdapter.sent.filter((m: any) => m.to === email).map((m: any) => m.subject);
    expect(sentSubjects).toContain('Your resource is ready');
    expect(sentSubjects).toContain('Recommended for you');

    const db = getPrismaClient();
    const lead = await db.lead.findUnique({ where: { leadMagnetSlug_email: { leadMagnetSlug: slug, email } } });
    expect(lead.utmCampaign).toBe('summer-launch');
  });

  it('sends ONLY the transactional email when marketing consent is not given (Constitution Article VI)', async () => {
    if (skip()) return;
    const slug = uniqueSlug('free-guide');
    const email = uniqueEmail('lead-unconsented');

    await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug, email, consentMarketingEmail: false });

    const sentSubjects = emailAdapter.sent.filter((m: any) => m.to === email).map((m: any) => m.subject);
    expect(sentSubjects).toContain('Your resource is ready');
    expect(sentSubjects).not.toContain('Recommended for you');
  });

  it('does not create a duplicate Lead or re-send emails on a resubmission (double-submit edge case)', async () => {
    if (skip()) return;
    const slug = uniqueSlug('free-guide');
    const email = uniqueEmail('lead-dup');

    const first = await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug, email, consentMarketingEmail: true });
    expect(first.body.data.alreadyCaptured).toBe(false);

    const second = await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug, email, consentMarketingEmail: true });
    expect(second.status).toBe(201);
    expect(second.body.data.alreadyCaptured).toBe(true);
    expect(second.body.data.leadId).toBe(first.body.data.leadId);

    const db = getPrismaClient();
    const count = await db.lead.count({ where: { leadMagnetSlug: slug, email } });
    expect(count).toBe(1);
    expect(emailAdapter.sent.filter((m: any) => m.to === email)).toHaveLength(2); // resource + marketing, from the FIRST submission only
  });

  it('silently no-ops a honeypot-filled submission (no record created)', async () => {
    if (skip()) return;
    const slug = uniqueSlug('free-guide');
    const email = uniqueEmail('lead-bot');

    await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug, email, consentMarketingEmail: true, website: 'http://spam.example' });

    const db = getPrismaClient();
    const count = await db.lead.count({ where: { leadMagnetSlug: slug, email } });
    expect(count).toBe(0);
  });
});

describe('Consent withdrawal (FR-102, immediate effect)', () => {
  it('marks the most recent grant as withdrawn, and a subsequent lead capture correctly reports no active consent', async () => {
    if (skip()) return;
    const slug = uniqueSlug('free-guide');
    const email = uniqueEmail('lead-withdraw');

    await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug, email, consentMarketingEmail: true });
    emailAdapter.clear();

    const withdrawRes = await request(app).post('/api/v1/funnel/consent/withdraw').send({ email, channel: 'MARKETING_EMAIL' });
    expect(withdrawRes.status).toBe(200);

    const slug2 = uniqueSlug('free-guide-2');
    await request(app).post('/api/v1/funnel/leads').send({ leadMagnetSlug: slug2, email, consentMarketingEmail: false });

    const sentSubjects = emailAdapter.sent.filter((m: any) => m.to === email).map((m: any) => m.subject);
    expect(sentSubjects).not.toContain('Recommended for you');
  });
});

describe('Webinar/Masterclass funnel (US3, FR-046/058/112)', () => {
  async function createMasterclass(overrides: Record<string, unknown> = {}) {
    await ensureFixtures();
    const slug = uniqueSlug('masterclass');
    await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ slug, title: 'Free Masterclass', language: 'EN', template: 'STANDARD', seoTitle: 'Free Masterclass', seoDescription: 'Join our live masterclass.', blocks: [] });

    const configRes = await request(app)
      .post('/api/v1/funnel/admin/masterclass-configs')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({
        pageSlug: slug,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seatLimit: 1,
        speakerName: 'Priya',
        ...overrides,
      });
    return { slug, configRes };
  }

  it('registers successfully, sends a confirmation email, and the status endpoint reflects real (never fabricated) seat/countdown data', async () => {
    if (skip()) return;
    const { slug } = await createMasterclass({ seatLimit: 5 });

    const statusRes = await request(app).get('/api/v1/funnel/masterclass/status').query({ slug });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.seatsRemaining).toBe(5);
    expect(statusRes.body.data.speakerName).toBe('Priya');

    const email = uniqueEmail('mc-attendee');
    const regRes = await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'Attendee One', email });
    expect(regRes.status).toBe(201);

    const sentSubjects = emailAdapter.sent.filter((m: any) => m.to === email).map((m: any) => m.subject);
    expect(sentSubjects).toContain("You're registered!");

    const afterStatus = await request(app).get('/api/v1/funnel/masterclass/status').query({ slug });
    expect(afterStatus.body.data.seatsRemaining).toBe(4);
  });

  it('rejects registration with EVENT_FULL once seatLimit is reached, re-checked server-side at submission time', async () => {
    if (skip()) return;
    const { slug } = await createMasterclass({ seatLimit: 1 });

    const first = await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'First', email: uniqueEmail('mc-full-1') });
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'Second', email: uniqueEmail('mc-full-2') });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('EVENT_FULL');
  });

  it('rejects a duplicate registration by the same identity with DUPLICATE_REGISTRATION', async () => {
    if (skip()) return;
    const { slug } = await createMasterclass({ seatLimit: 10 });
    const email = uniqueEmail('mc-dup');

    await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'Dup User', email });
    const second = await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'Dup User', email });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('DUPLICATE_REGISTRATION');
  });

  it('closes registration exactly at the backend-configured close date, never a client-side-only countdown', async () => {
    if (skip()) return;
    const { slug } = await createMasterclass({ registrationClosesAt: new Date(Date.now() - 60_000).toISOString() });

    const statusRes = await request(app).get('/api/v1/funnel/masterclass/status').query({ slug });
    expect(statusRes.body.data.isClosed).toBe(true);

    const regRes = await request(app).post('/api/v1/funnel/masterclass/register').send({ slug, name: 'Late', email: uniqueEmail('mc-late') });
    expect(regRes.status).toBe(400);
  });
});

describe('Checkout-state tracking (US4, FR-066/068/104)', () => {
  async function createTestProduct() {
    await ensureFixtures();
    const productRes = await request(app)
      .post('/api/v1/billing/admin/products')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({
        code: uniqueSlug('checkout-prod'),
        name: 'Test Course',
        slug: uniqueSlug('test-course'),
        type: 'COURSE',
        pricingModel: 'ONE_TIME_FIXED',
      });
    return productRes.body.data.id;
  }

  it('initiates a checkout session for guest and authenticated visitors alike (FR-065)', async () => {
    if (skip()) return;
    const productId = await createTestProduct();

    const res = await request(app).post('/api/v1/checkout/sessions').send({ productId, email: uniqueEmail('guest-checkout') });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('NOT_STARTED');
  });

  it('rejects an expired coupon with COUPON_EXPIRED, leaving the cart intact (no silent partial discount)', async () => {
    if (skip()) return;
    const db = getPrismaClient();
    const code = uniqueSlug('EXPIRED').toUpperCase();
    await db.coupon.create({
      data: { code, discountType: 'PERCENTAGE', discountValue: 20, validUntil: new Date(Date.now() - 60_000), status: 'ACTIVE' },
    });

    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });

    const couponRes = await request(app).post(`/api/v1/checkout/sessions/${session.body.data.id}/coupon`).send({ code });
    expect(couponRes.status).toBe(400);
    expect(couponRes.body.error.code).toBe('COUPON_EXPIRED');

    const afterSession = await request(app).get(`/api/v1/checkout/sessions/${session.body.data.id}`);
    expect(afterSession.body.data.couponCode).toBeNull();
  });

  it('rejects an unknown/invalid coupon code with COUPON_INVALID', async () => {
    if (skip()) return;
    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });

    const couponRes = await request(app).post(`/api/v1/checkout/sessions/${session.body.data.id}/coupon`).send({ code: 'DOES-NOT-EXIST' });
    expect(couponRes.status).toBe(400);
    expect(couponRes.body.error.code).toBe('COUPON_INVALID');
  });

  it('applies a valid, active coupon and reflects it on the session', async () => {
    if (skip()) return;
    const db = getPrismaClient();
    const code = uniqueSlug('SAVE20').toUpperCase();
    await db.coupon.create({ data: { code, discountType: 'PERCENTAGE', discountValue: 20, status: 'ACTIVE' } });

    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });

    const couponRes = await request(app).post(`/api/v1/checkout/sessions/${session.body.data.id}/coupon`).send({ code });
    expect(couponRes.status).toBe(200);
    expect(couponRes.body.data.discountValue).toBe(20);
  });

  it('marks a session FAILED on payment failure (FR-069)', async () => {
    if (skip()) return;
    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });

    const failRes = await request(app).post(`/api/v1/checkout/sessions/${session.body.data.id}/fail`);
    expect(failRes.status).toBe(200);
    expect(failRes.body.data.status).toBe('FAILED');
  });

  it('rejects a forged/unsigned webhook payload and NEVER transitions the session to SUCCESS (FR-104, Constitution Article I)', async () => {
    if (skip()) return;
    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });

    const forgedRes = await request(app)
      .post(`/api/v1/checkout/sessions/${session.body.data.id}/webhook`)
      .set('X-Webhook-Signature', 'not-a-real-signature')
      .send({ event: 'payment.succeeded' });

    expect(forgedRes.status).toBe(403);

    const afterSession = await request(app).get(`/api/v1/checkout/sessions/${session.body.data.id}`);
    expect(afterSession.body.data.status).toBe('NOT_STARTED');
  });

  it('accepts a correctly-signed webhook and transitions the session to SUCCESS', async () => {
    if (skip()) return;
    const productId = await createTestProduct();
    const session = await request(app).post('/api/v1/checkout/sessions').send({ productId });
    const sessionId = session.body.data.id;

    const payload = { event: 'payment.succeeded' };
    const rawBody = JSON.stringify(payload);
    // Same dev-only secret as `config.checkout.webhookSecret`'s default.
    const signature = crypto.createHmac('sha256', 'dev-only-insecure-checkout-webhook-secret').update(rawBody).digest('hex');

    const webhookRes = await request(app)
      .post(`/api/v1/checkout/sessions/${sessionId}/webhook`)
      .set('X-Webhook-Signature', signature)
      .send(payload);

    expect(webhookRes.status).toBe(200);

    const afterSession = await request(app).get(`/api/v1/checkout/sessions/${sessionId}`);
    expect(afterSession.body.data.status).toBe('SUCCESS');
  });
});

describe('Funnel coverage reporting (Phase 6b, FR-059/SC-003)', () => {
  it('reports a non-negative count for all 7 funnel types, with C/F/G honestly flagged as depending on unbuilt features', async () => {
    if (skip()) return;
    await ensureFixtures();

    const res = await request(app)
      .get('/api/v1/funnel/admin/coverage')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);

    expect(res.status).toBe(200);
    const funnels = res.body.data.map((f: any) => f.funnel);
    expect(funnels.sort()).toEqual(
      ['A_FREE_RESOURCE', 'B_WEBINAR', 'C_ASSESSMENT', 'D_MEMBERSHIP', 'E_COURSE', 'F_EVENT', 'G_MENTOR'].sort(),
    );
    const assessment = res.body.data.find((f: any) => f.funnel === 'C_ASSESSMENT');
    expect(assessment.visitorToConversionCount).toBe(0);
    expect(assessment.note).toBeDefined();
  });

  it('denies coverage reporting to a user without kpi.view', async () => {
    if (skip()) return;
    const freeUser = await createUserWithRole(uniqueEmail('funnel-free-user'), 'registered_free_user');
    const res = await request(app).get('/api/v1/funnel/admin/coverage').set('Authorization', `Bearer ${freeUser.accessToken}`);
    expect(res.status).toBe(403);
  });
});
