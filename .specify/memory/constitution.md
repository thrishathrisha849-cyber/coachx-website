# Tamil Business Tribe (TBT One) Constitution
<!-- Derived directly from principles stated repeatedly, near-verbatim, across the source PRD (document 1/ and document 2/). See specs/FEATURE-MANIFEST.md for the PRD-to-feature mapping. -->

## Core Principles

### I. Server-Authoritative State
No client is ever trusted to grant itself entitlement, points, completion, or financial state. Payment success, course/lesson completion, gamification point awards, quiz results, and AI-driven decisions are only finalized after backend verification (signed webhook, idempotency-key check, or explicit rule evaluation). A client-rendered "success" screen MUST NOT itself unlock content, credit a wallet, or mark a milestone complete.
<!-- Source: Vol 03 (session/account state), Vol 04 ("Video play pannina mattum lesson complete-nu count panna koodathu"), Vol 06 (idempotent point awards), Vol 09 ("Server-Authoritative Payments" principle) -->

### II. AI Is Assistive, Never Autonomous
Every AI-generated output — content, pricing, discounts, retention offers, lead/churn scores, recommendations, campaign copy, support replies — is advisory only. Consequential actions (publishing, pricing changes, discount approval, contract terms, ticket closure, strategic/financial decisions) require explicit human or role-gated approval before taking effect. Every AI call runs server-side only; no provider API key, system prompt, or privileged instruction is ever exposed to a client. Every AI mode/service MUST define a deterministic non-AI fallback for when the AI call fails or is unavailable, so user-facing experience never depends on AI uptime.
<!-- Source: Vol 03 (deterministic roadmap fallback), Vol 08 (10-layer prompt priority stack, anti-hallucination doctrine, no client-side keys), Vol 13 (AI must not invent commitments/pricing/close tickets), Vol 14 Part 1 Ch 12 (human review before AI campaign publish), Vol 14 Part 2 Ch 9 ("AI shall never execute strategic business actions automatically") -->

### III. No Dark Patterns, No Guaranteed-Outcome Claims
The product never uses fake urgency, fabricated scarcity/countdown timers, hidden or friction-heavy cancellation flows, preselected paid add-ons, or deceptive account-existence disclosure. No surface (marketing site, mentor profiles, course sales pages, job listings, marketplace listings, retention offers) may promise guaranteed income, job placement, health, legal, or financial outcomes. Any success/income claim requires a verification status and a visible disclaimer.
<!-- Source: Vol 01 (no misleading guaranteed-result copy), Vol 02 (no fake countdowns/metrics), Vol 05 (Financial Claim Policy), Vol 07 ("No Guaranteed Results" on mentor profiles), Vol 14 Part 2 Ch 5 &amp; Ch 7 (experimentation and retention ethics sections) -->

### IV. Historical Immutability
Prices, tax rates, commission rates, coupon terms, and attribution-model assignments are snapshotted at the moment of the transaction or event. Later configuration changes (price updates, commission-structure changes, model recalibration) MUST NOT retroactively alter records that have already been finalized.
<!-- Source: Vol 07 (commission snapshotted at booking confirmation), Vol 09 (order snapshots price/tax/coupon/commission at purchase time), Vol 14 Part 2 Ch 4 (attribution finalization states: Preliminary → Finance Reviewed → Finalized/Locked) -->

### V. Ledger-Based Internal Economies
Any internal balance — reward points, XP, wallet funds, seller earnings, partner commissions, loyalty points — is represented as an append-only, auditable ledger (issuance / redemption / expiry / reversal / adjustment as distinct entries), never as a single mutable balance field. Balance is always a derived sum over the ledger, not a stored, directly-writable number.
<!-- Source: Vol 06 (6 separate point ledgers), Vol 09 (financial ledger, double-entry-ready design), Vol 11 (seller earning statements itemizing every deduction), Vol 14 Part 2 Ch 7 (loyalty points ledger, Reward Liability as a finance line item) -->

### VI. Consent Is First-Class, Per-Channel, and Versioned
Marketing/communication consent (email, SMS, WhatsApp, push, analytics, personalization) is stored per channel with timestamp, source, policy version, and withdrawal timestamp — never as a single global opt-in flag. Consent state is re-checked immediately before every automated send, not only at signup, and a withdrawal MUST propagate to in-flight automation/journeys without delay.
<!-- Source: Vol 02 (granular per-type consent), Vol 13 (consent_status, proof of consent, legal basis tracking), Vol 14 Part 1 Ch 19 (consent-aware orchestration re-checks before every send) -->

### VII. Layered, Explicit RBAC With Approval Chains
Wherever multi-role access exists, permissions follow an explicit hierarchy (Organization → Department/Team → Role → Permission Group → Permission → Resource → Action), never a flat is-admin boolean. Sensitive or high-blast-radius actions (bulk messaging, audience/template deletion, large refunds, payout changes, tax-rate changes, pricing changes) require a defined multi-step approval chain, not a single permission bit.
<!-- Source: Vol 03 (role ≠ membership), Vol 09 (dual-approval for high-risk finance actions), Vol 13 (field-level RBAC), Vol 14 Part 1 Ch 3 (10 standard roles, escalating approval chain) -->

### VIII. No Pay-to-Win, No Vanity-Metric Optimization
Rank, skill badges, verified achievements, mentor/seller status, and reputation cannot be purchased directly with money. Every module's stated "final principle" rejects optimizing for vanity metrics (likes, scroll time, messages sent, video-watched flags) in favor of verified, real-world outcomes (a completed task, a prevented scam, a first paying client, a resolved complaint).
<!-- Source: Vol 04 (rejects "video-watched" as success metric), Vol 05 (share-count integrity, closing principle), Vol 06 ("No Pay-to-Win" hard rule), Vol 01 (success measured by verified business milestones) -->

### IX. Action Before Consumption
Every learning, community, or growth module is designed around a verifiable action, task, submission, or deadline — not passive content consumption. This applies to course design (Vol 04), challenge/gamification design (Vol 06), and AI-assisted work (Vol 08), all of which explicitly require a produced artifact or completed task, not merely "viewed" status.
<!-- Source: Vol 01 (stated core principle), Vol 04 (multi-condition lesson-completion rules) -->

## Localization &amp; Language Requirements

TBT is Tamil-first, not Tamil-only. Every user-facing surface MUST support Tamil, Tanglish, and English as first-class experiences (not machine-translated afterthoughts), with trilingual/localized URL structure where content is public (e.g., `/ta/…`, `/en/…`). Community moderation and AI/NLP systems MUST handle Tamil, Tanglish, and transliterated content natively — simple English keyword-matching is explicitly insufficient and MUST NOT be relied on alone.
<!-- Source: Vol 01 (language roadmap), Vol 02 (localized URL architecture), Vol 05 (language-aware moderation), Vol 08 (Tamil/Tanglish/English AI modes) -->

## Security &amp; Compliance Baseline

- MFA/2FA is mandatory for admin, finance, and super-admin roles at minimum.
- Every module handling PII, payments, or regulated-industry data (mentor credentials in legal/tax/medical/financial categories) MUST support the compliance frameworks named in the source PRD for that domain: GST/CGST/SGST/IGST (India tax), GDPR, CCPA, DPDP Act (India), ISO 27001, SOC 2, PCI DSS, and — where cybersecurity infrastructure is concerned — NIST CSF and CIS Controls.
- All administrative, financial, and AI-copilot actions are captured in an immutable audit log.
- Digital downloads, invoices, and licensed content require anti-piracy controls (signed/expiring URLs, watermarking) as specified in the relevant feature.
<!-- Source: Vol 03 (2FA for admin/finance), Vol 09 (GST architecture), Vol 11 (signed URLs, watermarking), Vol 13 (consent/legal basis), Volume 14 Ch 19/20/34 (named compliance frameworks) -->

## Development Workflow

- This constitution governs every feature spec under `specs/`. Every `spec.md` MUST be traceable to specific source PRD volume/chapter/file references (see `specs/FEATURE-MANIFEST.md`), not invented from general SaaS conventions.
- Functional requirements MUST be extracted from the actual PRD requirement language ("shall provide/support...") — do not substitute paraphrase or generic boilerplate for a specific stated requirement.
- Where the source PRD leaves a requirement ambiguous or contradicts itself across chapters (a known issue in Volume 14's later, redundant chapters — see the manifest's "Overlaps with" notes), the spec MUST flag it explicitly with `[NEEDS CLARIFICATION: ...]` rather than silently resolving it.
- Volume 14 Chapters 24–40 describe a generic enterprise back-office/ERP layer with substantial internal redundancy (the same capability re-specified under multiple chapter numbers). Specs for these features MUST cross-reference the overlapping feature(s) rather than duplicating requirements wholesale.

## Governance

This constitution supersedes ad-hoc practices for any work under this repository. Amendments require: (1) identifying the source PRD passage that motivates the change or the passage that this constitution mis-stated, (2) updating this file, and (3) noting the amendment date below. Feature specs (`specs/*/spec.md`), implementation plans (`plan.md`), and task lists (`tasks.md`) must be checked for compliance with these principles before implementation begins; deviations must be recorded in that feature's plan.md under "Complexity Tracking" with justification.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
