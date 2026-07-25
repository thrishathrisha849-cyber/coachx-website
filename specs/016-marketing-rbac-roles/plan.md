# Implementation Plan: Marketing Platform User Roles, Permissions & Access Control

**Branch**: `016-marketing-rbac-roles` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-marketing-rbac-roles/spec.md`

## Summary

This feature builds the Marketing Automation Platform's module-specific RBAC layer: a 7-level authorization hierarchy (Organization → Department → Role → Permission Group → Permission → Resource → Action); 10 standard marketing roles with explicit permitted/restricted capability sets; 7 permission categories and a resource-level permission matrix; an escalating approval chain (Team Lead → Marketing Manager → Organization Admin → Super Admin) gating high-blast-radius actions; time-bound temporary access with automatic revocation; delegated access with discrete permission subsets and its own audit trail; privileged-session authentication/security controls; and an immutable, searchable audit log.

This feature is **directly named in the constitution's citation for Article VII** ("Vol 14 Part 1 Ch 3: 10 standard roles, escalating approval chain") — alongside `003`, `009`, and `013` — making it, together with `013`, one of two features that concretely implement Article VII's mandate for "sensitive or high-blast-radius actions" to "require a defined multi-step approval chain, not a single permission bit." Its approval-chain mechanism (FR-025, FR-026) is the chapter's most safety-critical capability, per the spec's own User Story 1 rationale.

Per spec.md's own Assumptions, this feature is a **module-specific role layer, not a replacement for the platform-wide identity/role model**: a single user's platform identity (owned by `003`) holds zero or more module-specific role assignments such as these 10 marketing roles, consistent with Article VII's hierarchy applying per-module. It explicitly does **not** redefine `003`'s core roles (Guest, Free member, Paid member, Mentor, Instructor, Moderator, Support agent, Content manager, Finance admin, Organization admin, Platform admin, Super admin) — the marketing roles here are layered on top. The relationship between this module's lighter-weight "Sales Executive"/"Customer Support" roles and `013`'s fuller CRM role model of similar name is explicitly flagged NEEDS CLARIFICATION in spec.md rather than assumed identical. It **reuses `001`'s underlying RBAC engine architecture** (the same Organization→Department→Role→Permission-Group→Permission pattern `001` established platform-wide) as the mechanism this module-specific role catalog is expressed through, rather than building a parallel authorization engine.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–015.

**Primary Dependencies**: NestJS, Next.js; extends `001`'s RBAC engine and `015`'s User Service (which holds the Roles/Permissions placeholder fields this feature populates) rather than introducing a new authorization framework; MFA mechanism reused from whatever `003` defines platform-wide for privileged roles (FR-035 — no new MFA implementation here).

**Storage**: PostgreSQL (Role, Permission Group, Permission, Resource-Action matrix, Approval Chain/Request, Temporary Access Grant, Delegated Access Grant, Session, Audit Log Entry per spec.md's Key Entities), reusing `001`'s audit-log table pattern extended with this chapter's required 12-field audit record (FR-042).

**Testing**: Jest (backend — approval-chain-blocks-execution-until-complete, expired-grant-auto-revocation, and External-Agency-sensitive-data-denial contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002, and SC-003), Playwright (web e2e — role-restricted UI behavior across all 10 roles).

**Target Platform**: Web (Admin Portal); this is a permission-enforcement layer consumed by every Volume 14 Part 1/Part 2 feature's UI and API, not a standalone user-facing surface beyond role/approval/delegation administration screens.

**Performance Goals**: A role or permission change takes effect on the affected user's very next request without requiring re-login (SC-006); permission validation runs on every action at the API layer, not only in the UI (FR-045).

**Constraints**: Every high-blast-radius action (bulk email/SMS/WhatsApp broadcast, campaign publish, audience deletion, template deletion, API key modification, system configuration change) is blocked from executing until every required approval-chain step has recorded approval (FR-025, FR-026, SC-001); expired temporary/delegated access grants are auto-revoked with no residual access and no required manual admin action (FR-028, SC-002); External Agency accounts have zero access to customer data, analytics export, or financial information regardless of screen/API path (FR-015, SC-003); every privileged action produces an immutable, 12-field audit record (FR-041, FR-042, SC-004); unauthorized attempts return HTTP 403, are logged, and never disclose information that would help probe the permission structure (FR-050); default-deny applies to any request not matching an explicit permission grant (FR-044).

**Scale/Scope**: 51 functional requirements (FR-001–FR-051), 6 user stories, 10 standard roles, 7 permission categories, 6 resource types, and 3 NEEDS CLARIFICATION items in spec.md's Assumptions/Edge Cases (Super Admin peer-restriction ambiguity, marketing-vs-CRM Sales Executive/Customer Support role relationship, and several unspecified numeric thresholds — revocation latency, repeated-violation count, idle timeout, concurrent-session limit).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Permission validation runs at the API layer on every action, never only in the UI; secure token verification on every authenticated request | **PASS — direct implementation (not the constitution's named source for this article)** | FR-045, FR-046 |
| II. AI Is Assistive, Never Autonomous | Content Creator's AI-assisted content generation remains subject to the role's no-direct-publish restriction — AI output still requires human/role-gated approval before going live | **PASS (aligns; spec.md Assumptions ties this to Article II)** | FR-010, FR-022, spec.md Assumptions |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is an internal access-control chapter with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Audit records are immutable once written; approval-chain decisions and delegation grants are never silently altered after the fact | **PASS (aligns; not the constitution's named source for this article)** | FR-041, FR-033 |
| V. Ledger-Based Internal Economies | N/A | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A for this chapter's own surface | **PASS (N/A)** | — |
| VII. Layered, Explicit RBAC With Approval Chains | **Constitution-cited source** ("Vol 14 Part 1 Ch 3: 10 standard roles, escalating approval chain") — the 7-level hierarchy, 10 standard roles, and Team Lead→Marketing Manager→Org Admin→Super Admin approval chain are this article's concrete implementation for the marketing module | **PASS — cited source** | FR-001, FR-006–FR-015, FR-025, FR-026 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Not addressed in this chapter | **PASS (N/A for this feature)** | — |
| Security & Compliance Baseline | MFA required for privileged users; encryption at rest/in transit for RBAC-governed data; password hashing for stored credentials | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-035, FR-047, FR-048 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/016-marketing-rbac-roles/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: whether marketing-module "Sales Executive"/"Customer Support" roles are the same underlying role as `013`'s CRM roles or separately configured, the Super Admin peer-restriction question, expiry-revocation latency target, repeated-violation notification threshold, session idle-timeout duration, and concurrent-session limit count
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`'s RBAC engine and `015`'s User Service — no new authorization framework; this feature populates the Roles/Permissions fields `015` established as architectural placeholders.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── marketing-rbac-hierarchy/  # Organization/Department/Role/Permission-Group/Permission/Resource/Action model, custom role creation (FR-001–FR-005)
│   │   ├── marketing-rbac-roles/      # 10 standard role definitions and their permitted/restricted capability sets (FR-006–FR-015)
│   │   ├── marketing-rbac-permissions/ # 7 permission categories + resource-level permission matrix (FR-016–FR-024)
│   │   ├── marketing-rbac-approval/   # Approval Chain/Request, escalation routing (FR-025, FR-026)
│   │   ├── marketing-rbac-temporary/  # Temporary Access Grant, auto-revocation (FR-027, FR-028)
│   │   ├── marketing-rbac-delegation/ # Delegated Access Grant, delegation audit trail (FR-029–FR-033)
│   │   ├── marketing-rbac-session/    # privileged-session auth/MFA/device/timeout/revocation (FR-034–FR-040)
│   │   └── marketing-rbac-audit/      # immutable Audit Log Entry, search/export, 403 handling (FR-041–FR-051)
│   └── common/                        # reused from 001: RbacGuard, audit-log interceptor; reused from 003: MFA mechanism, core identity
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── {roles,approvals,temporary-access,delegations,audit-log,security-settings}/
```

**Structure Decision**: 8 new backend modules under `marketing-rbac-*`, each mapping to one of spec.md's FR groupings. `marketing-rbac-approval` is built and contract-tested first given its constitution-cited, safety-critical role. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
