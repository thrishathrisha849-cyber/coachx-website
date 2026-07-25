# Schema Ownership Matrix

Status: **implemented-now** for the two models listed in §1; **decision
record** (not implementation) for everything in §2 and §3.

## 1. What exists today, and why

| Model            | Owner                                                   | Justification                                                                                                                                                                                                                     | Spec/Constitution citation                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuditEvent`     | Platform-wide shared infrastructure (no single feature) | Every future feature's audit-relevant actions (role changes, refunds, content publishes, AI-copilot actions) write into one shared, immutable trail — the same way every feature already shares the Phase 2 logger/error-handler. | Constitution, Security & Compliance Baseline, line 51: _"All administrative, financial, and AI-copilot actions are captured in an immutable audit log."_ Constitution Article IV (Historical Immutability). `specs/001-product-vision-governance/spec.md` FR-077: _"Every administrative configuration change MUST be recorded in an audit trail."_                                                                       |
| `IdempotencyKey` | Platform-wide shared infrastructure (no single feature) | A generic, scope-namespaced mechanism — it has zero knowledge of what any given `scope` does, only that the same `(scope, key)` pair is never processed twice.                                                                    | Constitution Article I (Server-Authoritative State), line 7: _"...only finalized after backend verification (signed webhook, idempotency-key check, or explicit rule evaluation)."_ Directly named by `specs/006-gamification-rewards/spec.md` FR-014: _"System MUST require a source event ID, rule ID, user ID, and idempotency key on every point-award request, and MUST enforce a unique-transaction constraint..."_ |

Both models are intentionally **decoupled from any auth/user table** —
`AuditEvent.actorId` and every actor-facing field are plain nullable
strings, not foreign keys, because Feature 003 (Authentication) has not
been implemented. See §4 for the migration path once a real `User` table
exists.

## 2. What was considered and deliberately NOT added

| Candidate model                                                              | Verdict                     | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tenant` / `Organization`                                                    | **Rejected as premature**   | `specs/001-product-vision-governance/spec.md` line 364: _"This spec assumes a single-organization-per-account deployment model at MVP; multi-tenant 'white-label communities' ... are listed only under Phase 4 (Enterprise and Ecosystem, Sec 18) and are out of scope until that phase."_ Building this model now would invent structure ahead of an explicitly deferred requirement. See `MULTI_TENANCY.md`.         |
| `OutboxEvent` (transactional outbox)                                         | **Rejected as premature**   | No explicit mandate in any of specs 001–006 for a shared outbox table today, and no current producer/consumer that needs it — Feature 064 (API gateway/integration governance) owns the actual event/integration platform once it's implemented. Adding an unused outbox table now would be exactly the "invented placeholder model" this phase was explicitly told not to create. See `TRANSACTIONS_AND_OUTBOX.md` §3. |
| A generic `User`/`Account`/`Session`/`Role`/`Permission` model               | **Explicitly out of scope** | Feature 003 (Authentication, User Identity, Onboarding) owns this and has not been started. Phase 3's instructions explicitly forbid creating these.                                                                                                                                                                                                                                                                    |
| Any business-domain model (Course, Community, Payment, CRM, Marketplace, AI) | **Explicitly out of scope** | Owned by their respective future features; Phase 3 is shared technical infrastructure only.                                                                                                                                                                                                                                                                                                                             |

## 3. Canonical-ownership confirmations carried forward from the Wave 1 / Critical Issues Resolution passes

These were resolved in earlier phases of this project (not re-decided
here) and are restated for reference since Phase 3's database layer must
not contradict them:

| Feature                                  | Canonical owner of                                                                       | Resolution status                                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 001-product-vision-governance            | Membership Tier / platform-wide entitlement definition                                   | Confirmed — disambiguated from 009's Pricing Plan (billing/commercial packaging of a tier).                                                                                                      |
| 006-gamification-rewards                 | Badge Engine (catalog, award, storage)                                                   | Confirmed canonical; 005-community-social-trust-safety consumes 006's badge API rather than owning its own badge storage.                                                                        |
| 032-omnichannel-orchestration            | Customer-facing journey orchestration (`Customer Journey` / `Customer Journey Instance`) | Confirmed — 022's own entity was renamed `Workflow Journey Instance` to avoid the naming collision.                                                                                              |
| 022-marketing-automation-workflows       | Generic trigger/action/event execution substrate                                         | Confirmed as a distinct, lower-level engine from 032 — not competing for the same entity name.                                                                                                   |
| 063-workflow-automation-bpm-lowcode      | Internal BPM / RPA / low-code process automation                                         | Confirmed as a genuinely distinct third engine from 022/032 (internal ops, not customer-facing or generic marketing triggers).                                                                   |
| 065 (master-data/golden-record)          | Master data / golden-record management                                                   | Referenced here as the eventual owner of any future canonical entity-resolution concern; no model exists yet for CoachX's shared schema to depend on.                                            |
| 064 (API gateway/integration governance) | API gateway and integration/event governance                                             | Referenced here as the eventual owner of any future shared event/outbox infrastructure — directly relevant to why `OutboxEvent` was rejected above rather than duplicated in this shared schema. |

No new duplication was introduced by Phase 3's two models against any
of the above — neither `AuditEvent` nor `IdempotencyKey` overlaps a
capability owned by 001, 006, 022, 032, 063, 064, or 065.

## 4. Migration path once Feature 003 (Authentication) exists

When a real `User` (or equivalent) table exists, `AuditEvent.actorId`
and `IdempotencyKey`-adjacent actor references can be optionally
strengthened with a real foreign key **as an additive migration** —
this is explicitly out of scope for Phase 3 and must not be
anticipated by inventing a placeholder `User` model now.
