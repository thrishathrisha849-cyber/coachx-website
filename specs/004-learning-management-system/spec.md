# Feature Specification: Learning Management System: Courses, Assessments & Certification

**Feature Branch**: `004-learning-management-system`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 04 of the TBT One Enterprise PRD — the complete Learning Management System covering the learning content hierarchy (Learning Path → Program → Course → Module → Lesson → Learning Activity), course access/entitlement, drip content and prerequisites, video/audio/text/PDF/live-class lesson delivery, quizzes and question banks, assignments with rubric grading and peer review, certification issuance and public verification, instructor course-building tools, course cloning and versioning, organization/bulk learning management, learning analytics and at-risk detection, AI-assisted learning, and academic integrity enforcement. Source: `document 1/Document 1 (3).md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enroll and Gain Access via an Entitlement Type (Priority: P1)

A learner discovers a course in the catalog and enrolls using whichever entitlement they hold — free access, an active membership plan, an individual purchase, a program enrollment, an organization assignment, a coupon, a scholarship, or an invite code. The system verifies that entitlement on the server before granting access to any lesson, and clearly communicates why access was denied when it was not (payment required, course full, prerequisite incomplete, etc.).

**Why this priority**: Without a working, server-verified enrollment and entitlement path, no other LMS capability (lessons, quizzes, certificates) can be safely exposed. This is the P0 gate for every other story.

**Independent Test**: Can be fully tested by enrolling a test learner in a course under each entitlement source (free, membership, purchase, org-assigned, coupon) and confirming lesson content is served only after server-side entitlement verification, with each unsupported case (e.g., membership required but absent) producing the correct failure reason.

**Acceptance Scenarios**:

1. **Given** a learner with an active membership that includes a course, **When** they open the course page and click enroll, **Then** the system checks entitlement, prerequisites, and capacity server-side, creates an enrollment record, initializes progress, and shows the course welcome/overview screen.
2. **Given** a learner without the required membership or purchase, **When** they attempt to enroll, **Then** the system denies enrollment with a specific reason (`COURSE_ACCESS_DENIED` / membership or payment required) and does not create an enrollment record.
3. **Given** an enrolled learner whose access is time-limited (fixed number of days, or "until membership active"), **When** their access window lapses, **Then** the access state transitions to Expired, the expiry is clearly displayed, and further lesson requests are denied server-side even if the client still shows cached content.
4. **Given** a course at maximum capacity, **When** a new learner attempts to enroll, **Then** the system offers a waitlist join instead of enrollment and records join date, priority, and notification status.

---

### User Story 2 - Consume Lessons and Track Multi-Condition Completion (Priority: P1)

A learner works through video, audio, text, and PDF lessons on web and mobile. Each lesson's "complete" state is only granted when the learner satisfies the lesson's configured completion rule(s) — which may combine multiple conditions (e.g., watch 80% of the video **and** download the worksheet **and** submit a response) — never merely because a video was opened. Progress follows the learner across devices, including through offline mobile use.

**Why this priority**: This is the core day-to-day learning loop and the direct implementation of the platform's "no vanity-metric completion" principle; it is required for progress tracking, drip unlocks, and certificate eligibility to mean anything.

**Independent Test**: Can be fully tested by configuring a lesson with a multi-condition completion rule, consuming it partially (video watched but worksheet not downloaded), confirming it remains incomplete, then satisfying all conditions and confirming completion is recorded and synced across a second device.

**Acceptance Scenarios**:

1. **Given** a video lesson configured with an 80% watch-minimum completion rule, **When** a learner watches 40% and closes the player, **Then** the lesson remains "in progress," the furthest-watched position is stored, and resuming the lesson later starts from that position.
2. **Given** a lesson requiring both minimum watch AND worksheet download, **When** the learner satisfies only the watch condition, **Then** the lesson is not marked complete until the download condition is also satisfied.
3. **Given** a learner completes a lesson offline on the mobile app, **When** the device reconnects, **Then** the completion event is queued and synced idempotently, server state is authoritative in case of conflict, and the sync is timestamped and device-tagged for audit.
4. **Given** a learner who has completed all mandatory lessons in a module but skipped optional lessons, **When** module progress is calculated, **Then** the module shows complete (since optional lessons do not block completion unless explicitly configured to).

---

### User Story 3 - Attempt a Quiz or Assessment (Priority: P1)

A learner takes a practice quiz, graded quiz, or final assessment built from single/multiple-choice, true/false, fill-in-the-blank, matching, ordering, short/long answer, numeric, or file-upload questions, under the configured attempt limits, time limit, and randomization rules, and receives a scored result with pass/fail status.

**Why this priority**: Quizzes gate module/course progression and certificate eligibility in most course designs and are explicitly called out as MVP-critical (P0) alongside enrollment and lessons.

**Independent Test**: Can be fully tested by configuring a graded quiz with a passing score and two allowed attempts, taking it once to fail and once to pass, and confirming the result screen, retake eligibility, and downstream lesson/module unlock all reflect the correct state.

**Acceptance Scenarios**:

1. **Given** a quiz with a 10-minute time limit, **When** the learner's timer expires before submission, **Then** the system auto-submits the in-progress answers, scores them, and shows the result rather than losing the attempt.
2. **Given** a learner has exhausted their allowed attempts, **When** they try to start another attempt, **Then** the system blocks the attempt with `QUIZ_ATTEMPT_LIMIT_REACHED` and shows the retake rules (if any retake delay or eligibility path exists).
3. **Given** a question is deleted from the question bank after a learner already attempted the quiz containing it, **When** that historical attempt's result is viewed, **Then** the recorded score and answer history remain intact and interpretable.
4. **Given** a network interruption during quiz submission, **When** connectivity is restored, **Then** the system prevents duplicate submissions and reconciles to a single authoritative attempt record.

---

### User Story 4 - Submit an Assignment and Receive Rubric-Graded Feedback (Priority: P1)

A learner submits a text response, file upload, link, or media submission against an assignment with instructions, a due date, and a rubric. An instructor reviews the submission against the rubric, scores it, leaves feedback, and either approves it or requests changes; the learner can resubmit and is notified when new feedback is available.

**Why this priority**: Assignments are the primary "action, not consumption" mechanism (multi-condition, practical-outcome learning) and are required for course/certificate completion in most course designs; explicitly P0.

**Independent Test**: Can be fully tested end-to-end by submitting a file-upload assignment, having an instructor score it against a rubric and request changes, resubmitting, and confirming the instructor approves it and the learner is notified with the rubric-based feedback visible.

**Acceptance Scenarios**:

1. **Given** an assignment with allowed file types and a maximum size, **When** a learner uploads an unsupported file type, **Then** the system rejects it with a user-friendly error before submission and does not consume an attempt.
2. **Given** a submitted assignment under instructor review, **When** the instructor scores it against the configured rubric and requests changes, **Then** the assignment status moves to "Changes requested," the learner is notified, and the previous submission remains visible alongside the new one after resubmission.
3. **Given** an assignment submitted after its due date, **When** it is received, **Then** it is flagged "Late submitted" and the configured late policy is applied.
4. **Given** an assignment approved by the instructor, **When** the learner views their course, **Then** the assignment status shows "Approved" and contributes to module/course/certificate completion eligibility as configured.

---

### User Story 5 - Earn and Publicly Verify a Certificate (Priority: P1)

Once a learner satisfies every server-evaluated eligibility rule for a course (mandatory lessons complete, passing assessment, assignment approved, attendance threshold, final project approved, payment settled, identity verified, no active misconduct restriction), the system generates a certificate with a unique credential ID and makes it independently verifiable by anyone via a public page or QR scan, without requiring the verifier to log in.

**Why this priority**: Certification is the platform's core credibility/trust deliverable and an explicit P0 MVP item; it is also the terminal state that every other LMS capability (progress, assessment, assignment) feeds into.

**Independent Test**: Can be fully tested by bringing a test learner to 100% eligibility, confirming certificate generation with a unique verification code, then visiting the public verification URL as an anonymous, logged-out user and confirming the correct status (Valid) and minimal learner data are shown.

**Acceptance Scenarios**:

1. **Given** a learner has completed all mandatory lessons but has not passed the required final assessment, **When** certificate eligibility is evaluated, **Then** the certificate is not issued and the missing eligibility condition is surfaced to the learner.
2. **Given** a learner meets every configured eligibility condition, **When** eligibility is (re-)evaluated server-side, **Then** a certificate is generated with a unique credential ID, PDF, and public verification URL, the learner is notified, and the dashboard updates.
3. **Given** a valid, publicly issued certificate, **When** anyone enters its credential ID or scans its QR code on the public verification page, **Then** the page shows status "Valid" with learner name, credential, issue date, and issuing organization — without requiring the verifier to authenticate.
4. **Given** a certificate is later revoked for academic misconduct, **When** an authorized role revokes it with a reason and approval, **Then** the action is audit logged, the learner is notified, and the public verification page immediately shows status "Revoked."

---

### User Story 6 - Progress Through Drip-Released, Prerequisite-Gated Content (Priority: P2)

A course creator configures modules and lessons to unlock only after a defined condition — immediately, N days after enrollment, on a fixed date, after the previous lesson/module completes, on instructor release, on a cohort schedule, or after an assessment is passed — and configures prerequisites (course/module/lesson completion, assessment pass, assignment approval, membership level, mentor/admin approval) that gate access to later content. Learners see locked content with a clear unlock condition, date, or countdown.

**Why this priority**: Structured, non-random progression is a stated core principle (Sec 3.2) and is required for cohort-paced and skill-building course designs, but the platform can launch with simpler flexible/sequential-only courses first — hence P2, not P1.

**Independent Test**: Can be fully tested by configuring a module to unlock 3 days after enrollment and a second module to require passing the first module's assessment, then verifying a test learner cannot access either module early, sees the correct unlock condition/countdown, and gains access exactly when the condition is met.

**Acceptance Scenarios**:

1. **Given** a module configured to drip "7 days after enrollment," **When** a learner views the course on day 3, **Then** the module is shown locked with its unlock date visible, and any attempt to directly request its lesson content is denied server-side.
2. **Given** a lesson with a prerequisite of "previous module assessment passed," **When** the learner has not yet passed that assessment, **Then** the lesson displays locked with a prerequisite CTA linking back to the assessment.
3. **Given** an instructor attempts to configure Module B as a prerequisite of Module A while Module A is already a prerequisite of Module B, **When** they save the configuration, **Then** the system detects the circular dependency and blocks the save with an explanatory error.
4. **Given** a cohort-based course, **When** the cohort's scheduled release date for Module 2 arrives, **Then** all learners in that cohort gain access simultaneously regardless of individual enrollment date.

---

### User Story 7 - Build and Publish a Course via the Course Builder (Priority: P2)

An instructor or admin uses the guided course builder (basic information → learning outcomes → audience/prerequisites → curriculum → content → assessments → access/pricing → certificate → SEO → review and publish) to author a new course, with autosave, version history, and preview at each step, and the course moves through a review workflow (Draft → Submitted for review → Changes requested → Approved → Scheduled → Published) before learners can see it. Final publish permission is held separately from content-editing permission.

**Why this priority**: Required for the content team to scale beyond a handful of hand-built launch courses, but the platform can launch (P0) with a small number of manually seeded courses — course-authoring tooling is a P2 growth-critical capability per the source's MVP tiering.

**Independent Test**: Can be fully tested by having an instructor (without publish rights) build a complete course through all ten builder steps, submit it for review, have a reviewer request changes, resolve them, get approval, and confirm that only a user holding the separate "publish" permission can move it to Published status.

**Acceptance Scenarios**:

1. **Given** an instructor with content-edit but not publish permission, **When** they complete the course builder and click "Submit for review," **Then** the course enters "Submitted for review" state and the Publish action remains unavailable to them.
2. **Given** a reviewer requests changes on a submitted course, **When** the instructor edits and resubmits, **Then** the workflow state and every transition are captured in an audit log with author/reviewer/publisher role attribution.
3. **Given** a course is in Draft status, **When** a learner without instructor/admin access attempts to view it, **Then** access is denied — only admins and assigned instructors can view draft content.
4. **Given** a course has been Approved and Scheduled with a future release date, **When** that date arrives, **Then** the course automatically becomes visible to eligible learners without manual intervention.

---

### User Story 8 - Clone an Existing Course for Reuse (Priority: P2)

An admin clones an existing course — as a full clone, curriculum-only, content-without-enrollments, assessment bank, certificate settings, or translation variant — to quickly produce a new course offering (e.g., a cohort re-run or a translated version), without carrying over any prior enrollments, learner progress, or financial data.

**Why this priority**: Significantly accelerates content operations once the catalog is non-trivial, but is not required for initial launch — a P2 growth/operations capability.

**Independent Test**: Can be fully tested by cloning a published course with existing enrollments and progress data using "curriculum only," then confirming the new course contains the same modules/lessons but zero enrollments, zero progress records, and no linkage to the original course's financial/order history.

**Acceptance Scenarios**:

1. **Given** a published course with 500 enrolled learners, **When** an admin performs a full clone, **Then** the resulting course is an independent draft with its own ID, containing curriculum and content but no learners, no progress, and no order/payment history.
2. **Given** an admin selects "translation variant" clone, **When** the clone completes, **Then** the new course is linked to the source course as a language variant and inherits the source's structure for translation.
3. **Given** an admin clones only the "assessment bank" from a course, **When** the clone completes, **Then** only quizzes/question bank content is copied, with no curriculum, lessons, or certificate settings carried over.

---

### User Story 9 - Use AI-Assisted Learning and Peer Review Within Integrity Bounds (Priority: P3)

A learner uses platform AI to get a lesson summary, a quiz explanation, a study plan, translation assistance, practice questions, or brainstorming support for an assignment, with the system never presenting AI output as unquestionably correct and never letting AI directly complete graded work for the learner. Separately, a learner's assignment may be routed to peer reviewers (anonymous or visible, per configuration) whose rubric-based reviews inform — but do not automatically override — the instructor's final grade, subject to instructor override and moderation. Where required, learners can disclose their AI use on a submission, and suspected misconduct (plagiarism, unauthorized collaboration) can be flagged into an investigation workflow with certificate hold and appeal.

**Why this priority**: Both capabilities are explicitly marked P2/P2-adjacent-to-P3 ("peer review" is P1-growth, "AI tutoring" is P2-expansion in the source's MVP tiers) and are enhancements to the core learning loop rather than blockers for it — grouped here as P3 since AI-in-learning specifically is listed under "P2 – Expansion."

**Independent Test**: Can be fully tested by (a) requesting an AI lesson summary and confirming the response is presented as advisory rather than authoritative, and (b) submitting an assignment for peer review, collecting the configured number of anonymous rubric-scored reviews, and confirming the instructor can view, weigh, and override the peer score before finalizing the grade.

**Acceptance Scenarios**:

1. **Given** a learner asks the AI assistant to explain a quiz answer, **When** the AI is unavailable or fails, **Then** a deterministic non-AI fallback (e.g., the pre-authored explanation text) is shown instead of a broken experience.
2. **Given** a graded assignment, **When** a learner asks AI to "write the submission for me," **Then** the system's AI usage policy prevents the AI from directly producing a submittable graded answer on the learner's behalf.
3. **Given** an assignment configured for 2 required anonymous peer reviews, **When** both reviews are submitted using the review rubric, **Then** the instructor sees both peer scores/comments alongside their own review screen and can choose to include or override the peer score in the final grade per the admin-configured policy.
4. **Given** a submission is flagged by similarity detection as a potential plagiarism match, **When** the flag is raised, **Then** the submission enters an investigation workflow, any pending certificate issuance is held, and the learner retains an appeal path.

---

### Edge Cases

- What happens when two prerequisite/module configurations reference each other, forming a circular dependency (Module A requires Module B, Module B requires Module A)? The system must detect and block this at configuration time, not at learner-access time (Sec 24).
- How does the system reconcile a lesson marked complete offline on mobile with a conflicting server-side state (e.g., the lesson was reset by an admin while the device was offline)? Server-authoritative state must win, with the conflict, timestamp, and device source captured for audit (Sec 28).
- What happens when a learner's course-access entitlement (membership, program enrollment, organization license) expires while they have an in-progress, unsubmitted quiz attempt or a drip-unlocked module already open? The system must apply the configured expiry behavior consistently to in-flight activity, not just new page loads (Sec 10.2, 24).
- What happens when a submission is flagged by similarity/plagiarism detection *after* the related certificate has already been issued? The certificate must be able to enter a hold/investigation state even post-issuance, with the public verification page reflecting the updated status (Sec 56, 84).
- What happens when a course is refunded after its certificate has already been issued? The certificate policy (remain valid vs. revoke) must be explicitly resolved by configured policy, not left undefined, and learner progress must be preserved unless legal deletion applies (Sec 80).
- What happens when a live class's attendance record (used to satisfy a completion or certificate rule) is unreliable — e.g., the join/leave log shows a learner present for 0 minutes due to a provider glitch? Instructor manual override and verification must be available, and the override must be audit logged (Sec 22, 47).
- What happens when two learners attempt to claim the last open seat in a capacity-limited course/cohort at the same moment? The system must resolve this without double-booking, releasing the losing request to the waitlist (Sec 78, 79).
- What happens when a waitlist seat offer is not claimed within its time-limited reservation window? It must expire and pass automatically to the next-priority waitlisted user (Sec 79).
- What happens when a quiz question is deleted from the question bank after learners have already attempted quizzes containing it? Historical attempts and scores must remain valid and interpretable even though the live question bank no longer contains that question (Sec 35).
- What happens when a published course's source lesson content is updated after translated variants already exist? Every affected translated variant must be flagged "Outdated" rather than silently continuing to show stale-but-unflagged content (Sec 71).
- What happens when a bulk CSV enrollment import contains users who are already enrolled in the target course? Duplicate enrollment must be handled safely (no duplicate enrollment records, no duplicate welcome emails) and reported in the import's error/summary report (Sec 77).
- What happens when a learner attempts a final quiz submission or final assignment submission while offline on the mobile app? Final quiz submission, certificate issuance, and payment are explicitly disallowed offline; final assignment submission is disallowed offline unless an explicit queued-submission policy has been approved (Sec 62).
- What happens when peer reviewers assigned to review a submission have a conflict of interest, fail to respond by the review deadline, or the anonymity configuration is challenged? Instructor moderation and override must remain available regardless of peer-review completion state (Sec 44).

## Requirements *(mandatory)*

### Content Hierarchy & Catalog Requirements

- **FR-001**: System MUST structure all learning content in the hierarchy Learning Path → Program → Course → Module → Lesson → Learning Activity → Assessment → Outcome, and MUST NOT present content as an unordered/random playlist.
- **FR-002**: System MUST support Learning Path entities carrying: path ID, title, slug, subtitle, description, cover image, target persona, primary goal, experience level, language, estimated duration, weekly commitment, course count, milestone count, instructor/curator, access type, membership requirements, status, display order, and SEO metadata.
- **FR-003**: A Learning Path MUST be able to contain required courses, optional courses, milestone assessments, challenges, events, mentor checkpoints, and business outcomes.
- **FR-004**: System MUST support Path Access Types: Free, Membership included, Individual purchase, Invite only, Organization assigned, Cohort based.
- **FR-005**: On Learning Path enrollment, system MUST check prerequisites, check access, optionally run a starting assessment, create the course order, initialize the progress record, update dashboard recommendations, and send a welcome notification.
- **FR-006**: System MUST display Learning Path progress showing overall percentage, courses completed, current course, current milestone, estimated remaining time, next action, and certificate eligibility.
- **FR-007**: Learning Path completion MUST require all mandatory courses complete, required assessments passed, mandatory assignments approved, required event attendance where applicable, and final project approved.
- **FR-008**: System MUST support Program entities that combine courses, live classes, assignments, challenges, a community group, mentor sessions, a final project, and certification.
- **FR-009**: System MUST support Program Types: self-paced, cohort, certification, bootcamp, mastermind, corporate, and hybrid.
- **FR-010**: Program entities MUST carry: title, code, description, outcome, duration, start/end date, application deadline, enrollment limit, delivery format, language, instructors, mentors, courses, events, community group, assignments, completion rules, certificate, price, membership eligibility, and status.
- **FR-011**: System MUST support Program states: Draft, Review, Scheduled, Enrollment open, Enrollment closing, Active, Completed, Archived, Cancelled.
- **FR-012**: System MUST support Cohort management with cohort name, program, start/end dates, capacity, timezone, live schedule, instructor team, mentor team, community group, enrollment status, and learner list.
- **FR-013**: System MUST support Course Types: self-paced, cohort-based, instructor-led, live, hybrid, certification, mini-course, free, paid, membership, organization-only, invite-only, and internal staff training.
- **FR-014**: Course entities MUST carry the full defined field set: course ID/code, title, slug, subtitle, short/full description, learning outcomes, cover image, trailer video, category, subcategory, tags, language, difficulty, estimated duration, weekly commitment, instructor/co-instructors, prerequisites, target audience, tools required, certificate availability, access type, price, membership inclusion, publication status, enrollment status, start/end dates, rating, review count, learner count, completion rules, drip settings, SEO metadata, created-by, reviewed-by, published-by, and version.
- **FR-015**: System MUST support Course statuses Draft, Content creation, Internal review, Instructor review, QA review, Approved, Scheduled, Published, Unlisted, Enrollment paused, Archived, and Retired, with the following per-status access behavior: Draft is visible only to admins and assigned instructors; Scheduled is hidden from learners until the public release date; Published is accessible to eligible users; Unlisted is accessible only via direct link or explicit assignment; Archived preserves existing learner progress while blocking new enrollment; Retired marks the course replaced or permanently unavailable.
- **FR-016**: System MUST support Module fields (title, description, outcome, sequence, estimated duration, lessons, assignment, assessment, completion rule, release rule, prerequisite module, optional/mandatory status) and Module states (Locked, Available, In progress, Completed, Failed, Awaiting review).
- **FR-017**: System MUST support Lesson types: Video, Audio, Rich text, PDF, Presentation, Image, External embed, Live session, Quiz, Assessment, Assignment, Project, Survey, Reflection, Download, SCORM/external package (future-ready), Interactive tool, and AI-assisted exercise.
- **FR-018**: Every Lesson MUST carry: lesson ID, title, slug, type, description, module, order, duration, mandatory status, preview status, content source, transcript, captions, resources, completion rule, release rule, prerequisite, download permission, discussion-enabled flag, notes-enabled flag, last-updated timestamp, version, and status.
- **FR-019**: System MUST render a lesson player with, on desktop, a curriculum sidebar, lesson title, progress indicator, content player, notes, resources, discussion, previous/next navigation, and mark-complete control; and on mobile, a content-first layout with collapsible lesson info, bottom previous/next controls, download button, notes, resources, and discussion.
- **FR-020**: Course overview screen MUST show title, cover, instructor, description, outcomes, progress, current lesson, curriculum, total lessons, total duration, certificate status, announcements, upcoming live sessions, resources, discussion, reviews, and support, with a context-appropriate primary CTA (Start Course / Continue Learning / Resume Lesson / Complete Assignment / Take Assessment / View Certificate / Access Expired).

### Entitlement & Access Requirements

- **FR-021**: System MUST support course access grant sources: free access, membership plan, individual purchase, program enrollment, organization assignment, admin grant, coupon grant, scholarship, trial access, and invite code.
- **FR-022**: System MUST verify entitlement server-side on every lesson content request, not only at initial enrollment.
- **FR-023**: System MUST support Access States: Eligible-not-enrolled, Enrolled, Active, Completed, Expired, Revoked, Refunded, Suspended, Prerequisite incomplete.
- **FR-024**: System MUST support Access Expiry models — lifetime, fixed number of days, until membership active, until program end date, until organization license ends — and MUST clearly display the applicable expiry date to the learner.
- **FR-025**: System MUST execute the Course Enrollment Flow in order: open course page → entitlement check → prerequisite check → capacity check → terms/declaration capture where required → create enrollment record → initialize course progress → open welcome lesson/overview → send notification and email → update dashboard.
- **FR-026**: System MUST reject enrollment with a specific failure reason for each of: membership required, payment required, course full, enrollment closed, prerequisite incomplete, region restricted, organization license unavailable, and account restricted.
- **FR-027**: System MUST allow learners to save eligible-but-locked courses to a wishlist, with notify-when-available, an optional price-drop alert, an enrollment-open alert, and a dashboard "saved" section.
- **FR-028**: System MUST support course capacity controls — maximum enrollments, reserved seats, waitlist, organization allocation, manual override — and MUST release seats on cancellation, payment failure, expiry, or admin action.
- **FR-029**: System MUST maintain a Waitlist recording user, course/cohort, join date, priority, referral source, notification status, and offer expiry; when a seat opens, the system MUST invite the next-priority user with a time-limited reservation that expires and passes to the next user if unclaimed.
- **FR-030**: On payment refund, system MUST apply the configured access policy (immediate revoke / revoke at end of billing period / manual review / retain free content), MUST preserve learner progress unless legal deletion is required, and MUST apply the configured certificate policy (remain valid or revoke) for any certificate already issued.
- **FR-031**: On course retirement, system MUST stop new enrollment, enforce an existing-learner access deadline, suggest a replacement course, apply the configured certificate policy, support progress export, publish an announcement, and retain an archive copy per retention policy.
- **FR-032**: System MUST support bulk enrollment via CSV import with user/group selection, course assignment, start date, deadline, and notification, MUST produce an error report for failed rows, and MUST handle duplicate enrollment attempts safely without creating duplicate enrollment records.
- **FR-033**: Organization admins MUST be able to assign courses, create cohorts, invite users, track completion, set deadlines, download reports, view certificates, remove access, and configure mandatory learning for their organization's members, and MUST NOT be able to access a learner's private notes or unrelated personal activity.

### Drip Content & Prerequisite Requirements

- **FR-034**: System MUST support drip release rules: immediately, X days after enrollment, fixed date, after previous lesson completion, after previous module completion, instructor release, cohort schedule, and assessment pass.
- **FR-035**: Locked content MUST display a (configurably visible/hidden) title, the unlock condition, the unlock date, a countdown, and a prerequisite CTA.
- **FR-036**: System MUST support prerequisite types: course completion, module completion, lesson completion, assessment pass, assignment approval, membership level, mentor approval, and admin approval.
- **FR-037**: System MUST detect and prevent circular prerequisite dependencies at configuration time, blocking the save rather than surfacing the failure to a learner at access time.
- **FR-038**: System MUST support course sequencing modes: Sequential (next lesson unlocks only after current lesson completion), Flexible (all available lessons open), Hybrid (core lessons sequential, optional resources open), and Instructor-Controlled (instructor manually releases content).

### Lesson Content & Delivery Requirements

- **FR-039**: Video lessons MUST provide play/pause, seek, volume, mute, playback speed, captions, quality selection, fullscreen, picture-in-picture where supported, previous/next lesson navigation, and resume playback.
- **FR-040**: System MUST track, per video lesson, playback started, watched duration, furthest watched position, current position, completion, rewatch, playback speed, and device.
- **FR-041**: Video lesson completion rule MUST be configurable as manual mark-complete, minimum watch percentage, watch full video, complete attached activity, or instructor approval, with a configurable default minimum watch percentage. [NEEDS CLARIFICATION: the source states a "default recommended minimum configurable percentage" for watch-based completion without stating the actual default number — needs a concrete default value, e.g., 80% or 90%.]
- **FR-042**: On lesson re-open, system MUST resume playback from the last valid position (with a restart option available), synchronized across devices, and MUST correctly handle the near-end-of-video completion edge case.
- **FR-043**: System MUST support adaptive video streaming with Low/Medium/High/Auto quality variants.
- **FR-044**: System MUST support Tamil captions, English captions, an optional downloadable transcript, a searchable transcript, and timestamp navigation for video lessons.
- **FR-045**: System MUST protect video delivery via signed URLs with token expiry, domain restrictions, and direct-source-URL concealment with basic download prevention, while the product explicitly acknowledges that screen recording cannot be fully prevented.
- **FR-046**: Audio lessons MUST provide play/pause, seek, speed, duration, background playback, resume, download where allowed, transcript, and an optional mobile sleep timer, with completion rules configurable the same way as video lessons.
- **FR-047**: Text lessons MUST support headings, paragraphs, lists, quotes, images, tables, code blocks, callouts, embedded media, internal links, download links, and checklists, with readable typography, a table of contents, estimated reading time, mobile-friendly tables, translation variants, and accessible content; completion MUST be configurable as manual, scroll threshold, required checklist, or embedded activity completion.
- **FR-048**: PDF/document lessons MUST provide an in-app viewer with page navigation, search, zoom, bookmark, and resume-page, delivered via signed link with optional watermarking, content-based download permission, file scanning, and access logging.
- **FR-049**: System MUST support downloadable resource types (PDF, worksheet, spreadsheet, template, image, audio, ZIP, presentation, prompt pack), each carrying title, type, file size, version, download permission, access rule, description, and language, and MUST track resource-viewed and download-started/completed events.
- **FR-050**: System MUST support Live Class lessons integrating with Google Meet, Zoom, or other approved providers (native live streaming marked future-ready), carrying title, date, start/end time, timezone, host, meeting URL, capacity, recording, attendance rule, and reminder rules, with states Upcoming, Starting soon, Live, Completed, Cancelled, Rescheduled, and Replay available.
- **FR-051**: System MUST track live class attendance via join time, leave time, total attendance duration, and attendance percentage, with support for manual override and instructor verification.

### Completion & Progress Requirements

- **FR-052**: System MUST support lesson completion rule types — manual completion, minimum watch, read threshold, quiz pass, assignment submit, assignment approved, live attendance, external activity confirmation, AI exercise completion — and MUST allow a single lesson to combine multiple required conditions.
- **FR-053**: System MUST NOT count a lesson as complete solely because its video was opened or played; completion MUST always be evaluated against the lesson's configured completion rule(s).
- **FR-054**: System MUST calculate course progress using a clearly defined model (equal lesson weight, duration-weighted, instructor-assigned weight, or mandatory-only), with the recommended default being weighted completion based on mandatory learning activities; optional lessons MUST NOT block overall course completion unless explicitly configured to do so.
- **FR-055**: System MUST display progress at lesson, module, course, path, and program levels.
- **FR-056**: System MUST synchronize web and mobile progress near real-time using idempotent updates, an offline queue, conflict resolution, server-authoritative state, event timestamps, device-source tagging, and an audited manual-override path.
- **FR-057**: System MUST support a configurable Learning Streak based on admin-defined qualifying actions (lesson complete, quiz complete, assignment activity, minimum learning time), MUST be timezone-aware, MAY support an optional grace period and a future streak-freeze reward, and MUST NOT allow artificial engagement manipulation of the streak.
- **FR-058**: System MUST allow learners to create lesson-specific private notes (rich or plain text) with timestamp, video-timestamp linking, edit, delete, search, export, and cross-device sync; notes MUST default to private, with sharing deferred to a future phase.
- **FR-059**: System MUST support bookmarks for lesson, video timestamp, text section, resource, and discussion, with add/remove, notes, an optional folder/tag, saved-page access, and cross-device sync.
- **FR-060**: System MUST support per-lesson enable/disable of discussion, with ask question, comment, reply, mention, reaction, instructor answer, accepted answer, report, pin, sort, and search, with participation permissions scoped to course enrollment.

### Assessment & Assignment Requirements

- **FR-061**: System MUST support quiz types: practice quiz, graded quiz, module quiz, final assessment, certification exam, and diagnostic assessment.
- **FR-062**: System MUST support question types: single choice, multiple choice, true/false, fill in the blank, match, ordering, short answer, long answer, numeric, file upload, scenario-based, audio response, and (future-ready) video response.
- **FR-063**: Quiz configuration MUST support passing score, attempts allowed, time limit, question randomization, answer randomization, result visibility, correct-answer visibility, explanation text, optional negative marking, retake delay, and future-ready proctoring.
- **FR-064**: System MUST support a reusable Question Bank tagged by category, difficulty, learning objective, tags, language, version, author, review status, and usage count, and MUST generate randomized quiz sets by question count, difficulty distribution, category distribution, and exclusion rules.
- **FR-065**: System MUST execute the quiz attempt flow: show instructions → check attempt eligibility → start timer if applicable → auto-save answers → require submit confirmation → server calculates or queues grading → display result → apply pass/fail action → update progress → show retake rules.
- **FR-066**: System MUST correctly handle quiz-attempt edge cases without data loss or duplicate scoring: network interruption, app closed mid-attempt, timer expiry, duplicate submission, browser refresh, device switch mid-attempt, and a question deleted after a learner already attempted it.
- **FR-067**: Quiz result screen MUST display score, passing score, pass/fail, correct/incorrect counts, time taken, attempt number, topic-level performance, feedback, retake eligibility, and next action, with answer-review visibility controlled by an admin setting.
- **FR-068**: System MUST support broader Assessments beyond quizzes — knowledge questions, self-assessment, skill rating, scenario tasks, practical projects, viva/mentor review, portfolio review — producing an outcome that may include score, level, recommendation, badge, eligibility, and/or certificate qualification.
- **FR-069**: System MUST support assignment types: text response, file upload, link submission, image proof, audio submission, video submission, form-based submission, external project, and portfolio item.
- **FR-070**: Every Assignment MUST carry: title, instructions, learning outcome, due date, maximum score, passing score, submission format, allowed file types, file size limit, attempts allowed, rubric, reviewer, late policy, peer-review status, and visibility.
- **FR-071**: System MUST execute the assignment submission flow: open assignment → read instructions/rubric → save draft → complete required fields → upload files → submit confirmation → lock or allow further edits per settings → notify reviewer → update status → notify learner of feedback.
- **FR-072**: System MUST support assignment statuses: Not started, Draft, Submitted, Late submitted, Under review, Changes requested, Resubmitted, Approved, Rejected, Graded, Overdue, Excused.
- **FR-073**: File uploads MUST enforce configurable allowed types, maximum size, multi-file support, upload progress, retry, virus scanning, MIME validation, secure storage, signed access, preview, and pre-submission delete, and MUST show a user-friendly error for unsupported files.
- **FR-074**: Instructor assignment review screen MUST show learner details, the submission, previous attempts, rubric, score, a private reviewer note, learner-facing feedback, an optional annotated file, status, and actions to request changes, approve, or reject, with bulk review marked future-ready.
- **FR-075**: System MUST support a Rubric System with criteria, description, weight, performance levels, score range, and reviewer comment per criterion (example criteria: clarity, relevance, practical execution, originality, completeness, presentation).
- **FR-076**: System MUST support optional peer review on assignments, configurable for number of reviews required, anonymous-or-visible reviewer identity, review rubric, deadline, reviewer eligibility, moderation, and instructor override, with an admin-controlled decision on whether the peer score is included in the final grade.
- **FR-077**: System MUST support project-based learning where a final project combines multiple required-artifact submissions, and project status MUST connect to module completion and certificate eligibility.
- **FR-078**: System MUST support instructor feedback in text, rubric, audio, video, and annotated-file formats plus live review notes, and learners MUST be able to mark feedback as viewed, reply, resubmit, and request clarification.
- **FR-079**: System MUST record learner attendance from live-class join logs, QR check-in for offline sessions, instructor manual marking, or organization import, with statuses Present, Partial, Absent, Excused, and Pending, usable as an input to lesson/module completion rules.

### Certification Requirements

- **FR-080**: System MUST support certificate types: course completion, learning path, program completion, skill certification, event participation, challenge completion, and organization training.
- **FR-081**: System MUST evaluate certificate eligibility server-side against the configured combination of: all mandatory lessons complete, passing assessment, assignment approved, attendance threshold, final project approved, payment settled, identity verified, and no active misconduct restriction. [NEEDS CLARIFICATION: source does not specify the actual attendance-threshold percentage or how "identity verified" is established for certificate purposes — needs a concrete rule.]
- **FR-082**: Every certificate record MUST carry: certificate ID, verification code, learner name, course/program, completion date, issue date, instructor, organization, credential level, expiry (if applicable), status, PDF URL, and public verification URL.
- **FR-083**: System MUST execute certificate generation as: evaluate eligibility → confirm learner name → select template → create unique credential ID → generate PDF → create verification record → notify learner → update dashboard → enable public sharing.
- **FR-084**: System MUST provide an admin Certificate Template Manager supporting template name, background, logo, signature, seal, text positions, font settings, color, language, course mapping, organization mapping, active status, and a mandatory preview-with-sample-data capability.
- **FR-085**: System MUST provide a public certificate verification page accepting a credential ID or QR scan and returning learner name, credential, issue date, status, and issuing organization, with statuses Valid, Expired, Revoked, Replaced, and Not found, while minimizing exposed sensitive learner data.
- **FR-086**: System MUST support certificate revocation for fraud, academic misconduct, issued-in-error, program invalidation, or administrative correction, requiring an authorized role, a stated reason, approval, an audit log entry, learner notification, and an immediate public verification-status update.

### Discovery, Reviews & Recommendation Requirements

- **FR-087**: System MUST restrict course review eligibility to enrolled learners who have met a minimum progress threshold, and MUST allow only one active review per user per course; review fields MUST include rating, title, comment, outcome, recommendation, optional anonymous display, and moderation status; instructors MUST NOT be able to directly delete a negative review — only admin moderation policy may remove or hide it.
- **FR-088**: System MUST provide a Learning Recommendation Engine using onboarding goal, current learning path, course progress, assessment performance, interests, time availability, language, membership, prior completions, and user feedback as inputs, producing next course, revision lesson, practice quiz, mentor support, related resource, or challenge as outputs, and MUST provide a deterministic non-AI fallback when the AI-driven recommendation is unavailable.
- **FR-089**: System MUST provide learning search across courses, programs, modules, lessons, instructors, transcripts, and resources, with filters for category, level, language, duration, format, access, certificate, instructor, and progress state, respecting the searcher's access permissions.
- **FR-090**: Member course catalog view MUST include sections for continue learning, recommended, learning paths, new courses, popular, free, included-in-membership, completed, and wishlist, with card states Start / Continue / Completed / Locked / Upgrade / Expired / Coming soon.

### Offline & Mobile Learning Requirements

- **FR-091**: Mobile app MUST support offline learning: downloading eligible lessons, video quality selection for download, audio download, PDF download, offline notes, an offline completion queue that auto-syncs when back online, a storage manager, and download expiry.
- **FR-092**: System MUST NOT allow final quiz submission, certificate issuance, payment, or live sessions while offline, and MUST NOT allow final assignment submission offline unless an explicit queued-submission policy has been approved. [NEEDS CLARIFICATION: source does not define who approves a "queued offline submission" policy or what mechanism validates it before the queued submission is accepted server-side.]
- **FR-093**: Download rights MUST be governed by content setting, membership, device limit, expiry, region, and organization policy, and downloaded media MUST be stored encrypted in application storage where feasible.

### Instructor Portal & Course Builder Requirements

- **FR-094**: Instructor dashboard MUST surface assigned courses, active learners, pending assignments, learner questions, upcoming live sessions, completion rate, course rating, at-risk learners, and announcements.
- **FR-095**: System MUST support configurable, granular instructor permissions (view assigned course, edit draft content, add lessons, upload resources, create quizzes, review assignments, send announcements, view analytics, publish), with the final publish permission held as a separate, distinct grant from content-editing permissions.
- **FR-096**: System MUST provide a block-based content authoring editor (text, heading, image, video, audio, file, quote, callout, table, checklist, code, embed, quiz, assignment, CTA, divider blocks) with autosave, version history, preview, duplicate, reorder, translation, accessibility fields, and validation.
- **FR-097**: System MUST provide a guided course builder wizard with steps — basic information, learning outcomes, audience and prerequisites, curriculum, content, assessments, access and pricing, certificate, SEO, review and publish — showing a progress checklist throughout.
- **FR-098**: System MUST support course cloning with options for full clone, curriculum-only, content-without-enrollments, assessment bank, certificate settings, and translation variant, and MUST NOT carry over enrollments, learner progress, or financial data into the cloned course.
- **FR-099**: System MUST support course versioning for published courses, capturing version number, change summary, effective date, existing-learner policy, progress migration rules, and an audit log, with existing-learner policy options of continue-old-version, move-to-new-version, optional migration, or mandatory migration. [NEEDS CLARIFICATION: source lists the possible existing-learner policies but does not state a default — needs a stated default policy for courses that do not explicitly configure one.]
- **FR-100**: System MUST enforce a content review workflow with states Draft → Submitted for review → Changes requested → Approved → Scheduled → Published, distinct Author / Reviewer / Compliance reviewer / Publisher roles, and an audit entry on every state transition.
- **FR-101**: System MUST support course translation management with per-language variant status (Not started, In progress, Review, Approved, Published, Outdated), and MUST automatically flag a translated version as Outdated when its source lesson is updated.
- **FR-102**: System MUST provide course announcements (title, message, priority, audience, course/module scope, publish date, expiry, channels, attachment) deliverable via in-app, push, and email channels.
- **FR-103**: System MUST provide a course calendar showing live classes, assignment deadlines, quiz windows, module unlocks, program events, and mentor sessions, with month/week/agenda views, add-to-Google-Calendar, timezone conversion, and reminder settings.
- **FR-104**: System MUST send learning reminders triggered by course-not-started, lesson-incomplete, assignment-due, quiz-deadline, live-class-upcoming, streak-at-risk, and course-access-expiring conditions, respecting user frequency preferences and anti-spam rules.

### Learning Analytics Requirements

- **FR-105**: System MUST track user-level learning analytics: enrollment, start date, last activity, progress, time spent, lessons completed, quiz attempts, scores, assignment status, attendance, certificate, drop-off, and at-risk score.
- **FR-106**: System MUST provide admin-facing course analytics: enrollments, active learners, completion rate, average completion time, lesson drop-off, video engagement, quiz pass rate, assignment approval rate, rating, refund correlation, certificate rate, device distribution, and language distribution.
- **FR-107**: System MUST provide per-lesson analytics: views, unique learners, starts, completes, average watch/read time, drop-off timestamp, replays, notes created, discussion activity, resource downloads, and error rate.
- **FR-108**: System MUST detect at-risk learners from signals (no activity, repeated quiz failure, missed assignments, low attendance, course access nearing expiry, long inactivity after start) and trigger actions (reminder, recommended revision, mentor suggestion, instructor alert, support outreach, simplified restart plan).
- **FR-109**: System MUST emit a defined LMS analytics event taxonomy including course_viewed, course_enrolled, course_started, lesson_viewed, video_started, video_progressed, lesson_completed, quiz_started, quiz_submitted, quiz_passed, quiz_failed, assignment_started, assignment_submitted, assignment_reviewed, course_completed, certificate_issued, resource_downloaded, learning_path_started, and learning_path_completed.

### Admin LMS Operations Requirements

- **FR-110**: Admin LMS module MUST provide navigation for Learning Dashboard, Learning Paths, Programs, Courses, Modules, Lessons, Assessments, Question Bank, Assignments, Certificates, Instructors, Cohorts, Enrollments, Reviews, Reports, and Settings.
- **FR-111**: Admin course list screen MUST show course, category, instructor, language, status, access, price, enrollments, completion rate, and updated-date columns, with filters (status, category, instructor, language, access type, certificate, created/updated date) and actions (view, edit, duplicate, preview, publish, unpublish, archive, analytics, manage learners).
- **FR-112**: Admin enrollment screen MUST show learner, course, source, status, progress, enrollment date, access expiry, last activity, and certificate columns, with actions (grant access, extend access, revoke, reset progress, mark complete with reason, resend welcome, export), and every manual action MUST be audit logged.
- **FR-113**: Authorized admin/instructor roles MUST be able to override progress — mark lesson complete, reset lesson, mark assignment approved, extend deadline, mark course complete — each requiring a stated reason, sufficient permission, an audit entry, and learner notification that is mandatory or optional depending on the specific action.
- **FR-114**: System MUST provide global LMS settings for default completion rule, default video threshold, default quiz attempts, default passing score, course rating eligibility, certificate rules, download policy, offline policy, reminder frequency, discussion default, file limits, enrollment defaults, and course archival policy.

### Content Integrity & Moderation Requirements

- **FR-115**: Uploaded course content MUST carry an ownership declaration and comply with copyright and third-party license rules; instructors MUST NOT upload unauthorized copyrighted content; system MUST support a plagiarism review process, a takedown process, and content audit.
- **FR-116**: System MUST support academic integrity handling for plagiarism, unauthorized collaboration, identity fraud, quiz cheating, fabricated submission, and certificate fraud, via an originality declaration, similarity-detection integration, review flag, investigation workflow, appeal process, and certificate hold.

### AI-in-Learning Requirements

- **FR-117**: System MUST scope AI-in-learning capabilities to: lesson summary, quiz explanation, study plan, translation assistance, practice question generation, assignment brainstorming, feedback support, and transcript search.
- **FR-118**: System MUST NOT present AI-generated answers as always correct, and MUST NOT allow AI to directly facilitate cheating on a graded assignment.
- **FR-119**: System MUST allow instructors to define a course-level AI usage policy, and MUST provide learners with an option to disclose their AI use on a submission. [NEEDS CLARIFICATION: source states disclosure must be an available option but does not specify whether disclosure is ever mandatory (e.g., for certain assignment/assessment types) or purely optional in all cases.]

### Notification & Communication Requirements

- **FR-120**: System MUST fire LMS notifications for enrollment confirmed, course started, new module available, live class reminder, assignment due, assignment reviewed, quiz result, course inactive reminder, course completed, certificate issued, access expiring, and instructor announcement events.
- **FR-121**: System MUST send transactional emails for enrollment confirmation, course welcome, upcoming deadline, live class reminder, feedback available, completion, certificate, access expiry, and course update, respecting user communication preferences except for critical transactional communication.

### Security, Accessibility & Performance Requirements

- **FR-122**: System MUST enforce security controls across the LMS: server-side entitlement checks, signed media access, secure file upload, malware scanning, input sanitization, quiz-answer protection, submission authorization, certificate verification integrity, audit logs, rate limits, anti-enumeration controls, and instructor permission isolation.
- **FR-123**: System MUST meet defined accessibility requirements: keyboard-operable player, captions, transcript, screen-reader-compatible lesson structure, accessible quiz controls, clear time-limit announcements, assignment error summaries, focus management, color-independent status indicators, reduced motion, and accessible certificate verification.
- **FR-124**: System MUST meet defined performance requirements: paginated course catalog, lazy-loaded curriculum, adaptive video streaming, player start without unnecessary delay, asynchronous-but-reliable progress updates, auto-saved notes, background upload for large files, cached dashboard analytics, and isolation of partial service failures.
- **FR-125**: System MUST surface a defined LMS error code taxonomy to clients (course-, lesson-, quiz-, assignment-, and certificate-family error codes) so that client UIs can present specific, actionable error states rather than generic failures.

### Key Entities *(include if feature involves data)*

- **Learning Path**: A multi-course, goal-oriented roadmap toward a specific transformation; owns display order, access type, and completion rules aggregating multiple courses.
- **Learning Path Course**: The join entity linking a Learning Path to its member Courses, distinguishing required vs. optional inclusion and sequence.
- **Program**: A broader, potentially cohort-based learning experience combining courses, live classes, assignments, community, mentor sessions, a final project, and certification; distinct from a single Course.
- **Cohort**: A scheduled, capacity-bound instance of a Program (or course) with its own dates, timezone, instructor/mentor team, community group, and enrolled learner list.
- **Course**: The primary purchasable/enrollable learning product; owns curriculum (modules/lessons), access/pricing configuration, completion rules, drip settings, and status/version lifecycle.
- **Course Version**: A snapshot of a published course's content/config at a point in time, with change summary, effective date, and the policy governing existing enrolled learners.
- **Course Instructor**: The relationship between a Course and its lead/co-instructors, including their granular permission grants (edit, publish, review, etc.).
- **Module**: A thematic section of a Course, containing an ordered set of Lessons plus its own completion/release rules and prerequisite module.
- **Lesson**: The individual learning unit of a specific type (video/audio/text/PDF/live/quiz/assignment/etc.), with its own completion rule, release rule, and prerequisite.
- **Lesson Content**: The underlying content payload of a Lesson (video source/captions, text body, PDF file, live-session metadata, etc.), versioned and status-tracked.
- **Lesson Resource**: A downloadable asset attached to a Lesson (PDF, worksheet, template, etc.) with its own access/download rule.
- **Enrollment**: The record of a learner's access grant to a Course/Path/Program, carrying entitlement source, access state, expiry, and enrollment date.
- **Lesson Progress**: Per-learner, per-lesson completion state, tracking which completion conditions are satisfied and when.
- **Course Progress**: Per-learner, per-course aggregate progress derived from Lesson/Module progress under the course's chosen weighting model.
- **Path Progress**: Per-learner, per-Learning-Path aggregate progress derived from constituent Course Progress records.
- **Video Progress**: Per-learner, per-video playback telemetry (watched duration, furthest position, current position, speed, device).
- **Learner Note**: A learner's private, lesson-scoped note, optionally timestamp-linked to video position.
- **Bookmark**: A learner's saved reference to a lesson, video timestamp, text section, resource, or discussion.
- **Quiz**: A scored assessment instance composed of Questions, with configuration for passing score, attempts, timing, and randomization.
- **Question**: A single question-bank item with type, difficulty, category, learning objective, and review status.
- **Question Option**: An answer choice/option belonging to a Question (for choice/match/ordering question types).
- **Quiz Attempt**: A single learner's attempt at a Quiz, with timing, answers, score, and pass/fail outcome.
- **Quiz Answer**: A learner's recorded response to a specific Question within a Quiz Attempt.
- **Assignment**: A gradable task with instructions, due date, rubric, submission format rules, and reviewer assignment.
- **Submission**: A learner's submitted work against an Assignment, with status lifecycle (draft → submitted → under review → approved/rejected/graded, etc.).
- **Submission File**: An uploaded file attached to a Submission, with type/size validation and secure/signed storage reference.
- **Rubric**: A structured grading instrument of weighted Criteria used to score Submissions (and optionally Peer Reviews).
- **Rubric Criterion**: A single scored dimension of a Rubric (e.g., clarity, originality) with description, weight, and performance levels.
- **Review**: An instructor's (or peer reviewer's) evaluation of a Submission, including rubric scores, private reviewer notes, and learner-facing feedback.
- **Live Session**: A scheduled live class instance with provider integration, capacity, recording, and state lifecycle.
- **Attendance**: A learner's recorded presence at a Live Session or offline event, with join/leave time and verification source.
- **Certificate Template**: An admin-managed design used to render issued Certificates, mapped to specific courses/organizations.
- **Certificate**: An issued credential record with unique verification code, eligibility snapshot, status, and public verification URL.
- **Course Review**: A learner's rating/comment on a completed-enough Course, with moderation status.
- **Announcement**: An instructor/admin message scoped to a course/module, with audience, channel, and expiry.
- **Waitlist**: A queue of users awaiting a seat in a capacity-limited Course/Cohort, with priority and time-limited offer state.
- **Learning Event**: A generic analytics event record (per the LMS event taxonomy) capturing learner/content interactions for analytics and at-risk detection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of lesson completions recorded by the system are attributable to a satisfied, configured completion rule (never solely "video opened") — zero completions are grantable by a passive view event alone.
- **SC-002**: 100% of certificates issued have a system-recorded, server-evaluated eligibility snapshot showing every configured eligibility condition was met at issuance time — zero certificates are issued on client-asserted completion alone.
- **SC-003**: 100% of course/lesson access decisions are enforced by a server-side entitlement check on the content request itself, independent of any cached or client-side "enrolled" state.
- **SC-004**: Every publicly issued certificate is independently verifiable (via credential ID or QR) by an unauthenticated visitor, returning a correct status (Valid/Expired/Revoked/Replaced/Not found) with minimal exposed learner data.
- **SC-005**: 0% of course/module configurations with a circular prerequisite dependency are allowed to save — all such configurations are rejected at authoring time.
- **SC-006**: Learners can resume any previously started lesson, on any device, from their last synced position without manual re-navigation, in near real-time after a device switch.
- **SC-007**: 100% of published courses have passed through the full content review workflow (Draft → Submitted → Approved → Published) with a complete, attributable audit trail of every state transition before becoming learner-visible.
- **SC-008**: Course cloning produces a new course with 0% carry-over of the source course's enrollments, learner progress, or financial/order data, across all clone modes.
- **SC-009**: At-risk learners (by the defined signal set — inactivity, repeated quiz failure, missed assignments, low attendance, nearing access expiry) are surfaced to instructors/support before their course access expires, in all monitored active courses.
- **SC-010**: 100% of AI-assisted learning features (recommendation engine, lesson summary, quiz explanation, etc.) remain usable via a deterministic non-AI fallback when the AI call fails or is unavailable, with zero hard-blocked learner journeys attributable to AI downtime.

## Assumptions

- Entitlement source types referenced here (membership plan, individual purchase, coupon grant, scholarship, trial access) are granted and financially reconciled by Volume 09 (Membership, Payments & Revenue); this spec assumes Volume 09 is the system of record for payment/membership state and only consumes its entitlement signal.
- Organization-assigned access and organization license expiry assume an Organization/Team entity exists (introduced in Volume 03 Auth/Identity or a future Enterprise volume); this spec treats "organization" as an external reference, not something it defines.
- AI-in-learning capabilities (lesson summary, quiz explanation, study plan, translation assistance, practice question generation, assignment brainstorming, transcript search) assume they run on Volume 08's TBT AI Assistant platform and inherit its guardrails (server-side-only AI calls, no client-exposed prompts/keys, mandatory deterministic fallback) rather than defining a separate AI stack here.
- "Mentor approval" as a prerequisite type and "mentor checkpoints" in Learning Paths/Programs assume integration with Volume 07 (Mentor Marketplace) for mentor identity, availability, and session data; this spec does not define mentor profile or booking mechanics.
- Lesson discussions (Sec 32) and course community groups (Sec 6.1, cohort community group) assume they run on shared infrastructure with Volume 05 (Community, Groups, Channels); this spec defines LMS-scoped discussion behavior only (enable/disable per lesson, enrollment-scoped permissions) and does not redefine general community/moderation mechanics.
- Learning streaks (Sec 29) are LMS-local streak tracking; broader gamification (points, levels, badges, leaderboards) is owned by Volume 06 and is out of scope here except where a streak or completion event is a documented input to it.
- The source text's own internal references to "Volume 15" (API detail) and "Volume 14" (data schema detail) for this module do not correspond to this repository's manifest, where Volume 14 is the Enterprise Marketing Platform and no Volume 15 exists in the Wave 1 set. This is treated as a source-internal inconsistency; detailed API contracts and physical schema design are explicitly out of scope for this spec and are deferred to this feature's future `plan.md`.
- Live class provider integration (Google Meet, Zoom, "other approved provider") assumes standard OAuth/webhook-based integration with those third-party platforms for scheduling and attendance logs; this spec does not define a proprietary live-streaming protocol beyond noting native streaming as future-ready.
- Where the source lists a capability as "future-ready" (SCORM/external package import, video question responses, proctoring, native live streaming, bulk assignment review, notes sharing, streak-freeze rewards), this spec treats those as explicitly out of scope for the current implementation and only requires that current data models not preclude adding them later.
- Numeric defaults not stated in the source (e.g., exact minimum watch percentage for video completion, exact attendance threshold percentage for certificate eligibility) are called out via `[NEEDS CLARIFICATION]` markers in the Functional Requirements rather than invented here, consistent with the Constitution's governance rule against silently resolving ambiguity.
