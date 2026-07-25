# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not a codebase** — there is no source code, build system, package manifest, or tests. The repository is a single artifact: the **Enterprise Product Requirements Document (PRD)** for "Tamil Business Tribe" (product codename **TBT One**), a proposed all-in-one Tamil-first business/learning/community platform (LMS + community + AI assistant + mentor marketplace + events + marketplace + CRM + enterprise marketing/sales/ops suite).

There are no build, lint, or test commands — do not look for or invent any (no `package.json`, no source directories). Treat any future request to "run" or "build" this repo as a request to build the software it describes from scratch, and ask the user for the intended stack before doing so.

The PRD is written primarily in **Tanglish** (Tamil–English code-mixed, Latin script) with English technical headings and requirement statements ("shall provide…", "shall support…"). Expect this mix throughout — it is intentional, not noise.

## Directory layout and how to navigate it

```
document 1/   81 files: "Document 1.md", "Document 1 (1).md" … "Document 1 (80).md"
document 2/   1 file:  "Document 2.md" (~27,700 lines) — continuation of document 1
```

**Filenames do not indicate content order.** The `(N)` suffix is just a download-sequence artifact from wherever these were exported (Google Docs "Tab" exports — note the stray `# Tab N` markers scattered in `Document 2.md`). To find out what a file actually covers, open it and read the `**Volume:**` / `**Volume Name:**` / `Part` / `Chapter` header block near the top — do not assume from the filename or its position in a directory listing.

### Document map (by content, not filename)

- **`document 1/Document 1.md`** and **`Document 1 (1).md` … `(12).md`** — one file per volume, **Volumes 01–13**:
  - 01 Product Vision, Business Foundation, Platform Governance
  - 02 Public Website, Marketing Funnel, Conversion System
  - 03 Authentication, User Identity, Onboarding, Personalization, Member Dashboard
  - 04 LMS: Courses, Learning Paths, Lessons, Assessments, Certification
  - 05 Community, Groups, Channels, Feed, Messaging, Moderation, Trust & Safety
  - 06 Gamification: Points, Levels, Badges, Streaks, Leaderboards, Rewards
  - 07 Mentors/Experts: Discovery, Booking, Sessions, Reviews, Payouts
  - 08 TBT AI Assistant: content/learning/business AI, voice, image, guardrails
  - 09 Membership Plans, Subscriptions, Payments, Invoices, Affiliates, Revenue Ops
  - 10 Events, Webinars, Workshops, Cohorts, Ticketing, Live Streaming
  - 11 Marketplace: digital products, services, vendors, freelancers, commissions
  - 12 Jobs/Talent: profiles, recruiter portal, job posting, hiring pipelines
  - 13 CRM: Sales Pipeline, Leads, Support Desk, Ticketing, Live Chat, Automation

- **`document 1/Document 1 (13).md` … `(80).md`**, continuing into **`document 2/Document 2.md`** — all one giant **Volume 14 – Enterprise Marketing Platform**, the largest and most granular volume, split into:
  - **Part 1 – Marketing Foundation**: Chapters 1–20 (campaigns, audience/CDP, email, SMS/WhatsApp/push, automation workflows, landing pages, lead scoring, AI marketing assistant, A/B testing, attribution, retention, referral/affiliate, social, omnichannel orchestration, marketing ops) — one file per chapter, files `(13)`–`(32)`.
  - **Part 2 – Enterprise Marketing Data & Intelligence** and its later renamed continuations (Enterprise Customer Experience / Sales / PRM / CSM / RevOps / BI / KMS / DAM / CXM / Commerce / Procurement / Inventory-WMS platforms, etc.): Chapters 1–~16 as whole files (`(33)`–`(39)`), then from Chapter 8 (or 9) onward each chapter is split across **multiple `Part N` sub-files** (`Chapter X – Part 1` … `Part 5`) because the chapters are too long for one export — files `(40)`–`(80)` in `document 1`, continuing seamlessly into `document 2/Document 2.md` for Chapters 17 through 23 and beyond.
  - `document 2/Document 2.md` closes with a run of cross-cutting **Volume 14 sub-platform** sections (Enterprise Platform Architecture, Data Platform, AI Platform, Cybersecurity Platform, Cloud Infrastructure Platform, Communication Platform, CX Platform, Marketplace Platform, GRC/Audit/ESG Platform), ending in **Chapter 40 – Enterprise Platform Blueprint, Global Architecture, Scalability, Deployment Strategy & Digital Transformation Roadmap** — the final wrap-up chapter of the whole PRD.

### Finding things fast

Grep for headers rather than opening files sequentially — the volume/chapter/part title lines are consistently marked:

```
grep -rn "Volume:" "document 1" "document 2"        # volume header blocks
grep -rn "Chapter [0-9]" "document 1" "document 2"   # chapter boundaries
grep -rn "^### End of Chapter" "document 2"          # chapter-end markers in doc 2
```

Within `document 2/Document 2.md`, chapter boundaries are marked by `# **Volume 14 – Part 2 – Chapter N**` lines followed shortly by `### **End of Chapter N**` / `## **Next Chapter**` — use these to jump between chapters in the single large file instead of reading linearly.

## Content notes worth knowing before editing or summarizing

- The document explicitly disclaims copying "Internet Lifestyle Hub" (its stated inspiration) — brand, copy, course materials, and code must be original to Tamil Business Tribe. Keep this distinction in mind if asked to draft product copy or code from this PRD.
- Requirement language throughout uses RFC-style "shall" phrasing typical of enterprise PRDs — treat these as normative requirements, not suggestions, when summarizing or extracting specs.
- Volume 14 dwarfs every other volume by a large margin (roughly 68 of the 82 total files/sections) and is still explicitly marked as open-ended ("final total number of chapters within Volume 14 shall depend on the remaining enterprise modules included in the approved roadmap") — do not assume Chapter 40 is a hard final chapter number without checking for newer files.
- Every volume follows the same internal template: Purpose → Objectives → Principles → detailed feature/data-model sections → Analytics → Security/Privacy/Accessibility → QA → MVP priority tiers → Definition of Done → Acceptance Criteria → a closing "final principle" statement rejecting vanity metrics. Use this to jump straight to the section you need instead of reading a volume linearly.
- Specification depth is uneven across volumes/chapters — Volumes 09, 11, 13 and Volume 14 chapters 14–20 are implementation-ready (full entity models, error codes, risk tables); Volumes 10 and 12, and Volume 14 Ch.6, are noticeably thinner drafts (flat feature lists, no data models). Don't assume uniform rigor when citing "the spec says X."

## Recurring cross-volume architectural principles

These rules repeat verbatim (or near-verbatim) across many volumes and should be treated as platform-wide constraints when implementing or reasoning about any module, not just the volume they happen to appear in:

- **Server-authoritative state everywhere.** Payments, gamification points, quiz/course completion, and AI decisions are never trusted from the client — entitlement/points/completion are only granted after backend verification (webhook, idempotency check, rule evaluation).
- **AI is assistive, never autonomous.** Every AI-generated output (campaign copy, pricing, discounts, retention offers, lead scores, course recommendations) requires human review/approval before taking effect, must have a non-AI deterministic fallback if the AI call fails, and must never expose provider API keys or privileged instructions client-side.
- **No dark patterns / no guaranteed-results claims.** Repeated explicit bans on fake urgency/countdowns, hidden cancellation flows, preselected add-ons, and promised income/job/health outcomes — surfaces in the marketing site, mentor marketplace, jobs volume, and marketing platform alike.
- **Historical immutability.** Prices, commission rates, tax rates, and attribution models are snapshotted at the time of the transaction/event; later config changes must never retroactively alter past records.
- **Ledger-based internal economies.** Both the financial system (Volume 09) and the gamification system (Volume 06) use separate, auditable ledgers (issuance/redemption/expiry/reversal) rather than a single mutable balance field.
- **Consent is a first-class, per-channel, versioned record** (email/SMS/WhatsApp/push/analytics, with timestamp, source, and policy version) — referenced in the website, CRM, and marketing-automation volumes, and re-checked before every automated send, not just at signup.
- **RBAC is layered and explicit** everywhere multi-role access exists (CRM, marketing platform, marketplace) — typically Organization → Department/Team → Role → Permission Group → Permission, with sensitive actions requiring a multi-step approval chain rather than a single permission bit.
