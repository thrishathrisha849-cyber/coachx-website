# Feature Specification: Mentor Marketplace: Discovery, Booking, Sessions & Payouts

**Feature Branch**: `007-mentor-marketplace`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 07 — Mentors, Experts, Instructors, Discovery, Booking, Sessions, Reviews, Payouts and Quality Management. Source: `document 1/Document 1 (6).md`."

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are prioritized as independently testable, independently deployable slices.
  Source references point to section numbers in document 1/Document 1 (6).md.
-->

### User Story 1 - Mentor Applies and Completes the Onboarding Pipeline (Priority: P1)

A professional who wants to mentor on Tamil Business Tribe registers interest, fills out the mentor application (legal name, expertise, experience, portfolio, identity document, proposed pricing), goes through identity and professional verification, completes mandatory orientation, and is reviewed by an admin before their profile is allowed to publish. Progress must be saved at every stage so the applicant can resume later, and the applicant can track their status at any point.

**Why this priority**: Without a working, trustworthy mentor pipeline there is no supply side to the marketplace — no mentors means no bookings, no sessions, no revenue. Verified expertise is also the platform's core trust promise (Product Principle 3.2), so this is the true foundation of the feature.

**Independent Test**: Can be fully tested by submitting a mentor application through all 21 onboarding stages (Sections 7-13) with a test identity document and portfolio, and confirming the application reaches "Approved" status and the profile becomes publishable — without any booking or payment functionality existing yet.

**Acceptance Scenarios**:

1. **Given** a visitor with no mentor role, **When** they submit a complete mentor application including identity document and expertise categories, **Then** the application status moves to "Submitted" and an applicant status tracker becomes accessible showing "Identity verification pending."
2. **Given** an application under document review, **When** the admin requests changes, **Then** the application status becomes "Changes requested" and the applicant is notified with the specific gap to address, and can resubmit without losing prior answers.
3. **Given** an approved application that has not yet completed mandatory orientation, **When** the mentor attempts to publish their profile, **Then** the system blocks publishing until the orientation completion quiz/acknowledgment is recorded.
4. **Given** an applicant closes the application mid-way through Section 8 (expertise selection), **When** they return later, **Then** all previously entered fields are restored exactly as left (Section 7: "Onboarding progress save pannappadanum").

---

### User Story 2 - Regulated-Expert-Category Mentor Passes Extra Credential Checks (Priority: P1)

A mentor applying under a regulated category (legal, tax, investment, medical/mental-health, accounting certification, immigration advice) must provide category-specific credentials, is restricted from offering services until those credentials are verified, and their profile carries jurisdiction disclaimers so members understand the difference between educational guidance and licensed professional advice.

**Why this priority**: This is a direct legal-risk and Constitution Article III control (no guaranteed-outcome / professional-boundary claims) — getting it wrong exposes the platform and members to real harm (unlicensed legal/medical/investment advice). It must exist before any regulated-category mentor can go live, so it gates a meaningful slice of mentor supply.

**Independent Test**: Can be tested independently by submitting a "Legal advice" category application without a credential, confirming the system blocks the applicant from listing services, then submitting a valid credential and confirming the restriction lifts and a jurisdiction disclaimer appears on the resulting profile.

**Acceptance Scenarios**:

1. **Given** an applicant selects "Investment advice" as an expertise category, **When** they attempt to submit without an applicable credential, **Then** the system requests the specific credential type and does not allow the application to proceed to admin review as complete.
2. **Given** a regulated-category mentor's credential has an expiry date, **When** the expiry date passes without re-verification, **Then** the system automatically triggers re-verification and restricts the mentor from accepting new bookings in that category until resolved.
3. **Given** a verified regulated-category mentor's profile, **When** a member views it, **Then** a jurisdiction disclaimer and an educational-guidance-vs-professional-advice notice are both visibly displayed.
4. **Given** a mentor uses a misleading regulated title (e.g., implying a license they do not hold), **When** admin review or automated checks detect this, **Then** the misleading title is prevented from publishing.

---

### User Story 3 - Member Discovers and Books a Mentor Session with Slot-Hold Protection (Priority: P1)

A member searches or browses the mentor discovery page, filters by expertise/language/price/availability, opens a mentor profile, selects a service and an available slot, answers intake questions, sees a full price breakdown, and completes payment — with the selected slot temporarily locked so no one else can double-book it during checkout.

**Why this priority**: This is the core transaction of the entire marketplace — the moment that converts discovery into revenue and mentor-member connection. Nothing else in the module matters if a member cannot reliably find and book a mentor without conflict.

**Independent Test**: Can be fully tested by searching for a mentor by expertise filter, selecting a paid one-to-one service, holding a slot, completing checkout, and confirming a unique booking reference is generated and the slot is no longer offered to a second concurrent user.

**Acceptance Scenarios**:

1. **Given** a member has selected a specific date/time slot and started checkout, **When** a second member simultaneously tries to select the same slot, **Then** the second member sees the slot as unavailable because of the active slot hold.
2. **Given** a member starts checkout but does not complete payment within the configured hold-expiry window, **When** the hold expires, **Then** the slot automatically releases and becomes bookable by others again.
3. **Given** a member reaches the price summary step, **When** they view it before confirming, **Then** base price, discounts, coupon, taxes, platform fee (if charged separately), credits, reward points (if supported), and final total are all shown with no hidden charges.
4. **Given** a completed booking, **When** the confirmation screen renders, **Then** it displays mentor, service, date, time, timezone, duration, meeting method, amount paid, preparation required, and cancellation policy, and a unique user-facing booking reference (e.g., `TBT-MNT-2026-000123`) is generated without exposing the internal database ID.

---

### User Story 4 - Session Workspace with Role-Separated Notes and Action Plan (Priority: P2)

During and after a booked session, the mentor and member use a shared session workspace containing the booking summary, member's intake responses, uploaded files, a video-call entry point, a timer, and a place for the mentor to record notes and build an action plan — where private mentor notes and admin safety notes remain invisible to the member, and only explicitly shared notes and the action plan are member-visible.

**Why this priority**: This is what actually delivers the mentoring value promised by Product Principle 3.1 (outcome-based mentoring) rather than just selling a calendar slot — but it depends on Story 3 (a completed booking) existing first, so it is P2.

**Independent Test**: Can be tested independently of payments by taking a confirmed test booking, opening the session workspace as both mentor and member roles, verifying private mentor notes are hidden from the member view, and confirming an action plan with owner/due-date/status fields is visible to both.

**Acceptance Scenarios**:

1. **Given** a mentor writes a private note during a session, **When** the member opens the same session workspace, **Then** the private note is not visible to the member unless the mentor explicitly shares it.
2. **Given** an admin adds a safety note to a session, **When** either the mentor or the member views the workspace, **Then** the safety/admin note is visible to both (Section 70).
3. **Given** a mentor marks the session complete and creates an action plan item, **When** the member views their action plan, **Then** they can update its status among Not started / In progress / Completed / Blocked.
4. **Given** a session service promised specific deliverables in its listing, **When** the session is marked complete, **Then** the system tracks whether each promised deliverable was actually submitted.

---

### User Story 5 - Member Disputes a Mentor No-Show and Receives a Refund (Priority: P2)

A member whose mentor did not join a paid session opens a dispute, the system and/or a trust-and-safety reviewer examines attendance signals (join logs, join duration, provider webhook), and — once the no-show is confirmed — the member receives a full refund or credit while the mentor's payout for that booking is blocked and their reliability score is impacted.

**Why this priority**: Trust in the payment/refund path is what makes members willing to pay upfront for a mentor they've never met. Without a working dispute-to-refund loop, negative first experiences (a no-show) would permanently damage retention. It depends on Stories 3 and 4 existing (a real booking and session to dispute), so P2.

**Independent Test**: Can be tested independently by simulating a booking where only the member attendance signal fires (mentor never joins), opening a dispute with "Mentor did not attend" as the reason, and confirming the system produces a full refund to the member and a payout hold against the mentor without needing any other module.

**Acceptance Scenarios**:

1. **Given** a confirmed paid booking where only the member's join event is logged and no valid technical incident exists, **When** the grace period elapses, **Then** the system supports classifying it as a mentor no-show.
2. **Given** a mentor no-show is confirmed, **When** the outcome is applied, **Then** the member receives a full refund (and optionally additional credit), the mentor's payout for that booking is blocked, and the mentor's reliability score is impacted.
3. **Given** a dispute reviewer opens a "Mentor did not attend" dispute, **When** they review it, **Then** they can access booking, payment, attendance logs, session duration, relevant messages, and previous incidents, and can take one of: no action, full refund, partial refund, credit, payout release, payout hold, warning, quality review, or safety escalation.
4. **Given** a refund is issued for a disputed booking, **When** the refund transaction is processed, **Then** it references the original payment and taxes/payment fees are recalculated per policy — never issued as a disconnected new charge.

---

### User Story 6 - Mentor Views Earnings and Receives Payout with Snapshotted Commission (Priority: P2)

A mentor views their earnings dashboard (gross bookings, commission, taxes withheld, refunds, net earnings, pending vs. available balance) and receives payouts on their configured schedule to their verified payout account — where the commission rate applied to each booking is the rate that was in effect at booking confirmation time, permanently, even if the platform's commission structure changes later.

**Why this priority**: Sustainable mentor earning (Product Objective #10) is what keeps supply on the platform; without reliable, auditable, correctly-calculated payouts, mentors churn. It depends on completed, disputable bookings (Stories 3-5), so it is sequenced after them.

**Independent Test**: Can be tested independently by confirming a booking at a known commission rate, later changing the platform's default commission rate in configuration, completing the session and its dispute window, and verifying the mentor's earning for that specific booking still uses the original (snapshotted) rate, not the new one — then running it through a full payout cycle to "Paid" status.

**Acceptance Scenarios**:

1. **Given** a booking confirmed while the platform commission is 20%, **When** the platform's default commission is later changed to 25%, **Then** the mentor's earning for that already-confirmed booking is still calculated using the 20% rate snapshotted at confirmation time.
2. **Given** a session is completed and its dispute window has closed with no dispute, **When** the earning status is evaluated, **Then** it transitions from "Dispute hold" to "Available."
3. **Given** a mentor has not yet completed payout onboarding (bank details, tax identifier), **When** an earning becomes available for payout, **Then** the payout is blocked with a clear `MENTOR_PAYOUT_ACCOUNT_REQUIRED`-type instruction to the mentor.
4. **Given** a scheduled payout run, **When** it processes a mentor's available balance above the minimum threshold, **Then** the mentor receives a downloadable payout statement and a payout reference, and the payout status is tracked through Pending → Approved → Processing → Paid (or Failed/Returned/On hold/Cancelled).

---

### User Story 7 - New Mentor Gets Fair Discovery Exposure (Priority: P3)

A newly approved mentor with zero or very few reviews is not permanently buried by ranking algorithms that favor high review counts; instead the system gives them controlled exposure (e.g., a "New verified mentors" discovery section) while weighting their verification credibility and monitoring their early quality closely.

**Why this priority**: This affects marketplace health and long-term mentor supply diversity, but the core marketplace functions without it — it's an algorithmic fairness/growth refinement layered on top of ranking/discovery that already works, so P3.

**Independent Test**: Can be tested independently by creating a newly-approved mentor with zero reviews and confirming they appear in a "New verified mentors" or equivalent discovery section and are not excluded from general search/filter results purely for having no reviews.

**Acceptance Scenarios**:

1. **Given** a mentor was approved today with no completed sessions, **When** a member browses the discovery page, **Then** the mentor is discoverable through a dedicated new-mentor section rather than being invisible.
2. **Given** two mentors have identical relevance/quality-score inputs except review count, **When** ranking is computed, **Then** review-count-only ranking is not used to permanently suppress the newer mentor (Section 117: "Avoid ... New mentor permanent suppression").
3. **Given** a new mentor completes their first sessions, **When** quality monitoring runs, **Then** it applies increased scrutiny (per Section 115) compared to an established mentor with a long track record.
4. **Given** a new mentor's early sessions show an unusual pattern of reviews from linked/duplicate accounts, **When** the fraud/quality system evaluates them, **Then** it flags them as potential fake initial reviews per Section 115's "fake initial reviews prevent" requirement.

---

### User Story 8 - Off-Platform Payment Request Is Detected and Warned (Priority: P3)

When a mentor or member attempts to move payment for a session off the platform (e.g., requesting direct bank transfer to avoid platform fees), the system detects the high-risk pattern in messaging/booking context and warns the affected party, protecting both the platform's commission integrity and the member's payment safety (since off-platform payments have no dispute/refund protection).

**Why this priority**: This is a fraud-prevention and trust-and-safety control that protects platform revenue integrity and member safety, but it is a defense-in-depth layer on top of an already-functioning messaging and booking system, so it is lower priority than the core transaction flow.

**Independent Test**: Can be tested independently by sending a test message through mentor-member messaging containing an off-platform payment request pattern (e.g., "send me money directly to my account") and confirming the system surfaces a warning to the recipient and logs the incident for trust-and-safety review, without needing the full booking flow to be complete.

**Acceptance Scenarios**:

1. **Given** a mentor sends a message requesting a member pay them directly outside the platform, **When** the message is sent, **Then** the system detects the high-risk pattern and displays a warning to the member (Section 75).
2. **Given** repeated off-platform payment pressure from the same mentor across multiple members, **When** trust-and-safety reviews the pattern, **Then** it is treated as grounds for suspension (Section 121: "Off-platform payment pressure").
3. **Given** a member reports an off-platform payment request, **When** the report is filed, **Then** it is routed through the member safety controls reporting flow (Section 123).
4. **Given** platform policy allows post-booking contact-sharing with explicit consent, **When** a member and mentor mutually and explicitly consent to share contact details after a confirmed booking, **Then** the system allows it without triggering a false-positive fraud warning.

---

### Edge Cases

- What happens when a mentor's date-specific availability block (e.g., emergency block, holiday) is applied to a date that already has confirmed bookings? The system must not silently auto-cancel the existing confirmed bookings; a conflict-resolution workflow must trigger instead (Section 45).
- What happens when a member's browser/timezone reports a different timezone than the one used when the booking was originally confirmed (e.g., they travel, or DST shifts)? The original timezone must remain accessible and the historically booked time must be preserved even as display converts to the member's current local timezone (Section 43).
- What happens when session content indicates a member is in immediate danger or crisis? The platform is not an emergency service; the system must offer safety guidance, a session escalation option, a local emergency resource workflow, and internal trust-and-safety escalation with minimal necessary logging (Section 126).
- What happens when a mentor or member attempts a secret (non-consented) recording of a session? Secret recording is explicitly prohibited; the system must show a visible recording indicator whenever recording is active and must not allow silent recording (Section 65).
- What happens when a refund is issued against a mentor whose earning for that booking has already moved to "Available" or even been paid out? The refund/adjustment must be able to drive the mentor's balance negative or create a clawback/adjustment entry rather than silently failing (Sections 86, 93, 94 — "Adjustments," "Reversed").
- What happens when two attendance signals conflict (e.g., mentor's video-room join log shows attendance but the member disputes it via a support ticket)? No single attendance signal may be treated as conclusive on its own; multiple signals must be cross-checked (Section 82).
- What happens when a mentor attempts to use a personal, permanent external meeting-room link for sessions instead of the platform-issued or booking-specific link? The platform may discourage or block this to prevent tracking/safety loss (Section 64).
- What happens when a member cancels a multi-session package partway through, with unused sessions remaining? The unused-session treatment (refund vs. forfeiture vs. partial credit) must be clearly defined per package policy rather than left ambiguous (Section 29).
- What happens when a regulated-expert-category mentor's credential expires mid-booking-cycle (i.e., between when a future session was booked and when it is due to occur)? Re-verification must be triggered and the mentor restricted from new bookings in that category; existing already-confirmed bookings need an explicit handling rule.
- What happens when calendar-provider (Google/Outlook) sync fails or the third-party provider has an outage during a booking transaction? The booking flow's calendar-conflict-prevention transaction must have a defined fallback rather than silently confirming a booking that conflicts with an unread external calendar (Sections 46, 47, 68).
- What happens when a member tries to submit more than one review for the same booking, or creates duplicate accounts to submit multiple reviews for the same mentor? The system must enforce one review per booking and detect duplicate-account review abuse (Section 105).
- What happens when a mentor's public profile is viewed while their application/verification status is anything other than fully approved and published? Suspended or unpublished mentors must never appear in search results (Section 34), and sensitive application documents must never appear on the public profile (Section 8).
- What happens when a session technical failure (platform outage, connection failure) occurs mid-session? The system must support reconnect, switch-to-audio, backup link use, rescheduling, a support ticket, and partial/full refund eligibility, and must retain technical logs for dispute review (Section 68).
- What happens when a mentor cancels a session — should it ever be attributed as the member's fault for reliability-tracking or refund-eligibility purposes? Mentor cancellation must never be classified as member fault (Section 78).

## Requirements *(mandatory)*

### Mentor, Expert & Instructor Role Requirements

- **FR-001**: System MUST support distinct platform roles across the mentorship ecosystem: Visitor, Member, Paid member, Mentee, Mentor applicant, Approved mentor, Verified mentor, Featured mentor, Expert, Instructor, Group facilitator, Mentor manager, Mentor reviewer, Support agent, Finance operator, Trust-and-safety reviewer, Platform admin, Super admin (Section 4).
- **FR-002**: System MUST enforce all role and permission checks on the backend, never trusting client-side role state (Section 4).
- **FR-003**: System MUST allow a single user to hold multiple approved roles simultaneously (e.g., mentor and instructor) (Section 5.3).
- **FR-004**: System MUST distinguish Mentor (member-specific guidance/accountability), Expert (deep subject-matter consultation in categories such as legal, tax, marketing, technology, finance, branding, sales, operations), and Instructor (courses/workshops/assignments) as functionally distinct profile types with different feature sets (Section 5).
- **FR-005**: System MUST apply additional legal restrictions to professional regulated advice delivered by Experts (Section 5.2).

### Mentor Onboarding & Verification Requirements

- **FR-006**: System MUST implement the mentor onboarding pipeline as an ordered sequence of stages: interest registration, account/role request, basic profile, identity verification, contact verification, professional details, expertise selection, experience evidence, portfolio/credentials, languages, mentoring preferences, service configuration, availability, pricing, payment/payout details, policy agreement, training/orientation, assessment/interview, admin review, approval/rejection, profile publishing (Section 7).
- **FR-007**: System MUST persist onboarding progress at every stage so an applicant can resume an incomplete application (Section 7).
- **FR-008**: System MUST capture the full mentor application field set: legal name, public display name, profile photo, email, mobile number, location, timezone, languages, current occupation, organization, professional experience, mentoring experience, expertise categories, target member type, biography, motivation for joining, portfolio links, social/professional links, certificates, identity document, references, expected availability, proposed pricing, and agreement declarations (Section 8).
- **FR-009**: System MUST NOT display sensitive application documents (e.g., identity documents) on the public mentor profile (Section 8).
- **FR-010**: System MUST track application status through the defined states: Draft, Submitted, Identity verification pending, Document review pending, Interview pending, Changes requested, Approved, Conditionally approved, Rejected, Withdrawn, Suspended, Archived (Section 9).
- **FR-011**: System MUST provide applicants with an accessible status tracker reflecting their current application state (Section 9).
- **FR-012**: System MUST support identity verification via government-issued ID document, selfie/liveness check, email verification, mobile OTP, address verification where required, and tax identity verification for payout purposes (Section 10).
- **FR-013**: System MUST store identity verification documents encrypted with restricted staff access, support verification expiry and re-verification triggers, maintain an audit trail, and follow a defined data-retention policy (Section 10).
- **FR-014**: System MUST allow the public profile to display an "Identity Verified" badge/status without exposing underlying document details (Section 10).
- **FR-015**: System MUST support professional verification evidence types: work-experience letter, business registration, portfolio, client references, degree, professional certification, course completion, published work, public speaking history, existing mentor ratings, and social professional profile (Section 11).
- **FR-016**: System MUST track professional verification status distinctly from identity verification, through states: Self-declared, Evidence submitted, Under review, Verified, Partially verified, Rejected, Expired (Section 11).
- **FR-017**: System MUST require mandatory orientation (covering TBT mission, member expectations, mentoring ethics, privacy, communication standards, safety, session structure, cancellation rules, review policy, payment/payout, reporting, and platform tools) before a profile can publish, when configured, and MUST support a completion quiz or explicit acknowledgment (Section 13).

### Regulated Expert Category Requirements

- **FR-018**: System MUST identify regulated expert categories including legal advice, tax advice, investment advice, medical or mental-health services, accounting certification, and immigration advice (Section 12).
- **FR-019**: System MUST request applicable category-specific credentials for regulated categories and restrict unverified professionals from offering services in that category (Section 12).
- **FR-020**: System MUST display jurisdiction disclaimers on regulated-category mentor profiles and service pages (Section 12).
- **FR-021**: System MUST prevent mentors from using misleading professional titles in regulated categories (Section 12).
- **FR-022**: System MUST store credential expiry dates and automatically trigger re-verification workflows when credentials approach or pass expiry (Section 12, Section 119).
- **FR-023**: System MUST provide emergency and professional-boundary notices where relevant to a regulated category (Section 12).
- **FR-024**: System MUST clearly communicate the distinction between TBT educational guidance and licensed professional advice across regulated-category surfaces (Section 12).

### Mentor Profile & Service Catalog Requirements

- **FR-025**: System MUST maintain a mentor profile data model including user ID, mentor ID, display name, profile slug, photo, optional cover image, professional headline, short introduction, full biography, expertise, industries, skills, languages, experience years, verification badges, credentials, current role, organization, portfolio, target audience, session types, pricing, availability summary, rating, review count, completed sessions, response time, optional repeat-client rate, location, timezone, profile status, featured status, and created/updated dates (Section 14).
- **FR-026**: System MUST render the mentor profile page with sections: header, professional headline, verification badges, rating and completed sessions, primary CTA, about, expertise, "who this mentor helps," session services, available slots, experience, credentials, languages, approach, member outcomes, reviews, resources/posts, policies, similar mentors, and a report-profile action (Section 15).
- **FR-027**: System MUST display in the profile header: photo, name, headline, verified badge, mentor category, languages, location/remote status, rating, session count, response-time indicator, save action, share action, permission-gated message action, and a book CTA (Section 16).
- **FR-028**: System MUST prohibit mentor biography claims of guaranteed revenue, guaranteed job, guaranteed funding, false credentials, unverifiable superiority claims, or misleading scarcity (Section 17).
- **FR-029**: System MUST maintain a dynamically admin-manageable expertise taxonomy (e.g., entrepreneurship, business strategy, marketing, e-commerce, finance, legal basics, technology, career development, and other listed categories) (Section 18).
- **FR-030**: System MUST record, per skill, a skill name, self-assessed level, verified level, experience years, evidence, linked services, optional endorsements, and last-verified date, and MUST visually distinguish self-assessed from verified proficiency (Section 19).
- **FR-031**: System MUST allow mentors to declare target member profiles (e.g., students, beginners, freelancers, early-stage founders, women entrepreneurs) and MUST feed this into the recommendation engine (Section 20).
- **FR-032**: System MUST support the defined mentor service types: free discovery call, paid one-to-one session, quick consultation, deep-dive consultation, portfolio review, business review, strategy session, accountability session, interview preparation, group mentoring, office hours, workshop, multi-session package, monthly mentorship, course add-on mentoring, asynchronous review, and written feedback service (Section 21).
- **FR-033**: System MUST maintain a service data model including service ID, mentor ID, title, description, service category, session format, duration, price, currency, tax category, platform fee treatment, capacity, buffer time, booking notice, maximum future-booking window, preparation questions, deliverables, cancellation policy, rescheduling policy, eligibility, membership requirement, and active status (Section 22).
- **FR-034**: System MUST support session formats: platform video call, external video integration, audio call, chat consultation, in-person session (where approved), written asynchronous review, group webinar, and hybrid session, with platform video as the recommended default (Section 23).
- **FR-035**: System MUST restrict external contact/meeting links according to platform policy (Section 23).
- **FR-036**: System MUST enforce free-discovery-call rules: short duration, one per member per mentor within a configured period, no points-farming, mentor-configurable disable, a cancellation policy, no-show tracking, and MUST NOT allow it to substitute for a full unpaid consultation (Section 24).
- **FR-037**: System MUST support one-to-one session configuration including duration, price, member objective, preparation questions, video/audio method, deliverables, follow-up window, rescheduling rules, and cancellation rules (Section 25).
- **FR-038**: System MUST enforce quick-consultation constraints: short duration, clear scope, limited preparation form, no broad business-audit promise, and an optional written summary (Section 26).
- **FR-039**: System MUST support deep-dive session configuration with pre-session documents, longer duration, detailed intake, session notes, and an action plan (Section 27).
- **FR-040**: System MUST support asynchronous review services where members submit documents/links/video/portfolio and mentors return written feedback, annotated files, recorded video/audio, or an action checklist, with a clearly displayed delivery deadline (Section 28).
- **FR-041**: System MUST support multi-session packages with number of sessions, duration per session, validity period, total price, discount, included services, follow-up support, cancellation policy, refund policy, and scheduling rules, and MUST clearly define the treatment of unused sessions (Section 29).
- **FR-042**: System MUST support monthly mentorship subscriptions including fixed sessions per month, message support, document reviews, goal tracking, accountability check-ins, and group access, with recurring billing, renewal date, usage limit, fair-use policy, pause, cancel, proration policy, and mentor-capacity control (Section 30).
- **FR-043**: System MUST support group mentoring sessions with topic, mentor, start/end time, capacity, price, language, level, agenda, materials, recording policy, questions policy, and participant visibility, and MUST clearly communicate participant-name visibility, capture recording consent, and discourage sharing of sensitive personal details in group settings (Section 31).
- **FR-044**: System MUST support recurring office-hours sessions in free, paid, membership-benefit, first-come-first-served, question-submission, or queue-based modes, with admin/mentor-configurable capacity and topic restrictions (Section 32).

### Discovery, Search & Recommendation Requirements

- **FR-045**: System MUST render a mentor discovery page with sections for recommended-for-you, available-today, top-rated, Tamil mentors, beginner-friendly, business-stage mentors, popular categories, new verified mentors, free discovery calls, upcoming group sessions, and saved mentors, personalized using member goal, business stage, active course, selected challenge, language, budget, availability, previous bookings, ratings, and location where relevant (Section 33).
- **FR-046**: System MUST support mentor search across name, headline, biography, expertise, skill, industry, service, language, location, credential, and organization (Section 34).
- **FR-047**: System MUST make search results permission- and status-aware, and MUST exclude suspended or unpublished mentors from search results (Section 34).
- **FR-048**: System MUST provide filters for expertise, industry, language, price range, rating, availability, session type, duration, target audience, experience, verified status, free-discovery-call availability, location, online/in-person, and membership eligibility (Section 35).
- **FR-049**: System MUST provide sort options: Recommended, Earliest available, Highest rated, Most experienced, Price low to high, Price high to low, Most completed sessions, Recently added, and MUST make the "Recommended" ranking logic explainable to users (Section 36).
- **FR-050**: System MUST compute mentor recommendations using member profile, goal, current challenge, business stage, skills, course enrollment, previous sessions, preferred language, price range, time availability, mentor outcome history, mentor capacity, and conflict/block state, while weighting negative signals: previous poor rating, cancelled sessions, blocked mentor, mentor unavailability, service mismatch, language mismatch, high complaint rate, and mentor restriction (Section 37).
- **FR-051**: System MUST provide human-readable recommendation explanations to members (e.g., matched goal, matched language, budget fit, availability fit) (Section 38).
- **FR-052**: System MUST render mentor cards with photo, name, headline, primary expertise, verified badge, languages, rating, review count, completed-session count, starting price, next available slot, save action, view-profile action, and book CTA (Section 39).
- **FR-053**: System MUST allow members to save/unsave mentors, optionally create shortlists, compare saved mentors, and optionally receive availability update notifications, with user-controlled notification preferences (Section 40).
- **FR-054**: System MUST support comparing up to a configurable number of mentors across expertise, experience, languages, rating, pricing, session duration, verification, availability, target members, and cancellation policy, and MUST NOT declare a universal "best mentor" in the comparison UI (Section 41).

### Availability & Calendar Requirements

- **FR-055**: System MUST support availability composed from weekly recurring availability, date-specific availability, blocked time, calendar events, buffer time, holidays, time off, session-cap rules, manual bookings, and group sessions (Section 42).
- **FR-056**: System MUST require each mentor to configure a primary timezone, display member-facing slots in the member's local timezone, keep the original mentor timezone accessible, support daylight-saving transitions, audit timezone changes, preserve historical booking times exactly as booked, and clearly show timezone in notifications (Section 43).
- **FR-057**: System MUST allow mentors to define recurring availability by day of week, start/end time, service types, location/mode, effective date, expiry, and break periods, and MUST validate for overlapping rules (Section 44).
- **FR-058**: System MUST allow mentors to add extra date-specific availability, mark specific days unavailable, apply holiday blocks, partial-day blocks, and emergency blocks, and MUST NOT auto-cancel existing confirmed bookings when a block is applied — a conflict workflow MUST trigger instead (Section 45).
- **FR-059**: System MUST support calendar integrations with Google Calendar, Microsoft Outlook Calendar, and the internal TBT calendar, supporting busy-time reading, TBT booking event creation/update/cancellation, meeting-link inclusion, and reminder sync, while processing external calendar data privacy-safely and preferring busy/free state over unrelated event content (Section 46).
- **FR-060**: System MUST execute booking as an atomic transaction: slot lock, availability recheck, external busy-state recheck (where enabled), capacity check, payment flow, booking confirmation, calendar event creation, and slot release-or-commit, with a configurable temporary slot-hold expiry (Section 47).
- **FR-061**: System MUST allow mentors to configure a minimum booking-notice period (e.g., 2 hours, 12 hours, 1 day, 2 days) and MUST support a separately configured emergency/last-minute booking service that bypasses the standard notice rule (Section 48).
- **FR-062**: System MUST allow mentors to configure a maximum future-booking window (e.g., 14/30/60/90 days) and MUST prevent selection of availability beyond that window (Section 49).
- **FR-063**: System MUST allow mentors to configure before-session buffer, after-session buffer, daily maximum sessions, consecutive-session maximum, and lunch/break periods (Section 50).

### Booking & Calendar Requirements

- **FR-064**: System MUST implement the member booking flow as an ordered sequence: open mentor profile, select service, select date, select slot, confirm timezone, answer intake questions, optionally upload documents, optionally apply coupon, view price summary, acknowledge cancellation policy, complete payment, receive booking confirmation, create calendar event, schedule reminders, and open the session workspace (Section 51).
- **FR-065**: System MUST support booking without payment for free services or membership-included sessions, including eligibility check, usage-quota check, slot hold, booking confirmation, quota consumption, and a defined cancellation-restoration rule (Section 52).
- **FR-066**: System MUST track booking status through the defined states: Draft, Slot held, Payment pending, Confirmed, Preparation pending, Ready, In progress, Completed, Member cancelled, Mentor cancelled, Rescheduled, No-show member, No-show mentor, Disputed, Refunded, Partially refunded, Expired (Section 53).
- **FR-067**: System MUST implement a slot-hold record (slot, user, expiry, checkout session, status) created when checkout begins, MUST auto-release expired holds, and MUST prevent double-booking of the same slot (Section 54).
- **FR-068**: System MUST support a configurable pre-session intake form (main goal, current challenge, expected outcome, business/career stage, relevant links, documents, previous attempts, specific questions, consent, confidentiality acknowledgement) with mentor-configurable service-specific questions (Section 55).
- **FR-069**: System MUST support member document upload (PDF, document, spreadsheet, presentation, image, secure link) with file-size limits, malware scanning, access restriction, expiry policy, deletion, download audit where required, and mentor access granted only after a confirmed booking (Section 56).
- **FR-070**: System MUST render a booking confirmation screen showing mentor, service, date, time, timezone, duration, meeting method, amount paid, preparation required, cancellation policy, add-to-calendar action, message-mentor action, and view-booking action (Section 57).
- **FR-071**: System MUST generate a unique, user-facing booking reference for every booking (e.g., `TBT-MNT-2026-000123` format) without exposing the internal database ID (Section 58).
- **FR-072**: System MUST schedule session reminders at booking confirmation, 24 hours before, 1 hour before, 10 minutes before, at session start, and a missed-session follow-up, configurable by user preference and session type, with critical-time reminders sent via push and email (Section 59).
- **FR-073**: System MUST present a pre-session checklist to members (intake completed, documents uploaded, device test, microphone/camera permission, stable internet, quiet environment, questions ready) and to mentors (intake reviewed, documents reviewed, notes prepared, meeting link ready, session objective understood) (Section 60).

### Session Workspace Requirements

- **FR-074**: System MUST provide a session workspace containing booking summary, member objective, intake responses, uploaded files, session notes, action items, shared resources, video-call entry, timer, technical support access, report/safety action, and completion control, with mandatory role-based visibility (Section 61).
- **FR-075**: System MUST provide a pre-session waiting room showing member/mentor check-in state, device test, session start time, connection status, support link, privacy reminder, recording status, and a join button, with configurable early-joining behavior (Section 62).
- **FR-076**: System MUST provide a platform video session with secure meeting room, token-based access, role authorization, camera, microphone, device selection, screen sharing, optional chat, network-quality indicator, reconnect, participant controls, end-session control, and technical event logging, and MUST prevent unauthorized users from accessing the meeting room (Section 63).
- **FR-077**: System MUST support external video integration with unique booking-specific meeting links, link protection, link update on reschedule, link deletion on cancellation (where the provider supports it), and provider-failure fallback, and MAY discourage or block mentor use of a personal permanent meeting-room link (Section 64).
- **FR-078**: System MUST default session recording to off, and MUST only permit recording when the service/platform policy allows it AND both mentor and member give clear consent AND a visual recording indicator is shown AND storage duration is disclosed AND access control is enforced AND a download policy and delete-request handling exist; secret recording MUST be prohibited (Section 65).
- **FR-079**: System MUST support in-session chat for text, links, and small file/resource sharing, with a clearly defined retention period and participant access rules (Section 66).
- **FR-080**: System MUST display a session timer showing scheduled start, elapsed time, remaining time, extension eligibility, and overtime warning, and MUST NOT auto-disconnect a session unless an explicit policy requires it (Section 67).
- **FR-081**: System MUST handle technical failure categories (member connection failure, mentor connection failure, platform outage, third-party provider outage, audio issue, video issue) with available actions of reconnect, switch to audio, use backup link, reschedule, open support ticket, and partial/full refund eligibility, and MUST retain technical logs for dispute review (Section 68).
- **FR-082**: System MUST execute session completion as a sequence: mark completion, verify participant attendance, save notes, finalize action plan, attach follow-up resources, update payment-settlement eligibility, request feedback, create review eligibility, schedule follow-up reminder, and record analytics (Section 69).
- **FR-083**: System MUST maintain session notes as three data-level-separated types — private mentor notes, shared member notes, admin safety notes — where private mentor notes are never member-visible unless explicitly shared by the mentor, and admin safety notes are always visible to both mentor and member (Section 70).
- **FR-084**: System MUST support an action plan with session objective, key findings, recommended actions, priority, owner, due date, status, supporting resource, and follow-up note, where the member can update status among Not started, In progress, Completed, Blocked (Section 71).
- **FR-085**: System MUST support session deliverables (written summary, strategy plan, checklist, annotated document, templates, recording, resource links, follow-up questions, recommended course) and MUST track fulfillment of deliverables promised in the service description after the session (Section 72).
- **FR-086**: System MUST support mentor-configurable follow-up windows (no follow-up, 24-hour, 3-day, 7-day, until-next-package-session message support) with fair-use limits clearly displayed (Section 73).

### Messaging, Contact Protection & Professional Boundaries Requirements

- **FR-087**: System MUST allow member-mentor messaging in defined contexts: pre-booking question (mentor-setting-gated), booking preparation, session follow-up, active package, and support resolution, and MUST apply Volume 05 messaging safety rules; mentors MUST NOT send direct promotional spam (Section 74).
- **FR-088**: System MUST NOT automatically reveal personal phone number, email, or external messaging details between member and mentor, though platform policy MAY allow post-booking sharing with explicit mutual consent (Section 75).
- **FR-089**: System MUST detect and warn on high-risk off-platform payment requests within mentor-member communication (Section 75).
- **FR-090**: System MUST enforce professional boundaries prohibiting mentors from: applying personal-relationship pressure, requesting unrelated sensitive personal information, requesting financial access credentials, requesting member account passwords, requesting secret off-platform payments, providing unlicensed regulated advice, or engaging in discriminatory behavior (Section 125).
- **FR-091**: System MUST require mentors to disclose conflicts of interest — own product recommendation, affiliate relationship, financial interest, employer conflict, competitor access, paid partnership — visibly on the relevant session or service page (Section 127).
- **FR-092**: System MUST define session confidentiality expectations, exceptions for safety/legal requirements, recording policy, mentor notes policy, data access, document retention, and group-session limitations, and MUST NOT imply mentor-client legal privilege unless an applicable professional relationship genuinely exists (Section 128).
- **FR-093**: System MUST provide an emergency/high-risk-situation workflow (safety guidance, session escalation option, local emergency resource workflow, internal trust-and-safety escalation, minimal necessary logging) triggered when session content indicates immediate danger or crisis, while making clear the platform is not an emergency service (Section 126).

### Rescheduling, Cancellation & No-Show Requirements

- **FR-094**: System MUST allow member or mentor to request rescheduling subject to minimum notice, maximum reschedule count, eligible slot range, price difference handling, package-expiry interaction, approval requirement, reason capture, and notification, and MUST update calendar, reminders, and meeting link as part of the reschedule transaction (Section 76).
- **FR-095**: System MUST determine member-cancellation outcomes (full refund, partial refund, credit, no refund, reschedule-only) based on notice period relative to policy, and MUST clearly display the applicable policy before booking confirmation (Section 77).
- **FR-096**: System MUST apply mentor-cancellation consequences — member full refund or credit, priority rescheduling, alternative mentor suggestion, reliability-metric impact, repeated-cancellation review, emergency-reason exception, optional member compensation — and MUST NOT classify a mentor cancellation as member fault (Section 78).
- **FR-097**: System MUST define a per-service cancellation-policy model (free-cancellation window, partial-refund window, late-cancellation rule, reschedule count, no-show rule, mentor-cancellation rule, platform-failure rule, force-majeure rule) inheritable from a platform default or an approved custom policy (Section 79).
- **FR-098**: System MUST classify a member no-show only when the session was available, the mentor attended, the member failed to join within the grace period, supporting evidence exists, and no valid technical incident occurred, and MUST apply an outcome of no-refund/partial-credit/policy result, mentor payment eligibility, member reliability tracking, and an appeal option (Section 80).
- **FR-099**: System MUST apply mentor no-show outcomes of member full refund, optional additional credit, mentor payout block, reliability-score impact, incident review, repeated-issue suspension consideration, and alternative-mentor recommendation (Section 81).
- **FR-100**: System MUST determine attendance using multiple corroborating signals — video-room join logs, join duration, meeting-provider webhook, manual confirmation, both-party completion, chat/session activity, support incident — and MUST NOT treat any single signal as always conclusive (Section 82).

### Dispute & Refund Requirements

- **FR-101**: System MUST support dispute reasons: mentor did not attend, member did not attend, session ended early, service not delivered, promised deliverable missing, inappropriate conduct, misleading profile, unauthorized payment request, technical failure, recording/privacy issue, and other (Section 83).
- **FR-102**: System MUST capture, on dispute submission, the related booking, reason, description, requested resolution, evidence, communication history, and submission date, and MUST track dispute status through Submitted, Under review, Waiting for member, Waiting for mentor, Escalated, Resolved, Closed, Appealed (Section 84).
- **FR-103**: System MUST restrict dispute reviewer access to the minimum necessary data — booking, payment, attendance logs, session duration, relevant messages, shared files, recording (where consent and policy allow), previous incidents, and policy version — and MUST support reviewer actions of no action, full refund, partial refund, credit, payout release, payout hold, warning, quality review, and safety escalation (Section 85).
- **FR-104**: System MUST support refund types: full refund, partial refund, platform credit, package-session restoration, coupon restoration, and reward-point restoration, with every refund transaction referencing the original payment and taxes/payment fees recalculated per applicable policy (Section 86).
- **FR-105**: System MUST prioritize the admin dispute queue by category in order: safety, mentor no-show, member no-show, service-not-delivered, payment, technical, quality complaint, and MUST define SLA and escalation rules for the queue (Section 137).
- **FR-106**: System MUST NOT allow the platform to arbitrate a pure rating disagreement in a review dispute unless a policy violation or objective evidence exists (Section 111).

### Payment & Pricing Requirements

- **FR-107**: System MUST support payment cases: one-time session, package, subscription mentorship, group session, workshop, add-on, credit-based booking, coupon-discounted booking, and membership-included booking, with detailed payment architecture defined in Volume 09 (Section 87).
- **FR-108**: System MUST present a checkout price breakdown showing base service price, discount, coupon, taxes, platform fee (if charged separately), credits, reward points (if supported), final total, and currency, with no hidden charges (Section 88).
- **FR-109**: System MUST support coupon types: platform coupon, mentor campaign coupon, first-booking coupon, membership coupon, category coupon, and referral coupon, and MUST require mentor-created coupons to follow admin rules and margin-protection constraints (Section 89).
- **FR-110**: System MUST support session credits with value, currency, eligible service, mentor restriction, expiry, transferability, and status, usable as a refund alternative, membership benefit, promotional campaign, mentor-cancellation compensation, or package allocation (Section 90).

### Payout & Commission Requirements

- **FR-111**: System MUST implement a payment settlement lifecycle where mentor payout funds are not immediately available: customer payment received → platform holds funds → session completed → dispute window starts → applicable deductions calculated → mentor earning becomes available → payout schedule processes, subject to applicable payment regulations and provider architecture (Section 91).
- **FR-112**: System MUST support commission models: percentage, fixed fee, tiered commission, membership-based commission, category-specific commission, promotional commission, and mentor-plan-subscription-plus-lower-commission (Section 92).
- **FR-113**: System MUST snapshot the applicable commission rate at booking-confirmation time and store it immutably against that booking; subsequent commission-rate changes MUST NOT retroactively affect already-confirmed historical bookings (Section 92; Constitution Article IV).
- **FR-114**: System MUST provide a mentor earnings dashboard showing gross bookings, mentor-funded discounts, platform commission, taxes withheld, refunds, adjustments, net earnings, pending earnings, available balance, and paid amount (Section 93).
- **FR-115**: System MUST track earning status through: Pending session, Session completed, Dispute hold, Available, Scheduled for payout, Paid, Reversed, Failed, Adjusted (Section 94).
- **FR-116**: System MUST capture payout onboarding details (legal name, bank account, account holder name, bank code, tax identifier, address, entity type, invoice preference, compliance declaration) with sensitive financial fields encrypted and access-restricted (Section 95).
- **FR-117**: System MUST support payout schedule options — weekly, biweekly, monthly, threshold-based, manual-approved — with configurable minimum threshold, settlement delay, holiday handling, currency, processing fee, and failed-payout retry (Section 96).
- **FR-118**: System MUST track payout status through: Pending, Approved, Processing, Paid, Failed, Returned, On hold, Cancelled, and MUST provide each mentor a payout reference and a downloadable statement (Section 97).
- **FR-119**: System MUST surface clear mentor-facing instructions for payout failures (invalid bank details, name mismatch, closed account, compliance hold, provider failure, unsupported account, missing tax details) (Section 98).
- **FR-120**: System MUST support generation of earnings statements, commission invoices, tax-deduction statements, annual summaries, and payout receipts, with exact document requirements defined per jurisdiction by legal/finance teams (Section 99).
- **FR-121**: System MUST support dual approval for high-value payout batches where configured (Section 138).

### Review & Quality Score Requirements

- **FR-122**: System MUST restrict review eligibility to confirmed completed sessions within an eligible dispute state and review window, one review per booking, with duplicate-account abuse detection (Section 105).
- **FR-123**: System MUST capture review components: overall rating, communication, knowledge, practical usefulness, preparation, professionalism, written review, private platform feedback, and outcome tags (Section 105).
- **FR-124**: System MUST use a five-point rating scale with accessible text labels (Poor, Below expectations, Satisfactory, Very good, Excellent) and MUST NOT rely on emoji/stars alone (Section 106).
- **FR-125**: System MUST track review lifecycle through: Draft, Submitted, Automated moderation, Published, Hidden, Under review, Removed, Edited, Responded, and MUST NOT remove truthful negative reviews solely for containing criticism (Section 107).
- **FR-126**: System MUST allow members to edit a review within a limited window, MUST label edited reviews, MUST retain the previous version for internal audit, and MUST define whether a mentor response is retained or reset after a material edit (Section 108).
- **FR-127**: System MUST allow a mentor exactly one professional response per review, which MUST be respectful, privacy-safe, free of retaliation, free of personal information, and free of pressure to change the rating; admin MUST be able to moderate responses (Section 109).
- **FR-128**: System MUST restrict review removal/hiding to specific grounds — spam, abuse, threats, personal data, irrelevant content, fake transaction, extortion, conflict of interest, policy violation — and MUST NOT remove a review for a poor rating alone (Section 110).
- **FR-129**: System MUST allow mentors to report a review for reasons: not based on a real session, contains private information, abusive, extortion, conflict of interest, factually impossible claim, or other policy issue (Section 111).
- **FR-130**: System MUST calculate mentor rating using a consistent, auditable algorithm that MAY include verified-reviews-only filtering, optional time weighting, minimum review threshold, optional Bayesian adjustment, and exclusion of removed/fraudulent reviews (Section 112).
- **FR-131**: System MUST compute an internal mentor quality score from session rating, review sentiment, completion rate, mentor cancellations, mentor no-shows, response time, disputes, refund rate, repeat bookings, deliverable completion, safety incidents, policy compliance, and member outcome feedback, without requiring the exact score to be shown publicly (Section 113).
- **FR-132**: System MUST track mentor quality-level states: New, Good standing, High quality, Featured eligible, Improvement required, Under review, Restricted, Suspended (Section 114).
- **FR-133**: System MUST provide controlled discovery exposure for new mentors (dedicated new-mentor section, verification-weight boost, introductory-session support, increased quality monitoring, fake-initial-review prevention) so low review count does not cause disappearance from discovery (Section 115).
- **FR-134**: System MUST define featured-mentor eligibility criteria (verified profile, strong quality score, low cancellation, good reviews, availability, policy compliance, category demand) and MUST label any paid placement as "Sponsored"/"Promoted," never presenting paid status as an organic quality badge (Section 116).
- **FR-135**: System MUST rank mentors using relevance, language fit, availability, service fit, member-stage fit, quality score, price fit, verified expertise, repeat booking, and response reliability, while avoiding: automatic highest-price-to-top ranking, unlabeled paid-mentor boosts, review-count-only ranking, and permanent suppression of new mentors (Section 117).
- **FR-136**: System MUST provide a mentor performance dashboard with profile views, service views, booking conversion, upcoming/completed sessions, cancellation rate, no-show rate, average rating, repeat booking, response time, earnings, top services, member outcomes, and suggested improvements (Section 118).
- **FR-137**: System MUST generate performance alerts (repeated late response, high cancellation rate, missing deliverables, outdated profile information, expiring credential, rating decline, dispute increase, calendar conflicts, low availability) that include a corrective action (Section 119).
- **FR-138**: System MUST run a quality improvement plan workflow for mentors falling below standards: identify issue, notify mentor, assign training/resource, define improvement target, set review period, monitor performance, then clear/restrict/suspend, with immediate action possible for severe safety violations (Section 120).
- **FR-139**: System MUST capture private post-session member outcome feedback (goal achieved, problem clearer, action plan useful, confidence improved, next step identified, would book again, safety concern) separately from the public review, for internal quality-improvement use only (Section 147).

### Mentor Suspension, Deactivation & Safety Requirements

- **FR-140**: System MUST support mentor suspension for reasons including identity fraud, fake credentials, harassment, scam, off-platform payment pressure, repeated no-shows, severe quality failure, privacy breach, illegal advice, review manipulation, and platform policy violations, with effects of profile unpublish, new-booking disablement, existing-booking review, payout hold where legally permitted, member notifications, an appeal option, and an audit trail (Section 121).
- **FR-141**: System MUST support voluntary mentor deactivation: stop future slots, resolve active bookings, complete deliverables, handle subscriptions/packages, pay out remaining balance, archive profile, and issue a data-retention notice (Section 122).
- **FR-142**: System MUST provide member safety controls: report mentor, block mentor, cancel booking, open dispute, contact support, control messages, hide documents, revoke shared-file access where applicable, and report off-platform payment requests (Section 123).
- **FR-143**: System MUST provide mentor safety controls: report member, block future bookings, restrict messages, report harassment, report inappropriate material, end an unsafe session, contact emergency support, and request platform review, while balancing protection from abusive members against fair service obligations (Section 124).

### Instructor & Mentor Content Requirements

- **FR-144**: System MUST support instructor-specific capabilities — course association, cohort management, live-class hosting, assignment review, student office hours, course announcements, group discussions, course analytics, learner progress, permission-gated certificates — under Volume 04 learning rules (Section 103).
- **FR-145**: System MUST allow mentors to create public posts, educational resources, workshops, group sessions, articles, short videos, community answers, and approved lead magnets, subject to Volume 05 self-promotion moderation limits (Section 104).

### Admin Operations Requirements

- **FR-146**: System MUST provide an admin mentorship module with navigation covering overview, applications, verification, mentors, experts, instructors, services, availability, bookings, sessions, reviews, disputes, refunds, earnings, payouts, quality, safety, categories, settings, and reports (Section 129).
- **FR-147**: System MUST provide an admin overview dashboard with metrics: active mentors, pending applications, published services, upcoming/completed sessions, booking conversion, gross booking value, platform revenue, mentor earnings, refund rate, cancellation rate, no-show rate, average rating, open disputes, payout backlog, mentor supply by category, and member demand by category (Section 130).
- **FR-148**: System MUST provide a mentor application review screen displaying applicant profile, identity status, professional details, evidence, references, interview notes, risk flags, proposed services, availability, pricing, policy acknowledgements, and review history, with actions: approve, conditional approval, request changes, schedule interview, reject, escalate verification, and add internal note (Section 131).
- **FR-149**: System MUST provide an admin mentor list with columns (mentor, category, verification, profile status, rating, sessions, cancellation, quality state, earnings, last active, actions) and filters (category, status, verification, rating, availability, quality state, language, location, payout status, safety flag) (Section 132).
- **FR-150**: System MUST allow admins to view services, approve category-restricted services, edit policy labels, pause a service, remove misleading claims, check pricing, review cancellation policy, view bookings, and audit changes, retaining version history when a mentor edits commercial service details (Section 133).
- **FR-151**: System MUST provide admin booking management with columns (booking reference, member, mentor, service, date/time, status, payment, attendance, dispute, actions) and actions (view, reschedule, cancel, refund, add credit, mark attendance, open dispute, contact participants, view audit) (Section 134).
- **FR-152**: System MUST restrict admins from routinely accessing live private session content; operational monitoring MUST be limited to session status, join events, technical health, duration, support requests, and safety escalation, with content access authorized only for policy-based incident review (Section 135).
- **FR-153**: System MUST provide admin review management (search, filter, moderate, restore, remove, handle mentor dispute, detect manipulation, view reviewer history) (Section 136).
- **FR-154**: System MUST provide admin payout management for finance operators: view available mentor balances, approve payout batch, hold, release, retry failure, add adjustment, download report, reconcile provider statement, generate mentor statement (Section 138).
- **FR-155**: System MUST provide admin category management: create category/subcategory, add translations, define regulated status, required credentials, service restrictions, search synonyms, display order, and activate/archive (Section 139).

### Notification Requirements

- **FR-156**: System MUST send mentor notifications for: new booking, booking payment confirmed, booking cancelled, reschedule request, upcoming session, intake completed, new message, deliverable due, review received, dispute opened, payout available, payout completed, credential expiring, quality alert, and policy update (Section 140).
- **FR-157**: System MUST send member notifications for: booking confirmation, payment confirmation, mentor message, session reminder, reschedule, mentor cancellation, deliverable ready, follow-up due, review request, refund, credit issued, dispute update, and mentor availability update (Section 141).
- **FR-158**: System MUST provide transactional email templates for application received, mentor approved, changes requested, booking confirmation, session reminder, cancellation, reschedule, receipt, refund, deliverable ready, review request, payout statement, credential expiry, and suspension notice, keeping marketing-email consent separate from transactional notifications (Section 142).
- **FR-159**: System MUST support notification deep links to mentor profile, service detail, booking detail, session waiting room, message thread, action plan, review form, dispute, earnings, and payout, with a safe fallback page when the target resource is unavailable (Section 143).

### Analytics & Reporting Requirements

- **FR-160**: System MUST emit the defined analytics event taxonomy including `mentor_directory_viewed`, `mentor_searched`, `mentor_filter_applied`, `mentor_profile_viewed`, `mentor_saved`, `mentor_service_viewed`, `mentor_slot_selected`, `mentor_booking_started`, `mentor_booking_completed`, `mentor_booking_cancelled`, `mentor_booking_rescheduled`, `mentor_session_joined`, `mentor_session_completed`, `mentor_no_show_recorded`, `mentor_review_submitted`, `mentor_dispute_opened`, `mentor_refund_processed`, `mentor_payout_created`, `mentor_application_submitted`, and `mentor_application_approved` (Section 144).
- **FR-161**: System MUST track marketplace metrics: search-to-profile conversion, profile-to-service conversion, service-to-booking conversion, checkout completion, time to first available slot, average session price, booking volume, repeat booking, session completion, cancellation, no-show, refund, dispute, rating, mentor response time, mentor utilization, category supply-demand gap, member outcome score, platform revenue, and mentor earnings (Section 145).
- **FR-162**: System MUST track mentor supply metrics: approved mentors, active mentors, mentors with availability, available hours, booked hours, utilization, category coverage, language coverage, location coverage, mentor churn, time to first booking, and earnings distribution (Section 146).

### Data Integrity, Security & Privacy Requirements

- **FR-163**: System MUST enforce server-side authorization and mentor-role verification on every mentorship action, never trusting a client-asserted role (Section 154; Constitution Article I).
- **FR-164**: System MUST implement secure, atomic slot locking to prevent double-booking under concurrent requests (Section 154).
- **FR-165**: System MUST verify payment webhooks and calendar callbacks via signature validation before acting on them (Section 154).
- **FR-166**: System MUST issue short-lived, scoped meeting-room access tokens (Section 154).
- **FR-167**: System MUST encrypt identity documents and payout data at rest, with malware scanning on uploads and signed, time-limited file URLs for access (Section 154).
- **FR-168**: System MUST apply rate limiting, anti-CSRF protection, and XSS prevention across mentorship surfaces (Section 154).
- **FR-169**: System MUST maintain audit logging for administrative, financial, and staff-access actions, including dispute-evidence handling (Section 154).
- **FR-170**: System MUST implement review-manipulation detection and off-platform-scam monitoring (Section 154).
- **FR-171**: System MUST keep identity documents, payout data, and personal contact data private/hidden by default (Section 155).
- **FR-172**: System MUST correctly separate session notes by visibility class (private mentor / shared member / admin safety) at the data layer, not merely in UI rendering (Section 155; Section 70).
- **FR-173**: System MUST require mandatory recording consent before any recording occurs (Section 155; Section 65).
- **FR-174**: System MUST scope member-uploaded documents to the specific booking they were submitted for (Section 155).
- **FR-175**: System MUST minimize stored external-calendar event details to busy/free state where possible (Section 155).
- **FR-176**: System MUST disclose group-session participant visibility to all participants before or at session start (Section 155).
- **FR-177**: System MUST prevent mentors from exporting member data without explicit permission (Section 155).
- **FR-178**: System MUST apply the applicable legal data-retention policy to deleted-account data (Section 155).

### Localization & Accessibility Requirements

- **FR-179**: System MUST support Tamil, Tanglish, and English across mentor biographies (where provided), expertise taxonomy, service descriptions, booking flow, dates, timezones, currency, cancellation policies, notifications, reviews, support content, and disputes, while keeping original mentor-authored content always accessible in its original language (Section 157).
- **FR-180**: System MUST meet accessibility requirements including keyboard-operable mentor search, screen-reader-friendly mentor cards, accessible date picker and timezone selector, non-color-only booking-state indicators, clear price narration, video captions, accessible chat, visible recording indicators, form-error association, large touch targets, reduced-motion support, text-labeled ratings (not star/emoji-only), accessible calendar navigation, and high-contrast session controls (Section 156).

### Platform Reliability & UX State Requirements

- **FR-181**: System MUST NOT display incorrect zero-slot, zero-rating, or free-price placeholders during loading states (Section 160).
- **FR-182**: System MUST NOT show a client-rendered "booking success" or "payment success" state without backend confirmation of the payment and booking (Section 153; Constitution Article I).
- **FR-183**: System MUST support offline/low-network mobile behaviors: cached booking details, cached mentor profile, intake draft persistence, offline action-plan viewing, mentor session-note drafts, deliverable upload retry, and message retry (Section 153).

*Ambiguities flagged for clarification:*

- **FR-184**: System MUST define the exact grace-period duration (minutes) used to classify member/mentor no-show [NEEDS CLARIFICATION: Section 80/81 specify "grace period" and "failed to join within grace period" but do not state the duration; likely mentor-configurable per service but the default and bounds are unspecified].
- **FR-185**: System MUST define the exact slot-hold expiry duration used during checkout [NEEDS CLARIFICATION: Section 54 says "configurable" but no default value or min/max bounds are given].
- **FR-186**: System MUST define the exact dispute window length after session completion during which a dispute can be opened and earnings remain on hold [NEEDS CLARIFICATION: Section 91 references a "dispute window" and Section 105 a "review window" without stating durations].
- **FR-187**: System MUST define the specific compliance frameworks and credential types required per regulated category (legal, tax, investment, medical/mental-health, accounting, immigration) [NEEDS CLARIFICATION: Section 12 names the categories but not the specific credential/license verification standard per jurisdiction — likely varies by country and must be defined by legal/compliance teams per Constitution's Security & Compliance Baseline].
- **FR-188**: System MUST define the platform commission percentage/fee schedule per tier and category [NEEDS CLARIFICATION: Section 92 lists commission model types but no default rates or tier thresholds are specified].
- **FR-189**: System MUST define minimum payout threshold amount(s) and settlement delay duration [NEEDS CLARIFICATION: Section 96 lists threshold-based payout as an option but does not specify the amount or delay].

## Key Entities *(include if feature involves data)*

- **Mentor Application**: An applicant's in-progress or submitted onboarding record; holds all Section 8 fields, links to the eventual Mentor Profile, and carries the Section 9 status lifecycle (Draft through Archived).
- **Mentor Profile**: The published, member-facing representation of an approved mentor (Section 14 fields); has profile status, featured status, ratings, and links to Services, Verification, and Quality Score.
- **Mentor Verification**: The identity and professional verification record(s) for a mentor, including verification method, status (Self-declared → Verified/Rejected/Expired), evidence references, and expiry/re-verification triggers (Sections 10-11).
- **Credential**: A specific regulated-category credential/license attached to a mentor, with type, jurisdiction, issuing body, expiry date, and verification status (Section 12).
- **Mentor Expertise**: A mentor's declared and/or verified skill/expertise entry, with self-assessed level, verified level, evidence, and linked services (Section 19).
- **Mentor Language**: A language a mentor can conduct sessions in, used in filtering and matching.
- **Mentor Service**: A bookable service listing owned by a mentor (Section 22 fields: price, duration, format, capacity, policies, etc.), of one of the Section 21 service types.
- **Service Policy**: The cancellation/reschedule/refund policy attached to a service, either inherited from platform default or an approved custom policy (Section 79).
- **Availability Rule**: A recurring weekly availability definition for a mentor (day, time range, service types, mode, effective/expiry dates) (Section 44).
- **Availability Exception**: A date-specific addition or block (holiday, partial-day, emergency block) overriding recurring availability (Section 45).
- **Calendar Integration**: A mentor's connection to an external calendar provider (Google, Outlook, internal), including sync direction and privacy-minimized busy-block data (Section 46).
- **Calendar Busy Block**: A busy/free time interval read from an external calendar, used in availability computation.
- **Booking**: The core transaction record linking a member, mentor, service, and slot; carries the Section 53 status lifecycle, booking reference, price paid, and snapshotted commission rate.
- **Booking Slot Hold**: A temporary lock on a specific mentor time slot during checkout (Section 54), with expiry and checkout-session linkage.
- **Booking Intake**: The member's answers to the pre-session intake form for a specific booking (Section 55).
- **Booking Attachment**: A member-uploaded document scoped to a specific booking (Section 56).
- **Session**: The scheduled/executed meeting instance tied to a confirmed Booking; includes format, video-room/meeting-link reference, and completion state.
- **Session Participant**: A member or mentor's role-scoped presence/permission record within a given Session.
- **Session Attendance**: Attendance signal records (join logs, join duration, webhook confirmation, manual confirmation) used for no-show classification (Section 82).
- **Session Technical Log**: Technical event logs (connection issues, reconnects, outages) retained for dispute review (Section 68).
- **Session Note**: A note attached to a Session, typed as private-mentor, shared-member, or admin-safety, with data-level visibility separation (Section 70).
- **Action Plan**: The post-session plan record (objective, key findings, recommended actions) tied to a Session (Section 71).
- **Action Item**: An individual actionable line within an Action Plan, with owner, due date, priority, and status.
- **Deliverable**: A promised or delivered output tied to a Service/Session (Section 72), tracked against what the service listing promised.
- **Mentor Message Context**: The permitted messaging context/thread between a member and mentor (pre-booking, prep, follow-up, package, support) (Section 74).
- **Cancellation**: A record of a member- or mentor-initiated cancellation, with reason, timing relative to policy windows, and resulting refund/credit outcome.
- **Reschedule Request**: A pending or resolved request to move a booking's date/time, with notice, approval, and price-difference handling (Section 76).
- **No-show Record**: A classified member- or mentor-no-show event with evidence, outcome, and appeal state (Sections 80-81).
- **Review**: A member's post-session rating and feedback on a mentor, with component scores, written text, outcome tags, and lifecycle status (Sections 105-107).
- **Review Response**: A mentor's single response to a Review (Section 109).
- **Review Report**: A mentor's report against a Review requesting moderation (Section 111).
- **Dispute**: A formal disagreement over a Booking/Session, with reason, evidence, status lifecycle, and reviewer resolution (Sections 83-85).
- **Dispute Evidence**: Evidence items (messages, files, logs, recordings-where-permitted) attached to a Dispute.
- **Refund**: A monetary or credit reversal tied to a Booking's original payment, with type (full/partial/credit/etc.) and tax/fee recalculation (Section 86).
- **Session Credit**: A stored-value credit usable toward future bookings, with value, eligible service/mentor scope, expiry, and transferability (Section 90).
- **Mentor Earning**: A per-booking earning record for a mentor, with gross amount, commission deducted, taxes withheld, and status lifecycle (Sections 93-94).
- **Commission**: The commission model/rate applied to a booking, snapshotted immutably at booking-confirmation time (Section 92; Constitution Article IV).
- **Payout Account**: A mentor's encrypted payout/banking and tax-identity configuration (Section 95).
- **Payout**: A disbursed (or attempted) payment of a mentor's available balance, with schedule, status lifecycle, and reference/statement (Sections 96-98).
- **Tax Document**: Earnings statements, commission invoices, tax-deduction statements, annual summaries, and payout receipts generated for a mentor (Section 99).
- **Quality Score**: The internal, non-public composite score computed from rating, cancellations, no-shows, disputes, refund rate, and other quality inputs (Section 113).
- **Quality Review**: A record of a quality improvement plan cycle applied to an underperforming mentor (Section 120).
- **Mentor Restriction**: An applied limitation on a mentor (booking disabled, category restricted, payout held) resulting from suspension, quality issues, or credential lapse.
- **Safety Incident**: A logged trust-and-safety event (harassment report, off-platform payment pressure, crisis escalation, secret recording attempt, etc.).
- **Audit Log**: An immutable record of administrative, financial, and staff-access actions across the mentorship module (Section 154; Constitution Security & Compliance Baseline).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can go from opening the mentor discovery page to a confirmed, paid booking without encountering a double-booked or already-taken slot, across concurrent booking attempts on the same slot (derived from Sections 47, 54, 60, 67; Definition of Done item 5: "Double booking prevent aaganum").
- **SC-002**: 100% of confirmed bookings retain the exact commission rate that was in effect at their confirmation time, verified by re-checking historical bookings after a subsequent commission-rate change (Section 92; Constitution Article IV).
- **SC-003**: 100% of mentor no-show incidents that are confirmed through the dispute process result in a member refund/credit and a corresponding mentor payout hold, with no manual reconciliation gap (Section 81, Section 85).
- **SC-004**: Zero public mentor profiles display guaranteed-income, guaranteed-job, or guaranteed-outcome claims at any time, verified by periodic content audit (Section 3.3, Section 17; Constitution Article III).
- **SC-005**: 100% of session notes marked "private mentor note" remain inaccessible to the member across all client surfaces (web, mobile), verified by access-control testing (Section 70, Section 155).
- **SC-006**: 100% of regulated-category mentor profiles (legal, tax, investment, medical/mental-health, accounting, immigration) display the required jurisdiction disclaimer before any regulated-category booking can be completed (Section 12, Section 20).
- **SC-007**: New mentors with zero reviews remain discoverable through at least one discovery-page surface at all times post-approval, rather than being fully absent from discovery (Section 115; Definition of Done acceptance criteria).
- **SC-008**: Search results and mentor cards never include suspended or unpublished mentors, verified continuously via automated status-filter checks (Section 34).
- **SC-009**: The mentor payout cycle (session completion through "Paid" status) completes within the mentor's configured payout schedule for at least the platform's target percentage of eligible payouts, with all failures surfaced with a specific, actionable reason to the mentor (Sections 91, 96-98).
- **SC-010**: Every booking confirmation screen and pre-payment price summary displays the full price breakdown (base price, discounts, taxes, fees, total) with zero instances of charges appearing only after payment ("no hidden charges") (Section 88).

## Assumptions

- The detailed platform payment architecture (payment provider integration, tax/GST calculation engine, invoice generation, order-level ledger) is owned by Volume 09 (Membership, Payments, Revenue) and this spec only covers mentor-marketplace-specific payment touchpoints (checkout steps, price breakdown display, commission snapshotting) — full payment-engine requirements are out of scope here and referenced, not duplicated (Section 87: "Detailed platform payment architecture Volume 09-la define pannappadum").
- Mentor payout settlement, disbursement rails, and financial reconciliation ultimately post into the platform's central financial ledger described in Volume 09; this spec defines the mentor-side earning/payout lifecycle but assumes Volume 09's ledger is the system of record for double-entry accounting (Constitution Article V).
- Mentor community content (public posts, articles, community answers) and self-promotion moderation limits are governed by Volume 05 (Community, Moderation, Trust & Safety) rules; this spec defines only that mentors may create such content, not the moderation engine itself (Section 104, Section 74).
- Mentor gamification/reputation surfaces (badges, leaderboards, streak-like recognition, if any apply to mentors) intersect with Volume 06 (Gamification & Rewards); Section 113's quality score is a distinct internal-only concept from any public gamification reputation and is treated here as mentor-marketplace-owned.
- Instructor-specific course/cohort/assignment functionality is governed by Volume 04 (Learning Management System); this spec defines only that a mentor may also hold an instructor role and lists instructor capabilities at a summary level (Section 103).
- Detailed API endpoint contracts and database schema are deferred to Volume 15 and Volume 14 respectively per the source document (Sections 148-149); this spec defines entities and functional behavior, not wire-level contracts.
- Exact numeric thresholds (grace periods, slot-hold expiry, dispute window length, payout minimum threshold, commission rates, future-booking-window defaults) are intentionally left mentor-/admin-configurable per the source text's repeated use of "configurable" and "configure pannalaam" — default values are flagged under `[NEEDS CLARIFICATION]` in the Functional Requirements rather than invented.
- Regulated-category credential/license verification standards are jurisdiction-specific and are assumed to be defined by TBT's legal/compliance function per the Constitution's Security & Compliance Baseline, not invented in this spec.
- "Third-party verification integration" for identity checks (Section 10) is assumed optional/pluggable rather than a single mandated vendor, consistent with the source text ("optional").
- External video-provider support (Section 64) is assumed to start with a to-be-determined initial provider set ("future-configurable" per source) rather than a fixed named list.
- AI-assisted capabilities explicitly marked P2/Expansion in the source (AI mentor matching, AI session-summary assistance, AI action-plan suggestions) are out of scope for the initial implementation covered by this spec's P1-P3 user stories and are assumed to fall under Volume 08 (AI Assistant Platform) governance (Constitution Article II) when built.
