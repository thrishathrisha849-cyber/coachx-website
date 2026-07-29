import { PrismaClient } from '@prisma/client';
import { seedRbac } from './rbac.seed';
import { seedCms } from './cms.seed';
import { seedMembershipTiers } from './membership-tier.seed';

/**
 * Seed entrypoint (`npm run db:seed` from the repo root).
 *
 * Phase 5 (Part 1) addition: seeds real CMS content (pages, navigation,
 * FAQ) — see `cms.seed.ts`. This is the only way pages get content in
 * this part (no admin editor UI).
 *
 * Phase 4 addition: seeds the canonical 12-role RBAC catalog (see
 * `rbac.seed.ts`) — the first real seed data in the project. Everything
 * else remains a no-op until the corresponding feature's models exist.
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

const prisma = new PrismaClient();

async function main(): Promise<void> {
  assertSafeToSeed();
  console.log('🌱 CoachX database seed runner starting...');
  await seedRbac(prisma);
  await seedCms(prisma);
  await seedMembershipTiers(prisma);
  console.log('✅ Seed run complete.');
}

main()
  .catch((error) => {
    console.error('❌ Seed run failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
