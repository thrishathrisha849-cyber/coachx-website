# Auth Decision Gates and Known Limitations

Status: this file is **implemented-now** as a record; every row is, by
definition, not yet fully resolved. Same format/purpose as Phase 3's
`docs/database/DECISION_GATES.md`.

| # | Gate | Current state | Why deferred | Re-check trigger |
| --- | --- | --- | --- | --- |
| 1 | Architecture mismatch: 001/003 `plan.md` assume NestJS + unified `web/` Next.js deployable | Implemented against the real Express + separate frontend/admin apps instead; `plan.md` files not edited | Reported per this phase's explicit instruction ("stop and report... before changing the specification") rather than silently resolved | If/when 001 or 003's `plan.md` is deliberately revised — this note should be folded into that revision |
| 2 | Mobile OTP signup/login (FR-012, FR-028–032) | Not implemented — `Credential.type` enum reserves `OTP_MOBILE` | No SMS provider configured in this environment | Wiring a real SMS gateway (Twilio/MSG91/etc. — see 021's own provider-route architecture as the likely reuse target) |
| 3 | Google/Apple OAuth (FR-033–036) | Not implemented — `Credential.type` enum reserves `GOOGLE`/`APPLE` | No OAuth provider credentials configured | Provisioning real OAuth client IDs/secrets for each provider |
| 4 | Passwordless magic-link login (FR-042) | Not implemented | Explicitly P2/optional per 003/spec.md's own Assumptions; needs the email provider from gate #6 too | Prioritization decision, not a technical blocker |
| 5 | Breach-corpus password checking (FR-019) | Not implemented — offline common-password list only | Needs an external service (e.g. HaveIBeenPwned k-anonymity API) | Selecting and provisioning a breach-check provider |
| 6 | Real email/SMS delivery provider | Not implemented — dev adapter logs only; production adapter fails loudly rather than faking success | 003/spec.md's own Assumptions defer this to "a shared communications platform" (Volume 14) not yet built | That communications platform feature being implemented |
| 7 | Support-assisted account recovery (FR-048–049) | Not implemented | Needs a ticketing system (013 CRM), not yet built | 013 CRM implementation |
| 8 | Account deletion/export/deactivation (FR-132–137) | Not implemented | Needs 009 (subscription/refund state) and 007 (mentor payout state) to correctly evaluate deletion-blocking considerations — building a shortcut version risks silently deleting financial records the spec explicitly says must be checked first | 009 and/or 007 reaching a state where their data is queryable |
| 9 | Full risk-signal login evaluation (FR-062: impossible travel, malicious IP, new country) | Partial — repeated-failures lockout only | Needs a geo-IP/threat-intelligence provider | Selecting and provisioning such a provider |
| 10 | Dual-approval workflow for `super_admin` role grants (FR-130) | Not implemented — single-actor path only, with an extra audit marker (`auth.role.super_admin_grant_attempted`) | No approval-workflow infrastructure exists yet (063's BPM engine is the eventual canonical owner per this session's earlier cross-feature ownership resolution) | 063 (Workflow Automation/BPM) reaching an implementable state |
| 11 | Hard endpoint-level MFA-incomplete block for privileged roles (FR-050) | Partial — `mfaSetupRequired` response flag on login only, not yet enforced as a route-level guard | No privileged business endpoints exist yet to gate (payments, refunds, etc. are unbuilt) — the guard has nothing real to protect yet | The first privileged business endpoint (e.g. `payment.refund`) being implemented — add the guard alongside it |
| 12 | Session-limit policy configurable by role/organization (FR-058) | Partial — fixed platform-wide ceiling (10 concurrent sessions), not admin-configurable | No admin console exists to configure a per-role/per-org policy through | An admin console feature reaching an implementable state |
| 13 | Precise device/location session metadata (FR-055's "approximate location") | Not implemented — User-Agent + IP only | Needs a geo-IP provider | Selecting and provisioning such a provider |
| 14 | Strict staff password policy auto-applied by role | Available (`validatePasswordPolicy(pw, {strict:true})`) but not yet wired to trigger automatically based on the target user's role | Registration happens before any role beyond the default is assigned; auto-detecting "this will become a staff account" at registration time isn't well-defined yet | Deciding how staff accounts are provisioned (admin-invited vs. self-registered-then-promoted) |
| 15 | Auth analytics events (FR-145) | Not implemented — `AuditEvent` covers the compliance-relevant subset | No analytics-ingestion pipeline exists yet | An analytics/event-ingestion feature being implemented |
| 16 | Known duplication: RBAC seed data exists in both `backend/src/auth/rbac.constants.ts` and `database/seeds/rbac.seed.ts` | Accepted, documented duplication (small, stable, spec-cited data — not logic) | `database/` and `backend/` are separate npm workspaces; a seed script must run standalone without depending on a backend build | If the two lists are ever found to disagree — `docs/auth/RBAC_MATRIX.md`'s citations are the tie-breaker |

## How to use this file

Same protocol as Phase 3's: when starting any future phase or feature
that touches auth/identity/RBAC, scan this table first. Resolve a gate
as part of the feature that genuinely needs it, with its own citations
— do not resolve one speculatively in an unrelated phase, and update
this table when a gate closes.
