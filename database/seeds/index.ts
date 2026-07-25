import { PrismaClient } from '@prisma/client';

/**
 * Seed entrypoint (`npm run db:seed` from the repo root).
 *
 * Phase 1 scope: the runner and connection lifecycle only. Real seed
 * data is added per-feature once the corresponding Prisma models exist
 * — seeding a model that doesn't exist yet would be a fake
 * implementation, which this foundation phase explicitly avoids.
 *
 * Phase 3 addition — production safety guard: seed scripts are
 * destructive-adjacent by nature (real seed data will eventually
 * include upserts/deletes), so this refuses to run against a database
 * whose NODE_ENV is "production" or whose DATABASE_URL does not look
 * like a local/dev/test database, unless the operator explicitly
 * opts in with `SEED_ALLOW_PRODUCTION=true`. This guard exists now,
 * before any real seed data does, so no future contributor can add
 * destructive seed logic without already having this safety net in
 * place — see docs/database/SEEDING.md.
 */

function assertSafeToSeed(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const allowProduction = process.env.SEED_ALLOW_PRODUCTION === 'true';
  const databaseUrl = process.env.DATABASE_URL ?? '';

  if (nodeEnv === 'production' && !allowProduction) {
    console.error('❌ Refusing to seed: NODE_ENV=production.');
    console.error(
      '   If you really intend to seed a production database, re-run with SEED_ALLOW_PRODUCTION=true.',
    );
    process.exit(1);
  }

  const looksLikeProdHost =
    /rds\.amazonaws\.com|\.prod\.|production|supabase\.co/i.test(databaseUrl) && !allowProduction;

  if (looksLikeProdHost) {
    console.error('❌ Refusing to seed: DATABASE_URL looks like a production/managed host.');
    console.error('   If this is intentional, re-run with SEED_ALLOW_PRODUCTION=true.');
    process.exit(1);
  }
}

async function main(): Promise<void> {
  assertSafeToSeed();
  console.log('🌱 CoachX database seed runner starting...');
  console.log('No seed data defined yet — Phase 1 is foundation-only.');
  console.log('✅ Seed run complete (no-op).');
}

main()
  .catch((error) => {
    console.error('❌ Seed run failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
