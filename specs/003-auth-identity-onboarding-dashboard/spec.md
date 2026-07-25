# Feature Specification: Authentication, Identity, Onboarding, Personalization & Member Dashboard

**Feature Branch**: `003-auth-identity-onboarding-dashboard`

**Created**: 2026-07-22

**Status**: Draft

**Input**: Source PRD — Document Series: Enterprise PRD, Volume 03 "Authentication, User Identity, Onboarding, Personalization and Member Dashboard" (`document 1/Document 1 (2).md`). Covers account registration, login, OTP, email verification, password management, social login, session/device management, user identity, profile management, role management, 13-step onboarding, goal assessment, personalization, recommended roadmap, member dashboard, quick actions, progress summary, daily actions, membership visibility, account status, suspicious-login handling, account recovery, account deletion, authentication analytics, and admin identity operations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Member Signup Across Multiple Methods (Priority: P1)

A visitor decides to join Tamil Business Tribe and creates an account using their preferred method — email/password, mobile OTP, Google, or Apple — providing only the minimum information needed, accepting terms/privacy, and verifying their identity, without accidentally creating a duplicate account if one already exists for that email or mobile number.

**Why this priority**: Signup is the entry gate to every other capability on the platform. Without a reliable, low-friction, duplicate-safe signup flow across all supported methods, no other module (learning, community, mentors, dashboard) can be reached. This is the platform's single highest-leverage conversion point.

**Independent Test**: Can be fully tested by completing signup through each of the four initial methods (email, mobile OTP, Google, Apple) on a clean test environment and confirming exactly one account is created per unique identity, with the correct post-signup redirect (verification screen or onboarding).

**Acceptance Scenarios**:

1. **Given** a new visitor with no existing account, **When** they sign up with email + password and accept terms/privacy, **Then** an account is created in "Pending verification" status and a verification email is sent, and the user is routed to the verification screen.
2. **Given** a new visitor, **When** they sign up with mobile number and correctly enter the OTP, **Then** the account is created and verified in one step, and onboarding begins.
3. **Given** an email address that already has a registered account, **When** a visitor attempts to sign up again with that email, **Then** the system shows a generic "account already exists" message with Login, Forgot Password, and Continue-with-connected-provider options, and does **not** create a second account.
4. **Given** a signup form has been submitted and is processing, **When** the user clicks the signup button multiple times in rapid succession, **Then** only one account is ever created (no duplicate accounts from repeated clicks).
5. **Given** a visitor signs up via Google or Apple and the provider returns a verified email that already matches an existing password-based account, **When** the social signup completes, **Then** the system does not auto-merge the identities and instead requires a secure account-link confirmation through the existing login method.

---

### User Story 2 - Guided 13-Step Onboarding to a Personalized Roadmap (Priority: P1)

A newly verified member is guided through a short, progressive, skippable-by-policy onboarding sequence (welcome, language, goal, user type, experience level, business stage, interests, time availability, learning format, current challenge, optional assessment) that concludes with a system-generated personalized learning/business roadmap and a recommended first action, so the member knows exactly what to do first.

**Why this priority**: Onboarding is what converts a verified account into an activated, understood member. The roadmap it produces is the mechanism that drives every subsequent recommendation (dashboard, courses, community groups, challenges). Without it, new members land on a generic, unpersonalized experience and are far more likely to churn before taking any meaningful action.

**Independent Test**: Can be fully tested by taking a freshly verified test account through all 13 onboarding steps and confirming a roadmap (goal summary, recommended course, recommended community group, first milestone) is generated and displayed, with a progress indicator visible throughout and no repeated completed steps if the user exits and resumes.

**Acceptance Scenarios**:

1. **Given** a verified member starting onboarding, **When** they progress through each of the 13 steps in sequence, **Then** a persistent progress indicator is visible at every step and each step's answer is saved before advancing.
2. **Given** a member exits onboarding midway through step 6, **When** they log in again later, **Then** they are prompted to resume from step 6 (not step 1), with steps 1–5 already marked complete.
3. **Given** a member completes all mandatory onboarding steps, **When** onboarding finishes, **Then** the system generates and displays a roadmap containing a goal summary, current stage, recommended learning path, recommended first course, recommended community group, expected weekly commitment, and a first milestone.
4. **Given** the AI-based roadmap generation service is unavailable or fails, **When** a member completes onboarding, **Then** the system falls back to a deterministic, static-rule-based roadmap so the member is never left without a recommendation.

---

### User Story 3 - Returning Member Login with Safe, Context-Aware Routing (Priority: P1)

A returning member logs in using any of their connected methods (email/password, mobile OTP, Google, Apple, or a single email-or-mobile identifier field), and after successful authentication is routed to the most relevant destination — a previously protected page, a pending checkout, a pending event registration, incomplete onboarding, or otherwise the member dashboard.

**Why this priority**: Login is the highest-frequency authentication interaction on the platform and directly gates access to paid content, community, and business tools. Incorrect routing or excessive friction on every return visit compounds into significant member dissatisfaction and lost revenue (e.g., abandoned checkouts).

**Independent Test**: Can be fully tested by logging in as an existing member from a deep link to a protected page and confirming the post-login redirect returns the user to that exact page rather than the generic dashboard, and by repeating with a pending checkout/event-registration context to confirm the documented priority order is honored.

**Acceptance Scenarios**:

1. **Given** a member with valid credentials, **When** they submit email-or-mobile plus password on the login page, **Then** the system auto-detects the correct login method from the normalized identifier and authenticates them.
2. **Given** a member was redirected to login while trying to reach a protected URL, **When** login succeeds, **Then** they are returned to that original protected URL rather than the dashboard.
3. **Given** a member has an incomplete onboarding and no pending checkout/event, **When** login succeeds, **Then** they are routed to resume onboarding before reaching the dashboard.
4. **Given** a member enters incorrect login details, **When** the login attempt fails, **Then** a generic, security-friendly error message is shown along with clear next-step actions (forgot password, resend verification, use OTP, contact support) without revealing which field (identifier or password) was wrong.

---

### User Story 4 - Member Dashboard Answers "Where Am I, What's Next, What's My Progress" (Priority: P1)

Every time a member logs in, the dashboard immediately surfaces critical alerts, a single clear next-best-action, in-progress learning, upcoming live sessions, active challenges, progress/milestones, and personalized recommendations — in a fixed priority order — so the member never has to hunt for what to do next.

**Why this priority**: The dashboard is the recurring home screen for every logged-in member and is explicitly defined in the source as the answer to the platform's core retention question. A dashboard that fails to surface the right next action or degrades ungracefully under partial widget failure directly undermines member activation and retention across every other module.

**Independent Test**: Can be fully tested by logging in as members in different states (new user, active learner, member with a payment failure, member with an upcoming live session) and confirming the dashboard renders content in the documented top-to-bottom priority order, with critical alerts always first and exactly one primary next-best-action card.

**Acceptance Scenarios**:

1. **Given** a member has a failed payment and an in-progress course, **When** they open the dashboard, **Then** the critical payment alert renders above the "continue learning" section, per the defined information priority order.
2. **Given** a member has multiple possible next steps, **When** the dashboard renders the Next Best Action card, **Then** exactly one primary action is shown (with any secondary actions listed separately), including action title, reason, estimated time, and a CTA.
3. **Given** one dashboard widget (e.g., recommendations) fails to load due to a backend error, **When** the rest of the dashboard renders, **Then** only that widget shows a retry state — the remaining widgets load and function normally.
4. **Given** a brand-new user with no course activity, no events, and no active challenge, **When** they view the dashboard for the first time, **Then** they see the new-user empty-state experience (onboarding progress, start-first-course prompt, join-community prompt) rather than a blank or broken dashboard.

---

### User Story 5 - Password Reset and Account Recovery Without Leaking Account Existence (Priority: P2)

A member who has lost access to their password, email, mobile, or 2FA device can recover their account through a self-service reset flow or a support-assisted recovery process, without the system ever revealing to an unauthenticated requester whether a given email or mobile number actually has an account.

**Why this priority**: Account recovery is a P0/P1 launch-blocking capability (forgot password is explicitly listed under MVP P0) and a major security-sensitive surface. Leaking account existence during "forgot password" is a well-known enumeration vulnerability the source explicitly guards against; getting this wrong has both security and trust consequences.

**Independent Test**: Can be fully tested by submitting the forgot-password form once with a registered identifier and once with an unregistered identifier, and confirming both return the exact same generic response ("if a match exists, instructions were sent"), and by completing a full reset with a valid token to confirm existing sessions are revoked per policy.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor submits an email or mobile number that has no matching account, **When** they request a password reset, **Then** the system returns the same generic "if an account matches, instructions were sent" message as it would for a registered identifier.
2. **Given** a member requests a password reset and receives a valid reset link, **When** they set a new password before the link expires, **Then** the system validates the token is valid/unused/unexpired, applies the new password against policy, and revokes existing sessions per the applicable policy.
3. **Given** a staff (internal) account completes a password reset, **When** the reset succeeds, **Then** all of that account's active sessions are revoked (mandatory, not merely configurable), and a security notification is sent.
4. **Given** a member has lost access to email, mobile, and their 2FA device, **When** they contact support for recovery, **Then** the support agent cannot directly view or set the member's password, and the recovery instead follows a ticket + identity-evidence + risk-review + approval + recovery-link workflow, with high-risk cases requiring dual approval.

---

### User Story 6 - Two-Factor Authentication and Session/Device Security for Privileged and At-Risk Accounts (Priority: P2)

Admins, finance roles, super admins, and any account flagged high-risk must set up and use two-factor authentication; all members can review and manage their active sessions and devices; and the system detects suspicious login patterns (new country, impossible travel, known-malicious IP, repeated failures) and responds with graduated actions from notification to forced password reset.

**Why this priority**: This is the platform's core account-takeover defense layer, and mandatory 2FA for privileged roles is a direct requirement (also codified in the project constitution's Security & Compliance Baseline). It is P1 in the MVP priority tier (2FA, device management) but is foundational enough to security posture that it must ship close behind core login.

**Independent Test**: Can be fully tested by attempting to access an admin-role account without 2FA enabled (should be blocked/forced into setup), enabling 2FA via authenticator app and confirming recovery codes are generated, then simulating a login from a new country/device and confirming the account owner receives a "new device login" notification with a "this was me" / "secure my account" choice.

**Acceptance Scenarios**:

1. **Given** a user is assigned an admin, finance, or super-admin role, **When** they attempt to use privileged features without 2FA configured, **Then** the system requires them to complete 2FA setup (password re-entry, secret/QR display, verification code, recovery code generation) before proceeding.
2. **Given** a member with 2FA enabled wants to disable it, **When** they attempt to disable 2FA, **Then** the system requires password re-entry plus current 2FA or recovery-code verification, and sends a security notification afterward.
3. **Given** a login attempt originates from a new country combined with impossible-travel timing relative to the account's last known location, **When** the system evaluates the login, **Then** it applies a risk-appropriate response (additional OTP challenge, temporary block, or forced password reset) rather than allowing silent access.
4. **Given** a member views their "Devices and Sessions" screen, **When** they remove an unrecognized device, **Then** that device's session is revoked, the member is prompted to consider a password change, and a security audit log entry is created.

---

### User Story 7 - Self-Service Account Lifecycle: Deactivate, Delete, Export Data, Manage Consent (Priority: P2)

A member can temporarily deactivate their account (hiding their public profile without cancelling anything automatically), permanently delete their account through a consequence-explained and re-authenticated flow, request an export of their own data, and manage per-channel marketing/communication consent — all from account settings.

**Why this priority**: These are core data-rights and account-control capabilities (data export and account deletion are explicit P1 MVP items) required for user trust, legal compliance, and consistency with the constitution's consent-is-first-class principle. They are less frequently used than login/dashboard but are non-negotiable before a public launch that collects PII.

**Independent Test**: Can be fully tested by deactivating a test account and confirming the public profile is hidden but the subscription is untouched; by running the full account-deletion flow (re-auth, reason, confirm, cooling-off, delete/anonymize, confirmation) end-to-end; and by requesting a data export and confirming a secure, time-limited, identity-verified download is produced.

**Acceptance Scenarios**:

1. **Given** a member deactivates their account, **When** deactivation completes, **Then** their public profile is hidden, notifications pause, and their subscription is **not** automatically cancelled — the subscription handling is explicitly explained to the member.
2. **Given** a member initiates account deletion, **When** they proceed through the flow, **Then** the system explains consequences, requires re-authentication, allows an optional reason, applies any configured cooling-off period, and only then deletes or anonymizes data per policy, sending a final confirmation.
3. **Given** a member has an active subscription, pending refund, or mentor payout at the time of a deletion request, **When** the deletion request is evaluated, **Then** the system flags these as considerations that must be resolved/handled per policy rather than silently deleting financial records.
4. **Given** a member withdraws marketing email consent in settings, **When** the next scheduled marketing send occurs, **Then** that member does not receive it, while transactional communications that are not subject to opt-out continue with a clear explanation of why.

---

### User Story 8 - Admin Identity Operations: Role Changes and Duplicate Account Merge (Priority: P3)

A platform admin can manage member identity records — assigning/changing roles with a required reason and audit trail, viewing and filtering the full member list, and running a controlled account-merge workflow for verified duplicate accounts that migrates purchases, progress, and memberships to a single primary identity.

**Why this priority**: These are back-office operational tools rather than member-facing flows. They matter for platform integrity and support-ticket resolution but depend on the core identity model (Stories 1–4) already existing, and account-merge automation is explicitly listed under MVP P2 (later priority tier) in the source.

**Independent Test**: Can be fully tested by having an authorized admin change a test user's role (confirming a reason is required, an audit entry is created, and the user's permissions refresh immediately) and by running an account merge on two verified duplicate test accounts, confirming purchases/progress/memberships consolidate onto the selected primary account and old sessions are revoked.

**Acceptance Scenarios**:

1. **Given** an admin with the required permission wants to change a member's role, **When** they submit the change, **Then** the system requires a reason, creates an audit log entry, immediately refreshes the member's permissions, and notifies the user where policy requires it.
2. **Given** an admin attempts to grant a super-admin role, **When** the grant is submitted, **Then** the system applies (or flags for) dual approval before the role takes effect.
3. **Given** two accounts are confirmed by an admin to belong to the same person, **When** the merge workflow runs, **Then** ownership is verified, a primary account is selected, purchases/progress/memberships migrate to the primary, duplicate profile data is handled, old sessions are revoked, and audit history is preserved.
4. **Given** the two accounts being merged have conflicting active subscriptions or other financial state, **When** the merge is evaluated, **Then** the system routes the conflict to manual review instead of resolving it automatically.

---

### Edge Cases

- What happens when a visitor rapidly double-clicks/re-submits the signup button? The system must not create duplicate accounts from repeated submission attempts (§7.9).
- What happens when a signup email or mobile number already has an account? The system must show a generic, non-account-existence-leaking message with Login / Forgot Password / Continue-with-connected-provider actions (§7.8).
- What happens when a social-login provider returns an email that matches an existing password-based account? The system must require secure account-link confirmation rather than automatically merging the identities (§10.2).
- What happens when a social provider's access is revoked after the fact? The system must (risk-dependent) invalidate the existing session and prompt the user to set an alternative login method (§10.4).
- What happens when a "forgot password" request is submitted for an identifier with no matching account? The response must be identical to the response for a matching identifier, to avoid account-existence enumeration (§13.1).
- What happens when a new OTP is issued before a previously sent OTP is used? The prior OTP must be invalidated immediately (§9.2).
- What happens when a suspicious login is detected (new country, impossible travel, known-malicious IP, token reuse, rapid password attempts, admin login from an unusual location)? The system must apply a graduated response — allow-and-notify, additional OTP challenge, temporary block, forced password reset, session revocation, or admin security review — based on risk level (§18).
- What happens when the AI roadmap-generation service fails or times out during onboarding completion? The system must fall back to a deterministic, static-rule-generated roadmap so the member is never left without a recommendation (§42).
- What happens when a member's onboarding-answer save fails mid-flow (e.g., network drop)? The answer must be preserved locally/temporarily so it is not lost (§90).
- What happens when an admin attempts to merge two accounts that each hold active, conflicting financial state (e.g., two live subscriptions)? The merge must stop for manual financial review rather than auto-resolving (§78).
- What happens when a member deactivates their account while holding an active paid subscription? Deactivation must not be treated as, or silently trigger, subscription cancellation — the effect on billing must be explicitly explained to the member (§79).
- What happens when a member requests account deletion while having an active subscription, a pending refund, a pending mentor payout, organization ownership, or a legal data-retention obligation? Each of these must be surfaced and handled per policy before actual deletion/anonymization proceeds (§80).
- What happens when one dashboard widget's backend call fails while the member is viewing the dashboard? Only that widget must show a failure/retry state — the rest of the dashboard must continue to render and function (§68).
- What happens when a long-inactive member logs back in? The dashboard must show a simplified "welcome back" restart experience (what changed, resume recommendation, missed deadlines) rather than dumping the full accumulated backlog (§67).
- What happens when a user tries to claim a username that is a reserved word, an offensive term, or an impersonation of an existing brand/person? The system must block the username (§23).

## Requirements *(mandatory)*

### Authentication Requirements

- **FR-001**: System MUST allow each user to hold exactly one primary platform identity, to which multiple login methods (email/password, mobile OTP, Google, Apple, other approved OAuth providers) can be linked (§3.1).
- **FR-002**: System MUST store authentication data (email, mobile number, password hash, verification status, login providers, security settings, session data) as a record separate from the user's public profile data (§3.2).
- **FR-003**: System MUST collect only the information necessary at signup time and collect additional information later via onboarding and progressive profiling (§3.3).
- **FR-004**: System MUST verify every protected action on the backend (valid session, active account, role, membership, entitlement, organization, ownership, account restrictions) — hiding a UI control on the frontend MUST NOT be treated as authorization (§3.4).
- **FR-005**: System MUST clearly notify the user of security-relevant actions on their account, including new device login, password changed, email changed, mobile number changed, account locked, and suspicious activity detected (§3.5).
- **FR-006**: System MUST support the following account types at launch: Individual, Mentor (post-application/approval), Instructor (admin-invited/approved), Organization Member (via org invitation), Organization Admin, and Internal Staff (support agent, moderator, content manager, finance admin, platform admin, super admin), with internal staff subject to stronger mandatory security (§4).
- **FR-007**: System MUST support email+password, mobile number+OTP, Google OAuth, Apple Sign In, optional passwordless email link, admin-created invitation accounts, organization invitation accounts, and recovery codes as initial authentication methods, with an architecture ready to add Microsoft, LinkedIn, enterprise SSO, SAML, and OpenID Connect in the future (§5).
- **FR-008**: System MUST implement the standard signup journey (method selection → basic details → terms/privacy acceptance → email/mobile verification → account creation → welcome → onboarding → personalized roadmap → dashboard) (§6).
- **FR-009**: System MUST preserve the signup source (direct, organic search, social media, advertisement, referral, affiliate, webinar, lead magnet, event, admin invitation, organization invitation) on every new account (§6).
- **FR-010**: System MUST present the signup page with brand logo, welcome headline, value statement, Google/Apple/email/mobile-OTP signup options, login link, terms/privacy consent (mandatory), optional marketing consent, language selector, and support link (§7.2).
- **FR-011**: System MUST require full name, email, password, confirm-password, and terms/privacy acceptance for email signup, and MUST accept optional referral code, marketing consent, and country (§7.3).
- **FR-012**: System MUST require full name, country code, mobile number, OTP, and terms/privacy acceptance for mobile signup, and MUST accept optional email, referral code, and marketing consent (§7.4).
- **FR-013**: System MUST enforce a minimum password policy of at least 8 characters with at least one letter and one number, MUST reject common compromised passwords, and MUST reject passwords that exactly match the user's email or name (§7.5).
- **FR-014**: System MUST support an optional stronger password policy for staff accounts (minimum 12 characters with uppercase, lowercase, number, and special character) (§7.5).
- **FR-015**: System MUST provide password UI affordances: show/hide toggle, strength indicator, requirement checklist, Caps Lock warning, paste support, and password-manager compatibility (§7.6).
- **FR-016**: System MUST validate full name as required, trimmed of leading/trailing spaces, minimum 2 characters, within a configurable maximum length, free of unsupported control characters, and MUST allow single-word names (§7.7).
- **FR-017**: System MUST validate signup email as lowercase-normalized, trimmed, format-valid, checked for duplicate accounts, with configurable handling of disposable email domains (§7.7).
- **FR-018**: System MUST validate signup mobile number against a valid country code and country-specific format, check for duplicate accounts, and apply an OTP send rate limit (§7.7).
- **FR-019**: System MUST validate signup password against the security policy, require password/confirm-password match, and reject previously breached passwords where breach-checking is supported (§7.7).
- **FR-020**: System MUST require explicit, non-preselected acceptance of terms and privacy consent at signup (§7.7).
- **FR-021**: System MUST detect duplicate email/mobile at signup and present a generic, non-account-existence-leaking message with Login, Forgot Password, and Continue-with-connected-provider options in security-sensitive contexts (§7.8).
- **FR-022**: System MUST prevent duplicate account creation from repeated/rapid signup button submissions, and MUST expose signup button states for default, disabled, loading, success, validation error, server error, and rate-limited (§7.9).
- **FR-023**: System MUST route a successful signup to the verification screen when verification is required, or directly to onboarding when the method is already verified (e.g., verified social login) (§7.10).
- **FR-024**: System MUST send a verification email immediately after email-based signup completes, containing the user's name, a verification CTA, link expiry, a security note, a support link, and an ignore-if-not-you instruction (§8.1-8.2).
- **FR-025**: System MUST display a verification screen showing the masked email, OTP/verification-link status, resend option, change-email option, countdown, and support link, and MUST handle valid, expired, already-used, invalid, already-verified, and suspended-account link states (§8.3-8.4).
- **FR-026**: System MUST enforce resend protections for verification emails: cooldown timer, daily send limit, IP-level protection, device-level protection, and an audit log entry per resend (§8.5).
- **FR-027**: System MUST, when a user changes their email during verification, validate the new email, check for duplicates, invalidate the old verification token, send a new verification email, and create an audit event (§8.6).
- **FR-028**: System MUST process mobile OTP requests by normalizing the number, checking rate limits, checking existing account state, generating the OTP, storing it hashed/securely, assigning an expiry, sending via SMS provider, and creating a request audit record (§9.1).
- **FR-029**: System MUST use six-digit OTPs with short expiry and a limited number of verification attempts, MUST invalidate a prior OTP when a new one is issued, and MUST NOT store OTPs in plain text in logs or expose them to support staff (§9.2).
- **FR-030**: System MUST present an OTP entry screen with masked mobile number, six-digit input with auto-focus/auto-advance/paste support, resend countdown, change-number option, submit action, and support link (§9.3).
- **FR-031**: System MUST return distinct, clear error states for incorrect OTP, expired OTP, too-many-attempts, resend-limit-reached, and temporary service unavailability (§9.4).
- **FR-032**: System MUST support optional auto-submit when all six OTP digits are entered, while preventing repeated duplicate submission requests on slow networks (§9.5).
- **FR-033**: System MUST, for a new social-login user, verify the provider identity and email status, search for an existing matching account, create a new account or trigger an account-link flow, capture required consent, and start onboarding (§10.1).
- **FR-034**: System MUST, when a social login's email matches an existing password-based account, require secure account-link confirmation rather than automatically merging the accounts (§10.2).
- **FR-035**: System MUST collect additional required details when a social provider does not supply name or email (§10.3).
- **FR-036**: System MUST, on detecting a revoked social-provider connection, invalidate the existing session where risk warrants it and prompt the user to set an alternative login method (§10.4).
- **FR-037**: System MUST present the login page with logo, headline, identifier input, password input, login button, Google/Apple login, OTP login option, forgot-password link, signup link, language selector, optional remember-me, and support link (§11.1).
- **FR-038**: System MUST support a single "email or mobile number" identifier field and automatically detect the correct login method from the normalized value (§11.2).
- **FR-039**: System MUST validate login submissions for required identifier, valid format, password requirement where applicable, account state, verification status, and attempt limits (§11.3).
- **FR-040**: System MUST show a generic, security-friendly login error message alongside forgot-password, resend-verification, use-OTP, and contact-support actions, without revealing which specific field was incorrect (§11.4).
- **FR-041**: System MUST route a successful login by priority: (1) a preserved protected URL, (2) a pending checkout, (3) a pending event registration, (4) incomplete onboarding, (5) the member dashboard (§11.5).
- **FR-042**: System MUST support optional passwordless login via email magic link and mobile OTP, using short-lived, single-use tokens with device/IP risk checks, redirect preservation, audit logging, invalid-token handling, and link-scanner-safe behavior (§12).
- **FR-043**: System MUST accept only email or mobile number on the forgot-password request screen and MUST return an identical, non-account-existence-revealing response regardless of whether a match is found (§13.1).
- **FR-044**: System MUST send a password-reset email containing a reset CTA, expiry, security note, support link, and ignore-if-not-you instruction (§13.2).
- **FR-045**: System MUST validate the reset token as valid, unused, and unexpired before accepting a new password, enforce the password policy, confirm password match, and apply a configurable old-password-reuse policy (§13.3).
- **FR-046**: System MUST, on successful password reset, apply configurable existing-session revocation for standard users, send a security notification, present a login CTA, and create an audit log entry (§13.4).
- **FR-047**: System MUST revoke **all** active sessions of a staff account whenever that account's password is reset, regardless of the general session-revocation configuration (§13.4).
- **FR-048**: System MUST support account recovery via verified alternate email, verified alternate mobile, recovery codes, support-assisted identity verification, and organization-admin confirmation for managed accounts (§14).
- **FR-049**: System MUST prevent support agents from directly viewing or setting a user's password, and MUST route recovery requests through ticket creation, identity evidence collection, risk review, approval, recovery-link issuance, and audit logging, with dual approval available for high-risk account recovery (§14).
- **FR-050**: System MUST make two-factor authentication mandatory for admin, finance, super-admin, and system-flagged high-risk accounts, and optional for standard users (§15.1).
- **FR-051**: System MUST support authenticator app (preferred), SMS OTP, email OTP as fallback, and recovery codes as 2FA methods (§15.2).
- **FR-052**: System MUST require password re-entry, display of QR/secret, verification code entry, recovery-code generation, a confirmation notification, and an audit event as the 2FA setup flow (§15.3).
- **FR-053**: System MUST issue one-time-use, hashed-storage recovery codes that can be downloaded or copied, with a regenerate option that invalidates all previously issued codes (§15.4).
- **FR-054**: System MUST require password plus current 2FA or recovery-code verification to disable 2FA, and MUST send a security notification and create an audit record when 2FA is disabled (§15.5).
- **FR-055**: System MUST support web, mobile, admin, and temporary checkout session types, storing session ID, user ID, device ID, device name, browser/app version, operating system, approximate location, IP, created time, last active time, expiry, revoked status, and authentication strength for each session (§16.1-16.2).
- **FR-056**: System MUST use short-lived access tokens with rotating refresh tokens, secure HTTP-only cookies for web, secure storage for mobile, and refresh-token reuse detection (§16.3).
- **FR-057**: System MUST apply role-based, configurable session expiry — a reasonably persistent session for standard users, and a shorter idle timeout with strong re-authentication for admins (§16.4).
- **FR-058**: System MUST allow standard users multiple concurrent device sessions while allowing admin-configurable maximum session limits by role and organization policy (§16.5).
- **FR-059**: System MUST allow a user to sign out the current device, a selected device, or all devices, with all-device sign-out revoking refresh tokens, invalidating active sessions, and sending a security notification (§16.6).
- **FR-060**: System MUST provide a "Devices and Sessions" screen in profile settings listing device name, browser/app, approximate location, last active time, current-device badge, login method, and a remove-access action per device (§17).
- **FR-061**: System MUST, when an unknown device is removed, revoke its session, suggest a password change, and create a security audit log entry (§17).
- **FR-062**: System MUST evaluate login risk signals including new country, impossible travel, new device, repeated failures, known-malicious IP, token reuse, rapid password attempts, and admin login from an unusual location, and MUST apply a graduated response (allow-and-notify, additional OTP challenge, temporary block, forced password reset, session revocation, or admin security review) based on risk (§18).
- **FR-063**: System MUST notify the user of a flagged login with time, device, approximate location, and "This was me" / "Secure my account" actions (§18).

### Identity & Profile Requirements

- **FR-064**: System MUST support the following account statuses: pending verification, active, onboarding incomplete, restricted, temporarily locked, suspended, deactivated, scheduled for deletion, deleted, and merged (§19).
- **FR-065**: System MUST support restricted-account states that can independently disable posting, commenting, purchasing, withdrawing, mentor booking, or reduce the account to read-only access (§19.1).
- **FR-066**: System MUST, when a suspended user attempts to log in, display the suspension reason category, duration, an appeal option, and a support link, without exposing sensitive internal notes (§19.2).
- **FR-067**: System MUST support the core role set (Guest, Free member, Paid member, Mentor, Instructor, Moderator, Support agent, Content manager, Finance admin, Organization admin, Platform admin, Super admin) as a concept fully separate from membership plan (§20).
- **FR-068**: System MUST define permissions as discrete, action-based identifiers (e.g., `course.view`, `course.create`, `community.moderate`, `payment.refund`, `user.suspend`) bundled into roles, with user-specific overrides being controlled and audited (§21).
- **FR-069**: System MUST maintain distinct profile types: private identity profile, public member profile, mentor profile, instructor profile, and organization profile (§22).
- **FR-070**: System MUST store private identity fields (legal/account name, email, mobile, optional date of birth, billing address, tax information where needed, security settings, consent records) separately from public profile fields (display name, username, photo, cover image, headline, bio, location, profession, skills, interests, social links, achievements, badges, community activity, followers/following, public courses/products) (§22.1-22.2).
- **FR-071**: System MUST enforce username uniqueness (case-insensitive, lowercase URL-normalized), allowed character sets, minimum/maximum length, reserved-word blocking, offensive-word blocking, and impersonation protection, publishing usernames at `/members/username` (§23).
- **FR-072**: System MUST apply a limited-frequency username change policy with optional redirect from the previous URL, audit history, and a reserved period on the old username (§23).
- **FR-073**: System MUST support profile photo/cover image upload with format and size limits, minimum dimensions, crop/rotate/compress/remove actions, and a default avatar, plus MIME validation, malware scanning, metadata removal where appropriate, signed uploads, and moderation support, generating thumbnail/small/medium/large responsive sizes (§24).
- **FR-074**: System MUST calculate a profile completion percentage from configurable weighted fields (name mandatory, photo, headline, bio, profession, skills, goal, business stage, location, social link), using it only to encourage the user — never for shaming or public ranking (§25).
- **FR-075**: System MUST let users control profile visibility (public, members-only, connections-only, private) with field-specific privacy controls (location, email, mobile, activity, followers, following, achievements, revenue milestones, course completion), and MUST NOT default email or mobile number to public (§26).
- **FR-076**: System MUST organize account settings into the following categories: Profile, Account, Security, Language, Appearance, Notifications, Privacy, Connected accounts, Devices, Membership, Billing, Data and privacy, Blocked users, Organization, Support (§27).

### Onboarding Requirements

- **FR-077**: System MUST make onboarding short, progressive, and skippable according to admin policy, and MUST show a completion reminder on the dashboard when critical steps are skipped (§28).
- **FR-078**: System MUST implement the onboarding sequence in this order: (1) Welcome, (2) Language selection, (3) Primary goal, (4) User type, (5) Experience level, (6) Business stage, (7) Skill interests, (8) Time availability, (9) Preferred learning format, (10) Current challenge, (11) Optional assessment, (12) Personalized roadmap, (13) Recommended first action — with a progress indicator always visible (§29).
- **FR-079**: System MUST present the welcome step with a personalized greeting, platform value statement, expected setup time, a skip-or-continue choice per policy, a language selector, and a "Set Up My Journey" CTA (§30).
- **FR-080**: System MUST let the user choose an interface language (Tamil, Tanglish, English) separately from a content/course-language preference, changeable later in settings (§31).
- **FR-081**: System MUST let the user select one primary goal and multiple secondary goals from an admin-configurable list (§32).
- **FR-082**: System MUST let the user select a user type (Student, Working professional, Freelancer, Coach, Content creator, Entrepreneur, Small-business owner, Other) with an optional free-text field when "Other" is selected (§33).
- **FR-083**: System MUST capture experience level from a defined set of options (complete beginner through scaling stage) with a clear description per option (§34).
- **FR-084**: System MUST capture business stage from a defined set of options, including a "Not applicable yet" option for users without a business (§35).
- **FR-085**: System MUST let the user multi-select interests/skills from admin-managed categories (business, sales, marketing, content, design, development, AI, communication, leadership, finance, productivity, career) in admin-configurable order (§36).
- **FR-086**: System MUST capture time availability (15 min/day, 30 min/day, 1 hour/day, weekends only, flexible) and MUST allow the recommendation engine to adjust lesson size and reminders based on it (§37).
- **FR-087**: System MUST let the user multi-select preferred learning formats (short videos, long-form classes, audio, reading, live sessions, assignments, community learning) (§38).
- **FR-088**: System MUST capture the user's current challenge from a defined option set plus an optional free-text description (§39).
- **FR-089**: System MUST support an onboarding assessment that is optional or goal-specific mandatory per configuration, supporting single-select, multi-select, scale, yes/no, number-range, and short-text question formats, with question branching, weighted scoring, result categories, recommendation mapping, and versioning (§40).
- **FR-090**: System MUST auto-save onboarding progress on exit, prompt the user to resume from where they left off on next login, apply a configurable limited-access dashboard policy for incomplete onboarding, avoid re-asking completed steps, and provide a settings option to restart onboarding (§43).
- **FR-091**: System MUST allow admins to configure each onboarding step as mandatory, optional, skippable, or conditionally required, and MUST show a generic dashboard, a completion reminder, and a recommendation-quality note when steps are skipped (§44).
- **FR-092**: System MUST track onboarding analytics events (started, step viewed, step completed, step skipped, validation error, assessment started, assessment completed, roadmap generated, onboarding completed, onboarding abandoned) with properties including step ID, time spent, selected-answer category, device, language, and signup source, and MUST NOT send sensitive free-text content to analytics (§45).

### Personalization & Roadmap Requirements

- **FR-093**: System MUST generate, upon onboarding completion, a personalized roadmap containing user goal summary, current stage, recommended learning path, recommended first course, recommended community group, recommended challenge, recommended event, recommended AI tool, expected weekly commitment, and a first milestone (§41).
- **FR-094**: System MUST base roadmap generation on primary goal, user type, experience, business stage, interests, time availability, preferred format, membership access, course prerequisites, language, and completed content, using admin-configurable rules (§42).
- **FR-095**: System MAY use AI to generate the roadmap but MUST always provide a deterministic, static-rule-based fallback that activates automatically when AI generation fails, so roadmap delivery never depends on AI availability (§42; consistent with Constitution Article II).
- **FR-096**: System MUST source personalization from explicit preferences, onboarding answers, course activity, search, saved items, event attendance, community groups, membership, business milestones, and user feedback, and MUST NOT use sensitive personal attributes, private messages without explicit product need and consent, or unnecessary protected-category inference (§84).
- **FR-097**: System MUST display a plain-language reason on every recommendation card explaining why it was recommended (e.g., "based on your freelancing goal and beginner level"), and MUST let users access controls over their recommendations (§85).

### Dashboard Requirements

- **FR-098**: System MUST design the member dashboard to summarize the user's current state, clearly show the next action, motivate progress, prevent missed important events, surface relevant modules, and reduce information overload — and MUST NOT function as a social-feed clone (§46).
- **FR-099**: System MUST render dashboard content in this top-to-bottom priority order: (1) critical account/payment alerts, (2) next best action, (3) continue learning, (4) upcoming live session, (5) current challenge, (6) progress and milestones, (7) personalized recommendations, (8) community highlights, (9) saved items, (10) membership and rewards (§47).
- **FR-100**: System MUST render a dashboard header with time-aware, localized greeting, user display name, profile photo, search, notifications, quick-create button, membership badge, optional streak indicator, and mobile menu (§48).
- **FR-101**: System MUST support account alert banners (verify email, verify mobile, complete profile, membership expiring, payment failed, account security issue, course deadline, event starting soon, policy update, organization invitation) each with severity, title, description, CTA, dismissibility, expiry, and audience, and MUST NOT allow critical security alerts to be dismissed (§49).
- **FR-102**: System MUST render exactly one primary Next Best Action card (with title, reason, estimated time, progress, CTA, optional deadline, related module) at a time, with any secondary actions listed separately (§50).
- **FR-103**: System MUST render a Continue Learning section (up to a configurable number of courses) showing thumbnail, course name, current module/lesson, progress percentage, last-accessed time, remaining-time estimate, and continue CTA, ordered by most-recently-active first, with distinct states for completed courses, expired access, and removed content, and cross-device progress sync (§51).
- **FR-104**: System MUST generate a daily action plan derived from the roadmap and stated time availability, with tasks (watch lesson, read resource, complete task, post update, attend event, use AI tool, follow up lead, review progress) each carrying title, category, estimated minutes, priority, completion state, and CTA; user-completable tasks MUST be manually markable and system-verifiable tasks MUST auto-complete (§52).
- **FR-105**: System MUST render an Upcoming Events widget with title, date, time, timezone, countdown, join/register CTA, and calendar CTA, supporting not-registered, registered, starting-soon, live, completed, replay-available, and cancelled states, enabling the join button only within the event's start window (§53).
- **FR-106**: System MUST render a Current Challenge widget (challenge name, day/progress, current task, deadline, team, points, submit CTA) or, absent an active challenge, a recommended-challenge prompt with a browse-challenges CTA (§54).
- **FR-107**: System MUST render a Progress Overview with configurable metrics (learning progress, tasks completed, current streak, courses completed, certificates, community contribution, business milestone, points, level) scoped by membership/role, avoiding any fake precision (§55).
- **FR-108**: System MUST track business milestones (goal selected, niche finalized, offer created, first post published, first lead, first client call, first customer, ₹1,000/₹10,000/₹1-lakh revenue, team member hired) with a distinct, clearly displayed verification badge for user-self-declared, system-verified, mentor-verified, and admin-verified milestones (§56).
- **FR-109**: System MUST render personalized recommendation cards (courses, lessons, events, mentors, community groups, challenges, AI tools, resources, marketplace products) each with a "why recommended" reason, relevance, CTA, dismiss, and save actions, and MUST capture user feedback (not interested, already know this, show later, wrong recommendation) (§57).
- **FR-110**: System MUST render a Community Highlights widget (trending discussion, member win, mentor announcement, group update, unanswered question) that respects content permissions and MUST NOT replace the full community feed (§58).
- **FR-111**: System MUST render admin/role/membership-configurable Quick Actions (create post, ask question, open AI assistant, add lead, book mentor, join event, browse courses, record milestone, contact support) (§59).
- **FR-112**: System MUST render a Membership widget (current plan, status, renewal date, usage limits, AI credits, upgrade CTA, manage-billing link) supporting free, trial, active, grace period, payment failed, cancelled, expired, and organization-sponsored states (§60).
- **FR-113**: System MUST, when the AI module is enabled, render an AI Usage widget (credits remaining, recent tools, saved outputs, recommended AI task, upgrade/buy-credits option) with a clearly shown usage reset date (§61).
- **FR-114**: System MUST render a Saved Items widget (courses, lessons, posts, resources, events, mentors, AI outputs) showing recent items and a "View all" link (§62).
- **FR-115**: System MUST render a header notification badge (unread count, priority indicator) with a dropdown preview (latest notifications, mark-all-read, view-all, notification settings) whose deep links open the correct destination (§63).
- **FR-116**: System MUST use a dashboard-widget data model that supports future reordering, hiding optional widgets, compact view, goal-focused layout, and role-specific layout, with an admin-defined layout acceptable for MVP (§64).
- **FR-117**: System MUST tailor dashboard widgets by role: Free Member (free learning, community, upgrade, profile completion), Paid Member (courses, events, challenges, mentorship, progress), Mentor (+upcoming sessions, student requests, availability, earnings, reviews), Instructor (+course performance, assignments, learner questions, upcoming classes), Organization Admin (+team activity, licenses, course completion, invitations, reports) (§65).
- **FR-118**: System MUST show a guided empty-state dashboard for new users (welcome, onboarding progress, start-first-course, join-community, upcoming event, AI tool demo, profile completion) rather than a blank dashboard (§66).
- **FR-119**: System MUST show a simplified "welcome back" experience for users returning after a configurable inactivity period (what changed summary, resume recommendation, missed deadlines, new relevant events, membership state, simplified restart plan) without dumping an overwhelming backlog (§67).
- **FR-120**: System MUST load dashboard widgets independently with skeleton loading states, layout stability, isolated per-widget failure and retry, critical-data-first ordering, and caching of non-sensitive content — a single widget failure MUST NOT fail the entire dashboard (§68).
- **FR-121**: System MUST show clear, CTA-driven empty states for no active course, no upcoming event, and no active challenge (§69).
- **FR-122**: System MUST show human-readable dashboard error states with retry action and support reference (technical details hidden), redirect to secure login on authentication failure, and show a membership explanation on entitlement failure (§70).
- **FR-123**: System MUST support offline/low-network dashboard behavior on mobile (cached dashboard summary, downloaded-lesson access, safe offline action queueing, network-status banner, sync status), MUST badge stale sensitive/time-critical values, and MUST NOT allow payment, booking, or submission finalization while offline (§71).
- **FR-124**: System MUST provide member navigation with a desktop sidebar (Dashboard, Learn, Community, Challenges, Events, Mentors, AI Tools, Marketplace, Business Workspace, Saved, Notifications, Profile, Support) and a mobile bottom navigation (Home, Learn, Community, AI, Profile) with remaining modules under a "More" menu (§72).
- **FR-125**: System MUST provide a global member search across courses, lessons, posts, members, groups, mentors, events, resources, and marketplace, returning only access-controlled content the requesting user is permitted to see (§73).

### Role & Account-State Requirements

- **FR-126**: System MUST, if/when an admin/support impersonation feature is enabled, require strong permission, an explicit reason, a time-limited session, a visible impersonation banner, full audit logging, and disabling of user-sensitive actions (payment and password changes) during the session, and MUST NOT allow silent impersonation (§74).
- **FR-127**: System MUST provide an admin user list with columns for user, email, mobile, role, membership, status, signup date, last active, verification, organization, and risk flag, filterable by role, membership, status, verification, signup source, date range, language, country, organization, and last active (§75).
- **FR-128**: System MUST support admin actions on user records: view profile, edit approved fields, resend verification, reset onboarding, assign role, change status, add internal note, view sessions, revoke sessions, suspend, restore, and export permitted data (§75).
- **FR-129**: System MUST present an admin user detail view with tabs for Overview, Profile, Authentication, Membership, Courses, Community, Payments, Events, Mentor sessions, Support tickets, Security, Consent, Activity log, and Admin notes, with mandatory masking of sensitive data (§76).
- **FR-130**: System MUST require permission and a reason for any role change, create an audit log entry, support optional approval, notify the user based on role, and immediately refresh the user's effective permissions, with dual approval recommended for granting super-admin roles (§77).
- **FR-131**: System MUST support a controlled admin account-merge workflow that verifies ownership, selects a primary account, migrates purchases/progress/memberships, handles duplicate profile data, revokes old sessions, preserves audit history, and redirects old identity references, routing financial conflicts to manual review (§78).
- **FR-132**: System MUST allow policy-permitted temporary account deactivation that hides the public profile, pauses notifications, allows reactivation via login, retains data per policy, and explicitly explains subscription handling — deactivation MUST NOT automatically cancel a subscription (§79).
- **FR-133**: System MUST implement the account deletion flow as: open Data and Privacy → select Delete Account → explain consequences → re-authenticate → optional reason → confirm → cooling-off period where applicable → delete/anonymize per policy → send confirmation (§80).
- **FR-134**: System MUST evaluate active subscription, pending refund, mentor payout, organization ownership, legal retention requirements, community content, certificates, and financial records as deletion considerations, anonymizing or deleting user-generated content per policy and law (§80).
- **FR-135**: System MUST let a user request a secure, time-limited, identity-verified export of their profile, course progress, posts, comments, saved items, orders, certificates, consent records, and AI history where applicable, with an audit log entry and completion notification (§81).
- **FR-136**: System MUST let users withdraw consent for marketing email, push, SMS, WhatsApp, product updates, partner offers, and personalization independently, and MUST clearly explain which transactional communications remain unaffected by opt-out (§82).
- **FR-137**: System MUST provide category-wise (learning reminders, community, events, mentor sessions, payments, membership, marketing, security, product updates) and channel-wise (in-app, push, email, SMS, WhatsApp) notification preference controls, and MUST NOT allow security notifications to be disabled (§83).

### Security Requirements

- **FR-138**: System MUST hash passwords using an approved adaptive hashing algorithm and MUST generate all tokens securely (§89).
- **FR-139**: System MUST implement refresh-token rotation, secure cookie flags, CSRF protection, and XSS protection across authentication surfaces (§89).
- **FR-140**: System MUST implement rate limiting, bot protection, and credential-stuffing defense on authentication endpoints (§89).
- **FR-141**: System MUST implement login anomaly detection, periodic secret rotation, and session revocation capability (§89).
- **FR-142**: System MUST log security-relevant activity for audit purposes and MUST encrypt data in transit, and at rest where appropriate (§89).
- **FR-143**: System MUST create an audit log entry for email changed, mobile changed, password changed, 2FA changed, session revoked, role changed, account status changed, account merged, user deleted, admin profile edit, and consent changed events, each capturing actor, target, action, timestamp, source, IP, device, safe before/after fields, reason, and correlation ID (§88).
- **FR-144**: System MUST NOT store passwords, tokens, or OTPs in audit log records, in analytics events, or in plain text anywhere in request/response logs (§86, §88).

### Analytics Requirements

- **FR-145**: System MUST emit authentication analytics events: `signup_started`, `signup_method_selected`, `signup_completed`, `signup_failed`, `verification_sent`, `verification_completed`, `verification_failed`, `login_started`, `login_succeeded`, `login_failed`, `password_reset_requested`, `password_reset_completed`, `social_account_linked`, `session_revoked`, `two_factor_enabled`, `two_factor_disabled`, `account_recovery_started`, `account_deleted` (§86).
- **FR-146**: System MUST emit dashboard analytics events: `dashboard_viewed`, `next_action_viewed`, `next_action_clicked`, `course_resumed`, `daily_task_completed`, `recommendation_viewed`, `recommendation_clicked`, `recommendation_dismissed`, `event_join_clicked`, `profile_completion_clicked`, `membership_upgrade_clicked`, `quick_action_clicked` (§87).

### Performance Requirements

- **FR-147**: System MUST show an immediate loading state for authentication actions and acknowledge OTP requests quickly (§90).
- **FR-148**: System MUST prioritize critical dashboard content first, optimize profile images, load independent widgets in parallel where safe, and apply a timeout-based fallback in the recommendation engine (§90).
- **FR-149**: System MUST locally preserve an onboarding answer when the save request fails, so the user's input is not lost (§90).

### Accessibility Requirements

- **FR-150**: System MUST provide proper form labels, an accessible name for the password-visibility toggle, screen-reader support for OTP inputs, error announcements, keyboard navigation, and focus management across authentication flows (§91).
- **FR-151**: System MUST use semantic landmark regions, provide optional keyboard shortcuts, provide text alternatives for charts, maintain visible focus indicators, support reduced-motion preferences, and expose screen-reader-friendly progress values on the dashboard (§91).

### Localization Requirements

- **FR-152**: System MUST store all authentication and onboarding UI strings as translation keys (no hardcoded mixed-language text) and MUST support Tamil script, Tanglish, and English (§92).
- **FR-153**: System MUST NOT auto-transliterate user-generated names, and MUST localize date, time, number, and currency display (§92).

### API & Data Requirements

- **FR-154**: System MUST expose API groups for signup, login, OTP, verification, password reset, social auth, session, device, profile, username, onboarding, assessment, roadmap, dashboard, preferences, consent, account deletion, data export, and admin user management, with detailed endpoint contracts defined in a separate API specification volume (§93) [NEEDS CLARIFICATION: source references "Volume 15" for detailed API endpoints and "Volume 14" for detailed data schema, but neither the repository's current volume map nor `FEATURE-MANIFEST.md` defines a Volume 15, and Volume 14 in this repository is the Enterprise Marketing Platform, not a data-schema reference — this appears to be a numbering inconsistency in the source that must be resolved before endpoint/schema work begins].
- **FR-155**: System MUST implement the following core data entities: User, User Identity, Login Provider, Email Address, Mobile Number, Password Credential, Session, Device, Two-Factor Method, Recovery Code, User Profile, User Role, Permission, Role Permission, Membership Entitlement, User Preference, Consent Record, Onboarding Response, Assessment, Assessment Result, Roadmap, Recommendation, Dashboard Configuration, User Milestone, Security Event, Audit Log, Account Recovery Request, Data Export Request, and Account Deletion Request (§94).
- **FR-156**: System MUST implement the defined authentication, profile, onboarding, and dashboard error codes (e.g., `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_UNVERIFIED`, `AUTH_ACCOUNT_LOCKED`, `AUTH_ACCOUNT_SUSPENDED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED`, `AUTH_TOO_MANY_ATTEMPTS`, `AUTH_SESSION_EXPIRED`, `AUTH_REAUTH_REQUIRED`, `AUTH_PROVIDER_CONFLICT`, `PROFILE_USERNAME_TAKEN`, `PROFILE_IMAGE_INVALID`, `PROFILE_UPDATE_RESTRICTED`, `ONBOARDING_STEP_INVALID`, `ONBOARDING_SAVE_FAILED`, `ROADMAP_GENERATION_FAILED`, `DASHBOARD_PARTIAL_FAILURE`, `ENTITLEMENT_REQUIRED`, `RESOURCE_UNAVAILABLE`) (§95).

### Key Entities *(include if feature involves data)*

- **User**: The root account record tying a single person to one primary platform identity; holds account status and links to all identity, profile, role, and session data.
- **User Identity / Login Provider**: The authentication-side record(s) linking one or more login methods (email/password, mobile OTP, Google, Apple, future SSO/SAML/OIDC) to a single User; distinct from profile data.
- **Email Address / Mobile Number**: Verifiable contact identifiers on the account, each with a verification status, used both for login and for security/recovery communication.
- **Password Credential**: The hashed password and associated policy-compliance metadata (breach-check status, reuse history where policy requires it); never stored or logged in plain text.
- **Session**: A single authenticated session (web, mobile, admin, or temporary checkout) with device, location, IP, timestamps, expiry, revocation status, and authentication strength.
- **Device**: A recognized device/browser associated with one or more sessions, displayed to the user for management and revocation.
- **Two-Factor Method**: A configured 2FA mechanism (authenticator app, SMS OTP, email OTP fallback) attached to a User, distinct from Recovery Code.
- **Recovery Code**: A one-time-use, hashed backup credential set generated at 2FA setup or regeneration, used for account/2FA recovery.
- **User Profile**: The public-facing identity record (display name, username, photo, cover image, headline, bio, location, profession, skills, interests, social links, achievements, badges) distinct from the private/authentication identity.
- **User Role**: The assigned role (Guest, Free member, Paid member, Mentor, Instructor, Moderator, Support agent, Content manager, Finance admin, Organization admin, Platform admin, Super admin), conceptually separate from Membership Entitlement.
- **Permission / Role Permission**: Discrete, action-based permission identifiers (e.g., `course.publish`, `payment.refund`) bundled into roles via a Role Permission mapping, with auditable per-user overrides.
- **Membership Entitlement**: The user's plan/subscription-derived access level and limits, owned by the membership/payments domain (Volume 09) and consumed here for dashboard display and gating.
- **User Preference**: Stored settings including language (interface vs. content), notification preferences (category x channel), and dashboard-related preferences.
- **Consent Record**: A per-channel, versioned, timestamped consent/withdrawal record (marketing email, push, SMS, WhatsApp, product updates, partner offers, personalization), per Constitution Article VI.
- **Onboarding Response**: The user's saved answer(s) for each of the 13 onboarding steps, supporting partial completion, resume, and re-answer.
- **Assessment / Assessment Result**: The optional/goal-specific onboarding assessment definition (questions, branching, weighting, versioning) and the user's scored result/category.
- **Roadmap**: The generated personalized output (goal summary, stage, learning path, first course, community group, challenge, event, AI tool, weekly commitment, first milestone) produced by AI or deterministic fallback rules.
- **Recommendation**: An individual personalized suggestion (course, lesson, event, mentor, group, challenge, AI tool, resource, marketplace product) with a relevance reason, shown on the dashboard, carrying user feedback state (dismissed, not-interested, etc.).
- **Dashboard Configuration**: The (initially admin-defined, future user-customizable) layout/ordering of dashboard widgets per role.
- **User Milestone**: A recorded business milestone (goal selected through revenue thresholds) with a verification source (self-declared, system, mentor, admin) and badge.
- **Security Event**: A recorded risk/anomaly signal (new country, impossible travel, malicious IP, etc.) and the system's response action, feeding suspicious-login handling and user notifications.
- **Audit Log**: The immutable record of identity/security/admin actions (actor, target, action, timestamp, source, IP, device, safe before/after fields, reason, correlation ID), excluding passwords/tokens/OTPs, per Constitution's Security & Compliance Baseline.
- **Account Recovery Request**: A tracked support-assisted recovery case (ticket, identity evidence, risk review, approval, recovery link).
- **Data Export Request**: A tracked, identity-verified, time-limited data export job and its resulting secure download.
- **Account Deletion Request**: A tracked deletion case including consequence acknowledgment, re-authentication, optional reason, cooling-off state, and final disposition (deleted/anonymized) per policy and legal retention rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can complete signup through any of the four initial methods (email, mobile OTP, Google, Apple) and reach either the verification screen or onboarding without ever producing more than one account per unique email/mobile identity, including under repeated/rapid form submission.
- **SC-002**: 100% of members who complete the 13-step onboarding sequence receive a personalized roadmap (goal summary, recommended course, community group, and first milestone) immediately afterward, with the deterministic fallback engaging automatically whenever AI-based generation fails — no member ever completes onboarding without a roadmap.
- **SC-003**: A password-reset or account-existence-sensitive request returns an identical response regardless of whether the submitted identifier matches a real account, verified across every such endpoint (signup duplicate-check messaging excepted, which is intentionally explicit per §7.8).
- **SC-004**: 100% of admin, finance, and super-admin accounts have two-factor authentication enforced (mandatory, not optional) before those accounts can perform privileged actions.
- **SC-005**: The dashboard renders its content in the documented 10-tier priority order (critical alerts first, membership/rewards last) for members in every tested state (new user, active learner, payment-failed, event-upcoming, challenge-active).
- **SC-006**: A single failing dashboard widget never prevents the remaining widgets from loading and functioning, observed across all widget types under simulated backend failure.
- **SC-007**: A member who exits onboarding mid-flow and resumes later is never re-presented with an already-completed step, and their in-progress answer is never lost even if the save request fails at the moment of a network interruption.
- **SC-008**: Every security-relevant account event (new device login, password/email/mobile change, account lock, suspicious activity, 2FA enable/disable) produces a corresponding user-facing notification and an audit log entry that excludes passwords, tokens, OTPs, and recovery codes.
- **SC-009**: An account-deletion request is never finalized while an unresolved active subscription, pending refund, pending mentor payout, organization ownership, or legal retention obligation exists against that account without an explicit policy-driven resolution step.
- **SC-010**: All P0 MVP capabilities (email/mobile-OTP/Google login, verification, forgot password, basic session management, profile, core onboarding, static-rule roadmap, member dashboard, continue-learning, notification preview, membership status, admin user list, account suspension, audit basics) are functioning together as a single, connected first-login-to-dashboard journey prior to initial launch.

## Assumptions

- Membership plan/subscription state (Free, Trial, Active, Grace period, Payment failed, Cancelled, Expired, Organization-sponsored; renewal date; AI credits; usage limits) is owned and computed by the membership/payments domain (Volume 09 — Membership, Payments, Revenue) per the source PRD's own module boundaries; this specification covers only the dashboard's display of that state, not its computation or billing logic.
- Course, lesson, community group, challenge, event, mentor, and marketplace-product entities referenced by onboarding recommendations, the roadmap, and dashboard widgets are owned by their respective volumes (04 Learning, 05 Community, 06 Gamification, 07 Mentors, 10 Events, 11 Marketplace); this spec defines only how identity/onboarding/dashboard reference, display, and recommend them.
- Gamification data shown on the dashboard (points, level, streak, challenge participation) is sourced from the ledger-based gamification system defined in Volume 06, consistent with Constitution Article V (Ledger-Based Internal Economies) — this spec does not redefine point-award mechanics.
- Detailed RBAC engine mechanics (full Organization → Department/Team → Role → Permission Group → Permission → Resource → Action hierarchy per Constitution Article VII) are assumed to be specified in a cross-cutting platform-governance feature; this volume defines the specific role list, permission examples, and role-change workflow relevant to member identity, not the full enterprise RBAC engine.
- The source PRD's references to "Volume 15" (detailed API endpoints, §93) and "Volume 14" (detailed data schema, §94) do not align with this repository's actual volume map (Volume 14 is the Enterprise Marketing Platform, and no Volume 15 exists in the current document set) — flagged as [NEEDS CLARIFICATION] in FR-154; treated here as an assumption that a separate, not-yet-located API/schema specification governs implementation-level contracts, and this spec defines behavior and data-entity intent only.
- SMS, email, and WhatsApp delivery infrastructure (actual provider integration, deliverability, template rendering) is assumed to be provided by a shared communications platform referenced elsewhere in the PRD (Volume 14's Communication Platform); this volume defines only the trigger conditions, content requirements, and consent rules for those messages.
- Admin/support user impersonation (§74) is explicitly described in the source as a "future" capability contingent on being built at all ("Support/admin impersonation feature future-la irundha") — it is treated as an optional, not-yet-committed capability rather than a required MVP deliverable.
- Enterprise SSO, SAML, OpenID Connect, Microsoft login, and LinkedIn login are explicitly named as "future-ready architecture" (§5) rather than initial-launch requirements; this spec requires only that the authentication architecture not preclude adding them later.
- "MVP P0" items listed in the source (§97) are treated as the minimum bar for initial production launch of this feature; P1 and P2 items (Apple login, 2FA, device management beyond basics, advanced assessment, personalized recommendations, milestones, dashboard role variants, data export, account deletion workflow, enterprise SSO, advanced risk engine, dashboard customization, AI-generated roadmap, account-merge automation, passwordless email login) may ship in subsequent releases without blocking initial launch.
- Where the source uses "configurable" without specifying a default value or numeric threshold (e.g., session idle timeout duration, concurrent session limits, resend cooldown length, inactivity period for "returning inactive user," cooling-off period length for deletion), exact defaults are left to implementation-time configuration by the platform admin/product team rather than fixed by this specification.
