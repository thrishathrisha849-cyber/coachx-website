# Feature Specification: Marketing Analytics, Attribution Modeling & Executive Intelligence

**Feature Branch**: `027-marketing-analytics-attribution`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 — Part 1 — Chapter 14: Marketing Analytics, Attribution Modeling & Executive Intelligence Dashboard. Source: `document 1/Document 1 (26).md`. Centralized intelligence layer collecting marketing, customer, engagement, sales and revenue data from every connected TBT module; transforms it into real-time dashboards, campaign/channel/funnel/journey analytics, multi-touch attribution, revenue/ROI measurement, cohort/retention/CLV analytics, executive and role-specific dashboards, AI-generated insights and forecasts, anomaly detection, custom reporting, data governance, and enterprise-scale performance/security requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardized Event Flows Through the Tracking Framework (Priority: P1)

A customer clicks a link in a WhatsApp campaign, lands on a page, and later completes a purchase. Every one of these interactions — from every connected TBT module and every marketing channel — must be captured as a structured, standardized event record containing enough identity, campaign, device, and consent context that it can later be joined into a customer journey, an attribution calculation, and a dashboard metric, without any module inventing its own ad-hoc event shape.

**Why this priority**: This is the foundation everything else in the chapter is built on. Campaign analytics, funnel analytics, journey analytics, attribution, and every dashboard depend entirely on events being captured completely and consistently at ingestion. Without it, nothing downstream can be trusted (§7, §66 Dependencies list "Event tracking framework" first).

**Independent Test**: Can be fully tested by triggering a known event (e.g., "form submitted") from a source module and confirming a single event record is produced containing event ID, event name/category, customer ID or anonymous visitor ID, session ID, campaign/channel/content IDs, source/medium/campaign name, referral and landing page URLs, timestamp, customer time zone, device/browser/OS, geographic info, event properties, consent status, data source, and processing status — and that this record is visible in the data pipeline within the real-time visibility target.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor clicks a tracked campaign link, **When** the click is registered, **Then** the system creates an event record with event category "Link clicked", an anonymous visitor ID, campaign ID, channel ID, source/medium/campaign name, referral URL, landing page URL, timestamp, device/browser/OS, and consent status, and marks the processing status as pending or processed.
2. **Given** a known, logged-in customer completes a purchase, **When** the "Purchase completed" event fires, **Then** the event record links to the customer ID (not just an anonymous ID), captures the associated campaign/channel/content IDs where available, and is queued for the metric and attribution calculation engine.
3. **Given** an event arrives with an unknown or malformed campaign ID, **When** validation runs, **Then** the event is flagged as a data-quality issue (invalid campaign ID) rather than silently accepted into campaign performance metrics.
4. **Given** a user has withdrawn marketing/analytics consent, **When** a subsequent interaction occurs, **Then** the event is recorded with the corresponding consent status and is excluded from consent-restricted processing paths per Data Privacy rules.

---

### User Story 2 - Identity Resolution Merges Anonymous and Known Interactions (Priority: P1)

A prospect browses the site anonymously across two devices, later fills out a lead form on one device, and eventually logs in as a member. The identity-resolution engine must recognize that the anonymous browsing sessions, the form submission, and the member account all belong to the same person, merge them into one unified customer journey, and do so with confidence scoring and an audit trail rather than a blind, irreversible merge.

**Why this priority**: Without identity resolution, attribution and journey analytics are structurally broken — touchpoints before a "known" moment would never connect to the eventual conversion. It is listed as its own architectural layer (§5) between ingestion and the data warehouse, ahead of any dashboard capability.

**Independent Test**: Can be fully tested by generating anonymous browsing events tied to a device/cookie identifier, then submitting a form with an email address from the same device, and confirming the system links the prior anonymous events to the newly created identity, records a merge/link audit entry, and surfaces low-confidence matches for manual review instead of auto-merging them.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor with a browser cookie has three prior page-view events, **When** that visitor submits a form with an email address, **Then** the system performs anonymous-to-known conversion and attaches the three prior events to the resulting identity as part of one unified journey.
2. **Given** the same customer interacts from a mobile app and a desktop browser using the same verified phone number, **When** identity resolution runs, **Then** cross-device identity matching links both device histories to a single customer profile.
3. **Given** two profiles share a device fingerprint but have different verified emails and no other corroborating signal, **When** the match confidence is below the configured threshold, **Then** the system routes the potential match to manual review rather than auto-merging the profiles.
4. **Given** two profiles were previously merged in error, **When** an authorized user inspects the identity-merge audit history, **Then** the full merge/conflict-resolution trail is visible and the merge can be reviewed and corrected.

---

### User Story 3 - Choosing an Attribution Model for Revenue-Accurate Reporting (Priority: P1)

A performance marketer needs to know, for a membership-purchase conversion, how much credit each of four touchpoints (a social ad, an email open, an organic search visit, and a WhatsApp click) should receive. Depending on the question being asked, they need to switch between first-touch, last-touch, linear, time-decay, position-based, data-driven, or a custom attribution model — each configured with its own attribution window — and see auditable, non-double-counted results.

**Why this priority**: Attribution modeling is the analytical core of the chapter (§16–§24, nine full sections) and is what turns raw events into defensible revenue and ROI numbers used for budget decisions — the single highest-stakes calculation in the module.

**Independent Test**: Can be fully tested by generating a synthetic four-touchpoint customer journey ending in a defined conversion, running the same journey through first-touch, last-touch, linear, time-decay, and position-based models, and confirming each model produces a distinct, mathematically correct credit distribution (e.g., linear splits credit into equal shares reflecting the touchpoint count) that sums to 100% of the conversion value with no duplication across models or reports.

**Acceptance Scenarios**:

1. **Given** a purchase conversion with four eligible touchpoints inside the attribution window, **When** the Linear model is applied, **Then** each touchpoint receives an equal 25% share of conversion credit and revenue, and the system displays touchpoint count, credit per touchpoint, and channel/campaign-level aggregated credit.
2. **Given** the same journey, **When** Position-Based attribution is applied with default weighting, **Then** the first and last touchpoints each receive 40% credit and the remaining 20% is distributed across middle touchpoints, and an administrator can customize these percentages.
3. **Given** an administrator selects Data-Driven Attribution for a report, **When** results are generated, **Then** the output includes an attribution confidence score, model version, training period, data coverage, excluded data, and stated model limitations, and the report is blocked from financial or executive use until the mandatory human review and model-governance approval step is completed.
4. **Given** an administrator creates a Custom Attribution Model with specific channel weighting and a 45-day window, **When** the model is saved, **Then** it enters Draft status, supports a testing mode and version history, and requires an approval workflow before it can be applied to live or historical reporting.

---

### User Story 4 - Role-Specific Dashboard Renders for the Right Audience (Priority: P2)

A CEO, a CMO, a Marketing Manager, a Performance Marketer, a Content Manager, and a Finance lead all open "the marketing dashboard" — but each sees a different, purpose-built view: the CEO sees business growth and marketing's revenue contribution; the CMO sees channel/campaign effectiveness and budget allocation; the Performance Marketer sees ad spend, CTR, CPL/CPA and ROAS; Finance sees spend, budget variance, and reconciliation — each gated by role permissions.

**Why this priority**: Six distinct role-based dashboards are individually specified (§37.1–§37.6) as a core deliverable of the "Executive Intelligence" half of the chapter's title, and role-appropriate summaries are an explicit chapter acceptance criterion (§65.8).

**Independent Test**: Can be fully tested by logging in as users assigned to two different roles (e.g., CMO and Finance) and confirming each sees their role's specified focus-area widgets and KPIs, with financial detail available to Finance/CMO but not to a role without financial permission.

**Acceptance Scenarios**:

1. **Given** a user with the Chief Executive role opens the analytics module, **When** the dashboard loads, **Then** it shows business growth, marketing revenue contribution, marketing ROI, customer growth, strategic risks, and forecasts — not campaign-operational detail.
2. **Given** a user with the Chief Marketing Officer role opens the analytics module, **When** the dashboard loads, **Then** it shows channel performance, campaign effectiveness, budget allocation, attribution, brand/audience growth, and marketing pipeline.
3. **Given** a user with the Finance role opens the analytics module, **When** the dashboard loads, **Then** it shows marketing spend, budget variance, attributed revenue, profitability, cost control, and financial reconciliation, and sensitive revenue/customer-level data is visible only because this role is explicitly authorized.
4. **Given** a user without financial-metric permission attempts to view revenue or customer-level financial data, **When** they load any dashboard, **Then** those fields are withheld per role-based access control rather than displayed.

---

### User Story 5 - AI Generates an Executive Narrative Summary (Priority: P2)

An executive opens the Executive Intelligence Dashboard on a Monday morning and, instead of parsing twenty charts, reads an automatically generated narrative summary covering major performance changes, the highest-performing campaigns, underperforming channels, revenue impact, budget risks, customer behavior changes, forecasted outcomes, and recommended executive actions — each claim traceable to supporting data.

**Why this priority**: This is the signature "Executive Intelligence" capability named in the chapter title (§36.3) and is explicitly identified as carrying real risk if done wrong — the chapter's own risk register lists "AI-generated misleading insight" with the mitigation "display evidence, confidence and human review controls" (§67), directly engaging Constitution Article II (AI Is Assistive, Never Autonomous).

**Independent Test**: Can be fully tested by running the narrative generator against a dataset with a known performance shift (e.g., a channel's CAC doubling) and confirming the generated narrative references that specific change with supporting metrics, a comparison period, and a confidence indicator, and that no narrative statement is presented without underlying evidence a reviewer can inspect.

**Acceptance Scenarios**:

1. **Given** marketing-attributed revenue changed materially versus the prior period, **When** the executive narrative is generated, **Then** it names the change, the affected campaigns/channels, the revenue impact, and a recommended action.
2. **Given** the AI intelligence engine surfaces an insight (e.g., "Paid social acquisition cost increased"), **When** the insight is displayed anywhere (narrative or insight panel), **Then** it includes an insight title, business explanation, supporting metrics, comparison period, confidence score, estimated impact, recommended action, and related campaigns/channels.
3. **Given** an AI insight or narrative recommendation could inform a budget or strategic decision, **When** an executive views it, **Then** the system presents it as advisory only and requires human review/acceptance before any downstream action is treated as approved (audit-logged per §56 "AI recommendation acceptance").
4. **Given** the underlying data for a period is incomplete or delayed, **When** the narrative would otherwise be generated, **Then** the narrative reflects or is suppressed pending the data-freshness warning rather than presenting conclusions based on stale/partial data as final.

---

### User Story 6 - Historical Data Is Reprocessed Under Approval Control (Priority: P2)

An administrator discovers that a batch of events had an incorrect campaign ID, or that the organization changed its attribution model's decay rate. Historical analytics and attribution results must be recalculated for the affected date range — but only after previewing the impact and obtaining approval, because these numbers may already have been reported to finance or the board.

**Why this priority**: Historical reprocessing is explicitly gated by an approval workflow and impact preview in the source (§49), directly reflecting Constitution Article IV (Historical Immutability) — recalculation must be a controlled, auditable, reversible-where-possible operation, not a silent overwrite of finalized figures.

**Independent Test**: Can be fully tested by triggering a reprocessing request for a defined date range after changing a conversion definition, confirming an impact preview is generated before execution, that execution requires explicit approval, that progress and error logs are visible during the run, and that a version comparison (before vs. after) is available afterward.

**Acceptance Scenarios**:

1. **Given** an administrator corrects a batch of miscategorized events, **When** they request historical reprocessing for the affected date range, **Then** the system generates an impact preview showing which metrics/reports would change before any recalculation is committed.
2. **Given** the impact preview is reviewed, **When** an authorized approver approves the reprocessing job, **Then** the job executes with visible processing progress and an error log, and only then are the affected historical figures updated.
3. **Given** a reprocessing job has completed, **When** an authorized user compares versions, **Then** the system shows a version comparison between the pre- and post-reprocessing results.
4. **Given** a reprocessing job produces an unexpected or erroneous result, **When** technically possible, **Then** the system supports rolling back to the prior calculated state.

---

### User Story 7 - Analyst Builds a Custom Report and Schedules Its Delivery (Priority: P3)

A performance analyst who is not an engineer needs a report that doesn't exist yet — a specific combination of metrics, dimensions, filters, and a particular attribution model — and wants it emailed to a distribution list every Monday morning as a PDF, without writing a query or risking accidentally double-counting revenue.

**Why this priority**: The Custom Report Builder and Scheduled Reports are explicitly separated into their own sections (§39–§40) as self-service capabilities that reduce dependency on engineering, extending the value of everything built in P1/P2 stories to non-technical roles.

**Independent Test**: Can be fully tested by building a report selecting a data source, metrics, dimensions, filters, grouping, sorting, an attribution model, and a date range, confirming the system blocks an invalid configuration (e.g., a combination that would double-count revenue), then scheduling it weekly for email delivery as a PDF and confirming delivery within the target delivery window.

**Acceptance Scenarios**:

1. **Given** an analyst selects a data source, metrics, dimensions, filters, grouping, sorting, an attribution model, a date range, a comparison period, and a visualization type, **When** they save the report, **Then** the report renders using the selected configuration and export format.
2. **Given** an analyst configures a report combination that would cause revenue double-counting or an unsupported join, **When** they attempt to save/run it, **Then** the system blocks the configuration and explains the validation failure rather than silently producing incorrect numbers.
3. **Given** a saved report, **When** an analyst schedules it weekly with PDF delivery to an email distribution list, **Then** the system delivers the report within 15 minutes of the scheduled time in the selected format.
4. **Given** a scheduled report's underlying data source fails to refresh, **When** the delivery time arrives, **Then** the system either flags the data-freshness issue in the delivered report or delays/retries per its reliability rules rather than delivering stale data as if it were current.

---

### User Story 8 - Anomaly Is Detected and an Alert Is Raised (Priority: P3)

Overnight, a campaign's spend spikes unexpectedly, or an email's bounce rate jumps. Before a human notices in a dashboard, the anomaly detection system must flag the unusual change, classify its severity, propose a possible cause, and notify the right owner through a configured channel — so budget waste or a broken tracking pipeline doesn't run unnoticed for days.

**Why this priority**: Anomaly detection and alerting (§43–§44) directly support the chapter's data-quality and financial-protection goals, and detection speed is a named performance target (§60: "Alert Detection: Less than 5 minutes").

**Independent Test**: Can be fully tested by injecting a synthetic spend spike or conversion drop into test data, running the anomaly-detection job, and confirming an alert is raised within the target detection window containing severity, affected metric, detected time, expected range, actual value, possible cause, recommended action, assigned owner, and resolution status, delivered through the configured alert channel(s).

**Acceptance Scenarios**:

1. **Given** a campaign's spend deviates sharply from its expected range, **When** the anomaly-detection job runs, **Then** an alert is created within 5 minutes containing severity, the affected metric, expected range, actual value, a possible cause, and a recommended action.
2. **Given** a user has configured a threshold-based alert (e.g., conversion drop below a percentage), **When** the threshold is crossed, **Then** the alert is delivered through the user's configured channel(s) (in-app, email, SMS, WhatsApp, push, Slack/team collaboration, or webhook).
3. **Given** an anomaly alert has been raised, **When** an owner is assigned and investigates, **Then** the alert's resolution status can be updated and tracked through to closure.
4. **Given** duplicate conversion events or bot-generated activity is detected as an anomaly type, **When** the alert fires, **Then** it is distinguishable from a genuine performance anomaly so the correct remediation (data-quality fix vs. campaign action) is applied.

---

### Edge Cases

- **Duplicate/overlapping conversion counting**: The same conversion event is eligible for multiple reports, attribution models, or overlapping campaigns simultaneously — the system must prevent the same revenue from being counted more than once within any single report or roll-up (§26, §67 explicitly names this as a risk requiring event IDs, idempotency, and deduplication).
- **AI-generated misleading insight**: An AI-generated insight or executive narrative statement is confidently wrong or statistically weak, and an executive acts on it without realizing its evidentiary basis was thin — the chapter's own risk table names this explicitly and requires evidence, confidence scores, and human review controls (§67).
- **Multi-currency mismatch**: A campaign's cost is recorded in one currency and its attributed revenue in another, and the exchange rate changes between the transaction date and the report-viewing date — historical rates must be preserved at the transaction's effective date, not silently recalculated at the current rate (§50).
- **Multi-timezone aggregation mismatch**: A campaign is scheduled in the organization's default time zone, a customer converts in their own local time zone, and a report viewer's preferred reporting time zone differs from both — day-level and period-level aggregation must remain internally consistent rather than shifting event dates depending on which time zone is applied (§51).
- **Identity-resolution false merge**: Two different people who share a household device, public/shared computer, or cookie are incorrectly merged into one identity, contaminating both individuals' journeys and attribution — must be caught by confidence-based matching, routed to manual review when uncertain, and remain correctable via merge audit history (§8).
- **Data-driven attribution used without governance**: A user applies the Data-Driven Attribution model's output directly to a financial or board report without the mandatory human review and model-governance approval step the chapter requires (§22).
- **Historical reprocessing after figures were already reported**: An attribution rule, conversion definition, or cost correction triggers historical recalculation for a date range whose figures were already delivered to finance or the board — the impact preview and approval workflow must surface this before committing changes, and rollback must be available where technically possible (§49).
- **Stale or failed external-platform data presented as final**: An external ad platform (e.g., Google Ads, Meta Ads) fails to sync or delivers late, but a dashboard or scheduled report is generated anyway — the data-freshness indicator must clearly flag delayed/failed sources rather than silently presenting an incomplete number as the final one (§46, §67).
- **Bot-generated or duplicate tracking activity inflating metrics**: Non-human traffic or duplicate tracking-pixel fires inflate impressions, clicks, or lead counts before data-quality checks catch them — must be caught by continuous data-quality monitoring and reflected in the administrator data-quality dashboard before reaching executive-facing metrics (§48, §67).
- **Consent withdrawal after inclusion in historical analytics**: A customer withdraws marketing/analytics consent or requests deletion after their events have already contributed to cohort, journey, or attribution analytics already used in past reports — restricted tracking, masking, and deletion rules must apply going forward while reconciling against the Historical Immutability principle for already-finalized financial/attribution records (§55, Constitution Article IV).

## Requirements *(mandatory)*

### Functional Requirements — Data Sources & Ingestion

- **FR-001**: System MUST implement the analytics pipeline as distinct logical layers — Marketing Channels & TBT Modules → Event Collection & Data Ingestion → Validation, Cleaning & Identity Resolution → Marketing Data Warehouse → Metric & Attribution Calculation Engine → Analytics, Forecasting & AI Intelligence Layer → Operational, Management & Executive Dashboards — and MUST support batch processing, near-real-time event processing, and scheduled historical recalculation.
- **FR-002**: System MUST collect data from internal TBT sources including user registration/profiles, membership subscriptions, course enrollments/completions, ebook and podcast activity, community posts/comments/likes/shares, referral activity, reward points, wallet transactions, event registrations, webinar participation, support tickets, AI assistant interactions, landing page activity, form submissions, lead records, campaign activity, workflow execution, and payment/purchase records.
- **FR-003**: System MUST collect performance data from marketing communication sources including email, SMS, WhatsApp, mobile push, in-app notifications, browser push, social media, affiliate, referral, display advertising, and search advertising campaigns.
- **FR-004**: System MUST support ingestion from external sources including Google Ads, Meta Ads, LinkedIn Ads, YouTube, Google Analytics, Google Search Console, CRM platforms, payment gateways, webinar providers, social media management platforms, external data warehouses/BI tools, custom APIs, webhook-based services, and CSV/spreadsheet imports.

### Functional Requirements — Event Tracking Framework

- **FR-005**: Every tracked event record MUST contain: event ID, event name, event category, customer ID, anonymous visitor ID, session ID, campaign ID, channel ID, content ID, device ID, source, medium, campaign name, referral URL, landing page URL, event timestamp, customer time zone, device type, browser, operating system, geographic information, event properties, consent status, data source, and processing status.
- **FR-006**: System MUST support a standardized set of marketing event types including campaign sent, message delivered, message opened, link clicked, landing page viewed, form started, form submitted, lead created, demo requested, product viewed, cart created, checkout started, purchase completed, subscription renewed, referral completed, and customer churned.

### Functional Requirements — Identity Resolution

- **FR-007**: System MUST provide an identity-resolution engine that connects anonymous and known customer interactions using identity signals including customer ID, email address, verified phone number, login session, device identifier, browser cookie, form submission, membership account, referral code, and transaction identifier.
- **FR-008**: System MUST merge eligible interactions into a unified customer journey while respecting privacy, consent, and data-retention rules.
- **FR-009**: Identity resolution MUST support anonymous-to-known customer conversion, cross-device identity matching, duplicate profile detection, profile merge controls, conflict-resolution rules, manual review for uncertain matches, and a full identity-merge audit history.

### Functional Requirements — Marketing Analytics & Campaign/Channel Dashboards

- **FR-010**: The Marketing Analytics Dashboard MUST display summary cards for total marketing spend, impressions, reach, campaign engagements, clicks, leads, marketing-qualified leads, sales-qualified leads, conversions, attributed revenue, cost per lead, cost per acquisition, return on ad spend, marketing ROI, customer acquisition cost, and average customer lifetime value.
- **FR-011**: Users MUST be able to filter dashboards by date range, organization, business unit, brand, campaign, campaign type, channel, customer segment, product, membership plan, geographic region, device type, language, marketing owner, attribution model, and conversion type.
- **FR-012**: The dashboard MUST support time comparisons against the previous period, previous week, previous month, previous quarter, previous year, a custom comparison period, a campaign target, a budget target, and a forecast target.
- **FR-013**: Each campaign MUST have a detailed performance page showing campaign name, objective, owner, status, start/end dates, target audience, target channels, planned budget, actual spend, messages sent/delivered/failed, impressions, reach, opens, clicks, responses, landing page visits, form submissions, leads generated, qualified leads, conversions, revenue generated, cost per conversion, ROI, attribution contribution, and performance against target.
- **FR-014**: The campaign performance page MUST also provide a daily performance trend, audience breakdown, channel breakdown, geographic performance, device performance, creative performance, conversion funnel, customer journey paths, and AI-generated recommendations.
- **FR-015**: System MUST provide individual and comparative channel analytics for email, SMS, WhatsApp, push notifications, social media, search advertising, display advertising, affiliate marketing, referral marketing, organic search, direct traffic, community marketing, and events/webinars, allowing marketers to identify the strongest-performing channels.
- **FR-016**: Channel-level analytics MUST include spend, impressions, reach, frequency, engagement, click-through rate, conversion rate, lead volume, qualified lead volume, cost per lead, cost per acquisition, attributed revenue, return on ad spend, customer lifetime value, churn rate, and retention contribution.
- **FR-017**: Email analytics MUST include emails sent/delivered, delivery rate, hard/soft bounces, open rate, unique open rate, click rate, click-to-open rate, unsubscribe rate, spam complaint rate, conversion rate, revenue per email, device/email-client/geographic distribution, link-level click performance, and subject-line/template/send-time performance, and MUST clearly distinguish estimated open activity from verified conversion activity where privacy controls or email-client behavior affect open tracking.
- **FR-018**: SMS analytics MUST include messages submitted/delivered/failed, delivery rate, click rate, reply rate, opt-out rate, conversion rate, cost per message, cost per conversion, and revenue attributed.
- **FR-019**: WhatsApp analytics MUST include messages sent/delivered/read, message failures, button clicks, link clicks, customer replies, conversation starts, template performance, opt-outs, conversions, and revenue attributed.
- **FR-020**: Push notification analytics MUST include notifications sent/delivered/opened, deep-link clicks, dismissals, conversion rate, uninstalls following notification, device platform, app version, and campaign revenue.

### Functional Requirements — Funnel & Customer Journey Analytics

- **FR-021**: Users MUST be able to create and analyze custom marketing funnels by defining funnel stages, entry conditions, completion conditions, a conversion window, sequential or flexible event order, a customer segment, and exclusion rules.
- **FR-022**: Funnel analytics MUST include total users entering each stage, stage-to-stage conversion rate, overall conversion rate, average time between stages, drop-off count and percentage, segment/channel/campaign-level funnel comparison, and revenue generated at the final stage.
- **FR-023**: Customer Journey Analytics MUST show the first recorded interaction, all marketing touchpoints, communication engagement, website/app behavior, form submissions, lead qualification events, sales interactions, purchases, renewals, support interactions, referrals, and churn events.
- **FR-024**: Journey views MUST include an individual customer timeline, an aggregated journey map, most common and high-performing conversion paths, high-drop-off journey paths, average number of touchpoints before conversion, average time to conversion, channel transition analysis, and cross-device journey analysis.

### Functional Requirements — Attribution Models

- **FR-025**: System MUST support attribution modeling that determines how conversion and revenue credit is distributed across marketing touchpoints, with configurable attribution windows and multiple selectable attribution models.
- **FR-026**: System MUST support First-Touch Attribution, assigning full conversion credit to the first recorded marketing interaction, and MUST preserve the original acquisition source even when later campaigns influence the conversion.
- **FR-027**: System MUST support Last-Touch Attribution, assigning full conversion credit to the final marketing interaction before conversion, with a configurable lookback period.
- **FR-028**: System MUST support Linear Attribution, distributing equal credit across all eligible touchpoints within the attribution window, and MUST display the number of eligible touchpoints, credit and revenue assigned per touchpoint, and channel/campaign-level aggregated credit.
- **FR-029**: System MUST support Time-Decay Attribution, giving more credit to interactions closer to conversion, with administrator-configurable attribution window, decay rate, minimum eligible interaction, included channels, excluded events, and conversion definition.
- **FR-030**: System MUST support Position-Based Attribution, giving stronger credit to the first and last touchpoints (default 40% first / 40% last / 20% distributed among middle touchpoints), with administrator-customizable percentages.
- **FR-031**: System MUST support Data-Driven Attribution, using historical customer journeys and conversion outcomes to estimate each touchpoint's incremental contribution by analyzing channel combinations, interaction order, time between interactions, customer segment, campaign type, creative type, device, geography, and conversion value; results MUST include an attribution confidence score, model version, training period, data coverage, excluded data, stated model limitations, and a comparison against rule-based attribution.
- **FR-032**: Human review and model governance approval MUST be mandatory before data-driven attribution results are used for financial or executive reporting.
- **FR-033**: Authorized administrators MUST be able to create Custom Attribution Models configuring attribution window, touchpoint eligibility, channel/campaign/position weighting, time-decay rules, customer-segment rules, conversion-value rules, offline interaction inclusion, direct-traffic treatment, and duplicate touchpoint handling.
- **FR-034**: Custom attribution models MUST support draft status, testing mode, version history, an approval workflow, an effective date, historical recalculation, and rollback.
- **FR-035**: System MUST support configurable attribution windows including same session, 1 day, 7 days, 14 days, 30 days, 60 days, 90 days, 180 days, and custom durations, and MUST allow different conversion types to use different attribution windows.

### Functional Requirements — Conversion Definitions, Revenue Attribution & ROI

- **FR-036**: Administrators MUST be able to define conversion events (e.g., registration, form submission, lead qualification, consultation booking, webinar registration, membership purchase/upgrade, course purchase, ebook purchase, event registration, referral completion, subscription renewal, custom business event), each with a conversion name, event condition, conversion value, revenue source, attribution model, attribution window, duplicate-conversion rule, and active/inactive status.
- **FR-037**: Revenue attribution MUST include gross revenue, net revenue, discount amount, refund amount, tax amount, subscription/renewal/upsell/cross-sell/recurring revenue, attributed revenue, and unattributed revenue, and MUST avoid double-counting revenue when analyzed across multiple reports, models, or conversion events.
- **FR-038**: System MUST calculate marketing ROI measurements including total marketing spend, attributed revenue, gross profit, marketing ROI, return on ad spend, cost per lead, cost per qualified lead, cost per acquisition, customer acquisition cost, customer lifetime value, LTV-to-CAC ratio, payback period, revenue per lead, and revenue per customer, and MUST allow finance-approved cost data to be imported or synchronized from external financial systems.
- **FR-039**: Authorized users MUST be able to manage campaign and channel costs (advertising spend, agency fees, creative production, technology costs, event costs, influencer fees, affiliate commissions, messaging charges, employee allocation, external vendor costs, promotional discounts) via manual entry, CSV import, API synchronization, or scheduled import, with an approval workflow, currency conversion, cost center assignment, and budget category assignment.
- **FR-040**: System MUST compare planned marketing budgets against actual spending (planned/approved budget, committed spend, actual spend, remaining budget, budget utilization percentage, forecasted final spend, over/under-budget amount, revenue target, actual attributed revenue, forecasted revenue), broken down by campaign, channel, product, business unit, marketing owner, region, month, quarter, and financial year.

### Functional Requirements — Cohort, Retention & Customer Lifetime Value Analytics

- **FR-041**: System MUST support cohort analysis grouping customers by registration date, first purchase date, acquisition campaign/channel, membership plan, geographic region, referral source, product purchased, customer segment, or lead score range, with metrics including retention, repeat purchase rate, average revenue, customer lifetime value, engagement, upgrade rate, renewal rate, churn rate, and referral activity.
- **FR-042**: System MUST provide retention and churn analytics including Day-1/Day-7/Day-30 retention, monthly retention, renewal rate, repeat purchase rate, active/dormant customer percentage, churn rate, reactivation rate, and average active duration, comparable by campaign, channel, product, customer segment, membership plan, acquisition month, marketing message, and referral source.
- **FR-043**: System MUST calculate historical and predicted Customer Lifetime Value from inputs including purchase frequency, average transaction value, subscription revenue, renewal probability, retention duration, refund behavior, support costs, marketing acquisition costs, product usage, and referral contribution, available at individual customer, segment, campaign, channel, product, and cohort level.

### Functional Requirements — Content, Geographic & Device Analytics

- **FR-044**: System MUST analyze performance of marketing content and creative assets (email subject lines/templates, landing page headlines, banner images, videos, advertisements, CTA buttons, social posts, WhatsApp templates, push messages, AI-generated copy) including impressions, engagement, clicks, conversions, revenue, audience response, device/segment performance, experiment results, and creative fatigue indicators.
- **FR-045**: System MUST provide geographic analytics broken down by country, state, district, city, postal region, sales territory, or custom geographic region, covering reach, engagement, leads, conversions, revenue, cost per acquisition, customer lifetime value, retention, and churn; location data MUST only be used when legally permitted and supported by customer consent.
- **FR-046**: System MUST report performance across mobile/desktop/tablet devices, web/Android/iOS applications, browser types, operating systems, app versions, screen resolutions, and network categories, to help teams identify technical issues negatively affecting conversion performance.

### Functional Requirements — Executive Intelligence & AI Executive Narrative

- **FR-047**: The Executive Intelligence Dashboard MUST display KPI cards for total marketing investment, total marketing-attributed revenue, marketing ROI, customer acquisition cost, customer lifetime value, total leads, qualified leads, conversion rate, revenue growth, customer growth, retention rate, churn rate, forecasted revenue, and marketing's contribution to total company revenue.
- **FR-048**: The Executive Intelligence Dashboard MUST include visualizations for marketing revenue trend, spend versus revenue, channel/campaign performance ranking, lead-to-customer funnel, customer acquisition trend, retention trend, attribution contribution, budget utilization, forecast versus actual, key risks, and growth opportunities.
- **FR-049**: System MUST automatically generate an executive narrative summary covering major performance changes, highest-performing campaigns, underperforming channels, revenue impact, budget risks, customer behavior changes, forecasted outcomes, and recommended executive actions, with every narrative claim traceable to supporting evidence.
- **FR-050**: Every AI-generated insight (whether in the executive narrative or an insight panel) MUST contain an insight title, business explanation, supporting metrics, comparison period, confidence score, estimated impact, recommended action, and related campaigns or channels, and MUST be treated as advisory, requiring human review before informing a consequential decision.

### Functional Requirements — Role-Specific Dashboards

- **FR-051**: System MUST provide a Chief Executive dashboard focused on business growth, marketing revenue contribution, marketing ROI, customer growth, strategic risks, and forecasts.
- **FR-052**: System MUST provide a Chief Marketing Officer dashboard focused on channel performance, campaign effectiveness, budget allocation, attribution, brand/audience growth, and marketing pipeline.
- **FR-053**: System MUST provide a Marketing Manager dashboard focused on active campaigns, team performance, lead generation, campaign targets, conversion optimization, and operational alerts.
- **FR-054**: System MUST provide a Performance Marketer dashboard focused on advertisement spend, click-through rates, cost per lead, cost per acquisition, return on ad spend, and creative performance.
- **FR-055**: System MUST provide a Content Manager dashboard focused on content engagement, creative performance, channel distribution, conversion contribution, content experiments, and audience preferences.
- **FR-056**: System MUST provide a Finance dashboard focused on marketing spend, budget variance, attributed revenue, profitability, cost control, and financial reconciliation, with revenue and customer-financial detail visible only to authorized roles.

### Functional Requirements — Custom Dashboards, Reports & Scheduling

- **FR-057**: Authorized users MUST be able to create custom dashboards through a no-code interface using widgets including KPI cards, line/bar/area/pie/donut/funnel charts, tables, pivot tables, geographic maps, cohort grids, attribution path diagrams, customer journey diagrams, forecast charts, text summaries, and AI insight panels, with support for widget resizing, drag-and-drop layout, custom filters, date controls, metric/dimension selection, sorting, comparison periods, thresholds, conditional alerts, role-based visibility, cloning, and template saving.
- **FR-058**: The Custom Report Builder MUST let analysts select data source, metrics, dimensions, filters, grouping, sorting, attribution model, date range, comparison period, visualization type, and export format, and MUST validate configurations to prevent unsupported joins, metric duplication, revenue double-counting, excessive query load, unauthorized data access, and invalid attribution comparisons.
- **FR-059**: Users MUST be able to schedule reports for automatic delivery on a daily, weekly, monthly, quarterly, or custom schedule, via email, dashboard notification, secure download center, cloud storage integration, API delivery, or webhook, in PDF, Excel, CSV, presentation summary, executive email summary, or secure report link format.

### Functional Requirements — AI-Generated Insights & Predictive Analytics

- **FR-060**: The AI Intelligence Engine MUST analyze marketing data and surface actionable insights (e.g., a significant conversion drop, an acquisition-cost increase, unusual landing-page abandonment, a low-quality-but-low-cost lead channel, hidden attribution influence, likely budget overrun).
- **FR-061**: The predictive analytics engine MUST generate forecasts for impressions, reach, leads, qualified leads, conversions, campaign revenue, marketing spend, customer acquisition cost, customer lifetime value, membership renewals, churn, and campaign target achievement, supporting best-case/expected/worst-case scenarios, a confidence range, historical trend comparison, seasonality adjustments, and campaign-specific assumptions.

### Functional Requirements — Anomaly Detection, Alerts & Benchmarking

- **FR-062**: System MUST automatically detect unusual changes in marketing performance (e.g., sudden spend increase, unexpected conversion reduction, delivery failure spike, bounce-rate increase, unusual unsubscribe activity, traffic drop, tracking-event failure, lead-volume spike, revenue mismatch, duplicate conversion events, campaign overspending, abnormal geographic traffic, bot-generated activity), and every alert MUST contain severity, affected metric, detected time, expected range, actual value, possible cause, recommended action, assigned owner, and resolution status.
- **FR-063**: Users MUST be able to configure alerts based on metric thresholds, percentage changes, budget limits, revenue targets, campaign delivery failures, conversion drops, attribution changes, data-pipeline failures, forecast risks, or AI-detected anomalies, delivered via in-app notification, email, SMS, WhatsApp, push notification, Slack/team collaboration integration, or webhook.
- **FR-064**: System MUST support internal performance benchmarking (campaign vs. previous campaign, month vs. previous month, channel vs. channel, segment vs. segment, team vs. team, region vs. region, product vs. product, actual vs. target, actual vs. forecast, current vs. historical average); external industry benchmarks are reserved for future release via approved data providers.

### Functional Requirements — Data Governance

- **FR-065**: Every dashboard and report MUST display a data-freshness indicator showing last-updated time, data-processing status, delayed sources, failed sources, estimated next refresh, and real-time/batch classification, and MUST warn users when a report is based on incomplete, delayed, or stale data.
- **FR-066**: System MUST maintain a centralized marketing data dictionary in which each metric definition includes metric name, business definition, calculation logic, data source, owner, update frequency, included/excluded events, currency handling, attribution treatment, effective date, version, and approval status (governed metrics include Lead, Qualified Lead, Conversion, Campaign Revenue, Customer Acquisition Cost, ROAS, Marketing ROI, CLV, Active Customer, and Churned Customer).
- **FR-067**: The analytics engine MUST continuously monitor data quality (missing values, duplicate events, invalid timestamps, invalid campaign IDs, unknown traffic sources, revenue mismatches, currency inconsistencies, customer identity conflicts, event-processing delays, attribution gaps, tracking-code failures, abnormal event volume), and data-quality issues MUST be visible in an administrator dashboard.
- **FR-068**: Authorized administrators MUST be able to recalculate historical analytics when attribution rules change, conversion definitions change, event data is corrected, currency rates are updated, duplicate records are removed, customer identities are merged, cost data is added, or analytics logic is upgraded; historical reprocessing MUST support defined date ranges, an impact preview, an approval workflow, processing progress, error logs, version comparison, and rollback where technically possible.

### Functional Requirements — Multi-Currency & Multi-Time-Zone

- **FR-069**: System MUST support multi-currency organizations, tracking original transaction currency, reporting currency, organization base currency, exchange-rate source, exchange-rate effective date, historical rate preservation, converted revenue, converted cost, and currency-specific dashboards; every report MUST clearly identify the currency used.
- **FR-070**: System MUST support customers, campaigns, and teams operating across multiple time zones, including organization default time zone, campaign time zone, customer local time, user-preferred reporting time zone, UTC storage, time-zone-aware aggregation, and daylight-saving adjustments where applicable.

### Functional Requirements — Access Control, Privacy, Audit, Export & API

- **FR-071**: System MUST enforce granular role-based permissions covering view dashboard, view financial metrics, view customer-level data, create reports, edit dashboards, export data, create attribution models, approve attribution models, configure alerts, reprocess historical data, manage metric definitions, manage data sources, and view audit logs; sensitive revenue, customer, and financial information MUST be visible only to authorized roles.
- **FR-072**: System MUST respect customer privacy and consent, including consent-aware event processing, restricted tracking for opted-out users, data masking, pseudonymized reporting, customer data deletion, data-retention rules, purpose-based processing, geographic privacy controls, and secure customer-level analytics access; aggregated reports SHOULD be used wherever individual customer identification is unnecessary.
- **FR-073**: System MUST maintain audit records for dashboard creation/modification, report creation/export, attribution-model changes, metric-definition changes, data-source configuration, historical recalculation, customer-data access, permission changes, shared report links, AI recommendation acceptance, and manual data correction, each capturing user identity, timestamp, action, affected object, and change details.
- **FR-074**: Authorized users MUST be able to export analytics data in CSV, Excel, PDF, JSON, presentation summary, or secure API response formats, with exports respecting user permissions, row-level access, data masking, export limits, customer consent, audit logging, and data-retention policies.
- **FR-075**: Users MUST be able to share dashboards/reports with authorized users, add comments, tag team members, save report views, create report subscriptions, generate secure view-only links with expiration dates, restrict download access, and revoke shared access; public access to enterprise marketing reports MUST be disabled by default.
- **FR-076**: System MUST expose secure APIs to retrieve dashboard metrics, campaign/channel performance, attribution results, funnel data, customer journey data, forecast results, submit cost data, create custom reporting jobs, and retrieve report export status, secured with authentication, authorization, rate limiting, request logging, field-level permissions, data masking, API versioning, and idempotency where required.
- **FR-077**: System MUST integrate with the Customer Data Platform, CRM, Campaign Management, Email/SMS/WhatsApp Marketing, Push Notification System, Workflow Automation, Landing Pages and Forms, Lead Management, AI Marketing Assistant, A/B Testing Platform, Membership System, Community Platform, Course Platform, Ebook Platform, Podcast Platform, Referral System, Payment System, Finance and Budgeting Systems, third-party advertising platforms, and external business intelligence tools.

### Functional Requirements — Reliability, Accessibility & Interface States

- **FR-078**: System MUST provide retry mechanisms, duplicate-event protection, processing checkpoints, dead-letter queues, recovery procedures, reconciliation reports, and backup/disaster recovery to support reliable, enterprise-scale processing of billions of historical event records and thousands of concurrent dashboard users.
- **FR-079**: Dashboards and reports MUST support keyboard navigation, screen readers, accessible labels, color-contrast compliance, text alternatives for visualizations, data-table alternatives, zoom support, non-color-based status indicators, and accessible export formats where supported.
- **FR-080**: The analytics interface MUST support desktop, tablet, mobile web, and the TBT mobile application; mobile dashboards MUST prioritize executive KPIs, campaign alerts, spend status, revenue status, performance trends, AI insights, and approval actions, while complex report-building features may remain desktop-focused.
- **FR-081**: System MUST provide clear empty states (e.g., no campaign data, no conversions recorded, no attribution touchpoints found, no cost data configured, no reports created), loading states (during dashboard refresh, report generation, attribution calculation, historical reprocessing, data-source sync), and error states (clear message, affected data source, retry option, support reference, last successful refresh, alternative available data).

### Key Entities *(include if feature involves data)*

- **Tracked Event**: A single standardized interaction record (campaign send, open, click, form submit, purchase, churn, etc.) carrying identity, campaign/channel/content, device, timestamp, geography, consent, and processing-status fields; the atomic unit all downstream analytics are built from.
- **Identity Resolution Record**: The mapping and audit trail linking anonymous visitor IDs, device/cookie identifiers, and known customer IDs into a single resolved identity, including match confidence, merge/conflict-resolution history, and manual-review status.
- **Attribution Model**: A configured method (First-Touch, Last-Touch, Linear, Time-Decay, Position-Based, Data-Driven, or Custom) for distributing conversion/revenue credit across touchpoints, with its own weighting rules, status (draft/testing/approved), version history, and effective date.
- **Attribution Window**: The configurable lookback duration (same-session through 180 days or custom) within which a touchpoint is eligible for credit for a given conversion type.
- **Conversion Definition**: An administrator-defined business event (e.g., membership purchase, lead qualification) with its triggering condition, conversion value, revenue source, assigned attribution model/window, and duplicate-conversion handling rule.
- **Campaign Performance Record**: The aggregated metrics, spend, and outcomes for a single campaign across its lifecycle, including daily trend, breakdowns, and attribution contribution.
- **Channel Performance Record**: Aggregated metrics for a marketing channel (email, SMS, WhatsApp, push, social, search, affiliate, referral, organic, direct, community, events) across campaigns.
- **Customer Journey**: The ordered sequence of a resolved identity's marketing touchpoints, engagement, and business events from first interaction through conversion, renewal, or churn.
- **Funnel Definition**: A configurable ordered set of stages, entry/completion conditions, conversion window, and exclusion rules used to measure stage-to-stage conversion.
- **Cohort**: A group of customers sharing an acquisition characteristic (date, campaign, channel, plan, region, etc.), tracked over time for retention, revenue, and churn metrics.
- **Dashboard**: A configured collection of widgets, filters, and role-based visibility rules — either a system role-specific dashboard (CEO, CMO, Marketing Manager, Performance Marketer, Content Manager, Finance) or a user-built custom dashboard.
- **Custom Report**: A saved analyst-defined query configuration (data source, metrics, dimensions, filters, attribution model, date range) with optional scheduling and delivery settings.
- **Executive Narrative**: An AI-generated summary of major performance changes, risks, and recommended actions, with each statement traceable to supporting metrics and a confidence indicator.
- **AI Insight**: A discrete AI-generated observation with title, explanation, supporting metrics, comparison period, confidence score, estimated impact, and recommended action.
- **Anomaly Alert**: A system-detected unusual performance change with severity, affected metric, expected vs. actual value, possible cause, recommended action, assigned owner, and resolution status.
- **Metric Data Dictionary Entry**: The governed definition of a single metric (name, business definition, calculation logic, source, owner, currency handling, attribution treatment, version, approval status) forming the platform's single source of truth for metric meaning.
- **Data Quality Issue**: A detected data problem (missing value, duplicate event, invalid ID, revenue mismatch, identity conflict, etc.) tracked in the administrator data-quality dashboard.
- **Historical Reprocessing Job**: A controlled, approved recalculation run over a defined historical date range, with impact preview, progress tracking, error log, version comparison, and rollback capability.
- **Cost Record**: A manually entered, imported, or synchronized marketing cost item (spend, agency fee, production cost, etc.) tied to a campaign/channel/cost-center/budget category, with currency and approval metadata.
- **Budget**: A planned spend allocation tracked against committed and actual spend, utilization, and forecasted final spend, at campaign/channel/product/business-unit/region/period level.
- **Audit Log Entry**: An immutable record of a sensitive analytics action (dashboard/report change, attribution-model change, metric-definition change, historical recalculation, customer-data access, permission change, AI recommendation acceptance) capturing actor, timestamp, action, and affected object.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Executive Intelligence Dashboard loads its initial view in under 3 seconds; standard dashboard filter updates apply in under 2 seconds.
- **SC-002**: New marketing events (clicks, opens, form submissions, purchases) become visible in analytics within 60 seconds of occurring.
- **SC-003**: Standard reports generate in under 10 seconds and large/complex reports in under 60 seconds; scheduled reports are delivered within 15 minutes of their scheduled time.
- **SC-004**: Attribution recalculation for a standard campaign completes in under 5 minutes; anomaly/alert detection surfaces a qualifying event in under 5 minutes.
- **SC-005**: The platform sustains millions of customer profiles, billions of historical event records, and thousands of concurrent dashboard users without service degradation, across multi-tenant organizations.
- **SC-006**: Service availability meets or exceeds 99.9% for the analytics dashboard, 99.95% for the data ingestion service, 99.9% for the attribution calculation service, and 99.5% for the scheduled reporting service.
- **SC-007**: 100% of financial and attribution calculations pass automated regression testing before release, and revenue figures reconcile across reports/models with zero detected double-counting incidents in production monitoring.
- **SC-008**: 100% of AI-generated insights and executive narrative statements display a confidence score and supporting evidence, and none are surfaced without a human-reviewable basis.
- **SC-009**: Each of the six defined roles (CEO, CMO, Marketing Manager, Performance Marketer, Content Manager, Finance) can access a dashboard scoped to its defined focus areas with financial/customer-level detail correctly withheld from unauthorized roles, verified through access-control testing.
- **SC-010**: 100% of historical-reprocessing runs that alter previously reported figures pass through an impact preview and explicit approval step before results are committed, with zero unapproved retroactive changes to finalized figures.

## Assumptions

- **Overlap with Feature 028 (`attribution-roi-measurement`, Vol 14 Part 1 Ch 15, `document 1/Document 1 (27).md`)**: The very next chapter in the source PRD is titled "Marketing Attribution Models, Revenue Impact & ROI Measurement System" and, by title, appears to re-specify ground already covered in this chapter's §16–§29 (attribution models, conversion definitions, revenue attribution, marketing ROI). [NEEDS CLARIFICATION: whether Chapter 15/feature 028 is a genuine deeper extension of attribution/ROI (analogous to how feature 037 extends into incrementality/MMM) or a redundant re-specification. Until clarified, this spec (027) is treated as the canonical owner of the core event-tracking, identity-resolution, seven-model attribution engine, revenue/ROI calculation, and executive/role-based dashboard capabilities; feature 028's spec must cross-reference this one rather than duplicate FR-025–FR-040.]
- **Overlap with Feature 037 (`enterprise-attribution-mmm`, Vol 14 Part 2 Ch 4, `document 1/Document 1 (36).md`)**: Chapter 4 of Part 2 ("Enterprise Marketing Attribution, Incrementality Measurement, Media Mix Modeling & Revenue Intelligence Platform") explicitly positions itself as the platform's official source of truth for marketing performance and revenue contribution, extending this chapter's rule-based/data-driven attribution with incrementality testing, controlled experiments, media mix modeling, and privacy-safe aggregate measurement. This spec (027) owns the customer-level, rule-based/data-driven attribution engine, the seven standard attribution models, the event-tracking/identity-resolution foundation, and the executive/role-based dashboards described in this chapter; feature 037 owns incrementality/MMM/experiment-based measurement and should reference this spec's Tracked Event, Attribution Model, and Attribution Window entities as its data foundation rather than redefining them.
- Event tracking depends on a platform-wide consent management system (per Constitution Article VI) already capturing per-channel, versioned consent that this module reads at ingestion time; this spec does not redefine consent capture, only its enforcement within analytics processing.
- Identity resolution assumes a unified customer identity/account system (per Volume 3 authentication/identity) already exists as the anchor for "known" customer IDs; this spec covers connecting anonymous activity to that identity, not the identity system itself.
- Role-based access control (Organization → Department/Team → Role → Permission Group → Permission, per Constitution Article VII) is assumed to be provided by a platform-wide RBAC service; this spec defines the analytics-specific permission categories (FR-071) that plug into it, not the RBAC engine itself.
- Finance-approved cost data (FR-038, FR-039) is assumed to originate from or be reconciled against the Membership, Payments & Revenue Operations system (Volume 9); this spec covers importing/synchronizing that cost data into marketing ROI calculations, not the finance system's own ledger/invoicing logic.
- The chapter's "Data-Driven Attribution" and "AI-Generated Insights/Executive Narrative" capabilities are assumed to run on the platform-wide AI Assistant/AI service layer (Volume 8) and are therefore subject to Constitution Article II (AI Is Assistive, Never Autonomous) — server-side-only execution, mandatory human review before financial/executive use, and a deterministic fallback (e.g., rule-based attribution and templated summaries) when AI is unavailable.
- Default attribution-window and position-based weighting values (e.g., 7-day lead window, 30-day membership window, 40/40/20 position-based split) given in the source as illustrative examples are treated as configurable defaults, not fixed system behavior — administrators can override per FR-030, FR-033, FR-035, FR-036.
- "External industry benchmarks" (§45) and the chapter's "Future Enhancements" list (autonomous marketing analyst, natural-language queries, voice reporting, causal impact analysis, autonomous budget reallocation, etc.) are explicitly out of scope for this spec's current requirements and are noted only as roadmap context, not committed capabilities.
