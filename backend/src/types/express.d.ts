// Augments Express's Request type with the correlation/request ID
// attached by `request-id.middleware.ts`, so every downstream handler
// and middleware can read `req.id` without an unsafe cast.
import 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export {};
