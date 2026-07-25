import { Router } from 'express';
import { v1Router } from './v1';

/**
 * Top-level API router. Mounts each API version under its own path
 * segment (`/v1`, and future `/v2`, ...), giving CoachX a clean API
 * versioning strategy from day one.
 */
const router = Router();

router.use('/v1', v1Router);

export const apiRouter = router;
