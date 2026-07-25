# Implementation Plan: Product Vision, Business Foundation & Platform Governance

**Branch**: `001-product-vision-governance` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-product-vision-governance/spec.md`

## Summary

This feature establishes the platform's foundational data model and cross-cutting enforcement layer that every other TBT One feature builds on: the unified User Account, the Role/Permission catalog and its backend-enforced RBAC, the Membership Tier catalog and entitlement-gating mechanism, the 16-module platform registry, the 4-surface navigation shell (Public Website, Member Web App, Mobile App, Admin App), the 8-stage user lifecycle tracker, the 10-stream revenue/monetization catalog with anti-dark-pattern disclosure rules, the Business KPI instrumentation contract, the Content Governance lifecycle (Draft→Review→Scheduled→Published→Unpublished→Archived), a Trust & Safety reporting/moderation foundation, and the phase-gated release governance process.

It does **not** own the detailed implementation of: authentication/onboarding/dashboard UX mechanics (owned by `003-auth-identity-onboarding-dashboard`, which implements this feature's Module 01–03 references), LMS mechanics (`004`), community/moderation UI (`005`), gamification ledgers (`006`), mentor marketplace (`007`), AI tooling (`008`), billing/payments (`009`), or CRM (`013`). This plan treats those as external services this feature's RBAC/entitlement/lifecycle layer must expose stable contracts to, per the spec's Assumptions section.

Technical approach: a shared NestJS backend service exposing the User/Role/Membership/Lifecycle/Governance domain as the source of truth, consumed by a Next.js web application (serving both the public site and — via RBAC-gated routes — the authenticated member app and admin app as one deployable with three route groups) and a Flutter mobile application, all authorizing every request against the backend's RBAC engine rather than trusting client-rendered state.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — per source section 27's "recommended direction," treated as non-normative guidance the spec explicitly defers to this plan (see spec.md Assumptions).

**Primary Dependencies**: NestJS (backend API framework), Next.js 14+ with React (web — public site, member app, admin app as one deployable), Flutter 3.x (mobile app), Prisma or TypeORM (ORM, NEEDS CLARIFICATION: not chosen yet), BullMQ or equivalent (background job queue for KPI aggregation/notification fan-out, NEEDS CLARIFICATION: not chosen yet).

**Storage**: PostgreSQL (primary relational store — User, Role, Membership Tier, Lifecycle Stage, Content Item, Trust & Safety Case, Audit Log), Redis (session cache, rate limiting, RBAC-decision cache).

**Testing**: Jest (backend unit + integration tests, contract tests for RBAC/entitlement decisions), Playwright (web e2e across public/member/admin route groups), Flutter's built-in `test`/`integration_test` packages (mobile).

**Target Platform**: Linux containers (backend, web SSR), modern evergreen browsers (Chrome/Edge/Firefox/Safari per FR-103), Android + iOS (mobile).

**Project Type**: Multi-surface platform — one backend API, one web deployable (public + member + admin route groups), one mobile app. See Project Structure below (not a plain single-project nor a plain two-project web app — documented as a custom structure with rationale in Complexity Tracking).

**Performance Goals**: Member dashboard loads <3s under normal conditions (SC-002); payment-confirmed entitlement changes apply with no manual step and no specified-but-unbounded delay (SC-006, FR-075 — NEEDS CLARIFICATION on numeric ceiling per spec); RBAC/entitlement decision latency must not be the bottleneck behind either target.

**Constraints**: All authorization MUST be enforced backend-side regardless of frontend state (FR-087, Constitution Article I); mobile-first/low-bandwidth optimization required (FR-010); production data MUST NOT appear in non-production environments (FR-105); no destructive overwrite of published content versions (FR-099, Constitution Article IV); membership pricing/entitlement changes MUST NOT retroactively alter an already-active subscriber's granted terms (edge case, Constitution Article IV).

**Scale/Scope**: 16 platform modules, 4 access surfaces, 12 roles, 6 membership tiers, 8 lifecycle stages, 10 revenue streams, 7 KPI categories, 4 roadmap phases — architected for "thousands of simultaneous users" at Phase 1 per FR-101 (no numeric SLA stated in source; flagged `NEEDS CLARIFICATION` in spec.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Every entitlement/role/lifecycle-stage decision MUST be computed and enforced backend-side | **PASS** | FR-087, FR-088, FR-075; design MUST NOT allow client-only enforcement |
| II. AI Is Assistive, Never Autonomous | N/A for this feature — no AI decisioning owned here (Module 08 detail deferred to `008-ai-assistant-platform`) | **PASS (N/A)** | FR-030 references Module 08 only at catalog level |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Sponsored/affiliate content MUST carry visible disclosure; no fake urgency/hidden pricing | **PASS** | FR-062, FR-063, FR-018, FR-012 |
| IV. Historical Immutability | Published content changes MUST version, not overwrite; active-subscriber pricing MUST NOT retroactively change | **PASS** | FR-099; edge case in spec.md |
| V. Ledger-Based Internal Economies | Wallet/points/rewards balances referenced here (Module 12) MUST be ledger-based when implemented | **PASS (deferred)** | Detailed ledger owned by `006-gamification-rewards`/`009-membership-payments-revenue`; this feature must not introduce a mutable balance field of its own |
| VI. Consent Is First-Class | Lead/marketing consent captured at Lead stage; notification preferences per-channel | **PASS** | FR-040, FR-095, FR-037 |
| VII. Layered, Explicit RBAC | Role→Permission model with approval-chain-worthy admin roles | **PASS** | FR-084–FR-089 |
| VIII. No Pay-to-Win / No Vanity Metrics | Achiever milestones MUST be verified, not self-reported; KPIs track transformation not vanity metrics | **PASS** | FR-045, FR-068, edge case on unverified "first client" claim |
| IX. Action Before Consumption | Learning modules MUST require action, not passive viewing | **PASS (deferred)** | Enforced at LMS layer (`004`); this feature states the principle (FR-005) as a platform-wide constraint LMS design must satisfy |

No constitutional violations requiring Complexity Tracking justification for principle compliance. One structural deviation (admin app as a route group rather than a 4th deployable) is documented below as it affects project structure, not constitutional compliance.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-vision-governance/
├── plan.md              # This file
├── research.md          # Phase 0 output (if generated)
├── data-model.md         # Phase 1 output (if generated)
├── quickstart.md         # Phase 1 output (if generated)
├── contracts/             # Phase 1 output (if generated)
└── tasks.md               # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Multi-surface platform: shared backend API + web (public/member/admin route groups) + mobile

backend/
├── src/
│   ├── modules/
│   │   ├── identity/           # User Account aggregate root (owns account state, NOT auth mechanics — see 003)
│   │   ├── rbac/                # Role, Permission, Access Control Decision engine (FR-084–FR-089)
│   │   ├── membership/          # Membership Tier catalog + entitlement resolution (catalog only — billing owned by 009)
│   │   ├── lifecycle/           # User Lifecycle Stage tracker + milestone verification (FR-039–FR-046)
│   │   ├── monetization/        # Revenue Stream catalog + sponsored/affiliate disclosure enforcement (FR-054–FR-063)
│   │   ├── kpi/                  # Business KPI instrumentation/aggregation contracts (FR-064–FR-068)
│   │   ├── content-governance/  # Content Item lifecycle + versioning (FR-097–FR-099)
│   │   ├── trust-safety/        # Report/block/mute + moderation queue foundation (FR-090–FR-093)
│   │   └── platform-registry/   # 16-module + 4-surface registry, phase-gating (FR-020–FR-023, FR-078–FR-083)
│   ├── common/                  # Shared guards (RBAC guard, membership-entitlement guard), interceptors, audit-log interceptor
│   └── main.ts
└── tests/
    ├── contract/                # RBAC decision contract tests, entitlement contract tests
    ├── integration/
    └── unit/

web/
├── src/
│   ├── app/
│   │   ├── (public)/            # Public Website route group — unauthenticated (FR-020)
│   │   ├── (member)/            # Member Web App route group — authenticated, entitlement-gated (FR-021)
│   │   └── (admin)/             # Admin App route group — role-gated internal staff only (FR-023)
│   ├── components/
│   └── lib/
│       ├── rbac-client.ts        # Client-side UI-hint layer ONLY — never the authorization boundary (FR-087)
│       └── api-client.ts
└── tests/
    └── e2e/                      # Playwright, one suite per route group

mobile/
├── lib/
│   ├── features/                 # Mirrors member-app module set (FR-022)
│   └── core/
└── test/
```

**Structure Decision**: A multi-surface structure (`backend/` + `web/` + `mobile/`) rather than the template's plain single-project or plain two-project web-app options, because the spec requires four distinct access surfaces (FR-020–FR-023) but the source volume does not require the Admin App to be a separately deployable application — only that it be accessible "to internal roles only." Combining Public/Member/Admin into one Next.js deployable with three RBAC-gated route groups avoids standing up a fourth project for what is, functionally, a permission boundary rather than a deployment boundary; this is recorded as a deliberate simplicity choice (see Complexity Tracking).

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |

*Structural note (not a constitutional violation): combining the Admin App into the `web/` deployable as a third route group, rather than a fourth standalone project, was considered against "one project per surface." Rejected because the spec's own boundary for Admin App is a permission boundary (FR-023: "to internal roles only"), not a technical/deployment boundary — a fourth project would duplicate the Next.js build/deploy pipeline for no isolation benefit the RBAC guard doesn't already provide, at the cost of violating the simplicity principle implied by Constitution's governance section. If a future security review determines admin needs physical deployment isolation (e.g., separate network perimeter), this decision should be revisited — flagged here for that future re-evaluation rather than silently assumed permanent.*
