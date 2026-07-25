import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { config } from '../config';
import { hashPassword, validatePasswordPolicy } from './password.util';
import { generateSecureToken, hashToken } from './secure-token.util';
import { getEmailAdapter } from './email.port';
import {
  findUserByEmail,
  createUserWithPassword,
  assignDefaultRole,
  createEmailVerificationToken,
} from './auth.repository';
import { DEFAULT_ROLE } from './rbac.constants';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  idempotencyKey?: string;
  correlationId?: string;
  requestId?: string;
}

export interface RegisterResult {
  userId: string;
  email: string;
  status: string;
  verificationRequired: true;
}

/**
 * Registration (003 User Story 1; FR-008, FR-011, FR-013–FR-024).
 * Phase 4 scope: email + password only — see docs/auth/TRACEABILITY.md
 * for why mobile-OTP and Google/Apple signup (FR-012, FR-033) are
 * deferred.
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  if (input.password !== input.confirmPassword) {
    throw AppError.badRequest('Password and confirmation do not match');
  }

  const policy = validatePasswordPolicy(input.password, { email: input.email, name: input.name });
  if (!policy.valid) {
    throw AppError.badRequest('Password does not meet the required policy', { errors: policy.errors });
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  // FR-022: idempotent submission handling — a rapid double-click resubmit
  // with the same idempotency key returns the original result rather than
  // creating a second account. Falls back to a per-email key when the
  // caller doesn't supply one, so even a naive double-submit without a
  // client-generated key is still deduplicated within a short window via
  // the underlying unique-email constraint below (defense in depth, not
  // solely reliant on the client sending a key).
  const idempotencyKey = input.idempotencyKey ?? `no-client-key:${normalizedEmail}`;

  const outcome = await beginIdempotentOperation<RegisterResult>('auth.registration', idempotencyKey, {
    email: normalizedEmail,
  });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent registration has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('A registration request for this submission is already in progress');
  }

  try {
    // FR-021: duplicate detection — checked OUTSIDE the transaction with a
    // generic downstream error, but the transaction's own unique
    // constraint on User.email is the real, race-safe guarantee; this
    // check exists to produce a clean 409 rather than relying solely on a
    // raw constraint-violation surfacing through error normalization.
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      // FR-021: generic, non-account-existence-confirming message is a
      // FRONTEND presentation concern (Login/Forgot-Password/Continue-
      // with-provider options) — the API itself must still signal
      // "conflict" distinctly from "success" (a silent-success response
      // for a duplicate email would itself be a worse security bug: it
      // would let an attacker silently overwrite nothing but ALSO give no
      // signal at all, breaking the resend-verification/forgot-password
      // recovery path for the legitimate owner). The 409 code is
      // intentionally generic ("an account may already use this email")
      // rather than a raw "email taken" message.
      throw AppError.conflict('If this email is available, an account can be created with it. If an account already exists, please log in or reset your password instead.');
    }

    const passwordHash = await hashPassword(input.password);

    const rawVerificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpiresAt = new Date(
      Date.now() + config.auth.emailVerificationTokenTtlHours * 60 * 60 * 1000,
    );

    const user = await withTransaction(async (tx) => {
      // A concurrent duplicate-email request racing past the check above
      // is caught here by the schema's own unique constraint on
      // User.email — normalized to the same clean 409 rather than a raw
      // Prisma error reaching the caller (defense in depth against the
      // TOCTOU race between the check above and this write).
      const created = await createUserWithPassword(
        { email: normalizedEmail, displayName: input.name, passwordHash },
        tx,
      ).catch((error: unknown) => {
        throw normalizeDatabaseError(error);
      });

      // Phase 4 brief §3: "Do not automatically grant admin privileges."
      await assignDefaultRole(created.id, DEFAULT_ROLE, tx);

      await createEmailVerificationToken(created.id, verificationTokenHash, verificationExpiresAt, tx);

      await recordAuditEvent(
        {
          actorType: 'USER',
          actorId: created.id,
          action: 'auth.user.registered',
          resourceType: 'user',
          resourceId: created.id,
          correlationId: input.correlationId,
          requestId: input.requestId,
          afterState: { email: normalizedEmail, status: created.status },
        },
        tx,
      );

      return created;
    });

    // FR-024: verification email sent immediately after signup. Sent
    // outside the transaction (email delivery must never roll back an
    // already-committed account) — a delivery failure here is logged by
    // the email port itself and surfaces to the caller as a 500; the
    // account still exists and resend-verification (FR-026) recovers it.
    await getEmailAdapter().send({
      to: normalizedEmail,
      subject: 'Verify your CoachX account',
      text: `Hi ${input.name},\n\nPlease verify your email by using this token: ${rawVerificationToken}\n\nThis link expires in ${config.auth.emailVerificationTokenTtlHours} hours. If you did not create this account, you can safely ignore this email.`,
    });

    const result: RegisterResult = {
      userId: user.id,
      email: user.email,
      status: user.status,
      verificationRequired: true,
    };

    if (outcome.status === 'new') await outcome.complete(result);

    return result;
  } catch (error) {
    if (outcome.status === 'new') await outcome.fail();
    throw error;
  }
}
