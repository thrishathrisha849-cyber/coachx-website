import type { Request, Response } from 'express';
import { buildSuccessResponse, type HealthCheckResult } from '@coachx/shared';
import { config } from '../config';

const startedAt = Date.now();

// npm sets this automatically for any script run via `npm run`; falls back
// to '0.0.0' when invoked outside npm (e.g. directly via `node`).
const version = process.env.npm_package_version ?? '0.0.0';

/**
 * GET /api/v1/health
 *
 * Foundation-level liveness/readiness endpoint. Intentionally has no
 * business-domain dependencies — Phase 1 scope is infrastructure only.
 */
export function getHealth(_req: Request, res: Response): void {
  const result: HealthCheckResult = {
    status: 'ok',
    service: 'coachx-backend',
    version,
    environment: config.env,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(buildSuccessResponse(result));
}
