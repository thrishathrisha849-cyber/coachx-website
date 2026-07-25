/**
 * Ad-hoc SEO validation runner (Phase 5 Part 2 §"VALIDATION": "duplicate
 * titles, duplicate canonicals, invalid slugs"). Run with:
 *
 *   npx tsx scripts/validate-seo.ts
 *
 * Requires a reachable database (DATABASE_URL) — reports the
 * environment limitation clearly rather than crashing uninformatively
 * when one isn't configured, consistent with this project's established
 * "connect gracefully, report don't crash" pattern.
 */
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from '../src/database/prisma-client';
import { validateSeoAcrossPublishedPages } from '../src/cms/seo-validation.service';

async function main(): Promise<void> {
  await connectDatabase();
  const health = await checkDatabaseHealth();

  if (!health.connected) {
    console.warn(`⚠ Skipping SEO validation: database not reachable (${health.message ?? 'unknown reason'}).`);
    process.exitCode = 0;
    return;
  }

  const issues = await validateSeoAcrossPublishedPages();

  if (issues.length === 0) {
    console.log('✅ No SEO issues found across published pages.');
  } else {
    console.error(`❌ ${issues.length} SEO issue(s) found:`);
    for (const issue of issues) {
      console.error(`  [${issue.type}] "${issue.value}" — pages: ${issue.pageIds.join(', ')}`);
    }
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('SEO validation failed to run:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
