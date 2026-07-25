#!/usr/bin/env bash
# CoachX — first-time environment setup.
# Usage: ./scripts/setup.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Installing Node workspace dependencies (frontend, backend, admin, shared, database)..."
npm install

echo "==> Copying .env.example files (skipped if .env already exists)..."
for pkg in backend frontend admin database; do
  example="$pkg/.env.example"
  target="$pkg/.env"
  if [ -f "$example" ] && [ ! -f "$target" ]; then
    cp "$example" "$target"
    echo "    created $target"
  fi
done

echo "==> Validating Prisma schema..."
npm run db:validate

echo "==> Generating Prisma client..."
npm run db:generate

if command -v flutter >/dev/null 2>&1; then
  echo "==> Installing Flutter dependencies..."
  (cd mobile && flutter pub get)
else
  echo "==> Flutter SDK not found on PATH — skipping mobile setup. Install from https://docs.flutter.dev/get-started/install"
fi

cat <<'EOF'

==================================================
Setup complete.

Next steps:
  1. Start Postgres:      docker compose -f infrastructure/docker-compose.dev.yml up -d
  2. Run migrations:      npm run db:migrate
  3. Start all apps:      npm run dev
     (or individually:    npm run dev:backend / dev:frontend / dev:admin)
  4. Run the mobile app:  cd mobile && flutter run
==================================================
EOF
