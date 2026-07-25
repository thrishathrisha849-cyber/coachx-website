# Implementation Plan: CRM, Sales Pipeline, Customer Success & Support Desk

**Branch**: `013-crm-sales-support` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-crm-sales-support/spec.md`

## Summary

This feature builds the platform's internal CRM and customer-operations backbone: multi-org/business-unit/field-level RBAC; multi-channel lead capture with mandatory duplicate detection; rule-based and AI-assisted lead scoring; contact/account 360-degree views; multi-pipeline opportunity management with Kanban stage enforcement, weighted forecasting, and deal-health/stall detection; quotation/contract/order lifecycle with approval chains; sales targets, forecasting, and territories; customer onboarding and customer-success health scoring/renewal automation; a full support desk (tickets, SLA policies with pause/escalation, live chat with mandatory chatbot-to-human handover, knowledge base with gap detection); a no-code workflow-automation engine; and the reporting/integration/administration layer tying every other TBT One module's customer-facing events into one operational picture.

This feature is the constitution's **most-cited feature across four separate citation points**: **Article II (AI Is Assistive, Never Autonomous)** — "Vol 13: AI must not invent commitments/pricing/close tickets" (FR-030, FR-128, FR-132); **Article VI (Consent Is First-Class)** — "Vol 13: consent_status, proof of consent, legal basis tracking" (FR-181, FR-182); **Article VII (Layered, Explicit RBAC)** — "Vol 13: field-level RBAC" (FR-001–FR-003); and the **Security & Compliance Baseline** — "Vol 13: consent/legal basis" (FR-181–FR-185). No other feature planned so far is cited at this many distinct points.

Per spec.md's own Assumptions, this feature **defers, never duplicates**: the underlying AI model routing, prompt architecture, and provider integration to `008` (this spec defines only the CRM/Support-specific AI use cases, outputs, and guardrails — ticket summarization, next-best-action, lead scoring explanations); final accounting/invoicing/payment/tax system-of-record status to `009` (CRM payment tracking is explicitly a reference/workflow view only, per the source's own "CRM must not become the final accounting source" constraint); and the internal data models of every module it *consumes* events from — `004` (LMS enrolment/completion), `005` (Community engagement, privacy-gated), `007` (mentor bookings/feedback), `010` (event registration/attendance), `011` (marketplace orders/disputes), and `012` (Jobs employer leads/postings) — this spec assumes those modules emit the referenced events and only defines how the CRM consumes and correlates them into customer health/profile data. It **reuses `001`'s layered RBAC** as the base for its field-level access-control extension (the constitution-cited capability), and its audit-log pattern for the full business-data-change and security-event audit trail (FR-179). It builds its **own** independent state machines for Lead, Opportunity, Quote, Contract, Ticket, Renewal, Workflow Run, and Approval Request — none reused from a prior feature, since CRM/support-desk semantics are domain-specific here.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–012.

**Primary Dependencies**: NestJS, Next.js, Flutter; AI-assisted lead scoring/next-best-action/ticket-summarization consuming `008`'s shared AI gateway rather than a parallel stack (FR-026–FR-030, FR-128–FR-133); a live-chat/chatbot real-time transport with sentiment detection and intent recognition (FR-118–FR-127 — NEEDS CLARIFICATION: no vendor/technique named, consistent with prior features' AI-provider gaps); a no-code workflow-automation engine (trigger/condition/action/delay/branch/approval) with a job scheduler for delayed and recurring actions (FR-151–FR-160); calendar/email/telephony/WhatsApp integration adapters (FR-189–FR-191).

**Storage**: PostgreSQL (~40 entities per spec.md's Key Entities — org/RBAC, lead/scoring, contact/account, opportunity/pipeline/quote/contract, activity, customer-success/health/renewal, ticket/SLA/chat/knowledge, workflow/approval/notification domains), Redis (SLA-timer computation, real-time chat/queue state, round-robin assignment locks, workflow-delay scheduling), object storage with access-controlled/watermarked URLs for exports and attachments.

**Testing**: Jest (backend — duplicate-lead-detection-before-creation, AI-never-auto-disqualifies-or-auto-commits, and cross-organization-isolation contract tests are the highest-stakes tests in this feature, matching this spec's own SC-001, SC-002, and SC-008), Playwright (web e2e — lead capture, Kanban pipeline, ticket console, live chat), Flutter test (mobile — ticket reply, live chat, notifications).

**Target Platform**: Web + mobile; this module also functions as a backend-consumed event sink for every other feature's customer-facing activity.

**Performance Goals**: SLA timers evaluate business-hours/holiday pause rules correctly at scale; the system is architected for millions of contacts/activities, large ticket volumes, multiple organizations, high chat concurrency, and high automation throughput (FR-200); background job processing handles bulk import/export, notification delivery, workflow execution, SLA monitoring, report generation, search indexing, and webhook delivery without blocking user-facing flows (FR-201).

**Constraints**: Duplicate detection MUST run before creating any new lead, comparing email/phone/WhatsApp/company/website-domain/tax-number/external-ID (FR-015, FR-022, SC-001); AI-driven lead-disqualification and AI-drafted customer commitments/pricing/binding terms/critical-ticket-closure are never autonomous — every such action routes through configurable human review (FR-030, FR-132, SC-002, Constitution Article II); Kanban stage moves recalculate weighted value, write an audit record, and block on unmet mandatory fields before completing (FR-043, SC-003); SLA pre-breach warnings and post-breach escalation fire on their exact configured timeline, respecting business-hours/holiday pause rules (FR-116, SC-005); cross-organization data exposure is architecturally prevented under every access path — UI, API, export, search (FR-005, SC-008); sensitive fields (contract value, discount %, payment info, internal notes, escalation comments, masked PII) are hidden/masked/excluded from view and export for roles without field-level permission (FR-003, FR-183, SC-009); chatbot-to-human handover is mandatory and transfers full conversation context on explicit request, negative sentiment, payment/security issue, low confidence, or exceeded limits — zero conversations stuck in bot-only mode past a trigger (FR-127, SC-010); renewal reminders fire automatically at 120/90/60/30 days with no manual trigger required (FR-090, SC-007); invalid status transitions (closed ticket to New, lost opportunity to Won without reopening, expired quote accepted without revision, deactivated user receiving assignments, published article deleted without permission) are always blocked (FR-180).

**Scale/Scope**: ~40 data entities, 210 functional requirements (FR-001–FR-210, the largest FR count of any feature planned so far, including 5 NEEDS CLARIFICATION items FR-206–FR-210), 9 user stories, and integration touchpoints with 7 other features (004, 005, 007, 009, 010, 011, 012).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | SLA timers, lead-scoring, assignment engines, and workflow automation are entirely server-side; no client-asserted state | **PASS — direct implementation (not the constitution's named source for this article)** | FR-025, FR-114 |
| II. AI Is Assistive, Never Autonomous | **Constitution-cited source** ("Vol 13: AI must not invent commitments/pricing/close tickets") — AI never auto-disqualifies a lead, never invents customer commitments/pricing/binding terms, never closes critical tickets without review | **PASS — cited source** | FR-030, FR-128, FR-132, SC-002 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this feature's own surfaces — no customer-facing sales/marketing claim requirement is described in this internal-operations volume | **PASS (N/A)** | — |
| IV. Historical Immutability | Quote revisions preserve the previous version and mark it superseded; forecast overrides store the previous value, reason, user, and timestamp; commission/price snapshots on won opportunities | **PASS (aligns; not the constitution's named source for this article)** | FR-063, FR-072 |
| V. Ledger-Based Internal Economies | N/A — CRM payment tracking is explicitly a reference/workflow view only; `009` remains the system of record | **PASS (N/A / deferred)** | spec.md Assumptions, FR-193 |
| VI. Consent Is First-Class | **Constitution-cited source** ("Vol 13: consent_status, proof of consent, legal basis tracking") — full consent management, per-channel consent records, legal-basis tracking, data-subject request support | **PASS — cited source** | FR-181, FR-182 |
| VII. Layered, Explicit RBAC With Approval Chains | **Constitution-cited source** ("Vol 13: field-level RBAC") — access levels beyond record-level (No Access…Administer), field-level restrictions on sensitive data, extends `001`'s RBAC | **PASS — cited source (extends 001)** | FR-001–FR-003 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A — internal sales-operations tooling, no rank/reputation-purchase mechanic | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A — this is an internal operations feature, not a learning or growth-mechanic module | **PASS (N/A)** | — |
| Localization & Language Requirements | Interface, emails, notifications, forms, knowledge articles, and chatbot responses localized in English, Tamil, and Tanglish-friendly content | **PASS (aligns; not the constitution's named source for this article)** | FR-196 |
| Security & Compliance Baseline | **Constitution-cited source** ("Vol 13: consent/legal basis") — encryption in transit/at rest, session security, MFA support, sensitive-field masking with logged reveal | **PASS — cited source** | FR-181–FR-185 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/013-crm-sales-support/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: AI confidence-threshold defaults and fallback-when-AI-unavailable behavior, maximum export record limit, record-restoration recovery-period length, the full enumerated SLA-pause status/condition list, and the chatbot handover message-count/elapsed-time limit
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`012`'s structure — no new top-level projects; AI features call `008`'s gateway, payment/invoice data reads from `009`, and this module consumes events from `004`/`005`/`007`/`010`/`011`/`012`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── crm-org-rbac/         # Organization, Business Unit, Department/Team, Role/Permission/field-level RBAC, working hours/holidays (FR-001–FR-012)
│   │   ├── crm-lead/             # Lead, Lead Source, Lead Score, Lead Assignment, duplicate detection/merge, conversion (FR-013–FR-030)
│   │   ├── crm-contact-account/  # Contact, Account, Account Relationship, 360-degree view, timeline (FR-031–FR-037)
│   │   ├── crm-opportunity/      # Opportunity, Pipeline/Pipeline Stage, Opportunity Product, Kanban, deal health, forecasting inputs (FR-038–FR-050)
│   │   ├── crm-sales-activity/   # Activity (Task/Call/Meeting/Note), Email, Product/Price Book, Quote, Sales Order, Contract, Payment view (FR-051–FR-069)
│   │   ├── crm-targets-territory/ # Sales Target, Forecast, Territory (FR-070–FR-073)
│   │   ├── crm-data-platform/    # Customer Segment, Tag, Custom Field/Layout, Saved View, Global Search (FR-074–FR-079)
│   │   ├── crm-onboarding/       # Onboarding Template/Project/Task, onboarding portal (FR-080–FR-082)
│   │   ├── crm-customer-success/ # Customer Health Score, Success Plan, Customer Risk, Renewal, upsell/cross-sell, Business Review (FR-083–FR-092)
│   │   ├── crm-support-ticket/   # Ticket/Category/Message/Note, Support Queue, assignment, merge/split, Incident/Problem (FR-093–FR-113)
│   │   ├── crm-sla/              # SLA Policy/Event, Escalation (FR-114–FR-117)
│   │   ├── crm-live-chat/        # Chat Session/Message/Agent, Chatbot Session, handover (FR-118–FR-127)
│   │   ├── crm-ai-guardrails/    # CRM/Support-specific AI use-case wrapper over `008`'s gateway (FR-128–FR-133)
│   │   ├── crm-knowledge-base/   # Knowledge Category/Article/Version/Feedback, gap detection (FR-134–FR-140)
│   │   ├── crm-portal-feedback/  # Customer Portal, Feedback/Survey/Response, NPS/CSAT/CES, Feature Request (FR-141–FR-150)
│   │   ├── crm-workflow/         # Workflow Definition/Version/Run/Step, Approval Definition/Request/Action, Notification Template/Event (FR-151–FR-160)
│   │   ├── crm-reporting/        # analytics, dashboards, custom reports, scheduled delivery (FR-161–FR-170)
│   │   ├── crm-data-ops/         # import/export, retention, soft-delete/restore, audit log (FR-171–FR-180)
│   │   ├── crm-privacy/          # Consent Record, sensitive-field masking/reveal, encryption/session security (FR-181–FR-185)
│   │   └── crm-integration/      # API groups, Webhook/Webhook Delivery, email/telephony/WhatsApp/website/mobile/module integrations, Finance reference (FR-186–FR-193)
│   └── common/                   # reused from 001: RbacGuard (extended for field-level), audit-log interceptor; reused from 008: AI gateway; reused from 009: payment reference read
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (crm)/
        └── {leads,contacts,accounts,opportunities,pipeline,quotes,contracts,targets,forecast,onboarding,customer-success,renewals}/
    └── (support)/
        └── {tickets,chat,knowledge-base,incidents}/
    └── (customer-portal)/
        └── {profile,tickets,knowledge-base,invoices,feedback}/
    └── (crm-admin)/
        └── {users,teams,roles,pipelines,sla-policies,workflows,reports,audit-logs,integrations,settings}/

mobile/
└── lib/features/
    └── crm/                       # lead/ticket/opportunity views, live chat, notifications
```

**Structure Decision**: 19 new backend modules under `crm-*`, mirroring spec.md's own FR groupings. `crm-org-rbac` (field-level access control) and `crm-lead` (duplicate-detection integrity) are built and contract-tested first since nearly every other module depends on their correctness. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
