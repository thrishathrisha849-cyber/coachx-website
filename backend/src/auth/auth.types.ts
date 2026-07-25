/**
 * Shared types for the Phase 4 auth/identity/RBAC module. See
 * docs/auth/TRACEABILITY.md for the FR citation behind every field below.
 */

/** Claims embedded in a signed access token (FR-056). */
export interface AccessTokenClaims {
  /** Subject — the User.id this token authenticates. */
  sub: string;
  /** Session.id this access token was issued alongside (for session-scoped revocation checks). */
  sid: string;
  /** Token type discriminator — access tokens MUST be rejected wherever a refresh token is expected, and vice versa (§5 "Token type validation"). */
  type: 'access';
  /** Role names held by the user at issuance time — a deliberate architectural choice so authorization checks do not require a database round-trip on every request; roles are re-resolved from the database on next token refresh, so a role change takes effect within one access-token lifetime (max `JWT_ACCESS_EXPIRES_IN`), not instantly — documented as a decision, not silently assumed. */
  roles: string[];
}

/** The authenticated identity attached to `req.user` by `authenticate.middleware.ts`. */
export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  roles: string[];
}

/** Result of a password-policy validation check (FR-013, FR-014, FR-019). */
export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}
