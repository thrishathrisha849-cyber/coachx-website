# Feature Specification: Enterprise HRMS & Payroll

**Feature Branch**: `059-hrms-payroll`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Volume 14, Chapter 26 of the TBT One Enterprise PRD — the internal Enterprise Human Resource Management System (HRMS) & Payroll Platform covering Employee Lifecycle Management, Organization Structure, Recruitment & Applicant Tracking (ATS), Employee Onboarding & Offboarding, Attendance & Leave Management, Performance Management System (PMS), embedded corporate Learning & Development (LMS), Payroll Management, Employee & Manager Self-Service (ESS/MSS), AI HR Intelligence, and HR Security & Compliance. Source: `document 2/Document 2.md`, lines 17897–18716."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recruit a Candidate Through the ATS Pipeline (Priority: P1)

An HR recruiter raises a manpower request, gets it approved, posts the resulting job requisition to the career portal, and manages applications as they flow through screening, interview scheduling, evaluation, offer, and acceptance — with AI-assisted resume screening and candidate ranking supporting (not replacing) the recruiter's decisions at each stage.

**Why this priority**: Recruitment is the entry point of the entire employee lifecycle; without a working requisition-to-offer pipeline, no other HRMS capability (onboarding, payroll activation, ESS) has a candidate to operate on. It is the natural P1 starting point for demonstrating standalone value.

**Independent Test**: Can be fully tested by creating a manpower request, approving it, posting a job requisition, submitting a test candidate application, running it through screening/interview/evaluation stages, generating an offer letter, and confirming the candidate's status and recruiter/hiring-manager visibility update correctly at every stage.

**Acceptance Scenarios**:

1. **Given** an approved manpower request, **When** a recruiter publishes a job requisition to the career portal, **Then** the requisition becomes visible to candidates and the recruitment dashboard's "Open Jobs" count increments.
2. **Given** a candidate submits a resume through the career portal, **When** the system parses it, **Then** a candidate profile is created with parsed skills, experience, and education, and AI resume screening produces a ranking/match score against the requisition without automatically rejecting or advancing the candidate.
3. **Given** a candidate has progressed through interview stages with recorded interview feedback and scores, **When** the recruiter marks the candidate as selected, **Then** the system generates an offer letter with compensation details for review and sends candidate communication upon approval.
4. **Given** a candidate accepts the offer, **When** the recruiter confirms acceptance, **Then** the candidate's hiring status transitions to "Hired" and a pre-onboarding record is created to feed the Onboarding workflow.

---

### User Story 2 - Onboard a New Hire End-to-End (Priority: P1)

HR and the new hire's manager move a hired candidate through a digital onboarding checklist — document collection, identity verification, contract and NDA signing, account and email creation, device assignment, orientation, manager and training assignment, payroll activation, and ID card generation — so the employee is fully productive and correctly recorded as Active on day one.

**Why this priority**: Onboarding is the mandatory bridge between "hired" and "an active, payroll-eligible employee." It directly gates Payroll Activation and Employee Self-Service access, making it as foundational as recruitment itself.

**Independent Test**: Can be fully tested by taking a "Joined" candidate record, completing each onboarding checklist item, and confirming the employee record transitions through Joined → Probation → Active with payroll activated and self-service access enabled only once required checklist items are complete.

**Acceptance Scenarios**:

1. **Given** a newly hired employee, **When** HR completes document collection and identity verification, **Then** the employee master profile is created with Employee ID, Employee Code, and required statutory ID fields populated.
2. **Given** an employee has signed the employment contract and NDA, **When** account creation and email setup run, **Then** system access credentials are provisioned and the employee status updates to "Joined."
3. **Given** an employee completes HR and department orientation with a manager and training assigned, **When** the onboarding checklist reaches "Payroll Activation," **Then** the employee is enrolled in the active payroll cycle and their status moves to "Probation."
4. **Given** an onboarding checklist item (e.g., device assignment) is marked incomplete, **When** HR attempts to mark onboarding complete, **Then** the system blocks completion and flags the outstanding item.

---

### User Story 3 - Request and Approve Leave, Track Attendance (Priority: P1)

An employee checks in/out via a supported attendance method (mobile app, web check-in, biometric, RFID, QR code, face recognition, GPS/geofencing), views their leave balance, submits a leave request against a specific leave type, and has it flow through manager approval, HR approval, attendance update, and payroll sync.

**Why this priority**: Attendance and leave are the highest-frequency HR transactions any employee performs and directly feed payroll's Attendance and Leave Validation steps — a broken flow here breaks payroll for the entire workforce every cycle.

**Independent Test**: Can be fully tested by recording a check-in via one supported attendance method, submitting a leave request against an available leave type, approving it through the manager → HR chain, and confirming the leave balance decrements and the change is reflected in the payroll sync feed.

**Acceptance Scenarios**:

1. **Given** an employee with a positive Casual Leave balance, **When** they submit a leave request for 2 days, **Then** the request enters "Pending Manager Approval" and the requested days are held against the balance pending decision.
2. **Given** a leave request has manager approval, **When** HR approval is granted, **Then** the attendance record updates the corresponding days to "On Leave," the leave balance is debited, and the change is queued for payroll sync.
3. **Given** an employee attempts to request more leave days than their available balance for a non-negative-balance leave type, **When** they submit the request, **Then** the system rejects the request with an insufficient-balance reason before it reaches manager approval.
4. **Given** an employee checks in via GPS/geofenced mobile attendance outside the configured work-location radius, **When** the punch is submitted, **Then** the system flags the entry for manual approval rather than silently marking it Present.

---

### User Story 4 - Run a Performance Review Cycle (Priority: P2)

A manager and employee move through a full performance cycle — goal setting, manager approval of goals, quarterly review, self-assessment, peer feedback, manager review, calibration, final rating, and increment/promotion recommendation — with ratings drawn from the defined scale and results feeding compensation and promotion-planning decisions.

**Why this priority**: Performance management is periodic (quarterly/annual) rather than daily, and depends on employees and org structure already existing, making it correctly sequenced after the P1 lifecycle stories while still being core to retention and compensation decisions.

**Independent Test**: Can be fully tested by setting goals for a test employee, having the manager approve them, submitting a self-assessment and peer feedback, completing a manager review, running calibration, and confirming a final rating and increment recommendation are produced and visible on the PMS dashboard.

**Acceptance Scenarios**:

1. **Given** an employee sets quarterly goals, **When** their manager approves them, **Then** the goals lock as the review baseline for that cycle.
2. **Given** the review window opens, **When** the employee submits a self-assessment and peers submit feedback, **Then** the manager review stage becomes available with all inputs visible to the manager.
3. **Given** a manager submits a rating, **When** the rating goes through calibration, **Then** the final rating (from the defined scale: Outstanding, Exceeds Expectations, Meets Expectations, Needs Improvement, Unsatisfactory) is recorded and feeds increment and promotion-planning recommendations.
4. **Given** a final rating of "Unsatisfactory" is recorded, **When** the cycle closes, **Then** the employee is flagged on the PMS dashboard's "Low Performers" view for manager follow-up rather than any automatic adverse action being taken.

---

### User Story 5 - Process a Payroll Run (Priority: P1)

Payroll administrators execute a payroll cycle that pulls validated attendance and leave data, calculates salary components (basic, HRA, allowances, incentives, bonus, commission, overtime, reimbursements) and statutory deductions (tax, PF, ESI, professional tax, loans, advances), routes the run through approvals, generates payslips, initiates bank transfers, posts the accounting entry, and notifies employees.

**Why this priority**: Payroll is the single highest-stakes, most compliance-sensitive, and most schedule-critical HRMS function — a failed or incorrect payroll run has immediate legal and employee-trust consequences, warranting P1 alongside recruitment/onboarding/attendance.

**Independent Test**: Can be fully tested by running payroll for a test pay period with known attendance/leave inputs, confirming salary components and statutory deductions calculate correctly, routing the run through approval, generating a payslip, and confirming a corresponding accounting entry is produced.

**Acceptance Scenarios**:

1. **Given** validated attendance and approved leave for the pay period, **When** the payroll run is initiated, **Then** the system calculates each employee's gross pay, statutory deductions, and net salary from their current salary structure.
2. **Given** a calculated payroll run, **When** it is submitted for approval, **Then** it cannot proceed to payslip generation or bank transfer until the required approver(s) sign off.
3. **Given** an approved payroll run, **When** payslip generation completes, **Then** each employee receives a payslip itemizing every earning and deduction line, and an accounting entry is created for the Finance ledger.
4. **Given** a payroll run has already been approved and payslips issued, **When** an attendance correction for that period is submitted afterward, **Then** the correction is not applied retroactively to the finalized run but is instead queued as an adjustment for the next cycle or an explicit off-cycle correction run.

---

### User Story 6 - Use Employee & Manager Self-Service (Priority: P2)

An employee uses the Employee Self-Service (ESS) portal to view their profile, attendance, leave balance, payslips, tax documents, performance reviews, and learning assignments, and to submit leave applications, expense claims, reimbursement requests, asset requests, and HR tickets; a manager uses Manager Self-Service (MSS) to approve attendance, leave, expenses, and recruitment requests, and to view team dashboards.

**Why this priority**: ESS/MSS is the primary day-to-day interface most employees and managers use for every other HRMS capability; it is P2 because its value depends on the underlying modules (leave, payroll, performance) already existing, but it is how most users will interact with the system at scale.

**Independent Test**: Can be fully tested by logging in as a test employee, viewing payslips and leave balance, submitting an expense claim, then logging in as their manager to approve it, and confirming the approval reflects back in the employee's view.

**Acceptance Scenarios**:

1. **Given** an employee logs into ESS, **When** they navigate to Payslips, **Then** they see only their own historical payslips and tax documents, not any other employee's.
2. **Given** an employee submits a reimbursement request through ESS, **When** their manager opens MSS, **Then** the request appears in the manager's approval queue with supporting details.
3. **Given** a manager approves a leave request via MSS, **When** the approval is submitted, **Then** the employee's ESS view updates to reflect the approved status without requiring a page-independent sync delay.
4. **Given** an employee raises an HR ticket through ESS, **When** HR responds, **Then** the employee is notified and can view the response thread within ESS.

---

### User Story 7 - AI Flags a Flight-Risk Employee for Manager Attention (Priority: P3)

The AI HR Intelligence layer continuously analyzes engagement, performance, attendance, and tenure signals to produce an attrition-risk prediction for each employee, surfacing at-risk individuals (with supporting analytics, confidence score, and a suggested action) to the responsible manager through the AI HR Assistant, without taking any autonomous action on the employee's record.

**Why this priority**: Attrition prediction is a high-value differentiator but is explicitly advisory and depends on sufficient historical performance/attendance/engagement data already existing in the system, making it correctly sequenced as a later-priority, additive capability rather than a core transactional flow.

**Independent Test**: Can be fully tested by feeding a test employee's declining engagement, attendance, and performance signals into the AI model, confirming an attrition-risk recommendation is generated with confidence score and supporting analytics, and confirming it is surfaced to the responsible manager for review rather than triggering any automatic HR action.

**Acceptance Scenarios**:

1. **Given** an employee with declining attendance percentage and a recent "Needs Improvement" rating, **When** the AI attrition model runs its periodic analysis, **Then** the employee appears on the "which employees are at risk of leaving" query with a recommendation, supporting analytics, confidence score, business impact, priority, suggested action, responsible manager, and expected outcome.
2. **Given** an attrition-risk recommendation is generated, **When** it is delivered to the responsible manager, **Then** no automatic action (e.g., retention bonus, compensation change) is taken against the employee's record — the manager must explicitly act.
3. **Given** an employee's signals improve in a subsequent analysis cycle, **When** the AI model re-evaluates, **Then** the employee's risk flag is updated or cleared rather than persisting indefinitely.
4. **Given** insufficient historical data exists for a newly joined employee, **When** the attrition model runs, **Then** the employee is excluded from risk scoring rather than being assigned a misleadingly confident score.

---

### User Story 8 - AI Promotion-Readiness Scoring Supports Manager Review (Priority: P3)

During the performance cycle's promotion-planning stage, the AI HR Intelligence layer analyzes an employee's ratings, skills, goal completion, and tenure to produce a promotion-readiness score with supporting analytics, which is presented to the manager as an input to (not a replacement for) the promotion recommendation decision.

**Why this priority**: Like attrition prediction, this is an advisory AI enhancement layered on top of the core Performance Management cycle (User Story 4); it adds value once PMS data exists but is not required for a functioning review cycle, hence P3.

**Independent Test**: Can be fully tested by running the promotion-readiness model against a test employee with a strong performance history, confirming a readiness score and supporting rationale are generated and displayed on the PMS "Promotion Readiness" dashboard view, and confirming the manager retains the ability to accept or reject the recommendation.

**Acceptance Scenarios**:

1. **Given** an employee with consistently high ratings and completed goals across cycles, **When** the promotion-planning stage is reached, **Then** the AI generates a promotion-readiness score with supporting analytics and confidence score, visible on the PMS dashboard.
2. **Given** a promotion-readiness recommendation is generated, **When** a manager reviews it, **Then** the manager can approve, modify, or dismiss the recommendation, and the final promotion decision requires explicit manager/HR action.
3. **Given** two employees with similar ratings but different skill-gap profiles, **When** readiness scores are computed, **Then** the scores and their supporting rationale differ in a way traceable to the underlying skill-gap analysis, not a black-box output.

---

### User Story 9 - AI Detects a Payroll Anomaly Before Disbursement (Priority: P2)

Before a payroll run's bank transfer step, the AI HR Intelligence layer scans the calculated run for statistical anomalies (e.g., an unexplained multi-fold salary jump, a duplicate payment, a mismatched bank account, an out-of-policy deduction) and flags them for payroll administrator review, blocking automatic disbursement of flagged line items until reviewed.

**Why this priority**: Payroll anomaly detection is a direct safeguard on the P1 Payroll Run story with high financial and compliance stakes, so it ranks above the other AI-advisory stories (P2) even though it is itself an AI-assistive capability layered on the core payroll flow.

**Independent Test**: Can be fully tested by injecting a synthetic anomaly (e.g., an employee's net salary configured 5x their historical average) into a test payroll run and confirming the run is flagged for administrator review before bank transfer, while unflagged employees in the same run proceed normally.

**Acceptance Scenarios**:

1. **Given** a payroll run is calculated, **When** the AI anomaly scan runs, **Then** any line item deviating significantly from the employee's historical pay pattern is flagged with supporting analytics and a confidence score before bank transfer initiation.
2. **Given** a flagged line item, **When** a payroll administrator reviews it and confirms it is legitimate (e.g., a documented one-time bonus), **Then** the administrator can clear the flag and allow that line item to proceed to disbursement.
3. **Given** a flagged line item is not reviewed, **When** the payroll run is submitted for bank transfer, **Then** the system blocks disbursement of the flagged item specifically, without blocking the rest of the run's unflagged payments.
4. **Given** the anomaly model flags a false positive (e.g., a legitimate approved retroactive increment), **When** the administrator clears it, **Then** the clearance and rationale are recorded in the audit log for future model reference.

---

### Edge Cases

- What happens when a payroll anomaly flag is a false positive on a legitimate, approved compensation change (e.g., a mid-cycle promotion increment) — does the block on disbursement create an unacceptable payment delay for that employee, and is there an expedited administrator override path?
- How does the system reconcile leave-balance calculation when an employee is covered by more than one leave policy in the same period (e.g., a mid-year transfer between business units with different leave accrual rules, or a state-specific statutory leave overlapping a company policy)?
- What happens when an employee resigns (starts the Offboarding workflow) while they still have an open, unresolved attrition-risk AI flag — does the flag get closed, archived, or does the offboarding event get treated as a data point for retraining the attrition model?
- How does the system handle the data-retention conflict between an offboarded/archived employee's record and applicable data-retention/privacy regulations (e.g., a former employee's right-to-erasure request against statutory payroll/tax record retention requirements)?
- What happens when a manager approves a leave request or performance rating for a direct report but is themselves offboarded before HR approval/calibration completes — who inherits the pending approval?
- How does attendance reconcile when an employee punches in via GPS/geofenced mobile attendance from a location just outside the configured radius due to GPS drift, versus a genuine policy violation — is there a tolerance band, and how is a disputed flag appealed?
- What happens when a payroll run needs to be reversed or corrected after payslips have already been issued and bank transfer has been initiated (e.g., a discovered calculation error) — given Historical Immutability, how is the correction represented without altering the finalized run record?
- How does the AI promotion-readiness or attrition-prediction model avoid encoding bias from historical rating patterns (e.g., systematically lower ratings for a particular department or manager) into its scores, and what recourse does a flagged/scored employee have to contest it?
- What happens when a candidate applies to multiple open requisitions simultaneously, or reapplies after a prior rejection — is a single candidate profile maintained across applications, and how is prior interview feedback surfaced to a new hiring manager?

## Requirements *(mandatory)*

### Functional Requirements — Employee Lifecycle & Org Structure

- **FR-001**: System MUST manage the complete employee lifecycle from workforce planning and recruitment through candidate screening, interview, offer, hiring, pre-onboarding, onboarding, probation, confirmation, training, transfers, promotions, performance reviews, compensation revision, leave/attendance, payroll processing, career development, exit, and alumni management as a continuous, traceable record.
- **FR-002**: System MUST maintain an Employee Master Profile per employee containing at minimum: Employee ID, Employee Code, full name, profile photo, date of birth, gender, blood group, contact details, emergency contact, address, national ID (Aadhaar), tax ID (PAN), passport details, department, designation, business unit, reporting manager, employment type, employment status, joining date, confirmation date, work location, shift details, bank details, salary structure, documents, skills, certifications, performance rating, attendance summary, leave balance, payroll history, and training records.
- **FR-003**: System MUST track employee status through a defined state set: Applicant, Offer Sent, Joined, Probation, Confirmed, Active, On Leave, Suspended, Resigned, Notice Period, Relieved, Retired, and Archived.
- **FR-004**: System MUST support complex organizational hierarchies with levels: Organization, Company, Business Unit, Division, Department, Team, Project, Manager, Employee.
- **FR-005**: System MUST support multiple companies, multiple branches, and multiple locations within a single HRMS instance.
- **FR-006**: System MUST support department management, team management, standard reporting hierarchy, and matrix reporting.
- **FR-007**: System MUST support position management and cost-center assignment for workforce planning.
- **FR-008**: System MUST provide an Organization Dashboard displaying total employees, active employees, departments, managers, open positions, vacancies, new joinees, attrition rate, headcount growth, and diversity metrics.

### Functional Requirements — Recruitment & Applicant Tracking (ATS)

- **FR-009**: System MUST support the recruitment workflow: Manpower Request → Approval → Job Posting → Applications → Screening → Interview → Evaluation → Offer → Acceptance → Hiring → Onboarding, as a sequenced, status-tracked pipeline.
- **FR-010**: System MUST support job requisition creation, job posting, and a career portal for external candidate applications.
- **FR-011**: System MUST provide resume parsing to populate candidate profiles from submitted resumes, and maintain a searchable candidate database.
- **FR-012**: System MUST provide AI-assisted resume screening, candidate ranking, and skill matching against requisition criteria as advisory recommendations, not automatic accept/reject decisions.
- **FR-013**: System MUST support interview scheduling and structured interview feedback capture per candidate.
- **FR-014**: System MUST support offer letter generation and candidate communication throughout the pipeline.
- **FR-015**: System MUST maintain a Candidate Profile per applicant containing: Candidate ID, name, resume, skills, experience, education, certifications, expected salary, current salary, notice period, interview scores, hiring status, and recruiter notes.
- **FR-016**: System MUST provide a Recruitment Dashboard displaying open jobs, applications, interviews, offers, offer acceptance rate, time to hire, cost per hire, hiring funnel, and recruiter productivity.

### Functional Requirements — Onboarding & Offboarding

- **FR-017**: System MUST provide a digital onboarding checklist covering document collection, identity verification, employment contract execution, NDA signing, account creation, email setup, device assignment, HR orientation, department orientation, manager assignment, training assignment, payroll activation, and ID card generation.
- **FR-018**: System MUST support the offboarding workflow: Resignation → Approval → Knowledge Transfer → Asset Return → Clearance → Final Settlement → Experience Letter → Exit Interview → Account Deactivation → Archive Employee, as a sequenced, status-tracked pipeline.
- **FR-019**: System MUST record a categorized exit reason for every offboarded employee, drawn from at minimum: Better Opportunity, Higher Education, Personal Reasons, Relocation, Retirement, Termination, Contract Completion, Performance Issues.
- **FR-020**: System MUST block final onboarding completion (transition to Active/Confirmed status) until all required checklist items are marked complete.
- **FR-021**: System MUST deactivate system/account access and archive the employee record only after clearance and final settlement steps are complete in the offboarding workflow.

### Functional Requirements — Attendance & Leave Management

- **FR-022**: System MUST support multiple attendance capture methods: mobile app, web check-in, biometric, RFID, QR code, face recognition, GPS attendance, geofencing, device punch, and manual approval.
- **FR-023**: System MUST track attendance status per day per employee using a defined status set: Present, Absent, Late, Half Day, Work From Home, Field Work, Holiday, Weekly Off, On Leave, On Duty.
- **FR-024**: System MUST support configurable leave types including Casual Leave, Sick Leave, Earned Leave, Maternity Leave, Paternity Leave, Marriage Leave, Bereavement Leave, Compensatory Off, Unpaid Leave, and Special Leave, each with its own accrual/balance rules.
- **FR-025**: System MUST route leave requests through the workflow: Employee Request → Manager Approval → HR Approval → Attendance Update → Payroll Sync.
- **FR-026**: System MUST validate leave balance sufficiency before allowing a leave request to be submitted for approval, for leave types that do not permit a negative balance.
- **FR-027**: System MUST provide an Attendance Dashboard displaying present today, absent today, late arrivals, leave requests, overtime, shift compliance, attendance percentage, and attendance trends.

### Functional Requirements — Performance Management (PMS)

- **FR-028**: System MUST support a continuous performance cycle: Goal Setting → Manager Approval → Quarterly Review → Self Assessment → Peer Feedback → Manager Review → Calibration → Final Rating → Increment Recommendation → Promotion Planning.
- **FR-029**: System MUST support evaluation against configurable performance components: Goals, KPIs, OKRs, Competencies, Skills, Behaviour, Leadership, Teamwork, Innovation, and Customer Satisfaction.
- **FR-030**: System MUST record a final performance rating per review cycle drawn from a defined scale: Outstanding, Exceeds Expectations, Meets Expectations, Needs Improvement, Unsatisfactory.
- **FR-031**: System MUST provide a PMS Dashboard displaying goal completion, average rating, high performers, low performers, promotion readiness, skill gaps, department performance, and manager effectiveness.

### Functional Requirements — Learning & Development (Embedded Corporate LMS)

- **FR-032**: System MUST provide a corporate learning catalog supporting online courses, classroom training, live sessions, certification programs, assessments, quizzes, assignments, learning paths, and skill tracking, scoped to internal employee training needs.
- **FR-033**: System MUST support categorized training types: Technical, Leadership, Compliance, Product Training, Sales Training, Customer Service, HR Policies, Cyber Security, AI Training, and Soft Skills.
- **FR-034**: System MUST provide an LMS Dashboard displaying assigned courses, completed courses, certifications, learning hours, assessment scores, skill matrix, department progress, and training ROI.

### Functional Requirements — Payroll Management

- **FR-035**: System MUST calculate payroll from configurable salary components: Basic Salary, HRA, Special Allowance, Incentives, Bonus, Commission, Overtime, Reimbursements, Deductions, Loans, Advances, Tax, PF, ESI, Professional Tax, resulting in Net Salary.
- **FR-036**: System MUST execute the payroll workflow: Attendance → Leave Validation → Salary Calculation → Approvals → Payslip Generation → Bank Transfer → Accounting Entry → Employee Notification.
- **FR-037**: System MUST require defined approval(s) before a calculated payroll run may proceed to payslip generation and bank transfer.
- **FR-038**: System MUST generate itemized payslips per employee per pay period showing every earning and deduction line.
- **FR-039**: System MUST produce payroll reports including Salary Register, Payslips, Tax Summary, PF Report, ESI Report, Bank Advice, Loan Report, Overtime Report, Payroll Cost, and Department Salary Analysis.
- **FR-040**: System MUST NOT retroactively alter a finalized (approved and disbursed) payroll run; corrections identified after finalization MUST be represented as adjustments in a subsequent cycle or an explicit off-cycle correction, consistent with the platform's historical-immutability principle.

### Functional Requirements — Employee & Manager Self-Service

- **FR-041**: System MUST provide an Employee Self-Service (ESS) portal, accessible via web and mobile, exposing: personal profile, attendance, leave application, leave balance, payslips, tax documents, performance reviews, goals, learning portal, company announcements, internal job openings, expense claims, reimbursement requests, asset requests, HR tickets, and organization directory.
- **FR-042**: System MUST scope ESS data access so each employee can view only their own personal, payroll, and performance records.
- **FR-043**: System MUST provide a Manager Self-Service (MSS) capability exposing: attendance approval, leave approval, expense approval, recruitment approval, performance reviews, promotion recommendations, salary recommendations, team dashboard, and workforce planning, scoped to the manager's direct/indirect reports.

### Functional Requirements — AI HR Intelligence

- **FR-044**: System MUST provide AI capabilities covering resume screening, candidate ranking, attrition prediction, employee engagement analysis, performance prediction, promotion readiness, skill gap analysis, learning recommendations, workforce planning, payroll anomaly detection, attendance pattern analysis, and recruitment forecasting.
- **FR-045**: System MUST provide a conversational AI HR Assistant able to answer at minimum: which employees are at risk of leaving, which departments need hiring, who is eligible for promotion, which employees require training, which skills are missing, next month's payroll forecast, which employees have attendance concerns, which teams are underperforming, what hiring budget is required, and how employee engagement can be improved.
- **FR-046**: System MUST present every AI recommendation with: the recommendation itself, supporting analytics, a confidence score, business impact, priority, suggested action, responsible manager, and expected outcome.
- **FR-047**: System MUST treat every AI HR recommendation (attrition risk, promotion readiness, payroll anomaly, etc.) as advisory only; no AI output may automatically change an employee's status, compensation, or payroll disbursement without explicit human/role-gated approval, consistent with the platform's "AI is assistive, never autonomous" principle.
- **FR-048**: System MUST flag payroll anomalies for administrator review prior to bank transfer, and MUST block disbursement of the specific flagged line item(s) until an administrator reviews and clears (or corrects) the flag, without blocking unflagged line items in the same run.

### Functional Requirements — HR Security & Compliance

- **FR-049**: System MUST enforce Role-Based Access Control (RBAC) across all HRMS modules.
- **FR-050**: System MUST support multi-level approval workflows for sensitive HR actions (recruitment offers, leave, payroll runs, offboarding clearance).
- **FR-051**: System MUST encrypt employee personal and statutory identity data (e.g., Aadhaar/national ID, PAN/tax ID, passport, bank details) at rest and in transit.
- **FR-052**: System MUST maintain immutable audit logs of administrative, financial, and AI-assisted HR actions.
- **FR-053**: System MUST support document version control and digital signatures for HR documents (offer letters, contracts, NDAs, experience letters).
- **FR-054**: System MUST support configurable data retention policies for employee and candidate records, including archived/offboarded employee data.
- **FR-055**: System MUST integrate with Finance, Payroll, Attendance Devices/Biometric Systems, CRM, Project Management, Procurement, the Learning Platform, Identity & Access Management, Email Services, Calendar Systems, the Notification Service, Business Intelligence, the AI Platform, and the API Gateway.

### Key Entities *(include if feature involves data)*

- **Employee**: The core workforce record — identity, org placement (company/business unit/department/team), reporting line, employment type/status, compensation structure reference, and rollups (attendance summary, leave balance, performance rating, payroll history, training records). Transitions through the defined employee-status lifecycle.
- **Organization Unit**: A node in the org hierarchy (Organization, Company, Business Unit, Division, Department, Team, Project) that employees, positions, and cost centers attach to; supports both standard and matrix reporting lines.
- **Job Requisition**: A manpower request that, once approved, becomes a postable job opening with defined role, department, and hiring-manager association; drives the recruitment pipeline and Recruitment Dashboard metrics.
- **Candidate**: An applicant profile (parsed resume, skills, experience, expected/current salary, notice period, interview scores, recruiter notes) tracked through hiring status from Applicant to Hired or Rejected; may apply to multiple requisitions.
- **Interview**: A scheduled evaluation event tied to a Candidate and Job Requisition, capturing interviewer feedback and scores that feed the offer decision.
- **Offer**: A generated offer letter tied to a Candidate and Job Requisition, carrying compensation terms, approval state, and acceptance status; acceptance triggers pre-onboarding.
- **Onboarding Checklist Instance**: A per-new-hire tracked set of onboarding tasks (documents, contract/NDA, accounts, device, orientation, training, payroll activation, ID card) whose completion gates the employee's transition to Active/Probation status.
- **Offboarding Case**: A per-exiting-employee tracked workflow (resignation/termination, approval, knowledge transfer, asset return, clearance, final settlement, experience letter, exit interview, account deactivation, archive) carrying an exit reason.
- **Attendance Record**: A per-employee, per-day (or per-punch) record of capture method, timestamp(s), location (where GPS/geofenced), and resulting status (Present/Absent/Late/Half Day/WFH/Field Work/Holiday/Weekly Off/On Leave/On Duty).
- **Leave Policy**: A configuration defining a leave type's accrual rate, balance rules (negative-balance allowance, carry-forward, expiry), and eligibility, scoped potentially to org unit, location, or employment type.
- **Leave Request**: An employee's request against a Leave Type and Leave Policy, carrying dates, status (through the Employee Request → Manager Approval → HR Approval → Attendance Update → Payroll Sync workflow), and balance impact.
- **Performance Review Cycle**: A time-boxed instance of the performance cycle (goal setting through promotion planning) associating an employee, their manager, goals, self-assessment, peer feedback, manager review, calibration outcome, and final rating.
- **Goal**: A per-employee, per-cycle objective (Goal/KPI/OKR) with an approval state and completion measure that rolls up into the Performance Review Cycle's final rating.
- **Training Course / Enrollment**: An internal corporate learning catalog item (technical, leadership, compliance, etc.) and an employee's assignment/completion/assessment-score record against it, distinct from the member-facing LMS (see Assumptions).
- **Salary Structure**: A per-employee configuration of payroll components (Basic, HRA, allowances, incentives, deductions, statutory contributions) that Payroll Run calculations are computed from.
- **Payroll Run**: A per-pay-period, per-company batch execution of the payroll workflow, carrying calculation status, approval state, and links to the resulting Payslips and Finance accounting entry; once finalized/disbursed, immutable per FR-040.
- **Payslip**: A per-employee, per-pay-period itemized statement of every earning and deduction line and the resulting net salary, generated from a Payroll Run.
- **HR Ticket**: An employee-raised service request (via ESS) tracked to resolution, distinct from expense claims, reimbursement requests, and asset requests, each of which is its own trackable request type.
- **AI HR Recommendation**: A structured advisory output (attrition risk, promotion readiness, payroll anomaly, engagement analysis, etc.) carrying recommendation text, supporting analytics, confidence score, business impact, priority, suggested action, responsible manager, and expected outcome; never itself an executed action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can move from application submission to a generated offer letter entirely within the ATS pipeline, with recruiter-visible status at every stage, for at least 95% of requisitions.
- **SC-002**: 100% of new hires reach Active/Confirmed status only after every required onboarding checklist item is recorded complete — zero employees are activated with outstanding mandatory onboarding items.
- **SC-003**: Leave balance and attendance status remain consistent with payroll sync inputs for every processed payroll run — zero payroll runs are calculated against unsynced or stale attendance/leave data.
- **SC-004**: A payroll run for the full active workforce completes calculation, approval, payslip generation, and accounting-entry posting within one defined payroll processing window per cycle, with 100% of payslips itemizing every earning/deduction line.
- **SC-005**: Every AI HR recommendation surfaced to a manager (attrition risk, promotion readiness, payroll anomaly) includes a confidence score and supporting analytics, and zero AI recommendations result in an automatic change to employee status, compensation, or payroll disbursement without recorded human approval.
- **SC-006**: 100% of flagged payroll anomalies are resolved (cleared or corrected) before their associated line item is disbursed — zero flagged line items are paid out unreviewed.
- **SC-007**: Employees can retrieve their own payslips, leave balance, and performance review history through ESS without HR intervention in at least 90% of self-service sessions.
- **SC-008**: Every offboarded employee's case reaches Archive status only after clearance and final settlement are recorded complete, with an exit reason captured for 100% of exits.
- **SC-009**: Every administrative, financial, and AI-assisted HR action is retrievable from the audit log for the applicable data-retention period, with zero gaps in the log for in-scope action types.

## Assumptions

- This feature specifies TBT's **internal, employee-facing** HRMS — the workforce management system used to run TBT as an employer. It is structurally and purposefully distinct from feature `004-learning-management-system` (the **member-facing** LMS that TBT sells/delivers as its core product to external learners). The embedded "Learning & Development" module in this chapter (Section 8) is TBT's *corporate training* catalog for its own employees (technical, leadership, compliance, HR policy, security, soft-skills training) and is scoped, owned, and reported on separately from the commercial LMS in feature 004, even though both use similar constructs (courses, assessments, certifications, learning paths). Any shared underlying course-delivery technology, if consolidated in implementation, is an implementation decision outside this spec's scope — not a stated PRD requirement.
- Payroll's "Accounting Entry" step (FR-036, FR-039) depends on feature `058-finance-accounting-treasury` (Volume 14, Chapter 25) for actual General Ledger posting, chart-of-accounts mapping, and financial reporting; this spec defines that payroll MUST produce an accounting entry but defers the GL posting mechanics, account structure, and financial-period close rules to feature 058.
- The source chapter does not specify exact statutory compliance frameworks (e.g., which country's PF/ESI/professional-tax regime); per the platform constitution's Security & Compliance Baseline, GST/tax, GDPR, CCPA, DPDP Act, ISO 27001, SOC 2, and PCI DSS apply where the relevant data (PII, payments) is in scope, but a jurisdiction-specific statutory payroll rule set is [NEEDS CLARIFICATION: source chapter lists PF/ESI/Professional Tax by name, implying an India-first statutory model, but does not state whether other jurisdictions/currencies must be supported for a multi-company HRMS].
- The source chapter does not define specific leave accrual formulas, carry-forward limits, or negative-balance policies per leave type — these are assumed to be admin-configurable per company/location, consistent with "the HRMS shall support enterprise attendance policies," but exact default values are [NEEDS CLARIFICATION: no specific accrual/carry-forward/negative-balance rules given per leave type].
- The source chapter does not specify the AI model retraining cadence, bias-audit process, or model governance for attrition prediction, promotion readiness, or payroll anomaly detection; per the constitution's "AI is assistive, never autonomous" principle these outputs are advisory-only and require human approval before any consequential action, but the fairness/bias-audit mechanism itself is [NEEDS CLARIFICATION: no bias-testing or model-governance process stated in source].
- This spec assumes standard RBAC layering (Organization → Department/Team → Role → Permission Group → Permission → Resource → Action) per the constitution, since the source chapter states RBAC and multi-level approval workflows are required (Section 12) but does not enumerate the specific HR role set or approval-chain depth — that detail is deferred to implementation planning.
- Overlaps: this chapter's Employee Lifecycle/Payroll scope is distinct from feature `013-crm-sales-support` and the various Volume 14 sales/CX chapters (customer-facing, not employee-facing) and from feature `012-jobs-talent-recruitment` (which is TBT's external jobs-marketplace product for its members, not TBT's own internal hiring pipeline) — no functional overlap is assumed between this internal ATS and the member-facing jobs marketplace beyond both using ATS-style pipeline concepts.
