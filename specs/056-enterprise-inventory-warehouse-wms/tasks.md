---
description: "Task list for Feature 056 — Enterprise Inventory & Warehouse Management (WMS)"
---

# Tasks: Enterprise Inventory & Warehouse Management (WMS)

**Input**: Design documents from `/specs/056-enterprise-inventory-warehouse-wms/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 011, 009, 055, 057, 008, and 001/003/016 — with a new §1 finding requiring `011`'s per-listing Inventory Record to consume this feature's Stock Ledger for warehouse-governed products), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `011`'s marketplace order/fulfillment infrastructure, `009`'s general-ledger infrastructure, and `055`'s Purchase Order/procurement infrastructure exist as consumption/coordination points.

**Tests**: Included throughout — cycle-count-driven inventory accuracy, real-time zero-double-counting stock synchronization (directly exercising the new `011`/`056` reservation-to-ledger boundary), and the AI-workforce-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and FR-044/SC-008.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (outbound/cross-docking/task-status remainder; stock-control mechanics; replenishment/demand planning; alerts/audit/integrations/executive dashboard; the Future Automation roadmap).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `011`'s marketplace order infrastructure, `009`'s general-ledger infrastructure, and `055`'s Purchase Order/procurement infrastructure exist as consumption/coordination points
- [ ] T002 Resolve `research.md` open items before proceeding: numeric SLA/accuracy/confidence-threshold defaults (spec.md's own flagged gap), the digital-twin simulated-vs-actual reconciliation process, the offline-scan-sync conflict-resolution rule, the stock-adjustment/disposal dispute-reversal workflow, warehouse-level (not device-level) offline-connectivity behavior, RFID misread/ghost-read handling before ledger mutation, cycle-count-variance-vs-shrinkage escalation differentiation, AI-recommendation expiration handling, expiring-vs-obsolete alert precedence, and this plan's own §1 finding requiring the `011` Inventory Record reconciliation to actually be built rather than assumed
- [ ] T003 [P] Add `backend/src/modules/wms/{warehouse-location-hierarchy,inventory-stock-control,barcode-qr-rfid-ingestion,ai-warehouse-intelligence,warehouse-digital-twin,multi-warehouse-transfers,replenishment-demand-planning,asset-tracking-lifecycle,returns-damaged-expired-obsolete,workforce-task-management}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Warehouse` entity in `backend/src/modules/wms/warehouse-location-hierarchy/warehouse.entity.ts`
- [ ] T005 [P] Define the `Warehouse Zone` entity in `backend/src/modules/wms/warehouse-location-hierarchy/warehouse-zone.entity.ts`
- [ ] T006 [P] Define the `Storage Location` entity in `backend/src/modules/wms/warehouse-location-hierarchy/storage-location.entity.ts`
- [ ] T007 [P] Define the `Inventory Item (Item Master)` entity in `backend/src/modules/wms/inventory-stock-control/inventory-item.entity.ts`
- [ ] T008 [P] Define the `Stock Ledger Entry` entity in `backend/src/modules/wms/inventory-stock-control/stock-ledger-entry.entity.ts`
- [ ] T009 [P] Define the `Warehouse Task` entity in `backend/src/modules/wms/inventory-stock-control/warehouse-task.entity.ts`
- [ ] T010 [P] Define the `Transfer Record` entity in `backend/src/modules/wms/multi-warehouse-transfers/transfer-record.entity.ts`
- [ ] T011 [P] Define the `Asset (Asset Tag)` entity in `backend/src/modules/wms/asset-tracking-lifecycle/asset.entity.ts`
- [ ] T012 [P] Define the `Warehouse Digital Twin Simulation` entity in `backend/src/modules/wms/warehouse-digital-twin/digital-twin-simulation.entity.ts`
- [ ] T013 [P] Define the `AI Recommendation` entity in `backend/src/modules/wms/ai-warehouse-intelligence/ai-recommendation.entity.ts`
- [ ] T014 [P] Define the `Warehouse Worker Profile` entity in `backend/src/modules/wms/workforce-task-management/warehouse-worker-profile.entity.ts`
- [ ] T015 [P] Define the `WMS Exception` entity in `backend/src/modules/wms/inventory-stock-control/wms-exception.entity.ts`
- [ ] T016 [P] Define the `Return / Disposal Record` entity in `backend/src/modules/wms/returns-damaged-expired-obsolete/return-disposal-record.entity.ts`
- [ ] T017 Support unlimited warehouses across 19 warehouse types under a single organization, wired to T004 (FR-001)
- [ ] T018 Configurable rules, workflows, operating hours, storage policies, security controls, and performance targets per warehouse type (FR-002)
- [ ] T019 Warehouse Master Record full field set (ID, Name, Code, Type, Address, GPS, Time Zone, Manager, Operating Hours, Storage Capacity, Current Utilization, Security Level, Active Status) (FR-003)
- [ ] T020 Per-warehouse dashboard (total inventory, available/reserved capacity, health score, today's receipts/dispatches, pending/delayed orders, inventory/picking/packing accuracy, dispatch SLA, workforce utilization, equipment status) (FR-004)
- [ ] T021 10-level location hierarchy (Organization→Business Unit→Warehouse→Building→Floor→Zone→Aisle→Rack→Shelf→Bin→Storage Position) with unique system-generated location codes, wired to T006 (FR-005)
- [ ] T022 15 configurable warehouse zone types (Receiving, Quality Inspection, Putaway Staging, General Storage, Fast-Moving, High-Value, Hazardous Material, Cold Storage, Quarantine, Damaged Goods, Returns, Packing, Dispatch, Cross-Docking, Restricted Access), wired to T005 (FR-006)
- [ ] T023 Location Master Record full field set (location ID/code, warehouse, zone/aisle/rack/shelf/bin, type, storage/weight/volume capacity, temperature/humidity requirements, security level, supported categories, utilization, availability, audit history), wired to T006 (FR-007)
- [ ] T024 Configurable storage rules across 12 dimensions (category, dimensions, weight, temperature, hazard class, expiry, batch, serial, velocity, value, security, compatibility) (FR-008)
- [ ] T025 Digital warehouse map (zones, locations, availability status, worker tasks, equipment positions, inventory concentration, bottlenecks) with exact item-location lookup (FR-009)
- [ ] T026 Location capacity tracking (maximum/current/available/weight/volume/pallet/bin/zone utilization, capacity forecast, overflow risk) and 10 location status values (FR-010)
- [ ] T027 Standardized 14-stage inventory lifecycle (Item Registration→Classification→Warehouse Assignment→Stock Receipt→Quality Inspection→Storage Allocation→Inventory Availability→Stock Movement→Reservation→Fulfillment→Adjustment→Audit→Asset Retirement→Archival) with configurable workflows/notifications/AI recommendations/SLA monitoring/approval history/immutable audit logs at every stage (FR-012)
- [ ] T028 Note: `011`'s per-listing Inventory Record must consume this feature's Stock Ledger as the source of truth for available/reserved/damaged/returned quantities on warehouse-governed physical listings, while retaining its own independent lightweight tracking for sellers fulfilling outside a `056`-governed warehouse; the checkout-time reservation trigger stays with `011`, the actual Stock Ledger write stays with `056` (per plan.md §1)
- [ ] T029 Note: inventory-related financial events (write-offs, disposal losses, adjustment impact, transfer cost) are emitted to `009`'s general ledger as inputs; this feature does not implement its own general-ledger posting (per plan.md §2)
- [ ] T030 Note: `055` remains canonical for Purchase Request/Purchase Order/Approval/Three-Way-Match; this feature owns only Goods Receipt execution, putaway, and the Stock Ledger update following a `055`-issued PO's arrival — a boundary independently confirmed from both features' plan.md files (per plan.md §3)
- [ ] T031 Note: supplier-side purchase-recommendation follow-through is deferred to not-yet-planned `057`, preserved as forward-declared and unverified (per plan.md §4)
- [ ] T032 Note: all AI Warehouse Intelligence, slotting, digital-twin, and asset-prediction outputs route through `008`'s `ai-gateway`/`ai-guardrails` for provider access and human-review/override discipline; domain-specific query grounding and recommendation logic is this feature's own new, original build (per plan.md §5)
- [ ] T033 Note: Workforce Roles and warehouse-scoped access controls configure `001`'s/`016`'s existing layered RBAC engine; worker mobile app login reuses `003`'s auth foundation (per plan.md §6)
- [ ] T034 Contract test: cycle-count reconciliation sustains inventory record accuracy at 99% or higher across all warehouses, in `backend/tests/contract/cycle-count-variance-reconciliation-99pct-accuracy.contract.test.ts` (SC-001)
- [ ] T035 Contract test: stock-ledger updates from receiving/picking/packing/dispatch/transfer/adjustment transactions propagate across all connected systems within seconds, with zero unresolved double-counting incidents — explicitly exercising the §1 boundary between `011`'s reservation trigger and this feature's ledger write, in `backend/tests/contract/real-time-stock-ledger-zero-double-counting-across-warehouses.contract.test.ts` (SC-002)
- [ ] T036 Contract test: 100% of AI-driven workforce recommendations require authorized human review before any disciplinary/employment decision, and 100% of AI recommendations remain end-to-end auditable (approved/rejected/overridden/expired, and by whom), in `backend/tests/contract/ai-warehouse-recommendation-human-approval-workforce-gate.contract.test.ts` (FR-044, SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Barcode/RFID Goods Receipt With Automated Cycle Counting (Priority: P1) 🎯 MVP

**Independent Test**: Receive a PO-linked shipment via barcode/RFID scan and independently run a cycle count on the same location, confirming the stock ledger and location occupancy reflect both events with full audit metadata.

- [ ] T037 [US1] Inbound workflow (Advance Shipment Notice→Delivery Appointment→Gate Entry→Vehicle Verification→Dock Assignment→Goods Unloading→PO Validation→Quantity Verification→Quality Inspection→Goods Receipt Creation→Label Generation→Putaway Assignment→Inventory Update→Supplier Performance Update), wired to T009, T030's `055`-PO-source note, acceptance scenario 1 (FR-013)
- [ ] T038 [US1] WMS Exception identification and management across 13 exception types with ownership/investigation/evidence-attachment/corrective-action/escalation/resolution/audit tracking, wired to T015, acceptance scenario 2 (FR-018)
- [ ] T039 [US1] Inventory auditing via 8 count methods (annual physical, monthly cycle, risk-based, ABC-based, location-based, item-based, blind, recount) with variance approval and inventory reconciliation, wired to acceptance scenario 3 (FR-026)
- [ ] T040 [US1] Inventory variance tracking (system quantity, physical quantity, variance quantity/value, reason code, responsible location/team, investigation status, corrective action, approval status) (FR-027)
- [ ] T041 [US1] 1D/2D barcode support for supplier, internal, item, batch, serial number, location, pallet, and shipment identification (FR-028)
- [ ] T042 [US1] QR code support carrying item/location/asset identification, product/batch/expiry information, maintenance history, digital documentation, verification links, and task instructions (FR-029)
- [ ] T043 [US1] RFID tag registration, reader integration, bulk inventory scanning, real-time movement tracking, gate entry/exit detection, unauthorized-movement alerts, and automated cycle counting, wired to acceptance scenario 3 (FR-030)
- [ ] T044 [US1] Label generation (item name, SKU, barcode, QR, RFID reference, batch/serial number, manufacturing/expiry date, warehouse, storage location, handling instructions) (FR-031)
- [ ] T045 [US1] Scanning support across all 10 warehouse operation types (receiving, putaway, picking, packing, dispatch, transfer, cycle counting, adjustment, asset movement, returns) (FR-032)
- [ ] T046 [US1] Offline mobile/handheld scanning (encrypted local storage with timestamp/user identity, duplicate-transaction prevention, automatic sync on reconnect, synchronization-conflict identification, complete audit history), wired to acceptance scenario 4 (FR-033)
- [ ] T047 [US1] Scan validation for correct item, quantity, location, batch, serial number, order, warehouse, destination, expiry compliance, and user authorization (FR-034)
- [ ] T048 [US1] Anti-fraud/anti-tamper protections (duplicate barcode usage, unauthorized label printing, fake QR codes, RFID tag cloning, unapproved re-labeling, invalid serial numbers, unauthorized stock movement, label tampering) (FR-035)
- [ ] T049 [P] [US1] Barcode/RFID Goods Receipt & Cycle Count UI
- [ ] T050 [US1] Integration test: an ASN-linked PO shipment scanned unit-by-unit validates item/quantity/batch/expiry and generates a putaway task with an audit trail, a mismatched scan raises a WMS exception requiring resolution before the receipt finalizes, an RFID bulk cycle count reconciles system vs. physical quantity and routes above-threshold variances for approval, an offline mobile scan session stores encrypted local transactions and synchronizes without duplication on reconnect — all 4 acceptance scenarios in `backend/tests/integration/us1-goods-receipt-cycle-count.integration.test.ts`

**Checkpoint**: The trustworthy stock-balance foundation every downstream capability depends on is independently functional.

---

## Phase 4: User Story 2 — AI Warehouse Assistant for Natural-Language Operations Queries (Priority: P1)

**Independent Test**: Pose each of the documented example questions to the assistant against a warehouse with live operational data and confirm every response includes recommendation, business reason, supporting data, confidence score, expected benefit, risk, recommended owner, priority, and required approval.

- [ ] T051 [US2] AI capabilities across 10 domains (demand forecasting, dynamic slotting, picking route optimization, replenishment planning, capacity forecasting, inventory misplacement detection, workforce optimization, equipment utilization analysis, warehouse risk detection, executive decision support), wired to T013 (FR-036)
- [ ] T052 [US2] Continuous monitoring of receiving/putaway/picking/packing/dispatch cycle time, inventory accuracy, order accuracy, space utilization, worker productivity, equipment utilization, dock utilization, and warehouse cost per order (FR-037)
- [ ] T053 [US2] Warehouse risk detection across 10 conditions (inventory shrinkage, unauthorized movement, repeated picking errors, capacity shortages, safety risks, equipment failure risk, workforce shortages, dispatch delays, expiry risk, operational bottlenecks) (FR-040)
- [ ] T054 [US2] AI Warehouse Assistant natural-language Q&A across the 8 documented example question types, wired to acceptance scenario 1 (FR-041)
- [ ] T055 [US2] AI recommendation full field set (recommendation text, business reason, supporting data, confidence score, expected benefit, operational risk, recommended owner, priority, required approval, expiration time), wired to acceptance scenario 2 (FR-042)
- [ ] T056 [US2] AI governance controls (human review, explainable recommendations, confidence thresholds, model monitoring, data quality validation, bias monitoring, override controls, approval workflows, audit logging, continuous performance evaluation), wired to T036's contract test, acceptance scenario 3 (FR-043)
- [ ] T057 [US2] Hard block on autonomous AI-driven disciplinary/employment decisions, wired to T036's contract test, acceptance scenario 4 (FR-044)
- [ ] T058 [P] [US2] AI Warehouse Assistant chat UI
- [ ] T059 [US2] Integration test: an at-risk-orders query returns a ranked list with supporting data and confidence score, every displayed recommendation carries the full required field set, an approval-requiring recommendation supports explicit human override with the decision logged, an AI-service-unavailable scenario degrades to a deterministic dashboard/report fallback rather than failing silently — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-warehouse-assistant.integration.test.ts`

**Checkpoint**: The flagship AI capability turning raw operational data into daily actionable guidance is independently functional.

---

## Phase 5: User Story 3 — Dynamic Slotting & Picking Route Optimization (Priority: P2)

**Independent Test**: Generate slotting recommendations for a set of high-velocity SKUs and confirm the system recommends specific bin reassignments with rationale, and that picking tasks route pickers through an optimized sequence.

- [ ] T060 [US3] Dynamic slotting recommendations based on item demand, picking frequency, item size/weight, warehouse capacity, worker travel time, replenishment frequency, product compatibility, expiration risk, and order patterns, wired to acceptance scenario 1 (FR-011)
- [ ] T061 [US3] Picking-strategy optimization (batch, zone, wave, cluster, priority picking), route sequencing, worker/equipment assignment, order consolidation, and dispatch cut-off compliance, wired to acceptance scenario 2 (FR-038)
- [ ] T062 [US3] Predictive picking-location depletion, replenishment requirement/timing/quantity/source-location, worker/equipment availability, potential stockouts, demand surges, and warehouse congestion, wired to acceptance scenario 4 (FR-039)
- [ ] T063 [P] [US3] Dynamic Slotting & Picking Route Optimization UI
- [ ] T064 [US3] Integration test: historical picking-frequency and demand data produces slotting recommendations identifying items to relocate, target locations, and expected travel-time benefit, a released wave of outbound orders sequences and assigns pick tasks per the configured picking strategy, a rejected slotting recommendation is logged with the rejection reason and no location reassignment occurs, a storage location crossing its configured utilization threshold raises an overflow-risk/congestion alert with a space-reallocation suggestion — all 4 acceptance scenarios in `backend/tests/integration/us3-slotting-picking-optimization.integration.test.ts`

**Checkpoint**: The space- and labor-cost optimization layer differentiating an intelligent WMS is independently functional.

---

## Phase 6: User Story 4 — Warehouse Digital Twin Simulation Before Committing a Change (Priority: P2)

**Independent Test**: Run a simulation of a defined change scenario and confirm it produces a projected-impact report distinct from and clearly labeled apart from live operational data, without affecting real inventory records.

- [ ] T065 [US4] Warehouse Digital Twin simulating the 10 documented scenario types (layout change, storage reallocation, demand increase, workforce change, equipment failure, dispatch surge, inventory transfer, picking strategy, new zone, automation investment) prior to real-world implementation, wired to T012, acceptance scenarios 1–2 (FR-045)
- [ ] T066 [US4] AI-driven digital warehouse simulation as part of space optimization (slotting recommendations, layout suggestions, capacity forecasting, congestion detection, space reallocation, item relocation recommendations, picking route optimization, overflow prevention, expansion planning) (FR-046)
- [ ] T067 [P] [US4] Warehouse Digital Twin Simulation UI
- [ ] T068 [US4] Integration test: a proposed layout-change simulation reports projected capacity/travel-time/throughput impact without altering the live warehouse state, a simulated workforce-reduction scenario projects picking/packing/dispatch cycle-time and SLA effects, a manager choosing to proceed requires an explicit human-approval step before the change is applied to the live configuration, a simulation result is clearly labeled as a simulation and retains its scenario inputs for later comparison against actual outcomes — all 4 acceptance scenarios in `backend/tests/integration/us4-warehouse-digital-twin.integration.test.ts`

**Checkpoint**: The de-risking mechanism for costly, hard-to-reverse physical warehouse changes is independently functional.

---

## Phase 7: User Story 5 — Inter-Warehouse Stock Transfer (Priority: P2)

**Independent Test**: Create a transfer request between two warehouses, approve it, and confirm stock is deducted from source, marked in-transit, and only credited to the destination warehouse's available stock after receipt verification.

- [ ] T069 [US5] Real-time cross-warehouse synchronization of stock quantity, reserved/available/damaged/expired quantity, batch details, serial numbers, capacity, location availability, and transfer status (FR-047)
- [ ] T070 [US5] Global inventory search across every warehouse by SKU, product name, category, warehouse, batch, serial number, supplier, stock status, quantity, expiry, and location (FR-048)
- [ ] T071 [US5] Inter-warehouse transfer workflow (Transfer Request→Stock Verification→Approval→Picking→Packing→Dispatch→Transit Tracking→Receiving→Verification→Inventory Update→Financial Update→Audit Completion), wired to T010, acceptance scenarios 1–3 (FR-049)
- [ ] T072 [US5] 9 transfer types (Warehouse to Warehouse, Warehouse to Store, Warehouse to Project, Warehouse to Event, Warehouse to Vendor, Emergency, Temporary, Bulk, Scheduled Transfer) (FR-050)
- [ ] T073 [US5] Transfer Request full field set (transfer number, source/destination warehouse, requested-by, approved-by, reason, priority, expected delivery date, vehicle/driver details, products, quantities, attachments) (FR-051)
- [ ] T074 [US5] Transfer status values (Draft, Pending Approval, Approved, Picking, Packed, In Transit, Partially Received, Completed, Cancelled, Returned), wired to acceptance scenario 3 (FR-052)
- [ ] T075 [US5] AI transfer recommendations based on overstock, understock, sales trend, seasonal demand, distance, delivery cost, warehouse capacity, expiry risk, business priority, and customer demand, wired to acceptance scenario 4 (FR-053)
- [ ] T076 [P] [US5] Inter-Warehouse Transfer UI
- [ ] T077 [US5] Integration test: an approved transfer moves picked/packed/dispatched stock to in-transit status and deducts it from the source warehouse's available stock, arriving goods update the destination warehouse's available stock and complete the financial/audit record on receipt verification, a partially received transfer is set to "Partially Received" with the variance tracked for resolution, persistent overstock/understock for the same SKU across two warehouses triggers an AI transfer recommendation for review — all 4 acceptance scenarios in `backend/tests/integration/us5-inter-warehouse-transfer.integration.test.ts`

**Checkpoint**: Multi-warehouse balancing central to the platform's stated scope is independently functional.

---

## Phase 8: User Story 6 — Returns, Damaged, Expired & Obsolete Inventory Handling (Priority: P2)

**Independent Test**: Process one return through the full workflow and confirm an item approaching its configured expiry window triggers an alert to the responsible manager.

- [ ] T078 [US6] Reverse logistics for Customer, Vendor, Internal, Warehouse, Project, and Franchise return types (FR-063)
- [ ] T079 [US6] Return workflow (Return Request→Approval→Inspection→Quality Verification→Decision→Restock/Repair/Scrap/Vendor Return→Inventory Update→Financial Adjustment), wired to acceptance scenario 1 (FR-064)
- [ ] T080 [US6] Damage record (damage type, severity, photos, inspection notes, responsible user, warehouse, insurance status, financial loss) (FR-065)
- [ ] T081 [US6] Automatic expiry monitoring (today, and 7/15/30/60/90-day windows) with automatic notification to responsible managers, wired to acceptance scenario 3 (FR-066)
- [ ] T082 [US6] AI obsolescence detection (no sales, no movement, low demand, high holding cost, product discontinuation, available replacement), wired to acceptance scenario 4 (FR-067)
- [ ] T083 [US6] Disposal via Vendor Return, Donation, Recycling, Auction, Scrap, Destroy, or Write-Off, with mandatory prior approval and an audit record for every disposal, wired to T036's approval-gate pattern, acceptance scenario 2 (FR-068)
- [ ] T084 [P] [US6] Returns, Damaged, Expired & Obsolete Inventory UI
- [ ] T085 [US6] Integration test: an approved customer return records damage type/severity/photos/inspection notes and routes to Restock/Repair/Scrap/Vendor Return, a disposal decision requires prior approval and an audit record before inventory and financial records are adjusted, an item entering its configured expiry alert window triggers an automatic notification to the responsible manager, a no-sales/no-movement/low-demand/discontinued item is flagged obsolete inventory for review — all 4 acceptance scenarios in `backend/tests/integration/us6-returns-damaged-expired-obsolete.integration.test.ts`

**Checkpoint**: The reverse-logistics and inventory-write-down capability keeping the single source of truth accurate over time is independently functional.

---

## Phase 9: User Story 7 — Warehouse Asset Tracking & Lifecycle Management (Priority: P3)

**Independent Test**: Register a physical asset with a QR/RFID tag, log a maintenance event, and confirm the asset's status, maintenance history, and depreciation are tracked independently of any inventory stock transaction.

- [ ] T086 [US7] Asset tracking across 13 warehouse equipment categories (forklifts, scanners, barcode printers, RFID readers, conveyor systems, pallets, racks, storage bins, computers, tablets, mobile devices, CCTV systems, IoT sensors), wired to T011 (FR-058)
- [ ] T087 [US7] Asset Profile full field set (Asset ID, name, category, manufacturer, model, purchase date, warranty, assigned warehouse/employee, current status, maintenance history, depreciation, QR code, RFID tag), wired to acceptance scenario 1 (FR-059)
- [ ] T088 [US7] Asset lifecycle (Purchase→Registration→Deployment→Assignment→Maintenance→Repair→Upgrade→Relocation→Retirement→Disposal) and 9 asset status values, wired to acceptance scenario 3 (FR-060)
- [ ] T089 [US7] Preventive maintenance, corrective maintenance, emergency repair, AMC tracking, warranty tracking, spare parts management, vendor management, service history, and cost tracking for assets (FR-061)
- [ ] T090 [US7] AI asset intelligence (maintenance-due timing prediction, failure probability, replacement recommendations, asset utilization, idle-asset detection, warranty expiry, repair cost trends, life expectancy), wired to acceptance scenario 2 (FR-062)
- [ ] T091 [P] [US7] Warehouse Asset Tracking & Lifecycle UI
- [ ] T092 [US7] Integration test: registering a newly purchased asset creates an Asset Profile with the full field set and QR/RFID identifiers, the AI asset intelligence engine evaluating usage/history predicts maintenance-due timing and failure probability and raises a notification, a retired asset's status updates to Retired/Disposed with full lifecycle and audit history preserved — all 3 acceptance scenarios in `backend/tests/integration/us7-asset-tracking-lifecycle.integration.test.ts`

**Checkpoint**: The equipment-availability capability supporting throughput and safety is independently functional.

---

## Phase 10: User Story 8 — Warehouse Workforce Task Assignment & Productivity Monitoring (Priority: P3)

**Independent Test**: Assign a set of warehouse tasks to workers based on availability/skills/certification and confirm the workforce performance dashboard reflects individual and team productivity, accuracy, and SLA compliance.

- [ ] T093 [US8] Warehouse Worker Profile full field set (Worker ID, name, employment type, assigned warehouse/shift, skills, certifications, equipment permissions, security clearance, task history, productivity/accuracy scores, safety record, attendance, training status, current availability), wired to T014 (FR-069)
- [ ] T094 [US8] 14 workforce roles (Warehouse Manager, Shift Supervisor, Inventory Controller, Receiving Operator, Quality Inspector, Putaway Operator, Picker, Packer, Forklift Operator, Dispatch Operator, Cycle Counter, Returns Processor, Security Officer, Maintenance Technician) (FR-070)
- [ ] T095 [US8] Shift creation, worker assignment, shift rotation, break scheduling, overtime, leave, absence, temporary staff, peak-demand staffing, and shift handover (FR-071)
- [ ] T096 [US8] Task assignment based on worker availability, skills, certification, equipment access, warehouse zone, task priority, SLA, workload, travel distance, historical performance, and safety requirements, wired to acceptance scenario 1 (FR-072)
- [ ] T097 [US8] Worker mobile application (secure login, shift check-in/out, assigned tasks, route guidance, barcode scanning, task confirmation, quantity entry, photo upload, issue reporting, supervisor communication, break management), wired to T033's `003`-reuse note (FR-073)
- [ ] T098 [US8] Productivity measurement (tasks completed, units processed, picking/packing/receiving rate, task accuracy, average task time, idle time, travel time, SLA compliance, error rate, safety compliance) transparently and configurably, wired to acceptance scenario 2 (FR-074)
- [ ] T099 [US8] Safety checklists, equipment inspection, incident reporting, hazard alerts, restricted-zone controls, certification validation, emergency notifications, safety training, near-miss reporting, and corrective action tracking (FR-075)
- [ ] T100 [P] [US8] Workforce Task Assignment & Productivity Dashboard UI
- [ ] T101 [US8] Integration test: a set of pending warehouse tasks is assigned considering availability/skills/certification/equipment-access/zone/priority/SLA/workload/historical performance, the end-of-shift performance dashboard reflects tasks completed/accuracy/average task time/safety compliance per worker, an AI workforce optimization recommendation with disciplinary or employment impact requires authorized human review and MUST NOT be decided autonomously — all 3 acceptance scenarios in `backend/tests/integration/us8-workforce-task-productivity.integration.test.ts`

**Checkpoint**: The labor-efficiency layer supporting the same throughput/cost goals as slotting is independently functional.

---

## Phase 11: Outbound/Cross-Docking, Stock-Control Mechanics, Replenishment/Demand Planning, Alerts/Audit/Integrations & Roadmap (supports FR-014–FR-017, FR-019–FR-025, FR-054–FR-057, FR-076–FR-080; cross-cutting, no single owning story)

- [ ] T102 Outbound workflow (Order Release→Inventory Reservation→Wave Planning→Pick Task Generation→Item Picking→Quantity Verification→Packing→Shipping Label Generation→Dispatch Validation→Vehicle Assignment→Gate Exit→Shipment Tracking→Inventory Deduction→Delivery Confirmation), wired to T028's `011`-reservation-boundary note (FR-014)
- [ ] T103 Cross-docking operations (inbound-to-outbound allocation, dock synchronization, priority shipment identification, temporary staging, transfer validation, shipment consolidation, real-time inventory updates, exception management, SLA monitoring, AI routing recommendations) (FR-015)
- [ ] T104 Warehouse task generation and management across 12 task types (Receiving, Inspection, Putaway, Replenishment, Picking, Packing, Inventory Transfer, Cycle Counting, Stock Adjustment, Returns Processing, Asset Movement, Warehouse Maintenance) with full field set, wired to T009 (FR-016)
- [ ] T105 Warehouse task status values (Created, Assigned, Accepted, In Progress, Paused, Blocked, Partially Completed, Completed, Rejected, Cancelled, Escalated, Audited) (FR-017)
- [ ] T106 Inventory classification (category/subcategory, brand, supplier, business unit, warehouse, value, movement frequency, demand pattern, shelf life, risk level, storage requirement, ownership, financial classification) plus 12 classification models (ABC, FSN, VED, HML, SDE, XYZ, perishable/non-perishable, serialized/non-serialized, batch-controlled/non-batch-controlled, owned/consignment, saleable/non-saleable) (FR-019)
- [ ] T107 Stock type tracking (Available, Reserved, Allocated, In-Transit, Inspection, Quarantined, Damaged, Expired, Returned, Consignment, Safety, Promotional, Project, Work-in-Progress, Obsolete Stock) (FR-020)
- [ ] T108 Inventory Item Master full field set (Item ID, SKU, name, description, category, UOM, barcode, QR code, RFID tag, batch/serial/expiry control flags, preferred supplier, standard/average cost, reorder level, safety/min/max stock, storage conditions, tax classification, status, audit history), wired to T007 (FR-021)
- [ ] T109 Real-time stock ledger recording opening stock, receipts, issues, transfers, reservations, releases, adjustments, returns, damages, expirations, cycle count variances, and closing stock, with full transaction metadata, wired to T008, T035's contract test (FR-022)
- [ ] T110 Stock reservation across 10 demand types (customer orders, internal requests, projects, events, subscriptions, service requests, maintenance activities, marketing campaigns, emergency requirements, executive priorities), wired to T028's `011`-boundary note (FR-023)
- [ ] T111 Stock rotation policies (FIFO, LIFO, FEFO, batch priority, serial number priority, quality grade priority, customer-specific allocation, project-specific allocation) (FR-024)
- [ ] T112 Stock adjustment governance (type, item, warehouse, location, quantity, reason, supporting evidence, requestor, approver, financial impact, audit record; multi-level approval mandatory for high-value adjustments) (FR-025)
- [ ] T113 Automatic replenishment calculation from current inventory, safety/minimum/maximum stock, lead time, purchase orders, sales orders, seasonal demand, marketing campaigns, historical sales, and AI forecast, wired to T030's `055`-boundary note (FR-054)
- [ ] T114 Replenishment strategies (Min-Max, Economic Order Quantity, Just-In-Time, Safety Stock, AI Forecast Based, Manual Planning, Vendor Managed Inventory) (FR-055)
- [ ] T115 AI purchase recommendations (suggested quantity, preferred supplier, estimated cost, expected delivery date, purchase priority, risk analysis, budget impact), wired to T030's `055`-boundary note (FR-056)
- [ ] T116 Inventory forecasts at 5 granularities (daily/weekly/monthly/quarterly/yearly) and a demand planning dashboard (forecast accuracy, stock coverage, inventory value, purchase pipeline, stockout/overstock risk, dead stock, inventory turnover, fill rate) (FR-057)
- [ ] T117 Automatic notifications (stock below minimum, overstock, critical stock, expiry alerts, damaged inventory, capacity full, transfer delay, asset failure, maintenance due, AI risk alerts) across 6 channels (mobile, web, email, SMS, push, optional WhatsApp) (FR-076)
- [ ] T118 Immutable, searchable, exportable audit logs for every inventory operation (user, date/time, device, IP, warehouse, action, before/after value, approval details, supporting documents), retained per organization retention policy (FR-077)
- [ ] T119 Integration with Procurement Management, Purchase Orders, Sales Management, CRM, ERP, Accounting, Finance, HRMS, Fleet Management, Manufacturing, POS, E-commerce, Vendor Portal, Customer Portal, Business Intelligence, AI Analytics Engine, Notification Service, Document Management, Workflow Engine, and API Gateway (FR-078)
- [ ] T120 Executive inventory dashboard (total warehouses, total inventory value, daily stock movement, inventory accuracy, warehouse utilization, top overstock/understock items, transfer performance, return rate, damage rate, expiry loss, AI health score, inventory turnover, procurement efficiency, inventory carrying cost, working capital utilization) (FR-079)
- [ ] T121 Future Automation roadmap scoping (Autonomous Mobile Robots, Robotic Picking, Automated Storage and Retrieval Systems, Computer Vision inventory counting, Drone-Based Cycle Counting, Predictive Equipment Maintenance, Autonomous Task Assignment, Self-Optimizing Warehouse Layouts, Warehouse Robotics Orchestration, Autonomous Warehouse Operations) — mandatory configurable/safety-controlled/continuously-monitored/human-oversight requirement when any such capability is implemented (FR-080, Constitution Article II)
- [ ] T122 [P] Outbound Workflow, Stock Control, Replenishment/Demand Planning, Alerts/Audit/Integrations & Executive Dashboard UI

---

## Phase 12: Polish — Final Validation

- [ ] T123 Resolve and document the 9 preserved NEEDS CLARIFICATION items from spec.md's own Assumptions/Edge Cases not already closed by `research.md`, including this plan's own §1 finding requiring the `011` Inventory Record reconciliation to actually be built
- [ ] T124 Final audit: cross-check every FR-001–FR-080 against an implementation or validation task; re-verify the `011`, `009`, `055`, `008`, `001`/`003`/`016` reuse decisions are respected, and confirm `057` remains explicitly flagged rather than silently assumed
- [ ] T125 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `011`'s marketplace order infrastructure, `009`'s general-ledger infrastructure, and `055`'s Purchase Order infrastructure, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2)**: US1 (Goods Receipt & Cycle Counting) is the foundational, trustworthy-stock-balance layer every downstream capability depends on and must land first; US2 (AI Warehouse Assistant) depends on US1's Stock Ledger and task data existing as the operational data it queries against.
- **P2 stories (US3, US4, US5, US6)**: US3 (Dynamic Slotting/Picking) depends on US1's Stock Ledger and location-occupancy data; US4 (Digital Twin) depends on US1–US3's operational data existing to simulate against; US5 (Inter-Warehouse Transfer) depends on US1's Stock Ledger for the source/destination deduction-and-credit mechanics; US6 (Returns/Damaged/Expired/Obsolete) depends on US1's Stock Ledger for inventory-status adjustments.
- **P3 stories (US7, US8)**: US7 (Asset Tracking) is independent of inventory stock transactions and can be built in parallel with any P1/P2 story once Foundational is complete; US8 (Workforce Task Assignment) depends on US1's Warehouse Task generation existing as the pool of assignable work.
- **Phase 11 (outbound/cross-docking/stock-control/replenishment/alerts/audit/roadmap remainder)** depends on Foundational, US1, and US5; should land alongside US6–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (cycle-count-variance-reconciliation-99pct-accuracy, real-time-stock-ledger-zero-double-counting-across-warehouses, ai-warehouse-recommendation-human-approval-workforce-gate) pass → US1 (Goods Receipt & Cycle Counting) → **STOP and VALIDATE** the trustworthy stock-balance foundation is sound → US2 (AI Warehouse Assistant) → **STOP and VALIDATE** the flagship AI capability returns explainable, auditable, human-gated recommendations → US3 (Slotting/Picking Optimization) + US5 (Inter-Warehouse Transfer) → US4 (Digital Twin) + US6 (Returns/Damaged/Expired/Obsolete) + Phase 11 (outbound/stock-control/replenishment/alerts remainder) → US7 (Asset Tracking) + US8 (Workforce Task Assignment) → Polish.
