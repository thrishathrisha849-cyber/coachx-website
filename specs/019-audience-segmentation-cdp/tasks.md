---
description: "Task list for Feature 019 — Audience Management, Segmentation & Customer Data Platform"
---

# Tasks: Audience Management, Segmentation & Customer Data Platform

**Input**: Design documents from `/specs/019-audience-segmentation-cdp/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `015`'s platform event spine, `016`'s RBAC model, and `008`'s AI gateway exist as integration points, though it does not require their full feature completion to build its own CDP core.

**Tests**: Included throughout — unified-profile-no-duplicates, dynamic-segment-auto-refresh, and consent-propagation get dedicated Foundational contract tests, matching this spec's own User Story 1 acceptance scenario 3, SC-002, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Timeline/Analytics/Performance remainder FR-012–FR-013, FR-039–FR-042).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `015`'s event spine and `008`'s AI gateway exist
- [ ] T002 Resolve `research.md` open items before proceeding: field-level merge-conflict precedence for automatic duplicate merges, consent-merge precedence when duplicate profiles with conflicting consent are merged, consent-history retention duration, degradation behavior when score recalculation misses its 2-minute target, custom-attribute-deletion segment-invalidation behavior, and bulk-import partial-validity handling
- [ ] T003 [P] Add `backend/src/modules/{cdp-profile,cdp-timeline,cdp-segmentation,cdp-tags,cdp-import-export,cdp-data-quality,cdp-ai-segmentation,cdp-scoring,cdp-consent,cdp-analytics}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Unified Customer Profile` entity (Identity, Account, Engagement, Transaction, Communication Preference fields) in `backend/src/modules/cdp-profile/unified-profile.entity.ts` (FR-006–FR-011)
- [ ] T005 [P] Define the `Customer Timeline Event` entity in `backend/src/modules/cdp-timeline/timeline-event.entity.ts` (FR-012)
- [ ] T006 [P] Define `Segment` and `Segment Rule`/`Rule Group` entities in `backend/src/modules/cdp-segmentation/segment.entity.ts` (FR-014)
- [ ] T007 [P] Define the `Custom Attribute` entity in `backend/src/modules/cdp-segmentation/custom-attribute.entity.ts` (FR-016)
- [ ] T008 [P] Define the `Tag`/`Label` entity in `backend/src/modules/cdp-tags/tag.entity.ts` (FR-020)
- [ ] T009 [P] Define the `AI-Generated Segment Proposal` entity in `backend/src/modules/cdp-ai-segmentation/segment-proposal.entity.ts` (FR-028)
- [ ] T010 [P] Define the `Customer Score` entity (Engagement, Purchase, Loyalty, Churn Risk types) in `backend/src/modules/cdp-scoring/customer-score.entity.ts` (FR-030–FR-033)
- [ ] T011 [P] Define the `Consent Record` entity in `backend/src/modules/cdp-consent/consent-record.entity.ts` (FR-035, FR-036, Constitution Article VI)
- [ ] T012 [P] Define `Data Quality Flag`/`Duplicate Merge Record` entities in `backend/src/modules/cdp-data-quality/data-quality-flag.entity.ts` (FR-025)
- [ ] T013 [P] Define `Audience Import Job`/`Audience Export Job` entities in `backend/src/modules/cdp-import-export/audience-job.entity.ts` (FR-022, FR-023)
- [ ] T014 Implement the multi-source event-ingestion pipeline (16 connected modules), wired to `015`'s event bus, in `backend/src/modules/cdp-profile/event-ingestion.service.ts` (FR-002)
- [ ] T015 Implement deterministic exact-match identity resolution/deduplication-on-ingest (email/phone matching) in `backend/src/modules/cdp-profile/identity-resolution.service.ts` (FR-006)
- [ ] T016 Implement real-time profile enrichment across every triggering interaction type in `backend/src/modules/cdp-profile/profile-enrichment.service.ts` (FR-038)
- [ ] T017 Implement scale architecture for millions of profiles without degrading segmentation/scoring/search performance (FR-004)
- [ ] T018 Note: RBAC and export governance reuse `016`'s model directly — this feature applies it, it does not define a CDP-specific role system (Constitution Article VII)
- [ ] T019 Note: consent-*collection* mechanics (opt-in UI, double opt-in, policy-version prompts) are owned by `002`/`003` — this feature owns only Consent Record storage, retrieval, and propagation
- [ ] T020 Contract test: exactly one master profile exists per customer across concurrent multi-source ingestion, with zero duplicate profile creation, in `backend/tests/contract/cdp-unified-profile-no-duplicates.contract.test.ts` (User Story 1 acceptance scenario 3)
- [ ] T021 Contract test: dynamic segment membership refreshes automatically within 30 seconds of an underlying data change, with no manual re-run required, in `backend/tests/contract/cdp-dynamic-segment-auto-refresh.contract.test.ts` (FR-014, SC-002)
- [ ] T022 Contract test: a consent withdrawal is reflected in segment membership, export data, and automation eligibility before any subsequent send on the withdrawn channel, in `backend/tests/contract/cdp-consent-propagation.contract.test.ts` (FR-035, SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Unified Profile Aggregation in Near Real Time (P1) 🎯 MVP

**Independent Test**: Trigger a single interaction in one source module and verify the customer's unified profile reflects the update within the stated synchronization target, with exactly one profile existing for that customer.

- [ ] T023 [US1] Single-source-of-truth unified profile build from all connected TBT modules, wired to T004, in `backend/src/modules/cdp-profile/unified-profile.service.ts` (FR-001)
- [ ] T024 [US1] Identity Information capture (Customer ID, Full Name, Username, Email, Mobile, Photo, Gender, DOB, Language, Country, State, City, Timezone) (FR-007)
- [ ] T025 [US1] Account Information capture (Registration Date, Membership Type, Account Status, Referral Code/Source, Subscription Status, Loyalty Tier) (FR-008)
- [ ] T026 [US1] Engagement Information capture (Login Frequency, Last Login, Session Count, Community Activity, Course Progress, Podcast History, Ebook Progress, Event Participation, Support Interactions) (FR-009, acceptance scenario 2)
- [ ] T027 [US1] Transaction Information capture (Purchases, Total Revenue, Refunds, Wallet Balance, Reward Points, Coupon Usage, AOV, LTV) (FR-010, acceptance scenario 1)
- [ ] T028 [US1] Communication Preferences capture (Email/SMS/WhatsApp Opt-in, Push Preference, Language Preference, Preferred Time) (FR-011)
- [ ] T029 [US1] Cross-module same-customer merge-on-ingest, wired to T015/T020 (acceptance scenario 3)
- [ ] T030 [US1] Profile-update propagation within 5s across all read surfaces (Admin Portal, mobile app), wired to T016 (acceptance scenario 4)
- [ ] T031 [P] [US1] Unified customer profile view UI in `web/src/app/(marketing-admin)/audience/profiles/[profileId]/page.tsx`
- [ ] T032 [US1] Integration test: marketplace purchase updates Transaction Info within 5s, login updates Engagement Info within 5s, cross-module dedup produces one profile, mobile-app update propagates within 5s and is visible in Admin Portal — all 4 acceptance scenarios in `backend/tests/integration/us1-unified-profile.integration.test.ts`

**Checkpoint**: The foundation the entire CDP and every downstream Volume 14 feature reads from is independently functional.

---

## Phase 4: User Story 2 — Build a Dynamic Segment via the Visual Audience Builder (P1)

**Independent Test**: Create a segment such as "Spent more than ₹10,000 in the last 30 days AND opened the last 5 campaigns," confirm the size estimate displays before saving, and confirm membership is populated correctly.

- [ ] T033 [US2] Static and dynamic segment support with self-maintaining membership, wired to T006/T021, in `backend/src/modules/cdp-segmentation/segment-lifecycle.service.ts` (FR-014)
- [ ] T034 [US2] Segment-rule attribute catalog (Demographic, Behavioral, Transactional, Marketing Engagement), wired to T004 (FR-015)
- [ ] T035 [US2] Custom Attribute definition plus segment-rule availability, wired to T007 (FR-016)
- [ ] T036 [US2] Visual Audience Builder (AND/OR/NOT logic, 10 comparison operators) in `web/src/components/marketing/audience-builder.tsx` (FR-017, acceptance scenario 1)
- [ ] T037 [US2] Nested rule groups plus saved/reusable rule templates (FR-018, acceptance scenario 2)
- [ ] T038 [US2] Rule validation, audience-size estimate, and duplicate-segment-definition detection in `backend/src/modules/cdp-segmentation/segment-validation.service.ts` (FR-019, acceptance scenarios 1, 4)
- [ ] T039 [US2] Dynamic-segment auto-removal on membership-criteria change within 30s, wired to T021 (acceptance scenario 3)
- [ ] T040 [P] [US2] Audience Builder UI polish
- [ ] T041 [US2] Integration test: size estimate before save, nested-rule-group validation, auto-removal on criteria change, duplicate segment flagged — all 4 acceptance scenarios in `backend/tests/integration/us2-audience-builder.integration.test.ts`

**Checkpoint**: The core value proposition of the CDP — precise, self-maintaining audience targeting — is independently functional.

---

## Phase 5: User Story 3 — View a Customer's Engagement, Purchase, Loyalty, and Churn-Risk Scores (P2)

**Independent Test**: After sufficient activity and transaction history exists for a customer, open their profile and confirm all four scores render with values consistent with the underlying factors.

- [ ] T042 [US3] Engagement Score computation (logins, community participation, content consumption, campaign interactions), wired to T010, in `backend/src/modules/cdp-scoring/engagement-score.service.ts` (FR-030, acceptance scenario 1)
- [ ] T043 [US3] Churn Risk Score computation (inactivity, declining engagement, unopened campaigns, subscription expiry) in `backend/src/modules/cdp-scoring/churn-risk-score.service.ts` (FR-033, acceptance scenario 2)
- [ ] T044 [US3] Purchase Score computation (spending, frequency, AOV, refund behavior) plus auto-update on new data in `backend/src/modules/cdp-scoring/purchase-score.service.ts` (FR-031, acceptance scenario 3)
- [ ] T045 [US3] Loyalty Score computation (membership duration, referrals, event participation, reward points) in `backend/src/modules/cdp-scoring/loyalty-score.service.ts` (FR-032, acceptance scenario 4)
- [ ] T046 [US3] Automatic score recalculation on relevant data change without a manual trigger, within the 2-minute target (FR-034, SC-003)
- [ ] T047 [P] [US3] Score display UI on the customer profile
- [ ] T048 [US3] Integration test: Engagement Score reflects activity factors, Churn Risk elevated for an at-risk customer, Purchase Score auto-updates on new purchase, Loyalty Score reflects tenure/referrals/events — all 4 acceptance scenarios in `backend/tests/integration/us3-customer-scores.integration.test.ts`

**Checkpoint**: The prioritization signal for outreach, personalization, and retention effort is independently functional.

---

## Phase 6: User Story 4 — AI-Discovered Segment Surfaces an Upsell Opportunity (P2)

**Independent Test**: Run the AI segmentation engine against a seeded profile set, verify it proposes an "Upsell Opportunities" candidate segment, and verify a human administrator must explicitly review and save it before it is usable by campaign tools.

- [ ] T049 [US4] AI segmentation engine (High Conversion Probability, Churn Risk, Upsell Opportunities, Cross-Sell Opportunities, Loyal Customers, Brand Advocates, Dormant Users, Potential Affiliates categories) consuming `008`'s gateway, wired to T009, in `backend/src/modules/cdp-ai-segmentation/ai-segment-engine.service.ts` (FR-028, acceptance scenario 1)
- [ ] T050 [US4] AI-proposal review/edit UI before save (acceptance scenario 2)
- [ ] T051 [US4] Unreviewed-proposal exclusion from campaign-tool-usable active segments, wired to T022's Article II discipline (acceptance scenario 3)
- [ ] T052 [US4] Save-as-is activation identical to a manually created segment (acceptance scenario 4)
- [ ] T053 [P] [US4] AI segment proposal review UI in `web/src/app/(marketing-admin)/audience/ai-segments/page.tsx`
- [ ] T054 [US4] Integration test: AI proposes candidate segments, admin can edit before save, unreviewed proposal unusable by campaigns, saved-as-is becomes a standard active segment — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-segmentation.integration.test.ts`

**Checkpoint**: The additive, AI-driven audience-discovery capability with mandatory human review is independently functional.

---

## Phase 7: User Story 5 — Consent-Respecting Audience Export (P2)

**Independent Test**: Export a previously built static segment as CSV, confirm only fields the requesting role is permitted to see are included, and confirm the export completes within the stated performance target.

- [ ] T055 [US5] Audience import (CSV/Excel/JSON, field mapping, duplicate detection, validation, preview, error reporting), wired to T013 (FR-022)
- [ ] T056 [US5] Audience export (CSV/Excel/JSON/PDF summary) within 30s for 100K records, wired to T013 (FR-023, acceptance scenario 1)
- [ ] T057 [US5] RBAC-governed export access denial for unauthorized roles, wired to `016`/T018 (FR-024, acceptance scenario 3)
- [ ] T058 [US5] Consent-status inclusion in export data for downstream send eligibility, wired to T011/T022 (acceptance scenario 2)
- [ ] T059 [US5] Sensitive-field masking in export output per role visibility (acceptance scenario 4)
- [ ] T060 [P] [US5] Export configuration UI in `web/src/app/(marketing-admin)/audience/segments/[segmentId]/export/page.tsx`
- [ ] T061 [US5] Integration test: 50K-record CSV export within 30s, consent status included for withdrawn-consent customers, unauthorized export denied, sensitive fields masked — all 4 acceptance scenarios in `backend/tests/integration/us5-consent-export.integration.test.ts`

**Checkpoint**: The mechanism by which segments become operational in downstream channel tools, safely, is independently functional.

---

## Phase 8: User Story 6 — Manage Tags & Labels on Customer Profiles (P3)

**Independent Test**: Manually assign a tag to a single customer profile and confirm it is visible on the profile and usable as a filter/segment attribute.

- [ ] T062 [US6] Manual tag assignment to a customer profile, wired to T008 (FR-020, acceptance scenario 1)
- [ ] T063 [US6] Rule-based auto-tagging on threshold crossing (FR-021, acceptance scenario 2)
- [ ] T064 [US6] AI-generated tag assignment, visually distinguished on the profile (FR-021, acceptance scenario 3)
- [ ] T065 [P] [US6] Tag management UI
- [ ] T066 [US6] Integration test: manual tag visible on profile, rule-based auto-tag on threshold, AI-generated tag visually distinguished — all 3 acceptance scenarios in `backend/tests/integration/us6-tags-labels.integration.test.ts`

**Checkpoint**: The organizational and targeting aid layered on top of profiles and segmentation is independently functional.

---

## Phase 9: User Story 7 — Data Quality Deduplication & Validation (P3)

**Independent Test**: Seed two customer records sharing the same email address from two different source modules, run the data-quality process, and verify the records are automatically merged or flagged with an administrator notification.

- [ ] T067 [US7] Continuous validation (duplicate email/phone, invalid formats, missing mandatory fields, inconsistent values, orphaned records), wired to T012 (FR-025)
- [ ] T068 [US7] Automatic duplicate-record merge (FR-026, acceptance scenario 1)
- [ ] T069 [US7] Invalid/missing-field record flagging plus administrator notification (FR-026, FR-027, acceptance scenarios 2, 3)
- [ ] T070 [P] [US7] Data quality review admin UI in `web/src/app/(marketing-admin)/audience/data-quality/page.tsx`
- [ ] T071 [US7] Integration test: same-email duplicates auto-merged, malformed phone flagged and notified, missing mandatory field flagged and notified — all 3 acceptance scenarios in `backend/tests/integration/us7-data-quality.integration.test.ts`

**Checkpoint**: The long-term integrity guarantee protecting the CDP's single-source-of-truth status is independently functional.

---

## Phase 10: Timeline, Analytics & Performance remainder (supports FR-012–FR-013, FR-039–FR-042; cross-cutting, no single owning story)

- [ ] T072 Customer timeline filter/search/export/date-range selection, wired to T005 (FR-013)
- [ ] T073 Profile/segment/lookup performance targets (search under 500ms, segment creation under 2s, lookup under 300ms) (FR-040, SC-004, SC-005)
- [ ] T074 [P] Audience analytics dashboards (Audience growth, Geographic distribution, Device usage, Membership breakdown, Revenue segmentation, Engagement trends, Cohort analysis, Churn analysis, Customer lifetime value) in `web/src/app/(marketing-admin)/audience/analytics/page.tsx` (FR-041)
- [ ] T075 Analytics dashboard filtering, exporting, and scheduled reporting (FR-042)

**Checkpoint**: The full timeline browsing and audience-analytics surface is independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T076 [P] Security hardening pass (RBAC/field-level access control, encryption at rest/in transit, audit logging, secure export mechanisms, data masking, rate limiting on bulk operations) (FR-043–FR-045)
- [ ] T077 Performance hardening pass toward all remaining numeric targets (profile update, AI score recalculation, millions-of-profiles scale) (FR-039, SC-001, SC-003, SC-007)
- [ ] T078 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (merge-conflict precedence, consent-merge precedence, consent-history retention, score-recalculation degradation behavior, custom-attribute-deletion behavior, bulk-import partial-validity handling)
- [ ] T079 Final audit: cross-check every FR-001–FR-045 against an implementation or validation task; verify this feature is consumed by, not duplicated by, downstream features `020`–`032`
- [ ] T080 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `015`'s event spine, `016`'s RBAC, and `008`'s AI gateway, and produces the unified-profile/consent infrastructure every subsequent phase and every downstream Volume 14 feature depends on.
- **P1 stories (US1–US2)**: US1 (unified profile) is the foundation of the entire CDP and must ship first; US2 (Audience Builder) depends on US1's profile fields existing to build rules against.
- **P2 stories (US3–US5)**: US3 (scores) depends on US1's profile/timeline data; US4 (AI segmentation) depends on US2's segment infrastructure and `008`'s AI gateway; US5 (consent-respecting export) depends on US2's segments existing to export — all three can build in parallel once US1/US2 are stable.
- **P3 stories (US6–US7)**: US6 (tags) depends on US1's profile existing; US7 (data quality) depends on Foundational's dedup entities and benefits from real ingested volume existing — both can build in parallel with each other and with the P2 stories.
- **Phase 10 (Timeline/Analytics/Performance remainder)** depends on Foundational's timeline entity and benefits from US1–US7 producing real data to analyze; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (unified profile, consent, dedup) → **STOP and VALIDATE** the three Foundational contract tests (no-duplicate-profiles, dynamic-segment-auto-refresh, consent-propagation) pass → US1 (unified profile aggregation) → **STOP and VALIDATE** the CDP's single-source-of-truth guarantee works end to end → US2 (Audience Builder) → **STOP and VALIDATE** self-maintaining segmentation works reliably → US3 (customer scores) + US4 (AI segmentation) + US5 (consent-respecting export) in parallel → US6 (tags) + US7 (data quality) in parallel → Phase 10 (timeline/analytics/performance) → Polish.
