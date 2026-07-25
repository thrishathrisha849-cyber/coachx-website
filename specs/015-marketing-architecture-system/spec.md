# Feature Specification: Marketing Platform Architecture & System Overview

**Feature Branch**: `015-marketing-architecture-system`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 – Marketing Automation Platform, Part 1 – Marketing Foundation, Chapter 2 – Marketing Architecture & System Overview: technical architecture, system boundaries, component interactions, infrastructure, integration points, data flow, and scalability strategy for the TBT Marketing Automation Platform. Source: `document 1/Document 1 (14).md`."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - A Platform Event Triggers Downstream Automation and Analytics (Priority: P1)

A user action anywhere in TBT (e.g., a course purchase, a membership upgrade, or a referral completion) is emitted as a platform event. The event-driven architecture must ensure that both the Automation Engine (for triggering marketing workflows) and the Analytics Service (for reporting) receive and durably store that event, without the originating module needing to know which downstream services care about it.

**Why this priority**: Event-driven architecture is named as a core architecture principle (§3) and the entire Automation Engine and Analytics Service depend on receiving a reliable, complete event stream (§5, §10). Every other Volume 14 feature (automation workflows, attribution, lifecycle marketing) is built on top of this event spine, making it the foundational, must-work-first capability of this chapter.

**Independent Test**: Can be fully tested by triggering one of the cataloged events (e.g., "Course Purchased") from a source module and confirming, independently of any specific campaign or workflow being configured, that the event is persisted and becomes visible to both the Automation Engine's trigger-detection mechanism and the Analytics Service's event tracking, with no direct coupling between the originating module and the consuming services.

**Acceptance Scenarios**:

1. **Given** a user completes a course purchase, **When** the LMS emits a "Course Purchased" event, **Then** the event is captured by the platform's event-driven architecture and stored for both analytics and automation consumption (§10).
2. **Given** the Automation Engine is running trigger detection, **When** a "Membership Upgraded" event is stored, **Then** the Automation Engine's trigger-detection mechanism is able to observe the event without a direct, hardcoded call from the Membership module (§5, §10).
3. **Given** a "Referral Completed" event and a "Reward Earned" event both occur for the same user, **When** the Analytics Service processes the event stream, **Then** both events appear independently in event tracking and conversion statistics (§5, §10).
4. **Given** a new module emits an event type not yet in the current catalog, **When** architecture extensibility is evaluated, **Then** the event-driven design must accommodate new event types without requiring redesign of existing consuming services (§2 extensibility for future modules).

---

### User Story 2 - Multi-Channel Notification Dispatch With Delivery Tracking (Priority: P1)

A marketer or an automated workflow sends a message to a user through one of the supported channels (Email, SMS, WhatsApp, Push, or In-App). The Communication Service and Notification Infrastructure must dispatch the message and continuously track its delivery status, opens, and clicks, retrying on failure and recording the failure reason when delivery does not succeed.

**Why this priority**: Multi-channel communication is the platform's primary externally visible capability and is explicitly required to record delivery status, open tracking, click tracking, retry mechanism, failure reason, timestamp, and device information for every notification (§8) — this is the architectural backbone every channel-specific feature (020 Email, 021 SMS/WhatsApp/Push) depends on.

**Independent Test**: Can be fully tested by dispatching a single notification through each of the five supported channels and confirming that a delivery-status record, retry attempt (on simulated failure), and open/click tracking event are all correctly captured against that specific dispatch, independent of any particular campaign's content.

**Acceptance Scenarios**:

1. **Given** a notification is dispatched through the Communication Service, **When** the message reaches the provider, **Then** the system records delivery status, timestamp, and device information for that dispatch (§8).
2. **Given** an email notification is opened by the recipient, **When** the open event is received, **Then** open tracking is recorded and made available for reporting (§8).
3. **Given** a push notification fails to deliver, **When** the failure is detected, **Then** the system records the failure reason and executes the configured retry mechanism (§8).
4. **Given** a recipient clicks a link inside a dispatched message, **When** the click event fires, **Then** click tracking is recorded and attributable to the specific notification and channel (§8).

---

### User Story 3 - External Integration Syncs Conversion and Communication Data (Priority: P2)

An administrator connects an external service (e.g., Payment Gateway, WhatsApp Business API, Google Analytics, or Meta Pixel) to the platform through the Integration Layer. The architecture must allow this external system to exchange data with TBT's internal services (Campaign, Communication, Analytics) through a defined integration point, including outbound webhooks, without embedding vendor-specific logic throughout the core services.

**Why this priority**: The Integration Layer is one of the chapter's explicitly enumerated architectural components (§9), spanning both internal modules and external services, and is required for the platform to function as "the centralized marketing engine for the entire TBT ecosystem" rather than an isolated tool — but it is P2 because the core event/notification loop (User Stories 1–2) must work before external sync value can be realized.

**Independent Test**: Can be fully tested by connecting one external service (e.g., a WhatsApp Business API sandbox account) through the Integration Layer, sending a message via the Communication Service, and confirming the external service receives it and that any webhook callback (e.g., delivery confirmation) is correctly received and applied back into the platform's notification delivery-status record.

**Acceptance Scenarios**:

1. **Given** the Integration Layer is configured with the Payment Gateway, **When** a transaction event occurs, **Then** the corresponding data becomes available to internal services (e.g., Analytics for revenue data) through the defined integration point (§9).
2. **Given** the WhatsApp Business API is connected as an external service, **When** the Communication Service dispatches a WhatsApp message, **Then** the message is routed through that external integration rather than a direct, hardcoded provider call (§9).
3. **Given** Google Analytics and Meta Pixel are both configured as external integrations, **When** a tracked conversion event occurs, **Then** the event data is made available to both external services without requiring separate custom integration code paths per service (§9).
4. **Given** an external service sends an inbound webhook (e.g., a delivery receipt), **When** the webhook is received, **Then** the platform's Integration Layer accepts and routes it to the correct internal service (§9).

---

### User Story 4 - Platform Meets Stated API and Operation Latency Targets Under Load (Priority: P2)

An operator or automated monitoring system verifies that core platform operations complete within the architecture's stated performance targets — API responses, login, dashboard load, notification dispatch, campaign publish, and analytics refresh — even as user and campaign volume grows toward the millions-of-users scale the architecture is designed for.

**Why this priority**: Concrete, numeric performance targets are one of the few directly testable, unambiguous requirements in this chapter (§13) and directly gate whether the "high availability" and "horizontal scalability" architecture principles (§2) are actually being met; it is P2 because it validates the services built in User Stories 1–3 rather than introducing new functional surface area.

**Independent Test**: Can be fully tested by measuring API response time, login time, dashboard load time, notification dispatch time, campaign publish time, and analytics refresh time under representative load and confirming each falls within its stated target (§13), independent of which specific feature triggered the measured operation.

**Acceptance Scenarios**:

1. **Given** a client calls a platform API endpoint, **When** the response is measured under normal load, **Then** the response time is under 300 ms (§13).
2. **Given** a user submits login credentials, **When** authentication completes, **Then** the end-to-end login flow completes in under 2 seconds (§13).
3. **Given** an administrator opens the marketing dashboard, **When** the dashboard renders, **Then** it loads in under 3 seconds (§13).
4. **Given** a campaign manager publishes a campaign, **When** the publish action is submitted, **Then** the campaign publish operation completes in under 10 seconds, and a subsequent analytics refresh reflects updated data within 5 seconds (§13).

---

### User Story 5 - Automated Disaster Recovery Failover Preserves Service Continuity (Priority: P2)

Infrastructure monitoring detects a failure in the primary database or region while marketing operations (e.g., an in-progress campaign send) are active. The platform must execute automated failover to a replicated/backup environment, and the previously scheduled quarterly recovery testing must have already validated that this failover path works before it is ever needed in production.

**Why this priority**: Disaster Recovery (§15) is the chapter's explicit answer to the "fault tolerance" and "high availability" architecture principles (§2, §3) and is one of the few sections with concrete, testable operational commitments (automated daily backups, point-in-time recovery, multi-region backup storage, automated failover, quarterly recovery testing); it is P2 because it is a resilience guarantee layered on top of the core services rather than a day-one user-facing feature.

**Independent Test**: Can be fully tested by simulating a primary-database or primary-region failure in a non-production environment and confirming that automated failover occurs, health monitoring detects and reports the event, and a subsequent recovery-testing exercise (run at least quarterly) validates the same failover path end-to-end.

**Acceptance Scenarios**:

1. **Given** the primary database becomes unavailable, **When** health monitoring detects the failure, **Then** automated failover to a replicated database occurs without requiring manual intervention (§15).
2. **Given** an automated daily backup schedule is configured, **When** a backup runs, **Then** the backup is stored in multi-region backup storage per the disaster recovery design (§15).
3. **Given** a point-in-time recovery is required after a failure, **When** the recovery is executed, **Then** the system can be restored to a specific prior point in time using the retained backups (§15).
4. **Given** the quarterly recovery-testing cadence, **When** a scheduled recovery test is executed, **Then** the failover and restore procedures are exercised and validated on that cadence rather than only being tested during an actual incident (§15).

---

### User Story 6 - Security Controls Block a Malicious Request Without Disrupting Legitimate Traffic (Priority: P3)

An attacker attempts to abuse a public API endpoint (e.g., via SQL injection, cross-site scripting, or a high-volume request burst intended to overwhelm the service). The Security Architecture must detect and block the malicious pattern via the platform's layered controls while legitimate authenticated traffic continues to be served normally.

**Why this priority**: Security by Design is a named core architecture principle (§3) and Section 11 enumerates concrete, testable controls (JWT authentication, HTTPS, password encryption, API authentication, rate limiting, CSRF protection, XSS protection, SQL injection prevention, audit logging, secure file upload, device validation); it is P3 because it is a cross-cutting protective layer validated after the core services and integrations (User Stories 1–3) exist to protect.

**Independent Test**: Can be fully tested by sending a crafted SQL-injection or XSS payload to a platform API endpoint and confirming it is rejected and logged, then separately sending legitimate requests from an authenticated device at a normal rate and confirming they succeed without being blocked by rate limiting.

**Acceptance Scenarios**:

1. **Given** a public API endpoint, **When** a request containing a SQL-injection payload is submitted, **Then** the request is rejected by SQL injection prevention controls and the attempt is captured in audit logging (§11, §14).
2. **Given** a form field accepting user input, **When** a script-injection (XSS) payload is submitted, **Then** the platform's XSS protection sanitizes or rejects the input before it can execute (§11).
3. **Given** a client exceeds the configured request-rate threshold, **When** rate limiting is triggered, **Then** further requests from that client are throttled while other clients continue to be served (§11).
4. **Given** a file upload endpoint, **When** a file is submitted, **Then** secure file upload validation is applied and device validation confirms the requesting device before the file is accepted (§11).

---

### Edge Cases

- What happens when a platform event (e.g., "Course Purchased") is emitted but the Automation Engine's trigger-detection mechanism is temporarily unavailable — is the event queued for later processing, or is it lost? The chapter states events "are stored for analytics and automation" (§10) but does not define a delivery-failure/retry contract for the event bus itself.
- What happens when an external integration (WhatsApp Business API, Payment Gateway, SMS Gateway) times out or returns an error — does the Communication/Campaign Service retry, fail the send, or queue for later dispatch? Only the Notification Infrastructure (§8) explicitly names a retry mechanism; the Integration Layer (§9) does not state one.
- What happens when automated failover (§15) occurs while a campaign send is actively in progress — are in-flight sends re-executed (risking duplicate delivery), resumed exactly once, or dropped? The chapter defines failover but not send-exactly-once guarantees during failover.
- What happens when API response time exceeds the 300 ms target under peak load (e.g., approaching "millions of users," §12) — does the architecture degrade gracefully (queueing, backpressure) or fail requests outright? No degradation behavior is specified.
- What happens when a scheduled quarterly recovery test (§15) fails — is there a defined remediation SLA, or does the platform continue operating on an unvalidated recovery path until the next quarter?
- What happens when the primary database's daily backup itself fails (e.g., due to storage exhaustion) — is there an alerting/escalation path distinct from ordinary error logging (§14)?
- How does rate limiting (§11) distinguish a legitimate marketing automation burst (e.g., a large segment triggering many simultaneous API calls from the Automation Engine) from a malicious high-volume attack, given both are internal-to-external traffic patterns?
- What happens when a notification's device information (§8) cannot be determined (e.g., a web push sent to a browser without device fingerprinting) — does delivery tracking degrade to a partial record, or is the notification rejected?

## Requirements *(mandatory)*

### Architecture Vision & Principles

- **FR-001**: The platform MUST follow a modular, service-oriented architecture in which each business capability operates independently while sharing a centralized user identity, permissions model, and analytics layer (§2).
- **FR-002**: The architecture MUST ensure high availability, horizontal scalability, loose coupling, secure communication, real-time processing, fault tolerance, easy maintenance, and extensibility for future modules (§2).
- **FR-003**: The architecture MUST adhere to the core principles of API First Design, Mobile First, Cloud Native, Event Driven, Modular Development, Security by Design, Zero Hardcoding, Admin Configurable Features, Centralized Logging, and AI Ready Infrastructure (§3).

### Presentation Layer

- **FR-004**: The Mobile Application MUST support user registration, login, campaign interactions, notifications, landing pages, referral tracking, event registrations, content consumption, and premium upgrades (§4).
- **FR-005**: The Admin Portal MUST support campaign creation, audience segmentation, analytics, workflow creation, automation rules, email template management, push notification management, marketing reports, user management, and approval workflows (§4).

### Service Architecture

- **FR-006**: The backend MUST be divided into independent services, at minimum: Authentication Service, User Service, Campaign Service, Audience Service, Communication Service, Automation Engine, Analytics Service, and AI Service (§5).
- **FR-007**: The Authentication Service MUST be responsible for login, registration, JWT generation, refresh tokens, password reset, OTP verification, session management, and multi-device login (§5).
- **FR-008**: The User Service MUST maintain user profiles, membership, roles, permissions, preferences, language, marketing consent, and notification settings (§5).
- **FR-009**: The Campaign Service MUST be responsible for campaign creation, scheduling, editing, version history, publishing, campaign lifecycle, and status management (§5).
- **FR-010**: The Audience Service MUST handle user segmentation, dynamic audiences, saved filters, custom attributes, import/export, and audience statistics (§5).
- **FR-011**: The Communication Service MUST support Email, SMS, WhatsApp, Push Notifications, In-App Notifications, and be extensible to future communication channels (§5).
- **FR-012**: The Automation Engine MUST be responsible for trigger detection, workflow execution, delays, conditions, branching logic, goal tracking, and a retry mechanism (§5).
- **FR-013**: The Analytics Service MUST collect user activity, campaign metrics, revenue data, funnel analytics, event tracking, conversion statistics, and performance dashboards (§5).
- **FR-014**: The AI Service MUST provide campaign generation, email writing, subject line suggestions, audience recommendations, performance prediction, content optimization, translation support, and marketing insights (§5).

### Data & Storage Layer

- **FR-015**: The primary database MUST store users, campaigns, audiences, events, templates, notifications, automation workflows, activity logs, reports, and analytics (§6).
- **FR-016**: The database layer MUST provide ACID compliance, daily backups, read replicas, automatic indexing, query optimization, and audit support (§6).
- **FR-017**: The storage service MUST manage images, videos, documents, email attachments, campaign banners, PDFs, marketing assets, and AI-generated media (§7).
- **FR-018**: The storage layer MUST provide CDN integration, secure URLs, compression, versioning, and automatic optimization (§7).

### Notification Infrastructure

- **FR-019**: The platform MUST support Email, Push Notification, WhatsApp, SMS, and In-App Notification as notification channels (§8).
- **FR-020**: Every notification MUST record delivery status, open tracking, click tracking, retry mechanism outcome, failure reason, timestamp, and device information (§8).

### Event Catalog

- **FR-021**: The platform MUST implement an event-driven architecture that captures, at minimum, the following major platform events: User Registered, User Logged In, Course Purchased, Ebook Downloaded, Podcast Played, Event Registered, Membership Upgraded, Campaign Published, Email Opened, Link Clicked, Referral Completed, and Reward Earned (§10).
- **FR-022**: Each platform event MUST be stored for consumption by both the Analytics Service and the Automation Engine (§10).

### Internal Integration

- **FR-023**: The platform MUST integrate with the following internal TBT modules: Community, Courses, Podcasts, E-books, Events, Marketplace, Membership, AI Assistant, Referral System, Wallet, and Rewards (§9).

### External Integration

- **FR-024**: The platform MUST integrate with the following external services: Payment Gateway, Email Provider, SMS Gateway, WhatsApp Business API, Firebase Cloud Messaging, Google Analytics, Meta Pixel, LinkedIn API, YouTube API, and Webhooks (§9).

### Security Architecture

- **FR-025**: The platform MUST enforce JWT authentication, HTTPS everywhere, password encryption, API authentication, rate limiting, CSRF protection, XSS protection, SQL injection prevention, audit logging, secure file upload, and device validation (§11).

### Scalability Strategy

- **FR-026**: The platform MUST support growth from thousands of users to millions of users without major architectural redesign (§1, §12).
- **FR-027**: Scalability measures MUST include load balancers, horizontal scaling, stateless services, distributed caching, background job processing, queue management, auto scaling, CDN support, and database replication (§12).

### Performance & Reliability

- **FR-028**: API response time MUST target under 300 ms (§13).
- **FR-029**: Login MUST complete in under 2 seconds (§13).
- **FR-030**: Dashboard load MUST complete in under 3 seconds (§13).
- **FR-031**: Notification dispatch MUST complete in under 5 seconds (§13).
- **FR-032**: Campaign publish MUST complete in under 10 seconds (§13).
- **FR-033**: Analytics refresh MUST complete in under 5 seconds (§13).

### Logging & Monitoring

- **FR-034**: The system MUST record API logs, authentication logs, campaign logs, user activity, error logs, security events, performance metrics, database queries, automation execution, and notification delivery (§14).
- **FR-035**: Monitoring dashboards MUST provide real-time visibility into system health and operational metrics (§14).

### Disaster Recovery

- **FR-036**: The platform MUST provide automated daily backups, point-in-time recovery, multi-region backup storage, database replication, automated failover, health monitoring, and recovery testing conducted at least every quarter (§15).

### Future Architecture Roadmap

- **FR-037**: The architecture roadmap identifies the following planned (non-current-phase) enhancements: microservices migration, Kubernetes deployment, an AI orchestration layer, a real-time personalization engine, a Customer Data Platform (CDP), data warehouse integration, multi-region deployment, and edge computing for low-latency delivery (§16). These are directional roadmap items, not current-phase functional requirements.

### Key Entities *(include if feature involves data)*

- **Platform Event**: A discrete, timestamped occurrence (User Registered, Course Purchased, Campaign Published, etc.) emitted by any TBT module and stored for consumption by the Analytics Service and Automation Engine (§10). The event payload schema itself is not defined in this chapter.
- **Backend Service**: An independently deployable, loosely coupled service (Authentication, User, Campaign, Audience, Communication, Automation Engine, Analytics, AI) that owns a defined set of responsibilities while sharing centralized identity, permissions, and analytics (§2, §5).
- **Internal Integration Point**: A defined connection between the platform and an internal TBT module (Community, Courses, Podcasts, E-books, Events, Marketplace, Membership, AI Assistant, Referral System, Wallet, Rewards) (§9).
- **External Integration Point**: A defined connection between the platform and an external service (Payment Gateway, Email Provider, SMS Gateway, WhatsApp Business API, Firebase Cloud Messaging, Google Analytics, Meta Pixel, LinkedIn API, YouTube API, Webhooks) (§9).
- **Notification Delivery Record**: The per-dispatch record of a channel message (Email/SMS/WhatsApp/Push/In-App) capturing delivery status, open tracking, click tracking, retry attempts, failure reason, timestamp, and device information (§8).
- **Marketing Asset (Storage Object)**: A stored media/document object (image, video, document, email attachment, campaign banner, PDF, AI-generated media) managed with CDN delivery, secure URLs, compression, and versioning (§7).
- **Backup / Recovery Point**: An automated daily backup or point-in-time recovery target stored in multi-region backup storage, exercised by quarterly recovery testing (§15).
- **System Log Entry**: A recorded API, authentication, campaign, user-activity, error, security, performance, database-query, automation-execution, or notification-delivery event used for monitoring dashboards (§14).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: API responses complete in under 300 ms under normal production load, measured across representative endpoints (§13).
- **SC-002**: End-to-end login (credential submission to authenticated session) completes in under 2 seconds (§13).
- **SC-003**: The marketing dashboard loads within 3 seconds (§13).
- **SC-004**: Notification dispatch (Email/SMS/WhatsApp/Push/In-App) completes within 5 seconds of the triggering action, and analytics dashboards refresh within 5 seconds of new data becoming available (§13).
- **SC-005**: Campaign publish actions complete within 10 seconds from submission to live status (§13).
- **SC-006**: 100% of cataloged platform events (User Registered, Course Purchased, Campaign Published, etc.) are captured and made available to both the Analytics Service and the Automation Engine with zero silent event loss (§10).
- **SC-007**: The platform demonstrates the ability to scale from thousands to millions of users through horizontal scaling, load balancing, and stateless services without requiring architectural redesign, validated through load testing (§1, §12).
- **SC-008**: Automated failover restores service without manual intervention during a simulated primary-database or primary-region failure, and this failover path is successfully re-validated through recovery testing at least once per quarter (§15).

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- This chapter defines the architectural backbone — service boundaries, event catalog, integration layer, security architecture, scalability strategy, and performance/DR targets — that every other Volume 14 Part 1 feature (016 Marketing RBAC & Roles through 033 Marketing Operations Governance) and the Part 2 enterprise marketing features (034+) are built on top of and consume. This spec covers only the architecture itself; business-level behavior of each service (e.g., exact campaign fields, audience segment logic, automation branching rules) is specified in that capability's own feature spec.
- The Automation Engine described here (§5) is the same platform capability fully specified in feature 022 (Marketing Automation Workflows, Ch 9); this spec covers only its architectural role (trigger detection, execution, retry) as a backend service, not its business rule/workflow-builder model.
- The Event Catalog (§10) is the shared spine that other features (018 Campaign Management, 019 Audience Segmentation/CDP, 027 Marketing Analytics & Attribution, 028 Attribution & ROI Measurement) subscribe to; this chapter names the event types but does not define per-event payload schema. `[NEEDS CLARIFICATION: event payload schema/versioning not specified in source]`
- Performance targets (§13) are stated as single fixed numeric values without specifying percentile (p50/p95/p99), measurement window, or the load level ("normal load" vs. peak) they apply under. `[NEEDS CLARIFICATION: performance target measurement methodology not specified]`
- The Disaster Recovery section (§15) states "automated failover" and "recovery testing every quarter" but does not state a numeric Recovery Time Objective (RTO) or Recovery Point Objective (RPO). `[NEEDS CLARIFICATION: RTO/RPO values not specified in source]`
- Security Architecture (§11) names control categories (rate limiting, CSRF protection, XSS protection, SQL injection prevention) without stating numeric thresholds (e.g., requests-per-minute limits) or a defined behavior for distinguishing legitimate automation-driven traffic bursts from malicious traffic. `[NEEDS CLARIFICATION: rate-limit thresholds and burst-differentiation logic not specified]`
- "AI Ready Infrastructure" as an architecture principle (§3) and the AI Service (§5) are assumed to be the platform-level plumbing consumed by the AI Marketing Assistant (feature 025, Ch 12) and governed at the model/prompt level by the platform-wide AI Assistant (Volume 08, feature 008); this spec does not redefine AI model routing, prompt architecture, or provider integration, consistent with Constitution Article II.
- Roles/permissions referenced under the User Service (§5, "Roles," "Permissions") are architectural placeholders for the full RBAC model defined in feature 016 (Marketing RBAC & Roles, Ch 3); this spec only establishes that the User Service is the architectural system of record for that data, not the role hierarchy itself.
- Multi-region deployment and edge computing appear only in the Future Architecture Roadmap (§16) and are treated as directional, non-binding items for a later phase, not current functional requirements — consistent with distinguishing roadmap language from "shall/must" requirement language per repository convention.
- Consistent with Constitution Article VI (Consent Is First-Class, Per-Channel, and Versioned), the "marketing consent" field owned by the User Service (§5, FR-008) is assumed to be the per-channel, versioned consent record defined more fully in feature 002 (Public Website) and re-checked by the Communication Service before every automated send; this chapter only establishes that the User Service is its architectural home.
