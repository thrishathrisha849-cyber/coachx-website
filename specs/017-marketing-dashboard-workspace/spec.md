# Feature Specification: Marketing Dashboard, Navigation & Admin Workspace

**Feature Branch**: `017-marketing-dashboard-workspace`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 — Marketing Automation Platform, Part 1 (Marketing Foundation), Chapter 4 — Marketing Dashboard, Navigation & Admin Workspace Design. Source: `document 1/Document 1 (16).md`. Define the admin workspace shell that every marketing operator uses: global layout (top nav, left sidebar, main content, optional right context panel, footer status bar), global search, notification center, KPI cards, Executive Summary, Live Activity Feed, Campaign Performance / Audience Insights / Revenue widgets, the AI Recommendation Panel, Quick Actions Panel, workspace customization (rearrange/resize/save layouts), navigation experience (breadcrumbs, command palette, favorites), responsive behavior, accessibility, performance targets, and security controls."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Monitor Marketing Performance at a Glance (Priority: P1)

A marketing admin opens the dashboard and immediately sees a consolidated view of how the business is performing: KPI cards (active campaigns, total leads, conversion rate, revenue generated, email/SMS/WhatsApp/push performance), an Executive Summary (today/weekly/monthly/quarterly views, top performing campaigns, AI insights), and a Live Activity Feed showing real-time events (campaigns published, emails sent, leads converted, workflows completed or failed) — without navigating away from the landing screen.

**Why this priority**: This is the dashboard's stated core purpose — "the command center for all marketing operations" (§1) — and the landing view every admin sees first. Without it, none of the other workspace capabilities have a home screen to live in.

**Independent Test**: Can be fully tested by loading the dashboard as an authenticated marketing admin and confirming KPI cards, Executive Summary, and Live Activity Feed render with current data, trend indicators, and quick-action links, independent of AI features, search, or customization.

**Acceptance Scenarios**:

1. **Given** an admin with dashboard access loads the workspace, **When** the page finishes loading, **Then** each of the ten defined KPI cards (Active Campaigns, Campaigns Scheduled Today, Total Leads, Conversion Rate, Revenue Generated, New Members, Push Notification CTR, Email Open Rate, WhatsApp Delivery Rate, SMS Success Rate) displays a current value, previous-period comparison, percentage change, trend indicator, and quick action link.
2. **Given** the dashboard is open, **When** a new marketing event occurs (e.g., a campaign is published or a lead converts), **Then** the Live Activity Feed reflects the event in real time without a manual page refresh.
3. **Given** the Live Activity Feed contains many events, **When** the admin scrolls, **Then** additional older events load via infinite scroll, and the admin can filter, search, export, or group entries by time.
4. **Given** the Executive Summary section, **When** it renders, **Then** it shows today's performance, weekly summary, monthly overview, quarterly trends, revenue impact, top performing campaigns, AI insights, and recommended actions.

---

### User Story 2 - Find Anything Instantly via Global Search (Priority: P1)

An admin needs to jump directly to a specific campaign, segment, template, landing page, workflow, or report without navigating the sidebar tree. They open Global Search from the top navigation bar, type a partial name, and get instant, filterable, auto-completed results with the option to reuse a recent or saved search.

**Why this priority**: Global Search is a top-navigation element present on every screen (§4) and is the primary way an admin operating at enterprise scale locates a specific object among potentially thousands of campaigns, segments, and assets; its absence would make every other workspace screen slower to reach.

**Independent Test**: Can be fully tested by typing a partial campaign or segment name into the global search bar and confirming matching results, auto-complete suggestions, and applicable filters appear within the performance target, independent of which workspace section the admin started from.

**Acceptance Scenarios**:

1. **Given** the admin types a partial name into Global Search, **When** matching records exist among Campaigns, Users, Segments, Templates, Landing Pages, Workflows, Reports, Notifications, or Marketing Assets, **Then** matching results appear with auto-complete suggestions before the admin finishes typing.
2. **Given** the admin has performed prior searches, **When** they open Global Search again, **Then** search history and recent searches are available for quick reuse.
3. **Given** a broad query returning many result types, **When** the admin applies a filter (e.g., limit to Campaigns), **Then** only results of the selected type are shown.
4. **Given** the admin knows the keyboard shortcut for Global Search, **When** they invoke it from any screen, **Then** the search input receives focus without requiring a mouse click.

---

### User Story 3 - Act on an AI Recommendation With Visible Confidence (Priority: P2)

The AI Recommendation Panel surfaces a suggestion — for example, a better send time, a subject-line optimization, an audience-expansion opportunity, or a budget adjustment — each with a confidence score and expected impact shown alongside a one-click action. The admin reviews the recommendation, judges it against its confidence score, and chooses to act or dismiss it.

**Why this priority**: The AI Recommendation Panel is the dashboard's differentiated, AI-driven capability (§12) and is explicitly required to expose confidence and expected impact per recommendation — enabling human judgment rather than blind trust, consistent with Constitution Article II (AI Is Assistive, Never Autonomous).

**Independent Test**: Can be fully tested by viewing the AI Recommendation Panel, confirming each recommendation displays a confidence score, expected impact, and a one-click action, and confirming that invoking the action requires and reflects explicit admin intent rather than firing automatically on render.

**Acceptance Scenarios**:

1. **Given** the AI engine has generated a recommendation (e.g., "best time to send campaigns" or "subject line optimization"), **When** it is displayed in the panel, **Then** it shows a confidence score, an expected impact, and a one-click action control.
2. **Given** a recommendation with a low confidence score, **When** the admin views it, **Then** the confidence score is visibly distinguishable from a high-confidence recommendation, allowing the admin to prioritize which suggestions to act on.
3. **Given** the admin invokes the one-click action on a recommendation, **When** the action targets a consequential change (e.g., a budget or audience adjustment), **Then** the change is presented for the admin's explicit confirmation before it is applied, not applied silently on click.
4. **Given** a recommendation the admin does not want to act on, **When** they dismiss it, **Then** it no longer appears in the active recommendation list.

---

### User Story 4 - Customize and Save a Personal Dashboard Layout (Priority: P2)

An admin whose role focuses on email performance wants their dashboard to lead with email and revenue widgets rather than the default layout. They rearrange widgets, resize the ones they care about, hide unused modules, and save the result as a personal layout they can return to — with the option to reset to the platform default if needed.

**Why this priority**: Workspace Customization (§14) is explicitly called out as a distinct capability so that different admin roles (campaign manager, analyst, executive) can tailor the same dashboard to their own workflow, directly serving the stated design principle of "configurable widgets" (§2).

**Independent Test**: Can be fully tested by rearranging and resizing widgets, hiding a module, saving the layout, reloading the dashboard, and confirming the saved arrangement persists — independent of AI recommendations or search.

**Acceptance Scenarios**:

1. **Given** the default dashboard layout, **When** the admin drags a widget to a new position, **Then** the widget's position updates and other widgets reflow without overlapping.
2. **Given** a widget the admin never uses, **When** they hide it, **Then** it no longer appears on the dashboard but remains available to re-add later.
3. **Given** the admin has customized their layout, **When** they save it, **Then** the layout persists across sessions and devices under their account, and the admin can create additional named dashboard profiles.
4. **Given** an admin no longer wants their customizations, **When** they select "Reset to default," **Then** the dashboard returns to the platform default layout.

---

### User Story 5 - Navigate Efficiently via Command Palette, Breadcrumbs & Favorites (Priority: P3)

A power-user admin who moves between many screens per day uses the command palette to jump straight to a function by typing a few keystrokes, pins frequently used screens as favorites, retraces their steps via breadcrumbs, and works across several open tabs without losing context.

**Why this priority**: The Navigation Experience requirements (§15) are explicitly aimed at power users operating the workspace at scale; they are an efficiency layer on top of the P1/P2 core screens rather than a precondition for basic dashboard use, so they are appropriately lower priority.

**Independent Test**: Can be fully tested by opening the command palette via keyboard shortcut, executing a navigation command, confirming breadcrumbs reflect the resulting location, and confirming a page can be marked as a favorite for later one-click access.

**Acceptance Scenarios**:

1. **Given** the admin invokes the command palette via its keyboard shortcut, **When** they type a partial command or destination name, **Then** matching navigation actions appear and can be executed without using the sidebar.
2. **Given** the admin is several levels deep in the navigation hierarchy, **When** they view the breadcrumb trail, **Then** it accurately reflects the current path and each ancestor level is clickable.
3. **Given** a screen the admin visits often, **When** they mark it as a favorite, **Then** it becomes available in a dedicated favorites list for one-click access.
4. **Given** the admin has multiple workspace tabs open, **When** they switch between them, **Then** each tab retains its own navigation state independently.

---

### User Story 6 - Operate the Workspace on Mobile via Bottom Navigation (Priority: P3)

A marketing manager checks campaign performance from a phone while away from their desk. The workspace adapts to a single-column, mobile-optimized layout with bottom navigation, compact KPI cards, and swipe gestures, so the same core information is reachable without a desktop-sized screen.

**Why this priority**: Mobile-friendly responsive behavior is a stated design principle (§2) and has its own dedicated responsive-behavior tier (§16), but it is a secondary access mode to the primary desktop admin experience described throughout the rest of the chapter.

**Independent Test**: Can be fully tested by loading the workspace on a mobile viewport and confirming bottom navigation, single-column widget stacking, compact KPI cards, and swipe gestures function, independent of desktop layout customization.

**Acceptance Scenarios**:

1. **Given** the workspace is loaded on a mobile-sized viewport, **When** it renders, **Then** the sidebar is replaced by bottom navigation and widgets stack in a single column.
2. **Given** the mobile layout, **When** KPI cards render, **Then** they render in a compact form appropriate to the smaller screen.
3. **Given** a widget list on mobile, **When** the admin swipes, **Then** the corresponding swipe gesture (e.g., dismiss, reveal action) is supported.
4. **Given** a sidebar section with no direct bottom-navigation icon, **When** the admin needs to reach it on mobile, **Then** it remains reachable through an overflow or "more" entry point rather than being unavailable.

---

### Edge Cases

- What happens when a widget is resized or dragged such that its new position would overlap another widget's saved position? The layout engine must auto-reflow affected widgets rather than allow overlapping, hidden, or inaccessible widgets to persist in a saved layout.
- What happens when the campaign, budget, or audience data underlying an AI recommendation changes after the recommendation was generated (e.g., the target campaign was paused or deleted)? The recommendation must be invalidated or marked stale, and its one-click action must not be executable against a no-longer-valid target.
- What happens when a keyboard-only or screen-reader admin opens the command palette or a context menu? Focus must be programmatically trapped within the open control while it is active, and dismissing it (e.g., via Escape) must return focus to the triggering element rather than being lost.
- What happens when a Global Search query matches a campaign, segment, report, or asset that the searching admin's role does not have permission to view under the RBAC model (feature 016)? The result must be excluded from the result set entirely, not shown as a redacted or access-denied entry that would still reveal its existence.
- What happens when automatic logout on inactivity fires while an admin has an unsaved widget rearrangement or an unconfirmed AI-recommendation action pending? The system must not silently discard unsaved layout state without warning, and must not silently apply an unconfirmed action on session teardown.
- What happens when the Live Activity Feed's real-time connection drops due to a network interruption? The feed must visibly indicate a disconnected/stale state and backfill missed events on reconnect, rather than silently continuing to display an outdated feed as if it were live.
- What happens when a KPI card has no prior-period data to compare against (e.g., a newly onboarded organization's first day)? The percentage-change and trend indicator must degrade gracefully (e.g., an explicit "no prior data" state) rather than display a misleading 0% or undefined change value.
- What happens when a sidebar navigation section has no direct equivalent in mobile bottom navigation due to limited space? It must remain reachable through an overflow/"more" menu rather than becoming unavailable on mobile.

## Requirements *(mandatory)*

### Layout & Navigation Requirements

- **FR-001**: System MUST render the Admin Workspace using five primary regions: a persistent Top Navigation Bar, a Left Sidebar Navigation, a Main Content Area, an optional Right Context Panel, and a Footer Status Bar.
- **FR-002**: Top Navigation Bar MUST remain visible throughout the application and MUST include the TBT logo, current workspace indicator, Global Search, AI Assistant shortcut, Notifications, Tasks, Help Center, Theme Switcher, Language Selector, User Profile, and Organization Switcher.
- **FR-003**: Left Sidebar Navigation MUST provide hierarchical navigation across the Dashboard, Campaigns, Audience, Communication, Automation, Content, Analytics, AI Tools, Integrations, and Settings sections, each exposing its defined sub-items (e.g., Dashboard: Overview, Live Activity, KPIs, Executive Summary; Campaigns: All Campaigns, Drafts, Scheduled, Running, Completed, Archived; Audience: All Contacts, Segments, Tags, Lists, Imports, Exports; Communication: Email, SMS, WhatsApp, Push Notifications, In-App Messages; Automation: Workflow Builder, Customer Journeys, Triggers, Goals, Delays, Conditions; Content: Templates, Landing Pages, Forms, Media Library, AI Content; Analytics: Dashboard, Funnel Reports, Revenue Reports, Attribution, Retention, Cohort Analysis; AI Tools: Campaign Generator, Email Writer, Subject Line Generator, Audience Prediction, Optimization Assistant; Integrations: Email Providers, SMS Gateway, WhatsApp API, Firebase, Payment Gateway, CRM, Webhooks; Settings: Users, Roles, Permissions, Branding, Security, API Keys, Audit Logs).
- **FR-004**: Dashboard MUST follow a clean, modern, and consistent design language with a minimal learning curve, data-first presentation, real-time updates, and configurable widgets throughout.
- **FR-005**: System MUST support both Dark and Light mode display across the entire workspace.
- **FR-006**: System MUST support full keyboard accessibility for all workspace navigation and interactive controls.
- **FR-007**: Global Search MUST provide instant access to Campaigns, Users, Segments, Templates, Landing Pages, Workflows, Reports, Notifications, and Marketing Assets.
- **FR-008**: Global Search MUST support auto-complete, search history, filters, keyboard shortcuts, and recent searches.
- **FR-009**: Notification Center MUST display Campaign approvals, Workflow failures, Scheduled campaign reminders, System alerts, Team mentions, AI recommendations, and Security notifications, with each notification including a title, category, timestamp, priority, status, and action button.
- **FR-010**: Navigation system MUST support breadcrumbs, a list of recently visited pages, favorites, keyboard shortcuts, a command palette, context menus, and multi-tab support (each tab retaining independent navigation state).

### KPI, Activity Feed & Widget Requirements

- **FR-011**: Main Dashboard Overview MUST present a consolidated view of marketing performance via KPI Cards covering Active Campaigns, Campaigns Scheduled Today, Total Leads, Conversion Rate, Revenue Generated, New Members, Push Notification CTR, Email Open Rate, WhatsApp Delivery Rate, and SMS Success Rate.
- **FR-012**: Each KPI card MUST display current value, previous-period comparison, percentage change, trend indicator, and a quick action link.
- **FR-013**: Executive Summary section MUST display today's performance, weekly summary, monthly overview, quarterly trends, revenue impact, top performing campaigns, AI insights, and recommended actions.
- **FR-014**: Live Activity Feed MUST show real-time events for campaign published, email sent, user registered, lead converted, premium subscription purchased, workflow completed, automation failed, and segment updated.
- **FR-015**: Live Activity Feed MUST support infinite scroll, filters, search, export, and time grouping.
- **FR-016**: Campaign Performance Widget MUST display total campaigns, running campaigns, scheduled campaigns, completed campaigns, failed campaigns, average CTR, average conversion rate, and revenue contribution, with line chart, bar chart, pie chart, and heat map visualizations.
- **FR-017**: Audience Insights Widget MUST display total audience, active users, inactive users, new registrations, returning users, segmentation breakdown, geographic distribution, and device usage.
- **FR-018**: Revenue Dashboard MUST show Revenue Today, Weekly Revenue, Monthly Revenue, Campaign Revenue, Average Order Value, Customer Lifetime Value, Refunds, and Net Revenue.
- **FR-019**: Quick Actions Panel MUST provide one-click access to Create Campaign, Import Audience, Build Segment, Send Test Email, Create Landing Page, Start Workflow, Generate AI Content, and Export Report.

### AI Recommendation Panel Requirements

- **FR-020**: AI Recommendation Panel MUST continuously analyze campaign performance and surface improvement recommendations, including best time to send campaigns, subject line optimization, audience expansion, budget recommendations, landing page improvements, and personalization opportunities.
- **FR-021**: Each AI recommendation MUST include a confidence score, expected impact, and a one-click action.
- **FR-022**: Per Constitution Article II (AI Is Assistive, Never Autonomous), invoking a recommendation's one-click action on a consequential change (e.g., budget reallocation, audience or send-schedule modification) MUST present the resulting change for explicit admin confirmation before it is applied; the panel MUST NOT autonomously alter live campaign, budget, audience, or schedule state without that confirmation. [NEEDS CLARIFICATION: source §12 describes "one-click action" without specifying which recommendation categories may apply directly versus which require an interim confirmation step — this requirement resolves the ambiguity per the Constitution's cross-cutting AI-assistive principle rather than the chapter's literal wording.]

### Workspace Customization Requirements

- **FR-023**: Users MUST be able to rearrange dashboard widgets.
- **FR-024**: Users MUST be able to resize dashboard widgets, with the layout auto-reflowing to prevent overlap.
- **FR-025**: Users MUST be able to hide unused dashboard modules/widgets and re-add them later.
- **FR-026**: Users MUST be able to save custom dashboard layouts, persisted across sessions and devices under their account.
- **FR-027**: System MUST support multiple dashboard profiles per user.
- **FR-028**: Users MUST be able to reset their dashboard to the platform default layout.

### Responsive & Accessibility Requirements

- **FR-029**: On desktop, workspace MUST present a full sidebar, multi-column widget layout, and expanded analytics views.
- **FR-030**: On tablet, workspace MUST present a collapsible sidebar, two-column layout, and touch-optimized interactions.
- **FR-031**: On mobile, workspace MUST present bottom navigation, single-column layout, swipe gestures, and compact KPI cards, with any sidebar section lacking a direct bottom-navigation slot reachable via an overflow/"more" entry point.
- **FR-032**: Interface MUST comply with WCAG 2.1 AA accessibility standards.
- **FR-033**: Interface MUST support full keyboard navigation, screen reader compatibility, high-contrast mode, adjustable font sizes, visible focus indicators, and accessible color contrast throughout every workspace surface.

### Performance & Security Requirements

- **FR-034**: Dashboard initial load MUST complete in under 3 seconds.
- **FR-035**: Widget refresh MUST complete in under 2 seconds.
- **FR-036**: Global Search results MUST return in under 500 milliseconds.
- **FR-037**: Navigation response (in-workspace transitions) MUST occur in under 200 milliseconds.
- **FR-038**: Report rendering MUST complete in under 5 seconds.
- **FR-039**: System MUST enforce RBAC checks on every dashboard module, consistent with the layered permission model defined in feature 016.
- **FR-040**: System MUST enforce session validation and automatic logout on inactivity.
- **FR-041**: System MUST use secure API communication for all dashboard data requests.
- **FR-042**: System MUST maintain audit logging for all administrative actions taken from the dashboard.
- **FR-043**: System MUST apply data masking for sensitive information displayed on the dashboard.

### Key Entities *(include if feature involves data)*

- **Dashboard Widget**: A configurable, positioned UI module (KPI Card, Live Activity Feed, Campaign Performance Widget, Audience Insights Widget, Revenue Dashboard, AI Recommendation Panel, Quick Actions Panel, Executive Summary) with position, size, visibility, and refresh-state attributes.
- **Saved Layout / Dashboard Profile**: A user-owned, named arrangement of widget positions, sizes, and visibility; a user may maintain multiple profiles and reset any of them to the platform default.
- **KPI Card**: A single metric tile (e.g., Conversion Rate, Revenue Generated) with current value, previous-period comparison, percentage change, trend indicator, and quick action link.
- **Live Activity Feed Event**: A timestamped record of a platform event (campaign published, email sent, user registered, lead converted, subscription purchased, workflow completed, automation failed, segment updated), supporting filter, search, export, and time-grouping.
- **AI Recommendation**: A generated suggestion (category: send-time, subject-line, audience-expansion, budget, landing-page, personalization) with confidence score, expected impact, one-click action reference, and status (active, applied, dismissed, stale).
- **Quick Action**: A shortcut entry point (Create Campaign, Import Audience, Build Segment, Send Test Email, Create Landing Page, Start Workflow, Generate AI Content, Export Report) linking to the corresponding workspace flow.
- **Notification**: A Notification Center entry with title, category, timestamp, priority, status, and action button, sourced from campaign approvals, workflow failures, scheduled-campaign reminders, system alerts, team mentions, AI recommendations, or security events.
- **Global Search Result**: A cross-entity searchable record spanning Campaigns, Users, Segments, Templates, Landing Pages, Workflows, Reports, Notifications, and Marketing Assets, filtered by the searching user's RBAC-visible scope.
- **Navigation Favorite / Recently Visited Page**: A user-scoped shortcut record supporting one-click return to a previously visited or pinned workspace screen.
- **Command Palette Action**: A keyboard-invokable navigation or workflow action exposed through the command palette.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard initial load completes in under 3 seconds.
- **SC-002**: Widget refresh completes in under 2 seconds.
- **SC-003**: Global Search returns results in under 500 milliseconds.
- **SC-004**: In-workspace navigation transitions respond in under 200 milliseconds.
- **SC-005**: Reports render in under 5 seconds.
- **SC-006**: 100% of workspace surfaces meet WCAG 2.1 AA accessibility compliance, verified by automated and manual audit covering keyboard navigation, screen reader compatibility, color contrast, and focus indicators.
- **SC-007**: 100% of AI recommendations display a confidence score and expected impact before an admin can invoke the associated one-click action, and 100% of consequential one-click actions require explicit admin confirmation before altering live campaign, budget, audience, or schedule state.
- **SC-008**: 100% of dashboard modules and Global Search results respect the requesting admin's RBAC-visible scope (feature 016) — zero instances of data being rendered or returned to a user without the corresponding permission.
- **SC-009**: Admins can rearrange, resize, hide, and save a custom dashboard layout, and the saved layout is restored exactly as configured across sessions and devices on reload.

## Assumptions

- This spec defines the **admin workspace shell and dashboard presentation layer**: global layout regions, top navigation, sidebar navigation, global search, notifications, KPI/summary/activity widgets, the AI Recommendation Panel's presentation contract, workspace customization, navigation experience, responsive behavior, accessibility, performance targets, and security controls. It does not redefine the underlying business logic of the modules it links to or aggregates from (e.g., how a campaign is built, how a segment is computed, how a workflow executes) — those are owned by their respective feature specs (018 campaign-management, 019 audience-segmentation-cdp, 020 email-marketing, 021 sms-whatsapp-push-marketing, 022 marketing-automation-workflows, 023 landing-pages-lead-capture, 025 ai-marketing-assistant, 027 marketing-analytics-attribution, 028 attribution-roi-measurement) and MUST NOT be duplicated here.
- Per the task brief, this spec depends on feature 008 (`ai-assistant-platform`) to supply the underlying AI gateway, model routing, guardrails, and confidence-scoring mechanics that the AI Recommendation Panel (§12) and AI Assistant Shortcut/AI Tools sidebar entry points (§4, §5) invoke; this spec defines only the panel's presentation contract (confidence score, expected impact, one-click action, human-confirmation gating) and does not redefine how the AI generates recommendations.
- Per the task brief, this spec depends on feature 016 (`marketing-rbac-roles`) for the role/permission model that determines which sidebar sections, widgets, KPI cards, Global Search results, and quick actions are visible or usable by a given admin; this spec applies that model (FR-039, SC-008) but does not redefine the role hierarchy or approval chains themselves.
- The exact widget grid system (column count, breakpoint pixel values, drag-and-drop mechanics) is not specified by the source chapter; this spec defines the required customization capabilities (rearrange, resize, hide, save, multiple profiles, reset) without prescribing a specific grid implementation.
- Notification and Task data sourced into the Notification Center (§4) originate from their respective owning modules (e.g., workflow failures from feature 022, campaign approvals from feature 018); this spec defines only the Notification Center's aggregation and display contract.
- Items listed in the source's "Future Enhancements" (§20) — drag-and-drop dashboard builder, AI-generated dashboard layouts, voice-assisted navigation, predictive KPI alerts, multi-monitor workspace support, offline analytics snapshots, real-time collaboration, embedded video tutorials — are explicitly out of scope for this spec's functional requirements, as the source marks them as planned future work rather than current requirements.
- [NEEDS CLARIFICATION: the source's Performance Requirements table (§18) states absolute targets (e.g., "Dashboard Initial Load < 3 seconds") without specifying a percentile/consistency threshold (e.g., p50, p95, "every load," "under typical network conditions") — this spec treats the stated values as the target thresholds without inventing a specific percentile methodology.]
- [NEEDS CLARIFICATION: source §12 describes AI recommendation "one-click action" without specifying which recommendation categories (e.g., a non-destructive subject-line suggestion) may apply directly versus which consequential categories (e.g., budget reallocation) require an interim confirmation step; FR-022 resolves this per Constitution Article II, but the source itself does not enumerate the category-by-category distinction.]
- [NEEDS CLARIFICATION: the source does not specify retention duration for Live Activity Feed history, the maximum number of saved dashboard profiles per user, or the specific set of context-menu actions available per object type.]
- Assume the Organization Switcher (§4) and workspace-scoping concepts reuse the tenant/organization model defined elsewhere in the platform (e.g., membership/organization accounts) rather than this spec defining a parallel account model.
