// Augments Express's Request type with the correlation/request ID
// attached by `request-id.middleware.ts`, and (Phase 4) the authenticated
// identity attached by `authenticate.middleware.ts` — so every downstream
// handler and middleware can read `req.id`/`req.user` without an unsafe cast.
import 'express';
import type { AuthenticatedUser } from '../auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
