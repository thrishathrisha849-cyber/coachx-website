---
description: "Task list for Feature 023 — Landing Pages, Forms & Lead Capture"
---

# Tasks: Landing Pages, Forms & Lead Capture

**Input**: Design documents from `/specs/023-landing-pages-lead-capture/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s CDP and `013`'s CRM expose write-capable APIs, and `025`'s AI infrastructure exists, though it does not require their full feature completion to build its own builder/capture engine.

**Tests**: Included throughout — lead-sync-speed, attribution-immutability, and gated-asset-access get dedicated Foundational contract tests, matching this spec's own SC-003, SC-005, and User Story 4.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Lead Sync Integration/SEO remainder FR-029, FR-034–FR-035).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `019`'s CDP, `013`'s CRM, and `025`'s AI infrastructure exist
- [ ] T002 Resolve `research.md` open items before proceeding: cross-device form-resume identity-linking behavior, duplicate-submission dedupe key/rule, incomplete-form partial-lead capture behavior, and the data-retention/purge policy for submission/lead PII
- [ ] T003 [P] Add `backend/src/modules/{landing-page-builder,form-builder,lead-capture,lead-magnet,lead-sync,landing-ai-assistant,landing-ab-testing,landing-seo,landing-analytics}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Landing Page`, `Page Template`, `Page Component` entities in `backend/src/modules/landing-page-builder/landing-page.entity.ts` (Key Entities)
- [ ] T005 [P] Define the `Brand Kit` entity in `backend/src/modules/landing-page-builder/brand-kit.entity.ts`
- [ ] T006 [P] Define `Form`, `Form Field`, `Conditional Rule` entities in `backend/src/modules/form-builder/form.entity.ts`
- [ ] T007 [P] Define the `Submission` entity in `backend/src/modules/lead-capture/submission.entity.ts`
- [ ] T008 [P] Define the `Lead` entity in `backend/src/modules/lead-capture/lead.entity.ts`
- [ ] T009 [P] Define the `UTM`/`Acquisition Metadata` entity, immutable on creation, in `backend/src/modules/lead-capture/acquisition-metadata.entity.ts`
- [ ] T010 [P] Define the `Lead Magnet` entity in `backend/src/modules/lead-magnet/lead-magnet.entity.ts`
- [ ] T011 [P] Define the `A/B Test`/`Experiment` entity in `backend/src/modules/landing-ab-testing/ab-test.entity.ts`
- [ ] T012 [P] Define the `Funnel Stage Event` entity in `backend/src/modules/landing-analytics/funnel-stage-event.entity.ts`
- [ ] T013 [P] Define the `SEO Metadata` entity in `backend/src/modules/landing-seo/seo-metadata.entity.ts`
- [ ] T014 Implement the drag-and-drop page builder core (infinite canvas, no HTML/CSS required), wired to T004, in `backend/src/modules/landing-page-builder/page-builder.service.ts` (FR-001)
- [ ] T015 Implement responsive rendering across device breakpoints (FR-002)
- [ ] T016 Implement auto-save, version history, and undo/redo in `backend/src/modules/landing-page-builder/version-control.service.ts` (FR-003)
- [ ] T017 Implement the grid system, organization-wide global styles, and reusable sections (FR-004)
- [ ] T018 Note: RBAC reuses `001`/`016`'s layered model directly for page/form create/edit/publish/delete actions (Constitution Article VII)
- [ ] T019 Note: consent for personalization/analytics tracking is deferred to the platform's shared identity/consent system (Constitution Article VI)
- [ ] T020 Note: the Countdown Timer component and any urgency-oriented page element are subject to the platform-wide no-dark-patterns prohibition (Constitution Article III)
- [ ] T021 Contract test: a completed form submission creates a lead record synced to both the CDP and CRM within seconds, in `backend/tests/contract/landing-lead-sync-speed.contract.test.ts` (FR-028, SC-003)
- [ ] T022 Contract test: a lead's original acquisition source and UTM attribution are never overwritten by later visitor interactions, in `backend/tests/contract/landing-attribution-immutability.contract.test.ts` (FR-024, SC-005)
- [ ] T023 Contract test: a gated lead-magnet asset denies access until the required form is completed, in `backend/tests/contract/landing-gated-asset-access.contract.test.ts` (User Story 4)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Build and Publish a Landing Page Without Code (P1) 🎯 MVP

**Independent Test**: Have a marketer with no engineering support pick a template, drag in components, apply brand styling, and publish a live, responsive page at a custom URL — with zero code written.

- [ ] T024 [US1] Pre-built template library (Lead Generation, Product Marketing, Business Pages, Seasonal Pages categories), wired to T004 (FR-005)
- [ ] T025 [US1] Template duplication/customization into a new landing page (FR-006)
- [ ] T026 [US1] Brand Kit configuration (logo, brand colors, typography, buttons, border radius, shadows, icons, backgrounds, header, footer), wired to T005 (FR-007)
- [ ] T027 [US1] Automatic brand-kit application to new pages (FR-008, acceptance scenario 3)
- [ ] T028 [US1] Page component library (Heading, Paragraph, Images, Videos, Hero Banner, Countdown Timer, CTA Button, Pricing Table, Testimonial Carousel, FAQ Accordion, Progress Bar, Icons, Divider, Forms, Maps, Custom HTML, Dynamic Content Blocks) in `web/src/app/(marketing-admin)/landing-pages/builder/[pageId]/page.tsx` (FR-009, acceptance scenario 1)
- [ ] T029 [US1] Per-component responsive and accessibility configuration (FR-010)
- [ ] T030 [US1] Dynamic content personalization by visitor attribute (returning/new, premium/free, referral source, geography, language, device, campaign source, segment), with no page reload (FR-011)
- [ ] T031 [US1] Page publish (custom URL, public reachability, cross-breakpoint rendering) (acceptance scenario 4)
- [ ] T032 [P] [US1] Page builder canvas UI polish
- [ ] T033 [US1] Integration test: component drag auto-saves, version history view-and-restore, brand settings auto-applied, publish live and responsive — all 4 acceptance scenarios in `backend/tests/integration/us1-page-builder.integration.test.ts`

**Checkpoint**: The entry point for every other capability in this chapter — build and publish without code — is independently functional.

---

## Phase 4: User Story 2 — Visitor Completes a Multi-Step Form With Conditional Logic and Resume (P1)

**Independent Test**: Submit partial answers on step 1, verify step 2 renders conditionally, abandon before the final step, return later, and confirm the form resumes with previously entered data intact.

- [ ] T034 [US2] Unlimited custom form creation, wired to T006 (FR-012)
- [ ] T035 [US2] Form field-type catalog (Text, Email, Phone Number, Password, Number, Date, Time, Dropdown, Radio Button, Checkbox, Multi-select, File Upload, Signature, Address, Country Selector, OTP Verification, Hidden Fields) (FR-013)
- [ ] T036 [US2] Field required/optional/conditional configuration (FR-014)
- [ ] T037 [US2] Conditional field logic (show/skip/dynamic-recommend based on prior answers), wired to the conditional-rule engine, in `backend/src/modules/form-builder/conditional-logic.service.ts` (FR-015, acceptance scenario 1)
- [ ] T038 [US2] AND/OR/NOT nested conditional-rule combinations (FR-017)
- [ ] T039 [US2] Auto-fill from known customer data plus real-time input validation (FR-016, acceptance scenario 4)
- [ ] T040 [US2] Multi-step division with progress indicator and Previous/Next navigation, mobile-optimized (FR-018, FR-021)
- [ ] T041 [US2] Per-step independent validation before progression (FR-020, acceptance scenario 2)
- [ ] T042 [US2] Multi-step auto-save plus resume-from-last-step, wired to T007, in `backend/src/modules/form-builder/multistep-resume.service.ts` (FR-019, acceptance scenario 3)
- [ ] T043 [P] [US2] Multi-step form UI
- [ ] T044 [US2] Integration test: conditional field shown or skipped, per-step validation blocks progression, resume at step 3 with prior data, auto-fill editable — all 4 acceptance scenarios in `backend/tests/integration/us2-multistep-form.integration.test.ts`

**Checkpoint**: The mechanism to "improve completion rates" — the central conversion metric of the module — is independently functional.

---

## Phase 5: User Story 3 — Submission Becomes a Lead, Synced Instantly With Full Attribution (P1)

**Independent Test**: Submit a form via a URL containing UTM parameters and confirm a lead record with all captured fields appears in the CDP and CRM within seconds of submission.

- [ ] T045 [US3] Lead-record creation on every completed submission, wired to T008 (FR-022, acceptance scenario 1)
- [ ] T046 [US3] Full lead field capture (Lead ID, Name, Email, Phone, Company, Source Campaign, Landing Page, Device, Browser, IP, Country, Language, Timestamp, UTM Parameters), wired to T009 (FR-023, acceptance scenario 1)
- [ ] T047 [US3] 13-source lead-origin tracking with immutable original-source retention, wired to T022's contract test (FR-024, acceptance scenario 3)
- [ ] T048 [US3] CDP/CRM sync pipeline within seconds, wired to T021's contract test and `019`/`013` (FR-028, acceptance scenario 2)
- [ ] T049 [US3] Post-submission redirect (Thank You Page, Product Page, Webinar Room, Payment Gateway, Community, Course Dashboard, Ebook Reader, AI Assistant) with personalized message (FR-026, acceptance scenario 4)
- [ ] T050 [P] [US3] Post-submission confirmation UI
- [ ] T051 [US3] Integration test: full-field lead creation with UTM capture, CDP-and-CRM sync within seconds, source not overwritten by later interaction, redirect to configured destination — all 4 acceptance scenarios in `backend/tests/integration/us3-lead-capture-sync.integration.test.ts`

**Checkpoint**: The module's stated purpose — the primary lead acquisition engine — is independently functional.

---

## Phase 6: User Story 4 — Lead Magnet Gated Behind Form Completion (P2)

**Independent Test**: Attempt to access a gated asset without submitting the form (confirming access is denied), then submit the form and confirm the asset becomes accessible.

- [ ] T052 [US4] Lead magnet asset catalog (PDF Guides, E-books, Whitepapers, Checklists, Templates, Videos, Audio Files, Coupons, Discount Codes, Free Trials), wired to T010 (FR-025)
- [ ] T053 [US4] Gated-access denial before form completion, wired to T023's contract test (acceptance scenario 1)
- [ ] T054 [US4] Post-submission asset-access grant (acceptance scenario 2)
- [ ] T055 [P] [US4] Gated lead-magnet page UI
- [ ] T056 [US4] Integration test: pre-submission access denied with prompt, post-submission access granted — both acceptance scenarios in `backend/tests/integration/us4-gated-lead-magnet.integration.test.ts`

**Checkpoint**: The primary incentive mechanism driving form completion is independently functional.

---

## Phase 7: User Story 5 — A/B Test a Page and Auto-Promote the Winner (P2)

**Independent Test**: Configure two page variants differing in one tested element, run traffic to both, and confirm the system promotes the higher-performing variant to be the default page without manual intervention.

- [ ] T057 [US5] A/B test configuration (headlines, images, CTA buttons, colors, forms, testimonials, pricing, layouts), wired to T011 (FR-032, acceptance scenario 1)
- [ ] T058 [US5] Traffic split plus independent per-variant performance tracking (acceptance scenario 1)
- [ ] T059 [US5] Automatic winner promotion to the default page on the winning condition, wired to `026`'s methodology, in `backend/src/modules/landing-ab-testing/winner-promotion.service.ts` (FR-033, acceptance scenario 2)
- [ ] T060 [US5] In-progress-test edit-warning in the builder (acceptance scenario 3)
- [ ] T061 [P] [US5] A/B test configuration and results UI
- [ ] T062 [US5] Integration test: traffic split and independent tracking, automatic winner promotion, edit warning during an active test — all 3 acceptance scenarios in `backend/tests/integration/us5-ab-testing.integration.test.ts`

**Checkpoint**: The top-level module objective of maximizing conversion rate through experimentation is independently functional.

---

## Phase 8: User Story 6 — AI Assistant Drafts and Optimizes Page Content, Subject to Human Review (P3)

**Independent Test**: Request AI-generated headline/CTA/SEO suggestions for a draft page, confirm the suggestions populate as editable content, edit one suggestion, and confirm the edited version — not the raw AI output — is what publishes.

- [ ] T063 [US6] AI Landing Page Assistant (generation, copywriting, CTA optimization, headline suggestions, image recommendations, SEO optimization, conversion predictions, readability improvements, mobile optimization, accessibility checks) consuming `025`'s (and transitively `008`'s) infrastructure, in `backend/src/modules/landing-ai-assistant/ai-landing-assistant.service.ts` (FR-030, acceptance scenario 1)
- [ ] T064 [US6] Editable-suggestion-not-auto-published enforcement (FR-031, acceptance scenario 1)
- [ ] T065 [US6] Per-suggestion accept/edit/discard for the SEO optimization pass (acceptance scenario 2)
- [ ] T066 [US6] Graceful degradation to full manual editing on AI-service failure/timeout (acceptance scenario 3)
- [ ] T067 [P] [US6] AI Landing Page Assistant UI
- [ ] T068 [US6] Integration test: suggestions appear as editable and not published, per-suggestion accept/edit/discard, manual editing unaffected by AI failure — all 3 acceptance scenarios in `backend/tests/integration/us6-ai-landing-assistant.integration.test.ts`

**Checkpoint**: The AI-accelerated content-creation enhancement, safely gated, is independently functional.

---

## Phase 9: User Story 7 — Marketing Ops Monitors the Acquisition Funnel (P3)

**Independent Test**: Generate traffic and submissions against a live page, then confirm the analytics dashboard reflects accurate visitor, CTA-click, form-start/completion, and conversion-rate figures with campaign, geographic, and device filters.

- [ ] T069 [US7] 8-stage funnel tracking (Visitor → Landing Page View → CTA Click → Form Started → Form Completed → Lead Created → Qualified Lead → Customer) with conversion/drop-off metrics, wired to T012 (FR-027)
- [ ] T070 [US7] Analytics dashboard (Visitors, Unique Visitors, Bounce Rate, Time on Page, Scroll Depth, CTA Clicks, Form Starts, Form Completions, Conversion Rate, Revenue Attribution) in `web/src/app/(marketing-admin)/landing-pages/analytics/page.tsx` (FR-036, acceptance scenario 1)
- [ ] T071 [US7] Real-time monitoring plus historical comparison plus campaign/geographic/device filters (FR-037, acceptance scenarios 2, 3)
- [ ] T072 [P] [US7] Funnel analytics dashboard UI polish
- [ ] T073 [US7] Integration test: metrics reflect activity within 30s, campaign filter scopes the funnel metrics, historical comparison view functions — all 3 acceptance scenarios in `backend/tests/integration/us7-funnel-analytics.integration.test.ts`

**Checkpoint**: What turns individual page/form data into actionable optimization decisions is independently functional.

---

## Phase 10: Lead Sync Integration, SEO & remainder (supports FR-029, FR-034–FR-035; cross-cutting, no single owning story)

- [ ] T074 Integration framework (Email/SMS/WhatsApp Marketing, Push Notifications, Payment Gateway, Webinar Platform, Calendar Booking, AI Assistant, Workflow Engine, third-party APIs), wired to T048 (FR-029)
- [ ] T075 SEO configuration (Meta Title, Meta Description, Open Graph Tags, Twitter Cards, Structured Data, Canonical URLs, XML Sitemap inclusion, Robots Configuration, Custom URLs, Schema.org Markup), wired to T013 (FR-034)
- [ ] T076 Live-updating SEO score as the marketer edits SEO fields and page content (FR-035)

**Checkpoint**: The cross-module integration surface and search/social discoverability tooling are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T077 [P] Security hardening pass (RBAC, CAPTCHA/reCAPTCHA, CSRF protection, rate limiting, server-side input validation, file-upload scanning, audit logging, HTTPS enforcement, encryption in transit/at rest) (FR-038–FR-042)
- [ ] T078 Performance hardening pass toward all 6 numeric targets (page load, form render, submission processing, lead creation, analytics update, AI suggestions) (FR-043)
- [ ] T079 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (cross-device resume identity linking, duplicate-submission dedupe rule, incomplete-form partial-lead capture, PII retention/purge policy)
- [ ] T080 Final audit: cross-check every FR-001–FR-043 against an implementation or validation task; verify this feature hands off to `024` at "Lead Created" and defers CDP/CRM/AI/A-B-methodology ownership to `019`/`013`/`025`/`026` rather than duplicating them
- [ ] T081 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s CDP, `013`'s CRM, and `025`'s AI infrastructure, and produces the builder/form/lead entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (page builder) is the entry point for every other capability and must ship first; US2 (multi-step forms) depends on US1's page/component infrastructure to embed a form on; US3 (lead capture/sync) depends on US2's form-submission mechanics producing something to capture.
- **P2 stories (US4–US5)**: US4 (gated lead magnet) depends on US2/US3's form/lead infrastructure; US5 (A/B testing) depends on US1's published page and US3's lead-flow data — both can build in parallel once US1–US3 are stable.
- **P3 stories (US6–US7)**: US6 (AI assistant) depends on US1's builder and `025`'s AI infrastructure; US7 (funnel analytics) depends on US1–US5 producing real traffic/lead/experiment data to analyze — both can build in parallel.
- **Phase 10 (Lead Sync Integration/SEO remainder)** depends on Foundational and US3's lead-sync pipeline; can build in parallel with US4–US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (builder core, form/lead entities, CDP/CRM sync scaffolding) → **STOP and VALIDATE** the three Foundational contract tests (lead-sync-speed, attribution-immutability, gated-asset-access) pass → US1 (page builder) → **STOP and VALIDATE** a non-technical marketer can build and publish a page end to end → US2 (multi-step forms) → US3 (lead capture/sync) → **STOP and VALIDATE** the core acquisition loop — build, capture, sync — works reliably → US4 (gated lead magnet) + US5 (A/B testing) in parallel → US6 (AI assistant) + US7 (funnel analytics) in parallel → Phase 10 (lead sync integration/SEO) → Polish.
