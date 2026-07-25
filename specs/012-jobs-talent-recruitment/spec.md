# Feature Specification: Jobs, Talent Profiles & Recruitment

**Feature Branch**: `012-jobs-talent-recruitment`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 12 — Jobs, Talent Profiles, Resume Builder, Recruiter Portal, Job Posting, Candidate Matching, Applications, Interviews, Assessments, Hiring Pipelines, Employer Branding and Talent Administration" (source: `document 1/Document 1 (11).md`)

<!--
  Traceability note: Volume 12 is explicitly documented (see repository CLAUDE.md) as one of the
  thinner draft volumes in the PRD — a flat feature list of section headings and bullet items with no
  data models, no numeric SLAs, and no RFC "shall" requirement sentences (unlike Volumes 09/11/13).
  Every requirement below is traced to a specific numbered section (§N) of that source file. Where the
  source gives only a bullet list with no behavioral detail, this is flagged explicitly rather than
  invented.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build a Resume from a Template (Priority: P1)

A job seeker (student, fresher, professional, or freelancer) uses the built-in Resume Builder to create a structured resume by choosing a template, filling in sections (personal details, summary, skills, experience, education, projects, certifications, etc.), and exporting it as a PDF or DOCX file. The user can maintain more than one resume (e.g., one for software jobs, one for freelancing) and mark exactly one as the default used for quick-apply.

**Why this priority**: The Resume Builder is listed first in the platform's own MVP Phase 1 scope (§77) and is a prerequisite for almost every other capability in this volume — Easy Apply, AI Matching, and Candidate Search all depend on a completed resume/profile existing first.

**Independent Test**: Can be fully tested by a user with no prior resume creating a new resume from a template, filling in all supported sections, and successfully exporting both a PDF and a DOCX — independent of any job posting or recruiter functionality.

**Acceptance Scenarios**:

1. **Given** a job seeker with no existing resume, **When** they select a resume template (modern, ATS-friendly, executive, fresher, or creative) and complete the supported sections (Personal Details, Career Objective/Summary, Skills, Experience, Education, Projects, Internships, Certifications, Awards, Languages, Interests, References), **Then** the system generates a downloadable resume in both PDF and DOCX formats.
2. **Given** a user who already has a "Resume for Software Jobs" marked as default, **When** they create a second resume "Resume for Marketing" and set it as the new default, **Then** the system enforces exactly one default resume at a time and the previous default is automatically demoted.
3. **Given** a user with an incomplete profile, **When** they view their profile, **Then** the system displays a calculated completion percentage broken down by section (Basic Info, Experience, Education, Skills, Resume, Projects, Certifications, Profile Photo, Portfolio, Verification).

---

### User Story 2 - Search, Filter, and Apply to Jobs (Priority: P1)

A job seeker searches the job board by keyword, company, skill, city, state, remote status, experience, salary, industry, or job type; narrows results with filters (remote/hybrid/onsite, fresher, experience, salary, company size, skills, posting recency, Easy Apply); saves interesting jobs into folders; sets up alerts; and applies to a job either via one-click Easy Apply (using the default resume) or the full multi-step application flow (resume selection, cover letter, screening questions, submit, confirmation).

**Why this priority**: Job search and application are the core candidate-facing transaction of the module and are explicitly part of MVP Phase 1 (§77 lists "Job Posting" and "Apply").

**Independent Test**: Can be fully tested by a candidate with a completed profile/default resume searching for a job using at least one filter, applying via Easy Apply, and verifying the application appears in their Application Dashboard with status "Submitted."

**Acceptance Scenarios**:

1. **Given** a candidate on the job search page, **When** they filter by "Remote" + a specific skill + "Posted Today", **Then** only jobs matching all selected filters are shown.
2. **Given** a candidate viewing a job detail page, **When** they click "Easy Apply", **Then** the system submits an application using their default resume without requiring the full multi-step flow.
3. **Given** a candidate applying to a job with recruiter-defined screening questions, **When** they proceed through Apply → Resume Selected → Cover Letter → Questions → Submit, **Then** they receive a confirmation and the application status is set to "Submitted."
4. **Given** a candidate with an active application not yet at final offer, **When** they choose to withdraw it from their Application Dashboard, **Then** the application status changes to "Withdrawn."

---

### User Story 3 - Recruiter Posts a Job with Screening Questions and Assessments (Priority: P1)

A recruiter or hiring manager creates a job posting (title, category, description, skills, experience, salary, benefits, openings, deadline), attaches screening questions (Yes/No, MCQ, Paragraph, Number, File Upload) with rules that automatically reject candidates who fail minimum experience/skills/qualification/location/salary criteria, and configures assessments (aptitude, coding, MCQ, essay, personality, domain test) to be used later in the hiring pipeline. The job then moves through Draft → Pending Approval → Published.

**Why this priority**: Job Posting and the Recruiter Dashboard are explicitly named in MVP Phase 1 (§77); without a way to create and publish a compliant job posting, no downstream candidate-facing or hiring-pipeline capability has any content to operate on.

**Independent Test**: Can be fully tested by a recruiter account creating a new job posting with at least one screening question and one pre-screening rule, publishing it, and confirming it becomes visible/searchable to candidates while non-qualifying applicants are auto-rejected at screening.

**Acceptance Scenarios**:

1. **Given** a recruiter filling out a new job, **When** they submit required fields (Title, Category, Description, Skills, Experience, Salary, Benefits, Openings, Deadline), **Then** the job is created in "Draft" status.
2. **Given** a draft job with screening questions and a pre-screening rule requiring minimum 2 years' experience, **When** a candidate with 0 years' experience applies, **Then** the system automatically rejects the application at the pre-screening stage.
3. **Given** a published job, **When** the recruiter attaches a coding test (e.g., Python) as part of the Assessments step, **Then** shortlisted candidates can be routed to that coding test as part of the hiring pipeline's "Assessment" stage.
4. **Given** a published job, **When** the recruiter changes its status to "Paused," "Closed," or "Archived," **Then** the job is no longer returned in candidate search results per its new status.

---

### User Story 4 - View Explainable AI Match Score Against a Job Posting (Priority: P2)

A candidate viewing a job (or a recruiter viewing a candidate) sees an AI-generated match score (e.g., 95%, 82%, 71%) computed from skills, experience, education, resume content, certifications, projects, and platform activity, accompanied by an explanation of what drove the score.

**Why this priority**: AI Matching is called out as a required business objective (§2) and a Definition-of-Done item ("AI matching functional," §78), but it is an enhancement layer on top of the core search/apply and job-posting flows (Stories 1–3), so it is not required for a minimally viable release.

**Independent Test**: Can be fully tested by opening a job detail page for a candidate with a completed profile and confirming a percentage match score is displayed together with a human-readable explanation of contributing factors, without needing any recruiter action.

**Acceptance Scenarios**:

1. **Given** a candidate with a complete profile (skills, experience, education, certifications, projects) viewing a job posting, **When** the page loads, **Then** the system displays a percentage match score.
2. **Given** a displayed match score, **When** the candidate requests more detail, **Then** the system shows an explanation of which factors (skills, experience, education, resume, certifications, projects, activity) contributed to the score.
3. **Given** the AI match score is only advisory, **When** a recruiter reviews AI-ranked candidates, **Then** the recruiter — not the AI — makes the final shortlist/reject decision (consistent with the platform's AI-is-assistive principle).

---

### User Story 5 - Get a Skill Verified (Priority: P2)

A candidate adds a skill to their profile (name, category, level, years of experience) and gets it marked "Verified" through one of the supported verification methods: mentor approval, an assessment test, a certification record, project completion, or manual admin verification.

**Why this priority**: Verified skills are called out as a Core Principle ("Verified skills," §3) and directly increase trust in candidate profiles used by AI Matching and recruiter Candidate Search — but the platform is still functional (search/apply/post) without every skill being verified, so this ranks below the P1 transactional flows.

**Independent Test**: Can be fully tested by a candidate adding an unverified skill, submitting it through one verification path (e.g., completing an assessment test), and confirming the skill's status changes from unverified to "Verified" and is reflected on their public profile.

**Acceptance Scenarios**:

1. **Given** a candidate with an unverified "Python" skill, **When** a mentor approves that skill, **Then** the skill's Verified Status changes to verified and is attributed to mentor approval.
2. **Given** a candidate with an unverified skill, **When** they pass a platform assessment test for that skill, **Then** the skill is automatically marked verified via the assessment method.
3. **Given** a candidate uploads a certification record for a skill, **When** the certification is validated, **Then** the skill is marked verified via the certification method.
4. **Given** no self-serve verification path applies, **When** an admin manually reviews and approves the skill, **Then** the skill is marked verified via manual admin verification.

---

### User Story 6 - Move a Candidate Through the Hiring Pipeline to an Offer (Priority: P2)

A recruiter or hiring manager moves an applicant through the hiring pipeline stages (Applied → Screened → Interview → Assessment → Offer → Hired), scheduling interviews (HR, Technical, Panel, Final, CEO Round; online/offline/phone/video/panel, with calendar/email/notification integration and video links for Meet/Zoom/Teams/external), recording internal candidate notes not visible to the candidate, collaborating with other hiring managers on feedback, using bulk actions (shortlist/reject/email/schedule interview) across multiple candidates, and ultimately generating and sending a PDF offer letter whose status (Sent/Accepted/Declined/Expired) is tracked.

**Why this priority**: This is the recruiter-side counterpart to Stories 1–3 and is required for a company to actually complete a hire, but it depends on jobs and applications already existing (Stories 2–3), so it is sequenced after them.

**Independent Test**: Can be fully tested by taking a single existing application from "Applied" through each pipeline stage to "Hired," scheduling at least one interview and generating one offer letter, independent of AI matching or skill verification.

**Acceptance Scenarios**:

1. **Given** an application in "Applied" status, **When** the recruiter advances it through Screened → Interview → Assessment → Offer → Hired, **Then** the hiring pipeline stage and the candidate-visible application status update accordingly.
2. **Given** a candidate reaching the Interview stage, **When** the recruiter schedules a Technical interview via video (Zoom link), **Then** the candidate and interviewer receive calendar, email, and in-app notifications.
3. **Given** multiple hiring managers involved in a candidate's evaluation, **When** each submits feedback, **Then** all feedback is visible to the collaborating hiring team (collaborative hiring) while candidate notes remain hidden from the candidate.
4. **Given** a candidate reaches the Offer stage, **When** the recruiter generates and sends a PDF offer letter, **Then** its status is tracked as Sent, and later updates to Accepted, Declined, or Expired.

---

### User Story 7 - Control Resume and Contact Visibility, and Get Protected from Recruitment Fraud (Priority: P3)

A candidate controls who can see their resume, contact details, and overall profile (recruiter access), while the platform independently protects all users by detecting and moderating fake recruiters, fake resumes, spam job postings, and duplicate/fraudulent companies.

**Why this priority**: Privacy and fraud prevention are explicitly named platform requirements (§70–§72) that protect trust across the whole module, but they are cross-cutting safety controls layered on top of profiles/jobs that already exist (Stories 1–3), rather than a distinct primary transaction.

**Independent Test**: Can be tested in two independent halves — (a) a candidate toggling resume/contact visibility off and confirming recruiters can no longer view those fields, and (b) an admin/system flagging a job posting or company identified as fraudulent and confirming it is removed from candidate-facing search.

**Acceptance Scenarios**:

1. **Given** a candidate profile with resume visibility set to "public," **When** the candidate toggles resume visibility to private, **Then** recruiters browsing the Talent Database can no longer view or download that resume.
2. **Given** a candidate who has toggled contact visibility off, **When** a recruiter views the candidate's profile, **Then** email and phone fields are hidden.
3. **Given** a job posting or company profile flagged by the fraud-detection system as fake/duplicate, **When** the flag is confirmed (via moderation review), **Then** the listing is removed from candidate-facing search and the recruiter/company account is subject to admin review.
4. **Given** a candidate uploads a resume the system suspects is fraudulent (e.g., plagiarized/fabricated), **When** fraud detection flags it, **Then** [NEEDS CLARIFICATION: source does not specify the candidate-facing consequence — warning, hold pending review, or automatic rejection — for a resume flagged by fraud detection].

---

### User Story 8 - Freelancer Converts into a Marketplace Seller (Priority: P3)

A freelancer with a talent profile on the Jobs module converts that profile into a seller account on the Marketplace module (Volume 11), carrying over relevant profile information so they can list services/products for sale.

**Why this priority**: This is an explicit but very lightly specified cross-module integration point (§64) that extends reach for freelancers already using the platform; it depends on both a completed Jobs profile (Story 1) and the existence of the Marketplace seller model owned by Volume 11, making it lowest priority to build independently.

**Independent Test**: Can be tested by a user with an existing Freelancer-type talent profile triggering "become a seller," and confirming a marketplace seller account is created and linked to their existing talent profile without requiring re-entry of already-known profile data.

**Acceptance Scenarios**:

1. **Given** a user with a Freelancer talent profile, **When** they choose to convert into a marketplace seller, **Then** the system creates/links a Marketplace seller account associated with the same user identity.
2. **Given** a freelancer has converted to a seller, **When** they view their Jobs talent profile, **Then** [NEEDS CLARIFICATION: source does not specify whether the Jobs talent profile and Marketplace seller profile remain two distinct records with shared identity, or a single merged profile — the seller data model itself is owned by Volume 11].

---

### Edge Cases

- What happens when a candidate applies to the same job twice (e.g., via Easy Apply after already submitting a full application)? [NEEDS CLARIFICATION: source does not state whether duplicate applications to the same job are blocked, merged, or allowed.]
- What happens to open applications, scheduled interviews, or pending offers when a job posting reaches its deadline or is manually set to "Closed" / "Archived" (§35) before the pipeline (§49) completes for all in-flight candidates?
- How does the system handle a candidate who is auto-rejected by pre-screening (§37) but who believes the rejection was in error (e.g., a location or salary mismatch caused by a data-entry issue)? [NEEDS CLARIFICATION: no appeal/override path is described.]
- What happens if a candidate attempts to withdraw an application (§30, "before final offer") exactly when the recruiter has just moved it to the "Offer" pipeline stage — is there a race-condition cutoff?
- What happens to a candidate's designated "default resume" (§12, only one default resume) if that resume is deleted while Easy Apply (§26) is configured to use it?
- What happens when a candidate toggles resume or contact visibility to private (§71) after a recruiter has already viewed, downloaded, or saved that resume/contact info — does the change apply retroactively to material already accessed?
- What happens when an Offer Letter (§51–52) reaches "Expired" status without a candidate response — does the pipeline stage revert, or does the application close out entirely?
- What happens when a company's subscription plan (§56) is downgraded or expires while the company has more active/published job postings than the new plan's Job Post Limits (§57) allow?
- How are candidates who already applied to a job protected/notified if that job's posting company is subsequently identified as a fraudulent/duplicate company (§72) after applications were submitted?

## Requirements *(mandatory)*

### Talent Profile Requirements

- **FR-001**: System MUST provide every user with one professional Talent Profile containing: Name, Photo, Headline, About, Location, Languages, Experience, Skills, Certifications, Education, Resume, Portfolio, Projects, Achievements, Social Links, Availability, Salary Expectation, Preferred Roles, and Preferred Locations (§8).
- **FR-002**: System MUST calculate and display a Talent Profile completion score as a percentage, computed from section completeness across Basic Info, Experience, Education, Skills, Resume, Projects, Certifications, Profile Photo, Portfolio, and Verification (§9).
- **FR-003**: System MUST support the following distinct user types interacting with the Jobs module: Visitor, Student, Fresher, Experienced Professional, Freelancer, Mentor, Trainer, Recruiter, Hiring Manager, HR Executive, Company Admin, Placement Officer, Organization Admin, Marketplace Recruiter, and Super Admin (§4). [NEEDS CLARIFICATION: source does not define what distinguishes "Recruiter" from "Marketplace Recruiter" or "Organization Admin" from "Company Admin" — role boundaries are not specified.]

### Resume Builder Requirements

- **FR-004**: System MUST provide a built-in Resume Builder supporting Modern, ATS-friendly, Executive, Fresher, and Creative templates (§10).
- **FR-005**: System MUST export a built resume as PDF and DOCX (§10).
- **FR-006**: System MUST support the following resume sections: Personal Details, Career Objective, Summary, Skills, Experience, Education, Projects, Internships, Certifications, Awards, Languages, Interests, and References (§11).
- **FR-007**: System MUST allow a user to maintain multiple resumes (e.g., separate resumes targeted at Software, Marketing, HR, Design, and Freelancing roles) while enforcing exactly one resume as the default at any time (§12).
- **FR-008**: System MUST support a Portfolio attached to the profile containing Images, Videos, PDFs, and links to GitHub, Behance, Dribbble, LinkedIn, a personal website, case studies, and live demo links (§13).

### Skill & Credential Requirements

- **FR-009**: System MUST record, per skill, a Skill Name, Category, Level, Years of Experience, and Verified Status (§14).
- **FR-010**: System MUST support marking a skill as verified through at least one of the following methods: mentor approval, assessment test, certification, project completion, or manual admin verification (§15). [NEEDS CLARIFICATION: source does not specify the decision/appeals process, evidence requirements, or expiry rules for any verification method.]
- **FR-011**: System MUST record Education entries with Institution, Degree, Department, University, Start Year, End Year, Grade, and Description (§16).
- **FR-012**: System MUST record Experience entries with Company, Position, Employment Type, Start Date, End Date, a "Current Job" flag, Responsibilities, and Achievements (§17).
- **FR-013**: System MUST record Project entries with Name, Description, Technologies, Team Size, Duration, Role, GitHub link, Live URL, and Images (§18).
- **FR-014**: System MUST record Certification entries with Certificate Name, Provider, Date, Expiry, Credential ID, URL, and an attached PDF (§19).
- **FR-015**: System MUST allow candidates to define Career Preferences: Preferred Roles, Preferred Salary, Preferred Industries, Preferred Locations, Work Mode, Notice Period, and Availability (§20).

### Job Discovery Requirements

- **FR-016**: System MUST support job search by keyword, company, skill, city, state, remote status, experience, salary, industry, and job type (§21).
- **FR-017**: System MUST support filtering job search results by Remote, Hybrid, Onsite, Fresher, Experience, Salary, Company Size, Skills, Posted Today, Last 7 Days, Last 30 Days, and Easy Apply (§22).
- **FR-018**: System MUST display a Job Detail Page containing Title, Company, Salary, Experience, Skills, Description, Responsibilities, Benefits, Company Overview, Similar Jobs, and an Apply button (§23).
- **FR-019**: System MUST allow candidates to save jobs, remove saved jobs, and organize saved jobs into folders (§24).
- **FR-020**: System MUST allow candidates to configure Job Alerts based on Skills, Salary, Location, Industry, and Experience, and deliver alert notifications via Push, Email, and In-App channels (§25).
- **FR-021**: System MUST support "Easy Apply" — a one-click application using the candidate's default resume (§26).
- **FR-022**: System MUST support a full multi-step Application Flow consisting of: Apply, Resume Selected, Cover Letter, Questions, Submit, Confirmation (§27).
- **FR-023**: System MUST track application status across the states: Submitted, Viewed, Shortlisted, Assessment, Interview, Offer, Hired, Rejected, and Withdrawn (§28).
- **FR-024**: System MUST provide candidates an Application Dashboard showing Active Applications, Saved Jobs, Interview Schedule, Assessments, Offers, and History (§29).
- **FR-025**: System MUST allow a candidate to withdraw an application at any point before a final offer is made (§30).

### Recruiter Portal Requirements

- **FR-026**: System MUST provide a Recruiter Dashboard containing Jobs, Candidates, Interviews, Assessments, Pipeline, Analytics, Company Profile, and Billing sections (§31).
- **FR-027**: System MUST support a Company Profile containing Logo, Cover, About, Website, Industry, Company Size, Headquarters, Benefits, Culture, Photos, and Videos (§32).
- **FR-028**: System MUST support Employer Branding content on company pages, including Photos, Videos, Employee Stories, Office Tour, Awards, Social Links, and Reviews (§33).
- **FR-029**: System MUST allow recruiters to create a job posting with Title, Category, Description, Skills, Experience, Salary, Benefits, Openings, and Deadline (§34).
- **FR-030**: System MUST track job posting status across the states: Draft, Pending Approval, Published, Paused, Closed, and Archived (§35). [NEEDS CLARIFICATION: source does not specify who approves a job in "Pending Approval" state or what approval criteria apply.]
- **FR-031**: System MUST support defining recruiter roles of Admin, Recruiter, Interviewer, and Hiring Manager (§55). [NEEDS CLARIFICATION: source does not define the specific permissions granted to each role — consistent with the constitution's requirement for an explicit, layered RBAC model rather than a flat role list, the permission boundaries between these four roles need to be specified.]

### Screening & AI Matching Requirements

- **FR-032**: System MUST allow recruiters to create screening questions of type Yes/No, MCQ, Paragraph, Number, and File Upload (§36).
- **FR-033**: System MUST support automatic rejection of applicants at a pre-screening stage based on rules evaluating Experience, Skills, Qualification, Location, and Salary (§37).
- **FR-034**: System MUST compute an AI match score for a candidate against a job using Skills, Experience, Education, Resume, Certifications, Projects, and platform Activity as inputs (§38). Per platform-wide AI principles, this score MUST remain advisory input to a human recruiter decision, not an automatic accept/reject action.
- **FR-035**: System MUST display the AI match score as a percentage (e.g., 95%, 82%, 71%) along with a human-readable explanation of the contributing factors (§39). [NEEDS CLARIFICATION: source does not specify the scoring algorithm, weighting of each factor, or a minimum-confidence threshold below which a score should not be shown.]
- **FR-036**: System MUST allow recruiters to search candidates by Skills, Experience, Education, Resume content, Availability, and Location (§40).
- **FR-037**: System MUST allow recruiters to browse a Talent Database of verified talent (§41). [NEEDS CLARIFICATION: source does not define what qualifies a talent profile for inclusion in this database — e.g., minimum verified-skill count, opt-in consent, or profile completeness threshold.]

### Interview & Assessment Requirements

- **FR-038**: System MUST support interview types by round: HR Interview, Technical, Panel, Final, and CEO Round (§42).
- **FR-039**: System MUST support interview scheduling integrated with Calendar, Email, and Notifications (§43).
- **FR-040**: System MUST support interview delivery modes: Online, Offline, Phone, Video, and Panel (§44).
- **FR-041**: System MUST support video interviews via Meet Link, Zoom, Teams, or an external link (§45).
- **FR-042**: System MUST support assessments of type Aptitude, Coding, MCQ, Essay, Personality, and Domain Test (§46).
- **FR-043**: System MUST support coding tests in C, C++, Java, Python, and JavaScript (§47). [NEEDS CLARIFICATION: source does not specify the code execution/sandboxing environment, time limits, or anti-cheating controls for coding tests.]
- **FR-044**: System MUST display assessment results including Score, Time taken, Ranking, and Pass/Fail outcome (§48).

### Hiring Pipeline Requirements

- **FR-045**: System MUST track candidates through hiring pipeline stages: Applied, Screened, Interview, Assessment, Offer, and Hired (§49).
- **FR-046**: System MUST support bulk recruiter actions across multiple candidates: Shortlist, Reject, Email, and Schedule Interview (§50).
- **FR-047**: System MUST generate offer letters and export them as PDF (§51).
- **FR-048**: System MUST track offer status across the states: Sent, Accepted, Declined, and Expired (§52).
- **FR-049**: System MUST allow recruiters to store internal candidate notes that are never visible to the candidate (§53).
- **FR-050**: System MUST support collaborative hiring, allowing hiring managers to share feedback on a candidate with each other (§54).

### Company Subscription Requirements

- **FR-051**: System MUST support company subscription plans: Free, Starter, Professional, and Enterprise (§56).
- **FR-052**: System MUST enforce job posting limits based on the company's active subscription plan (§57). [NEEDS CLARIFICATION: source does not specify the actual numeric limits per plan tier — Billing/pricing detail is owned by Volume 09 (Membership, Payments & Revenue), and this spec should treat plan pricing/billing mechanics as out of scope here, only the enforcement of a post-count limit tied to plan tier.]
- **FR-053**: System MUST allow companies to promote job postings as Featured Jobs (§58). [NEEDS CLARIFICATION: source does not specify how featured placement is purchased/allocated or how long a featured placement lasts.]

### Recommendations & Cross-Module Integration Requirements

- **FR-054**: System MUST automatically generate Talent Recommendations, surfacing candidates to recruiters/companies without an explicit search (§59).
- **FR-055**: System MUST provide Career Resources content: Resume Tips, Interview Tips, Salary Guides, and Career Roadmaps (§60).
- **FR-056**: System MUST support Mentor Integration allowing mentors to review candidate resumes (§61). This depends on the Mentor/Expert data model owned by Volume 07 (Mentor Marketplace).
- **FR-057**: System MUST support Course Integration, recommending relevant courses to a candidate before they apply to a job (§62). This depends on the course/learning data model owned by Volume 04 (Learning Management System).
- **FR-058**: System MUST support sharing job postings into the Community module's feed (§63). This depends on the community feed/sharing model owned by Volume 05 (Community, Social, Trust & Safety).
- **FR-059**: System MUST support converting a Freelancer's talent profile into a Marketplace seller account (§64). This depends on the seller data model owned by Volume 11 (Digital Marketplace).

### Notifications & Analytics Requirements

- **FR-060**: System MUST send candidate notifications for Job Match, Interview, Offer, and Reminder events (§65).
- **FR-061**: System MUST send recruiter notifications for New Applicant, Interview, and Acceptance events (§65).
- **FR-062**: System MUST provide candidates analytics on Profile Views, Resume Downloads, and Application Success (§66).
- **FR-063**: System MUST provide recruiters analytics on Applicants, Time to Hire, and Cost per Hire (§66).
- **FR-064**: System MUST provide reports covering Hiring, Applicants, Interviews, Diversity, Offer Acceptance, and Recruiter Activity (§67).

### Admin, Privacy & Fraud Prevention Requirements

- **FR-065**: System MUST provide an Admin Panel to manage Jobs, Companies, Recruiters, Candidates, Reports, and Subscriptions (§68).
- **FR-066**: System MUST support moderation review of Fake Jobs, Spam, Duplicate Listings, and Fraud Companies (§69).
- **FR-067**: System MUST protect Resume, Email, Phone, Salary, and Document data as sensitive candidate information (§70), consistent with the platform-wide PII security baseline.
- **FR-068**: System MUST allow candidates to control Resume visibility, Contact visibility, and Recruiter access to their profile (§71).
- **FR-069**: System MUST detect fake recruiters, fake resumes, spam jobs, and duplicate companies (§72). [NEEDS CLARIFICATION: source lists these as detection targets but does not specify the detection method (rule-based, ML-based, human-reported) or the resulting enforcement action.]
- **FR-070**: System MUST record an immutable audit log covering, at minimum, Job Created, Resume Updated, Candidate Applied, and Offer Sent events (§74), consistent with the platform-wide audit logging baseline.

### Platform & API Requirements

- **FR-071**: System MUST expose APIs for Jobs, Companies, Resume, Applications, Interviews, Assessments, Offers, and Reports (§73). [NEEDS CLARIFICATION: source lists required API domains only — no endpoint contracts, request/response schemas, or auth model are specified.]
- **FR-072**: System MUST be architected to support performance at the scale of millions of resumes and millions of job postings, with AI-assisted search and fast indexing (§75). [NEEDS CLARIFICATION: source states this as a qualitative scale target ("Millions," "Fast") with no quantified latency, throughput, or indexing-freshness SLA.]

## Key Entities *(include if feature involves data)*

- **Talent Profile**: The single professional profile per user — name, photo, headline, about, location, languages, experience, skills, certifications, education, resume(s), portfolio, projects, achievements, social links, availability, salary expectation, preferred roles/locations, and a computed completion percentage.
- **Resume**: A generated document tied to a Talent Profile, built from a chosen template and structured sections; a user may hold multiple Resumes but only one is flagged as default; exportable as PDF/DOCX.
- **Skill**: Name, category, level, years of experience, and Verified Status attached to a Talent Profile.
- **Skill Verification Record**: The evidence/method (mentor approval, assessment test, certification, project completion, or manual admin verification) behind a skill's Verified Status.
- **Education Entry / Experience Entry / Project / Certification**: Structured sub-records of a Talent Profile, each with the fields listed in §16–§19.
- **Career Preference**: A candidate's preferred roles, salary, industries, locations, work mode, notice period, and availability.
- **Portfolio Item**: An image, video, PDF, or external link (GitHub, Behance, Dribbble, LinkedIn, website, case study, live demo) attached to a Talent Profile.
- **Company Profile**: A recruiting organization's branding record — logo, cover, about, website, industry, size, headquarters, benefits, culture, media, and employer-branding content (employee stories, office tour, awards, reviews).
- **Job Posting**: Title, category, description, skills, experience, salary, benefits, openings, deadline, job type, industry, category, and lifecycle status (Draft/Pending Approval/Published/Paused/Closed/Archived); may carry Featured status.
- **Screening Question**: A recruiter-defined question (Yes/No, MCQ, Paragraph, Number, File Upload) attached to a Job Posting, optionally feeding a Pre-Screening auto-rejection rule.
- **Application**: A candidate's submission against a Job Posting — selected resume, cover letter, screening-question answers, current status (Submitted/Viewed/Shortlisted/Assessment/Interview/Offer/Hired/Rejected/Withdrawn), and hiring pipeline stage.
- **Saved Job**: A candidate's bookmarked Job Posting, optionally organized into a folder.
- **Job Alert**: A candidate's saved search criteria (skills, salary, location, industry, experience) that triggers notifications for matching new jobs.
- **AI Match Score**: A computed percentage plus explanation, linking a candidate's Talent Profile to a specific Job Posting.
- **Interview**: A scheduled event tied to an Application — round type (HR/Technical/Panel/Final/CEO), delivery mode (Online/Offline/Phone/Video/Panel), and video link (Meet/Zoom/Teams/external) where applicable.
- **Assessment**: A test (Aptitude/Coding/MCQ/Essay/Personality/Domain) assigned to an Application, including, for coding tests, a programming language.
- **Assessment Result**: Score, time taken, ranking, and pass/fail outcome for a completed Assessment.
- **Hiring Pipeline Stage**: The recruiter-facing stage of an Application (Applied/Screened/Interview/Assessment/Offer/Hired).
- **Candidate Note**: An internal, recruiter-only annotation attached to a candidate/Application, never visible to the candidate.
- **Offer Letter**: A generated PDF document tied to an Application, with status (Sent/Accepted/Declined/Expired).
- **Recruiter Role**: Admin, Recruiter, Interviewer, or Hiring Manager — the access role of a user within a Company's recruiting team.
- **Company Subscription**: The company's plan tier (Free/Starter/Professional/Enterprise) governing job post limits and feature access; billing/payment mechanics are owned by Volume 09.
- **Talent Recommendation**: A system-generated suggestion of a candidate to a recruiter/company, generated without an explicit search.
- **Audit Log Entry**: An immutable record of a tracked event (Job Created, Resume Updated, Candidate Applied, Offer Sent, etc.).
- **Report**: A generated view over Hiring, Applicants, Interviews, Diversity, Offer Acceptance, or Recruiter Activity data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A job seeker with no existing resume can produce a downloadable, exported (PDF or DOCX) resume from a template without needing recruiter or admin involvement — the full candidate-side Resume Builder flow is self-service end to end (§10, §77 MVP).
- **SC-002**: A recruiter can take a job posting from creation through Published status and receive at least one candidate application without requiring engineering/manual intervention — the full Job Posting → Apply flow is self-service end to end (§34, §77 MVP).
- **SC-003**: Every application submitted through the platform reflects one of the nine defined statuses (Submitted, Viewed, Shortlisted, Assessment, Interview, Offer, Hired, Rejected, Withdrawn) at all times, with no application left in an undefined state (§28).
- **SC-004**: Every candidate profile with a completed set of core sections (skills, experience, education) receives an AI match score with an accompanying explanation when viewing any job posting, so no match score is ever shown without its supporting rationale (§38–39).
- **SC-005**: Candidates who toggle resume visibility or contact visibility to private have those fields excluded from all subsequent recruiter-facing Talent Database and Candidate Search results (§40–41, §71).
- **SC-006**: 100% of Job Created, Resume Updated, Candidate Applied, and Offer Sent events are captured in the audit log, with no gaps in the required event set (§74).
- **SC-007**: The system architecture supports catalogs at the scale of millions of resumes and millions of job postings while keeping search/indexing responsive, per the platform's stated performance objective (§75) — [NEEDS CLARIFICATION: source gives no quantified latency/throughput target, so this criterion can only be validated qualitatively until a numeric SLA is defined].
- **SC-008**: Every one of the twelve items in the volume's stated Acceptance Criteria (§79 — Resume Builder, Talent Profiles, Recruiter Portal, Job lifecycle, Candidate matching, Hiring pipeline, Interview workflows, Assessments, Offer management, Admin controls, Reports, APIs) is independently demonstrable before this feature is considered accepted.

## Assumptions

- Volume 12 is one of the leaner draft volumes in the source PRD: it is a flat list of section headings and bullet items with no entity-relationship model, no numeric SLAs/thresholds, and no explicit "shall" requirement sentences (unlike Volumes 09, 11, and 13). Every Functional Requirement above was synthesized from a specific bulleted section and cited accordingly; genuine gaps are marked `[NEEDS CLARIFICATION]` rather than filled with invented detail.
- **Company subscription billing** (plan pricing, payment collection, invoicing, proration on upgrade/downgrade) is explicitly out of scope for this spec and is owned by Volume 09 (Membership, Payments & Revenue). This spec only covers the enforcement of plan-tier-based job post limits (§57) as a Jobs-module concern.
- **Mentor-driven skill verification and resume review** (§15, §61) depend on the mentor identity/relationship data model owned by Volume 07 (Mentor Marketplace). This spec assumes that model already exists and is only consumed here.
- **Course recommendations shown before applying** (§62) depend on the course/enrollment data model owned by Volume 04 (Learning Management System). This spec assumes that model already exists and is only consumed here.
- **Community sharing of job postings** (§63) depends on the feed/sharing model owned by Volume 05 (Community, Social, Trust & Safety).
- **Freelancer-to-marketplace-seller conversion** (§64) depends on the seller account/listing data model owned by Volume 11 (Digital Marketplace); this spec assumes Volume 11 owns the canonical seller record post-conversion, per the constitution's guidance to cross-reference rather than duplicate overlapping data models.
- Per platform-wide constitutional principles (Article II, "AI Is Assistive, Never Autonomous"), the AI Match Score (§38–39) and Talent Recommendations (§59) are assumed to be advisory outputs only — final shortlist, reject, and hiring decisions remain human actions by a recruiter/hiring manager, even though the source volume does not restate this constraint explicitly within Volume 12 itself.
- Per platform-wide constitutional principles (Article III, "No Dark Patterns, No Guaranteed-Outcome Claims"), job listings, company pages, and career resources are assumed to be prohibited from promising guaranteed job placement, income, or hiring outcomes, consistent with how this rule is stated explicitly for the Mentor Marketplace (Volume 07) and Marketing (Volume 02) modules, even though Volume 12 itself does not restate it.
- Recruiter Roles (Admin, Recruiter, Interviewer, Hiring Manager — §55) are assumed to require the same layered, explicit RBAC treatment mandated by the constitution (Article VII) for all multi-role modules, even though Volume 12 does not itself specify the permission set per role.
- "Pending Approval" job status (§35) is assumed to require review by a Company Admin or platform Admin before publication, though the source does not name the approver or approval criteria.
- The three example match-score values shown in the source (95%, 82%, 71%, §39) are illustrative UI examples, not defined scoring thresholds or targets, and are treated as such in this spec.
