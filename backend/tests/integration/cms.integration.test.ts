/**
 * Real-database integration tests for Phase 5 (Part 1)'s CMS/public-
 * site surface: page publish workflow, versioning, navigation tree,
 * announcements, FAQ, contact/newsletter capture, and search.
 *
 * Same graceful-skip pattern as `auth.integration.test.ts` /
 * `database.integration.test.ts` — see docs/database/TESTING.md and
 * docs/public-site/TESTING.md.
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

async function createContentManagerAndLogin(email: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'CMS Admin', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

  const sentMessage = emailAdapter.sent.find((m: any) => m.to === email && m.subject.includes('Verify'));
  const rawToken = sentMessage?.text.match(/token: (\S+)/)?.[1];
  await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });

  const db = getPrismaClient();
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  const role = await db.role.findUnique({ where: { name: 'content_manager' } });
  await db.userRole.create({ data: { userId: user.id, roleId: role.id } });

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
  return { userId: user.id, accessToken: loginRes.body.data.accessToken };
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING cms.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.');
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING cms.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
        '(expected in this sandbox — no Docker/Postgres available; see docs/public-site/TESTING.md).',
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
    await db.page.deleteMany({});
    await db.contactSubmission.deleteMany({});
    await db.newsletterSubscriber.deleteMany({});
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

describe('Page publish workflow (002 FR-086, FR-087)', () => {
  it('creates a page in DRAFT status, invisible publicly, then publishes it through the full workflow', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('cms1'));
    const slug = uniqueSlug('test-page');

    const createRes = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug,
        title: 'Test Page',
        seoTitle: 'Test Page | CoachX',
        seoDescription: 'A test page',
        blocks: [{ type: 'HERO', order: 0, visible: true, data: { headline: 'Welcome' } }],
      });
    expect(createRes.status).toBe(201);
    const pageId = createRes.body.data.id;

    // Not published yet — public read must 404.
    const notFoundRes = await request(app).get(`/api/v1/cms/pages/${slug}`);
    expect(notFoundRes.status).toBe(404);

    // Walk the full workflow: DRAFT -> REVIEW -> APPROVED -> PUBLISHED
    for (const status of ['REVIEW', 'APPROVED', 'PUBLISHED']) {
      const statusRes = await request(app)
        .patch(`/api/v1/cms/admin/pages/${pageId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status });
      expect(statusRes.status).toBe(200);
    }

    const publicRes = await request(app).get(`/api/v1/cms/pages/${slug}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Test Page');
    expect(publicRes.body.data.blocks).toHaveLength(1);
  });

  it('rejects an invalid status transition (DRAFT -> PUBLISHED, skipping the workflow)', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('cms2'));
    const slug = uniqueSlug('skip-workflow');

    const createRes = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug, title: 'Skip Test', blocks: [] });

    const response = await request(app)
      .patch(`/api/v1/cms/admin/pages/${createRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PUBLISHED' });

    expect(response.status).toBe(400);
  });

  it('denies page creation to a user without content.manage permission', async () => {
    if (skip()) return;

    const email = uniqueEmail('no-perm');
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });
    const sentMessage = emailAdapter.sent.find((m: any) => m.to === email);
    const rawToken = sentMessage?.text.match(/token: (\S+)/)?.[1];
    await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    const response = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ slug: uniqueSlug('denied'), title: 'Denied', blocks: [] });

    expect(response.status).toBe(403);
  });

  it('rejects a page create with invalid block data (missing required HERO headline)', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('cms3'));
    const response = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug: uniqueSlug('bad-block'), title: 'Bad Block', blocks: [{ type: 'HERO', order: 0, visible: true, data: {} }] });

    expect(response.status).toBe(400);
  });

  it('creates a new, non-destructive PageVersion on every update (FR-088)', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('cms4'));
    const slug = uniqueSlug('versioned');

    const createRes = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug, title: 'V1', blocks: [] });
    const pageId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/cms/admin/pages/${pageId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'V2' });

    const versionsRes = await request(app)
      .get(`/api/v1/cms/admin/pages/${pageId}/versions`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('serves a DRAFT page via a valid, unexpired preview token but not without one (FR-089, FR-105)', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('cms5'));
    const slug = uniqueSlug('preview-page');

    const createRes = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug, title: 'Preview Me', blocks: [] });
    const pageId = createRes.body.data.id;

    const noTokenRes = await request(app).get(`/api/v1/cms/pages/${slug}`);
    expect(noTokenRes.status).toBe(404);

    const linkRes = await request(app)
      .post(`/api/v1/cms/admin/pages/${pageId}/preview-link`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(linkRes.status).toBe(200);
    const { token } = linkRes.body.data;

    const previewRes = await request(app).get(`/api/v1/cms/pages/${slug}?preview=${token}`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.title).toBe('Preview Me');
  });
});

describe('Navigation (002 FR-001–FR-003, FR-008)', () => {
  it('builds a nested tree from parent/child NavigationItem rows', async () => {
    if (skip()) return;

    const db = getPrismaClient();
    const parent = await db.navigationItem.create({
      data: { location: 'HEADER', label: 'Programs', url: '/programs', order: 0 },
    });
    await db.navigationItem.create({
      data: { location: 'HEADER', parentId: parent.id, label: 'Business Foundation', url: '/programs/business-foundation', order: 0 },
    });

    const response = await request(app).get('/api/v1/cms/navigation/header');
    expect(response.status).toBe(200);
    const programsNode = response.body.data.find((n: any) => n.id === parent.id);
    expect(programsNode.children).toHaveLength(1);
    expect(programsNode.children[0].label).toBe('Business Foundation');
  });
});

describe('Announcements (002 FR-005, FR-006)', () => {
  it('shows an announcement only within its date range, and stops automatically after expiry', async () => {
    if (skip()) return;

    const db = getPrismaClient();
    const now = new Date();
    await db.announcement.create({
      data: {
        text: 'Expired announcement',
        startDate: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // ended yesterday
        priority: 0,
      },
    });
    const active = await db.announcement.create({
      data: {
        text: 'Active announcement',
        startDate: new Date(now.getTime() - 1000),
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        priority: 5,
      },
    });

    const response = await request(app).get('/api/v1/cms/announcements');
    expect(response.status).toBe(200);
    const ids = response.body.data.map((a: any) => a.id);
    expect(ids).toContain(active.id);
    expect(response.body.data.every((a: any) => a.text !== 'Expired announcement')).toBe(true);
  });
});

describe('Contact form (002 FR-053)', () => {
  it('accepts a valid submission, creates a record, records consent, and sends a confirmation email', async () => {
    if (skip()) return;

    const email = uniqueEmail('contact');
    const response = await request(app).post('/api/v1/contact').send({
      name: 'Jane Doe',
      email,
      department: 'GENERAL_ENQUIRY',
      message: 'This is a test message that is long enough.',
      consent: true,
    });

    expect(response.status).toBe(200);
    expect(emailAdapter.sent.some((m: any) => m.to === email)).toBe(true);

    const db = getPrismaClient();
    const consent = await db.consentRecord.findFirst({ where: { email: email.toLowerCase() } });
    expect(consent).not.toBeNull();
  });
});

describe('Newsletter (footer capture)', () => {
  it('subscribes an email and records MARKETING_EMAIL consent', async () => {
    if (skip()) return;

    const email = uniqueEmail('newsletter');
    const response = await request(app).post('/api/v1/newsletter/subscribe').send({ email, consent: true });
    expect(response.status).toBe(200);

    const db = getPrismaClient();
    const subscriber = await db.newsletterSubscriber.findUnique({ where: { email: email.toLowerCase() } });
    expect(subscriber).not.toBeNull();

    const consent = await db.consentRecord.findFirst({ where: { email: email.toLowerCase(), channel: 'MARKETING_EMAIL' } });
    expect(consent).not.toBeNull();
  });
});

describe('Search (002 FR-009)', () => {
  it('finds a published page by title', async () => {
    if (skip()) return;

    const { accessToken } = await createContentManagerAndLogin(uniqueEmail('search-admin'));
    const slug = uniqueSlug('searchable-page');
    const createRes = await request(app)
      .post('/api/v1/cms/admin/pages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug, title: 'Unique Searchable Title Zebra', blocks: [] });
    const pageId = createRes.body.data.id;

    for (const status of ['REVIEW', 'APPROVED', 'PUBLISHED']) {
      await request(app)
        .patch(`/api/v1/cms/admin/pages/${pageId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status });
    }

    const response = await request(app).get('/api/v1/cms/search?q=Zebra');
    expect(response.status).toBe(200);
    expect(response.body.data.some((r: any) => r.title === 'Unique Searchable Title Zebra')).toBe(true);
  });

  it('rejects a query shorter than 2 characters', async () => {
    if (skip()) return;
    const response = await request(app).get('/api/v1/cms/search?q=a');
    expect(response.status).toBe(400);
  });
});
