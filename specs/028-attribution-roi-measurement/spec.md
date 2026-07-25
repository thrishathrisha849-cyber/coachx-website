# Feature Specification: Marketing Attribution, Revenue Impact & ROI Measurement

**Feature Branch**: `028-attribution-roi-measurement`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 – Part 1 – Chapter 15: Marketing Attribution Models, Revenue Impact & ROI Measurement System (source: `document 1/Document 1 (27).md`) — determine how marketing activities contribute to leads, conversions, purchases, subscriptions, renewals and long-term customer value; connect marketing touchpoints with measurable financial outcomes; distribute conversion/revenue credit across campaigns, channels, assets and journeys while preventing duplicate revenue credit and misleading ROI reporting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply a Multi-Touch Attribution Model to a Customer Journey (Priority: P1)

A marketing analyst selects a conversion (e.g., a membership purchase) and views how credit for that conversion's revenue is distributed across the customer's eligible touchpoints under a chosen model — U-shaped, W-shaped, Full-Path, Markov Chain, or Shapley Value — seeing the resulting attribution percentage, attributed revenue, and a plain-language explanation of why each touchpoint received its share.

**Why this priority**: Attribution modeling is the core function this entire chapter exists to deliver — every other capability (ROI, CAC, CLV, dashboards, AI recommendations) is built on top of correctly distributed attribution credit. Without correct model output, every downstream financial number is wrong.

**Independent Test**: Can be fully tested by taking a customer journey with 4+ eligible touchpoints and one conversion of known revenue, running it through each of the standard models (first-touch, last-touch, linear, position-based, time-decay, U-shaped, W-shaped, full-path) and the advanced models (data-driven, Markov Chain, Shapley Value), and verifying that (a) each model's attributed revenue sums to no more than the eligible conversion revenue and (b) the per-touchpoint credit, weight, and explanation match the model's defined logic.

**Acceptance Scenarios**:

1. **Given** a conversion with 4 eligible touchpoints and ₹10,000 in conversion revenue, **When** the Linear attribution model is applied, **Then** each touchpoint receives 25% credit and ₹2,500 attributed revenue, and the total attributed revenue equals the eligible conversion revenue.
2. **Given** a conversion with a first touchpoint, a lead-creation touchpoint, and 3 middle touchpoints, **When** the U-shaped model with default weighting is applied, **Then** the first touch and lead-creation touch each receive 40% credit and the remaining 20% is distributed across the other eligible touchpoints.
3. **Given** a customer journey with first touch, lead creation, opportunity creation, and final conversion touchpoints, **When** the W-shaped or Full-Path model is applied, **Then** each configured milestone receives its configured share and remaining credit is distributed among intermediate interactions.
4. **Given** a set of converting and non-converting historical journeys, **When** the data-driven, Markov Chain, or Shapley Value model is run, **Then** the system displays contribution/removal-effect/marginal-contribution scores, a confidence score, model coverage, and an explicit warning that the result is not causal evidence unless validated through incrementality testing.

---

### User Story 2 - Calculate CAC, CLV, ROAS, Marketing ROI and Payback Period (Priority: P1)

A performance marketer or finance analyst selects a campaign, channel, or cohort and views its Customer Acquisition Cost, Customer Lifetime Value, Return on Ad Spend, Marketing ROI, CLV-to-CAC ratio, and payback period — each clearly labeled with its revenue basis, included/excluded costs, currency, attribution model, and reporting period.

**Why this priority**: These are the financial metrics executives and finance teams use to decide whether to increase, reduce, or stop marketing investment. Incorrect or ambiguous versions of these numbers directly cause bad budget decisions and destroy trust between marketing and finance — this is P1 alongside attribution modeling itself.

**Independent Test**: Can be fully tested by feeding a known set of marketing costs and resulting customers/revenue into the system for one campaign, and verifying that Blended CAC, Paid CAC, ROAS (gross/net/contribution-margin basis), Marketing ROI, CLV, CLV-to-CAC ratio, and payback period all compute to the expected values given the documented formulas, with the revenue basis and included costs visibly labeled on every result.

**Acceptance Scenarios**:

1. **Given** approved acquisition costs and a defined "new customer" qualification rule for a reporting period, **When** CAC is calculated, **Then** the system produces Blended CAC, Paid CAC, Organic CAC, and Channel/Campaign/Segment/Product/Region CAC as configured, each showing the reporting period and treatment of shared costs used.
2. **Given** a customer cohort with historical purchase, renewal, and refund data, **When** CLV is calculated, **Then** both historical and predicted CLV are shown, broken down by customer, cohort, campaign, channel, segment, product, plan, geography, and acquisition month, with a warning shown when predicted CLV is based on insufficient historical data.
3. **Given** attributed revenue and ad spend for a campaign, **When** ROAS is calculated, **Then** the system displays gross-revenue, net-revenue, and contribution-margin ROAS with the selected revenue basis visible in the report.
4. **Given** CAC and CLV for a cohort, **When** the CLV-to-CAC ratio and payback period are calculated, **Then** the system shows acquisition cost, cumulative revenue/margin, break-even date, expected vs. actual payback duration, and flags customers not yet recovered.

---

### User Story 3 - Move an Attribution Result Through Finalization States (Preliminary → Finance Reviewed → Finalized/Locked) (Priority: P1)

A finance reviewer inspects a period's preliminary attribution results, reconciles them against payment and finance records, and finalizes the period. Once finalized, the period's attribution results and the attribution model version used are locked against modification; any later correction requires a documented reason, approval, audit log entry, and an explicit recalculation record rather than a silent edit.

**Why this priority**: This directly implements Constitution Article IV (Historical Immutability) — attribution-model assignments are financial records that other teams (finance, executives, affiliates/commissions) rely on. Without an enforced finalization/lock workflow, historical reports could silently change underneath decisions already made, which is an audit and trust failure at the same severity as a payments bug.

**Independent Test**: Can be fully tested by running an attribution calculation to "Calculated" status, submitting it for finance review, finalizing it, then attempting a direct edit to the finalized period (which must be blocked) and instead performing a governed "Reopen → Corrected" flow with a required reason/approver, verifying the original finalized snapshot and the correction are both preserved and auditable.

**Acceptance Scenarios**:

1. **Given** a newly calculated attribution result, **When** it moves through Preliminary → Processing → Calculated → Under review → Finance reviewed → Finalized, **Then** each state transition is recorded and only an authorized finance role can move a result into "Finalized."
2. **Given** a Finalized attribution period, **When** any user attempts a direct modification, **Then** the system rejects the modification and requires the Reopen workflow instead.
3. **Given** a Finalized period is Reopened for correction, **When** the correction is submitted, **Then** the system requires a reason, an approval, an audit log entry, the model version used, and a recalculation record before the corrected result can be re-finalized.
4. **Given** a Finalized report that referenced Model Version 3, **When** the attribution model is later recalibrated to Version 4, **Then** the Finalized report continues to display and be traceable to Model Version 3, not the new version.

---

### User Story 4 - Prevent Revenue Double-Counting and Adjust Attribution on Refund or Cancellation (Priority: P1)

The system ensures that a single transaction's attributed revenue, when distributed across multiple touchpoints under a multi-touch model, never sums to more than the eligible conversion's actual revenue — and that when a transaction is later refunded, cancelled, or charged back, both the original attributed revenue and an adjusted net attributed revenue are retained and reflected in financial reports.

**Why this priority**: Revenue double-counting and stale post-refund attribution are named as the top two risks in the source chapter's own risk table, and they directly produce misleading ROI/ROAS numbers that could drive real budget decisions — this is a P1 financial-integrity requirement, not a nice-to-have.

**Independent Test**: Can be fully tested by attributing one ₹10,000 conversion across 5 touchpoints under a multi-touch model (confirming the sum equals ₹10,000, not more), then issuing a partial refund of ₹4,000 on the underlying transaction and confirming the system retains the original ₹10,000 attribution record while producing an adjusted net attributed revenue of ₹6,000 that financial reports use by default.

**Acceptance Scenarios**:

1. **Given** a conversion with a known transaction ID, order ID, and customer ID, **When** attribution is calculated under any multi-touch model, **Then** the deduplication engine ensures total attributed revenue across that model does not exceed the eligible conversion value.
2. **Given** a fully refunded transaction that already has finalized attribution, **When** the refund event is processed, **Then** the system preserves the original attributed revenue record and creates an adjusted net attributed revenue record, without deleting the original.
3. **Given** a subscription that experiences a chargeback after its attribution was finalized, **When** financial reports are generated, **Then** they default to adjusted net attributed revenue unless a user explicitly requests the original/gross basis.
4. **Given** a partial refund on one line item of a multi-item order, **When** attribution is recalculated, **Then** only the refunded portion's attributed revenue is adjusted, and the unaffected line items' attribution remains unchanged.

---

### User Story 5 - Run an Incrementality Holdout-Group Test (Priority: P2)

A performance marketer sets up a holdout-group or geographic-holdout test for a campaign, defining a treatment group (exposed to marketing) and a control group (withheld), then reviews incremental conversions, incremental revenue, incremental cost, incremental ROI, confidence interval, and statistical significance once the test concludes.

**Why this priority**: Incrementality testing is explicitly what separates "revenue merely associated with marketing" from "revenue actually caused by marketing," and the source chapter treats data-driven/algorithmic attribution as unreliable causal evidence unless validated this way — it's essential to trustworthy ROI but is a secondary, campaign-level capability compared to core attribution and finalization.

**Independent Test**: Can be fully tested by configuring a holdout-group experiment on a single campaign with a defined treatment/control split, running it for its configured duration, and confirming the resulting report shows treatment group, control group, incremental conversions/revenue/cost/ROI, confidence interval, statistical significance, and any stated experiment limitations.

**Acceptance Scenarios**:

1. **Given** a campaign eligible for incrementality testing, **When** a holdout-group or audience-control-group experiment is configured, **Then** the system defines and enforces a treatment group and a control group that do not overlap in campaign exposure.
2. **Given** a completed holdout test, **When** the incrementality report is generated, **Then** it shows incremental conversions, incremental revenue, incremental cost, incremental ROI, confidence interval, statistical significance, and explicit experiment limitations.
3. **Given** a geographic holdout or difference-in-differences test, **When** results are computed, **Then** the system labels the method used (holdout groups, geographic holdouts, randomized controlled test, pre/post comparison, difference-in-differences, causal impact modeling) so results from different methods are not silently compared as equivalent.
4. **Given** a control-group member is later found to have been inadvertently exposed to the campaign (contamination), **When** this is detected, **Then** the affected result must be flagged and excluded or corrected rather than silently included in the final incrementality calculation. [NEEDS CLARIFICATION: source does not specify a formal contamination-detection or exclusion procedure — this scenario extends the source's stated risk list with a plausible expected behavior]

---

### User Story 6 - Receive and Approve an AI ROI Intelligence Budget Recommendation (Priority: P2)

The AI ROI Intelligence Engine analyzes campaign cost, attributed and incremental revenue, customer quality/CLV, payback period, channel saturation, attribution uncertainty, and budget utilization, then surfaces a recommendation (e.g., "shift budget toward high-CLV segment X") with supporting evidence, expected financial impact, confidence score, and risk level. A human with the required role approves, modifies, or rejects the recommendation before any budget change takes effect.

**Why this priority**: This is the AI-assisted decision layer built on top of the P1 attribution/financial foundation — valuable for efficiency but explicitly required by Constitution Article II (AI Is Assistive, Never Autonomous) to never execute on its own, making it a P2 enhancement rather than a foundational capability.

**Independent Test**: Can be fully tested by feeding the AI ROI Intelligence Engine a scenario with a clearly underperforming channel and a clearly high-CLV segment, confirming it generates a recommendation with evidence, expected impact, confidence score, and risk level, and confirming that no budget or spend configuration actually changes until an authorized human explicitly approves the recommendation.

**Acceptance Scenarios**:

1. **Given** sufficient campaign, revenue, and CLV data, **When** the AI ROI Intelligence Engine runs, **Then** it may recommend actions such as increasing/reducing campaign budget, pausing a low-margin campaign, shifting budget toward high-CLV segments, extending a profitable campaign, or testing a new attribution model — each with supporting evidence, expected financial impact, confidence score, risk level, and the specific approval required.
2. **Given** an AI-generated budget recommendation, **When** it is presented to an authorized user, **Then** no budget allocation or spend change is executed until that user explicitly approves it.
3. **Given** an approved AI recommendation is executed, **When** the audit log is reviewed, **Then** it shows the recommendation, the evidence, the approver, and the effective change.
4. **Given** an AI recommendation is based on attribution results with low confidence or low data coverage, **When** it is displayed, **Then** the low-confidence/low-coverage warning is shown alongside the recommendation rather than presenting it with false certainty.

---

### User Story 7 - Compare and Simulate Attribution Models Before Activation (Priority: P2)

An authorized analyst compares two or more attribution models (e.g., last-touch vs. U-shaped) side by side for the same period, seeing revenue-by-channel, revenue-by-campaign, conversion credit, and CAC/ROI differences, with an explanation of why results differ — and can simulate a new or custom model against historical data (seeing campaign winners/losers, ROI changes, and budget implications) before it is ever activated for live reporting.

**Why this priority**: Model comparison and simulation directly support the source chapter's stated purpose of helping stakeholders pick "which attribution model is most appropriate for a specific business objective," and prevents an org from activating a miscalibrated custom model — but it is a supporting/governance capability layered on top of the P1 core attribution engine.

**Independent Test**: Can be fully tested by running the same historical period through two different standard models, confirming the comparison view shows revenue/credit/CAC/ROI differences per model plus an explanation of the variance, and separately confirming that simulating a draft custom model against historical data produces a preview report that does not alter any finalized report.

**Acceptance Scenarios**:

1. **Given** two attribution models applied to the same reporting period, **When** a user opens the comparison view, **Then** it shows revenue by channel, revenue by campaign, conversion credit, assisted-conversion credit, first-touch credit, last-touch credit, model variance, budget-recommendation changes, CAC, and ROI for each model, with an explanation of why the results differ.
2. **Given** a draft custom rule-based attribution model, **When** an authorized user runs a simulation, **Then** the system shows historical revenue redistribution, campaign winners/losers, channel-level changes, ROI changes, budget implications, unattributed revenue, processing requirements, data coverage, and model risks — without modifying any finalized report.
3. **Given** a custom model has been simulated and approved, **When** it is versioned and activated, **Then** it receives a model ID, version number, effective date, created-by, approved-by, and change reason, and existing finalized reports continue to reference the model version originally used at calculation time.
4. **Given** an activated model needs to be rolled back, **When** an authorized user triggers rollback, **Then** the system reverts to the prior model version using the stored rollback reference and records the change in the audit log.

---

### User Story 8 - Import, Allocate and Reconcile Marketing Costs Against Finance Records (Priority: P3)

A marketing operations user imports campaign spend from advertising platforms, vendor invoices, and manual entries; allocates indirect/shared costs across campaigns using a configured method (spend share, revenue share, lead volume, etc.); and reconciles the resulting marketing cost data against finance ledger totals before it is allowed to feed into finalized ROI reports.

**Why this priority**: Accurate, reconciled cost data is a prerequisite for every ROI/ROAS/CAC number to be trustworthy, but it is an operational/data-ingestion capability that supports the P1 financial-formula story rather than being independently the highest-value user journey.

**Independent Test**: Can be fully tested by importing a sample advertising-platform spend file and a manual cost entry, allocating a shared indirect cost across three campaigns by revenue share, and confirming the reconciliation status (Unverified → Imported → Matched/Partially matched → Approved/Disputed → Finalized) correctly blocks unapproved cost data from being used in a finalized ROI report.

**Acceptance Scenarios**:

1. **Given** direct costs (ad spend, messaging costs, affiliate commission, influencer payment, event sponsorship) and indirect costs (agency fees, software, employee allocation), **When** they are recorded, **Then** each cost entry stores cost category, vendor, amount, currency, tax, effective date, cost center, payment status, approval status, and data source.
2. **Given** a shared indirect cost across multiple campaigns, **When** it is allocated, **Then** the user can choose an allocation method (campaign spend, revenue share, lead volume, conversion volume, channel usage, time period, team allocation, manual percentage) and the chosen method is visible on the resulting per-campaign cost.
3. **Given** imported marketing spend, **When** reconciliation runs against vendor invoices, payment records, and finance systems, **Then** the cost record's status progresses through Unverified, Imported, Matched, Partially matched, Approved, Disputed, or Finalized.
4. **Given** a cost record that is still "Disputed" or "Unverified," **When** a finalized ROI report is generated for that period, **Then** the disputed/unverified cost is excluded from the finalized figure unless an authorized user has explicitly permitted its use, and this exclusion is visible in the report.

---

### Edge Cases

- What happens when a multi-touch model's per-touchpoint credit, summed across all eligible touchpoints for one conversion, would exceed the eligible conversion's actual revenue due to a rounding or configuration error? The deduplication engine must cap total attributed revenue at the eligible conversion value.
- What happens when a member of an incrementality test's control group is inadvertently exposed to the campaign being tested (holdout-group contamination)? The affected observation must be flagged, and the incrementality result must not silently include contaminated data as if the holdout was clean.
- What happens when a Finalized and locked attribution period is later disputed by finance after downstream decisions (budget changes, commission payouts) have already been made based on it? The correction must go through the Reopened → Corrected workflow with reason, approval, audit log, and an explicit recalculation record — the original Finalized snapshot must remain retrievable.
- What happens when the exchange rate used to convert marketing cost (in one currency) and revenue (in another) drifts between the transaction date and the reporting date, causing CAC/ROAS to shift for reasons unrelated to marketing performance? The system must use finance-approved, traceable, and consistent exchange-rate rules and log which rate/date was applied.
- What happens when a transaction that already has finalized, dual-currency attribution is later refunded in a currency-conversion-sensitive way (e.g., refunded amount converted at a different rate than the original charge)? Both original and net-adjusted attributed revenue must remain distinguishable and auditable.
- What happens when a customer's journey spans a device change mid-journey and cross-device identity matching is only probabilistic (not deterministic)? The touchpoint must be labeled as probabilistically matched, and the customer's consent/privacy status must gate whether that touchpoint is even eligible for cross-device attribution.
- What happens when data-driven, Markov Chain, or Shapley Value attribution is run on a dataset with insufficient converting/non-converting journey volume? The system must surface a data-coverage warning and a lowered confidence score rather than presenting the result with the same certainty as a mature dataset.
- What happens when a recurring subscription renews and the organization's configured recurring-revenue attribution policy (original acquisition source vs. renewal campaign vs. most recent touchpoint vs. shared model) conflicts with a touchpoint that occurred just before renewal but was not eligible under the renewal-specific attribution window? The configured policy must be applied deterministically and be visible in the resulting report.
- What happens when bot traffic, click fraud, or a duplicate conversion is identified only after attribution has already been calculated (but before finalization)? The excluded record must remain available for audit but must not contribute to the finalized attribution or ROI calculation, and any preliminary result that included it must be recalculated.
- What happens when an attribution model is recalibrated (new version) while historical reports referencing the old version are still being actively used by finance or executives? Finalized reports must continue to display and be traceable to the model version that was actually in effect when they were calculated — the new version must not retroactively alter them.

## Requirements *(mandatory)*

### Core Entities & Data Model

- **FR-001**: System MUST maintain a Customer entity representing an identified or anonymous person, with customer ID, anonymous visitor ID, membership ID, lead ID, email hash, phone hash, device identifiers, organization ID, consent status, customer segment, first-seen date, first-conversion date, and customer status.
- **FR-002**: System MUST maintain a Touchpoint entity representing an eligible marketing interaction, with touchpoint ID, customer ID, session ID, campaign ID, channel ID, creative ID, content ID, source, medium, campaign name, interaction type, interaction timestamp, device, location, cost reference, eligibility status, attribution weight, attribution model, and touchpoint properties.
- **FR-003**: System MUST maintain a Conversion entity representing a measurable business outcome, with conversion ID, customer ID, conversion type, conversion timestamp, order/transaction ID, gross revenue, net revenue, currency, product, membership plan, refund status, attribution window, duplicate-check status, and reconciliation status.
- **FR-004**: System MUST maintain an Attribution Result entity representing credit assigned to a touchpoint, with attribution result ID, conversion ID, touchpoint ID, model ID, model version, attribution percentage, attributed revenue, attributed margin, calculation timestamp, confidence score, and finalization status.
- **FR-005**: System MUST maintain a Marketing Cost entity representing spend associated with a marketing activity, with cost ID, campaign ID, channel ID, cost category, vendor, cost amount, currency, tax, effective date, cost center, payment status, approval status, and data source.

### Touchpoint Collection, Eligibility & Attribution Windows

- **FR-006**: System MUST capture touchpoints from paid search, display, and social ads; organic search; direct visits; referral traffic; affiliate links; referral invitations; email, SMS, WhatsApp, and push campaigns; community posts; webinars; events; landing pages; forms; ebook downloads; podcast interactions; course previews; AI assistant conversations; sales conversations; support interactions; offline campaigns; QR codes; and partner campaigns, and MUST timestamp and link every touchpoint to available campaign, channel, content, and customer identifiers.
- **FR-007**: System MUST let administrators define touchpoint eligibility rules based on interaction type, channel, campaign, customer consent, conversion type, attribution window, minimum engagement, fraud status, bot classification, session quality, geographic restrictions, device eligibility, internal employee exclusion, and test account exclusion, and MUST never grant attribution credit to internal administrative activity.
- **FR-008**: System MUST support engagement quality levels — Passive, Low, Medium, High, Conversion Assist, and Conversion — and MUST allow the attribution engine to use engagement quality as an input for weighted or algorithmic models.
- **FR-009**: System MUST support configurable attribution windows (same session, 1, 3, 7, 14, 30, 60, 90, 180, 365 days, and custom duration), configurable independently by conversion type, product, membership plan, channel, campaign, customer segment, and business unit.
- **FR-010**: System MUST distinguish between click-through attribution windows, view-through attribution windows, lead-to-conversion windows, conversion-to-renewal windows, and re-engagement windows.

### Conversion Definition & Revenue Classification

- **FR-011**: System MUST let authorized administrators define conversion events across lead conversions (form submission, contact request, consultation request, demo booking, webinar registration, newsletter subscription, lead qualification, sales-qualified lead creation), transaction conversions (course, ebook, event ticket, membership, subscription, product, marketplace purchase), recurring revenue conversions (subscription/membership renewal, plan upgrade/downgrade, additional seat, recurring service payment), and engagement conversions (course completion, referral invitation/success, community activation, podcast/ebook completion, reward redemption).
- **FR-012**: System MUST require every conversion definition to include name, event condition, conversion value, revenue field, eligible customer type, attribution model, attribution window, duplicate-conversion rule, refund handling, active status, and effective date.
- **FR-013**: System MUST support conversion value types of fixed value, transaction-based value, estimated value, predicted lifetime value, no monetary value, and finance-approved value, and MUST clearly separate estimated values from realized revenue in all reports.
- **FR-014**: System MUST classify revenue into gross, net, collected, recognized, deferred, recurring, renewal, upgrade, cross-sell, upsell, referral, attributed, influenced, incremental, unattributed, refunded, and cancelled revenue, and every report MUST clearly indicate which revenue basis is being used.
- **FR-015**: System MUST distinguish directly attributed revenue, marketing-influenced revenue (an eligible touchpoint occurred within the influence window), sales-sourced revenue, partner-sourced revenue, and unattributed revenue, and MUST prevent these categories from being incorrectly added together in reports.

### Attribution Models

- **FR-016**: System MUST support First-Touch attribution (100% credit to the first eligible touchpoint) with original acquisition-source preservation, anonymous first-touch tracking, cross-device first-touch reconciliation, configurable direct-traffic treatment, and historical first-touch retention.
- **FR-017**: System MUST support Last-Touch attribution (100% credit to the final eligible touchpoint) with configurable variants — last non-direct touch, last paid touch, last campaign touch, last marketing-qualified touch, last sales-assisted touch — and a configurable lookback period.
- **FR-018**: System MUST support Lead-Creation attribution, assigning credit to the touchpoint responsible for creating the lead record, and MUST preserve that lead-creation attribution even when the lead later converts through a different campaign.
- **FR-019**: System MUST support Opportunity-Creation attribution, assigning credit to touchpoints associated with creating a qualified sales opportunity, using inputs such as marketing-qualified-lead activity, sales-qualified-lead transition, demo request, proposal request, consultation completion, sales meeting, and account-level engagement.
- **FR-020**: System MUST support Linear attribution, distributing equal credit among all eligible touchpoints (by touchpoint, channel, or campaign), with duplicate-touchpoint consolidation and minimum-engagement requirements.
- **FR-021**: System MUST support Position-Based attribution with a default of 40% to the first touchpoint, 40% to the last touchpoint, and 20% distributed among middle touchpoints, with administrator-configurable first/last/middle percentages and defined treatment of one-touch and two-touch journeys.
- **FR-022**: System MUST support Time-Decay attribution, assigning more credit to touchpoints closer to conversion, with configurable attribution window, half-life period, minimum touchpoint weight, maximum lookback, eligible channels, and event-quality weighting, and MUST display touchpoint age, decay factor, final assigned weight, attributed revenue, and a model explanation.
- **FR-023**: System MUST support U-Shaped attribution emphasizing the first touchpoint and the lead-creation touchpoint (default 40% / 40% / 20% across remaining touchpoints).
- **FR-024**: System MUST support W-Shaped attribution emphasizing first touch, lead creation, and opportunity creation, with a configurable share assigned to each milestone and remaining credit distributed among other eligible touchpoints.
- **FR-025**: System MUST support Full-Path attribution covering first touch, lead creation, opportunity creation, and customer conversion, with configurable credit per milestone and the remainder distributed among intermediate interactions.
- **FR-026**: System MUST let authorized administrators create Custom Rule-Based attribution models using rules including channel priority, campaign priority, touchpoint position, engagement quality, time proximity, customer segment, product category, lead score, conversion value, sales involvement, offline interaction, device type, and geographic region, with support for draft creation, simulation, approval workflow, versioning, effective dates, historical recalculation, rollback, and comparison against standard models.
- **FR-027**: System MUST support a Data-Driven Attribution engine that analyzes historical converting and non-converting journeys to estimate each touchpoint's contribution using inputs such as touchpoint sequence, channel, campaign, creative, engagement type, time between events, customer segment, device, geography, conversion value, customer history, lead score, purchase history, and sales activity, producing touchpoint/channel/campaign contribution scores, conversion-probability change, confidence score, model coverage, training date, model version, and an explanation summary — and MUST NOT present these results as absolute causal evidence unless validated through incrementality testing.
- **FR-028**: System MAY support Markov Chain attribution, evaluating the removal effect of channels or touchpoints (how conversion probability changes when a touchpoint is removed from observed paths), producing transition probabilities, removal effect, channel contribution, path frequency, conversion probability, model confidence, and a data-coverage warning, restricted to authorized analytics users.
- **FR-029**: System MAY support Shapley Value attribution, analyzing channel combinations to estimate marginal contribution and distribute conversion value, providing computational limits, confidence indicators, and an explanation of model assumptions, with approximation methods permitted for high-volume datasets.
- **FR-030**: System MUST support View-Through attribution, measuring conversions after an impression without a recorded click, with configurable eligible channels, viewability requirement, minimum exposure duration, impression frequency limit, view-through window, priority against click-through attribution, and fraud/bot filtering, and MUST display view-through revenue separately from click-through revenue unless explicitly combined.
- **FR-031**: System MUST identify Assisted Conversions — touchpoints that influenced a conversion without receiving final-touch credit — and report assisted conversions, direct conversions, assist-to-final ratio, assisted revenue, final-touch revenue, average position in journey, and average time before conversion.
- **FR-032**: System MUST support Cross-Device attribution connecting eligible journeys across desktop, mobile web, Android app, iOS app, tablet, and multiple browsers, using deterministic identity links (authenticated customer ID, verified email/phone, membership ID) or approved probabilistic signals, with probabilistic matches clearly labeled and governed by privacy controls.
- **FR-033**: System MUST support Offline attribution for physical events, business meetups, retail interactions, telephone calls, direct sales visits, printed advertisements, offline referral programs, QR code campaigns, and manual lead imports, linked via customer ID, phone, email, referral code, coupon code, QR code, event registration ID, or sales opportunity ID.
- **FR-034**: System MUST support Account-Based attribution for enterprise/business accounts, aggregating interactions from multiple contacts belonging to the same organization and tracking account ID, contact roles, buying committee, account-level engagement, opportunity value, account conversion, account revenue, influential contacts, and influential campaigns.

### Revenue Integrity — Deduplication, Refunds, Recurring & Lifetime Attribution

- **FR-035**: System MUST prevent duplicate revenue attribution using deduplication rules based on transaction ID, order ID, subscription ID, payment reference, conversion ID, customer ID, product ID, conversion timestamp, and refund status, and MUST ensure that a single revenue transaction, while distributable across multiple touchpoints, never produces total attributed revenue exceeding the eligible conversion value within one model.
- **FR-036**: System MUST update attribution results on full refund, partial refund, subscription cancellation, chargeback, failed renewal, order adjustment, and product return, retaining both the original attributed revenue and an adjusted net attributed revenue, and financial reports MUST default to adjusted net revenue unless otherwise configured.
- **FR-037**: System MUST support recurring revenue attribution for initial subscription acquisition, monthly/annual renewals, plan upgrades/downgrades, reactivations, and add-on purchases, with the organization able to configure whether recurring revenue credits the original acquisition source, the renewal campaign, the most recent eligible touchpoint, a shared acquisition-and-retention model, or a custom recurring-revenue model.
- **FR-038**: System MUST measure lifetime revenue generated by customers acquired through each campaign/channel — including initial purchase, repeat purchases, renewals, upgrades, cross-sells, upsells, referral-generated revenue, refunds, and churn — and MUST compare first-30-day, first-90-day, first-year, total lifetime, and predicted lifetime revenue.

### Marketing Cost Allocation & Spend Reconciliation

- **FR-039**: System MUST support direct marketing costs (advertisement spend, messaging costs, affiliate commission, influencer payment, event sponsorship, campaign production, lead-purchase costs) and indirect marketing costs (agency fees, marketing software, employee allocation, creative team costs, data provider costs, platform infrastructure, consulting costs, shared operational costs).
- **FR-040**: System MUST allocate shared marketing costs by campaign spend, revenue share, lead volume, conversion volume, channel usage, time period, team allocation, or manual percentage, and MUST make the chosen allocation method visible on the resulting per-campaign cost.
- **FR-041**: System MUST reconcile marketing spend against advertising platforms, vendor invoices, payment records, finance systems, purchase orders, agency reports, and manual cost entries, tracking reconciliation status as Unverified, Imported, Matched, Partially matched, Approved, Disputed, or Finalized, and MUST use only Approved or explicitly permitted cost data in finalized ROI reports.

### Financial Formulas & Metrics

- **FR-042**: System MUST calculate Return on Ad Spend as gross-revenue ROAS, net-revenue ROAS, contribution-margin ROAS, and by channel, campaign, creative, audience, product, and cohort, with the selected revenue basis visible in every report.
- **FR-043**: System MUST calculate Marketing ROI as revenue-based, gross-profit, contribution-margin, incremental, lifetime-value, campaign, channel, product, regional, and portfolio ROI, and every ROI result MUST display revenue basis, included costs, excluded costs, attribution model, attribution window, reporting period, currency, data freshness, and approval status.
- **FR-044**: System MUST calculate Contribution Margin using net revenue, product cost, payment-processing fees, delivery costs, support costs, partner commissions, refunds, variable service costs, and marketing costs, to prevent high-revenue but low-profit campaigns from being classified as successful.
- **FR-045**: System MUST calculate Customer Acquisition Cost as Blended, Paid, Organic, Channel, Campaign, Segment, Product, Region, New-Customer, and Reactivation CAC, with administrators configuring eligible acquisition costs, customer qualification rules, reporting period, new-customer definition, and treatment of shared costs.
- **FR-046**: System MUST calculate cost efficiency across the funnel — cost per impression, click, landing-page visit, form submission, lead, qualified lead, sales-qualified lead, opportunity, customer, renewal, and referral — supporting campaign, channel, audience, and product comparisons.
- **FR-047**: System MUST calculate historical and predicted Customer Lifetime Value from average order value, purchase frequency, subscription value, renewal probability, retention duration, gross margin, refund behavior, service costs, referral contribution, and churn probability, available by customer, cohort, campaign, channel, segment, product, membership plan, geography, and acquisition month.
- **FR-048**: System MUST calculate the CLV-to-CAC ratio, displaying historical CLV, predicted CLV, blended CAC, paid CAC, the ratio itself, payback period, cohort comparison, target range, and risk classification, and MUST warn users when predicted CLV is based on insufficient historical data.
- **FR-049**: System MUST calculate Payback Period at customer, cohort, campaign, channel, subscription, and contribution-margin levels, showing acquisition cost, cumulative revenue, cumulative margin, break-even date, expected payback date, actual payback duration, and customers not yet recovered.

### Incrementality Measurement

- **FR-050**: System MUST support incrementality measurement methods including holdout groups, geographic holdouts, audience control groups, campaign suppression groups, randomized controlled tests, pre-and-post comparisons, difference-in-differences analysis, and causal impact modeling.
- **FR-051**: System MUST produce incrementality reports showing treatment group, control group, incremental conversions, incremental revenue, incremental cost, incremental ROI, confidence interval, statistical significance, and experiment limitations.

### Marketing Mix Modeling

- **FR-052**: System MAY support Marketing Mix Modeling (future/advanced enterprise capability) using inputs including channel spend, revenue, seasonality, promotions, pricing, economic conditions, geographic differences, brand activity, competitive signals, offline marketing, and product launches.
- **FR-053**: Where Marketing Mix Modeling is supported, system MUST produce channel contribution, diminishing returns, saturation curves, spend-response curves, optimal budget recommendations, and scenario simulations as outputs.

### Model Comparison, Simulation & Versioning

- **FR-054**: System MUST let users compare multiple attribution models for the same period across revenue by channel, revenue by campaign, conversion credit, assisted-conversion credit, first-touch credit, last-touch credit, model variance, budget-recommendation changes, CAC, and ROI, and MUST explain why results differ between models.
- **FR-055**: System MUST let authorized users simulate an attribution model before activation, showing historical revenue redistribution, campaign winners/losers, channel-level changes, ROI changes, budget implications, unattributed revenue, processing requirements, data coverage, and model risks, and simulation MUST NOT alter finalized reports.
- **FR-056**: System MUST version every attribution model with model ID, version number, model type, rule configuration, created-by, approved-by, effective date, end date, status, change reason, historical impact, and rollback reference, and MUST ensure existing finalized reports preserve the model version originally used.

### Attribution Finalization & Revenue Reconciliation

- **FR-057**: System MUST move attribution results through the states Preliminary, Processing, Calculated, Under review, Finance reviewed, Finalized, Reopened, and Corrected, and MUST lock Finalized attribution periods against unauthorized modification.
- **FR-058**: System MUST require a reason, approval, audit log entry, model version, and recalculation record for any historical correction to a Finalized attribution period.
- **FR-059**: System MUST reconcile attributed revenue against authoritative financial sources — marketing conversion records, payment gateway records, order records, subscription records, refund records, finance ledger totals, and recognized revenue.
- **FR-060**: System MUST produce reconciliation outputs including matched revenue, unmatched revenue, duplicate revenue, missing transactions, currency differences, timing differences, refund differences, and final reconciliation status.

### AI ROI Intelligence, Forecasting & Budget Optimization

- **FR-061**: System MUST run an AI ROI Intelligence Engine that analyzes campaign cost, attributed revenue, incremental revenue, conversion trends, customer quality, customer lifetime value, payback period, channel saturation, attribution uncertainty, and budget utilization.
- **FR-062**: System MUST generate AI recommendations limited to the defined action set — increase campaign budget, reduce channel spending, pause low-margin campaigns, shift budget toward high-CLV segments, extend a profitable campaign, improve retention campaigns, test a new attribution model, investigate revenue mismatches, review abnormal acquisition costs — each with supporting evidence, expected financial impact, confidence score, risk level, recommended action, and required approval, and MUST NOT execute any recommendation without explicit human approval (per Constitution Article II).
- **FR-063**: System MUST forecast campaign revenue, campaign cost, ROAS, marketing ROI, CAC, CLV, payback period, incremental revenue, budget utilization, and profit contribution, with expected, best, worst, reduced-budget, increased-budget, and channel-reallocation scenarios, and MUST display assumptions and confidence ranges on every forecast.
- **FR-064**: System MUST recommend budget allocation across channels, campaigns, audience segments, products, regions, funnel stages, and acquisition/retention programs against objectives including maximize revenue, maximize profit, maximize qualified leads, minimize CAC, improve payback period, increase lifetime value, maintain minimum brand investment, and stay within risk limits — and MUST require human approval before any budget change is executed.
- **FR-065**: System MUST let users create financial scenarios by adjusting total marketing budget, channel allocation, conversion rate, average order value, CAC, retention rate, membership price, discount level, refund rate, gross margin, and attribution model, and MUST estimate resulting leads, customers, revenue, profit, ROI, payback period, CLV, and budget variance for each scenario.
- **FR-066**: System MUST let users configure alerts for attributed-revenue decline, ROI below target, acquisition-cost increase, ROAS decrease, refund spike, unattributed-revenue increase, attribution-processing failure, revenue reconciliation mismatch, model-confidence decrease, budget overspend, payback-period deterioration, and CLV-to-CAC ratio below threshold, deliverable via in-app notification, email, SMS, WhatsApp, push, collaboration tools, or webhook.

### Dashboards & Executive Intelligence

- **FR-067**: System MUST provide an Attribution Dashboard showing total conversions, total revenue, attributed revenue, influenced revenue, incremental revenue, unattributed revenue, top acquisition/assisting/closing channel, average touchpoints to conversion, average time to conversion, currently selected model, and data freshness, with channel attribution chart, campaign attribution table, customer journey paths, touchpoint-position analysis, assisted conversion matrix, revenue flow diagram, model comparison chart, and conversion lag distribution visualizations.
- **FR-068**: System MUST provide a Revenue Impact Dashboard showing marketing-attributed revenue, marketing-influenced pipeline, realized revenue, forecasted revenue, gross profit, contribution margin, revenue by channel/campaign/product/segment, recurring revenue contribution, renewal revenue contribution, and lifetime revenue by acquisition source.
- **FR-069**: System MUST provide an ROI Dashboard showing total marketing cost, attributed revenue, net revenue, gross profit, marketing ROI, ROAS, CAC, CLV, CLV-to-CAC ratio, payback period, cost per lead, cost per customer, incremental ROI, and budget utilization, supporting comparison against target, previous period, previous campaign, previous year, forecast, and organization benchmark.
- **FR-070**: System MUST provide an Executive Revenue Intelligence view showing marketing's contribution to company revenue and pipeline, revenue growth influenced by marketing, highest/lowest-return channels, budget-at-risk amount, revenue and profitability forecast, acquisition efficiency, retention contribution, major attribution changes, and recommended investment actions, plus a generated executive narrative summarizing what changed, why, financial impact, key risks, recommended decisions, and confidence level.

### Governance, RBAC, Approval Workflows & Audit

- **FR-071**: System MUST maintain governed definitions (with business owner, technical owner, calculation logic, effective date, approval status, and version history) for marketing touchpoint, conversion, customer, new customer, attributed revenue, influenced revenue, incremental revenue, marketing cost, CAC, CLV, ROAS, marketing ROI, payback period, gross margin, and contribution margin.
- **FR-072**: System MUST support role-based permissions covering view attribution dashboards, view customer-level journeys, view financial metrics, create models, simulate models, approve models, finalize attribution periods, manage costs, approve costs, export data, view reconciliation, reprocess history, manage ROI targets, and view executive intelligence, with customer-level and financial-level access separately controlled.
- **FR-073**: System MUST require approval workflows for new attribution models, model changes, historical recalculation, cost adjustments, revenue corrections, attribution-period finalization, budget recommendations, AI-generated financial actions, and export of sensitive data, with each approval record capturing requester, approver, submitted time, decision time, comments, previous value, new value, and effective date.
- **FR-074**: System MUST log model creation, modification, activation, and deactivation; conversion-definition changes; revenue adjustments; cost imports and approvals; historical recalculations; report exports; attribution finalization; reconciliation decisions; budget-recommendation approvals; and customer-level data access, and audit records MUST be immutable for the configured retention period.

### Privacy, Fraud, Multi-Currency & Tax

- **FR-075**: System MUST respect customer consent, tracking preferences, communication permissions, geographic privacy rules, data-retention policies, deletion requests, purpose limitations, and identity-resolution restrictions in attribution processing, and where individual attribution is not permitted MUST fall back to aggregated reporting, pseudonymized analysis, consent-mode estimation, or privacy-preserving measurement, with estimated results clearly labeled.
- **FR-076**: System MUST identify and exclude bot traffic, click fraud, duplicate conversions, self-referrals, internal employee traffic, test transactions, fake leads, invalid affiliate activity, abnormal device patterns, and suspicious geographic patterns from finalized attribution/ROI calculations, while retaining excluded records for audit.
- **FR-077**: System MUST support transaction currency, campaign cost currency, organization base currency, reporting currency, historical exchange rates, daily exchange rates, finance-approved exchange rates, and currency conversion audit logs, converting revenue and cost using consistent and traceable exchange-rate rules.
- **FR-078**: System MUST let administrators configure whether calculations include or exclude sales tax, goods and services tax, payment fees, marketplace commissions, affiliate commission, delivery fees, refund fees, and foreign exchange fees, with the selected treatment visible in financial reports.

### Integration, API, Performance & Scalability

- **FR-079**: System MUST integrate with the Customer Data Platform, CRM, Lead Management, Campaign Management, Email/SMS/WhatsApp Marketing, Push Notification System, Landing Page System, Workflow Engine, AI Marketing Assistant, A/B Testing Platform, Payment Gateway, Membership System, Referral System, Affiliate System, Finance System, Accounting System, Advertising Platforms, External Data Warehouse, and Business Intelligence Tools.
- **FR-080**: System MUST provide secure APIs to submit touchpoints and conversions, retrieve attribution results, retrieve campaign/channel ROI, retrieve customer journeys, submit marketing costs, retrieve reconciliation status, trigger approved recalculation, retrieve model definitions, and compare attribution models — governed by authentication, authorization, rate limiting, idempotency, request validation, audit logging, versioning, tenant isolation, and field-level permissions.
- **FR-081**: System MUST meet the defined performance targets: touchpoint processing under 60 seconds, standard conversion attribution under 30 seconds, dashboard initial load under 3 seconds, model comparison under 10 seconds, standard historical recalculation under 15 minutes, ROI dashboard filter update under 3 seconds, attribution API response under 2 seconds, alert generation under 5 minutes, and executive summary generation under 15 seconds.
- **FR-082**: System MUST scale to support millions of customers, billions of touchpoints, millions of conversions, thousands of campaigns, multiple attribution models, multiple organizations, multiple currencies, multiple time zones, large historical recalculations, and high-volume recurring revenue events, meeting defined availability targets (attribution dashboard 99.9%, touchpoint ingestion 99.95%, revenue matching 99.9%, ROI calculation 99.9%, reconciliation 99.5%) through retry processing, duplicate protection, dead-letter queues, processing checkpoints, backup, disaster recovery, calculation rollback, and failure alerts.

## Key Entities *(include if feature involves data)*

- **Customer**: An identified or anonymous person whose interactions are tracked across touchpoints and conversions; carries consent status and identity-resolution signals used for deterministic or probabilistic cross-device matching.
- **Touchpoint**: A single eligible marketing interaction (impression, click, email open, session, sales call, offline event, etc.) tied to a customer, campaign, channel, and creative, with an eligibility status and an attribution weight assigned by whichever model is active.
- **Conversion**: A measurable business outcome (lead, transaction, recurring revenue event, or engagement milestone) tied to a customer and, where applicable, an order/transaction ID, gross/net revenue, and refund status.
- **Attribution Result**: The computed credit (percentage, attributed revenue, attributed margin) linking one Conversion to one Touchpoint under a specific Attribution Model version, carrying its own confidence score and finalization status.
- **Marketing Cost**: A recorded spend item (direct or indirect) tied to a campaign/channel, with its own approval and reconciliation status, feeding CAC/ROAS/ROI calculations only once approved.
- **Attribution Model / Model Version**: The configured rule set (first-touch, last-touch, linear, position-based, time-decay, U/W/full-path, custom, data-driven, Markov Chain, Shapley Value) used to distribute conversion credit, versioned so that finalized reports remain traceable to the exact version used at calculation time.
- **Holdout Group / Treatment Group / Control Group**: The experiment-scoped audience partitions used in incrementality measurement (holdout groups, geographic holdouts, audience control groups, campaign suppression groups) to isolate causally incremental revenue from merely associated revenue.
- **Incrementality Experiment**: A configured causal-measurement run (method, treatment/control definition, duration) whose output is incremental conversions/revenue/cost/ROI with a confidence interval and stated limitations.
- **Reconciliation Record**: The comparison output between marketing conversion/cost records and authoritative finance sources (payment gateway, order, subscription, ledger), tracking matched/unmatched/duplicate/missing items and a final reconciliation status.
- **Approval Request**: The workflow instance required before a new model, model change, historical recalculation, cost adjustment, revenue correction, period finalization, or AI-generated budget action takes effect, capturing requester, approver, and decision.
- **AI Recommendation**: An AI ROI Intelligence Engine output (action, evidence, expected impact, confidence score, risk level) that requires human approval before any budget or spend configuration change is executed.
- **Audit Log Entry**: The immutable record of model, cost, revenue, reconciliation, finalization, and customer-data-access actions, retained for the configured retention period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of multi-touch attribution results, across every supported model, sum to a total attributed revenue that does not exceed the eligible conversion's revenue — zero instances of revenue double-counting in finalized reports.
- **SC-002**: 100% of Finalized attribution periods are locked against direct modification; every historical correction to a Finalized period is traceable to a reason, an approver, an audit log entry, and a recalculation record.
- **SC-003**: Refunds, cancellations, and chargebacks update net attributed revenue within the same processing cycle as the underlying financial event, with both original and adjusted net attribution values retained and distinguishable in every report.
- **SC-004**: ROAS, marketing ROI, CAC, CLV, CLV-to-CAC ratio, and payback period are available for every campaign/channel/cohort with revenue basis, included/excluded costs, attribution model, and currency visibly labeled on 100% of results.
- **SC-005**: Every incrementality experiment produces incremental conversions, incremental revenue, confidence interval, and statistical significance, with the measurement method (holdout, geo-holdout, RCT, diff-in-diff, etc.) explicitly labeled — no incrementality result is presented without its method and confidence interval.
- **SC-006**: 100% of AI ROI Intelligence recommendations display supporting evidence, expected financial impact, confidence score, and risk level, and 0% of recommended budget/spend changes are executed without explicit human approval.
- **SC-007**: Model comparison and simulation views are available for every standard and custom model, and simulating a draft model produces zero changes to any already-finalized report.
- **SC-008**: Marketing cost data used in a finalized ROI report is 100% traceable to an Approved (or explicitly permitted) reconciliation status; no Disputed or Unverified cost silently flows into a finalized figure.
- **SC-009**: Dashboard and API performance meet the stated targets (dashboard load under 3 seconds, conversion attribution under 30 seconds, model comparison under 10 seconds, API response under 2 seconds) at the stated scale (millions of customers, billions of touchpoints).
- **SC-010**: Excluded fraud/bot/invalid-traffic records are retained for audit but contribute to 0% of finalized attribution or ROI calculations.

## Assumptions

- **Relationship to feature 027 (marketing-analytics-attribution, Chapter 14)**: Chapter 14 ("Marketing Analytics, Attribution Modeling & Executive Intelligence Dashboard") defines the broader marketing analytics platform — data ingestion/warehouse, campaign/channel/funnel/cohort dashboards, a custom report builder, scheduled reporting, anomaly detection, and a lighter-weight attribution capability feeding those dashboards. This chapter (15) is the deep, finance-grade specialization: the full catalog of attribution models (including Markov Chain and Shapley Value), the finalization/lock state machine implementing Historical Immutability, the CAC/CLV/ROAS/ROI/payback-period formula library, incrementality testing, and AI ROI budget recommendations. Where both chapters describe "attribution models" or "ROI dashboards," this spec treats feature 027 as the general analytics/reporting home and this feature (028) as the authoritative source of attribution-model logic, financial formulas, and the finalization workflow that feature 027's dashboards should consume rather than re-implement. Implementation planning should confirm this division rather than duplicating attribution-calculation logic in both features.
- **Relationship to feature 037 (enterprise-attribution-mmm, Volume 14 Part 2 Chapter 4)**: Per the Constitution's Development Workflow note on Volume 14's later, redundant enterprise chapters, Part 2 Chapter 4 ("Enterprise Marketing Attribution, Incrementality Measurement, Media Mix Modeling & Revenue Intelligence Platform") substantially re-covers this chapter's attribution, incrementality, and revenue-intelligence ground at an "enterprise platform" framing, and adds a fuller Marketing Mix Modeling treatment. This spec's Marketing Mix Modeling requirements (FR-052, FR-053) are marked as future/advanced-enterprise ("may support") per the source's own qualifier, since Chapter 15 treats MMM only briefly while feature 037 is expected to own the full MMM specification. Implementation should treat feature 037 as the deeper, enterprise-scale extension of this feature's incrementality and MMM sections rather than a wholly separate system.
- The source chapter states attribution windows, holdout-group sizing, model half-life periods, position-based percentages, and dual-approval thresholds for budget recommendations as "configurable" or "default" without always specifying exact production defaults beyond the examples given (e.g., "40% first / 40% last / 20% middle" for position-based, "40%/40%/20%" for U-shaped). [NEEDS CLARIFICATION: what are the actual production default values for attribution-window length per conversion type, holdout-group sample-size/duration requirements, and the specific monetary/percentage threshold that triggers required approval for an AI budget recommendation?]
- The source does not name a specific machine-learning technique, vendor, or confidence-scoring methodology for the Data-Driven, Markov Chain, or Shapley Value attribution engines — only their required inputs and outputs. [NEEDS CLARIFICATION: which specific algorithmic/statistical implementation is intended for data-driven, Markov Chain, and Shapley Value attribution, since this affects what "confidence score" and "model coverage" concretely mean?]
- The source does not define a formal holdout-group contamination detection/exclusion procedure; the Edge Cases and User Story 5 scenario extend the source's general incrementality-experiment requirements with a plausible expected behavior rather than a literal source requirement. [NEEDS CLARIFICATION: what is the intended contamination-detection and correction procedure for incrementality experiments?]
- Multi-currency and exchange-rate handling assumes reuse of the finance-approved exchange-rate infrastructure defined for membership/payments (feature 009); this spec does not re-define exchange-rate sourcing, only how it must be applied consistently and traceably to marketing cost and revenue conversion.
- This spec assumes the underlying Customer, Conversion, and payment/refund event data are supplied by upstream modules (Membership/Payments feature 009, CRM feature 013, Marketing Automation Workflows feature 022) rather than being originated here; this feature is the attribution/measurement layer that consumes those events, not the system of record for the underlying transactions themselves.
- Per Constitution Article II (AI Is Assistive, Never Autonomous), all AI ROI Intelligence Engine outputs (recommendations, forecasts, budget-optimization suggestions) are treated as advisory-only in every requirement above; no requirement in this spec permits autonomous execution of a budget, spend, or campaign change without explicit human approval.
- Per Constitution Article IV (Historical Immutability), the Attribution Finalization state machine (FR-057, FR-058) is treated as the authoritative implementation of the constitution's named example ("attribution-model assignments are snapshotted... Finalized/Locked") for this entire platform; other features referencing attribution snapshots should defer to this feature's finalization model rather than defining a competing one.
