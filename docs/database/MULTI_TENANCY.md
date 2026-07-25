# Multi-Tenancy Strategy

Status: **decision gate — not implemented, deliberately.**

## 1. The decision

No `Tenant`/`Organization` model, no tenant-scoping column, and no
row-level-security policy exist anywhere in `database/prisma/schema.prisma`
as of Phase 3. This is not an oversight — it is a direct, cited
consequence of the platform's own current spec:

> `specs/001-product-vision-governance/spec.md`, line 364: _"This spec
> assumes a single-organization-per-account deployment model at MVP;
> multi-tenant 'white-label communities' and 'advanced API' are listed
> only under Phase 4 (Enterprise and Ecosystem, Sec 18) and are out of
> scope until that phase."_
>
> `specs/001-product-vision-governance/spec.md`, FR-081: _"System MUST
> gate Phase 4 (Enterprise and Ecosystem) capabilities — organization
> accounts, white-label communities, advanced API, partner marketplace,
> multilingual support, regional expansion, advanced recommendation
> engine — behind completion of Phase 3."_

Building a `Tenant` model, a `tenantId` column standard, or a
row-level-security policy now would be inventing structure ahead of an
explicitly deferred requirement — exactly what this phase's
instructions prohibit ("no invented placeholder models just to make
Prisma generate").

## 2. What this means for `AuditEvent` and `IdempotencyKey` today

Both shared models are implicitly single-tenant (there is no tenant
column to scope by, because there is exactly one tenant today). This is
consistent, not a gap: nothing else in the platform is tenant-scoped
either.

## 3. What the future migration will need to consider

When Phase 4 multi-tenancy is actually specified, the eventual owner of
`Tenant`/`Organization` (per §1's citation, part of that later phase's
own feature) will need to decide the tenancy model — the two standard
options, for reference when that decision is made:

- **Shared schema, `tenantId` column on every tenant-scoped table**
  (including, at that point, `AuditEvent` and `IdempotencyKey` — both
  would need a `tenantId` added and every existing row backfilled or
  assumed to belong to a single default tenant).
- **Schema-per-tenant or database-per-tenant** — heavier operationally,
  usually reserved for strict compliance/isolation requirements.

This document intentionally does not choose between them — that
decision belongs to whichever feature spec first requires
multi-tenancy, informed by its own actual requirements (data residency,
per-tenant scaling, compliance) rather than guessed here in advance.

## 4. Re-check trigger

Re-open this decision the moment any feature spec (Phase 4 or otherwise)
introduces a concrete multi-tenancy requirement — do not let this
document silently go stale once that happens.
