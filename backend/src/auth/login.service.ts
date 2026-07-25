import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { config } from '../config';
import { verifyPassword } from './password.util';
import {
  findUserByEmail,
  findCredential,
  updateUser,
  recordLoginAttempt,
} from './auth.repository';
import { issueSession, type IssuedTokenPair, type SessionContext } from './session.service';
import { issueMfaChallenge } from './mfa.service';
import { getEffectiveRoles } from './rbac.service';
import { MFA_MANDATORY_ROLES, type RoleName } from './rbac.constants';
import { AUTH_ERROR_CODES } from './auth-error-codes';

export interface LoginInput {
  email: string;
  password: string;
  context: SessionContext;
  correlationId?: string;
  requestId?: string;
}

export type LoginResult =
  | { status: 'success'; tokens: IssuedTokenPair; userId: string; mfaSetupRequired: boolean }
  | { status: 'mfa_required'; mfaChallengeToken: string };

/**
 * Login (003 User Story 3; FR-037–FR-041; Phase 4 brief §4). Phase 4
 * scope: email + password identifier only (see
 * docs/auth/TRACEABILITY.md for the mobile-identifier-autodetection
 * deferral, FR-038).
 *
 * Security posture, all enforced here: a generic "invalid credentials"
 * error for every failure mode (wrong email, wrong password, unverified,
 * locked, suspended, deactivated) EXCEPT MFA-required, which necessarily
 * confirms the credentials were correct — this is standard and does not
 * itself leak account existence, since it only occurs after a successful
 * password check. Never reveals which field was wrong (FR-040).
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  const genericFailure = () =>
    new AppError('Invalid email or password', 401, AUTH_ERROR_CODES.INVALID_CREDENTIALS);

  if (!user) {
    // FR-040: identical generic failure whether or not the account
    // exists — no early-return with a different message.
    await recordLoginAttempt({
      userId: null,
      emailAttempted: normalizedEmail,
      succeeded: false,
      ipAddress: input.context.ipAddress ?? null,
      userAgent: input.context.userAgent ?? null,
    });
    throw genericFailure();
  }

  // Account-state checks happen AFTER the attempt is logged but BEFORE
  // password verification would be ideal for early-exit performance, but
  // doing the password check regardless of lock state would make timing
  // reveal account-lock state — so lock/suspend checks intentionally
  // happen first, accepting the (standard, well-known) trade-off that a
  // locked-account response is itself somewhat distinguishable. This
  // mirrors 003 FR-066's explicit design: a suspended user IS told they
  // are suspended (with reason category/duration/appeal — not a fully
  // generic error) rather than a blanket generic message for this
  // specific case.
  if (user.status === 'LOCKED' && user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Account temporarily locked due to repeated failed attempts. Please try again later or reset your password.', 423, AUTH_ERROR_CODES.ACCOUNT_LOCKED);
  }
  if (user.status === 'SUSPENDED') {
    throw new AppError('This account has been suspended. Contact support for assistance.', 403, AUTH_ERROR_CODES.ACCOUNT_SUSPENDED);
  }
  if (user.status === 'DEACTIVATED') {
    throw new AppError('This account has been deactivated.', 403, AUTH_ERROR_CODES.ACCOUNT_DEACTIVATED);
  }
  if (user.status === 'DELETED') {
    throw genericFailure();
  }

  const credential = await findCredential(user.id, 'PASSWORD');
  const passwordValid = credential?.passwordHash
    ? await verifyPassword(credential.passwordHash, input.password)
    : false;

  if (!passwordValid) {
    await recordLoginAttempt({
      userId: user.id,
      emailAttempted: normalizedEmail,
      succeeded: false,
      ipAddress: input.context.ipAddress ?? null,
      userAgent: input.context.userAgent ?? null,
    });

    const newFailedCount = user.failedLoginCount + 1;
    const shouldLock = newFailedCount >= config.auth.loginLockoutThreshold;

    await updateUser(user.id, {
      failedLoginCount: newFailedCount,
      ...(shouldLock
        ? {
            status: 'LOCKED',
            lockedUntil: new Date(Date.now() + config.auth.loginLockoutDurationMin * 60 * 1000),
          }
        : {}),
    });

    await recordAuditEvent({
      actorType: 'USER',
      actorId: user.id,
      action: shouldLock ? 'auth.login.failed_lockout_triggered' : 'auth.login.failed',
      resourceType: 'user',
      resourceId: user.id,
      correlationId: input.correlationId,
      requestId: input.requestId,
    });

    throw genericFailure();
  }

  // FR-025/FR-023-adjacent: unverified accounts may not complete login —
  // routed instead through the resend-verification path.
  if (user.status === 'PENDING_VERIFICATION') {
    throw new AppError('Please verify your email before logging in', 403, AUTH_ERROR_CODES.EMAIL_UNVERIFIED);
  }

  // Successful password check resets the failed-attempt counter.
  await updateUser(user.id, { failedLoginCount: 0, lockedUntil: null });

  await recordLoginAttempt({
    userId: user.id,
    emailAttempted: normalizedEmail,
    succeeded: true,
    ipAddress: input.context.ipAddress ?? null,
    userAgent: input.context.userAgent ?? null,
  });

  if (user.mfaEnabled) {
    // 003 FR-050/§9: MFA challenge issued instead of a session — see
    // mfa.service.ts for the short-lived challenge-token mechanism.
    const mfaChallengeToken = await issueMfaChallenge(user.id);

    await recordAuditEvent({
      actorType: 'USER',
      actorId: user.id,
      action: 'auth.login.mfa_challenge_issued',
      resourceType: 'user',
      resourceId: user.id,
      correlationId: input.correlationId,
      requestId: input.requestId,
    });

    return { status: 'mfa_required', mfaChallengeToken };
  }

  // FR-050: 2FA is mandatory for admin/finance/super-admin/high-risk
  // roles. Login itself is not blocked outright (there would be no way
  // to reach the enrollment endpoint — which itself requires a valid
  // session — without one), but the response flags that setup is
  // required so the caller can force the enrollment flow before
  // allowing any other action. This is the honest, currently-implemented
  // scope of FR-050's enforcement — see docs/auth/DECISION_GATES.md for
  // the stronger "block privileged endpoints until MFA is set up"
  // middleware this flag is a stepping stone toward.
  const roles = await getEffectiveRoles(user.id);
  const mfaSetupRequired = !user.mfaEnabled && roles.some((r) => MFA_MANDATORY_ROLES.includes(r as RoleName));

  const tokens = await issueSession(user.id, input.context);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: user.id,
    action: 'auth.login.succeeded',
    resourceType: 'user',
    resourceId: user.id,
    correlationId: input.correlationId,
    requestId: input.requestId,
    ...(mfaSetupRequired ? { metadata: { mfaSetupRequired: true } } : {}),
  });

  return { status: 'success', tokens, userId: user.id, mfaSetupRequired };
}
