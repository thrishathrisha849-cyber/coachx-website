# Phase 4 Requirements Traceability

Maps every Feature 003 (and relevant Feature 001) functional requirement
Phase 4 touches to its Prisma model / service / controller / middleware /
validation schema / test. Status legend: **Implemented** · **Deferred**
(explicitly out of scope, with reason) · **Partial** (a scoped-down
version implemented).

## Architecture conflict — reported per Phase 4 instructions

`specs/001-product-vision-governance/plan.md` and
`specs/003-auth-identity-onboarding-dashboard/plan.md` both describe a
**NestJS** backend (`backend/src/modules/...`) and a unified Next.js
`web/` deployable with `(public)`/`(member)`/`(admin)` route groups.
`001/tasks.md` T001 literally says "Initialize `backend/` NestJS
project." Both plan.md files also claim 001 "already built" a
`RbacGuard` and `backend/src/modules/rbac/seed/roles.seed.ts`.

**None of this matches the actual, already-approved implementation.**
Phases 1–3 (approved, committed, pushed) built a plain **Express +
TypeScript** backend with Clean Architecture layering
(`routes/controllers/middlewares/utils`, no `modules/` directory) and
**separate** `frontend/`/`admin/` Vite+React apps, not a unified Next.js
deployable. No RBAC module existed in code before this phase — 001 was
only ever spec-corrected (Wave 1), never code-implemented.

Per this phase's instruction ("If the specification conflicts with the
existing implementation, stop and report the conflict before changing
the specification"): this is reported here, not silently resolved, and
neither `plan.md` file was edited. Implementation proceeds against the
**real, approved architecture** (Express/Prisma), which the Phase 4
brief itself directs by listing "Existing backend architecture" as
required reading alongside the specs. Every functional requirement
(role list, permission format, token/session behavior, MFA method,
etc.) is still implemented exactly as the specs state — only the
framework/file-layout assumption differs.

## Authentication Requirements (003)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-001 | One primary identity, multiple linked login methods | Implemented (password only; see FR-007) | `User`/`Credential` models |
| FR-002 | Auth data separate from public profile | Implemented | `User` (private) vs `UserProfile` (public) |
| FR-006 | Account types (Individual/Mentor/Instructor/Org/Staff) | Partial — role list implemented (FR-067), no per-type onboarding gating | `rbac.constants.ts` |
| FR-007 | Email/password, mobile OTP, Google, Apple, passwordless, future SSO-ready | Partial — email+password only | `Credential.type` enum includes GOOGLE/APPLE/OTP_MOBILE for forward-compat, unimplemented |
| FR-008 | Standard signup journey | Implemented (verification-required path) | `registration.service.ts` |
| FR-011 | Email signup required/optional fields | Implemented | `auth.validation.ts` `registerSchema` |
| FR-012 | Mobile OTP signup | **Deferred — no SMS provider configured** | — |
| FR-013 | Password policy (8+ chars, letter+number, common-password reject) | Implemented | `password.util.ts` |
| FR-014 | Stronger staff password policy | Implemented (`strict` mode) | `password.util.ts` |
| FR-016/017 | Name/email validation | Implemented | `auth.validation.ts` |
| FR-019 | Breach-checked passwords | **Deferred — requires external breach-check service (e.g. HIBP k-anonymity API), not configured** | documented in `password.util.ts` |
| FR-020 | Explicit terms acceptance | Implemented (`acceptedTerms: z.literal(true)`) | `auth.validation.ts` |
| FR-021 | Duplicate-signup generic message | Implemented (API-level; frontend Login/Forgot-Password UI options are a future frontend task) | `registration.service.ts` |
| FR-022 | Idempotent signup submission | Implemented (via Phase 3's `IdempotencyKey`) | `registration.service.ts` |
| FR-024–027 | Verification email, screen, resend protections | Implemented (screen is a frontend task, not built here) | `email-verification.service.ts` |
| FR-028–036 | Mobile OTP / social login | **Deferred — no SMS/OAuth provider configured** | — |
| FR-037–041 | Login, generic errors, priority routing | Partial — login + generic error implemented; post-login routing priority (protected URL → checkout → event → onboarding → dashboard) needs checkout/event-registration state from unbuilt features, deferred | `login.service.ts` |
| FR-042 | Passwordless magic link | **Deferred** — P2/optional per spec's own Assumptions | — |
| FR-043–047 | Forgot/reset password, staff full-revocation | Implemented | `password-reset.service.ts` |
| FR-048–049 | Support-assisted recovery | **Deferred — needs a ticketing system (013 CRM) that doesn't exist yet** | — |
| FR-050–054 | Mandatory 2FA, TOTP, recovery codes | Implemented (TOTP + recovery codes); SMS/email OTP as 2FA methods deferred (no provider) | `mfa.service.ts` |
| FR-055–059 | Session/device model, rotation, reuse detection, expiry, sign-out | Implemented (precise-location/device-name capture beyond UA/IP deferred — no geo-IP provider) | `session.service.ts` |
| FR-060–061 | Devices/Sessions screen data + remove-access | Implemented (API only — screen itself is a frontend task) | `session.controller.ts` |
| FR-062–063 | Risk evaluation, graduated response | Partial — repeated-failures lockout only; impossible-travel/malicious-IP/new-country deferred (no geo-IP/threat-intel provider) | `login.service.ts` |

## Identity & Profile / RBAC (003 + 001)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-064 | 10 account statuses | Partial — 6 implemented (PENDING_VERIFICATION/ACTIVE/LOCKED/SUSPENDED/DEACTIVATED/DELETED); "onboarding incomplete" (003 US2, out of scope), "restricted" sub-flags, and "merged" (needs cross-feature data) deferred | `AccountStatus` enum |
| FR-067/068 | 12-role set, action-based permissions | Implemented | `rbac.constants.ts`, `Role`/`Permission`/`RolePermission` |
| FR-069–070 | Public/private profile split | Partial — minimal `UserProfile` (displayName/username); full field set (bio, skills, social links, etc.) is 003/tasks.md's own "Phase D2" supplementary phase, out of Phase 4 | `UserProfile` model |
| FR-071–076 | Username system, photo upload, completion %, visibility controls | **Deferred — 003/tasks.md's own Phase D2, not part of the auth/identity/RBAC mandate** | — |
| 001 FR-084–089 | RBAC engine, deny-by-default, 7 denial reasons, backend-only enforcement | Implemented | `rbac.service.ts`, `authorize.middleware.ts` |
| 003 FR-126–131 | Admin user ops (list/detail/impersonation/merge), role change | Partial — role-change (FR-130) implemented; list/detail/merge/impersonation deferred (admin UI + cross-feature purchase/progress data not in scope) | `admin-identity.controller.ts` |
| 003 FR-132–137 | Deactivate/delete/export/consent | **Deferred — needs 009 (subscription/refund) and 007 (mentor payout) data to evaluate deletion-blocking considerations correctly; building a shortcut version would risk silently deleting financial records** | `docs/auth/DECISION_GATES.md` |

## Security / Analytics / Audit (003)

| FR | Requirement | Status | Where |
| --- | --- | --- | --- |
| FR-138 | Adaptive password hashing | Implemented (Argon2id) | `password.util.ts` |
| FR-139 | Refresh rotation, secure cookies, CSRF, XSS | Partial — rotation implemented; secure-cookie transport not used (tokens returned in JSON body, matching a mobile+web API-first design — see `docs/auth/THREAT_MODEL.md`); CSRF n/a without cookie auth; XSS is a frontend concern out of backend scope | `session.service.ts` |
| FR-140 | Rate limiting, bot/credential-stuffing defense | Implemented (per-route limiters) | `auth-rate-limit.middleware.ts` |
| FR-141 | Anomaly detection, secret rotation, session revocation | Partial — lockout implemented; full anomaly detection deferred (see FR-062) | `login.service.ts` |
| FR-142 | Audit logging, encryption in transit/at rest | Implemented (audit via Phase 3's `AuditEvent`; TLS is a deployment/infra concern, at-rest encryption is a database-provider concern) | `audit-event.repository.ts` |
| FR-143–144 | Audit event catalog, no secrets in logs | Implemented | throughout `src/auth/*.service.ts` + `redact.ts` extension |
| FR-145 | Auth analytics events | **Deferred — no analytics-ingestion infrastructure exists yet**; audit events cover the compliance-relevant subset | `docs/auth/DECISION_GATES.md` |

## Not implemented at all (out of Phase 4 scope by the brief's own constraints)

Onboarding (003 US2), personalization/roadmap, and the member dashboard
(003 US4) are explicitly out of scope — the Phase 4 brief's 18 sections
never mention them, and its constraints list forbids "business
dashboards." These remain entirely unimplemented, tracked against
003/tasks.md Phases 5–6/D2 for whenever that work is picked up.
