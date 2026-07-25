import type { Request, Response } from 'express';
import { buildSuccessResponse, buildErrorResponse, HttpStatus } from '@coachx/shared';
import { checkDatabaseHealth } from '../database/prisma-client';

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'skip' | 'fail';
  message?: string;
}

/**
 * GET /api/v1/ready
 *
 * Readiness = "can this instance safely receive traffic right now,"
 * distinct from `/health`'s liveness check. Verifies every *configured*
 * dependency (currently: the database, when `DATABASE_URL` is set) and
 * returns 503 if any required dependency is unavailable — the standard
 * signal a load balancer / Kubernetes readiness probe acts on.
 *
 * A dependency that is simply not configured (e.g. no DATABASE_URL in
 * this environment) is reported as "skip", not "fail" — Phase 2 has no
 * database models yet, so an unconfigured database does not make the
 * API itself unready to serve its current (non-database) surface.
 *
 * Never includes a connection string, credential, or stack trace in the
 * response — only a safe, human-readable status per check.
 */
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const checks: ReadinessCheck[] = [];

  const dbHealth = await checkDatabaseHealth();
  if (!dbHealth.configured) {
    checks.push({ name: 'database', status: 'skip', message: dbHealth.message });
  } else if (dbHealth.connected) {
    checks.push({ name: 'database', status: 'pass' });
  } else {
    checks.push({ name: 'database', status: 'fail', message: dbHealth.message });
  }

  const hasFailure = checks.some((check) => check.status === 'fail');

  if (hasFailure) {
    res
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .json(buildErrorResponse('NOT_READY', 'One or more dependencies are unavailable', { checks }));
    return;
  }

  res.status(HttpStatus.OK).json(buildSuccessResponse({ status: 'ready', checks }));
}
