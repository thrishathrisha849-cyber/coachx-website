# Implementation Plan: Public Website, Marketing Funnel & Conversion System

**Branch**: `002-public-website-marketing-funnel` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-public-website-marketing-funnel/spec.md`

## Summary

This feature builds the entire unauthenticated-reachable surface of TBT One: the public website's pages and global components (nav, footer, search, cookie consent), the admin CMS/page-builder that drives them, the seven documented conversion funnels (Free Resource, Webinar, Assessment, Membership, Course, Event, Mentor), the checkout UI/state-tracking layer, personalization/localization, A/B testing, SEO, campaign attribution, and the anti-dark-pattern rules governing all of it.

It builds on **Feature 001**'s foundation directly: it reuses 001's `web/src/app/(public)/` route group scaffold (rather than re-creating it), 001's `RbacGuard`/session model for the logged-in-vs-guest header states, and — as of 001's traceability-review correction (see `001/tasks.md` T015–T016, T021) — 001's now-implemented `backend/src/modules/content-governance/` module (`Content Item` entity, the Draft→Review→Scheduled→Published→Unpublished→Archived lifecycle service, and the non-destructive `Content Version` preservation service). This feature's own CMS `Page` entity is a **distinct entity** from `Content Item` (a `Page` is one specific kind of publishable content, scoped to this feature's URL/SEO/audience-targeting concerns) that reuses 001's lifecycle-state-machine *pattern* and version-preservation *service* rather than being the same row — see `tasks.md` T039/T041 (was T039/T040 pre-correction) for exactly what's implemented locally vs. delegated to 001. It does **not** own: authentication mechanics (003), LMS/course-authoring detail (004), community moderation (005), mentor booking (007), payment-gateway integration/tax/coupon computation (009), CRM lead routing (013), or A/B-testing statistical methodology (Volume 14 Part 1 Ch9/13 features 025/026) — this feature owns only the public-facing UI, funnel tracking, and the rules stated in this volume, per spec.md's Assumptions.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — same stack decision as `001-product-vision-governance`.

**Primary Dependencies**: Next.js 14+ (App Router, server components for SEO-critical pages), NestJS (backend, extends the shared API from 001), a CMS content-block renderer (custom, per FR-085's block-type list), an analytics-event pipeline (NEEDS CLARIFICATION: specific provider not named in source — e.g., self-hosted vs. Segment-style CDP), an email-delivery provider (NEEDS CLARIFICATION: not named in source, consistent with Volume 01's provider-abstraction principle), a CDN/image-optimization service.

**Storage**: PostgreSQL (Page, Content Block, Lead, Campaign, Consent Record, Checkout Session/Abandoned Checkout, Experiment, Redirect, SEO Metadata — all owned here), Redis (announcement-bar dismissal state, A/B-test variant-assignment cache, rate-limiting for public forms).

**Testing**: Jest (backend unit/contract — lead capture, consent, checkout-state, experiment-assignment), Playwright (web e2e — funnel walkthroughs, responsive breakpoints, accessibility checks), visual-regression tooling for CMS-published pages (NEEDS CLARIFICATION: not specified in source).

**Target Platform**: Server-rendered web (Next.js SSR/ISR for SEO-critical public pages), same browser/device matrix as `001` (FR-078, FR-103 of this spec).

**Project Type**: Extends `001`'s multi-surface structure — this feature lives almost entirely in the existing `web/` deployable's `(public)` route group, plus new `backend/src/modules/{cms,funnel,checkout-tracking,consent,experiments,seo,analytics}/`.

**Performance Goals**: Hero content visible quickly, stable layout (no CLS), immediate button response, lazy-loaded below-the-fold content, per-page-template performance budget (FR-106, FR-107 — NEEDS CLARIFICATION: no numeric budget stated in source, must be defined in research.md before Phase 1 design).

**Constraints**: Marketing/analytics/personalization scripts MUST NOT load before cookie consent is given (FR-106, Constitution Article VI); payment-success MUST NOT grant access client-side (FR-070, edge case, Constitution Article I — actual entitlement grant delegated to 009's server-authoritative webhook flow, this feature only reflects state); zero fabricated trust metrics/countdowns (FR-014, FR-111, FR-112, Constitution Article III).

**Scale/Scope**: 7 funnel types, ~30 distinct public page templates, 20 CMS block types, 12 analytics event types (non-exhaustive per FR-095), 3 initial languages (Tamil/Tanglish/English).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Payment success page MUST NOT itself grant access | **PASS** | FR-070, edge case; actual grant is 009's webhook-confirmed flow — this feature only renders state |
| II. AI Is Assistive, Never Autonomous | AI Tools Preview routes to demo/signup, not autonomous action | **PASS (N/A)** | FR-022; detailed AI behavior owned by 008 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | No fabricated metrics/countdowns; verified-disclaimer on outcome claims | **PASS** | FR-014, FR-058, FR-111–FR-113 — directly implements this article |
| IV. Historical Immutability | Page versions retained, not overwritten; expired offers hidden not deleted-silently | **PASS** | FR-088 |
| V. Ledger-Based Internal Economies | N/A — no balance/ledger owned by this feature | **PASS (N/A)** | Coupon/commission computation deferred to 009 |
| VI. Consent Is First-Class, Per-Channel, Versioned | Per-channel consent (7 types), never a combined opt-in flag; scripts gated on consent | **PASS** | FR-101, FR-102, FR-106 — directly implements this article |
| VII. Layered, Explicit RBAC | CMS publish workflow uses role-gated states (Draft→Review→Approved) | **PASS** | FR-087; enforcement delegated to 001's RBAC engine |
| VIII. No Pay-to-Win / No Vanity Metrics | Success-story/testimonial claims require verification status, not raw counts | **PASS** | FR-025, FR-048, FR-113 |
| IX. Action Before Consumption | N/A — this feature is pre-authentication marketing surface, not a learning module | **PASS (N/A)** | — |

No constitutional violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-public-website-marketing-funnel/
├── plan.md
├── research.md          # Phase 0 — MUST resolve: analytics-pipeline choice, email-provider choice, performance-budget numbers, A/B "same variant" mechanism (FR-094 NEEDS CLARIFICATION), Tanglish URL-locale decision (FR-076 NEEDS CLARIFICATION)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001-product-vision-governance`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── cms/                    # Page, Content Block, Navigation, Announcement (FR-001–FR-010, FR-084–FR-089)
│   │   │   ├── page.entity.ts
│   │   │   ├── content-block.entity.ts
│   │   │   ├── page-builder.controller.ts
│   │   │   └── page-version.service.ts        # reuses 001's audit-log/versioning pattern
│   │   ├── funnel/                  # Lead, Lead Form, Campaign, the 7 funnel journeys (FR-055–FR-059)
│   │   │   ├── lead.entity.ts
│   │   │   ├── lead-capture.controller.ts
│   │   │   ├── campaign-attribution.service.ts
│   │   │   └── funnel-tracking.service.ts
│   │   ├── checkout-tracking/       # Checkout Session/Abandoned Checkout state + UI-facing payment-state (FR-065–FR-071)
│   │   │   ├── checkout-session.entity.ts
│   │   │   └── abandoned-checkout.service.ts   # calls into 009 for actual payment; owns only state/UX tracking
│   │   ├── consent/                 # Consent Record, per-channel (FR-101–FR-102)
│   │   │   ├── consent-record.entity.ts
│   │   │   └── consent.service.ts
│   │   ├── experiments/             # A/B test assignment + audit (FR-093–FR-094)
│   │   │   ├── experiment.entity.ts
│   │   │   └── variant-assignment.service.ts
│   │   ├── seo/                     # SEO Metadata, Redirect, sitemap generation (FR-090–FR-092)
│   │   └── analytics-events/        # Event taxonomy capture (FR-095–FR-096)
│   └── common/                       # reused from 001: RbacGuard, audit-log interceptor
└── tests/{contract,integration,unit}/

web/
├── src/
│   └── app/
│       └── (public)/                 # extends 001's scaffold
│           ├── page.tsx                        # Home
│           ├── about/page.tsx
│           ├── programs/{page.tsx, [slug]/page.tsx}
│           ├── courses/{page.tsx, [slug]/page.tsx}
│           ├── community/page.tsx
│           ├── mentors/{page.tsx, [slug]/page.tsx}
│           ├── events/{page.tsx, [slug]/page.tsx}
│           ├── blog/{page.tsx, [slug]/page.tsx}
│           ├── podcast/{page.tsx, [slug]/page.tsx}
│           ├── resources/page.tsx
│           ├── success-stories/{page.tsx, [slug]/page.tsx}
│           ├── pricing/page.tsx
│           ├── contact/page.tsx
│           ├── help/page.tsx
│           ├── lp/[slug]/page.tsx               # CMS-driven lead-magnet & masterclass landing pages
│           └── checkout/page.tsx
│       └── (admin)/
│           └── cms/{pages,navigation,announcements}/  # Page Builder admin UI
├── src/components/
│   ├── layout/{header,footer,announcement-bar,cookie-consent}.tsx
│   ├── cms-blocks/                    # one component per FR-085 block type
│   └── funnel/{lead-form,masterclass-registration,checkout-flow}.tsx
└── tests/e2e/{funnels,cms,responsive,accessibility}/
```

**Structure Decision**: Reuses `001`'s `web/` and `backend/` projects rather than creating new ones — this feature is additive modules within the existing multi-surface structure, consistent with the "no unjustified 4th project" simplicity decision already recorded in `001`'s Complexity Tracking.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
