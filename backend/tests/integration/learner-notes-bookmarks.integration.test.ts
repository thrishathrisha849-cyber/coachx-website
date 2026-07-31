/**
 * Real-database integration tests for 004-learning-management-system's
 * Learner Notes & Bookmarks batch (FR-058/059): access-gated creation
 * (real lesson access required), ownership-scoped read/update/delete (IDOR
 * protection — another learner can never touch someone else's note or
 * bookmark), search, export, all four creatable bookmark types plus the
 * RESOURCE-type cross-lesson-activity rejection, and the DISCUSSION-type
 * rejection at the validation layer (no Discussion entity exists yet).
 * Same graceful-skip pattern as the other integration suites — see
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
    .send({ name: 'Notes Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
  if (!admin) admin = await createUserWithRole(uniqueEmail('notes-admin'), 'platform_admin');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Notes Test Category', slug: uniqueSlug('notes-cat') });
    categoryId = res.body.data.id;
  }
}

/** Creates + publishes a course with one module, one PUBLISHED lesson, and one DOWNLOAD activity on that lesson. */
async function createPublishedCourseWithLesson() {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Notes Test Course',
      slug: uniqueSlug('notes-course'),
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
    .send({ title: 'Lesson 1', slug: uniqueSlug('notes-lesson') });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const activityRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/activities`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ type: 'DOWNLOAD', title: 'Handout', mediaUrl: 'https://example.com/handout.pdf' });
  const activityId = activityRes.body.data.id;

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId, lessonId, activityId };
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learner-notes-bookmarks.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING learner-notes-bookmarks.integration.test.ts: could not reach PostgreSQL.');
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
    await db.bookmark.deleteMany({});
    await db.learnerNote.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.learningActivity.deleteMany({});
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

describe('Learner Notes (FR-058)', () => {
  it('rejects creating a note for a lesson the learner cannot access', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { lessonId } = await createPublishedCourseWithLesson();
    const outsider = await createUserWithRole(uniqueEmail('note-outsider'), 'registered_free_user');

    const res = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${outsider.accessToken}`).send({ content: 'trying to note' });
    expect(res.status).toBe(403);
  });

  it('creates, lists, updates, and deletes a note for an accessible lesson', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('note-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const createRes = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/notes`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ content: 'Key point at the start.', videoTimestampSeconds: 42 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.videoTimestampSeconds).toBe(42);
    const noteId = createRes.body.data.id;

    const listRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(1);

    const courseListRes = await request(app).get(`/api/v1/lms/me/courses/${courseId}/notes`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(courseListRes.body.data[0].lessonTitle).toBe('Lesson 1');

    const updateRes = await request(app).patch(`/api/v1/lms/me/notes/${noteId}`).set('Authorization', `Bearer ${learner.accessToken}`).send({ content: 'Updated key point.' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.content).toBe('Updated key point.');

    const deleteRes = await request(app).delete(`/api/v1/lms/me/notes/${noteId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(deleteRes.status).toBe(204);
    const secondDeleteRes = await request(app).delete(`/api/v1/lms/me/notes/${noteId}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(secondDeleteRes.status).toBe(204);

    const finalListRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(finalListRes.body.data).toHaveLength(0);
  });

  it('never lets another learner read, edit, or delete someone else\'s note (IDOR protection)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const owner = await createUserWithRole(uniqueEmail('note-owner'), 'registered_free_user');
    const other = await createUserWithRole(uniqueEmail('note-other'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${owner.accessToken}`).send({ courseId });
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${other.accessToken}`).send({ courseId });

    const createRes = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${owner.accessToken}`).send({ content: 'Private note.' });
    const noteId = createRes.body.data.id;

    const otherListRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${other.accessToken}`);
    expect(otherListRes.body.data).toHaveLength(0);

    const otherUpdateRes = await request(app).patch(`/api/v1/lms/me/notes/${noteId}`).set('Authorization', `Bearer ${other.accessToken}`).send({ content: 'hijacked' });
    expect(otherUpdateRes.status).toBe(404);

    const otherDeleteRes = await request(app).delete(`/api/v1/lms/me/notes/${noteId}`).set('Authorization', `Bearer ${other.accessToken}`);
    expect(otherDeleteRes.status).toBe(204); // no-op — 0 rows affected, never reveals the note exists

    const ownerListRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${owner.accessToken}`);
    expect(ownerListRes.body.data).toHaveLength(1); // untouched
  });

  it('searches the learner\'s own notes by content, and exports them as plain text', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('note-search'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${learner.accessToken}`).send({ content: 'Photosynthesis explained clearly.' });
    await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/notes`).set('Authorization', `Bearer ${learner.accessToken}`).send({ content: 'Unrelated remark.' });

    const searchRes = await request(app).get('/api/v1/lms/me/notes/search').query({ q: 'photosynthesis' }).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data).toHaveLength(1);
    expect(searchRes.body.data[0].content).toContain('Photosynthesis');

    const exportRes = await request(app).get('/api/v1/lms/me/notes/export').set('Authorization', `Bearer ${learner.accessToken}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain('Photosynthesis explained clearly.');
    expect(exportRes.text).toContain('Unrelated remark.');
  });
});

describe('Bookmarks (FR-059)', () => {
  it('creates each real bookmark type, and rejects a RESOURCE bookmark whose activityId belongs to a different lesson', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, moduleId, lessonId, activityId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('bookmark-learner'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    // A second, sibling lesson in the SAME accessible course — isolates
    // "activityId belongs to a different lesson" from a plain access
    // denial (both lessons are equally reachable by this learner).
    const otherLessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Lesson 2', slug: uniqueSlug('notes-lesson-2') });
    const otherLessonId = otherLessonRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/lessons/${otherLessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const lessonBookmark = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`).set('Authorization', `Bearer ${learner.accessToken}`).send({ type: 'LESSON' });
    expect(lessonBookmark.status).toBe(201);

    const videoBookmark = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ type: 'VIDEO_TIMESTAMP', videoTimestampSeconds: 120 });
    expect(videoBookmark.status).toBe(201);
    expect(videoBookmark.body.data.videoTimestampSeconds).toBe(120);

    const textBookmark = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ type: 'TEXT_SECTION', textSectionAnchor: 'section-2' });
    expect(textBookmark.status).toBe(201);

    const resourceBookmark = await request(app)
      .post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ type: 'RESOURCE', activityId });
    expect(resourceBookmark.status).toBe(201);
    expect(resourceBookmark.body.data.activityId).toBe(activityId);

    const crossLessonRes = await request(app)
      .post(`/api/v1/lms/me/lessons/${otherLessonId}/bookmarks`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ type: 'RESOURCE', activityId });
    expect(crossLessonRes.status).toBe(400);

    const listRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(listRes.body.data).toHaveLength(4);
  });

  it('rejects a DISCUSSION-type bookmark at the validation layer (no Discussion entity exists)', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const learner = await createUserWithRole(uniqueEmail('bookmark-discussion'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`).set('Authorization', `Bearer ${learner.accessToken}`).send({ type: 'DISCUSSION' });
    expect(res.status).toBe(400);
  });

  it('deletes a bookmark idempotently, and never lets another learner delete someone else\'s bookmark', async () => {
    if (skip()) return;
    await ensureAdminAndCategory();
    const { courseId, lessonId } = await createPublishedCourseWithLesson();
    const owner = await createUserWithRole(uniqueEmail('bookmark-owner'), 'registered_free_user');
    const other = await createUserWithRole(uniqueEmail('bookmark-other'), 'registered_free_user');
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${owner.accessToken}`).send({ courseId });
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${other.accessToken}`).send({ courseId });

    const createRes = await request(app).post(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`).set('Authorization', `Bearer ${owner.accessToken}`).send({ type: 'LESSON' });
    const bookmarkId = createRes.body.data.id;

    const otherDeleteRes = await request(app).delete(`/api/v1/lms/me/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${other.accessToken}`);
    expect(otherDeleteRes.status).toBe(204); // no-op

    const stillThereRes = await request(app).get(`/api/v1/lms/me/lessons/${lessonId}/bookmarks`).set('Authorization', `Bearer ${owner.accessToken}`);
    expect(stillThereRes.body.data.some((b: any) => b.id === bookmarkId)).toBe(true);

    const ownerDeleteRes = await request(app).delete(`/api/v1/lms/me/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${owner.accessToken}`);
    expect(ownerDeleteRes.status).toBe(204);
    const secondDeleteRes = await request(app).delete(`/api/v1/lms/me/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${owner.accessToken}`);
    expect(secondDeleteRes.status).toBe(204);
  });
});
