import { PrismaClient } from '@prisma/client';

/**
 * Seed entrypoint (`npm run db:seed` from the repo root).
 *
 * Phase 1 scope: the runner and connection lifecycle only. Real seed
 * data is added per-feature once the corresponding Prisma models exist
 * — seeding a model that doesn't exist yet would be a fake
 * implementation, which this foundation phase explicitly avoids.
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
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
