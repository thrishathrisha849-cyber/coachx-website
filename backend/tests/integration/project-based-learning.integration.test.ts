/**
 * Real-database integration tests for 004-learning-management-system's
 * Project-based Learning batch (FR-077): `Project` + multi-artifact
 * linking (each artifact IS a full `Assignment`, reusing its existing
 * submission/review lifecycle unchanged), the learner-facing aggregate
 * status endpoint, the real module-completion gate
 * (`progress.service.ts`'s `computeModuleProgress`), and the new real
 * `finalProjectApproved` certificate-eligibility condition. Same
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
    .send({ name: 'Project Test User', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

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
let learner: { userId: string; accessToken: string };
let categoryId: string;

async function ensureFixtures() {
  if (!admin) admin = await createUserWithRole(uniqueEmail('proj-admin'), 'platform_admin');
  if (!learner) learner = await createUserWithRole(uniqueEmail('proj-learner'), 'registered_free_user');
  if (!categoryId) {
    const res = await request(app)
      .post('/api/v1/lms/admin/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Project Test Category', slug: uniqueSlug('proj-cat') });
    categoryId = res.body.data.id;
  }
}

/** One published course + one published module, ready to receive project-artifact lessons/assignments. `certificateAvailable` defaults true so the certificate-eligibility tests below have something to evaluate. */
async function createPublishedCourseWithModule(certificateAvailable = true) {
  const courseRes = await request(app)
    .post('/api/v1/lms/admin/courses')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      title: 'Project Test Course',
      slug: uniqueSlug('proj-course'),
      shortDescription: 'short',
      description: 'full description',
      categoryId,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      priceType: 'FREE',
      priceAmountMinor: 0,
      certificateAvailable,
    });
  const courseId = courseRes.body.data.id;

  const moduleRes = await request(app).post(`/api/v1/lms/admin/courses/${courseId}/modules`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Module 1' });
  const moduleId = moduleRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/modules/${moduleId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  for (const status of ['SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED']) {
    await request(app).post(`/api/v1/lms/admin/courses/${courseId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status });
  }

  return { courseId, moduleId };
}

/**
 * Creates a PUBLISHED, non-mandatory lesson (so it never itself blocks
 * module completion via the lesson-based path — isolating these tests to
 * the PROJECT-based completion gate specifically) with a PUBLISHED
 * assignment attached, ready to be linked as a project artifact.
 */
async function createArtifactAssignment(moduleId: string, title: string) {
  const lessonRes = await request(app)
    .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title, slug: uniqueSlug('proj-lesson'), isMandatory: false });
  const lessonId = lessonRes.body.data.id;
  await request(app).patch(`/api/v1/lms/admin/lessons/${lessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  const assignmentRes = await request(app)
    .post(`/api/v1/lms/admin/lessons/${lessonId}/assignment`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ title, submissionFormat: 'TEXT', maxScore: 10, passingScore: 5 });
  const assignmentId = assignmentRes.body.data.id;
  await request(app).post(`/api/v1/lms/admin/assignments/${assignmentId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

  return { lessonId, assignmentId };
}

/** Full submit+approve cycle for one assignment, for the given learner. */
async function submitAndApprove(accessToken: string, assignmentId: string) {
  const startRes = await request(app).post(`/api/v1/lms/me/assignments/${assignmentId}/submissions`).set('Authorization', `Bearer ${accessToken}`);
  const submissionId = startRes.body.data.id;
  await request(app).patch(`/api/v1/lms/me/submissions/${submissionId}`).set('Authorization', `Bearer ${accessToken}`).send({ textBody: 'My artifact submission' });
  await request(app).post(`/api/v1/lms/me/submissions/${submissionId}/submit`).set('Authorization', `Bearer ${accessToken}`).send({ declaredOriginal: true });
  await request(app)
    .post(`/api/v1/lms/admin/submissions/${submissionId}/review`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ decision: 'APPROVE', criterionScores: [] });
  return submissionId;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING project-based-learning.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set.');
    return;
  }
  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();
  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING project-based-learning.integration.test.ts: could not reach PostgreSQL.');
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
    await db.submissionCriterionScore.deleteMany({});
    await db.submission.deleteMany({});
    await db.rubricCriterion.deleteMany({});
    await db.assignment.deleteMany({});
    await db.project.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.enrollment.deleteMany({});
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

describe('Project-based Learning (FR-077)', () => {
  it('creates a project (DRAFT by default) scoped to a module and lists it', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();

    const createRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/projects`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Capstone Project', description: 'Build something real.' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('DRAFT');

    const listRes = await request(app).get(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.map((p: any) => p.id)).toContain(createRes.body.data.id);
  });

  it('rejects publishing a project with zero linked artifacts', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const createRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Empty Project' });
    const projectId = createRes.body.data.id;

    const res = await request(app).post(`/api/v1/lms/admin/projects/${projectId}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });
    expect(res.status).toBe(400);
  });

  it('links two existing assignments as required artifacts, in order, then unlinks one', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const createRes = await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Two-Artifact Project' });
    const projectId = createRes.body.data.id;

    const artifact1 = await createArtifactAssignment(moduleId, 'Design Document');
    const artifact2 = await createArtifactAssignment(moduleId, 'Source Code');

    const link1 = await request(app).post(`/api/v1/lms/admin/projects/${projectId}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact1.assignmentId });
    expect(link1.status).toBe(200);
    const link2 = await request(app).post(`/api/v1/lms/admin/projects/${projectId}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact2.assignmentId });
    expect(link2.status).toBe(200);
    expect(link2.body.data.artifacts.map((a: any) => a.assignmentId)).toEqual([artifact1.assignmentId, artifact2.assignmentId]);
    expect(link2.body.data.artifacts.map((a: any) => a.projectPosition)).toEqual([0, 1]);

    const unlinkRes = await request(app)
      .post(`/api/v1/lms/admin/projects/${projectId}/artifacts/${artifact1.assignmentId}/unlink`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(unlinkRes.status).toBe(200);
    expect(unlinkRes.body.data.artifacts.map((a: any) => a.assignmentId)).toEqual([artifact2.assignmentId]);

    // The unlinked assignment itself still exists, untouched.
    const stillExists = await request(app).get(`/api/v1/lms/admin/assignments/${artifact1.assignmentId}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(stillExists.status).toBe(200);
  });

  it('rejects linking an assignment that already belongs to a different project', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const projectA = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Project A' })).body.data;
    const projectB = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Project B' })).body.data;
    const artifact = await createArtifactAssignment(moduleId, 'Shared Artifact');

    await request(app).post(`/api/v1/lms/admin/projects/${projectA.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact.assignmentId });

    const res = await request(app).post(`/api/v1/lms/admin/projects/${projectB.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact.assignmentId });
    expect(res.status).toBe(409);
  });

  it("the candidate-assignments list correctly reflects each assignment's linked state", async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Candidate Test Project' })).body.data;
    const linked = await createArtifactAssignment(moduleId, 'Linked Artifact');
    const unlinked = await createArtifactAssignment(moduleId, 'Unlinked Artifact');
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: linked.assignmentId });

    // Without an excludeProjectId, an assignment already linked to ANY
    // project is not a valid candidate at all — filtered out entirely.
    const withoutExclude = await request(app).get(`/api/v1/lms/admin/modules/${moduleId}/assignments`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(withoutExclude.body.data.find((a: any) => a.id === linked.assignmentId)).toBeUndefined();
    const unlinkedRow = withoutExclude.body.data.find((a: any) => a.id === unlinked.assignmentId);
    expect(unlinkedRow.alreadyLinked).toBe(false);

    // With excludeProjectId set to the artifact's OWN project (the
    // `ProjectEditorPage.tsx` calling convention), it reappears, flagged
    // `alreadyLinked: true` so the UI can distinguish it from a genuinely
    // available candidate.
    const withExclude = await request(app).get(`/api/v1/lms/admin/modules/${moduleId}/assignments?excludeProjectId=${project.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(withExclude.body.data.find((a: any) => a.id === linked.assignmentId).alreadyLinked).toBe(true);
  });

  it("a learner's project status shows per-artifact submission state and flips allArtifactsApproved once every artifact is APPROVED", async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithModule();
    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Learner Status Project' })).body.data;
    const artifact1 = await createArtifactAssignment(moduleId, 'Artifact One');
    const artifact2 = await createArtifactAssignment(moduleId, 'Artifact Two');
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact1.assignmentId });
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact2.assignmentId });
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const before = await request(app).get(`/api/v1/lms/me/projects/${project.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(before.status).toBe(200);
    expect(before.body.data.artifacts).toHaveLength(2);
    expect(before.body.data.artifacts.every((a: any) => a.submissionStatus === null)).toBe(true);
    expect(before.body.data.allArtifactsApproved).toBe(false);

    await submitAndApprove(learner.accessToken, artifact1.assignmentId);
    const halfway = await request(app).get(`/api/v1/lms/me/projects/${project.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(halfway.body.data.allArtifactsApproved).toBe(false);

    await submitAndApprove(learner.accessToken, artifact2.assignmentId);
    const after = await request(app).get(`/api/v1/lms/me/projects/${project.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(after.body.data.allArtifactsApproved).toBe(true);
    expect(after.body.data.artifacts.every((a: any) => a.submissionStatus === 'APPROVED')).toBe(true);
  });

  it('a DRAFT (unpublished) project is not visible to learners', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithModule();
    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Draft Project' })).body.data;
    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const res = await request(app).get(`/api/v1/lms/me/projects/${project.id}`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('module completion is genuinely gated on project approval — false while artifacts are unapproved, true once all are APPROVED', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithModule();

    // A trivial, always-completable MANDATORY lesson — isolates this test
    // to the PROJECT-completion dimension specifically. The artifact's own
    // hosting lesson is deliberately non-mandatory (see
    // `createArtifactAssignment`), so without this the module's pre-
    // existing "no mandatory lessons AND no lessons at all" completion
    // formula would never be satisfiable regardless of the project gate.
    const mandatoryLessonRes = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Trivial Mandatory Lesson', slug: uniqueSlug('proj-mandatory-lesson'), completionRuleType: 'MANUAL' });
    const mandatoryLessonId = mandatoryLessonRes.body.data.id;
    await request(app).patch(`/api/v1/lms/admin/lessons/${mandatoryLessonId}`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Completion Gate Project' })).body.data;
    const artifact = await createArtifactAssignment(moduleId, 'Gate Artifact');
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact.assignmentId });
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });
    await request(app).post(`/api/v1/lms/me/lessons/${mandatoryLessonId}/complete`).set('Authorization', `Bearer ${learner.accessToken}`);

    const before = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(before.status).toBe(200);
    const moduleBefore = before.body.data.modules.find((m: any) => m.moduleId === moduleId);
    // The mandatory-lesson dimension is already fully satisfied — the
    // project gate is the ONLY thing still blocking module completion.
    expect(moduleBefore.projectsComplete).toBe(false);
    expect(moduleBefore.isComplete).toBe(false);

    await submitAndApprove(learner.accessToken, artifact.assignmentId);

    const after = await request(app).get(`/api/v1/lms/me/courses/${courseId}/progress`).set('Authorization', `Bearer ${learner.accessToken}`);
    const moduleAfter = after.body.data.modules.find((m: any) => m.moduleId === moduleId);
    expect(moduleAfter.projectsComplete).toBe(true);
    expect(moduleAfter.isComplete).toBe(true);
  });

  it('certificate eligibility gains a real, enforced finalProjectApproved condition once the course has a published project', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { courseId, moduleId } = await createPublishedCourseWithModule(true);
    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Certificate Gate Project' })).body.data;
    const artifact = await createArtifactAssignment(moduleId, 'Certificate Gate Artifact');
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact.assignmentId });
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    await request(app).post('/api/v1/lms/me/enrollments').set('Authorization', `Bearer ${learner.accessToken}`).send({ courseId });

    const before = await request(app).get(`/api/v1/lms/me/courses/${courseId}/certificate-eligibility`).set('Authorization', `Bearer ${learner.accessToken}`);
    const conditionBefore = before.body.data.conditions.find((c: any) => c.key === 'finalProjectApproved');
    expect(conditionBefore).toBeDefined();
    expect(conditionBefore.satisfied).toBe(false);
    expect(before.body.data.notApplicable).not.toContain('finalProjectApproved');

    await submitAndApprove(learner.accessToken, artifact.assignmentId);

    const after = await request(app).get(`/api/v1/lms/me/courses/${courseId}/certificate-eligibility`).set('Authorization', `Bearer ${learner.accessToken}`);
    expect(after.body.data.conditions.find((c: any) => c.key === 'finalProjectApproved').satisfied).toBe(true);
  });

  it('denies a non-enrolled learner from reading a project status', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const project = (await request(app).post(`/api/v1/lms/admin/modules/${moduleId}/projects`).set('Authorization', `Bearer ${admin.accessToken}`).send({ title: 'Outsider Test Project' })).body.data;
    const artifact = await createArtifactAssignment(moduleId, 'Outsider Artifact');
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/artifacts`).set('Authorization', `Bearer ${admin.accessToken}`).send({ assignmentId: artifact.assignmentId });
    await request(app).post(`/api/v1/lms/admin/projects/${project.id}/status`).set('Authorization', `Bearer ${admin.accessToken}`).send({ status: 'PUBLISHED' });

    const outsider = await createUserWithRole(uniqueEmail('proj-outsider'), 'registered_free_user');
    const res = await request(app).get(`/api/v1/lms/me/projects/${project.id}`).set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('denies a non-privileged user from creating a project (RBAC)', async () => {
    if (skip()) return;
    await ensureFixtures();
    const { moduleId } = await createPublishedCourseWithModule();
    const res = await request(app)
      .post(`/api/v1/lms/admin/modules/${moduleId}/projects`)
      .set('Authorization', `Bearer ${learner.accessToken}`)
      .send({ title: 'Should Be Denied' });
    expect(res.status).toBe(403);
  });
});
