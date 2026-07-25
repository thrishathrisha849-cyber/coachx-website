# Feature Specification: Product Vision, Business Foundation & Platform Governance

**Feature Branch**: `001-product-vision-governance`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Product Vision, Business Foundation & Platform Governance — Volume 01 of the TBT One Enterprise PRD (`document 1/Document 1.md`). Covers product definition, vision/mission, core product principles, problem statement, target users and personas, product positioning, platform scope and 16-module architecture, user lifecycle, membership tier catalog, business model/revenue streams, business KPIs, MVP success criteria and phasing, MVP out-of-scope boundary, role definitions, access control principles, trust & safety foundation, privacy foundation, content governance, product governance (release process), non-functional foundation, platform environments, and brand direction."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persona-Based Guided Onboarding & Next-Best-Action Journey (Priority: P1)

A new visitor discovers the platform, registers, and is guided — based on their selected goals, experience level, skills, business stage, time availability, and interests — through a personalized roadmap that always tells them the single next meaningful action to take (e.g., "Complete your profile," "Take the Niche Discovery Assessment," "Start Business Foundation Module," "Use AI Offer Builder"), instead of leaving them to browse an unstructured catalog of courses and content.

**Why this priority**: This is the foundational mechanic that differentiates TBT from "just another course site" (source sections 7 and 10.1) and is a prerequisite for every other module (learning, community, AI tools) to be meaningfully sequenced for a new user. Without it, the platform's core mission — moving users from passive knowledge consumption to action — cannot be demonstrated even for a single user.

**Independent Test**: Can be fully tested by creating a new account, completing the onboarding questionnaire (language / goal / experience-level / skill / business-stage / time-availability / interest selection), and verifying the dashboard surfaces one specific recommended next action that changes correctly as profile completion, niche selection, and course completion are simulated.

**Acceptance Scenarios**:

1. **Given** a newly registered user with an incomplete profile, **When** they land on the dashboard, **Then** the system displays "Complete your profile" as the recommended next action.
2. **Given** a user with a complete profile but no niche selected, **When** they view their dashboard, **Then** the system recommends the Niche Discovery Assessment.
3. **Given** a user who selected a niche but has not completed the foundation course, **When** they view recommendations, **Then** the system recommends starting the Business Foundation Module.
4. **Given** a user who completed the foundation course but has not created an offer, **When** they check recommendations, **Then** the system recommends the AI Offer Builder.

---

### User Story 2 - Membership Tier Selection & Feature Gating (Priority: P1)

A visitor or free member can view the six membership tiers (Free, Starter, Growth, Pro, Elite, Organization), understand what each unlocks, select one, and immediately have their access to courses, mentor sessions, AI credits, community areas, and marketplace-selling rights adjusted to match that tier — with tier-restricted features clearly locked (not hidden) for lower tiers.

**Why this priority**: Membership subscription is the platform's primary monetization stream (source section 15, Revenue Stream 1), and access to nearly every other module (LMS, mentors, AI tools, marketplace, CRM) is gated by membership tier (source section 14). Little else in the product can be safely built without this gate existing first.

**Independent Test**: Can be fully tested by creating accounts on each tier and verifying that tier-restricted actions (e.g., booking a paid mentor session as a Free member, or listing a marketplace product without Pro/Elite access) are denied with a clear "membership required" response, while entitled actions succeed.

**Acceptance Scenarios**:

1. **Given** a Free-tier member, **When** they attempt to access a premium course, **Then** the system denies access with a "membership required" response and indicates the tier needed.
2. **Given** a Growth-tier member, **When** they attempt marketplace selling (a Pro+ feature), **Then** the system denies access with a clear upgrade indication.
3. **Given** a Pro-tier member, **When** they view their dashboard, **Then** course-creation tools, funnel tools, CRM basics, and marketplace-seller access are all visible and usable.
4. **Given** an admin who updates tier configuration, **When** the change is published, **Then** new tier boundaries apply to subsequent access checks without a code deployment.

---

### User Story 3 - Role-Based Access Control Across Platform Surfaces (Priority: P1)

Internal staff (Support Agent, Content Manager, Finance Admin, Platform Admin, Super Admin, Organization Admin) and platform participants with elevated roles (Course Instructor, Mentor, Community Moderator) each get access only to the modules and actions their role permits, enforced on the backend regardless of what the frontend displays or hides.

**Why this priority**: This is a cross-cutting security foundation (source sections 20-21) that every other feature — payments, content publishing, moderation, refunds — depends on. A gap here is a platform-wide risk, so it must exist alongside or before Phase 1 release.

**Independent Test**: Can be fully tested by attempting a restricted action (e.g., issuing a refund) via a direct backend request while authenticated with a non-Finance-Admin role, and confirming the request is denied with a "permission denied" response even if a client happened to render the control.

**Acceptance Scenarios**:

1. **Given** a user with the Community Moderator role, **When** they attempt to access payment/refund tools, **Then** the system denies the request with "permission denied."
2. **Given** a Course Instructor, **When** they attempt to edit a course they were not assigned to, **Then** the system denies the request.
3. **Given** a Support Agent, **When** they open the ticket queue, **Then** they can view and manage tickets but cannot reach financial payout settings.
4. **Given** an Organization Admin, **When** they view analytics, **Then** they see only their own organization's members and data, not platform-wide data.

---

### User Story 4 - Cross-Surface Platform Navigation (Public Site, Member App, Mobile, Admin) (Priority: P2)

A user moves between the public marketing site (as a visitor), the authenticated member web application (post-login), and the mobile application, with consistent access to the same core modules (dashboard, learning, community, events, mentors, AI tools, marketplace, wallet, notifications). Internal staff separately access an admin application scoped to their operational modules.

**Why this priority**: This defines the shape of "the product" that every later, more detailed volume builds inside. Getting the surface/module boundaries right early avoids costly rework, but it is one layer removed from the P1 mechanics of onboarding, membership, and RBAC.

**Independent Test**: Can be fully tested by browsing the public site as a guest (confirming only public sections are reachable), logging in and confirming the member app exposes the full authenticated module set, and confirming the same account's course progress is visible and resumable from the mobile app.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they browse the public website, **Then** only Home, About, How It Works, Membership, Programs, Courses, Mentors, Events, Success Stories, Blog, Guides, Podcast, Free Resources, Masterclass Registration, Contact, FAQ, Login, Sign Up, and Legal Pages are reachable.
2. **Given** an authenticated member, **When** they log into the member web app, **Then** Dashboard, Learning, Community, Challenges, Events, Mentors, AI Tools, Marketplace, Business Workspace, Notifications, Profile, Membership, Wallet, Support, and Settings are accessible per their entitlement.
3. **Given** a member who resumed a lesson on mobile, **When** they reopen the same course on web, **Then** their progress position is synchronized.
4. **Given** an internal staff account without an admin role, **When** they attempt to reach the admin application, **Then** access is denied.

---

### User Story 5 - Transparent, Multi-Stream, No-Dark-Pattern Monetization (Priority: P2)

The platform earns revenue through ten distinct streams (membership subscription, course sales, event revenue, mentor commission, marketplace commission, corporate training, certification fees, AI credit packs, sponsored content, affiliate revenue), while every sponsored item and affiliate recommendation is clearly disclosed and no surface uses fake urgency, hidden pricing, or unsupported outcome claims.

**Why this priority**: Monetization behavior is a distinct capability explicitly described in the source (section 15), and transparency/trust is one of the six root problems the platform must solve (section 6.6). It builds on top of the membership and RBAC foundations rather than blocking them.

**Independent Test**: Can be fully tested by publishing a sponsored community campaign and an AI-suggested affiliate product recommendation, and confirming both render with a visible "Sponsored"/"Affiliate" disclosure label before any purchase-path or price is shown.

**Acceptance Scenarios**:

1. **Given** a sponsored event listing, **When** a user views it, **Then** a visible "Sponsored" label is shown before any registration action.
2. **Given** an AI tool recommending a third-party affiliate product, **When** the recommendation is displayed, **Then** a transparent affiliate-disclosure notice accompanies it.
3. **Given** a mentor booking is completed, **When** the transaction settles, **Then** the platform's configured commission is applied and recorded.
4. **Given** a membership price was set at the time of a user's purchase, **When** admin later changes tier pricing, **Then** the already-active subscription is not retroactively altered without notice.

---

### User Story 6 - Measurable Business Milestone Tracking & Lifecycle Progression (Priority: P2)

As a user acts on the platform, the system tracks their progression through eight lifecycle stages (Visitor → Lead → Registered User → Activated Member → Engaged Member → Paying Member → Achiever → Advocate) and verifies real business milestones (first client, first ₹1,000, first ₹10,000, first ₹1 lakh, first course launch, first 100 community members) rather than relying on vanity metrics such as video-watch time.

**Why this priority**: This operationalizes the platform's stated "Measurable Transformation" principle (section 5.6) and the Transformation KPI category (section 16), proving the product's core value beyond content consumption — but it depends on the onboarding, membership, and content modules already existing.

**Independent Test**: Can be fully tested by simulating a user's activity from registration through a verified first-revenue milestone, and confirming the lifecycle-stage field and relevant KPI counters update only at each defined transition point, never from an unverified self-reported claim alone.

**Acceptance Scenarios**:

1. **Given** a user with an 80%-complete profile, a selected goal, a started learning path, a completed first lesson, and one completed community action, **When** the system evaluates lifecycle stage, **Then** the account is marked Activated Member.
2. **Given** a user submits an unverified claim of "first client," **When** the system evaluates the Achiever milestone, **Then** the milestone is not marked verified until a defined verification step occurs.
3. **Given** a user completes their first paid purchase, **When** the transaction is confirmed, **Then** their lifecycle stage transitions to Paying Member.
4. **Given** a user refers another user who converts, **When** the referral is confirmed, **Then** the referring user's Advocate-stage contribution is recorded.

---

### User Story 7 - Trust & Safety Reporting and Moderation Foundation (Priority: P2)

Any user encountering harmful content or behavior can report a post, comment, or profile, or block/mute another user. Reported items enter a moderation queue with spam and suspicious-account detection; moderators can escalate to a warning, temporary suspension, or permanent ban, with an appeal path available to the affected user.

**Why this priority**: This is a baseline safety requirement for any platform allowing user-generated content (section 22) and must exist before community features can be safely opened to real users — but it is secondary to the account/membership/RBAC foundations it depends on.

**Independent Test**: Can be fully tested by having one test user report another user's post, confirming the report appears in a moderation queue, an admin/moderator actions it (warning/suspension/ban) with evidence recorded, and the affected user can submit an appeal.

**Acceptance Scenarios**:

1. **Given** a user views an offensive post, **When** they submit a report, **Then** the post enters the moderation queue with the reporting evidence attached.
2. **Given** a moderator reviews a queued report, **When** they issue a temporary suspension, **Then** the action and its evidence are recorded in moderation history.
3. **Given** a suspended user, **When** they submit an appeal, **Then** the appeal is tracked as a distinct case linked to the original moderation action.
4. **Given** a new user is registering, **When** they reach the signup-completion step, **Then** community rules are displayed before the account is finalized, and again before their first post.

---

### User Story 8 - Governance-Gated, Phased Feature Rollout (Priority: P3)

The platform is built and released in four sequenced phases (Foundation MVP → Growth Platform → Business Operating System → Enterprise & Ecosystem), and every major feature release passes through a fixed governance sequence (requirement approval → UX review → technical review → security review → development → QA → UAT → release approval → monitoring → post-release review) before reaching users.

**Why this priority**: This governs *when* and *how* capabilities become available rather than delivering a specific user-facing capability itself. It matters for planning and risk control but does not block the independent testability of the P1/P2 stories above.

**Independent Test**: Can be fully tested by attempting to enable a Phase 2+ capability (e.g., mentor marketplace) while Phase 1 modules are incomplete, and confirming release is blocked until phase-completion and governance-checklist criteria are satisfied.

**Acceptance Scenarios**:

1. **Given** Phase 1 modules are not fully complete, **When** a team attempts to release a Phase 2 module, **Then** release is blocked pending Phase 1 completion.
2. **Given** a major feature has completed development, **When** it has not yet passed security review, **Then** it cannot proceed to release approval.
3. **Given** a feature reaches release approval, **When** it is released, **Then** a monitoring period and a post-release review are scheduled as part of the same governance record.
4. **Given** the MVP-out-of-scope list includes a capability (e.g., public cryptocurrency), **When** a team proposes building it pre-MVP, **Then** the proposal is flagged against the documented MVP boundary.

---

### Edge Cases

- What happens when a Free-tier member attempts to access a premium course, book a paid mentor session, or list a marketplace product directly via a raw backend request, bypassing the UI? The backend MUST deny the request regardless of frontend state (section 21).
- What happens when a payment succeeds but the corresponding membership/course access flag does not update immediately? This is treated as a launch-blocking defect per the MVP success criteria (section 17), not a state the system may leave stale.
- What happens when a user's profile reaches exactly 80% completion but has not selected a goal, started a learning path, completed a lesson, or completed a community action? The system MUST NOT mark them Activated Member until all Stage 4 criteria are jointly satisfied (section 13).
- What happens when an admin edits and republishes previously published course content? The prior version MUST be preserved in the audit log, not overwritten (section 24).
- What happens when a user reports content that a moderator later finds does not violate community rules? The report resolution and evidence MUST still be retained, and the reported party retains the right to appeal if any action was taken against them (section 22).
- What happens when a user on a low-bandwidth mobile connection loses connectivity mid-lesson? Per the mobile-first principle (section 5.5), downloadable content and resume-playback MUST let the user continue without losing progress.
- What happens when a user requests a capability explicitly excluded from MVP scope (e.g., a cryptocurrency wallet, full payroll)? The system MUST NOT silently fail; the capability is treated as an unsupported/future-roadmap item (section 19).
- What happens when a developer needs realistic data in a non-production environment for debugging? Actual production data MUST NOT be used in development environments (section 28); a non-production-safe alternative is required.
- What happens when a user selects an onboarding language for which a specific piece of content (e.g., a course) has no localized version yet? A defined fallback behavior is required rather than showing missing/broken content.
- What happens when a Corporate Partner's Organization Admin attempts to view members or analytics outside their own organization? Access MUST be scoped strictly to "own organization members and analytics" only (section 20).
- What happens when suspicious-login activity is detected mid-session on an account? The required detection capability (Module 01) must trigger a defined account-protection response consistent with the Trust & Safety warning/escalation framework (section 22).
- What happens when membership tier pricing is changed by an admin after a user is already an active paying subscriber at the previous price? Already-granted entitlements and the price the user agreed to MUST NOT be silently altered retroactively, even though tier pricing itself is admin-configurable (section 14; cross-ref Constitution Article IV — Historical Immutability).

## Requirements *(mandatory)*

### Vision, Mission & Product Definition Requirements

- **FR-001**: System MUST function as a single unified all-in-one platform integrating a Learning Management System, Business Community, Digital Coaching Platform, Creator Economy Platform, Membership Platform, AI Business Assistant, Mentor Marketplace, Event Platform, Gamification System, Digital Product Marketplace, CRM/Lead Management, and Business Progress Tracking under one user account, rather than as a standalone course website. (Sec 2)
- **FR-002**: System MUST support a single unified user account through which a user progresses across: learning a skill, identifying a niche, building a personal brand, creating a course/service/offer, building a community, collecting leads, running marketing campaigns, selling products, tracking revenue/progress, receiving mentor support, using AI tools to automate work, and networking within the platform community. (Sec 2)
- **FR-003**: Platform architecture MUST be designed to support future expansion to Tamil, Tanglish, English, Malayalam, Telugu, Kannada, and Hindi, while the initial released product MUST be a Tamil-first experience. (Sec 3.1)
- **FR-004**: System MUST be designed around the stated platform mission of moving users from passive knowledge consumption to measurable, action-based entrepreneurial outcomes. (Sec 4)

### Core Product Principle Requirements

- **FR-005**: Every learning module MUST require an action task, submission mechanism, deadline, checklist, progress tracking, and outcome verification; a user MUST NOT be able to advance module progress through passive video viewing alone. (Sec 5.1) [cross-ref Constitution Article IX — Action Before Consumption]
- **FR-006**: System MUST provide community-based support (peer support, mentor support, accountability groups, discussion rooms, feedback, collaboration, networking) attached to learning content, not content delivery in isolation. (Sec 5.2)
- **FR-007**: System MUST provide Tamil, Tanglish, and simplified-English explanations wherever technical terminology is displayed to the user. (Sec 5.3)
- **FR-008**: Admin panel MUST allow authorized staff to dynamically create, edit, and publish the following without a code deployment: landing-page content, hero banners, navigation, courses, membership plans, community rules, challenges, events, notifications, FAQs, testimonials, certificates, gamification values, AI prompts, email templates, legal pages, payment settings, and feature access. (Sec 5.4)
- **FR-009**: Frontend applications MUST NOT hardcode any business content designated as admin-manageable under FR-008; such content MUST be sourced dynamically at render time. (Sec 5.4)
- **FR-010**: System MUST support a mobile-first experience: responsive web, an Android app, an iOS-ready architecture, low-bandwidth optimization, downloadable content, resumable playback, and push notifications. (Sec 5.5)
- **FR-011**: System MUST track and surface transformation outcomes beyond course completion, including profile completion, niche selection, offer creation, first content published, first lead generated, first customer acquired, first revenue earned, monthly revenue milestones, community contribution, course completion, and challenge completion. (Sec 5.6) [cross-ref Constitution Article VIII — No Pay-to-Win, No Vanity-Metric Optimization]
- **FR-012**: System MUST provide transparent product information (pricing, curriculum, refund policy), verifiable trainer/mentor information, and visible learner-progress evidence, directly addressing the identified market trust problem (unclear outcomes, fake urgency, hidden pricing, unsupported claims). (Sec 6.6) [cross-ref Constitution Article III — No Dark Patterns, No Guaranteed-Outcome Claims]

### Persona, Target-Segment & Onboarding Requirements

- **FR-013**: System MUST implement the defined product journey stages — Discover, Register, Assess, Learn, Implement, Submit, Receive Feedback, Build Offer, Generate Leads, Sell, Scale, Mentor Others — as a traceable progression per user account. (Sec 7)
- **FR-014**: System MUST provide a dynamic recommendation engine that evaluates a user's current profile/progress state and surfaces one specific next-best-action (e.g., complete profile, take niche assessment, start foundation course, use AI offer builder, create a landing page, start a content challenge) rather than a static onboarding checklist. (Sec 7)
- **FR-015**: System MUST support distinct onboarding needs for at least 8 defined target-user segments — Aspiring Entrepreneur, Freelancer, Coach/Trainer, Content Creator, Student, Small-Business Owner, Mentor, and Corporate Partner — each with its own documented need set (e.g., idea validation for Aspiring Entrepreneurs, proposal generator for Freelancers, curriculum builder for Coaches, bulk accounts for Corporate Partners). (Sec 8)
- **FR-016**: Onboarding UX and content MUST be tailored to reference personas including a Beginner Learner (simple onboarding, Tamil explanations, guided roadmap, daily tasks, low-cost membership, mentor Q&A), a Working Professional (short lessons, resumable learning, weekly plan, calendar sync, progress reminders, accountability group), and an Existing Coach (course builder, live-class tools, payment integration, funnel templates, analytics, mentor marketplace access). (Sec 9)
- **FR-017**: Onboarding module MUST capture welcome-flow completion, language selection, goal selection, experience-level selection, skill selection, business-stage selection, time availability, and interest selection, and MUST use these inputs to generate a personalized roadmap plus suggested community groups, suggested courses, and a suggested mentor. (Module 02, Sec 12)

### Product Positioning Requirements

- **FR-018**: Platform and its public-facing messaging MUST NOT position the product as a video-course library only, a social-media clone, a generic AI chatbot, a job portal only, a coaching-sales-funnel only, a WhatsApp replacement, a Udemy clone, or a Facebook clone. (Sec 10.1) [cross-ref Constitution Article III]
- **FR-019**: Public-facing positioning MUST reflect the stated differentiators: Tamil-first experience, a learn-to-earn structured journey, AI-assisted implementation, community accountability, milestone-based gamification, business-outcome tracking, integrated course/community/CRM/marketplace, guided onboarding, admin-controlled dynamic platform, and web/mobile continuity. (Sec 10.2)

### Platform Surface & Module Requirements

- **FR-020**: Public website MUST expose, to unauthenticated visitors, at minimum: Home, About, How It Works, Membership, Programs, Courses, Mentors, Events, Success Stories, Blog, Guides, Podcast, Free Resources, Masterclass Registration, Contact, FAQ, Login, Sign Up, and Legal Pages. (Sec 11.1)
- **FR-021**: Authenticated member web application MUST expose: Dashboard, Learning, Community, Challenges, Events, Mentors, AI Tools, Marketplace, Business Workspace, Notifications, Profile, Membership, Wallet, Support, and Settings. (Sec 11.2)
- **FR-022**: Mobile application MUST provide the core capabilities of the member web application. (Sec 11.3)
- **FR-023**: Admin application MUST expose, to internal roles only, business dashboard, user management, membership management, course CMS, community moderation, event management, mentor management, AI configuration, payment management, marketing CMS, notification centre, support management, analytics, reports, settings, security, and audit logs. (Sec 11.4)
- **FR-024**: System MUST implement Module 01 (Authentication and Identity): email signup, mobile OTP signup, Google login, Apple login, password login, forgot-password recovery, email verification, mobile verification, two-factor authentication, device session management, suspicious-login detection, account deletion, and account recovery. (Sec 12)
- **FR-025**: System MUST implement Module 03 (Member Dashboard) surfacing daily action, continue-learning, upcoming events, community highlights, current challenge, progress score, business milestone, AI recommendations, membership status, notifications, and quick actions. (Sec 12)
- **FR-026**: System MUST implement Module 04 (Learning Management System): course categories, learning paths, cohorts, modules, lessons (video/audio/PDF/text), quizzes, assignments, submissions, feedback, certificates, progress tracking, notes, bookmarks, and discussion. (Sec 12)
- **FR-027**: System MUST implement Module 05 (Community): feed, groups, channels, posts (images/video/polls/documents/questions), achievements, reactions, comments, replies, mentions, hashtags, follow, block, report, share, bookmark, and moderation. (Sec 12)
- **FR-028**: System MUST implement Module 06 (Challenges and Accountability): daily/weekly challenges, monthly bootcamps, task checklists, submission proof, mentor approval, peer feedback, leaderboards, completion badges, streaks, and team challenges. (Sec 12)
- **FR-029**: System MUST implement Module 07 (Events): webinars, workshops, live classes, meetups, conferences, bootcamps, masterminds, offline events, registration, ticketing, QR check-in, attendance tracking, replay access, and certificates. (Sec 12)
- **FR-030**: System MUST implement Module 08 (AI Business Workspace): AI chat, voice input, image input, PDF input, business-idea generator, niche finder, offer builder, content generator, script writer, email writer, landing-page generator, marketing-plan generator, course-outline builder, sales assistant, prompt library, saved outputs, and AI history. (Sec 12) [cross-ref Constitution Article II; detailed AI guardrails owned by 008-ai-assistant-platform]
- **FR-031**: System MUST implement Module 09 (Mentor Marketplace): mentor profiles, expertise tagging, language tagging, availability, free sessions, paid sessions, booking, reschedule, cancellation, meeting-link delivery, reviews, and mentor payout. (Sec 12)
- **FR-032**: System MUST implement Module 10 (Digital Marketplace): courses, templates, ebooks, services, consultations, community memberships, event tickets, bundles, coupons, cart, checkout, orders, invoices, and refunds. (Sec 12)
- **FR-033**: System MUST implement Module 11 (Membership and Access): the free/starter/growth/pro/elite/organization plan catalog, subscription billing, lifetime access, trial, upgrade, downgrade, renewal, grace period, and feature gating. (Sec 12)
- **FR-034**: System MUST implement Module 12 (Wallet and Rewards): points, coins, earnings, referral commission, mentor payout, transaction history, reward redemption, coupons, and gift membership. (Sec 12) [cross-ref Constitution Article V — Ledger-Based Internal Economies; detailed ledger mechanics owned by 006-gamification-rewards / 009-membership-payments-revenue]
- **FR-035**: System MUST implement Module 13 (CRM and Business Workspace): leads, contacts, pipeline, tasks, notes, follow-ups, customer status, deal value, activity timeline, reminders, export, and import. (Sec 12)
- **FR-036**: System MUST implement Module 14 (Search and Discovery): global search, course search, member search, community search, mentor search, event search, marketplace search, filters, recent searches, suggested results, and trending searches. (Sec 12)
- **FR-037**: System MUST implement Module 15 (Notification System): in-app, push, email, WhatsApp-compatible, and SMS-ready notification channels, plus announcements, reminders, transactional alerts, marketing communication, and per-user notification preferences. (Sec 12) [cross-ref Constitution Article VI — Consent Is First-Class, Per-Channel, and Versioned]
- **FR-038**: System MUST implement Module 16 (Analytics) tracking user growth, activation, engagement, course completion, community activity, retention, revenue, subscription, churn, conversion, mentor performance, event attendance, AI usage, and business outcomes. (Sec 12)

### User Lifecycle Requirements

- **FR-039**: System MUST track visitor-stage events on the public website: page viewed, CTA clicked, video started, video completed, pricing viewed, testimonial viewed, form started, form submitted, and checkout started. (Sec 13, Stage 1)
- **FR-040**: System MUST convert a visitor to a Lead record upon free-guide download, webinar registration, newsletter signup, or assessment completion, creating a contact profile with lead source, campaign, consent status, interest, and lead score. (Sec 13, Stage 2) [cross-ref Constitution Article VI]
- **FR-041**: System MUST require email/mobile verification, terms acceptance, privacy acceptance, language selection, and a basic profile before a visitor becomes a Registered User. (Sec 13, Stage 3)
- **FR-042**: System MUST define Activated Member status as the joint satisfaction of: profile ≥80% complete, goal selected, first learning path started, first lesson completed, and first community action completed. (Sec 13, Stage 4)
- **FR-043**: System MUST track Engaged Member behavior as weekly-recurring lesson completion, post interaction, event attendance, and challenge submission. (Sec 13, Stage 5)
- **FR-044**: System MUST transition a user to Paying Member status upon subscription purchase or product purchase. (Sec 13, Stage 6)
- **FR-045**: System MUST track and verify Achiever-stage milestones, including first client, first ₹1,000, first ₹10,000, first ₹1 lakh, first course launch, and first 100 community members. (Sec 13, Stage 7) [cross-ref Constitution Article VIII — milestones must be verified, not self-reported]
- **FR-046**: System MUST support Advocate-stage actions — referral, testimonial submission, case-study submission, mentor application, and community leadership — as trackable contributions to platform growth. (Sec 13, Stage 8)

### Membership & Monetization Requirements

- **FR-047**: System MUST allow Platform Admin to configure final membership pricing dynamically rather than hardcoding it. (Sec 14)
- **FR-048**: System MUST provide a Free membership tier granting limited public courses, selected community groups, free events, basic AI usage, profile, and limited downloads, while restricting premium courses, mentor sessions, advanced AI tools, certificates, and marketplace selling. (Sec 14.1)
- **FR-049**: System MUST provide a Starter membership tier (targeted at beginners and students) granting foundation courses, community access, monthly webinar, basic challenges, limited AI credits, and starter certificates. (Sec 14.2)
- **FR-050**: System MUST provide a Growth membership tier (targeted at freelancers, creators, and new business owners) granting full learning paths, weekly live sessions, business templates, advanced challenges, more AI credits, mentor group sessions, and CRM basics. (Sec 14.3)
- **FR-051**: System MUST provide a Pro membership tier (targeted at coaches and established entrepreneurs) granting advanced curriculum, course-creation tools, funnel tools, CRM, mentor-booking benefits, business analytics, priority support, and marketplace seller access. (Sec 14.4)
- **FR-052**: System MUST provide an Elite membership tier (targeted at high-growth entrepreneurs) granting a private mastermind, advanced mentorship, business audits, premium events, team accounts, priority AI limits, a private community, and a dedicated success manager. (Sec 14.5)
- **FR-053**: System MUST provide an Organization membership tier granting bulk users, private groups, an organization dashboard, custom learning paths, team analytics, bulk certificates, invoice-based payment, and organization admin controls. (Sec 14.6)
- **FR-054**: System MUST support membership subscription revenue across monthly, quarterly, annual, and lifetime-campaign billing options. (Sec 15, Revenue Stream 1)
- **FR-055**: System MUST support course-sale revenue across individual courses, course bundles, cohort courses, and certification. (Sec 15, Revenue Stream 2)
- **FR-056**: System MUST support event-ticket revenue across webinars, workshops, conferences, retreats, and masterminds. (Sec 15, Revenue Stream 3)
- **FR-057**: System MUST collect a configurable commission from mentor-session bookings. (Sec 15, Revenue Stream 4) [NEEDS CLARIFICATION: default/configurable commission percentage not specified in this volume]
- **FR-058**: System MUST collect a percentage- or fixed-amount commission from digital-product and service marketplace sales. (Sec 15, Revenue Stream 5) [NEEDS CLARIFICATION: whether percentage or fixed, and the specific rate, is not specified in this volume]
- **FR-059**: System MUST support custom corporate-training plans for organizations. (Sec 15, Revenue Stream 6)
- **FR-060**: System MUST support assessment and certification fee charges. (Sec 15, Revenue Stream 7)
- **FR-061**: System MUST support sale of additional AI-credit packs once a member's membership-tier AI usage limit is exceeded. (Sec 15, Revenue Stream 8)
- **FR-062**: System MUST clearly label sponsored events, resources, partner offers, and community campaigns as sponsored. (Sec 15, Revenue Stream 9) [cross-ref Constitution Article III]
- **FR-063**: System MUST display a transparent, mandatory disclosure whenever a third-party affiliate product is recommended to a user. (Sec 15, Revenue Stream 10) [cross-ref Constitution Article III]

### Business KPI & Analytics Requirements

- **FR-064**: System MUST instrument and report acquisition metrics: monthly unique visitors, lead conversion rate, webinar registration rate, signup conversion rate, cost per lead, and cost per acquisition. (Sec 16)
- **FR-065**: System MUST instrument and report activation and engagement metrics: profile completion rate, first-lesson completion, first-post completion, first-challenge completion, seven-day activation rate, daily/weekly/monthly active users, DAU/MAU ratio, average session duration, lessons completed, community interactions, and event attendance. (Sec 16)
- **FR-066**: System MUST instrument and report learning metrics: course start rate, course completion rate, quiz pass rate, assignment submission rate, and certificate completion rate. (Sec 16)
- **FR-067**: System MUST instrument and report revenue and retention metrics: monthly recurring revenue, annual recurring revenue, average revenue per user, customer lifetime value, refund rate, renewal rate, upgrade rate, 7/30/90-day retention, membership churn, course drop-off point, and community retention. (Sec 16)
- **FR-068**: System MUST instrument and report transformation metrics: users selecting a niche, users creating an offer, users publishing first content, users generating a first lead, users acquiring a first client, and verified revenue milestones. (Sec 16) [cross-ref Constitution Article VIII]

### Launch Readiness & Platform Behavior Requirements

- **FR-069**: Signup flow MUST complete reliably without unhandled or blocking technical errors on supported devices and browsers. (Sec 17)
- **FR-070**: Payment processing success rate MUST remain above 95%. (Sec 17)
- **FR-071**: Core member dashboard MUST load within 3 seconds under normal conditions. (Sec 17)
- **FR-072**: Users MUST be able to start, resume, and complete a course without data loss across sessions. (Sec 17)
- **FR-073**: Community create, comment, react, and report flows MUST function correctly end-to-end. (Sec 17)
- **FR-074**: Notification deep links MUST open the correct destination inside the application. (Sec 17)
- **FR-075**: Payment-based course and membership access MUST update immediately following a confirmed successful payment, without manual admin intervention. (Sec 17) [cross-ref Constitution Article I — Server-Authoritative State] [NEEDS CLARIFICATION: maximum acceptable update latency is not numerically specified in this volume]
- **FR-076**: Learning progress MUST synchronize correctly between mobile and web clients for the same account. (Sec 17)
- **FR-077**: Every administrative configuration change MUST be recorded in an audit trail. (Sec 17) [cross-ref Constitution Security & Compliance Baseline]

### Governance & Roadmap Phasing Requirements

- **FR-078**: System MUST release Phase 1 (Foundation MVP) capabilities first: public website, authentication, user onboarding, dashboard, course LMS, basic community, membership, payment, events, notifications, profile, admin CMS, basic analytics, and support. (Sec 18)
- **FR-079**: System MUST gate Phase 2 (Growth Platform) capabilities — challenges, gamification, mentor marketplace, advanced community, certificates, referral system, wallet, digital marketplace, mobile apps, global search — behind completion of Phase 1. (Sec 18)
- **FR-080**: System MUST gate Phase 3 (Business Operating System) capabilities — CRM, funnel builder, landing-page builder, email automation, content planner, business analytics, team workspace, AI business tools — behind completion of Phase 2. (Sec 18)
- **FR-081**: System MUST gate Phase 4 (Enterprise and Ecosystem) capabilities — organization accounts, white-label communities, advanced API, partner marketplace, multilingual support, regional expansion, advanced recommendation engine — behind completion of Phase 3. (Sec 18)
- **FR-082**: System MUST exclude the following from MVP release scope: full website builder, native video-conferencing infrastructure, public cryptocurrency, complex accounting software, full payroll system, physical product logistics, banking services, instant global multilingual AI translation, unlimited file storage, and custom white-label mobile apps. (Sec 19)
- **FR-083**: Major feature releases MUST pass through the defined governance sequence, in order: product requirement approval, UX design review, technical design review, security review, development, QA, UAT, release approval, monitoring, and post-release review. (Sec 25)

### Role & Access Control Requirements

- **FR-084**: System MUST define and enforce the following consumer-facing roles: Guest (public pages only), Registered Free User (limited platform access), and Paid Member (access determined by membership entitlement). (Sec 20)
- **FR-085**: System MUST define and enforce the following operational roles: Course Instructor (manage assigned courses with limited permissions), Mentor (manage sessions and students), Community Moderator (manage reported content and community activity), Support Agent (manage tickets and user support), and Content Manager (manage courses, CMS, events, and resources). (Sec 20)
- **FR-086**: System MUST define and enforce the following administrative roles: Finance Admin (manage payments, refunds, payouts, invoices), Platform Admin (manage most operational modules), Super Admin (full platform access), and Organization Admin (own-organization members and analytics only). (Sec 20) [cross-ref Constitution Article VII — Layered, Explicit RBAC With Approval Chains]
- **FR-087**: Every protected resource MUST enforce backend authorization; hiding a UI control on the frontend MUST NOT be treated as a security control. (Sec 21) [cross-ref Constitution Article I]
- **FR-088**: Backend authorization checks MUST verify, at minimum, user authentication, user status, user role, membership entitlement, product ownership, organization membership, resource ownership, content-visibility rules, expiry date, geographic restriction, and admin permission before granting access. (Sec 21) [NEEDS CLARIFICATION: specific geographic-restriction rules/regions are not defined in this volume]
- **FR-089**: Denied-access responses MUST clearly communicate the specific reason: login required, membership required, purchase required, access expired, permission denied, account suspended, or content unavailable. (Sec 21)

### Trust, Safety & Privacy Requirements

- **FR-090**: System MUST provide report-post, report-comment, report-profile, block-user, and mute-user capabilities to every user on user-generated content surfaces. (Sec 22)
- **FR-091**: System MUST maintain a content moderation queue with spam detection, suspicious-account detection, and profanity filtering, escalating flagged content/accounts to admin review. (Sec 22) [NEEDS CLARIFICATION: specific detection thresholds/rules are not defined in this volume]
- **FR-092**: System MUST retain moderation evidence and moderation history, and MUST provide an appeal process for account warnings, temporary suspensions, and permanent bans. (Sec 22)
- **FR-093**: System MUST display community rules to a user before signup completion and again before their first post. (Sec 22)
- **FR-094**: System MUST collect only the minimum data required for stated platform functions. (Sec 23) [NEEDS CLARIFICATION: a specific data-minimization policy and retention schedule is not enumerated in this volume]
- **FR-095**: System MUST provide users with data export, account deletion, marketing-consent control, notification preferences, public-profile visibility control, activity-visibility control, and blocked-user management. (Sec 23) [cross-ref Constitution Article VI]
- **FR-096**: System MUST NOT expose sensitive user data in plain text within application logs. (Sec 23)

### Content Governance Requirements

- **FR-097**: Every content item MUST progress through a defined lifecycle: Draft, Review, Scheduled, Published, Unpublished, Archived. (Sec 24)
- **FR-098**: Every content record MUST store creator, reviewer, publish date, last-modified date, version, visibility, membership access level, language, SEO metadata, thumbnail, and status. (Sec 24)
- **FR-099**: When published course content is changed, the system MUST preserve the previous version in an audit log rather than overwriting it destructively. (Sec 24) [cross-ref Constitution Article IV — Historical Immutability]

### Non-Functional & Engineering Governance Requirements

- **FR-100**: Public landing pages MUST load quickly, serve images in an optimized format, and support adaptive video streaming; long lists MUST use pagination or cursor-based loading; large dashboards MUST use lazy loading. (Sec 26, Performance)
- **FR-101**: Core platform services MUST target high availability in production and MUST be architected to scale to thousands of simultaneous users, a large video library, community feed traffic, notification spikes, event-registration spikes, and an AI request queue. (Sec 26, Availability/Scalability) [NEEDS CLARIFICATION: specific uptime SLA/target percentage is not stated in this volume]
- **FR-102**: System MUST support keyboard navigation, screen-reader labels, sufficient color contrast, text resizing, caption support, visible focus indicators, and accessible form design. (Sec 26, Accessibility)
- **FR-103**: System MUST support the latest stable versions of Chrome, Edge, Firefox, and Safari, and MUST be responsive across mobile, tablet, laptop, desktop, and large-desktop viewports. (Sec 26, Browser/Responsive Support)
- **FR-104**: Platform MUST maintain distinct local development, shared development, QA, UAT, staging, and production environments. (Sec 28)
- **FR-105**: Production data MUST NOT be used in development environments, and secrets MUST NOT be committed to source code. (Sec 28)

### Brand & Design Requirements

- **FR-106**: UI MUST reflect the brand values of trust, progress, community, ambition, simplicity, Tamil identity, modern technology, and business credibility. (Sec 29)
- **FR-107**: UI MUST be premium in appearance while ensuring unnecessary animation and excessive glass/blur effects do not degrade usability; overall design MUST be clean, modern, professional, high-contrast, mobile-friendly, content-focused, accessible, and fast. (Sec 29)

### Key Entities

- **User Persona**: A representative user profile (e.g., Beginner Learner "Priya," Working Professional "Karthik," Existing Coach "Revathi") capturing name, age range, device, language, technical level, goal, problem, expected outcome, and a distinct product-requirement set; used to tailor onboarding and recommendations.
- **Target User Segment**: One of 8 broad audience categories (Aspiring Entrepreneur, Freelancer, Coach/Trainer, Content Creator, Student, Small-Business Owner, Mentor, Corporate Partner), each with its own documented needs.
- **User Account**: The single unified identity a person holds on the platform; carries role(s), membership tier, lifecycle stage, and links to all activity across modules.
- **Role**: A named permission category (Guest, Registered Free User, Paid Member, Course Instructor, Mentor, Community Moderator, Support Agent, Content Manager, Finance Admin, Platform Admin, Super Admin, Organization Admin) governing which actions/resources a user account may access.
- **Membership Tier**: A named subscription level (Free, Starter, Growth, Pro, Elite, Organization) defining which modules, features, and usage limits an account is entitled to; pricing and configuration are admin-managed dynamically.
- **Platform Module**: One of 16 functional capability groupings (Authentication & Identity, Onboarding, Dashboard, LMS, Community, Challenges & Accountability, Events, AI Business Workspace, Mentor Marketplace, Digital Marketplace, Membership & Access, Wallet & Rewards, CRM & Business Workspace, Search & Discovery, Notification System, Analytics) composing the product.
- **Platform Surface/Application**: One of four access surfaces (Public Website, Member Web Application, Mobile Application, Admin Application), each exposing a defined set of sections/modules to a defined audience.
- **Revenue Stream**: One of 10 named monetization mechanisms (Membership Subscription, Course Sales, Event Revenue, Mentor Commission, Marketplace Commission, Corporate Training, Certification Fees, AI Credits, Sponsored Content, Affiliate Revenue).
- **User Lifecycle Stage**: One of 8 progressive states (Visitor, Lead, Registered User, Activated Member, Engaged Member, Paying Member, Achiever, Advocate) a user account moves through, each with defined entry criteria and tracked events.
- **Business KPI**: A named metric within one of 7 categories (Acquisition, Activation, Engagement, Learning, Revenue, Retention, Transformation) used to measure platform and user success.
- **Product Phase**: One of 4 sequenced roadmap phases (Foundation MVP, Growth Platform, Business Operating System, Enterprise & Ecosystem) gating which modules are enabled at a given point in the platform's rollout.
- **Content Item**: Any admin-manageable published artifact (course, page, banner, FAQ, testimonial, etc.) carrying a lifecycle state (Draft, Review, Scheduled, Published, Unpublished, Archived), version history, and governance metadata (creator, reviewer, dates, visibility, language).
- **Trust & Safety Case**: A report or moderation record (reported post/comment/profile, block, mute) tracked through a moderation queue, escalation, evidence storage, resolution, and an appeal process.
- **Access Control Decision**: The backend-evaluated authorization outcome for a request, based on authentication, role, membership entitlement, ownership, geography, and expiry, resulting in either allow or one of the defined denial reasons.
- **Platform Environment**: One of the mandatory deployment environments (Local Development, Shared Development, QA, UAT, Staging, Production), each with rules governing data and secret handling.
- **Document Volume (Roadmap Reference)**: One of the planned PRD volumes referenced by this document's own series roadmap, used to cross-reference where later volumes own detailed mechanics for a module first introduced here.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Payment processing success rate remains above 95%. (Sec 17)
- **SC-002**: The core member dashboard loads within 3 seconds under normal network conditions. (Sec 17)
- **SC-003**: 100% of the admin-designated dynamic content types (landing pages, banners, navigation, courses, membership plans, community rules, challenges, events, notifications, FAQs, testimonials, certificates, gamification values, AI prompts, email templates, legal pages, payment settings, feature access) can be created, edited, and published by an admin without a code deployment. (Sec 5.4)
- **SC-004**: Users can start, resume, and complete a course, community create/comment/react/report flows function end-to-end, and learning progress stays synchronized between mobile and web. (Sec 17)
- **SC-005**: 100% of notification deep links open the correct in-app destination. (Sec 17)
- **SC-006**: Membership- or purchase-based access to gated content/modules updates immediately after a payment is confirmed successful, with no manual admin step required. (Sec 17; cross-ref Constitution Article I)
- **SC-007**: 100% of administrative configuration changes are captured in a queryable, immutable audit trail. (Sec 17)
- **SC-008**: A measurable share of activated users progress to at least one verified Achiever milestone (first client, first ₹1,000, first ₹10,000, first ₹1 lakh, first course launch, or first 100 community members), tracked as a transformation outcome rather than course-completion alone. (Sec 13, Sec 16; cross-ref Constitution Article VIII)
- **SC-009**: Seven-day activation rate — defined as profile ≥80% complete, goal selected, first learning path started, first lesson completed, and first community action completed — is measurable and reportable per user cohort. (Sec 13, Sec 16)
- **SC-010**: Role-based access control denies unauthorized requests with one of the defined, specific reasons (login required / membership required / purchase required / access expired / permission denied / account suspended / content unavailable) in 100% of tested denial scenarios, with backend enforcement independent of what the frontend renders. (Sec 21)

## Assumptions

- Specific membership tier price points, billing amounts, AI-credit quantities per tier, mentor-booking commission percentage, and marketplace commission rate/type (percentage vs. fixed) are not stated in this volume; the source states pricing/config is "dynamic" via admin, so this feature defines the tier/stream **catalog and access boundaries** only. Actual billing, invoicing, and payment processing mechanics are owned by the membership/payments feature (`009-membership-payments-revenue`).
- Course, lesson, quiz, and assignment completion mechanics (referenced only at a module-scope level here) are owned by the LMS feature (`004-learning-management-system`).
- Detailed community moderation workflows, reporting UI, and safety mechanics beyond the foundational principles in section 22 are owned by the community feature (`005-community-social-trust-safety`).
- Detailed gamification mechanics (points formulas, badge rules, leaderboard mechanics, ledger structure for Wallet and Rewards) are owned by the gamification feature (`006-gamification-rewards`); this feature only references Module 12 (Wallet and Rewards) and Module 06 (Challenges and Accountability) at a scope level. Per Constitution Article V, any such balance must be ledger-based, not a single mutable field.
- Mentor marketplace booking, scheduling, review, and payout mechanics are owned by the mentor marketplace feature (`007-mentor-marketplace`).
- AI Business Workspace tool behavior, prompt guardrails, anti-hallucination handling, and provider-abstraction implementation are owned by the AI assistant feature (`008-ai-assistant-platform`); Constitution Article II (AI Is Assistive, Never Autonomous) governs all AI-generated output referenced by Module 08.
- CRM pipeline, lead-scoring, and business-workspace mechanics beyond the module-scope description in section 12/13 are owned by the CRM feature (`013-crm-sales-support`).
- The specific technology stack recommendations in source section 27 (Next.js, TypeScript, Flutter, NestJS, PostgreSQL, Redis-compatible cache, etc.) are explicitly described in the source as a "Recommended direction" pending lock-in in a later technical architecture volume, and are therefore treated as non-normative implementation guidance for this spec — deferred to `plan.md` rather than expressed as functional requirements here.
- **Roadmap-numbering discrepancy**: Section 30 of this volume ("Document Series Roadmap") lists an early 20-volume plan (e.g., its own Volume 09 = Marketplace/Payments/Membership/Wallet/Referral/Billing; Volume 10 = CRM; Volume 13 = UI/UX Design System; Volume 14 = Database Architecture) that does not match the platform's actual later document structure recorded in this repository's `CLAUDE.md` and `specs/FEATURE-MANIFEST.md` (a structure where Volume 09 = Membership/Payments/Revenue, Volume 13 = CRM, and Volume 14 is instead a large, standalone Enterprise Marketing Platform spanning most of the source PRD). This spec treats `specs/FEATURE-MANIFEST.md` as authoritative for cross-references and flags section 30's roadmap as superseded/aspirational early-draft content rather than silently reconciling it.
- MVP explicitly excludes (Sec 19): full website builder, native video-conferencing infrastructure, public cryptocurrency, complex accounting software, full payroll system, physical product logistics, banking services, instant global multilingual AI translation, unlimited file storage, and custom white-label mobile apps. These remain candidate future-roadmap items, not part of this feature's near-term implementation scope.
- This spec assumes a single-organization-per-account deployment model at MVP; multi-tenant "white-label communities" and "advanced API" are listed only under Phase 4 (Enterprise and Ecosystem, Sec 18) and are out of scope until that phase.
- Users are assumed to have basic smartphone/mobile literacy given the mobile-first design assumption (Sec 5.5); low-bandwidth network conditions are treated as a standing design constraint rather than an exceptional edge case.
- Precise numeric thresholds left unspecified in this volume (uptime SLA %, payment-access-update latency ceiling, geographic-restriction rules, data-retention schedule, moderation detection thresholds) are called out inline via `[NEEDS CLARIFICATION: ...]` markers in the Functional Requirements section rather than assumed.
