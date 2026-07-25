# Feature Specification: Digital & Services Marketplace: Vendors, Orders & Commission Engine

**Feature Branch**: `011-digital-marketplace`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 11 of the TBT One Enterprise PRD — Marketplace, Digital Products, Services Marketplace, Vendor Management, Mentor Marketplace, Freelancer Marketplace, Digital Downloads, Orders, Inventory, Reviews, Fulfilment, Commission Engine and Marketplace Administration. Source: `document 1/Document 1 (10).md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seller Onboarding, Verification & Store Activation (Priority: P1)

A Tamil creator, freelancer, mentor, instructor, agency or business vendor applies to become an approved marketplace seller. They select a seller type, submit personal/business details, identity and (where applicable) business/tax documents, bank/payout information, skills or categories, and a portfolio, then accept the versioned seller agreement. The application passes an automated risk check and manual review before the seller is approved and their store/dashboard is activated. Without an approved seller, there is no supply side to the marketplace at all — every other story depends on this one.

**Why this priority**: Nothing else in the marketplace (listings, orders, commission, payouts) can exist without a controlled, verified seller base. This is the foundational gate that protects buyer trust and legal compliance (Article III: no guaranteed-outcome claims; Security Baseline: MFA for sensitive roles).

**Independent Test**: Can be fully tested by submitting a complete seller application through automated and manual review to an Approved decision and confirming the seller dashboard activates — independent of any listing or order functionality existing yet.

**Acceptance Scenarios**:

1. **Given** a registered member with no seller account, **When** they select "Become a Seller," choose a seller type, and submit all required application fields plus identity documents, **Then** the application enters "Submitted" status and triggers an automated risk check.
2. **Given** an application that passed automated review, **When** a marketplace reviewer manually evaluates identity validity, portfolio quality, category eligibility and fraud signals, **Then** the reviewer records a decision (approve/reject/request changes) with reason, evidence and appeal availability attached to the application.
3. **Given** an approved seller who has not yet accepted the current seller agreement version, **When** they attempt to activate their store, **Then** the system blocks activation until the agreement is accepted and the consent timestamp/version is recorded.
4. **Given** an agency-type seller account, **When** the owner invites a staff member as "Order Manager," **Then** that staff member can manage orders but cannot view tax data, update payout details, or request withdrawals.

---

### User Story 2 - Buyer Purchases a Protected Digital Download (Priority: P1)

A buyer purchases an ebook, template, or source-code product. After payment is verified server-side, the system creates a download entitlement and issues a signed, time-limited, watermarked download link tied to that specific buyer, order and file version — never a public permanent URL. Every download attempt is logged, and the seller's earnings enter "pending" state until the refund window closes.

**Why this priority**: Digital downloads are the marketplace's simplest and highest-volume transaction type, and digital piracy/content protection is a named Security Baseline requirement (signed/expiring URLs, watermarking). Getting this wrong directly threatens seller trust and legal exposure.

**Independent Test**: Can be fully tested by completing a digital-product checkout, verifying payment, and confirming a signed download URL is issued, watermarked, logged, and rejected once expired or once the download limit is reached — independent of service or physical fulfilment.

**Acceptance Scenarios**:

1. **Given** a buyer has completed payment for a digital ebook, **When** the payment webhook is verified, **Then** the system creates a download entitlement, marks the order paid, and enables a signed, time-limited download URL scoped to that buyer and order.
2. **Given** a buyer downloads a purchased PDF, **When** the file is served, **Then** it is watermarked with the buyer's name/email, order number and download date, and the download event is logged.
3. **Given** a buyer has already reached the product's configured download limit, **When** they attempt another download, **Then** the system returns `DOWNLOAD_LIMIT_REACHED` and denies access.
4. **Given** a signed download URL that has passed its expiry time, **When** it is requested again (including by a third party the link was shared with), **Then** the system returns `DOWNLOAD_LINK_EXPIRED` and does not serve the file.

---

### User Story 3 - Buyer Purchases a Fiverr-Style Service Package and Seller Delivers (Priority: P1)

A buyer selects a seller's Basic/Standard/Premium service package (or adds add-ons), pays, and the order enters the seller's acceptance queue. The seller accepts (or the order auto-accepts per their settings), the buyer submits mandatory requirements, the fulfilment clock starts, the seller submits a delivery, the buyer either requests a revision within policy or the delivery is accepted/auto-accepted after the review window, and the seller's earnings are released.

**Why this priority**: This is the marketplace's core services transaction — the workflow that most freelancers, agencies, mentors and instructors will use, and it is the primary driver of the escrow/dispute/revision machinery described throughout the source.

**Independent Test**: Can be fully tested end-to-end by purchasing a package, submitting requirements, having a seller submit a delivery, and confirming the order auto-completes and earnings release after the review window with no dispute — independent of digital-download or physical-product flows.

**Acceptance Scenarios**:

1. **Given** a buyer has purchased a Standard package with manual seller acceptance, **When** the seller does not respond within the configured acceptance time limit, **Then** the order auto-cancels, the buyer is refunded, and the seller's acceptance-rate performance metric is affected.
2. **Given** a service order awaiting mandatory buyer requirements, **When** the buyer has not yet submitted them, **Then** the delivery-deadline clock has not started.
3. **Given** a seller has submitted a delivery and the buyer's revision allowance is exhausted, **When** the buyer requests further free changes beyond original scope, **Then** the seller can mark the request "out of scope" and send an additional paid offer instead of being forced to comply for free.
4. **Given** a delivery was submitted and the buyer neither accepted nor disputed it before the review window expired, **When** the window closes, **Then** the order auto-completes and the seller's earnings move out of pending/on-hold status toward available balance.

---

### User Story 4 - Multi-Seller Cart Checkout Splits into Seller Suborders (Priority: P1)

A buyer adds items from three different sellers (a template, a service package, and a mentor session) into one cart and checks out once. The system validates every line item (price, stock, seller active status, licence conflicts, region), creates a single parent marketplace order, and splits it into independent seller suborders — each with its own gross amount, tax allocation, discount allocation, commission, fulfilment status and payout trail.

**Why this priority**: Multi-vendor cart and order-splitting is the architectural backbone that every other financial and fulfilment feature (commission engine, payouts, refunds, disputes) is built on top of; without correct order-splitting, seller earnings and buyer expectations both break.

**Independent Test**: Can be fully tested by checking out a cart containing items from 2+ distinct sellers and verifying one parent order and multiple correctly-allocated seller suborders are created, independent of any single seller's fulfilment workflow completing.

**Acceptance Scenarios**:

1. **Given** a cart with items from Seller A and Seller B plus a marketplace-wide coupon, **When** checkout completes, **Then** one parent marketplace order is created and two seller suborders exist, each with its own proportionally allocated discount, tax and commission.
2. **Given** a cart item whose price changed or whose seller was suspended between add-to-cart and checkout, **When** the buyer proceeds to checkout, **Then** the system blocks or flags that specific line item without invalidating the rest of the cart.
3. **Given** a successful payment webhook is delivered twice due to a network retry, **When** the second copy is processed, **Then** the system's idempotency check ensures inventory is not decremented twice and no duplicate suborder is created.
4. **Given** a multi-seller bundle where one included seller has not consented to the bundle terms, **When** the bundle is submitted for publication, **Then** the system blocks publication until every seller's consent and revenue/refund/tax allocation is recorded.

---

### User Story 5 - Escrow-Style Payment Holding Until Buyer Acceptance or Auto-Completion (Priority: P2)

Where legally and technically supported, funds paid by the buyer are held as pending seller earnings rather than released immediately. Earnings only become payable after the buyer accepts delivery (or a milestone is approved, or the review window expires with no dispute), giving both sides a protected settlement window.

**Why this priority**: This is the trust mechanism that underlies the whole "buyer protection / seller protection" framing of the volume and directly implements Article V (ledger-based, non-mutable balances) and Article IV (historical snapshot) at the payment layer. It is P2 rather than P1 because it is a refinement of order completion (US3/US4) rather than a standalone transaction type.

**Independent Test**: Can be fully tested by completing a service order, confirming the seller's earning sits in "Pending"/"On Hold" status immediately after delivery, and only transitions to "Approved"/"Available" once the dispute/refund window has closed with no open dispute.

**Acceptance Scenarios**:

1. **Given** a buyer has paid for a service, **When** payment is verified, **Then** the full amount is recorded as pending seller earnings, not as an immediately payable balance.
2. **Given** a seller has delivered and the buyer has not yet accepted, **When** the buyer opens a dispute before the review window closes, **Then** the held funds remain non-payable until the dispute is resolved.
3. **Given** the refund/dispute window has closed with no dispute opened, **When** the window expires, **Then** the held funds become payable and move toward the seller's available balance and next scheduled payout.
4. **Given** the escrow-style holding feature, **When** any user-facing copy describes it, **Then** the system does not represent itself as a legally regulated escrow provider unless that status has been separately legally approved.

---

### User Story 6 - Freelance Project Posting and Proposal Bidding (Priority: P2)

A business buyer posts a project (title, description, required skills, budget range, deadline, experience level) instead of buying a pre-packaged listing. Verified freelancers submit proposals (cover letter, price, timeline, milestones). The buyer reviews, shortlists, messages, and awards the project to one freelancer, converting the accepted proposal into an order.

**Why this priority**: This is a materially different discovery/commerce model (buyer-initiated request vs. seller-initiated listing) that a meaningful share of freelance/consulting demand requires, but it is a smaller subset of total marketplace volume than direct listing purchase, justifying P2.

**Independent Test**: Can be fully tested by posting a project, receiving and shortlisting multiple proposals, and awarding one — independent of digital-download or physical-product flows, though the awarded proposal ultimately feeds into the same order/suborder machinery as US3.

**Acceptance Scenarios**:

1. **Given** a buyer posts a project with a proposal deadline, **When** an unverified or category-ineligible freelancer attempts to submit a proposal, **Then** the system blocks submission per proposal-eligibility rules.
2. **Given** a project has received multiple proposals, **When** the buyer shortlists two and rejects the rest, **Then** rejected freelancers are notified and shortlisted freelancers can be messaged directly.
3. **Given** a buyer accepts a freelancer's proposal, **When** acceptance is confirmed, **Then** the project status becomes "Awarded," the proposal's price/timeline/milestones become the order's locked-in snapshot, and the project moves to "In Progress."
4. **Given** a freelancer submits many near-identical proposals across unrelated projects in a short window, **When** the anti-spam system evaluates the pattern, **Then** it is flagged for copy-paste/duplicate-detection review rather than published unchecked.

---

### User Story 7 - IP Rights Holder Takedown Complaint and Seller Counter-Notice (Priority: P2)

A rights holder submits a copyright/IP complaint against a listing they believe infringes their content. The platform validates the claimant's identity and claim, temporarily reviews the listing, notifies the seller where appropriate, requests evidence, and decides to remove, restore, or restrict the listing. The seller may respond or submit a counter-notice where legally applicable, and a strike is recorded against the seller's account regardless of outcome tracking.

**Why this priority**: Copyright/IP protection is explicitly called out as a named marketplace risk category and moderation stage, and mishandling it creates direct legal exposure for TBT — but it affects a minority of listings at any given time relative to core commerce flows, justifying P2 over P1.

**Independent Test**: Can be fully tested by submitting an IP complaint against a live listing and confirming the listing enters review, the seller is notified, evidence is requested, and a final removal/restoration decision with an audit trail and strike record is produced — independent of any specific buyer purchase happening.

**Acceptance Scenarios**:

1. **Given** a rights holder submits a complaint with supporting evidence against a template listing, **When** the complaint is validated, **Then** the listing enters temporary review and the seller is notified where appropriate.
2. **Given** a seller believes the complaint is invalid, **When** they submit a counter-notice with evidence of ownership or licence, **Then** the counter-notice is recorded and considered before a final removal/restoration decision.
3. **Given** a listing is found to infringe, **When** the decision is finalized, **Then** the listing is removed, a seller strike is recorded, affected orders/buyers are assessed, and refund eligibility is evaluated.
4. **Given** a seller disagrees with the final decision, **When** they invoke the appeal process, **Then** the appeal is tracked as a distinct, auditable step separate from the original complaint resolution.

---

### User Story 8 - Seller Reputation and Level Progression (Priority: P2)

As a seller completes orders, receives reviews, maintains response time and avoids disputes/cancellations, the system recalculates their internal reputation score and, where thresholds are met, promotes them through defined seller levels (New Seller through Top Seller / TBT Certified / TBT Partner), which in turn affects discoverability, sorting and buyer trust signals.

**Why this priority**: Reputation and leveling drive marketplace quality and buyer trust over time and are explicitly protected by Article VIII (no pay-to-win), but they are a derived/background system rather than a transaction path a buyer or seller directly initiates, justifying P2.

**Independent Test**: Can be fully tested by simulating a seller's order-completion, rating and dispute history over time and confirming the computed level changes only through the documented inputs — never through direct manual edit without an audit trail.

**Acceptance Scenarios**:

1. **Given** a New Seller completes their first ten orders with high ratings and zero disputes, **When** the level-calculation job runs, **Then** their level is automatically recalculated using completed orders, revenue, rating, response rate, cancellation rate, on-time delivery, dispute rate and policy compliance.
2. **Given** an admin wants to manually set a seller's level, **When** they attempt to do so outside the calculated process, **Then** the system requires an audit-logged justification and does not allow silent inflation.
3. **Given** a seller with a rising dispute rate, **When** the reputation score recalculates, **Then** the seller receives understandable improvement guidance without exposing the exact internal scoring formula.
4. **Given** a buyer views a seller's public profile, **When** the page renders, **Then** it shows the seller's level, rating, response time, completion rate and on-time delivery rate without exposing raw internal fraud/reputation signals.

---

### User Story 9 - Negative Seller Balance Recovery After Chargeback (Priority: P3)

A buyer successfully disputes a charge with their bank (chargeback) or wins a marketplace dispute after the related seller earnings have already been paid out. The seller's wallet balance goes negative. The system recovers the deficit through defined paths — deducting future earnings, requesting repayment, holding future payouts, restricting the account, or escalating legally for serious cases — never by silently rewriting the ledger.

**Why this priority**: This is a lower-frequency exception-handling path compared to the core commerce flows above, but it is explicitly named in the source as a distinct required capability with defined recovery options, and it is a direct test of Article V (ledger-based economies, no mutable balance field).

**Independent Test**: Can be fully tested by simulating a payout followed by a chargeback on the same order and confirming the wallet ledger shows a negative derived balance, future earnings are automatically applied against it, and no direct balance field is overwritten outside an audited adjustment entry.

**Acceptance Scenarios**:

1. **Given** a seller has already been paid out for an order, **When** a chargeback is received on that order, **Then** a reversal ledger entry is created and the seller's derived available balance goes negative.
2. **Given** a seller has a negative balance, **When** a new order's earnings become available, **Then** the system automatically applies the new earnings against the negative balance before releasing any positive payout.
3. **Given** a seller's negative balance persists beyond a configured threshold with no offsetting earnings, **When** the recovery workflow evaluates the account, **Then** payouts are held and/or a direct repayment request is triggered, with admin able to escalate to legal review for serious cases.
4. **Given** a negative-balance write-off is proposed by an admin, **When** the write-off is submitted, **Then** it requires dual approval and produces an audit record before the balance is adjusted.

---

### Edge Cases

- A buyer who legitimately downloaded a digital file shares the signed URL publicly (forum, piracy site); the URL must expire and be scoped to that buyer/order so redistribution has a limited blast radius, and abuse-pattern detection must flag unusual download-volume spikes on that entitlement.
- A buyer opens a dispute in the final minutes of the auto-completion review window; the system must not auto-complete the order (and release escrowed earnings) once a dispute is open, even if the window timer has otherwise expired.
- A seller attempts to list a prohibited item (e.g., pirated software, a "guaranteed income" scheme, or a personal-data list) disguised under an innocuous title; automated content validation, pricing-anomaly checks and manual/legal moderation must catch this before or during publication, not only after buyer complaints.
- An attacker who has compromised a seller's session attempts to change the seller's bank account or add a new payout method; this must be blocked by the high-risk-action controls (recent re-authentication, OTP/MFA, device verification, email notification, cooling period) regardless of whether the session itself is valid.
- A payment success webhook is delivered more than once (network retry or provider replay); idempotency checks must prevent double stock decrement, duplicate suborder creation, or double commission/earning entries.
- A buyer uses the "revision request" feature repeatedly to add work that was never part of the original package scope, attempting to get free additional deliverables; the seller must be able to mark requests "out of scope" and require a paid additional offer instead.
- A seller in a multi-seller product bundle withdraws consent, or one seller in the bundle is suspended, after the bundle is already published and purchasable; the system must handle bundle-item unavailability without silently mischarging or misallocating the remaining sellers' revenue.
- A seller applies a self-funded coupon that, combined with the platform commission rate, would result in a commission below the seller's contractual minimum; the coupon creation flow must reject or flag this unless explicitly permitted for that seller's contract.
- A physical product return arrives damaged in a way inconsistent with the buyer's stated return reason (e.g., buyer claims "wrong item" but the returned item matches the order); the return-inspection step must be able to reject the return or require additional evidence rather than auto-refunding.
- A buyer and seller attempt to move payment off-platform via messaging (sharing a phone number or external payment link) to avoid commission; the messaging-safety system must detect and restrict this pattern, using context-aware warnings before punitive account action.
- A seller who has already been auto-cancelled multiple times for failing to accept orders within the acceptance window continues to receive new orders; repeated acceptance failures must escalate to admin and affect the seller's standing rather than being treated as isolated incidents each time.
- An affiliate-attributed marketplace sale is later fully refunded; the affiliate commission on that sale must be reversed in the same ledger-based way as the seller's earning reversal, not left standing as an overpayment.

## Requirements *(mandatory)*

### Marketplace Access & Governance Requirements

- **FR-001**: System MUST require every seller to be approved before they can publish any marketplace listing.
- **FR-002**: System MUST run product publication through automated validation, manual moderation, legal review (where needed), copyright review, category-eligibility checks and quality review as distinct, trackable stages.
- **FR-003**: System MUST treat the client application as untrusted for final price, commission, seller earning, download permission, order completion, refund amount, payout balance, inventory availability, and service-milestone release — all of these MUST be computed and enforced server-side.
- **FR-004**: System MUST preserve, on every order, a historical snapshot of product title, description, price, seller details, licence terms, refund policy, deliverables, commission rate, tax rate and delivery timeline at time of purchase; later product or commission configuration changes MUST NOT alter existing orders.
- **FR-005**: System MUST display to the buyer, before purchase, the product/service, seller, deliverables, price, taxes, platform fees, delivery timeline, licence, revision limits, cancellation policy, refund policy and support period.
- **FR-006**: System MUST display to the seller, for every sale, the gross sale amount, discount funding source, platform commission, payment fee, tax withholding, refund reserve, net earning and payout date.
- **FR-007**: Marketplace sorting and recommendation features MUST NOT misrepresent sponsored listings as organic results.

### Seller Onboarding Requirements

- **FR-008**: System MUST provide a seller onboarding flow covering seller-type selection, personal/business details, identity verification, business verification (where applicable), tax information, payout information, skill/category selection, portfolio submission, seller agreement acceptance, marketplace policy training, application submission, automated risk check, manual review, and an approval/rejection/change-request decision resulting in seller-dashboard activation.
- **FR-009**: System MUST collect and store the full seller application data set (legal name, display name, email, mobile, address, seller type, business name/registration number, GSTIN, PAN or approved tax identifier, website, social profiles, skills, categories, portfolio, experience, languages, identity documents, business documents, bank details, payout method, agreement version, consent, referral source), with sensitive fields encrypted and access-controlled.
- **FR-010**: System MUST track seller verification status through: Draft, Submitted, Automated Review, Manual Review, Additional Information Required, Identity Verification Pending, Business Verification Pending, Tax Verification Pending, Bank Verification Pending, Approved, Approved with Restrictions, Rejected, Suspended, Terminated, Archived.
- **FR-011**: System MUST record, for every seller approval decision, the decision reason, reviewer, date, evidence, conditions and appeal availability.
- **FR-012**: System MUST support seller approval evaluation against identity validity, business validity, portfolio quality, skill relevance, category eligibility, policy history, fraud signals, copyright risk, product safety, tax details, bank ownership and previous platform history.
- **FR-013**: System MUST present a seller agreement covering marketplace terms, listing responsibilities, pricing, commission, tax obligations, payout terms, refund responsibilities, intellectual property, prohibited content, customer support, delivery obligations, data privacy, account suspension, dispute handling, termination and governing law, and MUST record seller consent with timestamp and agreement version.
- **FR-014**: System MUST support at least ten distinct seller types (Individual Seller, Freelancer, Mentor, Instructor, Agency, Business Vendor, Digital Creator, Physical Product Vendor, TBT Internal Seller, Strategic Partner), each with type-appropriate onboarding and eligibility rules.

### Seller Profile, Store & Team Requirements

- **FR-015**: System MUST expose a public seller profile with display name, photo/logo, verification badge, seller level, about, skills, categories, languages, location, member-since date, response time, completion rate, on-time delivery rate, rating, review count, total orders, portfolio, products, services, FAQ, policies and approved social links, and MUST NOT display private contact details without explicit seller consent.
- **FR-016**: System MUST calculate seller level (New Seller, Verified Seller, Rising Seller, Professional Seller, Top Seller, TBT Certified Seller, TBT Partner) from completed orders, revenue, rating, response rate, cancellation rate, on-time delivery, dispute rate, policy compliance and customer satisfaction, and MUST NOT allow manual level inflation without an audit trail.
- **FR-017**: System MUST compute an internal seller reputation score from order completion, delivery quality, review rating, refund rate, dispute rate, response time, repeat customers, policy violations, verification status and content quality; the exact formula MUST remain internal, and the seller MUST receive understandable improvement guidance rather than the raw score composition.
- **FR-018**: System MUST provide a seller dashboard (overview, products, services, draft/pending listings, orders, service projects, deliveries, messages, reviews, questions, analytics, earnings, wallet, payouts, coupons, promotions, customers, portfolio, store settings, team, support/policy center) displaying total sales, total/active/completed/cancelled orders, gross revenue, platform commission, refunds, net/pending earnings, available balance, next payout, product views, conversion rate, average rating, response rate, on-time delivery and repeat customers.
- **FR-019**: System MUST allow agency/vendor seller accounts to invite staff under granular roles (Owner, Manager, Listing Manager, Order Manager, Customer Support, Fulfilment Staff, Finance Viewer, Analyst), and MUST restrict payout-detail updates, tax-data viewing, withdrawal requests, ownership changes and agreement acceptance to authorized roles only.
- **FR-020**: System MUST provide a configurable store profile (name, slug, logo, cover image, description, categories, featured products, policies, FAQ, business hours, response time, support language, announcement) with a store status lifecycle: Draft, Active, Vacation Mode, Temporarily Paused, Suspended, Closed, Archived.
- **FR-021**: When a store enters Vacation Mode, system MUST stop new service orders if configured, display the seller's return date, continue fulfilling existing order obligations, and only permit digital product sales if the seller has explicitly enabled them during vacation.

### Listing Requirements

- **FR-022**: System MUST support a listing creation flow: type selection, category selection, dynamically loaded required fields, title/description entry, media upload, price configuration, package configuration, delivery terms, licence/usage rights configuration, refund policy selection, tax category selection, preview generation, automated validation, submission, moderation review, and a publish/reject/changes-requested decision.
- **FR-023**: System MUST track listing status through: Draft, Validation Failed, Pending Submission, Pending Review, Changes Requested, Approved, Scheduled, Active, Paused, Rejected, Out of Stock, Suspended, Expired, Archived.
- **FR-024**: Every listing MUST persist listing ID, product ID, seller ID, listing type, category/subcategory, title, slug, short/full description, media, tags, search keywords, language, industry, price, currency, tax category, delivery type/time, revision policy, licence, refund policy, support period, availability, stock/capacity, commission plan, status, moderation status, and created/updated/published dates with version history.
- **FR-025**: System MUST enforce listing title rules: accurate description, no false guarantees, no excessive capitalization, no misleading urgency, no prohibited brand names, no phone numbers/contact information, no unsupported income claims, and configurable character limits.
- **FR-026**: Listing media (thumbnail, gallery images, preview video, demo audio, PDF preview, watermarked preview, interactive demo link, portfolio/before-after images) MUST undergo file-type validation, malware scanning, size/resolution validation, copyright confirmation, watermarking where configured, adult/prohibited-content detection and manual moderation.
- **FR-027**: System MUST prevent a seller from accidentally publishing the full paid file as a public preview.
- **FR-028**: System MUST run listing moderation through automated content validation, file security scan, copyright risk check, policy check, pricing anomaly check, manual review and legal review (where required) before publication.
- **FR-029**: Admin MUST NOT silently rewrite a seller's commercial listing terms without generating an audit record and notifying the seller.

### Digital Download Security Requirements

- **FR-030**: System MUST support digital-product-specific listing fields: file types, file size, version, compatibility, software requirements, installation instructions, download count limit, download expiry, update policy, licence type, commercial/personal use flags, source-file inclusion and support duration.
- **FR-031**: System MUST support the defined digital file type allow-list (PDF, DOCX, XLSX, PPTX, CSV, ZIP, RAR where secure processing supports it, PNG, JPG, SVG, MP3, WAV, MP4, source-code archives, design project files, template files, other admin-approved formats), and MUST subject executable files to stricter security review.
- **FR-032**: Every digital product update MUST create an immutable version record (version number, release date, changelog, file set, compatibility, mandatory-update flag, existing-buyer access rule, seller notes, moderation status); existing buyers' access to new versions MUST follow the product's stated update policy.
- **FR-033**: System MUST support configurable digital product licence types (Personal Use, Commercial Use, Extended Commercial Use, Single Project, Multiple Projects, Single User, Team Licence, Organization Licence, Resale Prohibited, Redistribution Prohibited, Custom Licence) and MUST display licence text before purchase.
- **FR-034**: System MUST serve every digital download only via authenticated, signed, time-limited/expiring URLs that validate user, order and file version — the system MUST NOT expose a public permanent storage URL for a purchased file.
- **FR-035**: System MUST enforce a configurable per-order/per-buyer download limit and log every download attempt.
- **FR-036**: System MUST support watermarking digital files with buyer name, buyer email, order number, download date, an invisible identifier, seller branding or TBT branding, without materially damaging file usability.
- **FR-037**: System MUST run every uploaded file through malware scanning before it becomes downloadable, and MUST detect and flag abusive download patterns.
- **FR-038**: System MUST support restricted digital-product previews (limited pages, low-resolution/watermarked images, short video, audio sample, interactive demo, sample download) distinct from the full purchasable file.
- **FR-039**: System MUST process every uploaded file through a defined pipeline: upload to quarantine, file-type verification, malware scan, size/compression validation, metadata extraction, preview generation, watermark generation where needed, moderation, approved storage, and signed-access configuration.

### Service Listing & Package Requirements

- **FR-040**: System MUST support service listing fields: title, category, description, deliverables, packages, delivery days, revision count, required buyer information, tools used, service language, availability, maximum concurrent orders, communication method, meeting support, source-file inclusion, commercial rights and support period.
- **FR-041**: System MUST support configurable service packages (Basic, Standard, Premium, Custom), each with name, description, price, deliverables, delivery time, revisions, quantity, features, add-ons, support, licence and active status, with package names remaining seller/admin-configurable.
- **FR-042**: System MUST support seller-defined service add-ons (faster delivery, additional revision, extra page, additional design, source file, commercial licence, extra consultation, priority support, additional language, video meeting, extended support), with add-on pricing validated server-side.
- **FR-043**: System MUST allow a buyer to submit a custom service request (title, description, budget, preferred deadline, attachments, required skills, language, meeting preference, confidentiality requirement, expected deliverables), to which the seller may ask questions, accept, decline, send a custom offer, or suggest scope changes.
- **FR-044**: A custom offer MUST capture buyer, seller, scope, deliverables, milestones, revisions, delivery date, price, taxes, platform fee, validity, cancellation policy, ownership rights, support period and confidentiality terms; once accepted, the offer MUST become an immutable order snapshot.

### Freelancer Marketplace Requirements

- **FR-045**: System MUST support freelancer discovery by skill, category, experience, hourly/fixed rate, location, language, availability, rating, verified status, completed projects, portfolio, industry experience and response time, and a freelancer profile (professional title, bio, skills, experience, education, certifications, portfolio, rates, availability, languages, work history, reviews, verification, location, preferred industries, tools).
- **FR-046**: System MUST allow buyers to post projects (title, category, description, skills, budget type/range, deadline, duration, experience level, location requirement, language, attachments, confidentiality, proposal deadline, visibility) tracked through: Draft, Pending Review, Published, Receiving Proposals, Shortlisting, Awarded, In Progress, Completed, Cancelled, Expired, Disputed, Archived.
- **FR-047**: System MUST allow freelancers to submit proposals (cover letter, proposed price, timeline, milestones, questions, relevant portfolio, availability, revisions, terms, proposal expiry), and allow buyers to review, shortlist, message, reject, request changes, or accept a proposal.
- **FR-048**: System MUST apply proposal-spam protections: proposal limits, category eligibility, seller-verification requirement, rate limiting, duplicate detection, copy-paste spam detection, minimum proposal quality checks, restricted contact sharing and abuse reporting.

### Mentor Marketplace Requirements

- **FR-049**: System MUST integrate mentor-sellable offers (one-time session, multi-session package, monthly mentorship, group mentoring, business audit, startup strategy session, career consultation, accountability program, office hours, premium advisory package) with the Volume 07 mentor system, with mentor listing fields covering offer name, mentor, expertise, audience, outcomes, duration, session count, price, availability, preparation requirements, deliverables, follow-up support, cancellation/reschedule/recording policy, confidentiality and rating.
- **FR-050**: System MUST support the mentor service fulfilment flow: purchase creates a session entitlement/credit, buyer selects an available slot, mentor confirms if required, a reminder is sent, the session is conducted, attendance is verified, deliverables are uploaded, the buyer confirms completion, earnings become eligible, and a review request is sent.

### Bundle Requirements

- **FR-051**: System MUST support product bundles (multiple digital products; product+course; product+mentor session; service+template; event+resource pack; business starter; marketing; AI toolkit) that define included items, individual item values, bundle price, licence, refund allocation, seller revenue allocation, commission allocation and availability.
- **FR-052**: For a multi-seller bundle, system MUST require explicit consent from every participating seller and MUST compute revenue allocation, refund allocation, tax allocation, commission calculation and payout separation per seller under a versioned agreement.

### Physical Product & Inventory Requirements

- **FR-053**: System MUST support physical product listings (SKU, name, description, brand, category, images, variants, weight, dimensions, stock, warehouse, shipping class, delivery locations/timeline, return policy, warranty, HSN, tax rate, country of origin) with variant records (size, colour, material, edition, language, pack size) each carrying its own SKU, price, stock, weight, image, status and barcode where supported.
- **FR-054**: System MUST track inventory per product/variant (available, reserved, damaged, returned, incoming stock, reorder level, warehouse, last updated) and stock status (In Stock, Low Stock, Out of Stock, Preorder, Backorder, Discontinued, Unavailable).
- **FR-055**: System MUST reserve stock for a configurable time when checkout starts, expire the reservation if payment fails or checkout expires, convert reserved stock to sold stock only on successful payment, and MUST NOT allow duplicate payment events to decrement stock twice.
- **FR-056**: System MUST alert sellers on low stock, out-of-stock, reservation spikes, overselling risk, inventory mismatch, returns added, damaged stock and approaching preorder deadlines.

### Cart & Checkout Requirements

- **FR-057**: The marketplace cart MUST support items from multiple sellers, digital products, physical products, service packages, add-ons and TBT-owned products in a single cart, while keeping fulfilment and seller earnings separated by seller.
- **FR-058**: Cart validation MUST check listing active status, seller active status, current price, stock, capacity, buyer eligibility, delivery region, product ownership, download-licence conflict, service availability, coupon eligibility, currency, tax, quantity and maximum concurrent service orders before checkout proceeds.
- **FR-059**: Multi-vendor checkout MUST display items grouped by seller, delivery methods (digital/service/physical), seller-specific policies, taxes, platform fees, coupons, credits and final total, and MUST internally create one parent marketplace order with multiple seller suborders.

### Order & Suborder Requirements

- **FR-060**: System MUST model a parent marketplace order (order ID, buyer, currency, subtotal, discounts, tax, shipping, platform fee, total, payment status, order status, created date) and, per seller, a suborder (seller, seller items, gross amount, discount allocation, tax allocation, commission, seller net, fulfilment status, refund status, payout status).
- **FR-061**: System MUST track parent order status through: Draft, Awaiting Payment, Payment Processing, Paid, Partially Fulfilled, Fulfilled, Partially Refunded, Refunded, Cancelled, Disputed, Chargeback, Archived; and suborder status through: New, Accepted, Processing, Awaiting Buyer Input, Ready for Delivery, Delivered, Revision Requested, Completed, Cancelled, Refunded, Disputed.
- **FR-062**: For digital orders, system MUST follow: payment verified → order marked paid → download entitlement created → signed download access enabled → buyer notified → download activity logged → seller earnings enter pending state → refund window monitored → earnings become approved.
- **FR-063**: For service orders, system MUST follow: payment verified → seller notified → seller accepts or order auto-accepts → buyer requirements collected → work starts → status updates posted → delivery submitted → buyer reviews → revision requested or completion confirmed → auto-completion after review window if no dispute → seller earnings released.
- **FR-064**: System MUST support automatic, manual, scheduled and availability-based seller order acceptance modes; manual acceptance MUST have a time limit, and if the seller fails to accept in time the order MUST auto-cancel, the buyer MUST be refunded, seller performance MUST be affected, and admin MUST be notified after repeated failures.
- **FR-065**: System MUST allow a service order to require buyer-submitted text, brand details, files, images, credentials (via secure methods only), references, dimensions, content, target audience and deadline confirmation, and the order fulfilment clock MUST begin only after mandatory requirements are submitted.
- **FR-066**: System MUST provide an order workspace supporting messages, attachments, questions, delivery submissions, revision requests, status timeline, meeting links, milestones and support escalation, and MUST prohibit off-platform payment solicitation within it.
- **FR-067**: Order attachments MUST be malware-scanned, file-type validated, size-limited, access-controlled, download-logged, expiry-enforced where applicable, flagged for sensitive content, never exposed via public links, and retained per data-retention policy.

### Delivery, Revision & Milestone Requirements

- **FR-068**: Seller delivery submissions MUST contain a delivery message, files, links, instructions, version, milestone reference, completion notes and support details, and each delivery MUST create an immutable version record.
- **FR-069**: System MUST track delivery status through: Not Started, In Progress, Submitted, Viewed, Revision Requested, Resubmitted, Accepted, Auto-Accepted, Disputed.
- **FR-070**: Revision policy MUST define included revision count, revision meaning, revision request period, additional-revision price, revision delivery time and scope-change handling, and buyers MUST NOT be able to use revision requests to add new scope without additional payment.
- **FR-071**: A revision request MUST capture requested changes, reference to original scope, attachments, priority and deadline preference; the seller MUST be able to accept, ask for clarification, mark as out-of-scope, send an additional offer, or escalate a dispute.
- **FR-072**: System MUST support service milestones (name, description, deliverable, amount, due date, status, approval, revision, payment release, evidence) tracked through: Draft, Funded, Active, Submitted, Revision Requested, Approved, Released, Disputed, Cancelled, Refunded.
- **FR-073**: If a delivery deadline passes, system MUST notify buyer and seller, allow the seller to request an extension (new date, reason, scope impact, message) which the buyer can approve, reject, or counter-propose, evaluate cancellation eligibility, affect seller performance, and escalate to admin past a defined threshold.

### Escrow & Payment Holding Requirements

- **FR-074**: Where legally and technically supported, system MUST hold buyer payment as pending seller earnings from payment through seller fulfilment, buyer acceptance and the close of the refund/dispute window, releasing funds as payable only after that window closes.
- **FR-075**: System MUST NOT represent itself as a regulated escrow service unless legally approved to do so.
- **FR-076**: System MUST support order completion via buyer manual acceptance, milestone approval, attendance confirmation, download fulfilment, admin decision, or auto-completion after a configured review period; auto-completion MUST require delivery submitted, buyer notified, no open dispute, and an expired review window.

### Cancellation Requirements

- **FR-077**: System MUST support cancellation by buyer, seller, admin or automated system, with rules dependent on order type, payment state, fulfilment progress, download activity, service work completed, event date, mentor session state, physical shipment state, seller acceptance and policy.
- **FR-078**: System MUST allow buyer cancellation before payment, before seller acceptance, before download, before work begins, during an allowed cooling period, after seller failure, after a missed deadline, or by mutual agreement, resulting in full refund, partial refund, platform credit, no refund, or manual review as applicable.
- **FR-079**: Seller cancellation MUST require a reason, trigger buyer notification and refund, affect seller performance, be monitored by admin, and restore capacity/inventory/coupon usage where applicable; repeated seller cancellations MUST be able to trigger suspension.

### Refund & Dispute Requirements

- **FR-080**: System MUST restrict digital-product refunds after download unless the file is corrupted, the product materially differs from its description, it is a duplicate purchase, there is a technical access failure, a copyright issue exists, or it is legally required.
- **FR-081**: System MUST evaluate service refunds based on work started, milestones completed, delivery status, revision status, seller failure, buyer cooperation and evidence; physical product refunds based on shipment, delivery, return condition, damage, wrong product and return window; and mentor session refunds based on cancellation timing, attendance, mentor no-show and reschedule policy.
- **FR-082**: System MUST support partial refunds for completed milestones, partially delivered work, bundle item cancellation, quantity returns, missing items, service scope reduction and shipping adjustment, correctly re-allocating tax, discount, commission, seller earnings, affiliate commission and platform fee.
- **FR-083**: System MUST support marketplace dispute types covering non-delivery, not-as-described, corrupted file, copyright violation, non-responsive seller/buyer, incomplete service, quality issue, scope disagreement, revision disagreement, late delivery, unauthorized use, physical damage, refund disagreement and payment issues, via a dispute form capturing order, item/milestone, issue type, description, desired resolution, evidence, communication reference, disputed amount and urgency.
- **FR-084**: System MUST track dispute status through: Submitted, Evidence Requested, Seller Response Pending, Buyer Response Pending, Under Review, Mediation, Proposed Resolution, Accepted, Rejected, Resolved, Escalated, Closed, Appealed; resolution options MUST include full refund, partial refund, seller payment release, additional delivery, revision, replacement, store credit, mutual cancellation, account warning, listing suspension, seller suspension and buyer restriction.
- **FR-085**: System MUST accept dispute evidence (order description, listing snapshot, messages, attachments, delivery files, download logs, meeting attendance, revision requests, shipment tracking, photos, videos, third-party verification) and restrict evidence access to involved parties and authorized staff only.
- **FR-086**: A refund MUST generate the required buyer credit note, seller-earning reversal, commission reversal, tax adjustment, affiliate reversal, wallet adjustment and payout recovery where applicable.

### Messaging Requirements

- **FR-087**: Buyer-seller messaging MUST support text, attachments, images, audio, video snippets, structured requirements, quotes, offers, order links, translation assistance, reporting and blocking, and MUST detect or restrict phone numbers before order (where policy requires), off-platform-transaction email addresses, payment links, spam, harassment, malware, prohibited content and fraud attempts, using context-aware warnings before punitive action where appropriate.
- **FR-088**: System MUST support pre-purchase buyer questions to sellers, with seller-configurable FAQ, response hours, auto-response and availability status, linked to the listing.

### Review & Seller Reputation Requirements

- **FR-089**: System MUST support multi-dimension reviews (overall rating, quality, communication, delivery time, accuracy, value, support) restricted to eligible buyers who completed an order, where eligibility requires verified payment, delivered/completed order status, an active review window, an order not fully refunded, and no prior final review already submitted.
- **FR-090**: Reviews MUST store review ID, buyer, seller, listing, order, overall rating, dimension ratings, title, comment, media, seller response, status, verified-purchase flag, helpful count, report count and timestamps, and MUST be moderated for abuse, hate speech, personal information, spam, extortion, irrelevance, fake reviews, review manipulation and copyright violation — negative reviews MUST NOT be removed merely for being negative.
- **FR-091**: System MUST allow a seller to respond to a review (thank, clarify, explain resolution, apologize, direct to support) without exposing private buyer information.
- **FR-092**: For service projects requiring two-sided reputation, system MUST allow the seller to privately rate the buyer on communication, requirement clarity, cooperation, payment/approval timeliness and professional conduct; any public buyer-rating feature requires separate legal/product review before enabling.
- **FR-093**: System MUST allow buyers to edit a review within a configurable window, retain edit history internally, and require moderation review of edits made after dispute resolution.
- **FR-094**: Review incentives (reward points, badge progress, coupon) MUST be granted only for submitting an honest, eligible review and MUST NOT depend on the rating being positive.
- **FR-095**: System MUST support public product Q&A (ask question, seller answer, optional community answer, helpful votes, verified-buyer badge, moderation, search, duplicate-question detection).

### Discovery & Engagement Requirements

- **FR-096**: System MUST support wishlist/saved items with list creation, list sharing, price-drop alerts, back-in-stock alerts, seller-update alerts and configurable privacy (private, shared-by-link, public), and recently-viewed tracking that the user can clear.
- **FR-097**: System MUST allow users to follow sellers and receive configurable-frequency notifications for new products, new services, discounts, availability changes, new portfolio items and live events.
- **FR-098**: System MUST send buyer notifications (order confirmation, payment success, seller acceptance, requirements needed, delivery started, milestone submitted, delivery ready, revision update, order completed, download available, product updated, shipment update, refund update, dispute update, review reminder) and seller notifications (new order, new message, requirement submitted, deadline reminder, revision request, order completion, refund request, dispute, review, earnings approved, payout processed, listing approved, changes requested, policy warning).

### Shipping, Returns & Physical Fulfilment Requirements

- **FR-099**: System MUST support seller shipping, a future TBT-fulfilment option, courier integration, manual tracking, local delivery and store pickup, with shipping rate computed from seller/buyer location, weight, dimensions, shipping class, courier, delivery speed, free-shipping rules, quantity and insurance.
- **FR-100**: System MUST track shipment status (Preparing, Packed, Ready for Pickup, Shipped, In Transit, Out for Delivery, Delivered, Delivery Failed, Returned to Seller, Lost, Damaged, Cancelled) and expose courier, tracking number, shipment date, estimated delivery, status timeline, delivery attempts and support contact to the buyer.
- **FR-101**: System MUST support a physical return flow (request, eligibility check, reason selection, evidence upload, seller/admin review, return method selection, pickup/label creation, product received, condition inspection, refund/replacement) tracked through: Requested, Under Review, Approved, Rejected, Pickup Scheduled, In Transit, Received, Inspection, Refund Approved, Replacement Sent, Completed, Closed.

### Commission Engine Requirements

- **FR-102**: System MUST support percentage, fixed-fee, tiered, category-based, product-based, seller-level-based, campaign-based, subscription-based and hybrid percentage-plus-fixed-fee commission types.
- **FR-103**: Commission calculation MUST account for product category, seller type/level, product type, gross price, discount, tax, shipping, platform-funded vs. seller-funded promotion, affiliate commission, payment fee, refund and contract terms, and all commission rules MUST be versioned.
- **FR-104**: System MUST support a configurable commission basis (gross item amount, net of tax, net of discount, net of seller-funded discount, net of refund, collected revenue, released milestone amount), and the applicable basis MUST be visible to the seller.
- **FR-105**: System MUST produce a seller earning statement itemizing item sale amount, seller-funded discount, TBT-funded discount, taxes, shipping collected, platform commission, payment processing fee, affiliate fee, refund reserve, withholding tax, adjustments and net seller earning.
- **FR-106**: System MUST track earning status through: Estimated, Pending, On Hold, Approved, Available, Scheduled for Payout, Paid, Reversed, Disputed, Withheld.
- **FR-107**: Earning release MUST require, for digital products: payment success, download fulfilment, refund window passed, no dispute; for services: buyer acceptance/auto-completion and dispute window passed; for physical products: delivery confirmation and return window passed; for mentor sessions: attendance/completion confirmation and cancellation checks completed.

### Seller Reputation Requirements

- **FR-108** *(see also FR-016, FR-017)*: System MUST recompute seller level and reputation score on a scheduled/background basis from the documented inputs only, never from a directly editable field, and MUST log every recalculation for audit purposes.

### Seller Wallet & Payout Requirements

- **FR-109**: Seller wallet MUST display pending, on-hold, available, scheduled-payout, paid and reversed balances, tax withheld and lifetime earnings, and MUST be backed by an append-only ledger rather than a directly mutable balance field.
- **FR-110**: System MUST support bank transfer, UPI payout and other approved-provider payout methods (with international payout as a future option), and MUST encrypt raw bank details.
- **FR-111**: System MUST support weekly, biweekly, monthly, threshold-based, manual-withdrawal and custom-contract payout schedules; payout eligibility MUST require minimum balance, verified bank, verified tax profile, no active hold, no unresolved fraud review and no overdue seller obligations.
- **FR-112**: System MUST track payout status through: Draft, Pending Approval, Approved, Processing, Sent, Completed, Failed, Returned, Cancelled, On Hold; on payout failure, system MUST return funds to available/hold balance, notify the seller, prompt bank-detail review, require authorization for retry, and create an audit record.
- **FR-113**: System MUST produce a payout statement (payout ID, period, seller, orders, gross sales, refunds, commission, fees, tax withholding, adjustments, net payout, bank reference, date, status).
- **FR-114**: System MUST support a seller tax profile (legal name, business name, address, GSTIN, PAN/approved identifier, tax residency, entity type, tax status, verification, withholding configuration), with final tax rules subject to qualified tax-professional approval.
- **FR-115**: System MUST support configurable marketplace invoicing models (TBT invoices buyer directly; seller invoices buyer and TBT invoices seller for commission; or another legally approved model) configurable by legal entity and seller type.
- **FR-116**: When a seller's balance goes negative (post-payout refund, chargeback, dispute loss, commission correction, tax correction, fraud reversal), system MUST support recovery via future-earning deduction, repayment request, payout hold, account restriction, or legal escalation for serious cases, and MUST NOT silently zero-out or unilaterally rewrite the balance outside these defined paths.

### Promotion, Coupon & Cross-Program Integration Requirements

- **FR-117**: System MUST support marketplace coupons with a defined funding type (TBT-funded, seller-funded, shared funding, affiliate-funded, category campaign) that always identifies who bears the discount.
- **FR-118**: Seller-created coupons MUST be constrained by minimum price, maximum discount, validity, usage limits, product eligibility, admin approval and funding confirmation, and MUST NOT reduce platform commission below the contractual minimum unless explicitly allowed.
- **FR-119**: System MUST support flash sales with start/end time, sale price, quantity limit, per-user limit, countdown timer, seller consent, campaign budget, auto-revert and analytics, with the countdown always reflecting real campaign timing.
- **FR-120**: System MUST support sponsored listings that are clearly labelled "Sponsored," subject to budget, bid/fixed fee, category relevance, quality threshold, policy compliance, impression/click tracking, billing and fraud filtering; sponsored placement MUST NOT override user safety or relevance rules.
- **FR-121**: Marketplace products participating in Volume 09 affiliate programs MUST have affiliate earnings calculated considering product eligibility, seller agreement, commission funding source, refund, cancellation, chargeback, attribution window and existing-customer policy.
- **FR-122**: Paid membership benefits at the marketplace (discounts, free downloads, premium seller access, lower service fee, early access, exclusive products, priority support, mentor discounts) MUST be strictly entitlement-driven.
- **FR-123**: System MUST support Reward Point issuance for eligible marketplace purchases, reviews, referral purchases, marketplace activity and seller milestones, with redemption governed by Volume 06/Volume 09 rules.
- **FR-124**: System MUST support seller achievement badges (First Sale, Ten Orders, One Hundred Orders, Five-Star Seller, Fast Responder, On-Time Expert, Customer Favourite, Top Tamil Creator, TBT Certified) and buyer achievements (First Purchase, Support Local Seller, Learning Collector, Business Toolkit Builder, Trusted Reviewer) without misrepresenting professional certification.

### AI-Assisted Tools Requirements

- **FR-125**: TBT AI MAY assist sellers with listing titles, description improvement, Tamil/Tanglish/English translation, tag suggestions, FAQ suggestions, response drafts, product summaries, marketing captions, listing-quality analysis, price-range suggestions, prohibited-claim detection and delivery checklists; the seller remains fully responsible for factual accuracy of anything published.
- **FR-126**: TBT AI MAY assist buyers with listing comparison, review summarization, deliverable clarification, requirement drafting, service discovery, seller-question generation and plain-language licence explanation, but MUST NOT fabricate seller guarantees or commitments the seller did not make.

### Prohibited Items & IP Requirements

- **FR-127**: System MUST prohibit or restrict listing of illegal goods, stolen content, pirated software, copyright-infringing templates, malware, credential-theft tools, fake documents, fraud services, unauthorized financial schemes, weapons, hazardous products, adult sexual content, hate/extremist merchandise, prescription medicines, controlled substances, surveillance/spyware tools, guaranteed-income scams, academic cheating services, personal data lists, unauthorized account sales, fake reviews and counterfeit products, subject to final legal review of the published policy.
- **FR-128**: System MUST require seller confirmation of ownership, valid licence, and right to sell for images, fonts, music, source code and trademarks used in a listing.
- **FR-129**: System MUST support an IP complaint flow: rights-holder submission → identity/claim validation → temporary listing review → seller notification where appropriate → evidence request → listing removal/restoration/restriction decision → affected-order and buyer assessment → refund evaluation → seller strike recording → appeal availability.
- **FR-130**: System MUST support a repeat-infringer policy and retain IP-complaint evidence for the legally required period.
- **FR-131**: Physical products or regulated services MUST support certification, manufacturer information, safety instructions, warranty, legal disclaimer, restricted-region rules, age restrictions and additional seller verification where required.

### Fraud & Account Security Requirements

- **FR-132**: System MUST monitor buyer fraud signals (payment abuse, repeated refund claims, download-then-refund pattern, chargeback history, multiple accounts, coupon abuse, review extortion, seller harassment) and seller fraud signals (fake products, duplicate listings, fake reviews, delivery manipulation, off-platform payment requests, copyright violations, sudden payout changes, account takeover, high cancellation rate, suspicious sales spikes).
- **FR-133**: System MUST support a graduated set of fraud actions: allow, warn, request verification, hold order, hold earnings, hold payout, restrict listing, remove listing, suspend account, terminate account, escalate to legal review.
- **FR-134**: System MUST require recent authentication, OTP/MFA, device verification, email notification and a cooling period before high-risk seller actions take effect: change bank account, change legal name, change tax information, add payout method, withdraw funds, change account owner, bulk price change.
- **FR-135**: System MUST provide buyer protections: accurate listing snapshots, secure payments, download access, delivery tracking, refund process, dispute process, verified reviews, seller verification, support escalation and fraud monitoring.
- **FR-136**: System MUST provide seller protections: clear buyer requirements, delivery evidence, download logs, milestone approval, dispute evidence, review moderation, chargeback support, fraudulent-buyer detection, payout statements and transparent commission.

### Marketplace Administration Requirements

- **FR-137**: Marketplace admin MUST provide navigation across overview, sellers, seller applications/verification, stores, listings, categories, digital/physical products, services, projects, proposals, orders, deliveries, milestones, refunds, returns, disputes, reviews, copyright complaints, commissions, earnings, payouts, promotions, sponsored listings, fraud review, reports, marketplace settings and audit logs, with a dashboard summarizing active sellers, new applications, active/pending/rejected listings, total buyers, orders, GMV, net revenue, commission, seller earnings, refund/dispute rates, AOV, conversion, digital downloads, active service orders, physical shipments, payout due and fraud holds.
- **FR-138**: Admin seller view MUST show profile, verification, store, listings, orders, ratings, policy-restricted messages, refunds, disputes, earnings, payouts, tax details, policy warnings, login/security events and audit timeline, with sensitive data masked according to role; authorized admins MUST be able to approve, request changes, restrict category, pause store, suspend/reinstate seller, hold/release payout, add warning, adjust commission plan, request verification, or terminate a seller — each action requiring a reason and generating an audit record.
- **FR-139**: Admin listing view MUST show content, seller, category, pricing, media, files, licence, policy, automated validation, moderation history, orders, refunds, complaints and analytics; authorized admins MUST be able to approve, reject, request changes, pause, suspend, archive, feature, mark TBT-exclusive, warn, change category, request licence evidence, or remove a prohibited file.
- **FR-140**: Admin order view MUST show parent order, seller suborders, buyer, payment, items, deliveries, messages, milestones, refunds, disputes, commission, seller earnings, affiliate attribution, payout and timeline; authorized admins MUST be able to cancel, refund, partially refund, extend deadline, mark delivery, approve completion, reopen order, hold/release earnings, open/resolve dispute, and add an internal note, with high-impact actions requiring dual approval.
- **FR-141**: Admin MUST be able to configure global, category, seller-level, seller-specific-contract, product-specific, promotional and subscription commission, with minimum/maximum fee, effective dates and tax treatment, and published commission changes MUST be versioned.
- **FR-142**: Payout administration MUST show seller, available/on-hold balance, verification, bank status, tax status, payout amount/schedule, risk flags and previous failures, with approve, hold, reject, retry, cancel, export and add-note actions.
- **FR-143**: System MUST require dual approval for high-value seller payout, manual earning adjustment, large refund, negative-balance write-off, payout bank override, seller termination with outstanding balance, commission contract change, fraud-hold release, and dispute settlement above a defined threshold.

### Analytics & Reporting Requirements

- **FR-144**: System MUST produce marketplace reports covering seller, seller verification, listing, product sales, service order, project, proposal, marketplace order, digital download, physical shipping, return, refund, dispute, review, commission, seller earnings, payout, tax, affiliate sales, coupon, category performance, search, conversion, fraud and copyright complaint, and MUST capture the defined analytics events (marketplace/listing views, search, filter applied, listing saved, seller followed, cart add, package selection, custom request submitted, proposal submitted/accepted, checkout started, order paid, digital product downloaded, requirements submitted, delivery submitted, revision requested, order completed, review submitted, refund requested, dispute created, seller application submitted, listing submitted/approved, seller payout completed).
- **FR-145**: System MUST track marketplace business metrics: gross marketplace value, net marketplace revenue, total orders, average order value, buyer conversion, repeat purchase rate, active buyers/sellers, seller activation rate, listing approval rate, time to first sale, digital download rate, service completion rate, on-time delivery rate, refund/dispute/chargeback rate, seller/buyer retention, commission revenue and payout success rate.
- **FR-146**: Sellers MUST be able to view their own analytics (listing views, search impressions, click-through rate, conversion rate, orders, revenue, earnings, refunds, AOV, customer locations, traffic sources, saved count, repeat buyers, rating, response time, delivery performance, product/package performance) without exposing buyer personal identity beyond what is necessary.
- **FR-147**: System MUST provide search analytics to admin (top/zero-result searches, search conversion, category demand, unmet service demand, Tamil/Tanglish search terms, trending skills, price sensitivity, location demand).

### Security, Privacy & Data Retention Requirements

- **FR-148**: System MUST enforce JWT/secure session authentication, role-based access control, seller tenant isolation, signed file URLs, malware scanning, file access logging, encryption at rest and in transit, secure bank-data handling, MFA for sensitive actions, webhook signature verification, idempotent checkout, server-side price/commission validation, rate limiting, bot protection, anti-fraud monitoring, audit logs, data export controls, secure backups, secret management and incident response.
- **FR-149**: System MUST be validated against the full marketplace security test suite: price tampering, commission tampering, seller-ID replacement, unauthorized download, signed-URL reuse, download-limit bypass, cross-order/cross-seller file access, payout privilege escalation, bank-detail exposure, listing script injection, malicious file upload, ZIP bomb, CSV injection, review manipulation, fake-order creation, coupon abuse, inventory oversell, duplicate fulfilment, refund abuse, webhook replay, proposal spam, open redirect and off-platform payment-link abuse.
- **FR-150**: System MUST restrict buyer contact details to only-when-necessary sharing, keep seller contact details protected by default, restrict order messages to participants and authorized admins, role-control financial data, encrypt bank data, restrict tax data, retain download logs per policy, define retention for sensitive project files, use only aggregate buyer data in seller analytics, respect consent in marketplace marketing, and preserve only legally required financial records on account deletion.
- **FR-151**: System MUST apply configurable retention periods to marketplace orders, invoices, payout records, tax records, messages, attachments, digital downloads, disputes, reviews, seller verification, fraud signals and copyright complaints, with legal retention requirements overriding ordinary deletion.

### Reliability & Operations Requirements

- **FR-152**: System MUST run background jobs for file scanning, preview generation, watermarking, search indexing, expired-cart cleanup, inventory-reservation release, order auto-completion, delivery/review reminders, earning release, payout generation, seller-level calculation, fraud scanning, report generation, expired signed-link cleanup and product-update notifications.
- **FR-153**: System MUST raise monitoring alerts for listing-approval backlog, malware-scan failures, digital-download failures, order-creation failures, payment-success drop, inventory mismatch, seller-cancellation spike, late-delivery spike, refund/dispute spikes, review manipulation, copyright complaints, commission-calculation mismatch, payout failure, negative seller balance, fraud-hold backlog, message-abuse spike, search failure and marketplace-conversion drop.
- **FR-154**: Every important marketplace action MUST be observable with request ID, user/seller/listing/order/payment/delivery/payout ID, actor role, action, previous/new state, amount, currency, timestamp, device/source, error code and risk signal, with sensitive information masked in logs.
- **FR-155**: Marketplace interfaces MUST remain usable under low-network conditions: preserved cart, resumable file upload, retried failed image upload, locally-and-server-saved listing drafts, preserved buyer requirements, safe payment-status recovery, resumable downloads where storage supports it, prevention of duplicate order submission, and offline access to purchased-product licences/QR where appropriate.
- **FR-156**: Marketplace surfaces MUST meet accessibility requirements: keyboard navigation, screen-reader labels, accessible product gallery, alt text, clear prices/licence info, form error association, accessible rating controls, non-colour order-status indication, accessible file upload/messaging, high contrast, large touch targets, preview-video captions, audio transcripts where provided, focus management and reduced motion.
- **FR-157**: Marketplace navigation, categories, descriptions, checkout, orders, delivery, refunds, disputes, reviews, seller dashboard, notifications and error messages MUST be localized in Tamil, Tanglish and English; sellers MAY create multiple language versions of a listing, with translation supporting seller-provided, AI-assisted (marked for review), professional and admin-approved modes, and legal/licence terms always requiring human verification regardless of translation mode.

### Clarifications Needed

- **FR-158**: [NEEDS CLARIFICATION: exact numeric durations for the refund window, dispute window, and revision-request period per product type are not specified in the source — §75/§80/§120 state these are "configurable" but give no default values. Must be defined by Marketplace Operations/Finance before implementation.]
- **FR-159**: [NEEDS CLARIFICATION: payout minimum-balance threshold, default payout schedule, and the monetary threshold above which dispute settlements/payouts require dual approval are not numerically specified in the source (§123, §161).]
- **FR-160**: [NEEDS CLARIFICATION: the legal structure required for "escrow-style" payment holding (§79) varies by jurisdiction and is explicitly deferred to legal review in the source — must be resolved with legal/compliance before implementing fund-holding logic for India-regulated payment flows.]
- **FR-161**: [NEEDS CLARIFICATION: the repeat-infringer strike count/threshold that triggers escalated seller consequences is not specified in the source (§143).]

### Key Entities *(include if feature involves data)*

- **Seller Profile / Seller Account**: The onboarded, verified party permitted to publish listings; carries seller type, verification status, level, reputation score, agreement acceptance history.
- **Seller Application**: The onboarding submission (legal/business details, documents, tax/bank info, agreement consent) and its review trail (decisions, reasons, evidence, appeal state).
- **Store Profile**: A seller's public storefront configuration (branding, policies, hours, status lifecycle including Vacation Mode).
- **Seller Team Member**: A staff account under an agency/vendor seller with a granular role (Owner, Manager, Listing Manager, Order Manager, Support, Fulfilment, Finance Viewer, Analyst).
- **Marketplace Category**: A hierarchical taxonomy node defining allowed product types, required fields/qualifications, commission rule, tax category, moderation and refund rules.
- **Listing**: A sellable unit (digital product, physical product, service, mentor offer, bundle) with full content, pricing, licence, delivery terms, moderation status and version history.
- **Listing Version**: An immutable snapshot of a listing at a point in time, used to preserve historical order accuracy.
- **Digital File / File Version**: An uploaded, scanned, previewed and optionally watermarked file backing a digital listing, with its own version and access-permission records.
- **Licence Type**: A defined usage-rights grant (personal, commercial, extended, team, organization, resale/redistribution-prohibited, custom) attached to a listing and snapshotted into orders.
- **Download Grant / Signed Download URL**: A time-limited, user/order/version-scoped access credential to a purchased digital file, with an associated download log.
- **Service Package**: A Basic/Standard/Premium/Custom tier of a service listing with its own price, deliverables, delivery time, revisions and features.
- **Service Add-on**: An optional paid enhancement to a service package (faster delivery, extra revision, commercial licence, etc.).
- **Custom Service Request / Custom Offer**: A buyer-initiated scope request and the seller's negotiated response, which becomes an order snapshot once accepted.
- **Freelancer Profile**: A freelancer's discoverable professional profile (skills, rates, portfolio, verification, work history).
- **Project Posting**: A buyer-initiated request for freelance work, with budget, skills, deadline and visibility.
- **Proposal**: A freelancer's bid on a project (price, timeline, milestones, cover letter), trackable through review/shortlist/award states.
- **Mentor Listing / Mentor Offer**: A sellable mentoring engagement integrated with the Volume 07 mentor system (session count, outcomes, cancellation/reschedule/recording policy).
- **Product Bundle**: A grouped set of listings (single- or multi-seller) sold at a combined price with defined per-item revenue/refund/commission allocation.
- **Physical Product / SKU / Variant**: A tangible product listing and its purchasable variants (size, colour, etc.), each with its own inventory record.
- **Inventory Record**: Per-product/variant stock counts (available, reserved, damaged, returned, incoming) and reorder thresholds.
- **Cart / Cart Item**: The buyer's pre-checkout selection, potentially spanning multiple sellers and product types, subject to validation before order creation.
- **Marketplace Order (Parent)**: The buyer-facing, multi-seller checkout record (totals, payment status, order status).
- **Seller Suborder**: The seller-scoped portion of a parent order (gross amount, allocations, commission, seller net, fulfilment/refund/payout status) — the unit of seller-side fulfilment and earnings.
- **Buyer Requirement Submission**: The buyer-provided information/files a service order needs before the fulfilment clock starts.
- **Delivery Submission / Delivery Version**: A seller's immutable delivery record (message, files, links, milestone reference) for a service order.
- **Revision Request**: A buyer's requested change to a delivery, bounded by the listing's revision policy and scope rules.
- **Service Milestone**: A funded, individually approvable/releasable unit of a larger service engagement.
- **Escrow Hold / Pending Earning Record**: The held-fund state between payment and buyer acceptance/auto-completion, backing the "escrow-style" holding behavior.
- **Order Cancellation Record**: The actor, reason and financial disposition (refund/credit/none) of a cancelled order or suborder.
- **Refund / Partial Refund**: A financial reversal event allocating tax, discount, commission, seller earning, affiliate commission and platform fee adjustments.
- **Return (Physical)**: A physical-product return request and its inspection/resolution lifecycle.
- **Dispute**: A formal buyer/seller disagreement record with type, evidence, status lifecycle and resolution outcome.
- **Dispute Evidence**: Access-restricted supporting material (messages, files, logs, tracking, media) attached to a dispute.
- **Review**: A buyer's post-purchase, multi-dimension rating and comment tied to a verified order, with optional seller response.
- **Q&A Entry**: A public pre-purchase question and its seller/community answer(s) on a listing.
- **Wishlist / Saved Item**: A buyer's saved listing with alert preferences and sharing/privacy settings.
- **Seller Follow**: A buyer's subscription to a seller's update notifications.
- **Shipment / Tracking Record**: A physical order's carrier, tracking number and status-timeline record.
- **Commission Rule**: A versioned rule (type, basis, inputs, effective dates) determining platform commission for a category/seller/product/campaign.
- **Seller Earning Statement / Earning Ledger Entry**: An itemized, append-only record of a sale's financial breakdown feeding the seller wallet.
- **Seller Wallet**: The derived-balance view (pending, on-hold, available, scheduled, paid, reversed) computed over the earning ledger — never a directly writable field.
- **Payout Method**: An encrypted bank/UPI/provider payout destination on a seller account.
- **Payout Record / Payout Statement**: A scheduled or requested disbursement with its own status lifecycle and itemized statement.
- **Negative Balance Adjustment**: A recovery-path record (deduction, repayment request, hold, restriction, escalation) applied against a seller's negative derived balance.
- **Marketplace Coupon**: A discount instrument with a defined funding source (TBT, seller, shared, affiliate) and eligibility constraints.
- **Flash Sale**: A time-boxed promotional pricing campaign with quantity and per-user limits.
- **Sponsored Listing**: A paid-visibility placement, clearly labelled, with budget/billing and fraud-filtering controls.
- **Affiliate Attribution (Marketplace)**: The linkage between a marketplace sale and an affiliate commission, following Volume 09 program rules.
- **IP Complaint / Takedown Record**: A rights-holder complaint and its investigation, decision, seller-strike and appeal trail.
- **Fraud Signal / Fraud Hold**: A detected risk indicator (buyer or seller) and any resulting hold/restriction action.
- **Marketplace Audit Log Entry**: An immutable record of an administrative, financial or moderation action, its actor, reason and before/after state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of orders containing items from more than one seller are split into correctly allocated parent-order-plus-seller-suborder records, each independently carrying its own tax, discount and commission allocation, verifiable through marketplace financial QA.
- **SC-002**: 100% of digital file downloads are served exclusively through signed, time-limited, order/user-validated URLs; zero permanent public file URLs are ever exposed for a purchased digital product.
- **SC-003**: 100% of finalized order snapshots (price, seller, licence, refund policy, commission rate, tax rate) remain unchanged after later product or commission configuration edits, with zero instances of retroactive alteration.
- **SC-004**: Seller earnings are always reconstructable as the sum of an append-only ledger of issuance, reversal and adjustment entries, with zero direct writes to a mutable balance field.
- **SC-005**: 100% of high-risk seller account actions (bank change, new payout method, fund withdrawal, ownership change, bulk price change) require recent re-authentication/MFA and produce an audit record before taking effect.
- **SC-006**: Sellers who fail to accept a service order within the configured acceptance window are auto-cancelled and the buyer auto-refunded with zero required manual intervention.
- **SC-007**: 100% of completed service/digital orders with no dispute opened before the review window expires are auto-completed, moving seller earnings out of pending/on-hold status without requiring buyer action.
- **SC-008**: 100% of published buyer reviews originate from a payment-verified, delivered/completed order that has not been fully refunded — zero reviews from unverified or ineligible purchases.
- **SC-009**: Every marketplace financial action (commission adjustment, refund, payout, negative-balance recovery) produces an audit record capturing actor, reason and before/after state.
- **SC-010**: Negative seller balances arising from post-payout refunds or chargebacks are resolved exclusively through the defined recovery paths (future-earning deduction, repayment request, payout hold, account restriction, legal escalation) — zero instances of silent, unaudited balance rewrites.

## Assumptions

- This spec covers the marketplace commerce layer (sellers, listings, orders/suborders, fulfilment, disputes, commission, earnings, payouts, marketplace administration) as defined in Volume 11. It does not redefine payment gateway integration, the core financial ledger/double-entry engine, GST calculation logic, or the affiliate program mechanics — those belong to Volume 09 (Membership, Payments & Revenue) and are referenced here only at their marketplace-specific integration points (commission, refund reversal, affiliate attribution on marketplace sales).
- Mentor-type sellers and mentor-offer listings integrate with the mentor discovery, booking and session infrastructure defined in Volume 07 (Mentor Marketplace); this spec covers only the commerce wrapper (mentor offer as a sellable listing, purchase → entitlement → fulfilment → earning flow) and assumes session scheduling/video mechanics are Volume 07's responsibility.
- The freelancer project/proposal system described here (buyer posts project, freelancers bid, buyer awards) is a marketplace-internal contract-work mechanism distinct from Volume 12's full recruiter/hiring-pipeline "Jobs & Talent" system; where a freelance engagement evolves into a longer-term hire, conversion into Volume 12's flow is out of scope for this spec and should be defined at the Volume 12 boundary.
- Reward Point issuance/redemption, seller/buyer achievement badges, and level-up mechanics reuse the ledger and rules engine defined in Volume 06 (Gamification); this spec defines only the triggers (what marketplace events grant points/badges) and the constraint that rewards never depend on positive ratings, not the underlying points-ledger implementation.
- Detailed REST/GraphQL API endpoint contracts are explicitly deferred to Volume 15 per the source (§180); this spec defines required API capability groups, not endpoint signatures.
- Final tax withholding rules, GST treatment, and invoicing-model selection require sign-off from qualified tax professionals per the source (§127); this spec defines the architectural hooks (seller tax profile, configurable invoicing model) but not the final tax computation logic.
- "TBT Fulfilment" (platform-run warehousing/shipping) and international sellers/multi-currency/global payouts are explicitly named as P2/future-roadmap scope in the source MVP priority tiers (§190) and are out of scope for this spec's P1/P2 user stories beyond noting them as future extension points.
- The exact seller reputation-score formula is intentionally undisclosed by design (source §21, "must remain internal to reduce gaming"); this spec specifies the required inputs and outputs (understandable improvement guidance) but does not define the scoring algorithm itself.
- Where the source states a rule is "configurable" without a numeric default (refund/dispute/review windows, payout thresholds, dual-approval monetary thresholds, revision counts), this spec treats the configurability as the requirement and flags the missing default via `[NEEDS CLARIFICATION]` rather than inventing a number.
- Escrow-style payment holding is assumed to be a platform-internal accounting treatment (pending vs. available seller balance) rather than a claim of regulated escrow-agent status, per the explicit source constraint (§79); actual legal structuring is assumed to be resolved with legal/compliance outside this spec.
