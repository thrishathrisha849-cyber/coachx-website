# Feature Specification: CRM, Sales Pipeline, Customer Success & Support Desk

**Feature Branch**: `013-crm-sales-support`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 13 of the TBT One Enterprise PRD — CRM, Sales Pipeline, Leads, Contacts, Opportunities, Customer Success, Support Desk, Ticketing, Live Chat, Knowledge Base, Automation and Customer Administration. Source: `document 1/Document 1 (12).md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Channel Lead Capture With Duplicate Detection (Priority: P1)

A visitor submits an enquiry through one of the platform's many entry points — a website contact form, a course landing page, a WhatsApp message, a walk-in note entered by staff, or a bulk CSV import — and the CRM must turn that raw enquiry into a single, deduplicated lead record with the correct source attribution, without losing or double-creating the lead even when the same person contacts TBT twice through different channels.

**Why this priority**: Every other CRM capability (scoring, assignment, pipeline, conversion, renewal) depends on lead data being captured cleanly in the first place. The source PRD explicitly states duplicate detection "must run before creating a new lead" (§13) — this is the foundational data-integrity guarantee the rest of the module is built on.

**Independent Test**: Can be fully tested by submitting the same contact's details (matching email or phone) through two different configured lead sources and confirming the system surfaces a duplicate warning/merge/link decision rather than silently creating two lead records, while a genuinely new contact is captured cleanly with full source attribution.

**Acceptance Scenarios**:

1. **Given** an active website contact form configured as a lead source, **When** a visitor submits the form with a first name, email, and phone number, **Then** the system creates a new Lead record with Lead Source = "Website Contact Form", status "New", and all captured fields populated, and the form submission is recorded in the form's submission analytics.
2. **Given** a lead already exists with a specific email address, **When** a second submission arrives from a different channel (e.g., WhatsApp) using the same email, **Then** the system runs duplicate detection comparing email/phone/WhatsApp number/company/website domain/tax number/external ID and presents a warn, block, merge, link, or allow-with-justification decision rather than silently creating a second lead.
3. **Given** an administrator has built a dynamic lead form with conditional fields and a consent checkbox, **When** the form is published, **Then** the system generates a public form URL, embeddable code, QR code, and API endpoint, and every submission is captured with duplicate detection applied before lead creation.
4. **Given** two duplicate lead records are confirmed, **When** an authorized user runs the merge workflow and selects a master record, **Then** the system lets the user compare and choose field values, merges linked activities/attachments/notes, preserves audit history, and archives the duplicate as traceable rather than deleting it.

---

### User Story 2 - AI-Assisted Lead Scoring With Explainable Recommendations (Priority: P1)

A sales manager wants every lead automatically scored from 0–100 and grouped into Cold/Warm/Hot/Sales Ready so reps prioritize the right leads first, but the manager also needs to trust the score — every AI-influenced score must show its reasoning in plain language, and the AI must never be allowed to silently disqualify a lead on its own.

**Why this priority**: Lead scoring is what makes lead volume actionable at scale, and it is one of the two places in this volume (alongside AI sales/support guardrails) where Constitution Article II ("AI Is Assistive, Never Autonomous") is directly and explicitly invoked by the source text: "AI must never automatically reject a lead without configurable human review" (§18).

**Independent Test**: Can be fully tested by triggering a scoring run on a lead with known engagement history (e.g., two webinar attendances plus a pricing-page view) and confirming the resulting score/category is accompanied by a human-readable explanation string, and separately confirming that a very low AI-predicted score does not auto-change the lead's status without a human-reviewable step.

**Acceptance Scenarios**:

1. **Given** an administrator has configured rule-based scoring conditions with positive and negative values (e.g., "webinar attended: +15", "unsubscribed: -20"), **When** a lead accumulates qualifying events, **Then** the system computes a 0–100 score and assigns it to the Cold/Warm/Hot/Sales Ready category matching the configured thresholds.
2. **Given** AI-assisted scoring is enabled, **When** the AI analyzes a lead's historical conversions, interaction history, and email engagement, **Then** the resulting recommendation displays an explanation such as "High conversion probability because the lead attended two webinars, viewed enterprise pricing and responded to the latest sales email."
3. **Given** an AI-assisted score recommends disqualifying a lead, **When** the recommendation is generated, **Then** the lead is NOT automatically marked Unqualified/Lost — it is routed to a configurable human-review step before any status change takes effect.
4. **Given** a sales rep disagrees with an AI score, **When** the rep inspects the score detail, **Then** the rep can see every contributing rule/AI factor and its point value, not just the final number.

---

### User Story 3 - Opportunity Management Through a Configurable Sales Pipeline (Priority: P1)

An account executive works a qualified opportunity through a Kanban board, moving it from Discovery through Proposal Sent to Closed Won, while the system enforces mandatory fields per stage, recalculates weighted pipeline value automatically, and gives visibility into deal health so stalled deals surface before they die silently.

**Why this priority**: The opportunity pipeline is the core sales-execution surface of the CRM and the primary driver of the forecast/revenue reporting that management depends on. Multiple independently configurable pipelines (§33) and stage-level rule enforcement (§35–36) make this one of the most structurally significant capabilities in the volume.

**Independent Test**: Can be fully tested by creating an opportunity in a specific pipeline, dragging its Kanban card through two stages, and confirming the stage change updates automatically, probability recalculates, an audit record is created, and any mandatory fields for the destination stage are enforced before the move is allowed to complete.

**Acceptance Scenarios**:

1. **Given** an opportunity is in the "Proposal Sent" stage with a defined probability, **When** the owner drags the Kanban card to "Negotiation", **Then** the system updates the stage, recalculates probability and weighted value (Opportunity Value × Stage Probability), writes an audit record, and triggers any automation configured for that stage transition.
2. **Given** a pipeline stage has mandatory fields configured (e.g., "Next Step" required before entering Negotiation), **When** a user attempts to move a card into that stage without the field populated, **Then** the system blocks the move and prompts for the missing field.
3. **Given** an opportunity has had no activity for a configurable period, an overdue task, and an expected close date now in the past, **When** the stalled-deal detection job runs, **Then** the system flags the opportunity's health as "Stalled" or "Critical" and notifies both the opportunity owner and their manager.
4. **Given** an opportunity was previously marked Closed Lost, **When** an authorized user reopens it, **Then** the system retains the previous closed date and loss reason alongside the new reopen reason, reopened-by, and reopened date, and the opportunity re-enters the active pipeline (never silently becoming "Won" without going through reopening).

---

### User Story 4 - Support Agent Resolving a Ticket Within SLA With Escalation (Priority: P1)

A customer support agent receives a ticket generated from a channel (portal, email, chat, WhatsApp), works it under a visible SLA countdown, and if the ticket is at risk of breaching its response/resolution targets, the system proactively warns the agent and escalates through the management chain rather than letting the breach happen silently.

**Why this priority**: SLA integrity is the support desk's core promise to customers and is explicitly called out with concrete numeric examples in the source (Enterprise Critical: 15-minute first response, 4-hour resolution; Standard Normal: 4 business-hour first response, 2 business-day resolution — §107), making it directly measurable and business-critical.

**Independent Test**: Can be fully tested by creating a ticket against an SLA policy with a short first-response target, letting the timer approach breach, and confirming the pre-breach warning (agent + team lead notification, dashboard warning, priority increase) fires before the deadline and the post-breach escalation (manager notification, breach recorded, escalation triggered) fires exactly at breach.

**Acceptance Scenarios**:

1. **Given** a ticket is created and assigned an SLA policy based on priority and customer tier, **When** the ticket page is viewed, **Then** it displays time remaining for first response, next response, and resolution, along with any paused time and current breach status.
2. **Given** a ticket enters "Waiting for Customer" status outside business hours or during a configured holiday, **When** the SLA timer evaluates elapsed time, **Then** it pauses correctly and does not count non-business-hours or holiday time against the SLA clock.
3. **Given** an SLA is approaching breach, **When** the configured warning threshold is reached, **Then** the system warns the assigned agent, notifies the team lead, shows a dashboard warning, and increases the ticket's visual priority — all before the deadline passes.
4. **Given** an SLA has been breached, **When** the breach occurs, **Then** the system marks the SLA as breached, notifies the manager, triggers escalation up the configured chain (Agent → Team Lead → Support Manager → Department Head → Organization Admin), records the breach duration, and includes it in SLA compliance reporting.

---

### User Story 5 - Customer Success Manager Tracking a Health-Score-Triggered Renewal (Priority: P2)

A Customer Success Manager (CSM) monitors a portfolio of accounts by health score; when an account's health score drops into "At Risk", the system automatically opens a customer-success task and, as the account's renewal date approaches, fires the configured cadence of renewal reminders (120/90/60/30 days) so the CSM never discovers a churn risk too late to act.

**Why this priority**: Renewal and retention protection is explicitly named as a top business objective ("Improve retention and renewals" — §3) and is one of the few places in the volume with a concrete, testable automation cadence (120/90/60/30-day reminders — §91), making it a strong P2 candidate after the P1 core sales/support loops.

**Independent Test**: Can be fully tested by configuring health score factors and thresholds, artificially lowering an account's login frequency/product usage/payment-history inputs until the score crosses into "At Risk", and confirming a customer-success task is auto-created, then separately confirming a renewal record 120 days from its renewal date triggers the first reminder automatically.

**Acceptance Scenarios**:

1. **Given** health score factors and weights are configured by an administrator, **When** an account's login frequency, product usage, and payment history data change, **Then** the system recalculates the 0–100 health score at the configured refresh frequency and reclassifies it into Healthy/Neutral/At Risk/Critical.
2. **Given** an account's health score drops into "At Risk", **When** the drop is detected, **Then** the system automatically creates a customer success task without requiring a manual trigger.
3. **Given** a renewal record has a renewal date 120 days in the future, **When** the 120-day threshold is reached, **Then** the system fires the configured reminder and progresses the renewal through its pipeline (Upcoming → Review Required → Customer Contacted → Renewal Discussion → Proposal Sent → Negotiation → Renewed/Not Renewed) as actions are taken.
4. **Given** a high-value renewal is at risk, **When** the risk is flagged, **Then** the system escalates the renewal per configured rules and notifies both the account owner and the customer success manager.

---

### User Story 6 - Live Chat Handing Over From Chatbot to Human Agent on Negative Sentiment (Priority: P2)

A customer chats with the TBT chatbot about a billing problem; the chatbot attempts to answer using FAQ/knowledge-base matching, but when it detects negative sentiment (or the customer explicitly asks for a human, or a payment/security issue is mentioned), it must hand the conversation off to a live agent with the full conversation context intact — not restart the conversation from zero.

**Why this priority**: This is the clearest example in the volume of a deterministic, mandatory AI-to-human handover rule (§135), directly reflecting Constitution Article II's requirement that AI never operates autonomously on consequential, emotionally sensitive, or security-relevant interactions.

**Independent Test**: Can be fully tested by starting a chatbot conversation, sending a message with clearly negative sentiment or reporting a payment issue, and confirming the conversation is transferred to a live agent queue with the full prior transcript visible to the receiving agent, without the customer having to repeat themselves.

**Acceptance Scenarios**:

1. **Given** a customer is chatting with the chatbot, **When** the customer types "I want to talk to a human", **Then** the system immediately initiates human handover with full conversation context transferred.
2. **Given** a chatbot conversation is in progress, **When** the sentiment-detection component flags negative sentiment, or a payment/security issue is reported, or the chatbot's confidence falls below the configured threshold, or the conversation exceeds configured length limits, **Then** the system automatically triggers handover to a human agent.
3. **Given** handover has been triggered, **When** the conversation reaches the agent console, **Then** the agent sees the full prior transcript, customer CRM profile, previous chats/tickets, and current page context alongside the live chat window.
4. **Given** a live agent is unavailable, **When** the customer is placed in the queue, **Then** the customer sees queue position (if enabled), an estimated waiting indication, business hours, and the option to leave a message, create a ticket, or search knowledge articles instead of waiting indefinitely.

---

### User Story 7 - No-Code Workflow Automation Triggering a Multi-Step Action (Priority: P2)

An operations administrator, without writing code, builds a workflow that watches for "SLA Near Breach" on any Urgent ticket and automatically notifies the team lead, escalates the record, and creates a follow-up task — using the platform's trigger/condition/action/branch builder — and can test the workflow safely before turning it on in production.

**Why this priority**: Workflow automation is the mechanism that operationalizes nearly every other rule in this volume (renewal reminders, SLA warnings, lead assignment fallbacks, health-score task creation), so its correctness is a force multiplier; it is P2 because the manually-operated core flows (lead, opportunity, ticket) remain usable without it.

**Independent Test**: Can be fully tested by building a workflow with a trigger ("SLA Near Breach"), a condition ("Priority = Urgent"), and two chained actions (send notification, create task), running it in test/draft mode against a sample record to preview condition results and action effects, then activating it and confirming a live matching record executes all actions and logs the run.

**Acceptance Scenarios**:

1. **Given** an administrator is building a new workflow, **When** they configure a trigger (e.g., "SLA Near Breach"), one or more conditions, and a sequence of actions, **Then** the system saves the workflow in Draft mode without affecting live records until explicitly activated.
2. **Given** a workflow is in Test mode, **When** the administrator runs it against a sample record, **Then** the system previews the condition evaluation result and the effect of each action without actually executing them against production data.
3. **Given** an active workflow includes a delayed action ("wait 2 days, then send reminder"), **When** the triggering condition becomes false before the delay elapses, **Then** the system cancels or recalculates the delayed action rather than executing it against a now-invalid state.
4. **Given** a workflow run fails partway through its action sequence, **When** the failure occurs, **Then** the system logs the workflow, trigger, record, start/completion time, each action's status, the error, and retry count, and makes the failed run inspectable by an administrator.

---

### User Story 8 - Field-Level RBAC and Sensitive Data Protection (Priority: P2)

A support agent with standard permissions opens a customer account record and can see the customer's name, email, and open tickets, but cannot see the account's contract value, discount percentage, or internal escalation comments — those fields are restricted to Sales Manager and above — and any masked sensitive field (like a phone number) can only be revealed in full by an authorized role, with that reveal action logged.

**Why this priority**: Field-level RBAC is explicitly named as a distinct capability beyond record-level access (§6) and is the concrete mechanism implementing Constitution Article VII (Layered, Explicit RBAC) for this module; it protects the highest-sensitivity data (billing, discounts, contract value, internal notes) named directly in the source.

**Independent Test**: Can be fully tested by comparing the same account record's rendered fields under two different roles (e.g., Support Agent vs. Sales Manager) and confirming the sensitive fields (contract value, discount %, payment info, internal notes, escalation comments) are hidden or masked for the lower-privilege role, and that a "reveal" action by an authorized role produces an audit log entry.

**Acceptance Scenarios**:

1. **Given** a field-level restriction is configured on "Contract Value" limiting visibility to Sales Manager and above, **When** a Support Agent views the account record, **Then** the Contract Value field is hidden or shows a restricted-access indicator rather than the raw value.
2. **Given** a phone number field has masking configured, **When** a standard user views the record, **Then** the phone number displays partially masked (e.g., \*\*\*\*\*\*7890) rather than the full number.
3. **Given** an authorized role reveals a masked field's full value, **When** the reveal action occurs, **Then** the system logs the reveal (user, record, field, timestamp) when reveal logging is configured.
4. **Given** a user attempts to export a report containing sensitive fields they are not permitted to view, **When** the export is generated, **Then** the sensitive fields are masked or excluded in the exported file, consistent with the user's field-level permissions.

---

### User Story 9 - Knowledge Base Self-Service With Article Feedback and Gap Detection (Priority: P3)

A customer searches the knowledge base before opening a ticket, finds an article, and marks it "Not Helpful" with a reason; over time, the system aggregates repeated failed searches, chatbot failures, and low-helpfulness ratings across many customers to surface a knowledge gap so the content team knows what article to write next.

**Why this priority**: Self-service deflection reduces ticket volume and is valuable, but it is a P3 because it is an optimization layer on top of the P1 support desk rather than a blocking capability — the support desk functions without it, just with more ticket volume.

**Independent Test**: Can be fully tested by searching the knowledge base for a term with typo tolerance, opening a published article, submitting "Not Helpful" with a reason, and confirming that after a threshold of similar negative signals (failed searches, low ratings, chatbot search failures) accumulates, the system surfaces a recommended new-article topic to an administrator.

**Acceptance Scenarios**:

1. **Given** a customer searches the knowledge base, **When** they enter a query with a minor typo, **Then** the system returns relevant results via typo-tolerant, permission-aware search across title, content, tags, and category.
2. **Given** a customer reads a published article, **When** they mark it "Not Helpful" and select a reason (e.g., "Outdated"), **Then** the feedback is recorded against that article version.
3. **Given** an article is updated and republished, **When** the update is saved, **Then** the system creates a new version, preserves the previous version, and records the author, reviewer, and publish date, with change history visible to authorized users.
4. **Given** repeated ticket topics, failed searches, and chatbot failures accumulate around a subject with no matching article, **When** the knowledge-gap detection process runs, **Then** the system surfaces a recommended new-article topic to content owners.

---

### Edge Cases

- What happens when two lead submissions share the same email but have conflicting phone numbers — does duplicate detection warn, block, or require justification, and how is the conflict surfaced to the user (§22)?
- How does the system handle a lead merge where the two source records have genuinely different values in the same field (e.g., different "Expected Budget")? The merge workflow must force an explicit field-by-field choice rather than silently preferring one record (§23).
- How does the SLA timer behave when a ticket's "Waiting for Customer" status begins just before a configured holiday or the close of business hours — does the paused-time calculation correctly exclude the non-business period on resume (§108, §226–227)?
- What happens when two support agents open the same ticket at the same time and both start typing a reply — does the collision-detection UI prevent both replies from being sent as duplicates (§113)?
- What happens when the AI Sales/Support Assistant is prompted (directly or through a crafted customer message) to confirm a discount, quote a price, or commit to contract terms on TBT's behalf? The system must refuse and require human approval rather than let the AI invent or send binding commitments (§220).
- What happens when a user in one organization attempts to access, search, or export a lead/account/ticket record belonging to a different organization (e.g., via a guessed or enumerated record ID)? Architecture must guarantee zero cross-organization exposure (§7).
- What happens when an administrator attempts to deactivate a user who still owns open opportunities, open tickets, pending approvals, and scheduled automations? Deactivation must be blocked until ownership is transferred or a fallback owner is selected (§224).
- What happens when a customer attempts to accept an expired quotation, or accept an older (superseded) quote version instead of the current approved version? Acceptance must be rejected and a revision required (§60, §262).
- What happens when a lead that has already been converted is submitted for conversion a second time (double-click, retried API call, or duplicate automation trigger)? The system must prevent accidental repeated conversion (§24).
- What happens when a contact who just withdrew marketing consent is already queued inside an in-flight automated email send? Consent must be re-checked immediately before send, and the withdrawal must suppress the send even though it was queued earlier (§53; Constitution Article VI).
- What happens when a renewal's pending 90-day/60-day reminder becomes irrelevant because the underlying contract is cancelled or renewed early? The delayed automation must cancel or recalculate rather than fire a now-incorrect reminder (§91, §161).
- What happens when a knowledge article scheduled for deletion is currently published and linked from open tickets as the resolution reference? A published article cannot be deleted without permission, and linked-ticket references should be considered (§262, §122).

## Requirements *(mandatory)*

### Multi-Org, Business Unit & RBAC Requirements

- **FR-001**: System MUST provide role-based access control configurable across modules, records, fields, actions, reports, exports, imports, automations, and administrative settings (§6).
- **FR-002**: System MUST support the access levels No Access, View Own, View Team, View Territory, View Department, View Organization, Create, Edit, Delete, Assign, Transfer, Export, Approve, and Administer (§6).
- **FR-003**: System MUST support additional field-level access restrictions on sensitive fields, including at minimum customer phone number, personal email, billing information, contract value, discount percentage, payment information, internal notes, and escalation comments (§6).
- **FR-004**: System MUST support multiple organizations, each with isolated users, customers, leads, contacts, accounts, pipelines, tickets, knowledge base, reports, automations, integrations, and billing information (§7).
- **FR-005**: System architecture MUST prevent cross-organization data exposure under all access paths (UI, API, export, search) (§7).
- **FR-006**: System MUST allow organizations to create multiple business units (e.g., Training Division, Marketplace Division, Enterprise Sales, Support Division), each optionally with separate users, pipelines, targets, products, currencies, support queues, and reports (§8).
- **FR-007**: System MUST allow administrators to configure working hours (time zone, working days, start/end time, breaks, holidays, special working days) per team, and these hours MUST govern SLA timers, assignment logic, meeting scheduling, automation timing, and displayed customer availability (§226).
- **FR-008**: System MUST support holiday calendars scoped by country, state, region, department, or support plan, with different teams able to use different calendars simultaneously (§227).
- **FR-009**: System MUST provide an administration dashboard for managing users, teams, roles, permissions, departments, business units, territories, pipelines, stages, products, price books, lead sources, tags, custom fields, layouts, ticket categories, support queues, SLA policies, knowledge categories, automation, integrations, and audit logs (§222).
- **FR-010**: System MUST allow administrators to invite, activate, deactivate, assign roles/teams/territories to, reset access for, force-logout, and view login activity for users, and to transfer records and manage workload (§223).
- **FR-011**: Before a user is deactivated, system MUST evaluate the user's assigned leads, open opportunities, open tickets, pending approvals, scheduled tasks, automations, and owned reports, and MUST require the administrator to transfer ownership or select a fallback owner before deactivation completes (§224).
- **FR-012**: System MUST support teams for Sales, Marketing, Support, Customer Success, Finance, Operations, Regional Units, and Product Units, each with a team lead, members, queue, shared views/reports, targets, and working hours (§225).

### Lead Management Requirements

- **FR-013**: System MUST maintain lead records with fields including Lead ID, first/last/full name, company name, job title, email, phone, alternate phone, WhatsApp number, website, industry, company size, location/city/state/country/postal code, lead source, lead status, lead owner, product interest, expected budget, expected purchase date, preferred contact method, preferred language, notes, tags, created/updated dates, last-contacted date, and next follow-up date (§11).
- **FR-014**: System MUST support an administratively configurable set of at least the following lead sources: website contact form, landing page, course enquiry, event registration, membership enquiry, marketplace enquiry, mentor enquiry, job employer enquiry, mobile application, referral, affiliate, social media (Facebook, Instagram, LinkedIn, YouTube), WhatsApp, phone call, email, walk-in, webinar, advertisement, partner, import, API, and manual entry (§12).
- **FR-015**: System MUST capture leads from website forms, mobile application forms, landing pages, public APIs, CRM integrations, email inboxes, chat conversations, WhatsApp interactions, event registrations, course/marketplace/membership enquiries, recruitment employer forms, manual data entry, and bulk imports, and MUST run duplicate detection before creating any new lead (§13).
- **FR-016**: System MUST allow administrators to build dynamic lead forms with field types text, number, email, phone, dropdown, multi-select, checkbox, radio button, date, time, file upload, consent checkbox, hidden field, and conditional field, each with required/optional configuration and custom validation; every form MUST generate a public form URL, embeddable code, QR code, API endpoint, and submission analytics (§14).
- **FR-017**: System MUST support configurable lead statuses, with defaults of New, Unassigned, Assigned, Contacted, Follow-Up Required, Interested, Not Interested, Qualified, Unqualified, Converted, Lost, Duplicate, Invalid, and Spam (§15).
- **FR-018**: System MUST evaluate lead qualification against customer need, product fit, budget, decision authority, purchase timeline, business size, location, engagement, previous interactions, product usage, course/membership history, event participation, and community activity, and MUST allow qualified leads to be converted into an Account, Contact, and/or Opportunity (§16).
- **FR-019**: System MUST support lead assignment via manual, round-robin, territory-based, product-based, language-based, source-based, availability-based, workload-based, priority-based, and AI-assisted methods, and MUST log every assignment and reassignment event (§19).
- **FR-020**: Every lead MUST record a primary owner, supporting owner, team, department, and territory; ownership changes MUST store previous owner, new owner, changed-by, changed date, and change reason (§20).
- **FR-021**: System MUST allow administrators to define lead distribution rules using conditions, priorities, assignment strategy, fallback owner, working hours, daily assignment limits, geographic restrictions, product expertise, and language expertise, and MUST support testing a rule before activation (§21).
- **FR-022**: Lead duplicate detection MUST compare email, phone, WhatsApp number, company, website domain, tax number, and external customer ID, and MUST support system actions of warn user, block creation, merge records, link records, or allow-with-justification (§22).
- **FR-023**: System MUST allow authorized users to merge duplicate leads through a workflow that selects a master record, compares fields, lets the user choose which values to retain, merges linked activities/attachments/notes, preserves audit history, and archives (not deletes) the duplicate record so it remains traceable (§23).
- **FR-024**: Lead conversion MUST create or link an Account, create or link a Contact, and create an Opportunity; MUST transfer activities, notes, and files; MUST preserve lead source and attribution; MUST mark the original lead as converted; and MUST prevent accidental repeated conversion of the same lead (§24).
- **FR-025**: The round-robin lead assignment engine MUST track active users, check working schedules, respect assignment capacity, skip unavailable users, maintain fair distribution, support priority users, log every decision, and apply fallback rules when no eligible user is found (§72).

### Lead Scoring Requirements

- **FR-026**: System MUST support rule-based and AI-assisted lead scoring on a 0–100 scale, grouped into Cold, Warm, Hot, and Sales Ready categories (§17).
- **FR-027**: System MUST allow administrators to define scoring conditions (profile completeness, email opened, link clicked, form submitted, website/product/pricing page viewed, webinar attended, course completed, membership plan viewed, previous purchase, company size, budget range, decision timeline, response frequency, unsubscribe activity), each with an administrator-configurable positive or negative score value (§17).
- **FR-028**: AI-assisted scoring MAY analyze historical conversions, customer profile, interaction history, conversation sentiment, email engagement, purchase behaviour, product usage, lead source performance, and sales cycle patterns (§18).
- **FR-029**: Every AI-assisted lead scoring recommendation MUST display a human-readable explanation of the factors that produced the score (§18).
- **FR-030**: AI MUST NOT automatically reject (disqualify) a lead — any AI-driven disqualification recommendation MUST route through configurable human review before the lead's status changes (§18; Constitution Article II).

### Contact & Account Management Requirements

- **FR-031**: System MUST maintain contact records with fields including Contact ID, first/last/display name, profile image, job title, department, email, alternate email, phone, mobile, WhatsApp, preferred language, preferred communication channel, date of birth, location, address, account, contact owner, relationship type, customer status, tags, social profiles, consent status, last-contacted date, and next follow-up date (§25).
- **FR-032**: Contacts MUST be linkable to multiple accounts, opportunities, orders, memberships, courses, events, marketplace transactions, mentor bookings, support tickets, job postings, and projects, with relationship roles including Decision Maker, Influencer, Buyer, Finance Contact, Technical Contact, Administrator, User, Partner, Reseller, and Sponsor (§26).
- **FR-033**: System MUST maintain account records with fields including Account ID, account name, legal name, account type, parent account, industry, company size, annual revenue, website, domain, email, phone, billing address, shipping address, tax number, registration number, account owner, territory, customer segment, customer status, customer-since date, renewal date, contract value, tags, and notes (§27).
- **FR-034**: System MUST support account types Prospect, Customer, Former Customer, Partner, Reseller, Vendor, Sponsor, Investor, Educational Institution, Corporate Client, Government Organization, Non-Profit Organization, and Internal Organization (§28).
- **FR-035**: System MUST support account hierarchy (parent companies, subsidiaries, branches, departments, regional offices, franchise locations), displayed visually, with navigation between related entities (§29).
- **FR-036**: The account detail page MUST provide a 360-degree view showing account summary, contacts, leads, opportunities, activities, emails, calls, meetings, quotes, orders, invoices, payments, memberships, course purchases, event registrations, marketplace orders, support tickets, customer health, renewals, documents, notes, and a chronological timeline (§30).
- **FR-037**: The customer timeline MUST display record creation, calls, emails, meetings, notes, status changes, purchases, payments, tickets, chat conversations, course enrolments, event registrations, membership changes, feedback, renewals, and cancellations in chronological order, filterable by activity type, user, and date (§31).

### Opportunity & Pipeline Requirements

- **FR-038**: System MUST maintain opportunity records with fields including Opportunity ID, name, account, primary contact, owner, pipeline, stage, product, estimated value, probability, weighted value, expected/actual close date, lead source, campaign source, competitor, next step, win reason, loss reason, description, and tags (§32).
- **FR-039**: System MUST allow organizations to create multiple independent sales pipelines (e.g., Membership Sales, Course Sales, Corporate Training, Marketplace Vendor Sales, Event Sponsorship, Recruitment Services, Software Services, Consulting Services, Enterprise Partnerships), each with independently configurable stages, probabilities, required fields, automation, approval rules, and forecast categories (§33).
- **FR-040**: System MUST provide a default sales pipeline of eleven stages (New Opportunity, Discovery, Qualified, Requirement Analysis, Proposal Preparation, Proposal Sent, Negotiation, Verbal Confirmation, Contract Review, Closed Won, Closed Lost) that organizations may modify (§34).
- **FR-041**: Each pipeline stage MUST support a stage name, description, display order, default probability, mandatory fields, maximum allowed duration, entry conditions, exit conditions, automated tasks, notifications, and an approval requirement (§35).
- **FR-042**: System MUST provide a drag-and-drop Kanban pipeline view where each card displays opportunity name, account, owner, value, probability, expected close date, last activity, next task, priority, and warning indicators (§36).
- **FR-043**: Moving a Kanban card MUST update the stage, recalculate probability, create an audit record, trigger relevant stage automation, and validate mandatory fields for the destination stage before the move completes (§36).
- **FR-044**: System MUST provide table, compact list, grouped, calendar, and forecast views of opportunities with configurable columns, sorting, filtering, search, saved views, authorized export, and bulk actions (§37).
- **FR-045**: Opportunities MUST support one or more product/service line items, each with product, description, quantity, unit price, discount, tax, subtotal, total, billing frequency, and contract duration, with the opportunity total calculated automatically (§38).
- **FR-046**: Weighted pipeline value MUST be calculated as Opportunity Value × Stage Probability, supporting system-calculated, user-adjusted, and AI-predicted probability, with every manual probability change logged (§39).
- **FR-047**: System MUST classify opportunity/deal health as Healthy, At Risk, Stalled, Critical, Won, or Lost, based on configurable factors including days in stage, missed follow-ups, customer engagement, email sentiment, meeting frequency, decision date, competitor presence, pricing objections, and payment risk (§40).
- **FR-048**: System MUST identify stalled opportunities exhibiting no activity for a configurable period, overdue tasks, repeatedly postponed meetings, unanswered communications, an expired proposal, an expected close date in the past, or excessive time in one stage, and MUST notify the opportunity owner and manager (§41).
- **FR-049**: Closed Won records MUST capture final value, final products, contract date, start date, payment terms, onboarding owner, customer success owner, and win reason; Closed Lost records MUST capture loss reason, competitor, customer feedback, final offered price, reopen date, and follow-up plan; loss reasons MUST be administratively configurable (§42).
- **FR-050**: System MUST allow authorized users to reopen a lost opportunity while retaining the previous closed date and previous loss reason alongside the reopen reason, reopened-by user, and reopened date (§43).

### Sales Activity, Quotation & Contract Requirements

- **FR-051**: System MUST support sales activity types Task, Call, Meeting, Email, WhatsApp, SMS, Note, Site Visit, Demo, Follow-Up, Proposal, and Contract Review, each linkable to leads, contacts, accounts, opportunities, tickets, orders, and projects (§44).
- **FR-052**: Tasks MUST support name, description, related record, assigned user/team, priority, status, start/due date, reminder, recurrence, completion date, tags, and attachments, with statuses Not Started, In Progress, Waiting, Completed, Cancelled, and Overdue; recurring tasks (daily, weekly, monthly, quarterly, annually, custom) MUST be generated automatically according to configuration (§45–46).
- **FR-053**: Call records MUST capture caller, recipient, direction, start/end time, duration, outcome (Connected, No Answer, Busy, Invalid Number, Callback Requested, Interested, Not Interested, Follow-Up Scheduled), notes, recording reference, follow-up-required flag, and related record; users MUST be able to log calls manually or via integration, add notes during calls, schedule follow-ups, create tasks, update lead status, and link recordings only when legally permitted (§47–48).
- **FR-054**: Meeting records MUST capture title, type, participants, related records, start/end time, time zone, location, online meeting link, agenda, notes, outcome, and follow-up actions; calendar synchronization MUST support creating, updating, and cancelling meetings, inviting participants, checking conflicts, adding reminders, storing meeting links, and synchronizing attendance status (§49–50).
- **FR-055**: System MUST support sending emails, linking received emails to CRM records, email templates, scheduled emails, open/link/bounce/reply tracking, signature management, attachments, email threading, and authorized bulk email (§51).
- **FR-056**: Email templates MUST support template name, subject, rich-text body, plain-text body, dynamic variables (customer name, company name, sales owner, product, opportunity value, meeting date, quote link, support ticket number), attachments, language, category, visibility, and approval status (§52).
- **FR-057**: Marketing or bulk emails MUST verify consent status, unsubscribe status, communication preference, and applicable legal restrictions before sending; transactional emails MAY follow separate organizational policy (§53).
- **FR-058**: Notes MUST be linkable to CRM records with visibility of Private, Team, Department, or Organization, and MUST support rich text, mentions, attachments, pinning, and editing history (§54).
- **FR-059**: Internal comments MUST support user mentions, team mentions, replies, reactions, notifications, and resolved status, and MUST NEVER be visible to customers unless explicitly copied into a customer-facing response (§55).
- **FR-060**: File and document uploads MUST enforce file size validation, file type validation, malware scanning, access control, version history, download logging, preview support, and retention policy (§56).
- **FR-061**: System MUST maintain a product catalogue (Product ID, name, category, description, product type, unit, standard price, tax category, billing type, status, SKU, related TBT module) and MUST support multiple price books (e.g., Standard, Enterprise, Partner, Educational Institution, Seasonal, International) scoped by currency, region, customer segment, membership level, partner status, or contract terms (§57–58).
- **FR-062**: Quotation records MUST include quote number, opportunity, account, contact, valid-until date, products, quantity, price, discount, tax, terms, notes, approval status, and quote status (Draft, Approval Pending, Approved, Sent, Viewed, Accepted, Rejected, Expired, Revised) (§59).
- **FR-063**: When a quotation is revised, system MUST preserve the previous version, increment the version number, record the changes, mark the old version superseded, and maintain customer interaction history; only the latest approved version MAY be accepted (§60).
- **FR-064**: Discount approval rules MUST be configurable by discount percentage, discount value, product type, opportunity value, user role, customer segment, and profit margin, with approval levels of Sales Manager, Department Head, Finance, and Organization Admin (§61).
- **FR-065**: System MUST support proposal templates with dynamic customer data, product sections, scope of work, timelines, pricing, and terms and conditions, supporting digital acceptance and document download, and MUST track sent/delivered/viewed/downloaded/accepted/rejected proposal status (§62).
- **FR-066**: Accepted quotations MUST be convertible into sales orders capturing order number, customer, billing/shipping address, products, quantity, price, tax, discount, total, payment terms, delivery status, and order status (§63).
- **FR-067**: System MUST maintain contract records (Contract ID, name, customer, opportunity, start/end/renewal date, contract value, billing frequency, terms, documents, owner, status) progressing through statuses Draft, Under Review, Approval Pending, Sent, Signed, Active, Expiring, Renewed, Terminated, Expired (§64).
- **FR-068**: System MAY support digital contract acceptance via typed acceptance, checkbox acceptance, digital signature integration, one-time password confirmation, audit certificate, timestamp, IP address, and acceptance version, with legal requirements configured according to jurisdiction (§65).
- **FR-069**: CRM payment tracking MUST display invoice number, customer, amount, due date, paid amount, pending amount, payment status (Not Invoiced, Invoice Sent, Partially Paid, Paid, Overdue, Failed, Refunded, Cancelled), payment method, transaction reference, and last reminder date (§66).

### Sales Targets, Forecasting & Territory Requirements

- **FR-070**: Managers MUST be able to set sales targets for revenue, number of deals, new customers, product sales, renewals, upsells, calls, meetings, and qualified leads, assignable to an individual, team, department, territory, or business unit, across daily/weekly/monthly/quarterly/half-yearly/annual/custom periods, with progress updating in real time (§67–68).
- **FR-071**: System MUST support forecast categories Pipeline, Best Case, Commit, Closed, and Omitted, calculated from opportunity value, probability, expected close date, sales-owner judgment, historical conversion, or AI prediction (§69).
- **FR-072**: System MUST allow authorized managers to override forecasts, and every override MUST store the previous forecast, new forecast, reason, user, and timestamp (§70).
- **FR-073**: System MUST support sales territories defined by country, state, district, city, postal code, industry, product, customer size, language, or revenue band, each containing a territory manager, sales users, accounts, leads, opportunities, and targets (§71).

### Data Model, Customization & Search Requirements

- **FR-074**: System MUST support customer segments (Individual, Student, Fresher, Professional, Freelancer, Startup, Small Business, Medium Business, Enterprise, Educational Institution, Government, Partner, High-Value Customer, At-Risk Customer), assignable by rule or manually (§73).
- **FR-075**: System MUST support tags assignable to leads, contacts, accounts, opportunities, tickets, and customers, with tag creation permissions controlled by administrators (§74).
- **FR-076**: Administrators MUST be able to create custom fields of type single-line text, multi-line text, number, currency, percentage, date, date-time, checkbox, dropdown, multi-select, URL, email, phone, user lookup, record lookup, formula, and file, each configurable for required status, default value, validation, visibility, edit permissions, and conditional display (§75).
- **FR-077**: System MUST support custom page layouts assignable by role, department, business unit, customer type, lead type, or pipeline, configuring sections, fields, tabs, related lists, buttons, required fields, and read-only fields (§76).
- **FR-078**: Users MUST be able to create saved views with filters, columns, sorting, grouping, and visibility (Private, Team, Department, Organization) (§77).
- **FR-079**: Global/advanced search MUST support keyword search, exact match, partial match, phone search, email search, company domain search, record ID search, tag search, full-text note search, and custom field search, with all results respecting the searching user's permissions (§78).

### Customer Onboarding Requirements

- **FR-080**: A won opportunity MAY trigger a customer onboarding process progressing through configurable stages Welcome, Documentation, Account Setup, Requirements Collection, Product Configuration, Training, Activation, First Value Achieved, Handover to Customer Success, and Completed (§79).
- **FR-081**: Onboarding templates MUST define tasks, owners, due dates, documents, customer actions, internal actions, milestones, automated emails, and approval steps, and MUST be selectable by product, customer segment, contract value, business unit, or region (§80).
- **FR-082**: The onboarding portal MUST allow customers to view onboarding progress, complete assigned actions, upload documents, access training materials, schedule meetings, contact onboarding staff, view deadlines, and confirm completion (§81).

### Customer Success Requirements

- **FR-083**: Customer success capabilities MUST support customer health tracking, adoption tracking, goal tracking, engagement monitoring, renewal management, risk management, success plans, business reviews, and expansion opportunity tracking (§82).
- **FR-084**: System MUST calculate a customer health score on a 0–100 scale grouped into Healthy, Neutral, At Risk, and Critical categories, derived from factors including login frequency, product usage, course participation, membership activity, support tickets, payment history, customer feedback, response behaviour, contract status, community engagement, event participation, and success milestone completion (§83).
- **FR-085**: Administrators MUST configure health score factors, the weight of each factor, positive and negative thresholds, score refresh frequency, risk alerts, and escalation rules; the system MUST retain health score history over time (§84).
- **FR-086**: Customer success plans MUST include customer goal, expected outcome, success metrics, milestones, tasks, owners, target dates, risks, progress, and review schedule, with progress supporting both manual and automated updates (§85–86).
- **FR-087**: System MUST track customer risk records (type, severity, probability, impact, owner, mitigation plan, due date, status) for risk types including low product usage, payment delay, negative feedback, unresolved tickets, declining engagement, contract expiry, key contact change, repeated complaints, cancellation request, and competitor mention (§87).
- **FR-088**: System MUST automatically create customer success tasks when a health score drops, a contract approaches expiry, a critical ticket is created, product usage declines, a customer gives negative feedback, payment becomes overdue, a key contact becomes inactive, or renewal probability decreases (§88).
- **FR-089**: Renewal records MUST include customer, contract, current value, renewal date, proposed value, renewal probability, renewal owner, renewal stage, risk status, and next action, tracked through a renewal pipeline (Upcoming, Review Required, Customer Contacted, Renewal Discussion, Proposal Sent, Negotiation, Renewed, Not Renewed) (§89–90).
- **FR-090**: System MUST support configurable renewal automation actions at 120-day, 90-day, 60-day, and 30-day reminders prior to renewal date, including creating a renewal opportunity, notifying the account owner and customer success manager, sending customer communication, and escalating high-value renewals (§91).
- **FR-091**: System MUST recommend upsell and cross-sell opportunities (higher membership plans, additional courses, mentor packages, event packages, marketplace services, recruitment services, enterprise training, additional user licences, premium support) based on purchase history, customer goals, product usage, segment, similar customers, or current plan limitations (§92).
- **FR-092**: System MUST allow customer success managers to record Monthly, Quarterly, and Annual business reviews capturing objectives, performance metrics, achievements, issues, customer feedback, upcoming goals, action items, participants, and presentation attachments (§93).

### Support Desk & Ticket Requirements

- **FR-093**: The Support Desk MUST provide one centralized system for customer issues across all TBT modules, supporting ticket creation, assignment, categorization, prioritization, SLA tracking, internal collaboration, customer communication, escalation, resolution, feedback, and reporting (§94).
- **FR-094**: Tickets MUST be creatable from Customer Portal, Website, Mobile App, Email, Live Chat, Chatbot, WhatsApp, Phone, Social Media, Admin Panel, Marketplace Order, Course, Membership, Event, Mentor Session, Recruitment Service, and API channels (§95).
- **FR-095**: Ticket records MUST include ticket number, subject, description, customer, contact, email, phone, source, category, subcategory, product, related order/course/event/membership/mentor session, priority, severity, status, assigned agent, assigned team, SLA, tags, attachments, created date, first response date, due date, resolution date, and closed date (§96).
- **FR-096**: System MUST allow administrators to configure ticket number formats (e.g., TBT-SUP-2026-000001), unique within the organization (§97).
- **FR-097**: System MUST support dynamic ticket categories and subcategories, with defaults including Account, Login, Payment, Refund, Course, Video, E-Book, Podcast, Membership, Community, Mentor, Event, Marketplace, Job Portal, Technical Issue, Feature Request, Feedback, Complaint, and Other (§98).
- **FR-098**: Ticket priority (Low, Normal, High, Urgent, Critical) MAY be selected by customer, set by agent, calculated by rules, or predicted by AI, and MUST remain a field distinct from ticket severity (Minor, Moderate, Major, Service Impacting, Business Critical) (§99–100).
- **FR-099**: System MUST support ticket statuses New, Open, Assigned, In Progress, Waiting for Customer, Waiting for Internal Team, Waiting for Third Party, Resolved, Closed, Reopened, Cancelled, Duplicate, and Spam, following the lifecycle: created → acknowledgement sent → categorization → priority calculation → assignment → first response → investigation → customer communication → resolution → customer confirmation → closure → feedback collection (§101–102).
- **FR-100**: System MUST support support queues scoped by product, department, category, language, region, priority, customer segment, or support plan (§103).
- **FR-101**: System MUST support ticket assignment via manual, round robin, skill-based, category-based, product-based, language-based, customer-tier-based, workload-based, availability-based, and AI-suggested methods, and assignment engines MUST respect configured agent capacity (maximum open tickets, maximum urgent tickets, maximum concurrent chats, working hours, break schedules, leave status, skill categories, supported languages) (§104–105).
- **FR-102**: Agents MUST be able to send public replies, internal notes, email responses, chat responses, predefined responses, attachments, and resolution summaries; public replies MUST be visible to customers while internal notes MUST remain private (§111).
- **FR-103**: Canned responses MUST support response name, category, language, subject, response body, dynamic variables, visibility, and approval status, and MUST be quickly searchable and insertable by agents (§112).
- **FR-104**: When multiple agents open the same ticket, system MUST show currently-viewing users, the currently-editing user, a draft response warning, and the latest updates, and MUST prevent accidental duplicate response submission (§113).
- **FR-105**: Agents MAY merge related tickets by selecting a master ticket, moving conversations and attachments, preserving source ticket IDs, optionally notifying the customer, closing duplicates, and maintaining an audit log (§114); agents MAY split a ticket containing multiple unrelated issues into a new linked child ticket while preserving category, owner, and traceability (§115).
- **FR-106**: Closing a parent ticket MUST NOT automatically close its child tickets unless explicitly configured (§116).
- **FR-107**: System MUST support incident and problem records with root cause analysis, known errors, workarounds, corrective actions, and preventive actions; major incident records MUST capture incident title, severity, affected products, affected customers, start time, detection time, incident commander, technical owner, communication owner, current status, workaround, resolution, root cause, and post-incident review (§117–118).
- **FR-108**: System MUST support internal incident updates, customer notifications, status page updates, email broadcasts, in-app notifications, and resolution announcements, all of which MUST be logged (§119).
- **FR-109**: Root cause reports MUST include incident summary, impact, timeline, root cause, contributing factors, resolution, corrective actions, preventive actions, owners, and due dates (§120).
- **FR-110**: Reopening a resolved ticket MUST change status to Reopened, notify the previous owner, recalculate the SLA, increment the reopen count, and capture the reopen reason (§121).
- **FR-111**: Ticket closure MAY require a resolution summary, resolution category, root cause, customer confirmation, mandatory fields, a linked knowledge article, and time spent; tickets MAY close manually, automatically after customer inactivity, or automatically after customer confirmation (§122).
- **FR-112**: Agents MAY track time spent on investigation, customer communication, internal coordination, technical work, and documentation, and this time data MUST support reporting and service billing (§123).
- **FR-113**: System MUST support customer support entitlements based on membership, purchased support plan, product, contract, customer tier, warranty, marketplace order, or service package, defining supported channels, support hours, SLA, number of tickets, named contacts, and dedicated manager (§124).

### SLA & Escalation Requirements

- **FR-114**: SLA policies MUST define first response time, next response time, resolution time, business hours, holidays, priority conditions, customer tier, and escalation rules, with all values administratively configurable (e.g., Enterprise Critical: 15-minute first response / 30-minute next response / 4-hour resolution; Standard Normal: 4 business-hour first response / 2 business-day resolution) (§106–107).
- **FR-115**: The ticket page MUST display time remaining for first response, next response, and resolution, plus paused time and breach status; SLA timers MUST respect business hours, holidays, waiting status, and configured SLA pause rules (§108).
- **FR-116**: Before an SLA breach occurs, system MUST warn the assigned agent, notify the team lead, display a dashboard warning, and increase the ticket's visual priority; after a breach occurs, system MUST mark the SLA as breached, notify the manager, trigger escalation, record breach duration, and include the breach in reporting (§109).
- **FR-117**: Escalation MUST be triggerable by SLA risk, SLA breach, critical priority, negative sentiment, VIP customer status, multiple reopened tickets, repeated complaints, payment impact, security issue, or service outage, escalating through the levels Agent, Team Lead, Support Manager, Department Head, and Organization Admin (§110).

### Live Chat & Chatbot Requirements

- **FR-118**: Live chat MUST support website chat, mobile application chat, customer portal chat, an agent console, queue management, chat routing, file sharing, canned responses, typing indicators, read status, chat transfer, chat history, and offline forms (§125).
- **FR-119**: The chat widget MUST be configurable for brand logo, primary message, welcome message, online/offline status, theme, language, position, business hours, required customer fields, privacy link, and consent text; the pre-chat form's fields (name, email, phone, customer ID, category, subject, order ID, membership ID, preferred language) MUST be dynamically configurable (§126–127).
- **FR-120**: Chats MUST be routable by round robin, agent availability, skill, language, category, product, customer tier, previous agent, or workload (§128).
- **FR-121**: Customers waiting in the chat queue MUST see queue position when enabled, an estimated waiting indication, business hours, and options to leave a message, create a ticket, or view knowledge articles (§129).
- **FR-122**: The agent chat console MUST display customer information, CRM profile, previous chats, open tickets, purchases, membership, course activity, current page, chat transcript, suggested responses, knowledge suggestions, and internal notes (§130).
- **FR-123**: Agents MUST be able to transfer chats to another agent, another queue, technical support, sales, billing, or customer success, with transfer history retained (§131).
- **FR-124**: A chat MUST be convertible into a support ticket, with the resulting ticket carrying the chat transcript, customer information, attachments, category, agent, and related records (§132).
- **FR-125**: After chat completion, customers MAY rate agent helpfulness, resolution quality, response speed, and overall satisfaction, with optional comments supported (§133).
- **FR-126**: The chatbot MAY provide greeting, intent detection, FAQ answers, knowledge base search, ticket status, order status, membership details, course access guidance, event information, lead capture, and human-agent handover (§134).
- **FR-127**: Chatbot-to-human handover MUST occur when the customer requests an agent, intent is not recognized, negative sentiment is detected, a payment issue is reported, a security issue is reported, configured confidence is low, or the conversation exceeds configured limits; the full conversation context MUST transfer to the receiving agent (§135).

### AI Sales/Support Assistant Guardrail Requirements

- **FR-128**: AI MAY assist support agents with ticket summarization, suggested replies, sentiment detection, category prediction, priority prediction, relevant knowledge article suggestions, translation, grammar improvement, resolution summary, and similar-ticket identification; agents MUST review AI-generated customer-facing replies before sending unless explicitly configured for low-risk automated workflows (§136; Constitution Article II).
- **FR-129**: AI MAY assist sales users with lead/account/opportunity summaries, next-best-action recommendations, follow-up suggestions, email drafting, meeting preparation, objection handling, deal risk analysis, forecast assistance, and customer sentiment; every next-best-action recommendation MUST display supporting reasons (§216–217).
- **FR-130**: AI-generated conversation summaries (email threads, chat transcripts, ticket conversations, meeting notes, call notes) MUST remain inspectable against their original source content by the user (§218).
- **FR-131**: AI-drafted emails (Professional, Friendly, Concise, Detailed, Follow-Up, Proposal, Apology, Renewal, Payment Reminder tones) MUST remain editable by the user before sending (§219).
- **FR-132**: AI MUST NOT invent customer commitments, invent pricing, approve discounts, send legally binding terms automatically, reveal restricted information, make unsupported claims, or close critical tickets without review; every AI action MUST respect the acting user's role permissions and the organization's data boundaries (§220; Constitution Article II).
- **FR-133**: AI requests MUST exclude unnecessary sensitive data, respect record-level permissions, use only approved AI providers, log usage, apply retention policies to AI-processed data, and support opt-out where required (§221).

### Knowledge Base Requirements

- **FR-134**: The Knowledge Base MUST support public articles, customer-only articles, agent-only articles, product documentation, troubleshooting guides, FAQs, video guides, downloadable documents, release notes, and policy documents, organized under dynamic categories and subcategories (§137–138).
- **FR-135**: Article records MUST include Article ID, title, slug, summary, content, category, subcategory, product, language, tags, keywords, author, reviewer, status, version, visibility, published date, and expiry date, progressing through statuses Draft, Review Pending, Approved, Published, Unpublished, Archived, and Expired, with publishing optionally requiring approval (§139–140).
- **FR-136**: The article editor MUST support rich text, headings, lists, tables, code blocks, images, videos, attachments, callout boxes, internal links, external links, related articles, and SEO fields (§141).
- **FR-137**: Every published article update MUST create a new version, preserve the previous version, and record the author, reviewer, and publication date, with change history displayed to authorized users (§142).
- **FR-138**: Knowledge search MUST support title, keyword, content, tag, product, category, and language search, plus semantic search, typo tolerance, and suggested queries, with all results permission-aware (§143).
- **FR-139**: Users MAY mark an article Helpful or Not Helpful, with optional feedback reasons Information Missing, Outdated, Difficult to Understand, Did Not Solve Issue, or Incorrect Information (§144).
- **FR-140**: System MUST identify knowledge gaps from repeated ticket topics, failed searches, chatbot failures, low helpfulness ratings, agent searches without results, and repeated manual responses, and MAY recommend new article topics (§145).

### Customer Portal & Feedback Requirements

- **FR-141**: The customer portal MUST allow customers to view profile, purchases, memberships, courses, event registrations, and orders; create support tickets; view ticket status and reply to tickets; upload attachments; view chat history; search the knowledge base; track onboarding; view contracts and invoices; make payments; submit feedback; and manage communication preferences (§146).
- **FR-142**: Portal access MUST support email and password, mobile OTP, email OTP, social login, enterprise single sign-on, or existing TBT account authentication, and access MUST be linked to the appropriate CRM contact (§147).
- **FR-143**: Authorized account administrators MUST be able to add contacts, remove contacts, assign portal access, set roles, and designate billing contact, technical contact, support contact, and primary contact (§148).
- **FR-144**: Customers MUST only see their own individual records and authorized account records, tickets, invoices, and documents; internal notes, risk scores, and private agent comments MUST NEVER be exposed to customers (§149).
- **FR-145**: System MUST support customer feedback types General Feedback, Product Feedback, Feature Request, Complaint, Support Feedback, Course Feedback, Event Feedback, Marketplace Feedback, Mentor Feedback, and Cancellation Feedback, and a survey builder supporting rating, star rating, Net Promoter Score, Customer Satisfaction, Customer Effort Score, yes/no, multiple choice, multi-select, short text, long text, matrix, and date question types (§150–151).
- **FR-146**: CSAT surveys MAY be triggered after ticket resolution, chat completion, onboarding completion, course completion, event completion, purchase completion, mentor session, or renewal (§152).
- **FR-147**: System MUST automatically calculate Net Promoter Score from the standard recommendation question, grouping responses into Promoters (9–10), Passives (7–8), and Detractors (0–6) (§153).
- **FR-148**: Customer Effort Score results MUST be available broken down by product, team, channel, agent, customer segment, and time period (§154).
- **FR-149**: Low satisfaction, NPS, or CES scores MAY trigger a customer success task, support escalation, manager notification, recovery workflow, follow-up call, or apology email (§155).
- **FR-150**: Feature requests MUST include title, description, customer, product, business impact, priority, vote count, status, product owner, linked tickets, and release reference, progressing through statuses Submitted, Under Review, Planned, In Development, Released, Declined (§156).

### Workflow Automation Requirements

- **FR-151**: System MUST provide a no-code workflow builder composed of trigger, conditions, actions, delays, branches, approvals, error handling, and stop conditions (§157).
- **FR-152**: Supported automation triggers MUST include record created, record updated, field changed, stage changed, status changed, date reached, task overdue, SLA near breach, SLA breached, payment overdue, contract expiring, health score changed, form submitted, email opened, link clicked, ticket reopened, feedback submitted, and webhook received (§158).
- **FR-153**: Automation conditions MUST be able to evaluate field values, record owner, user role, customer segment, lead score, opportunity value, ticket priority, product, date and time, previous field value, related record values, and formula output (§159).
- **FR-154**: Supported automation actions MUST include update record, create record, assign user, assign team, send email, send notification, send SMS, send WhatsApp message, create task, create follow-up, add tag, remove tag, change stage, change status, create ticket, escalate record, request approval, call webhook, generate document, and add timeline entry (§160).
- **FR-155**: Delayed automation MUST support fixed duration, until-date, until-business-time, before-a-date-field, after-a-date-field, and until-condition-met delay types, and the system MUST cancel or recalculate a delayed action when its governing condition changes before it fires (§161).
- **FR-156**: Workflows MUST support If, Else If, Else branching, multiple condition branches, parallel actions, approval paths, and distinct success and failure paths (§162).
- **FR-157**: Every workflow run MUST log the workflow, trigger, record, start time, completed time, actions taken, status, errors, and retry count, and administrators MUST be able to inspect failed runs (§163).
- **FR-158**: Approval workflows MUST be configurable for discounts, quotations, refunds, contracts, high-value opportunities, ticket closure, SLA exceptions, data exports, and customer credits, supporting approve, reject, request-changes, delegate, and add-comment actions, and sequential, parallel, any-one-approver, all-approvers, conditional, and escalated approver structures (§164–165).
- **FR-159**: The notification engine MUST support in-app, push, email, SMS, WhatsApp, browser, and webhook channels, with templates, dynamic variables, localization, user preferences, priority, read status, and deep links, covering events including lead assigned, lead not contacted, task due/overdue, meeting reminder, opportunity stage changed, quote accepted, payment overdue, ticket assigned, SLA risk, ticket reply, customer feedback, renewal due, health score drop, and automation failure (§166–167).
- **FR-160**: Users MUST control their notification channels, categories, quiet hours, email digest, mobile push, sound, and vibration preferences; mandatory security and critical incident notifications MUST NOT be user-disableable (§168).

### Reporting & Analytics Requirements

- **FR-161**: CRM analytics MUST include lead volume, lead source performance, lead conversion rate, lead response time, sales pipeline value, opportunity conversion, revenue, forecast accuracy, sales cycle, deal velocity, average deal size, win rate, loss reasons, sales activities, and target achievement (§169).
- **FR-162**: The sales funnel report MUST show leads, qualified leads, opportunities, proposals, negotiations, and won deals, filterable by date, user, team, territory, product, source, and customer segment (§170).
- **FR-163**: System MUST track lead source attribution including first-touch source, last-touch source, converting source, campaign, referral, UTM parameters, landing page, form, and device (§171).
- **FR-164**: Sales activity reports MUST include calls made/connected, emails sent/opened, meetings completed, tasks completed, overdue follow-ups, and average response time; sales performance reports MUST include revenue generated, deals won, conversion rate, average deal value, sales cycle, target achievement, customer retention, and activity quality, and MUST NOT rely only on raw activity volume; forecast reports MUST include forecast by user/team/product/territory/month plus commit value, best-case value, pipeline value, and forecast accuracy (§172–174).
- **FR-165**: Support analytics MUST include tickets created, resolved, reopened, and backlogged; first response time; average resolution time; SLA compliance and breaches; agent workload; customer satisfaction; channel volume; and category trends; agent performance reports MUST include assigned/resolved tickets, response/resolution time, SLA compliance, reopen rate, CSAT, chat rating, escalation rate, and quality review score (§175–176).
- **FR-166**: Customer success analytics MUST include customer health distribution, at-risk customers, renewals due, renewal rate, churn rate, expansion revenue, product adoption, success plan progress, customer engagement, NPS, and CSAT (§177).
- **FR-167**: The executive dashboard MUST display total pipeline, forecast revenue, revenue won, lead conversion, customer acquisition, customer retention, renewal rate, churn, customer health, open critical tickets, SLA compliance, CSAT, NPS, and team performance (§178).
- **FR-168**: Authorized users MUST be able to build custom reports with module and related-module selection, field selection, filters, grouping, calculations, charts (table, summary table, bar, line, pie, funnel, gauge, KPI card, heatmap, donut, area), date ranges, sorting, scheduled delivery, and export (§179–180).
- **FR-169**: Reports MUST be schedulable daily, weekly, monthly, quarterly, or custom, with delivery via email, in-app, secure download, or approved external recipient (§181).
- **FR-170**: CRM dashboard MUST display new leads, qualified leads, open opportunities, deals won/lost, pipeline value, forecast revenue, conversion rate, average deal size, average sales cycle, overdue tasks, upcoming follow-ups, scheduled meetings, sales target progress, open tickets, SLA breaches, customer health summary, and renewal opportunities; widgets MUST be configurable by role, and users MUST be able to add/remove/reorder/resize widgets, save layouts, filter by date range, and set a default dashboard, while administrators MAY define mandatory departmental dashboards (§9–10).

### Data Import/Export, Retention & Audit Requirements

- **FR-171**: Authorized users MAY export data as CSV, XLSX, or PDF, subject to permission check, maximum record limit, sensitive field masking, watermarking, audit logging, and expiring download links (§182).
- **FR-172**: Data import MUST support CSV, XLSX, API, and supported CRM migration sources through a workflow of upload file → select module → map fields → validate → detect duplicates → preview → import → show results (§183).
- **FR-173**: Import validation MUST detect missing required fields, invalid emails, invalid phone numbers, invalid dates, unsupported values, duplicate records, permission issues, and invalid owner mapping, with failed rows downloadable together with their error reasons (§184).
- **FR-174**: Bulk actions (assign, reassign, update status, update stage, add tag, remove tag, send email, create task, export, archive, delete) MUST require confirmation and MUST produce audit records (§185).
- **FR-175**: Organizations MUST configure data retention periods for leads, customers, tickets, chat transcripts, call recordings, audit logs, attachments, deleted records, and export files, complying with applicable legal and organizational requirements (§186).
- **FR-176**: Archived records MUST remain searchable for authorized users, MUST NOT appear in default views, MUST remain available in reports when explicitly selected, MUST preserve audit history, and MUST be restorable (§187).
- **FR-177**: Business records MUST use soft deletion where applicable, retaining deleted-by, deleted-date, deletion reason, and original owner; permanent deletion MUST require elevated permission (§188).
- **FR-178**: Authorized administrators MUST be able to restore records within a configured recovery period, and restoration MUST preserve relationships and activity history (§189).
- **FR-179**: Audit logs MUST capture user, action, module, record, previous value, new value, timestamp, IP address, device, source, and reason (when required), including login and security events (successful login, failed login, password reset, multi-factor authentication, session termination, permission changes, export activity, integration changes, API key creation) (§190–191).
- **FR-180**: System MUST prevent invalid status transitions, including a closed ticket moving directly to New, a lost opportunity moving to Won without going through reopening, an expired quote being accepted without revision, a deactivated user receiving new assignments, and a published knowledge article being deleted without permission (§262).

### Consent & Privacy Requirements

- **FR-181**: System MUST support consent management, data access requests, data correction requests, data deletion requests, communication preferences, processing purpose tracking, consent history, legal basis tracking, and data portability (§192; Constitution Article VI).
- **FR-182**: Consent records MUST include contact, consent type, channel, status, source, date, expiry, policy version, and proof of consent (§193; Constitution Article VI).
- **FR-183**: Sensitive fields (e.g., phone, email, tax number) MAY be masked in the UI; only authorized roles MAY reveal full values, and reveal actions MUST be logged when reveal logging is configured (§194).
- **FR-184**: System MUST use encryption in transit and at rest, secure secret storage, encrypted backups, secure password hashing, and signed file access links (§195).
- **FR-185**: Session security MUST include secure session tokens, session expiry, refresh token rotation, device tracking, concurrent session control, remote logout, suspicious login detection, and multi-factor authentication support (§196).

### Integration & API Requirements

- **FR-186**: API security MUST include authentication, authorization, rate limiting, request validation, response filtering, audit logging, key rotation, webhook signature verification, and replay protection (§197).
- **FR-187**: System MUST expose API groups for Leads, Contacts, Accounts, Opportunities, Activities, Tasks, Calls, Meetings, Products, Quotes, Orders, Contracts, Tickets, Chat, Knowledge Base, Customer Success, Renewal, Reports, Automation, and Admin, using standardized success/error response envelopes and standardized list pagination (page number, page size, cursor pagination where required, sort field/direction, filters, search, field selection, with response metadata for current page, page size, total records, total pages, and next cursor) (§198–200).
- **FR-188**: System MUST support webhook events for Lead Created, Lead Converted, Contact Created, Opportunity Updated, Opportunity Won, Opportunity Lost, Quote Accepted, Ticket Created, Ticket Updated, Ticket Closed, SLA Breached, Customer Health Changed, Renewal Updated, and Payment Received, with signed payloads, retry with exponential backoff, delivery logs, failure alerts, secret rotation, test delivery, and automatic disabling after repeated failure (§201–202).
- **FR-189**: System MUST support authorized email integration (sending, associating messages with CRM records, thread tracking, template use, reply synchronization, attachment storage, bounce detection) and optional telephony integration (click-to-call, inbound call identification, call logging, duration, outcome, recording reference, call routing), with call recording complying with applicable consent laws (§203–204).
- **FR-190**: System MUST support authorized WhatsApp integration for template messages, customer replies, conversation linking, ticket creation, lead creation, notification delivery, and opt-in tracking (§205).
- **FR-191**: Website and mobile application integrations MUST send contact forms and course/membership/event/corporate/marketplace-seller/recruitment enquiries to the CRM with source attribution, and the mobile app MUST support ticket creation, replies, live chat, notifications, enquiry submission, feedback, knowledge base access, and a CRM-linked customer profile (§206–207).
- **FR-192**: The CRM MUST receive and incorporate data from the LMS (enquiries, enrolments, purchases, completion, assessment results, inactivity, certificates), Community (registrations, engagement, reported issues, business enquiries — subject to privacy rules preventing unauthorized use of private community content), Membership (plan, dates, payment status, upgrade eligibility, cancellation, renewal risk), Events (registration, ticket purchase, attendance, session participation, feedback, sponsor enquiry, corporate booking, follow-up opportunity), Marketplace (buyers, sellers, orders, refunds, disputes, vendor enquiries, enterprise purchases, tickets), Mentor (enquiries, bookings, purchases, feedback, corporate packages, support cases), and Jobs Platform (employer leads, recruiter onboarding, job posting purchases, packages, employer support, contract renewals, candidate complaints) modules, and this data MAY contribute to customer profiles and health scores (§208–214).
- **FR-193**: Finance integration MUST provide invoices, payments, refunds, credits, taxes, outstanding balances, and revenue recognition references; the CRM MUST NOT become the final accounting source unless explicitly designed for that purpose (§215; cross-reference Volume 09).

### Localization, Currency & Administration Requirements

- **FR-194**: System MUST support multi-currency operation with base currency, record currency, exchange rates, converted values, historical rate reference, currency-specific price books, and currency permissions (§229).
- **FR-195**: System MUST store timestamps consistently, display dates in the viewing user's time zone, preserve event time zones, support customer time zones, schedule notifications correctly, and handle daylight-saving changes where applicable (§230).
- **FR-196**: Localization MUST cover the interface, emails, notifications, forms, knowledge articles, and chatbot responses, plus date/number/currency formats, in English, Tamil, and Tanglish-friendly content, extensible to future languages (§228; Constitution Localization & Language Requirements).

### Non-Functional Requirements

- **FR-197**: System MUST support keyboard navigation, screen-reader labels, visible focus states, sufficient contrast, scalable text, accessible forms, error announcements, captions for training videos, and alternative text for images (§231).
- **FR-198**: System MUST be responsive across desktop, laptop, tablet, and mobile browser, with critical mobile workflows (view lead, update status, add note, log call, complete task, view opportunity, reply to ticket, manage live chat, receive notifications) fully functional on mobile (§232).
- **FR-199**: System MUST meet defined enterprise performance thresholds for standard page load, indexed search response, Kanban movement responsiveness, non-duplicating ticket reply saves, optimized dashboard aggregation, secure asynchronous large exports, and non-blocking background automation (§233).
- **FR-200**: System MUST scale to millions of contacts, millions of activities, large ticket volumes, multiple organizations, high chat concurrency, large knowledge bases, high automation throughput, scalable search indexing, partitioned audit logs, and queued notification delivery (§234).
- **FR-201**: System MUST use background job processing for bulk imports, bulk exports, email delivery, notification delivery, workflow execution, SLA monitoring, report generation, search indexing, data retention, AI processing, and webhook delivery (§237).
- **FR-202**: User-facing errors MUST be understandable, MUST avoid exposing technical secrets, MUST include recovery guidance, MUST preserve entered data where possible, and MUST include a support reference ID; system errors MUST include structured logs and standardized error codes (e.g., CRM_RECORD_NOT_FOUND, CRM_PERMISSION_DENIED, CRM_VALIDATION_FAILED, CRM_DUPLICATE_RECORD, CRM_ASSIGNMENT_FAILED, CRM_PIPELINE_RULE_FAILED, CRM_SLA_CONFIGURATION_ERROR, CRM_AUTOMATION_FAILED, CRM_INTEGRATION_ERROR, CRM_EXPORT_LIMIT_EXCEEDED, CRM_RATE_LIMIT_EXCEEDED) (§238–239).
- **FR-203**: System MUST monitor API latency, error rate, database performance, search performance, queue depth, workflow failures, email failures, notification failures, webhook failures, chat concurrency, SLA calculation job health, and AI usage, and MUST raise operational alerts for API outage, database connectivity issue, queue backlog, high error rate, email delivery failure, webhook failure spikes, search indexing delay, automation failure spikes, SLA processor failure, and unusual data exports (§240–241).
- **FR-204**: System MUST perform scheduled, encrypted, monitored backups with restore testing, point-in-time recovery where supported, defined recovery objectives, and disaster recovery documentation (§242).
- **FR-205**: System MUST validate data on entry, including valid email format, standardized phone format, required organization scope, valid status transitions, valid pipeline stage, non-negative monetary values, valid currency, valid date ordering, valid ownership, valid relationship references, file restrictions, and consent checks (§261).

*Marking of ambiguous requirements:*

- **FR-206**: System MUST calculate lead/opportunity/customer scores using AI where AI-assisted scoring is enabled, but the specific AI provider, model, and confidence-threshold defaults are [NEEDS CLARIFICATION: source names "configured confidence" and "AI-assisted" repeatedly (§18, §135) without specifying which provider(s), default thresholds, or fallback scoring behavior when the AI service is unavailable — Volume 08's AI platform governs the underlying assistant, but per-feature default thresholds are not stated here].
- **FR-207**: System MUST enforce maximum record export limits per §182, but the specific numeric limit is [NEEDS CLARIFICATION: "maximum record limit" is named as a control but no number is given in the source].
- **FR-208**: System MUST define a configured recovery period for record restoration per §189, but the specific duration is [NEEDS CLARIFICATION: "within the configured recovery period" does not state a default number of days].
- **FR-209**: System MUST support SLA pause rules per §108, but the exact set of statuses/conditions that pause versus continue the SLA clock beyond "Waiting for Customer" is [NEEDS CLARIFICATION: source lists "waiting status" and "SLA pause rules" generically without enumerating every status that pauses the timer].
- **FR-210**: System MUST support a "chatbot conversation exceeds limits" handover trigger per §135, but the specific limit (message count, elapsed time, or both) is [NEEDS CLARIFICATION: not quantified in source].

### Key Entities *(include if feature involves data)*

- **Organization**: The top-level tenant boundary; owns isolated users, customers, leads, contacts, accounts, pipelines, tickets, knowledge base, reports, automations, integrations, and billing information. All organization-scoped tables carry an organization identifier used for tenant isolation and indexing.
- **Business Unit**: An organizational subdivision (e.g., Training Division, Enterprise Sales) that may have its own users, pipelines, targets, products, currencies, support queues, and reports.
- **Department / Team**: Groupings of users with a team lead, members, shared queue, shared views/reports, targets, and working hours; used for assignment, RBAC scoping, and reporting rollups.
- **Role / Permission / Permission Group**: The layered access-control hierarchy governing module, record, field, action, report, export, import, and automation access at configurable access levels.
- **User**: Any internal platform actor (SDR, Sales Rep, Account Executive, Sales Manager, Marketing user, Support Agent, Team Lead, CSM, Technical Support Engineer, Finance/Operations user, Administrator) with role, team, territory, and capacity attributes.
- **Lead**: A potential customer whose qualification is not yet confirmed; carries contact/company details, source, status, score, owner, and follow-up dates; may be merged, converted, or marked duplicate/invalid/spam.
- **Lead Source**: A configurable channel of origin (website form, landing page, referral, WhatsApp, etc.) attached to every lead and used for attribution reporting.
- **Lead Score**: A 0–100 rule-based and/or AI-assisted score with category (Cold/Warm/Hot/Sales Ready), contributing factors, and (for AI scores) an explanation string.
- **Lead Assignment**: A record of an assignment/reassignment event (method, previous owner, new owner, changed-by, reason, timestamp) produced by manual, round-robin, territory, or AI-assisted assignment.
- **Contact**: An individual associated with an account/company, with relationship role(s), preferred channel/language, consent status, and links to opportunities, orders, tickets, and other cross-module records.
- **Account**: A company, institution, or business entity; the parent of contacts, opportunities, contracts, and the 360-degree customer view; supports parent/subsidiary hierarchy.
- **Account Relationship**: A hierarchical or associative link between accounts (parent company, subsidiary, branch, franchise).
- **Opportunity**: A qualified revenue opportunity tied to an account, pipeline, and stage, carrying value, probability, weighted value, close dates, and win/loss outcome.
- **Pipeline / Pipeline Stage**: An organization-defined sales process; each stage configures probability, mandatory fields, duration limits, entry/exit conditions, automated tasks, and approval requirements.
- **Opportunity Product**: A line item (product, quantity, price, discount, tax, billing frequency) attached to an opportunity, quote, or order.
- **Activity (Task / Call / Meeting / Note)**: Time-stamped interaction records linkable to leads, contacts, accounts, opportunities, and tickets; includes recurrence rules for tasks.
- **Product**: A catalogue item (Course, Membership, Event Ticket, Marketplace Product, Mentor Package, Recruitment Service, Consulting Service, Subscription, Digital Product, Custom Service) with SKU and related TBT module reference.
- **Price Book / Price Book Item**: A named pricing set (Standard, Enterprise, Partner, Seasonal, International, etc.) scoped by currency, region, segment, or contract terms.
- **Quote / Quote Item**: A versioned, approvable price proposal tied to an opportunity, with status lifecycle from Draft through Accepted/Rejected/Expired/Revised.
- **Sales Order**: A converted, accepted quotation representing a confirmed sale, tracked through delivery and order status.
- **Contract**: A binding agreement record with start/end/renewal dates, value, billing frequency, terms, documents, and status lifecycle including Expiring/Renewed/Terminated.
- **Payment (CRM view)**: A reference/tracking record (invoice number, amount, status, method) surfaced in the CRM but not the system of record for accounting (see Assumptions).
- **Sales Target / Forecast**: Goal records (revenue, deals, renewals, etc.) assigned to an individual/team/territory/business unit and period; forecasts categorize pipeline into Pipeline/Best Case/Commit/Closed/Omitted with an override audit trail.
- **Territory**: A geographic/segment-based sales scope containing a manager, users, accounts, leads, opportunities, and targets.
- **Tag / Custom Field / Custom Field Value / Custom Layout**: Organization-defined metadata and schema extensions applied to CRM records, with configurable type, validation, and visibility.
- **Onboarding Template / Onboarding Project / Onboarding Task**: The definition and per-customer instantiation of a post-sale onboarding workflow.
- **Customer Health Score / Health Score Factor**: A 0–100 computed score (Healthy/Neutral/At Risk/Critical) with configurable weighted factors and retained history.
- **Customer Success Plan / Customer Goal**: A structured plan of goals, milestones, tasks, and review schedule tracked per account.
- **Customer Risk**: A tracked risk (type, severity, probability, impact, mitigation plan, owner, status) affecting an account's retention.
- **Customer Review (Business Review)**: A recorded Monthly/Quarterly/Annual review with objectives, metrics, feedback, and action items.
- **Renewal / Expansion Opportunity**: A tracked contract renewal (pipeline stage, reminders, risk) or an identified upsell/cross-sell opportunity.
- **Support Entitlement**: The support access rights (channels, hours, SLA, ticket count, named contacts) granted to a customer by membership, plan, or contract.
- **Ticket / Ticket Category / Ticket Message / Ticket Note**: The core support-case record, its classification, and its public/internal communication thread.
- **Support Queue**: A routing bucket for tickets/chats scoped by product, department, language, region, or support plan.
- **SLA Policy / SLA Event**: The configured response/resolution targets per priority/tier and the timeline of pause/breach/escalation events against a specific ticket.
- **Escalation**: A record of an SLA-risk, breach, or severity-driven escalation through the Agent → Team Lead → Support Manager → Department Head → Org Admin chain.
- **Chat Session / Chat Message / Chat Agent**: A live chat conversation, its messages, and the assigned/available agent state.
- **Chatbot Session**: An automated conversation, including intent detection results and any handover event to a human agent.
- **Knowledge Category / Knowledge Article / Article Version / Article Feedback**: The self-service content hierarchy, versioned article content, and helpfulness feedback used for gap detection.
- **Incident / Problem / Root Cause Report**: Major-incident and underlying-problem records, including corrective/preventive actions.
- **Customer Feedback / Survey / Survey Question / Survey Response**: Feedback capture across CSAT/NPS/CES and custom survey instruments.
- **Workflow Definition / Workflow Version / Workflow Run / Workflow Run Step**: The no-code automation definition, its versions, and the execution log of each trigger/condition/action run.
- **Approval Definition / Approval Request / Approval Action**: Configured approval chains and the individual approve/reject/delegate decisions made against a request (discount, quote, refund, contract, etc.).
- **Notification Template / Notification Event**: Multi-channel notification content and the catalog of system events that can trigger a notification.
- **Webhook / Webhook Delivery**: Outbound event subscriptions and their signed, retried delivery attempts.
- **Consent Record**: A per-channel, per-contact consent entry (type, channel, status, source, date, expiry, policy version, proof) governing whether automated communication may be sent.
- **Audit Log Entry**: An immutable record of user, action, module, record, previous/new value, timestamp, IP, device, source, and reason, covering both business-data changes and security/login events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of leads submitted through any configured lead source (website form, landing page, WhatsApp, event registration, import, API, etc.) are captured as a Lead record with source attribution and pass through duplicate detection before creation — zero silent duplicate lead creation in testing.
- **SC-002**: 100% of AI-assisted lead-scoring outputs and AI next-best-action recommendations display a human-readable explanation, and zero leads are auto-disqualified by AI without a human-reviewable step.
- **SC-003**: 100% of Kanban stage moves on an opportunity correctly recalculate weighted pipeline value, write an audit record, and block the move if a stage's mandatory fields are unmet.
- **SC-004**: Enterprise Critical tickets meet a 15-minute first-response / 30-minute next-response / 4-hour resolution SLA, and Standard Normal tickets meet a 4-business-hour first-response / 2-business-day resolution SLA, matching the configured policy example, with SLA compliance visible on the support dashboard.
- **SC-005**: 100% of SLA breaches produce the full pre-breach warning sequence (agent warning, team-lead notification, dashboard warning, priority increase) before the deadline, and the full post-breach sequence (breach flag, manager notification, escalation trigger, breach-duration record) at the moment of breach.
- **SC-006**: Net Promoter Score is calculated automatically for 100% of completed NPS surveys, correctly grouped into Promoters (9–10) / Passives (7–8) / Detractors (0–6), with zero manual recalculation required.
- **SC-007**: 100% of tracked renewal records with a set renewal date generate the configured 120/90/60/30-day reminder sequence automatically, with no manually-triggered reminder required for standard renewals.
- **SC-008**: Zero cross-organization data exposure incidents occur across leads, contacts, accounts, tickets, knowledge articles, and reports under multi-tenant security testing.
- **SC-009**: 100% of sensitive fields (contract value, discount percentage, payment information, internal notes, escalation comments, masked phone/email/tax number) are correctly hidden, masked, or excluded from view and export for roles without the corresponding field-level permission, verified through permission and export testing.
- **SC-010**: 100% of chatbot conversations meeting a mandatory handover condition (explicit request, negative sentiment, payment/security issue, low confidence, or exceeded limits) transfer to a human agent with the full conversation transcript intact, with zero conversations "stuck" in bot-only mode past a handover trigger.

## Assumptions

- The CRM's payment/invoice tracking is a reference and workflow-tracking view only; Volume 09 (Membership Plans, Subscriptions, Payments, Invoices, Revenue Ops) remains the system of record for invoices, payments, tax, and revenue recognition. Per the source: "CRM must not become the final accounting source unless explicitly designed for that purpose" (§215).
- The AI Sales Assistant, AI Support Assistant, and AI Lead Scoring described in this volume are feature-specific applications of the platform-wide AI Assistant defined in Volume 08 (TBT AI Assistant). This spec defines the CRM/Support-specific AI use cases, outputs, and guardrails (§17–18, §136, §216–221); the underlying model routing, prompt architecture, and provider integration are governed by Volume 08 and are out of scope here.
- Lead, contact, account, and health-score data is assumed to be fed by and to feed the LMS (Volume 04), Community (Volume 05), Mentor Marketplace (Volume 07), Membership/Payments (Volume 09), Events (Volume 10), Digital Marketplace (Volume 11), and Jobs/Talent (Volume 12) modules, per the integration requirements in §208–214; this spec assumes those modules emit the referenced events (enrolment, purchase, registration, booking, posting, etc.) but does not redefine their internal data models.
- Optional/pluggable integrations named with "may support" language in the source (telephony/click-to-call, digital signature providers, enterprise SSO, specific WhatsApp Business API vendor) are treated as configurable, provider-agnostic integration points rather than a mandated specific vendor.
- The default 11-stage sales pipeline, default lead/ticket/quote/contract statuses, and default ticket categories are seed/default configuration that organizations and business units may customize (§15, §34, §59, §64, §98) — they are not fixed system constants.
- Business-hours, holiday-calendar, and SLA-pause configuration is organization- and team-scoped data, not a global platform constant, since different teams/support plans may use different calendars (§227) and different SLA policies (§106–107).
- Volume 14 Part 2 Chapter 27 ("Enterprise CRM, Sales, Customer Success") is flagged in the feature manifest as overlapping this volume. This spec treats Volume 13 as authoritative for the core CRM, sales pipeline, customer success, and support desk capability; any cross-cutting enterprise marketing/RevOps orchestration on top of this data is deferred to that chapter's own spec rather than duplicated here.
- Several requirements are marked `[NEEDS CLARIFICATION]` in the Functional Requirements section (AI confidence-threshold defaults, export record limits, restoration recovery-period length, full SLA-pause status list, chatbot handover limit thresholds) because the source names the control but does not state a default numeric value; these are flagged rather than silently assumed.
