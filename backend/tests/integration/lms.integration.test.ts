/**
 * Real-database integration tests for Phase 6 Part 1's LMS foundation:
 * categories (hierarchy/cycle/depth-cap prevention), courses (FR-015/
 * FR-100-aligned lifecycle, publish validation), modules (ordering/
 * reorder/prerequisites), instructor assignment (primary-instructor rule,
 * ownership/IDOR), discovery (pagination, filtering, sorting, search,
 * draft/unlisted isolation), and security (permission escalation,
 * cross-course reorder rejection, no internal-field leakage).
 *
 * CORRECTION (spec-alignment pass): status values throughout rewritten
 * from the generic `REVIEW`/`UNPUBLISHED` set to the FR-015/FR-100-aligned
 * set (`SUBMITTED_FOR_REVIEW`/`CHANGES_REQUESTED`/etc.) — see
 * docs/lms/COURSE_LIFECYCLE.md. New test blocks added for the
 * correction-specific behaviors: category depth cap, module prerequisite
 * cycle/cross-course rejection, reorder-prerequisite-order rejection,
 * required review note, RETIRED terminal state, UNLISTED direct-link
 * visibility.
 *
 * Same graceful-skip pattern as `cms.integration.test.ts` /
 * `auth.integration.test.ts` — see docs/lms/TESTING.md.
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
  // Distinct X-Forwarded-For per synthetic user (trust proxy is enabled
  // in app.ts) so the fixed 5/hour per-IP registerRateLimiter doesn't
  // 429 fixtures needing more than 5 distinct accounts in one file.
  registrationIpCounter += 1;
  const testIp = `10.${(registrationIpCounter >> 16) & 0xff}.${(registrationIpCounter >> 8) & 0xff}.${registrationIpCounter & 0xff}`;

  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', testIp)
    .send({ name: 'LMS Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING lms.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.');
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING lms.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
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

// --- Shared fixtures (created lazily, once, inside the first test that needs them) ---
let admin: { userId: string; accessToken: string };
let instructorA: { userId: string; accessToken: string };
let instructorB: { userId: string; accessToken: string };
let categoryId: string;

async function ensureFixtures() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('lms-admin'), 'platform_admin');
  if (!instructorA) instructorA = await createUserWithRole(uniqueEmail('lms-instr-a'), 'course_instructor');
  if (!instructorB) instructorB = await createUserWithRole(uniqueEmail('lms-instr-b'), 'course_instructor');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Business', slug: uniqueSlug('business') });
    categoryId = res.body.data.id;
  }
}

async function createDraftCourse(instructor: { userId: string; accessToken: string }) {
  const res = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Intro to Tamil Business',
      slug: uniqueSlug('intro-course'),
      shortDescription: 'A short description',
      description: 'A full description of the course.',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
  const courseId = res.body.data.id;

  await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/instructors`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ userId: instructor.userId, isPrimary: true });

  return courseId;
}

/** Drives a course all the way to PUBLISHED via the corrected FR-100 workflow, creating one module along the way. */
async function publishCourse(courseId: string) {
  await request(app)
    .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title: 'Module 1' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status });
    expect(res.status).toBe(200);
  }
}

describe('Course categories (hierarchy, cycle prevention, depth cap)', () => {
  it('creates a category and rejects a duplicate slug', async () => {
    if (skip()) return;
    await ensureFixtures();

    const slug = uniqueSlug('cat');
    const first = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Marketing', slug });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Marketing 2', slug });
    expect(duplicate.status).toBe(409);
  });

  it('supports a parent/child hierarchy and prevents a cycle', async () => {
    if (skip()) return;
    await ensureFixtures();

    const parentRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Parent Cat', slug: uniqueSlug('parent') });
    const parentId = parentRes.body.data.id;

    const childRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Child Cat', slug: uniqueSlug('child'), parentId });
    const childId = childRes.body.data.id;
    expect(childRes.status).toBe(201);
    expect(childRes.body.data.parentId).toBe(parentId);

    // Attempt to make the parent a child of its own child — a direct cycle.
    const cycleAttempt = await request(app)
      .patch(`/api/v1/lms/admin/categories/${parentId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ parentId: childId });
    expect(cycleAttempt.status).toBe(409);
  });

  it('rejects a category being set as its own parent via update (self-parent)', async () => {
    if (skip()) return;
    await ensureFixtures();

    const catRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Self Parent', slug: uniqueSlug('self-parent') });
    const catId = catRes.body.data.id;

    const selfParentAttempt = await request(app)
      .patch(`/api/v1/lms/admin/categories/${catId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ parentId: catId });
    expect(selfParentAttempt.status).toBe(400);
  });

  it('detects an ancestor cycle against any of several children, not just a hardcoded first match', async () => {
    if (skip()) return;
    await ensureFixtures();

    const parentRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Multi Parent', slug: uniqueSlug('multi-parent') });
    const parentId = parentRes.body.data.id;

    const child1Res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Multi Child 1', slug: uniqueSlug('multi-child-1'), parentId });
    expect(child1Res.status).toBe(201);

    const child2Res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Multi Child 2', slug: uniqueSlug('multi-child-2'), parentId });
    const child2Id = child2Res.body.data.id;
    expect(child2Res.status).toBe(201);

    // Cycle via the SECOND child, not the first — the descendant-set
    // check must catch this regardless of which child is chosen.
    const cycleAttempt = await request(app)
      .patch(`/api/v1/lms/admin/categories/${parentId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ parentId: child2Id });
    expect(cycleAttempt.status).toBe(409);
  });

  it('rejects assigning an existing subcategory as a parent via update (depth cap, not a cycle)', async () => {
    if (skip()) return;
    await ensureFixtures();

    const rootRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Depth Update Root', slug: uniqueSlug('depth-update-root') });
    const rootId = rootRes.body.data.id;

    const subRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Depth Update Sub', slug: uniqueSlug('depth-update-sub'), parentId: rootId });
    const subId = subRes.body.data.id;

    const otherRootRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Depth Update Other Root', slug: uniqueSlug('depth-update-other-root') });
    const otherRootId = otherRootRes.body.data.id;

    // Unrelated to `subId`'s ancestry (no cycle) — must be rejected purely
    // for exceeding the 2-level depth cap, i.e. a 400, not a 409.
    const depthAttempt = await request(app)
      .patch(`/api/v1/lms/admin/categories/${otherRootId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ parentId: subId });
    expect(depthAttempt.status).toBe(400);
  });

  it('rejects creating a 3rd hierarchy level (subcategory of a subcategory) — 004 FR-014 is a 2-level category/subcategory model', async () => {
    if (skip()) return;
    await ensureFixtures();

    const rootRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Root', slug: uniqueSlug('depth-root') });
    const rootId = rootRes.body.data.id;

    const subRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Sub', slug: uniqueSlug('depth-sub'), parentId: rootId });
    expect(subRes.status).toBe(201);
    const subId = subRes.body.data.id;

    const subSubAttempt = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Sub Sub', slug: uniqueSlug('depth-subsub'), parentId: subId });
    expect(subSubAttempt.status).toBe(400);
  });

  it('archives a category without hard-deleting it, and it disappears from the public list', async () => {
    if (skip()) return;
    await ensureFixtures();

    const catRes = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Temp Cat', slug: uniqueSlug('temp-cat') });
    const id = catRes.body.data.id;

    const archiveRes = await request(app)
      .post(`/api/v1/lms/admin/categories/${id}/archive`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe('ARCHIVED');

    const publicList = await request(app).get('/api/v1/lms/categories');
    expect(publicList.body.data.find((c: any) => c.id === id)).toBeUndefined();

    // Still fetchable by an admin (not hard-deleted).
    const adminGet = await request(app)
      .get(`/api/v1/lms/admin/categories/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminGet.status).toBe(200);
  });
});

describe('Courses (creation, unique slug, publish validation, FR-015/FR-100 lifecycle)', () => {
  it('creates a course and rejects a duplicate slug', async () => {
    if (skip()) return;
    await ensureFixtures();

    const slug = uniqueSlug('course');
    const first = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course One', slug, categoryId });
    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe('DRAFT');

    const dup = await request(app)
      .post('/api/v1/lms/admin/courses')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course One Duplicate', slug, categoryId });
    expect(dup.status).toBe(409);
  });

  it('rejects an invalid status transition (DRAFT -> PUBLISHED, skipping the workflow)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });
    expect(res.status).toBe(400);
  });

  it('requires a reviewNote when requesting changes, and the note is visible to the instructor', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 1' });
    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'SUBMITTED_FOR_REVIEW' });

    const missingNote = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'CHANGES_REQUESTED' });
    expect(missingNote.status).toBe(400);

    const withNote = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'CHANGES_REQUESTED', reviewNote: 'Please add a trailer video.' });
    expect(withNote.status).toBe(200);
    expect(withNote.body.data.reviewNotes).toBe('Please add a trailer video.');

    // Resubmitting clears the stale review note.
    const resubmit = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'SUBMITTED_FOR_REVIEW' });
    expect(resubmit.body.data.reviewNotes).toBeNull();
  });

  it('rejects publishing a course with no modules, then allows it once a module exists', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const submitRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'SUBMITTED_FOR_REVIEW' });
    expect(submitRes.status).toBe(200);

    const noModuleAttempt = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'APPROVED' });
    expect(noModuleAttempt.status).toBe(400);
    expect(noModuleAttempt.body.error.message).toMatch(/at least one module/i);

    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module 1' });

    const approveRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'APPROVED' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.reviewedBy).toBe(admin.userId);

    const publishRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('PUBLISHED');
    expect(publishRes.body.data.publishedAt).not.toBeNull();
    expect(publishRes.body.data.publishedBy).toBe(admin.userId);
  });

  it('RETIRED is a true terminal state — no transition out is permitted', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    await publishCourse(courseId);

    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'ARCHIVED' });

    const retireRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RETIRED' });
    expect(retireRes.status).toBe(200);

    const escapeAttempt = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'DRAFT' });
    expect(escapeAttempt.status).toBe(400);
  });

  it('never leaks a DRAFT course via the public detail or listing endpoints', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    const course = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const slug = course.body.data.slug;

    const detail = await request(app).get(`/api/v1/lms/courses/${slug}`);
    expect(detail.status).toBe(404);

    const listing = await request(app).get('/api/v1/lms/courses');
    expect(listing.body.data.find((c: any) => c.slug === slug)).toBeUndefined();
  });

  it('UNLISTED courses are reachable by direct slug but never appear in the public listing (FR-015)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    await publishCourse(courseId);
    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'UNLISTED' });

    const course = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const slug = course.body.data.slug;

    const detail = await request(app).get(`/api/v1/lms/courses/${slug}`);
    expect(detail.status).toBe(200);

    const listing = await request(app).get('/api/v1/lms/courses');
    expect(listing.body.data.find((c: any) => c.slug === slug)).toBeUndefined();
  });

  it('exposes a published course publicly with no internal-field leakage', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    await publishCourse(courseId);
    const course = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const slug = course.body.data.slug;

    const detail = await request(app).get(`/api/v1/lms/courses/${slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data).not.toHaveProperty('createdBy');
    expect(detail.body.data).not.toHaveProperty('updatedBy');
    expect(detail.body.data).not.toHaveProperty('reviewedBy');
    expect(detail.body.data).not.toHaveProperty('publishedBy');
    expect(detail.body.data).not.toHaveProperty('reviewNotes');
    expect(detail.body.data).not.toHaveProperty('metadata');
    expect(detail.body.data).not.toHaveProperty('version');
    expect(detail.body.data).not.toHaveProperty('status');
    expect(detail.body.data.modules).toBeInstanceOf(Array);
  });
});

describe('Course modules (ordering, transactional reorder, prerequisites)', () => {
  it('creates modules with stable ordering and reorders them transactionally', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const m1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module A' });
    const m2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module B' });

    expect(m1.body.data.position).toBe(0);
    expect(m2.body.data.position).toBe(1);

    const reorderRes = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules/reorder`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ orderedIds: [m2.body.data.id, m1.body.data.id] });
    expect(reorderRes.status).toBe(200);

    const list = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const byId = Object.fromEntries(list.body.data.map((m: any) => [m.id, m.position]));
    expect(byId[m2.body.data.id]).toBe(0);
    expect(byId[m1.body.data.id]).toBe(1);
  });

  it('rejects a reorder that references a module from a different course (cross-course reorder rejection)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId1 = await createDraftCourse(instructorA);
    const courseId2 = await createDraftCourse(instructorA);

    const m1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId1}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course 1 Module' });
    const m2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId2}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course 2 Module' });

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId1}/modules/reorder`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ orderedIds: [m1.body.data.id, m2.body.data.id] });
    expect(res.status).toBe(400);
  });

  it('rejects a cross-course prerequisite reference', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId1 = await createDraftCourse(instructorA);
    const courseId2 = await createDraftCourse(instructorA);

    const m1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId1}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course 1 Module' });

    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId2}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Course 2 Module', prerequisiteModuleId: m1.body.data.id });
    expect(res.status).toBe(400);
  });

  it('rejects a module prerequisite cycle', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const m1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module A' });
    const m2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module B', prerequisiteModuleId: m1.body.data.id });
    expect(m2.status).toBe(201);

    // Attempt to make Module A depend on Module B — A already precedes B,
    // so this is also rejected by the "prerequisite must be earlier"
    // ordering rule, which is itself sufficient to prevent this exact cycle.
    const cycleAttempt = await request(app)
      .patch(`/api/v1/lms/admin/modules/${m1.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ prerequisiteModuleId: m2.body.data.id });
    expect(cycleAttempt.status).toBe(400);
  });

  it('rejects a reorder that would place a module at or before its own prerequisite', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const m1 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module A' });
    const m2 = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Module B', prerequisiteModuleId: m1.body.data.id });

    // Reordering B before A would place the dependent module before its
    // own prerequisite — rejected.
    const res = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules/reorder`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ orderedIds: [m2.body.data.id, m1.body.data.id] });
    expect(res.status).toBe(400);
  });

  it('archives a module without hard-deleting it', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    const mod = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Archivable Module' });

    const archiveRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${mod.body.data.id}/archive`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe('ARCHIVED');

    const getRes = await request(app)
      .get(`/api/v1/lms/admin/modules/${mod.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getRes.status).toBe(200);
  });
});

describe('Instructor assignment (primary rule, duplicate rejection, ownership/IDOR)', () => {
  it('rejects a duplicate instructor assignment on the same course', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const dup = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/instructors`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: instructorA.userId });
    expect(dup.status).toBe(409);
  });

  it('enforces at most one primary instructor per course', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA); // instructorA is primary

    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/instructors`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: instructorB.userId, isPrimary: true });

    const list = await request(app)
      .get(`/api/v1/lms/admin/courses/${courseId}/instructors`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const primaries = list.body.data.filter((i: any) => i.isPrimary);
    expect(primaries).toHaveLength(1);
    expect(primaries[0].userId).toBe(instructorB.userId);
  });

  it('rejects removing the only instructor on a course', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const res = await request(app)
      .delete(`/api/v1/lms/admin/courses/${courseId}/instructors/${instructorA.userId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(409);
  });

  it('IDOR prevention: instructor B cannot read or edit a course only instructor A is assigned to', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);

    const readAttempt = await request(app)
      .get(`/api/v1/lms/instructor/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorB.accessToken}`);
    expect(readAttempt.status).toBe(403);

    const writeAttempt = await request(app)
      .patch(`/api/v1/lms/instructor/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorB.accessToken}`)
      .send({ title: 'Hijacked title' });
    expect(writeAttempt.status).toBe(403);

    // instructor A (the actual assignee) CAN access it.
    const ownerRead = await request(app)
      .get(`/api/v1/lms/instructor/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`);
    expect(ownerRead.status).toBe(200);
  });

  it('permission escalation prevention: an instructor cannot review/approve/publish their own course, nor change its archival state', async () => {
    if (skip()) return;
    await ensureFixtures();
    const courseId = await createDraftCourse(instructorA);
    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'A Module' });

    // instructorA holds course.update but NOT course.publish/course.archive.
    const submitAsInstructor = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`)
      .send({ status: 'SUBMITTED_FOR_REVIEW' });
    expect(submitAsInstructor.status).toBe(200); // instructor CAN submit their own work

    const approveAsInstructor = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`)
      .send({ status: 'APPROVED' });
    expect(approveAsInstructor.status).toBe(403);

    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'APPROVED' });

    const publishAsInstructor = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`)
      .send({ status: 'PUBLISHED' });
    expect(publishAsInstructor.status).toBe(403);

    await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PUBLISHED' });

    const archiveAsInstructor = await request(app)
      .post(`/api/v1/lms/admin/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${instructorA.accessToken}`)
      .send({ status: 'ARCHIVED' });
    expect(archiveAsInstructor.status).toBe(403);
  });
});

describe('Course discovery (pagination, filtering, sorting, search)', () => {
  it('paginates, filters by category, and sorts published course results deterministically', async () => {
    if (skip()) return;
    await ensureFixtures();

    const slugPrefix = uniqueSlug('discover');
    for (let i = 0; i < 3; i++) {
      const courseId = await createDraftCourse(instructorA);
      await request(app)
        .patch(`/api/v1/lms/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ title: `${slugPrefix}-course-${i}` });
      await publishCourse(courseId);
    }

    const searchRes = await request(app).get(`/api/v1/lms/courses?q=${slugPrefix}&pageSize=2&page=1`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(2);
    expect(searchRes.body.meta.totalItems).toBe(3);
    expect(searchRes.body.meta.totalPages).toBe(2);

    const categoryFiltered = await request(app).get(`/api/v1/lms/courses?categoryId=${categoryId}&q=${slugPrefix}`);
    expect(categoryFiltered.body.meta.totalItems).toBe(3);
  });

  it('rejects an unsupported sort value rather than accepting an arbitrary column', async () => {
    if (skip()) return;
    const res = await request(app).get('/api/v1/lms/courses?sort=slug;DROP TABLE courses');
    expect(res.status).toBe(400);
  });
});
