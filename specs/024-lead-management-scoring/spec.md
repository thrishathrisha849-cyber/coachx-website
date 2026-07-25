# Feature Specification: Lead Management, Qualification & Scoring

**Feature Branch**: `024-lead-management-scoring`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 (Marketing Automation Platform), Part 1, Chapter 11 of the TBT One Enterprise PRD — Lead Management, Lead Qualification & Lead Scoring System: lead lifecycle, lead sources, unified lead profile, lead status, qualification (MQL/SQL/PQL), lead assignment engine, 0-1000 point lead scoring with behavioral and negative scoring tables, AI lead scoring, segmentation, timeline, duplicate detection, nurturing, analytics dashboard, integrations, security, and performance targets. Source: `document 1/Document 1 (23).md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A Captured Lead Progresses Through the Standardized Lifecycle (Priority: P1)

A prospect who first appears anonymously as a website visitor submits a form and becomes a Lead. From that point, the lead moves through a standardized sequence of lifecycle stages — Lead Captured, Lead Validated, Lead Qualified, Lead Scored, Sales Assigned, Opportunity, Customer — with every stage transition timestamped and written to an audit log, so marketing and sales staff can always see exactly where a given lead stands and how it got there.

**Why this priority**: The lifecycle is the backbone every other capability in this chapter (scoring, qualification, assignment, nurturing, analytics) attaches to. Without a reliably tracked, auditable lifecycle, none of the downstream intelligence (score bands, MQL/SQL/PQL classification, assignment) has a trustworthy record to operate against. The source states this must be true for "every lead" (§3).

**Independent Test**: Can be fully tested by capturing a single lead from any configured source and manually driving it through each lifecycle stage (Captured → Validated → Qualified → Scored → Sales Assigned → Opportunity → Customer), then confirming the lead's audit trail shows a timestamped record for every transition with no gaps.

**Acceptance Scenarios**:

1. **Given** a website visitor submits a landing page form, **When** the submission is processed, **Then** the system creates a new Lead record in the "Lead Captured" stage and timestamps the transition from Visitor to Lead Captured.
2. **Given** a lead has passed validation (e.g., verified email/phone), **When** the system advances it to "Lead Validated", **Then** the transition, its timestamp, and the triggering event are written to the lead's audit log.
3. **Given** a lead has been qualified and scored, **When** it is handed to a sales owner, **Then** the lead's status advances to "Sales Assigned" and, if converted, to "Opportunity" and then "Customer", with each stage change auditable and viewable in order.
4. **Given** an administrator opens a lead's history, **When** they view the audit log, **Then** every lifecycle transition the lead has ever undergone is listed in chronological order with a timestamp, distinct from the general activity timeline.

---

### User Story 2 - A Numeric Lead Score Updates When a Scored Behavior Occurs (Priority: P1)

A lead visits the pricing page, downloads an ebook, and later requests a demo. Each of these actions is a scored behavior with a defined point value in the platform's activity point table. As each behavior occurs, the system adds the corresponding points to the lead's 0–1000 score in near real time, and the lead's score-band classification (Cold / Warm / Qualified / Hot / Sales Ready) updates automatically as the cumulative score crosses a threshold.

**Why this priority**: Numeric scoring is the mechanism that makes "prioritize high-value opportunities" (§2) operational — without it, every other prioritization capability (qualification, assignment, nurturing exit conditions, dashboard "Average Lead Score" metric) has nothing to act on. The point table is stated explicitly and in detail (§9–§10).

**Independent Test**: Can be fully tested by triggering a single scored behavior (e.g., a Demo Request, +80) on a lead with a known starting score and confirming the new score equals the prior score plus 80, and that the score-band classification updates if the new total crosses a band boundary (e.g., 399 → 400 moves Warm Lead to Qualified Lead).

**Acceptance Scenarios**:

1. **Given** a lead currently has a score of 0, **When** the lead visits the website (Website Visit, +5) and then views a landing page (Landing Page Visit, +10), **Then** the lead's score becomes 15.
2. **Given** a lead has a score of 395 (Warm Lead band), **When** the lead downloads an ebook (+25), **Then** the score becomes 420 and the lead's classification changes from "Warm Lead" to "Qualified Lead".
3. **Given** an administrator has customized the point table (e.g., changed Webinar Registration from +40 to +60), **When** a lead registers for a webinar after the change, **Then** the lead receives +60, not the original +40.
4. **Given** a lead completes a Purchase (+100), **When** the score is recalculated, **Then** the updated score and band are reflected on the lead record within the platform's lead-score-calculation performance target.

---

### User Story 3 - Negative Scoring Applies When a Lead's Quality Degrades (Priority: P1)

A lead who previously engaged well marks a marketing email as spam. The system immediately applies the configured negative point value for a Spam Complaint (-100) to that lead's score, reducing its total and potentially moving it down a score band — the same real-time mechanism applies to bounces, unsubscribes, prolonged inactivity, invalid contact details, and detected duplicates.

**Why this priority**: Negative scoring is what keeps the 0–1000 score trustworthy as a prioritization signal — without it, a lead who has disengaged or gone bad would remain artificially "hot" from stale historical points. The source calls this out as its own numbered section with its own point table and an explicit real-time requirement (§11).

**Independent Test**: Can be fully tested by taking a lead with a known score, triggering a single negative-scoring event (e.g., Unsubscribe, -50), and confirming the score decreases by exactly 50 immediately, independent of any other scoring activity in progress.

**Acceptance Scenarios**:

1. **Given** a lead has a score of 320, **When** an outbound email to that lead bounces (Email Bounce, -40), **Then** the lead's score becomes 280.
2. **Given** a lead has a score of 150, **When** the lead marks an email as spam (Spam Complaint, -100), **Then** the lead's score becomes 50 and its classification remains or moves to the appropriate lower band.
3. **Given** a lead has shown no activity for 90 days, **When** the inactivity threshold is evaluated, **Then** the system applies the Inactive 90 Days penalty (-60) to the lead's score.
4. **Given** a duplicate lead is confirmed against an existing record, **When** the duplicate is identified, **Then** the Duplicate Lead penalty (-30) is applied and the negative adjustment is reflected in the score without delay.

---

### User Story 4 - A Lead Is Classified as MQL, SQL, or PQL (Priority: P1)

As a lead accumulates specific engagement signals, the system classifies it against the platform's three qualification categories: Marketing Qualified Lead (MQL) when it shows marketing engagement such as an ebook download or webinar registration; Sales Qualified Lead (SQL) when it shows direct sales intent such as a demo or pricing request; and Product Qualified Lead (PQL) when the prospect has already experienced the product through a free trial, freemium usage, or by crossing a usage threshold.

**Why this priority**: Qualification is what turns a raw score into an actionable sales/marketing decision — it is the layer between "a lead has points" and "a lead is ready to be assigned/nurtured/handed to sales" (§7). It directly feeds the Lead Assignment Engine and the Analytics Dashboard's "Sales Qualified Leads" metric.

**Independent Test**: Can be fully tested by giving a lead one of the qualifying example behaviors for each category (e.g., webinar registration for MQL, demo request for SQL, free trial signup for PQL) and confirming the system reflects the corresponding qualification classification on the lead record.

**Acceptance Scenarios**:

1. **Given** a lead downloads an ebook and registers for a webinar, **When** qualification is evaluated, **Then** the lead is classified as a Marketing Qualified Lead (MQL).
2. **Given** a lead requests a demo and asks for a proposal, **When** qualification is evaluated, **Then** the lead is classified as a Sales Qualified Lead (SQL).
3. **Given** a lead signs up for a free trial and crosses the configured product usage threshold, **When** qualification is evaluated, **Then** the lead is classified as a Product Qualified Lead (PQL).
4. **Given** a lead has an invalid email, no verified phone, and no budget/interest signals recorded, **When** qualification is evaluated against the qualification factors (valid email, verified phone, organization size, budget, interest level, purchase intent, geographic eligibility, product fit, engagement history), **Then** the lead does not receive an MQL, SQL, or PQL classification.

---

### User Story 5 - AI Predictive Conversion Score Augments Rule-Based Scoring (Priority: P2)

Alongside the rule-based 0–1000 point score, the AI engine continuously analyzes each lead's buying intent, engagement trends, historical conversions, customer similarity, revenue potential, churn probability, preferred products, and communication preferences to generate a Predictive Conversion Score, a Revenue Prediction, a Purchase Probability, and a Recommended Next Action — additional, advisory intelligence layered on top of the deterministic point-table score, never replacing it or acting on its own.

**Why this priority**: AI scoring is explicitly named as a distinct capability that supports, rather than replaces, the rule-based system (§12), and directly implements Constitution Article II ("AI Is Assistive, Never Autonomous") — every AI output here must remain advisory, server-side, and paired with a working non-AI fallback (the rule-based score), so it is P2 rather than P1: the platform is fully usable for lead prioritization on rule-based scoring alone.

**Independent Test**: Can be fully tested by running AI scoring on a lead with a known behavioral history and confirming the system produces all four outputs (Predictive Conversion Score, Revenue Prediction, Purchase Probability, Recommended Next Action) without altering the lead's rule-based 0–1000 score, and by disabling/failing the AI call and confirming the rule-based score and qualification remain fully functional.

**Acceptance Scenarios**:

1. **Given** a lead has an established behavioral and purchase history, **When** AI lead scoring runs, **Then** the system produces a Predictive Conversion Score, a Revenue Prediction, a Purchase Probability, and a Recommended Next Action, displayed alongside (not merged into) the rule-based 0–1000 score.
2. **Given** the AI scoring service is unavailable or fails, **When** a scored behavior occurs on a lead, **Then** the rule-based score and band classification still update correctly using the point table alone.
3. **Given** AI scoring identifies high churn probability on an otherwise "Hot Lead", **When** the recommendation is generated, **Then** the system surfaces it as a recommendation for human sales/marketing review rather than automatically changing the lead's status, score band, or qualification.
4. **Given** AI scoring runs on a batch of leads, **When** the AI Scoring Update completes, **Then** each affected lead's AI outputs are refreshed within the platform's AI-scoring performance target.

---

### User Story 6 - Automated Lead Assignment by Round-Robin, Territory, or AI (Priority: P2)

Once a lead is qualified and scored, the Lead Assignment Engine automatically routes it to a sales owner using a configured strategy — Round Robin, Territory-Based, Product-Based, Department-Based, Language-Based, Country-Based, AI Recommendation, or Manual Assignment — and fires an assignment notification immediately so the receiving owner can act on the lead without delay.

**Why this priority**: Assignment is the hand-off point between marketing intelligence and sales execution; the source calls out multiple strategies and an explicit "trigger notifications immediately" requirement (§8). It is P2 because leads can still be scored, qualified, and manually assigned even before the automated routing strategies are fully configured.

**Independent Test**: Can be fully tested by configuring Round Robin assignment across a pool of sales users, generating a qualified lead, and confirming it is auto-assigned to the next eligible user in rotation with an assignment notification delivered immediately, then repeating with a Territory-Based rule and confirming routing follows territory instead.

**Acceptance Scenarios**:

1. **Given** Round Robin assignment is active for a sales team, **When** a new qualified lead arrives, **Then** the system assigns it to the next eligible sales user in rotation and immediately triggers an assignment notification.
2. **Given** Territory-Based assignment is configured by country/state, **When** a lead with a matching location is qualified, **Then** the system assigns the lead to the sales user or team mapped to that territory.
3. **Given** AI Recommendation assignment is enabled, **When** a lead is scored and qualified, **Then** the system routes it based on the AI's recommendation rather than a fixed rotation or territory rule.
4. **Given** an administrator manually assigns a lead, **When** the manual assignment is saved, **Then** the system records the assignment, updates the lead owner, and triggers the same immediate notification as an automated assignment.

---

### User Story 7 - Duplicate Lead Detection and Resolution (Priority: P3)

The same prospect submits a contact form on the website and later re-enters through a partner referral link using the same email address. The system automatically detects the duplicate by matching identifying fields, applies the configured negative "Duplicate Lead" score penalty, and presents the record to an administrator who can merge, keep both, delete, or manually review the duplicate rather than letting two disconnected records for the same prospect persist.

**Why this priority**: Duplicate elimination is named as a core objective (§2) and given its own detection and resolution section (§15), but it is a data-quality safeguard layered on top of an already-functioning capture/scoring/assignment flow, so it is appropriately P3 relative to the core scoring and qualification loops.

**Independent Test**: Can be fully tested by creating two lead submissions that share the same email address (or phone number, customer ID, or company name) through two different sources, and confirming the system flags them as a duplicate pair, applies the Duplicate Lead score penalty, and offers merge/keep-both/delete/manual-review resolution options to an administrator.

**Acceptance Scenarios**:

1. **Given** a lead already exists with a given email address, **When** a new submission arrives with the same email address, **Then** the system flags the new submission as a probable duplicate of the existing lead.
2. **Given** two lead records are flagged as duplicates, **When** an administrator reviews them, **Then** the administrator can choose to merge the leads, keep both as separate records, delete one, or defer the decision for further manual review.
3. **Given** a duplicate match is confirmed, **When** the match is recorded, **Then** the Duplicate Lead score penalty (-30) is applied to the appropriate lead record.
4. **Given** duplicate matching criteria include Government ID, **When** an organization has not collected Government ID for a given lead, **Then** duplicate detection still runs using the remaining available criteria (email, phone, customer ID, company name) without requiring the optional field.

---

### Edge Cases

- What happens when a lead repeatedly performs the same low-value scored behavior (e.g., revisiting the website dozens of times in a day) — does the score keep incrementing without limit, or is there a cap/diminishing-return rule preventing artificial score inflation from a single repeated action? [NEEDS CLARIFICATION: source lists a flat point value per activity (§10) with no stated frequency cap or cooldown.]
- What happens when a lead's cumulative negative scoring (bounces, spam complaints, inactivity) would drive the score below 0 — does the score floor at 0, or can it go negative? [NEEDS CLARIFICATION: §11 states point values but not a floor.]
- What happens when a Round Robin or Territory-Based assignment rule has no eligible/available sales user (e.g., entire mapped team is offline or the territory has no assigned owner)? The source specifies assignment strategies (§8) but not a fallback-owner or queueing behavior for this case.
- What happens when a lead score oscillates across a band boundary multiple times in quick succession (e.g., a Demo Request pushes a lead into "Hot Lead" and an immediate Email Bounce drops it back to "Qualified Lead")? Does each band crossing re-trigger assignment/nurturing entry/exit logic, or only the lead's final settled state?
- How does the system handle a lead that has been inactive long enough to accrue the "Inactive 90 Days" (-60) penalty and then suddenly re-engages (e.g., opens a demo request) — is the negative event reversed, does it simply get outweighed by new positive points, and does the lead re-enter nurturing/assignment as if newly qualified?
- What happens when the same prospect is captured as a duplicate across three or more sources nearly simultaneously (e.g., a bulk CSV import runs while the same person also submits a web form) — does duplicate detection process pairwise matches correctly, or can duplicates of duplicates be created? (§15 describes matching criteria and resolution actions but not a batch/near-simultaneous scenario.)
- What happens when a lead simultaneously satisfies MQL, SQL, and PQL criteria (e.g., a freemium user who also requests a demo and downloads an ebook)? The source does not state whether these categories are mutually exclusive or a lead can carry multiple qualification classifications at once. [NEEDS CLARIFICATION]
- What happens when the AI-generated Predictive Conversion Score materially disagrees with the rule-based score/band (e.g., AI predicts low purchase probability for a lead in the "Sales Ready" 900–1000 band)? The source does not specify a reconciliation or override rule between the two, only that AI outputs are generated alongside the rule-based score (§12; Constitution Article II requires the rule-based/deterministic result to remain authoritative and the AI output to stay advisory).
- What happens when a lead marked "Invalid Contact" (-80 penalty) is simultaneously due for automated assignment — does the assignment engine skip routing a lead with no usable contact method, or does it get assigned and then immediately stall in the sales queue?

## Requirements *(mandatory)*

### Lead Lifecycle

- **FR-001**: System MUST provide a complete lead lifecycle from initial capture through customer conversion, integrating with the CRM, Customer Data Platform (CDP), Workflow Engine, AI Assistant, Campaign Manager, and Analytics Platform (§1).
- **FR-002**: System MUST implement the standardized lead lifecycle stages, in order: Visitor → Lead Captured → Lead Validated → Lead Qualified → Lead Scored → Sales Assigned → Opportunity → Customer (§3).
- **FR-003**: System MUST record every lifecycle stage transition with a timestamp and an audit log entry (§3).
- **FR-004**: System MUST centralize all lead information captured from every source into a single unified lead profile (§2, §5).

### Lead Capture & Sources

- **FR-005**: System MUST capture leads from Website sources: landing pages, contact forms, newsletter signup, and consultation requests (§4).
- **FR-006**: System MUST capture leads from Marketing Campaigns: email campaigns, SMS campaigns, WhatsApp campaigns, and push notifications (§4).
- **FR-007**: System MUST capture leads from Social Media sources: Facebook Ads, Instagram Ads, LinkedIn Campaigns, YouTube Campaigns, and X (Twitter) (§4).
- **FR-008**: System MUST capture leads from External Platforms: Google Ads, third-party APIs, partner portals, affiliate systems, referral programs, and QR codes (§4).
- **FR-009**: System MUST capture leads from Manual Sources: sales team entry, event registration, offline campaigns, and CSV/Excel imports (§4).

### Lead Profile

- **FR-010**: Each lead record MUST maintain Identity Information: Lead ID, full name, email, phone number, company, job title, website, country, state, city, and preferred language (§5).
- **FR-011**: Each lead record MUST maintain Marketing Information: source campaign, acquisition channel, UTM parameters, landing page, referral source, and marketing tags (§5).
- **FR-012**: Each lead record MUST maintain Behavioral Information: website visits, page views, downloads, videos watched, podcast listening, ebook activity, community participation, email opens, email clicks, and push notification clicks (§5).
- **FR-013**: Each lead record MUST maintain Commercial Information: products viewed, purchases, wallet balance, membership plan, coupons used, and revenue generated (§5).

### Lead Status Management

- **FR-014**: System MUST support the lead statuses New, Contacted, Interested, Qualified, Proposal Sent, Negotiation, Converted, Lost, Duplicate, Disqualified, and Archived (§6).
- **FR-015**: A lead status change MUST automatically update associated workflow automation (§6).

### Qualification Types

- **FR-016**: System MUST evaluate lead qualification against valid email, verified phone number, organization size, budget, interest level, purchase intent, geographic eligibility, product fit, and engagement history (§7).
- **FR-017**: System MUST classify a lead as a Marketing Qualified Lead (MQL) when it shows marketing engagement, for example: ebook download, webinar registration, multiple email opens, or advertisement clicks (§7).
- **FR-018**: System MUST classify a lead as a Sales Qualified Lead (SQL) when it is ready for direct sales engagement, for example: demo request, pricing request, booked consultation, or proposal request (§7).
- **FR-019**: System MUST classify a lead as a Product Qualified Lead (PQL) when the prospect has experienced the product before purchasing, for example: free trial usage, freemium usage, or crossing a product usage threshold (§7).
- **FR-020**: System MUST automatically qualify prospects against the configured qualification factors without requiring manual review of every lead (§2, §7).

### Lead Assignment & Routing

- **FR-021**: System MUST automatically distribute leads to sales owners via a Lead Assignment Engine (§8).
- **FR-022**: System MUST support assignment strategies: Round Robin, Territory-Based, Product-Based, Department-Based, Language-Based, Country-Based, AI Recommendation, and Manual Assignment (§8).
- **FR-023**: Every lead assignment MUST trigger a notification immediately (§8).

### Scoring Rules & Point Table

- **FR-024**: System MUST maintain a numerical lead score for every lead on a 0–1000 scale (§9).
- **FR-025**: System MUST classify each lead's score into the bands: 0–199 Cold Lead, 200–399 Warm Lead, 400–699 Qualified Lead, 700–899 Hot Lead, 900–1000 Sales Ready (§9).
- **FR-026**: System MUST recalculate and update a lead's score dynamically whenever a scoring-relevant customer behavior occurs (§9).
- **FR-027**: System MUST award behavioral scoring points according to the configured activity point table: Website Visit +5, Landing Page Visit +10, Ebook Download +25, Podcast Completion +20, Webinar Registration +40, Demo Request +80, Pricing Page Visit +50, Email Open +5, Email Click +15, Purchase +100 (§10).
- **FR-028**: System MUST allow administrators to customize scoring rules and point values (§10).

### Negative Scoring

- **FR-029**: System MUST reduce a lead's score for quality-degrading behaviors according to the configured negative point table: Email Bounce -40, Unsubscribe -50, Spam Complaint -100, Inactive 90 Days -60, Invalid Contact -80, Duplicate Lead -30 (§11).
- **FR-030**: Negative scoring adjustments MUST be applied and reflected in the lead's score in real time (§11).

### AI Predictive Scoring

- **FR-031**: System MUST continuously evaluate, via AI, each lead's buying intent, engagement trends, historical conversions, customer similarity, revenue potential, churn probability, preferred products, and communication preferences (§12).
- **FR-032**: System MUST generate an AI Predictive Conversion Score for each evaluated lead (§12).
- **FR-033**: System MUST generate an AI Revenue Prediction for each evaluated lead (§12).
- **FR-034**: System MUST generate an AI Purchase Probability for each evaluated lead (§12).
- **FR-035**: System MUST generate an AI Recommended Next Action for each evaluated lead (§12).
- **FR-036**: AI-generated scores, predictions, and recommendations MUST remain advisory alongside the rule-based 0–1000 score and MUST NOT autonomously change a lead's status, qualification, or assignment without human/role-gated review; the rule-based scoring system MUST continue to function as a deterministic fallback whenever AI scoring fails or is unavailable (§12; Constitution Article II).

### Lead Segmentation

- **FR-037**: System MUST support assigning a lead to one or more simultaneous segments, including at minimum New Leads, Returning Leads, Premium Prospects, Enterprise Customers, Students, Business Owners, High Intent, Low Engagement, Referral Leads, and VIP Prospects (§13).
- **FR-038**: Lead segment membership MUST update automatically based on customer behavior (§13).

### Lead Timeline

- **FR-039**: System MUST maintain a chronological activity timeline per lead including registration, emails sent, emails opened, SMS delivered, WhatsApp messages, website visits, downloads, purchases, support tickets, AI conversations, and community activity (§14).
- **FR-040**: Every lead timeline event MUST be timestamped (§14).

### Duplicate Detection

- **FR-041**: System MUST automatically identify duplicate leads by matching Email Address, Phone Number, Customer ID, Company Name, and, where collected, Government ID (§15).
- **FR-042**: System MUST allow administrators to resolve a detected duplicate by merging the leads, keeping both, deleting the duplicate, or routing it to manual review (§15).
- **FR-043**: System MUST eliminate duplicate leads as an ongoing platform objective, applying duplicate detection and the Duplicate Lead negative-scoring penalty consistently across all capture sources (§2, §11, §15).

### Lead Nurturing

- **FR-044**: Qualified leads MUST automatically enter nurturing campaigns comprising content such as educational emails, webinar invitations, ebook recommendations, product comparisons, customer success stories, and AI-generated follow-ups (§16).
- **FR-045**: A lead nurturing campaign MUST continue until the lead converts, is disqualified, or is manually removed from the campaign (§16).

### Lead Analytics Dashboard

- **FR-046**: System MUST provide a Lead Analytics Dashboard displaying total leads, new leads, qualified leads, sales qualified leads, converted leads, lost leads, average lead score, lead sources, conversion funnel, revenue by source, sales performance, and lead aging (§17).
- **FR-047**: Dashboard reports MUST support drill-down analysis and scheduled exports (§17).

### Integration Framework

- **FR-048**: Lead data MUST synchronize with the Customer Data Platform (CDP), CRM, Email Marketing, SMS Marketing, WhatsApp Marketing, Workflow Engine, AI Assistant, Support System, Membership Module, Referral Module, Analytics Platform, and External APIs (§18).
- **FR-049**: Lead data synchronization across integrated systems MUST occur in near real time (§18).

### Security

- **FR-050**: Lead information MUST be protected using Role-Based Access Control (RBAC), encryption at rest, encryption in transit, audit logs, permission policies, IP restrictions, API authentication, sensitive data masking, and data retention policies (§19).
- **FR-051**: Only authorized users MAY create or modify lead records (§19).

### Performance

- **FR-052**: Lead creation MUST complete in under 2 seconds (§20).
- **FR-053**: Lead score calculation MUST complete in under 500 milliseconds (§20).
- **FR-054**: Duplicate detection MUST complete in under 1 second (§20).
- **FR-055**: Lead assignment MUST complete in under 2 seconds (§20).
- **FR-056**: Lead Analytics Dashboard refresh MUST complete in under 2 seconds (§20).
- **FR-057**: AI scoring updates MUST complete in under 5 seconds (§20).

### Key Entities *(include if feature involves data)*

- **Lead**: The unified record for a prospect, from the moment of capture through conversion. Holds Identity, Marketing, Behavioral, and Commercial information (§5), current lifecycle stage, current status (New/Contacted/.../Archived), current qualification classification(s), current score and band, current owner/assignment, source, and segment memberships. Related to: Lead Score, Score Event (history), Qualification Status, Assignment Rule/Record, Lead Segment, Lead Timeline Event, Duplicate Match, Nurturing Campaign Enrollment, and — downstream — the Opportunity/Customer records owned by feature 013 (crm-sales-support).
- **Lead Score**: The lead's current cumulative numeric value on the 0–1000 scale and its derived band classification (Cold / Warm / Qualified / Hot / Sales Ready). Recalculated whenever a Score Event occurs; drives assignment eligibility, nurturing entry/exit, and dashboard aggregates.
- **Score Event**: A single point-awarding or point-deducting occurrence tied to a specific behavioral or negative-scoring activity (e.g., "Demo Request +80", "Spam Complaint -100"), the point value applied (administrator-configurable), a timestamp, and the lead it applies to. The Lead Score is the running total of a lead's Score Events.
- **Qualification Status**: A lead's classification against the MQL / SQL / PQL categories, each tied to the specific qualifying factor(s)/example behavior(s) that produced it (§7). A lead may be evaluated against all three categories.
- **Lead Status**: The lead's current position in the supported status list (New, Contacted, Interested, Qualified, Proposal Sent, Negotiation, Converted, Lost, Duplicate, Disqualified, Archived), distinct from lifecycle stage; status changes drive workflow automation (§6).
- **Lead Source**: The originating channel/campaign that produced the lead (Website, Marketing Campaign, Social Media, External Platform, or Manual Source subtype), carrying UTM parameters, campaign, landing page, and referral attribution (§4–§5).
- **Assignment Rule**: An administrator-configured routing definition specifying an assignment strategy (Round Robin, Territory-Based, Product-Based, Department-Based, Language-Based, Country-Based, AI Recommendation, Manual) and its scope/eligibility. Produces an Assignment Record (owner, team, timestamp, triggering rule) each time a lead is routed (§8).
- **Lead Segment**: A named grouping (e.g., High Intent, VIP Prospects) a lead can belong to simultaneously with others; membership is behavior-driven and auto-updating (§13).
- **Lead Timeline Event**: A single timestamped entry in a lead's chronological activity history (registration, email sent/opened, SMS, WhatsApp, website visit, download, purchase, support ticket, AI conversation, community activity) (§14).
- **Duplicate Match**: A detected pairing/grouping of lead records sharing matching identity fields (email, phone, customer ID, company name, optional government ID), along with its resolution state (merged, kept-both, deleted, pending manual review) (§15).
- **AI Score Insight**: The AI-generated advisory outputs for a lead — Predictive Conversion Score, Revenue Prediction, Purchase Probability, and Recommended Next Action — kept distinct from, and never overwriting, the rule-based Lead Score (§12; Constitution Article II).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of lead lifecycle stage transitions (Visitor → Lead Captured → Lead Validated → Lead Qualified → Lead Scored → Sales Assigned → Opportunity → Customer) are recorded with a timestamp and retrievable from the audit log, with zero unrecorded transitions.
- **SC-002**: A lead's score and band classification reflect a newly-occurred scored behavior within 500 milliseconds of the triggering event, in line with the stated Lead Score Calculation performance target (§20).
- **SC-003**: A new lead record becomes available in the system within 2 seconds of capture, regardless of source (§20).
- **SC-004**: Duplicate leads sharing email, phone, customer ID, or company name are automatically flagged within 1 second of the second record's creation (§20).
- **SC-005**: A newly qualified lead is routed to an owner under the configured assignment strategy and the owner receives an assignment notification within 2 seconds of qualification (§20).
- **SC-006**: AI Predictive Conversion Score, Revenue Prediction, Purchase Probability, and Recommended Next Action are generated or refreshed for a scored lead within 5 seconds, without altering the lead's rule-based 0–1000 score (§20; Constitution Article II).
- **SC-007**: The Lead Analytics Dashboard (total leads, new leads, qualified leads, SQLs, converted, lost, average score, sources, funnel, revenue by source, sales performance, lead aging) refreshes within 2 seconds and every listed metric supports drill-down and scheduled export (§17, §20).
- **SC-008**: 100% of leads in the 900–1000 "Sales Ready" band have a current assignment owner, a qualification classification, and a populated activity timeline visible to that owner.
- **SC-009**: Marketing and sales teams observe measurably improved lead prioritization and reduced response time as automated qualification, scoring, and assignment replace manual triage [NEEDS CLARIFICATION: the source states "Improve sales productivity," "Reduce response time," and "Increase conversion rates" as objectives (§2) without numeric targets or baselines — exact percentage/time targets are not defined in this chapter].

## Assumptions

- This feature (024-lead-management-scoring) owns lead capture, validation, qualification (MQL/SQL/PQL), scoring (rule-based and AI-predictive), segmentation, nurturing, and assignment. Once a lead reaches "Sales Assigned" and converts into an Opportunity, downstream sales-pipeline execution (Opportunity stages, quotations, contracts, closed-won/closed-lost handling) is assumed to be owned by feature 013 (crm-sales-support), consistent with the lifecycle diagram in §3 ending at "Opportunity → Customer" without defining opportunity-stage mechanics.
- **Known cross-chapter overlap** (flagged per the constitution's Development Workflow guidance rather than silently resolved): feature 013 (crm-sales-support, sourced from Volume 13) independently defines its own lead capture, duplicate detection, and a 0–100 rule-based/AI-assisted lead scoring system with Cold/Warm/Hot/Sales Ready bands, while this chapter (Volume 14 Part 1 Chapter 11) defines a 0–1000 scale with five bands (Cold/Warm/Qualified/Hot/Sales Ready) for the same underlying concept. [NEEDS CLARIFICATION: the source PRD does not state whether these are (a) the same lead score presented/derived at two different scales, (b) two intentionally separate scoring systems for a marketing-side lead pool versus a CRM-side lead pool, or (c) a drafting duplication where Volume 14 Ch.11 supersedes or feeds into Volume 13's CRM scoring. This spec treats the 0–1000 scale and its five bands as this feature's authoritative model, per its explicit source table (§9), and assumes reconciliation with the 013 0–100 scale is a downstream integration/mapping concern.]
- Administrators (assumed to be Marketing Operations / RevOps-level roles, consistent with role structures described elsewhere in Volume 14) configure the behavioral point table, negative-scoring point table, qualification factor thresholds, segment rules, and assignment-rule definitions; this chapter does not itself name a specific role.
- A lead may hold more than one qualification classification at the same time (e.g., both PQL and SQL), since the source does not state MQL/SQL/PQL are mutually exclusive. [NEEDS CLARIFICATION]
- The lead score is assumed not to fall below 0 (floor at 0) in the absence of a stated floor or ceiling-below-zero rule; this is a reasonable-default assumption, not a stated requirement. [NEEDS CLARIFICATION]
- Repeated occurrences of the same low-point scored behavior (e.g., many Website Visits in a short period) are each assumed to award points independently with no stated cap, cooldown, or diminishing-returns rule, since none is specified in §10.
- "AI Recommendation" lead assignment and the AI Predictive Conversion Score/Revenue Prediction/Purchase Probability/Recommended Next Action are assumed to be produced by the same TBT AI Assistant integration named in §1 and §18, rather than a separate scoring service, since the source does not name a distinct system.
- Government ID is treated strictly as an optional duplicate-matching field, used only where an organization has lawfully collected it, per its explicit "(Optional)" marking in §15.
