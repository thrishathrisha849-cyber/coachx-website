# **Tamil Business Tribe (TBT)**

# **Enterprise Product Requirements Document (PRD)**

## **Volume 14 – Marketing Automation Platform**

### **Part 1 – Marketing Foundation**

# **Chapter 15 – Marketing Attribution Models, Revenue Impact & ROI Measurement System**

---

# **Document Information**

| Item | Details |
| ----- | ----- |
| Product | Tamil Business Tribe |
| Product Abbreviation | TBT |
| Volume | Volume 14 |
| Part | Part 1 – Marketing Foundation |
| Module | Marketing Automation Platform |
| Submodule | Marketing Attribution, Revenue Impact and ROI Measurement |
| Document Type | Enterprise Product Requirements Document |
| Version | 1.0 |
| Status | Draft |
| Intended Users | Marketing Leaders, Performance Marketers, Finance Teams, Revenue Operations, Sales Leaders, Analysts, Executives and Platform Administrators |

---

# **1\. Purpose**

The Marketing Attribution Models, Revenue Impact & ROI Measurement System shall determine how marketing activities contribute to leads, conversions, purchases, subscriptions, renewals and long-term customer value across the Tamil Business Tribe ecosystem.

The system shall connect marketing touchpoints with measurable financial outcomes and distribute conversion or revenue credit across campaigns, channels, assets, customer journeys and business units.

The platform must help stakeholders answer critical questions such as:

* Which marketing channel introduced the customer?  
* Which touchpoints influenced the customer’s decision?  
* Which campaign produced the final conversion?  
* How much revenue did each channel influence?  
* Which campaigns generated profitable customers?  
* Which marketing investments should be increased, reduced or stopped?  
* How much incremental revenue was created by marketing?  
* Which attribution model is most appropriate for a specific business objective?  
* How long does it take for marketing investments to generate returns?  
* Which campaigns contribute to repeat purchases, renewals and customer lifetime value?

The module shall provide transparent, auditable and configurable attribution while preventing duplicate revenue credit and misleading ROI reporting.

---

# **2\. Product Vision**

The vision is to create an enterprise-grade revenue measurement system that transforms marketing from a cost center into a measurable growth function.

The platform shall provide:

* Unified cross-channel attribution.  
* Customer-level touchpoint analysis.  
* Campaign-to-revenue traceability.  
* Configurable attribution models.  
* Incremental impact measurement.  
* Marketing cost allocation.  
* Profit and contribution-margin analysis.  
* Customer lifetime value attribution.  
* Budget efficiency measurement.  
* Predictive ROI forecasting.  
* Finance-approved revenue reconciliation.  
* AI-assisted investment recommendations.

The system shall ensure that marketing, finance, sales and executive teams use consistent definitions and trusted financial data when evaluating marketing performance.

---

# **3\. Objectives**

The Attribution and ROI Measurement System shall:

* Connect every eligible conversion with its marketing touchpoints.  
* Calculate attributed revenue accurately.  
* Support single-touch and multi-touch attribution models.  
* Support custom attribution rules.  
* Measure direct and influenced revenue.  
* Calculate marketing ROI and return on ad spend.  
* Measure acquisition cost and payback period.  
* Allocate shared marketing costs.  
* Prevent revenue double-counting.  
* Reconcile attributed revenue with payment and finance systems.  
* Compare attribution models.  
* Measure customer lifetime value by acquisition source.  
* Support recurring revenue and subscription businesses.  
* Provide auditable model explanations.  
* Forecast future ROI.  
* Recommend budget allocation using AI.  
* Protect customer data and financial information.

---

# **4\. Scope**

This chapter covers:

1. Attribution data collection.  
2. Touchpoint qualification.  
3. Conversion and revenue definitions.  
4. Attribution windows.  
5. Single-touch attribution.  
6. Multi-touch attribution.  
7. Algorithmic attribution.  
8. Custom attribution models.  
9. Offline attribution.  
10. Cross-device attribution.  
11. Revenue impact analysis.  
12. Marketing cost allocation.  
13. ROI and profitability calculations.  
14. Customer acquisition cost.  
15. Customer lifetime value.  
16. Payback period.  
17. Incrementality measurement.  
18. Attribution comparison.  
19. Revenue reconciliation.  
20. Executive ROI dashboards.  
21. Predictive ROI modeling.  
22. AI budget recommendations.  
23. Governance, security and audit controls.

---

# **5\. Attribution System Architecture**

The system shall use the following logical architecture:

Marketing and Customer Touchpoints  
                │  
                ▼  
Event Collection and Identity Resolution  
                │  
                ▼  
Touchpoint Eligibility Engine  
                │  
                ▼  
Conversion and Revenue Matching  
                │  
                ▼  
Attribution Model Processing  
                │  
                ▼  
Cost, Margin and ROI Calculation  
                │  
                ▼  
Reconciliation and Governance  
                │  
                ▼  
Operational, Finance and Executive Dashboards

The architecture must support:

* Near-real-time attribution for operational dashboards.  
* Scheduled attribution for finalized financial reporting.  
* Historical recalculation.  
* Multiple model comparison.  
* Model versioning.  
* Multi-tenant isolation.  
* High-volume event processing.

---

# **6\. Core Attribution Entities**

The system shall maintain the following core entities:

## **6.1 Customer**

Represents an identified or anonymous person interacting with TBT.

Fields include:

* Customer ID.  
* Anonymous visitor ID.  
* Membership ID.  
* Lead ID.  
* Email hash.  
* Phone hash.  
* Device identifiers.  
* Organization ID.  
* Consent status.  
* Customer segment.  
* First seen date.  
* First conversion date.  
* Customer status.

## **6.2 Touchpoint**

Represents an eligible marketing interaction.

Fields include:

* Touchpoint ID.  
* Customer ID.  
* Session ID.  
* Campaign ID.  
* Channel ID.  
* Creative ID.  
* Content ID.  
* Source.  
* Medium.  
* Campaign name.  
* Interaction type.  
* Interaction timestamp.  
* Device.  
* Location.  
* Cost reference.  
* Eligibility status.  
* Attribution weight.  
* Attribution model.  
* Touchpoint properties.

## **6.3 Conversion**

Represents a measurable business outcome.

Fields include:

* Conversion ID.  
* Customer ID.  
* Conversion type.  
* Conversion timestamp.  
* Order or transaction ID.  
* Gross revenue.  
* Net revenue.  
* Currency.  
* Product.  
* Membership plan.  
* Refund status.  
* Attribution window.  
* Duplicate-check status.  
* Reconciliation status.

## **6.4 Attribution Result**

Represents the credit assigned to a marketing touchpoint.

Fields include:

* Attribution result ID.  
* Conversion ID.  
* Touchpoint ID.  
* Model ID.  
* Model version.  
* Attribution percentage.  
* Attributed revenue.  
* Attributed margin.  
* Calculation timestamp.  
* Confidence score.  
* Finalization status.

## **6.5 Marketing Cost**

Represents spending associated with a marketing activity.

Fields include:

* Cost ID.  
* Campaign ID.  
* Channel ID.  
* Cost category.  
* Vendor.  
* Cost amount.  
* Currency.  
* Tax.  
* Effective date.  
* Cost center.  
* Payment status.  
* Approval status.  
* Data source.

---

# **7\. Touchpoint Collection**

The system shall capture touchpoints from:

* Paid search advertisements.  
* Display advertisements.  
* Social media advertisements.  
* Organic search.  
* Direct website visits.  
* Referral traffic.  
* Affiliate links.  
* Referral invitations.  
* Email campaigns.  
* SMS campaigns.  
* WhatsApp campaigns.  
* Push notifications.  
* Community posts.  
* Webinars.  
* Events.  
* Landing pages.  
* Forms.  
* Ebook downloads.  
* Podcast interactions.  
* Course previews.  
* AI assistant conversations.  
* Sales conversations.  
* Support interactions.  
* Offline campaigns.  
* QR codes.  
* Partner campaigns.

Each touchpoint must be timestamped and linked to available campaign, channel, content and customer identifiers.

---

# **8\. Touchpoint Eligibility Rules**

Not every interaction shall automatically qualify for attribution.

Administrators shall define eligibility based on:

* Interaction type.  
* Channel.  
* Campaign.  
* Customer consent.  
* Conversion type.  
* Attribution window.  
* Minimum engagement.  
* Fraud status.  
* Bot classification.  
* Session quality.  
* Geographic restrictions.  
* Device eligibility.  
* Internal employee exclusion.  
* Test account exclusion.

Examples of eligibility rules:

* Email delivered without an open or click may be excluded.  
* Video interaction may require a minimum watch percentage.  
* Landing page view may require a minimum session duration.  
* Social impression may qualify only for view-through attribution.  
* Direct traffic may be excluded when an eligible previous touchpoint exists.  
* Internal administrative activity must never receive attribution credit.

---

# **9\. Engagement Quality Levels**

Touchpoints may be assigned engagement levels.

| Level | Description | Example |
| ----- | ----- | ----- |
| Passive | Exposure without confirmed engagement | Advertisement impression |
| Low | Basic interaction | Page view |
| Medium | Intentional engagement | Email click |
| High | Strong purchase intent | Pricing page visit |
| Conversion Assist | Direct contribution before conversion | Consultation booking |
| Conversion | Final business outcome | Purchase |

The attribution engine may use engagement quality as an input for weighted or algorithmic models.

---

# **10\. Conversion Management**

Authorized administrators shall define conversion events.

Supported conversion categories include:

## **10.1 Lead Conversions**

* Form submission.  
* Contact request.  
* Consultation request.  
* Demo booking.  
* Webinar registration.  
* Newsletter subscription.  
* Lead qualification.  
* Sales-qualified lead creation.

## **10.2 Transaction Conversions**

* Course purchase.  
* Ebook purchase.  
* Event ticket purchase.  
* Membership purchase.  
* Subscription activation.  
* Product purchase.  
* Marketplace purchase.

## **10.3 Recurring Revenue Conversions**

* Subscription renewal.  
* Membership renewal.  
* Plan upgrade.  
* Additional seat purchase.  
* Recurring service payment.

## **10.4 Engagement Conversions**

* Course completion.  
* Referral invitation.  
* Referral success.  
* Community activation.  
* Podcast completion.  
* Ebook completion.  
* Reward redemption.

Each conversion definition shall include:

* Conversion name.  
* Event condition.  
* Conversion value.  
* Revenue field.  
* Eligible customer type.  
* Attribution model.  
* Attribution window.  
* Duplicate conversion rule.  
* Refund handling.  
* Active status.  
* Effective date.

---

# **11\. Conversion Value Rules**

A conversion may have:

* Fixed value.  
* Transaction-based value.  
* Estimated value.  
* Predicted lifetime value.  
* No monetary value.  
* Finance-approved value.

Examples:

* Webinar registration: fixed estimated value.  
* Membership purchase: actual net transaction value.  
* Sales-qualified lead: expected pipeline value.  
* Referral signup: configurable estimated value.  
* Subscription renewal: collected renewal amount.

Estimated values must be clearly separated from realized revenue in all reports.

---

# **12\. Revenue Classification**

The system shall classify revenue into:

* Gross revenue.  
* Net revenue.  
* Collected revenue.  
* Recognized revenue.  
* Deferred revenue.  
* Recurring revenue.  
* Renewal revenue.  
* Upgrade revenue.  
* Cross-sell revenue.  
* Upsell revenue.  
* Referral revenue.  
* Attributed revenue.  
* Influenced revenue.  
* Incremental revenue.  
* Unattributed revenue.  
* Refunded revenue.  
* Cancelled revenue.

Reports must clearly indicate which revenue basis is being used.

---

# **13\. Attribution Windows**

The platform shall support configurable attribution windows.

Available windows include:

* Same session.  
* 1 day.  
* 3 days.  
* 7 days.  
* 14 days.  
* 30 days.  
* 60 days.  
* 90 days.  
* 180 days.  
* 365 days.  
* Custom duration.

Different windows may be configured by:

* Conversion type.  
* Product.  
* Membership plan.  
* Channel.  
* Campaign.  
* Customer segment.  
* Business unit.

The system shall distinguish between:

* Click-through attribution window.  
* View-through attribution window.  
* Lead-to-conversion window.  
* Conversion-to-renewal window.  
* Re-engagement window.

---

# **14\. First-Touch Attribution Model**

First-touch attribution assigns 100% of the conversion credit to the first eligible marketing touchpoint.

The model shall support:

* Original acquisition source preservation.  
* Anonymous first-touch tracking.  
* Cross-device first-touch reconciliation.  
* Configurable direct-traffic treatment.  
* Historical first-touch retention.  
* First-touch campaign reporting.  
* First-touch channel reporting.

Primary use cases include:

* Awareness measurement.  
* Acquisition-source analysis.  
* Top-of-funnel budget evaluation.  
* New customer origin reporting.

---

# **15\. Last-Touch Attribution Model**

Last-touch attribution assigns 100% of the conversion credit to the final eligible touchpoint before conversion.

The model shall support:

* Last non-direct touch.  
* Last paid touch.  
* Last campaign touch.  
* Last marketing-qualified touch.  
* Last sales-assisted touch.  
* Configurable lookback period.

Primary use cases include:

* Conversion campaign analysis.  
* Closing-channel measurement.  
* Sales activation reporting.  
* Short-cycle campaign optimization.

---

# **16\. Lead-Creation Attribution**

Lead-creation attribution assigns credit to the touchpoint responsible for creating the lead record.

This model shall be used to evaluate:

* Form campaigns.  
* Consultation campaigns.  
* Webinar campaigns.  
* Download campaigns.  
* Newsletter acquisition.  
* Lead-generation advertisements.

The system shall preserve lead-creation attribution even when the lead later converts through another campaign.

---

# **17\. Opportunity-Creation Attribution**

Opportunity-creation attribution assigns credit to touchpoints associated with the creation of a qualified sales opportunity.

Eligible inputs may include:

* Marketing-qualified lead activity.  
* Sales-qualified lead transition.  
* Demo request.  
* Proposal request.  
* Consultation completion.  
* Sales meeting.  
* Account-level engagement.

This model is especially relevant for enterprise and long sales-cycle businesses.

---

# **18\. Linear Attribution Model**

Linear attribution distributes equal credit among all eligible touchpoints.

Example:

Eligible Touchpoints: 4  
Conversion Revenue: ₹10,000  
Credit per Touchpoint: 25%  
Attributed Revenue per Touchpoint: ₹2,500

The system shall support:

* Equal credit by touchpoint.  
* Equal credit by channel.  
* Equal credit by campaign.  
* Duplicate touchpoint consolidation.  
* Minimum engagement requirements.

---

# **19\. Position-Based Attribution Model**

Position-based attribution assigns higher credit to the first and last touchpoints.

Default configuration:

* 40% to the first touchpoint.  
* 40% to the last touchpoint.  
* 20% distributed among middle touchpoints.

Administrators shall be able to configure:

* First-touch percentage.  
* Last-touch percentage.  
* Middle-touch percentage.  
* Minimum number of touchpoints.  
* Treatment of one-touch journeys.  
* Treatment of two-touch journeys.

---

# **20\. Time-Decay Attribution Model**

Time-decay attribution assigns more credit to touchpoints closer to the conversion.

Configurable settings include:

* Attribution window.  
* Half-life period.  
* Minimum touchpoint weight.  
* Maximum lookback.  
* Eligible channels.  
* Event-quality weighting.

The system shall display:

* Touchpoint age.  
* Decay factor.  
* Final assigned weight.  
* Attributed revenue.  
* Model explanation.

---

# **21\. U-Shaped Attribution Model**

The U-shaped model emphasizes the first touchpoint and lead-creation touchpoint.

Default allocation may include:

* 40% to first touch.  
* 40% to lead-creation touch.  
* 20% across remaining touchpoints.

This model shall support businesses focused on lead acquisition and nurturing.

---

# **22\. W-Shaped Attribution Model**

The W-shaped model emphasizes three key milestones:

* First touch.  
* Lead creation.  
* Opportunity creation.

A configurable share of attribution credit shall be assigned to each milestone, with remaining credit distributed among other eligible touchpoints.

This model is intended for businesses with marketing and sales collaboration.

---

# **23\. Full-Path Attribution Model**

Full-path attribution shall cover:

* First touch.  
* Lead creation.  
* Opportunity creation.  
* Customer conversion.

The model shall assign configurable credit to each milestone and distribute the remaining credit among intermediate interactions.

This model is suitable for long and complex customer journeys.

---

# **24\. Custom Rule-Based Attribution**

Authorized administrators shall create custom models using configurable rules.

Rules may include:

* Channel priority.  
* Campaign priority.  
* Touchpoint position.  
* Engagement quality.  
* Time proximity.  
* Customer segment.  
* Product category.  
* Lead score.  
* Conversion value.  
* Sales involvement.  
* Offline interaction.  
* Device type.  
* Geographic region.

Custom models shall support:

* Draft creation.  
* Model simulation.  
* Approval workflow.  
* Versioning.  
* Effective dates.  
* Historical recalculation.  
* Rollback.  
* Comparison against standard models.

---

# **25\. Data-Driven Attribution**

The Data-Driven Attribution Engine shall analyze historical converting and non-converting journeys to estimate each touchpoint’s contribution.

Potential model inputs include:

* Touchpoint sequence.  
* Channel.  
* Campaign.  
* Creative.  
* Engagement type.  
* Time between events.  
* Customer segment.  
* Device.  
* Geography.  
* Conversion value.  
* Customer history.  
* Lead score.  
* Purchase history.  
* Sales activity.

The system shall generate:

* Touchpoint contribution score.  
* Channel contribution score.  
* Campaign contribution score.  
* Conversion probability change.  
* Confidence score.  
* Model coverage.  
* Training date.  
* Model version.  
* Explanation summary.

Data-driven results must not be treated as absolute causal evidence unless validated through incrementality testing.

---

# **26\. Markov Chain Attribution**

The platform may support Markov chain attribution for advanced journey analysis.

The model shall evaluate the removal effect of channels or touchpoints by estimating how conversion probability changes when a touchpoint is removed from observed paths.

Required outputs include:

* Transition probabilities.  
* Removal effect.  
* Channel contribution.  
* Path frequency.  
* Conversion probability.  
* Model confidence.  
* Data-coverage warning.

This feature shall be limited to authorized analytics users.

---

# **27\. Shapley Value Attribution**

The platform may support Shapley value attribution to estimate the contribution of channels across multiple combinations.

The system shall:

* Analyze channel combinations.  
* Estimate marginal contribution.  
* Distribute conversion value.  
* Provide computational limits.  
* Display confidence indicators.  
* Explain model assumptions.

Approximation methods may be used for high-volume datasets.

---

# **28\. View-Through Attribution**

View-through attribution shall measure conversions that occur after an advertisement impression without a recorded click.

Configurable settings include:

* Eligible channels.  
* Viewability requirement.  
* Minimum exposure duration.  
* Impression frequency limit.  
* View-through attribution window.  
* Priority against click-through attribution.  
* Fraud and bot filtering.

View-through revenue shall be displayed separately from click-through revenue unless explicitly combined.

---

# **29\. Assisted Conversion Attribution**

The system shall identify touchpoints that influenced a conversion without receiving final-touch credit.

Assisted conversion reports shall include:

* Assisted conversions.  
* Direct conversions.  
* Assist-to-final conversion ratio.  
* Assisted revenue.  
* Final-touch revenue.  
* Average position in journey.  
* Average time before conversion.

This shall help identify channels that contribute strongly to consideration and nurturing.

---

# **30\. Cross-Device Attribution**

The system shall connect eligible customer journeys across:

* Desktop.  
* Mobile web.  
* Android application.  
* iOS application.  
* Tablet.  
* Multiple browsers.  
* Logged-in devices.

Cross-device matching may use:

* Authenticated customer ID.  
* Verified email.  
* Verified phone number.  
* Membership ID.  
* Deterministic identity links.  
* Approved probabilistic signals.

Probabilistic matching must be clearly labeled and governed by privacy controls.

---

# **31\. Offline Attribution**

The system shall support offline marketing and sales touchpoints.

Examples include:

* Physical events.  
* Business meetups.  
* Retail interactions.  
* Telephone calls.  
* Direct sales visits.  
* Printed advertisements.  
* Offline referral programs.  
* QR code campaigns.  
* Manual lead imports.

Offline interactions may be linked using:

* Customer ID.  
* Phone number.  
* Email.  
* Referral code.  
* Coupon code.  
* QR code.  
* Event registration ID.  
* Sales opportunity ID.

---

# **32\. Account-Based Attribution**

For enterprise or business accounts, the system shall support account-level attribution.

Account-based attribution shall aggregate interactions from multiple contacts belonging to the same organization.

The system shall track:

* Account ID.  
* Contact roles.  
* Buying committee.  
* Account-level engagement.  
* Opportunity value.  
* Account conversion.  
* Account revenue.  
* Influential contacts.  
* Influential campaigns.

Attribution rules may consider both individual and account-level interactions.

---

# **33\. Direct and Influenced Revenue**

The platform shall distinguish between:

## **33.1 Directly Attributed Revenue**

Revenue assigned according to the selected attribution model.

## **33.2 Marketing-Influenced Revenue**

Revenue where at least one eligible marketing touchpoint occurred within the defined influence window.

## **33.3 Sales-Sourced Revenue**

Revenue originating through direct sales activity without an eligible marketing acquisition touchpoint.

## **33.4 Partner-Sourced Revenue**

Revenue originating from approved partners or affiliates.

## **33.5 Unattributed Revenue**

Revenue that cannot be reliably connected to an eligible marketing touchpoint.

Reports must prevent these categories from being added together incorrectly.

---

# **34\. Revenue Deduplication**

The system shall prevent duplicate revenue attribution.

Deduplication rules shall use:

* Transaction ID.  
* Order ID.  
* Subscription ID.  
* Payment reference.  
* Conversion ID.  
* Customer ID.  
* Product ID.  
* Conversion timestamp.  
* Refund status.

A single revenue transaction may be distributed across multiple touchpoints, but the total attributed revenue across one model must not exceed the eligible conversion value.

---

# **35\. Refund and Cancellation Handling**

When a transaction is refunded, cancelled or partially reversed, the platform shall update attribution results.

Supported scenarios include:

* Full refund.  
* Partial refund.  
* Subscription cancellation.  
* Chargeback.  
* Failed renewal.  
* Order adjustment.  
* Product return.

The system shall maintain both:

* Original attributed revenue.  
* Adjusted net attributed revenue.

Financial reports shall default to adjusted net revenue unless otherwise configured.

---

# **36\. Recurring Revenue Attribution**

Recurring revenue attribution shall support:

* Initial subscription acquisition.  
* Monthly renewals.  
* Annual renewals.  
* Plan upgrades.  
* Plan downgrades.  
* Reactivations.  
* Add-on purchases.

Organizations shall configure whether recurring revenue is credited to:

* Original acquisition source.  
* Renewal campaign.  
* Most recent eligible touchpoint.  
* Shared acquisition and retention model.  
* Custom recurring-revenue model.

---

# **37\. Lifetime Revenue Attribution**

The platform shall measure the long-term revenue generated by customers acquired through each campaign or channel.

Lifetime attribution shall include:

* Initial purchase.  
* Repeat purchases.  
* Renewals.  
* Upgrades.  
* Cross-sells.  
* Upsells.  
* Referral-generated revenue.  
* Refunds.  
* Churn.

Reports shall compare:

* First 30-day revenue.  
* First 90-day revenue.  
* First-year revenue.  
* Total lifetime revenue.  
* Predicted lifetime revenue.

---

# **38\. Marketing Cost Framework**

The system shall support direct and indirect marketing costs.

## **38.1 Direct Costs**

* Advertisement spend.  
* Messaging costs.  
* Affiliate commission.  
* Influencer payment.  
* Event sponsorship.  
* Campaign production.  
* Lead-purchase costs.

## **38.2 Indirect Costs**

* Agency fees.  
* Marketing software.  
* Employee allocation.  
* Creative team costs.  
* Data provider costs.  
* Platform infrastructure.  
* Consulting costs.  
* Shared operational costs.

## **38.3 Cost Allocation Methods**

Shared costs may be allocated by:

* Campaign spend.  
* Revenue share.  
* Lead volume.  
* Conversion volume.  
* Channel usage.  
* Time period.  
* Team allocation.  
* Manual percentage.

---

# **39\. Marketing Spend Reconciliation**

Marketing spend shall be reconciled with:

* Advertising platforms.  
* Vendor invoices.  
* Payment records.  
* Finance systems.  
* Purchase orders.  
* Agency reports.  
* Manual cost entries.

Reconciliation statuses include:

* Unverified.  
* Imported.  
* Matched.  
* Partially matched.  
* Approved.  
* Disputed.  
* Finalized.

Only approved or explicitly permitted cost data shall be used in finalized ROI reports.

---

# **40\. Return on Ad Spend**

Return on Ad Spend shall measure attributed revenue relative to advertisement spend.

The system shall support:

* Gross-revenue ROAS.  
* Net-revenue ROAS.  
* Contribution-margin ROAS.  
* Channel ROAS.  
* Campaign ROAS.  
* Creative ROAS.  
* Audience ROAS.  
* Product ROAS.  
* Cohort ROAS.

The selected revenue basis must be visible in every report.

---

# **41\. Marketing ROI**

Marketing ROI shall measure financial return after marketing cost.

The platform shall support:

* Revenue-based ROI.  
* Gross-profit ROI.  
* Contribution-margin ROI.  
* Incremental ROI.  
* Lifetime-value ROI.  
* Campaign ROI.  
* Channel ROI.  
* Product ROI.  
* Regional ROI.  
* Portfolio ROI.

Every ROI result shall display:

* Revenue basis.  
* Included costs.  
* Excluded costs.  
* Attribution model.  
* Attribution window.  
* Reporting period.  
* Currency.  
* Data freshness.  
* Approval status.

---

# **42\. Contribution Margin Measurement**

The platform shall support profitability analysis using contribution margin.

Inputs may include:

* Net revenue.  
* Product cost.  
* Payment-processing fees.  
* Delivery costs.  
* Support costs.  
* Partner commissions.  
* Refunds.  
* Variable service costs.  
* Marketing costs.

Contribution margin reporting shall help prevent high-revenue but low-profit campaigns from being incorrectly classified as successful.

---

# **43\. Customer Acquisition Cost**

Customer Acquisition Cost shall be calculated using approved acquisition costs and newly acquired customers.

The platform shall provide:

* Blended CAC.  
* Paid CAC.  
* Organic CAC.  
* Channel CAC.  
* Campaign CAC.  
* Segment CAC.  
* Product CAC.  
* Region CAC.  
* New customer CAC.  
* Reactivation CAC.

Administrators shall define:

* Eligible acquisition costs.  
* Customer qualification rules.  
* Reporting period.  
* New-customer definition.  
* Treatment of shared costs.

---

# **44\. Cost Per Funnel Stage**

The platform shall calculate cost efficiency across the funnel.

Metrics include:

* Cost per impression.  
* Cost per click.  
* Cost per landing page visit.  
* Cost per form submission.  
* Cost per lead.  
* Cost per qualified lead.  
* Cost per sales-qualified lead.  
* Cost per opportunity.  
* Cost per customer.  
* Cost per renewal.  
* Cost per referral.

These metrics shall support campaign, channel, audience and product comparisons.

---

# **45\. Customer Lifetime Value**

The system shall calculate historical and predicted Customer Lifetime Value.

Inputs may include:

* Average order value.  
* Purchase frequency.  
* Subscription value.  
* Renewal probability.  
* Retention duration.  
* Gross margin.  
* Refund behavior.  
* Service costs.  
* Referral contribution.  
* Churn probability.

CLV shall be available by:

* Customer.  
* Cohort.  
* Campaign.  
* Channel.  
* Segment.  
* Product.  
* Membership plan.  
* Geography.  
* Acquisition month.

---

# **46\. CLV-to-CAC Ratio**

The platform shall calculate the relationship between Customer Lifetime Value and Customer Acquisition Cost.

Reports shall display:

* Historical CLV.  
* Predicted CLV.  
* Blended CAC.  
* Paid CAC.  
* CLV-to-CAC ratio.  
* Payback period.  
* Cohort comparison.  
* Target range.  
* Risk classification.

The system shall warn users when predicted CLV is based on insufficient historical data.

---

# **47\. Payback Period**

The payback period shall measure how long it takes to recover customer acquisition costs.

The platform shall support:

* Customer-level payback.  
* Cohort payback.  
* Campaign payback.  
* Channel payback.  
* Subscription payback.  
* Contribution-margin payback.

Reports shall show:

* Acquisition cost.  
* Cumulative revenue.  
* Cumulative margin.  
* Break-even date.  
* Expected payback date.  
* Actual payback duration.  
* Customers not yet recovered.

---

# **48\. Incrementality Measurement**

The system shall support measurement of revenue or conversions caused by marketing activity rather than merely associated with it.

Supported methods include:

* Holdout groups.  
* Geographic holdouts.  
* Audience control groups.  
* Campaign suppression groups.  
* Randomized controlled tests.  
* Pre-and-post comparisons.  
* Difference-in-differences analysis.  
* Causal impact modeling.

Incrementality reports shall include:

* Treatment group.  
* Control group.  
* Incremental conversions.  
* Incremental revenue.  
* Incremental cost.  
* Incremental ROI.  
* Confidence interval.  
* Statistical significance.  
* Experiment limitations.

---

# **49\. Marketing Mix Modeling**

Future or advanced enterprise versions may support Marketing Mix Modeling.

Inputs may include:

* Channel spend.  
* Revenue.  
* Seasonality.  
* Promotions.  
* Pricing.  
* Economic conditions.  
* Geographic differences.  
* Brand activity.  
* Competitive signals.  
* Offline marketing.  
* Product launches.

Outputs may include:

* Channel contribution.  
* Diminishing returns.  
* Saturation curves.  
* Spend-response curves.  
* Optimal budget recommendations.  
* Scenario simulations.

---

# **50\. Attribution Model Comparison**

Users shall compare multiple attribution models for the same period.

Comparison dimensions include:

* Revenue by channel.  
* Revenue by campaign.  
* Conversion credit.  
* Assisted conversion credit.  
* First-touch credit.  
* Last-touch credit.  
* Model variance.  
* Budget recommendation changes.  
* Customer acquisition cost.  
* ROI.

The interface shall explain why results differ between models.

---

# **51\. Model Simulation**

Before activating an attribution model, authorized users shall be able to simulate its impact.

Simulation shall show:

* Historical revenue redistribution.  
* Campaign winners and losers.  
* Channel-level changes.  
* ROI changes.  
* Budget implications.  
* Unattributed revenue.  
* Processing requirements.  
* Data coverage.  
* Model risks.

Simulation must not alter finalized reports.

---

# **52\. Model Versioning**

Every attribution model shall include:

* Model ID.  
* Version number.  
* Model type.  
* Rule configuration.  
* Created by.  
* Approved by.  
* Effective date.  
* End date.  
* Status.  
* Change reason.  
* Historical impact.  
* Rollback reference.

Existing finalized reports shall preserve the model version originally used.

---

# **53\. Revenue Reconciliation**

The system shall reconcile attributed revenue against authoritative financial sources.

Reconciliation shall compare:

* Marketing conversion records.  
* Payment gateway records.  
* Order records.  
* Subscription records.  
* Refund records.  
* Finance ledger totals.  
* Recognized revenue.

Reconciliation outputs include:

* Matched revenue.  
* Unmatched revenue.  
* Duplicate revenue.  
* Missing transactions.  
* Currency differences.  
* Timing differences.  
* Refund differences.  
* Final reconciliation status.

---

# **54\. Attribution Finalization**

Attribution results may move through the following states:

* Preliminary.  
* Processing.  
* Calculated.  
* Under review.  
* Finance reviewed.  
* Finalized.  
* Reopened.  
* Corrected.

Finalized attribution periods shall be locked against unauthorized modification.

Historical corrections shall require:

* Reason.  
* Approval.  
* Audit log.  
* Model version.  
* Recalculation record.

---

# **55\. Attribution Dashboard**

The primary Attribution Dashboard shall display:

* Total conversions.  
* Total revenue.  
* Attributed revenue.  
* Influenced revenue.  
* Incremental revenue.  
* Unattributed revenue.  
* Top acquisition channel.  
* Top assisting channel.  
* Top closing channel.  
* Average touchpoints to conversion.  
* Average time to conversion.  
* Model currently selected.  
* Attribution data freshness.

Visualizations shall include:

* Channel attribution chart.  
* Campaign attribution table.  
* Customer journey paths.  
* Touchpoint-position analysis.  
* Assisted conversion matrix.  
* Revenue flow diagram.  
* Model comparison chart.  
* Conversion lag distribution.

---

# **56\. Revenue Impact Dashboard**

The Revenue Impact Dashboard shall display:

* Marketing-attributed revenue.  
* Marketing-influenced pipeline.  
* Realized revenue.  
* Forecasted revenue.  
* Gross profit.  
* Contribution margin.  
* Revenue by channel.  
* Revenue by campaign.  
* Revenue by product.  
* Revenue by customer segment.  
* Recurring revenue contribution.  
* Renewal revenue contribution.  
* Lifetime revenue by acquisition source.

---

# **57\. ROI Dashboard**

The ROI Dashboard shall display:

* Total marketing cost.  
* Attributed revenue.  
* Net revenue.  
* Gross profit.  
* Marketing ROI.  
* Return on ad spend.  
* Customer acquisition cost.  
* Customer lifetime value.  
* CLV-to-CAC ratio.  
* Payback period.  
* Cost per lead.  
* Cost per customer.  
* Incremental ROI.  
* Budget utilization.

The dashboard shall support comparison against:

* Target.  
* Previous period.  
* Previous campaign.  
* Previous year.  
* Forecast.  
* Organization benchmark.

---

# **58\. Executive Revenue Intelligence**

The Executive Revenue Intelligence view shall provide:

* Marketing contribution to company revenue.  
* Marketing contribution to pipeline.  
* Revenue growth influenced by marketing.  
* Highest-return channels.  
* Lowest-return channels.  
* Budget-at-risk amount.  
* Revenue forecast.  
* Profitability forecast.  
* Acquisition efficiency.  
* Retention contribution.  
* Major attribution changes.  
* Recommended investment actions.

The system shall generate an executive narrative summarizing:

* What changed.  
* Why it changed.  
* Financial impact.  
* Key risks.  
* Recommended decisions.  
* Confidence level.

---

# **59\. AI ROI Intelligence**

The AI ROI Intelligence Engine shall analyze:

* Campaign cost.  
* Attributed revenue.  
* Incremental revenue.  
* Conversion trends.  
* Customer quality.  
* Customer lifetime value.  
* Payback period.  
* Channel saturation.  
* Attribution uncertainty.  
* Budget utilization.

AI recommendations may include:

* Increase campaign budget.  
* Reduce channel spending.  
* Pause low-margin campaigns.  
* Shift budget toward high-CLV segments.  
* Extend a profitable campaign.  
* Improve retention campaigns.  
* Test a new attribution model.  
* Investigate revenue mismatches.  
* Review abnormal acquisition costs.

Every recommendation shall include:

* Supporting evidence.  
* Expected financial impact.  
* Confidence score.  
* Risk level.  
* Recommended action.  
* Required approval.

---

# **60\. Predictive ROI Forecasting**

The system shall forecast:

* Campaign revenue.  
* Campaign cost.  
* ROAS.  
* Marketing ROI.  
* Customer acquisition cost.  
* Customer lifetime value.  
* Payback period.  
* Incremental revenue.  
* Budget utilization.  
* Profit contribution.

Forecast scenarios shall include:

* Expected case.  
* Best case.  
* Worst case.  
* Reduced-budget case.  
* Increased-budget case.  
* Channel-reallocation case.

Forecasts must display assumptions and confidence ranges.

---

# **61\. Budget Optimization**

The system shall recommend budget allocation across:

* Channels.  
* Campaigns.  
* Audience segments.  
* Products.  
* Regions.  
* Funnel stages.  
* Acquisition and retention programs.

Optimization objectives may include:

* Maximize revenue.  
* Maximize profit.  
* Maximize qualified leads.  
* Minimize customer acquisition cost.  
* Improve payback period.  
* Increase lifetime value.  
* Maintain minimum brand investment.  
* Stay within risk limits.

Human approval shall be required before budget changes are executed.

---

# **62\. Scenario Planning**

Users shall create financial scenarios by changing:

* Total marketing budget.  
* Channel allocation.  
* Conversion rate.  
* Average order value.  
* Customer acquisition cost.  
* Retention rate.  
* Membership price.  
* Discount level.  
* Refund rate.  
* Gross margin.  
* Attribution model.

The system shall estimate:

* Leads.  
* Customers.  
* Revenue.  
* Profit.  
* ROI.  
* Payback period.  
* Customer lifetime value.  
* Budget variance.

---

# **63\. Attribution Alerts**

Users shall configure alerts for:

* Attributed revenue decline.  
* ROI below target.  
* Acquisition cost increase.  
* ROAS decrease.  
* Refund spike.  
* Unattributed revenue increase.  
* Attribution-processing failure.  
* Revenue reconciliation mismatch.  
* Model confidence decrease.  
* Budget overspend.  
* Payback-period deterioration.  
* CLV-to-CAC ratio below threshold.

Alerts may be delivered through:

* In-app notifications.  
* Email.  
* SMS.  
* WhatsApp.  
* Push notifications.  
* Collaboration tools.  
* Webhooks.

---

# **64\. Fraud and Invalid Traffic Handling**

The system shall identify and exclude:

* Bot traffic.  
* Click fraud.  
* Duplicate conversions.  
* Self-referrals.  
* Internal employee traffic.  
* Test transactions.  
* Fake leads.  
* Invalid affiliate activity.  
* Abnormal device patterns.  
* Suspicious geographic patterns.

Excluded records shall remain available for audit but shall not contribute to finalized attribution or ROI calculations.

---

# **65\. Multi-Currency Support**

The system shall support:

* Transaction currency.  
* Campaign cost currency.  
* Organization base currency.  
* Reporting currency.  
* Historical exchange rates.  
* Daily exchange rates.  
* Finance-approved exchange rates.  
* Currency conversion audit logs.

Revenue and cost must be converted using consistent and traceable exchange-rate rules.

---

# **66\. Tax and Fee Treatment**

Administrators shall configure whether calculations include or exclude:

* Sales tax.  
* Goods and services tax.  
* Payment fees.  
* Marketplace commissions.  
* Affiliate commission.  
* Delivery fees.  
* Refund fees.  
* Foreign exchange fees.

The selected treatment shall be visible in financial reports.

---

# **67\. Data Governance**

The system shall maintain governed definitions for:

* Marketing touchpoint.  
* Conversion.  
* Customer.  
* New customer.  
* Attributed revenue.  
* Influenced revenue.  
* Incremental revenue.  
* Marketing cost.  
* Customer acquisition cost.  
* Customer lifetime value.  
* ROAS.  
* Marketing ROI.  
* Payback period.  
* Gross margin.  
* Contribution margin.

Each definition shall have:

* Business owner.  
* Technical owner.  
* Calculation logic.  
* Effective date.  
* Approval status.  
* Version history.

---

# **68\. Role-Based Access Control**

Permissions shall include:

* View attribution dashboards.  
* View customer-level journeys.  
* View financial metrics.  
* Create models.  
* Simulate models.  
* Approve models.  
* Finalize attribution periods.  
* Manage costs.  
* Approve costs.  
* Export data.  
* View reconciliation.  
* Reprocess history.  
* Manage ROI targets.  
* View executive intelligence.

Customer-level and financial-level access must be separately controlled.

---

# **69\. Approval Workflows**

Approval may be required for:

* New attribution models.  
* Model changes.  
* Historical recalculation.  
* Cost adjustments.  
* Revenue corrections.  
* Attribution-period finalization.  
* Budget recommendations.  
* AI-generated financial actions.  
* Export of sensitive data.

Approval records shall include:

* Requester.  
* Approver.  
* Submitted time.  
* Decision time.  
* Comments.  
* Previous value.  
* New value.  
* Effective date.

---

# **70\. Audit Logging**

The system shall log:

* Model creation.  
* Model modification.  
* Model activation.  
* Model deactivation.  
* Conversion-definition changes.  
* Revenue adjustments.  
* Cost imports.  
* Cost approvals.  
* Historical recalculations.  
* Report exports.  
* Attribution finalization.  
* Reconciliation decisions.  
* Budget recommendation approvals.  
* Customer-level data access.

Audit records must be immutable for the configured retention period.

---

# **71\. Privacy and Consent**

Attribution processing shall respect:

* Customer consent.  
* Tracking preferences.  
* Communication permissions.  
* Geographic privacy rules.  
* Data-retention policies.  
* Customer deletion requests.  
* Purpose limitations.  
* Identity-resolution restrictions.

Where individual attribution is not permitted, the platform may use:

* Aggregated reporting.  
* Pseudonymized analysis.  
* Consent-mode estimation.  
* Privacy-preserving measurement.

Estimated results must be clearly labeled.

---

# **72\. Integration Requirements**

The module shall integrate with:

* Customer Data Platform.  
* CRM.  
* Lead Management.  
* Campaign Management.  
* Email Marketing.  
* SMS Marketing.  
* WhatsApp Marketing.  
* Push Notification System.  
* Landing Page System.  
* Workflow Engine.  
* AI Marketing Assistant.  
* A/B Testing Platform.  
* Payment Gateway.  
* Membership System.  
* Referral System.  
* Affiliate System.  
* Finance System.  
* Accounting System.  
* Advertising Platforms.  
* External Data Warehouse.  
* Business Intelligence Tools.

---

# **73\. Attribution API**

The platform shall provide secure APIs to:

* Submit touchpoints.  
* Submit conversions.  
* Retrieve attribution results.  
* Retrieve campaign ROI.  
* Retrieve channel ROI.  
* Retrieve customer journey.  
* Submit marketing costs.  
* Retrieve reconciliation status.  
* Trigger approved recalculation.  
* Retrieve model definitions.  
* Compare attribution models.

API controls shall include:

* Authentication.  
* Authorization.  
* Rate limiting.  
* Idempotency.  
* Request validation.  
* Audit logging.  
* Versioning.  
* Tenant isolation.  
* Field-level permissions.

---

# **74\. Performance Requirements**

| Capability | Target |
| ----- | ----- |
| Near-Real-Time Touchpoint Processing | Less than 60 seconds |
| Standard Conversion Attribution | Less than 30 seconds |
| Dashboard Initial Load | Less than 3 seconds |
| Model Comparison | Less than 10 seconds |
| Standard Historical Recalculation | Less than 15 minutes |
| ROI Dashboard Filter Update | Less than 3 seconds |
| Revenue Reconciliation Job | Within configured finance window |
| Attribution API Response | Less than 2 seconds |
| Alert Generation | Less than 5 minutes |
| Executive Summary Generation | Less than 15 seconds |

---

# **75\. Scalability Requirements**

The system shall support:

* Millions of customers.  
* Billions of touchpoints.  
* Millions of conversions.  
* Thousands of campaigns.  
* Multiple attribution models.  
* Multiple organizations.  
* Multiple currencies.  
* Multiple time zones.  
* Large historical recalculations.  
* High-volume recurring revenue events.

---

# **76\. Availability and Reliability**

Target availability:

* Attribution dashboard: 99.9%.  
* Touchpoint ingestion: 99.95%.  
* Revenue matching: 99.9%.  
* ROI calculation service: 99.9%.  
* Reconciliation service: 99.5%.

Reliability features include:

* Retry processing.  
* Duplicate protection.  
* Dead-letter queues.  
* Processing checkpoints.  
* Data reconciliation.  
* Backup.  
* Disaster recovery.  
* Calculation rollback.  
* Failure alerts.

---

# **77\. User Experience Requirements**

The user interface shall provide:

* Clear model selection.  
* Visible attribution window.  
* Revenue-basis indicator.  
* Currency indicator.  
* Data-freshness status.  
* Model explanation.  
* Calculation tooltips.  
* Drill-down from summary to transaction.  
* Export controls.  
* Comparison views.  
* Approval status.  
* Warning banners for incomplete data.

Complex financial metrics shall include plain-language explanations.

---

# **78\. Mobile Experience**

Mobile users shall be able to view:

* Attributed revenue.  
* Marketing spend.  
* ROI.  
* ROAS.  
* Customer acquisition cost.  
* Top-performing channels.  
* Budget alerts.  
* Revenue alerts.  
* AI recommendations.  
* Approval requests.

Detailed model creation and reconciliation shall remain desktop-focused.

---

# **79\. Testing Requirements**

Testing shall cover:

* Touchpoint collection.  
* Identity resolution.  
* Attribution windows.  
* Every standard attribution model.  
* Custom model rules.  
* Revenue matching.  
* Revenue deduplication.  
* Refund adjustments.  
* Recurring revenue.  
* Marketing cost allocation.  
* ROAS calculations.  
* ROI calculations.  
* CAC calculations.  
* CLV calculations.  
* Payback-period calculations.  
* Multi-currency conversion.  
* Reconciliation.  
* Permissions.  
* Audit logging.  
* API security.  
* Historical recalculation.  
* High-volume performance.

Financial formulas and attribution results shall have automated regression tests.

---

# **80\. Acceptance Criteria**

The chapter shall be considered functionally delivered when:

1. Eligible marketing touchpoints are captured and linked to customers.  
2. Conversions are matched with eligible touchpoints.  
3. First-touch and last-touch attribution operate correctly.  
4. Linear, position-based and time-decay models produce validated results.  
5. Custom attribution models can be created, tested and approved.  
6. Attributed revenue does not exceed eligible conversion revenue.  
7. Refunds and cancellations update net attribution.  
8. Marketing costs are imported and allocated correctly.  
9. ROAS, ROI, CAC, CLV and payback period are calculated accurately.  
10. Recurring revenue can be attributed using configurable rules.  
11. Attribution models can be compared.  
12. Revenue is reconciled with authoritative financial systems.  
13. Executive dashboards display trusted revenue impact.  
14. AI recommendations include evidence and confidence indicators.  
15. Permissions protect customer and financial data.  
16. Model changes and financial adjustments are fully audited.  
17. System performance meets agreed service targets.

---

# **81\. Dependencies**

The system depends on:

* Unified customer identity.  
* Customer Data Platform.  
* Event tracking framework.  
* Campaign identifiers.  
* Lead and opportunity data.  
* Conversion definitions.  
* Payment records.  
* Revenue records.  
* Refund records.  
* Marketing cost data.  
* Finance integrations.  
* Consent management.  
* Role-Based Access Control.  
* Analytics infrastructure.  
* AI and machine-learning services.

---

# **82\. Risks and Mitigation**

| Risk | Mitigation |
| ----- | ----- |
| Revenue double-counting | Enforce transaction-level deduplication |
| Incorrect identity matching | Use deterministic matching and confidence thresholds |
| Incomplete marketing touchpoints | Implement tracking health monitoring |
| Attribution model misunderstood | Provide model explanations and comparison views |
| Estimated revenue treated as realized | Separate estimated, influenced and collected revenue |
| Missing campaign costs | Display cost-completeness warnings |
| Refunds not reflected | Synchronize refund events and recalculate net revenue |
| Cross-device privacy risk | Require consent and approved identity rules |
| AI recommendations are misleading | Show evidence, confidence and human approval |
| Historical model changes alter reports | Preserve model versions and finalized snapshots |
| Finance and marketing totals differ | Provide reconciliation workflows |
| Excessive recalculation load | Use scheduled jobs, caching and processing limits |

---

# **83\. Future Enhancements**

Future capabilities may include:

* Fully autonomous attribution optimization.  
* Real-time causal attribution.  
* Privacy-preserving multi-touch attribution.  
* Federated attribution modeling.  
* Advanced media mix modeling.  
* Saturation and diminishing-return curves.  
* Autonomous budget redistribution.  
* AI finance-marketing reconciliation.  
* Predictive profitability by campaign.  
* Brand impact measurement.  
* Offline sales attribution.  
* Retail and location-level attribution.  
* Cross-organization benchmarking.  
* Revenue digital twin.  
* Multi-agent investment planning.  
* Real-time contribution-margin optimization.  
* Autonomous marketing portfolio management.

---

# **Chapter Summary**

This chapter defines the Marketing Attribution Models, Revenue Impact & ROI Measurement System for the Tamil Business Tribe Marketing Automation Platform.

The module provides a governed and auditable framework for connecting marketing touchpoints with leads, conversions, transactions, recurring revenue, customer lifetime value and long-term profitability.

It supports first-touch, last-touch, linear, position-based, time-decay, U-shaped, W-shaped, full-path, custom and data-driven attribution models. It also supports cross-device attribution, offline attribution, assisted conversions, view-through attribution, recurring revenue attribution, revenue deduplication, refund handling and financial reconciliation.

The system calculates marketing spend, return on ad spend, marketing ROI, customer acquisition cost, customer lifetime value, CLV-to-CAC ratio, contribution margin, incremental revenue and payback period.

Executive dashboards, predictive ROI forecasting, scenario planning, AI budget recommendations, model governance, approval workflows, privacy controls and audit logging ensure that marketing investments can be evaluated and optimized with enterprise-grade financial discipline.

---

# **End of Chapter 15**

# **Next Chapter**

## **Volume 14 – Part 1 – Chapter 16: Customer Lifecycle, Retention, Loyalty & Win-Back Automation System**

