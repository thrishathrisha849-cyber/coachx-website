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

- [ ] T001 [P] Confirm `001-product-vision-governance`'s Foundational phase is deployed (User Account, RbacGuard, audit-log interceptor, Content Governance module) — this feature has a hard dependency, not just a suggested one
- [ ] T002 Resolve `research.md` open items before proceeding to Foundational: analytics-pipeline provider, email-delivery provider, per-template performance budgets, A/B "same variant" consistency mechanism (FR-094), Tanglish URL-locale decision (FR-076)
- [ ] T003 [P] Add `backend/src/modules/{cms,funnel,checkout-tracking,consent,experiments,seo,analytics-events}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Define `Page`, `Page Section/Content Block`, `Navigation`, `Announcement` entities/migrations in `backend/src/modules/cms/` (FR-001–FR-010) — `Page` is a distinct entity from `001`'s `Content Item`, but reuses its lifecycle-state-machine pattern (see T041)
- [ ] T005 Define `Consent Record` entity/migration (7 distinct types, never combined) in `backend/src/modules/consent/consent-record.entity.ts` (FR-101, Constitution Article VI)
- [ ] T006 Define `Lead`, `Lead Form`, `Campaign` entities/migrations in `backend/src/modules/funnel/` (FR-055, FR-097)
- [ ] T007 Define `Checkout Session/Abandoned Checkout` entity/migration in `backend/src/modules/checkout-tracking/checkout-session.entity.ts` (FR-071)
- [ ] T008 Define `SEO Metadata` and `Redirect` entities/migrations in `backend/src/modules/seo/` (FR-090, FR-092)
- [ ] T009 Implement the standard public error-code set (`AUTH_REQUIRED`, `INVALID_FORM`, `DUPLICATE_REGISTRATION`, `EVENT_FULL`, `OFFER_EXPIRED`, `COUPON_INVALID`, `COUPON_EXPIRED`, `PAYMENT_FAILED`, `PAYMENT_PENDING`, `RESOURCE_UNAVAILABLE`, `RATE_LIMITED`, `SERVER_ERROR`) in `backend/src/common/errors/public-error-codes.ts` (FR-116)
- [ ] T010 [P] Header, Footer, Announcement Bar, Cookie Consent Banner components in `web/src/components/layout/` (FR-001–FR-010) — cookie consent gates all marketing/analytics script loading (FR-106, Constitution Article VI)
- [ ] T011 [P] Global search (modal/page) in `web/src/components/search/` covering Courses/Programs/Blog/Mentors/Events/Resources/FAQs (FR-009)

**Checkpoint**: Foundation ready for funnel/page work.

---

## Phase 3: User Story 1 — Visitor Understands TBT and Finds the Right Program (P1) 🎯 MVP

**Independent Test**: Load home page as guest; verify orientation; navigate Programs → Program Detail; confirm correct CTA/pricing state.

**Scope note**: This phase covers spec.md's literal US1 acceptance scenarios (T012–T018, T019) plus a same-priority extension (T020–T037) closing the FR-040–FR-054 gap identified in the traceability review — the Community/Mentor/Events/Content-Hub public pages that spec.md's own Assumptions place in this feature's scope (discovery/preview/marketing of those objects) but that weren't originally tasked under any story.

- [ ] T012 [P] [US1] Home page sections (Hero, Trust Strip, Problem, Solution, How-It-Works, Audience Segment, Featured Programs, Learning Paths, Community Preview, AI Tools Preview, Mentor Section, Events Section, Success Stories, Membership Preview, Testimonials, FAQ, Final CTA) in `web/src/app/(public)/page.tsx` + `web/src/components/home/*` (FR-011–FR-029)
- [ ] T013 [US1] Trust-metric source-tracking enforcement (no fabricated metrics) in `backend/src/modules/cms/trust-metric.service.ts` (FR-014, Constitution Article III)
- [ ] T014 [P] [US1] Program Listing page with filters/sort and empty-state actions in `web/src/app/(public)/programs/page.tsx` (FR-031, FR-032)
- [ ] T015 [P] [US1] Program Detail page with state-driven CTA (Buy/Continue Learning/Included in Plan/Waitlist) in `web/src/app/(public)/programs/[slug]/page.tsx` (FR-033–FR-037)
- [ ] T016 [US1] Backend entitlement-state resolver for Program/Course CTA state, calling into 001's EntitlementGuard in `backend/src/modules/cms/entitlement-cta.service.ts` (FR-037, FR-114)
- [ ] T017 [P] [US1] Course Catalog + Course Detail pages in `web/src/app/(public)/courses/{page.tsx,[slug]/page.tsx}` (FR-038, FR-039)
- [ ] T018 [P] [US1] About page in `web/src/app/(public)/about/page.tsx` (FR-030)
- [ ] T019 [US1] E2E test: home orientation, empty-filter state, owned-course CTA, expired-offer hiding in `web/tests/e2e/us1-discovery.spec.ts` (all 4 acceptance scenarios)
- [ ] T020 [P] [US1] **[NEW]** Community public page (hero, benefits, group categories, member activities, community wins, community-guidelines preview, leaderboard preview, moderator introduction, membership CTA) in `web/src/app/(public)/community/page.tsx` (FR-040)
- [ ] T021 [P] [US1] **[NEW]** Community feed preview (public-post-only: author, badge, media, reaction/comment counts) with a signup modal gating any guest react/comment attempt in `web/src/components/community-preview.tsx` (FR-041, edge case: guest reacting to a public post preview)
- [ ] T022 [P] [US1] **[NEW]** Mentor Listing page with filters (Expertise, Language, Price, Rating, Availability, Experience, Free Consultation, Session Type, Industry) and empty-state actions (Clear Filters, Request a Mentor, Join Mentor Waitlist) in `web/src/app/(public)/mentors/page.tsx` (FR-042)
- [ ] T023 [P] [US1] **[NEW]** Mentor Profile page (hero, bio, expertise, credentials, session types, availability, reviews, booking CTA) with guest-booking-redirects-to-login and unavailable-mentor Join-Waitlist/Follow/Similar-Mentors options in `web/src/app/(public)/mentors/[slug]/page.tsx` (FR-043)
- [ ] T024 [P] [US1] **[NEW]** Events Listing page with event-type/filter support (Upcoming/Past, Online/Offline, Free/Paid, Category, Language, Date, Speaker, Location) and event cards in `web/src/app/(public)/events/page.tsx` (FR-044)
- [ ] T025 [P] [US1] **[NEW]** Event Detail page (hero, countdown, description, agenda, speakers, schedule, venue/map, requirements, ticket types, FAQs, related events) in `web/src/app/(public)/events/[slug]/page.tsx` (FR-045)
- [ ] T026 [P] [US1] **[NEW]** Success Stories listing (filters: User Type, Program, Industry, Milestone, Language, Format, Verified Status) and detail page (background, challenge, journey, result, verification note) with no-guaranteed-result language in `web/src/app/(public)/success-stories/{page.tsx,[slug]/page.tsx}` (FR-048, Constitution Article III)
- [ ] T027 [P] [US1] **[NEW]** Blog listing (categories, featured article, search, popular posts, author filter, tags) and detail page (breadcrumb, TOC, share, related, author bio) with full SEO metadata and Article/Author/Breadcrumb structured data in `web/src/app/(public)/blog/{page.tsx,[slug]/page.tsx}` (FR-049, FR-050)
- [ ] T028 [P] [US1] **[NEW]** Podcast listing (latest episodes, series, categories, hosts, search, guest filter) and episode detail with a full-featured audio player (play/pause/seek/speed/volume/duration/resume/background-playback) in `web/src/app/(public)/podcast/{page.tsx,[slug]/page.tsx}` (FR-051)
- [ ] T029 [P] [US1] **[NEW]** Free Resource Library with resource-type cards (Ebook, Checklist, Template, Worksheet, Calculator, Assessment, Mini-Course, Prompt Pack, Webinar Replay) and the 5 access types (Public, Email-Gated, Signup-Gated, Membership-Only, Paid) in `web/src/app/(public)/resources/page.tsx` (FR-052)
- [ ] T030 [US1] **[NEW]** Contact page and department-routed support-ticket creation (confirmation email, admin owner assignment, SLA tracking, spam protection) in `web/src/app/(public)/contact/page.tsx` + `backend/src/modules/funnel/contact-ticket.controller.ts` (FR-053)
- [ ] T031 [P] [US1] **[NEW]** Help Center with category articles, search, helpful/not-helpful voting, related articles, and a contact-support/ticket-creation fallback in `web/src/app/(public)/help/page.tsx` (FR-054)
- [ ] T032 [US1] **[NEW]** Wire Community/Mentors/Events/Blog/Podcast/Resources/Contact/Help into the header and footer navigation built in T010 in `web/src/components/layout/{header,footer}.tsx` (FR-001, FR-002, FR-008)
- [ ] T033 [US1] **[NEW]** SEO metadata and structured data (Person, PodcastEpisode, FAQ, Article, Review schemas as applicable) for the 8 new page types in `backend/src/modules/seo/` (FR-090, FR-091 — scoped to this page set; T084's Polish-phase SEO pass covers final cross-site verification)
- [ ] T034 [P] [US1] **[NEW]** Accessibility pass for the 8 new page types (landmarks, alt text, focus order, accessible audio-player controls) across `web/src/app/(public)/{community,mentors,events,success-stories,blog,podcast,resources,contact,help}/**`
- [ ] T035 [P] [US1] **[NEW]** Responsive-design verification for the 8 new page types across small-mobile/mobile/tablet/laptop/desktop/large-desktop breakpoints (FR-078, FR-079)
- [ ] T036 [US1] **[NEW]** Verify the FR-095 analytics event taxonomy fires correctly on the 8 new page types (`page_viewed` variants, mentor-profile-viewed, event-registration-started, help-article-viewed) in `backend/src/modules/analytics-events/event-capture.service.ts`
- [ ] T037 [US1] **[NEW]** E2E test: community guest-signup-gate, mentor-booking guest-redirect, event-registration entry point, contact-form ticket creation, help-center search in `web/tests/e2e/us1-content-hub-pages.spec.ts`

**Checkpoint**: Core discovery surface — including the full public IA, not just Home/Programs/Courses — functional and independently deployable.

---

## Phase 4: User Story 2 — Free Resource (Lead Magnet) Funnel (P1)

**Independent Test**: Submit lead-magnet form with consent; verify success page, delivery email, stored Lead with attribution.

- [ ] T038 [P] [US2] Lead Magnet Landing Page template in `web/src/app/(public)/lp/[slug]/page.tsx` + `web/src/components/funnel/lead-form.tsx` (FR-055)
- [ ] T039 [US2] Lead-capture endpoint with duplicate-submission handling and UTM/campaign attribution capture in `backend/src/modules/funnel/lead-capture.controller.ts` (FR-056, FR-097, edge case: double-submit)
- [ ] T040 [US2] Consent-gated email triggering (transactional resource-delivery always; marketing sequence only if consent) in `backend/src/modules/funnel/lead-email-trigger.service.ts` (FR-099, acceptance scenario 3, Constitution Article VI)
- [ ] T041 [US2] Integration test: lead capture, duplicate handling, consent-gated emails, UTM attribution in `backend/tests/integration/us2-lead-magnet.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Top-of-funnel lead capture independently functional.

---

## Phase 5: User Story 3 — Masterclass/Webinar Funnel (P1)

**Independent Test**: Register for event; validate seat/duplicate checks; confirm real (not fabricated) countdown/seat data.

- [ ] T042 [P] [US3] Masterclass/Webinar Landing Page template in `web/src/app/(public)/lp/[slug]/page.tsx` (shared with US2's template system) (FR-057)
- [ ] T043 [US3] Event registration endpoint with seat re-check at submission time and `EVENT_FULL`/`DUPLICATE_REGISTRATION` handling in `backend/src/modules/funnel/event-registration.controller.ts` (FR-046, edge cases)
- [ ] T044 [US3] Backend-sourced countdown/registration-close-date service (no client-fabricated countdowns) in `backend/src/modules/funnel/registration-countdown.service.ts` (FR-058, FR-112, Constitution Article III)
- [ ] T045 [P] [US3] Post-registration confirmation (Add to Calendar, WhatsApp share, email) in `web/src/components/funnel/masterclass-registration.tsx` (FR-047)
- [ ] T046 [US3] Webinar email sequence (confirmation, 1-day/1-hour reminder, starting-now, replay, offer follow-up) in `backend/src/modules/funnel/webinar-email-sequence.service.ts` (FR-099)
- [ ] T047 [US3] Integration test: registration, EVENT_FULL, DUPLICATE_REGISTRATION, real-countdown-closure in `backend/tests/integration/us3-webinar-funnel.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Webinar-to-offer funnel independently functional.

---

## Phase 6: User Story 4 — Checkout for Membership, Course, or Event (P1)

**Independent Test**: Initiate checkout, apply/fail coupon, complete/fail payment, verify resulting state and access grant.

- [ ] T048 [P] [US4] Checkout page (product summary, coupon entry, billing, payment method, terms) in `web/src/app/(public)/checkout/page.tsx` (FR-065, FR-066)
- [ ] T049 [US4] Checkout-state tracking service (Not Started/Processing/Requires Action/Success/Failed/Cancelled/Pending/Refunded/Partially Refunded), delegating actual payment processing to `009-membership-payments-revenue` in `backend/src/modules/checkout-tracking/checkout-state.service.ts` (FR-068)
- [ ] T050 [US4] Coupon validation UI/state (reject expired/invalid without silently applying partial discount) in `web/src/components/funnel/checkout-flow.tsx` (FR-066, edge case: `COUPON_EXPIRED`/`COUPON_INVALID`)
- [ ] T051 [US4] Failed-payment UX (Retry, Change Payment Method, Contact Support, preserved cart, no-duplicate-charge warning) in `web/src/components/funnel/checkout-flow.tsx` (FR-069)
- [ ] T052 [US4] Success-page rendering that reflects — but does NOT itself grant — server-confirmed access (Constitution Article I) in `web/src/app/(public)/checkout/success/page.tsx` (FR-070, edge case: webhook-confirmation-not-yet-arrived)
- [ ] T053 [US4] Abandoned-checkout recording (user, product, cart value, last step, timestamp, campaign) in `backend/src/modules/checkout-tracking/abandoned-checkout.service.ts` (FR-071, acceptance scenario 4)
- [ ] T054 [US4] Integration test: coupon apply/fail, payment fail, payment success (access gated on server confirmation, not page render), abandoned-checkout recording in `backend/tests/integration/us4-checkout.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 4 P1 stories functional — MVP complete.

---

## Phase 6b: Funnel C–G Tracking (supports FR-059; cross-cutting, depends on Phase 3's new pages and Phase 6's checkout)

**Why this phase exists**: spec.md's FR-059 requires all 7 documented funnel architectures (A–G) to be "distinct, trackable journeys," but the original task breakdown only elevated Funnels A (Lead Magnet, Phase 4) and B (Webinar, Phase 5) to dedicated stories. Funnels C–G reuse pages/flows built elsewhere (onboarding assessment in `003`, pricing page in Phase 3, course detail in Phase 3, the new Events pages in Phase 3, the new Mentor pages in Phase 3, and checkout in Phase 6) — this phase is the tracking/attribution wiring that makes each of those existing flows independently reportable as its own funnel, closing the gap identified in the traceability review.

- [ ] T055 [P] Funnel-journey tagging service: tag every funnel-relevant page/action with its funnel type (A–G) for attribution/reporting in `backend/src/modules/funnel/funnel-journey-tagger.service.ts` (FR-059)
- [ ] T056 Funnel C (Assessment) tracking: Traffic → Assessment → Personalized Result → Signup → Recommended Learning Path event wiring in `backend/src/modules/funnel/funnel-c-assessment.service.ts` (FR-059) — assessment mechanics owned by `003`'s onboarding assessment; this task only wires funnel-stage tracking around it
- [ ] T057 Funnel D (Membership) tracking: Traffic → Membership Page → Pricing → Checkout → Onboarding event wiring in `backend/src/modules/funnel/funnel-d-membership.service.ts` (FR-059)
- [ ] T058 Funnel E (Course) tracking: Content Page → Course Detail → Checkout → Learning event wiring in `backend/src/modules/funnel/funnel-e-course.service.ts` (FR-059)
- [ ] T059 Funnel F (Event) tracking: Event Page → Registration → Attendance → Replay → Upsell event wiring in `backend/src/modules/funnel/funnel-f-event.service.ts` (FR-059) — depends on T024/T025's Events pages
- [ ] T060 Funnel G (Mentor) tracking: Mentor Profile → Session Selection → Signup → Payment → Booking event wiring in `backend/src/modules/funnel/funnel-g-mentor.service.ts` (FR-059) — depends on T022/T023's Mentor pages
- [ ] T061 Integration test: all 7 funnels (A–G) each produce a reconstructable visitor→conversion journey in `backend/tests/integration/funnel-abcdefg-coverage.integration.test.ts` (FR-059, SC-003)

**Checkpoint**: All 7 documented funnel architectures independently trackable and reportable.

---

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

- [ ] T080 [P] [US8] Consent-gated abandoned-checkout recovery job in `backend/src/modules/checkout-tracking/cart-recovery.service.ts` (FR-071, acceptance scenarios 1–2)
- [ ] T081 [US8] Consent withdrawal endpoint with immediate-effect enforcement (no further sends on that channel) in `backend/src/modules/consent/consent-withdrawal.service.ts` (FR-102, acceptance scenario 3, Constitution Article VI)
- [ ] T082 [US8] Cookie-consent-category script gating (Essential always-on; Analytics/Marketing/Personalization gated) in `web/src/components/layout/cookie-consent.tsx` (FR-010, acceptance scenario 4)
- [ ] T083 [US8] Integration test: consented vs. non-consented recovery send, withdrawal-stops-sends, category-gated script loading in `backend/tests/integration/us8-consent-recovery.integration.test.ts` (all 4 acceptance scenarios)

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
- [ ] T093 **[NEW]** Contract test: forged/unsigned/tampered payment webhook is rejected in `backend/tests/contract/webhook-signature-rejection.contract.test.ts` — asserts the checkout-state service (T049) never transitions to `Success` on a webhook whose signature fails verification, and that the event is logged as a security event rather than silently dropped (FR-104) — closes the negative-test gap identified in the traceability review

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
