---
description: "Task list for Feature 038 — Enterprise Experimentation, A/B Testing & Growth Intelligence"
---

# Tasks: Enterprise Experimentation, A/B Testing & Growth Intelligence

**Input**: Design documents from `/specs/038-enterprise-experimentation-cro/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Feature 026), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `026`'s Experiment/Variant/Feature-Flag/Statistical-Result entities and execution engine, and `008`'s AI gateway, exist as extension/integration points.

**Tests**: Included throughout — hypothesis-completeness gating, sub-60-second kill switch, guardrail-breach auto-pause, and High-Risk approval-chain gating each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, SC-003, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (this feature has 116 FRs across only 9 stories — the largest in the session — so a large share of requirement volume sits outside story ownership by design).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `026`'s Experiment/Variant/Feature-Flag/Statistical-Result entities and `008`'s AI gateway exist as extension/integration points
- [ ] T002 Resolve `research.md` open items before proceeding: production default values for ICE/RICE scoring scales, the standard significance threshold, the specific sequential-testing and multiple-comparison-correction methods, the sample-ratio-mismatch materiality tolerance, the ethics/compliance review SLA, and freeze-period-exception approval authority
- [ ] T003 [P] Add `backend/src/modules/{opportunity-hypothesis-management,backlog-prioritization,experiment-types-design,metrics-framework,sample-randomization-assignment,prelaunch-validation-lifecycle,statistical-rigor-engine,guardrails-kill-switch,risk-classification-approval,decision-rollout-knowledge,growth-intelligence-north-star,ethics-privacy-accessibility,experimentation-governance-rbac,ai-experimentation-assistance,experimentation-platform-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Opportunity` entity in `backend/src/modules/opportunity-hypothesis-management/opportunity.entity.ts`
- [ ] T005 [P] Define the `Hypothesis` entity in `backend/src/modules/opportunity-hypothesis-management/hypothesis.entity.ts`
- [ ] T006 [P] Define the `ICE/RICE Score` entity in `backend/src/modules/backlog-prioritization/ice-rice-score.entity.ts`
- [ ] T007 [P] Define the `Assignment` entity in `backend/src/modules/sample-randomization-assignment/assignment.entity.ts`
- [ ] T008 [P] Define the `Exposure Event` entity in `backend/src/modules/sample-randomization-assignment/exposure-event.entity.ts`
- [ ] T009 [P] Define the `Guardrail Metric / Guardrail Breach` entity in `backend/src/modules/guardrails-kill-switch/guardrail-metric.entity.ts`
- [ ] T010 [P] Define the `Kill Switch` entity in `backend/src/modules/guardrails-kill-switch/kill-switch.entity.ts`
- [ ] T011 [P] Define the `Risk Classification` entity in `backend/src/modules/risk-classification-approval/risk-classification.entity.ts`
- [ ] T012 [P] Define the `Approval Record` entity in `backend/src/modules/risk-classification-approval/approval-record.entity.ts`
- [ ] T013 [P] Define the `Experiment Result` entity in `backend/src/modules/statistical-rigor-engine/experiment-result.entity.ts`
- [ ] T014 [P] Define the `Experiment Decision` entity in `backend/src/modules/decision-rollout-knowledge/experiment-decision.entity.ts`
- [ ] T015 [P] Define the `Rollback Record` entity in `backend/src/modules/decision-rollout-knowledge/rollback-record.entity.ts`
- [ ] T016 [P] Define the `Knowledge Repository Entry` entity in `backend/src/modules/decision-rollout-knowledge/knowledge-repository-entry.entity.ts`
- [ ] T017 [P] Define the `Growth Model Variable` entity in `backend/src/modules/growth-intelligence-north-star/growth-model-variable.entity.ts`
- [ ] T018 [P] Define the `North Star Metric` entity in `backend/src/modules/growth-intelligence-north-star/north-star-metric.entity.ts`
- [ ] T019 [P] Define the `Sample Ratio Mismatch Alert` entity in `backend/src/modules/sample-randomization-assignment/sample-ratio-mismatch-alert.entity.ts`
- [ ] T020 [P] Define the `Metric Definition` entity in `backend/src/modules/metrics-framework/metric-definition.entity.ts`
- [ ] T021 [P] Define the `Experiment` governance-fields extension in `backend/src/modules/experiment-types-design/experiment-governance-extension.entity.ts` — extends `026`'s existing entity
- [ ] T022 [P] Define the `Variant` / `Feature Flag` governance-fields extension in `backend/src/modules/experiment-types-design/variant-feature-flag-extension.entity.ts` — extends `026`'s existing entities
- [ ] T023 Implement Opportunity recording (13 fields) before experiment creation, wired to T004 (FR-001)
- [ ] T024 A/B test support with random assignment, extending `026`'s Experiment (FR-012)
- [ ] T025 A/B/n test support with multiple-comparison adjustment, extending `026`'s Experiment (FR-013)
- [ ] T026 Multivariate testing with combination calculation and traffic-sufficiency warning (FR-014)
- [ ] T027 Split-URL testing (consistent redirect, tracking preservation, attribution, availability/speed/error monitoring) (FR-015)
- [ ] T028 Feature-flag-controlled experiments (10 fields) with immediate rollback, extending `026`'s Feature Flag (FR-016)
- [ ] T029 Client-side experiments (9 element types) minimizing flicker/instability (FR-017)
- [ ] T030 Server-side experiments (10 types) with cross-device-consistent assignment (FR-018)
- [ ] T031 Cross-surface experiment support (20 surface types) with per-surface element/metric/guardrail sets (FR-019)
- [ ] T032 Email-experiment open-rate-reliability constraint (FR-020)
- [ ] T033 WhatsApp/SMS consent/quiet-hours/frequency/template/regulation/opt-out enforcement (FR-021)
- [ ] T034 Personalization-experiment incremental-value-vs-non-personalized measurement (FR-022)
- [ ] T035 8-stage funnel experimentation with cross-stage negative-effect detection (FR-023)
- [ ] T036 Primary-success-metric requirement with formal-amendment-on-change (FR-024)
- [ ] T037 Secondary-metric-cannot-silently-replace-failed-primary rule (FR-025)
- [ ] T038 Diagnostic-metrics-not-final-outcomes rule (FR-027)
- [ ] T039 Metric Definition registry (11 fields, certification status), wired to T020 (FR-028)
- [ ] T040 Pre-experiment baseline calculation (9 factors) (FR-029)
- [ ] T041 Minimum Detectable Effect requirement driving sample-size/duration/feasibility/power analysis (FR-030)
- [ ] T042 Sample-size/duration calculation (9 factors) (FR-031)
- [ ] T043 Duration accounting for 9 factors plus minimum-one-business-cycle rule (FR-032)
- [ ] T044 Randomization-unit configuration (10 unit types) matched to business problem (FR-033)
- [ ] T045 Stable variant assignment across sessions/devices/restarts with change recording, wired to T007 (FR-034)
- [ ] T046 Configurable traffic allocation plus gradual-increase-after-safety-validation (FR-035)
- [ ] T047 Progressive exposure launch sequencing (6 stages) gated by error/guardrail/performance/quality/approval (FR-036)
- [ ] T048 Audience eligibility rules (11 dimensions) (FR-037)
- [ ] T049 Exclusion rules (10 categories) (FR-038)
- [ ] T050 Mutual-exclusion groups (FR-039)
- [ ] T051 Layered experimentation (independent layers) with cross-layer safety validation (FR-040)
- [ ] T052 Contamination detection (7 sources) (FR-041)
- [ ] T053 Sample ratio mismatch monitoring with alert and result-invalidation flag, wired to T019 (FR-042)
- [ ] T054 Pre-launch validation (15 checks) (FR-043)
- [ ] T055 QA checklist (11 items) gating launch (FR-044)
- [ ] T056 17-status experiment lifecycle (FR-045)
- [ ] T057 Note: this feature extends `026`'s Experiment/Variant/Feature-Flag/Statistical-Result entities rather than redefining a second execution engine (per plan.md's Ownership Analysis)
- [ ] T058 Contract test: zero experiments reach "Awaiting Approval" without a complete, field-validated hypothesis, in `backend/tests/contract/hypothesis-completeness-gate.contract.test.ts` (FR-004, SC-001)
- [ ] T059 Contract test: the kill switch halts new variant delivery and restores the default experience within 60 seconds, in `backend/tests/contract/kill-switch-sub-60-second-stop.contract.test.ts` (FR-061, SC-002)
- [ ] T060 Contract test: a guardrail breach triggers automatic pause without manual intervention, in `backend/tests/contract/guardrail-breach-auto-pause.contract.test.ts` (FR-062, SC-003)
- [ ] T061 Contract test: High Risk experiments are blocked from launch until every required approval role has signed off, in `backend/tests/contract/high-risk-approval-chain-gate.contract.test.ts` (FR-065, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Mandatory Formal Hypothesis Before Experiment Approval (Priority: P1) 🎯 MVP

**Independent Test**: Attempt to submit an experiment for approval with an incomplete hypothesis and confirm the system rejects the submission with field-level feedback; complete all required fields and confirm submission succeeds.

- [ ] T062 [US1] Structured hypothesis requirement ("if we change X for Y, then Z will improve because W"), wired to T005 (FR-002)
- [ ] T063 [US1] 10 required hypothesis fields, wired to T058's contract test, acceptance scenario 1 (FR-003)
- [ ] T064 [US1] Approval-entry block on incomplete hypothesis with field-level feedback, wired to acceptance scenarios 1–2 (FR-004)
- [ ] T065 [US1] Hypothesis repository (7 statuses) with evidence/related-experiments/learnings (FR-005)
- [ ] T066 [US1] Automatic duplicate/similar-hypothesis detection, wired to acceptance scenario 4 (FR-006)
- [ ] T067 [P] [US1] Hypothesis submission form UI
- [ ] T068 [US1] Integration test: an incomplete hypothesis blocks submission with the full missing-field list, a single missing field blocks specifically on that field, a complete hypothesis advances the experiment to "Awaiting Approval," a similar hypothesis is flagged as a potential duplicate — all 4 acceptance scenarios in `backend/tests/integration/us1-mandatory-hypothesis.integration.test.ts`

**Checkpoint**: The foundational quality gate every other governance capability in this chapter depends on is independently functional.

---

## Phase 4: User Story 2 — ICE/RICE Prioritization Scoring for the Experiment Backlog (Priority: P1)

**Independent Test**: Enter ICE inputs for two backlog opportunities and confirm the system computes Impact × Confidence × Ease and re-ranks the backlog; separately, enter RICE inputs and confirm (Reach × Impact × Confidence) ÷ Effort.

- [ ] T069 [US2] Experiment backlog (13 fields) with filter/sort/assign/plan support, wired to T004 (FR-007)
- [ ] T070 [US2] Configurable prioritization method (9 input factors) (FR-008)
- [ ] T071 [US2] ICE Score calculation (Impact × Confidence × Ease) with assumption display, wired to T006, acceptance scenario 1 (FR-009)
- [ ] T072 [US2] RICE Score calculation ((Reach × Impact × Confidence) ÷ Effort), wired to acceptance scenario 2 (FR-010)
- [ ] T073 [US2] Backlog reorder/filter/sort by score with assignment/planning actions, wired to acceptance scenario 3 (FR-007 tie-in)
- [ ] T074 [US2] Leadership override with mandatory reason plus audit entry, wired to acceptance scenario 4 (FR-011)
- [ ] T075 [P] [US2] Backlog prioritization UI
- [ ] T076 [US2] Integration test: the ICE score is computed and displayed with assumptions, the RICE score is computed correctly, the backlog reorders on filter/sort, an override requires a reason and creates an audit entry — all 4 acceptance scenarios in `backend/tests/integration/us2-ice-rice-prioritization.integration.test.ts`

**Checkpoint**: The foundational sequencing infrastructure preventing prioritization from reverting to "whoever shouts loudest" is independently functional.

---

## Phase 5: User Story 3 — Statistical Rigor: Sequential-Testing Peeking Prevention & Multiple-Comparison Correction (Priority: P1)

**Independent Test**: Attempt to view a "final" significance verdict before the minimum sample/duration threshold is reached and confirm it is withheld or labeled preliminary; run a 4-variant, 2-metric test and confirm disclosure of comparison count, adjustment method, and both adjusted and unadjusted confidence.

- [ ] T077 [US3] Metric-type-matched statistical method selection (7 outcome types), wired to T013 (FR-046)
- [ ] T078 [US3] Frequentist analysis (9 output fields), wired to acceptance scenario 3 (FR-047)
- [ ] T079 [US3] Bayesian analysis (6 output fields) with a no-unlabeled-mixing rule, wired to acceptance scenario 4 (FR-048)
- [ ] T080 [US3] Confidence-interval-always-shown-alongside-point-estimate rule, wired to acceptance scenario 3 (FR-049)
- [ ] T081 [US3] Absolute and relative lift reporting with percentage-point-vs-percentage-improvement distinction, wired to acceptance scenario 3 (FR-050)
- [ ] T082 [US3] Multiple-comparison-control method application with full disclosure (count, method, threshold, adjusted results), wired to acceptance scenario 2 (FR-051)
- [ ] T083 [US3] Premature-stopping discouragement via sequential-testing/minimum-duration/sample/decision-locks/warnings, wired to acceptance scenario 1 (FR-052)
- [ ] T084 [US3] Variance-reduction-method governance (pre-assignment-data-only, documented, validated) (FR-053)
- [ ] T085 [US3] Outlier-handling policy definitions (7 categories) (FR-054)
- [ ] T086 [US3] Missing-data identification (6 causes) with disclosed method/limitations (FR-055)
- [ ] T087 [US3] Delayed-conversion outcome-window support (FR-056)
- [ ] T088 [US3] Novelty-effect identification with follow-up-analysis support (FR-057)
- [ ] T089 [US3] Learning-effect accounting (FR-058)
- [ ] T090 [US3] Cluster/community-level randomization with spillover measurement for network-connected experiments (FR-059)
- [ ] T091 [US3] Seasonality/external-event accounting with documentation (FR-060)
- [ ] T092 [P] [US3] Statistical results panel UI (Frequentist/Bayesian labeled views)
- [ ] T093 [US3] Integration test: preliminary results are restricted before the sample/duration threshold, a 4-variant 2-metric test discloses comparison count/method/threshold/adjusted results, results show absolute and relative lift with confidence intervals, Bayesian and Frequentist results are clearly labeled and not merged — all 4 acceptance scenarios in `backend/tests/integration/us3-statistical-rigor.integration.test.ts`

**Checkpoint**: The statistical backbone every other governance control depends on being trustworthy is independently functional.

---

## Phase 6: User Story 4 — Guardrail Metrics Auto-Pausing an Experiment (Priority: P1)

**Independent Test**: Configure a guardrail metric with a defined threshold, inject a simulated breach, and confirm the experiment automatically pauses, users revert to the approved default, and a breach record is created without manual action.

- [ ] T094 [US4] Guardrail metric attachment (13 example types) to every experiment, wired to T009 (FR-026)
- [ ] T095 [US4] Active guardrail monitoring for the full run, wired to acceptance scenario 1 (FR-062 tie-in)
- [ ] T096 [US4] Threshold-breach auto-pause/stop with default-experience revert and reason recording, wired to T060's contract test, acceptance scenario 2 (FR-062)
- [ ] T097 [US4] Breach notification to owner/stakeholders with assignment/event-history preservation, wired to acceptance scenario 3 (FR-062)
- [ ] T098 [US4] Additional automatic-stop conditions (sample ratio mismatch, privacy, security, data-collection failure) via the same mechanism, wired to acceptance scenario 4 (FR-062)
- [ ] T099 [US4] Live monitoring dashboard (13 elements) with preliminary-results disclosure (FR-063)
- [ ] T100 [P] [US4] Guardrail configuration / breach review UI
- [ ] T101 [US4] Integration test: guardrails are actively monitored for the full run, a breach auto-pauses and reverts and records the reason, a breach notifies stakeholders and preserves history, other automatic stop conditions use the same mechanism — all 4 acceptance scenarios in `backend/tests/integration/us4-guardrail-auto-pause.integration.test.ts`

**Checkpoint**: The central safety mechanism making it safe to run experiments on checkout, pricing, and payments is independently functional.

---

## Phase 7: User Story 5 — Mandatory Kill Switch for Every Production Experiment (Priority: P1)

**Independent Test**: Trigger the kill switch on a running production experiment and confirm, within 60 seconds, that new variant delivery has stopped, users receive the default, the stop is recorded, and stakeholders are notified — then confirm a controlled resume is possible.

- [ ] T102 [US5] Emergency kill switch on every production experiment, wired to T010, acceptance scenario 1 (FR-061)
- [ ] T103 [US5] Sub-60-second stop with default-experience revert, wired to T059's contract test, acceptance scenario 1 (FR-061)
- [ ] T104 [US5] Assignment/event-history preservation on stop, wired to acceptance scenario 2 (FR-061)
- [ ] T105 [US5] Stop-reason/initiator/timestamp recording with stakeholder notification, wired to acceptance scenario 3 (FR-061)
- [ ] T106 [US5] Controlled, deliberate recovery path — no automatic silent restart, wired to acceptance scenario 4 (FR-061)
- [ ] T107 [P] [US5] Kill switch activation / recovery UI
- [ ] T108 [US5] Integration test: the kill switch stops delivery and reverts within 60 seconds, prior history is preserved not corrupted, the stop reason/initiator/timestamp are recorded and stakeholders notified, a controlled resume is supported after resolution — all 4 acceptance scenarios in `backend/tests/integration/us5-mandatory-kill-switch.integration.test.ts`

**Checkpoint**: The manual complement to automatic guardrail protection, required precisely because automated detection cannot catch every failure mode, is independently functional.

---

## Phase 8: User Story 6 — Risk-Classified Approval Path for Pricing, Payment & Legal Experiments (Priority: P1)

**Independent Test**: Create a pricing-presentation experiment and confirm it is auto-classified High Risk and blocked until legal/privacy/finance/executive approvals are recorded; create a minor text-content experiment and confirm it only requires the lighter Low Risk path.

- [ ] T109 [US6] 3-tier risk classification (Low/Medium/High) with example criteria, wired to T011, acceptance scenario 1 (FR-064)
- [ ] T110 [US6] Risk-dependent approval-path determination (10 possible roles), wired to T012 (FR-065)
- [ ] T111 [US6] High-Risk launch block until the full enhanced chain is recorded, wired to acceptance scenario 2 (FR-065)
- [ ] T112 [US6] Medium-Risk lighter defined approval path, wired to acceptance scenario 3 (FR-065)
- [ ] T113 [US6] Low-Risk no-enhanced-chain-required while still recording approval, wired to T061's contract test, acceptance scenario 4 (FR-065)
- [ ] T114 [US6] Pricing/payment-experiment prohibited-practice rules (6 types) with enhanced approval (FR-066)
- [ ] T115 [US6] High-risk-behavioral-experiment mandatory ethics/compliance review requirement (FR-067)
- [ ] T116 [P] [US6] Risk classification / approval chain UI
- [ ] T117 [US6] Integration test: a pricing experiment is auto-classified High Risk, a High Risk launch is blocked until legal/privacy/finance/executive approve, a Medium Risk experiment routes through the lighter path, a Low Risk experiment skips the enhanced chain but still records approval — all 4 acceptance scenarios in `backend/tests/integration/us6-risk-classified-approval.integration.test.ts`

**Checkpoint**: The direct implementation of Constitution Article VII for high-blast-radius pricing/payment/legal experiments is independently functional.

---

## Phase 9: User Story 7 — North Star Metric Growth Model Identifying the Limiting Variable (Priority: P2)

**Independent Test**: Configure sample values for each growth-model stage and confirm the system identifies the lowest-performing/limiting stage; tag a concluded experiment to a funnel stage and confirm the North Star view shows contribution or conflict.

- [ ] T118 [US7] Growth Intelligence Platform combining 9 data sources, wired to T017 (FR-080)
- [ ] T119 [US7] Growth Opportunity Score (9 factors), configurable and transparent (FR-081)
- [ ] T120 [US7] 10-category growth-opportunity classification (FR-082)
- [ ] T121 [US7] Configurable multiplicative growth model with limiting-variable identification, wired to acceptance scenario 1 (FR-083)
- [ ] T122 [US7] North Star Metric configuration with experiment-contribution/conflict display, wired to T018, acceptance scenario 2 (FR-084)
- [ ] T123 [US7] Input-metric-to-outcome connection (8 input types), wired to acceptance scenario 3 (FR-085)
- [ ] T124 [US7] Growth forecasting (7 improvement types) with assumptions/confidence ranges, wired to acceptance scenario 4 (FR-086)
- [ ] T125 [P] [US7] Growth Intelligence / North Star Metric dashboard UI
- [ ] T126 [US7] Integration test: the growth model identifies the limiting variable, a concluded experiment shows North Star contribution or conflict, input metrics are connected to long-term outcomes, a forecast shows the effect with assumptions and confidence — all 4 acceptance scenarios in `backend/tests/integration/us7-north-star-growth-model.integration.test.ts`

**Checkpoint**: The strategic Growth Intelligence layer sitting atop the base experimentation/guardrail machinery is independently functional.

---

## Phase 10: User Story 8 — Ethics Rule Banning Dark Patterns & False Urgency in Experiments (Priority: P2)

**Independent Test**: Submit a variant containing a fabricated countdown timer or false scarcity claim for pre-launch validation and confirm the system blocks launch and requires ethics/compliance review; complete the review and confirm the variant can proceed only with the decision recorded.

- [ ] T127 [US8] Pre-launch ethical-pattern validation (fabricated urgency, false scarcity, false social proof detection), wired to acceptance scenario 1 (FR-095)
- [ ] T128 [US8] Cancellation-friction/essential-service-withholding/vulnerable-segment-manipulation blocking, wired to acceptance scenario 2 (FR-095)
- [ ] T129 [US8] Mandatory ethics/compliance review routing for high-risk behavioral experiments regardless of other risk classification, wired to acceptance scenario 3 (FR-067)
- [ ] T130 [US8] Review-decision-unblocks-remaining-approval-path flow, wired to acceptance scenario 4
- [ ] T131 [P] [US8] Ethics/compliance review UI
- [ ] T132 [US8] Integration test: a fabricated countdown timer is flagged and blocked, a hidden cancellation control is blocked, a high-risk behavioral experiment requires ethics review regardless of its other classification, an approved revision unblocks the remaining approval path — all 4 acceptance scenarios in `backend/tests/integration/us8-ethics-dark-pattern-ban.integration.test.ts`

**Checkpoint**: The direct implementation of Constitution Article III within this chapter is independently functional.

---

## Phase 11: User Story 9 — Negative & Neutral Results Published, Not Hidden (Priority: P2)

**Independent Test**: Conclude an experiment with a harmful or no-difference outcome, attempt to close/archive it without completing the required fields, confirm the system blocks that action, then complete the fields and confirm the experiment becomes searchable by hypothesis, segment, metric, and keyword.

- [ ] T133 [US9] Final decision record (12 fields) drawn from the defined decision set (9 options), wired to T014 (FR-068)
- [ ] T134 [US9] Winner-declaration multi-factor requirement (9 factors, never a single metric) (FR-069)
- [ ] T135 [US9] Neutral-result mandatory documentation (5 fields) blocking closure until complete, wired to acceptance scenario 2 (FR-070)
- [ ] T136 [US9] Negative-result mandatory documentation (7 fields) blocking closure until complete, wired to acceptance scenario 1 (FR-071)
- [ ] T137 [US9] Inconclusive-result cause plus rerun/redesign/close recommendation, wired to acceptance scenario 4 (FR-072)
- [ ] T138 [US9] Progressive production rollout (5 stages) with guardrails remaining active (FR-073)
- [ ] T139 [US9] Post-rollout expected-vs-actual comparison with reversal/investigation path (FR-074)
- [ ] T140 [US9] 6-type rollback support with a full record (reason, initiator, time, affected users, technical result, business impact), wired to T015 (FR-075)
- [ ] T141 [US9] Knowledge Repository Entry (14 fields) for every concluded experiment, wired to T016, acceptance scenario 3 (FR-076)
- [ ] T142 [US9] Multi-dimension search (11 dimensions) treating negative/neutral results equally, wired to acceptance scenario 3 (FR-077)
- [ ] T143 [US9] Cross-experiment relationship linking (parent, follow-up, replication, related, conflicting) preventing repeated disproved ideas (FR-078)
- [ ] T144 [US9] Reusable experiment playbooks (6 types) (FR-079)
- [ ] T145 [P] [US9] Knowledge repository search / decision recording UI
- [ ] T146 [US9] Integration test: a harmful outcome requires all 7 fields before Concluded status, a no-difference outcome requires documentation before closure, a negative/neutral result is searchable on the same basis as a winner, an inconclusive result records its cause and a recommendation — all 4 acceptance scenarios in `backend/tests/integration/us9-negative-neutral-results-published.integration.test.ts`

**Checkpoint**: The mechanism central to the chapter's "evidence-based decision-making" vision, preventing negative results from being hidden, is independently functional.

---

## Phase 12: Growth Intelligence remainder (Portfolio/Capacity/Calendar/Freeze/Revenue/Retention/Segment/Device) & AI Assistance (supports FR-087–FR-094, FR-105–FR-108; cross-cutting, no single owning story)

- [ ] T147 Cross-domain portfolio view (7 domains, 6 dimensions) (FR-087)
- [ ] T148 Experimentation capacity estimation (8 resource types) (FR-088)
- [ ] T149 Experiment calendar (9 elements) with high-risk-overlap warnings (FR-089)
- [ ] T150 Declared freeze periods (7 categories) with documented-exception approval (FR-090)
- [ ] T151 Experiment revenue reporting (11 metrics) (FR-091)
- [ ] T152 Long-term-value tracking (8 metrics) preventing short-term-gain-masking-long-term-harm (FR-092)
- [ ] T153 Segment-level result analysis (10 dimensions) with exploratory labeling for non-predefined segments (FR-093)
- [ ] T154 Device/platform performance comparison (9 dimensions) with device-specific-failure detection (FR-094)
- [ ] T155 AI Opportunity Discovery (9 input sources), advisory-only, consuming `008`'s gateway (FR-105)
- [ ] T156 AI Hypothesis Generator (8 structured fields), labeled AI-assisted (FR-106)
- [ ] T157 AI Experiment Design Assistant (9 recommendation types), final decision remains with humans (FR-107)
- [ ] T158 AI Result Interpreter (9 summary elements), never overriding approved statistical analysis (FR-108)

**Checkpoint**: The portfolio-management and advisory-AI layer rounding out full growth-governance coverage is independently functional.

---

## Phase 13: Ethics/Privacy/Accessibility remainder, Governance/RBAC/Versioning/Audit & Platform/API/Reliability Polish

- [ ] T159 [P] Privacy enforcement (9 controls) for the experimentation platform (FR-096)
- [ ] T160 Accessibility maintenance (8 requirements) per tested variation — no regression justified by conversion (FR-097)
- [ ] T161 Behavioral-analytics sensitive-information masking (4 tool types) (FR-098)
- [ ] T162 RBAC (14 roles), wired to `016` (FR-099)
- [ ] T163 Granular permission separation (13 action categories) (FR-100)
- [ ] T164 Environment management (4 environments) preventing untested-config-in-production (FR-101)
- [ ] T165 Versioning (10 object types) with restart-on-post-launch-change (FR-102)
- [ ] T166 Audit logging (13 action categories) (FR-103)
- [ ] T167 Customer-level-data-export permission restriction (FR-104)
- [ ] T168 Secure APIs (10 operations) plus 11 webhook event types (FR-109, FR-111)
- [ ] T169 Exposure recording (11 fields) distinct from assignment (FR-110)
- [ ] T170 Integration-framework wiring across the 17 named systems (FR-112)
- [ ] T171 Performance hardening pass toward all 7 numeric targets (FR-113)
- [ ] T172 Service-unavailability graceful degradation (6 mechanisms) (FR-114)
- [ ] T173 Reliability infrastructure (idempotency, retries, backoff, buffering, dead-letter queues, cache recovery, replay, reprocessing, deduplication) (FR-115)
- [ ] T174 Configurable retention policies (10 data types) (FR-116)
- [ ] T175 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (ICE/RICE production defaults, significance threshold, correction methods, sample-ratio-mismatch tolerance, ethics-review SLA, freeze-exception authority)
- [ ] T176 Final audit: cross-check every FR-001–FR-116 against an implementation or validation task; verify Experiment/Variant/Feature-Flag/Statistical-Result entities extend `026`'s rather than duplicating them
- [ ] T177 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `026`'s Experiment/Variant/Feature-Flag/Statistical-Result entities and `008`'s AI gateway, and produces the entity/experiment-type/metrics/randomization infrastructure every subsequent phase depends on.
- **P1 stories (US1–US6)**: US1 (hypothesis gate) and US2 (ICE/RICE prioritization) are both foundational quality/sequencing gates that can build in parallel; US3 (statistical rigor) depends on Foundational's metrics/statistical-method infrastructure; US4 (guardrail auto-pause) and US5 (kill switch) are the safety mechanisms and can build in parallel once US3's statistical engine exists; US6 (risk-classified approval) depends on US1's hypothesis gate and governs launch for all experiment types.
- **P2 stories (US7–US9)**: US7 (North Star Metric) depends on US1–US6 already producing reliable, guardrail-protected experiment results to feed into the growth model; US8 (ethics gate) is a validation layer applied to experiment designs US1–US6 already make possible to create; US9 (negative/neutral publication) depends on the base experiment/decision lifecycle (US1–US6) already existing — all three should follow the P1 stories, with US8 and US9 able to build in parallel.
- **Phase 12 (Growth Intelligence remainder/AI Assistance)** depends on Foundational and US7; can build in parallel with US8/US9.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, experiment types extending `026`, metrics/randomization infrastructure) → **STOP and VALIDATE** the four Foundational contract tests (hypothesis-completeness-gate, kill-switch-sub-60-second-stop, guardrail-breach-auto-pause, high-risk-approval-chain-gate) pass → US1 (hypothesis gate) + US2 (ICE/RICE prioritization) in parallel → US3 (statistical rigor) → **STOP and VALIDATE** the statistical backbone is trustworthy → US4 (guardrail auto-pause) + US5 (kill switch) in parallel → US6 (risk-classified approval) → **STOP and VALIDATE** the safety and governance mechanisms protecting checkout/pricing/payments experiments hold → US7 (North Star Metric) + US8 (ethics gate) + US9 (negative/neutral publication) in parallel → Phase 12 (growth portfolio/AI assistance) → Polish.
