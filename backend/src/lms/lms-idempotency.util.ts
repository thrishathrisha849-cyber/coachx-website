/**
 * Phase 6 Part 2 correction pass — Correction 1 (idempotency infrastructure
 * integration). This file adds NO new idempotency mechanism — it is a thin
 * wrapper around the EXISTING, already-shared
 * `backend/src/database/idempotency.service.ts` (`beginIdempotentOperation`/
 * `hashRequestPayload`), the same infrastructure `auth/registration.service.ts`
 * already uses for FR-022's double-submit protection. See
 * `docs/lms/ENROLLMENT_LIFECYCLE.md`/`docs/lms/COMPLETION_ENGINE.md` for
 * which specific LMS write paths now use it.
 *
 * "Actor scope" (Part 2B correction requirement: "another actor must not
 * be able to reuse the record incorrectly") is enforced by ALWAYS
 * prefixing the resolved key with the acting user's id — two different
 * actors supplying the identical literal `Idempotency-Key` header value
 * therefore resolve to two completely distinct `(scope, key)` rows in the
 * shared `IdempotencyKey` table, never colliding.
 */

/**
 * Resolves the final `(scope, key)` idempotency identity for an LMS write.
 *
 * - If the caller supplied an `Idempotency-Key` header, it is used
 *   (prefixed with the actor id).
 * - If not, a deterministic fallback key is derived from the actor id plus
 *   the caller-supplied `fallbackSuffix` (typically the target resource
 *   id(s)) — the SAME "no-client-key" fallback pattern
 *   `registration.service.ts` already established, so even a naive client
 *   that never sends the header still gets protection against an
 *   immediate rapid double-submit of the identical action.
 */
export function scopedIdempotencyKey(actorId: string, suppliedKey: string | undefined, fallbackSuffix: string): string {
  return `${actorId}:${suppliedKey ?? `no-client-key:${fallbackSuffix}`}`;
}
