# Tamil Business Tribe (TBT One) — Enterprise PRD Summary

*Compiled summary of the full Enterprise Product Requirements Document spanning `document 1/` (82 files, Volumes 01–14) and `document 2/Document 2.md` (Volume 14 continuation, Chapters 17–40). See `CLAUDE.md` in this repo for file-navigation details.*

---

## 1. Product Overview

**Tamil Business Tribe (TBT One)** is a proposed all-in-one, Tamil-first digital business ecosystem combining an LMS, business community, digital coaching platform, creator-economy tools, AI business assistant, mentor marketplace, event platform, gamification system, digital product marketplace, CRM/lead management, and business-progress tracking — explicitly *not* a copy of "Internet Lifestyle Hub" (its stated inspiration); TBT is required to have its own brand, content, curriculum, membership names, business framework, community model, design system, and technical architecture.

The document is written primarily in **Tanglish** (Tamil–English code-mixed) with English technical headings and RFC-style "shall provide/support" requirement language, targeting Tamil-speaking entrepreneurs, creators, students, freelancers, trainers, coaches, and small-business owners. It defines a 6-tier membership model, 8 target-user personas, an 8-stage user lifecycle (Visitor → Lead → Registered → Activated → Engaged → Paying → Achiever → Advocate), and 10 monetization streams. The prescribed default tech stack is Next.js/TypeScript (web), Flutter (mobile), NestJS (backend), PostgreSQL, Redis, and a provider-abstracted AI layer that explicitly avoids single-vendor lock-in.

---

## 2. Volumes 01–13 — The Core Consumer Platform

### Volume 01 — Product Vision, Business Foundation, Platform Governance
Establishes what TBT One is, who it serves, and how it makes money. Defines 16 high-level modules, the 6-tier membership model, 8 personas, the 8-stage lifecycle, 10 monetization streams, and a 4-phase roadmap (Foundation MVP → Growth Platform → Business OS → Enterprise/Ecosystem). States "Action Before Consumption" as a core principle — every learning module must have a task/submission/deadline, not passive video watching. Success is measured by verified business milestones (first client, first ₹1,000/₹10,000/₹1 lakh revenue), not engagement metrics.

### Volume 02 — Public Website, Marketing Funnel, Conversion System
Defines the entire pre-login marketing site: full public IA (Home, About, Programs, Courses, Community preview, Mentors, Events, Success Stories, Blog, Podcast, Pricing, etc.), 7 named marketing funnels, an admin CMS page-builder with 20+ block types, a checkout funnel with full payment-state tracking, and an analytics-event taxonomy. Strong anti-dark-pattern stance (no fake countdowns/metrics), trilingual localization (`/ta/` vs `/en/` URLs) as an architectural concern, and GDPR-style granular per-channel consent tracking.

### Volume 03 — Authentication, Identity, Onboarding, Personalization, Member Dashboard
Full account lifecycle spec: auth methods (email/OTP/OAuth/passwordless/org invite), a 13-step onboarding sequence, a member dashboard with strict information-priority ordering, a 12-role model kept explicitly separate from membership tier, and a 10-state account-status model. AI-generated roadmaps/recommendations must have a deterministic non-AI fallback. Strong anti-enumeration security UX (generic messaging on password reset/duplicate checks); 2FA mandatory for admin/finance roles.

### Volume 04 — Learning Management System
6-level content hierarchy (Learning Path → Program → Course → Module → Lesson → Learning Activity). Course access sourced from 10 entitlement types with backend-enforced per-lesson checks. Drip content, prerequisite chains, Quiz/Assessment/Assignment triad with rubrics and peer review, multi-condition lesson-completion rules, and a full certificate lifecycle with public verification pages. AI use in learning is explicitly bounded (summary/study-plan/translation allowed; facilitating cheating on graded work is not), with a plagiarism/academic-integrity workflow. Completion can never be defined by mere video playback.

### Volume 05 — Community, Groups, Channels, Feed, Messaging, Moderation, Trust & Safety
Multiple feed types with explainable ranking ("Why am I seeing this?"), 17 post types (including a scam-detection-aware "Collaboration/Opportunity" type), one-directional Follow plus mutual Connection requests, Groups with 11 types/4 visibility levels/6 roles, DMs with message-request gating, and a full moderation stack (report → automated flags → moderator console → decision → appeal). Explicit "Financial Claim Policy" bans guaranteed-result claims. Moderation must handle Tamil/Tanglish/transliterated abuse, not just keyword blocking. Reporter identity is never revealed to the reported party.

### Volume 06 — Gamification, TBT Points, Levels, Badges, Streaks, Leaderboards, Rewards
Three separately-ledgered value systems: non-redeemable XP (drives levels), redeemable TBT Points, and a hidden Reputation Score, backed by 6 separate ledgers (experience/reward/adjustment/redemption/expiry/reversal). 10-tier level system, 7-type badge taxonomy, timezone-aware non-punitive streaks, a challenge engine, and anti-abuse segmented leaderboards. **Hard rule: "No Pay-to-Win"** — rank, skill badges, and mentor status can never be purchased. Server-authoritative scoring with mandatory idempotency keys; a "Point Economy Simulation" must preview liability impact before new point rules go live.

### Volume 07 — Mentors, Experts, Instructors
21-step mentor onboarding pipeline with identity/professional verification. Three role types (Mentor/Expert/Instructor) plus a "Regulated Expert Categories" framework (legal, tax, medical, investment advice) requiring credential verification. Rich service catalog, booking engine with slot-hold transactions, and role-separated session notes. **"No Guaranteed Results"** rule mirrored from other volumes. Commission rate is snapshotted at booking confirmation. Explicit ban on mentors requesting off-platform payment or credentials; session recording requires dual consent plus a visible indicator.

### Volume 08 — TBT AI Assistant
A provider-agnostic, server-side-only AI layer with 12 distinct modes (Content Creator, Business Assistant, Learning Assistant, Mentor Prep, Admin, etc.), each with its own system prompt/tools/cost profile. A 10-layer prompt-priority stack ensures platform safety always outranks user prompts. Full admin AI gateway (provider/model management, routing, prompt versioning, evaluation, per-request cost accounting). **Hard rule: no AI provider API key or privileged instruction may ever reach the client.** Explicit anti-hallucination doctrine, prompt-injection defenses, and per-course instructor control over AI assistance level.

### Volume 09 — Membership, Subscriptions, Payments, Revenue Operations
Payment-provider-independent, GST-ready, ledger-based commercial engine. Plan/Price/Subscription/Entitlement modeled as separate entities. India-first payment methods (UPI, cards, net banking, offline cash with dual approval) via an adapter layer. Full GST/CGST/SGST/IGST tax architecture with sequential invoice numbering. Referral (reward gated on verified paid action) vs. Affiliate (cash payouts, KYC, tiered commissions) programs kept distinct. **"Server-Authoritative Payments" principle**: only a verified webhook grants entitlement, never a client success screen. Every order snapshots price/tax/commission at purchase time — immutable to later config changes.

### Volume 10 — Events, Webinars, Workshops, Conferences, Cohorts
Unified event engine (online/offline/hybrid) with an 11-state lifecycle, tiered ticketing, QR check-in with offline validation, live-streaming integration, networking tools (digital business cards, meeting scheduler, floor maps), and a 7-tier sponsor system. Notably the **shortest and least granular volume** (~1,500 lines vs. 4,000+ elsewhere) — reads as an earlier/less-elaborated draft. Certificates require a configurable combination of attendance + completion + quiz + admin approval.

### Volume 11 — Marketplace (Digital Products, Services, Freelancers, Vendors)
10 seller types with tailored onboarding; listings span digital downloads (licensed), Fiverr-style service packages, freelance bidding, and physical products. Orders split into one parent order + per-seller suborders. Digital-download security via signed URLs, download limits, and watermarking. Escrow-style payment holding (explicitly disclaims being a regulated escrow service). Seller reputation/level system with an internally-kept anti-gaming scoring formula. Unusually extensive prohibited-items list (pirated software, credential-theft tools, income-guarantee scams, cheating services) and a DMCA-like takedown flow.

### Volume 12 — Jobs, Talent Profiles, Recruitment
AI-powered hiring ecosystem: resume builder with multiple templates, mentor/assessment-based skill verification (not self-declared), an explainable AI match-scoring engine, a recruiter portal with screening questions and coding tests, and a standard hiring pipeline. **The leanest, most compressed volume** (~1,080 lines) — a largely flat feature checklist without the data-model/error-code rigor seen in Volumes 09/11/13. Explicit fraud-prevention scope names "fake recruiters" and "fake resumes" as detection targets.

### Volume 13 — CRM, Sales Pipeline, Customer Success, Support Desk
The largest and most enterprise-grade of the foundational volumes. Multi-org/multi-business-unit architecture with field-level RBAC, 25+ lead sources, duplicate detection/merge, rule-based *and* AI-assisted lead scoring (always human-explainable, never auto-rejects), configurable multi-pipeline opportunity management, a Customer Success module with a weighted health score and automated renewal reminders, and a Support Desk with an SLA engine and collision detection. AI guardrails are explicit: **AI must never invent customer commitments, invent pricing, approve discounts, or close critical tickets without review.** Includes a full DB entity list and standard API envelope — closer to implementation-ready than Volumes 10 or 12.

---

## 3. Volume 14 — Enterprise Marketing Platform (the other ~85% of the document)

Volume 14 dwarfs every other volume (roughly 68 of 82 total files/sections) and is explicitly marked open-ended in the text itself ("final total number of chapters... shall depend on the remaining enterprise modules included in the approved roadmap"). It spans the rest of `document 1/` plus the entirety of `document 2/Document 2.md`.

### Part 1 — Marketing Foundation (Chapters 1–20)

| Ch | Title | Key points |
|---|---|---|
| 1 | Marketing Vision & Business Goals | Unified growth engine across the whole ecosystem; 20-item functional scope; explicit Phase-1 exclusions (TV ads, POS, voice bots, AR/VR) |
| 2 | Marketing Architecture & System Overview | Service-oriented architecture (Auth/Campaign/Audience/Automation/Analytics/AI services), event-driven design, API latency targets (<300ms) |
| 3 | User Roles, Permissions & RBAC | Org→Dept→Role→Permission hierarchy, 10 standard roles, approval chains for bulk sends |
| 4 | Marketing Dashboard & Admin Workspace | 5-region layout, AI Recommendation Panel with confidence scores, WCAG 2.1 AA requirement |
| 5 | Campaign Management | 11-stage campaign lifecycle, 9-step creation wizard, AI Campaign Assistant predicting open rate/CTR |
| 6 | Audience Management & CDP | Unified customer profile (<5s update latency), 4 dynamic scores (Engagement/Purchase/Loyalty/Churn Risk) |
| 7 | Email Marketing | 4 email classes, deliverability scoring (SPF/DKIM/DMARC), multi-provider (SES/SendGrid/Mailgun/Postmark) |
| 8 | SMS, WhatsApp & Push | Named providers: Twilio, MSG91, Meta WhatsApp Business, Gupshup, 360dialog, FCM, OneSignal |
| 9 | Marketing Automation Workflows | No-code trigger/condition/delay/action builder; dry-run testing mode; AI bottleneck detection |
| 10 | Landing Pages, Forms & Lead Capture | Smart Form Logic, instant CDP/CRM sync with full UTM metadata, built-in SEO tooling |
| 11 | Lead Management & Scoring | 0–1000 score with explicit point tables; MQL/SQL/PQL qualification; AI Predictive Conversion Score |
| 12 | AI Marketing Assistant | Full-campaign AI generation with mandatory human review; 9 brand-voice tone presets |
| 13 | A/B Testing & CRO | Multivariate testing, statistical auto-stop, heatmaps/session replay, feature-flag rollout |
| 14 | Marketing Analytics & Attribution | 7 attribution models, role-specific dashboards, AI-generated executive narratives |
| 15 | Attribution Models & ROI | Adds U-shaped/W-shaped/Markov Chain/Shapley Value models; CAC/CLV/ROAS formulas; finalization states |
| 16 | Customer Lifecycle & Win-Back | 7-stage lifecycle, Customer Health Score, 6-tier loyalty, 30/60/90-day win-back automation |
| 17 | Referral, Affiliate & Partner Marketing | 9 partner program types, 9 commission models, fraud risk scoring, anti-pyramid safeguards |
| 18 | Social Media & Content Publishing | Cross-platform publishing, AI content repurposing into 12+ formats, unified social inbox |
| 19 | Omnichannel Orchestration | 25+ journey node types, Next-Best-Action engine, Communication Fatigue Score, consent-aware re-checks |
| 20 | Marketing Operations & Governance | Full budget/approval governance chain, vendor procurement workflow, risk management |

**Synthesis:** A complete, self-contained marketing-automation platform threading three themes throughout: a unified CDP every module reads/writes; AI as assistive-only (human approval required at every consequential step); and enterprise governance (RBAC, audit, consent, finance reconciliation) applied uniformly.

### Part 2 — Enterprise Marketing Data & Intelligence (Chapters 1–16), later renamed as it progresses

| Ch | Title | Key points |
|---|---|---|
| 1 | Marketing Data Platform & Governance | 12-component architecture, identity resolution, 5-tier data classification |
| 2 | Customer Segmentation & Audience Intelligence | AI clustering, lookalike audiences, audience governance (versioning/approval) |
| 3 | Personalization Engine & Next Best Action | 5-level personalization maturity model, 10-tier decision priority hierarchy, model fallback chain |
| 4 | Attribution, Incrementality & Media Mix Modeling | RCTs/geo-holdouts, Incremental CPA/ROAS, strict revenue-hierarchy separation |
| 5 | Experimentation & CRO | ICE/RICE scoring, guardrail metrics with auto-pause, mandatory kill switches, ethics section banning dark patterns |
| 6 | Customer Journey Analytics | Digital-twin journey reconstruction, friction intelligence (rage clicks, OTP failures) — notably thinner/less rigorous chapter |
| 7 | Retention Intelligence & Churn Prediction | 7 distinct churn types, Health Score bands (Thriving→Critical), retention holdout groups for true incrementality |
| 8 | Voice of Customer & Feedback Intelligence | 12-stage NLP pipeline, 14-emotion detection, root-cause intelligence, tiered ambassador program |
| 9 | Competitive Intelligence & Market Research | Competitor classification (Direct/Indirect/Replacement/Aspirational), research governance, explicit "AI never executes strategic actions automatically" |
| 10 | Product Strategy & Innovation Management | 9-level product hierarchy, 14-phase operating model, innovation pipeline with customer-validation gating |
| 11 | CX, Journey & Customer Success (CXOS) | 15-stage CX lifecycle, 8 journey-visualization modes, CX governance/ethics-AI review committee |
| 12 | Sales Management & Revenue Intelligence (RevOS) | BANT/MEDDICC/CHAMP/SPICED frameworks, pipeline health scoring, territory rebalancing AI |
| 13 | Partner Relationship Management (PRM) | 16-stage partner lifecycle, deal-registration conflict resolution, MDF incentive management |
| 14 | Customer Success Management (CSOS) | Customer 360° workspace, 15-metric health score, 9-stage renewal workflow, CS AI Copilot |
| 15 | Revenue Operations (RevOps) | Revenue 360° workspace, cascading target planning, 12 forecast categories, AI Revenue Copilot |
| 16 | Business Intelligence & KPI Management | 15 intelligence domains, standardized KPI ownership/thresholds to prevent metric drift |

**Synthesis:** These chapters build a closed-loop intelligence stack — unified data (Ch.1) → segmentation/personalization (Ch.2–3) → rigorous causal measurement (Ch.4–5) → journey/churn closing the loop (Ch.6–7) — then Volume 14 pivots from marketing-specific to full B2B enterprise operating systems (VoC, Product OS, CXOS, RevOS, PEOS, CSOS, BI), each following a repeating layered pattern: sources → AI intelligence → optimization → executive dashboard, always with human-approval gates on AI output.

### Chapters 17–23 — Continuation into `document 2/Document 2.md`

| Ch | Title | Key points |
|---|---|---|
| 17 | Enterprise Knowledge Management (KMS) | AI Knowledge Copilot (RAG-based) with mandatory source attribution and human verification |
| 18 | Digital Asset Management (DAM) | Full Digital Rights Management sub-module with per-asset rights profiles and expiration tracking |
| 19 | Customer Experience Management (CXM) | Compliance explicitly names GDPR, CCPA, DPDP Act (India), ISO 27001, SOC 2, PCI DSS, WCAG |
| 20 | Sales Management | Granular 8-tier data classification; dedicated Pricing Security control area |
| 21 | Commerce Platform | PIM, dynamic pricing/demand forecasting, all AI recommendations explicitly "explainable... and fully auditable" |
| 22 | Procurement Platform | Named AI agent roles (AI Procurement Manager, AI Vendor Manager, etc.), Procurement Digital Twin |
| 23 | Inventory & Warehouse (WMS) | 12 named warehouse types, RFID/IoT ingestion, Warehouse Digital Twin, future AMR/robotic picking |

### Chapters 24–40 — Pivot to Enterprise Back-Office & Infrastructure

From Chapter 24 onward the PRD stops adding new customer-facing capability and instead re-specifies core ERP functions in a terser, standardized template, before pivoting again into pure platform/infrastructure architecture:

- **24 Procurement & Supplier Management** — largely overlaps Ch.22; AI Procurement Assistant answers natural-language ops questions.
- **25 Finance, Accounting & Treasury** — GL/AP/AR, Treasury Management (liquidity, borrowings, Payment Factory), period locking to prevent retroactive edits.
- **26 HRMS & Payroll** — full employee lifecycle, AI attrition prediction, promotion-readiness scoring.
- **27 CRM, Sales & Customer Success** — third overlapping pass at CRM concepts (after Ch.19/20); introduces territory-based and record-level security.
- **28 Project Management & Collaboration** — supports Agile/Scrum/Kanban/Waterfall simultaneously; AI burnout detection.
- **29 Document Management (DMS)** — third pass over KMS/DAM territory; named retention tiers (1/3/5/7/10yr/Permanent), legal hold.
- **30 Workflow Automation, BPM & Low-Code** — named RPA robot types, drag-and-drop app builder positioned as an internal PaaS.
- **31 Integration Platform (iPaaS) & API Management** — the most vendor-concrete chapter in the document: AWS/Azure/GCP, Kafka, Salesforce, SAP, Stripe, Razorpay, WhatsApp Business API, Google/Microsoft/Apple/SAML SSO all named explicitly.
- **32 Data Platform, Lake, Warehouse & BI** — 10-layer architecture, Star/Snowflake schema, Master Data Management with golden records.
- **33 AI, ML, Generative AI & Autonomous Agents** — 14-layer AI architecture, full MLOps lifecycle, 12 named autonomous agent categories, 10-principle AI ethics framework.
- **34 Cybersecurity, IAM & Zero Trust** — 12-layer defense-in-depth; the most complete compliance list in the document (ISO 27001, SOC 2, GDPR, PCI DSS, HIPAA, NIST CSF, CIS Controls).
- **35 Cloud Infrastructure, DevOps & SRE** — explicit multi-cloud strategy (AWS/Azure/GCP/Oracle/DigitalOcean/Cloudflare), Kubernetes-centric, SLI/SLO/error-budget formalism.
- **36 Communication & Omnichannel Engagement** — WhatsApp Business API treated as a first-class enterprise channel; AI Voice Assistant.
- **37 CX, Personalization & Loyalty** — second CX pass (after Ch.19); journey funnel explicitly includes "Community Participation" as a stage.
- **38 Marketplace, Partner Ecosystem & Vendor Network** — 10 named marketplace types including an API Marketplace; overlaps Volume 11 and Ch.21.
- **39 GRC, Risk, Compliance, Audit & ESG** — full ESG modeling (Environmental/Social/Governance pillars), whistleblower portal, AI Governance treated as a peer discipline to financial/security governance.
- **40 Enterprise Platform Blueprint (Capstone)** — consolidates all 21 named platforms into one architecture; concrete tech stack (microservices, REST+GraphQL, Kubernetes, multi-region); 5-phase digital-transformation roadmap; closes with a "Core Version complete at 40 chapters" executive summary, formally marking the end of the document.

---

## 4. Cross-Cutting Architectural Principles

These rules repeat verbatim or near-verbatim across nearly every volume and should be treated as platform-wide constraints, not volume-specific ones:

- **Server/backend-authoritative state everywhere** — payments, gamification points, course completion, and AI decisions are never trusted from the client; entitlement is only granted after backend verification (webhook + idempotency check).
- **AI is assistive, never autonomous** — every AI-generated output requires human review/approval before taking effect, must have a non-AI deterministic fallback, and must never expose provider API keys or privileged instructions client-side.
- **No dark patterns / no guaranteed-results claims** — explicit bans on fake urgency, hidden cancellation flows, and promised income/job/health outcomes, repeated across the marketing site, mentors, jobs, and marketing-automation volumes.
- **Historical immutability** — prices, commission rates, tax rates, and attribution models are snapshotted at transaction time; later config changes never retroactively alter past records.
- **Ledger-based internal economies** — both the financial system (Vol 09) and the gamification system (Vol 06) use separate, auditable ledgers rather than a single mutable balance field.
- **Consent as a first-class, per-channel, versioned record** — tracked with timestamp/source/policy version, re-checked before every automated send, not just at signup.
- **Layered, explicit RBAC** wherever multi-role access exists — Organization → Department/Team → Role → Permission Group → Permission, with multi-step approval chains for sensitive actions.

---

## 5. Notable Quality Observations

- **Specification depth is uneven.** Volumes 09, 11, 13, and Volume 14 chapters 14–20+ are implementation-ready (full entity models, error codes, risk tables, acceptance criteria). Volumes 10 and 12, and Volume 14 Part 2 Chapter 6, are comparatively thin drafts — flat feature lists without data models.
- **Substantial internal redundancy in the back half.** Procurement, CRM, CXM, Knowledge/Asset Management, and Marketplace are each independently re-specified two or three times under different chapter numbers (e.g., Procurement in Ch.13/22/24; CRM/Sales in Ch.13/20/27; CX in Ch.19/37; Knowledge/Assets in Ch.17/18/29; Marketplace in Vol.11/Ch.21/Ch.38) — consistent with the document's own statement that Volume 14's scope is open-ended and organically grown rather than tightly edited.
- **The document effectively reads as two documents glued together**: a genuinely product-specific consumer-platform spec (Volumes 1–13 plus Volume 14 Part 1) with distinctive TBT design choices (no-pay-to-win, Tanglish moderation, action-before-consumption), followed by a generic enterprise-SaaS/ERP blueprint (Volume 14 Chapter 24 onward) that could describe almost any large company rather than being specific to TBT.
- **Consistent recurring template** across nearly all Volume 14 chapters from Ch.17 on: 5-layer data architecture → AI intelligence layer → AI governance/explainability requirement → named regulatory compliance framework → "Future AI Ecosystem" vision section with digital twins and autonomous agents.

---

*Compiled from 6 parallel review passes covering all 82 source files (`document 1/Document 1.md` through `(80).md`, and `document 2/Document 2.md`, ~121,000 total lines).*
