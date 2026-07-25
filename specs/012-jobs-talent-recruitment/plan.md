# Implementation Plan: Jobs, Talent Profiles & Recruitment

**Branch**: `012-jobs-talent-recruitment` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-jobs-talent-recruitment/spec.md`

## Summary

This feature builds the platform's jobs and recruitment system: a self-service Resume Builder (5 templates, PDF/DOCX export, multi-resume with one default); a Talent Profile with skills/education/experience/projects/certifications and a computed completion score; job search/discovery with Easy Apply and a full multi-step application flow; a Recruiter Portal for job posting, screening questions, pre-screening auto-rejection, and assessments; an advisory AI match score; a hiring pipeline (Applied→Hired) with interviews, collaborative feedback, and PDF offer letters; company subscription-tier job-post limits; resume/contact visibility controls; and recruitment-fraud detection/moderation.

Like `010`, this volume is **not directly cited by name** in the constitution's source notes for any article — it is one of the PRD's leaner draft volumes (flat section/bullet lists, no data model, no numeric SLAs, extensively flagged `[NEEDS CLARIFICATION]` throughout spec.md rather than inventing detail). The plan aligns with constitutional principles without claiming a primary-source citation: the AI match score is explicitly advisory only, with the recruiter making the final decision (Article II, spec.md Assumptions); guaranteed-job-placement claims are assumed prohibited platform-wide even though Volume 12 doesn't restate it (Article III, spec.md Assumptions); and the four recruiter roles (Admin, Recruiter, Interviewer, Hiring Manager) are assumed to require the same layered RBAC treatment mandated for every multi-role module (Article VII, spec.md Assumptions).

Per spec.md's own Assumptions, this feature **defers, never duplicates**: subscription billing/pricing/proration to `009` (this spec only enforces plan-tier job-post-count limits as a Jobs-module concern); mentor-driven skill verification and resume review to `007`'s mentor/relationship data model; pre-apply course recommendations to `004`'s course/enrollment data model; community sharing of job postings to `005`'s feed/sharing model; and the freelancer-to-marketplace-seller conversion's canonical seller record to `011` (this spec only triggers the conversion and links identity, per the constitution's cross-reference-not-duplicate governance guidance). It **reuses `001`'s layered RBAC** for the four recruiter roles and its audit-log pattern for the required Job Created/Resume Updated/Candidate Applied/Offer Sent event trail (FR-070). It builds its **own** independent state machines for Job Posting, Application, Hiring Pipeline Stage, and Offer Letter — none reused from a prior feature.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–011.

**Primary Dependencies**: NestJS, Next.js, Flutter; a PDF/DOCX generation library for resumes and offer letters (FR-005, FR-047); a code-execution/sandboxing environment for coding-test assessments (FR-043 — NEEDS CLARIFICATION: no sandboxing vendor/technique named in source); AI match-score computation consuming `008`'s shared AI gateway rather than a parallel stack (FR-034); calendar/email/video-conferencing integrations (Meet/Zoom/Teams) for interview scheduling (FR-039, FR-041).

**Storage**: PostgreSQL (~19 entities per spec.md's Key Entities — profile/resume/skill, job/screening, application/pipeline, interview/assessment, offer, company/subscription domains), object storage with access-controlled URLs for resumes/portfolios/certification PDFs/offer letters.

**Testing**: Jest (backend — pre-screening auto-rejection correctness, advisory-not-autonomous AI match scoring, and resume/contact-visibility enforcement contract tests are the highest-stakes tests here, matching this spec's own SC-004 and SC-005), Playwright (web e2e — resume builder, job search/apply, recruiter pipeline), Flutter test (mobile — job search/apply, offline draft persistence).

**Target Platform**: Web + mobile; recruiter portal is web-first.

**Performance Goals**: Job/candidate search and AI-assisted matching remain responsive at the stated qualitative scale target of millions of resumes and millions of job postings (FR-072, SC-007 — NEEDS CLARIFICATION: no quantified latency/throughput SLA given in source).

**Constraints**: The AI match score is always advisory — a recruiter, never the AI, makes the final shortlist/reject/hire decision (FR-034, Constitution Article II alignment); pre-screening auto-rejection rules run server-side against recruiter-defined minimum criteria (FR-033); exactly one resume is enforced as default at any time (FR-007); resume/contact-visibility toggles immediately exclude those fields from all subsequent recruiter-facing search/database results (FR-068, SC-005); internal candidate notes are never visible to the candidate (FR-049); every Job Created/Resume Updated/Candidate Applied/Offer Sent event is captured in the audit log with no gaps (FR-070, SC-006); company job-posting volume is capped by the active subscription tier, with billing mechanics deferred to `009` (FR-052).

**Scale/Scope**: ~19 data entities, 72 functional requirements (FR-001–FR-072), 8 user stories, and 12 items in the source's own stated Acceptance Criteria (§79) that must each be independently demonstrable (SC-008). spec.md flags a notably high number of `[NEEDS CLARIFICATION]` items (role-boundary definitions, verification decision/appeals process, job-approval criteria, RBAC permission sets per recruiter role, scoring-algorithm detail, coding-test sandboxing, fraud-detection method/enforcement, API contracts, and performance SLA) — these are carried into `research.md`, not silently resolved.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Pre-screening rejection rules and AI match-score computation are server-side; job-post limits enforced server-side against plan tier | **PASS — direct implementation (not the constitution's named source for this article)** | FR-033, FR-034, FR-052 |
| II. AI Is Assistive, Never Autonomous | AI match score is explicitly advisory; the recruiter — never the AI — makes the final shortlist/reject/hire decision | **PASS (aligns; spec.md Assumptions ties this explicitly to Article II)** | FR-034, acceptance scenario (US4-3) |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Job listings/company pages/career resources assumed prohibited from guaranteed-job-placement or income claims, consistent with how the rule is stated explicitly for `007`/`002` | **PASS (aligns; spec.md Assumptions)** | spec.md Assumptions |
| IV. Historical Immutability | N/A for this feature's own surfaces — no transaction-snapshot requirement is described in this volume beyond the deferred-to-009 subscription billing | **PASS (N/A)** | spec.md Assumptions |
| V. Ledger-Based Internal Economies | N/A — no internal balance/economy is defined by this feature; subscription billing is deferred entirely to `009` | **PASS (N/A / deferred)** | spec.md Assumptions |
| VI. Consent Is First-Class | Candidates control resume visibility, contact visibility, and recruiter access to their profile | **PASS** | FR-068 |
| VII. Layered, Explicit RBAC | Four recruiter roles (Admin, Recruiter, Interviewer, Hiring Manager) reuse `001`'s RBAC directly; spec.md Assumptions explicitly ties this to Article VII | **PASS (extends 001)** | FR-031, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Featured Jobs promotion is a paid placement mechanic — not yet specified whether it is labeled distinctly from organic results (flagged NEEDS CLARIFICATION) | **PASS (aligns; labeling detail deferred to research.md)** | FR-053 |
| IX. Action Before Consumption | N/A — this is a commerce/talent-marketplace feature, not a learning-consumption module | **PASS (N/A)** | — |
| Localization & Language Requirements | Not addressed in this volume's source text; no Tamil/Tanglish-specific requirement appears in spec.md | **PASS (N/A for this feature)** | spec.md Assumptions |
| Security & Compliance Baseline | Resume, email, phone, salary, and document data protected as sensitive candidate information; immutable audit log for key events | **PASS (aligns; not directly named for this volume in the Baseline's source citation list)** | FR-067, FR-070 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/012-jobs-talent-recruitment/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: role-boundary definitions (Recruiter vs. Marketplace Recruiter, Company Admin vs. Organization Admin), skill-verification decision/appeals process, job "Pending Approval" approver/criteria, per-role RBAC permission sets, AI match-score algorithm/weighting/confidence-threshold, coding-test sandboxing environment, fraud-detection method and enforcement action, API auth model, and the performance SLA behind "millions of resumes / millions of postings"
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`011`'s structure — no new top-level projects; subscription enforcement calls into `009`, mentor verification reads `007`, course recommendations read `004`, community sharing calls `005`, and seller conversion calls `011`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── jobs-profile/        # Talent Profile, Skill/Skill Verification Record, Education/Experience/Project/Certification, Career Preference, Portfolio Item (FR-001–FR-015)
│   │   ├── jobs-resume/         # Resume, template rendering, PDF/DOCX export (FR-004–FR-007)
│   │   ├── jobs-discovery/      # search/filter, Saved Job, Job Alert, Talent Recommendation (FR-016–FR-020, FR-054)
│   │   ├── jobs-application/    # Easy Apply, multi-step Application flow, Application status, Application Dashboard (FR-021–FR-025)
│   │   ├── jobs-recruiter/      # Recruiter Dashboard, Company Profile, Employer Branding, Job Posting, Recruiter Role (FR-026–FR-031)
│   │   ├── jobs-screening/      # Screening Question, pre-screening rules, AI match score, Talent Database search (FR-032–FR-037)
│   │   ├── jobs-interview/      # Interview, Assessment, Assessment Result, coding-test integration (FR-038–FR-044)
│   │   ├── jobs-pipeline/       # Hiring Pipeline Stage, bulk actions, Candidate Note, collaborative hiring, Offer Letter (FR-045–FR-050)
│   │   ├── jobs-subscription/   # Company Subscription tier + job-post-limit enforcement — billing deferred to `009` (FR-051–FR-053)
│   │   └── jobs-admin/          # Admin Panel, fraud/moderation, privacy controls, reports, notifications (FR-060–FR-070)
│   └── common/                  # reused from 001: RbacGuard, audit-log interceptor; reused from 004/005/007/011: cross-module read integrations; reused from 008: AI gateway for match scoring
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (public)/
        └── jobs/{page.tsx, [jobSlug]/page.tsx, companies/[companySlug]/page.tsx}
    └── (member)/
        └── jobs/{profile,resumes,applications,saved,alerts}/
    └── (recruiter)/
        └── dashboard/{jobs,candidates,interviews,assessments,pipeline,analytics,company-profile,billing}/
    └── (admin)/
        └── jobs-admin/{jobs,companies,recruiters,candidates,reports,subscriptions}/

mobile/
└── lib/features/
    └── jobs/                     # profile/resume, search/apply, application dashboard
```

**Structure Decision**: 9 new backend modules under `jobs-*`, mirroring spec.md's own FR groupings. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
