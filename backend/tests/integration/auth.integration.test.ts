/**
 * Real-database integration tests for Phase 4's auth/identity/RBAC
 * surface: registration, login, MFA, refresh rotation/reuse detection,
 * logout, email verification, password reset, RBAC enforcement, and
 * session management.
 *
 * ENVIRONMENT DEPENDENCY (reported, not hidden): identical pattern to
 * `database.integration.test.ts` (Phase 3) — requires `TEST_DATABASE_URL`
 * pointed at a dedicated test database with this repo's migrations
 * applied. If unset or unreachable, every test in this file SKIPS itself
 * with an explicit console warning rather than silently no-oping as a
 * false "pass" — see docs/database/TESTING.md and docs/auth/TESTING.md.
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

async function cleanupAuthTables() {
  const db = getPrismaClient();
  // Deleting User cascades to profile/credentials/sessions/tokens/mfa/recovery-codes/login-attempts.
  await db.user.deleteMany({});
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('⚠ SKIPPING auth.integration.test.ts: no TEST_DATABASE_URL/DATABASE_URL set in this environment.');
    return;
  }

  await connectDatabase();
  dbAvailable = isTestDatabaseAvailable();

  if (!dbAvailable) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ SKIPPING auth.integration.test.ts: could not reach PostgreSQL at the configured DATABASE_URL ' +
        '(expected in this sandbox — no Docker/Postgres available; see docs/auth/TESTING.md).',
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
    await cleanupAuthTables();
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

async function registerAndVerify(email: string, password = 'GoodPassword1') {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password, confirmPassword: password, acceptedTerms: true });

  const sentMessage = emailAdapter.sent.find((m: any) => m.to === email && m.subject.includes('Verify'));
  const tokenMatch = sentMessage?.text.match(/token: (\S+)/);
  const rawToken = tokenMatch?.[1];

  if (rawToken) {
    await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken });
  }

  return rawToken;
}

describe('Registration (003 User Story 1)', () => {
  it('creates a new account in PENDING_VERIFICATION status and sends a verification email', async () => {
    if (skip()) return;

    const email = uniqueEmail('register');
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Jane Doe', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe(email);
    expect(response.body.data.verificationRequired).toBe(true);
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('password');

    expect(emailAdapter.sent).toHaveLength(1);
    expect(emailAdapter.sent[0].to).toBe(email);
  });

  it('rejects a duplicate email registration without creating a second account', async () => {
    if (skip()) return;

    const email = uniqueEmail('dup');
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

    const second = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'B', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

    expect(second.status).toBe(409);

    const db = getPrismaClient();
    const count = await db.user.count({ where: { email: email.toLowerCase() } });
    expect(count).toBe(1);
  });

  it('rejects a password that does not meet the policy', async () => {
    if (skip()) return;

    const email = uniqueEmail('weakpw');
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email, password: 'weak', confirmPassword: 'weak', acceptedTerms: true });

    expect(response.status).toBe(400);
  });

  it('never creates duplicate accounts from a rapid double-submit with the same idempotency key', async () => {
    if (skip()) return;

    const email = uniqueEmail('idem');
    const payload = { name: 'A', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true };

    const [r1, r2] = await Promise.all([
      request(app).post('/api/v1/auth/register').set('Idempotency-Key', 'same-key-123').send(payload),
      request(app).post('/api/v1/auth/register').set('Idempotency-Key', 'same-key-123').send(payload),
    ]);

    // One should succeed (or replay), the other may see "in-progress" —
    // the invariant that matters is exactly one account exists afterward.
    expect([r1.status, r2.status].every((s) => [201, 409].includes(s))).toBe(true);

    const db = getPrismaClient();
    const count = await db.user.count({ where: { email: email.toLowerCase() } });
    expect(count).toBe(1);
  });
});

describe('Email verification (003 FR-024–FR-027)', () => {
  it('verifies an account and marks it ACTIVE', async () => {
    if (skip()) return;

    const email = uniqueEmail('verify');
    await registerAndVerify(email);

    const db = getPrismaClient();
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    expect(user.status).toBe('ACTIVE');
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('rejects reusing an already-consumed verification token', async () => {
    if (skip()) return;

    const email = uniqueEmail('reuse');
    const token = await registerAndVerify(email);

    const second = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(second.status).toBe(400);
  });

  it('rejects an invalid verification token', async () => {
    if (skip()) return;
    const response = await request(app).post('/api/v1/auth/verify-email').send({ token: 'not-a-real-token' });
    expect(response.status).toBe(400);
  });
});

describe('Login (003 User Story 3)', () => {
  it('logs in successfully with correct credentials and issues tokens', async () => {
    if (skip()) return;

    const email = uniqueEmail('login-ok');
    await registerAndVerify(email);

    const response = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  it('returns an identical generic error for a nonexistent email and a wrong password (no account enumeration)', async () => {
    if (skip()) return;

    const email = uniqueEmail('login-fail');
    await registerAndVerify(email);

    const wrongPassword = await request(app).post('/api/v1/auth/login').send({ email, password: 'WrongPassword1' });
    const nonexistent = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: uniqueEmail('does-not-exist'), password: 'WrongPassword1' });

    expect(wrongPassword.status).toBe(401);
    expect(nonexistent.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(nonexistent.body.error.message);
    expect(wrongPassword.body.error.code).toBe(nonexistent.body.error.code);
  });

  it('rejects login before email verification', async () => {
    if (skip()) return;

    const email = uniqueEmail('unverified');
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email, password: 'GoodPassword1', confirmPassword: 'GoodPassword1', acceptedTerms: true });

    const response = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('AUTH_EMAIL_UNVERIFIED');
  });

  it('locks the account after repeated failed attempts (FR-062 repeated-failures signal)', async () => {
    if (skip()) return;

    const email = uniqueEmail('lockout');
    await registerAndVerify(email);

    // Default threshold is 5 (AUTH_LOGIN_LOCKOUT_THRESHOLD).
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/login').send({ email, password: 'WrongPassword1' });
    }

    const response = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    expect(response.status).toBe(423);
    expect(response.body.error.code).toBe('AUTH_ACCOUNT_LOCKED');
  }, 15_000);
});

describe('Refresh-token rotation and reuse detection (Phase 4 brief §6)', () => {
  it('rotates the refresh token on each use and the old token can no longer be used', async () => {
    if (skip()) return;

    const email = uniqueEmail('rotate');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const originalRefreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: originalRefreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.refreshToken).not.toBe(originalRefreshToken);

    // The OLD token must now be rejected — it was superseded by rotation.
    const reuseAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });
    expect(reuseAttempt.status).toBe(401);
  });

  it('detects reuse of a revoked/already-rotated-past token and revokes the whole session family', async () => {
    if (skip()) return;

    const email = uniqueEmail('reuse-detect');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const originalRefreshToken = loginRes.body.data.refreshToken;

    // Rotate once (this is legitimate).
    const firstRotate = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: originalRefreshToken });
    const rotatedToken = firstRotate.body.data.refreshToken;

    // Attempt to reuse the ORIGINAL (now-superseded) token — the classic
    // stolen-token replay pattern.
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: originalRefreshToken });

    // Even the legitimately-rotated token must now be rejected — reuse
    // detection revokes the ENTIRE family, not just the reused token.
    const afterReuseAttempt = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: rotatedToken });
    expect(afterReuseAttempt.status).toBe(401);
  });

  it('rejects a completely invalid/fabricated refresh token', async () => {
    if (skip()) return;
    const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'fabricated-token-value' });
    expect(response.status).toBe(401);
  });
});

describe('Logout (003 FR-059)', () => {
  it('revokes the current session on logout, and the refresh token no longer works', async () => {
    if (skip()) return;

    const email = uniqueEmail('logout');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const { accessToken, refreshToken } = loginRes.body.data;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('logout-all revokes every session for the user', async () => {
    if (skip()) return;

    const email = uniqueEmail('logout-all');
    await registerAndVerify(email);

    const session1 = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const session2 = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${session1.body.data.accessToken}`);

    const refresh1 = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: session1.body.data.refreshToken });
    const refresh2 = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: session2.body.data.refreshToken });

    expect(refresh1.status).toBe(401);
    expect(refresh2.status).toBe(401);
  });

  it('rejects logout without a valid access token', async () => {
    if (skip()) return;
    const response = await request(app).post('/api/v1/auth/logout').send({ refreshToken: 'anything' });
    expect(response.status).toBe(401);
  });
});

describe('Password reset (003 User Story 5, SC-003)', () => {
  it('returns an identical response for an existing and a nonexistent email (enumeration-safe)', async () => {
    if (skip()) return;

    const email = uniqueEmail('reset-exists');
    await registerAndVerify(email);

    const existing = await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const nonexistent = await request(app).post('/api/v1/auth/forgot-password').send({ email: uniqueEmail('no-account') });

    expect(existing.status).toBe(200);
    expect(nonexistent.status).toBe(200);
    expect(existing.body.data.message).toBe(nonexistent.body.data.message);
  });

  it('completes a full reset with a valid token and revokes existing sessions', async () => {
    if (skip()) return;

    const email = uniqueEmail('reset-flow');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const oldRefreshToken = loginRes.body.data.refreshToken;

    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const resetMessage = emailAdapter.sent.find((m: any) => m.to === email && m.subject.includes('Reset'));
    const rawToken = resetMessage?.text.match(/token: (\S+)/)?.[1];
    expect(rawToken).toBeDefined();

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'NewGoodPassword1', confirmNewPassword: 'NewGoodPassword1' });
    expect(resetRes.status).toBe(200);

    // Old session must now be revoked.
    const refreshAfterReset = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefreshToken });
    expect(refreshAfterReset.status).toBe(401);

    // New password works; old password does not.
    const loginNew = await request(app).post('/api/v1/auth/login').send({ email, password: 'NewGoodPassword1' });
    expect(loginNew.status).toBe(200);

    const loginOld = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    expect(loginOld.status).toBe(401);
  });

  it('rejects reusing an already-consumed reset token', async () => {
    if (skip()) return;

    const email = uniqueEmail('reset-reuse');
    await registerAndVerify(email);
    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const resetMessage = emailAdapter.sent.find((m: any) => m.to === email && m.subject.includes('Reset'));
    const rawToken = resetMessage?.text.match(/token: (\S+)/)?.[1];

    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'FirstNewPassword1', confirmNewPassword: 'FirstNewPassword1' });

    const secondAttempt = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'SecondNewPassword1', confirmNewPassword: 'SecondNewPassword1' });

    expect(secondAttempt.status).toBe(400);
  });
});

describe('Sessions (003 FR-060–FR-061)', () => {
  it('lists active sessions and lets the user revoke one by ID', async () => {
    if (skip()) return;

    const email = uniqueEmail('sessions');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const { accessToken } = loginRes.body.data;

    const listRes = await request(app).get('/api/v1/auth/sessions').set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0]).not.toHaveProperty('refreshTokenHash');

    const sessionId = listRes.body.data[0].id;
    const revokeRes = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(revokeRes.status).toBe(200);
  });

  it('rejects revoking another user’s session (IDOR protection)', async () => {
    if (skip()) return;

    const emailA = uniqueEmail('idor-a');
    const emailB = uniqueEmail('idor-b');
    await registerAndVerify(emailA);
    await registerAndVerify(emailB);

    const loginA = await request(app).post('/api/v1/auth/login').send({ email: emailA, password: 'GoodPassword1' });
    const loginB = await request(app).post('/api/v1/auth/login').send({ email: emailB, password: 'GoodPassword1' });

    const sessionsB = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${loginB.body.data.accessToken}`);
    const sessionIdB = sessionsB.body.data[0].id;

    // User A attempts to revoke User B's session.
    const crossUserRevoke = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionIdB}`)
      .set('Authorization', `Bearer ${loginA.body.data.accessToken}`);

    expect(crossUserRevoke.status).toBe(404);
  });
});

describe('MFA lifecycle (003 FR-050–FR-054)', () => {
  it('completes the full enroll → confirm → login-challenge cycle', async () => {
    if (skip()) return;

    const email = uniqueEmail('mfa');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const { accessToken } = loginRes.body.data;

    const enrollRes = await request(app)
      .post('/api/v1/auth/mfa/enroll')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'GoodPassword1' });
    expect(enrollRes.status).toBe(200);
    expect(enrollRes.body.data.secretBase32).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Secret, TOTP } = require('otpauth');
    const totp = new TOTP({ issuer: 'TBT One', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret: Secret.fromBase32(enrollRes.body.data.secretBase32) });
    const code = totp.generate();

    const confirmRes = await request(app)
      .post('/api/v1/auth/mfa/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.recoveryCodes).toHaveLength(10);

    // Next login must now require an MFA challenge.
    const secondLogin = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    expect(secondLogin.status).toBe(200);
    expect(secondLogin.body.data.mfaRequired).toBe(true);

    const challengeCode = totp.generate();
    const mfaLoginRes = await request(app)
      .post('/api/v1/auth/mfa/challenge')
      .send({ mfaChallengeToken: secondLogin.body.data.mfaChallengeToken, code: challengeCode });
    expect(mfaLoginRes.status).toBe(200);
    expect(mfaLoginRes.body.data.accessToken).toBeDefined();
  }, 20_000);

  it('rejects an invalid MFA code during the login challenge', async () => {
    if (skip()) return;

    const email = uniqueEmail('mfa-invalid');
    await registerAndVerify(email);
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });
    const enrollRes = await request(app)
      .post('/api/v1/auth/mfa/enroll')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .send({ password: 'GoodPassword1' });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Secret, TOTP } = require('otpauth');
    const totp = new TOTP({ issuer: 'TBT One', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret: Secret.fromBase32(enrollRes.body.data.secretBase32) });
    await request(app)
      .post('/api/v1/auth/mfa/confirm')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .send({ code: totp.generate() });

    const secondLogin = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    const badChallenge = await request(app)
      .post('/api/v1/auth/mfa/challenge')
      .send({ mfaChallengeToken: secondLogin.body.data.mfaChallengeToken, code: '000000' });
    expect(badChallenge.status).toBe(400);
  }, 20_000);
});

describe('RBAC enforcement (001 FR-084–FR-089; Phase 4 brief §10)', () => {
  it('denies a standard user attempting an admin-only action (role assignment)', async () => {
    if (skip()) return;

    const emailA = uniqueEmail('rbac-a');
    const emailB = uniqueEmail('rbac-b');
    await registerAndVerify(emailA);
    await registerAndVerify(emailB);

    const loginA = await request(app).post('/api/v1/auth/login').send({ email: emailA, password: 'GoodPassword1' });
    const db = getPrismaClient();
    const userB = await db.user.findUnique({ where: { email: emailB.toLowerCase() } });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${userB.id}/role`)
      .set('Authorization', `Bearer ${loginA.body.data.accessToken}`)
      .send({ role: 'platform_admin', reason: 'test' });

    expect(response.status).toBe(403);
  });

  it('prevents self-escalation even for a user who otherwise holds the permission', async () => {
    if (skip()) return;

    const email = uniqueEmail('self-escalate');
    await registerAndVerify(email);

    const db = getPrismaClient();
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    const adminRole = await db.role.findUnique({ where: { name: 'platform_admin' } });
    await db.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ role: 'super_admin', reason: 'trying to self-escalate' });

    expect(response.status).toBe(403);
  });

  it('allows an authorized admin to assign a role, with a reason required and an audit trail created', async () => {
    if (skip()) return;

    const adminEmail = uniqueEmail('rbac-admin');
    const targetEmail = uniqueEmail('rbac-target');
    await registerAndVerify(adminEmail);
    await registerAndVerify(targetEmail);

    const db = getPrismaClient();
    const adminUser = await db.user.findUnique({ where: { email: adminEmail.toLowerCase() } });
    const targetUser = await db.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
    const platformAdminRole = await db.role.findUnique({ where: { name: 'platform_admin' } });
    await db.userRole.create({ data: { userId: adminUser.id, roleId: platformAdminRole.id } });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'GoodPassword1' });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${targetUser.id}/role`)
      .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`)
      .send({ role: 'course_instructor', reason: 'Promoted to instructor after review' });

    expect(response.status).toBe(200);

    const auditEntry = await db.auditEvent.findFirst({
      where: { action: 'auth.role.assigned', resourceId: targetUser.id },
    });
    expect(auditEntry).not.toBeNull();
    expect(auditEntry.reason).toBe('Promoted to instructor after review');
  });

  it('requires a reason to assign a role (validation-level enforcement)', async () => {
    if (skip()) return;

    const adminEmail = uniqueEmail('rbac-noreason');
    await registerAndVerify(adminEmail);
    const db = getPrismaClient();
    const adminUser = await db.user.findUnique({ where: { email: adminEmail.toLowerCase() } });
    const platformAdminRole = await db.role.findUnique({ where: { name: 'platform_admin' } });
    await db.userRole.create({ data: { userId: adminUser.id, roleId: platformAdminRole.id } });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: 'GoodPassword1' });

    const targetEmail = uniqueEmail('rbac-noreason-target');
    await registerAndVerify(targetEmail);
    const targetUser = await db.user.findUnique({ where: { email: targetEmail.toLowerCase() } });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${targetUser.id}/role`)
      .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`)
      .send({ role: 'course_instructor', reason: '' });

    expect(response.status).toBe(400);
  });
});

describe('Security — no secret leakage', () => {
  it('never returns a password hash or MFA secret in the /me response', async () => {
    if (skip()) return;

    const email = uniqueEmail('me-safe');
    await registerAndVerify(email);
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'GoodPassword1' });

    const meRes = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);

    const body = JSON.stringify(meRes.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('encryptedSecret');
    expect(body).not.toMatch(/\$argon2id\$/);
  });

  it('never persists a raw password in the AuditEvent table for a registration event', async () => {
    if (skip()) return;

    const email = uniqueEmail('audit-safe');
    await registerAndVerify(email);

    const db = getPrismaClient();
    const events = await db.auditEvent.findMany({ where: { action: 'auth.user.registered' } });
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('GoodPassword1');
  });

  it('rejects an expired/tampered token on a protected route', async () => {
    if (skip()) return;
    const response = await request(app).get('/api/v1/me').set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });
});
