# Feature Specification: Landing Pages, Forms & Lead Capture

**Feature Branch**: `023-landing-pages-lead-capture`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14, Part 1, Chapter 10 — Landing Pages, Forms & Lead Capture System (`document 1/Document 1 (22).md`). The primary lead-acquisition engine of the TBT Marketing Automation Platform: a no-code drag-and-drop landing page builder, form builder with conditional logic and multi-step forms, a lead capture engine that syncs instantly to the CDP and CRM, AI-assisted page optimization, A/B testing with auto-promotion of winners, SEO tooling, and full acquisition-funnel tracking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build and publish a landing page without code (Priority: P1)

A marketing team member starts from a pre-built template (e.g., "Webinar Registration" or "Ebook Download"), drags components (hero banner, CTA button, testimonial carousel, form) onto an infinite canvas, applies the organization's brand kit automatically, previews the responsive layout, and publishes the page under a custom URL — without writing any HTML or CSS.

**Why this priority**: This is the entry point for every other capability in the chapter. If a non-technical marketer cannot build and publish a page, no lead capture, A/B test, SEO setting, or funnel metric ever exists to act on. It is the module's core promise ("no coding required").

**Independent Test**: Can be fully tested by having a marketer with no engineering support pick a template, drag in components, apply brand styling, and publish a live, responsive page at a custom URL — delivering a working page with zero code written.

**Acceptance Scenarios**:

1. **Given** a marketer with landing-page-builder permissions is in the editor, **When** they drag a component (e.g., CTA Button) from the component library onto the canvas, **Then** the component appears on the canvas immediately and the change is auto-saved without an explicit save action.
2. **Given** a page has been edited multiple times, **When** the marketer opens version history, **Then** they can view and restore any prior saved version.
3. **Given** an organization has defined brand settings (logo, colors, typography, buttons), **When** a new landing page is created, **Then** the brand settings are applied to the page automatically without manual configuration.
4. **Given** a completed draft page, **When** the marketer clicks Publish, **Then** the page becomes publicly reachable at its configured URL and renders correctly across desktop, tablet, and mobile breakpoints.

---

### User Story 2 - Visitor completes a multi-step form with conditional logic and resume (Priority: P1)

A visitor lands on a webinar registration page and begins a multi-step form. Later steps show or hide fields depending on answers given earlier (e.g., a "Company Size" field only appears if "I represent a business" was selected). The visitor's progress is auto-saved at each step; if they close the browser mid-form and return later, they resume where they left off instead of restarting.

**Why this priority**: Multi-step forms with conditional logic and auto-save/resume are explicitly called out in the source as the mechanism to "improve completion rates" — the central conversion metric of the entire module. Without this, form abandonment (the problem objective 2 exists to solve) goes unaddressed.

**Independent Test**: Can be fully tested by submitting partial answers on step 1 of a multi-step form, verifying step 2 renders conditionally based on those answers, abandoning before the final step, returning later, and confirming the form resumes with previously entered data intact.

**Acceptance Scenarios**:

1. **Given** a multi-step form with a conditional rule ("show Field X if Answer = A"), **When** the visitor selects Answer A on step 1, **Then** Field X is displayed on the relevant step; when Answer B is selected instead, Field X is skipped entirely.
2. **Given** a visitor is midway through a multi-step form, **When** they navigate to the next step, **Then** the current step's data is validated against its own rules before the visitor is allowed to proceed.
3. **Given** a visitor abandons a multi-step form after completing step 2 of 4, **When** they return to the same form later, **Then** the form resumes at step 3 with steps 1-2 data pre-filled rather than restarting from step 1.
4. **Given** a form field configured to auto-fill from known customer data, **When** a recognized visitor opens the form, **Then** the field is pre-populated and the visitor can still edit it before submitting.

---

### User Story 3 - Submission becomes a lead, synced instantly with full attribution (Priority: P1)

A visitor completes a form on a landing page reached via a Facebook Ads campaign with UTM parameters in the URL. On submission, the system creates a lead record capturing contact details, the originating landing page, device/browser/IP/country/language, a timestamp, and the full UTM parameter set, then synchronizes that lead to the Customer Data Platform (CDP) and CRM within seconds so sales/marketing automation can act on it immediately.

**Why this priority**: This is the module's stated purpose — "the primary lead acquisition engine." A page that converts visitors but fails to reliably create and propagate an attributed lead record delivers no business value; every downstream feature (lead scoring, nurture workflows, attribution reporting) depends on this record existing, being accurate, and arriving in near real time.

**Independent Test**: Can be fully tested by submitting a form via a URL containing UTM parameters and confirming a lead record with all captured fields (including the original UTM/source data) appears in the CDP and CRM within seconds of submission.

**Acceptance Scenarios**:

1. **Given** a visitor arrives via a URL containing UTM campaign parameters, **When** they submit a form on the landing page, **Then** a lead record is created capturing Lead ID, name, email, phone, company, source campaign, landing page, device, browser, IP address, country, language, timestamp, and the full UTM parameter set.
2. **Given** a lead record has just been created, **When** the synchronization process runs, **Then** the lead appears in both the CDP and the CRM within seconds of submission.
3. **Given** a lead originally acquired via "Google Ads", **When** the same contact later interacts with the brand through an unrelated organic search visit, **Then** the lead's original acquisition source remains "Google Ads" and is not overwritten.
4. **Given** a successful submission, **When** the post-submission redirect fires, **Then** the visitor is taken to the configured destination (e.g., Thank You Page, Webinar Room, Payment Gateway) with a personalized thank-you message where configured.

---

### User Story 4 - Lead magnet gated behind form completion (Priority: P2)

A visitor wants to download a PDF guide advertised on a landing page. The download link is gated: the visitor must complete the lead capture form before the file becomes accessible, and upon submission they are granted access (e.g., a download link or redirect to the asset).

**Why this priority**: Lead magnets are the primary incentive mechanism the source defines for driving form completion ("Downloads may require form completion before access"). It directly extends User Story 3's value by giving marketers a proven acquisition tactic, but the platform is still functional (pages publish, forms capture leads) without it, so it ranks below the core build/capture/sync loop.

**Independent Test**: Can be fully tested by attempting to access a gated asset without submitting the form (and confirming access is denied), then submitting the form and confirming the asset becomes accessible.

**Acceptance Scenarios**:

1. **Given** a landing page offers a gated PDF guide, **When** a visitor attempts to access the download link before submitting the form, **Then** access is denied and the visitor is prompted to complete the form.
2. **Given** a visitor completes the required form fields on a gated lead-magnet page, **When** the form is submitted, **Then** the visitor is granted access to the associated asset (PDF, ebook, whitepaper, checklist, template, video, audio file, coupon, discount code, or free trial).

---

### User Story 5 - A/B test a page and auto-promote the winner (Priority: P2)

A marketer creates two variants of a landing page that differ by headline and CTA button color, splits traffic between them, and lets the system determine a winner based on conversion performance. Once a statistically meaningful winner emerges, that variant automatically becomes the default page served to all future visitors.

**Why this priority**: A/B testing is explicitly named as a top-level module objective ("Enable A/B testing") and directly improves the conversion rate that the entire chapter exists to maximize. It builds on top of a published page (User Story 1) and existing traffic/lead flow (User Story 3), so it is valuable but not on the MVP's critical path.

**Independent Test**: Can be fully tested by configuring two page variants that differ in one tested element (e.g., headline), running traffic to both, and confirming the system promotes the higher-performing variant to be the default page without manual intervention.

**Acceptance Scenarios**:

1. **Given** a marketer configures an A/B test on a landing page varying the headline, **When** the test is activated, **Then** visitor traffic is split between the variants and each variant's performance is tracked independently.
2. **Given** an A/B test has run and one variant demonstrates a winning conversion outcome, **When** the winning condition is reached, **Then** the winning variant automatically becomes the default published page.
3. **Given** an A/B test is actively running, **When** a marketer edits the page in the builder, **Then** the system indicates that a test is in progress so the marketer does not unintentionally overwrite a variant being measured.

---

### User Story 6 - AI assistant drafts and optimizes page content, subject to human review (Priority: P3)

A marketer asks the AI Landing Page Assistant to draft headline options, suggest CTA copy, recommend images, and produce an SEO optimization pass for a new page. The AI populates suggestions directly into the editor, but every suggestion remains fully editable, and the page cannot be published with unreviewed AI output silently accepted — the marketer explicitly approves or edits the content before publishing.

**Why this priority**: AI assistance is called out as supporting "AI-powered optimization" (a stated module objective), and improves the speed and quality of page-building, but the module is fully usable via manual building (User Story 1) without it — making this an enhancement rather than a core dependency.

**Independent Test**: Can be fully tested by requesting AI-generated headline/CTA/SEO suggestions for a draft page, confirming the suggestions populate as editable content (not automatically published), editing one suggestion, and confirming the edited version — not the raw AI output — is what publishes.

**Acceptance Scenarios**:

1. **Given** a marketer requests AI headline suggestions for a draft page, **When** the AI responds, **Then** the suggestions appear as editable text within the builder, not as already-published content.
2. **Given** an AI-generated SEO optimization pass, **When** the marketer reviews the suggested meta title/description, **Then** they can accept, edit, or discard each suggestion individually before the page can be published.
3. **Given** an AI service call fails or times out, **When** the marketer is editing a page, **Then** the builder remains fully usable for manual editing and publishing without the AI assistant.

---

### User Story 7 - Marketing ops monitors the acquisition funnel (Priority: P3)

A marketing operations analyst opens the analytics dashboard for a landing page to see visitors, unique visitors, bounce rate, scroll depth, CTA clicks, form starts vs. completions, conversion rate, and revenue attribution — segmented by campaign, geography, and device — to identify where visitors are dropping off across the acquisition funnel (Visitor → Landing Page View → CTA Click → Form Started → Form Completed → Lead Created → Qualified Lead → Customer).

**Why this priority**: Funnel visibility is what turns individual page/form data into actionable optimization decisions, but it is an observability layer on top of capabilities that must already exist (pages, forms, leads); it does not block initial go-live of the acquisition engine itself.

**Independent Test**: Can be fully tested by generating traffic and submissions against a live page, then confirming the analytics dashboard reflects accurate visitor, CTA-click, form-start/completion, and conversion-rate figures with campaign, geographic, and device filters, updating within the defined refresh window.

**Acceptance Scenarios**:

1. **Given** a landing page has received traffic and submissions, **When** an analyst opens its analytics dashboard, **Then** visitor count, bounce rate, CTA clicks, form starts, form completions, and conversion rate are displayed and reflect underlying activity within 30 seconds of it occurring.
2. **Given** a landing page received traffic from multiple campaigns, **When** the analyst applies a campaign filter, **Then** the funnel metrics update to reflect only that campaign's traffic.
3. **Given** historical data exists for a page, **When** the analyst selects a historical comparison view, **Then** current-period metrics are shown alongside a prior period for comparison.

---

### Edge Cases

- What happens when a visitor resumes a multi-step form on a different device or browser than where they started, and no unifying identity (e.g., email already captured on step 1) is available to link the sessions? [NEEDS CLARIFICATION: source does not specify whether resume is cookie/session-scoped only or identity-linked across devices]
- How does the system handle a duplicate submission — e.g., the same visitor double-clicks Submit, or the same email address submits the same form twice within a short window? The source does not specify a deduplication rule. [NEEDS CLARIFICATION: dedupe key and behavior — create a second lead, merge, or reject — is not specified]
- How does the system handle a bot/spam submission that defeats or bypasses CAPTCHA/reCAPTCHA (e.g., a scripted submission with no human interaction signal)?
- What happens when a landing page URL is missing UTM parameters entirely, or contains malformed/truncated UTM values? The lead must still be captured, but source-attribution fields will be incomplete or unknown.
- What happens when an editor publishes changes to a page while an A/B test is actively splitting traffic across variants of that same page, or while a prior draft is still mid-review?
- What happens when a visitor uploads a file to a File Upload field that fails the file-upload scanning check (e.g., disallowed type or a flagged file)?
- What happens when a visitor declines tracking/personalization consent — how do dynamic personalization, UTM capture, and analytics degrade while consent for marketing/analytics tracking is withheld?
- What happens when the CDP or CRM integration is unreachable at the moment of submission — is the lead queued and retried, and does the visitor still see a successful submission confirmation while sync is pending?
- What happens when a multi-step form's conditional rules are contradictory or create a circular dependency (e.g., Field A's visibility depends on Field B, and Field B's visibility depends on Field A)?
- What happens when a lead-magnet download is requested but the visitor closes the form before completing all required fields — is partial data retained as a partial/abandoned lead, or discarded entirely? [NEEDS CLARIFICATION: source does not state whether an incomplete form submission is captured as a partial lead record]

## Requirements *(mandatory)*

### Functional Requirements

#### Page Builder & Templates

- **FR-001**: System MUST provide a drag-and-drop landing page builder with an infinite canvas that requires no HTML or CSS knowledge to use.
- **FR-002**: System MUST render every published landing page responsively across device sizes.
- **FR-003**: System MUST auto-save page edits, maintain a version history that can be viewed and restored, and support undo/redo of edits within the builder.
- **FR-004**: System MUST provide a grid system with multi-column layouts, organization-wide global styles, and reusable sections that can be applied across multiple pages.
- **FR-005**: System MUST provide pre-built page templates organized into Lead Generation (Ebook Download, Webinar Registration, Free Consultation, Demo Booking, Newsletter Signup), Product Marketing (Product Launch, Membership Sales, Course Promotion, Event Promotion, Podcast Promotion), Business Pages (About Company, Contact Us, Careers, Pricing, Testimonials), and Seasonal Pages (Festival Offers, Limited-Time Sale, Flash Sale, Referral Campaign, Community Challenges) categories.
- **FR-006**: Administrators MUST be able to duplicate and customize any template into a new landing page.

#### Branding

- **FR-007**: System MUST allow organizations to define global brand settings, including logo, brand colors, typography, buttons, border radius, shadows, icons, backgrounds, header, and footer.
- **FR-008**: System MUST automatically apply the organization's brand settings to every newly created landing page.

#### Page Components & Personalization

- **FR-009**: Builder MUST support the following component types: Heading, Paragraph, Images, Videos, Hero Banner, Countdown Timer, CTA Button, Pricing Table, Testimonial Carousel, FAQ Accordion, Progress Bar, Icons, Divider, Forms, Maps, Custom HTML, and Dynamic Content Blocks.
- **FR-010**: Each component MUST support responsive behavior and accessibility settings.
- **FR-011**: Landing pages MUST support dynamic content personalization based on visitor attributes (returning vs. new visitor, premium vs. free member, referral source, geographic location, preferred language, device type, campaign source, customer segment), updating content automatically without a page reload.

#### Form Builder & Logic

- **FR-012**: Form Builder MUST support creation of unlimited custom forms.
- **FR-013**: Form Builder MUST support the following field types: Text, Email, Phone Number, Password, Number, Date, Time, Dropdown, Radio Button, Checkbox, Multi-select, File Upload, Signature, Address, Country Selector, OTP Verification, and Hidden Fields.
- **FR-014**: Each form field MUST be configurable as Required, Optional, or Conditional.
- **FR-015**: Forms MUST support conditional field logic that shows fields based on previous answers, skips unnecessary questions, and displays dynamic recommendations based on responses given.
- **FR-016**: Forms MUST auto-fill known customer information where available and MUST validate field input in real time as the visitor types.
- **FR-017**: Conditional rules MUST support AND, OR, NOT, and nested condition combinations.
- **FR-018**: Large forms MUST support division into multiple steps, with a progress indicator and Previous/Next navigation between steps.
- **FR-019**: Multi-step forms MUST auto-save progress at each step and allow the visitor to resume an incomplete form later rather than restarting.
- **FR-020**: Multi-step forms MUST validate each step's fields independently before allowing progression to the next step.
- **FR-021**: Multi-step forms MUST be optimized for mobile completion.

#### Lead Capture, Magnets & Funnel

- **FR-022**: Every completed form submission MUST create a lead record.
- **FR-023**: Each lead record MUST capture Lead ID, Full Name, Email, Phone Number, Company, Source Campaign, Landing Page, Device, Browser, IP Address, Country, Language, Timestamp, and UTM Parameters.
- **FR-024**: System MUST track lead origin across supported sources (Google Ads, Facebook Ads, Instagram, LinkedIn, YouTube, Organic Search, Referral, Email Campaign, SMS Campaign, WhatsApp Campaign, QR Code, Manual Entry, API Integration), and every lead MUST retain its original acquisition source regardless of later interactions.
- **FR-025**: System MUST support lead magnets as downloadable/redeemable assets (PDF Guides, E-books, Whitepapers, Checklists, Templates, Videos, Audio Files, Coupons, Discount Codes, Free Trials), with the option to require form completion before granting access.
- **FR-026**: After a successful submission, System MUST redirect or present the visitor to a configured post-submission destination (Thank You Page, Product Page, Webinar Room, Payment Gateway, Community, Course Dashboard, Ebook Reader, or AI Assistant), with support for dynamic personalization of the thank-you message.
- **FR-027**: System MUST track every stage of the acquisition funnel (Visitor → Landing Page View → CTA Click → Form Started → Form Completed → Lead Created → Qualified Lead → Customer), recording conversion metrics and drop-off percentages at each stage.

#### Lead Sync & Attribution

- **FR-028**: System MUST synchronize newly created lead data with the Customer Data Platform (CDP) and CRM within seconds of form submission.
- **FR-029**: Landing pages and forms MUST integrate with Email Marketing, SMS Marketing, WhatsApp Marketing, Push Notifications, Payment Gateway, Webinar Platform, Calendar Booking, AI Assistant, Workflow Engine, and third-party APIs via the platform's integration framework.

#### AI Landing Page Assistant

- **FR-030**: System MUST provide AI assistance for landing page generation, copywriting, CTA optimization, headline suggestions, image recommendations, SEO optimization, conversion predictions, readability improvements, mobile optimization, and accessibility checks.
- **FR-031**: All AI-generated recommendations MUST remain editable by the marketer and MUST NOT be published automatically without the marketer's review and action.

#### A/B Testing

- **FR-032**: System MUST support A/B testing of landing pages across headlines, images, CTA buttons, colors, forms, testimonials, pricing, and layouts.
- **FR-033**: System MUST support automatically promoting the winning test variant to become the page's default version.

#### SEO Tooling

- **FR-034**: Landing pages MUST support SEO configuration including Meta Title, Meta Description, Open Graph Tags, Twitter Cards, Structured Data, Canonical URLs, XML Sitemap inclusion, Robots Configuration, Custom URLs, and Schema.org Markup.
- **FR-035**: System MUST update the page's SEO score dynamically as the marketer edits SEO fields and page content.

#### Analytics

- **FR-036**: Analytics dashboard MUST report Visitors, Unique Visitors, Bounce Rate, Time on Page, Scroll Depth, CTA Clicks, Form Starts, Form Completions, Conversion Rate, and Revenue Attribution for each landing page.
- **FR-037**: Analytics MUST support real-time monitoring, historical comparison, campaign filters, geographic insights, and device segmentation.

#### Security & Compliance

- **FR-038**: System MUST enforce role-based access control (RBAC) over who can create, edit, publish, and delete landing pages and forms.
- **FR-039**: Forms MUST support CAPTCHA and reCAPTCHA verification, CSRF protection, and rate limiting on submission endpoints to mitigate spam and abuse.
- **FR-040**: System MUST validate all submitted input server-side and scan all uploaded files before acceptance.
- **FR-041**: System MUST maintain an audit log of administrative actions on pages, forms, and templates.
- **FR-042**: System MUST enforce HTTPS for all traffic and encrypt sensitive data both in transit and at rest.

#### Performance

- **FR-043**: System MUST meet the following performance targets: Landing Page Load under 2 seconds; Form Rendering under 1 second; Form Submission processing under 2 seconds; Lead Creation under 3 seconds; Analytics Update within 30 seconds; AI Suggestions returned within 5 seconds.

### Key Entities

- **Landing Page**: A publishable, versioned web page composed of components, associated with a template origin, brand kit, SEO metadata, custom URL, and publish/draft state; may have one or more A/B test variants.
- **Page Template**: A pre-built, category-tagged (Lead Generation / Product Marketing / Business Pages / Seasonal) starting layout that can be duplicated into a new Landing Page.
- **Page Component**: An individual building block placed on a Landing Page's canvas (heading, image, video, hero banner, CTA button, form, etc.), carrying its own responsive and accessibility configuration.
- **Brand Kit**: The organization-level set of visual defaults (logo, colors, typography, buttons, backgrounds, header/footer) automatically applied to new Landing Pages.
- **Form**: A standalone or embedded data-collection object composed of Form Fields, optionally divided into steps, with conditional logic rules governing field visibility and flow.
- **Form Field**: A single input on a Form, typed (text, email, file upload, OTP, etc.) and flagged Required, Optional, or Conditional, with associated validation and conditional-display rules.
- **Conditional Rule**: A logic expression (AND/OR/NOT, nestable) attached to a Form Field or Form Step that determines whether it is shown, skipped, or auto-filled based on prior answers or known visitor data.
- **Submission**: A single instance of a visitor completing (or partially completing) a Form, timestamped, tied to a specific Landing Page and visitor session, and the trigger for Lead creation.
- **Lead**: The record created from a Submission, holding contact details, source attribution, and links to the originating Landing Page and Campaign; synchronized to the CDP and CRM.
- **UTM / Acquisition Metadata**: The captured source-tracking data (UTM parameters, referral source, device, browser, IP, country, language) attached immutably to a Lead at the moment of creation.
- **Lead Magnet**: A downloadable or redeemable asset (ebook, whitepaper, coupon, free trial, etc.) optionally gated behind Form completion.
- **A/B Test / Experiment**: A configuration splitting visitor traffic across two or more Landing Page variants differing in a tested element (headline, image, CTA, color, form, testimonial, pricing, layout), tracking performance per variant and capable of auto-promoting a winner.
- **Funnel Stage Event**: A recorded occurrence of a visitor advancing through the acquisition funnel (Landing Page View, CTA Click, Form Started, Form Completed, Lead Created, Qualified Lead, Customer), used to compute conversion and drop-off metrics.
- **SEO Metadata**: The set of search/social configuration fields (meta title/description, Open Graph, Twitter Card, structured data, canonical URL, sitemap inclusion, robots config, Schema.org markup) attached to a Landing Page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A marketer with no coding ability can build and publish a responsive landing page from a template, using only the drag-and-drop builder, with zero custom HTML/CSS written.
- **SC-002**: Published landing pages load in under 2 seconds and render forms in under 1 second, consistent with the defined performance targets.
- **SC-003**: At least 99% of form submissions result in a lead record visible in both the CDP and CRM within seconds of submission (consistent with the sub-3-second lead-creation and sub-30-second analytics-update targets).
- **SC-004**: Visitors who abandon a multi-step form and return later can resume from their last completed step without re-entering previously submitted data, measurably reducing full-form restarts.
- **SC-005**: 100% of leads retain their original, unaltered acquisition source and UTM attribution regardless of any later visitor interactions.
- **SC-006**: An A/B test can run to completion and automatically promote the winning variant as the default page with no manual publishing step required.
- **SC-007**: Every published landing page exposes a live-updating SEO score and complete SEO metadata (meta title/description, canonical URL, structured data) before publish.
- **SC-008**: The funnel dashboard reports conversion and drop-off percentages for every stage from Landing Page View through Customer, filterable by campaign, geography, and device.
- **SC-009**: Spam/bot submissions are measurably reduced on CAPTCHA/reCAPTCHA-protected forms compared to unprotected submission endpoints, with no legitimate submission blocked by rate limiting under normal traffic.

## Assumptions

- **Conversion funnel model**: This chapter adopts the acquisition funnel exactly as defined in the source: Visitor → Landing Page View → CTA Click → Form Started → Form Completed → Lead Created → Qualified Lead → Customer, with conversion and drop-off metrics recorded at every stage. All funnel-tracking requirements (FR-027, SC-008) are scoped to this model.
- **Dependency on feature 024 (lead-management-scoring)**: This chapter is responsible for creating the Lead record and its initial attribution data (through the "Lead Created" funnel stage). Everything that happens after capture — lead scoring, qualification into "Qualified Lead," routing, and nurture assignment — is out of scope here and owned by `024-lead-management-scoring`. This chapter's Lead entity is the hand-off point into that feature.
- **Dependency on CDP and CRM**: Real-time lead sync (FR-028) assumes the Customer Data Platform (feature `019-audience-segmentation-cdp`) and CRM (feature `013-crm-sales-support`) already exist and expose APIs capable of accepting lead writes within seconds; this chapter does not define those systems' internal data models.
- **Dependency on AI Marketing Assistant infrastructure**: The AI Landing Page Assistant (FR-030, FR-031) is assumed to be a specialized surface of the shared AI infrastructure defined in feature `025-ai-marketing-assistant`, including its human-review-before-action guardrail, rather than a separately built AI stack.
- **Dependency on A/B testing / attribution features**: This chapter covers page- and form-level experimentation triggers and winner auto-promotion (FR-032, FR-033) and campaign-level attribution capture (FR-023, FR-024); deeper statistical experiment methodology is assumed to be detailed in `026-ab-testing-cro`, and cross-channel attribution modeling in `028-attribution-roi-measurement`.
- **Consent and tracking**: Personalization and analytics tracking based on visitor attributes (FR-011, FR-036) assumes visitor consent state is captured and enforced by the platform's shared identity/consent system (per the constitution's per-channel, versioned consent principle) rather than being independently implemented within this module.
- **Constitution guardrail on dark patterns**: The Countdown Timer component (FR-009) and any urgency-oriented page component are assumed to be subject to the platform-wide constitutional prohibition on fabricated scarcity/urgency, even though this chapter's source text does not restate that rule explicitly.
- **Data retention**: The source does not specify a retention period for Submission or Lead PII. [NEEDS CLARIFICATION: retention/purge policy for form submissions and lead PII is not stated in this chapter]
- **RBAC role granularity**: FR-038 assumes the layered RBAC model (Organization → Department/Team → Role → Permission Group → Permission) defined at the platform level applies to landing-page and form management actions, rather than a feature-specific permission scheme.
- **Out of scope for this chapter**: Payment processing logic (Payment Gateway is an integration/redirect target only, FR-026/FR-029), webinar room mechanics, and the AI Marketing Assistant's broader campaign-copy capabilities are owned by their respective features and not re-specified here.
