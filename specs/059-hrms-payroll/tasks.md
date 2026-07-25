---
description: "Task list for Feature 059 — Enterprise HRMS & Payroll"
---

# Tasks: Enterprise HRMS & Payroll

**Input**: Design documents from `/specs/059-hrms-payroll/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis confirming `004`/`012` have no functional overlap while flagging a Candidate/Offer naming disambiguation with `012`, confirming the bidirectional `058` GL-posting relationship, and clarifying the `058` Workforce Cost Forecast terminology), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `003`'s auth infrastructure, `008`'s `ai-gateway`/`ai-guardrails`, and `058`'s General Ledger exist as consumption/coordination points.

**Tests**: Included throughout — the onboarding-checklist completeness gate, payroll-anomaly disbursement block, and the AI-HR-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-006, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (embedded corporate Learning & Development, HR Security & Compliance remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `003`'s auth infrastructure, `008`'s `ai-gateway`/`ai-guardrails`, and `058`'s General Ledger exist as consumption/coordination points
- [ ] T002 Resolve `research.md` open items before proceeding: jurisdiction-specific statutory payroll rule sets beyond India-first PF/ESI/Professional Tax naming, leave accrual/carry-forward/negative-balance default values per leave type, AI attrition/promotion-readiness/payroll-anomaly model retraining cadence and bias-audit process, false-positive payroll-anomaly expedited-override path, multi-policy leave-balance reconciliation on mid-year transfer, offboarding-during-open-AI-flag handling, right-to-erasure vs. statutory payroll-retention conflict, pending-approval inheritance when an approving manager is offboarded, GPS-drift tolerance/appeal for geofenced attendance, post-disbursement payroll correction representation, AI rating-bias recourse, and multi-requisition/reapplication candidate-profile handling
- [ ] T003 [P] Add `backend/src/modules/hrms/{employee-org-foundation,recruitment-ats,onboarding-offboarding,attendance-leave,performance-management,learning-development,payroll,self-service-ess-mss,ai-hr-intelligence-attrition,ai-hr-promotion-readiness,ai-hr-payroll-anomaly,security-compliance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Employee` entity in `backend/src/modules/hrms/employee-org-foundation/employee.entity.ts`
- [ ] T005 [P] Define the `Organization Unit` entity in `backend/src/modules/hrms/employee-org-foundation/organization-unit.entity.ts`
- [ ] T006 [P] Define the `Job Requisition` entity in `backend/src/modules/hrms/recruitment-ats/job-requisition.entity.ts`
- [ ] T007 [P] Define the `Candidate` entity (disambiguated from `012`'s marketplace Candidate) in `backend/src/modules/hrms/recruitment-ats/internal-candidate.entity.ts`
- [ ] T008 [P] Define the `Interview` entity in `backend/src/modules/hrms/recruitment-ats/interview.entity.ts`
- [ ] T009 [P] Define the `Offer` entity (disambiguated from `012`'s marketplace Offer Letter) in `backend/src/modules/hrms/recruitment-ats/internal-offer.entity.ts`
- [ ] T010 [P] Define the `Onboarding Checklist Instance` entity in `backend/src/modules/hrms/onboarding-offboarding/onboarding-checklist-instance.entity.ts`
- [ ] T011 [P] Define the `Offboarding Case` entity in `backend/src/modules/hrms/onboarding-offboarding/offboarding-case.entity.ts`
- [ ] T012 [P] Define the `Attendance Record` entity in `backend/src/modules/hrms/attendance-leave/attendance-record.entity.ts`
- [ ] T013 [P] Define the `Leave Policy` entity in `backend/src/modules/hrms/attendance-leave/leave-policy.entity.ts`
- [ ] T014 [P] Define the `Leave Request` entity in `backend/src/modules/hrms/attendance-leave/leave-request.entity.ts`
- [ ] T015 [P] Define the `Performance Review Cycle` entity in `backend/src/modules/hrms/performance-management/performance-review-cycle.entity.ts`
- [ ] T016 [P] Define the `Goal` entity in `backend/src/modules/hrms/performance-management/goal.entity.ts`
- [ ] T017 [P] Define the `Training Course / Enrollment` entity in `backend/src/modules/hrms/learning-development/training-course-enrollment.entity.ts`
- [ ] T018 [P] Define the `Salary Structure` entity in `backend/src/modules/hrms/payroll/salary-structure.entity.ts`
- [ ] T019 [P] Define the `Payroll Run` entity in `backend/src/modules/hrms/payroll/payroll-run.entity.ts`
- [ ] T020 [P] Define the `Payslip` entity in `backend/src/modules/hrms/payroll/payslip.entity.ts`
- [ ] T021 [P] Define the `HR Ticket` entity in `backend/src/modules/hrms/self-service-ess-mss/hr-ticket.entity.ts`
- [ ] T022 [P] Define the `AI HR Recommendation` entity in `backend/src/modules/hrms/ai-hr-intelligence-attrition/ai-hr-recommendation.entity.ts`
- [ ] T023 Complete employee lifecycle from workforce planning through recruitment, onboarding, performance, payroll, career development, exit, and alumni management as a continuous, traceable record (FR-001)
- [ ] T024 Employee Master Profile full field set (Employee ID/Code, name, photo, DOB, gender, blood group, contacts, emergency contact, address, Aadhaar, PAN, passport, department, designation, business unit, reporting manager, employment type/status, joining/confirmation date, work location, shift, bank details, salary structure, documents, skills, certifications, performance rating, attendance summary, leave balance, payroll history, training records), wired to T004 (FR-002)
- [ ] T025 Employee status state set (Applicant, Offer Sent, Joined, Probation, Confirmed, Active, On Leave, Suspended, Resigned, Notice Period, Relieved, Retired, Archived) (FR-003)
- [ ] T026 Organizational hierarchy levels (Organization, Company, Business Unit, Division, Department, Team, Project, Manager, Employee), wired to T005 (FR-004)
- [ ] T027 Multi-company, multi-branch, multi-location support within a single HRMS instance (FR-005)
- [ ] T028 Department management, team management, standard reporting hierarchy, matrix reporting (FR-006)
- [ ] T029 Position management and cost-center assignment for workforce planning (FR-007)
- [ ] T030 Organization Dashboard (total/active employees, departments, managers, open positions, vacancies, new joinees, attrition rate, headcount growth, diversity metrics) (FR-008)
- [ ] T031 Note: this feature's embedded corporate Learning & Development module is confirmed distinct from `004`'s member-facing commercial LMS — `004`'s own Structure Decision scopes it to "member-facing learning routes" with no employee-training scope (per plan.md §1)
- [ ] T032 Note: this feature's internal ATS (Candidate/Offer, T007/T009) is confirmed to have no functional overlap with `012`'s external jobs-marketplace Candidate/Offer Letter entities, though both must be documented as distinct populations to prevent cross-feature naming confusion (per plan.md §2)
- [ ] T033 Note: Payroll's accounting-entry step posts into `058`'s General Ledger as the confirmed destination, closing `058/plan.md` §5's forward-declared HRMS/Payroll integration item; this feature does not implement its own general ledger (per plan.md §3)
- [ ] T034 Note: this feature's AI payroll forecast/Payroll Cost report are operational outputs that feed into `058`'s budget-cycle "Workforce Cost Forecast" as an input signal, not a competing definition of the same forecast (per plan.md §4)
- [ ] T035 Note: AI HR Intelligence and the AI HR Assistant reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but build their own structured-HR-data query/grounding layer, consistent with the pattern established for `056`/`057`/`058` (per plan.md §5)
- [ ] T036 Note: ESS/MSS login technically reuses `003`'s auth/session infrastructure while Employee is a genuinely new HR-domain population `003` does not otherwise model; RBAC configures `001`'s/`016`'s existing layered engine for HR-specific roles (per plan.md §6)
- [ ] T037 Contract test: 100% of new hires reach Active/Confirmed status only after every required onboarding checklist item is recorded complete, in `backend/tests/contract/onboarding-checklist-100pct-complete-before-active-status.contract.test.ts` (SC-002)
- [ ] T038 Contract test: 100% of flagged payroll anomalies are resolved (cleared or corrected) before their associated line item is disbursed, without blocking unflagged line items in the same run, in `backend/tests/contract/payroll-anomaly-100pct-flagged-resolved-before-disbursement.contract.test.ts` (SC-006)
- [ ] T039 Contract test: every AI HR recommendation includes a confidence score and supporting analytics, with 0% resulting in an automatic change to employee status, compensation, or payroll disbursement without recorded human approval, in `backend/tests/contract/ai-hr-recommendation-zero-autonomous-status-compensation-change.contract.test.ts` (SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Recruit a Candidate Through the ATS Pipeline (Priority: P1) 🎯 MVP

**Independent Test**: Create a manpower request, approve it, post a job requisition, submit a test candidate application, run it through screening/interview/evaluation stages, generate an offer letter, and confirm status and visibility update correctly at every stage.

- [ ] T040 [US1] Recruitment workflow (Manpower Request→Approval→Job Posting→Applications→Screening→Interview→Evaluation→Offer→Acceptance→Hiring→Onboarding), wired to T006, acceptance scenario 1 (FR-009)
- [ ] T041 [US1] Job requisition creation, job posting, career portal for external candidate applications (FR-010)
- [ ] T042 [US1] Resume parsing to populate candidate profiles and a searchable candidate database, wired to T007, acceptance scenario 2 (FR-011)
- [ ] T043 [US1] AI-assisted resume screening, candidate ranking, and skill matching as advisory recommendations only, wired to T035's structured-data-grounding note, acceptance scenario 2 (FR-012)
- [ ] T044 [US1] Interview scheduling and structured interview feedback capture, wired to T008, acceptance scenario 3 (FR-013)
- [ ] T045 [US1] Offer letter generation and candidate communication throughout the pipeline, wired to T009, acceptance scenarios 3–4 (FR-014)
- [ ] T046 [US1] Candidate Profile full field set (Candidate ID, name, resume, skills, experience, education, certifications, expected/current salary, notice period, interview scores, hiring status, recruiter notes) (FR-015)
- [ ] T047 [US1] Recruitment Dashboard (open jobs, applications, interviews, offers, offer acceptance rate, time to hire, cost per hire, hiring funnel, recruiter productivity), wired to acceptance scenario 1 (FR-016)
- [ ] T048 [P] [US1] Recruitment & ATS Pipeline UI
- [ ] T049 [US1] Integration test: a published job requisition becomes visible to candidates and increments the Open Jobs count, a submitted resume creates a parsed candidate profile with an AI ranking/match score that neither auto-rejects nor auto-advances, a selected candidate with recorded interview feedback triggers offer-letter generation and candidate communication, an accepted offer transitions hiring status to "Hired" and creates a pre-onboarding record — all 4 acceptance scenarios in `backend/tests/integration/us1-ats-recruitment-pipeline.integration.test.ts`

**Checkpoint**: The entry point of the entire employee lifecycle is independently functional.

---

## Phase 4: User Story 2 — Onboard a New Hire End-to-End (Priority: P1)

**Independent Test**: Take a "Joined" candidate record, complete each onboarding checklist item, and confirm the employee record transitions through Joined → Probation → Active with payroll activated and self-service access enabled only once required items are complete.

- [ ] T050 [US2] Digital onboarding checklist (document collection, identity verification, contract execution, NDA signing, account creation, email setup, device assignment, HR orientation, department orientation, manager assignment, training assignment, payroll activation, ID card generation), wired to T010, acceptance scenarios 1–3 (FR-017)
- [ ] T051 [US2] Offboarding workflow (Resignation→Approval→Knowledge Transfer→Asset Return→Clearance→Final Settlement→Experience Letter→Exit Interview→Account Deactivation→Archive Employee), wired to T011 (FR-018)
- [ ] T052 [US2] Categorized exit reason capture (Better Opportunity, Higher Education, Personal Reasons, Relocation, Retirement, Termination, Contract Completion, Performance Issues) (FR-019)
- [ ] T053 [US2] Block final onboarding completion until all required checklist items are marked complete, wired to T037's contract test, acceptance scenario 4 (FR-020)
- [ ] T054 [US2] Deactivate system/account access and archive the employee record only after clearance and final settlement are complete (FR-021)
- [ ] T055 [P] [US2] Onboarding Checklist & Offboarding UI
- [ ] T056 [US2] Integration test: completed document collection/identity verification creates the employee master profile with required statutory ID fields, signed contract/NDA provisions system access and updates status to "Joined," completed orientation with manager/training assigned enrolls the employee in the active payroll cycle and moves status to "Probation," an incomplete checklist item (e.g., device assignment) blocks HR from marking onboarding complete — all 4 acceptance scenarios in `backend/tests/integration/us2-onboarding-offboarding.integration.test.ts`

**Checkpoint**: The mandatory bridge between "hired" and "an active, payroll-eligible employee" is independently functional.

---

## Phase 5: User Story 3 — Request and Approve Leave, Track Attendance (Priority: P1)

**Independent Test**: Record a check-in via one supported attendance method, submit a leave request against an available leave type, approve it through the manager → HR chain, and confirm the leave balance decrements and the change is reflected in the payroll sync feed.

- [ ] T057 [US3] Attendance capture methods (mobile app, web check-in, biometric, RFID, QR code, face recognition, GPS, geofencing, device punch, manual approval), wired to T012, acceptance scenario 4 (FR-022)
- [ ] T058 [US3] Attendance status set per day per employee (Present, Absent, Late, Half Day, WFH, Field Work, Holiday, Weekly Off, On Leave, On Duty) (FR-023)
- [ ] T059 [US3] Configurable leave types (Casual, Sick, Earned, Maternity, Paternity, Marriage, Bereavement, Compensatory Off, Unpaid, Special Leave) each with its own accrual/balance rules, wired to T013 (FR-024)
- [ ] T060 [US3] Leave request workflow (Employee Request→Manager Approval→HR Approval→Attendance Update→Payroll Sync), wired to T014, acceptance scenarios 1–2 (FR-025)
- [ ] T061 [US3] Leave balance sufficiency validation before submission for non-negative-balance leave types, wired to acceptance scenario 3 (FR-026)
- [ ] T062 [US3] Attendance Dashboard (present/absent today, late arrivals, leave requests, overtime, shift compliance, attendance percentage, attendance trends) (FR-027)
- [ ] T063 [P] [US3] Attendance & Leave Request UI
- [ ] T064 [US3] Integration test: a leave request within balance enters "Pending Manager Approval" with requested days held against the balance, HR approval after manager approval updates attendance to "On Leave," debits the balance, and queues payroll sync, a request exceeding available balance for a non-negative-balance type is rejected before manager approval, a GPS/geofenced punch outside the configured radius is flagged for manual approval rather than silently marked Present — all 4 acceptance scenarios in `backend/tests/integration/us3-attendance-leave.integration.test.ts`

**Checkpoint**: The highest-frequency HR transaction, directly feeding payroll, is independently functional.

---

## Phase 6: User Story 4 — Run a Performance Review Cycle (Priority: P2)

**Independent Test**: Set goals for a test employee, have the manager approve them, submit a self-assessment and peer feedback, complete a manager review, run calibration, and confirm a final rating and increment recommendation are produced.

- [ ] T065 [US4] Continuous performance cycle (Goal Setting→Manager Approval→Quarterly Review→Self Assessment→Peer Feedback→Manager Review→Calibration→Final Rating→Increment Recommendation→Promotion Planning), wired to T015, T016, acceptance scenarios 1–3 (FR-028)
- [ ] T066 [US4] Evaluation against configurable performance components (Goals, KPIs, OKRs, Competencies, Skills, Behaviour, Leadership, Teamwork, Innovation, Customer Satisfaction) (FR-029)
- [ ] T067 [US4] Final performance rating scale (Outstanding, Exceeds Expectations, Meets Expectations, Needs Improvement, Unsatisfactory), wired to acceptance scenarios 3–4 (FR-030)
- [ ] T068 [US4] PMS Dashboard (goal completion, average rating, high/low performers, promotion readiness, skill gaps, department performance, manager effectiveness) (FR-031)
- [ ] T069 [P] [US4] Performance Review Cycle UI
- [ ] T070 [US4] Integration test: manager-approved quarterly goals lock as the review baseline, a review-window self-assessment and peer feedback make the manager review stage available with all inputs visible, a calibrated manager rating records the final rating from the defined scale and feeds increment/promotion recommendations, an "Unsatisfactory" final rating flags the employee on the Low Performers dashboard view for manager follow-up rather than triggering automatic adverse action — all 4 acceptance scenarios in `backend/tests/integration/us4-performance-review-cycle.integration.test.ts`

**Checkpoint**: The periodic review cycle feeding compensation and promotion-planning decisions is independently functional.

---

## Phase 7: User Story 5 — Process a Payroll Run (Priority: P1)

**Independent Test**: Run payroll for a test pay period with known attendance/leave inputs, confirm salary components and statutory deductions calculate correctly, route the run through approval, generate a payslip, and confirm a corresponding accounting entry is produced.

- [ ] T071 [US5] Payroll calculation from configurable salary components (Basic, HRA, Special Allowance, Incentives, Bonus, Commission, Overtime, Reimbursements, Deductions, Loans, Advances, Tax, PF, ESI, Professional Tax) resulting in Net Salary, wired to T018, acceptance scenario 1 (FR-035)
- [ ] T072 [US5] Payroll workflow (Attendance→Leave Validation→Salary Calculation→Approvals→Payslip Generation→Bank Transfer→Accounting Entry→Employee Notification), wired to T019, T033's `058`-GL-posting note (FR-036)
- [ ] T073 [US5] Required approval(s) before a calculated payroll run may proceed to payslip generation and bank transfer, wired to acceptance scenario 2 (FR-037)
- [ ] T074 [US5] Itemized payslip per employee per pay period showing every earning and deduction line, wired to T020, acceptance scenario 3 (FR-038)
- [ ] T075 [US5] Payroll reports (Salary Register, Payslips, Tax Summary, PF Report, ESI Report, Bank Advice, Loan Report, Overtime Report, Payroll Cost, Department Salary Analysis), wired to T034's Workforce-Cost-Forecast note (FR-039)
- [ ] T076 [US5] Prohibition on retroactively altering a finalized/disbursed payroll run — corrections flow to a subsequent cycle or explicit off-cycle correction, wired to acceptance scenario 4 (FR-040)
- [ ] T077 [P] [US5] Payroll Run & Payslip UI
- [ ] T078 [US5] Integration test: validated attendance and approved leave for the pay period calculate gross pay, statutory deductions, and net salary from the current salary structure, a calculated run cannot proceed to payslip generation or bank transfer without required approver sign-off, an approved run's payslip generation itemizes every earning/deduction line and creates a Finance accounting entry, a post-approval attendance correction is queued as an adjustment rather than applied retroactively to the finalized run — all 4 acceptance scenarios in `backend/tests/integration/us5-payroll-run.integration.test.ts`

**Checkpoint**: The single highest-stakes, most compliance-sensitive HRMS function is independently functional.

---

## Phase 8: User Story 6 — Use Employee & Manager Self-Service (Priority: P2)

**Independent Test**: Log in as a test employee, view payslips and leave balance, submit an expense claim, then log in as their manager to approve it, and confirm the approval reflects back in the employee's view.

- [ ] T079 [US6] Employee Self-Service (ESS) portal (profile, attendance, leave application/balance, payslips, tax documents, performance reviews, goals, learning portal, announcements, internal job openings, expense claims, reimbursement requests, asset requests, HR tickets, org directory), wired to T021, T036's `003`-reuse note, acceptance scenario 1 (FR-041)
- [ ] T080 [US6] ESS data-access scoping so each employee sees only their own personal/payroll/performance records, wired to acceptance scenario 1 (FR-042)
- [ ] T081 [US6] Manager Self-Service (MSS) (attendance/leave/expense/recruitment approval, performance reviews, promotion/salary recommendations, team dashboard, workforce planning), scoped to direct/indirect reports, wired to acceptance scenarios 2–3 (FR-043)
- [ ] T082 [P] [US6] ESS/MSS Portal UI
- [ ] T083 [US6] Integration test: an employee's Payslips view shows only their own historical payslips/tax documents, a submitted reimbursement request appears in the manager's MSS approval queue with supporting details, a manager's leave approval reflects in the employee's ESS view without a page-independent sync delay, an HR ticket response is visible to the employee within ESS with notification — all 4 acceptance scenarios in `backend/tests/integration/us6-ess-mss.integration.test.ts`

**Checkpoint**: The primary day-to-day interface most employees and managers use is independently functional.

---

## Phase 9: User Story 7 — AI Flags a Flight-Risk Employee for Manager Attention (Priority: P3)

**Independent Test**: Feed declining engagement/attendance/performance signals into the AI model, confirm an attrition-risk recommendation is generated with confidence score and supporting analytics, and confirm it is surfaced to the manager without triggering any automatic HR action.

- [ ] T084 [US7] AI capabilities covering attrition prediction, employee engagement analysis, and related HR intelligence outputs, wired to T022, acceptance scenario 1 (FR-044)
- [ ] T085 [US7] Conversational AI HR Assistant answering "which employees are at risk of leaving" among its 10 documented example questions, wired to T035's structured-data-grounding note, acceptance scenario 1 (FR-045)
- [ ] T086 [P] [US7] AI Attrition-Risk Assistant UI
- [ ] T087 [US7] Integration test: an employee with declining attendance and a recent "Needs Improvement" rating appears on the at-risk query with the full recommendation field set, an attrition-risk recommendation triggers no automatic action against the employee's record, an employee's improving signals update or clear the risk flag in a subsequent cycle rather than persisting indefinitely, a newly joined employee with insufficient historical data is excluded from risk scoring rather than assigned a misleadingly confident score — all 4 acceptance scenarios in `backend/tests/integration/us7-ai-attrition-risk.integration.test.ts`

**Checkpoint**: The advisory attrition-prediction differentiator is independently functional.

---

## Phase 10: User Story 8 — AI Promotion-Readiness Scoring Supports Manager Review (Priority: P3)

**Independent Test**: Run the promotion-readiness model against a test employee with a strong performance history, confirm a readiness score and supporting rationale are generated, and confirm the manager retains the ability to accept or reject the recommendation.

- [ ] T088 [US8] AI recommendation full field set (recommendation, supporting analytics, confidence score, business impact, priority, suggested action, responsible manager, expected outcome) applied to promotion-readiness scoring, wired to acceptance scenarios 1, 3 (FR-046)
- [ ] T089 [P] [US8] Promotion-Readiness Dashboard UI
- [ ] T090 [US8] Integration test: an employee with consistently high ratings and completed goals produces a promotion-readiness score with supporting analytics and confidence score visible on the PMS dashboard, a manager can approve/modify/dismiss the recommendation with the final promotion decision requiring explicit manager/HR action, two employees with similar ratings but different skill-gap profiles produce readiness scores whose rationale traces to the underlying skill-gap analysis rather than a black-box output — all 3 acceptance scenarios in `backend/tests/integration/us8-ai-promotion-readiness.integration.test.ts`

**Checkpoint**: The advisory promotion-planning enhancement layered on the core PMS cycle is independently functional.

---

## Phase 11: User Story 9 — AI Detects a Payroll Anomaly Before Disbursement (Priority: P2)

**Independent Test**: Inject a synthetic anomaly into a test payroll run and confirm the run is flagged for administrator review before bank transfer, while unflagged employees in the same run proceed normally.

- [ ] T091 [US9] Advisory-only governance: every AI HR recommendation (attrition, promotion-readiness, payroll anomaly) requires explicit human/role-gated approval before any consequential action, wired to T039's contract test, acceptance scenario 2 (FR-047)
- [ ] T092 [US9] Payroll anomaly flagging blocking disbursement of the specific flagged line item(s) only, without blocking unflagged items in the same run, wired to T038's contract test, acceptance scenarios 1, 3–4 (FR-048)
- [ ] T093 [P] [US9] Payroll Anomaly Review UI
- [ ] T094 [US9] Integration test: a calculated payroll run's AI anomaly scan flags any line item deviating significantly from historical pay pattern with supporting analytics/confidence score before bank transfer, a payroll administrator's confirmed-legitimate clearance allows that line item to proceed to disbursement, an unreviewed flagged line item is blocked from bank transfer without blocking the rest of the run, a cleared false-positive flag records the clearance and rationale in the audit log — all 4 acceptance scenarios in `backend/tests/integration/us9-ai-payroll-anomaly-detection.integration.test.ts`

**Checkpoint**: The direct safeguard on the P1 Payroll Run story is independently functional.

---

## Phase 12: Embedded Corporate Learning & Development, HR Security & Compliance Remainder (supports FR-032–FR-034, FR-049–FR-055; cross-cutting, no single owning story)

- [ ] T095 Corporate learning catalog (online courses, classroom training, live sessions, certification programs, assessments, quizzes, assignments, learning paths, skill tracking), scoped to internal employee training, wired to T017, T031's `004`-no-overlap note (FR-032)
- [ ] T096 Categorized training types (Technical, Leadership, Compliance, Product Training, Sales Training, Customer Service, HR Policies, Cyber Security, AI Training, Soft Skills) (FR-033)
- [ ] T097 LMS Dashboard (assigned/completed courses, certifications, learning hours, assessment scores, skill matrix, department progress, training ROI) (FR-034)
- [ ] T098 RBAC enforcement across all HRMS modules, wired to T036's `001`/`016`-reuse note (FR-049)
- [ ] T099 Multi-level approval workflows for sensitive HR actions (recruitment offers, leave, payroll runs, offboarding clearance) (FR-050)
- [ ] T100 Encryption of employee personal and statutory identity data (Aadhaar/national ID, PAN/tax ID, passport, bank details) at rest and in transit (FR-051)
- [ ] T101 Immutable audit logs of administrative, financial, and AI-assisted HR actions (FR-052)
- [ ] T102 Document version control and digital signatures for HR documents (offer letters, contracts, NDAs, experience letters) (FR-053)
- [ ] T103 Configurable data-retention policies for employee and candidate records, including archived/offboarded employee data (FR-054)
- [ ] T104 Integration with Finance (`058`), Payroll, Attendance Devices/Biometric Systems, CRM, Project Management, Procurement, the Learning Platform, Identity & Access Management, Email Services, Calendar Systems, Notification Service, Business Intelligence, the AI Platform (`008`), API Gateway (FR-055)
- [ ] T105 [P] Corporate L&D & Security/Compliance Remainder UI

---

## Phase 13: Polish — Final Validation

- [ ] T106 Resolve and document the 13 preserved NEEDS CLARIFICATION items (4 self-flagged, 9 from Edge Cases) not already closed by `research.md`
- [ ] T107 Final audit: cross-check every FR-001–FR-055 against an implementation or validation task; re-verify the `004`, `012`, `058`, `008`, `003`/`001`/`016` reuse decisions are respected
- [ ] T108 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `003`'s auth infrastructure, `008`'s `ai-gateway`/`ai-guardrails`, and `058`'s General Ledger, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US5)**: US1 (ATS) is the entry point of the employee lifecycle and must land first; US2 (Onboarding) depends on US1's "Hired" candidates existing; US3 (Attendance/Leave) depends on US2's Active employees existing; US5 (Payroll) depends on US2's Payroll Activation and US3's validated attendance/leave data.
- **P2 stories (US4, US6, US9)**: US4 (Performance) depends on US2's employees and org structure existing; US6 (ESS/MSS) depends on US3/US4/US5's underlying modules existing to expose; US9 (AI Payroll Anomaly) depends on US5's Payroll Run existing to scan.
- **P3 stories (US7, US8)**: US7 (AI Attrition) depends on US3/US4's historical attendance/performance data existing; US8 (AI Promotion-Readiness) depends on US4's Performance Review Cycle data existing. Both are independent of each other.
- **Phase 12 (Corporate L&D, Security/Compliance remainder)** depends on Foundational and US2; can land alongside US4–US9.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (onboarding-checklist-100pct-complete-before-active-status, payroll-anomaly-100pct-flagged-resolved-before-disbursement, ai-hr-recommendation-zero-autonomous-status-compensation-change) pass → US1 (ATS) → **STOP and VALIDATE** the recruitment entry point is sound → US2 (Onboarding) → US3 (Attendance/Leave) → US5 (Payroll) → **STOP and VALIDATE** every P1 lifecycle-to-payroll gate blocks correctly → US4 (Performance) + US6 (ESS/MSS) + US9 (AI Payroll Anomaly) + Phase 12 (Corporate L&D/Security remainder) → US7 (AI Attrition) + US8 (AI Promotion-Readiness) → Polish.
