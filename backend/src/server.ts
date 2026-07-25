import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './database/prisma-client';

async function bootstrap(): Promise<void> {
  // Non-fatal by design: connectDatabase() never throws (see
  // database/prisma-client.ts) — the API starts and serves its current
  // (non-database) surface even if the database is unreachable or not
  // yet configured. `/api/v1/ready` reflects the real connection state.
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(
      `🚀 CoachX backend listening on http://${config.server.host}:${config.server.port}${config.server.apiPrefix}/v1 [${config.env}]`,
    );
  });

  function shutdown(signal: string): void {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async (err) => {
      await disconnectDatabase();

      if (err) {
        logger.error('Error during shutdown', { error: err.message });
        process.exit(1);
      }
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error('Fatal error during startup', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
