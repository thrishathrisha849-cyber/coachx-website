# Auditability Standard

Status: **implemented-now** — the `AuditEvent` model, its repository,
and its redaction guarantee all exist and are tested. What each future
feature actually _writes_ into it is **planned-later**, per-feature.

## 1. What `AuditEvent` is for

A single, shared, append-only, immutable table that every future
feature's audit-relevant actions write into — role changes, refunds,
content publishes, AI-copilot actions, administrative configuration
changes, and anything else that later specs require to be recorded.
Grounding:

- Constitution, Security & Compliance Baseline: _"All administrative,
  financial, and AI-copilot actions are captured in an immutable audit
  log."_
- Constitution Article IV, Historical Immutability.
- `specs/001-product-vision-governance/spec.md` FR-077: _"Every
  administrative configuration change MUST be recorded in an audit
  trail."_

## 2. Shape

See `database/prisma/schema.prisma` for the authoritative field list.
Summary:

| Field                         | Purpose                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `occurredAt`                  | When the action happened (defaults to write time; distinct field so a future backfill/replay path stays honest).        |
| `actorType` / `actorId`       | Who did it. `actorId` is a plain string, **not a foreign key** — see §4.                                                |
| `action`                      | Dotted, namespaced string, e.g. `"admin.membership_tier.updated"`, `"ai.recommendation.generated"`.                     |
| `resourceType` / `resourceId` | What it was performed on.                                                                                               |
| `correlationId` / `requestId` | Mirrors the backend's `X-Request-Id` (Phase 2) so a single HTTP request's audit events can be reconstructed end-to-end. |
| `sourceService`               | Which deployable produced the event — useful once more than one backend service exists.                                 |
| `beforeState` / `afterState`  | Redacted JSON snapshots.                                                                                                |
| `reason` / `metadata`         | Free-form context.                                                                                                      |

## 3. The redaction guarantee

`recordAuditEvent()` (`backend/src/database/audit-event.repository.ts`)
runs `beforeState`, `afterState`, and `metadata` through the same
`redact()` utility (`backend/src/utils/redact.ts`) that the Phase 2
logger already uses for every log line — callers never need to manually
scrub sensitive fields before recording an audit event. This is
verified by a dedicated integration test
(`backend/tests/integration/database.integration.test.ts`, "Audit event
repository" suite) that writes a `password` field into `beforeState` and
asserts the persisted row contains `[REDACTED]`, not the raw value.

As of Phase 3, `redact()` was extended (originally Phase 2 only redacted
by _key name_) to also scrub `scheme://user:password@host`-shaped
credential segments out of **any** string value, regardless of the key
it's stored under — closing a real gap where a raw database connection
string embedded in a driver error message (not just a field literally
named `password`) could otherwise reach a log line or an audit record.
See `backend/tests/unit/redact.unit.test.ts` for the specific
regression tests.

## 4. Why `actorId` is not a foreign key (yet)

Feature 003 (Authentication, User Identity, Onboarding) has not been
implemented — there is no `User` table to reference. Coupling
`AuditEvent` to a table that doesn't exist would either block this
phase entirely or require inventing a placeholder `User` model, both of
which this phase's instructions explicitly prohibit. `actorId` is
therefore an opaque `String?` today. See
`docs/database/SCHEMA_OWNERSHIP.md` §4 for the migration path once a
real `User` table exists.

## 5. What writes to `AuditEvent` today

**Nothing yet, in application code** — Phase 3 built the shared
mechanism, not a consumer. The first real writer will be whichever
feature (per its own spec) first needs to record an audit-relevant
action; likely candidates per existing spec citations are Feature 001's
admin configuration changes (FR-077) and Feature 003's authentication
events, once each is implemented.

## 6. Read path

`findAuditEvents(filter, limit = 50)` — intentionally simple, no
pagination baked in yet (compose with `paginate()` from
`backend/src/database/pagination.ts` at the call site once a real
consumer/admin UI exists — out of scope for a "no business repositories"
phase).

## 7. Failure behavior

`recordAuditEvent()` never throws if the database is unavailable — it
logs a warning (`"Audit event dropped — database not connected"`) and
returns. An audit-logging failure must never be the reason a legitimate
request fails outright, though every call site's owning feature should
still monitor for these warnings in production (a dropped audit event is
a real compliance concern, just not one that should take down the
primary request).
