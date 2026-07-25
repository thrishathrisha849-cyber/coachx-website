import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { apiRouter } from './routes';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { getSitemap, getRobotsTxt } from './cms/seo.controller';

/**
 * Builds and configures the Express application. Kept separate from
 * `server.ts` so the app instance can be imported directly in tests
 * (e.g. with supertest) without binding a real port.
 */
export function createApp(): Application {
  const app = express();

  // --- Security & parsing middleware ---
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // --- Correlation ID (must run before anything that logs) ---
  app.use(requestIdMiddleware);

  // --- Rate limiting (applies to the whole API surface) ---
  app.use(
    config.server.apiPrefix,
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      limit: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // --- Observability ---
  app.use(requestLoggerMiddleware);

  // --- SEO — served at the domain root, not under the API prefix
  // (002 FR-092; docs/public-site/TRACEABILITY.md's architecture-
  // conflict note explains why this is the one part of SEO that IS
  // genuinely server-rendered in this Vite/CSR-SPA architecture) ---
  app.get('/sitemap.xml', getSitemap);
  app.get('/robots.txt', getRobotsTxt);

  // --- Versioned API routes ---
  app.use(config.server.apiPrefix, apiRouter);

  // --- 404 + centralized error handling (must be registered last) ---
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
