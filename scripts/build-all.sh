#!/usr/bin/env bash
# CoachX — builds every Node workspace in dependency order
# (shared first, since backend/frontend/admin depend on it).
# Usage: ./scripts/build-all.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Building @coachx/shared..."
npm run build:shared

echo "==> Building @coachx/backend..."
npm run build:backend

echo "==> Building @coachx/frontend..."
npm run build:frontend

echo "==> Building @coachx/admin..."
npm run build:admin

echo "==> All workspaces built successfully."
