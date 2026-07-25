# Implementation Plan: Landing Pages, Forms & Lead Capture

**Branch**: `023-landing-pages-lead-capture` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-landing-pages-lead-capture/spec.md`

## Summary

This feature builds the platform's primary lead-acquisition engine: a no-code drag-and-drop landing page builder with brand-kit inheritance, 4 template categories, 17 component types, and dynamic visitor-attribute personalization; a form builder with 17 field types, AND/OR/NOT conditional logic, multi-step auto-save/resume, and real-time validation; a lead-capture pipeline that creates a fully attributed lead record and syncs it to the CDP/CRM within seconds; gated lead magnets; A/B testing with automatic winner promotion; an AI Landing Page Assistant with mandatory human review; SEO tooling with a live-updating score; full acquisition-funnel tracking (8 stages); and security/performance controls.

This chapter is not cited by name in the constitution, but spec.md's own Assumptions explicitly apply two constitutional principles the chapter's source text never restates: the Countdown Timer component and any urgency-oriented page element are "subject to the platform-wide constitutional prohibition on fabricated scarcity/urgency" (Article III), and personalization/analytics tracking assumes the platform's shared identity/consent system enforces visitor consent per the constitution's per-channel, versioned consent principle (Article VI) — both inherited constraints, not chapter-stated ones.

Per spec.md's own Assumptions, this feature **owns lead creation through the "Lead Created" funnel stage and nothing past it**: everything after capture — scoring, qualification into "Qualified Lead," routing, nurture assignment — is explicitly out of scope and owned by `024`, with this chapter's Lead entity as the exact hand-off point; real-time lead sync assumes `019` (CDP) and `013` (CRM) already expose write-capable APIs, without this chapter redefining their data models; the AI Landing Page Assistant is a specialized surface of `025`'s shared AI Marketing Assistant infrastructure (including its human-review guardrail), not a separately built AI stack; deeper A/B-test statistical methodology belongs to `026`, and cross-channel attribution modeling to `028` — this chapter covers only page/form-level experimentation triggers, winner auto-promotion, and campaign-level attribution capture at the point of lead creation.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–022.

**Primary Dependencies**: NestJS, Next.js; a visual page-builder canvas library (FR-001, no vendor named); server-side form-rendering and real-time validation; CAPTCHA/reCAPTCHA integration (FR-039); AI Landing Page Assistant consuming `025`'s (and transitively `008`'s) AI infrastructure (FR-030); a job/sync pipeline writing to `019` (CDP) and `013` (CRM) within seconds of submission (FR-028).

**Storage**: PostgreSQL (~13 entities per spec.md's Key Entities — Landing Page/Page Template/Page Component, Brand Kit, Form/Form Field/Conditional Rule, Submission, Lead, UTM/Acquisition Metadata, Lead Magnet, A/B Test/Experiment, Funnel Stage Event, SEO Metadata domains), with UTM/Acquisition Metadata captured immutably at lead-creation time (FR-024, SC-005) and Submission records supporting partial/resumable multi-step state (FR-019).

**Testing**: Jest (backend — lead-created-and-synced-within-seconds, attribution-never-overwritten, and gated-asset-access-denied-until-submission contract tests are the highest-stakes tests here, matching this spec's own SC-003, SC-005, and User Story 4), Playwright (web e2e — page builder, multi-step form resume, A/B test variant serving).

**Target Platform**: Web (Admin Portal builder, rendered inside `017`'s workspace shell, plus publicly reachable published pages); this is the acquisition front door feeding `024`'s lead-scoring pipeline.

**Performance Goals**: Landing page load under 2s; form rendering under 1s; form submission processing under 2s; lead creation under 3s; analytics update within 30s; AI suggestions within 5s (FR-043, SC-002).

**Constraints**: A non-technical marketer builds and publishes a responsive landing page with zero custom HTML/CSS written (FR-001, SC-001); every completed form submission creates a lead record with the full required field set, synchronized to both the CDP and CRM within seconds (FR-022, FR-023, FR-028, SC-003); a lead's original acquisition source and UTM attribution are never overwritten by later visitor interactions (FR-024, SC-005); a gated lead magnet denies access until the required form is completed (User Story 4); a running A/B test automatically promotes the winning variant as the default page with no manual publishing step (FR-033, SC-006); AI-generated recommendations remain editable and are never published automatically without marketer review (FR-031); multi-step forms auto-save at each step and resume from the last completed step rather than restarting (FR-019, SC-004); every landing page exposes a live-updating SEO score and complete metadata before publish (FR-034, FR-035, SC-007).

**Scale/Scope**: ~13 data entities, 43 functional requirements (FR-001–FR-043), 7 user stories, 4 template categories, 17 page-component types, 17 form-field types, 13 lead-source types, 10 lead-magnet asset types, and an 8-stage acquisition funnel, plus 4 NEEDS CLARIFICATION items in spec.md's Edge Cases (cross-device form-resume identity linking, duplicate-submission dedupe rule, incomplete-form partial-lead capture, and data-retention/purge policy for submission/lead PII).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Form validation, conditional-logic evaluation, lead creation, and A/B-test winner determination are all server-side | **PASS — direct implementation (not the constitution's named source for this article)** | FR-016, FR-020, FR-022 |
| II. AI Is Assistive, Never Autonomous | AI-generated headline/CTA/SEO/image suggestions remain editable and are never published automatically without marketer review; the builder remains fully usable manually if the AI service fails | **PASS (aligns; extends 025/008, not the constitution's named source for this article)** | FR-030, FR-031 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | **Spec.md's own Assumptions explicitly apply this article to the Countdown Timer component and any urgency-oriented page element**, even though the chapter's source text never restates the rule | **PASS (aligns; spec.md explicitly inherits this article despite chapter silence)** | FR-009, spec.md Assumptions |
| IV. Historical Immutability | UTM/acquisition metadata is captured immutably at lead-creation time and never altered by later visitor interactions | **PASS (aligns; not the constitution's named source for this article)** | FR-024, SC-005 |
| V. Ledger-Based Internal Economies | N/A — this feature creates leads, it does not manage points/wallet/reward balances | **PASS (N/A)** | — |
| VI. Consent Is First-Class | **Spec.md's own Assumptions state that personalization/analytics tracking assumes the platform's shared identity/consent system enforces this article's per-channel, versioned consent principle**, rather than this module implementing consent independently | **PASS (aligns; deferred to platform-wide consent system per spec.md Assumptions)** | FR-011, FR-036, spec.md Assumptions |
| VII. Layered, Explicit RBAC | Page/form create/edit/publish/delete actions enforce the layered RBAC model defined at the platform level | **PASS (extends 001/016)** | FR-038 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Dynamic content personalization includes preferred language as a first-class visitor attribute | **PASS (aligns; not the constitution's named source for this article)** | FR-011 |
| Security & Compliance Baseline | CAPTCHA/reCAPTCHA, CSRF protection, rate limiting, server-side input validation, file-upload scanning, audit logging, HTTPS enforcement, encryption in transit/at rest | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-039–FR-042 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/023-landing-pages-lead-capture/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: cross-device form-resume identity-linking behavior, duplicate-submission dedupe key/rule, incomplete-form partial-lead capture behavior, and the data-retention/purge policy for submission/lead PII
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`022`'s structure — no new top-level projects; this feature hands leads off to `024`, syncs to `019`/`013`, and consumes `025`'s AI infrastructure and `026`'s A/B-test methodology.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── landing-page-builder/   # Landing Page, Page Template, Page Component, Brand Kit (FR-001–FR-011)
│   │   ├── form-builder/           # Form, Form Field, Conditional Rule, multi-step logic (FR-012–FR-021)
│   │   ├── lead-capture/           # Submission, Lead, UTM/Acquisition Metadata, funnel tracking (FR-022–FR-027)
│   │   ├── lead-magnet/            # Lead Magnet, gated-access enforcement (FR-025)
│   │   ├── lead-sync/              # CDP/CRM sync, integration framework (FR-028–FR-029)
│   │   ├── landing-ai-assistant/   # AI Landing Page Assistant, human-review gate (FR-030–FR-031)
│   │   ├── landing-ab-testing/     # A/B Test/Experiment, winner auto-promotion (FR-032–FR-033)
│   │   ├── landing-seo/            # SEO Metadata, live SEO score (FR-034–FR-035)
│   │   └── landing-analytics/      # Funnel Stage Event, analytics dashboard (FR-036–FR-037)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 019/013: CDP/CRM sync targets; reused from 025/008: AI infrastructure; reused from 026: A/B methodology
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── landing-pages/{page.tsx, builder/[pageId], forms, ab-tests, analytics}/
    └── (public)/
        └── lp/[pageSlug]/page.tsx
```

**Structure Decision**: 8 new backend modules under `landing-*`/`lead-*`/`form-*`, each mapping to one of spec.md's FR groupings. `lead-capture` (attribution integrity) and `lead-sync` (CDP/CRM propagation speed) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
