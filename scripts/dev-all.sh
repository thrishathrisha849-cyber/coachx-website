#!/usr/bin/env bash
# CoachX — starts backend, frontend, and admin dev servers concurrently.
# Requires Postgres to already be running (see docker-compose.dev.yml).
# Usage: ./scripts/dev-all.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npm run dev
