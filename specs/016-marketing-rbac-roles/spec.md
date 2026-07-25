# Feature Specification: Marketing Platform User Roles, Permissions & Access Control

**Feature Branch**: `016-marketing-rbac-roles`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14, Part 1, Chapter 3 — User Roles, Permissions & RBAC for the TBT Marketing Automation Platform (`document 1/Document 1 (15).md`). Defines the RBAC framework — role hierarchy, standard roles, permission categories, resource-level permissions, approval workflow, temporary access, delegated access, authentication/session requirements, audit logging, security policies, and error handling — for the enterprise marketing module."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escalated Approval Blocks High-Blast-Radius Marketing Actions (Priority: P1)

A Campaign Manager builds a mass email campaign targeting the full audience list and submits it for send. Because a bulk/mass communication (email, SMS, or WhatsApp broadcast) is a high-blast-radius action, the system does not execute it immediately — it routes the request up the defined approval chain (Team Lead → Marketing Manager → Organization Admin → Super Admin, as applicable to the action's risk level) and only allows the send once every required approval step has been recorded. The same gate applies to campaign publishing, audience deletion, template deletion, API key modification, and system configuration changes.

**Why this priority**: This is the direct implementation of Constitution Article VII's requirement that "sensitive or high-blast-radius actions... require a defined multi-step approval chain, not a single permission bit," and is the chapter's most safety-critical capability — a single unapproved mass send can reach an organization's entire audience irreversibly. Without this gate, the rest of the RBAC model (roles, permissions) is cosmetic.

**Independent Test**: Can be fully tested by having a Campaign Manager (a role without send authority) submit a mass email/SMS/WhatsApp broadcast and confirming it is held in a pending-approval state, is not delivered to any recipient, and only proceeds once each required approver in the chain has explicitly approved it — with rejection at any step blocking the send entirely.

**Acceptance Scenarios**:

1. **Given** a Campaign Manager has built a mass email campaign targeting the full audience, **When** they submit it for send, **Then** the system places the campaign into a pending-approval state and does not dispatch any message until the required approval chain completes.
2. **Given** a bulk send is pending approval, **When** the Marketing Manager approves it but the Organization Admin has not yet acted, **Then** the campaign remains blocked from sending pending the remaining approval step(s).
3. **Given** any approver in the chain rejects the pending action, **When** the rejection is recorded, **Then** the system cancels the send, notifies the submitter, and logs the rejection to the audit trail.
4. **Given** a user attempts to delete an audience segment or a template, **When** the deletion request is submitted, **Then** the system requires approval before the deletion is executed, consistent with the same approval-chain mechanism used for bulk sends.

---

### User Story 2 - Standard Role Assignment Enforces Least-Privilege Boundaries (Priority: P1)

An Organization Administrator assigns one of the ten standard marketing roles (Super Administrator, Organization Administrator, Marketing Manager, Campaign Manager, Content Creator, Marketing Analyst, Customer Support, Sales Executive, Community Manager, External Agency) to a new team member. From that point on, the user's UI and API access is limited to exactly the capabilities and resources defined for that role — for example, a Content Creator can draft and upload assets but cannot publish, a Marketing Analyst has read-only access to dashboards and reports, and a Sales Executive can only see prospects assigned to them.

**Why this priority**: This is the foundational MVP capability — every other story (approvals, delegation, temporary access, audit) assumes that baseline role-to-permission enforcement already works. Constitution Article VII requires an explicit Role → Permission Group → Permission hierarchy rather than a flat is-admin boolean, and this story is where that hierarchy becomes user-facing.

**Independent Test**: Can be fully tested by assigning each of the 10 standard roles to a test account in turn and confirming that role-restricted actions (e.g., a Content Creator attempting to publish, a Marketing Analyst attempting to edit a campaign, a Sales Executive attempting to view a prospect not assigned to them) are blocked with an authorization error, while permitted actions succeed.

**Acceptance Scenarios**:

1. **Given** a user is assigned the Content Creator role, **When** they attempt to publish a campaign directly, **Then** the system blocks the action because publishing is outside the Content Creator's permitted capabilities.
2. **Given** a user is assigned the Marketing Analyst role, **When** they attempt to edit a campaign or delete an audience segment, **Then** the system denies the action because the role is restricted to read-only access.
3. **Given** a user is assigned the Sales Executive role, **When** they attempt to view a prospect not assigned to them, **Then** the system denies access because Sales Executive access is limited to their assigned leads.
4. **Given** a user is assigned the Super Administrator role, **When** they perform any action across users, modules, settings, integrations, or data export, **Then** the system permits it, as the Super Administrator role has no listed restrictions.

---

### User Story 3 - Temporary, Time-Bound Access Expires Automatically (Priority: P2)

An external consultant or agency is granted access to the marketing platform for a fixed window — for example, agency access for 14 days, consultant access for one month, QA access during a testing cycle, or event-manager access limited to the duration of a campaign. When the window ends, the system automatically revokes the grant without requiring an administrator to remember to remove it manually.

**Why this priority**: Time-bound access is explicitly named as a chapter objective ("Support temporary and delegated access") and is the primary control that limits the blast radius of external, non-employee access — but it is a refinement on top of the baseline role model in User Story 2, so it follows P1.

**Independent Test**: Can be fully tested by granting a role with a defined expiry date/time to a test account, confirming the account can perform the granted actions before expiry, and confirming that immediately after the expiry timestamp passes, the same actions are denied without any administrator intervention.

**Acceptance Scenarios**:

1. **Given** an agency user is granted temporary access with a 14-day expiry, **When** the 14 days elapse, **Then** the system automatically revokes the access and subsequent action attempts are denied.
2. **Given** a QA tester is granted access scoped to a testing window, **When** the testing window closes, **Then** the granted permissions are removed without requiring manual admin action.
3. **Given** a temporary access grant is still within its active window, **When** the granted user performs an in-scope action, **Then** the system permits it as normal.

---

### User Story 4 - Delegated Access Between Roles With Approval and Audit Trail (Priority: P2)

A Marketing Manager going on leave delegates campaign-execution responsibilities to a Campaign Manager for a defined period. The delegation specifies a start date, an end date, the specific permissions being delegated, whether the delegation itself requires approval before taking effect, and produces an audit trail of the delegation event and every action taken under it.

**Why this priority**: Delegation is explicitly named in the chapter (§9) as a distinct mechanism from temporary access, supporting business continuity without granting a permanent role change — but it depends on the base role model (US2) and benefits from the approval mechanism (US1) already existing.

**Independent Test**: Can be fully tested by having a Marketing Manager create a delegation to a Campaign Manager with a defined start/end date and permission set, confirming the delegate can perform only the delegated actions during the active window, confirming the delegation required approval if configured, and confirming an audit entry exists for the delegation grant and its use.

**Acceptance Scenarios**:

1. **Given** a Marketing Manager creates a delegation to a Campaign Manager with a start date, end date, and a specific set of delegated permissions, **When** the delegation is submitted, **Then** the system records the delegation and, if approval is required, holds it pending until approved.
2. **Given** an active, approved delegation, **When** the delegate performs an action within the delegated permission set during the delegation window, **Then** the system permits the action and records it in the audit trail as performed under delegated authority.
3. **Given** a delegate attempts an action outside the specifically delegated permissions, **When** the action is attempted, **Then** the system denies it even though the delegate holds an active delegation.
4. **Given** the delegation's end date passes, **When** the delegate attempts to perform a previously-delegated action, **Then** the system denies it as the delegation has expired.

---

### User Story 5 - External Agency Role Is Restricted From Customer, Analytics, and Financial Data (Priority: P2)

An external agency user logs in to upload creative assets and review the campaigns assigned to them. The system allows those specific actions but blocks the agency user from any customer data, analytics export, or financial information, consistent with the External Agency role's explicit restrictions — regardless of what a campaign they can see might otherwise expose.

**Why this priority**: External, non-employee access is the platform's highest external-exposure risk surface for sensitive marketing/customer data; enforcing these restrictions correctly is a direct trust-and-safety requirement, but it is a specialization of the base role model (US2) rather than foundational on its own.

**Independent Test**: Can be fully tested by logging in as an External Agency user, confirming asset upload and assigned-campaign review succeed, and confirming that any attempt to view customer records, export analytics, or view financial figures (revenue, spend, commissions) is denied regardless of the specific screen or API path used.

**Acceptance Scenarios**:

1. **Given** an External Agency user is authenticated, **When** they upload a campaign asset or submit creative materials for a campaign they are assigned to, **Then** the system permits the action.
2. **Given** an External Agency user is viewing a campaign they are assigned to, **When** they attempt to access the audience/customer data behind that campaign, **Then** the system denies access.
3. **Given** an External Agency user attempts to export any analytics report, **When** the export is requested, **Then** the system denies the request.
4. **Given** an External Agency user attempts to view any financial information (revenue, budget, commission figures), **When** the request is made, **Then** the system denies access.

---

### User Story 6 - Audit Trail Review of Privileged Actions (Priority: P3)

An Organization Administrator investigating a reported irregularity searches the immutable audit log for all privileged actions taken by a specific user, or on a specific resource, over a given time range — including role changes, approval decisions, delegation grants, and denied (403) access attempts — and exports the results for a compliance review.

**Why this priority**: Audit review is an operational/compliance capability that depends on every other story already producing audit records (US1 through US5 all write to the same audit log); it is essential for governance but is naturally sequenced after the actions it records exist.

**Independent Test**: Can be fully tested by performing a mix of privileged actions (role assignment, approval, delegation, a denied unauthorized attempt) under test accounts, then confirming an administrator can search the audit log by user, role, action, module, resource, and date range, and export the filtered results.

**Acceptance Scenarios**:

1. **Given** a mix of privileged actions has occurred, **When** an administrator searches the audit log by user and date range, **Then** the system returns every matching immutable audit record with actor, action, module, resource, previous/new value, IP, device, browser, timestamp, and status.
2. **Given** a search result set, **When** the administrator requests export, **Then** the system produces an exportable file of the filtered audit records.
3. **Given** a user was denied access to an action (HTTP 403), **When** the administrator searches for that user's activity, **Then** the denied attempt appears in the audit trail with its outcome status.

---

### Edge Cases

- What happens when a delegated access grant's end date passes while an action submitted under that delegation is still mid-approval-chain — does the pending approval get cancelled, does it proceed on the strength of the now-expired delegation, or does it require re-delegation before it can continue?
- How does the system handle an approval-chain bottleneck where the next required approver (e.g., the only assigned Team Lead) is unavailable, unassigned, or has left the organization, leaving a time-sensitive campaign (e.g., an event-tied broadcast) stuck indefinitely pending approval?
- What happens when a user's role is changed or downgraded while they have an in-progress action that required their prior role's permissions (e.g., a Campaign Manager mid-scheduling a bulk send is reassigned to Content Creator before the send completes)?
- How does the system resolve overlapping temporary access grants for the same external user across two concurrent campaigns with different expiry dates and different permission sets?
- Can a delegated user (e.g., a Campaign Manager who received a delegation) further sub-delegate to another user ("Campaign Execution" per the chapter's delegation chain example), and if so, what happens if that sub-delegate's window outlives the parent delegation?
- What happens when a privileged user's concurrent session limit is reached and they attempt to log in from an additional device — is the oldest session force-terminated, or is the new login blocked?
- If suspicious activity is detected mid-session for a user who is in the middle of executing an already-approved bulk send, does the system pause or cancel the in-flight send, and what happens to messages already dispatched at that point?
- Since the Super Administrator role is documented with "Restrictions: None," what happens when one Super Administrator attempts to delete or demote another Super Administrator account — is this genuinely unrestricted, or does it implicitly require the same approval-chain protection as other high-risk actions? [NEEDS CLARIFICATION: source states "None" for Super Admin restrictions with no carve-out for peer Super Admin accounts, which may conflict with the approval-chain principle applied elsewhere in this chapter and with dual-approval patterns used for high-risk actions in other volumes.]

## Requirements *(mandatory)*

### Functional Requirements

#### Role Hierarchy & RBAC Architecture

- **FR-001**: System MUST implement an authorization hierarchy of Organization → Department → Role → Permission Group → Permission → Resource → Action, and MUST require every request to pass through authentication, authorization, and permission validation before execution (§3).
- **FR-002**: The RBAC system MUST protect sensitive marketing data, prevent unauthorized access, support multiple administrative levels, allow custom role creation, enable permission inheritance, provide complete auditability, support temporary and delegated access, and maintain compliance with organizational security policies (§2).
- **FR-003**: RBAC configuration MUST be dynamic and manageable from the Admin Portal, scaling to support future organizational growth without requiring code changes (§1).
- **FR-004**: System MUST allow administrators to create custom roles beyond the 10 standard roles defined in this chapter (§2, §4).
- **FR-005**: System MUST support permission inheritance through the role hierarchy rather than requiring every permission to be assigned individually to every role (§2, §3).

#### Standard Roles

- **FR-006**: System MUST provide a Super Administrator role with full system control: create/edit/delete all users, manage all modules, configure global settings, assign roles, access security logs, view financial reports, manage integrations, export all data, and restore backups, with no listed restrictions (§4.1).
- **FR-007**: System MUST provide an Organization Administrator role permitted to manage organization-level marketing, manage campaigns, manage users within the organization, view analytics, configure workflows, and manage templates, restricted from accessing platform infrastructure and from deleting Super Admin accounts (§4.2).
- **FR-008**: System MUST provide a Marketing Manager role permitted to create campaigns, publish campaigns, approve marketing content, monitor campaign performance, manage the marketing team, and view reports, restricted from changing system settings or modifying security configuration (§4.3).
- **FR-009**: System MUST provide a Campaign Manager role permitted to build, schedule, clone, pause, resume, and archive campaigns, restricted from deleting production campaigns without approval (§4.4).
- **FR-010**: System MUST provide a Content Creator role permitted to write email content, design landing pages, create banners, upload images, draft campaign templates, and use AI-assisted content generation, restricted from publishing directly (§4.5).
- **FR-011**: System MUST provide a Marketing Analyst role permitted dashboard access, analytics reports, KPI monitoring, funnel analysis, report export, and ROI calculations, restricted to read-only access (§4.6).
- **FR-012**: System MUST provide a Customer Support role permitted to view customer interactions, view campaign history, respond to support tickets, and update communication preferences, restricted from editing campaigns (§4.7).
- **FR-013**: System MUST provide a Sales Executive role permitted lead management, pipeline updates, and customer follow-up, with access limited to that user's own assigned prospects (§4.8).
- **FR-014**: System MUST provide a Community Manager role permitted community campaigns, push notifications, community engagement, and moderation, restricted from accessing financial analytics (§4.9).
- **FR-015**: System MUST provide an External Agency role permitted to upload campaign assets, review assigned campaigns, and submit creative materials, restricted from customer data access, analytics export, and financial information (§4.10).

#### Permission Categories & Resource-Level Access

- **FR-016**: System MUST group permissions into functional categories: User Management, Campaign Management, Audience Management, Communication, Analytics, AI Features, and System Configuration (§5).
- **FR-017**: System MUST support User Management permissions of View Users, Create Users, Edit Users, Suspend Users, Delete Users, Assign Roles, Reset Password, and Unlock Accounts (§5).
- **FR-018**: System MUST support Campaign Management permissions of Create, Edit, Publish, Schedule, Pause, Resume, Archive, Delete, Duplicate, and Export (§5).
- **FR-019**: System MUST support Audience Management permissions of Create Segments, Import Audience, Export Audience, Delete Audience, Merge Audience, and AI Segmentation (§5).
- **FR-020**: System MUST support Communication permissions of Email Campaigns, SMS Campaigns, WhatsApp Campaigns, Push Notifications, In-App Messages, Test Sends, and Broadcast Messages (§5).
- **FR-021**: System MUST support Analytics permissions of View Dashboard, Export Reports, Revenue Analytics, Attribution Reports, Funnel Reports, and Cohort Analysis (§5).
- **FR-022**: System MUST support AI Features permissions of Generate Email, Generate Subject Lines, Campaign Suggestions, Audience Prediction, AI Translation, and AI Optimization (§5).
- **FR-023**: System MUST support System Configuration permissions of Branding, Integrations, SMTP, SMS Gateway, API Keys, Feature Flags, and Webhooks (§5).
- **FR-024**: System MUST enforce a resource-level permission matrix per the defined action set (View, Create, Edit, Delete, Export, Approve) independently for Campaign, Audience, Template, Workflow, Analytics, and Users resources — with Analytics limited to View and Export, and Approve not applicable to Audience or Users resources (§6).

#### Approval Chains

- **FR-025**: System MUST require approval before executing high-blast-radius actions, including: publishing campaigns, bulk email campaigns, mass SMS campaigns, WhatsApp broadcasts, audience deletion, template deletion, API key modification, and system configuration changes (§7).
- **FR-026**: System MUST route approval requests through an escalating approval chain of Team Lead → Marketing Manager → Organization Admin → Super Admin, and MUST NOT permit the gated action to execute until the required step(s) in the chain have approved it (§7).

#### Temporary Access

- **FR-027**: System MUST support time-bound (temporary) access grants for defined durations, such as agency access for 14 days, consultant access for one month, QA access during a testing cycle, or event-manager access scoped to a campaign period (§8).
- **FR-028**: System MUST automatically revoke expired temporary access grants without requiring manual administrator action (§8).

#### Delegated Access

- **FR-029**: System MUST allow a user to delegate responsibilities and permissions temporarily to another user (e.g., a Marketing Manager delegating campaign-execution authority to a Campaign Manager) (§9).
- **FR-030**: Each delegation MUST record a start date and an end date bounding the delegation's active window (§9).
- **FR-031**: Each delegation MUST specify the discrete set of delegated permissions being granted, rather than the delegate's entire role (§9).
- **FR-032**: System MUST support an optional approval requirement that must be satisfied before a delegation grant takes effect (§9).
- **FR-033**: System MUST maintain an audit trail for every delegation grant and for actions performed under delegated authority (§9).

#### Authentication & Session Management

- **FR-034**: System MUST require all privileged users to authenticate via email login under a strong password policy (§10).
- **FR-035**: System MUST require Multi-Factor Authentication (MFA) for privileged users (§10; Constitution Security & Compliance Baseline).
- **FR-036**: System MUST perform device verification, enforce session timeout, and monitor IP addresses for privileged user sessions (§10).
- **FR-037**: System MUST provide failed-login protection for privileged accounts (§10).
- **FR-038**: System MUST enforce concurrent session limits and support session revocation and remote logout (§11).
- **FR-039**: System MUST enforce idle timeout and support forced password reset and token refresh (§11).
- **FR-040**: System MUST detect suspicious session activity (§11).

#### Audit

- **FR-041**: System MUST generate an immutable audit record for every privileged action (§12).
- **FR-042**: Each audit record MUST capture User ID, Role, Action, Module, Resource, Previous value, New value, IP address, Device, Browser, Timestamp, and Status (§12).
- **FR-043**: Audit logs MUST be searchable and exportable (§12).

#### Security Policies & Error Handling

- **FR-044**: System MUST enforce the Principle of Least Privilege and apply Default Deny to any request that does not match an explicit permission grant (§13).
- **FR-045**: System MUST perform permission validation on every action and enforce authorization at the API layer, not only in the UI (§13).
- **FR-046**: System MUST perform secure token verification for all authenticated requests (§13).
- **FR-047**: System MUST enforce encryption at rest and encryption in transit for RBAC-governed data (§13).
- **FR-048**: System MUST use password hashing for all stored credentials (§13).
- **FR-049**: System MUST support regular permission reviews (§13).
- **FR-050**: When an unauthorized action is attempted, system MUST return HTTP 403 Forbidden, log the incident, prevent disclosure of information that would help probe the system's permission structure, and display a user-friendly error message (§14).
- **FR-051**: System MUST notify administrators when repeated unauthorized-access violations occur (§14).

### Key Entities *(include if feature involves data)*

- **Role**: A named, assignable position (e.g., Marketing Manager, Content Creator, External Agency) that bundles Permission Groups; one of the 10 standard roles or an administrator-defined custom role, sitting below Department and above Permission Group in the RBAC hierarchy.
- **Permission Group**: A functional grouping of related permissions (User Management, Campaign Management, Audience Management, Communication, Analytics, AI Features, System Configuration) assigned to one or more roles.
- **Permission**: A discrete, action-based grant (e.g., "Create Segments," "Publish," "Export Reports") that a Permission Group bundles and a Role inherits.
- **Resource**: An object type permissions apply to (Campaign, Audience, Template, Workflow, Analytics, Users), each supporting its own subset of View/Create/Edit/Delete/Export/Approve actions.
- **Action**: A specific operation performable on a Resource (View, Create, Edit, Delete, Export, Approve, Publish, Schedule, Pause, Resume, Archive, Duplicate, etc.), the lowest level of the RBAC hierarchy.
- **Approval Chain / Approval Request**: A record of a gated, high-blast-radius action pending sequential sign-off (Team Lead → Marketing Manager → Organization Admin → Super Admin), tracking each step's approver, decision, and timestamp until the action is released for execution or rejected.
- **Temporary Access Grant**: A role or permission assignment bound to a start/expiry window (e.g., 14-day agency access), auto-revoked by the system when the window closes.
- **Delegated Access Grant**: A record of one user delegating a specific subset of permissions to another user, capturing start date, end date, the delegated permission set, whether approval is required, its approval status, and an audit trail of use.
- **Session**: An authenticated user session subject to concurrent-session limits, idle timeout, revocation, remote logout, token refresh, and suspicious-activity detection.
- **Audit Log Entry**: An immutable record of a privileged action capturing user ID, role, action, module, resource, previous value, new value, IP address, device, browser, timestamp, and status; searchable and exportable.
- **Organization / Department**: The top two levels of the RBAC hierarchy above Role, scoping which roles, users, and resources a given administrative boundary can act on.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of high-blast-radius actions (bulk email/SMS/WhatsApp broadcasts, campaign publishing, audience deletion, template deletion, API key modification, system configuration changes) are blocked from executing until every required step of the applicable approval chain has recorded an approval.
- **SC-002**: 100% of expired temporary access and delegated access grants are auto-revoked with no residual access, verified by attempting a previously-granted action immediately after expiry [NEEDS CLARIFICATION: maximum acceptable revocation latency after expiry not specified in source — e.g., near-instant vs. within a defined batch-job interval].
- **SC-003**: External Agency accounts show zero successful attempts to access customer data, export analytics, or view financial information across an audit sample of agency account activity.
- **SC-004**: 100% of privileged actions (as defined in §12) produce a searchable, exportable, immutable audit record containing all 12 required fields.
- **SC-005**: 100% of unauthorized action attempts receive an HTTP 403 response and are logged; administrators receive a notification for repeated-violation patterns from the same actor [NEEDS CLARIFICATION: violation count/time-window threshold that constitutes "repeated" is not specified in source].
- **SC-006**: A role or permission change takes effect on the affected user's next request without requiring the user to log out and back in.
- **SC-007**: An administrator can define and activate a new custom role, entirely through Admin Portal configuration, with zero code deployment required.
- **SC-008**: 100% of privileged-role users (Super Administrator, Organization Administrator, Marketing Manager, and other roles handling sensitive marketing data) have MFA enforced before any privileged action is permitted.

## Assumptions

- This spec covers RBAC scoped specifically to the Marketing Automation Platform module (Volume 14, Part 1, Chapter 3). It is a distinct, module-specific role set (Super Administrator, Organization Administrator, Marketing Manager, Campaign Manager, Content Creator, Marketing Analyst, Customer Support, Sales Executive, Community Manager, External Agency) layered on top of — not a replacement for — the platform-wide identity and core role model defined in feature `003-auth-identity-onboarding-dashboard` (Guest, Free member, Paid member, Mentor, Instructor, Moderator, Support agent, Content manager, Finance admin, Organization admin, Platform admin, Super admin). A single person's platform identity (feature 003) is assumed to hold zero or more module-specific role assignments such as the marketing roles defined here, consistent with Constitution Article VII's Organization → Department → Role → Permission Group → Permission → Resource → Action hierarchy applying per-module.
- The marketing platform's "Sales Executive" and "Customer Support" roles are assumed to be lighter-weight, marketing-context-scoped roles (assigned-leads visibility, campaign-history/communication-preference access) distinct from the fuller Sales Rep/Account Executive/Sales Manager/Support Agent role model defined for the CRM module in feature `013-crm-sales-support`; the source does not specify whether these are the same underlying role reused across modules or two separately configured roles that happen to share a name. [NEEDS CLARIFICATION: relationship between marketing-module "Sales Executive"/"Customer Support" roles and CRM-module roles of similar name is not defined in the source chapter.]
- "Department" in the RBAC hierarchy (§3) is assumed to reuse whatever organization/department/team structure is defined elsewhere in the platform's admin/identity layer rather than introducing a new department model specific to marketing; the source chapter does not define Department as a standalone entity beyond naming it in the hierarchy diagram.
- The approval-chain roles (Team Lead, Marketing Manager, Organization Admin, Super Admin) are assumed to map to actual assigned users within an organization's marketing team structure; the source does not specify what happens when a given approval level has no assigned user (see Edge Cases), so this is flagged rather than resolved.
- Custom role creation (§2) is assumed to let administrators compose new roles from the existing Permission Group / Permission catalog defined in §5–§6, rather than allowing entirely freeform permission definitions outside that catalog; the source does not specify the exact custom-role authoring mechanism.
- The Super Administrator role's documented "Restrictions: None" (§4.1) is taken at face value per the source text, but is flagged in Edge Cases as a possible inconsistency with the approval-chain principle applied to every other sensitive action in this same chapter.
- Numeric thresholds not specified in the source (expiry-revocation latency, repeated-violation notification threshold, session idle-timeout duration, concurrent-session limit count) are left as `[NEEDS CLARIFICATION]` rather than invented, per the project constitution's requirement to flag rather than silently resolve ambiguity.
- MFA mechanism details (TOTP vs. SMS vs. authenticator app) are assumed to follow whatever mechanism is specified for privileged roles platform-wide in feature `003-auth-identity-onboarding-dashboard`, since this chapter names the MFA requirement but does not itself define the MFA method.
- AI-assisted content generation (available to the Content Creator role, §4.5) is assumed to remain subject to Constitution Article II (AI is assistive, never autonomous) — i.e., AI-generated content still requires the Content Creator's role restriction against direct publishing, and a human/role-gated approval step, before it goes live; this chapter's RBAC rules and the platform's AI-governance rules are assumed complementary, not conflicting.
