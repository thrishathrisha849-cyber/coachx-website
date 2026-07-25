# Implementation Plan: Events, Webinars & Live Platform

**Branch**: `010-events-webinars-live` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-events-webinars-live/spec.md`

## Summary

This feature builds the platform's events/webinars/conferences system end to end: a 25-plus event-type catalog across Online/Offline/Hybrid modes progressing through a 9-stage lifecycle; discovery and event-details pages; dynamic-form registration with 14 ticket types and full validation; encrypted, offline-capable QR check-in across independent checkpoints; live streaming with chat/polls/Q&A/recording; capacity-aware waitlisting with a bounded claim window; attendee networking (digital business cards, an approval-gated meeting scheduler); condition-gated automatic certificate issuance; sponsor tiers and exhibitor lead collection; and the full speaker/session/venue/volunteer/analytics/admin surface.

Unlike features 004–009, this volume is **not directly cited by name** in the constitution's source notes for any article — it is one of the PRD's thinner volumes (flat feature lists rather than fully elaborated "shall" clauses, per spec.md's own traceability note), so this plan aligns with constitutional principles without claiming a primary-source citation. It **directly implements Article I** (QR check-in and registration validation are entirely server-side; no client-asserted attendance or payment state is trusted — FR-013, FR-020, FR-055) and **aligns with Article IX** (certificates require a genuine completed action — attendance, quiz, minimum duration, feedback — never passive "viewed" status, FR-042).

Per spec.md's own Assumptions, this feature **defers, never duplicates**: payment capture, invoicing, coupons, and refund processing for paid tickets to `009` (this spec defines only ticket types/pricing fields and the payment-success gate before a registration confirms); event-participation gamification (points, streaks, badges) to `006` (this spec only emits the attendance/completion signals such a system would consume); the per-event community feed's moderation stack to `005` (mute/block/delete/report reused directly, not reimplemented); and the meeting scheduler's mentor-booking path to `007`'s mentor availability/profile data (no separate mentor directory). It **reuses `001`'s layered RBAC** for admin/check-in/event-management permission checks and its audit-log pattern for lifecycle-transition and check-in audit trails (FR-004, FR-056). It builds its **own** independent state machines for Event lifecycle, Registration/Attendance status, Waitlist claim-window, and Certificate-condition evaluation — none reused from a prior feature, since event/attendance semantics are domain-specific here.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–009.

**Primary Dependencies**: NestJS, Next.js, Flutter; a live-streaming ingestion/playback layer with a modular provider architecture (RTMP, YouTube Live, Vimeo, Custom CDN, OBS, Zoom, Teams, Meet — FR-025, no single vendor mandated); a QR generation/encryption library producing an encrypted token + security hash validated locally without network access (FR-019, FR-020); a job scheduler for reminder notifications, waitlist claim-window expiry, and scheduled lifecycle transitions (FR-018, FR-046, no vendor named, consistent with the same gap in prior features); real-time infrastructure for live chat/poll/Q&A/capacity-count updates (no vendor named — NEEDS CLARIFICATION carried from spec.md's general "no explicit API/schema contracts in this volume" caveat).

**Storage**: PostgreSQL (~22 entities per spec.md's Key Entities — event/session/venue, ticket/registration/QR, waitlist/check-in, speaker/sponsor/exhibitor/volunteer, networking, live-engagement, certificate/feedback/resource domains), Redis (real-time capacity counters, waitlist claim-window timers, live chat/poll/Q&A pub-sub, offline check-in sync queue), object storage with signed URLs for recordings/resources/QR assets.

**Testing**: Jest (backend — real-time capacity-concurrency, offline-QR-check-in-with-no-duplicate-on-sync, and zero-manual-certificate-issuance contract tests are the highest-stakes tests in this feature, matching SC-001-adjacent capacity guarantees, SC-003, and SC-004), Playwright (web e2e — registration flow, live player, organizer dashboard), Flutter test (mobile — offline check-in scanner, live-session viewer).

**Target Platform**: Web + mobile; the check-in scanner must function fully offline at the point of scan.

**Performance Goals**: At least 100,000 registrations for a single event and at least 10,000 concurrent live viewers per stream without service degradation (FR-060, SC-001, SC-002); instant QR validation at the point of scan, including offline; low-latency live chat; fast analytics.

**Constraints**: Registration is confirmed only after every validation condition passes (duplicate, invalid email/phone, expired event, sold-out capacity, unmet age/membership restriction, payment-amount mismatch — FR-013); real-time capacity/attendance counts must never allow registrations to exceed configured Maximum attendees under concurrent completion (FR-016, edge case); a QR ticket must validate and record check-in correctly even fully offline, with no duplicate check-in once connectivity restores (FR-020, FR-024, SC-003); a certificate is issued automatically the moment its configured conditions are met, with zero manual per-attendee action (FR-042, SC-004); an unclaimed waitlist seat is automatically released and re-offered when its claim window expires, never held indefinitely (FR-018, SC-005); every lifecycle transition and every check-in/admin action is captured in an auditable, retrievable log (FR-004, FR-056, SC-007).

**Scale/Scope**: ~22 data entities, 60 functional requirements (FR-001–FR-060), 8 user stories, a 25-plus predefined event-type catalog plus unlimited admin-defined custom types, and 6 NEEDS CLARIFICATION items flagged inline in spec.md (mandatory-vs-optional consent fields, waitlist claim-window length, per-checkpoint attendance rollup for multi-day events, mid-playback recording-access expiry, meeting-scheduler reschedule/cancellation/reminder rules, and the general absence of a source-defined entity-relationship model for this volume).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Registration validation, payment-amount matching, and QR/attendance state are all server-side; no client-asserted attendance or payment state is trusted | **PASS — direct implementation (not the constitution's named source for this article)** | FR-013, FR-020, FR-055 |
| II. AI Is Assistive, Never Autonomous | N/A — this feature defines no AI-generated surfaces | **PASS (N/A)** | — |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this feature's own surfaces — sponsor placement and event marketing content are not addressed by this volume's source text beyond tier-benefit listing | **PASS (N/A)** | FR-052 |
| IV. Historical Immutability | Registration/payment-amount validation (FR-013) is immutability-adjacent, but transaction snapshotting itself is owned by `009`, not this feature | **PASS (N/A for this feature; deferred to 009)** | spec.md Assumptions |
| V. Ledger-Based Internal Economies | N/A — deferred entirely to `009` (payments) and `006` (gamification points); this feature only emits the attendance/completion signals those ledgers consume | **PASS (N/A / deferred)** | spec.md Assumptions |
| VI. Consent Is First-Class | Registration form includes an explicit Consent field that blocks submission when required and unaccepted | **PASS** | FR-011, FR-013, acceptance scenario 4 |
| VII. Layered, Explicit RBAC | Admin/check-in/event-management permissions reuse `001`'s RBAC directly; every administrative and check-in action is audit-logged | **PASS (extends 001)** | FR-056 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A — sponsor tiers are a commercial benefit package, not a rank/reputation-purchase mechanic within any gamification system | **PASS (N/A)** | FR-052 |
| IX. Action Before Consumption | Certificate issuance requires a genuine completed action (attendance + quiz + minimum duration + feedback, per configuration), never passive "viewed" status alone | **PASS — aligns with the principle** | FR-042, User Story 7 |
| Localization & Language Requirements | Not addressed in this volume's source text; no Tamil/Tanglish-specific requirement appears in spec.md | **PASS (N/A for this feature)** | spec.md Assumptions |
| Security & Compliance Baseline | JWT-based API authentication, RBAC, rate limiting, QR encryption, webhook security, administrative audit logging | **PASS (aligns; not directly named for this volume in the Baseline's source citation list)** | FR-055–FR-058 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/010-events-webinars-live/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: live-streaming provider integration priority, real-time chat/poll/Q&A transport choice, job-scheduler choice, mandatory-vs-optional registration consent fields, waitlist claim-window default length, per-checkpoint-to-overall-attendance rollup rule for multi-day/multi-session events, mid-playback recording-access-expiry behavior, and meeting-scheduler reschedule/cancellation/reminder rules
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`009`'s structure — no new top-level projects; ticket pricing/payment gates call into `009`, attendance/completion signals are emitted for `006` to consume, the community feed reuses `005`'s moderation stack, and the meeting scheduler's mentor path reads `007`'s mentor data.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── events-catalog/         # Event, Session, Track, lifecycle state machine (FR-001–FR-009, FR-031–FR-034)
│   │   ├── events-registration/    # Registration, dynamic form, Ticket Type, validation engine (FR-010–FR-015)
│   │   ├── events-capacity/        # Waitlist Entry, real-time capacity counters, claim-window (FR-016–FR-018)
│   │   ├── events-checkin/         # QR Ticket, Check-in Record, offline validation, attendance status (FR-019–FR-024)
│   │   ├── events-live/            # live-stream ingestion, player, Live Chat Message, Live Poll, Live Question, recording (FR-025–FR-030)
│   │   ├── events-venue/           # Venue, floor map (FR-035–FR-036)
│   │   ├── events-networking/      # Digital Business Card, Meeting (Scheduler) (FR-037–FR-039)
│   │   ├── events-community/       # Event Community Post, Resource — layered on `005`'s moderation (FR-040–FR-041)
│   │   ├── events-certificate/     # Certificate, Feedback Response, recording-access gate (FR-042–FR-045)
│   │   ├── events-sponsor/         # Sponsor, Exhibitor Booth, Volunteer (FR-052–FR-054)
│   │   └── events-admin/           # Organizer Dashboard, Report, Admin Panel, analytics, notifications (FR-046–FR-051, FR-058)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 005: moderation primitives; reused from 007: mentor availability read; reused from 009: payment/ticket-price gate
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (public)/
        └── events/{page.tsx, [eventSlug]/page.tsx, [eventSlug]/register/page.tsx}
    └── (member)/
        └── events/{my-tickets,[eventId]/live,[eventId]/networking,[eventId]/certificate}/
    └── (organizer)/
        └── events/{create,[eventId]/dashboard,[eventId]/speakers,[eventId]/sponsors,[eventId]/volunteers}/
    └── (admin)/
        └── events-admin/{events,sessions,speakers,sponsors,tickets,registrations,attendance,volunteers,certificates,feedback,analytics,reports,settings}/

mobile/
└── lib/features/
    └── events/                      # browse, register, QR ticket, offline check-in scanner, live watch, networking, feedback, certificate
```

**Structure Decision**: 11 new backend modules under `events-*`, mirroring spec.md's own FR groupings. `events-checkin` is the module with the strictest offline-first requirement and is built and contract-tested early. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
