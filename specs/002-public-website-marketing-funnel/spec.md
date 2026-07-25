# Feature Specification: Public Website, Marketing Funnel & Conversion System

**Feature Branch**: `002-public-website-marketing-funnel`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 02 of the TBT One Enterprise PRD — Public Website, Marketing Funnel and Conversion System (source: `document 1/Document 1 (1).md`). Covers the public (unauthenticated-reachable) website: information architecture, home/about/program/course/community/mentor/event/blog/podcast/resource public pages, lead-magnet and masterclass landing pages, the checkout funnel, the admin CMS/page-builder, SEO, analytics/A/B testing, personalization, localization, consent, and the anti-dark-pattern rules governing all of the above."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Understands TBT and Finds the Right Program (Priority: P1)

A first-time, unauthenticated visitor lands on the public website (via search, social, or a direct link) and needs to quickly understand what Tamil Business Tribe is, who it serves, what results to expect, and which program or course fits them — then take a clear next action (explore a program, join, or start free).

**Why this priority**: This is the foundation of every other funnel. If the visitor cannot orient within the home page and core navigation/browsing surfaces (IA, home page, program/course listing and detail pages), no downstream conversion (lead, signup, purchase) is possible. Every other user story depends on this surface existing first.

**Independent Test**: Can be fully tested by loading the home page as a logged-out visitor, verifying the five orienting questions (what/who/result/how/next-action) are answerable from the page, navigating to Programs → a Program Detail page, and confirming correct pricing/enrolment-state/CTA rendering — deliverable value even with no other funnel built.

**Acceptance Scenarios**:

1. **Given** a logged-out visitor on the home page, **When** the page loads, **Then** the hero, problem, solution, how-it-works, audience-segment, and final-CTA sections are present and each pain point/pillar/step is populated from admin-managed content (not hardcoded).
2. **Given** a visitor browsing the Program Listing page, **When** no programs match the selected filters, **Then** an empty state is shown with a localized explanatory message and Clear Filters, View All Programs, and Join Waitlist actions.
3. **Given** a visitor on a Program Detail page for a course they have already purchased, **When** the page renders, **Then** the CTA reads "Continue Learning" instead of a purchase CTA, and if the course is included in their active membership plan it instead reads "Included in Your Plan."
4. **Given** a Program Detail page with an expired promotional offer, **When** the page renders, **Then** the expired offer is hidden and only the correct, current price is displayed.

---

### User Story 2 - Visitor Converts Through the Free Resource (Lead Magnet) Funnel (Priority: P1)

A visitor discovers a free resource (ebook, checklist, template, etc.), lands on its dedicated lead-magnet landing page, submits the capture form, and receives the resource by email — entering Funnel A (Traffic → Lead Magnet → Email Capture → Resource Delivery → Program Recommendation).

**Why this priority**: This is the platform's primary top-of-funnel lead-generation mechanism and the simplest independently deployable conversion path — it requires only a landing page, a form, and email delivery, with no payment integration.

**Independent Test**: Can be fully tested by visiting a lead-magnet landing page, submitting the admin-configured form fields with consent checked, and verifying a success page, resource-delivery email, and a stored Lead record with attribution — deliverable and measurable independent of checkout or CMS features.

**Acceptance Scenarios**:

1. **Given** a visitor on a Lead Magnet Landing Page, **When** they submit the form with required fields and consent, **Then** a success page is shown, a resource-delivery email is sent, and a download link is provided.
2. **Given** a visitor submits the same lead-magnet form twice within a short window, **When** the second submission is processed, **Then** the system prevents a duplicate double-charge-style side effect (e.g., duplicate resource emails) via duplicate-submission handling.
3. **Given** a lead has not granted marketing-email consent, **When** the lead magnet flow completes, **Then** only the transactional resource-delivery email is sent — no follow-on marketing sequence (program recommendation, webinar upsell) is triggered.
4. **Given** the visitor arrived via a UTM-tagged campaign link, **When** the lead is created, **Then** the campaign attribution (UTM source/medium/campaign/term/content) is stored against the Lead.

---

### User Story 3 - Visitor Registers for a Masterclass/Webinar and Converts to Paid (Priority: P1)

A visitor lands on a Masterclass/Webinar landing page, registers, receives reminders, attends (or watches the replay), and is presented with an offer that leads into checkout — Funnel B (Traffic → Registration → Reminder → Webinar → Offer → Checkout).

**Why this priority**: This is the platform's primary top-of-funnel-to-paid conversion path outside direct course purchase, and it is explicitly documented as one of the seven core funnel architectures with its own anti-dark-pattern rules (no false countdowns/scarcity), making it a distinct, high-value, independently testable capability.

**Independent Test**: Can be fully tested by registering for an event on the Event Detail page, validating the registration form and seat/duplicate checks, confirming post-registration communications, and confirming the countdown/seat-count shown is either backed by real backend data or explicitly labeled an estimate.

**Acceptance Scenarios**:

1. **Given** a visitor on the Masterclass Landing Page, **When** the registration form is submitted with valid required fields, **Then** a confirmation is shown, an "Add to Calendar" action and WhatsApp share option are offered, and a registration-confirmation email is sent.
2. **Given** a visitor attempts to register for an event that is already full, **When** they submit the registration form, **Then** the system returns an `EVENT_FULL` error and does not create an overbooked registration.
3. **Given** a visitor attempts to register twice for the same event with the same identity, **When** the second registration is submitted, **Then** the system detects and handles the duplicate registration per `DUPLICATE_REGISTRATION` handling rules.
4. **Given** the masterclass page displays a registration countdown, **When** the backend-configured registration close date passes, **Then** the countdown and registration form reflect closure immediately — no client-side-only or fabricated countdown is shown.

---

### User Story 4 - Visitor Completes Checkout for Membership, Course, or Event (Priority: P1)

A visitor or registered user initiates checkout for a membership plan, course, event ticket, mentor session, digital product, or bundle, proceeds through payment, and reaches a confirmed success state with access granted.

**Why this priority**: Checkout is the terminal, revenue-generating step of every funnel (B, D, E, F, G) documented in this volume. Without a correct, state-accurate checkout flow, none of the upstream funnel work converts into revenue.

**Independent Test**: Can be fully tested by initiating checkout from any supported entry source, applying/failing a coupon, completing (or failing) a payment, and verifying the resulting payment state, success-page content, and access grant — independently valuable even before other public pages are built out.

**Acceptance Scenarios**:

1. **Given** a user on the checkout page with a valid coupon, **When** they apply it, **Then** price, discount, and tax update correctly and the coupon is honored only if currently valid (not expired/invalid).
2. **Given** a payment attempt fails, **When** the failure is returned, **Then** the user sees a clear error, Retry and Change Payment Method options, Contact Support, a preserved cart, and an explicit no-duplicate-charge warning.
3. **Given** a payment gateway reports success, **When** the success page renders, **Then** it shows payment success, order ID, product, an access button, invoice, and email confirmation — and product access is granted only after server-side payment-state confirmation, not merely because the success page rendered.
4. **Given** a user abandons checkout partway through, **When** the session times out or the user leaves, **Then** the system records user, product, cart value, last completed step, timestamp, and campaign source for that abandoned checkout.

---

### User Story 5 - Admin Manages Public Site Content Without Engineering Deployment (Priority: P2)

A marketing/content admin creates, edits, previews, schedules, and publishes public pages (landing pages, campaign pages, home-page sections) using the CMS page builder, without requiring a code release.

**Why this priority**: This is what makes the marketing funnel operable at business speed — campaigns, offers, and page changes happen far more often than engineering release cycles. It is P2 rather than P1 because the public site can launch with a first static/manually-deployed version, but ongoing operation depends on this capability.

**Independent Test**: Can be fully tested by an admin creating a new page from Page Builder blocks, configuring page settings (slug, SEO, audience, publish/expiry dates), moving it through Draft → Review → Approved → Scheduled → Published states, previewing it in mobile/desktop and logged-in/logged-out modes, and verifying it renders live at its slug only once published.

**Acceptance Scenarios**:

1. **Given** an admin assembles a page from supported blocks (Hero, Text, Image, Video, CTA, Features, Stats, Testimonials, Pricing, FAQ, Timeline, Team, Logo Strip, Programs, Courses, Events, Mentors, Forms, restricted Custom HTML, Spacer, Divider), **When** they save as Draft, **Then** the page is not publicly visible until it passes Review/Approved and reaches Published (or a Scheduled publish date arrives).
2. **Given** a published page is edited, **When** the admin saves a new version, **Then** the previous version is retained, restorable, and comparable, with editor identity and timestamp recorded.
3. **Given** an admin wants to verify a page before release, **When** they open Preview, **Then** they can view it in Mobile, Tablet, and Desktop viewports and in Logged-Out, Logged-In, and Membership-Specific contexts.
4. **Given** an admin sets a page's audience or no-index toggle, **When** the page is published, **Then** those settings are respected by the rendering and by search-engine indexing directives.

---

### User Story 6 - Returning Visitor Gets a Personalized, Localized Experience (Priority: P2)

A returning or identified visitor (via campaign, login state, membership, or language preference) sees content tailored to their signals — correct language, relevant persona/program highlighting, and no redundant purchase prompts for things they already own.

**Why this priority**: Personalization and localization directly affect conversion rate and are explicitly required across the home page, program pages, and pricing — but the platform is functional without them (a non-personalized, single-language fallback experience still converts), making this P2 rather than launch-blocking.

**Independent Test**: Can be fully tested by simulating distinct visitor signal sets (campaign-tagged traffic, logged-in member with a purchase, Tamil-language selection) and confirming each produces the documented tailored output, with a defined fallback when no signal is available.

**Acceptance Scenarios**:

1. **Given** a visitor arrives via a student-audience campaign link, **When** the home page renders, **Then** student-relevant programs are highlighted.
2. **Given** a logged-in member with an active membership, **When** they view the public site, **Then** "Join Now" is replaced with "Continue Learning" and no purchase CTA is shown for content already owned or included in their plan.
3. **Given** a visitor previously selected Tamil as their language, **When** they return to the site, **Then** Tamil content is served by default from a persisted preference, with a defined fallback language if a given page/section is untranslated.
4. **Given** no personalization signal is available for a new, anonymous, first-visit user, **When** the page renders, **Then** a complete, non-broken fallback experience is shown.

---

### User Story 7 - Marketing Team Runs A/B Tests and Measures Funnel/Campaign Performance (Priority: P2)

A marketing/growth admin configures an A/B test on a page element (headline, CTA label, pricing order, etc.), and separately monitors campaign and funnel performance (visitors → leads → signups → sales) through the analytics event taxonomy and campaign-attribution reporting.

**Why this priority**: Measurement and experimentation are what let the marketing team iteratively improve the funnels defined in User Stories 1-4; they are not required for the funnels to function at first launch, so this is P2.

**Independent Test**: Can be fully tested by launching an experiment with two variants and a defined conversion event, confirming a single visitor is consistently bucketed into the same variant across repeat visits, stopping the experiment via the admin control, and pulling a campaign report showing visitors/leads/signups/sales/conversion-rate for a tagged campaign.

**Acceptance Scenarios**:

1. **Given** an active A/B experiment on the hero headline, **When** the same visitor returns within the experiment window, **Then** they consistently see the same variant they were originally assigned.
2. **Given** an admin stops an experiment, **When** the stop is triggered, **Then** no further variant allocation occurs and the existing audit history (start/end date, sample size, allocation, results) remains available.
3. **Given** analytics events fire for a visitor session, **When** an event such as `checkout_started` or `payment_succeeded` is captured, **Then** it includes user/anonymous ID, session ID, page, referrer, campaign, device, language, timestamp, and product/plan ID where applicable, with no personally sensitive data in the payload.
4. **Given** a UTM-tagged campaign drove a visitor to eventual purchase, **When** an admin pulls the campaign report, **Then** visitors, leads, signups, sales, revenue, conversion rate, and refunds for that campaign are all reportable with attribution preserved end-to-end.

---

### User Story 8 - Visitor's Abandoned Checkout Is Recovered (Where Consented) and Consent Is Respected Throughout (Priority: P3)

A visitor who starts but does not complete checkout may receive a cart-recovery communication, but only if they have given valid consent for that channel; separately, every visitor's granular per-channel marketing/communication consent (email, WhatsApp, SMS, partner communication, personalization cookies) is captured, versioned, and honored — including immediate effect of withdrawal.

**Why this priority**: This is a refinement/compliance layer on top of the already-functioning checkout and lead-capture flows (User Stories 2-4) — valuable for recovering revenue and for legal compliance, but not required for the base funnels to operate, hence P3.

**Independent Test**: Can be fully tested by abandoning a checkout as a consented user (verify recovery email sent) and as a non-consented user (verify no recovery email sent), and by withdrawing a specific consent channel and confirming no further sends occur on that channel afterward.

**Acceptance Scenarios**:

1. **Given** a user abandons checkout and has marketing-communication consent on file, **When** the abandoned-checkout job runs, **Then** a recovery email may be triggered.
2. **Given** a user abandons checkout without marketing-communication consent, **When** the abandoned-checkout job runs, **Then** no recovery email is sent.
3. **Given** a lead/user has previously accepted marketing-email consent, **When** they later withdraw it, **Then** the withdrawal timestamp is recorded and no further marketing sends occur on that channel.
4. **Given** the cookie-consent banner is shown, **When** a visitor selects "Reject Non-Essential," **Then** analytics/marketing/personalization scripts governed by that category do not load, while essential functionality remains available.

---

### Edge Cases

- What happens when an Announcement Bar's configured end date has passed but an admin forgot to change its status? The system must stop displaying it automatically based on the date range, not rely on manual status changes.
- What happens when a Trust Strip, testimonial, or success-story metric has no documented source recorded in admin? It must not be eligible for publication — fabricated or unsupported metrics are explicitly prohibited.
- What happens when a visitor double-submits a lead-magnet or event-registration form (e.g., double-clicks Submit, or resubmits after a slow network response)? Duplicate-submission prevention must engage client-side, and server-side duplicate-lead/`DUPLICATE_REGISTRATION` handling must prevent duplicate records or duplicate resource/confirmation emails.
- What happens when a coupon applied at checkout has expired or does not apply to the selected product? The system must reject it with `COUPON_EXPIRED` or `COUPON_INVALID`, leave the cart intact, and not silently apply a partial or incorrect discount.
- What happens when an event reaches full capacity while a registration is in flight? Seat availability must be re-checked server-side at submission time and return `EVENT_FULL` rather than allowing an overbook based on stale client-side seat counts.
- What happens when a payment gateway reports client-side success but the server-side webhook/idempotency confirmation has not yet arrived? Per platform-wide server-authoritative-state principle, the success page must not itself unlock access, credit an order, or mark payment complete — access is granted only after backend verification.
- What happens when a user has not granted consent for a given communication channel and abandons checkout, or is otherwise eligible for an automated send on that channel? No automated message may be sent on that channel, regardless of business value in recovering the sale.
- What happens when a visitor's selected/detected language has no translated version of the requested page? The system must fall back to the defined fallback language rather than showing a broken or partially-untranslated page, and the missing translation should be visible to admins via translation-status tracking.
- What happens when a guest (unauthenticated) visitor tries to react to or comment on a public community post preview? A signup modal must intercept the action; the interaction must not be silently allowed or silently dropped.
- What happens when the site is in Maintenance mode and no confirmed return time exists? The branded maintenance page must omit the estimated-return-time element entirely rather than displaying a fabricated ETA.
- What happens on an unhandled server error (500)? The user must see a generic, safe message with a retry option, support reference, and an error reference code — never a technical stack trace.
- What happens when a logged-in member whose active plan already includes a given course/program visits its detail page? The page must show "Included in Your Plan," and must not present a "Buy Now" CTA that would charge an already-entitled member.

## Requirements *(mandatory)*

### Public Site Navigation & Global Components Requirements

- **FR-001**: System MUST provide desktop header navigation with items: Home, Programs, Courses, Community, Mentors, Events, Resources, Success Stories, Pricing, About, Login, Join Now.
- **FR-002**: System MUST provide dropdown sub-navigation for Programs (Business Foundation, Freelancing Growth, Content Creator Program, Coaching Business Program, Digital Marketing Program, Student Career Program, Corporate Training), Resources (Blog, Podcast, Ebooks, Templates, Business Tools, Free Guides, Assessments), and Community (Community Overview, Member Benefits, Community Guidelines, Leaderboard, Public Discussions).
- **FR-003**: Mobile header MUST show brand logo, language selector, login icon, and hamburger menu; opening the hamburger MUST present a full-screen or side-drawer menu with primary navigation, membership CTA, login CTA, social links, contact link, and legal links, and MUST disable background scroll while open.
- **FR-004**: System MUST make the header sticky on scroll, reducing header height, switching to a small logo variant, applying a solid or semi-transparent background, and always keeping the primary CTA visible; mobile sticky state MAY show a compact Join CTA.
- **FR-005**: System MUST support an admin-configurable Announcement Bar with fields (text, icon, CTA label/URL, background style, start date, end date, audience, dismissible flag, priority) that displays only while the current date is within the configured start/end range.
- **FR-006**: System MUST remember a visitor's announcement-bar dismissal at browser/session level and MUST resolve multiple concurrent announcements by configured priority order; admin MUST be able to preview an announcement before publishing.
- **FR-007**: For a logged-in visitor on the public site, the header MUST replace the Login button with the user's avatar and replace Join Now with Dashboard or Continue Learning, optionally showing an active-membership badge.
- **FR-008**: Footer MUST include Brand (logo, description, social links, newsletter signup), Platform (Courses, Community, Mentors, Events, Pricing), Resources (Blog, Podcast, Guides, Templates, Help Center), Company (About, Careers, Partners, Contact, Media), and Legal (Terms, Privacy, Refund Policy, Community Guidelines, Cookie Policy, Accessibility) sections, plus a footer bottom with copyright, company legal name, registration information where legally required, payment-security logos, and app-store links when available.
- **FR-009**: System MUST provide a global search (modal or dedicated page) covering Courses, Programs, Blog, Mentors, Events, Resources, and FAQs, requiring a minimum of two characters, using debounced queries, and offering suggested keywords, recent searches, keyboard navigation, empty state, error state, and search analytics capture.
- **FR-010**: System MUST show a cookie-consent banner with Accept All, Reject Non-Essential, Customize, and a Privacy Policy link, covering Essential, Analytics, Marketing, and Personalization categories, and MUST persist the accepted consent version and timestamp.

### Home Page Requirements

- **FR-011**: Home page MUST be structured so a first-time visitor can determine what TBT is, who it is for, what result to expect, how it works, and the next action to take, within the initial view.
- **FR-012**: Hero section MUST support eyebrow text, main headline, supporting description, primary CTA, secondary CTA, hero image or video, trust indicators, a member-count or verified-platform metric, and an optional rating, all editable by admin (including highlighted words, CTA URLs, media type, trust badge, metric value/label, section visibility, and display order).
- **FR-013**: Hero video MUST open in a modal supporting close button, captions, mute control, full-screen, playback analytics, focus trapping, and Escape-key close.
- **FR-014**: Trust Strip MUST NOT display fake or unsupported metrics; every displayed metric MUST have its source documented in admin, and manually-entered values MUST be distinguishable from system-calculated values.
- **FR-015**: Problem section MUST present visitor pain points, each with icon, short title, description, and optional supporting statistic or animation.
- **FR-016**: Solution section MUST present platform pillars (Structured Learning, Community Support, Expert Mentorship, AI Business Tools, Execution Challenges, Progress Tracking), each expandable in place or linking to a related page.
- **FR-017**: How-It-Works section MUST present the 6-step journey (create account, choose goal, get roadmap, learn and complete tasks, receive support, build and grow business) as a horizontal timeline on desktop and a vertical stepper on mobile.
- **FR-018**: Audience Segment section MUST present persona cards (Students, Freelancers, Coaches, Creators, Entrepreneurs, Small-Business Owners), each with persona label, pain point, expected outcome, suggested program, and CTA, linking to an audience-specific landing page.
- **FR-019**: Featured Programs section MUST display at most six programs, each with thumbnail, name, short promise, duration, level, language, format, price/membership-inclusion, rating, and CTA, and MUST support card states Open, Enrolment Closing, Coming Soon, Waitlist, Sold Out, and Invite Only.
- **FR-020**: Learning Paths section MUST list paths (e.g., Start a Business, Become a Freelancer, Grow Personal Brand, Launch a Course, Learn Digital Marketing, Scale Existing Business) with path name, target persona, course count, expected duration, milestones, and CTA.
- **FR-021**: Community Preview MUST show only content explicitly marked public (sample public posts, member avatars, recent wins, group categories, community statistics) and MUST NOT surface private member content; testimonial/profile display in this section requires user consent.
- **FR-022**: AI Tools Preview MUST display a configurable subset of AI tools; a guest clicking a tool MUST be routed to a limited demo, signup wall, lead-capture form, or tool landing page, and admin MUST control which tools are visible.
- **FR-023**: Mentor Section on the home page MUST display only approved and active mentors, each with photo, name, expertise, experience, language, rating, sessions completed, and a View Profile CTA.
- **FR-024**: Events Section MUST show upcoming events with title, date, time, timezone, online/offline flag, speaker, registration status, price, seats remaining, and Register CTA; a completed event MUST be automatically removed from the upcoming list and, where a replay exists, moved into the replay section.
- **FR-025**: Success Stories section MUST show member name, photo/video, starting situation, program attended, result, timeline, and verification status; any income claim MUST carry a verified status and a visible disclaimer, and MUST NOT imply a guaranteed result.
- **FR-026**: Membership Preview MUST display three or four plans (name, best-for label, monthly price, annual price, key features, main restriction, CTA, popular badge) with a Monthly/Annual/optional-Lifetime pricing toggle, and MUST calculate annual savings accurately.
- **FR-027**: Testimonials MUST support text, audio, video, and social-proof-screenshot formats, and every testimonial MUST record name, role, photo, consent status, source, approval status, and display date.
- **FR-028**: FAQ section MUST provide categorized questions (Platform, Membership, Courses, Payment, Refund, Community, Certificates, Technical Support) with accordion display, search, deep linking, FAQ structured-data markup, and admin-controlled sort order.
- **FR-029**: Final CTA section MUST present a strong headline, clear value proposition, primary CTA, secondary CTA, trust note, and — when the CTA leads to purchase — a secure-payment note.

### About, Program & Course Page Requirements

- **FR-030**: About page MUST include Hero, Origin Story, Mission, Vision, Values, Founder Message, Team, Platform Methodology, Impact Metrics, Partners, Timeline, Careers CTA, and Contact CTA sections; Team cards MUST carry name, role, photo, bio, social links, display order, and active status; Timeline milestones MUST carry year/date, title, description, image, metric, and link.
- **FR-031**: Program Listing page MUST support filtering by Category, User Type, Skill Level, Language, Duration, Format, Free/Paid, Certificate, Live/Self-Paced, and Enrolment Status, and sorting by Recommended, Newest, Most Popular, Price Low-to-High, Price High-to-Low, Rating, and Duration.
- **FR-032**: Program card MUST show cover image, title, subtitle, instructor, language, duration, level, delivery format, price, discount, membership availability, rating, enrolment deadline, and CTA; an empty filtered result MUST show an explanatory message with Clear Filters, View All Programs, and Join Waitlist actions.
- **FR-033**: Program Detail page MUST present a hero (name, transformation promise, target audience, instructor, rating, learner count, duration, language, format, price, CTA, preview video), and learning-outcome statements MUST be action-based (e.g., "create a 30-day content plan") rather than vague knowledge claims.
- **FR-034**: Program Detail curriculum MUST display modules, lessons, duration, preview lessons, locked lessons, assignments, and live sessions in accordion form; a cohort-based program MUST additionally show start date, end date, live-class schedule, assignment deadlines, timezone, and attendance requirements.
- **FR-035**: Program Detail MUST support Full Payment, Installment, Subscription Inclusion, Coupon, Scholarship, and Organization Pricing pricing modes, and MUST support enrolment states Open, Closing Soon, Waitlist, Closed, Upcoming, and Invite Only.
- **FR-036**: Program Detail sticky purchase card (desktop right-rail, mobile bottom-sticky) MUST show price, discount, a countdown only when genuine, CTA, secure-payment note, and refund summary.
- **FR-037**: Program Detail MUST enforce: correct price always displayed; expired offers hidden; an already-enrolled user sees Continue Learning; a plan-included course shows "Included in Your Plan"; a closed course shows the waitlist option; and a successful payment grants immediate access.
- **FR-038**: Course Catalog page MUST list self-paced courses separately from Programs with search and filters (category, level, language, duration, rating, certificate, free/paid, membership inclusion, instructor) and pagination or infinite loading; the public site MUST show only courses in Published or Scheduled-Preview status (never Draft, Archived, or Unlisted).
- **FR-039**: Course Detail page MUST include hero, trailer, outcomes, curriculum, instructor, requirements, reviews, FAQs, pricing, related courses, and final CTA sections, with CTA state driven by user status: not purchased → Buy Now; membership includes access → Start Course; already started → Continue Learning; completed → View Certificate or Review Course.

### Community, Mentor & Events Public Page Requirements

- **FR-040**: Community public page MUST include hero, benefits, group categories, member activities, community wins, community-guidelines preview, leaderboard preview, moderator introduction, and membership CTA sections.
- **FR-041**: Community public feed preview MUST display only explicitly public posts, each with author, public badge, post text, media, reaction count, comment count, and a Join-to-Participate CTA; a guest attempting to react or comment MUST be shown a signup modal.
- **FR-042**: Mentor Listing page MUST support filters (Expertise, Language, Price, Rating, Availability, Experience, Free Consultation, Session Type, Industry) and mentor cards with photo, name, headline, expertise tags, languages, rating, starting price, next available slot, and View Profile CTA; empty results MUST offer Clear Filters, Request a Mentor, and Join Mentor Waitlist.
- **FR-043**: Mentor Profile page MUST include hero, bio, expertise, experience, credentials, languages, session types, availability, reviews, related content, and booking CTA; a guest clicking the booking CTA MUST be redirected into the login/signup flow, and an unavailable mentor MUST offer Join Waitlist, Follow Mentor, and View Similar Mentors.
- **FR-044**: Events Listing page MUST support event types (Webinar, Workshop, Masterclass, Meetup, Conference, Bootcamp, Challenge Kickoff, Networking Event, Offline Training) and filters (Upcoming/Past, Online/Offline, Free/Paid, Category, Language, Date, Speaker, Location), with event cards showing banner, title, date, time, timezone, location, speaker, price, registration status, seats left, and CTA.
- **FR-045**: Event Detail page MUST include hero, countdown, description, agenda, speakers, schedule, venue/map, requirements, ticket types, FAQs, and related events.
- **FR-046**: Event registration form MUST capture name, email, mobile, city, profession, experience level, consent, and an optional referral code, and MUST validate required fields, email format, and country code, and MUST handle duplicate registration, seat availability, and payment-state checks.
- **FR-047**: Post-registration MUST show confirmation, Add to Calendar, WhatsApp share, email-sent status, Join Community CTA, and recommended resources.

### Content Hub Requirements (Success Stories, Blog, Podcast, Resources, Contact, Help Center)

- **FR-048**: Success Stories page MUST support filters (User Type, Program, Industry, Milestone, Language, Format, Verified Status) and a story detail with user background, starting challenge, journey, program used, actions taken, result, timeline, evidence/verification note, advice, and related-program CTA, and MUST NOT imply a guaranteed result.
- **FR-049**: Blog MUST organize posts into categories (Business, Freelancing, Marketing, Content Creation, Sales, Mindset, Productivity, AI Tools, Career, Community Stories) and provide a listing with featured article, latest articles, categories, search, popular posts, newsletter CTA, author filter, and tags.
- **FR-050**: Blog detail page MUST include breadcrumb, title, author, published date, updated date, reading time, hero image, table of contents, article content, share buttons, related resources, author bio, related articles, and CTA, with unique title, meta description, canonical URL, Open Graph tags, Article schema, Author schema, Breadcrumb schema, image alt text, and sitemap inclusion.
- **FR-051**: Podcast listing MUST support latest episodes, series, categories, hosts, search, duration, and guest filter; episode detail MUST include cover, title, host, guest, description, audio player, transcript, key takeaways, resources, share, related episodes, and a login-to-save CTA; the audio player MUST support play/pause, seek, speed, volume, duration, resume, and background playback in the member app.
- **FR-052**: Free Resource Library MUST list resource types (Ebook, Checklist, Template, Worksheet, Calculator, Assessment, Mini-Course, Prompt Pack, Webinar Replay) with cards showing thumbnail, title, type, description, access type, and download CTA, and MUST support access types Public, Email-Gated, Signup-Gated, Membership-Only, and Paid.
- **FR-053**: Contact page MUST provide a contact form, email, phone, office location, business hours, support-center link, social links, map, and department selection across categories (General Enquiry, Membership, Course, Payment, Partnership, Corporate Training, Media, Technical Support); submission MUST create a support ticket, send a confirmation email, assign an admin owner, track SLA, and apply spam protection.
- **FR-054**: Help Center MUST organize articles by category (Getting Started, Account, Membership, Courses, Community, Events, Payments, Certificates, AI Tools, Technical Issues) with search, category pages, helpful/not-helpful voting, related articles, contact-support link, ticket creation, and article versioning.

### Funnel & Lead Capture Requirements

- **FR-055**: Lead Magnet Landing Page MUST include headline, problem, resource preview, benefits, form, trust proof, author, FAQ, and privacy-note sections, with an admin-configurable dynamic form (Name, Email, Mobile, Profession, Business Stage, Interest, Consent fields).
- **FR-056**: Lead Magnet submission MUST trigger a success page, resource email delivery, a download link, an account-creation suggestion, a webinar upsell, and a related-resource suggestion.
- **FR-057**: Masterclass Landing Page MUST include headline, date/time, speaker, outcomes, who-should-attend, agenda, bonuses, testimonials, registration form, FAQ, and final CTA sections.
- **FR-058**: Masterclass/webinar pages MUST NOT use a false countdown; the registration close date MUST be sourced from the backend; and the displayed seat count MUST be either genuinely real or explicitly labeled as an estimate.
- **FR-059**: System MUST support the seven documented funnel architectures as distinct, trackable journeys: Funnel A Free Resource (Traffic → Lead Magnet → Email Capture → Resource Delivery → Program Recommendation), Funnel B Webinar (Traffic → Registration → Reminder → Webinar → Offer → Checkout), Funnel C Assessment (Traffic → Assessment → Personalized Result → Signup → Recommended Learning Path), Funnel D Membership (Traffic → Membership Page → Pricing → Checkout → Onboarding), Funnel E Course (Content Page → Course Detail → Checkout → Learning), Funnel F Event (Event Page → Registration → Attendance → Replay → Upsell), and Funnel G Mentor (Mentor Profile → Session Selection → Signup → Payment → Booking).

### Pricing Page Requirements

- **FR-060**: Pricing page MUST display configurable plans with name, target user, monthly price, annual price, features, limits, support level, AI credits, community access, course access, trial, and CTA, plus a comparison table covering Courses, Community, Events, Mentor Sessions, AI Usage, CRM, Certificates, Downloads, Support, and Organization Features.
- **FR-061**: Pricing MUST resolve currency from admin settings, display taxes clearly, calculate annual savings accurately, support coupon handling, highlight the logged-in user's current plan, determine upgrade/downgrade eligibility, and show grace-period messaging where applicable.
- **FR-062**: Pricing FAQ MUST address cancellation, refund availability, upgrade process, EMI availability, tax inclusion, certificate inclusion, and AI-credit reset behavior.

### Authentication Entry & Attribution Continuity Requirements

- **FR-063**: Public site MUST expose authentication entry points for Login, Signup, Forgot Password, Verify OTP, Email Verification, Social Login, and Account Recovery, deferring detailed authentication logic to Volume 03 (Authentication, Identity, Onboarding).
- **FR-064**: System MUST preserve the originally requested redirect URL through login/signup so the user returns to the same protected page after authenticating, and MUST preserve campaign attribution data through the signup step.

### Checkout & Payment-State Requirements

- **FR-065**: System MUST support checkout initiation from Membership, Course, Event, Mentor Session, Digital Product, and Bundle sources.
- **FR-066**: Checkout page MUST present product summary, price, discount, taxes, coupon entry, billing information, payment method selection, terms acceptance, refund-policy acknowledgment, and a Pay button.
- **FR-067**: Checkout MUST architecturally support UPI, credit card, debit card, net banking, wallet, EMI, international cards, and invoice payment for organizations.
- **FR-068**: System MUST track and expose checkout/payment state as one of: Not Started, Processing, Requires Action, Success, Failed, Cancelled, Pending, Refunded, or Partially Refunded.
- **FR-069**: On failed payment, system MUST show a clear error, offer Retry and Change Payment Method actions, offer Contact Support, preserve the cart, and display a no-duplicate-charge warning.
- **FR-070**: On successful payment, system MUST show payment success, order ID, product, an access button, invoice, email confirmation, a recommended next step, and a referral/share option.
- **FR-071**: System MUST track abandoned checkouts, recording user, product, cart value, last completed step, timestamp, and campaign source, and MAY trigger a cart-recovery email only where the user has given consent.

### Personalization Requirements

- **FR-072**: System MUST personalize public-site experience using available signals: language, traffic source, campaign, previous pages viewed, selected persona, stated user goal, logged-in status, membership, purchased products, location, device, and previous event registration.
- **FR-073**: System MUST tailor program highlights to campaign-derived persona (e.g., student-campaign traffic sees student programs highlighted), replace Join Now with Continue Learning for existing members, suppress "buy" CTAs for already-purchased courses, and default to Tamil content for users who selected Tamil.
- **FR-074**: Every personalization rule MUST have a defined fallback experience for when personalization signals are unavailable.

### Localization Requirements

- **FR-075**: System MUST support Tamil, Tanglish, and English as initial languages, with manual language switching, browser-language suggestion, and persisted language preference.
- **FR-076**: System MUST provide SEO-specific localized URL structures per language (e.g., `/ta/courses`, `/en/courses`), track per-page translation status, define a fallback language, and provide an admin translation editor. [NEEDS CLARIFICATION: source states Tanglish is handled as an "optional product mode" — whether Tanglish receives its own indexed URL/locale prefix or is only a display toggle layered on another language is left as a product decision, not specified in this volume.]
- **FR-077**: System MUST localize currency and date formats per locale, clearly display timezone, and MUST be verified for Tamil-font readability and correct line-breaking of mixed-language (Tamil/English) text.

### Responsive Design & Page-State Requirements

- **FR-078**: System MUST support responsive breakpoints for small mobile, mobile, tablet, laptop, desktop, and large desktop.
- **FR-079**: Mobile layout MUST use single-column layout, large tap targets, sticky CTA, collapsible content, optimized images, reduced decorative animation, no horizontal overflow, and mobile-keyboard-friendly forms; desktop layout MUST support multi-column layouts, sticky navigation, sticky purchase card, rich comparison tables, hover states, and expanded filters.
- **FR-080**: Every dynamic page MUST implement Loading (skeleton, preserved layout, no full blank screen), Empty (explanation, next action, clear-filter option), Error (human-readable message, retry, support option, error reference code), Offline (network-unavailable message, retry, cached content where available), Maintenance (branded page, estimated-return time shown only when confirmed, status-page link), 404 (search, home CTA, suggested pages, report-broken-link), and 500 (generic safe message, retry, support reference, no technical stack trace) states.

### Form Design & CTA Governance Requirements

- **FR-081**: Every form MUST provide clear labels, required-field indicators, inline validation, an error summary where needed, password visibility toggle, autofill support, mobile-appropriate input types, a consent checkbox where applicable, a submit loading state, and duplicate-submission prevention.
- **FR-082**: Form validation MUST occur on blur or submit, display errors adjacent to the relevant field, never discard already-entered user input, treat server-side validation as authoritative, and use specific, actionable error messages (e.g., "enter a valid email address" rather than "invalid input").
- **FR-083**: Every page section MUST have exactly one primary CTA; CTA labels MUST be action-based (e.g., "Start Free," "Join Now," "Register for Masterclass") and MUST NOT use generic labels like "Click Here"; a disabled CTA MUST explain why it is disabled; and a CTA in a loading state MUST disable repeated clicks to prevent duplicate submission.

### CMS & Page-Builder Requirements

- **FR-084**: Admin MUST be able to manage all public website content without requiring a code deployment.
- **FR-085**: Page Builder MUST support block types: Hero, Text, Image, Video, CTA, Features, Stats, Testimonials, Pricing, FAQ, Timeline, Team, Logo Strip, Programs, Courses, Events, Mentors, Forms, restricted Custom HTML, Spacer, and Divider.
- **FR-086**: Page Settings MUST cover title, slug, status, language, template, SEO fields, Open Graph fields, canonical URL, publish date, expiry date, audience targeting, header/footer visibility, and a no-index toggle.
- **FR-087**: Content MUST move through a workflow of Draft, Review, Approved, Scheduled, Published, and Archived states.
- **FR-088**: System MUST retain previous page versions, support restore and change-comparison, and record editor identity, timestamp, and approval log per version.
- **FR-089**: Admin MUST be able to preview a page in Mobile, Tablet, and Desktop viewports, and in Logged-Out, Logged-In, and Membership-Specific contexts, before publishing.

### SEO Requirements

- **FR-090**: Every indexable page MUST have a unique title, meta description, canonical URL, Open Graph title/description/image, Twitter metadata, structured data, breadcrumb, sitemap entry, robots rules, image alt text, and internal links.
- **FR-091**: System MUST emit structured data for Organization, Website, Breadcrumb, Course, Event, FAQ, Article, Person, Podcast Episode, Product, and Review types where applicable.
- **FR-092**: System MUST server-render metadata, maintain clean URLs, manage redirects (including 301 support), publish an XML sitemap and image sitemap, lazy-load non-critical content, monitor Core Web Vitals, report broken links, and prevent indexing of duplicate query-parameter URLs.

### A/B Testing & Analytics Requirements

- **FR-093**: System MUST support A/B testing of hero headline, CTA label, hero image, pricing order, testimonial format, form length, and page-section order.
- **FR-094**: A/B test framework MUST assign a given user the same variant consistently for the life of the experiment, require a defined conversion event, enforce experiment start/end dates, respect configured sample size and variant allocation, provide an admin stop control, and retain an experiment audit history. [NEEDS CLARIFICATION: "same variant" consistency mechanism (cookie/session vs. account-linked identity, and behavior across devices) is not specified.]
- **FR-095**: System MUST use a consistent event-naming taxonomy for analytics (e.g., `page_viewed`, `hero_cta_clicked`, `video_started`, `video_completed`, `program_viewed`, `course_viewed`, `pricing_viewed`, `plan_selected`, `lead_form_started`, `lead_form_submitted`, `webinar_registered`, `checkout_started`, `coupon_applied`, `payment_succeeded`, `payment_failed`, `account_created`, `language_changed`, `search_performed`, `faq_expanded`).
- **FR-096**: Every analytics event MUST carry user ID (when available), anonymous ID, session ID, page, referrer, campaign, device, language, timestamp, and product/plan ID where applicable, and MUST NOT include personally sensitive information in the analytics payload.

### Campaign Tracking Requirements

- **FR-097**: System MUST capture UTM source, medium, campaign, term, and content, referral code, affiliate ID, and landing-page variant for every visitor, and MUST preserve this attribution through signup and purchase.
- **FR-098**: Admin MUST be able to report, per campaign, visitors, leads, signups, sales, revenue, conversion rate, refunds, and cost data where cost integration is connected.

### Email Automation Requirements

- **FR-099**: System MUST trigger lead-magnet emails (resource delivery, reminder, related resource, program recommendation), webinar emails (registration confirmation, one-day reminder, one-hour reminder, starting-now, replay, offer follow-up), checkout emails (payment success, invoice, payment failure, abandoned checkout, refund confirmation), and account emails (verify email, welcome, password reset) from the corresponding public-site actions.
- **FR-100**: All email templates MUST be admin-manageable without code deployment.

### Consent & Communication Requirements

- **FR-101**: System MUST store consent separately per type: Terms Acceptance, Privacy Acceptance, Marketing Email, WhatsApp Updates, SMS Updates, Partner Communication, and Personalization Cookies — never as a single combined opt-in flag (see Constitution Article VI).
- **FR-102**: Every consent record MUST capture user/lead ID, consent type, policy version, timestamp, source, IP address where legally appropriate, and a withdrawal timestamp when revoked.

### Security Requirements

- **FR-103**: Public website MUST enforce HTTPS, secure headers, CSRF protection where applicable, rate limiting, bot protection, form spam protection, input sanitization, file-upload validation, secure cookies, and MUST NOT expose secrets client-side.
- **FR-104**: System MUST tokenize payment data and verify webhook signatures for all payment-related callbacks.
- **FR-105**: Admin preview links MUST expire.

### Performance Requirements

- **FR-106**: Under normal network conditions on supported devices, hero content MUST become visible quickly, the main layout MUST remain visually stable, buttons MUST respond immediately to interaction, large images MUST use responsive variants, below-the-fold content MUST lazy-load, third-party scripts MUST load in a controlled manner, and marketing scripts MUST load only after consent is given.
- **FR-107**: System MUST define a performance budget per page template.

### Accessibility Requirements

- **FR-108**: Public website MUST provide semantic headings, form labels, keyboard navigation, visible focus states, image alt text, video captions and transcripts, sufficient contrast, skip-navigation, ARIA only where necessary, error announcements, modal focus trapping, and reduced-motion support.

### Integration Requirements

- **FR-109**: Public website MUST integrate with Authentication Service, Course Platform, Community Platform, Payment Gateway, Email Provider, CRM, Analytics, Tag Manager, Video Hosting, Calendar, Support System, AI Tool Gateway, Search, CDN, and Object Storage.
- **FR-110**: Every external integration MUST define timeout, retry, failure logging, fallback behavior, and monitoring.

### Anti-Dark-Pattern & Compliance Requirements

- **FR-111**: System MUST NOT use fabricated or unsupported trust/social-proof metrics anywhere on the public site (home trust strip, testimonials, success stories), consistent with Constitution Article III.
- **FR-112**: System MUST NOT display a false or fabricated countdown timer on any masterclass, webinar, or offer surface; any displayed registration close date or offer expiry MUST originate from the backend, and any displayed seat/scarcity count MUST be genuinely real or explicitly labeled as an estimate.
- **FR-113**: Any income, result, or outcome claim (success stories, testimonials, program promises) MUST carry a verification status and a visible disclaimer, and MUST NOT imply a guaranteed result.
- **FR-114**: System MUST NOT show a "buy" CTA for a product the logged-in user has already purchased or that is already included in their active membership plan.
- **FR-115**: Error surfaces (404, 500, form errors) MUST NOT expose technical stack traces to end users.

### Error Handling Requirements

- **FR-116**: System MUST define and surface standard public-facing error codes: `AUTH_REQUIRED`, `INVALID_FORM`, `DUPLICATE_REGISTRATION`, `EVENT_FULL`, `OFFER_EXPIRED`, `COUPON_INVALID`, `COUPON_EXPIRED`, `PAYMENT_FAILED`, `PAYMENT_PENDING`, `RESOURCE_UNAVAILABLE`, `RATE_LIMITED`, and `SERVER_ERROR`.

### Key Entities *(include if feature involves data)*

- **Page**: A CMS-managed public URL with settings (slug, status, language, template, SEO metadata, publish/expiry dates, audience targeting, header/footer visibility, no-index toggle).
- **Page Section / Content Block**: A configurable block instance (Hero, Text, Stats, Pricing, FAQ, Testimonials, etc.) placed within a Page via the Page Builder, with its own display order and visibility.
- **Navigation**: The structured configuration of header, footer, and dropdown menu items.
- **Announcement**: A time-boxed, prioritized, dismissible site-wide banner message with an audience and CTA.
- **Program**: A structured (potentially cohort-based) offering with curriculum, instructor, pricing modes, and enrolment state.
- **Course**: A self-paced learning product with catalog status (Draft/Published/Scheduled/Archived/Unlisted).
- **Instructor**: The person profile (bio, credentials, courses, reviews) attached to a Program or Course.
- **Mentor**: An approved marketplace expert profile with expertise, availability, and bookable session types; only approved/active mentors are shown publicly.
- **Event**: A webinar/workshop/masterclass/etc. with schedule, ticket types, registration form, and replay linkage.
- **Testimonial**: A named, consented endorsement in text/audio/video/screenshot form with approval status and display date.
- **Success Story**: A verified member outcome narrative with verification status and mandatory disclaimer.
- **Blog Post**: An article with SEO metadata, author, categories, and tags.
- **Category / Tag**: Shared taxonomy entities used across Blog, Resources, Events, and Programs.
- **Podcast Episode**: An audio episode with transcript, host/guest metadata, and player state.
- **Resource**: A downloadable or gated asset (ebook, checklist, template, calculator, etc.) with a defined access type.
- **Lead Form**: A configurable form definition (fields, consent checkbox) attached to a landing page.
- **Lead**: A captured prospect record (contact details + consent + campaign attribution) prior to becoming a registered user.
- **Campaign**: A trackable acquisition source (UTM parameters, referral code, affiliate ID, landing-page variant) with attribution outcomes.
- **Pricing Plan**: A membership/subscription tier with monthly/annual pricing, features, limits, and entitlements.
- **Coupon**: A discount code with a validity window and usage rules, applied and validated at checkout.
- **Order**: A checkout transaction record capturing product, price, discount, tax, and payment state.
- **Payment**: A payment attempt/transaction tied to an Order, with lifecycle state (Not Started/Processing/Requires Action/Success/Failed/Cancelled/Pending/Refunded/Partially Refunded).
- **Checkout Session / Abandoned Checkout**: A tracked in-progress or abandoned purchase attempt (user, product, cart value, last completed step, timestamp, campaign source).
- **FAQ**: A categorized, searchable question/answer entry with structured-data markup.
- **Team Member**: An About-page profile (name, role, photo, bio, social links, display order, active status).
- **Partner**: A logo/brand entity shown in trust strips or partner sections.
- **Redirect**: A URL-to-URL mapping (e.g., 301) used for SEO and broken-link management.
- **SEO Metadata**: Per-page title, description, canonical URL, Open Graph/Twitter fields, and structured-data configuration.
- **Consent Record**: A per-channel, versioned, timestamped consent (and withdrawal) entry linked to a user or lead.
- **Experiment (A/B Test)**: A defined test with variants, allocation rules, a conversion event, start/end dates, and audit history.
- **Translation**: A per-page, per-language localized-content record with translation and fallback status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor landing on the home page can identify what TBT is, who it serves, what result to expect, how it works, and the next action to take — within the initial view of the page (per the volume's own 10-second orientation objective).
- **SC-002**: 100% of trust-strip, testimonial, and success-story metrics shown publicly are traceable to a documented admin-recorded source; zero fabricated or unsupported metrics reach production.
- **SC-003**: Every one of the seven documented funnel types (Free Resource, Webinar, Assessment, Membership, Course, Event, Mentor) is measurable end-to-end from visitor to paid conversion, with a reportable conversion rate per funnel per campaign.
- **SC-004**: A marketing/content admin can create, preview, schedule, and publish a new public page or campaign landing page entirely through the CMS Page Builder with zero engineering code deployment.
- **SC-005**: 100% of consent-gated automated communications (marketing email, WhatsApp, SMS, personalization, partner communication) reflect the current per-channel consent state at send time, with a withdrawal taking effect before the next scheduled or automated send.
- **SC-006**: Core browsing, search, form, and checkout flows remain fully usable (no horizontal overflow, adequate tap targets, working sticky CTAs) across small-mobile, mobile, tablet, laptop, desktop, and large-desktop breakpoints.
- **SC-007**: A/B experiments consistently return the same variant to a returning visitor for the life of the experiment, and every experiment has a defined conversion event, start/end date, and functioning admin stop control.
- **SC-008**: Zero abandoned-checkout recovery messages are sent to a lead or user without valid, current consent for that communication channel.
- **SC-009**: All P0 launch-critical pages (Home, About, Programs, Program Detail, Courses, Course Detail, Pricing, Login, Signup, Checkout, Payment, Contact, Legal, Admin CMS, Analytics basics, SEO basics) pass the full QA acceptance checklist before launch.
- **SC-010**: Campaign attribution (UTM parameters, referral code, affiliate ID, landing-page variant) is preserved unbroken from first visit through signup and through purchase for every trackable conversion.

## Assumptions

- Detailed authentication mechanics (password rules, OTP delivery, social-login provider integration, session management) are owned by Volume 03 (Authentication, Identity, Onboarding, Personalization, Member Dashboard); this spec covers only the public-site authentication entry points, redirect-URL preservation, and attribution continuity into signup.
- Detailed database field definitions for every entity listed under Key Entities are explicitly deferred by the source PRD to Volume 14 (Enterprise Marketing Platform); this spec defines the entities conceptually, not their full schema.
- Full course/program curriculum authoring, mentor booking/session logic, and community post/moderation rules are owned by their respective volumes (04 LMS, 07 Mentors, 05 Community); this spec covers only how those objects are discovered, previewed, and marketed on the public site.
- Payment gateway integration mechanics, invoice/GST tax computation, coupon and commission calculation logic, and membership-plan entitlement resolution are owned by Volume 09 (Membership Plans, Subscriptions, Payments, Invoices, Affiliates, Revenue Ops); this spec covers checkout UI/UX, payment-state display, and funnel/abandoned-cart tracking only, and access-granting on payment success MUST be server-authoritative per Constitution Article I.
- CRM lead routing, ticket ownership/assignment, and SLA policy detail are owned by Volume 13 (CRM: Sales Pipeline, Leads, Support Desk); this spec covers only lead-capture forms, initial Lead record creation, and hand-off.
- Detailed A/B testing statistical methodology (sample-size calculation, significance testing) and the full marketing-automation workflow engine are more fully specified in Volume 14 Part 1 (Chapters 9, 13); this spec covers only the public-site-facing testable elements and rules stated in this volume.
- "Tanglish" is treated as a first-class supported language per this volume's header and Section 30, but the source explicitly leaves its SEO/URL-locale treatment as an open product decision (see FR-076's `[NEEDS CLARIFICATION]`).
- Specific CDN, video-hosting, search-infrastructure, and object-storage vendor selection are implementation details left to `plan.md`, not specified in this volume beyond naming them as required integrations (Section 45).
- This spec is consistent with Constitution Article III (No Dark Patterns, No Guaranteed-Outcome Claims — governing trust metrics, urgency/countdowns, and success-story claims), Article VI (Consent Is First-Class, Per-Channel, and Versioned — governing Section 41), and Article I (Server-Authoritative State — governing payment-success-to-access-grant behavior in the checkout funnel).
