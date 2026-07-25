---
description: "Task list for Feature 030 — Referral, Affiliate, Ambassador & Partner Marketing Management"
---

# Tasks: Referral, Affiliate, Ambassador & Partner Marketing Management

**Input**: Design documents from `/specs/030-referral-affiliate-partner-marketing/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `009`'s transactional/order-level affiliate attribution and ledger accounts, and `008`'s AI gateway, exist as integration points — per plan.md's ownership analysis, this feature does **not** redefine `009`'s purchase-layer commission/ledger mechanics.

**Tests**: Included throughout — wallet-ledger immutability, fraud-hold-before-payout, and commission-breakdown reconciliation each get a dedicated Foundational contract test, matching this spec's own SC-003/Constitution Article V, SC-005, and SC-002.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (tracking/codes/attribution; marketing assets/campaigns/communication/program-type-specific management; performance/lifecycle/AI-intelligence/executive dashboard).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `009`'s transactional affiliate layer and `008`'s AI gateway exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: jurisdiction-specific legal thresholds for enabling multi-level commission per program (§33), fraud-score numeric thresholds beyond the stated bands, dispute/onboarding SLA durations, coupon-leakage retroactive-exclusion policy, fraud false-positive appeal path, mid-cascade partner-suspension handling, overlapping-territory conflict resolution, post-payout refund-offset-with-no-future-commissions policy, and simultaneous tier-upgrade/downgrade precedence
- [ ] T003 [P] Add `backend/src/modules/{partner-program-management,partner-recruitment,partner-onboarding,tracking-attribution,commission-engine,multi-level-commission,partner-wallet-payout,fraud-prevention,marketing-assets-campaigns,partner-communication-support,partner-portal-dashboards,partner-performance-lifecycle,program-type-specific,partner-hierarchy-territory,ai-partner-intelligence,partner-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Program` entity in `backend/src/modules/partner-program-management/program.entity.ts`
- [ ] T005 [P] Define the `Partner` entity in `backend/src/modules/partner-program-management/partner.entity.ts`
- [ ] T006 [P] Define the `Partner Application` entity in `backend/src/modules/partner-recruitment/partner-application.entity.ts`
- [ ] T007 [P] Define the `Partner Organization` entity in `backend/src/modules/partner-program-management/partner-organization.entity.ts`
- [ ] T008 [P] Define the `Agreement` entity in `backend/src/modules/partner-onboarding/agreement.entity.ts`
- [ ] T009 [P] Define the `Tracking Link / Referral Code` entity in `backend/src/modules/tracking-attribution/tracking-link.entity.ts`
- [ ] T010 [P] Define the `Campaign` entity in `backend/src/modules/marketing-assets-campaigns/campaign.entity.ts`
- [ ] T011 [P] Define the `Marketing Asset` entity in `backend/src/modules/marketing-assets-campaigns/marketing-asset.entity.ts`
- [ ] T012 [P] Define the `Click` entity in `backend/src/modules/tracking-attribution/click.entity.ts`
- [ ] T013 [P] Define the `Lead` entity in `backend/src/modules/tracking-attribution/lead.entity.ts`
- [ ] T014 [P] Define the `Conversion` entity in `backend/src/modules/tracking-attribution/conversion.entity.ts`
- [ ] T015 [P] Define the `Commission Rule` entity in `backend/src/modules/commission-engine/commission-rule.entity.ts`
- [ ] T016 [P] Define the `Commission` entity in `backend/src/modules/commission-engine/commission.entity.ts`
- [ ] T017 [P] Define the append-only `Partner Wallet` ledger entity in `backend/src/modules/partner-wallet-payout/partner-wallet.entity.ts`
- [ ] T018 [P] Define the `Payout` entity in `backend/src/modules/partner-wallet-payout/payout.entity.ts`
- [ ] T019 [P] Define the `Fraud Risk Score` entity in `backend/src/modules/fraud-prevention/fraud-risk-score.entity.ts`
- [ ] T020 [P] Define the `Fraud Case` entity in `backend/src/modules/fraud-prevention/fraud-case.entity.ts`
- [ ] T021 [P] Define the `Partner Hierarchy Level` entity in `backend/src/modules/partner-hierarchy-territory/partner-hierarchy-level.entity.ts`
- [ ] T022 [P] Define the `Territory` entity in `backend/src/modules/partner-hierarchy-territory/territory.entity.ts`
- [ ] T023 [P] Define the `Partner Tier` entity in `backend/src/modules/partner-performance-lifecycle/partner-tier.entity.ts`
- [ ] T024 [P] Define the `Dispute` entity in `backend/src/modules/partner-communication-support/dispute.entity.ts`
- [ ] T025 [P] Define the immutable `Audit Record` entity in `backend/src/modules/partner-governance/audit-record.entity.ts`
- [ ] T026 Implement 9 program-category support and concurrent-program creation with the full configuration field set, wired to T004 (FR-001–FR-002)
- [ ] T027 Implement the 10-state program status lifecycle with permission-controlled, audit-logged transitions (FR-003)
- [ ] T028 Implement 17-type partner classification with multi-program participation subject to eligibility/conflict rules, wired to T005 (FR-004)
- [ ] T029 Implement the Partner Profile (identity, business, promotional, program information), wired to T005 (FR-005)
- [ ] T030 Contract test: wallet balances are always fully reconstructable as the exact derived sum of ledger transactions, with zero directly-edited balance fields, in `backend/tests/contract/partner-wallet-ledger-immutability.contract.test.ts` (FR-039, SC-003, Constitution Article V)
- [ ] T031 Contract test: no commission reaches "Paid" while an open Critical-band fraud case exists against the same conversion, and at least 95% of self-referral/coupon-leakage cases are held before payout, in `backend/tests/contract/fraud-hold-blocks-payout.contract.test.ts` (FR-047–FR-049, SC-005)
- [ ] T032 Contract test: commission breakdown reconciles exactly with the configured rule for every supported commission model, in `backend/tests/contract/commission-breakdown-reconciliation.contract.test.ts` (FR-035, SC-002)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Affiliate Applies, Gets Verified, and Is Approved into a Program (Priority: P1) 🎯 MVP

**Independent Test**: Submit a partner application through the public form, move it through the review workflow to "Approved," verify the applicant receives a structured onboarding checklist, and confirm they cannot generate a live referral link until onboarding tasks are complete.

- [ ] T033 [US1] Public partner-application landing page (program info, benefits, commission overview, eligibility, FAQ, application form, terms acceptance), wired to T006 (FR-006)
- [ ] T034 [US1] Invitation-based recruitment for administrators (FR-007)
- [ ] T035 [US1] AI-assisted candidate identification (advisory only), consuming `008`'s gateway (FR-008)
- [ ] T036 [US1] Configurable application form (conditional fields, file uploads, save-and-continue, validation, duplicate detection, bot/CAPTCHA protection, mobile responsiveness), wired to acceptance scenario 1 (FR-009)
- [ ] T037 [US1] 12-status application review workflow, wired to acceptance scenarios 1–2 (FR-010)
- [ ] T038 [US1] Reviewer actions (notes, request information, reassign reviewer, schedule interview, approve with conditions, reject with reason, set tier, select commission plan, assign partner manager), wired to acceptance scenario 3 (FR-011)
- [ ] T039 [US1] 9-step partner verification plus sanctions/compliance screening and duplicate-account detection, wired to acceptance scenario 1 (FR-012)
- [ ] T040 [US1] Approval scoring calculation (12 factors) with a mandatory human-review gate for high-risk applicants, wired to acceptance scenario 3 (FR-013)
- [ ] T041 [US1] Structured 16-step onboarding journey with a completion-percentage dashboard gating referral-link generation, wired to acceptance scenario 4 (FR-014)
- [ ] T042 [US1] Partner training resources (7 formats) with a mandatory-completion gate before program activation (FR-015)
- [ ] T043 [US1] Digital agreements (12 fields) for affiliates/ambassadors/partners, wired to T008 (FR-016)
- [ ] T044 [US1] Agreement templates, version control, electronic signatures, renewal reminders, amendment workflows, suspension, termination, archival (FR-017)
- [ ] T045 [P] [US1] Application/onboarding/agreement UI
- [ ] T046 [US1] Integration test: application submission creates a record and routes to review, documents-requested blocks approval until received, approval generates an onboarding journey and audit entry, incomplete onboarding blocks link generation with a task list — all 4 acceptance scenarios in `backend/tests/integration/us1-partner-application-onboarding.integration.test.ts`

**Checkpoint**: The foundational gate every other capability in this feature sits behind is independently functional.

---

## Phase 4: User Story 2 — Partner Earns Commission Through the Calculation Engine Under a Configured Commission Model (Priority: P1)

**Independent Test**: Configure a commission rule, drive a tracked conversion through validation to "Approved," and verify the resulting commission record's breakdown matches the configured rule exactly, with the approved value reflected in the partner's wallet pending balance.

- [ ] T047 [US2] 9 commission models (fixed, percentage, tiered, product-based, customer-type, recurring, hybrid, performance bonus, non-monetary reward), wired to T015 (FR-028)
- [ ] T048 [US2] Configurable commission rules (14 scoping dimensions) with priority-engine resolution for multiple matching rules, wired to acceptance scenario 2 (FR-029)
- [ ] T049 [US2] Tiered commission structure (6 tiers) with a 10-factor tier calculation, wired to T023 (FR-030)
- [ ] T050 [US2] Revenue-sharing configuration for strategic partners (FR-032)
- [ ] T051 [US2] Customer-referral rewards distinct from partner commissions, including two-sided rewards (FR-033)
- [ ] T052 [US2] Reward-qualification-condition enforcement, excluding cancelled/refunded/duplicated/fraudulent conversions (FR-034)
- [ ] T053 [US2] Commission Calculation Engine core pipeline (identify program → attributed partner → applicable rules → exclusions → base commission → tier multiplier → campaign bonus → cap → tax withholding → commission record → route/auto-approve → wallet credit) with a transparent breakdown, wired to T016 and T032's contract test, acceptance scenarios 1 and 4 (FR-035)
- [ ] T054 [US2] 11-status commission lifecycle with partner-visible rejection/reversal reasons, wired to acceptance scenario 1 (FR-036)
- [ ] T055 [US2] Refund/cancellation/chargeback commission-reversal handling (negative wallet adjustment, future-commission offset, proportionate partial-refund adjustment) (FR-037)
- [ ] T056 [US2] Program-configurable commission locking period gating payability, wired to acceptance scenario 3 (FR-038)
- [ ] T057 [P] [US2] Commission breakdown / rule-priority UI
- [ ] T058 [US2] Integration test: percentage rule with tier multiplier produces a full breakdown, multiple matching rules resolved by the priority engine, subscription renewal generates a linked recurring commission, partner dashboard shows the full breakdown not just the final number — all 4 acceptance scenarios in `backend/tests/integration/us2-commission-calculation-engine.integration.test.ts`

**Checkpoint**: The economic core of the entire chapter — the mechanism every program category converts tracked activity into a payment obligation through — is independently functional.

---

## Phase 5: User Story 3 — Partner Wallet Funds Move Through Pending, Locked, Approved, and Payable States to Payout (Priority: P1)

**Independent Test**: Credit a commission to a partner wallet, advance it through the configured locking period into "Payable," trigger a scheduled payout that passes compliance and finance review, and confirm the wallet's derived balance matches the payout amount exactly.

- [ ] T059 [US3] Partner Wallet append-only ledger (9 transaction types) with 8 derived balances, wired to T030's contract test, acceptance scenario 1 (FR-039)
- [ ] T060 [US3] 9 payout methods with country/partner-type/compliance-based availability (FR-040)
- [ ] T061 [US3] Configurable payout schedules (6 options) with threshold/limit/hold/method/currency/tax/fee/compliance/finance-approval rules, wired to acceptance scenario 2 (FR-041)
- [ ] T062 [US3] 10-state payout workflow with failure-reason capture, retry option, payment-method-update request, and finance action path, wired to acceptance scenarios 3–4 (FR-042)
- [ ] T063 [US3] Tax management (ID, residency, registration, withholding category/percentage, declaration, certificates, reports) (FR-043)
- [ ] T064 [US3] Partner invoicing (upload, generate from earnings, templates, tax details, approval tracking, correction, receipts) through a 7-status lifecycle (FR-044)
- [ ] T065 [US3] Multi-currency operation with transparent conversion disclosure in payout statements (FR-045)
- [ ] T066 [US3] Payout reconciliation (6-status lifecycle across 7 record types) (FR-046)
- [ ] T067 [P] [US3] Wallet ledger / payout / tax UI
- [ ] T068 [US3] Integration test: commission credit creates a ledger entry with a correctly derived balance, locking-period elapse moves the commission to payable, a payout batch progresses through the workflow reducing payable by exactly the paid amount, a failed payout preserves the balance and tracks retry as a distinct ledger entry — all 4 acceptance scenarios in `backend/tests/integration/us3-partner-wallet-payout.integration.test.ts`

**Checkpoint**: The Article-V-mandated, auditable mechanism through which every partner is ultimately paid is independently functional.

---

## Phase 6: User Story 4 — Self-Referral and Fraud Detection Blocks a Suspicious Payout Before It Is Paid (Priority: P1)

**Independent Test**: Simulate a conversion where the referring partner's email, device, and payment instrument match the referred customer's, confirm an elevated fraud risk score, a held commission, and a visible fraud case — while a configured same-household exception is allowed to proceed.

- [ ] T069 [US4] 15-pattern suspicious-activity detection (self-referral, duplicate accounts, fake registrations, bot clicks, click flooding, cookie stuffing, coupon leakage, unauthorized paid advertising, trademark bidding, duplicate payment methods, repeated device use, abnormal conversion rate, high refund rate, geographic anomalies, incentivized-traffic violations, collusion), wired to T019 (FR-047)
- [ ] T070 [US4] 0–100 fraud risk score (5 bands) per partner/click/lead/conversion, with escalating actions and no automatic permanent rejection absent human review, wired to T031's contract test, acceptance scenarios 1–2 (FR-048)
- [ ] T071 [US4] Self-referral detection (9 identity signals) with a configurable same-household/same-organization exception workflow, wired to acceptance scenario 3 (FR-049)
- [ ] T072 [US4] Coupon-leakage detection (5 leak sources) with disable/replace/exclude/warn/suspend administrator actions, wired to acceptance scenario 4 (FR-050)
- [ ] T073 [US4] Promotional-compliance-rule enforcement (13 categories) through a 7-status compliance-review workflow (FR-051)
- [ ] T074 [P] [US4] Fraud case review / compliance-review UI
- [ ] T075 [US4] Integration test: matching identity signals flag self-referral and hold the commission, Critical-band score triggers review actions without permanent rejection, a same-household exception routes through the exception process, a leaked coupon code is disabled with unauthorized conversions excluded and the action audited — all 4 acceptance scenarios in `backend/tests/integration/us4-fraud-prevention.integration.test.ts`

**Checkpoint**: The safeguard protecting TBT's commission budget and program integrity against exploitation is independently functional.

---

## Phase 7: User Story 5 — Multi-Level Commission Cascades with Anti-Pyramid Safeguards (Priority: P2)

**Independent Test**: Configure a 3-level hierarchy with a maximum depth limit, drive one qualifying conversion through the direct affiliate, and confirm exactly three revenue-backed commission records are generated with no commission beyond the configured maximum depth or for recruitment alone.

- [ ] T076 [US5] Controlled multi-level commission structure with maximum-hierarchy-depth enforcement, wired to T016 and T021, acceptance scenarios 1–2 (FR-031)
- [ ] T077 [US5] Program-specific eligibility and regulatory-restriction enforcement, with revenue-backed commissions only (FR-031)
- [ ] T078 [US5] Recruitment-only-payout prohibition unless legally approved for that program, wired to acceptance scenario 3 (FR-031)
- [ ] T079 [US5] Cascade-reversal propagation to associated override/management commissions on refund, wired to acceptance scenario 4 (FR-031)
- [ ] T080 [P] [US5] Multi-level cascade visualization UI
- [ ] T081 [US5] Integration test: a 3-level hierarchy produces 3 traceable revenue-backed commissions, a level beyond max depth generates no commission, recruitment alone generates no commission when not enabled, refund reversal propagates to override and management commissions — all 4 acceptance scenarios in `backend/tests/integration/us5-multi-level-commission.integration.test.ts`

**Checkpoint**: The legally-sensitive, program-specific commission structure with anti-pyramid safeguards is independently functional.

---

## Phase 8: User Story 6 — Territory-Based Partner Hierarchy Management with Conflict Detection (Priority: P2)

**Independent Test**: Assign two partners overlapping territory definitions, confirm the system surfaces a territory conflict alert to an administrator, and verify a lead generated within the disputed territory is not simultaneously attributed to both partners without resolution.

- [ ] T082 [US6] Enterprise partner hierarchy (Global → National → Regional → Local → Individual Representative) with parent-child relationships, wired to T021 (FR-074)
- [ ] T083 [US6] Territory definitions (10 dimensions) with conflict/duplicate-ownership/unauthorized-promotion/inactivity/coverage-gap detection, wired to T022, acceptance scenarios 1–2 (FR-075)
- [ ] T084 [US6] 8-strategy lead distribution with acceptance deadlines and reassignment rules (FR-076)
- [ ] T085 [US6] 4-category revenue distinction (sourced, influenced, assisted, direct) preventing double-counting, wired to acceptance scenario 4 (FR-077)
- [ ] T086 [US6] Roll-up reporting across hierarchy levels without double-counting, wired to acceptance scenario 4 (FR-074)
- [ ] T087 [P] [US6] Territory management / conflict-alert UI
- [ ] T088 [US6] Integration test: territory-based assignment prevents duplicate lead ownership, overlapping territory surfaces a conflict alert, territory inactivity is flagged for administrator action, roll-up reporting aggregates correctly without double-counting — all 4 acceptance scenarios in `backend/tests/integration/us6-territory-hierarchy.integration.test.ts`

**Checkpoint**: The channel-conflict-prevention mechanism required for enterprise partner-hierarchy scenarios is independently functional.

---

## Phase 9: User Story 7 — Partner Manager Uses the Partner Portal, Disputes, and Support Workflow (Priority: P3)

**Independent Test**: Log in as an active partner, confirm dashboard metrics match underlying tracking/commission data, download a tier-permitted marketing asset, and submit a dispute against a rejected conversion tracked to a recorded resolution and adjustment amount.

- [ ] T089 [US7] Responsive Partner Portal (13 sections: dashboard, program info, links/codes/QR, campaigns, assets, leads, conversions, commissions, wallet, payouts, invoices, tax documents, training, agreements, support, notifications, profile), wired to T059, acceptance scenario 1 (FR-059)
- [ ] T090 [US7] Partner dashboard (16 metrics) matching underlying tracked and calculated records, wired to acceptance scenario 1 (FR-060)
- [ ] T091 [US7] Tier-gated marketing-asset access denial for unauthorized assets, wired to acceptance scenario 2
- [ ] T092 [US7] Partner Support System (help articles, FAQ, tickets with evidence upload, commission disputes, payout-issue reports, link-support requests, asset requests, partner-manager contact) with 10 ticket categories, wired to T024, acceptance scenario 4 (FR-057)
- [ ] T093 [US7] Partner Dispute Management (7 dispute types) through an 8-status workflow with resolution and adjustment-amount recording, wired to acceptance scenario 3 (FR-058)
- [ ] T094 [US7] Administrator dashboard (14 metrics) (FR-061)
- [ ] T095 [P] [US7] Partner portal / dispute-tracking UI
- [ ] T096 [US7] Integration test: portal dashboard metrics match underlying tracked/calculated records, tier-restricted asset access is denied, a dispute is tracked from submission through resolution with an adjustment amount, a payout-issue ticket is routed with the correct category and linked to the relevant wallet record — all 4 acceptance scenarios in `backend/tests/integration/us7-partner-portal-disputes-support.integration.test.ts`

**Checkpoint**: The partner-facing operational experience sustaining trust and retention once core mechanics are in place is independently functional.

---

## Phase 10: Tracking, Codes & Attribution remainder (supports FR-018–FR-027; cross-cutting, no single owning story)

- [ ] T097 Unique referral-link generation (8 identifier fields) and partner link management (generate, copy, shorten, QR, label, view performance, disable, mobile deep link), wired to T009 (FR-018)
- [ ] T098 Referral/promotional code generation (8 code types) with configurable format, validity, usage limit, eligibility, discount value, restrictions, stackability (FR-019)
- [ ] T099 QR code generation (7 target types) with scan/device/location/visit/lead/conversion/revenue capture (FR-020)
- [ ] T100 Mobile deep linking (8 destination types) with app-store/web fallback preserving attribution (FR-021)
- [ ] T101 Configurable attribution duration (6 separately-configurable window types) per program (FR-022)
- [ ] T102 Configurable attribution models (10 options) displayed in program settings and on every commission record (FR-023)
- [ ] T103 Click data recording (14 fields) excluding invalid/bot-generated clicks from payable metrics, wired to T012 (FR-024)
- [ ] T104 Referred-lead record (14 fields) with program-privacy-restricted partner visibility, wired to T013 (FR-025)
- [ ] T105 14-type conversion-event tracking (14 fields per record), wired to T014 (FR-026)
- [ ] T106 12-factor conversion-validation gate through an 8-status lifecycle, wired to T032's contract test (FR-027)

**Checkpoint**: The link/code/QR/attribution substrate every commission and fraud decision depends on is independently functional.

---

## Phase 11: Marketing Assets, Campaigns, Communication & Program-Type-Specific remainder (supports FR-052–FR-056, FR-069–FR-073; cross-cutting, no single owning story)

- [ ] T107 Marketing Asset Library (16 asset types) restricted across 10 dimensions, wired to T011 (FR-052)
- [ ] T108 Asset version control (11 fields) with replacement/withdrawal notification (FR-053)
- [ ] T109 Co-branded template personalization within locked brand guidelines, requiring approval where configured (FR-054)
- [ ] T110 Partner-specific campaign creation (10 fields) with accept/decline/request-more-info responses, wired to T010 (FR-055)
- [ ] T111 Partner Communication Center (10 message types across 6 channels) (FR-056)
- [ ] T112 Ambassador-specific profile fields (11) and activities (7) (FR-069)
- [ ] T113 Creator/influencer management (13 workflow steps) with 10 performance metrics (FR-070)
- [ ] T114 Reseller management (12 fields) distinguishing reseller revenue from affiliate commission (FR-071)
- [ ] T115 Agency partner management (12 fields) (FR-072)
- [ ] T116 Institutional partner management (12 fields) (FR-073)

**Checkpoint**: The asset-distribution, campaign, communication, and 5-program-type-specific management surface is independently functional.

---

## Phase 12: Performance/Lifecycle/Retention, AI Partner Intelligence & Executive Dashboard remainder (supports FR-062–FR-068, FR-078–FR-080; cross-cutting, no single owning story)

- [ ] T117 Executive-level dashboard (11 metrics) with an AI-generated summary requiring human review before any resulting action, wired to the T031-style advisory pattern (FR-062)
- [ ] T118 Configurable partner-performance-score calculation (12 factors), wired to T023 (FR-063)
- [ ] T119 Partner health classification (5 bands) with decline/risk/opportunity identification (FR-064)
- [ ] T120 Partner lifecycle tracking (8 core + 7 alternate states) with configurable transition workflows (FR-065)
- [ ] T121 Partner retention automation (12 journey types) plus reactivation triggers (5 inactivity signals) (FR-066)
- [ ] T122 Automatic/manual/hybrid/contractual tier assignment with upgrade/downgrade/grace-period/appeal support (FR-067)
- [ ] T123 Leaderboards (8 ranking types) and recognition mechanisms (8 types) with partner opt-out support (FR-068)
- [ ] T124 AI Partner Assistant (9 capabilities) respecting program rules, brand guidelines, and prohibited-claim policies, wired to `008`'s gateway (FR-078)
- [ ] T125 AI Partner Manager (10 capabilities) with evidence/impact/confidence/risk on every recommendation, human-approval-gated, wired to the T031-style approval pattern (FR-079)
- [ ] T126 Predictive partner analytics (11 forecast targets) with best-case/expected/worst-case scenarios (FR-080)

**Checkpoint**: The performance, lifecycle, retention, AI-intelligence, and executive-reporting layer rounding out full partner-program operation is independently functional.

---

## Phase 13: Reporting, Compliance, Governance & Polish

- [ ] T127 [P] Commission liability reporting for finance (9 categories) filterable by date range, program, partner, currency, and payment status, wired to T016 (FR-081)
- [ ] T128 Program budget management (8 categories) with utilization, forecasted liability, approved/pending commissions, expected payouts, alerts, and revenue-basis-labeled ROI reporting (FR-082)
- [ ] T129 Layered RBAC across 15 named roles, configurable at program/partner/organization/data-field levels, wired to `016` (FR-083)
- [ ] T130 Data privacy controls (11 categories) preventing partners from receiving customer information beyond what is required and legally permitted (FR-084)
- [ ] T131 Immutable audit log across 13 sensitive-action categories, wired to T025 (FR-085)
- [ ] T132 Performance hardening pass toward the remaining numeric targets (link generation under 1s, code validation under 500ms, click tracking under 300ms, commission calculation under 5s) (SC-004)
- [ ] T133 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (jurisdiction-specific multi-level legal thresholds, fraud-score numeric thresholds, dispute/onboarding SLA durations, coupon-leakage retroactive-exclusion, fraud false-positive appeal path, mid-cascade suspension handling, overlapping-territory conflict resolution, post-payout refund-offset policy, simultaneous tier-upgrade/downgrade precedence)
- [ ] T134 Final audit: cross-check every FR-001–FR-085 against an implementation or validation task; verify transactional/order-level affiliate mechanics are consumed from `009` rather than redefined, and enterprise PRM depth is deferred to `046`
- [ ] T135 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`/`016`'s RBAC, `009`'s transactional affiliate layer, and `008`'s AI gateway, and produces the entity/program-configuration infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (application/onboarding) is the foundational gate every program category sits behind and must ship first; US2 (commission engine) depends on US1 producing approved, onboarded partners; US3 (wallet/payout) depends on US2's commission records; US4 (fraud) depends on US2/US3's conversion and commission data to score against — all after US1, largely sequential given each depends on the previous story's output data.
- **P2 stories (US5–US6)**: US5 (multi-level commission) depends on US2's commission engine and a configured partner hierarchy; US6 (territory management) depends on Foundational's hierarchy/territory entities and can build in parallel with US5.
- **P3 story (US7)** depends on US1–US6 producing real operational data to surface in the portal and should land last among the numbered stories.
- **Phase 10 (Tracking/Codes/Attribution remainder)** underlies US2's commission calculation and US4's fraud detection — should land alongside or just before those stories rather than strictly after all numbered stories.
- **Phase 11 (Assets/Campaigns/Communication/Program-Type-Specific)** and **Phase 12 (Performance/Lifecycle/AI/Executive Dashboard)** depend on Foundational and US1–US4 for real partner/commission data; can build in parallel with the P2/P3 stories.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, program/partner-type config) → **STOP and VALIDATE** the three Foundational contract tests (wallet-ledger-immutability, fraud-hold-blocks-payout, commission-breakdown-reconciliation) pass → US1 (application/onboarding) → **STOP and VALIDATE** a partner can be recruited, verified, and onboarded end to end → Phase 10 (tracking/codes/attribution) to give the commission engine real click/lead/conversion data → US2 (commission engine) → US3 (wallet/payout) → US4 (fraud prevention) → **STOP and VALIDATE** the financial core is trustworthy and fraud-resistant → US5 (multi-level commission) + US6 (territory management) in parallel → US7 (partner portal/disputes) → Phase 11 (assets/campaigns/program-type-specific) + Phase 12 (performance/lifecycle/AI/executive) in parallel → Polish.
