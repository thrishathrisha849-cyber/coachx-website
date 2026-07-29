/**
 * Real-database integration tests for 001-product-vision-governance —
 * Organization/RBAC scoping (US3), Membership Tier catalog (US2),
 * Next-Best-Action/Lifecycle (US1/US6), Monetization disclosure (US5),
 * Trust & Safety (US7), Governance/Phase-gating (US8), and the Content
 * Governance (Course version-immutability) gap-closing work. Same
 * graceful-skip pattern as the other integration suites — see
 * docs/database/TESTING.md.
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

async function createUserWithRole(email: string, roleName: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', nextTestIp())
    .send({ name: 'Governance Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
let freeUser: { userId: string; accessToken: string };

async function ensureFixtures() {
  if (!platformAdmin) platformAdmin = await createUserWithRole(uniqueEmail('gov-platform-admin'), 'platform_admin');
  if (!freeUser) freeUser = await createUserWithRole(uniqueEmail('gov-free-user'), 'registered_free_user');
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING governance-foundation.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING governance-foundation.integration.test.ts: could not reach PostgreSQL.');
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
    await db.appeal.deleteMany({});
    await db.trustSafetyCase.deleteMany({});
    await db.governanceRecord.deleteMany({});
    await db.businessMilestone.deleteMany({});
    await db.lifecycleEvent.deleteMany({});
    await db.userLifecycleState.deleteMany({});
    await db.courseVersion.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.lesson.deleteMany({});
    await db.courseModule.deleteMany({});
    await db.courseInstructor.deleteMany({});
    await db.course.deleteMany({});
    await db.courseCategory.deleteMany({});
    await db.planEntitlement.deleteMany({});
    await db.planVersion.deleteMany({});
    await db.membershipPlan.deleteMany({});
    await db.productPrice.deleteMany({});
    await db.product.deleteMany({});
    await db.pageVersion.deleteMany({});
    await db.pageBlock.deleteMany({});
    await db.page.deleteMany({});
    await db.organization.deleteMany({});
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

describe('Organization management & RBAC scoping (US3)', () => {
  it('denies organization creation to a user without organization.create', async () => {
    if (skip()) return;
    await ensureFixtures();

    const res = await request(app)
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${freeUser.accessToken}`)
      .send({ name: 'Acme Corp', slug: uniqueSlug('acme') });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/permission denied/i);
  });

  it('allows platform_admin to create an organization and rejects a duplicate slug', async () => {
    if (skip()) return;
    await ensureFixtures();
    const slug = uniqueSlug('acme');

    const first = await request(app)
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Acme Corp', slug });
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Acme Corp Again', slug });
    expect(dup.status).toBe(409);
  });

  it("an Organization Admin sees only their OWN organization's members, never platform-wide data", async () => {
    if (skip()) return;
    await ensureFixtures();

    const orgA = await request(app)
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Org A', slug: uniqueSlug('org-a') });
    const orgB = await request(app)
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Org B', slug: uniqueSlug('org-b') });

    const orgAAdmin = await createUserWithRole(uniqueEmail('org-a-admin'), 'organization_admin');
    const orgAMember = await createUserWithRole(uniqueEmail('org-a-member'), 'registered_free_user');
    const orgBMember = await createUserWithRole(uniqueEmail('org-b-member'), 'registered_free_user');

    await request(app)
      .post(`/api/v1/admin/organizations/${orgA.body.data.id}/members`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ userId: orgAAdmin.userId });
    await request(app)
      .post(`/api/v1/admin/organizations/${orgA.body.data.id}/members`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ userId: orgAMember.userId });
    await request(app)
      .post(`/api/v1/admin/organizations/${orgB.body.data.id}/members`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ userId: orgBMember.userId });

    const res = await request(app)
      .get('/api/v1/organization/members')
      .set('Authorization', `Bearer ${orgAAdmin.accessToken}`);

    expect(res.status).toBe(200);
    const returnedIds = res.body.data.rows.map((r: any) => r.id);
    expect(returnedIds).toContain(orgAAdmin.userId);
    expect(returnedIds).toContain(orgAMember.userId);
    expect(returnedIds).not.toContain(orgBMember.userId);
  });
});

describe('Membership Tier catalog (US2, FR-048–FR-053)', () => {
  // The real 6-tier catalog (Free/Starter/Growth/Pro/Elite/Organization) is
  // populated by `database/seeds/membership-tier.seed.ts` at `npm run seed`
  // time, not by this test — a separate npm workspace's seed script, per
  // this codebase's established backend/database duplication boundary (see
  // rbac.seed.ts's own documented rationale). What THIS test verifies
  // instead, self-contained and independent of seed/run order: creating a
  // tier through the real admin API (Product → MembershipPlan →
  // PlanVersion → PlanEntitlement, exactly what the seed script itself
  // does) results in a publicly queryable, published tier with its
  // feature-grant entitlements intact — the actual mechanism FR-048–053
  // depends on.
  it('creates a membership tier through the catalog and exposes it publicly with its entitlements', async () => {
    if (skip()) return;
    await ensureFixtures();
    const code = uniqueSlug('tier');

    const product = await request(app)
      .post('/api/v1/billing/admin/products')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({
        code: `membership-${code}`,
        name: 'Test Tier Membership',
        slug: `membership-${code}`,
        type: 'MEMBERSHIP_INDIVIDUAL',
        pricingModel: 'FREE',
      });
    expect(product.status).toBe(201);

    // The public plans listing only shows plans whose Product is ACTIVE.
    await request(app).post(`/api/v1/billing/admin/products/${product.body.data.id}/status`).set('Authorization', `Bearer ${platformAdmin.accessToken}`).send({ status: 'REVIEW_PENDING' });
    await request(app).post(`/api/v1/billing/admin/products/${product.body.data.id}/status`).set('Authorization', `Bearer ${platformAdmin.accessToken}`).send({ status: 'APPROVED' });
    await request(app).post(`/api/v1/billing/admin/products/${product.body.data.id}/status`).set('Authorization', `Bearer ${platformAdmin.accessToken}`).send({ status: 'ACTIVE' });

    const plan = await request(app)
      .post('/api/v1/billing/admin/plans')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ code, productId: product.body.data.id });
    expect(plan.status).toBe(201);

    const activatePlan = await request(app)
      .patch(`/api/v1/billing/admin/plans/${plan.body.data.id}`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'ACTIVE' });
    expect(activatePlan.status).toBe(200);

    const version = await request(app)
      .post(`/api/v1/billing/admin/plans/${plan.body.data.id}/versions`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Test Tier', features: ['Test feature'], supportedBillingIntervals: [] });
    expect(version.status).toBe(201);

    const entitlement = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${version.body.data.id}/entitlements`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: code } });
    expect(entitlement.status).toBe(201);

    const publish = await request(app)
      .post(`/api/v1/billing/admin/plan-versions/${version.body.data.id}/publish`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(publish.status).toBe(200);

    const res = await request(app).get('/api/v1/billing/plans');
    expect(res.status).toBe(200);
    const found = res.body.data.find((p: any) => p.code === code);
    expect(found).toBeDefined();
    expect(found.currentVersion.name).toBe('Test Tier');
  });
});

describe('Next-Best-Action & Lifecycle (US1, US6)', () => {
  it('recommends COMPLETE_PROFILE for a brand-new user, then NICHE_DISCOVERY_ASSESSMENT once onboarding is complete', async () => {
    if (skip()) return;
    const user = await createUserWithRole(uniqueEmail('nba-user'), 'registered_free_user');

    const before = await request(app).get('/api/v1/me/next-best-action').set('Authorization', `Bearer ${user.accessToken}`);
    expect(before.status).toBe(200);
    expect(before.body.data.code).toBe('COMPLETE_PROFILE');

    const onboard = await request(app)
      .post('/api/v1/lifecycle/onboarding')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        languageSelected: 'TA',
        goalSelected: 'grow_business',
        experienceLevel: 'beginner',
        skillSelected: 'sales',
        businessStage: 'idea',
        timeAvailability: 'part_time',
        interests: ['marketing'],
      });
    expect(onboard.status).toBe(200);

    const afterOnboarding = await request(app).get('/api/v1/me/next-best-action').set('Authorization', `Bearer ${user.accessToken}`);
    expect(afterOnboarding.body.data.code).toBe('NICHE_DISCOVERY_ASSESSMENT');

    const niche = await request(app)
      .post('/api/v1/lifecycle/niche')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ niche: 'coaching' });
    expect(niche.status).toBe(200);

    const afterNiche = await request(app).get('/api/v1/me/next-best-action').set('Authorization', `Bearer ${user.accessToken}`);
    expect(afterNiche.body.data.code).toBe('START_FOUNDATION_COURSE');
  });

  it('rejects a milestone claim from being auto-verified, and only advances after explicit admin verification', async () => {
    if (skip()) return;
    await ensureFixtures();
    const user = await createUserWithRole(uniqueEmail('milestone-user'), 'registered_free_user');

    const claim = await request(app)
      .post('/api/v1/lifecycle/milestones')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ type: 'FIRST_CLIENT', evidence: { note: 'Signed my first client today' } });
    expect(claim.status).toBe(201);
    expect(claim.body.data.status).toBe('CLAIMED');

    const db = getPrismaClient();
    const stillUnverified = await db.userLifecycleState.findUnique({ where: { userId: user.userId } });
    expect(stillUnverified?.stage).not.toBe('ACHIEVER');

    const verify = await request(app)
      .post(`/api/v1/admin/milestones/${claim.body.data.id}/verify`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(verify.status).toBe(200);
    expect(verify.body.data.status).toBe('VERIFIED');

    const afterVerify = await db.userLifecycleState.findUnique({ where: { userId: user.userId } });
    expect(afterVerify?.stage).toBe('ACHIEVER');
  });

  it('denies milestone verification to a user without milestone.verify', async () => {
    if (skip()) return;
    const user = await createUserWithRole(uniqueEmail('milestone-user-2'), 'registered_free_user');
    const claim = await request(app)
      .post('/api/v1/lifecycle/milestones')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ type: 'FIRST_1000' });

    const res = await request(app)
      .post(`/api/v1/admin/milestones/${claim.body.data.id}/verify`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Monetization disclosure (US5, FR-062/FR-063)', () => {
  it('exposes isSponsored/affiliate disclosure fields on the public product shape, always present regardless of price', async () => {
    if (skip()) return;
    await ensureFixtures();

    const create = await request(app)
      .post('/api/v1/billing/admin/products')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({
        code: uniqueSlug('sponsored-prod'),
        name: 'Sponsored Webinar',
        slug: uniqueSlug('sponsored-webinar'),
        type: 'EVENT_TICKET',
        pricingModel: 'FREE',
        isSponsored: true,
        sponsorLabel: 'Sponsored by Acme',
        isAffiliate: true,
        affiliateDisclosure: 'CoachX earns a commission on this recommendation.',
      });
    expect(create.status).toBe(201);
    expect(create.body.data.isSponsored).toBe(true);

    await request(app)
      .post(`/api/v1/billing/admin/products/${create.body.data.id}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'REVIEW_PENDING' });
    await request(app)
      .post(`/api/v1/billing/admin/products/${create.body.data.id}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'APPROVED' });
    await request(app)
      .post(`/api/v1/billing/admin/products/${create.body.data.id}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'ACTIVE' });

    const publicRes = await request(app).get(`/api/v1/billing/products/${create.body.data.slug}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.isSponsored).toBe(true);
    expect(publicRes.body.data.sponsorLabel).toBe('Sponsored by Acme');
    expect(publicRes.body.data.isAffiliate).toBe(true);
    expect(publicRes.body.data.affiliateDisclosure).toMatch(/commission/i);
  });
});

describe('Trust & Safety (US7, FR-090–FR-093)', () => {
  it('files a report, actions it with a temporary suspension that actually blocks login, then restores access on a successful appeal', async () => {
    if (skip()) return;
    await ensureFixtures();
    const reporter = await createUserWithRole(uniqueEmail('ts-reporter'), 'registered_free_user');
    const reportedEmail = uniqueEmail('ts-reported');
    const reported = await createUserWithRole(reportedEmail, 'registered_free_user');

    const fileRes = await request(app)
      .post('/api/v1/trust-safety/cases')
      .set('Authorization', `Bearer ${reporter.accessToken}`)
      .send({
        type: 'REPORT',
        targetType: 'PROFILE',
        reportedUserId: reported.userId,
        reason: 'This profile posted harassment content.',
      });
    expect(fileRes.status).toBe(201);
    expect(fileRes.body.data.status).toBe('OPEN');

    const queueRes = await request(app)
      .get('/api/v1/admin/moderation/cases')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(queueRes.body.data.rows.some((c: any) => c.id === fileRes.body.data.id)).toBe(true);

    const actionRes = await request(app)
      .post(`/api/v1/admin/moderation/cases/${fileRes.body.data.id}/action`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ actionType: 'TEMPORARY_SUSPENSION', actionReason: 'Confirmed harassment.' });
    expect(actionRes.status).toBe(200);

    // The suspension is real, server-authoritative account state — login is now blocked.
    const blockedLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', nextTestIp())
      .send({ email: reportedEmail, password: 'GoodPassword1' });
    // login.service.ts: SUSPENDED status → 403 ACCOUNT_SUSPENDED (423 is reserved for the separate failed-login LOCKED state).
    expect(blockedLogin.status).toBe(403);

    const appealRes = await request(app)
      .post(`/api/v1/trust-safety/cases/${fileRes.body.data.id}/appeal`)
      .set('Authorization', `Bearer ${reported.accessToken}`)
      .send({ statement: 'I was falsely reported — please review the evidence again.' });
    expect(appealRes.status).toBe(201);

    const resolveRes = await request(app)
      .post(`/api/v1/admin/moderation/appeals/${appealRes.body.data.id}/resolve`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ decision: 'OVERTURNED', resolutionNote: 'No policy violation found on re-review.' });
    expect(resolveRes.status).toBe(200);

    const restoredLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', nextTestIp())
      .send({ email: reportedEmail, password: 'GoodPassword1' });
    expect(restoredLogin.status).toBe(200);
  });
});

describe('Governance sequence & phase gating (US8, FR-078–FR-083)', () => {
  it('advances only one stage at a time, never skipping ahead', async () => {
    if (skip()) return;
    await ensureFixtures();

    const start = await request(app)
      .post('/api/v1/admin/governance/records')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ featureName: `test-module-${Date.now()}`, phase: 'GROWTH_PLATFORM' });
    expect(start.status).toBe(201);
    expect(start.body.data.currentStage).toBe('REQUIREMENT_APPROVAL');

    const advance1 = await request(app)
      .post(`/api/v1/admin/governance/records/${start.body.data.id}/advance`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(advance1.body.data.currentStage).toBe('UX_REVIEW');
  });

  it('blocks release approval for a Phase 2 feature while Phase 1 modules are incomplete (US8 acceptance scenario 1)', async () => {
    if (skip()) return;
    await ensureFixtures();

    // A Phase 2 (GROWTH_PLATFORM) feature, walked all the way to the edge of RELEASE_APPROVAL,
    // with NO Phase 1 (FOUNDATION_MVP) module ever having reached release — Phase 1 is incomplete.
    const start = await request(app)
      .post('/api/v1/admin/governance/records')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ featureName: 'mentor_marketplace', phase: 'GROWTH_PLATFORM' });

    let recordId = start.body.data.id;
    for (const _stage of ['UX_REVIEW', 'TECHNICAL_REVIEW', 'SECURITY_REVIEW', 'DEVELOPMENT', 'QA', 'UAT']) {
      const res = await request(app)
        .post(`/api/v1/admin/governance/records/${recordId}/advance`)
        .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
      recordId = res.body.data.id;
    }

    const blockedAdvance = await request(app)
      .post(`/api/v1/admin/governance/records/${recordId}/advance`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(blockedAdvance.status).toBe(403);
    expect(blockedAdvance.body.error.message).toMatch(/phase.*FOUNDATION_MVP.*not yet complete/i);
  });

  it('flags an MVP-excluded capability rather than silently allowing it (US8 acceptance scenario 4)', async () => {
    if (skip()) return;
    await ensureFixtures();

    const res = await request(app)
      .post('/api/v1/admin/governance/mvp-scope-check')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ capabilityCode: 'public_cryptocurrency' });

    expect(res.status).toBe(200);
    expect(res.body.data.excluded).toBe(true);
  });
});

describe('Content Governance — Course version immutability (FR-099)', () => {
  it('snapshots a published course before an edit overwrites it, never destroying the prior version', async () => {
    if (skip()) return;
    await ensureFixtures();

    const category = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ name: 'Business', slug: uniqueSlug('business') });

    const createCourse = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({
        title: 'Business Foundation',
        slug: uniqueSlug('business-foundation'),
        categoryId: category.body.data.id,
        level: 'BEGINNER',
        priceType: 'FREE',
        language: 'EN',
        shortDescription: 'Learn the fundamentals of running a business.',
        description: 'A full introduction to business foundations for new entrepreneurs.',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      });
    expect(createCourse.status).toBe(201);
    const courseId = createCourse.body.data.id;

    const moduleRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ title: 'Module 1', order: 1 });
    expect(moduleRes.status).toBe(201);

    const toReview = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'SUBMITTED_FOR_REVIEW' });
    expect(toReview.status).toBe(200);
    const toApproved = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'APPROVED' });
    expect(toApproved.status).toBe(200);
    const toPublished = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ status: 'PUBLISHED' });
    expect(toPublished.status).toBe(200);
    expect(toPublished.body.data.status).toBe('PUBLISHED');

    const beforeVersions = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/versions`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(beforeVersions.body.data).toHaveLength(0);

    const patchRes = await request(app)
      .patch(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`)
      .send({ title: 'Business Foundation (Updated)' });
    expect(patchRes.status).toBe(200);

    const afterVersions = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/versions`)
      .set('Authorization', `Bearer ${platformAdmin.accessToken}`);
    expect(afterVersions.body.data).toHaveLength(1);
    expect(afterVersions.body.data[0].snapshot.title).toBe('Business Foundation');
  });
});
