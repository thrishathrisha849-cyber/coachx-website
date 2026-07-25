---
description: "Task list for Feature 058 — Enterprise Finance, Accounting & Treasury Management"
---

# Tasks: Enterprise Finance, Accounting & Treasury Management

**Input**: Design documents from `/specs/058-finance-accounting-treasury/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis confirming the `009` boundary with specific verified FR evidence, and surfacing a new finding that `058`'s Budget entity is the canonical source `055` and `057` already depend on but never resolved), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `009`'s transactional sub-ledger, `008`'s `ai-gateway`/`ai-guardrails`, and `055`'s Purchase Order/Purchase Request infrastructure exist as coordination points.

**Tests**: Included throughout — period-lock enforcement, GL journal-entry balance/audit integrity, and the AI-financial-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Tax Management, Financial Reporting, Security/Compliance remainder, Enterprise Integrations).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `009`'s transactional sub-ledger, `008`'s `ai-gateway`/`ai-guardrails`, and `055`'s Purchase Order/Purchase Request infrastructure exist as coordination points
- [ ] T002 Resolve `research.md` open items before proceeding: the Financial Health Score and Compliance Score calculation methodology (explicitly self-flagged), Treasury KPI exact formulas and zero-denominator/overdraft edge-case handling (explicitly self-flagged), multi-currency rounding-difference consolidation rule, AI duplicate-payment false-positive dismissal behavior, Treasury KPI display when cash position is negative, reversing-entry routing when the original period is closed, three-way-match tolerance exceptions, mid-period asset disposal proration, unreconciled bank-statement-item handling, and never-reviewed AI recommendation expiry behavior
- [ ] T003 [P] Add `backend/src/modules/finance/{platform-foundation,general-ledger,accounts-payable,accounts-receivable,period-locking-compliance,cash-bank-treasury,ai-financial-forecasting-assistant,ai-fraud-duplicate-detection,fixed-assets,budgeting-forecasting,tax-management,financial-reporting,security-compliance-remainder,enterprise-integrations}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `GL Journal Entry` entity in `backend/src/modules/finance/general-ledger/gl-journal-entry.entity.ts`
- [ ] T005 [P] Define the `Chart of Accounts` entity in `backend/src/modules/finance/general-ledger/chart-of-accounts.entity.ts`
- [ ] T006 [P] Define the `Fiscal Period` entity in `backend/src/modules/finance/period-locking-compliance/fiscal-period.entity.ts`
- [ ] T007 [P] Define the `Vendor (AP) Invoice` entity in `backend/src/modules/finance/accounts-payable/vendor-invoice.entity.ts`
- [ ] T008 [P] Define the `Customer (AR) Invoice` entity in `backend/src/modules/finance/accounts-receivable/customer-invoice.entity.ts`
- [ ] T009 [P] Define the `Bank Account` entity in `backend/src/modules/finance/cash-bank-treasury/bank-account.entity.ts`
- [ ] T010 [P] Define the `Bank Reconciliation` entity in `backend/src/modules/finance/cash-bank-treasury/bank-reconciliation.entity.ts`
- [ ] T011 [P] Define the `Budget` entity in `backend/src/modules/finance/budgeting-forecasting/budget.entity.ts`
- [ ] T012 [P] Define the `Fixed Asset` entity in `backend/src/modules/finance/fixed-assets/fixed-asset.entity.ts`
- [ ] T013 [P] Define the `Depreciation Schedule` entity in `backend/src/modules/finance/fixed-assets/depreciation-schedule.entity.ts`
- [ ] T014 [P] Define the `Tax Record` entity in `backend/src/modules/finance/tax-management/tax-record.entity.ts`
- [ ] T015 [P] Define the `Treasury Position` entity in `backend/src/modules/finance/cash-bank-treasury/treasury-position.entity.ts`
- [ ] T016 [P] Define the `Payment Factory Transaction` entity in `backend/src/modules/finance/cash-bank-treasury/payment-factory-transaction.entity.ts`
- [ ] T017 [P] Define the `Borrowing / Loan` entity in `backend/src/modules/finance/cash-bank-treasury/borrowing-loan.entity.ts`
- [ ] T018 [P] Define the `AI Financial Recommendation` entity in `backend/src/modules/finance/ai-financial-forecasting-assistant/ai-financial-recommendation.entity.ts`
- [ ] T019 [P] Define the `Audit Log Entry` entity in `backend/src/modules/finance/period-locking-compliance/audit-log-entry.entity.ts`
- [ ] T020 Secure, AI-powered financial management ecosystem covering accounting, treasury, banking, budgeting, taxation, compliance, asset accounting, and enterprise reporting for all business units (FR-001)
- [ ] T021 Complete financial integrity, real-time visibility, audit compliance, and multi-company/multi-currency/multi-branch support (FR-002)
- [ ] T022 Budget types (Annual, Quarterly, Monthly, Department, Project, Marketing, HR, IT, Capital, Operational), wired to T011 (FR-027)
- [ ] T023 Budget workflow (Budget Creation→Department Review→Finance Review→Executive Approval→Budget Lock→Monitoring→Variance Analysis) (FR-028)
- [ ] T024 Forecast types (Revenue, Expense, Cash Flow, Sales, Procurement, Investment, Workforce Cost) (FR-029)
- [ ] T025 Budget locking with post-lock-change tracking distinct from initial creation, and ongoing variance analysis against the locked budget, wired to T035's contract test (FR-030)
- [ ] T026 Note: `009` owns the customer-facing transactional sub-ledger and its own settlement-period close (16-item chart of ledger accounts, platform-transaction-scoped); `058` owns the enterprise's full multi-entity Chart of Accounts and enterprise-wide fiscal period lock — `009`'s settlement-closed, summarized transactions post into `058`'s GL as batched journal entries, not re-implemented (per plan.md §1)
- [ ] T027 Note: this feature's Budget entity (T011) is the canonical, single source of truth for all department/project/organizational budgets — `055`'s "Budget Reference"/"Budget Validation" on Purchase Requests/Purchase Orders and `057`'s AI Procurement Assistant budget-variance queries now formally consume this entity rather than an undefined external concept, a genuine cross-feature gap neither `055` nor `057` caught in their own planning (per plan.md §2)
- [ ] T028 Note: AI Financial Intelligence and the AI Assistant reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but build their own structured-financial-data query/grounding layer — distinct from `050`'s document-RAG pipeline, consistent with the pattern established for `056`/`057` (per plan.md §3)
- [ ] T029 Note: Segregation of Duties (SoD) is enforced through `001`'s/`016`'s layered RBAC engine applied to finance-specific roles, terminologically consistent with `057`'s established canonical use of the "SoD" term rather than a competing definition (per plan.md §4)
- [ ] T030 Note: Enterprise Integrations connect to the already-confirmed `055`/`056`/`057` boundaries (per plan.md §5); `059` (HRMS Payroll) and `060` (CRM) remain forward-declared, not yet planned
- [ ] T031 Contract test: 100% of attempted postings, edits, or deletions to transactions dated within a Closed fiscal period are rejected for every role outside the audited reopening flow, in `backend/tests/contract/period-lock-100pct-rejection-of-closed-period-transactions.contract.test.ts` (SC-001)
- [ ] T032 Contract test: 100% of General Ledger journal entries reaching Posted status are balanced (debits equal credits) and carry a complete audit trail (creator, approver, posting timestamp), in `backend/tests/contract/gl-journal-entry-100pct-balanced-with-audit-trail.contract.test.ts` (SC-002)
- [ ] T033 Contract test: every AI Financial Intelligence recommendation and fraud/duplicate flag carries a confidence score and remains advisory, with 0% auto-applied to budgets, payments, or ledger postings without explicit human approval, in `backend/tests/contract/ai-financial-recommendation-zero-autonomous-consequential-action.contract.test.ts` (SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Post a General Ledger Journal Entry Through Approval (Priority: P1) 🎯 MVP

**Independent Test**: Create a draft journal entry against valid Chart of Accounts codes, route it through validation and approval, post it, and confirm the ledger balance and audit log both reflect the entry.

- [ ] T034 [US1] Central financial repository (General Ledger) into which all other finance modules post, wired to T004 (FR-003)
- [ ] T035 [US1] Chart of Accounts across 10 categories (Assets, Liabilities, Equity, Revenue, Expenses, COGS, Operating Expenses, Taxes, Depreciation, Miscellaneous), wired to T005 (FR-004)
- [ ] T036 [US1] Journal entries, automatic posting, recurring entries, accrual accounting, reversing entries, wired to acceptance scenario 4 (FR-005)
- [ ] T037 [US1] Multi-entity accounting, cost centers, profit centers, intercompany accounting (FR-006)
- [ ] T038 [US1] Fiscal period management including closing and reopening periods, wired to T006 (FR-007)
- [ ] T039 [US1] Journal entry workflow (Journal Creation→Validation→Approval→Posting→Ledger Update→Audit Log), wired to acceptance scenarios 1–2 (FR-008)
- [ ] T040 [US1] Journal entry status values (Draft, Pending Approval, Approved, Posted, Reversed, Cancelled) (FR-009)
- [ ] T041 [US1] Reject unbalanced journal entries at validation, blocking advancement to Pending Approval or Posted, wired to T032's contract test, acceptance scenario 1 (FR-010)
- [ ] T042 [US1] Reversing-entry-only correction of posted entries — never modify the original posted entry, wired to acceptance scenario 3 (FR-011)
- [ ] T043 [P] [US1] General Ledger Journal Entry & Approval UI
- [ ] T044 [US1] Integration test: an unbalanced draft journal entry is rejected at validation and does not advance to Pending Approval, an approved balanced entry moves to Posted status with ledger balances and audit log both updating, a reversing entry against an incorrect Posted entry creates a new offsetting entry referencing the original rather than modifying it, a recurring journal entry template generates a new draft entry for review at its scheduled date rather than auto-posting — all 4 acceptance scenarios in `backend/tests/integration/us1-gl-journal-entry-approval.integration.test.ts`

**Checkpoint**: The central financial repository every other module posts into is independently functional.

---

## Phase 4: User Story 2 — Process an Accounts Payable Vendor Invoice Through Payment (Priority: P1)

**Independent Test**: Submit a vendor invoice, match it to its PO and goods receipt, approve it, generate the accounting entry, schedule and execute payment, and confirm the outstanding payables balance and vendor aging report update correctly.

- [ ] T045 [US2] Accounts Payable managing supplier liabilities (vendor invoice processing, invoice verification, PO matching, goods receipt matching), wired to T007 (FR-012)
- [ ] T046 [US2] Payment approval, payment scheduling, vendor credit notes, debit notes, advance payments, partial payments (FR-013)
- [ ] T047 [US2] Outstanding payables tracking and vendor aging analysis, wired to acceptance scenario 4 (FR-014)
- [ ] T048 [US2] AP invoice workflow (Invoice Received→Verification→Approval→Accounting Entry→Payment Schedule→Payment→Reconciliation), wired to acceptance scenarios 1–2 (FR-015)
- [ ] T049 [US2] AP payment methods (Bank Transfer, UPI, NEFT, RTGS, IMPS, Cheque, Credit Card, Digital Wallet, International Wire Transfer), wired to acceptance scenario 3 (FR-016)
- [ ] T050 [US2] Reconciliation of every executed AP payment against its source invoice (FR-017)
- [ ] T051 [P] [US2] Accounts Payable Invoice-to-Payment UI
- [ ] T052 [US2] Integration test: invoice verification checks a PO-referencing invoice against the PO and goods receipt (three-way match) before approval, an out-of-tolerance mismatch holds the invoice as an exception for manual review rather than proceeding, an approved invoice's scheduled payment via a supported method updates outstanding payables and reconciles against the invoice, the vendor aging report correctly buckets unpaid invoices by age — all 4 acceptance scenarios in `backend/tests/integration/us2-ap-invoice-to-payment.integration.test.ts`

**Checkpoint**: The cash-outflow control preventing overpayment/duplicate-payment/fraud risk is independently functional.

---

## Phase 5: User Story 3 — Manage Accounts Receivable Collection and Customer Aging (Priority: P1)

**Independent Test**: Issue a customer invoice, run it through the reminder/collection workflow, record a receipt, confirm the ledger and account reconciliation update, and verify the customer's outstanding balance appears in the correct aging bucket.

- [ ] T053 [US3] Accounts Receivable managing customer receivables (customer invoices, debit notes, credit notes, collections, receipts), wired to T008 (FR-018)
- [ ] T054 [US3] Customer aging, outstanding balances, payment reminders, refund management, bad debt management, wired to acceptance scenario 4 (FR-019)
- [ ] T055 [US3] AR collection workflow (Invoice→Customer Receives→Payment Reminder→Payment Collection→Receipt Generation→Ledger Update→Account Reconciliation), wired to acceptance scenarios 1–2 (FR-020)
- [ ] T056 [US3] AR aging buckets (Current, 1–30, 31–60, 61–90, 91–180, Above 180 Days), wired to acceptance scenario 3 (FR-021)
- [ ] T057 [US3] Receipt generation and General Ledger/account reconciliation update on every customer payment collection, wired to acceptance scenario 2 (FR-022)
- [ ] T058 [P] [US3] Accounts Receivable Collection & Aging UI
- [ ] T059 [US3] Integration test: an approaching or passed due date triggers a payment reminder to the customer, a recorded customer payment generates a receipt and updates the General Ledger/account reconciliation, an aging report places each open invoice into exactly one of the 6 buckets, an uncollectible customer balance is processed through bad debt management rather than silently deleted — all 4 acceptance scenarios in `backend/tests/integration/us3-ar-collection-aging.integration.test.ts`

**Checkpoint**: The cash-inflow and working-capital control is independently functional.

---

## Phase 6: User Story 4 — Period Locking Prevents Retroactive Edits to Closed Financial Periods (Priority: P1)

**Independent Test**: Close a fiscal period, attempt to post or edit a journal entry, AP invoice, AR invoice, or fixed asset transaction dated inside that period, and confirm the system blocks the action — then confirm an authorized reopen action is itself logged and requires elevated approval.

- [ ] T060 [US4] Enterprise-wide period locking such that a Closed fiscal period blocks posting/editing/deleting of any dated transaction across GL/AP/AR/Fixed Assets/Tax for any role, without an explicit, separately audited reopening action, wired to T006, T031's contract test, acceptance scenarios 1–3 (FR-055)
- [ ] T061 [P] [US4] Fiscal Period Close & Reopen UI
- [ ] T062 [US4] Integration test: attempting to post a new journal entry dated within a Closed period is rejected with an explicit locked-period error, attempting to edit/delete an already-posted transaction dated within a Closed period is blocked regardless of role, an authorized controller's reopen action is itself captured in the immutable audit log with actor/timestamp/reason and the period returns to Closed after the correction window, standard financial reports for a Closed period match the locked ledger state exactly with no later unposted adjustments reflected — all 4 acceptance scenarios in `backend/tests/integration/us4-period-locking.integration.test.ts`

**Checkpoint**: The platform's core historical-integrity control (Constitution Article IV) is independently functional.

---

## Phase 7: User Story 5 — Treasury Liquidity Planning, Borrowings, Currency Management, and Payment Factory (Priority: P2)

**Independent Test**: Load bank balances and cash positions into the Treasury Dashboard, compute liquidity ratio and working capital, record a borrowing with an interest schedule, execute a cross-currency payment through the Payment Factory, and confirm all eight Treasury KPIs compute from the underlying data.

- [ ] T063 [US5] Centralized treasury and banking operations (bank account management, cash books, bank reconciliation, fund transfers, petty cash, cash forecasting), wired to T009, T010 (FR-023)
- [ ] T064 [US5] Payment processing, receipt processing, bank statement import, multi-bank support (FR-024)
- [ ] T065 [US5] Bank Account full field set (Bank Name, Branch, IFSC, SWIFT, Currency, Account Number, Account Type, Opening Balance, Current Balance, Authorized Signatories) (FR-025)
- [ ] T066 [US5] Treasury Dashboard (Cash Position, Bank Balance, Cash Flow, Incoming Payments, Outgoing Payments, Liquidity Ratio, Available Working Capital, Treasury Risk), wired to acceptance scenario 1 (FR-026)
- [ ] T067 [US5] Treasury Management System covering Cash Management, Liquidity Planning, Investment Tracking, Borrowings, Loan Management, Interest Calculation, Currency Management, Treasury Risk, Payment Factory, Treasury Forecasting, wired to T015 (FR-041)
- [ ] T068 [US5] 8 Treasury KPIs (Liquidity Ratio, Cash Conversion Cycle, Working Capital, Interest Expense, Return on Investments, Debt Ratio, Current Ratio, Quick Ratio), wired to acceptance scenario 2 (FR-042)
- [ ] T069 [US5] Payment Factory centrally processing and reconciling outgoing payments across banks/currencies, wired to T016, acceptance scenario 4 (FR-043)
- [ ] T070 [US5] Borrowings/loans with interest calculation reflected in Treasury KPIs, wired to T017, acceptance scenario 2 (FR-044)
- [ ] T071 [US5] Multi-currency exposure management (Currency Management) exposed as part of Treasury Risk, wired to acceptance scenario 3 (FR-045)
- [ ] T072 [P] [US5] Treasury Dashboard & Payment Factory UI
- [ ] T073 [US5] Integration test: the Treasury Dashboard displays all 8 required metrics from current bank balances and near-term flows, a newly recorded borrowing's terms calculate interest accrual reflected in the Interest Expense KPI, multi-currency transactions consolidate with correct exchange-rate treatment and exposed Treasury Risk, multiple outgoing payments across banks/currencies route through the Payment Factory for central processing and reconciliation rather than ad hoc execution — all 4 acceptance scenarios in `backend/tests/integration/us5-treasury-payment-factory.integration.test.ts`

**Checkpoint**: Enterprise liquidity and financial-risk management is independently functional.

---

## Phase 8: User Story 6 — AI-Powered Cash-Flow Forecasting and Financial Assistant Queries (Priority: P2)

**Independent Test**: Pose each of the ten defined AI Assistant questions against a populated financial dataset and confirm each response returns a forecast/answer accompanied by supporting data and, where a recommendation, the full required field set.

- [ ] T074 [US6] AI continuous analysis of enterprise financial operations (Revenue Prediction, Expense Forecasting, Cash Flow Forecasting, Cost Optimization, Budget Recommendations, Vendor Payment Optimization, Customer Collection Prediction, Financial Risk Analysis, Tax Risk Detection), wired to T018, acceptance scenario 1 (FR-046)
- [ ] T075 [US6] AI Assistant answering finance-user natural-language queries across the 10 documented example question types, wired to acceptance scenario 3 (FR-047)
- [ ] T076 [US6] Deterministic, non-AI fallback (existing ledger reports, Treasury Dashboard, standard AP/AR controls) for every AI Financial Intelligence capability, wired to acceptance scenario 4 (FR-050)
- [ ] T077 [P] [US6] AI Financial Assistant chat UI
- [ ] T078 [US6] Integration test: a cash-flow-forecast request against historical revenue/expense/cash data returns a projected cash position with supporting data and confidence score, a "which departments exceeded budget?" query returns department-level budget-vs-actual variance drawn from Budgeting & GL data, an AI-service-unavailable scenario falls back to the deterministic Cash Flow Statement and Treasury Dashboard rather than failing the request — 3 of the 4 acceptance scenarios (the recommendation-field-set scenario is covered by US7's T082) in `backend/tests/integration/us6-ai-cash-flow-forecasting-assistant.integration.test.ts`

**Checkpoint**: The AI augmentation layer over the P1 ledger/reporting flows is independently functional.

---

## Phase 9: User Story 7 — AI Duplicate-Payment and Invoice-Fraud Detection (Priority: P2)

**Independent Test**: Submit a set of vendor invoices including an intentional duplicate alongside legitimate invoices, run the AI scan, and confirm the duplicate is flagged with supporting data and confidence score for human review while legitimate invoices proceed unaffected.

- [ ] T079 [US7] AI recommendation full field set (Recommendation, Supporting Data, Confidence Score, Financial Impact, Risk Level, Suggested Action, Responsible Department, Expected Savings) applied to fraud/duplicate flags, wired to acceptance scenario 2 (FR-048)
- [ ] T080 [US7] Advisory-only governance: every AI Financial Intelligence output (forecast, recommendation, fraud flag) requires explicit human approval before any consequential action, wired to T033's contract test, acceptance scenarios 1, 3, 4 (FR-049)
- [ ] T081 [P] [US7] AI Duplicate-Payment/Fraud Detection review UI
- [ ] T082 [US7] Integration test: two vendor invoices with matching vendor/amount/date within a short window are flagged as a possible duplicate with supporting data/confidence score and neither auto-paid nor auto-rejected, an AP reviewer's dismissal of a confirmed-legitimate recurring-charge flag is recorded in the audit log, an invoice pattern matching known fraud indicators is flagged with a risk level and routed for finance review before payment scheduling, an AI-fraud-detection-service-unavailable scenario still applies the existing deterministic three-way-match and payment-approval controls — all 4 acceptance scenarios in `backend/tests/integration/us7-ai-duplicate-fraud-detection.integration.test.ts`

**Checkpoint**: The financial-control safeguard protecting disbursed cash from being unrecoverable is independently functional.

---

## Phase 10: User Story 8 — Fixed Asset Lifecycle Accounting from Capitalization Through Disposal (Priority: P3)

**Independent Test**: Capitalize a purchased asset, apply a depreciation method to generate a depreciation schedule, run it for at least one period to confirm the GL depreciation entry posts, then dispose of the asset to confirm gain/loss on disposal is recorded and the asset is retired.

- [ ] T083 [US8] Complete financial lifecycle management across 12 asset categories (Buildings, Land, Furniture, Vehicles, Machinery, Computers, Servers, Mobile Devices, Software Licenses, Office Equipment, Warehouse Equipment, Infrastructure), wired to T012, acceptance scenario 1 (FR-031)
- [ ] T084 [US8] Asset lifecycle stages (Purchase→Capitalization→Depreciation→Maintenance→Revaluation→Transfer→Disposal→Retirement), wired to acceptance scenarios 3–4 (FR-032)
- [ ] T085 [US8] Depreciation methods (Straight Line, Written Down Value, Double Declining Balance, Units of Production, Custom Depreciation Rules), wired to T013, acceptance scenario 2 (FR-033)
- [ ] T086 [US8] Period depreciation calculation/GL posting and gain-or-loss-on-disposal calculation, wired to acceptance scenarios 2, 4 (FR-034)
- [ ] T087 [P] [US8] Fixed Asset Register & Depreciation UI
- [ ] T088 [US8] Integration test: a capitalized asset is assigned to a category and appears on the Fixed Asset Register, a capitalized asset with an assigned depreciation method calculates and posts the period's GL depreciation entry at period close, a revalued or transferred asset updates both the Fixed Asset Register and GL with an audit trail, a disposed/retired asset's gain-or-loss is calculated and posted while the asset is removed from the active register — all 4 acceptance scenarios in `backend/tests/integration/us8-fixed-asset-lifecycle.integration.test.ts`

**Checkpoint**: The complete asset financial lifecycle reconciled to the GL is independently functional.

---

## Phase 11: Tax Management, Financial Reporting, Security/Compliance Remainder & Enterprise Integrations (supports FR-035–FR-040, FR-051–FR-054, FR-056–FR-058; cross-cutting, no single owning story)

- [ ] T089 Tax compliance automation across 10 tax types (GST, CGST, SGST, IGST, TDS, TCS, VAT, Service Tax, Customs Duty, Withholding Tax), wired to T014 (FR-035)
- [ ] T090 Tax calculation, tax rules, exemptions, reverse charge handling, tax adjustments, tax returns, tax audit support, digital filing, dedicated tax ledger (FR-036)
- [ ] T091 Tax compliance monitoring (due dates, filing status, outstanding taxes, interest calculation, penalties, compliance score) (FR-037)
- [ ] T092 AI tax-risk detection surfaced through compliance monitoring (FR-038)
- [ ] T093 Real-time standard financial reports (Balance Sheet, P&L, Trial Balance, Cash Flow Statement, General Ledger, Journal Register, AP Aging, AR Aging, Budget vs Actual, Cost Center Report, Profit Center Report, Tax Reports, Fixed Asset Register, Bank Reconciliation Report) (FR-039)
- [ ] T094 Executive Dashboard (Revenue, Expenses, Gross Profit, Net Profit, EBITDA, Cash Position, Working Capital, Outstanding Receivables/Payables, Budget Utilization, Tax Liability, Financial Health Score) (FR-040)
- [ ] T095 RBAC and Segregation of Duties (SoD) enforcement across all finance modules, wired to T029's terminology-consistency note (FR-051)
- [ ] T096 Multi-level approvals and digital signatures for financial transactions and journal entries (FR-052)
- [ ] T097 Encryption of financial data at rest and in transit (FR-053)
- [ ] T098 Immutable audit logs for all financial transactions, approvals, reversals, and period reopening actions, wired to T019 (FR-054)
- [ ] T099 Compliance monitoring and financial policy enforcement across all modules (FR-056)
- [ ] T100 Integration with Procurement (`055`), Inventory & Warehouse (`056`), Sales, CRM (`060`, forward-declared), HRMS, Payroll (`059`, forward-declared), Project Management, Asset Management, wired to T030's confirmed/forward-declared note (FR-057)
- [ ] T101 Integration with Banking APIs, Payment Gateways, Tax Platforms, Business Intelligence, the AI Platform (`008`), Document Management, Notification Service, Workflow Engine, API Gateway (FR-058)
- [ ] T102 [P] Tax Management, Financial Reporting, Security/Compliance & Integrations UI

---

## Phase 12: Polish — Final Validation

- [ ] T103 Resolve and document the 11 preserved NEEDS CLARIFICATION items (2 self-flagged, 9 from Edge Cases) not already closed by `research.md`
- [ ] T104 Final audit: cross-check every FR-001–FR-058 against an implementation or validation task; re-verify the `009`, `055`/`057`-Budget, `008`, `001`/`016` reuse decisions are respected, and confirm `059`/`060` remain explicitly forward-declared rather than silently assumed
- [ ] T105 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `009`'s transactional sub-ledger, `008`'s `ai-gateway`/`ai-guardrails`, and `055`'s Purchase Order/Purchase Request infrastructure, and produces the entity/reuse-note infrastructure every subsequent phase depends on — including the new canonical Budget entity `055`/`057` will consume.
- **P1 stories (US1, US2, US3, US4)**: US1 (GL Journal Entry) is the central financial repository every other module posts into and must land first; US2 (AP) and US3 (AR) both depend on US1's GL existing to post into, and can be built in parallel with each other; US4 (Period Locking) depends on US1's Fiscal Period entity and should be validated against US1/US2/US3 transactions once all three exist.
- **P2 stories (US5, US6, US7)**: US5 (Treasury) depends on US1–US3's GL/AP/AR data as its underlying cash/bank/borrowing inputs; US6 (AI Forecasting/Assistant) and US7 (AI Fraud/Duplicate Detection) both depend on US1–US3's transactional data existing to analyze, and can be built in parallel with each other.
- **P3 story (US8)** depends on US1's GL existing to post depreciation/disposal entries into, and is independent of US2–US7.
- **Phase 11 (Tax/Reporting/Security-remainder/Integrations)** depends on Foundational and US1–US3; should land alongside US5–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes, canonical Budget entity) → **STOP and VALIDATE** the three Foundational contract tests (period-lock-100pct-rejection-of-closed-period-transactions, gl-journal-entry-100pct-balanced-with-audit-trail, ai-financial-recommendation-zero-autonomous-consequential-action) pass → US1 (GL Journal Entry) → **STOP and VALIDATE** the central financial repository is sound → US2 (AP) + US3 (AR) → US4 (Period Locking) → **STOP and VALIDATE** every P1 financial-control gate (balance, three-way-match, period-lock) blocks correctly → US5 (Treasury) + US6 (AI Forecasting) + US7 (AI Fraud Detection) + Phase 11 (Tax/Reporting/Integrations) → US8 (Fixed Assets) → Polish.
