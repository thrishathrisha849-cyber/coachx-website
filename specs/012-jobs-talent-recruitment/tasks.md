---
description: "Task list for Feature 012 — Jobs, Talent Profiles & Recruitment"
---

# Tasks: Jobs, Talent Profiles & Recruitment

**Input**: Design documents from `/specs/012-jobs-talent-recruitment/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses for recruiter roles and the required Job Created/Resume Updated/Candidate Applied/Offer Sent audit trail). This feature integrates with, but does not require full completion of, `004` (course recommendations), `005` (community sharing), `007` (mentor verification/review), `008` (AI match scoring), `009` (subscription billing), and `011` (marketplace seller conversion) — those integration points are called out explicitly where used.

**Tests**: Included throughout — advisory-only AI match scoring, resume/contact-visibility enforcement, and application-status completeness get dedicated Foundational contract tests, matching this spec's own SC-004/US4 acceptance scenario 3, SC-005, and SC-003.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus four supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Recruiter Portal Core & Candidate Search FR-026–FR-028, FR-031, FR-036–FR-037; Company Subscription & Cross-Module Recommendations FR-051–FR-058; Admin/Notifications/Analytics FR-060–FR-066).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses)
- [ ] T002 Resolve `research.md` open items before proceeding: role-boundary definitions (Recruiter vs. Marketplace Recruiter, Company Admin vs. Organization Admin), skill-verification decision/appeals process, job "Pending Approval" approver/criteria, per-role RBAC permission sets, AI match-score algorithm/weighting/confidence-threshold, coding-test sandboxing environment, fraud-detection method and enforcement action, API auth model, and the performance SLA behind "millions of resumes / millions of postings"
- [ ] T003 [P] Add `backend/src/modules/{jobs-profile,jobs-resume,jobs-discovery,jobs-application,jobs-recruiter,jobs-screening,jobs-interview,jobs-pipeline,jobs-subscription,jobs-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Talent Profile` entity with the full field set and 15-user-type support in `backend/src/modules/jobs-profile/talent-profile.entity.ts` (FR-001, FR-003)
- [ ] T005 Implement the profile completion-score calculation service (Basic Info, Experience, Education, Skills, Resume, Projects, Certifications, Profile Photo, Portfolio, Verification) in `backend/src/modules/jobs-profile/completion-score.service.ts` (FR-002)
- [ ] T006 [P] Define the `Resume` entity with default-resume enforcement in `backend/src/modules/jobs-resume/resume.entity.ts` (FR-007)
- [ ] T007 [P] Define `Skill` and `Skill Verification Record` entities in `backend/src/modules/jobs-profile/skill.entity.ts` (FR-009, FR-010)
- [ ] T008 [P] Define `Education Entry`/`Experience Entry`/`Project`/`Certification` entities in `backend/src/modules/jobs-profile/` (FR-011–FR-014)
- [ ] T009 [P] Define the `Career Preference` entity in `backend/src/modules/jobs-profile/career-preference.entity.ts` (FR-015)
- [ ] T010 [P] Define the `Portfolio Item` entity in `backend/src/modules/jobs-profile/portfolio-item.entity.ts` (FR-008)
- [ ] T011 [P] Define the `Company Profile` entity in `backend/src/modules/jobs-recruiter/company-profile.entity.ts` (FR-027)
- [ ] T012 Define the `Job Posting` entity and its status state machine (Draft, Pending Approval, Published, Paused, Closed, Archived) in `backend/src/modules/jobs-recruiter/job-posting.entity.ts` (FR-029, FR-030)
- [ ] T013 [P] Define the `Screening Question` entity in `backend/src/modules/jobs-screening/screening-question.entity.ts` (FR-032)
- [ ] T014 Define the `Application` entity and its status state machine (Submitted, Viewed, Shortlisted, Assessment, Interview, Offer, Hired, Rejected, Withdrawn) in `backend/src/modules/jobs-application/application.entity.ts` (FR-022, FR-023)
- [ ] T015 [P] Define `Saved Job` and `Job Alert` entities in `backend/src/modules/jobs-discovery/` (FR-019, FR-020)
- [ ] T016 [P] Define the `AI Match Score` entity in `backend/src/modules/jobs-screening/ai-match-score.entity.ts` (FR-034)
- [ ] T017 [P] Define the `Interview` entity in `backend/src/modules/jobs-interview/interview.entity.ts` (FR-038)
- [ ] T018 [P] Define `Assessment` and `Assessment Result` entities in `backend/src/modules/jobs-interview/assessment.entity.ts` (FR-042, FR-044)
- [ ] T019 Implement `Hiring Pipeline Stage` tracking (Applied, Screened, Interview, Assessment, Offer, Hired) wired to the `Application` entity in `backend/src/modules/jobs-pipeline/pipeline-stage.service.ts` (FR-045)
- [ ] T020 [P] Define the `Candidate Note` entity in `backend/src/modules/jobs-pipeline/candidate-note.entity.ts` (FR-049)
- [ ] T021 Define the `Offer Letter` entity and its status state machine (Sent, Accepted, Declined, Expired) in `backend/src/modules/jobs-pipeline/offer-letter.entity.ts` (FR-047, FR-048)
- [ ] T022 [P] Define the `Recruiter Role` entity (Admin, Recruiter, Interviewer, Hiring Manager) in `backend/src/modules/jobs-recruiter/recruiter-role.entity.ts` (FR-031)
- [ ] T023 [P] Define the `Company Subscription` entity in `backend/src/modules/jobs-subscription/company-subscription.entity.ts` (FR-051)
- [ ] T024 [P] Define the `Talent Recommendation` entity in `backend/src/modules/jobs-discovery/talent-recommendation.entity.ts` (FR-054)
- [ ] T025 [P] Define the `Report` entity in `backend/src/modules/jobs-admin/report.entity.ts` (FR-064)
- [ ] T026 Note: role/permission enforcement for the four recruiter roles reuses `001`'s layered RBAC directly, and the required audit-log events reuse `001`'s audit-log interceptor — no separate engine is created here (FR-031, FR-070, Constitution Article VII)
- [ ] T027 Implement the pre-screening auto-rejection rule engine (experience, skills, qualification, location, salary), evaluated server-side, in `backend/src/modules/jobs-screening/pre-screening.service.ts` (FR-033)
- [ ] T028 Implement the AI match-score computation service consuming `008`'s shared AI gateway, strictly advisory in nature, in `backend/src/modules/jobs-screening/ai-match-score.service.ts` (FR-034, Constitution Article II)
- [ ] T029 Implement the resume/contact-visibility enforcement gate applied to every recruiter-facing search and Talent Database query, in `backend/src/modules/jobs-profile/visibility-enforcement.service.ts` (FR-068)
- [ ] T030 Contract test: the AI match score is never used to auto-accept or auto-reject a candidate — every shortlist/reject/hire action requires an explicit recruiter action, in `backend/tests/contract/jobs-ai-match-advisory-only.contract.test.ts` (FR-034, US4 acceptance scenario 3)
- [ ] T031 Contract test: a candidate who toggles resume or contact visibility to private is immediately excluded from all subsequent recruiter-facing Talent Database and Candidate Search results, in `backend/tests/contract/jobs-visibility-enforcement.contract.test.ts` (FR-068, SC-005)
- [ ] T032 Contract test: every application at all times reflects exactly one of the nine defined statuses, with zero applications left in an undefined state, in `backend/tests/contract/jobs-application-status-completeness.contract.test.ts` (FR-023, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Build a Resume from a Template (P1) 🎯 MVP

**Independent Test**: A user with no prior resume creates a new resume from a template, fills in all supported sections, and successfully exports both a PDF and a DOCX.

- [ ] T033 [US1] Resume Builder template selection (Modern, ATS-friendly, Executive, Fresher, Creative) in `backend/src/modules/jobs-resume/resume-template.service.ts` (FR-004)
- [ ] T034 [US1] Resume section editor (Personal Details, Career Objective, Summary, Skills, Experience, Education, Projects, Internships, Certifications, Awards, Languages, Interests, References) in `web/src/app/(member)/jobs/resumes/[resumeId]/edit/page.tsx` (FR-006, acceptance scenario 1)
- [ ] T035 [US1] PDF and DOCX export in `backend/src/modules/jobs-resume/resume-export.service.ts` (FR-005, acceptance scenario 1)
- [ ] T036 [US1] Multiple-resume management with exactly-one-default enforcement and automatic demotion of the prior default, wired to T006, in `backend/src/modules/jobs-resume/default-resume.service.ts` (FR-007, acceptance scenario 2)
- [ ] T037 [US1] Profile completion-percentage display broken down by section, wired to T005, in `web/src/components/jobs/completion-meter.tsx` (FR-002, acceptance scenario 3)
- [ ] T038 [US1] Portfolio attachment (images, videos, PDFs, GitHub/Behance/Dribbble/LinkedIn/website/case-study/demo links), wired to T010, in `backend/src/modules/jobs-profile/portfolio.service.ts` (FR-008)
- [ ] T039 [P] [US1] Resume Builder UI (web/mobile) in `web/src/app/(member)/jobs/resumes/page.tsx`
- [ ] T040 [US1] Integration test: template-to-export flow, default-resume enforcement and demotion, completion-percentage accuracy — all 3 acceptance scenarios in `backend/tests/integration/us1-resume-builder.integration.test.ts`

**Checkpoint**: The prerequisite for Easy Apply, AI Matching, and Candidate Search is independently functional.

---

## Phase 4: User Story 2 — Search, Filter, and Apply to Jobs (P1)

**Independent Test**: A candidate with a completed profile/default resume searches for a job using at least one filter, applies via Easy Apply, and verifies the application appears in their Application Dashboard with status "Submitted."

- [ ] T041 [US2] Job search (keyword, company, skill, city, state, remote status, experience, salary, industry, job type) in `backend/src/modules/jobs-discovery/job-search.service.ts` (FR-016)
- [ ] T042 [US2] Job-search filters (Remote, Hybrid, Onsite, Fresher, Experience, Salary, Company Size, Skills, Posted Today, Last 7 Days, Last 30 Days, Easy Apply) in `backend/src/modules/jobs-discovery/job-filters.service.ts` (FR-017, acceptance scenario 1)
- [ ] T043 [US2] Job Detail Page (Title, Company, Salary, Experience, Skills, Description, Responsibilities, Benefits, Company Overview, Similar Jobs, Apply button) in `web/src/app/(public)/jobs/[jobSlug]/page.tsx` (FR-018)
- [ ] T044 [US2] Saved jobs plus folders in `backend/src/modules/jobs-discovery/saved-job.service.ts` (FR-019)
- [ ] T045 [US2] Job Alerts (skills/salary/location/industry/experience criteria) with Push/Email/In-App delivery in `backend/src/modules/jobs-discovery/job-alert.service.ts` (FR-020)
- [ ] T046 [US2] Easy Apply (one-click application using the default resume) in `backend/src/modules/jobs-application/easy-apply.service.ts` (FR-021, acceptance scenario 2)
- [ ] T047 [US2] Full multi-step Application Flow (Apply → Resume Selected → Cover Letter → Questions → Submit → Confirmation) in `backend/src/modules/jobs-application/application-flow.service.ts` (FR-022, acceptance scenario 3)
- [ ] T048 [US2] Application status tracking, wired to T014 (FR-023)
- [ ] T049 [US2] Application Dashboard (Active Applications, Saved Jobs, Interview Schedule, Assessments, Offers, History) in `web/src/app/(member)/jobs/applications/page.tsx` (FR-024)
- [ ] T050 [US2] Application withdrawal before final offer, with a defined race-condition cutoff at the Offer stage, in `backend/src/modules/jobs-application/application-withdrawal.service.ts` (FR-025, acceptance scenario 4, edge case)
- [ ] T051 [P] [US2] Job search/apply mobile UI in `mobile/lib/features/jobs/search_apply/`
- [ ] T052 [US2] Integration test: multi-filter search accuracy, Easy Apply submission, full application-flow confirmation, withdrawal-before-offer — all 4 acceptance scenarios in `backend/tests/integration/us2-job-search-apply.integration.test.ts`

**Checkpoint**: The core candidate-facing transaction of the module is independently functional.

---

## Phase 5: User Story 3 — Recruiter Posts a Job with Screening Questions and Assessments (P1)

**Independent Test**: A recruiter account creates a new job posting with at least one screening question and one pre-screening rule, publishes it, and confirms it becomes visible/searchable while non-qualifying applicants are auto-rejected at screening.

- [ ] T053 [US3] Job posting creation (Title, Category, Description, Skills, Experience, Salary, Benefits, Openings, Deadline) entering Draft status, wired to T012, in `backend/src/modules/jobs-recruiter/job-creation.service.ts` (FR-029, acceptance scenario 1)
- [ ] T054 [US3] Job posting status transitions (Draft → Pending Approval → Published → Paused → Closed → Archived) affecting search visibility in `backend/src/modules/jobs-recruiter/job-status.service.ts` (FR-030, acceptance scenario 4)
- [ ] T055 [US3] Screening question creation (Yes/No, MCQ, Paragraph, Number, File Upload), wired to T013, in `backend/src/modules/jobs-screening/screening-question.service.ts` (FR-032)
- [ ] T056 [US3] Pre-screening auto-rejection rule configuration, wired to T027's engine, in `backend/src/modules/jobs-screening/pre-screening-rule-config.service.ts` (FR-033, acceptance scenario 2)
- [ ] T057 [US3] Assessment configuration (Aptitude, Coding, MCQ, Essay, Personality, Domain Test) attached to a job, wired to T018, in `backend/src/modules/jobs-interview/assessment-config.service.ts` (FR-042, acceptance scenario 3)
- [ ] T058 [US3] Coding-test language support (C, C++, Java, Python, JavaScript) in `backend/src/modules/jobs-interview/coding-test.service.ts` (FR-043)
- [ ] T059 [US3] Assessment result display (Score, Time taken, Ranking, Pass/Fail) in `backend/src/modules/jobs-interview/assessment-result.service.ts` (FR-044)
- [ ] T060 [P] [US3] Recruiter job-posting creation UI in `web/src/app/(recruiter)/dashboard/jobs/create/page.tsx`
- [ ] T061 [US3] Integration test: draft-creation with required fields, pre-screening auto-rejection, assessment attachment feeding the pipeline, status-change removes from search — all 4 acceptance scenarios in `backend/tests/integration/us3-job-posting.integration.test.ts`

**Checkpoint**: Without a compliant published job posting, no downstream candidate-facing or hiring-pipeline capability has content to operate on.

---

## Phase 6: User Story 4 — View Explainable AI Match Score Against a Job Posting (P2)

**Independent Test**: A job detail page for a candidate with a completed profile displays a percentage match score together with a human-readable explanation of contributing factors, without needing any recruiter action.

- [ ] T062 [US4] AI match-score computation (skills, experience, education, resume, certifications, projects, activity), wired to T028 and T016, in `backend/src/modules/jobs-screening/ai-match-score.service.ts` (FR-034, acceptance scenario 1)
- [ ] T063 [US4] Match-score explanation UI (contributing-factor breakdown) in `web/src/components/jobs/match-score-explanation.tsx` (FR-035, acceptance scenario 2)
- [ ] T064 [US4] Recruiter-decision-remains-human enforcement, validated by T030's contract test (FR-034, acceptance scenario 3)
- [ ] T065 [P] [US4] Match-score display UI on the job detail page
- [ ] T066 [US4] Integration test: match score displayed for complete profiles, factor explanation on request, recruiter-not-AI final decision — all 3 acceptance scenarios in `backend/tests/integration/us4-ai-match-score.integration.test.ts`

**Checkpoint**: The Definition-of-Done "AI matching functional" item is independently functional.

---

## Phase 7: User Story 5 — Get a Skill Verified (P2)

**Independent Test**: A candidate adds an unverified skill, submits it through one verification path, and confirms the skill's status changes from unverified to "Verified" and is reflected on their public profile.

- [ ] T067 [US5] Skill entry (name, category, level, years of experience, verified status), wired to T007, in `backend/src/modules/jobs-profile/skill.service.ts` (FR-009)
- [ ] T068 [US5] Mentor-approval verification path, consuming `007`'s mentor data model, in `backend/src/modules/jobs-profile/skill-verification-mentor.service.ts` (FR-010, acceptance scenario 1)
- [ ] T069 [US5] Assessment-test verification path in `backend/src/modules/jobs-profile/skill-verification-assessment.service.ts` (FR-010, acceptance scenario 2)
- [ ] T070 [US5] Certification-record verification path in `backend/src/modules/jobs-profile/skill-verification-certification.service.ts` (FR-010, acceptance scenario 3)
- [ ] T071 [US5] Manual admin verification path in `backend/src/modules/jobs-profile/skill-verification-manual.service.ts` (FR-010, acceptance scenario 4)
- [ ] T072 [P] [US5] Skill verification UI in `web/src/app/(member)/jobs/profile/skills/page.tsx`
- [ ] T073 [US5] Integration test: mentor approval, assessment pass, certification validation, manual admin fallback — all 4 acceptance scenarios in `backend/tests/integration/us5-skill-verification.integration.test.ts`

**Checkpoint**: The trust signal feeding AI Matching and recruiter Candidate Search is independently functional.

---

## Phase 8: User Story 6 — Move a Candidate Through the Hiring Pipeline to an Offer (P2)

**Independent Test**: Take a single existing application from "Applied" through each pipeline stage to "Hired," scheduling at least one interview and generating one offer letter.

- [ ] T074 [US6] Hiring pipeline stage transitions (Applied → Screened → Interview → Assessment → Offer → Hired), wired to T019 (FR-045, acceptance scenario 1)
- [ ] T075 [US6] Interview round types (HR, Technical, Panel, Final, CEO Round), wired to T017 (FR-038)
- [ ] T076 [US6] Interview scheduling integrated with calendar/email/notifications in `backend/src/modules/jobs-interview/interview-scheduling.service.ts` (FR-039, acceptance scenario 2)
- [ ] T077 [US6] Interview delivery modes (Online, Offline, Phone, Video, Panel) plus video-link integration (Meet/Zoom/Teams/external) in `backend/src/modules/jobs-interview/interview-delivery.service.ts` (FR-040, FR-041, acceptance scenario 2)
- [ ] T078 [US6] Bulk recruiter actions (shortlist, reject, email, schedule interview) across multiple candidates in `backend/src/modules/jobs-pipeline/bulk-actions.service.ts` (FR-046)
- [ ] T079 [US6] Internal candidate notes never visible to the candidate, wired to T020, in `backend/src/modules/jobs-pipeline/candidate-note.service.ts` (FR-049, acceptance scenario 3)
- [ ] T080 [US6] Collaborative hiring feedback sharing among hiring managers in `backend/src/modules/jobs-pipeline/collaborative-hiring.service.ts` (FR-050, acceptance scenario 3)
- [ ] T081 [US6] Offer letter generation (PDF) plus status tracking (Sent, Accepted, Declined, Expired), wired to T021, in `backend/src/modules/jobs-pipeline/offer-letter.service.ts` (FR-047, FR-048, acceptance scenario 4)
- [ ] T082 [P] [US6] Recruiter pipeline/interview-scheduling UI in `web/src/app/(recruiter)/dashboard/pipeline/[jobId]/page.tsx`
- [ ] T083 [US6] Integration test: full pipeline-stage progression, video-interview scheduling with notifications, collaborative-feedback-visible-with-notes-hidden, offer generation and status tracking — all 4 acceptance scenarios in `backend/tests/integration/us6-hiring-pipeline.integration.test.ts`

**Checkpoint**: The recruiter-side counterpart to job posting and application is independently functional — a company can complete a hire.

---

## Phase 9: User Story 7 — Control Resume and Contact Visibility, and Get Protected from Recruitment Fraud (P3)

**Independent Test**: (a) A candidate toggles resume/contact visibility off and recruiters can no longer view those fields; (b) an admin/system flags a fraudulent job posting or company and it is removed from candidate-facing search.

- [ ] T084 [US7] Resume-visibility toggle (public/private) enforced against Talent Database access, wired to T029 (FR-068, acceptance scenario 1)
- [ ] T085 [US7] Contact-visibility toggle (email/phone hidden) in `backend/src/modules/jobs-profile/contact-visibility.service.ts` (FR-068, acceptance scenario 2)
- [ ] T086 [US7] Sensitive-candidate-data protection (resume, email, phone, salary, document) per the platform PII baseline in `backend/src/modules/jobs-profile/sensitive-data-protection.service.ts` (FR-067)
- [ ] T087 [US7] Fraud/moderation detection (fake recruiters, fake resumes, spam jobs, duplicate companies) with listing removal on a confirmed flag in `backend/src/modules/jobs-admin/fraud-detection.service.ts` (FR-069, acceptance scenario 3)
- [ ] T088 [P] [US7] Privacy-controls UI in `web/src/app/(member)/jobs/profile/privacy/page.tsx`
- [ ] T089 [US7] Integration test: resume-visibility-off hides from recruiters, contact-visibility-off hides email/phone, confirmed-fraud-flag removes listing from search — acceptance scenarios 1–3 (scenario 4's candidate-facing consequence is a NEEDS CLARIFICATION item resolved via T002's research) in `backend/tests/integration/us7-privacy-fraud-protection.integration.test.ts`

**Checkpoint**: The cross-cutting safety controls protecting trust across the module are independently functional.

---

## Phase 10: User Story 8 — Freelancer Converts into a Marketplace Seller (P3)

**Independent Test**: A user with an existing Freelancer-type talent profile triggers "become a seller," and a marketplace seller account is created and linked to their existing talent profile without requiring re-entry of already-known profile data.

- [ ] T090 [US8] "Become a seller" conversion trigger creating/linking a Marketplace seller account via `011`'s seller model, carrying over known profile data without re-entry, in `backend/src/modules/jobs-profile/seller-conversion.service.ts` (FR-059, acceptance scenario 1)
- [ ] T091 [P] [US8] Freelancer-to-seller conversion UI in `web/src/app/(member)/jobs/profile/become-a-seller/page.tsx`
- [ ] T092 [US8] Integration test: conversion creates a linked seller account under the same user identity — acceptance scenario 1 (scenario 2's profile-merge model is a NEEDS CLARIFICATION item resolved via T002's research) in `backend/tests/integration/us8-seller-conversion.integration.test.ts`

**Checkpoint**: The Jobs-to-Marketplace cross-module integration point is independently functional.

---

## Phase 10b: Recruiter Portal Core & Candidate Search (supports FR-026–FR-028, FR-031, FR-036–FR-037; cross-cutting, no single owning story)

- [ ] T093 Recruiter Dashboard (Jobs, Candidates, Interviews, Assessments, Pipeline, Analytics, Company Profile, Billing sections) in `web/src/app/(recruiter)/dashboard/overview/page.tsx` (FR-026)
- [ ] T094 Company Profile configuration (Logo, Cover, About, Website, Industry, Company Size, Headquarters, Benefits, Culture, Photos, Videos), wired to T011, in `backend/src/modules/jobs-recruiter/company-profile.service.ts` (FR-027)
- [ ] T095 [P] Employer Branding content (Photos, Videos, Employee Stories, Office Tour, Awards, Social Links, Reviews) in `backend/src/modules/jobs-recruiter/employer-branding.service.ts` (FR-028)
- [ ] T096 Recruiter role definition (Admin, Recruiter, Interviewer, Hiring Manager) reusing `001`'s RBAC, wired to T022, in `backend/src/modules/jobs-recruiter/recruiter-role.service.ts` (FR-031)
- [ ] T097 Recruiter candidate search (Skills, Experience, Education, Resume content, Availability, Location) in `backend/src/modules/jobs-recruiter/candidate-search.service.ts` (FR-036)
- [ ] T098 Talent Database browsing of verified talent in `backend/src/modules/jobs-recruiter/talent-database.service.ts` (FR-037)

**Checkpoint**: The recruiter's core workspace and candidate-sourcing surface are independently functional.

---

## Phase 10c: Company Subscription & Cross-Module Recommendations (supports FR-051–FR-058; cross-cutting, no single owning story)

- [ ] T099 Company subscription tiers (Free, Starter, Professional, Enterprise), wired to T023, billing deferred to `009`, in `backend/src/modules/jobs-subscription/subscription-tier.service.ts` (FR-051)
- [ ] T100 Job-posting-limit enforcement per active subscription tier in `backend/src/modules/jobs-subscription/post-limit.service.ts` (FR-052)
- [ ] T101 Featured Jobs promotion in `backend/src/modules/jobs-subscription/featured-job.service.ts` (FR-053)
- [ ] T102 [P] Talent Recommendation auto-generation, wired to T024, in `backend/src/modules/jobs-discovery/talent-recommendation.service.ts` (FR-054)
- [ ] T103 [P] Career Resources content (Resume Tips, Interview Tips, Salary Guides, Career Roadmaps) in `web/src/app/(public)/jobs/resources/page.tsx` (FR-055)
- [ ] T104 Mentor integration for resume review, consuming `007`'s mentor data model, in `backend/src/modules/jobs-profile/mentor-resume-review.service.ts` (FR-056)
- [ ] T105 Course-recommendation integration before apply, consuming `004`'s course/enrollment model, in `backend/src/modules/jobs-application/course-recommendation.service.ts` (FR-057)
- [ ] T106 Community sharing of job postings into `005`'s feed in `backend/src/modules/jobs-recruiter/community-share.service.ts` (FR-058)

**Checkpoint**: Monetization-tier enforcement and every cross-module integration point are independently functional.

---

## Phase 11: Admin, Notifications & Analytics (supports FR-060–FR-066; cross-cutting, no single owning story)

- [ ] T107 [P] Candidate notifications (Job Match, Interview, Offer, Reminder) in `backend/src/modules/jobs-admin/candidate-notifications.service.ts` (FR-060)
- [ ] T108 [P] Recruiter notifications (New Applicant, Interview, Acceptance) in `backend/src/modules/jobs-admin/recruiter-notifications.service.ts` (FR-061)
- [ ] T109 Candidate analytics (Profile Views, Resume Downloads, Application Success) in `web/src/app/(member)/jobs/profile/analytics/page.tsx` (FR-062)
- [ ] T110 Recruiter analytics (Applicants, Time to Hire, Cost per Hire) in `web/src/app/(recruiter)/dashboard/analytics/page.tsx` (FR-063)
- [ ] T111 Report generation (Hiring, Applicants, Interviews, Diversity, Offer Acceptance, Recruiter Activity), wired to T025, in `backend/src/modules/jobs-admin/report-generation.service.ts` (FR-064)
- [ ] T112 Admin Panel (Jobs, Companies, Recruiters, Candidates, Reports, Subscriptions) in `web/src/app/(admin)/jobs-admin/layout.tsx` (FR-065)
- [ ] T113 Moderation review (Fake Jobs, Spam, Duplicate Listings, Fraud Companies) in `backend/src/modules/jobs-admin/moderation-review.service.ts` (FR-066)
- [ ] T114 [P] Admin panel and analytics dashboard UI polish

**Checkpoint**: The full administrative and reporting surface is independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T115 [P] API surface exposure (Jobs, Companies, Resume, Applications, Interviews, Assessments, Offers, Reports) (FR-071)
- [ ] T116 Performance hardening pass toward the millions-of-resumes/millions-of-postings qualitative target, with AI-assisted search and fast indexing (FR-072, SC-007)
- [ ] T117 Security hardening pass: re-audit T086's PII protection, T029/T084/T085's visibility enforcement, and audit-log completeness (FR-070, SC-006)
- [ ] T118 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (role boundaries, verification appeals process, job-approval criteria, per-role RBAC permissions, match-score algorithm, coding-test sandboxing, fraud-detection method/enforcement, API auth model, performance SLA, duplicate-application handling, fraud-flagged-resume consequence, seller-profile merge model)
- [ ] T119 Final audit: cross-check every FR-001–FR-072 against an implementation or validation task; verify all twelve items of the source's own Acceptance Criteria (§79) are independently demonstrable (SC-008)
- [ ] T120 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends only on `001`'s RBAC/audit-log and produces the profile/resume/job/application entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (resume builder) is the prerequisite for Easy Apply and should ship first; US2 (search/apply) depends on US1's default-resume mechanism for Easy Apply; US3 (job posting) can build in parallel with US1/US2 since recruiters and candidates are independent actors, but US2's apply flow needs at least one published job from US3 for end-to-end testing.
- **P2 stories (US4–US6)**: US4 (AI match score) depends on US1's completed profile and US3's published jobs; US5 (skill verification) depends on US1's skill entries and `007`'s mentor data; US6 (hiring pipeline) depends on US2/US3 producing real applications to advance.
- **P3 stories (US7–US8)**: US7 (privacy/fraud) depends on US1/US3's profile and job data existing; US8 (seller conversion) depends on US1's Freelancer-type profile and `011`'s seller model.
- **Phase 10b (Recruiter Portal Core/Search)** depends on Foundational's `Company Profile`/`Job Posting` entities and supports US3/US6 — build alongside them.
- **Phase 10c (Subscription/Cross-Module Recommendations)** depends on Foundational plus `004`/`005`/`007`/`009`/`011`'s existing infrastructure; can build in parallel with the P2/P3 stories.
- **Phase 11 (Admin/Notifications/Analytics)** depends on every module it surfaces (jobs from US3, applications from US2, pipeline from US6) — build after those phases are stable.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (resume builder) → **STOP and VALIDATE** self-service resume creation works end to end → US2 (search/apply) + US3 (job posting) in parallel → **STOP and VALIDATE** the core candidate-apply-to-recruiter-post loop works → US4 (AI match score) → US5 (skill verification) → US6 (hiring pipeline to offer) → Phase 10b (recruiter portal core/search) in parallel with US6 → US7 (privacy/fraud) → Phase 10c (subscription/cross-module) → US8 (seller conversion) → Phase 11 (admin/notifications/analytics) → Polish.
