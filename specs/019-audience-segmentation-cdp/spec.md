# Feature Specification: Audience Management, Segmentation & Customer Data Platform

**Feature Branch**: `019-audience-segmentation-cdp`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14, Part 1, Chapter 6 — Audience Management, Segmentation & Customer Data Platform (CDP), from `document 1/Document 1 (18).md`. The CDP centralizes customer information from every TBT product/module into a unified customer profile, enabling audience segmentation, personalized communication, predictive marketing, and analytics. It must serve as the single source of truth for all customer-related marketing activity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Profile Aggregation in Near Real Time (Priority: P1)

A marketer, support agent, or automated downstream system needs one accurate, current view of a customer instead of hunting across the Mobile App, Admin Portal, Community, Courses, Podcasts, E-books, Events, Marketplace, Memberships, Referral Program, Support System, AI Assistant, Notification Service, Website, Landing Pages, and API Integrations. Every interaction a customer has in any of these modules must enrich that customer's single master profile in near real time, with no duplicate profiles created for the same person.

**Why this priority**: This is the foundation of the entire CDP. Segmentation, scoring, AI-powered audience discovery, exports, and every downstream Volume 14 marketing feature (email, SMS/WhatsApp/push, automation, lead scoring, attribution, retention) reads from the unified profile. Nothing else in this chapter — or in the marketing platform generally — functions without it.

**Independent Test**: Trigger a single interaction in one source module (e.g., a customer completes a course lesson) and verify the customer's unified profile reflects the updated Engagement Information within the stated synchronization target, with exactly one profile existing for that customer — independent of any segment, score, or AI feature being built yet.

**Acceptance Scenarios**:

1. **Given** a registered customer purchases a product in the Marketplace, **When** the transaction is confirmed, **Then** the customer's unified profile Transaction Information (Purchases, Total Revenue, Lifetime Value) updates within 5 seconds.
2. **Given** a customer with an existing profile logs in, **When** the login event fires, **Then** Login Frequency, Last Login, and Session Count update on the master profile within 5 seconds.
3. **Given** two interaction records arrive from two different source modules referencing the same customer email address, **When** the CDP ingests both, **Then** the customer has exactly one master profile combining data from both sources — no duplicate record is created.
4. **Given** a customer updates their profile information in the mobile app, **When** the update is saved, **Then** the change propagates to the unified profile within 5 seconds and is visible on the corresponding Admin Portal profile view.

---

### User Story 2 - Build a Dynamic Segment via the Visual Audience Builder (Priority: P1)

A marketer uses the visual Audience Builder to combine demographic, behavioral, transactional, marketing-engagement, and custom-attribute rules — with AND/OR/NOT logic and nested rule groups — into a segment, sees an estimated audience size before saving, and the segment's membership then updates automatically as customer data changes, with no manual re-run required.

**Why this priority**: Precise, self-maintaining audience targeting is the core value proposition of the CDP module and the direct dependency for every campaign, automation, and personalization feature elsewhere in Volume 14. It ranks alongside profile aggregation as foundational.

**Independent Test**: Using only the Audience Builder and rule engine (no scoring or AI features required), create a segment such as "Spent more than ₹10,000 in the last 30 days AND opened the last 5 campaigns," confirm the size estimate displays before saving, and confirm membership is populated correctly.

**Acceptance Scenarios**:

1. **Given** a marketer is in the Audience Builder, **When** they add the rules "Total Spend > ₹10,000" AND "Last Login within 7 days," **Then** the builder displays an estimated audience size before the segment is saved.
2. **Given** a marketer nests a rule group — "Country = India" AND ("Purchased within 30 days" OR "Completed a course") — **When** the segment is validated, **Then** the system confirms the rule set is valid or reports specific validation errors.
3. **Given** a dynamic segment "Inactive for 60 days" is saved and active, **When** a member of that segment logs in, **Then** that customer is automatically removed from the segment within 30 seconds without manual intervention.
4. **Given** an administrator attempts to save a segment definition identical to an already-saved segment, **When** they submit it, **Then** the system flags it as a duplicate.

---

### User Story 3 - View a Customer's Engagement, Purchase, Loyalty, and Churn-Risk Scores (Priority: P2)

A marketing or retention team member opens a customer's profile and sees four dynamically computed scores — Engagement, Purchase, Loyalty, and Churn Risk — so they can prioritize outreach, personalization, or retention effort without manually cross-referencing raw activity data.

**Why this priority**: Scores are high-value for prioritization and personalization, but they are computed from the unified profile and timeline established in P1, so they are correctly sequenced after — not before — profile aggregation and segmentation.

**Independent Test**: After sufficient activity and transaction history exists for a single customer, open that customer's profile and confirm all four scores render with values consistent with the underlying factors, independent of AI segmentation or export functionality.

**Acceptance Scenarios**:

1. **Given** a customer has logged in frequently and participated in community discussions, **When** their profile is viewed, **Then** the Engagement Score reflects logins, community participation, content consumption, and campaign interactions.
2. **Given** a customer has an unopened-campaign streak and an expiring subscription, **When** their profile is viewed, **Then** the Churn Risk Score is elevated relative to an active, engaged customer.
3. **Given** new purchase data is recorded for a customer, **When** the scoring engine processes it, **Then** the Purchase Score updates automatically without a manual recalculation request.
4. **Given** a customer has a long membership duration, multiple referrals, and event participation, **When** their profile is viewed, **Then** the Loyalty Score reflects those factors.

---

### User Story 4 - AI-Discovered Segment Surfaces an Upsell Opportunity (Priority: P2)

The AI segmentation engine scans unified profiles and proposes candidate segments such as "Upsell Opportunities," "Cross-Sell Opportunities," or "Brand Advocates." A human administrator must review, may edit, and must explicitly save an AI-proposed segment before it becomes an active segment usable by any campaign — consistent with the platform-wide principle that AI output is advisory, never autonomous.

**Why this priority**: AI-discovered audiences meaningfully increase campaign relevance and conversion, but they are additive on top of the manual Audience Builder (P1) and are not required for baseline audience targeting to deliver value.

**Independent Test**: Run the AI segmentation engine against a seeded profile set, verify it proposes an "Upsell Opportunities" candidate segment with a member list, and verify a human administrator must explicitly review and save it before it is usable by campaign tools.

**Acceptance Scenarios**:

1. **Given** sufficient purchase and engagement history exists across the customer base, **When** the AI segmentation engine runs, **Then** it proposes candidate segments such as Upsell Opportunities, Cross-Sell Opportunities, Churn Risk, and Brand Advocates.
2. **Given** an AI-proposed "Upsell Opportunities" segment, **When** an administrator reviews it, **Then** they can edit its membership or rules before saving.
3. **Given** an administrator has not yet reviewed an AI-proposed segment, **When** a campaign tool queries available active segments, **Then** the unreviewed AI-proposed segment does not appear as usable.
4. **Given** an administrator saves an AI-proposed segment as-is, **When** it is saved, **Then** it becomes available for campaign use exactly like a manually created segment.

---

### User Story 5 - Consent-Respecting Audience Export (Priority: P2)

A marketer exports a segment's member list (CSV, Excel, JSON, or PDF summary) for use in a downstream channel tool. Export access is governed by RBAC, sensitive fields are masked for roles without visibility, and consent status travels with the export so downstream sends can honor it.

**Why this priority**: Exports are how segments become operational in campaign channels, and consent-safe handling is a hard platform requirement — but this capability depends on segments already existing (P1), so it is sequenced after core segmentation.

**Independent Test**: Export a previously built static segment as CSV, confirm only fields the requesting role is permitted to see are included (with masking applied where required), and confirm the export completes within the stated performance target.

**Acceptance Scenarios**:

1. **Given** a marketer with export permission selects a segment of 50,000 customers, **When** they export it to CSV, **Then** the file is generated and available within 30 seconds.
2. **Given** a segment includes customers who have withdrawn Email marketing consent, **When** the segment is exported for an email-campaign upload, **Then** each customer's consent status is included in the export so downstream sends can respect the withdrawal.
3. **Given** an administrator without export permission attempts to export a segment, **When** they submit the export request, **Then** the system denies it per RBAC policy.
4. **Given** a segment contains fields subject to data masking, **When** a role without visibility into those fields exports the segment, **Then** those fields appear masked in the resulting export file.

---

### User Story 6 - Manage Tags & Labels on Customer Profiles (Priority: P3)

An administrator manually tags a customer profile (e.g., VIP, At Risk), or the system applies a rule-based or AI-generated tag automatically, to support targeting and internal workflows.

**Why this priority**: Tags are a useful organizational and targeting aid layered on top of the profile and segmentation capabilities, but are not required for the core CDP to deliver value, so they are sequenced after P1/P2 stories.

**Independent Test**: Manually assign a tag to a single customer profile and confirm it is visible on the profile and usable as a filter/segment attribute, independent of rule-based or AI-generated tagging.

**Acceptance Scenarios**:

1. **Given** an administrator views a customer profile, **When** they add the tag "VIP," **Then** the tag is saved and displayed on the profile.
2. **Given** a rule is configured to auto-tag customers spending over a defined threshold as "High Value," **When** a customer crosses that threshold, **Then** the "High Value" tag is applied automatically.
3. **Given** the AI engine identifies a customer as a likely "Brand Advocate," **When** it applies an AI-generated tag, **Then** the tag is visibly distinguished on the profile as AI-generated.

---

### User Story 7 - Data Quality Deduplication & Validation (Priority: P3)

The system continuously scans customer records for duplicates and invalid data, automatically merging duplicates or flagging and notifying administrators of issues, so the CDP remains an accurate single source of truth as data volume grows.

**Why this priority**: Data-quality remediation protects long-term integrity and scale but the CDP can deliver value (P1–P2) before automated remediation is fully relied upon; it becomes critical as volume increases, which is why it is sequenced at P3.

**Independent Test**: Seed two customer records sharing the same email address from two different source modules, run the data-quality process, and verify the records are either automatically merged or flagged with an administrator notification per the defined checks.

**Acceptance Scenarios**:

1. **Given** two profile records exist with the same email address from different source modules, **When** the data-quality process runs, **Then** the duplicates are automatically merged into a single profile.
2. **Given** a customer record has a malformed phone number, **When** the data-quality process runs, **Then** the record is flagged as invalid and an administrator is notified.
3. **Given** a customer record is missing a mandatory field, **When** the data-quality process runs, **Then** the record is flagged and an administrator is notified.

---

### Edge Cases

- What happens when two source records for the same customer disagree on a field value (e.g., different spelling of name, conflicting date of birth) at merge time — which source's value takes precedence? [NEEDS CLARIFICATION: no field-level merge conflict resolution rule is stated in the source chapter]
- What happens when a dynamic segment is queried or used to drive an in-flight campaign send while a data-driven refresh is still in progress — can a customer be sent to under stale (pre-refresh) membership?
- How does the system handle a customer withdrawing consent for a channel (e.g., WhatsApp) while they are currently a member of an active dynamic segment feeding a live automation on that channel — is the withdrawal reflected in segment/export eligibility before the next scheduled send, per the platform's consent-propagation principle?
- What happens when a duplicate merge combines two profiles whose consent records for the same channel conflict (one opted in, one opted out)? [NEEDS CLARIFICATION: no consent-merge precedence rule is stated]
- How does the system handle an AI-proposed segment (e.g., Upsell Opportunities) that includes a customer who has withdrawn Analytics or Personalized-Recommendations consent — is that customer excluded from AI-driven scoring/segmentation output even if they otherwise match the pattern?
- What happens when a bulk audience import file contains rows with invalid email/phone formats or missing mandatory fields — are valid rows imported while invalid rows are reported separately, or is the whole batch rejected?
- What happens when a source module deactivates or deletes a customer account but no corresponding deletion/deactivation event reaches the CDP, leaving an orphaned record?
- What happens when a segment's rule references a custom attribute that an administrator later deletes — does the segment become invalid, silently drop that condition, or block further use until corrected?
- What happens when score recalculation cannot complete within the 2-minute target because of data volume at "millions of profiles" scale — is a stale score shown, or is recalculation queued with a visible "last updated" indicator? [NEEDS CLARIFICATION: no degradation/fallback behavior is stated for missed recalculation targets]

## Requirements *(mandatory)*

### Functional Requirements

**Platform Scope & Data Sources**

- **FR-001**: System MUST serve as the single source of truth for all customer-related marketing activity by building one unified customer profile per customer from data generated across every TBT product and interaction.
- **FR-002**: System MUST ingest and continuously synchronize customer data from all connected sources — Mobile App, Admin Portal, Community, Courses, Podcasts, E-books, Events, Marketplace, Memberships, Referral Program, Support System, AI Assistant, Notification Service, Website, Landing Pages, and API Integrations — enriching each customer's unified profile in near real time as each interaction occurs.
- **FR-003**: System MUST support real-time audience segmentation, behavioral targeting, and provide the data foundation required to power AI-driven personalization, in service of improved campaign accuracy and conversion rates.
- **FR-004**: System MUST be architected to support millions of customer profiles without degrading segmentation, scoring, or search performance.
- **FR-005**: System MUST enforce privacy and consent compliance across all audience management and CDP functionality.

**Unified Customer Profile**

- **FR-006**: System MUST maintain exactly one master profile per customer, consolidating data from all connected sources into that single record.
- **FR-007**: Each profile MUST capture Identity Information: Customer ID, Full Name, Username, Email Address, Mobile Number, Profile Photo, Gender (optional), Date of Birth (optional), Preferred Language, Country, State, City, and Time Zone.
- **FR-008**: Each profile MUST capture Account Information: Registration Date, Membership Type, Account Status, Referral Code, Referral Source, Subscription Status, and Loyalty Tier.
- **FR-009**: Each profile MUST capture Engagement Information: Login Frequency, Last Login, Session Count, Community Activity, Course Progress, Podcast Listening History, Ebook Reading Progress, Event Participation, and Support Interactions.
- **FR-010**: Each profile MUST capture Transaction Information: Purchases, Total Revenue, Refunds, Wallet Balance, Reward Points, Coupon Usage, Average Order Value, and Lifetime Value (LTV).
- **FR-011**: Each profile MUST capture Communication Preferences: Email Opt-in, SMS Opt-in, WhatsApp Opt-in, Push Notification Preference, Language Preference, and Preferred Communication Time.

**Customer Timeline**

- **FR-012**: Each profile MUST include a chronological activity timeline capturing Registration, Login, Campaign Opens, Link Clicks, Purchases, Refunds, Course Enrollment, Podcast Plays, Ebook Downloads, Referral Invites, Membership Upgrades, and Support Tickets.
- **FR-013**: Users MUST be able to filter, search, export, and select a date range within a customer's activity timeline.

**Segment Builder** (Audience Segmentation & Audience Builder)

- **FR-014**: System MUST support both static segments (created manually) and dynamic segments (automatically updated based on rules), with dynamic segment membership refreshing automatically whenever underlying customer data changes.
- **FR-015**: System MUST allow segments to be built using any combination of Demographic (age, gender, language, country, state, city), Behavioral (login frequency, session duration, community activity, content consumption, purchase behavior, referral activity, campaign engagement), Transactional (total purchases, average order value, refund history, subscription status, revenue contribution), and Marketing Engagement (email opens, email clicks, push notification opens, WhatsApp interactions, SMS responses, landing page visits) attributes.
- **FR-016**: System MUST allow administrators to define Custom Attributes (e.g., Business Category, Industry, Company Size, Experience Level, Skill Interests, Preferred Topics) for use in segment rules.
- **FR-017**: System MUST provide a visual Audience Builder for constructing complex audience rules, supporting the logical operators AND, OR, and NOT, and the comparison operators Equals, Not Equals, Greater Than, Less Than, Between, Contains, Starts With, Ends With, Is Empty, and Is Not Empty.
- **FR-018**: The Audience Builder MUST support nested rule groups and saving/reusing rule templates.
- **FR-019**: The Audience Builder MUST validate rules, provide an audience size estimate, and detect duplicate segment definitions before a segment is saved or activated.

**Tags & Labels**

- **FR-020**: System MUST allow administrators to assign tags/labels to customer profiles (e.g., VIP, Influencer, High Value, At Risk, New User, Active Learner, Event Speaker, Affiliate, Partner).
- **FR-021**: System MUST support manual, rule-based, and AI-generated tag assignment.

**Audience Import & Export**

- **FR-022**: System MUST support importing audience data in CSV, Excel, and JSON formats, with field mapping, duplicate detection, validation, preview before import, and error reporting.
- **FR-023**: System MUST support exporting audience data in CSV, Excel, JSON, and PDF (summary report) formats.
- **FR-024**: Export capability MUST be governed by RBAC policy.

**Data Quality Management**

- **FR-025**: System MUST continuously validate customer records for duplicate emails, duplicate phone numbers, invalid formats, missing mandatory fields, inconsistent values, and orphaned records.
- **FR-026**: System MUST automatically merge duplicate customer records and automatically flag invalid records identified during validation. [NEEDS CLARIFICATION: field-level conflict resolution rule for automatic merges is not specified]
- **FR-027**: System MUST notify administrators of data-quality issues identified during validation.

**AI Segmentation**

- **FR-028**: System MUST provide an AI engine that automatically identifies valuable customer groups, including High Conversion Probability, Churn Risk, Upsell Opportunities, Cross-Sell Opportunities, Loyal Customers, Brand Advocates, Dormant Users, and Potential Affiliates.
- **FR-029**: Administrators MUST be able to review, edit, and explicitly save an AI-generated segment before it becomes an active, usable segment; AI-generated segment proposals MUST NOT become active automatically without this human review step.

**Dynamic Scoring** (Customer Scoring)

- **FR-030**: System MUST compute an Engagement Score per customer based on logins, community participation, content consumption, and campaign interactions.
- **FR-031**: System MUST compute a Purchase Score per customer based on spending, purchase frequency, average order value, and refund behavior.
- **FR-032**: System MUST compute a Loyalty Score per customer based on membership duration, referrals, event participation, and reward points.
- **FR-033**: System MUST compute a Churn Risk Score per customer based on inactivity, declining engagement, unopened campaigns, and subscription expiry.
- **FR-034**: System MUST automatically update all customer scores as new relevant data becomes available, without requiring a manual recalculation trigger.

**Consent & Privacy**

- **FR-035**: System MUST record customer consent status for Email marketing, SMS marketing, WhatsApp communication, Push notifications, Personalized recommendations, and Analytics tracking.
- **FR-036**: Each consent record MUST capture Status, Source, Timestamp, IP Address, and the Version of the consent policy in effect at the time of capture.
- **FR-037**: System MUST retain consent change history for audit purposes. [NEEDS CLARIFICATION: retention duration for consent history is not specified in the source chapter]

**Performance** (Real-Time Synchronization & Performance Requirements)

- **FR-038**: System MUST automatically synchronize a customer's profile when they register, log in, update their profile, purchase a product, join an event, read an ebook, listen to a podcast, complete a course, submit a referral, or open a campaign.
- **FR-039**: System MUST complete profile updates within 5 seconds, dynamic segment refresh within 30 seconds, and AI score recalculation within 2 minutes of the triggering data change.
- **FR-040**: System MUST return profile search results within 500 ms, complete segment creation within 2 seconds, complete customer lookup within 300 ms, and complete an audience export of 100,000 records within 30 seconds.

**Analytics & Insights**

- **FR-041**: System MUST provide dashboards for Audience growth, Geographic distribution, Device usage, Membership breakdown, Revenue segmentation, Engagement trends, Cohort analysis, Churn analysis, and Customer lifetime value.
- **FR-042**: All analytics dashboards MUST support filtering, exporting, and scheduled reporting.

**Security**

- **FR-043**: System MUST protect audience data using RBAC authorization and field-level access control.
- **FR-044**: System MUST encrypt audience data at rest and in transit, and MUST maintain audit logging of access to and changes in audience data.
- **FR-045**: System MUST provide secure export mechanisms, apply data masking to sensitive fields, and apply rate limiting to bulk audience operations.

### Key Entities *(include if feature involves data)*

- **Unified Customer Profile**: The single master record per customer, combining Identity, Account, Engagement, Transaction, and Communication Preference information sourced from every connected TBT module; the root entity all other CDP entities relate to.
- **Customer Timeline Event**: A single chronological activity entry (registration, login, campaign open, click, purchase, refund, enrollment, download, referral invite, upgrade, support ticket) attached to a Unified Customer Profile.
- **Segment**: A named, saved audience definition — either Static (manually curated fixed member list) or Dynamic (rule-driven, auto-refreshing membership) — usable by downstream campaign/automation features.
- **Segment Rule / Rule Group**: A condition (attribute, comparison operator, value) or nested group of conditions combined with AND/OR/NOT logic that determines Dynamic Segment membership; may reference Demographic, Behavioral, Transactional, Marketing Engagement, or Custom Attribute fields.
- **Custom Attribute**: An administrator-defined profile field (e.g., Business Category, Industry, Company Size) available for use in Segment Rules alongside standard profile fields.
- **Tag / Label**: A discrete marker (e.g., VIP, At Risk) attached to a Unified Customer Profile, sourced Manually, Rule-based, or AI-generated.
- **AI-Generated Segment (Proposal)**: A candidate Segment produced by the AI engine (e.g., Upsell Opportunities, Churn Risk) that requires human review, optional edit, and explicit save before becoming an active Segment.
- **Customer Score**: A dynamically computed numeric score of one of four types — Engagement, Purchase, Loyalty, Churn Risk — attached to a Unified Customer Profile and recalculated automatically as underlying data changes.
- **Consent Record**: A per-channel record (Email, SMS, WhatsApp, Push, Personalized recommendations, Analytics tracking) capturing Status, Source, Timestamp, IP Address, and consent-policy Version, retained historically for audit.
- **Data Quality Flag / Duplicate Merge Record**: The output of continuous validation — either a flag on an invalid/inconsistent/orphaned record (with administrator notification) or a record of an automatic duplicate merge.
- **Audience Import Job / Audience Export Job**: A bounded operation that loads (CSV/Excel/JSON, with field mapping, duplicate detection, validation, preview, error reporting) or extracts (CSV/Excel/JSON/PDF, RBAC-governed, masking-aware) a set of customer records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customer profile updates reflect a triggering interaction from any connected module within 5 seconds.
- **SC-002**: Dynamic segment membership refreshes within 30 seconds of any underlying customer data change.
- **SC-003**: Customer scores (Engagement, Purchase, Loyalty, Churn Risk) recalculate within 2 minutes of new relevant data becoming available.
- **SC-004**: Profile search returns results in under 500 ms and customer lookup completes in under 300 ms.
- **SC-005**: A new segment can be created, validated, and sized (audience-size estimate shown) in under 2 seconds.
- **SC-006**: An audience export of up to 100,000 records completes in under 30 seconds.
- **SC-007**: The CDP sustains millions of concurrently maintained customer profiles without measurable degradation in segmentation, scoring, or search response times.
- **SC-008**: Consent withdrawals are reflected in segment membership, export data, and automation eligibility before any subsequent send on the withdrawn channel — no send occurs against stale consent state.
- **SC-009**: Continuous data-quality validation results in duplicate profiles being automatically merged and administrators being notified of flagged issues within the same synchronization cycle in which the issue is detected.

## Assumptions

- This feature is the Customer Data Platform foundation of the marketing platform: it is consumed by nearly every other Volume 14, Part 1 marketing feature — Email Marketing (020), SMS/WhatsApp/Push (021), Marketing Automation Workflows (022), Landing Pages & Lead Capture (023), Lead Management & Scoring (024), AI Marketing Assistant (025), A/B Testing & CRO (026), Marketing Analytics & Attribution (027/028), Customer Lifecycle/Retention/Loyalty (029), Referral/Affiliate/Partner Marketing (030), Social Media (031), and Omnichannel Orchestration (032) — which reference the Unified Customer Profile, Segment, Customer Score, and Consent Record entities defined here rather than redefining them.
- The source chapter (Volume 14, Part 1, Chapter 6) is a comparatively thin draft relative to more detailed chapters elsewhere in the PRD: it provides flat feature lists and a performance-target table, but no explicit field-level data schema, API/error-code definitions, or MVP-tier/Definition-of-Done/QA section. This spec captures only what is explicitly stated and marks genuine gaps with `[NEEDS CLARIFICATION]` rather than inventing detail.
- Identity resolution/deduplication in this version is assumed to be deterministic exact-match on fields such as email and phone number; the source explicitly places "Identity resolution across devices" and "Graph-based relationship mapping" under Future Enhancements, implying probabilistic or cross-device matching is out of scope for this version.
- Consent *collection* mechanics (opt-in UI, double opt-in flows, policy-version prompts) are defined by the modules that capture consent (e.g., Website, Onboarding); this chapter defines only the CDP's storage, retrieval, and propagation of Consent Records, consistent with the platform-wide consent principle that withdrawal must propagate to in-flight automation without delay.
- RBAC roles and permission groups referenced here ("RBAC authorization," "export permissions follow RBAC policies," field-level access control) are assumed to be the same role/permission model defined in the Marketing RBAC & Roles feature (`specs/016-marketing-rbac-roles`) rather than a CDP-specific role system.
- The following items are explicitly listed in the source chapter under "Future Enhancements" and are therefore treated as out of scope for this spec: AI-generated micro-segments, a real-time personalization engine, cross-device identity resolution, predictive lifetime-value modeling, customer journey visualization, lookalike audience generation, external CRM synchronization, Customer 360° visualization, and graph-based relationship mapping.
- No consent-history retention period is stated in the source; retention duration is flagged as `[NEEDS CLARIFICATION]` (see FR-037) rather than assumed.
- No field-level conflict-resolution precedence rule is stated for automatic duplicate merges or for merging conflicting consent records between duplicate profiles; both are flagged as `[NEEDS CLARIFICATION]` (see Edge Cases and FR-026) rather than assumed.
