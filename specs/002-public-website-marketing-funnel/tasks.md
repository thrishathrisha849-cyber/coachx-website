---
description: "Task list for Feature 002 — Public Website, Marketing Funnel & Conversion System"
---

# Tasks: Public Website, Marketing Funnel & Conversion System

**Input**: Design documents from `/specs/002-public-website-marketing-funnel/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (User Account, RBAC engine, audit-log interceptor, Content Governance module — `content-item.entity.ts` / `content-lifecycle.service.ts` / `content-version.service.ts` — and `web`/`backend` projects scaffolded) — this feature adds modules to that existing structure rather than re-scaffolding.

**Tests**: Included — funnel correctness and consent/anti-dark-pattern compliance are directly load-bearing for revenue and legal compliance (Constitution Articles III, VI).

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md).

**Revision note (2026-07-23)**: This file was corrected following a traceability review. Added: 18 tasks extending US1 to cover the previously-untasked Community/Mentor/Events/Content-Hub public pages (T019–T036, closing the FR-040–FR-054 gap), a new Phase 6b covering Funnel C–G tracking (T055–T061, closing the FR-059 gap), and a webhook-signature-rejection negative contract test (T093). All subsequent task IDs shifted accordingly. `plan.md`'s Content Governance reuse statement was also corrected to reference 001's now-implemented module. No content in `spec.md` was changed.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 [P] Confirmed — 001's User Account/RBAC/audit-log were already deployed and extended further in this same session.
- [ ] T002 `research.md` was never generated for this feature; the open items (analytics-pipeline/email-provider choice, performance budgets, A/B consistency mechanism, Tanglish URL-locale) were not formally resolved — instead, the P1 scope actually built this pass avoided needing them (no A/B testing or analytics-pipeline work was in scope; email delivery reuses the existing dev email adapter).
- [x] T003 [P] `backend/src/funnel/` and `backend/src/checkout-tracking/` created (flat structure, matching this repo's real Express convention, not the `modules/` nesting `plan.md` assumed). `consent/` and `experiments/`/`analytics-events/` were NOT created as separate modules — consent reuses the pre-existing `ConsentRecord` (see T005); experiments/analytics-events are genuinely unbuilt (P2/P3, deferred this pass).

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Already existed (`Page`/`PageBlock`/`NavigationItem`/`Announcement` — `database/prisma/schema.prisma`), predating this session.
- [x] T005 Already existed — `ConsentRecord` with all 7 FR-101 channels exact-match (`TERMS, PRIVACY, MARKETING_EMAIL, WHATSAPP, SMS, PARTNER_COMMUNICATION, PERSONALIZATION_COOKIES`).
- [x] T006 `Lead` entity — **NEW this session** (`database/prisma/schema.prisma`). `LeadForm` was deliberately NOT built as a separate entity — the standard field set (Name/Email/Mobile/Profession/Business-Stage/Interest/Consent) is hardcoded in validation rather than admin-configurable, since no admin form-builder UI exists this pass (would be dead configuration with nothing to consume it). `Campaign` is NOT a separate registry — UTM/attribution fields are inline on `Lead`/`CheckoutSession` (documented decision: a full campaign-definition registry is a marketing-ops concern more naturally owned by a later Volume 14 feature).
- [x] T007 `CheckoutSession` — **NEW this session**, includes `abandonedAt`/`recoveryEmailSentAt` fields ready for US8 (deferred) to consume.
- [x] T008 Already existed (`Redirect` + sitemap.xml/robots.txt), predating this session.
- [x] T009 `backend/src/common/errors/public-error-codes.ts` — **NEW this session**: `DUPLICATE_REGISTRATION`, `EVENT_FULL`, `COUPON_INVALID`, `COUPON_EXPIRED`, `PAYMENT_FAILED`, `PAYMENT_PENDING`, `RESOURCE_UNAVAILABLE` added (verified real, used by the new funnel/checkout code); `AUTH_REQUIRED`/`INVALID_FORM` intentionally reuse the existing generic `UNAUTHORIZED`/`VALIDATION_ERROR` codes rather than duplicating; `RATE_LIMITED`/`SERVER_ERROR` already existed.
- [x] T010 Already existed, predating this session.
- [x] T011 Already existed (Pages + FAQ search), unchanged this pass — Course/Mentor/Event/Resource search remains a gap, not addressed this session.

**Checkpoint**: Foundation ready for funnel/page work.

---

## Phase 3: User Story 1 — Visitor Understands TBT and Finds the Right Program (P1) 🎯 MVP

**Independent Test**: Load home page as guest; verify orientation; navigate Programs → Program Detail; confirm correct CTA/pricing state.

**Scope note**: This phase covers spec.md's literal US1 acceptance scenarios (T012–T018, T019) plus a same-priority extension (T020–T037) closing the FR-040–FR-054 gap identified in the traceability review — the Community/Mentor/Events/Content-Hub public pages that spec.md's own Assumptions place in this feature's scope (discovery/preview/marketing of those objects) but that weren't originally tasked under any story.

- [x] T012 [P] [US1] Home page — was 4 of 16 FR-011–029 sections; **completed this session to 10 of 16** (Hero, Trust Strip/Stats, Problem, Solution, How-It-Works/Timeline, Audience Segment, Featured Programs, Learning Paths, Membership Preview/Pricing, FAQ, Final CTA — all real, seeded, CMS-driven content, `database/seeds/cms.seed.ts`). Remaining 6 (Community Preview, AI Tools Preview, Mentor Section, Events Section, Success Stories, Testimonials) are honestly omitted, not fabricated — each depends on a feature that doesn't exist yet (005/007/008/010) or on real consented testimonial data this environment has none of; inventing placeholder content for them would violate Constitution Article III.
- [x] T013 [US1] Already existed (Stats block `sourceNote` field), predating this session.
- [x] T014/T015/T016 [US1] **Scope decision, not a gap**: this codebase has no separate `Program` entity distinct from `Course` (Course already covers self-paced + cohort offerings). Rather than building a second, competing content type, `/programs` and `/programs/:slug` routes were added reusing the existing, real `CourseListPage`/`CourseDetailPage` components — same state-driven CTA logic (FR-037/FR-114) already implemented there.
- [x] T017 [P] [US1] Already existed, predating this session.
- [x] T018 [P] [US1] Already existed, predating this session.
- [ ] T019 [US1] Not done — no Playwright/e2e infra exists (see T002/T007 in Phase 1).
- [ ] T020–T029, T031 [US1] **Deferred, not silently skipped**: Community/Mentors/Events/Success-Stories/Podcast/Resources/Help pages all require entities (`Mentor`, `Event`) or real data sources (verified success stories, hosted audio, gated downloads) that don't exist yet, and substantively overlap with specs **005-community**, **007-mentor-marketplace**, and **010-events-webinars-live** — none of which have been reached yet in the 001→073 build order. Building full Mentor/Event platforms now, ahead of their owning specs, risks exactly the "two competing implementations" risk flagged in this repo's own architecture audit. Recommend building these after 005/007/010.
- [x] T027 [P] [US1] Blog listing + detail — already existed, predating this session (the one exception in this block that doesn't depend on an unbuilt entity).
- [x] T030 [US1] Contact — partial, already existed predating this session (form + `ContactSubmission` + confirmation email); department-based SLA/ticket-ownership routing remains deferred (needs 013-CRM, not yet built).
- [ ] T032–T037 [US1] Not done — nothing new to wire into nav (T020-031 deferred above); SEO/a11y/responsive/analytics/e2e passes for pages that don't exist are not applicable yet.

**Checkpoint**: Core discovery surface — including the full public IA, not just Home/Programs/Courses — functional and independently deployable.

---

## Phase 4: User Story 2 — Free Resource (Lead Magnet) Funnel (P1)

**Independent Test**: Submit lead-magnet form with consent; verify success page, delivery email, stored Lead with attribution.

- [x] T038 [P] [US2] `frontend/src/pages/LeadMagnetPage.tsx` at `/lp/:slug` — **DONE this session**, real working form.
- [x] T039 [US2] `backend/src/funnel/lead-capture.service.ts` + controller — **DONE**, duplicate-submission handling via `(leadMagnetSlug, email)` unique constraint, honeypot spam protection, full UTM/referral/affiliate capture.
- [x] T040 [US2] Consent-gated email triggering — **DONE**, verified by integration test: resource-delivery email always sent, marketing follow-on sent ONLY when `consentMarketingEmail: true`.
- [x] T041 [US2] `backend/tests/integration/marketing-funnel.integration.test.ts` — **DONE**, all 4 acceptance scenarios covered and passing for real.

**Checkpoint**: Top-of-funnel lead capture independently functional.

---

## Phase 5: User Story 3 — Masterclass/Webinar Funnel (P1)

**Independent Test**: Register for event; validate seat/duplicate checks; confirm real (not fabricated) countdown/seat data.

- [x] T042 [P] [US3] `frontend/src/pages/MasterclassPage.tsx` at `/masterclass/:slug` — **DONE this session** (a dedicated route rather than sharing US2's `/lp/:slug` — a masterclass needs live seat/countdown data US2's static lead-magnet template doesn't).
- [x] T043 [US3] `backend/src/funnel/masterclass.service.ts` — **DONE**, seat availability re-checked server-side INSIDE the same transaction as the insert; `EVENT_FULL`/`DUPLICATE_REGISTRATION` both verified by integration test.
- [x] T044 [US3] `getMasterclassStatus()` — **DONE**, the ONLY source for countdown/seat data the frontend renders; verified real (never fabricated) by integration test.
- [x] T045 [P] [US3] Registration confirmation UI — **DONE, completed on verification pass**: confirmation + email-sent state, plus Add-to-Calendar (Google Calendar link) and WhatsApp-share actions (`frontend/src/utils/calendar.ts`).
- [ ] T046 [US3] Webinar email sequence — **PARTIAL**: registration-confirmation email is real and sent; the 1-day/1-hour/starting-now/replay/offer-follow-up REMINDER sequence was not built — it requires a scheduler/cron mechanism that doesn't exist anywhere else in this codebase either (see 001's T005/T007 Redis/Playwright gaps — same class of missing infra, not specific to this feature).
- [x] T047 [US3] Covered by `marketing-funnel.integration.test.ts` — all 4 acceptance scenarios pass for real.

**Checkpoint**: Webinar-to-offer funnel independently functional.

---

## Phase 6: User Story 4 — Checkout for Membership, Course, or Event (P1)

**Independent Test**: Initiate checkout, apply/fail coupon, complete/fail payment, verify resulting state and access grant.

- [x] T048 [P] [US4] `frontend/src/pages/CheckoutPage.tsx` — **DONE this session**: product summary, coupon entry — real; billing/payment-method/terms fields are honestly OMITTED (not fabricated) since there's no real payment gateway to submit them to (009 not built) — the "Pay" action is clearly disabled with an explanation, matching this codebase's established "omit or clearly disable, never mislead" pattern.
- [x] T049 [US4] `backend/src/checkout-tracking/checkout-state.service.ts` — **DONE**, all 9 FR-068 states modeled; real payment processing correctly delegated to (unbuilt) 009.
- [x] T050 [US4] Coupon validation — **DONE**, verified: expired/invalid coupons rejected with `COUPON_EXPIRED`/`COUPON_INVALID`, cart left untouched.
- [x] T051 [US4] Failed-payment UX — **DONE, completed on verification pass**: `CheckoutPage.tsx` now renders a dedicated FAILED-state view (clear error, Retry — starts a fresh session without losing the product/coupon context, Change Payment Method, Contact Support link, explicit no-duplicate-charge note). The page also polls session state so a webhook-driven FAILED/SUCCESS transition is actually observed, not just the initial snapshot.
- [x] T052 [US4] Success-page — **DONE, completed on verification pass**: `frontend/src/pages/CheckoutSuccessPage.tsx` at `/checkout/success/:sessionId` — reads and reflects the server-confirmed session state only (shows a "confirming" view, never a false success, if the session isn't actually SUCCESS yet — Constitution Article I).
- [x] T053 [US4] `markAbandonedCheckouts()` — **DONE**, records against the real `CheckoutSession` row (user/product/cart-value/last-step/timestamp/UTM already on it); exposed as an admin-callable batch operation since no scheduler/cron exists in this codebase (same gap noted at T046).
- [x] T054 [US4] Covered by `marketing-funnel.integration.test.ts` — coupon apply/expired/invalid, payment fail, and the webhook signature-verification gate (FR-104, Constitution Article I: a forged webhook can NEVER mark SUCCESS) all pass for real. Abandoned-checkout recording verified at the service level.

**Checkpoint**: All 4 P1 stories functional — MVP complete.

---

## Phase 6b: Funnel C–G Tracking (supports FR-059; cross-cutting, depends on Phase 3's new pages and Phase 6's checkout)

**Why this phase exists**: spec.md's FR-059 requires all 7 documented funnel architectures (A–G) to be "distinct, trackable journeys," but the original task breakdown only elevated Funnels A (Lead Magnet, Phase 4) and B (Webinar, Phase 5) to dedicated stories. Funnels C–G reuse pages/flows built elsewhere (onboarding assessment in `003`, pricing page in Phase 3, course detail in Phase 3, the new Events pages in Phase 3, the new Mentor pages in Phase 3, and checkout in Phase 6) — this phase is the tracking/attribution wiring that makes each of those existing flows independently reportable as its own funnel, closing the gap identified in the traceability review.

- [x] T055 [P] `backend/src/funnel/funnel-journey-tagger.service.ts` — **DONE this session**, but via a leaner mechanism than tasked: funnel type is DERIVED from existing data (Lead→A, MasterclassRegistration→B, CheckoutSession's `Product.type`→D/E/F/G) rather than a new persisted tag column on every funnel-relevant row — avoids a redundant field while still making every funnel independently reportable (`GET /funnel/admin/coverage`).
- [x] T056 Funnel C (Assessment) — honestly reported as 0/unmeasurable with an explanatory note, not fabricated; correctly blocked on 003's onboarding assessment, which doesn't exist yet.
- [x] T057 Funnel D (Membership) — **DONE**, classified via `Product.type` (MEMBERSHIP_*).
- [x] T058 Funnel E (Course) — **DONE**, classified via `Product.type` (COURSE/COURSE_BUNDLE/COHORT_PROGRAM).
- [x] T059 Funnel F (Event) — classification logic exists and is correct; real traffic depends on the Events public pages, deferred at T024/T025 above (overlaps 010).
- [x] T060 Funnel G (Mentor) — classification logic exists and is correct; real traffic depends on the Mentor public pages, deferred at T022/T023 above (overlaps 007).
- [x] T061 Covered by `marketing-funnel.integration.test.ts`'s funnel-coverage-reporting tests — all 7 funnels reportable, real counts for A/B/D/E, honest zero+explanation for C/F/G.

**Checkpoint**: All 7 documented funnel architectures independently trackable and reportable.

---

**Scope note (this session)**: Phases 7–9 (US5 CMS admin builder, US6 Personalization/Localization, US7 A/B Testing & Analytics) were explicitly deferred this pass per the user-confirmed "P1 stories only" scope decision — none of T062–T079 were attempted. Phase 7's backend foundation (block rendering, page-workflow state machine, versioning) already substantially existed before this session; the admin-facing builder UI is the actual gap. Phases 8–9 are a complete gap with no existing backend to build on.

## Phase 7: User Story 5 — Admin CMS Page Builder (P2)

**Independent Test**: Admin builds a page from blocks, moves through Draft→Review→Approved→Scheduled→Published, previews in multiple viewports/contexts, verifies live-at-slug only once published.

- [ ] T062 [P] [US5] Page Builder block components (Hero, Text, Image, Video, CTA, Features, Stats, Testimonials, Pricing, FAQ, Timeline, Team, Logo Strip, Programs, Courses, Events, Mentors, Forms, restricted Custom HTML, Spacer, Divider) in `web/src/components/cms-blocks/` (FR-085)
- [ ] T063 [US5] Page Builder admin UI (drag/assemble blocks, Page Settings form) in `web/src/app/(admin)/cms/pages/[id]/page.tsx` (FR-086)
- [ ] T064 [US5] Content workflow state machine (Draft→Review→Approved→Scheduled→Published→Archived) for the `Page` entity in `backend/src/modules/cms/page-workflow.service.ts` (FR-087), built on top of `001`'s Content Item lifecycle service (`content-lifecycle.service.ts`) rather than re-implementing the state machine from scratch
- [ ] T065 [US5] Page versioning (retain, restore, compare, editor identity, timestamp) in `backend/src/modules/cms/page-version.service.ts` (FR-088, Constitution Article IV), delegating the non-destructive-overwrite guarantee to `001`'s `content-version.service.ts`
- [ ] T066 [US5] Preview mode (Mobile/Tablet/Desktop × Logged-Out/Logged-In/Membership-Specific) with expiring preview links in `web/src/app/(admin)/cms/preview/[id]/page.tsx` (FR-089, FR-105)
- [ ] T067 [US5] Custom HTML block restriction/sanitization in `backend/src/modules/cms/custom-html-sanitizer.service.ts` (FR-085 "restricted")
- [ ] T068 [US5] Integration + E2E test: full workflow states, versioning restore, multi-context preview, publish-only-live-at-slug in `web/tests/e2e/us5-cms-workflow.spec.ts` (all 4 acceptance scenarios)

**Checkpoint**: CMS operable without engineering deploys.

---

## Phase 8: User Story 6 — Personalization & Localization (P2)

**Independent Test**: Simulate campaign-tagged, logged-in-member, and Tamil-preference visitor signal sets; confirm each tailored output plus a defined fallback.

- [ ] T069 [P] [US6] Personalization signal resolver (language, traffic source, campaign, persona, goal, login, membership, purchases, location, device, event history) in `backend/src/modules/cms/personalization.service.ts` (FR-072)
- [ ] T070 [US6] Personalization rules with mandatory fallback (campaign-persona highlighting, Join Now→Continue Learning, purchased-item CTA suppression, Tamil default) in `backend/src/modules/cms/personalization-rules.service.ts` (FR-073, FR-074)
- [ ] T071 [P] [US6] Localization: Tamil/Tanglish/English switching, browser-suggestion, persisted preference, localized URL structure per `research.md`'s Tanglish decision in `web/src/lib/i18n/` (FR-075, FR-076)
- [ ] T072 [US6] Translation-status tracking + fallback-language resolution in `backend/src/modules/seo/translation-status.service.ts` (FR-076, edge case: untranslated page)
- [ ] T073 [US6] Currency/date/timezone localization + Tamil-font/line-break QA in `web/src/lib/i18n/format.ts` (FR-077)
- [ ] T074 [US6] Integration test: 4 signal-set scenarios (campaign persona, logged-in member, Tamil preference, no-signal fallback) in `backend/tests/integration/us6-personalization.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Personalization/localization independently functional with safe fallback.

---

## Phase 9: User Story 7 — A/B Testing & Campaign Analytics (P2)

**Independent Test**: Launch 2-variant experiment, confirm consistent variant on repeat visit, stop via admin, pull a campaign report.

- [ ] T075 [P] [US7] `Experiment` entity + variant-assignment service per `research.md`'s consistency-mechanism decision in `backend/src/modules/experiments/` (FR-093, FR-094)
- [ ] T076 [US7] Admin experiment control (start/stop, sample size, allocation, audit history) in `web/src/app/(admin)/experiments/page.tsx` (FR-094)
- [ ] T077 [P] [US7] Analytics event taxonomy capture (`page_viewed`, `hero_cta_clicked`, ..., per FR-095 list) with no-PII payload enforcement in `backend/src/modules/analytics-events/event-capture.service.ts` (FR-095, FR-096)
- [ ] T078 [US7] Campaign attribution reporting (visitors/leads/signups/sales/revenue/conversion-rate/refunds) in `backend/src/modules/funnel/campaign-report.service.ts` (FR-098)
- [ ] T079 [US7] Integration test: consistent variant assignment, stop-control, event-payload-shape, campaign report in `backend/tests/integration/us7-experiments-analytics.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Experimentation and measurement independently functional.

---

## Phase 10: User Story 8 — Abandoned-Checkout Recovery & Consent (P3)

**Independent Test**: Abandon checkout as consented vs. non-consented user; withdraw a consent channel and confirm no further sends.

- [ ] T080 [P] [US8] Not built — no recovery job exists (the `CheckoutSession.recoveryEmailSentAt` field is ready for it, but nothing writes to it or sends a recovery email yet).
- [x] T081 [US8] **DONE, built ahead of schedule this session**: `POST /funnel/consent/withdraw` (`backend/src/funnel/funnel.controller.ts`) — immediate-effect (marks the most recent grant row withdrawn), verified by integration test that a subsequent lead capture correctly sees no active consent. Built as part of Foundational since the lead-capture consent-gating logic needed the underlying `hasActiveConsent`/`withdrawConsent` functions anyway.
- [x] T082 [US8] Already existed predating this session (`useCookieConsent.ts` + `CookieConsentBanner.tsx`) — real and functional, though currently nothing in the frontend calls `hasConsentFor()` to actually gate a script load (no analytics/marketing script exists yet to gate).
- [ ] T083 [US8] Partial — consent withdrawal itself is tested (see T081); the recovery-send acceptance scenarios (1-2) are not applicable since T080's recovery job doesn't exist; cookie-category script-gating test not added (nothing to gate yet, per T082).

**Checkpoint**: All 8 user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T084 [P] SEO pass: unique metadata, structured data (Organization/Website/Breadcrumb/Course/Event/FAQ/Article/Person/PodcastEpisode/Product/Review), sitemap, redirect management in `backend/src/modules/seo/` (FR-090–FR-092) — final cross-site verification following T033's page-set-specific pass
- [ ] T085 [P] Page-state coverage: Loading/Empty/Error/Offline/Maintenance/404/500 for every dynamic page (FR-080)
- [ ] T086 [P] Form design/validation pass across all public forms (FR-081–FR-083)
- [ ] T087 [P] Accessibility pass (semantic headings, focus states, alt text, captions, contrast, skip-nav, reduced-motion) (FR-108) — final cross-site verification following T034's page-set-specific pass
- [ ] T088 [P] Security pass: HTTPS/CSRF/rate-limiting/bot-protection/input-sanitization/secure-cookies, payment tokenization, webhook signature verification (FR-103, FR-104)
- [ ] T089 Performance budget verification per template against `research.md`'s resolved numbers (FR-106, FR-107)
- [ ] T090 [P] Integration monitoring: timeout/retry/failure-logging/fallback for all 14 named external integrations (FR-109, FR-110)
- [ ] T091 Anti-dark-pattern compliance audit: zero fabricated metrics/countdowns, all outcome claims carry verification+disclaimer, no buy-CTA-on-owned-item, no stack traces on error surfaces (FR-111–FR-115, SC-002, SC-008)
- [ ] T092 Run `quickstart.md` validation end-to-end across all 8 user stories
- [x] T093 **[NEW]** **DONE this session, ahead of schedule**: covered in `marketing-funnel.integration.test.ts` — a forged/unsigned webhook signature is rejected (403), the session's status remains untouched (never transitions to SUCCESS), and the rejection is recorded via `recordAuditEvent` (`checkout.webhook_signature_rejected`) rather than silently dropped. A correctly-signed webhook is also tested and does transition the session to SUCCESS, proving the mechanism works both ways.

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational itself depends on `001`'s Foundational phase being deployed (including its Content Governance module, per T004's note).
- **P1 stories (US1–US4)**: US1 (discovery, now including the full public IA through T037) has no dependency on US2/US3/US4 and should ship first as the MVP anchor; US2 and US3 are independent of each other; US4 (checkout) is the common terminal step for US2/US3's funnels but is independently testable via any entry source per its own Independent Test — build in parallel once Foundational is done, sequence US1 first if serialized.
- **Phase 6b (Funnel C–G)** depends on Phase 3 (Events/Mentor pages), Phase 6 (checkout), and `003`'s onboarding assessment — sequence after Phase 6 as shown.
- **P2 stories (US5, US6, US7)** depend on Foundational only; US5 (CMS) is highest-value since US1's pages are meant to be CMS-editable — recommend sequencing US5 directly after the P1 slice even though marked P2, since ongoing content operations depend on it.
- **P3 story (US8)** depends on US4 (checkout/abandoned-checkout entity) and the Foundational Consent Record.
- **Polish (Phase 11)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (discovery surface, full public IA) → **STOP and VALIDATE** a visitor can orient and browse the entire site → US2 + US3 (funnels) → US4 (checkout) → Phase 6b (Funnel C–G tracking) → **STOP and VALIDATE** end-to-end revenue path across all 7 funnels → then US5 (CMS, recommended immediately after for operability) → US6/US7 → US8 → Polish.
