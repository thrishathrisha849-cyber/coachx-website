# Feature Specification: Enterprise Retention Intelligence & Churn Prediction

**Feature Branch**: `040-retention-intelligence-churn-prediction`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14, Part 2, Chapter 7 — Enterprise Customer Retention Intelligence, Churn Prediction, Loyalty Analytics & Lifetime Value Optimization Platform (source: `document 1/Document 1 (39).md`)"

## User Scenarios & Testing *(mandatory)*

<!--
  Source: Volume 14, Part 2, Chapter 7. This chapter is the deepest, most granular
  churn-modeling and retention-economics authority in the PRD (166 numbered
  requirement sections). See "Assumptions" for its relationship to feature 029.
-->

### User Story 1 - Seven Churn Types Each Route to a Tailored Response (Priority: P1)

TBT recognizes that "churn" is not one problem. A customer who cancels a paid membership (Contractual Churn), a customer who stays subscribed but stops doing anything meaningful (Behavioral Churn), a customer whose recurring revenue drops through cancellation/downgrade/non-payment (Revenue Churn), a customer who stops using one specific TBT product (Product Churn), a customer who stops participating in communities (Community Churn), a customer who abandons courses/learning paths (Learning Churn), and a customer who unsubscribes or stops responding to messages (Communication Churn) are seven distinct business problems. The platform classifies every disengagement event into the correct churn type before any intervention is selected, so a course-abandonment signal never triggers a membership-cancellation save flow and vice versa.

**Why this priority**: Every downstream capability in this feature — health scoring, prediction, the Retention Decision Engine, journeys — depends on knowing *what kind* of churn is happening. Misclassifying churn type wastes intervention budget, sends the wrong message, and (per Chapter principle #14) conflates problems that must be treated differently. This is the foundational classification layer, hence P1.

**Independent Test**: Can be fully tested by seeding test customers with each of the seven churn signatures in isolation (e.g., one cancels payment only, one goes fully inactive while still paying, one stops course activity only while remaining active elsewhere) and confirming the system assigns the correct churn type to each — independently of prediction, health scoring, or loyalty features.

**Acceptance Scenarios**:

1. **Given** a customer cancels their paid membership, **When** churn classification runs, **Then** the event is classified as Contractual Churn (and additionally tagged Voluntary or Involuntary per the churn-category split).
2. **Given** a customer remains an active paying member but stops all meaningful platform activity, **When** churn classification runs, **Then** the event is classified as Behavioral Churn, distinct from Contractual Churn, and does not trigger a cancellation-flow message.
3. **Given** a customer stops engaging with courses specifically while remaining active in the community, **When** churn classification runs, **Then** the event is classified as Learning Churn, not Community Churn or generic Behavioral Churn.
4. **Given** a customer unsubscribes from all notifications but continues actively using the platform, **When** churn classification runs, **Then** the event is classified as Communication Churn only, and no membership-retention journey is triggered on that basis alone.

---

### User Story 2 - Voluntary vs. Involuntary Churn Routes Payment Failure to Recovery, Not Promotions (Priority: P1)

The platform splits every churn event into Voluntary (an intentional customer decision — low perceived value, pricing concerns, poor support, competing alternatives, etc.) or Involuntary (no explicit decision — payment failure, expired card, bank rejection, gateway error, billing error). Involuntary churn is routed to the Payment Recovery Service (smart retries, alternative payment methods, grace periods) rather than into standard promotional retention journeys, because offering a "come back, here's a discount" message to a customer whose card simply expired is both wasteful and confusing.

**Why this priority**: Sending a promotional win-back campaign to a customer whose payment method just failed misdiagnoses the problem, delays actual recovery (fixing the payment method), and can suggest the customer intentionally left when they did not. This split is called out as a core principle (#14) and its own dedicated component (Payment Recovery Service), making it P1.

**Independent Test**: Can be fully tested by simulating a payment-gateway failure event for a subscribed customer and confirming the system creates a payment-recovery workflow (retry schedule, payment-link, billing-support task) instead of enrolling the customer in a discount/promotional retention journey — independently of the Churn Prediction Engine or loyalty features.

**Acceptance Scenarios**:

1. **Given** a customer's renewal payment fails due to insufficient funds, **When** the churn event is processed, **Then** it is classified as Involuntary Churn and the customer enters the Payment Recovery workflow, not a promotional retention journey.
2. **Given** a customer explicitly cancels their subscription citing "no longer needed", **When** the churn event is processed, **Then** it is classified as Voluntary Churn and routed to the standard cancellation-flow save actions, not the payment-recovery workflow.
3. **Given** a payment failure is classified as "expired card" versus "bank rejection", **When** the recovery workflow is selected, **Then** each failure category receives its own configured recovery workflow rather than one generic retry.
4. **Given** smart payment retry is scheduled, **When** retry timing is calculated, **Then** it considers the customer's previous successful payment time, bank response code, time zone, and salary-cycle patterns, and the system enforces a limit on the number of retry attempts.

---

### User Story 3 - Customer Health Score With Named Status Bands and Rapid-Decline Alerts (Priority: P1)

Every active customer has a 0–100 Customer Health Score combining engagement, learning, community, product adoption, satisfaction, financial health, and loyalty component scores. The score maps to five named status bands — Thriving (81–100), Healthy (61–80), Watch (41–60), At Risk (21–40), Critical (0–20) — with configurable thresholds. Because a slow, steady decline and a sudden sharp drop mean different things even when the ending score looks similar, the system also alerts on rapid week-over-week or month-over-month decline even when the customer has not yet crossed into a high-risk band.

**Why this priority**: The Health Score is the primary early-warning signal every other retention capability (alerts, segmentation, journeys, prioritization) reads from. It must be accurate, named, and sensitive to *velocity* of change — not just static band membership — before anything downstream can be trusted. P1.

**Independent Test**: Can be fully tested by seeding a test customer's inputs to produce a score in each of the five bands, confirming the correct status label is assigned at each boundary, and then simulating a sharp week-over-week score drop that stays within the same band (e.g., 78 → 63, still "Healthy") to confirm a rapid-decline alert fires anyway — independently of churn prediction or loyalty features.

**Acceptance Scenarios**:

1. **Given** a customer's combined component scores compute to 34, **When** the Health Score is calculated, **Then** the customer is classified into the "At Risk" band (21–40).
2. **Given** a customer's score drops from 78 to 63 within one week (a 15-point decline that stays within the "Healthy" band), **When** the trend is evaluated, **Then** a rapid-decline alert is triggered even though the customer has not entered a high-risk band.
3. **Given** the platform tracks Health Score trends, **When** a customer's profile is viewed, **Then** current score, previous score, weekly change, monthly change, highest historical score, lowest historical score, and key positive/negative drivers are all displayed.
4. **Given** status-band thresholds are configured per customer type, **When** two customers of different types have the same raw score, **Then** they may be assigned to different status bands per their type-specific thresholds.

---

### User Story 4 - Churn Prediction Engine Outputs Probability, Risk Level, and Explainable Drivers (Priority: P1)

The Churn Prediction Engine estimates the probability a customer will churn within a configurable window (7/14/30/60/90 days, before next renewal, or during the current term). Every prediction carries churn probability, a risk level (Very Low through Critical Risk / Confirmed Churn), the prediction window, primary risk drivers in plain language, a confidence score, model version, prediction timestamp, and recommended review date. Authorized staff can drill into the underlying supporting events behind each driver — the prediction is never a black-box number.

**Why this priority**: Prediction is the platform's proactive core. Without explainability, customer success teams cannot act on a score responsibly, and per Core Principle #3 ("Churn predictions must be explainable") an opaque probability is not an acceptable output. P1.

**Independent Test**: Can be fully tested by feeding a test customer a known risk pattern (18 days no login, two payment failures, renewal due in 12 days, four dismissed notifications, one unresolved support ticket) and confirming the engine returns a probability, a risk level, and a driver list matching those inputs, with the supporting events retrievable by an authorized user — independently of health scoring or loyalty features.

**Acceptance Scenarios**:

1. **Given** a customer has no login for 18 days, declining course completion, two recent payment failures, a renewal due in 12 days, four dismissed notifications, and an unresolved support ticket, **When** the Churn Prediction Engine scores the customer, **Then** it returns a churn probability (e.g., 78%), a risk level of "High", and lists these events as primary risk drivers.
2. **Given** a prediction is generated, **When** an authorized user views it, **Then** the response includes prediction window, confidence score, model version, prediction timestamp, and recommended review date in addition to probability and risk level.
3. **Given** a prediction's model inputs are restricted to the approved input list, **When** a prohibited sensitive attribute is proposed as a model feature, **Then** the system rejects it unless explicitly approved and legally permitted.
4. **Given** a customer is scored under two different prediction windows (e.g., next 30 days vs. before next renewal), **When** both predictions are compared, **Then** each is stored and displayed as a distinct prediction with its own window, probability, and drivers.

---

### User Story 5 - Retention Decision Engine Treats "No Contact" as Valid and Enforces Discount Governance (Priority: P1)

The Retention Decision Engine scores every candidate intervention (no action, content recommendation, learning reminder, community invitation, customer success outreach, support escalation, renewal reminder, payment recovery message, loyalty reward, personalized offer, membership pause, downgrade, cancellation assistance, feedback request, reactivation campaign) using churn risk, customer value, predicted effectiveness, cost, preferences, communication fatigue, and eligibility — and explicitly treats "No Contact" as a first-class, valid outcome, not a fallback for engine failure. Before any offer reaches a customer, Discount Governance enforces maximum discount, offer frequency, lifetime usage caps, margin threshold, approval requirements, churn-reason relevance, and fraud checks so that customers who would renew anyway are not automatically discounted.

**Why this priority**: Core Principle #6 ("Not every customer should receive a discount") and #7 ("Customer dissatisfaction must not be hidden behind promotional offers") make this a governance-critical capability — unconstrained discounting directly erodes margin and, per the chapter's stated risk, unnecessary discounting is an explicitly named platform risk. P1.

**Independent Test**: Can be fully tested by (a) scoring a low-risk, high-satisfaction customer and confirming the engine can legitimately select "No Contact", and (b) attempting to issue a discount above the configured maximum, or to a customer who has exhausted lifetime offer usage, or whose churn reason is unrelated to price, and confirming Discount Governance blocks or requires approval — independently of holdout groups or loyalty features.

**Acceptance Scenarios**:

1. **Given** a healthy customer with low churn risk and no unresolved issues, **When** the Retention Decision Engine evaluates candidate actions, **Then** "No Contact" may be selected as the recommended action, and this is recorded as a deliberate decision, not an absence of a decision.
2. **Given** a customer's declared churn reason is "poor support experience" (not price), **When** a retention offer is considered, **Then** Discount Governance flags the discount as not relevant to the churn reason and the decision engine prioritizes support escalation over a discount.
3. **Given** a customer has already redeemed the maximum lifetime number of retention offers, **When** a new discount is requested for that customer, **Then** the system blocks automatic issuance and requires explicit approval, if permitted at all.
4. **Given** a customer has an open, unresolved complaint, **When** a retention offer is proposed as the response, **Then** the system blocks the discount from substituting for service recovery and requires the complaint to be addressed first.

---

### User Story 6 - Retention Holdout Groups Measure True Incremental Retention (Priority: P2)

Before crediting a retention intervention with "saving" a customer, the platform runs holdout/control groups so it can distinguish customers who were retained naturally (would have stayed anyway) from customers genuinely retained because of the intervention, customers who received the intervention but still churned, and customers who would likely have stayed even without the offer. Incremental retention — not raw post-intervention retention — is the reported metric, and the platform does not claim every retained customer as an intervention success.

**Why this priority**: Without holdouts, retention programs systematically overstate their own value (claiming credit for customers who would have renewed regardless), which corrupts ROI reporting, offer-optimization decisions, and discount-governance calibration. This is a measurement-integrity capability that depends on the decision engine already running, hence P2.

**Independent Test**: Can be fully tested by assigning a segment of at-risk customers to a holdout group (no intervention) and a treatment group (intervention delivered), then confirming the reported "incremental retention" figure is computed as the difference between the two groups' retention rates rather than the treatment group's raw retention rate — independently of loyalty or CLV features.

**Acceptance Scenarios**:

1. **Given** a retention experiment has both a treatment group (received an offer) and a holdout group (received no offer), **When** outcomes are measured, **Then** the platform reports incremental retention as the treatment group's retention rate minus the holdout group's retention rate, not the treatment group's raw retention rate alone.
2. **Given** a customer in the holdout group renews without any intervention, **When** results are tallied, **Then** this customer is recorded as "retained naturally," not attributed as an intervention success.
3. **Given** a customer in the treatment group churns despite receiving the intervention, **When** results are tallied, **Then** this customer is recorded as "received intervention but still churned," distinct from a customer who was never contacted.
4. **Given** an experiment's incremental retention is reported, **When** guardrail metrics are reviewed alongside it, **Then** complaint rate, unsubscribe rate, refund rate, satisfaction, discount dependency, support cost, and communication fatigue are also reported, not just the primary metric.

---

### User Story 7 - Loyalty Tiers With Points, Rewards, and Fraud Detection (Priority: P2)

Customers earn TBT Points for approved behaviors (course completion, daily learning, community contribution, referral, event participation, feedback, membership renewal) and progress through configurable loyalty tiers (e.g., Starter → Member → Silver → Gold → Platinum → Elite → Ambassador) based on transparent, documented qualification rules. Points are never awarded for abusive, fraudulent, or low-quality engagement, and the fraud-detection layer flags repeated self-referrals, duplicate accounts, artificial/automated engagement, reward abuse, and coordinated fraud, placing suspicious activity under review before rewards are honored.

**Why this priority**: Loyalty directly protects revenue (reward liability) and program integrity; without fraud detection, a points-and-tiers program becomes an attack surface. It is ranked P2 because it builds on top of — but does not gate — the core risk-detection and decision capabilities above.

**Independent Test**: Can be fully tested by crediting a test customer's points ledger through a qualifying activity, confirming tier progression recalculates against the documented qualification rule, then simulating a fraud pattern (e.g., rapid repeated self-referrals from related accounts) and confirming the activity is flagged and placed under review rather than silently rewarded — independently of churn prediction or CLV features.

**Acceptance Scenarios**:

1. **Given** a customer completes a course (an approved point-earning activity), **When** the activity is recorded, **Then** points are awarded per the configured point rule (respecting its daily/monthly limits) and the customer's tier progress is recalculated.
2. **Given** a customer's tier-qualifying activity (e.g., cumulative points, purchases, referrals) crosses a configured tier threshold, **When** qualification is re-evaluated, **Then** the customer's loyalty tier is updated and the qualification logic used is available for inspection.
3. **Given** a customer sends an unusually high volume of self-referrals in a short window from related accounts, **When** the fraud-detection layer evaluates the pattern, **Then** the activity is flagged as suspicious and placed under review, and points/rewards are not finalized until reviewed.
4. **Given** a customer redeems a reward, **When** the redemption flow runs, **Then** it verifies eligibility, verifies point balance, verifies reward availability, reserves inventory, deducts points, delivers the reward, confirms redemption, and records the transaction — in that order — before completing.

---

### User Story 8 - Customer Lifetime Value Split Into Historical, Current, and Predicted, With a High-Potential-Customer Category (Priority: P2)

The platform calculates Customer Lifetime Value across distinct types — Historical (realized past revenue/profit), Current Realized, and Predicted (future expected value) — rather than one blended number, and classifies customers into value bands (Negative, Low, Standard, High, Very High, Strategic, and High Potential). High-Potential Customers are explicitly called out: customers who currently show low revenue but strong engagement, high course completion, high referral probability, and high renewal probability — the system is required to avoid undervaluing new customers who simply lack transaction history yet.

**Why this priority**: CLV underpins prioritization (which customers get customer-success attention) and financial reporting (revenue at risk, retention ROI). It's ranked P2 rather than P1 because it is a valuation/prioritization layer that consumes signals already produced by health scoring and churn prediction, rather than a first-line detection capability.

**Independent Test**: Can be fully tested by computing Historical LTV from a test customer's actual past transactions, computing Predicted LTV from behavioral/engagement inputs, confirming both are stored and displayed separately (not merged into one figure), and confirming a new customer with strong engagement but minimal transaction history is classified "High Potential" rather than "Low Value" — independently of loyalty or holdout features.

**Acceptance Scenarios**:

1. **Given** a customer's full transaction history (membership payments, purchases, refunds, discounts, support cost), **When** Historical Lifetime Value is calculated, **Then** it is stored and displayed as a distinct figure from Predicted Lifetime Value.
2. **Given** a customer's purchase frequency, renewal probability, churn probability, and engagement signals, **When** Predicted Lifetime Value is calculated, **Then** it is computed separately from — and does not overwrite — Historical Lifetime Value.
3. **Given** a new customer has minimal purchase history but strong course completion, high engagement, and high renewal probability, **When** the customer is classified into an LTV band, **Then** the customer is placed in "High Potential" rather than "Low Value" or "Negative Value" solely due to limited transaction history.
4. **Given** Revenue at Risk is calculated for a customer, **When** the report is generated, **Then** it is derived from customer value, churn probability, renewal value, expected future purchases, and expected margin, and the report includes stated confidence and assumptions.

---

### Edge Cases

- **Churn-type conflict on a single customer**: A customer's payment fails (Involuntary Churn signal) in the same week they also stop all platform activity (Behavioral Churn signal) and had separately begun the cancellation flow before the payment failure occurred (Voluntary Churn signal). The source does not define a precedence order when multiple churn types/categories apply simultaneously to one customer, so the system needs a defined resolution rule (e.g., does an already-initiated voluntary cancellation suppress the payment-recovery workflow, or do both run concurrently and risk duplicate/conflicting messaging?). [NEEDS CLARIFICATION: no stated precedence rule across simultaneous churn types/categories]
- **Holdout group contamination**: A customer assigned to a retention experiment's holdout group (meant to receive no intervention) contacts support directly and a customer success agent manually offers them a retention discount outside the experiment framework, corrupting the incrementality measurement for that cohort. The source requires holdouts (§89) but does not specify how ad hoc human outreach is prevented from leaking into a controlled holdout population.
- **Discount Governance override abuse**: A customer success agent, authorized for manual override per §150, repeatedly overrides Discount Governance to grant maximum discounts outside the configured policy (e.g., for personal favors or to inflate their own retention-save metrics). The source requires overrides to carry a reason and audit entry, but does not define a review/escalation process for detecting a *pattern* of governance-bypassing overrides by a single user.
- **False positive vs. false negative tension**: The engine flags a customer as High Risk (78% probability) and an automatic offer is queued for approval, but the customer was already planning to renew regardless (a false positive) — issuing the discount erodes margin unnecessarily. Simultaneously, a different customer is scored Low Risk (a false negative) and receives no intervention, then churns without warning. Both are named risks in the source (§146–147), but the source does not specify how conflicting business pressure (avoid false positives to protect margin vs. avoid false negatives to protect revenue) is balanced when threshold tuning trades one against the other. [NEEDS CLARIFICATION: no stated policy for balancing false-positive vs. false-negative cost trade-offs during threshold calibration]
- **Rapid decline without band crossing, but journey triggers only fire on band change**: A customer's Health Score drops sharply (e.g., 78→63) within the same "Healthy" band. §22 requires an alert to fire on rapid decline regardless of band, but §37's journey triggers are described in terms of "health score decreases" generically — it is not specified whether a rapid intra-band decline alone is sufficient to enroll the customer in a retention journey, or whether journeys only fire on a full band transition. [NEEDS CLARIFICATION: relationship between rapid-decline alerts and journey-trigger enrollment is not fully specified]
- **Loyalty fraud false positive freezes a legitimate high-value customer**: A genuinely loyal, highly engaged customer triggers the fraud-detection pattern for "artificial engagement" (e.g., because they legitimately use the platform daily at high volume) and their account is placed under review. The source requires suspicious activity to be reviewed (§71) but does not specify what happens to the customer's points balance, reward eligibility, or tier status *during* the review window, risking real harm (frozen rewards, tier demotion) to a legitimate customer.
- **Communication fatigue vs. critical-risk urgency conflict**: A customer has accumulated a high communication-fatigue score (causing the decision engine to reduce/stop contact per §106) at the same moment they enter Critical churn risk with a same-business-day SLA target (§86). The source does not state which policy takes precedence — suppressing contact to respect fatigue, or overriding fatigue suppression because the case is time-critical. [NEEDS CLARIFICATION: no stated precedence between communication-fatigue suppression and critical-risk SLA outreach]
- **Reactivation of a customer marked "Unrecoverable"**: A customer previously classified into the "Unrecoverable Customers" reactivation segment (§57) later re-engages organically (e.g., visits the site, opens an old email) or explicitly requests to be reconsidered. The source does not specify whether "Unrecoverable" is a permanent suppression state or subject to periodic re-evaluation, risking either wasted reactivation spend (if re-evaluated too readily) or ignoring a genuinely returning customer (if permanently suppressed).
- **High-Potential vs. Negative-Value classification conflict**: A new customer shows strong engagement and high renewal probability (qualifying for "High Potential" per §79) but has also generated support/servicing cost that currently exceeds their revenue-to-date (qualifying for "Negative Value" per §78). The source states current value and future potential must be displayed separately but does not resolve which single band, if any, the customer is assigned to for prioritization purposes when both conditions are true simultaneously. [NEEDS CLARIFICATION: no stated resolution when a customer simultaneously qualifies for both a negative current-value band and the High-Potential future-value category]
- **Involuntary churn recovery succeeds after a voluntary cancellation was already confirmed**: A customer whose payment failed enters the payment-recovery workflow, but before recovery completes, the same customer separately confirms cancellation through the standard cancellation flow. The source treats these as two distinct workflows (payment recovery for involuntary churn, the cancellation flow for voluntary churn) but does not specify how a race between the two — recovery succeeding vs. cancellation being confirmed first — is resolved.

## Requirements *(mandatory)*

<!--
  Functional requirements below are extracted from the "shall"/requirement-style
  statements in Volume 14, Part 2, Chapter 7 (source: document 1/Document 1 (39).md,
  sections referenced inline as §N). Enumerated option lists within a single source
  requirement (e.g., "the platform shall support X, Y, Z") are consolidated into one
  FR per distinct capability rather than one FR per list item, except where the
  content requirements of this spec call for separate emphasis (e.g., named health
  score bands, named churn types).
-->

### Functional Requirements

#### Churn Types & Classification

- **FR-001**: System MUST support seven distinct churn-type definitions — Contractual Churn, Behavioral Churn, Revenue Churn, Product Churn, Community Churn, Learning Churn, and Communication Churn — each independently detectable and trackable per customer (§9.1–9.7).
- **FR-002**: System MUST classify every churn event into churn categories including Voluntary, Involuntary, Full, Partial, Product-specific, Temporary Inactivity, Seasonal Inactivity, Preventable, Unpreventable, Confirmed, Predicted, and Silent churn (§10).
- **FR-003**: System MUST route Involuntary Churn (payment failure, expired payment method, insufficient balance, bank rejection, gateway error, billing configuration error, account verification issue, technical renewal failure, incorrect customer information) to payment-recovery workflows rather than standard promotional retention journeys (§12).
- **FR-004**: System MUST maintain a standardized, configurable churn-reason taxonomy with primary categories (Price, Value, Content, Learning Experience, Community Experience, Customer Support, Product Quality, Technical Issue, Payment Issue, Privacy, Communication Frequency, Competitor, Goal Completed, Temporary Financial Difficulty, Personal Reason, Duplicate Membership, Unknown) and configurable subcategories per category (§13).
- **FR-005**: System MUST collect churn reasons from cancellation forms, exit surveys, support conversations, customer success calls, email responses, community feedback, payment records, product behavior, AI-assisted text analysis, and manual employee classification (§14).
- **FR-006**: System MUST distinguish and separately store customer-declared churn reasons from system-inferred churn reasons (§14).

#### Customer Health Score

- **FR-007**: System MUST calculate a Customer Health Score between 0 and 100 for every active customer, combining engagement, product adoption, learning progress, community participation, payment status, satisfaction, support experience, membership status, loyalty, retention probability, and revenue contribution (§19).
- **FR-008**: System MUST calculate seven named component scores contributing to the Health Score: Engagement Score, Learning Score, Community Score, Product Adoption Score, Satisfaction Score, Financial Health Score, and Loyalty Score (§20.1–20.7).
- **FR-009**: System MUST classify Health Score into five named status bands — Thriving (81–100), Healthy (61–80), Watch (41–60), At Risk (21–40), and Critical (0–20) — with thresholds configurable and permitted to differ by customer type (§21).
- **FR-010**: System MUST track Health Score trend data including current score, previous score, weekly change, monthly change, highest historical score, lowest historical score, key positive drivers, and key negative drivers (§22).
- **FR-011**: System MUST trigger an alert on rapid Health Score decline even when the resulting score has not entered a high-risk band (§22).

#### Early Warning Detection & Risk Alerts

- **FR-012**: The Early Warning Detection Engine MUST identify significant change signals including sudden inactivity, declining login frequency, reduced course progress, repeated content abandonment, reduced community participation, negative support sentiment, repeated application errors, failed payment, renewal-page visits without renewal, pricing-page visits before cancellation, notification disabling, email unsubscribe, refund request, cancellation-page visit, and account deletion request (§23).
- **FR-013**: System MUST track behavioral warning signals (session frequency/duration decreases, search activity stopping, ignored recommendations, ended learning streaks, stopped community interactions, unopened saved content, stopped premium-feature use, repeated empty states, error-triggered exits, no return after onboarding) (§24).
- **FR-014**: System MUST track financial warning signals (payment failure, expired card, reduced order value, membership downgrade, coupon dependency, frequent refund requests, late payment, reduced purchase frequency, renewal delay, cancelled auto-renewal, billing-support contact) and experience warning signals (low satisfaction, negative review, unresolved support ticket, long support response time, repeated complaints, poor onboarding completion, failed OTP, application crashes, slow page performance, broken/inaccessible content, incorrect recommendations) (§25, §26).
- **FR-015**: System MUST generate churn risk alerts containing customer ID, risk level, risk change, primary drivers, customer value, renewal date, recommended action, assigned owner, required response time, and alert status, deliverable via retention dashboard, customer success workbench, email, internal notification, CRM task, and team communication platform (§27).
- **FR-016**: System MUST prioritize alerts using churn probability, customer lifetime value, revenue at risk, renewal proximity, customer dissatisfaction, strategic importance, intervention probability, support severity, account size, and compliance urgency, such that a high-value customer with moderate risk may outrank a low-value customer with high risk (§28).

#### Churn Prediction Engine

- **FR-017**: The Churn Prediction Engine MUST estimate churn probability within configurable prediction windows: next 7, 14, 30, 60, or 90 days, before next renewal, or during the current membership term (§15).
- **FR-018**: Every churn prediction MUST include churn probability, risk level, prediction window, primary risk drivers, confidence score, model version, prediction timestamp, and recommended review date (§15).
- **FR-019**: System MUST classify churn risk into six levels — Very Low Risk, Low Risk, Moderate Risk, High Risk, Critical Risk, and Confirmed Churn — with thresholds configurable by product, membership plan, customer segment, geography, lifecycle stage, customer value, and renewal period (§16).
- **FR-020**: Churn Prediction Engine model inputs MUST be limited to an approved list (login frequency, days since last activity, session frequency/duration, course progress/abandonment, ebook reading, podcast listening, community activity, search activity, purchase frequency, membership tenure, renewal history, payment failures, support tickets, complaint history, satisfaction scores, notification/email engagement, referral activity, health score, product errors, application crashes); sensitive attributes MUST be restricted unless explicitly approved and legally permitted (§17).
- **FR-021**: System MUST provide an explainable, plain-language list of primary risk drivers for every churn prediction, and authorized teams MUST be able to view the underlying supporting events behind each driver (§18).

#### Retention Segmentation, Journeys & Renewal Intelligence

- **FR-022**: System MUST support retention segments including Healthy Customers, Rising Loyalty, New Customers at Risk, High-Value Customers at Risk, Renewal Due Soon, Payment Failure Risk, Learning Drop-Off, Community Disengagement, Product Adoption Risk, Dissatisfied Customers, Discount-Sensitive Customers, Dormant Customers, Recoverable Churn, Lost Customers, Brand Advocates, and Referral Champions (§29).
- **FR-023**: System MUST track each customer through a retention lifecycle of Healthy → Warning → At Risk → Critical → Cancellation Intent → Churned → Reactivation Eligible → Reactivated → Recovered, allowing movement between stages based on new behavior (§30).
- **FR-024**: Administrators MUST be able to configure automated retention journeys using triggers, conditions, wait periods, branches, actions, customer tasks, channel selection, goals, exit criteria, suppression criteria, and experiment groups (§36).
- **FR-025**: System MUST support retention journey triggers including health score decrease, churn risk increase, inactivity threshold, renewal approaching, payment failure, course abandonment, cancellation initiation, negative feedback, unresolved support ticket, disabled auto-renewal, loyalty milestone reached, and reactivation eligibility (§37).
- **FR-026**: System MUST support retention journey exit conditions including engagement resumption, payment success, renewal completion, support resolution, positive response, churn, consent withdrawal, entry into a conflicting journey, maximum journey duration reached, and manual intervention (§38).
- **FR-027**: System MUST predict renewal probability, expected renewal date, expected renewal revenue, renewal risk, renewal blockers, recommended reminder time, recommended channel, recommended message, and recommended customer success action per customer (§39).
- **FR-028**: System MUST support configurable renewal timeline stages (60/30/14/7/3 days before renewal, renewal day, grace period, post-expiry recovery) that may differ by membership plan (§40).
- **FR-029**: System MUST calculate a Renewal Readiness Score from current engagement, benefits used, learning completion, community participation, satisfaction, payment method validity, previous renewals, support issues, price sensitivity, and churn risk (§41).
- **FR-030**: The renewal experience MUST display renewal date, current plan, renewal amount, benefits, usage summary, achievements, saved content, renewal options, payment method, support contact, and cancellation/pause options, and MUST NOT use misleading urgency or hidden renewal terms (§42). Customers MUST be able to view/change auto-renewal status, update payment method, and access cancellation options, with all changes audit logged (§43).

#### Involuntary Churn Prevention & Payment Recovery

- **FR-031**: The Payment Recovery Service MUST support payment-method validation, pre-expiry reminders, smart payment retries, alternative payment methods, customer notifications, grace periods, payment-link generation, billing-support tasks, and recovery analytics (§44).
- **FR-032**: Smart Payment Retry timing MUST consider previous successful payment time, bank response code, customer time zone, salary-cycle patterns, payment-method type, retry history, and membership expiration date, and the system MUST limit excessive retry attempts (§45).
- **FR-033**: System MUST classify payment failures (insufficient funds, expired card, invalid card, bank rejection, authentication failure, gateway error, network error, customer cancellation, unknown failure) and route different categories to different recovery workflows (§46).
- **FR-034**: During a grace period, system MUST support configurable, plan-specific policies for maintaining full or limited access, displaying payment reminders, restricting premium actions, providing payment support, and pausing benefits after expiry (§47).

#### Cancellation, Pause, Downgrade & Retention Offers

- **FR-035**: The cancellation flow MUST display current plan, effective cancellation date, and access consequences; collect a cancellation reason; offer relevant support; present eligible alternatives; allow cancellation without obstruction; confirm cancellation; and provide reactivation instructions. The platform MUST NOT use deceptive cancellation barriers (§48).
- **FR-036**: System MUST offer cancellation save actions relevant to the customer's declared churn reason (membership pause, lower-cost plan, payment plan, technical support, customer success call, relevant content recommendation, reduced communication frequency, approved retention offer, or no alternative); retention actions MUST be relevant to the declared problem (§49).
- **FR-037**: System MUST support eligible-customer membership pause with configurable minimum/maximum pause duration, number of pauses allowed, access-during-pause, billing-during-pause, automatic restart, pre-restart reminder, and renewal-date adjustment (§50).
- **FR-038**: System MUST support membership downgrade offers that explain new price, new/removed features, effective date, billing impact, existing content access, and upgrade option (§51).
- **FR-039**: System MUST support configurable retention offer types (temporary discount, loyalty reward, free extension, bonus content, complimentary event access, membership pause, payment plan, plan downgrade, personal consultation), with availability governed by customer value, churn reason, offer history, profitability, membership plan, eligibility, and abuse-prevention rules (§52).

#### Retention Decision Engine & Discount Governance

- **FR-040**: The Retention Decision Engine MUST determine the most appropriate intervention per customer from a defined action set: no action, personalized content recommendation, learning reminder, community invitation, customer success outreach, support escalation, membership-benefit reminder, renewal reminder, payment recovery message, loyalty reward, personalized offer, membership pause, plan downgrade, cancellation assistance, feedback request, or reactivation campaign (§31).
- **FR-041**: System MUST score each candidate retention action using churn risk, customer value, customer need, predicted action effectiveness, action cost, customer preferences, communication fatigue, previous intervention history, eligibility, business policy, and customer-trust impact (§32).
- **FR-042**: System MUST treat "No Contact" as a valid, deliberate retention decision — not merely a default or fallback state (§32).
- **FR-043**: Before selecting a retention action, system MUST verify customer consent, communication preference, membership status, offer eligibility, previous reward usage, frequency limit, quiet hours, customer support status, geography, language, payment status, churn reason, legal restrictions, and fraud status (§33).
- **FR-044**: System MUST group retention interventions into five categories — Value Reinforcement, Friction Resolution, Engagement Recovery, Financial Support, and Human Intervention — each with a defined set of eligible actions (§34.1–34.5).
- **FR-045**: System MUST enforce Discount Governance controls including maximum discount, offer frequency, lifetime offer usage, margin threshold, approval requirement, customer eligibility, churn-reason relevance, experiment assignment, and fraud detection, to prevent unnecessary discounting (§53).
- **FR-046**: System MUST NOT automatically issue a discount to a customer who would renew without one; discount eligibility MUST be governed by Discount Governance rules rather than issued by default upon risk detection (§53).
- **FR-047**: System MUST evaluate retention offer performance using offer acceptance, renewal completion, incremental retention, revenue protected, margin impact, long-term retention, future discount dependency, customer satisfaction, and offer cost, and MUST generally prefer the lowest-cost effective intervention (§54).
- **FR-048**: System MUST NOT allow a discount or promotional offer to substitute for unresolved service recovery when low satisfaction or an open complaint is the detected driver (§105, §152).

#### Retention Holdout Groups & Experimentation

- **FR-049**: System MUST support holdout/control groups to determine whether a retention intervention produced additional value beyond what would have occurred naturally (§89).
- **FR-050**: System MUST distinguish customers retained naturally, customers retained after intervention, customers who received intervention but still churned, and customers who would likely have stayed without an offer (§89).
- **FR-051**: System MUST calculate Incremental Retention as the additional retention caused by an intervention compared with an appropriate control group, and MUST NOT claim all retained customers as intervention successes (§90).
- **FR-052**: System MUST support experiments across message content, communication channel, send time, intervention timing, renewal reminder frequency, loyalty reward, membership pause, payment retry strategy, retention offer, customer success outreach, reactivation content, and re-onboarding experience (§87).
- **FR-053**: Retention experiments MUST measure primary metrics (incremental retention, renewal rate, payment recovery, reactivation, 30-day retained engagement, incremental lifetime value, revenue protected, gross profit protected) and MUST be monitored against guardrails (complaint rate, unsubscribe rate, refund rate, customer satisfaction, discount dependency, support cost, communication fatigue) (§88).

#### Customer Reactivation

- **FR-054**: System MUST support reactivation eligibility evaluation using time since churn, churn reason, previous membership, customer value, past engagement, support history, communication consent, fraud status, previous reactivation attempts, available products, and current business relevance (§56).
- **FR-055**: System MUST support reactivation segments including Recently Churned, High-Value Lost Customers, Payment-Failure Churn, Temporary Inactivity, Completed-Goal Customers, Course-Abandonment Customers, Community-Dormant Customers, Offer-Responsive Customers, Long-Term Dormant Customers, and Unrecoverable Customers (§57).
- **FR-056**: System MUST run a reactivation journey that checks churn reason, identifies relevant new value, selects best channel/timing, and delivers a personalized reactivation message; on a positive response the system MUST provide guided re-onboarding with 30-day retention monitoring, and on no response MUST apply a cooldown period (§58).
- **FR-057**: Reactivated customers MUST be able to receive a welcome-back message, progress summary, new-content overview, updated product tour, personalized recommendations, membership-benefit reminder, payment-setup assistance, community reconnection, and customer success assistance (§59).

#### Loyalty System

- **FR-058**: Customer loyalty MUST be measured across six distinct dimensions — behavioral, emotional, financial, community, learning, and advocacy loyalty; a customer who repeatedly purchases but remains dissatisfied MUST NOT automatically be classified as highly loyal (§60).
- **FR-059**: The Loyalty Analytics Engine MUST measure membership tenure, renewal frequency, repeat purchase, product usage, learning consistency, community participation, referral activity, review activity, reward participation, satisfaction, advocacy, customer effort, and complaint history (§61).
- **FR-060**: System MUST calculate a Loyalty Score from 0 to 100 per customer from tenure, renewal behavior, engagement, advocacy, referrals, repeat purchases, satisfaction, community contribution, product adoption, and reward participation (§62).
- **FR-061**: System MUST support configurable Loyalty Tiers (e.g., Starter, Member, Silver, Gold, Platinum, Elite, Ambassador) with tier names, rules, and benefits configurable by TBT administrators (§63).
- **FR-062**: Loyalty tier qualification MUST support membership duration, TBT points, purchases, course completion, community contribution, referrals, event participation, customer conduct, and achievement milestones as inputs, and qualification logic MUST be transparent and documented (§64).
- **FR-063**: System MUST support configurable loyalty benefits including exclusive content, early access, event invitations, community privileges, mentor access, recognition badges, bonus points, priority support, member-only offers, referral rewards, and premium learning resources (§65).
- **FR-064**: System MUST award TBT Points only for approved behaviors (course completion, daily learning, community contribution, referral, event participation, feedback, achievement completion, membership renewal) and MUST NOT award points for abusive, fraudulent, or low-quality engagement; every point rule MUST define rule ID, activity, point value, daily limit, monthly limit, customer eligibility, effective date, expiration date, approval status, and fraud controls (§66, §67).
- **FR-065**: System MUST support multiple point-expiration models (no expiration, fixed expiration, rolling expiration, inactivity-based expiration, program-specific expiration) and MUST notify customers in advance of point expiration where required (§68).
- **FR-066**: The reward catalog MUST define, per reward, point cost, availability, eligibility, expiration, inventory, terms, and redemption limit; the redemption flow MUST verify customer eligibility, verify point balance, verify reward availability, reserve inventory, deduct points, deliver the reward, confirm redemption, record the transaction, and support reversal where permitted (§69, §70).
- **FR-067**: System MUST detect loyalty fraud patterns including repeated self-referrals, duplicate accounts, artificial engagement, automated activity, reward abuse, point transfer abuse, suspicious redemption patterns, multiple accounts on one identity, and coordinated fraud, and MUST place suspicious activity under review (§71).
- **FR-068**: System MUST identify customers likely to refer new members, write reviews, share content, participate in events, lead communities, mentor members, create success stories, or become brand ambassadors, and MUST calculate referral probability, best referral timing, preferred referral channel, recommended referral incentive, and customer advocacy score; referral requests MUST NOT be sent during unresolved negative experiences (§72, §73).

#### Customer Lifetime Value

- **FR-069**: System MUST support distinct CLV calculation types: Historical Lifetime Value, Current Realized Lifetime Value, Predicted Lifetime Value, Revenue Lifetime Value, Gross-Margin Lifetime Value, Contribution-Margin Lifetime Value, and Segment Lifetime Value (§74).
- **FR-070**: Historical Lifetime Value MUST be computed from membership payments, product/course/event/ebook purchases, upsells, cross-sells, refunds, discounts, support cost, reward cost, and payment fees (§75).
- **FR-071**: Predicted Lifetime Value MUST be computed from purchase frequency, average order value, membership tenure, renewal probability, churn probability, product adoption, engagement, customer segment, gross margin, future support cost, expansion probability, and referral value (§76).
- **FR-072**: System MUST separately calculate future expected revenue, future expected gross profit, expected retention duration, expected purchase frequency, expected expansion, expected servicing cost, expected reward cost, expected referral value, and churn-adjusted value as distinct LTV components rather than a single blended figure (§77).
- **FR-073**: System MUST classify customers into LTV bands — Negative Value, Low Value, Standard Value, High Value, Very High Value, Strategic Value, and High Potential — displaying current value and future potential separately (§78).
- **FR-074**: System MUST identify High-Potential Customers (currently low revenue but strong engagement, high course completion, high referral probability, rapid product adoption, strong community participation, business growth potential, high satisfaction, or high renewal probability) and MUST avoid undervaluing new customers with limited transaction history (§79).
- **FR-075**: System MUST calculate Revenue at Risk from customer value, churn probability, renewal value, expected future purchases, expected margin, contract status, and membership expiration, with reports including stated confidence and assumptions; system MUST also estimate Retention Value Opportunity (value protected if retained, cost of intervention, probability of successful retention, expected net retention value, customer experience impact, recommended action) (§80, §81).

#### Customer Success Prioritization

- **FR-076**: Customer Success teams MUST receive prioritized work queues with fields for customer, risk level, health score, lifetime value, revenue at risk, renewal date, primary issue, recommended action, last contact, assigned owner, due date, and priority (§82).
- **FR-077**: The Customer Success Workbench MUST provide a customer 360 profile, journey timeline, health score, churn risk, loyalty score, lifetime value, open support tickets, purchase history, learning progress, community activity, communication history, recommended action, notes, tasks, and outcome recording (§83).
- **FR-078**: Customer success users MUST be able to record contact attempt, contact channel, conversation summary, customer concern, customer sentiment, commitment, follow-up date, retention outcome, and escalation requirement (§84).
- **FR-079**: System MUST automatically create retention tasks when a high-value customer enters critical risk, renewal is approaching, payment recovery fails, negative feedback is submitted, a support issue remains unresolved, a customer requests cancellation, AI confidence is low, or a retention journey requires human contact (§85).
- **FR-080**: System MUST support configurable service-level response targets by case type/severity (e.g., critical high-value churn risk: same business day; payment recovery issue: within 24 hours; negative feedback: within 24 hours; renewal assistance: before renewal deadline; standard engagement risk: within 3 business days) (§86).

#### Communication Fatigue & Contact Policy

- **FR-081**: System MUST maintain a retention communication-fatigue score from message frequency, channel frequency, ignored messages, dismissed notifications, unsubscribe activity, negative responses, repeated offers, and recent support contacts; high fatigue MAY cause the Retention Decision Engine to reduce or stop communication (§106).
- **FR-082**: System MUST enforce a contact policy covering frequency caps, quiet hours, preferred channels, consent, language, time zone, message priority, journey conflicts, customer support status, and no-contact periods (§107).
- **FR-083**: System MUST support multilingual retention content in Tamil, English, Thanglish, and additional configured languages, adapting messages for preferred language, regional terminology, customer profile, channel restrictions, content availability, and communication tone (§109).

#### AI Retention Assistant & Explainability

- **FR-084**: The AI Retention Assistant MUST answer natural-language retention questions (e.g., which customers are most likely to churn, why churn increased, which customers need human outreach, which retention action works best for a given churn cause, which segments have highest LTV, where customer success should focus) (§110).
- **FR-085**: AI-generated customer risk summaries MUST present churn probability, revenue at risk, primary reasons, and a recommended action with reasoning (§111).
- **FR-086**: AI retention recommendations MUST include best intervention, timing, channel, message, need for human assistance, eligible offer, cooldown, no-contact decision, follow-up period, and expected value protected, and MUST include reasoning and a confidence score (§112).
- **FR-087**: The AI MUST perform churn root-cause analysis identifying top churn drivers, emerging churn reasons, affected segments, and correlated product/support/payment/content/geography/version/campaign factors (§113).
- **FR-088**: Every high-impact AI recommendation MUST include recommended action, main reasons, confidence, expected outcome, customer risks, alternative actions, model version, and supporting events (§149).
- **FR-089**: Per Constitution Article II (AI Is Assistive, Never Autonomous), authorized users MUST be able to override AI recommendations — change risk level, change case priority, reject a recommendation, select another action, suppress retention communication, approve/reject an offer, escalate support, pause automation, or close a case — and every override MUST require a reason and generate an audit entry (§150).

#### Retention Economics, Forecasting & Reporting

- **FR-090**: System MUST forecast customer retention, membership renewals, customer churn, revenue churn, reactivations, payment recoveries, lifetime value, loyalty growth, revenue at risk, and retention-program impact, with confidence ranges and stated assumptions (§114). System MUST support retention scenario planning (no intervention, increased CS capacity, new retention offer, improved onboarding, reduced support response time, improved payment recovery, increased loyalty rewards, reduced notification frequency, new membership plan, economic slowdown, price increase) (§115).
- **FR-091**: System MUST calculate retention economics: cost to retain, cost to reactivate, cost to serve, revenue protected, gross profit protected, incremental retention value, Retention ROI, reactivation ROI, loyalty-program ROI, discount cost, and reward liability (§116).
- **FR-092**: System MUST calculate Retention ROI using the finance-approved formula: **Retention ROI = (Incremental Profit Protected − Retention Program Cost) ÷ Retention Program Cost** (§117).
- **FR-093**: System MUST track loyalty program economics: points issued, points redeemed, points expired, outstanding points liability, reward cost, incremental purchases, incremental retention, incremental referrals, program operating cost, and loyalty-program ROI (§118). Finance reports MUST display outstanding point balance, estimated redemption rate, expected reward cost, expiration schedule, and liability by customer tier and reward type as a Reward Liability line item (§119).
- **FR-094**: System MUST provide an Executive Retention Dashboard showing overall retention rate, renewal rate, churn rate, revenue churn, high-risk customers, revenue at risk, health distribution, lifetime value, reactivation rate, payment recovery rate, loyalty-tier distribution, retention-program ROI, major churn drivers, forecast, and recommended actions (§120).
- **FR-095**: System MUST provide Customer Success, Membership, Loyalty, Churn, and Lifetime Value dashboards, each with the metrics defined in §121–§125 (assigned customers/critical alerts/renewals due for Customer Success; active memberships/cancellation-pause requests for Membership; tier distribution/points/fraud alerts for Loyalty; churn rate/trend/segment/plan/source breakdowns for Churn; LTV by segment/channel/plan/product and LTV-to-CAC ratio for Lifetime Value).
- **FR-096**: System MUST maintain approved metric definitions (logo churn, customer churn, membership churn, revenue churn, gross/net revenue retention, renewal rate, reactivation rate, payment recovery rate, retention rate, lifetime value, average customer lifespan, retention ROI, loyalty-program ROI) in the enterprise metrics catalog (§127).

#### Cohort, Survival & Retention Analytics

- **FR-097**: System MUST support retention cohort grouping by registration month, first purchase month, membership-start month, acquisition campaign, membership plan, geography, language, product, customer segment, onboarding experience, and retention intervention, and MUST report Day-1/7/30/60/90 retention, monthly retention, renewal rate, repeat purchase, revenue retention, lifetime value, and churn rate per cohort (§91, §92).
- **FR-098**: System MUST display a retention curve (percentage of customers remaining active over time) comparable by cohort, product, membership, channel, segment, geography, retention strategy, and application version (§93).
- **FR-099**: System MUST support survival analysis producing probability of remaining active, median customer lifetime, churn hazard by period, segment survival differences, intervention impact, and confidence ranges, and MUST identify churn hazard periods (e.g., first 7 days, after onboarding, after first course completion, before first renewal, after payment failure, after prolonged inactivity, after unresolved support issues) (§94, §95).
- **FR-100**: System MUST measure a retention funnel (New Member → Onboarding Completed → First Value Achieved → Weekly Engagement → Monthly Active Member → Renewal Eligible → Renewed → Loyal Member → Advocate) with drop-off tracked at every stage (§96).
- **FR-101**: System MUST analyze whether early activation indicators (first course started/completed, first community post, first saved item, first mentor interaction, first event attendance, first premium feature use, first referral) predict long-term retention (§97).

#### Governance, RBAC & Privacy

- **FR-102**: System MUST maintain retention governance covering churn definitions, health-score definitions, risk thresholds, retention offers, loyalty rewards, LTV models, contact policies, customer success procedures, AI recommendations, model deployment, data retention, and customer privacy (§142).
- **FR-103**: System MUST support role-based access control for Super Administrator, Retention Program Manager, Customer Success Manager, Customer Success Agent, Membership Manager, Loyalty Manager, Marketing Manager, Support Manager, Data Analyst, Data Scientist, Finance Reviewer, Compliance Officer, Executive Viewer, and Auditor roles, with permission controls over viewing churn scores/reasons/LTV, creating retention journeys, approving retention offers, assigning customer cases, editing loyalty rules, awarding points, reversing loyalty transactions, viewing financial values, exporting customer data, modifying models, approving high-risk actions, and viewing customer contact history (§140, §141).
- **FR-104**: System MUST enforce customer consent, restrict sensitive data, minimize personal information, support data access/deletion requests, apply retention policies, mask sensitive fields, restrict customer-level exports, record processing purposes, and respect no-contact requests (§151).

#### Model Quality, Bias & Ethics

- **FR-105**: Every churn, retention, or lifetime-value model MUST record model ID, owner, business purpose, training data, included/excluded features, validation results, bias review, accuracy metrics, version, deployment date, review date, approval status, and retirement status (§143).
- **FR-106**: Churn models MUST be evaluated on precision, recall, accuracy, F1 score, area under the ROC curve, calibration, lift, decile performance, false-positive rate, false-negative rate, revenue captured, and intervention effectiveness, considering business value alongside technical accuracy (§144).
- **FR-107**: System MUST monitor prediction calibration over time so that, e.g., a 70% churn probability corresponds to a comparable observed churn rate among similar customers (§145).
- **FR-108**: System MUST monitor and minimize harmful false positives (customers incorrectly predicted to churn, risking unnecessary discounting, excessive communication, poor experience, and increased cost) and MUST subject high-value false negatives (customers incorrectly predicted to remain who then churn) to additional analysis (§146, §147).
- **FR-109**: System MUST monitor model drift across feature drift, behavior changes, membership changes, pricing changes, customer-mix changes, prediction quality, churn-rate changes, calibration changes, intervention effectiveness, and data-quality changes; models exceeding drift thresholds MUST be reviewed or retrained (§148).
- **FR-110**: Per Constitution Article III (No Dark Patterns, No Guaranteed-Outcome Claims), the platform MUST NOT make cancellation intentionally difficult, misrepresent membership benefits, use false urgency, hide fees, automatically target vulnerable customers with aggressive offers, ignore explicit customer preferences, replace service recovery with discounts, use prohibited sensitive attributes, repeatedly contact customers after refusal, or prevent lawful account deletion (§152).
- **FR-111**: Per Constitution Article IV (Historical Immutability) as applied to model governance, model version and deployment date MUST be recorded on every prediction so that a prediction's origin remains attributable even after the model is later retrained or retired (§129, §143).

#### Security, Performance & Reliability

- **FR-112**: System MUST implement security controls (encryption at rest and in transit, role-based authorization, multi-factor authentication, API authentication, secret management, access reviews, network protection, data-loss prevention, suspicious-access alerts) and MUST audit-log risk-score access, model changes, threshold changes, retention-case creation, intervention delivery, offer approval, discount usage, loyalty-point changes, reward redemption, membership cancellation, manual override, customer data export, permission changes, and data deletion (§153, §154).
- **FR-113**: System MUST meet the following performance targets: customer health retrieval under 500ms; real-time risk update under 5 seconds after a critical event; retention recommendation under 1 second; Customer Success Dashboard under 3 seconds; loyalty balance retrieval under 500ms; reward redemption under 2 seconds; renewal processing under 5 seconds excluding payment-provider delay; platform availability 99.9% monthly (§155).
- **FR-114**: System MUST scale to support millions of customer profiles, large behavioral event volumes, continuous risk recalculation, real-time and batch scoring, multiple membership plans, high-volume loyalty-point transactions, multiple brands/tenants, scaled customer success queues, multi-year cohort data retention, and high-volume renewal periods (§156).
- **FR-115**: System MUST support redundant services, automated failover, cached risk/health scores, queue-based processing, payment-recovery retry, default retention rules, backup/recovery, disaster recovery, graceful degradation, and post-outage data reconciliation, and MUST handle defined error conditions (missing customer profile, incomplete behavior data, model-scoring failure, incorrect membership status, payment gateway failure, loyalty balance mismatch, duplicate reward transaction, journey delivery failure, CRM sync failure, missing consent, dashboard processing failure, data-source delay) via idempotent operations, configurable retries with exponential backoff, dead-letter queues, event replay, and duplicate prevention (§157, §158, §159).

### Key Entities *(include if feature involves data)*

- **Churn Type**: One of the seven classifications (Contractual, Behavioral, Revenue, Product, Community, Learning, Communication) describing *what kind* of disengagement is occurring for a customer, tracked independently of churn category.
- **Churn Category**: The Voluntary/Involuntary split (plus Full, Partial, Product-specific, Temporary/Seasonal Inactivity, Preventable/Unpreventable, Confirmed/Predicted/Silent) applied to a churn event, driving which workflow (payment recovery vs. promotional journey) is used.
- **Churn Reason**: A taxonomy entry (Price, Value, Content, Support, Payment, Privacy, Competitor, etc., with subcategories) attached to a churn event, tagged as customer-declared or system-inferred.
- **Customer Health Score**: A 0–100 composite score per active customer with seven component scores (Engagement, Learning, Community, Product Adoption, Satisfaction, Financial Health, Loyalty), mapped to five named status bands (Thriving/Healthy/Watch/At Risk/Critical), with trend history and rapid-decline alerting.
- **Churn Prediction**: A model output for a customer within a specific prediction window, carrying churn probability, risk level, confidence score, model ID/version, prediction/expiry timestamps, and review status.
- **Risk Driver**: A named, explainable factor (e.g., "no login for 18 days") contributing to a churn prediction or health-score decline, linked to underlying supporting events viewable by authorized users.
- **Retention Segment**: A named customer grouping (e.g., Payment Failure Risk, Discount-Sensitive Customers, Brand Advocates) used to target retention journeys and reporting.
- **Retention Case**: A tracked unit of work (case type, risk level, revenue at risk, trigger event, recommended action, assigned owner, due date, status, outcome) representing a customer needing retention attention.
- **Retention Decision / Intervention**: The Retention Decision Engine's selected action for a customer (including "No Contact" as a valid outcome), scored on risk, value, cost, and eligibility, and recorded with channel, offer/content reference, cost, delivery/response timestamps, retention outcome, and incremental value.
- **Discount Governance Rule**: A policy object constraining retention-offer issuance (maximum discount, offer frequency, lifetime usage cap, margin threshold, approval requirement, churn-reason relevance, fraud checks) that must be satisfied before an offer is delivered.
- **Retention Holdout Group**: A control-group assignment used to isolate the incremental effect of a retention intervention from natural (would-have-stayed-anyway) retention.
- **Membership Renewal**: A tracked renewal cycle (plan, due date, amount, auto-renewal status, payment-method status, renewal probability, payment status, renewed/expiration/grace-period timestamps).
- **Loyalty Account**: A customer's loyalty state (tier, point balance, lifetime points, points redeemed, tier start date, next-tier progress, loyalty score, referral count, fraud status).
- **Loyalty Tier**: A configurable named tier (e.g., Starter through Ambassador) with transparent qualification rules and associated benefits.
- **Loyalty Transaction**: An append-only ledger entry (issuance, redemption, expiry, reversal) against a Loyalty Account, per Constitution Article V.
- **Reward**: A catalog item redeemable for points, with point cost, availability, eligibility, expiration, inventory, terms, and redemption limit.
- **CLV Category**: One of Historical, Current Realized, Predicted, Revenue, Gross-Margin, Contribution-Margin, or Segment Lifetime Value — each calculated and displayed as a distinct figure — plus the value-band classification (Negative/Low/Standard/High/Very High/Strategic/High Potential).
- **Lifetime Value Record**: The stored calculation output combining historical and predicted revenue/profit, support/reward cost, churn probability, predicted lifetime months, total predicted LTV, confidence range, and model version.
- **Retention Model**: A governed churn/retention/LTV model with owner, purpose, training data, included/excluded features, validation results, bias review, accuracy metrics, version, deployment/review dates, and approval status.
- **Customer Success Queue Item / Workbench Profile**: The prioritized, aggregated view (health score, churn risk, LTV, revenue at risk, open tickets, recommended action) customer success staff act on.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every active customer has a current Customer Health Score (0–100, mapped to one of the five named status bands) available for retrieval in under 500ms, per the platform's stated performance target.
- **SC-002**: 100% of churn predictions generated by the Churn Prediction Engine include probability, risk level, prediction window, confidence score, model version, and an explainable, drill-down-capable list of primary risk drivers.
- **SC-003**: 100% of involuntary-churn events (payment failure and its named subcauses) are routed to the payment-recovery workflow rather than a standard promotional retention journey, measured against churn-category classification logs.
- **SC-004**: Retention recommendation generation completes in under 1 second, and real-time risk updates reflect a critical event within 5 seconds, per the stated performance targets.
- **SC-005**: 100% of retention offers issued through automated flows pass Discount Governance checks (maximum discount, lifetime usage cap, churn-reason relevance, margin threshold) before delivery; zero automated discounts are issued to customers who have exhausted lifetime offer usage or whose churn reason is flagged as discount-irrelevant.
- **SC-006**: For every retention experiment with a defined holdout group, Incremental Retention is reported as treatment-minus-holdout retention rate (not raw treatment retention), and reported alongside all required guardrail metrics (complaint rate, unsubscribe rate, refund rate, satisfaction, discount dependency, support cost, communication fatigue).
- **SC-007**: Retention ROI is calculated and reported on the Executive Retention Dashboard using the finance-approved formula: Retention ROI = (Incremental Profit Protected − Retention Program Cost) ÷ Retention Program Cost.
- **SC-008**: 100% of loyalty-fraud detection matches (self-referral abuse, duplicate accounts, artificial engagement, coordinated fraud, etc.) are placed under review prior to reward finalization, and zero points are awarded for behaviors outside the approved point-rule catalog.
- **SC-009**: 100% of AI-generated retention recommendations include reasoning, confidence score, and model version; 100% of human overrides of AI recommendations carry a reason and produce an audit log entry.
- **SC-010**: New customers with limited transaction history but strong engagement/completion/renewal signals are classified into the "High Potential" LTV band rather than "Low Value" or "Negative Value" — verified by band-assignment audit against the stated qualification criteria — and Historical, Current, and Predicted LTV are always displayed as distinct figures, never merged into one blended number.

## Assumptions

- **This chapter is the authoritative churn-modeling and retention-economics source; feature 029 defers to it.** Feature 029 (`specs/029-customer-lifecycle-retention-loyalty/spec.md`, source Volume 14 Part 1 Chapter 16) already defines a first-pass Churn Prediction Engine (its §8) and Predictive Retention Analytics (its §22) for lifecycle-stage transitions, and its own spec explicitly flags this overlap and names feature 040 as authoritative for deeper churn modeling. This spec is that authoritative source: the seven churn types, churn-category split, explainable risk-driver model, Discount Governance, Retention Holdout Groups, and the Historical/Current/Predicted/High-Potential CLV framework defined here are the canonical definitions. Where feature 029 needs churn-probability, risk-level, or retention-recommendation data to drive lifecycle-stage transitions or win-back automation, it is assumed to consume the outputs of this feature's Churn Prediction Engine and Retention Decision Engine rather than maintaining a competing, shallower model. Feature 029 retains ownership of the customer-lifecycle-stage state machine and its own loyalty-points/tier mechanics at the lifecycle-consumption level; this feature owns the deeper predictive-modeling, discount-governance, holdout-measurement, and lifetime-value internals.
- The chapter's currency examples (e.g., "₹14,500 revenue at risk") are illustrative; actual currency/locale handling is assumed to follow platform-wide localization and finance conventions defined elsewhere in the PRD (e.g., the payments/finance chapters), not redefined by this feature.
- "TBT Points" as the loyalty currency is assumed to be the same points system referenced in the gamification chapter (Volume 04/06) and feature 029's loyalty mechanics; this chapter does not redefine the point-issuance mechanics for non-retention contexts (e.g., course-completion gamification), only the retention/loyalty-specific rules (point rules, expiration, reward catalog, fraud detection) layered on top of that shared ledger, per Constitution Article V (ledger-based internal economies).
- Model-specific numeric thresholds (e.g., the exact probability cutoffs separating "Moderate Risk" from "High Risk", exact discount percentage caps, exact fatigue-score thresholds) are described in the source as configurable rather than fixed, so this spec treats them as admin-configurable settings rather than hard-coded values requiring clarification.
- The chapter does not specify a precedence/conflict-resolution mechanism when multiple churn types, categories, or journeys apply to the same customer simultaneously, nor a hysteresis/cooldown rule preventing threshold-boundary flapping; these gaps are flagged inline via `[NEEDS CLARIFICATION]` in Edge Cases rather than silently resolved, per the constitution's governance rule for ambiguous or contradictory source material.
- Integration touchpoints named in the source (Unified Customer Profile, Customer Data Platform, Segmentation Platform, Journey Analytics, Personalization Engine, Marketing Automation, CRM, Support, LMS, Community, Membership, Commerce, Payment Gateway, Notification Service, Finance System, Data Warehouse, BI Platform, AI/ML Platform) are assumed to be provided by their respective owning features elsewhere in the PRD; this feature defines what it needs from them and what events it emits, not their internal implementation.
