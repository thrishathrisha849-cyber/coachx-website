---
description: "Task list for Feature 008 — TBT AI Assistant Platform: Modes, Guardrails & Administration"
---

# Tasks: TBT AI Assistant Platform: Modes, Guardrails & Administration

**Input**: Design documents from `/specs/008-ai-assistant-platform/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001, 003, 004, and 005's Foundational phases complete** (layered RBAC and audit-log interceptor from 001, Auth/Identity/workspace resolution from 003, Course/Lesson content model from 004 for Learning Assistant citations, Community Post/composer from 005 for the Community Assistant's publish handoff).

**Tests**: Included throughout — this feature is the constitution's **primary named architectural source** for Article II (AI Is Assistive, Never Autonomous); no-client-key-exposure, prompt-injection-defense, and cross-tenant-retrieval-isolation get dedicated Foundational contract tests, matching this spec's own SC-001 and SC-004 and the trust guarantee named directly in User Story 4's rationale.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus five supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (RAG & Knowledge Base remainder FR-074–FR-077; Guardrail & Anti-Hallucination remainder FR-109–FR-125; Conversation/Saved-Content/Template Lifecycle + Data Retention/Privacy/Export FR-091–FR-100, FR-131–FR-134; Admin AI Console remainder — observability/evaluation/incidents/rollout FR-135–FR-147).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`/`003`/`004`/`005`'s Foundational phases are deployed (RBAC, audit-log interceptor, Auth/Identity, Course/Lesson content model, Community Post/composer this feature integrates with)
- [ ] T002 Resolve `research.md` open items before proceeding: additional AI provider(s) beyond the initial Claude-compatible integration, secret-manager technology, vector-store choice, speech-to-text/text-to-speech vendor, target streaming-latency SLA, and the workspace/organization scoping model this spec assumes but does not define
- [ ] T003 [P] Add `backend/src/modules/{ai-gateway,ai-prompt,ai-content-creator,ai-business-assistant,ai-learning-assistant,ai-voice,ai-vision-document,ai-memory,ai-rag,ai-conversation,ai-usage-cost,ai-guardrails,ai-privacy,ai-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `AI Provider` and `AI Model` entities in `backend/src/modules/ai-gateway/{ai-provider,ai-model}.entity.ts` (FR-087, FR-088)
- [ ] T005 [P] Define `AI Routing Rule` entity in `backend/src/modules/ai-gateway/ai-routing-rule.entity.ts` (FR-089)
- [ ] T006 [P] Define `AI Prompt` and `AI Prompt Version` entities in `backend/src/modules/ai-prompt/ai-prompt.entity.ts` (FR-011)
- [ ] T007 [P] Define `AI Template` and `AI Template Field` entities in `backend/src/modules/ai-prompt/ai-template.entity.ts` (FR-099)
- [ ] T008 [P] Define the 12-mode `AI Mode` registry (General, Content Creator, Business Assistant, Learning Assistant, Community Assistant, Mentor Preparation, Document Assistant, Image Assistant, Voice Assistant, Instructor Assistant, Mentor Assistant, Admin Assistant) in `backend/src/modules/ai-gateway/ai-mode.registry.ts` (FR-002, FR-003)
- [ ] T009 Define `AI Conversation` and `AI Message` entities in `backend/src/modules/ai-conversation/{ai-conversation,ai-message}.entity.ts` (FR-091)
- [ ] T010 [P] Define `AI Message Attachment`/`AI File` and `AI File Processing Job` entities in `backend/src/modules/ai-vision-document/` (FR-064)
- [ ] T011 [P] Define `AI Document Chunk` and `AI Embedding Reference` entities in `backend/src/modules/ai-rag/` (FR-074)
- [ ] T012 [P] Define the `AI Generation` execution-record entity in `backend/src/modules/ai-gateway/ai-generation.entity.ts` (spec.md Key Entities)
- [ ] T013 [P] Define `AI Tool Invocation` and `AI Tool Confirmation` entities in `backend/src/modules/ai-guardrails/` (FR-085, FR-086)
- [ ] T014 [P] Define `AI Usage Record`, `AI Credit Balance`, `AI Cost Record` entities in `backend/src/modules/ai-usage-cost/` (FR-101, FR-102, FR-104)
- [ ] T015 [P] Define `AI User Preference`/`Personalization Profile` and `AI Memory` entities in `backend/src/modules/ai-memory/` (FR-065, FR-068)
- [ ] T016 [P] Define `AI Saved Content`, `AI Saved Content Version`, `AI Folder` entities in `backend/src/modules/ai-conversation/` (FR-096, FR-097)
- [ ] T017 [P] Define `AI Knowledge Base` and `AI Knowledge Source` entities in `backend/src/modules/ai-rag/` (FR-074)
- [ ] T018 [P] Define the `AI Citation` entity in `backend/src/modules/ai-rag/ai-citation.entity.ts` (FR-076)
- [ ] T019 [P] Define the `AI Feedback` entity in `backend/src/modules/ai-conversation/ai-feedback.entity.ts` (FR-072)
- [ ] T020 [P] Define `AI Evaluation Case` and `AI Evaluation Run` entities in `backend/src/modules/ai-admin/` (FR-122)
- [ ] T021 [P] Define the `AI Safety Event` entity in `backend/src/modules/ai-guardrails/ai-safety-event.entity.ts` (FR-138)
- [ ] T022 [P] Define the `AI Incident` entity in `backend/src/modules/ai-admin/ai-incident.entity.ts` (FR-139)
- [ ] T023 [P] Define the `AI Access Restriction` entity in `backend/src/modules/ai-privacy/ai-access-restriction.entity.ts` (FR-134)
- [ ] T024 Note: `AI Audit Log` reuses `001`'s audit-log interceptor pattern directly for every provider/model/prompt/routing change and staff conversation access — no new logging engine is created (FR-087, FR-090, FR-134)
- [ ] T025 Implement the ten-layer prompt-priority-stack assembly service (platform safety instruction → product system instruction → mode instruction → tenant instruction → feature/template instruction → retrieved context → conversation summary → recent conversation → user prompt → output-schema instruction), enforcing that higher layers are never overridden by lower ones, in `backend/src/modules/ai-prompt/prompt-stack.service.ts` (FR-009, FR-010, Constitution Article II)
- [ ] T026 Implement the AI gateway request orchestrator (auth → authz → usage-limit check → mode resolution → prompt assembly → context retrieval → provider routing → model selection → safety pre-check → execute → stream → output validation → safety post-check → usage logging → cost calculation → error normalization → audit) in `backend/src/modules/ai-gateway/gateway-orchestrator.service.ts` (FR-081)
- [ ] T027 Implement the provider adapter layer with server-side-only execution — no client ever calls a provider directly, no key/secret/privileged instruction ever reaches the client, in `backend/src/modules/ai-gateway/provider-adapter.service.ts` (FR-078, FR-079, FR-080, Constitution Article II)
- [ ] T028 Implement the ten-layer safety-check pipeline (input policy check → attachment scan → prompt-injection detection → permission check → system guardrails → provider safety controls → output moderation → tool-action confirmation → abuse monitoring → human escalation) in `backend/src/modules/ai-guardrails/safety-pipeline.service.ts` (FR-116)
- [ ] T029 Note: role/permission enforcement for the 16-role AI access hierarchy reuses `001`'s layered RBAC directly — no separate AI permission engine is created here (FR-004, Constitution Article VII)
- [ ] T030 Note: user/role/workspace resolution for every AI request reuses `003`'s identity model directly (spec.md Assumptions)
- [ ] T031 Implement the shared chat interface (streaming, stop, regenerate, copy, save, edit-prompt, per-response feedback, read-aloud, translate, continue, retry, error-recovery) across the defined message types in `web/src/components/ai/chat-interface.tsx` (FR-006)
- [ ] T032 Implement the input composer (multiline text, token warning, voice/image/document upload, camera, paste-image, mode indicator, attachment preview, draft persistence, network/mic-permission state, send-disable conditions) in `web/src/components/ai/input-composer.tsx` (FR-007)
- [ ] T033 [P] Implement the AI home screen (personalized quick actions, recent conversations, recommended tools, usage status, saved outputs) in `web/src/app/(member)/ai/page.tsx` (FR-008)
- [ ] T034 Implement the AI surface-integration contract — one backend serving the mobile AI tab, web AI workspace, home dashboard widget, course lesson assistant, ebook/podcast assistant, community composer, mentor-session prep, business toolkit, admin tools, instructor/mentor assistants — each with its own system prompt, tool set, retrieval scope, and permission set, in `backend/src/modules/ai-gateway/surface-integration.service.ts` (FR-001)
- [ ] T035 Wire the 12-mode registry (T008) so each mode carries its own instructions, allowed tools, retrieval scope, output templates, safety rules, usage cost, and model route in `backend/src/modules/ai-gateway/ai-mode.registry.ts` (FR-002, FR-003)
- [ ] T036 Contract test: zero AI provider API keys, secrets, or privileged system instructions ever reach a client response payload or client-side log, across every AI mode in `backend/tests/contract/ai-no-client-key-exposure.contract.test.ts` (FR-079, SC-001)
- [ ] T037 Contract test: an uploaded document or retrieved content containing an embedded instruction ("ignore previous instructions...") is treated as inert data — never executed, never reveals the system prompt, and is logged as a high-risk injection event in `backend/tests/contract/ai-prompt-injection-defense.contract.test.ts` (FR-126, FR-127, FR-128)
- [ ] T038 Contract test: a retrieval query scoped to one user/workspace/course never returns a document chunk or conversation fragment belonging to another user or tenant, under concurrent multi-tenant load in `backend/tests/contract/ai-tenant-isolation.contract.test.ts` (FR-130, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Generate Ready-to-Use Content in Seconds (P1) 🎯 MVP

**Independent Test**: Open Content Creator mode, submit a caption request with topic/platform/tone fields, and confirm a save/copy/editable draft is produced — with no dependency on any other AI mode.

- [ ] T039 [US1] Content-type-to-usable-content conversion core across all listed content types in Tamil/Tanglish/English in `backend/src/modules/ai-content-creator/content-generation.service.ts` (FR-016)
- [ ] T040 [US1] Field-relevance validation — only fields for the selected content type are mandatory, free-form chat input always remains available in `backend/src/modules/ai-content-creator/field-validation.service.ts` (FR-017, acceptance scenario 1)
- [ ] T041 [US1] Social caption generator (platform targeting, tone/length, hook/body/CTA/hashtags/emoji-level/image-suggestion) in `backend/src/modules/ai-content-creator/social-caption.service.ts` (FR-018)
- [ ] T042 [US1] Short-video script generator (Reel/Short/promotional/educational/demo/testimonial formats, hook/scene/dialogue/on-screen-text/visual-direction/CTA/duration) in `backend/src/modules/ai-content-creator/short-video-script.service.ts` (FR-019)
- [ ] T043 [US1] Long-form video script generator — no invented factual claims, clearly marked placeholders instead in `backend/src/modules/ai-content-creator/long-video-script.service.ts` (FR-020)
- [ ] T044 [US1] Blog generator (topic→audience→intent→tone→length→outline→draft→SEO-fields→export, editable outline, fact-check reminder, no unverified SEO facts presented as current) in `backend/src/modules/ai-content-creator/blog-generator.service.ts` (FR-021)
- [ ] T045 [US1] Content calendar generator + CSV/spreadsheet/calendar/admin-workflow export in `backend/src/modules/ai-content-creator/content-calendar.service.ts` (FR-022)
- [ ] T046 [US1] Advertisement copy generator — no deceptive claims/false urgency/unverified guarantees, compliance warning attached where relevant in `backend/src/modules/ai-content-creator/ad-copy.service.ts` (FR-023, acceptance scenario 3)
- [ ] T047 [US1] Product description generator distinguishing user-provided facts from AI-generated marketing language in `backend/src/modules/ai-content-creator/product-description.service.ts` (FR-024)
- [ ] T048 [US1] Sales script generator prohibiting spam, harassment, and deceptive sales tactics in `backend/src/modules/ai-content-creator/sales-script.service.ts` (FR-025)
- [ ] T049 [US1] WhatsApp message generator (concise, mobile-friendly, opt-out respecting, no misleading urgency, name/order/date placeholders) in `backend/src/modules/ai-content-creator/whatsapp-message.service.ts` (FR-026)
- [ ] T050 [US1] Community post assistant integrating with `005`'s composer — no auto-publish, explicit user review and a separate publish action mandatory in `backend/src/modules/ai-content-creator/community-post-assistant.service.ts` (FR-027, acceptance scenario 4)
- [ ] T051 [US1] Brand voice profile (name, description, audience, tone traits, preferred/avoided phrases, language style, example content, CTA style, emoji style, formality, writing rules), restricted to authorized workspace members in `backend/src/modules/ai-content-creator/brand-voice.service.ts` (FR-028)
- [ ] T052 [US1] AI writing transformations (rewrite, shorten, expand, simplify, professionalize, add/remove humor, translate, Tanglish, grammar, flow, bulletize, paragraph, add-CTA, dedup, alternatives) preserving the original non-destructively in `backend/src/modules/ai-content-creator/writing-transformations.service.ts` (FR-029, acceptance scenario 2)
- [ ] T053 [P] [US1] Content Creator mode UI in `web/src/app/(member)/ai/content-creator/page.tsx` (FR-016)
- [ ] T054 [US1] Integration test: field-relevance validation, non-destructive transformation with version preservation, guaranteed-outcome-claim blocking/reframing, no-auto-publish enforcement — all 4 acceptance scenarios in `backend/tests/integration/us1-content-creator.integration.test.ts`

**Checkpoint**: The highest-frequency, P0 launch-critical AI use case is independently functional.

---

## Phase 4: User Story 2 — Business Planning With Business Assistant (P1)

**Independent Test**: Request business-idea generation with skills/budget/time inputs and confirm the output includes idea, customer, problem, solution, revenue model, risks, and explicit assumptions, with no profitability guarantee.

- [ ] T055 [US2] Business Assistant tool-suite scaffolding (idea generation, validation, persona, problem statement, value proposition, niche selection, competitor-analysis framing, offer building, pricing, BMC, marketing/sales/launch plan, SWOT, revenue projection, expense/operations checklist, risk register, name/tagline, pitch) in `backend/src/modules/ai-business-assistant/business-tools.service.ts` (FR-030)
- [ ] T056 [US2] Business idea generator — no guaranteed-profitability claim, every idea includes customer/problem/solution/revenue-model/startup-needs/first-validation-step/risks/difficulty/assumptions in `backend/src/modules/ai-business-assistant/idea-generator.service.ts` (FR-031, acceptance scenario 1)
- [ ] T057 [US2] Idea validation flow (target customer, problem, evidence, assumptions, interview questions, minimum experiment, success criteria, results), continue/modify/stop framed as decision support only in `backend/src/modules/ai-business-assistant/idea-validation.service.ts` (FR-032)
- [ ] T058 [US2] Customer-persona builder distinguishing assumed fields from evidence-based fields in `backend/src/modules/ai-business-assistant/persona-builder.service.ts` (FR-033, acceptance scenario 2)
- [ ] T059 [US2] Offer builder — guarantee field only populated where legally and operationally valid in `backend/src/modules/ai-business-assistant/offer-builder.service.ts` (FR-034)
- [ ] T060 [US2] Pricing assistant treating competitor prices as requiring a user-verified data source, never presenting an unverified current price as fact in `backend/src/modules/ai-business-assistant/pricing-assistant.service.ts` (FR-035, acceptance scenario 3)
- [ ] T061 [US2] Business Model Canvas tool (9 standard sections, edit/save/export) in `backend/src/modules/ai-business-assistant/business-model-canvas.service.ts` (FR-036)
- [ ] T062 [US2] SWOT assistant — no organization-specific facts filled in without user-supplied evidence in `backend/src/modules/ai-business-assistant/swot-assistant.service.ts` (FR-037)
- [ ] T063 [US2] Business plan generator output labeled as a draft requiring human review in `backend/src/modules/ai-business-assistant/business-plan.service.ts` (FR-038)
- [ ] T064 [US2] Pitch assistant — no fabricated traction/revenue/user-counts/partnerships, clearly marked placeholders for unsupplied metrics in `backend/src/modules/ai-business-assistant/pitch-assistant.service.ts` (FR-039)
- [ ] T065 [P] [US2] Business Assistant mode UI in `web/src/app/(member)/ai/business-assistant/page.tsx` (FR-030)
- [ ] T066 [US2] Integration test: no-guaranteed-profitability idea output, assumed-vs-evidence persona labeling, unverified-competitor-price rejection — all 3 acceptance scenarios in `backend/tests/integration/us2-business-assistant.integration.test.ts`

**Checkpoint**: The platform's core "faster business task completion" value proposition is independently functional.

---

## Phase 5: User Story 3 — Course-Scoped Learning Assistant With Citations (P1)

**Independent Test**: Ask a course-scoped question inside a lesson and confirm the response context is limited to that course and includes a citation to the lesson/module/resource used.

- [ ] T067 [US3] Learning Assistant integration with the LMS (`004`) and its full capability set (lesson explanation, concept simplification, translation, note creation, example generation, practice-question generation, quiz creation, quiz-answer explanation, transcript/PDF summarization, flashcard creation, revision-plan creation, next-lesson recommendation, assignment clarification, hints, permitted draft review) in `backend/src/modules/ai-learning-assistant/learning-assistant.service.ts` (FR-040)
- [ ] T068 [US3] Course-scoped context limiter (course metadata, current lesson, allowed resources, instructor-provided knowledge, learner progress, the user's question — never the learner's full platform history) with mandatory lesson/module/resource/timestamp-or-page citation on every response in `backend/src/modules/ai-learning-assistant/course-context.service.ts` (FR-041, acceptance scenario 1)
- [ ] T069 [US3] "Not covered by course content" honest-gap response — never fabricates a plausible-sounding but unsupported answer in `backend/src/modules/ai-learning-assistant/course-context.service.ts` (FR-041, acceptance scenario 2)
- [ ] T070 [US3] Selectable answer modes (explain simply, explain in Tamil, explain in Tanglish, give example, step-by-step, quiz me, hint only, summarize, create notes, compare concepts) in `backend/src/modules/ai-learning-assistant/answer-modes.service.ts` (FR-042)
- [ ] T071 [US3] "Quiz me"/hint-only mode enforcement during an active graded quiz per instructor policy — hint returned instead of the direct answer in `backend/src/modules/ai-learning-assistant/quiz-mode-enforcement.service.ts` (FR-042, acceptance scenario 3)
- [ ] T072 [US3] Flashcard generator (question, answer, explanation, difficulty, source, tags; edit/save/practice/export/delete) in `backend/src/modules/ai-learning-assistant/flashcard-generator.service.ts` (FR-043)
- [ ] T073 [US3] Study plan generator (course/deadline/available-days/daily-time/progress/difficulty/goal input → daily schedule with lessons/practice/revision/buffer/milestones, updated as progress changes) in `backend/src/modules/ai-learning-assistant/study-plan.service.ts` (FR-044)
- [ ] T074 [US3] Podcast/audio assistant (episode summary, key takeaways, timestamp questions, action items, copyright-limited quote suggestions, related-course suggestions, discussion questions, transcript search) in `backend/src/modules/ai-learning-assistant/podcast-assistant.service.ts` (FR-045)
- [ ] T075 [US3] Ebook assistant with copyright enforcement (chapter summary, explain/translate selected text, note generation, in-book Q&A, action-plan creation, in-book search, chapter comparison — no full reproduction, limited verbatim extraction, summaries/short excerpts only) in `backend/src/modules/ai-learning-assistant/ebook-assistant.service.ts` (FR-046)
- [ ] T076 [P] [US3] Learning Assistant lesson-embedded UI in `web/src/app/(member)/courses/[courseId]/lessons/[lessonId]/ai-assistant.tsx` (FR-040)
- [ ] T077 [US3] Integration test: Tamil response with correct lesson/module citation, honest not-covered-by-course response, hint-only enforcement during a graded quiz — all 3 acceptance scenarios in `backend/tests/integration/us3-learning-assistant.integration.test.ts`

**Checkpoint**: The mechanism that prevents hallucinated course content and directly implements Constitution Articles II and IX is independently functional.

---

## Phase 6: User Story 4 — Prompt-Injection and Guardrail Defense (P1)

**Independent Test**: Upload a document containing an embedded instruction to reveal the system prompt or trigger an unconfirmed action, then confirm the platform refuses, does not comply, and logs the attempt.

- [ ] T078 [US4] Untrusted-data treatment for uploaded documents and retrieved content — never parsed as instructions, structurally separated from instructions, in `backend/src/modules/ai-guardrails/untrusted-data.service.ts` (FR-126, acceptance scenario 1)
- [ ] T079 [US4] Embedded-instruction ignore rule — requests to reveal the system prompt or extract secrets, from any input channel, are ignored and blocked in `backend/src/modules/ai-guardrails/injection-ignore.service.ts` (FR-127, acceptance scenario 3)
- [ ] T080 [US4] Tool-permission restriction + retrieved-content sanitization + suspicious-instruction-pattern detection + high-risk-injection logging, wired to and validated by T037's contract test, in `backend/src/modules/ai-guardrails/injection-detection.service.ts` (FR-128, acceptance scenario 1)
- [ ] T081 [US4] High-impact tool-action confirmation gate — an injected instruction (e.g., "delete this user's account") can never trigger a tool call without independent, explicit user confirmation, wired to T013's `AI Tool Confirmation` entity in `backend/src/modules/ai-guardrails/tool-confirmation-gate.service.ts` (FR-128, FR-086, acceptance scenario 2)
- [ ] T082 [US4] Secret non-exposure enforcement (API keys, database credentials, service-role keys, internal tokens, confidential system prompts, private admin notes, other users' data, hidden moderation signals, payout information, identity documents never placed in model context unless strictly necessary and securely handled) in `backend/src/modules/ai-guardrails/secret-protection.service.ts` (FR-129, acceptance scenario 3)
- [ ] T083 [US4] Integration test: hidden-instruction-in-document neutralized and logged as high-risk, indirect account-deletion attempt blocked without explicit confirmation, direct secret-extraction request declined — all 3 acceptance scenarios in `backend/tests/integration/us4-prompt-injection-defense.integration.test.ts`

**Checkpoint**: The platform's core trust guarantee, named directly by Constitution Article II, is independently functional.

---

## Phase 7: User Story 5 — Voice Input and Read-Aloud Interaction (P2)

**Independent Test**: Record a short voice message, review/edit the transcription, send it, and play back the AI response via text-to-speech.

- [ ] T084 [US5] Voice-input workflow state machine (idle → permission-required → recording → paused → processing → transcribed → failed → cancelled → uploaded → sent) with mic tap, timer/waveform, pause/resume/cancel, secure audio upload, optional explicitly-enabled fast-mode in `backend/src/modules/ai-voice/voice-input.service.ts` (FR-057, acceptance scenario 1)
- [ ] T085 [US5] Speech-to-text (Tamil, Tanglish, English, mixed-language, business terms, punctuation, pauses, background-noise tolerance) with user correction and configurable raw-audio retention in `backend/src/modules/ai-voice/speech-to-text.service.ts` (FR-058)
- [ ] T086 [US5] Low-confidence transcription visual flagging, remaining editable before send in `web/src/components/ai/voice-transcript.tsx` (FR-058, acceptance scenario 2)
- [ ] T087 [US5] Text-to-speech read-aloud (Tamil voice where available, English voice, adjustable speed, pause/resume/stop/replay, background-audio controls, screen-reader compatibility), never auto-playing sensitive output in `backend/src/modules/ai-voice/text-to-speech.service.ts` (FR-059, acceptance scenario 3)
- [ ] T088 [P] [US5] Voice recording + read-aloud UI in `web/src/components/ai/voice-recorder.tsx` (FR-057, FR-059)
- [ ] T089 [US5] Integration test: full recording-state progression, low-confidence flagging and pre-send correction, no-auto-play on sensitive response — all 3 acceptance scenarios in `backend/tests/integration/us5-voice-interaction.integration.test.ts`

**Checkpoint**: Natural voice interaction central to the platform's Tamil-first accessibility goal is independently functional.

---

## Phase 8: User Story 6 — Document/Image Upload With Retrieval-Based Q&A (P2)

**Independent Test**: Upload a PDF, ask "summarize section 2," and confirm the answer cites the source document/page and that the file passed format and malware validation before being processed.

- [ ] T090 [US6] Image input handling (product photos, UI screenshots, posters, ads, social-media designs, document images, handwritten notes, charts, business cards, error screenshots, profile images) with describe/extract/caption-suggest/design-analyze/UI-issue-identify/chart-explain/marketing-idea/structured-notes/improvement-suggest capabilities in `backend/src/modules/ai-vision-document/image-assistant.service.ts` (FR-060)
- [ ] T091 [US6] Image-analysis guardrails — no identity confirmation from a face, no sensitive-attribute inference, no medical diagnosis, no product-authenticity guarantee, no hidden-detail extraction, no invasive profiling, visible uncertainty communication in `backend/src/modules/ai-vision-document/image-guardrails.service.ts` (FR-061, acceptance scenario 3)
- [ ] T092 [US6] Document input handling (PDF, DOCX, TXT, CSV, XLSX, PPTX, common image formats) with summarize/explain/translate/extract-action-items/generate-questions/create-social-content/compare-sections/identify-missing-info/convert-to-business-plan/create-presentation-outline/generate-learning-notes capabilities in `backend/src/modules/ai-vision-document/document-assistant.service.ts` (FR-062)
- [ ] T093 [US6] Document processing pipeline (file validation → malware scan → secure storage → text extraction → structure extraction → metadata extraction → chunking → embedding → retrieval-index creation → query processing → relevant-chunk retrieval → response generation → citation mapping → retention/deletion per policy) in `backend/src/modules/ai-vision-document/document-pipeline.service.ts` (FR-063, acceptance scenario 1)
- [ ] T094 [US6] File-handling security (MIME-type validation, file-signature validation, malware scanning, size/page limits, signed upload/download URLs, encryption at rest, role-based access, expiring temporary files, deletion workflow, access logs, tenant isolation, prompt-injection scanning on every uploaded file) wired to T080's injection detection, in `backend/src/modules/ai-vision-document/file-security.service.ts` (FR-064, acceptance scenario 1)
- [ ] T095 [US6] Document-grounded-answer restriction — never fabricates an answer attributed to content not present in the uploaded document in `backend/src/modules/ai-vision-document/document-pipeline.service.ts` (FR-062, acceptance scenario 2)
- [ ] T096 [P] [US6] Document/Image upload UI in `web/src/components/ai/file-upload.tsx` (FR-060, FR-062)
- [ ] T097 [US6] Integration test: valid-PDF passes the full validation pipeline before processing, honest not-in-document response, face-identity-confirmation refusal — all 3 acceptance scenarios in `backend/tests/integration/us6-document-image-qa.integration.test.ts`

**Checkpoint**: The platform's anti-hallucination mechanism for user-specific documents is independently functional.

---

## Phase 8b: RAG & Knowledge Base remainder (supports FR-074–FR-077; cross-cutting, no single owning story)

- [ ] T098 Multi-source retrieval (course content, ebooks, podcasts, blog, help center, policies, user-uploaded files, organization knowledge, mentor resources, admin-approved documents), each tracked with permission scope, version, language, status, visibility, index state, citation metadata, expiry in `backend/src/modules/ai-rag/knowledge-source.service.ts` (FR-074)
- [ ] T099 Retrieval pipeline orchestrator (query normalization → language detection → optional query rewriting → permission filtering → hybrid retrieval → metadata filtering → reranking → context assembly → token-budget management → generation → citation validation → unsupported-claim check) in `backend/src/modules/ai-rag/retrieval-pipeline.service.ts` (FR-075)
- [ ] T100 [P] Citation display (source title, module/course, section, page/timestamp where available, open-source CTA, access-permission confirmation) — never cites a source that doesn't actually support the statement made in `web/src/components/ai/citation.tsx` (FR-076)
- [ ] T101 Content-change reindexing (deactivate old chunks, index the new version, retain historical source references on existing conversations, serve current answers only from the active version, admin-triggered index rebuild, alert on failed indexing) in `backend/src/modules/ai-rag/reindex.service.ts` (FR-077)

**Checkpoint**: The shared retrieval substrate every citation-backed mode depends on is independently functional.

---

## Phase 9: User Story 7 — Instructor-Configured AI Assistance Policy Per Course (P2)

**Independent Test**: An instructor sets a course/assignment AI policy to "AI disabled," then confirms a learner in that context receives no AI generation for that specific graded item while other course content still allows learning assistance.

- [ ] T102 [US7] Restricted-graded-assignment completion block — AI never auto-completes graded work in `backend/src/modules/ai-learning-assistant/academic-integrity.service.ts` (FR-052)
- [ ] T103 [US7] Per-course/per-assignment AI assistance policy configuration (full assistance, hints only, concept explanation only, outline allowed, draft review allowed, AI disabled, citation required) in `web/src/app/(instructor)/courses/[courseId]/ai-policy/page.tsx` (FR-053, acceptance scenario 1)
- [ ] T104 [US7] Disclosed AI-assistance-event logging for academic-integrity review, gated on the policy being disclosed to the learner in `backend/src/modules/ai-learning-assistant/academic-integrity.service.ts` (FR-054, acceptance scenario 3)
- [ ] T105 [US7] Active-graded-quiz controls (configurable direct-answer restriction, hint mode, concept explanation, post-attempt review, practice-question generation) in `backend/src/modules/ai-learning-assistant/quiz-policy.service.ts` (FR-055, acceptance scenario 2)
- [ ] T106 [US7] Answer-key leak prevention regardless of phrasing, indirection, or persistence of the request, wired to T071's quiz-mode enforcement in `backend/src/modules/ai-learning-assistant/quiz-mode-enforcement.service.ts` (FR-056, edge case: indirect extraction attempt)
- [ ] T107 [US7] Integration test: hints-only-not-completed-answer enforcement, AI-disabled-during-quiz refusal, disclosed-policy assistance-event logging — all 3 acceptance scenarios in `backend/tests/integration/us7-academic-integrity.integration.test.ts`

**Checkpoint**: Academic integrity is preserved without blocking instructor-approved assistance elsewhere.

---

## Phase 10: User Story 8 — Admin AI Provider/Model Routing and Fallback (P2)

**Independent Test**: An admin configures a routing rule with a primary and fallback model, simulates a primary-provider failure, and confirms requests are served by the fallback model with no duplicate usage charge and a visible retry/fallback state shown to the user.

- [ ] T108 [US8] Admin provider configuration (add provider, secrets stored via secret manager, enable/disable, base-URL/timeout/retry/priority/regional routing, test connection, health view, credential rotation, change audit) — a saved API key value is never redisplayed after save, in `backend/src/modules/ai-gateway/provider-admin.service.ts` (FR-087, acceptance scenario 3)
- [ ] T109 [US8] Model record management (provider, model ID, display name, capabilities, context/output limits, vision/tool/streaming support, cost rates, status, allowed plans/modes, safety classification, fallback model) in `backend/src/modules/ai-gateway/model-admin.service.ts` (FR-088)
- [ ] T110 [US8] Admin routing-rule configuration (mode, plan, input type, language, max context, primary model, fallback model, cost ceiling, latency preference, effective dates, status) with conflict validation before activation in `backend/src/modules/ai-gateway/routing-admin.service.ts` (FR-089)
- [ ] T111 [US8] Model-routing decision engine (mode, plan, input type, complexity, context size, quality/speed needs, language, current provider health, cost budget, safety category → fast/standard/advanced-reasoning/vision/speech/embedding/fallback model) in `backend/src/modules/ai-gateway/model-routing.service.ts` (FR-082)
- [ ] T112 [US8] Fallback trigger and execution (provider outage, rate limit, timeout, unsupported input, model unavailability, high error rate) preserving safety and capability equivalence, showing a visible retry/fallback state, wired to T027's provider adapter, in `backend/src/modules/ai-gateway/fallback.service.ts` (FR-083, acceptance scenario 1)
- [ ] T113 [US8] Duplicate-charge prevention on fallback-completed requests, with the fallback activation captured in the usage audit and its output quality flagged for monitoring in `backend/src/modules/ai-gateway/fallback.service.ts` (FR-083, acceptance scenario 2)
- [ ] T114 [US8] Production-prompt change-management workflow (create draft → edit → add variables → test → compare models → version → submit for approval → publish → rollback → archive) with usage/feedback/failure-case visibility for admins in `backend/src/modules/ai-prompt/prompt-lifecycle.service.ts` (FR-090)
- [ ] T115 [P] [US8] Admin Providers/Models/Routing console UI in `web/src/app/(admin)/ai/{providers,models,routing}/page.tsx` (FR-087, FR-088, FR-089)
- [ ] T116 [US8] Integration test: primary-provider-timeout triggers fallback with output-quality flagging, no double charge on a fallback-completed request, saved provider key never redisplayed on reload — all 3 acceptance scenarios in `backend/tests/integration/us8-provider-routing-fallback.integration.test.ts`

**Checkpoint**: Provider independence — the product is never locked to a single vendor's uptime — is independently functional.

---

## Phase 11: User Story 9 — Per-Request Cost Accounting and Usage Limits (P3)

**Independent Test**: Make several AI requests as different plan-tier users, then confirm the admin cost dashboard reflects accurate per-request token/cost data and the affected user's usage screen shows correct used/remaining/reset-date values.

- [ ] T117 [US9] Usage-limit enforcement (requests per day/month, input/output tokens, voice minutes, image analyses, file pages, storage, advanced-model requests, concurrent generations) differentiated by plan tier, exact numeric values deferred to `009` in `backend/src/modules/ai-usage-cost/usage-limits.service.ts` (FR-101)
- [ ] T118 [US9] AI credit deduction transparency — a failed generation or provider error never deducts credit or quota in `backend/src/modules/ai-usage-cost/credit-deduction.service.ts` (FR-102, acceptance scenario 3)
- [ ] T119 [US9] Usage-limit-reached display (used amount, remaining amount, reset date, upgrade option, lower-cost mode) without misleading urgency language in `web/src/components/ai/usage-limit-banner.tsx` (FR-103, acceptance scenario 2)
- [ ] T120 [US9] Per-request cost-record logging (user, workspace, feature, mode, model, input/output tokens, provider cost, internal cost, currency, timestamp) in `backend/src/modules/ai-usage-cost/cost-recording.service.ts` (FR-104, acceptance scenario 1)
- [ ] T121 [US9] Cost-budget enforcement (per-user, per-feature, per-plan, daily-platform) via model routing, token caps, context compression, file-page limits, response-length limits, caching, abuse throttling, and an emergency provider-disable control in `backend/src/modules/ai-usage-cost/cost-budget.service.ts` (FR-105)
- [ ] T122 [US9] Real, persisted progress status for long-running file/voice processing jobs — never a fake completed state, wired to T010's `AI File Processing Job` entity, in `backend/src/modules/ai-usage-cost/job-progress.service.ts` (FR-106)
- [ ] T123 [US9] AI request status lifecycle (created, validating, uploading, processing-attachment, retrieving-context, generating, safety-checking, completed, failed, cancelled, timed-out, rate-limited) exposed end-to-end in `backend/src/modules/ai-gateway/request-status.service.ts` (FR-107)
- [ ] T124 [US9] Error-recovery action set (retry, send-without-attachment, use-shorter-file, switch-model, continue-from-partial-response, report-issue, save-draft-prompt) mapped to defined error codes in `backend/src/modules/ai-usage-cost/error-recovery.service.ts` (FR-108)
- [ ] T125 [P] [US9] User usage/cost display and admin cost dashboard UI in `web/src/app/(member)/ai/usage/page.tsx` and `web/src/app/(admin)/ai/costs/page.tsx` (FR-103, FR-136)
- [ ] T126 [US9] Integration test: cost-record field completeness, usage-limit-reached display correctness, zero credit/quota deduction on a failed generation — all 3 acceptance scenarios in `backend/tests/integration/us9-cost-accounting.integration.test.ts`

**Checkpoint**: Cost sustainability, named directly in the source's closing AI product principle, is independently functional.

---

## Phase 11b: Guardrail & Anti-Hallucination remainder (supports FR-109–FR-125 beyond FR-116/117/126–130 already covered; cross-cutting, no single owning story)

- [ ] T127 Assistant-not-authority framing enforcement (never a final legal/financial authority, never a medical professional, never a guaranteed business expert, never a replacement for a human mentor, never a business-result guarantee) in `backend/src/modules/ai-guardrails/authority-framing.service.ts` (FR-109)
- [ ] T128 [P] User-controlled-output guarantee (editable, copyable, saveable, regenerable, shorten/expand/translate/retone/delete) in `web/src/components/ai/output-controls.tsx` (FR-110)
- [ ] T129 Clarifying-question discipline — high-value clarifying questions only when material details are missing, immediate output when the request is sufficient, reasonable clearly-marked placeholders for missing minor details in `backend/src/modules/ai-guardrails/clarification-policy.service.ts` (FR-111)
- [ ] T130 Uncertainty labeling (assumptions labeled, uncertainty stated, verification suggested, platform sources cited when retrieval was used, user confirmation required before any high-impact action) in `backend/src/modules/ai-guardrails/uncertainty-labeling.service.ts` (FR-112)
- [ ] T131 Human-review recommendation for high-impact output categories (legal agreements, tax filings, financial projections, investment decisions, employment decisions, public crisis communication, medical/mental-health guidance, high-value advertisements, contractual promises, regulatory submissions) in `backend/src/modules/ai-guardrails/human-review-flag.service.ts` (FR-113)
- [ ] T132 Conversation/file privacy defaults (not public by default, never revealed to other members, never used for model training without explicit policy and consent, minimum-necessary retention) in `backend/src/modules/ai-guardrails/privacy-defaults.service.ts` (FR-114)
- [ ] T133 Context-specific disclaimer attachment (business projections, legal information, financial information, medical/mental-health information, current market data, high-risk technical steps, public claims), kept concise and not repeated unnecessarily in `backend/src/modules/ai-guardrails/disclaimer.service.ts` (FR-115)
- [ ] T134 Response-behavior policy engine for restricted-assistance categories (illegal activity, credential theft, malware, fraud, scams, harassment, hate, exploitation, sexual content involving minors, non-consensual intimate content, dangerous weapon instructions, self-harm encouragement, privacy invasion, identity theft, deceptive impersonation, fake evidence, review manipulation, platform abuse) in `backend/src/modules/ai-guardrails/restricted-content-policy.service.ts` (FR-117)
- [ ] T135 High-stakes-domain response framing (medical, mental health, legal, tax, financial investment, employment, credit, insurance, safety-critical engineering) — informational framing, no personalized authoritative conclusion, professional-review encouragement, current-law/rules verification, emergency-escalation support, never a guaranteed outcome, wired to T133 and validated against SC-005, in `backend/src/modules/ai-guardrails/high-stakes-framing.service.ts` (FR-118)
- [ ] T136 Business-content fabrication guardrails (no guaranteed-profit claims, fake scarcity, fake testimonials, fabricated customers/credentials/market-research, invented competitor facts, misleading pricing comparisons, false legal-compliance claims, unrealistic income promises) in `backend/src/modules/ai-guardrails/business-content-guardrails.service.ts` (FR-119)
- [ ] T137 Copyright guardrails (no full-book reproduction, no lengthy copyrighted lyrics, no deceptive living-creator mimicry, no watermark removal for misuse, no legal-uniqueness claim, no copyright-ownership guarantee) in `backend/src/modules/ai-guardrails/copyright-guardrails.service.ts` (FR-120)
- [ ] T138 Model evaluation scoring framework (helpfulness, correctness, relevance, instruction-following, Tamil/Tanglish/English quality, factual grounding, citation accuracy, safety, refusal quality, hallucination, formatting, latency, cost) in `backend/src/modules/ai-admin/model-evaluation.service.ts` (FR-121)
- [ ] T139 Golden evaluation dataset (social captions, video scripts, business ideas, personas, marketing plans, learning questions, course citations, Tamil translation, Tanglish responses, voice transcription, image analysis, document summary, high-risk requests, prompt injection, ambiguous prompts, long conversations), excluding unauthorized personal data, in `backend/src/modules/ai-admin/golden-dataset.service.ts` (FR-122)
- [ ] T140 Human evaluation panel workflow (Tamil-language, Tanglish, business-content, learning-specialist, safety, and product reviewers; blind model-A/model-B/prompt-version comparison without provider bias) in `backend/src/modules/ai-admin/human-evaluation.service.ts` (FR-123)
- [ ] T141 Automated evaluation checks (schema validation, required-section coverage, citation existence/grounding, language match, prohibited-phrase detection, sensitive-data-leakage check, length, repetition, broken links, output format, tool-call validity), supplementing but never replacing human quality judgment, in `backend/src/modules/ai-admin/automated-evaluation.service.ts` (FR-124)
- [ ] T142 A/B testing framework for prompts, templates, response length, model route, recommendations, clarification strategy, save CTA, voice workflow, and suggested follow-ups — never weakens safety rules for the sake of the experiment, in `backend/src/modules/ai-admin/ab-testing.service.ts` (FR-125)

**Checkpoint**: The platform's full anti-hallucination and guardrail architecture, beyond injection-specific defense, is independently functional.

---

## Phase 12: Conversation/Saved-Content/Template Lifecycle & Data Retention/Privacy/Export (supports FR-091–FR-100, FR-131–FR-134; cross-cutting, no single owning story)

- [ ] T143 Conversation and message record completeness (conversation: ID, user, workspace, mode, title, language, prompt version, model route, context sources, created/updated/archived dates, deletion status, safety status, token usage, cost, feedback score; message: ID, conversation ID, role, content, structured content, attachment references, parent message, model, prompt version, token usage, latency, safety labels, citations, status, created date) in `backend/src/modules/ai-conversation/conversation-record.service.ts` (FR-091)
- [ ] T144 [P] AI-auto-generated, user-editable, language-aware conversation titles that avoid exposing sensitive content in notification previews in `backend/src/modules/ai-conversation/conversation-title.service.ts` (FR-092)
- [ ] T145 Conversation history management (recent listing, search, filter by mode, pin, rename, archive, delete, bulk delete, export, continue, pagination) in `web/src/app/(member)/ai/conversations/page.tsx` (FR-093)
- [ ] T146 Conversation deletion workflow (immediate hide, background deletion, attachment handling, search-index removal, embedding deletion, anonymized-or-policy-approved analytics retention, legal-retention-exception explanation to the user) in `backend/src/modules/ai-conversation/conversation-deletion.service.ts` (FR-094, edge case: active safety investigation or legal retention)
- [ ] T147 Temporary chat (excluded from conversation history and personalization, short retention for abuse prevention, fast attachment expiry, clear user-facing notice) in `backend/src/modules/ai-conversation/temporary-chat.service.ts` (FR-095)
- [ ] T148 Saved-content lifecycle (save by type — script, caption, email, business plan, marketing plan, notes, checklist, persona, offer, study plan, template, custom — with version history, compare, restore, duplicate, rename, delete-version) in `backend/src/modules/ai-conversation/saved-content.service.ts` (FR-096)
- [ ] T149 [P] Folder organization for saved content (create, rename, move, delete, search, filter, sort) in `backend/src/modules/ai-conversation/ai-folder.service.ts` (FR-097)
- [ ] T150 Export formats (copy text, TXT, PDF, DOCX, CSV, spreadsheet, share-to-community draft, share-to-email draft, download-image-card, add-to-calendar) — an exported document contains only user-approved content in `backend/src/modules/ai-conversation/export.service.ts` (FR-098)
- [ ] T151 AI template execution pipeline (select template → display fields → validate → assemble context → render prompt → generate → parse output → safety-check → display result → save-or-refine) in `backend/src/modules/ai-prompt/template-execution.service.ts` (FR-099)
- [ ] T152 Custom-template creation for eligible/premium users (define variables, set default tone, select output format, share privately with a team, duplicate, archive) in `backend/src/modules/ai-prompt/custom-template.service.ts` (FR-100)
- [ ] T153 Retention-policy configurability per data category (conversations, temporary chats, raw audio, transcriptions, uploaded files, embeddings, generated outputs, safety logs, cost logs), clearly communicated to users in `backend/src/modules/ai-privacy/retention-policy.service.ts` (FR-131)
- [ ] T154 Training-data-use consent gate — private conversations and uploaded private documents never used for platform-model training by default, requiring explicit consent and policy with opt-out, never relying on anonymization alone in `backend/src/modules/ai-privacy/training-consent.service.ts` (FR-132)
- [ ] T155 User data export (conversation history, saved content, personalization settings, uploaded-file metadata, usage summary), excluding sensitive internal system metadata in `backend/src/modules/ai-privacy/user-data-export.service.ts` (FR-133)
- [ ] T156 Staff access-restriction workflow to user AI conversations (authorized role + valid support/safety purpose + case reference + minimum-necessary content exposure + access logging + time-limited permission + captured reason; routine analytics uses aggregated data instead), wired to T023's `AI Access Restriction` entity, in `backend/src/modules/ai-privacy/staff-access-restriction.service.ts` (FR-134)

**Checkpoint**: The full conversation/content lifecycle and privacy/retention guarantees are independently functional.

---

## Phase 13: Admin AI Console remainder — Observability, Evaluation, Incidents & Rollout (supports FR-135–FR-147; cross-cutting, no single owning story)

- [ ] T157 [P] Admin AI module navigation (Overview, Providers, Models, Routing, Prompts, Templates, Knowledge Bases, Conversations, Usage, Costs, Safety, Evaluations, Feedback, Incidents, Settings, Reports) in `web/src/app/(admin)/ai/layout.tsx` (FR-135)
- [ ] T158 Admin AI Overview reporting (active AI users, daily/monthly requests, success/failure rate, average latency, input/output tokens, provider cost, cost per active user, usage by feature/language, safety block rate, user feedback, top templates, file-processing volume, voice minutes, model distribution) in `web/src/app/(admin)/ai/overview/page.tsx` (FR-136)
- [ ] T159 Knowledge-base admin management (create, upload content to, connect platform modules to, set permissions on, add metadata to, process, re-index, pause, delete each knowledge base; view chunk count, indexing errors, retrieval/citation-quality test) in `web/src/app/(admin)/ai/knowledge-bases/page.tsx` (FR-137)
- [ ] T160 Safety admin console (queues for blocked requests, high-risk outputs, prompt-injection attempts, user reports, repeated policy violations, sensitive tool attempts, data-leak alerts, model anomalies; actions: review, clear, warn, restrict feature, suspend AI access, escalate account, update rule, submit provider incident) in `web/src/app/(admin)/ai/safety/page.tsx` (FR-138)
- [ ] T161 AI incident record management (type, severity, scope, start time, detection time, impact, mitigation, users affected, root cause, resolution, follow-up actions) in `backend/src/modules/ai-admin/incident-management.service.ts` (FR-139)
- [ ] T162 Admin feedback dashboard (helpful rate, negative-feedback categories, breakdowns by feature/model/prompt-version/language/plan/date, traceability from a feedback item to the responsible prompt/model) in `web/src/app/(admin)/ai/feedback/page.tsx` (FR-140)
- [ ] T163 Analytics event taxonomy emission (`ai_conversation_created`, `ai_prompt_submitted`, `ai_response_completed`, `ai_response_regenerated`, `ai_voice_transcribed`, `ai_file_processed`, `ai_template_generated`, `ai_limit_reached`, `ai_safety_blocked`, `ai_tool_executed`, `ai_conversation_deleted`) in `backend/src/modules/ai-admin/ai-analytics.service.ts` (FR-141)
- [ ] T164 Request-trace recording (trace ID, request ID, protected user identifier, feature, prompt version, model, provider, retrieval/provider/safety durations, total latency, token usage, cost, status, error category, tool actions), never logging raw sensitive user content unless explicitly required and protected in `backend/src/modules/ai-admin/request-trace.service.ts` (FR-142)
- [ ] T165 Alerting (provider failure-rate spikes, high latency, cost spikes, token spikes, safety-block spikes, data-leak signals, citation failures, file/voice processing backlog, model-response degradation, prompt-deployment regression, fallback-activation spikes) in `backend/src/modules/ai-admin/alerting.service.ts` (FR-143)
- [ ] T166 Rate limiting (per user, per device, per IP, per workspace, per feature, per provider, per concurrent stream, per file upload, per tool action) with retry guidance included in every rate-limit response in `backend/src/modules/ai-guardrails/rate-limiting.service.ts` (FR-144)
- [ ] T167 Abuse-signal detection (automated repeated prompts, account farms, token-exhaustion attempts, prompt-injection abuse, secret-extraction attempts, repeated prohibited content, file-upload abuse, referral-credit abuse, provider-cost attacks, tool-action probing) with throttling, challenge, upload restriction, advanced-model disablement, temporary AI suspension, or account review in `backend/src/modules/ai-guardrails/abuse-detection.service.ts` (FR-145)
- [ ] T168 AI feature-flag rollout controls (Global AI, Content AI, Business AI, Learning AI, Voice, Image analysis, Document upload, Memory, Advanced model, Tool execution, Community integration, Mentor integration, Instructor AI, Organization AI), targetable by environment, plan, user segment, region, app version, percentage rollout in `backend/src/modules/ai-admin/feature-flags.service.ts` (FR-146)
- [ ] T169 AI deployment management (separated environments, securely managed secrets, prompt rollback, model rollback, provider failover, canary release, audit of every deployment change) in `backend/src/modules/ai-admin/deployment.service.ts` (FR-147)
- [ ] T170 [P] Admin AI console remaining screens UI (Evaluations, Incidents, Settings, Reports) in `web/src/app/(admin)/ai/{evaluations,incidents,settings,reports}/page.tsx`

**Checkpoint**: The full admin AI operations console is independently functional.

---

## Phase 14: Polish & Cross-Cutting Concerns

- [ ] T171 [P] Mobile AI experience pass (text chat, voice recording, camera, gallery upload, file picker, streaming response with stop, copy, save, share draft, read-aloud, conversation history, offline prompt drafting, upload retry, push deep links, usage view, settings; low-network draft preservation, upload progress with retry, safe image compression, audio queueing, streaming reconnect, retrieval of completed responses, clear offline state, no generation without server confirmation) in `mobile/lib/features/ai/` (FR-148)
- [ ] T172 [P] Web AI workspace pass (responsive split layout, conversation sidebar with history search, large editor, attachment drag-and-drop, template panels, keyboard shortcuts, multi-document context, export, accessible navigation) in `web/src/app/(member)/ai/workspace/page.tsx` (FR-149)
- [ ] T173 [P] Accessibility pass (screen-reader-friendly chat roles, live-region streaming announcements with controls, keyboard-operable composer, voice-record status labels, caption/transcript support, accessible attachment previews, focus management, keyboard stop-generation action, non-color status indicators, high contrast, adjustable text size, reduced motion, TTS controls, field-linked error messages) (FR-150)
- [ ] T174 [P] Localization pass (navigation, templates, field labels, safety messages, errors, usage displays, notifications, admin content, empty states, consent prompts, privacy controls into Tamil, Tanglish, and English; per-language model-output quality evaluated separately; real skeleton/progress loading states, never fake response text while a generation is pending) (FR-151)
- [ ] T175 Personalization/memory pass wiring FR-065–FR-073 end-to-end: five memory levels, view/edit/delete/disable/clear-all memory and temporary-chat exclusion, sensitive-detail non-inference without legal/consent basis, personalization-profile field set, language auto-detection with explicit-user-override precedence, Tanglish generation rules plus admin terminology dictionary, selectable response styles that never override safety/factuality, structured per-response feedback linked to conversation/message/prompt/model/mode/language, and linked-version regeneration options in `backend/src/modules/ai-memory/personalization.service.ts`
- [ ] T176 Security hardening pass: re-audit T027's server-side-only provider execution, T028's ten-layer safety pipeline, T080's tool-permission restriction, T094's file-handling security, and T156's staff-access restriction end-to-end against FR-064, FR-079, FR-116, FR-128, FR-134
- [ ] T177 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (additional AI provider(s) beyond the Claude-compatible integration, secret-manager technology, target streaming-latency SLA, the workspace/organization scoping-model source)
- [ ] T178 Final audit: cross-check every FR-001–FR-151 against an implementation or validation task; confirm the Constitution Article II primary-implementer citation and the Localization & Language Requirements citation are concretely implemented, not merely noted
- [ ] T179 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`'s RBAC/audit-log and `003`'s identity model, and produces the gateway/safety/prompt-stack infrastructure every subsequent phase routes through.
- **P1 stories (US1–US4)**: US1 (Content Creator) is the highest-frequency use case and should ship first as the MVP; US2 (Business Assistant) depends only on Foundational and can build in parallel with US1; US3 (Learning Assistant) depends on Foundational plus `004`'s course/lesson content model and Phase 8b's retrieval pipeline for citations; US4 (prompt-injection defense) depends only on Foundational's safety pipeline (T028) and should be validated early since every other mode routes through it.
- **Phase 8b (RAG & Knowledge Base)** depends on Foundational's `AI Document Chunk`/`AI Knowledge Base` entities (T011, T017) and should land before or alongside US3 and US6, since both cite retrieved sources.
- **P2 stories (US5–US8)**: US5 (voice) and US6 (document/image) both depend on Foundational's file-processing infrastructure (T010) and can build in parallel with each other; US6 also depends on Phase 8b's retrieval pipeline; US7 (instructor AI policy) depends on US3's Learning Assistant and quiz-mode enforcement (T071); US8 (provider routing/fallback admin) depends on Foundational's gateway orchestrator (T026, T027) and can build in parallel with US5–US7.
- **Phase 11b (Guardrail & Anti-Hallucination remainder)** depends on Foundational's safety pipeline (T028) and US4's injection-defense tasks; can run in parallel with the P2 stories.
- **P3 story (US9)** depends on Foundational's usage/cost entities (T014) and the gateway orchestrator (T026) — can build in parallel with US5–US8.
- **Phase 12 (Conversation/Saved-Content/Privacy)** depends on Foundational's conversation entities (T009, T016) and can build in parallel with the P2/P3 stories.
- **Phase 13 (Admin Console remainder)** depends on every module it surfaces (providers/models/routing from US8, knowledge bases from Phase 8b, safety from US4/Phase 11b, usage/cost from US9) — build after those phases are stable.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (gateway, prompt stack, safety pipeline, shared chat UI) → **STOP and VALIDATE** the no-client-key and prompt-injection-defense contract tests pass → US1 (Content Creator) → **STOP and VALIDATE** the highest-frequency use case works end-to-end with no dark-pattern/auto-publish violations → US2 (Business Assistant) + US4 (prompt-injection defense, validate the platform's core trust guarantee explicitly) in parallel → Phase 8b (RAG & Knowledge Base) → US3 (Learning Assistant with citations) → **STOP and VALIDATE** the anti-hallucination/citation mechanism is trustworthy → US5 (voice) + US6 (document/image Q&A) in parallel → US7 (instructor AI policy, extends US3) → US8 (provider routing/fallback admin) → Phase 11b (guardrail remainder) → US9 (cost accounting, P3) → Phase 12 (conversation/privacy lifecycle) → Phase 13 (admin console remainder) → Polish.
