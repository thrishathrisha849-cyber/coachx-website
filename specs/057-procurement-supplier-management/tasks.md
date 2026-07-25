---
description: "Task list for Feature 057 — Procurement & Supplier Management (Compressed Re-Specification)"
---

# Tasks: Procurement & Supplier Management (Compressed Re-Specification)

**Input**: Design documents from `/specs/057-procurement-supplier-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis confirming `055`'s canonicity — resolving `055/plan.md` §1's flagged concern — resolving the Segregation of Duties terminology question, and surfacing a citation-accuracy nuance in three of spec.md's own `[SAME AS 055 FR-XXX]` claims), spec.md, **Feature 055's Foundational phase complete** (Supplier/Vendor, Purchase Request, Purchase Order, Procurement Contract, Approval Workflow Step entities and the Approval Matrix/RBAC/ABAC mechanism this feature does not redefine), and **Feature 001's Foundational phase complete** (layered RBAC).

**Tests**: Included throughout — AI Procurement Assistant answer-grounding, zero-autonomous-status-change across all AI Procurement Intelligence outputs, and Segregation of Duties enforcement each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-007.

**Organization**: Because 14 of this feature's 26 FRs are pure or near-pure citations to Feature 055 (not re-implemented here), tasks are organized around only the genuinely net-new or field-set-enriching FRs, grouped by user story (US1–US5 from spec.md), plus one supplementary phase for the two remaining net-new FRs no story specifically owns (Sourcing Methods, Strategic Sourcing Dashboard).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `055`'s Foundational phase is deployed (Supplier/Vendor, Purchase Request, Purchase Order, Procurement Contract, Approval Workflow Step entities; Budget Validation; Approval Matrix/RBAC/ABAC), and that `001`'s layered RBAC and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: the AI Procurement Assistant's behavior when required data falls outside the 15 named integrations, Duplicate Purchase Detection's tolerance/matching criteria for legitimate recurring purchases, the Vendor-Portal-vs-internal-team concurrent-write conflict rule, Supplier Status mutual-exclusivity (Preferred vs. Suspended), the AI-recommended-Blacklisting human-approval-gate requirement (Article II), Reverse Auction's interaction with the standard RFQ approval workflow, and whether Contract Alerts and AI Contract Risk Analysis merge into one notification stream or remain separately monitored
- [ ] T003 [P] Add `backend/src/modules/procurement/{ai-procurement-assistant,vendor-portal,quotation-comparison,contract-alerts,procurement-integrations,sourcing-methods-dashboard}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Vendor Dashboard` entity in `backend/src/modules/procurement/vendor-portal/vendor-dashboard.entity.ts`
- [ ] T005 [P] Define the `Quotation Comparison Matrix` entity in `backend/src/modules/procurement/quotation-comparison/quotation-comparison-matrix.entity.ts`
- [ ] T006 [P] Define the `Contract Alert` entity in `backend/src/modules/procurement/contract-alerts/contract-alert.entity.ts`
- [ ] T007 [P] Define the `AI Procurement Assistant Query` entity in `backend/src/modules/procurement/ai-procurement-assistant/ai-procurement-assistant-query.entity.ts`
- [ ] T008 Support procurement of products, services, software, subscriptions, digital assets, infrastructure, office supplies, events, marketing campaigns, and operational requirements as distinct procurable categories (FR-001)
- [ ] T009 Reference, do not redefine: overall centralized AI-powered procurement ecosystem scope — identical in substance to `055` FR-001 (FR-002)
- [ ] T010 Reference, do not redefine: 11-stage Vendor Lifecycle — identical in substance to `055` FR-008; this chapter's 12-item list treated as a compressed restatement, `055`'s stage names remain canonical (FR-003)
- [ ] T011 Reference, do not redefine: Supplier Master Profile field set — genuinely matches `055` FR-007's Vendor Master Record field set (accurate citation, per plan.md §3) (FR-004)
- [ ] T012 Supplier Status enumeration (Draft, Pending Verification, Pending Approval, Active, Preferred, Suspended, Blacklisted, Expired, Archived) (FR-005)
- [ ] T013 Reference, do not redefine: 13 named Supplier Categories as a subset of `055`'s 17 named Vendor Categories (FR-006)
- [ ] T014 Reference, do not redefine: RFQ Workflow — compressed restatement of `055`'s Enterprise Procurement Lifecycle and RFQ Management capability (FR-010)
- [ ] T015 Reference, do not redefine: Strategic Sourcing strategies — overlap with `055`'s Sourcing Strategies list (FR-013)
- [ ] T016 Purchase Requisition field set (PR Number, Requestor, Department, Business Unit, Cost Center, Category, Required Date, Priority, Budget, Quantity, Item Details, Justification, Attachments, Approval Workflow) and 8-value status enum — genuinely new field-set detail `055` does not provide at this granularity, per plan.md §3 (FR-015)
- [ ] T017 Reference, with field-set enrichment: Purchase Order generation/field set/workflow/status set — largely matches `055` FR-030–032, minor field additions (Currency, Discount, Freight, Incoterms) (FR-016)
- [ ] T018 Contract Management field set (Contract Number, Supplier, Contract Type, Effective/Expiry/Renewal Dates, SLA, Pricing Terms, Payment Terms, Confidentiality, Penalties, Insurance, Documents, Digital Signatures) and Contract Lifecycle — genuinely new field-set detail `055` does not enumerate at this granularity, per plan.md §3 (FR-017)
- [ ] T019 Supplier KPI tracking and Supplier Scorecard — `055`'s ESG-inclusive 10-dimension framework (FR-027) remains canonical and more complete; this chapter's KPI list omission of ESG is treated as a compression artifact, not a scope reduction (FR-019)
- [ ] T020 Reference, do not redefine: Executive dashboards and named report set — identical in substance to `055` FR-059/FR-060 (FR-021)
- [ ] T021 Security & Governance: RBAC, Multi-Level Approval Workflows, **Segregation of Duties (SoD)**, Digital Signatures, Audit Logs, Encryption, Compliance Monitoring, Document Version Control, Procurement Policy Enforcement, Complete Activity Tracking — this feature is the canonical source for the "SoD" term; `055`'s Approval Matrix/RBAC/ABAC (055 FR-044, FR-055) remains the enforcement mechanism, wired to T028's contract test (FR-025)
- [ ] T022 Note: `055`'s claimed canonicity over `057` is CONFIRMED by this feature's own spec.md, resolving `055/plan.md` §1's flagged concern — a rare case where the "later chapter is deeper" pattern does not hold, verified from both sides (per plan.md §1)
- [ ] T023 Note: Segregation of Duties (SoD) terminology is resolved — `057` is the canonical term source, `055`'s Approval Matrix/RBAC/ABAC is the canonical enforcement mechanism (per plan.md §2)
- [ ] T024 Note: FR-011 (RFQ), FR-015 (Purchase Requisition), and FR-017 (Contract) are labeled `[SAME AS 055 FR-XXX]` but their cited `055` FRs are capability/scope lists, not field enumerations at the same granularity — these three FRs are the genuinely value-adding, implementation-ready field-set source for their entities, used alongside `055`'s lifecycle/workflow/RBAC depth, not as redundant no-ops (per plan.md §3)
- [ ] T025 Note: the AI Procurement Assistant reuses `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but builds its own structured-live-data query/grounding layer — distinct from `050`'s document-RAG pipeline reuse of `008`'s `ai-rag` module; `055`'s own FR-052 already names "AI Procurement Assistant" as an undetailed Portal module this feature fills in (per plan.md §4)
- [ ] T026 Note: Vendor Portal authentication reuses `003`'s auth foundation and extends `055`'s already-role-inclusive Enterprise Procurement Portal (055 FR-052–FR-054, which already lists "Approved Suppliers" as a portal role) rather than building a second identity/portal system (per plan.md §5)
- [ ] T027 Note: FR-026's "Inventory & Warehouse" integration point is the already-confirmed `055`/`056` procurement/warehouse boundary (per plan.md §6); no new or competing warehouse integration is introduced
- [ ] T028 Contract test: the AI Procurement Assistant returns a grounded, data-backed answer for each of the ten documented example question categories using live procurement data, or explicitly discloses its own limitation rather than fabricating a response, in `backend/tests/contract/ai-procurement-assistant-grounded-answer-or-disclosed-limitation.contract.test.ts` (SC-001)
- [ ] T029 Contract test: 100% of AI Procurement Assistant responses and AI Procurement Intelligence outputs (Price Prediction, Fraud Detection, Duplicate Purchase Detection, Vendor Risk Prediction, Contract Risk Analysis) are advisory-only, with 0% resulting in an automatic status/approval/payment change without a recorded human action, in `backend/tests/contract/ai-procurement-intelligence-zero-autonomous-status-approval-change.contract.test.ts` (SC-002)
- [ ] T030 Contract test: 0% of Purchase Requisitions/Orders are both submitted and approved by the same unauthorized single actor, in `backend/tests/contract/segregation-of-duties-zero-same-actor-submit-and-approve.contract.test.ts` (SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — AI Procurement Assistant Answers Natural-Language Operational Questions (Priority: P1) 🎯 MVP

**Independent Test**: Ask the assistant each of the ten example questions listed in the source against a populated procurement dataset and confirm each returns a grounded, explainable answer rather than a generic or fabricated response.

- [ ] T031 [US1] Conversational AI Procurement Assistant answering natural-language operational questions grounded in live procurement data, including all 10 documented example questions, wired to T007, T025's structured-data-grounding note, acceptance scenarios 1–2 (FR-023)
- [ ] T032 [US1] AI Procurement Assistant response governance: advisory and explainable only, MUST NOT itself finalize a strategic/financial/regulatory action, with a deterministic non-AI fallback (existing dashboards/reports) available when unavailable, wired to T029's contract test, acceptance scenarios 3–4 (FR-024)
- [ ] T033 [P] [US1] AI Procurement Assistant chat UI
- [ ] T034 [US1] Integration test: a "which contracts expire this month?" query returns only contracts whose expiry falls within the current calendar month sourced from live Contract Management data, a "which purchases exceed budget?" query lists only transactions whose value exceeds their linked budget rather than a cached report, a low-confidence/ambiguous question discloses the limitation rather than fabricating an answer, an AI-service-unavailable scenario leaves procurement dashboards/reports available as a non-AI fallback — all 4 acceptance scenarios in `backend/tests/integration/us1-ai-procurement-assistant.integration.test.ts`

**Checkpoint**: The chapter's single most distinctive addition — a conversational query interface over `055`'s procurement data — is independently functional.

---

## Phase 4: User Story 2 — AI Detects Duplicate Purchases, Predicts Prices, and Flags Procurement Fraud (Priority: P1)

**Independent Test**: Submit a purchase order duplicating an already-open PO and confirm it is flagged before issuance; separately, request a price prediction and confirm it is returned as advisory, non-binding guidance.

- [ ] T035 [US2] AI Procurement Intelligence generating Supplier Recommendations, Price Prediction, Demand Forecast, Procurement Planning support, Fraud Detection, Duplicate Purchase Detection, Contract Risk Analysis, Vendor Risk Prediction, Cost Optimization, and Procurement Automation suggestions, all advisory, wired to T029's contract test, acceptance scenarios 1–4 (FR-022)
- [ ] T036 [US2] AI-recommended Supplier Actions (Preferred Vendor designation, Corrective Action Plan, Performance Review, Temporary Suspension, Blacklisting, Contract Renewal, Strategic Partnership) as advisory output; Blacklisting/Suspension MUST require explicit human/role-gated approval before the supplier's status actually changes (FR-020)
- [ ] T037 [P] [US2] AI Procurement Intelligence (Duplicate/Price/Fraud/Risk) advisory-signals UI
- [ ] T038 [US2] Integration test: a new PO closely matching an already-open PO for the same supplier/item/amount is flagged by Duplicate Purchase Detection for human review before issuance, a price-prediction request against historical item/category data returns an advisory estimate rather than an auto-applied contract price, a purchasing-pattern deviation is flagged for human review rather than automatically blocked or approved, an AI Vendor Risk Prediction/Contract Risk Analysis output is shown as advisory and does not itself change supplier status/PO status/contract terms — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-duplicate-price-fraud-detection.integration.test.ts`

**Checkpoint**: The financial-control safeguards this chapter's AI contribution adds on top of `055`'s Three-Way Match are independently functional.

---

## Phase 5: User Story 3 — Self-Service Vendor Portal With Dashboard and Quotation Comparison (Priority: P2)

**Independent Test**: Have one supplier complete self-registration, upload a document, submit a quotation against an open RFQ, and view their dashboard; then generate a Quotation Comparison matrix for that RFQ's submitted bids and confirm all listed fields are populated.

- [ ] T039 [US3] Secure, self-service Vendor Portal (registration, document upload, RFQ viewing, quotation submission, PO acceptance, delivery tracking, invoice raising, payment viewing, contract download, procurement-team communication, company-info updates, performance-score viewing), wired to T026's `003`/`055`-Portal-extension note, acceptance scenarios 1, 4 (FR-007)
- [ ] T040 [US3] Vendor Dashboard (Open RFQs, Submitted Quotations, Active POs, Pending Deliveries, Invoice Status, Payment Status, Performance Rating, Compliance Expiry, Contract Expiry, Notifications), wired to T004, acceptance scenario 2 (FR-008)
- [ ] T041 [US3] RFQ record field set (RFQ Number, Title, Category, Description, Business Unit, Budget, Required Quantity, Delivery Location, Delivery Date, Terms & Conditions, Evaluation Criteria, Closing Date, Selected Suppliers, Attachments) — genuinely new field-set detail per plan.md §3/T024 (FR-011)
- [ ] T042 [US3] Quotation Comparison Matrix (Supplier, Unit Price, Total Cost, Taxes, Delivery Time, Warranty, Support, Payment Terms, Compliance Score, Previous Rating, Risk Score) per submitted quotation, wired to T005, acceptance scenario 3 (FR-012)
- [ ] T043 [P] [US3] Vendor Portal & Quotation Comparison UI
- [ ] T044 [US3] Integration test: an approved supplier logs into the Vendor Portal and can complete every enumerated self-service action, the Vendor Dashboard displays all 10 required data categories, a Quotation Comparison view for an RFQ's multiple submitted quotations presents all 10 fields side by side, a supplier's PO acceptance through the portal updates PO status and is visible internally without manual re-entry — all 4 acceptance scenarios in `backend/tests/integration/us3-vendor-portal-quotation-comparison.integration.test.ts`

**Checkpoint**: The self-service convenience and evaluation-support layer sitting on top of `055`'s supplier/RFx records is independently functional.

---

## Phase 6: User Story 4 — Automatic Contract Alerts for Expiry, Renewal, and Compliance Risk (Priority: P2)

**Independent Test**: Create one contract with a near-term expiry date and an attached insurance document with its own near-term expiry, then confirm the system generates separate, distinguishable alerts for each.

- [ ] T045 [US4] Automatic Contract Alerts for Expiry, Renewal, SLA Breach, Insurance Expiry, License Expiry, and Compliance Expiry, each as a distinguishable alert type, wired to T006, acceptance scenarios 1–4 (FR-018)
- [ ] T046 [P] [US4] Contract Alerts dashboard/notification UI
- [ ] T047 [US4] Integration test: an approaching contract expiry generates an Expiry alert distinct from a Renewal alert, a detected SLA breach raises an SLA Breach alert to the relevant contract owner, an attached insurance policy or license approaching its own expiry raises Insurance Expiry/License Expiry alerts independently of the contract's own alerts, a lapsed supplier compliance document tied to a contract raises a Compliance Expiry alert rather than the contract silently remaining Active — all 4 acceptance scenarios in `backend/tests/integration/us4-contract-alerts.integration.test.ts`

**Checkpoint**: The operational-risk-reduction capability replacing manual contract-date tracking is independently functional.

---

## Phase 7: User Story 5 — Procurement Platform Integrates With Named Enterprise Systems (Priority: P3)

**Independent Test**: Confirm, for each of the fifteen named systems, that a defined data exchange point exists and that no procurement transaction is silently blocked by the absence of one of these integrations.

- [ ] T048 [US5] Integration with ERP, Finance, Accounting, Inventory & Warehouse (per T027's confirmed `055`/`056` boundary), CRM, HRMS, Project Management, Asset Management, Vendor Portal, Notification Service, Document Management, Workflow Engine, Business Intelligence, API Gateway, and the AI Platform, wired to acceptance scenarios 1–4 (FR-026)
- [ ] T049 [P] [US5] Integration status/health monitoring UI
- [ ] T050 [US5] Integration test: an approved Purchase Order's financial data is made available to Finance/Accounting/ERP, an uploaded Vendor Portal document is also accessible through Document Management, procurement data is available to Business Intelligence for cross-platform reporting without manual export, a third-party system accesses procurement data only through the API Gateway rather than a direct database connection — all 4 acceptance scenarios in `backend/tests/integration/us5-procurement-integrations.integration.test.ts`

**Checkpoint**: Platform-completeness connectivity across all 15 named enterprise systems is independently functional.

---

## Phase 8: Sourcing Methods & Strategic Sourcing Dashboard (supports FR-009, FR-014; cross-cutting, no single owning story)

- [ ] T051 Sourcing methods: Request for Information (RFI), Request for Quotation (RFQ), Request for Proposal (RFP), Reverse Auction, Competitive Bidding, Single Source Procurement, and Emergency Procurement — Reverse Auction and Competitive Bidding are net-new relative to `055`'s sourcing-strategy list (FR-009)
- [ ] T052 Strategic Sourcing Dashboard (Strategic Suppliers, Preferred Vendors, Savings Opportunities, Supplier Risk Heatmap, Procurement Pipeline, Category Opportunities, Contract Coverage, Supplier Dependency, Market Price Trends, AI Strategic Recommendations) (FR-014)
- [ ] T053 [P] Sourcing Methods & Strategic Sourcing Dashboard UI

---

## Phase 9: Polish — Final Validation

- [ ] T054 Resolve and document the 8 preserved NEEDS CLARIFICATION items from spec.md's own Edge Cases not already closed by `research.md`
- [ ] T055 Final audit: cross-check every FR-001–FR-026 against an implementation, reference-note, or validation task; re-verify the `055` canonicity confirmation (§1), the SoD terminology resolution (§2), and the `008`/`003`/`056` reuse decisions are respected
- [ ] T056 Run `quickstart.md` validation end-to-end across all 5 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `055`'s Foundational phase (Supplier/Vendor, Purchase Request, Purchase Order, Procurement Contract, Approval Workflow Step, Approval Matrix/RBAC/ABAC) and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2)**: US1 (AI Procurement Assistant) and US2 (AI Duplicate/Price/Fraud Detection) both depend only on Foundational and `055`'s existing data, and can be built in parallel — both are AI-advisory layers over the same underlying procurement data with no sequencing dependency between them.
- **P2 stories (US3, US4)**: US3 (Vendor Portal/Quotation Comparison) depends on `055`'s Supplier/RFQ records existing; US4 (Contract Alerts) depends on `055`'s Contract Lifecycle existing. Independent of each other and of US1/US2.
- **P3 story (US5)**: Integrations depends on the core procurement, vendor, PO, and contract capabilities (`055` and US1–US4) already functioning correctly, and should land last among the numbered stories.
- **Phase 8 (Sourcing Methods/Strategic Sourcing Dashboard)** depends on Foundational and `055`'s existing RFx infrastructure; can land alongside US3–US5.
- **Polish (Phase 9)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, citation-reference notes, ownership notes) → **STOP and VALIDATE** the three Foundational contract tests (ai-procurement-assistant-grounded-answer-or-disclosed-limitation, ai-procurement-intelligence-zero-autonomous-status-approval-change, segregation-of-duties-zero-same-actor-submit-and-approve) pass → US1 (AI Procurement Assistant) → **STOP and VALIDATE** the flagship conversational capability returns grounded, non-fabricated answers → US2 (AI Duplicate/Price/Fraud Detection) → **STOP and VALIDATE** all AI Procurement Intelligence outputs remain advisory-only → US3 (Vendor Portal/Quotation Comparison) + US4 (Contract Alerts) + Phase 8 (Sourcing Methods/Strategic Sourcing Dashboard) → US5 (Integrations) → Polish.
