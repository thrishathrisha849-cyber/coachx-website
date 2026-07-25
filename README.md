# CoachX Enterprise Platform

CoachX (product codename **TBT One** / Tamil Business Tribe) is an
all-in-one Tamil-first business, learning, and community platform —
LMS, community, gamification, mentor marketplace, AI assistant, events,
marketplace, CRM, and an enterprise marketing/sales/ops suite, unified
under one member account.

> **Status: Phase 2 — Core Infrastructure.** The specification phase
> (73 features, `specs/001`–`specs/073`) is complete and has passed
> final enterprise audit. Phase 1 (project scaffold) and Phase 2 (typed
> config, structured logging with redaction, correlation IDs, global
> error handling, health/readiness endpoints, database connectivity
> foundation, security middleware, an infrastructure-level test suite)
> are both complete. No business features (auth, LMS, community, etc.)
> are implemented yet — see `docs/SETUP_GUIDE.md` §7 for the current,
> honest list of known limitations.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend (member web app) | React, TypeScript, Vite, Tailwind CSS |
| Admin portal | React, TypeScript, Vite, Tailwind CSS |
| Backend API | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Authentication | JWT + refresh tokens, RBAC (foundation only — not yet implemented) |
| File storage | Supabase Storage (foundation only — not yet implemented) |
| Mobile | Flutter |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

## Repository layout

```
coachx/
├── frontend/          Member-facing web app
├── backend/           REST API
├── admin/             Internal admin portal
├── mobile/             Flutter app
├── shared/              Shared TypeScript types/constants/utils
├── database/             Prisma schema, migrations, seeds
├── infrastructure/        Docker & deployment config
├── docs/                   Project documentation
├── scripts/                 Setup/build/dev shell scripts
├── .github/workflows/       CI pipeline
└── specs/                    Spec-Kit feature specifications (001–073)
```

See [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) for the full
breakdown of every package.

## Quick start

```bash
./scripts/setup.sh
docker compose -f infrastructure/docker-compose.dev.yml up -d   # Postgres
npm run dev                                                      # backend + frontend + admin
```

Then open:

- Backend health check: http://localhost:4000/api/v1/health
- Frontend: http://localhost:5173
- Admin portal: http://localhost:5174

Full instructions, troubleshooting, and the mobile app setup are in
[`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md).

## Documentation

- [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) — install, configure, and run every package
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) — what lives where, and why
- [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md) — architecture principles, coding standards, where new feature code goes
- [`specs/FEATURE-MANIFEST.md`](specs/FEATURE-MANIFEST.md) — the master map from source PRD to the 73 numbered features
- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — the 9 platform-wide architectural principles every feature is built against

## Project governance

This codebase is implemented feature-by-feature directly from
`specs/<NNN-feature-slug>/{spec.md,plan.md,tasks.md}`. Each feature's
`plan.md` records an Ownership & Dependency Analysis against every other
feature it touches — check it before adding a model, service, or API
that might already be owned elsewhere.

## License

Proprietary — all rights reserved.
