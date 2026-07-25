# Feature Specification: Enterprise CRM Territory-Based Security & Record-Level Permissions (Third Re-Specification)

**Feature Branch**: `060-enterprise-crm-sales-customer-success`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Volume 14, Chapter 27 of the TBT One Enterprise PRD — Enterprise CRM, Sales & Customer Success Platform. Source: `document 2/Document 2.md`, lines 18720–19396. This is the third overlapping specification of CRM/sales capability in the manifest (after feature 013 and feature 045); per the Constitution's Development Workflow rules for Volume 14 Chapters 24–40, this spec cross-references the overlapping features rather than duplicating them, and focuses on this chapter's one genuinely distinctive contribution: Territory-Based Security and Record-Level Permissions as CRM access-control layers distinct from feature 013's field-level RBAC, plus the AI CRM Assistant's specific named query capabilities."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Territory-Based Record Visibility for Leads, Accounts & Opportunities (Priority: P1)

A regional sales representative opens the CRM and sees only the leads, accounts, and opportunities that fall within their assigned sales territory — not the entire organization's book of business — even though their role would otherwise permit "View Team" or broader access under standard RBAC. A sales director overseeing multiple territories sees the combined set of records across all territories they manage.

**Why this priority**: Territory-Based Security is named as a distinct capability alongside RBAC in the chapter's CRM Security & Governance section ("Role-Based Access Control (RBAC)... Territory-Based Security... Record-Level Permissions," §12), and is the first of this chapter's two genuinely new access-control mechanisms not already specified as record-visibility gates in feature 013 (which defines "View Territory" as one access *level* but not the territory-boundary enforcement mechanics) or feature 045 (which defines territories as a coverage/allocation model, not a security boundary).

**Independent Test**: Can be fully tested by assigning two sales reps to two different, non-overlapping territories, creating a lead/account/opportunity in each territory, and confirming each rep sees only the record(s) in their own territory while a manager assigned to both territories sees both, independent of any broader role-based permission either rep might otherwise hold.

**Acceptance Scenarios**:

1. **Given** a sales representative is assigned to Territory A only, **When** the representative opens the Leads, Accounts, or Opportunities list, **Then** only records whose territory field maps to Territory A are visible, regardless of the representative's role-based access level.
2. **Given** a sales manager is assigned as territory manager for both Territory A and Territory B, **When** the manager opens the same list views, **Then** records from both territories are visible in a single combined view.
3. **Given** a record's territory-determining field (e.g., account region) is changed by an authorized user, **When** the change is saved, **Then** the record's territory-based visibility is re-evaluated so that users outside the new territory lose visibility and users inside it gain visibility.
4. **Given** a user has a role-based access level of "View Organization" but is not assigned to a record's territory, **When** territory-based security is enabled for that module, **Then** territory-based security still restricts the user's default visibility, and any override MUST occur only through an explicit record-level permission grant (see User Story 2).

---

### User Story 2 - Record-Level Permission Override Independent of Territory and Role (Priority: P1)

An administrator needs to grant a specific finance analyst visibility into one highly sensitive strategic account outside their territory and role, without changing the analyst's role or reassigning their territory — and, separately, needs to restrict a small number of named accounts (e.g., accounts under active legal dispute) from being seen even by users whose role and territory would normally grant access.

**Why this priority**: Record-Level Permissions is named as the second distinct security capability in the chapter's governance list (§12) and is explicitly described by the task context as "distinct from feature 013's field-level RBAC" — feature 013 restricts which *fields* on a record are visible (FR-003), while this capability restricts access to the *record itself*, on a per-record basis, overriding the broader role/territory defaults.

**Independent Test**: Can be fully tested by granting a specific user explicit access to one record outside their territory and confirming they can see it while other users with identical role/territory remain unable to; and separately by restricting a specific record from a user who would otherwise see it under role/territory rules, and confirming it disappears from that user's views while remaining visible to others.

**Acceptance Scenarios**:

1. **Given** a record lies outside a user's assigned territory, **When** an administrator grants that user an explicit record-level permission on the record, **Then** the user can view the record even though standard territory-based security would otherwise exclude it.
2. **Given** a record lies inside a user's assigned territory and role scope, **When** an administrator applies an explicit record-level restriction to that record for that user, **Then** the record no longer appears in the user's views, lists, search results, or exports.
3. **Given** a record-level permission grant or restriction is applied, **When** the change is saved, **Then** the system logs the acting administrator, the affected user or team, the record, the permission type (grant/restrict), and the timestamp.
4. **Given** an authorized administrator opens a record's permission detail, **When** they view its access configuration, **Then** they can see every explicit record-level grant and restriction currently applied to that record, not only the inherited role/territory defaults.

---

### User Story 3 - AI CRM Assistant Identifies the Pipeline's Biggest Bottleneck (Priority: P2)

A sales manager asks the AI CRM Assistant, in plain language, "Which pipeline stage has the biggest bottleneck?" and expects an answer grounded in actual stage-level pipeline data (time-in-stage, conversion rate, aging) scoped to the records the manager is permitted to see — not a generic or fabricated answer.

**Why this priority**: This is one of ten explicitly named example questions in the chapter's "AI CRM Assistant" section (§11) and is the clearest example, alongside User Story 4, of this chapter's specific contribution to the AI CRM Assistant's query surface beyond the scoring/forecasting mechanics already specified in features 013 and 045.

**Independent Test**: Can be fully tested by seeding a pipeline where one stage has unusually high average time-in-stage and low conversion rate, asking the AI CRM Assistant the bottleneck question, and confirming the answer names that specific stage and cites the supporting metric, using only data the requesting user's territory/record-level permissions allow.

**Acceptance Scenarios**:

1. **Given** a pipeline has stage-level metrics showing one stage with the longest average dwell time and lowest conversion rate, **When** a user asks "Which pipeline stage has the biggest bottleneck?", **Then** the AI CRM Assistant identifies that stage and displays the specific metric(s) that justify the answer.
2. **Given** the requesting user's territory-based and record-level permissions exclude some opportunities from view, **When** the bottleneck query runs, **Then** the answer is computed only from opportunities the user is permitted to see, and does not silently include organization-wide data the user cannot access.
3. **Given** no pipeline data meets a minimum sample size for a reliable bottleneck determination, **When** the query is asked, **Then** the Assistant states the data is insufficient rather than presenting a low-confidence answer as certain.
4. **Given** the bottleneck answer is displayed, **When** the user requests supporting detail, **Then** the Assistant does not change any opportunity's stage, status, or ownership as a side effect of answering.

---

### User Story 4 - AI CRM Assistant Identifies Which Campaigns Generated the Best Leads (Priority: P2)

A sales or marketing operations user asks the AI CRM Assistant "Which campaigns generated the best leads?" and expects an answer that traces back to actual lead-source and campaign-attribution data already captured on lead records, scoped to what the requesting user is permitted to see.

**Why this priority**: This is the second of the two named AI CRM Assistant questions the task calls out as distinctive (alongside the pipeline-bottleneck query, §11), and it is the clearest place in this chapter where the AI CRM Assistant's answer must draw on cross-referenced attribution data owned by feature 013 (lead-source attribution) and feature 045 (marketing attribution and revenue-by-lead-source), rather than a mechanic unique to this chapter.

**Independent Test**: Can be fully tested by seeding leads from multiple campaigns with differing conversion outcomes, asking the campaign-effectiveness question, and confirming the answer ranks campaigns using actual conversion/revenue attribution data rather than lead volume alone, scoped to the requesting user's permitted records.

**Acceptance Scenarios**:

1. **Given** leads from several campaigns have varying conversion rates and downstream revenue, **When** a user asks "Which campaigns generated the best leads?", **Then** the Assistant ranks campaigns using conversion and/or revenue attribution data, not raw lead count alone, and names the underlying metric used.
2. **Given** a requesting user's territory or record-level permissions exclude leads belonging to certain campaigns or territories, **When** the query runs, **Then** the ranking reflects only permitted data, and the Assistant does not report organization-wide figures to a territory-scoped user.
3. **Given** campaign attribution data originates from the marketing/lead-source systems owned by features 013 and 045, **When** the Assistant answers, **Then** it does not compute an independent, undocumented attribution model that conflicts with the attribution already recorded on the lead records.
4. **Given** the answer is displayed, **When** a manager reviews it, **Then** it is presented as an informational answer, not an automated reallocation of marketing budget or an automatic change to any campaign's status.

---

### User Story 5 - Explainable AI CRM Recommendation With Owner, Risk Level & Timeline (Priority: P2)

A sales operations lead reviews an AI-generated recommendation (e.g., "prioritize this at-risk opportunity") and needs to see not just the recommendation text but its business reason, supporting data, confidence score, expected revenue impact, risk level, suggested action, a responsible owner, and an estimated completion time — all before deciding whether to act on it.

**Why this priority**: The chapter defines a specific nine-field AI Recommendation object shape (§11 "AI Recommendations") that is not stated verbatim in either feature 013 or feature 045; while the underlying AI capabilities (lead scoring, churn prediction, coaching, etc.) are already specified elsewhere, this particular recommendation-object structure — especially "Expected Revenue Impact," "Risk Level," "Responsible Owner," and "Estimated Completion Time" — is this chapter's own addition and must remain strictly advisory per Constitution Article II.

**Independent Test**: Can be fully tested by triggering any AI CRM recommendation (e.g., an upsell suggestion) and confirming all nine required fields are present and populated before the recommendation is shown to a user, and confirming that assigning a "Responsible Owner" on the recommendation does not itself change the underlying record's owner.

**Acceptance Scenarios**:

1. **Given** the AI engine generates a recommendation of any type (upsell, churn-risk, coaching, next-best-action), **When** the recommendation is displayed, **Then** it shows Recommendation, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, and Estimated Completion Time.
2. **Given** a recommendation names a "Responsible Owner", **When** the recommendation is generated, **Then** the underlying record's actual owner field is unchanged until a human explicitly reassigns it through the standard ownership-change process.
3. **Given** a recommendation's Suggested Action would change record data if accepted, **When** a user views the recommendation, **Then** no data changes until the user explicitly accepts or actions the recommendation.
4. **Given** the AI service generating recommendations is unavailable, **When** a user would normally see a recommendation, **Then** the CRM continues to function using existing rule-based data (per Constitution Article II's non-AI fallback requirement) without blocking the user's core workflow.

---

### User Story 6 - CRM Governance Stack Enforced Consistently Across Territory, Record, and Compliance Layers (Priority: P3)

A compliance administrator needs assurance that Multi-Level Approvals, Digital Signatures, Encryption, Audit Logs, Data Privacy Controls, Duplicate Detection, and Compliance Monitoring — all named together with Territory-Based Security and Record-Level Permissions in the chapter's governance list (§12) — operate consistently with, and do not silently bypass, the territory and record-level access layers this chapter introduces.

**Why this priority**: This is P3 because each of these named mechanisms is already specified in operational depth by feature 013 (approvals, signatures, encryption, audit logs, privacy, duplicate detection) and feature 045 (deal approvals); this chapter's remaining contribution is confirming they compose correctly with the new territory/record-level layers rather than defining new mechanics.

**Independent Test**: Can be fully tested by routing an approval request for a record the approver cannot see under territory/record-level rules, and confirming the system either grants the approver temporary scoped visibility to review the request or blocks the approval with a clear reason — never silently approving a record the approver cannot inspect.

**Acceptance Scenarios**:

1. **Given** a multi-level approval (per feature 013 FR-158) is routed to an approver, **When** the approver lacks territory-based or record-level visibility into the underlying record, **Then** the system either grants scoped, logged, approval-purpose visibility or blocks the approval step with a clear reason — it does not silently proceed.
2. **Given** an audit log entry is generated for a territory- or record-level permission change, **When** an authorized compliance administrator reviews the audit log, **Then** the entry is present with the same fields (user, action, record, previous/new value, timestamp) already required by feature 013 FR-179.
3. **Given** duplicate detection (feature 013 FR-022) identifies a potential duplicate across two different territories, **When** the merge workflow runs, **Then** the merge respects both records' territory and record-level permission settings rather than exposing one territory's data to a user who only has access to the other.
4. **Given** Compliance Monitoring flags a record for review, **When** the flag is raised, **Then** it is visible only to users whose role, territory, and record-level permissions already entitle them to see the underlying record.

---

### Edge Cases

- What happens when a lead or account's address maps to two overlapping, independently configured territory definitions (e.g., a "Geographic" territory and an "Industry" territory both claim the same record)? The source names Territory-Based Security only as a bullet (§12) without defining overlap-resolution rules. [NEEDS CLARIFICATION: precedence between overlapping territory definitions is not specified]
- What happens when a record is visible to a user under territory-based security but an explicit record-level restriction has also been applied to that same user for that same record — does the more specific record-level restriction always win, or can a record-level grant override a territory exclusion but not the reverse? [NEEDS CLARIFICATION: source does not state layer precedence between territory-based security and record-level permissions]
- What happens when a user is reassigned from Territory A to Territory B mid-quarter while still the owner of open opportunities and active tickets tied to Territory A accounts — do those records' territory-based visibility follow the user, the account, or require an explicit ownership-transfer step (consistent with feature 013 FR-011's deactivation-transfer pattern)?
- What happens when an administrator grants a record-level permission to a user for a record outside that user's territory, and the record's territory is later reassigned — does the record-level grant persist across the territory change, or does it need to be re-applied?
- What happens when the AI CRM Assistant's pipeline-bottleneck query is asked by a user whose territory/record-level permissions only cover a small subset of the pipeline — does the Assistant clearly disclose that its answer is scoped to a partial dataset, or could a manager mistake a territory-scoped answer for an organization-wide one?
- What happens when the campaign-effectiveness query's underlying attribution data (owned by features 013/045) is incomplete or conflicting for a given campaign — does the AI CRM Assistant surface the gap/conflict explicitly, or silently pick one attribution source?
- What happens when Compliance Monitoring (§12) flags a record that role-based and territory-based rules both technically permit a user to access, but the record contains a regulated data category — does the compliance flag itself restrict visibility, or only alert an administrator after the fact?
- What happens when a multi-level approval routes a request to an approver who has no territory or record-level visibility into the record being approved (e.g., a cross-territory discount approval) — is the approver granted temporary scoped access, reassigned to a peer approver in-territory, or blocked outright?

## Requirements *(mandatory)*

### Territory-Based Security Requirements

- **FR-001**: System MUST support Territory-Based Security as a distinct CRM access-control layer restricting visibility of leads, accounts, contacts, and opportunities to users assigned to the record's territory, applied in addition to (not as a replacement for) role-based access control (§12). This layer enforces visibility on top of the territory *structure* (Geographic, Industry, Product, Enterprise Account, Partner, Language-Based, Strategic, Hybrid models) already defined by feature 045 (FR-082–086), which governs territory-based sales-coverage allocation rather than record visibility.
- **FR-002**: Territory-based visibility MUST implement the "View Territory" record-access level already named as one of feature 013's standard access levels (No Access, View Own, View Team, View Territory, View Department, View Organization, Create, Edit, Delete, Assign, Transfer, Export, Approve, Administer — FR-002); this chapter's distinctive contribution is the enforcement mechanics binding that access level to a record's actual territory assignment.
- **FR-003**: System MUST determine a CRM record's territory membership from the territory model (Geographic, Industry, Product, Language-Based, or Hybrid) already defined in feature 045, and MUST re-evaluate territory-based visibility whenever a record's territory-determining fields change or a territory's own definition is edited. [NEEDS CLARIFICATION: source (§12) names "Territory-Based Security" only as a bullet without specifying re-evaluation timing (real-time vs. batch) or precedence when a record's fields map to more than one configured territory]
- **FR-004**: A user granted territory-based visibility into a record MUST NOT automatically receive edit, delete, export, or assign rights over that record — territory-based security governs *visibility* only; the specific actions permitted continue to be governed by the user's role-based access level (feature 013 FR-001–002).
- **FR-005**: Where a user is a member of multiple territories, or is designated territory manager over multiple territories (per feature 045 FR-083), system MUST aggregate territory-based visibility across every territory the user is assigned to.

### Record-Level Permission Requirements

- **FR-006**: System MUST support Record-Level Permissions as a CRM security capability that grants or restricts access to an individual record independent of the user's role, territory, or field-level permissions (§12). This is distinct from feature 013's field-level RBAC (FR-003), which restricts visibility of specific *fields* on a record; record-level permissions restrict or grant access to the *record as a whole*.
- **FR-007**: Record-level permissions MUST support both an explicit grant (extending access to a record beyond what role/territory rules would otherwise provide to a named user or team) and an explicit restriction (excluding a named user or team from a record they would otherwise see under role/territory rules), and every such grant or restriction MUST be logged (user, record, permission type, granted/restricted-by, timestamp), consistent with the audit-logging requirements already defined in feature 013 FR-179. [NEEDS CLARIFICATION: source does not specify precedence when a record-level restriction conflicts with a broader territory or role-based grant — see Edge Cases]
- **FR-008**: System MUST make a record's active record-level permission state visible to authorized administrators directly on the record (every explicit grant and restriction currently applied and by whom), rather than only as an invisible backend rule.
- **FR-009**: Any AI request that references a CRM record — including AI CRM Assistant queries — MUST respect record-level permissions exactly as a direct user request would, consistent with feature 013 FR-133's requirement that AI requests "respect record-level permissions"; an AI response MUST NOT surface a record, field, or aggregate derived from a record excluded by the requesting user's record-level permissions.

### CRM Security & Governance Requirements (composition with existing mechanisms)

- **FR-010**: System MUST provide Role-Based Access Control as the CRM's foundational access-control layer (already fully specified by feature 013 FR-001–003), with Territory-Based Security (FR-001–005) and Record-Level Permissions (FR-006–009) as additive layers on top of it, per the chapter's governance list (§12).
- **FR-011**: System MUST support Multi-Level Approvals for CRM actions; the approval-chain mechanics are already specified by feature 013 (FR-158, FR-164–165) and feature 045's deal-approval workflow (FR-061–062). This chapter does not define additional approval mechanics but requires (per User Story 6) that approval routing compose correctly with territory-based and record-level visibility (§12).
- **FR-012**: System MUST support Digital Signatures for CRM documents (quotes, contracts), consistent with feature 013 FR-068 (§12).
- **FR-013**: System MUST apply Encryption to CRM data in transit and at rest, consistent with feature 013 FR-184 (§12).
- **FR-014**: System MUST maintain immutable Audit Logs of CRM security and data actions — including territory reassignment and record-level permission changes introduced by this chapter — using the same audit-entry structure already required by feature 013 FR-179 (§12).
- **FR-015**: System MUST provide Data Privacy Controls consistent with feature 013's consent and privacy requirements (FR-181–185) (§12).
- **FR-016**: System MUST perform Duplicate Detection before creating CRM records, consistent with feature 013 FR-022, and MUST apply territory- and record-level permission rules when presenting or merging duplicates that span territories (§12; see Edge Cases).
- **FR-017**: System MUST support Compliance Monitoring across CRM records and actions, consistent with the Constitution's Security & Compliance Baseline. [NEEDS CLARIFICATION: source (§12) names "Compliance Monitoring" only as a bullet with no further detail on which frameworks, monitored conditions, or reporting cadence apply specifically within the CRM]

### AI CRM Assistant Query Requirements

- **FR-018**: System MUST provide an AI CRM Assistant capable of answering natural-language operational questions, including at minimum the ten questions named in the chapter (§11): which leads should be contacted today, which opportunities are at risk, which customers may churn, what products should be upsold, which salesperson needs coaching, which pipeline stage has the biggest bottleneck, what is the expected revenue this quarter, which customers are most valuable, which campaigns generated the best leads, and how sales performance can be improved.
- **FR-019**: The AI CRM Assistant's pipeline-bottleneck query MUST derive its answer from stage-level pipeline metrics (time-in-stage, conversion rate, aging) already defined by feature 045's Pipeline Health Management (FR-068, FR-070) rather than introducing an independent, undocumented bottleneck-detection model.
- **FR-020**: The AI CRM Assistant's campaign-effectiveness query ("which campaigns generated the best leads") MUST derive its answer from lead-source and campaign-attribution data already captured under feature 013's lead-source-attribution requirements (FR-163) and feature 045's marketing-attribution and revenue-by-lead-source data (FR-018, FR-035).
- **FR-021**: Every AI CRM Assistant response MUST be scoped to only the records, fields, and aggregates the requesting user is permitted to see under role-based, territory-based, and record-level permissions combined — the Assistant MUST NOT act as a bypass of any of the three access layers.
- **FR-022**: AI CRM Assistant responses MUST remain advisory: answering a question (e.g., identifying at-risk opportunities or under-coached salespeople) MUST NOT itself change any record's status, ownership, or score (Constitution Article II; consistent with feature 013 FR-030 and feature 045 FR-070).

### AI CRM Intelligence & Recommendation Requirements

- **FR-023**: System MUST provide AI capabilities covering Lead Scoring, Opportunity Scoring, Customer Segmentation, Churn Prediction, Upsell Recommendations, Cross-Sell Recommendations, Sales Forecasting, Sentiment Analysis, Customer Health Prediction, Sales Coaching, Next Best Action, and Intelligent Workflow Automation (§11 "AI Capabilities"). These are already specified in operational depth by feature 013 (lead scoring FR-026–030, health score FR-084–088) and feature 045 (opportunity scoring FR-045, forecasting FR-072–076, coaching FR-091); this chapter re-states the capability list without adding new mechanics.
- **FR-024**: Every AI CRM Recommendation MUST include a Recommendation statement, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, and Estimated Completion Time (§11 "AI Recommendations"). This nine-field recommendation-object shape is this chapter's own addition, not stated verbatim in features 013 or 045, and every such recommendation MUST remain advisory, non-binding content until a human actions the Suggested Action (Constitution Article II).
- **FR-025**: An AI CRM Recommendation's assignment of a Responsible Owner MUST NOT itself reassign the underlying record's owner — the Responsible Owner field is a suggested actor only; any actual ownership change MUST go through the standard record ownership-change process already defined by feature 013 FR-020.

### Customer Lifecycle, Lead, Opportunity, Account, Success, Support, Forecasting & Analytics (chapter re-statement)

- **FR-026**: System MUST manage the customer lifecycle stages Visitor, Lead, MQL, SQL, Opportunity, Prospect, Customer, Active Customer, Loyal Customer, Premium Customer, Brand Advocate, Renewal, Upsell, Cross-Sell, Retention, Re-engagement, Churn, and Win-back (§2). This lifecycle maps onto the 15-stage Revenue Lifecycle already defined by feature 045 (FR-002) and the 12-step lead lifecycle already defined by feature 013 (FR-014); no new lifecycle mechanics are introduced by this chapter.
- **FR-027**: System MUST maintain the Customer Master Profile fields and Customer Segmentation factors listed in §2; these are subsets of the Account/Contact fields already specified by feature 013 (FR-031, FR-033) and feature 045 (FR-097).
- **FR-028**: System MUST support the lead capture, scoring, and workflow sequence (Capture → Qualification → Scoring → Assignment → Follow-Up → Meeting → Demo → Proposal → Opportunity Creation → Customer Conversion) described in §3; this is a shorter restatement of feature 013's lead-management requirements (FR-013–030) and introduces no new lead-management mechanics.
- **FR-029**: System MUST manage opportunities through the pipeline stages and Pipeline Dashboard described in §4; this restates the default pipeline and dashboard mechanics already defined by feature 013 (FR-039–044) and feature 045 (FR-046, FR-071).
- **FR-030**: System MUST provide the Sales Automation features and Sales Activities described in §5; already defined in depth by feature 013's Sales Activity (FR-051–060) and Workflow Automation (FR-151–160) requirements.
- **FR-031**: System MUST provide Account & Contact Management, including Relationship Mapping, as described in §6; already defined by feature 013 (FR-031–037) and feature 045 (FR-095–103).
- **FR-032**: System MUST provide Customer Success & Retention capabilities (Customer Health Score, Success Activities, Retention Dashboard) described in §7; already defined by feature 013 (FR-083–092).
- **FR-033**: System MUST integrate Customer Support (ticket history, SLA status, escalations, unified customer timeline) as described in §8; already defined by feature 013's Support Desk/SLA requirements (FR-093–117) and Unified Customer Timeline (FR-037).
- **FR-034**: System MUST provide AI-assisted Revenue Forecasting and a Revenue Dashboard as described in §9; already defined by feature 013 (FR-071–072) and feature 045's Sales Forecasting Platform (FR-072–076).
- **FR-035**: System MUST provide Sales Analytics (Executive KPIs and Reports, including Territory Performance reporting) described in §10; already defined by feature 013's Reporting & Analytics requirements (FR-161–170) and feature 045's Pipeline Intelligence Dashboard (FR-092–094). The Territory Performance report corresponds specifically to feature 045's territory-performance monitoring (FR-085).

### Integration Requirements

- **FR-036**: System MUST integrate the CRM Platform with Marketing Automation, Customer Support, Finance, ERP, HRMS, Procurement, Inventory, Subscription Management, Community Platform, LMS, Event Management, Payment Gateways, Email Services, Calendar Services, Notification Service, Business Intelligence, AI Platform, and API Gateway (§13). This integration list restates integration points already required by feature 013 (FR-186–193) and is not a new integration architecture.

### Key Entities *(include if feature involves data)*

- **Territory (Security Boundary)**: This chapter's usage of "territory" as a record-visibility enforcement boundary applied to leads, accounts, contacts, and opportunities. The territory's structural definition (model type, assignment rules, manager, performance metrics) is owned by feature 045's Territory entity; this feature adds the security-enforcement relationship between a territory and the records it gates.
- **Record-Level Permission**: An explicit grant or restriction entry binding a specific user or team to a specific CRM record, independent of that user's role or territory, carrying permission type (grant/restrict), granted/restricted-by, and timestamp; distinct from feature 013's Field-Level Restriction (which governs individual fields, not whole records).
- **AI CRM Recommendation**: A nine-field advisory object (Recommendation, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, Estimated Completion Time) attached to a CRM record but never itself mutating that record's state.
- **AI CRM Assistant Query**: A natural-language question posed by a user (from the ten named examples in §11 or others of the same shape) that is answered by aggregating existing CRM/RevOS data (feature 013/045 sources) filtered through the requesting user's combined role/territory/record-level permission scope.
- See feature 013 (`013-crm-sales-support`) for canonical Lead, Contact, Account, Opportunity, Pipeline, Ticket, SLA Policy, Customer Health Score, Renewal, Knowledge Article, Workflow Definition, and Audit Log Entry entities.
- See feature 045 (`045-enterprise-sales-revenue-intelligence`) for the canonical Territory (structural/coverage model), Revenue Lifecycle stage, Deal, Pipeline Health, and Strategic Account Plan entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of CRM record-visibility checks correctly combine role-based, territory-based, and record-level permission layers in automated multi-layer permission testing, with zero records visible to a user excluded by any one of the three layers.
- **SC-002**: 100% of record-level permission grants and restrictions are logged with acting user, affected user/team, record, permission type, and timestamp, and are retrievable in an administrator audit view.
- **SC-003**: The AI CRM Assistant answers all ten named example queries (§11), and in 100% of tested cases the response is scoped strictly to the requesting user's territory- and record-level-permitted records, with zero cross-territory or cross-record-permission data leakage observed in testing.
- **SC-004**: 100% of AI CRM Recommendations display all nine required fields (Recommendation, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, Estimated Completion Time) before being shown to a user.
- **SC-005**: Zero AI CRM Recommendations or AI CRM Assistant answers autonomously change a record's owner, status, or score without an explicit human action, verified under AI-guardrail testing (Constitution Article II).
- **SC-006**: 100% of territory reassignments (user moved between territories, or a record's territory-determining field changed) result in correctly updated territory-based visibility without requiring a manual cache-clear or administrator intervention step.
- **SC-007**: 100% of the 18 named enterprise integrations (§13) have a defined, testable data-exchange contract cross-referenced to their owning feature spec (013 or 045), with zero integrations left undocumented.
- **SC-008**: 100% of pipeline-bottleneck and campaign-effectiveness AI Assistant answers, in testing, trace back to an underlying metric already defined in feature 045 (pipeline health) or feature 013 (lead-source attribution) rather than an undocumented, independently computed figure.

## Assumptions

- Feature 013 (`013-crm-sales-support`) owns the canonical base CRM entities — Lead, Contact, Account, Opportunity, Pipeline, Quote, Contract, Ticket, SLA Policy, Knowledge Base, Workflow Automation, and field-level RBAC — and remains authoritative for their data models and mechanics. This feature does not redefine them.
- Feature 045 (`045-enterprise-sales-revenue-intelligence`) owns the enterprise Revenue Operating System (RevOS) layer — the 15-stage Revenue Lifecycle, multi-framework lead/opportunity qualification, Deal Management, Pipeline Health Management, Sales Forecasting Platform, Territory Management's *structural* model, Strategic Account Management, and the "AI recommends, human approves" governance pattern at RevOS scale. This feature does not redefine them.
- Per the Constitution's Development Workflow rules for Volume 14 Chapters 24–40 ("substantial internal redundancy... Specs for these features MUST cross-reference the overlapping feature(s) rather than duplicating requirements wholesale"), this feature (060) contributes ONLY: (1) Territory-Based Security as a record-visibility enforcement layer, (2) Record-Level Permissions as a record-scoped access-control layer distinct from field-level RBAC, and (3) the AI CRM Assistant's specific named query capabilities (particularly the pipeline-bottleneck and campaign-effectiveness questions) and the chapter's nine-field AI Recommendation object shape. All other chapter sections (Customer Lifecycle, Lead Management, Opportunity/Pipeline, Sales Automation, Account/Contact, Customer Success, Support Integration, Revenue Forecasting, Sales Analytics, and the Enterprise Integration list) are treated as restatements of features 013/045 and are cited rather than re-derived (FR-026–036).
- Multi-Level Approvals, Digital Signatures, Encryption, Audit Logs, Data Privacy Controls, and Duplicate Detection (named alongside Territory-Based Security and Record-Level Permissions in §12) are mechanically owned by feature 013 (and, for deal approvals, feature 045); this feature's contribution regarding them is limited to confirming they compose correctly with the new territory/record-level layers (User Story 6), not defining new mechanics.
- "Compliance Monitoring" (§12) is named only as a bullet with no further elaboration in the source chapter; it is assumed to reuse the Constitution's Security & Compliance Baseline (audit logging, named regulatory frameworks) rather than introducing a CRM-specific compliance engine, pending clarification.
- The chapter's AI CRM Assistant, AI Capabilities list, and AI Recommendations are feature-specific applications of the platform-wide AI Assistant defined in Volume 08, consistent with the same assumption already stated in feature 013's spec; underlying model routing, prompt architecture, and provider integration remain out of scope here.
- Several requirements are marked `[NEEDS CLARIFICATION]` (territory-overlap precedence, territory-vs-record-level-permission conflict precedence, territory re-evaluation timing, and the scope of "Compliance Monitoring") because the source names the control only as a bullet in §12 without further mechanics — consistent with the Constitution's instruction to flag rather than silently resolve such ambiguity.
