# Implementation Plan: Marketing Platform Architecture & System Overview

**Branch**: `015-marketing-architecture-system` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-marketing-architecture-system/spec.md`

## Summary

This feature builds the **architectural backbone** of the entire Marketing Automation Platform (Volume 14 Part 1): the 8-service backend boundary (Authentication, User, Campaign, Audience, Communication, Automation Engine, Analytics, AI), the event-driven spine (a 12-event catalog consumed by both the Analytics Service and Automation Engine), the multi-channel Notification Infrastructure with full delivery/open/click/retry tracking, the Internal and External Integration Layers, the platform's Security Architecture, its Scalability Strategy, and its Performance and Disaster Recovery targets. Unlike `014` (a pure governance artifact), this chapter is genuinely buildable infrastructure — but per its own Assumptions, it defines only the **architectural shape** of each service; the business rules of each (campaign fields, segment logic, automation branching, AI prompts) belong to that capability's own downstream feature spec (016–033).

This chapter is not cited by name anywhere in the constitution, but its own Assumptions explicitly tie two of its requirements to constitutional articles: the User Service's "marketing consent" field is the architectural home for the per-channel, versioned consent record whose actual definition lives in `002` and is re-checked before every automated send (Article VI); and the AI Service is platform-level plumbing consumed by `025` (AI Marketing Assistant) and governed at the model/prompt level by `008`, never redefining AI model routing itself (Article II).

Per spec.md's own Assumptions, this feature **defines the shape, not the business logic, of every downstream Volume 14 Part 1 feature**: the Automation Engine's trigger-detection/execution/retry architecture is built here, but its workflow-builder business rules belong to `022`; the Event Catalog's 12 event *types* are fixed here, but their payload schemas are versioned and owned by the features that emit/consume them (`018` Campaign, `019` Audience/CDP, `027` Analytics/Attribution, `028` Attribution/ROI); the User Service's Roles/Permissions field is an architectural placeholder for the full RBAC hierarchy `016` defines. It **reuses `001`'s layered RBAC** as the underlying permission engine the User Service's role/permission fields resolve against, and its audit-log pattern for the Security Architecture's audit-logging requirement (FR-025, FR-034).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–014, extended here to the marketing platform's own 8-service boundary.

**Primary Dependencies**: NestJS, Next.js, Flutter; an event bus/message broker for the platform event spine (FR-021, FR-022 — NEEDS CLARIFICATION: no specific technology named, payload schema/versioning not specified in source); a job scheduler and queue system for background processing, retries, and automation delays (FR-012, FR-027); CDN integration for marketing-asset delivery (FR-017, FR-018); load-balancing/auto-scaling infrastructure (FR-027).

**Storage**: PostgreSQL (primary database per FR-015, ACID-compliant, read replicas, automatic indexing — FR-016), object storage with CDN-fronted, versioned, compression-optimized delivery for marketing assets (FR-017, FR-018), distributed cache for stateless-service scaling (FR-027), multi-region backup storage for disaster recovery (FR-036).

**Testing**: Jest (backend — event-delivery-to-both-consumers, notification-delivery-tracking-completeness, and security-control contract tests are the highest-stakes tests here, matching this spec's own SC-006), Playwright (web e2e — admin portal dashboard load-time validation), load-testing tooling for the numeric performance targets (SC-001–SC-005) and scale validation (SC-007).

**Target Platform**: Web (Admin Portal) + mobile (Mobile Application); this feature is the shared backend every other Volume 14 Part 1/Part 2 feature is built on top of, not a standalone user-facing surface.

**Performance Goals**: API response under 300ms; login under 2s; dashboard load under 3s; notification dispatch under 5s; campaign publish under 10s; analytics refresh under 5s (FR-028–FR-033, SC-001–SC-005) — NEEDS CLARIFICATION: no percentile (p50/p95/p99), measurement window, or load-level definition given in source.

**Constraints**: Every platform event is stored for consumption by both the Analytics Service and the Automation Engine with zero silent event loss, and the architecture must accommodate new event types without redesigning existing consumers (FR-021, FR-022, SC-006); every notification dispatch records delivery status, open tracking, click tracking, retry outcome, failure reason, timestamp, and device information (FR-020); the architecture scales from thousands to millions of users without major redesign via horizontal scaling, load balancing, and stateless services (FR-026, FR-027, SC-007); automated failover restores service without manual intervention, validated by recovery testing at least quarterly (FR-036, SC-008); security controls (JWT, HTTPS, rate limiting, CSRF/XSS/SQL-injection prevention, audit logging, secure upload, device validation) protect every public endpoint (FR-025).

**Scale/Scope**: 8 backend services, 37 functional requirements (FR-001–FR-037), 6 user stories, 12 cataloged platform events, 11 internal integration points, 10 external integration points, and 5 NEEDS CLARIFICATION items in spec.md's Assumptions (event payload schema/versioning, performance-target measurement methodology, RTO/RPO values, rate-limit thresholds/burst-differentiation logic).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | All 8 services are backend-owned; API First Design and Zero Hardcoding principles keep business logic server-side | **PASS — direct implementation (not the constitution's named source for this article)** | FR-003, FR-006 |
| II. AI Is Assistive, Never Autonomous | AI Service is platform-level plumbing consumed by `025`, governed at the model/prompt level by `008` — no AI model routing or autonomous decision logic is defined here | **PASS (aligns; spec.md Assumptions ties this to Article II)** | FR-014, spec.md Assumptions |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is a backend/infrastructure architecture chapter with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Platform events are append-only, timestamped occurrences, never mutated after emission | **PASS (aligns; not the constitution's named source for this article)** | FR-021, Key Entities |
| V. Ledger-Based Internal Economies | N/A — no internal balance/economy defined in this architecture chapter | **PASS (N/A)** | — |
| VI. Consent Is First-Class | The User Service's marketing-consent field is the architectural home for `002`'s per-channel, versioned consent record, re-checked by the Communication Service before every automated send | **PASS (aligns; spec.md Assumptions ties this explicitly to Article VI)** | FR-008, spec.md Assumptions |
| VII. Layered, Explicit RBAC | The User Service's Roles/Permissions fields are architectural placeholders for `016`'s full RBAC hierarchy; the User Service is the system of record, not the role model itself | **PASS (feeds 016; extends 001)** | FR-008, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Not addressed in this architecture chapter — localization of actual user-facing content belongs to the features that own that content | **PASS (N/A for this feature)** | — |
| Security & Compliance Baseline | JWT authentication, HTTPS everywhere, password encryption, rate limiting, CSRF/XSS/SQL-injection prevention, audit logging, secure file upload, device validation | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-025 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/015-marketing-architecture-system/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: event-bus/message-broker technology choice, event payload schema/versioning strategy, performance-target measurement methodology (percentile/window/load-level), RTO/RPO numeric values for disaster recovery, and rate-limit thresholds/burst-differentiation logic for legitimate-automation vs. malicious traffic
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`014`'s structure — no new top-level projects; this feature establishes the `marketing-*` backend service boundary that features 016–033 build their business logic inside of.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── marketing-auth/           # Authentication Service (FR-007)
│   │   ├── marketing-user/           # User Service — profile/membership/roles/permissions/consent placeholder (FR-008)
│   │   ├── marketing-campaign-core/  # Campaign Service architectural shell (FR-009) — business rules owned by `018`
│   │   ├── marketing-audience-core/  # Audience Service architectural shell (FR-010) — business rules owned by `019`
│   │   ├── marketing-communication/  # Communication Service + Notification Infrastructure (FR-011, FR-019, FR-020)
│   │   ├── marketing-automation-core/ # Automation Engine architectural shell (trigger detection, execution, retry — FR-012) — workflow rules owned by `022`
│   │   ├── marketing-analytics-core/ # Analytics Service architectural shell (FR-013) — reporting logic owned by `027`/`028`
│   │   ├── marketing-ai-core/        # AI Service architectural shell (FR-014) — prompt/model logic owned by `008`/`025`
│   │   ├── marketing-event-bus/      # Platform Event catalog, publish/subscribe spine (FR-021, FR-022)
│   │   ├── marketing-integration/    # Internal + External Integration Layer, Webhooks (FR-023, FR-024)
│   │   ├── marketing-storage/        # Marketing Asset storage, CDN, versioning (FR-017, FR-018)
│   │   └── marketing-platform-ops/   # Logging/Monitoring, Disaster Recovery, Security Architecture cross-cutting services (FR-025, FR-034–FR-036)
│   └── common/                       # reused from 001: RbacGuard, audit-log interceptor
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── {dashboard-shell}/         # Admin Portal shell (FR-005) — screens populated by 016–033

mobile/
└── lib/features/
    └── marketing/                     # Mobile Application shell (FR-004) — screens populated by downstream features
```

**Structure Decision**: 12 new backend modules under `marketing-*`, establishing the service boundary every later Volume 14 Part 1/Part 2 feature builds inside. `marketing-event-bus` and `marketing-communication` are built and contract-tested first since they are the two capabilities every other Volume 14 feature depends on (per this chapter's own User Story 1/2 priority framing). No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
