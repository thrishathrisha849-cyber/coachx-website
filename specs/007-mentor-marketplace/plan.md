# Implementation Plan: Mentor Marketplace: Discovery, Booking, Sessions & Payouts

**Branch**: `007-mentor-marketplace` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-mentor-marketplace/spec.md`

## Summary

This feature builds the platform's entire mentorship marketplace: a 21-stage mentor application/verification pipeline (identity + professional + regulated-category credential checks); a mentor profile and 17-type service catalog; explainable discovery/search/recommendation with fair new-mentor exposure; timezone-safe availability and calendar integration feeding an atomic, slot-hold-protected booking transaction; a role-separated session workspace (private mentor notes, shared member notes, admin safety notes) with action plans and deliverable tracking; reschedule/cancellation/no-show handling; a dispute-and-refund pipeline; commission-snapshotted mentor earnings and payouts; a review-and-quality-score system with anti-manipulation controls; mentor suspension/safety controls; and the admin mentorship operations console.

This feature is **explicitly co-cited by the constitution** for two articles: **Article III (No Dark Patterns, No Guaranteed-Outcome Claims)** — "Vol 07 'No Guaranteed Results' on mentor profiles" (FR-028, FR-054, FR-134) — and **Article IV (Historical Immutability)** — "Vol 07 commission snapshotted at booking confirmation" (FR-113, SC-002). It is also **directly named** in the constitution's Security & Compliance Baseline ("mentor credentials in legal/tax/medical/financial categories"), governing FR-018–FR-024 and FR-187. Unlike 004/005/006, it is not the sole primary source for any single article — it shares III with 001/002/005/014-Ch5/014-Ch7 and IV with 009/014-Ch4.

It **reuses `001`'s layered RBAC directly** for the 18-role mentorship hierarchy (Mentor manager, Mentor reviewer, Support agent, Finance operator, Trust-and-safety reviewer, Platform admin, Super admin, etc. — FR-001, FR-002) and its audit-log pattern for administrative/financial actions (FR-169), rather than defining a new permission engine. It **reuses `005`'s messaging infrastructure and safety rules** for mentor-member messaging contexts (FR-087) and its self-promotion moderation limits for mentor-authored community content (FR-145), layering mentor-specific professional-boundary and contact-protection rules (FR-088–FR-093) on top rather than rebuilding messaging from scratch. It **defers, not duplicates**: detailed payment/tax architecture and the platform financial ledger of record to `009` (this feature only owns marketplace-specific checkout touchpoints, price-breakdown display, and commission snapshotting — FR-107, spec.md Assumptions); instructor course/cohort/assignment functionality to `004` (this feature only marks that a mentor may also hold an instructor role — FR-144); and mentor gamification/reputation surfaces to `006` (the internal Quality Score defined here, Section 113, is a distinct, non-public concept from any public gamification reputation — spec.md Assumptions). It builds its **own, independent state machines** for Mentor Application, Mentor Verification, Booking, Session, Earning, Dispute, and Review — none of these are claimed as reuses of any prior feature's lifecycle, since their states and transition rules are genuinely domain-specific (continuing the discipline established after the 001/002 correction and applied since `004`).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–006.

**Primary Dependencies**: NestJS, Next.js, Flutter; a video/conferencing provider for platform video sessions and external-video-provider fallback (FR-076, FR-077 — NEEDS CLARIFICATION: no specific vendor named, "platform video call" is only the recommended default per Section 23); OAuth calendar clients for Google Calendar and Microsoft Outlook Calendar (FR-059); a job scheduler for slot-hold expiry sweeps, session reminders, credential re-verification triggers, and scheduled payout runs (FR-060, FR-072, FR-022, FR-117 — NEEDS CLARIFICATION: no specific scheduler named in source, consistent with `006`'s same gap); a high-risk-pattern text-detection capability for off-platform-payment-request warnings and review-manipulation detection (FR-089, FR-170 — NEEDS CLARIFICATION: no technique/vendor named); malware/virus scanning for identity documents and booking attachments (shared pattern with `002`/`004`/`005`); payment execution deferred to `009`'s payment/tax engine (FR-107).

**Storage**: PostgreSQL (~40 entities per spec.md's Key Entities — application/verification/credential, profile/service/policy, availability/calendar, booking/session, dispute/refund, payout/commission, review/quality domains), Redis (atomic slot-hold locks for double-booking prevention, discovery/ranking cache, session waiting-room/timer presence state, rate limiting), object storage with encrypted-at-rest, signed/time-limited URLs for identity documents and booking attachments (FR-013, FR-167).

**Testing**: Jest (backend — slot-hold/no-double-booking, commission-snapshot-immutability, and mentor-no-show-refund-and-payout-hold contract tests are the highest-stakes tests in this feature), Playwright (web e2e), Flutter test (mobile — offline cached booking details/mentor profile, intake-draft persistence, deliverable-upload retry, message retry per FR-183).

**Target Platform**: Web + mobile, consistent with prior features; session workspace and video calling need real-time delivery.

**Performance Goals**: Slot-hold acquisition and the full booking transaction (lock → recheck → capacity check → payment → confirm → calendar event → release-or-commit) complete as a single atomic operation with no observable race window (FR-060, SC-001); availability computation merges recurring rules, date exceptions, and external calendar busy-blocks efficiently; discovery ranking is cached but explainable, never raw-popularity-driven; scheduled payout batches and credential-expiry/slot-hold-expiry sweeps run on a defined cadence.

**Constraints**: Slot-hold + booking confirmation MUST be atomic and concurrency-safe, preventing double-booking under simultaneous requests (FR-060, FR-067, SC-001); the commission rate MUST be snapshotted immutably at booking-confirmation time and MUST NOT be retroactively affected by later commission-structure changes (FR-113, SC-002, Constitution Article IV); private mentor notes and admin safety notes MUST be enforced as data-level visibility separation, not UI-only hiding (FR-083, SC-005); no mentor-facing surface may display guaranteed-income/job/outcome claims (FR-028, SC-004, Constitution Article III); regulated-category services MUST be blocked from listing until category-specific credentials are verified, with jurisdiction disclaimers always shown (FR-019, FR-020, SC-006); no single attendance signal is ever treated as conclusive alone for no-show classification (FR-100); mentor cancellation MUST NEVER be classified as member fault (FR-096); new mentors with zero reviews MUST remain discoverable, never permanently suppressed by review-count-only ranking (FR-133, FR-135, SC-007); suspended/unpublished mentors MUST NEVER appear in search results (FR-047, SC-008); booking success/payment success MUST NEVER render client-side without backend confirmation (FR-182, Constitution Article I).

**Scale/Scope**: ~40 data entities, 189 functional requirements (FR-001–FR-189, including 6 NEEDS CLARIFICATION items FR-184–FR-189), 9 user stories, an analytics event taxonomy of 20 named events (FR-160), and a dedicated admin mentorship operations module spanning 21 navigation areas (FR-146).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Role/permission checks backend-only; booking/payment success never client-asserted; attendance never single-signal-decided | **PASS — direct implementation** | FR-002, FR-100, FR-163, FR-182 |
| II. AI Is Assistive, Never Autonomous | Off-platform-payment and review-manipulation detection (if AI-assisted) are advisory, routing to human trust-and-safety review, never auto-punishing on one signal | **PASS** | FR-089, FR-170, FR-103 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | **Constitution-cited co-source** ("Vol 07 'No Guaranteed Results' on mentor profiles") — no guaranteed-income/job/outcome bio claims; comparison UI never declares a universal "best mentor"; paid featured placement always labeled Sponsored/Promoted, never disguised as organic quality | **PASS — cited source** | FR-028, FR-054, FR-134 |
| IV. Historical Immutability | **Constitution-cited co-source** ("Vol 07 commission snapshotted at booking confirmation") — commission rate immutable per booking regardless of later rate changes | **PASS — cited source** | FR-113, SC-002 |
| V. Ledger-Based Internal Economies | Mentor Earning/Commission/Payout are ledger-derived, status-tracked balances; ultimate financial ledger-of-record is deferred to `009` | **PASS (defers to 009)** | FR-114, FR-115, spec.md Assumptions |
| VI. Consent Is First-Class | Recording requires explicit mentor+member consent with visible indicator; group-session participant visibility disclosed up front; post-booking contact-sharing requires explicit mutual consent | **PASS** | FR-078, FR-088, FR-176 |
| VII. Layered, Explicit RBAC | 18-role hierarchy reuses `001`'s RBAC directly, no new engine; dual approval for high-value payout batches | **PASS (extends 001)** | FR-001, FR-002, FR-121 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Verified/Featured mentor status not directly purchasable; ranking bans automatic highest-price-to-top and unlabeled paid boosts | **PASS (aligns; not primary source)** | FR-134, FR-135 |
| IX. Action Before Consumption | N/A — marketplace/service feature, not a learning-consumption module; action plans do carry the same verifiable-artifact spirit | **PASS (N/A / contributes)** | FR-084 |
| Localization & Language Requirements | Tamil/Tanglish/English across bios, taxonomy, booking flow, notifications, disputes, support content | **PASS** | FR-179 |
| Security & Compliance Baseline | **Directly named** ("mentor credentials in legal/tax/medical/financial categories") — regulated-category credential verification, encrypted identity/payout data, audit logging | **PASS — directly named source** | FR-018–FR-024, FR-167, FR-169, FR-187 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/007-mentor-marketplace/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: video-provider selection, job-scheduler choice, off-platform-payment/review-manipulation detection technique, and every numeric default the source leaves unstated (no-show grace period, slot-hold expiry duration, dispute window length, regulated-category compliance frameworks per jurisdiction, commission fee schedule, minimum payout threshold/settlement delay — FR-184–FR-189)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`006`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── mentor-application/     # Mentor Application, onboarding-stage progress, Mentor Verification, Credential (FR-006–FR-024)
│   │   ├── mentor-profile/         # Mentor Profile, Mentor Expertise, Mentor Language, Mentor Service, Service Policy (FR-025–FR-044)
│   │   ├── mentor-discovery/       # search, filters, sort, recommendation engine, mentor cards, save/shortlist/compare (FR-045–FR-054)
│   │   ├── mentor-availability/    # Availability Rule, Availability Exception, Calendar Integration, Calendar Busy Block, booking-notice/future-window/buffer rules (FR-055–FR-063)
│   │   ├── mentor-booking/         # booking flow orchestration, Booking, Booking Slot Hold, Booking Intake, Booking Attachment, confirmation, reminders (FR-064–FR-073)
│   │   ├── mentor-session/         # Session, Session Participant, Session Attendance, Session Technical Log, Session Note, Action Plan, Action Item, Deliverable (FR-074–FR-086)
│   │   ├── mentor-messaging/       # Mentor Message Context, contact protection, professional-boundary enforcement, conflict-of-interest disclosure, confidentiality policy, emergency workflow — layered on `005`'s messaging infra (FR-087–FR-093)
│   │   ├── mentor-lifecycle/       # Reschedule Request, Cancellation, No-show Record, cancellation-policy model (FR-094–FR-100)
│   │   ├── mentor-dispute/         # Dispute, Dispute Evidence, Refund, dispute-queue prioritization (FR-101–FR-106)
│   │   ├── mentor-payment/         # checkout price breakdown, coupon, Session Credit — execution deferred to `009` (FR-107–FR-110)
│   │   ├── mentor-payout/          # Mentor Earning, Commission, Payout Account, Payout, Tax Document (FR-111–FR-121)
│   │   ├── mentor-review/          # Review, Review Response, Review Report, Quality Score, Quality Review, ranking, performance dashboard, alerts (FR-122–FR-139)
│   │   ├── mentor-safety/          # Mentor Restriction, Safety Incident, suspension/deactivation, member/mentor safety controls (FR-140–FR-143)
│   │   ├── mentor-content/         # instructor-role summary capabilities (deferred to `004`), mentor community-content creation (deferred to `005`) (FR-144–FR-145)
│   │   └── mentor-admin/           # admin mentorship module: overview, applications, verification, mentors, services, bookings, sessions, reviews, disputes, refunds, earnings, payouts, quality, safety, categories, settings, reports (FR-146–FR-155)
│   └── common/                     # reused from 001–006: RbacGuard, audit-log interceptor; reused from 005: rich-text sanitizer, messaging safety rules; reused from 002/004/005: malware scanner
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        ├── mentors/{page.tsx, [mentorSlug]/page.tsx, compare/page.tsx}
        ├── mentors/book/{[serviceId]/page.tsx, confirmation/page.tsx}
        ├── sessions/{page.tsx, [sessionId]/page.tsx}
        └── mentor-dashboard/{applications,profile,services,availability,bookings,sessions,earnings,payouts,reviews,performance}/
    └── (admin)/
        └── mentorship/{overview,applications,verification,mentors,experts,instructors,services,availability,bookings,sessions,reviews,disputes,refunds,earnings,payouts,quality,safety,categories,settings,reports}/

mobile/
└── lib/features/
    └── mentorship/                 # discovery, profile, booking, session workspace, mentor-dashboard, offline booking-cache/intake-draft/message-retry queueing (FR-183)
```

**Structure Decision**: 14 new backend modules under `mentor-*`, mirroring spec.md's own FR groupings so each module maps cleanly to a Key Entities cluster. `mentor-messaging` and `mentor-content` are deliberately thin layers over `005`'s existing social-messaging and moderation infrastructure rather than parallel reimplementations. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
