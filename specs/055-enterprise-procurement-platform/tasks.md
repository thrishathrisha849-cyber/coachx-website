---
description: "Task list for Feature 055 — Enterprise Procurement Platform: Vendor Management & Spend Analytics"
---

# Tasks: Enterprise Procurement Platform: Vendor Management & Spend Analytics

**Input**: Design documents from `/specs/055-enterprise-procurement-platform/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 009, 003/001/016, and the not-yet-planned 056/057 — with 055's own claim of canonicity over 057 explicitly flagged for mandatory re-verification), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `009`'s payment-execution/financial-ledger infrastructure and `003`'s auth/identity foundation exist as consumption points.

**Tests**: Included throughout — Purchase Request budget-validation gating, Three-Way Match zero-auto-payment-on-exception, and AI-recommendation zero-autonomous-strategic-action each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Contract Procurement Management; Enterprise Procurement Portal; Security & Compliance; Cross-Cutting Financial Governance/Acceptance Criteria).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `009`'s payment-execution/financial-ledger infrastructure and `003`'s auth/identity foundation exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: mandatory re-verification of 055's claimed canonicity over `057` (plan.md §1), the `009`/`055` "Purchase Order" naming disambiguation (§3), Segregation-of-Duties precise mechanics pending `057` (§5), approval thresholds/role-mappings, Three-Way Match tolerance values, budget-overrun handling, ESG dispute/appeal process, out-of-tolerance-but-explainable override path, competing-RFx conflict-of-interest prevention, Emergency PO minimum-approval enforcement, suspended-vendor in-transit-delivery handling, AI-forecast-vs-configured-rule disagreement resolution
- [ ] T003 [P] Add `backend/src/modules/procurement/{lifecycle-foundation,vendor-management,supplier-information-management,supplier-qualification-onboarding,strategic-sourcing,rfx-management,ai-supplier-intelligence,purchase-order-management,inventory-procurement-automation,goods-receipt-three-way-match,procurement-workflow-approval,contract-procurement,ai-procurement-operations-intelligence,procurement-portal,procurement-security-compliance,procurement-analytics-spend-intelligence}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Supplier / Vendor` entity in `backend/src/modules/procurement/vendor-management/supplier-vendor.entity.ts`
- [ ] T005 [P] Define the `Vendor Master Record` entity in `backend/src/modules/procurement/vendor-management/vendor-master-record.entity.ts`
- [ ] T006 [P] Define the `Supplier Profile (SIM Record)` entity in `backend/src/modules/procurement/supplier-information-management/supplier-profile.entity.ts`
- [ ] T007 [P] Define the `Supplier Qualification Record` entity in `backend/src/modules/procurement/supplier-qualification-onboarding/supplier-qualification-record.entity.ts`
- [ ] T008 [P] Define the `RFx (RFQ / RFP / RFI)` entity in `backend/src/modules/procurement/rfx-management/rfx.entity.ts`
- [ ] T009 [P] Define the `Purchase Request` entity in `backend/src/modules/procurement/procurement-workflow-approval/purchase-request.entity.ts`
- [ ] T010 [P] Define the `Purchase Order` entity (disambiguated as "Vendor Purchase Order" from `009`'s customer-side entity) in `backend/src/modules/procurement/purchase-order-management/vendor-purchase-order.entity.ts`
- [ ] T011 [P] Define the `Goods Receipt` entity in `backend/src/modules/procurement/goods-receipt-three-way-match/goods-receipt.entity.ts`
- [ ] T012 [P] Define the `Three-Way Match Record` entity in `backend/src/modules/procurement/goods-receipt-three-way-match/three-way-match-record.entity.ts`
- [ ] T013 [P] Define the `Supplier ESG Score / Supplier Performance Score` entity in `backend/src/modules/procurement/ai-supplier-intelligence/supplier-esg-performance-score.entity.ts`
- [ ] T014 [P] Define the `Approval Workflow Step / Approval Matrix Entry` entity in `backend/src/modules/procurement/procurement-workflow-approval/approval-matrix-entry.entity.ts`
- [ ] T015 [P] Define the `Procurement Contract` entity in `backend/src/modules/procurement/contract-procurement/procurement-contract.entity.ts`
- [ ] T016 [P] Define the `AI Procurement Recommendation` entity in `backend/src/modules/procurement/ai-procurement-operations-intelligence/ai-procurement-recommendation.entity.ts`
- [ ] T017 Centralized, AI-powered procurement ecosystem as the organization's single source of truth for procurement activities (FR-001)
- [ ] T018 Implement the full defined System scope (17 named capability areas) (FR-002)
- [ ] T019 Prohibited-replacement guardrails: ERP Finance/MES/WMS/Tax-Filing/External-Logistics/Banking Platforms integrate via secure APIs rather than being replaced (FR-003)
- [ ] T020 Implement the standardized 17-step Enterprise Procurement Lifecycle (Purchase Requirement Identified→Continuous Improvement) with configurable workflows/SLA/notifications/AI/approval-history/audit per stage (FR-004)
- [ ] T021 Transparency and Policy-Driven Purchasing principles: full lifecycle visibility/traceability/auditability; every request follows configurable policies/workflows/financial-limits/compliance (FR-005)
- [ ] T022 Note: 055 claims canonical status over the not-yet-planned `057` — preserved as stated but flagged for mandatory re-verification once `057` is planned, given this session's established pattern of later chapters proving deeper (per plan.md §1)
- [ ] T023 Note: physical warehouse operations are deferred to not-yet-planned `056`; this feature owns only the procurement-triggering (reorder rule→PR/PO) side (per plan.md §2)
- [ ] T024 Note: `009` already owns its own "Purchase Order" entity (customer-side, AR direction) — disambiguated from this feature's vendor-side, AP-direction "Purchase Order" (T010); no ownership conflict, but schema/documentation must disambiguate the two (per plan.md §3)
- [ ] T025 Note: Portal authentication and RBAC configure `003`'s/`001`'s/`016`'s existing infrastructure rather than a new identity system (per plan.md §4)
- [ ] T026 Note: Segregation-of-Duties precise enforcement mechanics are pending reconciliation with `057`'s fuller specification; this feature defines only the Approval Matrix/RBAC/ABAC machinery SoD would be enforced through (per plan.md §5)
- [ ] T027 Contract test: 100% of Purchase Requests pass Budget Validation before entering the Approval Workflow, and 100% of resulting POs retain a complete, immutable Approval History, in `backend/tests/contract/purchase-request-budget-validation-before-approval.contract.test.ts` (FR-004/FR-062, SC-001)
- [ ] T028 Contract test: 100% of supplier payments are authorized only after a completed Three-Way Match within tolerance, with 0% of out-of-tolerance exceptions resulting in automatic payment authorization, in `backend/tests/contract/three-way-match-zero-auto-payment-on-exception.contract.test.ts` (FR-040, SC-002)
- [ ] T029 Contract test: 100% of AI-generated procurement recommendations carry an explanation/confidence indicator and remain advisory, with 0% taking a strategic/financial/regulatory action without recorded human approval, in `backend/tests/contract/ai-procurement-recommendation-zero-autonomous-strategic-action.contract.test.ts` (FR-051/FR-065, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — End-to-End Supplier Lifecycle From Vendor Registration Through Qualified, Active Supplier (Priority: P1) 🎯 MVP

**Independent Test**: Register one new supplier, populate their SIM profile, and walk that supplier through all 10 Qualification Workflow steps to Onboarding, confirming the Vendor Master Record transitions through the 11-stage Vendor Lifecycle with a complete, immutable audit history at each stage.

- [ ] T030 [US1] Centralized, AI-powered Vendor Management platform across 17 vendor categories, wired to T004 (FR-006)
- [ ] T031 [US1] Vendor Master Record full field set (Vendor ID, Legal Business Name, Tax/GST/PAN, Business Type, Contacts, Banking Info, Payment Terms, Procurement Category, Risk Rating, Compliance Status, AI Trust Score, Audit History), wired to acceptance scenario 1 (FR-007)
- [ ] T032 [US1] 11-stage Vendor Lifecycle (Registration→Archival) with configurable approvals/notifications/SLA/audit, wired to T005 (FR-008)
- [ ] T033 [US1] Vendor Relationship Management (meetings, communication history, contract tracking, performance reviews, procurement history, purchase volume, risk history, escalation tracking, improvement plans, strategic partnership management) (FR-009)
- [ ] T034 [US1] AI Vendor Intelligence (Preferred Vendor Recommendations, Risk Alerts, Performance Trends, Optimization, Diversification, Renewal Recommendations, Consolidation Opportunities, Cost Insights, Health Scores, Executive Insights) as advisory, wired to T016 (FR-010)
- [ ] T035 [US1] SIM platform centralizing supplier data/compliance/financial documents/certifications/capabilities/contracts/communication history/business intelligence, wired to T006 (FR-011)
- [ ] T036 [US1] Supplier Information Repository and Supplier Documentation full field sets, wired to acceptance scenario 2 (FR-012)
- [ ] T037 [US1] SIM Data Governance (version control, approval workflow, mandatory validation, expiration tracking, document renewal alerts, audit trail, ownership, access control, encryption, compliance) plus Supplier Collaboration (secure messaging, document exchange, notifications, PO updates, delivery status, invoice submission, issue resolution, meeting scheduling, performance feedback, announcements), wired to acceptance scenario 4 (FR-013)
- [ ] T038 [US1] AI SIM Intelligence (missing document detection, compliance gap analysis, profile completeness score, classification, duplicate detection, expiry prediction, data quality recommendations, benchmarking, risk notifications, executive insights) as advisory (FR-014)
- [ ] T039 [US1] Supplier Qualification & Onboarding platform automating evaluation/risk-assessment/compliance-verification/onboarding-approvals/governance, wired to T007 (FR-015)
- [ ] T040 [US1] 10-step Qualification Workflow (Registration→Onboarding) evaluated against 10 Qualification Criteria (including ESG Compliance), wired to acceptance scenarios 2–3 (FR-016)
- [ ] T041 [US1] Onboarding Automation (10 capabilities) plus continuous Supplier Risk evaluation across 10 risk categories (FR-017)
- [ ] T042 [US1] AI Qualification Intelligence (Supplier Approval Scores, Qualification Readiness, Missing Requirements, Risk Mitigation Plans, Preferred Suppliers, Diversification Opportunities, Comparison, Strategy, Ranking) as advisory, with Executive Approval remaining a human decision the AI informs but does not replace (FR-018)
- [ ] T043 [P] [US1] Vendor & Supplier Qualification Portal UI
- [ ] T044 [US1] Integration test: a new-supplier Vendor Master Record captures the full field set, Compliance Review/Financial Assessment stages require SIM documents present before advancing, the Executive Approval step gates Onboarding/Active status, an approaching-expiration compliance certificate generates a Document Renewal Alert — all 4 acceptance scenarios in `backend/tests/integration/us1-supplier-lifecycle.integration.test.ts`

**Checkpoint**: The foundational data and governance layer every other procurement capability depends on is independently functional.

---

## Phase 4: User Story 2 — Budget-Validated Purchase Request to Purchase Order With Multi-Level, Role-Differentiated Approval (Priority: P1)

**Independent Test**: Submit one Purchase Request against a department budget, confirm it is blocked from advancing until Budget Validation passes, route it through a configured Approval Matrix with at least two distinct approval roles, and confirm a Purchase Order is only generated after all required approvals are recorded.

- [ ] T045 [US2] Centralized, policy-driven, AI-assisted PO platform across 12 PO types, wired to T010 (FR-030)
- [ ] T046 [US2] 12-stage PO Lifecycle (Draft→Archival) with configurable workflows/SLA/escalation/AI/audit, wired to acceptance scenario 3 (FR-031)
- [ ] T047 [US2] PO Record full field set (PO Number, Request Number, Supplier Info, Delivery/Billing, Product/Service Details, Quantity, Pricing, Taxes, Payment Terms, Budget/Contract Reference, Approval History, Status, Audit Trail) (FR-032)
- [ ] T048 [US2] AI PO Intelligence (prioritization, cost optimization, supplier selection support, delivery risk prediction, budget variance detection, duplicate order detection, approval recommendations, spend optimization, contract compliance, executive insights) as advisory (FR-033)
- [ ] T049 [US2] Procurement activity orchestration via configurable workflows/policy-engines/approval-chains/event-driven-automation/AI-decision-support, wired to T014 (FR-042)
- [ ] T050 [US2] Workflow Engine (drag-and-drop builder, conditional logic, rule engine, Approval Matrix, parallel/sequential approvals, scheduled automation, event-based automation, retry logic, exception handling), wired to acceptance scenario 2 (FR-043)
- [ ] T051 [US2] Role-differentiated, multi-level Approval Matrix enforcement preventing a single unauthorized actor from both submitting and approving, wired to T026's SoD-pending-`057` note, acceptance scenario 2 (FR-044)
- [ ] T052 [US2] Stakeholder notification across 10 recipient types, Procurement SLA monitoring (10 metrics), and AI Workflow Intelligence (workflow improvements, approval optimization, prioritization, supplier routing, escalation reduction, SLA optimization, cost savings, automation opportunities, executive alerts) as advisory, wired to acceptance scenario 4 (FR-045)
- [ ] T053 [P] [US2] Purchase Request-to-PO Approval Chain UI
- [ ] T054 [US2] Integration test: a department-budget-referencing PR is blocked from advancing until Budget Validation passes, an authority-exceeding PR enforces the configured multi-level Approval Matrix rather than a single approver, an all-approvals-recorded workflow generates a PO carrying the Request Number/Budget Reference/Approval History, a rejected or escalated approval halts the PR/PO with notification and immutable audit capture — all 4 acceptance scenarios in `backend/tests/integration/us2-purchase-request-to-po-approval.integration.test.ts`

**Checkpoint**: The core financial-governance control of the entire platform is independently functional.

---

## Phase 5: User Story 3 — Three-Way Match Gate Before Payment Authorization (Priority: P1)

**Independent Test**: Create one Purchase Order, record a Goods Receipt against it, submit a matching Supplier Invoice, and confirm the system authorizes payment only when all match dimensions pass tolerance — then repeat with a deliberately mismatched invoice and confirm payment is blocked.

- [ ] T055 [US3] PO/Goods-Receipt/Supplier-Invoice consistency validation before payment authorization, wired to T012 (FR-038)
- [ ] T056 [US3] Goods Receipt Management (recording, partial receipts, complete receipts, return to supplier, damaged goods, quality inspection, warehouse allocation, barcode scanning, RFID integration, mobile goods receipt), wired to T011 (FR-039)
- [ ] T057 [US3] Automatic Three-Way Matching across Product/Quantity/Price/Tax/Delivery/Contract/Approval/Currency dimensions with configurable Tolerance Validation gating Payment Authorization, wired to T028's contract test, acceptance scenarios 1, 2, and 4 (FR-040)
- [ ] T058 [US3] 10-category exception routing for human resolution (Quantity Variance, Pricing Variance, Duplicate Invoice, Missing Delivery, etc.) plus AI Goods Receipt Intelligence as advisory input only, wired to acceptance scenario 3 (FR-041)
- [ ] T059 [P] [US3] Three-Way Match & Exception Resolution UI
- [ ] T060 [US3] Integration test: a fully-matching PO/Receipt/Invoice within tolerance authorizes payment, an out-of-tolerance quantity/pricing variance blocks payment and raises an exception, a duplicate invoice flags a "Duplicate Invoice" exception rather than double-paying, a partial receipt matches only the delivered quantity without authorizing payment for undelivered goods — all 4 acceptance scenarios in `backend/tests/integration/us3-three-way-match-gate.integration.test.ts`

**Checkpoint**: The platform's principal financial-fraud and internal-control safeguard is independently functional.

---

## Phase 6: User Story 4 — Human-Approval Gate on Strategic, Financial & Regulatory AI Procurement Recommendations (Priority: P1)

**Independent Test**: Trigger one AI-generated recommendation in each of the strategic, financial, and regulatory categories, and confirm every case carries an explanation/confidence indicator, no downstream action occurs automatically, and the recommendation only takes effect after a recorded human approval.

- [ ] T061 [US4] AI Procurement Operations Intelligence continuous optimization across 10 capability areas, wired to T016 (FR-049)
- [ ] T062 [US4] Operational Intelligence monitoring (10 metrics) plus Executive AI Insights (10 outputs) (FR-050)
- [ ] T063 [US4] Future Procurement AI roadmap scoping: 10 named AI agent roles treated as out-of-scope for initial release, with a mandatory non-bypassable human-approval gate when implemented, wired to acceptance scenario 3 (FR-051)
- [ ] T064 [US4] Procurement Digital Twin roadmap scoping: simulation/advisory-only, never executing real procurement transactions (FR-066)
- [ ] T065 [US4] Enterprise Procurement Knowledge Graph roadmap scoping: read/query decision-support layer only, not an independent transaction-execution system (FR-067)
- [ ] T066 [US4] Roadmap AI agent human-approval-mandatory enforcement across strategic/financial/regulatory decision categories, wired to T029's contract test, acceptance scenarios 1, 2, and 4 (FR-065)
- [ ] T067 [P] [US4] AI Recommendation Governance & Approval Gate UI
- [ ] T068 [US4] Integration test: a preferred-vendor recommendation remains advisory until a human approves finalization, a budget/spend-optimization recommendation executes no commitment/PO/payment until human financial-authority acceptance, a roadmap autonomous-agent capability enforces a mandatory, non-bypassable approval checkpoint, an AI-service-unavailable scenario provides a deterministic non-AI fallback rather than blocking operations — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-recommendation-human-approval-gate.integration.test.ts`

**Checkpoint**: The governance control that must exist before any AI recommendation feature ships is independently functional.

---

## Phase 7: User Story 5 — Strategic Sourcing Through Competitive RFQ, RFP & RFI With AI-Assisted Evaluation (Priority: P2)

**Independent Test**: Create one RFQ with at least two invited suppliers, collect bids before the submission deadline, run AI-assisted bid comparison, and confirm the award requires an explicit approval step and produces an award notification.

- [ ] T069 [US5] Strategic Sourcing activities (10 types) across 12 configurable procurement categories, wired to acceptance scenario 1 (FR-019)
- [ ] T070 [US5] 10 configurable Sourcing Strategies (Single/Dual/Multi Source, Global/Local Sourcing, Sustainable Sourcing, Emergency/Strategic Procurement, Cost Optimization, Innovation Partnerships) (FR-020)
- [ ] T071 [US5] AI Strategic Sourcing intelligence (Supplier Recommendations, Cost Forecasts, Category Optimization, Market Intelligence, Negotiation Insights, Opportunities, Demand Predictions, Capacity Forecasts, Sourcing Risk Analysis, Executive Insights) as advisory (FR-021)
- [ ] T072 [US5] RFQ/RFP/RFI management standardizing procurement requests with transparency/fairness/auditability, wired to T008 (FR-022)
- [ ] T073 [US5] RFQ Management (creation, invitations, pricing templates, deadlines, bid comparison, clarification requests, evaluation workflow, vendor selection, approval workflow, award notifications) and RFP Management (scope definition, requirements, evaluation criteria, submission, presentation scheduling, technical/commercial scoring, final recommendation, executive approval), wired to acceptance scenarios 2–3 (FR-023)
- [ ] T074 [US5] RFI Management (market research, supplier discovery, capability assessment, information collection, technology evaluation, innovation identification, prequalification, knowledge repository, comparison, planning) and the 10-criteria Evaluation Framework, wired to acceptance scenario 1 (FR-024)
- [ ] T075 [US5] AI Procurement Evaluation intelligence (proposal comparison, vendor ranking, commercial analysis, technical gap analysis, bid scoring, risk detection, recommendation engine, forecasting, decision support, executive evaluation reports) as advisory, with the final vendor award decision recorded as an explicit human/executive action, wired to acceptance scenario 4 (FR-025)
- [ ] T076 [P] [US5] Strategic Sourcing & RFx Evaluation UI
- [ ] T077 [US5] Integration test: an RFI supports discovery/assessment/prequalification feeding a subsequent RFQ/RFP, an RFQ's bid comparison and clarification requests precede the vendor-selection evaluation workflow, an RFP captures separate Technical and Commercial Scoring before an Executive-Approval-requiring Final Recommendation, AI proposal comparison/ranking is decision-support only with the award recorded as a human action — all 4 acceptance scenarios in `backend/tests/integration/us5-strategic-sourcing-rfx.integration.test.ts`

**Checkpoint**: The primary mechanism for competitive, auditable vendor selection ahead of purchase orders is independently functional.

---

## Phase 8: User Story 6 — AI Supplier Intelligence Benchmarking Including ESG Compliance as a Scoring Input (Priority: P2)

**Independent Test**: Generate an AI Supplier Intelligence benchmarking report for a set of active suppliers, confirm ESG Compliance appears as a scored dimension alongside the other nine performance metrics, and confirm the resulting Preferred Supplier Ranking and Procurement Health Index reflect that ESG input.

- [ ] T078 [US6] AI Supplier Intelligence platform continuous analysis (performance, procurement history, commercial risk, financial health, compliance posture, sourcing efficiency, strategic business value), wired to T013 (FR-026)
- [ ] T079 [US6] 10-dimension continuous Supplier Performance Intelligence (On-Time Delivery, Quality Performance, Procurement Cost, Invoice Accuracy, Contract Compliance, Issue Resolution Time, Innovation Contribution, Customer Satisfaction, **ESG Compliance**, Procurement Efficiency), with ESG Compliance feeding into Supplier Risk Rating and Qualification Criteria, wired to acceptance scenario 1 (FR-027)
- [ ] T080 [US6] Executive AI Insights (Preferred Supplier Rankings, Procurement Health Index, Supplier Risk Dashboard, Spend Distribution, Sourcing Opportunities, Savings, Performance Trends, Compliance, Forecasts, Recommendations), wired to acceptance scenario 3 (FR-028)
- [ ] T081 [US6] Explainable/configurable/continuously-monitored/fully-auditable/governance-compliant requirement on all AI procurement and supplier-intelligence recommendations, wired to acceptance scenarios 2 and 4 (FR-029)
- [ ] T082 [P] [US6] AI Supplier Intelligence & ESG Benchmarking UI
- [ ] T083 [US6] Integration test: a performance-history supplier produces scores across all 10 dimensions including ESG, a materially changed ESG score is reflected in Preferred Vendor Recommendations/Risk Rating with an explainable rationale, Executive AI Insights include ESG Compliance among reported metrics, an ESG-triggered risk downgrade remains a human decision for any consequential action — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-supplier-esg-benchmarking.integration.test.ts`

**Checkpoint**: The intelligence layer materially improving sourcing and vendor-management decisions on top of an already-qualified supplier base is independently functional.

---

## Phase 9: User Story 7 — AI-Driven Inventory Procurement Automation Within Configurable Human-Set Rules (Priority: P2)

**Independent Test**: Configure reorder rules for one SKU, simulate inventory dropping below its configured Reorder Point, and confirm the platform automatically generates a Purchase Request/Purchase Order that still passes through Budget Validation and Approval, while a simulated overstock condition raises an alert instead of an automatic order.

- [ ] T084 [US7] Automatic inventory replenishment/stock optimization/procurement planning/demand forecasting/replenishment execution based on configurable business rules, wired to T009 (FR-034)
- [ ] T085 [US7] Continuous inventory monitoring (Available, Reserved, Safety Stock, Reorder Point, Min/Max Stock, In-Transit, Backorders, Supplier Lead Time, Warehouse Capacity) plus configurable Automated Procurement Rules, wired to acceptance scenarios 1 and 3 (FR-035)
- [ ] T086 [US7] Demand forecasting (10 inputs) plus procurement/inventory optimization (10 dimensions), wired to acceptance scenario 2 (FR-036)
- [ ] T087 [US7] AI Inventory Intelligence (demand predictions, health scores, procurement recommendations, stockout/overstock detection, lead-time analysis, forecasts, optimization, cost reduction, executive insights) as advisory, with automatically generated reorder PRs/POs still passing standard Budget Validation and Approval, wired to acceptance scenario 4 (FR-037)
- [ ] T088 [P] [US7] Inventory Procurement Automation UI
- [ ] T089 [US7] Integration test: a below-Reorder-Point SKU auto-generates a PR/PO sized per the configured rule that still enters standard Budget Validation/Approval, an updated demand-spike forecast adjusts the recommendation and surfaces to the Inventory Manager, a projected-overstock evaluation applies Overstock Prevention and raises an alert rather than an automatic order, an Emergency-Procurement-triggering condition still routes through an expedited-but-present approval step — all 4 acceptance scenarios in `backend/tests/integration/us7-inventory-procurement-automation.integration.test.ts`

**Checkpoint**: Automated replenishment bounded by the same governance controls established for manual purchase requests is independently functional.

---

## Phase 10: User Story 8 — Executive Procurement Health, Spend Analytics & AI Intelligence Dashboard (Priority: P3)

**Independent Test**: Generate the Executive Procurement Dashboard after at least one completed procurement cycle and confirm Total Spend, Procurement Health Index, Supplier Performance, and at least one AI-generated forecast render correctly, with AI-generated content visibly distinguished from factual reporting.

- [ ] T090 [US8] Procurement data transformation into executive intelligence across 10 analytics domains, wired to acceptance scenario 1 (FR-059)
- [ ] T091 [US8] Spend Intelligence Metrics (15 measures) plus the Executive Procurement Dashboard (Procurement Health Index, Total Spend, Supplier Performance, Contract Status, Procurement Risks, Cost Savings, Inventory Procurement, Budget Performance, AI Forecasts, Strategic Procurement KPIs), wired to acceptance scenarios 1 and 3 (FR-060)
- [ ] T092 [US8] AI Spend Intelligence (spend forecasting, cost optimization, supplier recommendations, budget predictions, risk analysis, category optimization, contract intelligence, savings opportunities, executive alerts, strategic recommendations) explainable/auditable/configurable/monitored/compliant, wired to acceptance scenario 2 (FR-061)
- [ ] T093 [P] [US8] Executive Procurement Dashboard UI
- [ ] T094 [US8] Integration test: completed transactions render Spend Analytics as consolidated, accurate figures, an AI spend forecast/savings-opportunity is displayed as an explainable AI insight distinct from factual figures, a category drill-down surfaces relevant Procurement Risk Analytics and AI Executive Insights, a scheduled reporting cadence produces exportable dashboard content — all 4 acceptance scenarios in `backend/tests/integration/us8-executive-procurement-dashboard.integration.test.ts`

**Checkpoint**: The consolidated, downstream reporting capability depending on all other procurement data is independently functional.

---

## Phase 11: Contract Procurement Management, Enterprise Procurement Portal, Security & Compliance, Cross-Cutting Financial Governance (supports FR-046–FR-048, FR-052–FR-054, FR-055–FR-058, FR-062–FR-064; cross-cutting, no single owning story)

- [ ] T095 Enterprise Contract Procurement platform across 10 contract types (MSAs, Framework Agreements, Purchase Contracts, Subscription/Licensing Agreements, Outsourcing/Technology/Professional Services/Maintenance Contracts, Enterprise Procurement Agreements), wired to T015 (FR-046)
- [ ] T096 11-stage Contract Lifecycle (Draft→Archival) plus Clause Library, version control, templates, renewal alerts, obligation tracking, vendor commitments, spend limits, compliance monitoring, digital signatures, audit logs (FR-047)
- [ ] T097 AI Contract Intelligence (summarization, risk detection, missing clause detection, compliance monitoring, renewal predictions, pricing benchmarking, obligation tracking, opportunity analysis, executive insights, negotiation assistance) as advisory, with a hard block on autonomous execute/sign/bind (FR-048)
- [ ] T098 Unified Enterprise Procurement Portal (18 modules) for 16 portal user roles, wired to T025's `003`-reuse note (FR-052)
- [ ] T099 Personalized per-user workspace (11 elements) adapting to role/department/geography/business-unit/permissions, plus a mobile Procurement Portal (10 capabilities) (FR-053)
- [ ] T100 AI Procurement Portal Intelligence (priorities, vendor recommendations, spend alerts, budget warnings, forecasts, contract alerts, inventory recommendations, risk notifications, executive briefings, daily summaries) as advisory (FR-054)
- [ ] T101 Identity & Access Management (RBAC, ABAC, MFA, SSO, passwordless, privileged access management, device authentication, session management, API authentication, conditional access) (FR-055)
- [ ] T102 10-label procurement data classification plus Data Protection controls (encryption, tokenization, secure document storage, digital signatures, secure backups, DR, data masking, secure deletion, key management, watermarking) (FR-056)
- [ ] T103 9 named compliance frameworks with configurable extensibility plus immutable audit logs across 12 event categories (FR-057)
- [ ] T104 Procurement fraud, duplicate PO, unauthorized purchase, contract violation, invoice fraud, supplier fraud, insider threat, API abuse, data leakage, AI misuse detection plus AI Governance (10 controls) across every AI capability (FR-058)
- [ ] T105 Budget validation before every PR/PO approval plus mandatory, non-bypassable Three-Way Matching before payment authorization (FR-062)
- [ ] T106 Unique supplier master record, automated qualification workflows, continuous vendor-performance monitoring, full supplier-compliance-document lifecycle management, immutable contract/transaction traceability (FR-063)
- [ ] T107 Enterprise scalability to millions of PRs/POs/suppliers across global/multi-language/multi-currency/multi-region/high-availability operations (FR-064)
- [ ] T108 [P] Contract Procurement, Portal, Security/Compliance & Financial Governance UI

---

## Phase 12: Polish — Final Validation

- [ ] T109 Resolve and document the 12 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`, including mandatory re-verification of the `055`/`057` canonicity claim and the `009` "Purchase Order" naming disambiguation
- [ ] T110 Final audit: cross-check every FR-001–FR-067 against an implementation or validation task; re-verify the `009`, `003`/`001`/`016` reuse decisions are respected, and confirm the `056`/`057` boundaries remain explicitly flagged rather than silently assumed
- [ ] T111 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `009`'s payment-execution infrastructure and `003`'s auth foundation, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US4)**: US1 (Supplier Lifecycle) is the foundational data and governance layer every other procurement capability depends on and must land first; US2 (Budget-Validated PR-to-PO Approval) depends on US1's qualified supplier existing as a counterparty; US3 (Three-Way Match Gate) depends on US2's PO existing to match against; US4 (AI Recommendation Human-Approval Gate) is cross-cutting and should be validated continuously alongside US1–US3.
- **P2 stories (US5, US6, US7)**: US5 (Strategic Sourcing/RFx) depends on US1's qualified supplier pool; US6 (AI Supplier Intelligence/ESG) depends on US1's active suppliers already producing performance history; US7 (Inventory Procurement Automation) depends on US2's Budget Validation/Approval Workflow already existing to route through.
- **P3 story (US8)** depends on US1–US7 already producing data to analyze, and should land last among the numbered stories.
- **Phase 11 (Contract Procurement/Portal/Security-Compliance/Financial-Governance remainder)** depends on Foundational, US1, and US2; should land alongside US5–US7.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (purchase-request-budget-validation-before-approval, three-way-match-zero-auto-payment-on-exception, ai-procurement-recommendation-zero-autonomous-strategic-action) pass → US1 (Supplier Lifecycle) → **STOP and VALIDATE** the foundational vendor/governance layer is sound → US2 (PR-to-PO Approval) → US3 (Three-Way Match Gate) → **STOP and VALIDATE** every financial-governance control (budget, approval, three-way match) blocks correctly → US4 (AI Recommendation Human-Approval Gate) + US5 (Strategic Sourcing/RFx) → US6 (AI Supplier Intelligence/ESG) + US7 (Inventory Procurement Automation) + Phase 11 (Contract/Portal/Security-Compliance remainder) → US8 (Executive Dashboard) → Polish.
